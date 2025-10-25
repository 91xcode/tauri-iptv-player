use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{Manager, State};
use uuid::Uuid;
use std::collections::HashMap;
use std::sync::Arc;
use std::fs;
use std::path::PathBuf;
use axum::{
    extract::Query,
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    routing::get,
    Router,
};
use tower_http::cors::CorsLayer;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Channel {
    name: String,
    url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    logo: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    group: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Source {
    id: String,
    name: String,
    url: String,
    channels: Vec<Channel>,
    #[serde(skip_serializing_if = "Option::is_none")]
    file_path: Option<String>, // 本地文件的原始路径
}

struct AppState {
    sources: Mutex<Vec<Source>>,
    proxy_mappings: Arc<Mutex<HashMap<String, String>>>,
    data_dir: PathBuf,
}

impl AppState {
    fn save_sources(&self) -> Result<(), String> {
        let sources = self.sources.lock().unwrap();
        let data_file = self.data_dir.join("sources.json");

        let json = serde_json::to_string_pretty(&*sources)
            .map_err(|e| format!("序列化失败: {}", e))?;

        fs::write(&data_file, json)
            .map_err(|e| format!("写入文件失败: {}", e))?;

        println!("💾 数据已保存到: {:?}", data_file);
        Ok(())
    }

    fn load_sources(&self) -> Result<Vec<Source>, String> {
        let data_file = self.data_dir.join("sources.json");

        if !data_file.exists() {
            println!("📂 数据文件不存在，返回空列表");
            return Ok(Vec::new());
        }

        let json = fs::read_to_string(&data_file)
            .map_err(|e| format!("读取文件失败: {}", e))?;

        let sources: Vec<Source> = serde_json::from_str(&json)
            .map_err(|e| format!("解析 JSON 失败: {}", e))?;

        println!("📂 从文件加载了 {} 个订阅源", sources.len());
        Ok(sources)
    }
}

#[tauri::command]
fn get_sources(state: State<AppState>) -> Result<Vec<Source>, String> {
    let sources = state.sources.lock().unwrap();
    println!("📋 get_sources 被调用，返回 {} 个订阅源", sources.len());
    Ok(sources.clone())
}

#[tauri::command]
async fn add_source(name: String, url: String, state: State<'_, AppState>) -> Result<(), String> {
    println!("========================================");
    println!("🚀 add_source 被调用");
    println!("名称: {}", name);
    println!("URL: {}", url);
    println!("========================================");

    // 检查订阅源类型
    let channels = if url == "TEST_DATA" {
        println!("📦 使用内置测试数据");
        // 返回内置的测试频道
        vec![
            Channel {
                name: "测试视频 1 - Demo".to_string(),
                url: "https://upyun.luckly-mjw.cn/Assets/media-source/example/media/index.m3u8".to_string(),
                logo: Some("https://picsum.photos/100/100?1".to_string()),
                group: Some("测试频道".to_string()),
            },
            Channel {
                name: "测试视频 2 - Big Buck Bunny".to_string(),
                url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8".to_string(),
                logo: Some("https://picsum.photos/100/100?2".to_string()),
                group: Some("测试频道".to_string()),
            },
            Channel {
                name: "测试视频 3 - Tears of Steel".to_string(),
                url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8".to_string(),
                logo: Some("https://picsum.photos/100/100?3".to_string()),
                group: Some("测试频道".to_string()),
            },
        ]
    } else if url.starts_with("FILE_CONTENT:") {
        // 从文件内容解析
        // 格式: FILE_CONTENT:<file_path>:<content>
        println!("📄 从本地文件内容解析");
        let without_prefix = url.strip_prefix("FILE_CONTENT:").unwrap();

        // 尝试分离文件路径和内容
        let (file_path, content) = if let Some(second_colon_pos) = without_prefix.find(':') {
            let path = &without_prefix[..second_colon_pos];
            let content = &without_prefix[second_colon_pos + 1..];
            (Some(path.to_string()), content)
        } else {
            (None, without_prefix)
        };

        if let Some(path) = &file_path {
            println!("📁 文件路径: {}", path);
        }

        let result = parse_m3u_content(content, &url);
        match &result {
            Ok(chs) => println!("✅ 成功解析到 {} 个频道", chs.len()),
            Err(e) => println!("❌ 解析失败: {}", e),
        }
        result?
    } else {
        // 从网络 URL 下载并解析
        println!("🌐 从 URL 下载并解析: {}", url);
        let result = fetch_and_parse_m3u(&url).await;
        match &result {
            Ok(chs) => println!("✅ 成功解析到 {} 个频道", chs.len()),
            Err(e) => println!("❌ 解析失败: {}", e),
        }
        result?
    };

    println!("📺 频道列表: {:?}", channels.iter().map(|c| &c.name).collect::<Vec<_>>());

    // 从 URL 中提取文件路径（如果是本地文件）
    let file_path = if url.starts_with("FILE_CONTENT:") {
        let without_prefix = url.strip_prefix("FILE_CONTENT:").unwrap();
        if let Some(second_colon_pos) = without_prefix.find(':') {
            Some(without_prefix[..second_colon_pos].to_string())
        } else {
            None
        }
    } else {
        None
    };

    let source = Source {
        id: Uuid::new_v4().to_string(),
        name: name.clone(),
        url: url.clone(),
        channels,
        file_path,
    };

    {
        let mut sources = state.sources.lock().unwrap();
        sources.push(source);
        println!("✅ 订阅源 '{}' 添加成功！当前总数: {}", name, sources.len());
    }

    // 保存到文件
    state.save_sources()?;
    println!("========================================");

    Ok(())
}

#[tauri::command]
fn delete_source(#[allow(non_snake_case)] sourceId: String, state: State<AppState>) -> Result<(), String> {
    println!("========================================");
    println!("🗑️ delete_source 被调用");
    println!("要删除的 ID: {}", sourceId);

    let deleted = {
        let mut sources = state.sources.lock().unwrap();
        let before_count = sources.len();
        sources.retain(|s| s.id != sourceId);
        let after_count = sources.len();

        println!("删除前数量: {}", before_count);
        println!("删除后数量: {}", after_count);
        println!("是否删除成功: {}", before_count > after_count);

        before_count > after_count
    };

    if !deleted {
        println!("⚠️ 未找到要删除的订阅源！");
        println!("========================================");
        return Err(format!("未找到 ID 为 {} 的订阅源", sourceId));
    }

    // 保存到文件
    println!("💾 开始保存到文件...");
    state.save_sources()?;
    println!("✅ 删除操作完成");
    println!("========================================");
    Ok(())
}

#[tauri::command]
async fn update_source(#[allow(non_snake_case)] sourceId: String, name: String, url: String, state: State<'_, AppState>) -> Result<(), String> {
    println!("========================================");
    println!("🔄 update_source 被调用");
    println!("订阅源 ID: {}", sourceId);
    println!("新名称: {}", name);
    println!("新 URL: {}", url);
    println!("========================================");

    // 重新解析频道
    let channels = if url == "TEST_DATA" {
        println!("📦 使用内置测试数据");
        vec![
            Channel {
                name: "测试视频 1 - Demo".to_string(),
                url: "https://upyun.luckly-mjw.cn/Assets/media-source/example/media/index.m3u8".to_string(),
                logo: Some("https://picsum.photos/100/100?1".to_string()),
                group: Some("测试频道".to_string()),
            },
            Channel {
                name: "测试视频 2 - Big Buck Bunny".to_string(),
                url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8".to_string(),
                logo: Some("https://picsum.photos/100/100?2".to_string()),
                group: Some("测试频道".to_string()),
            },
            Channel {
                name: "测试视频 3 - Tears of Steel".to_string(),
                url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8".to_string(),
                logo: Some("https://picsum.photos/100/100?3".to_string()),
                group: Some("测试频道".to_string()),
            },
        ]
    } else if url.starts_with("FILE_CONTENT:") {
        // 从文件内容解析
        // 格式: FILE_CONTENT:<file_path>:<content>
        println!("📄 从本地文件内容解析");
        let without_prefix = url.strip_prefix("FILE_CONTENT:").unwrap();

        // 尝试分离文件路径和内容
        let (file_path, content) = if let Some(second_colon_pos) = without_prefix.find(':') {
            let path = &without_prefix[..second_colon_pos];
            let content = &without_prefix[second_colon_pos + 1..];
            (Some(path.to_string()), content)
        } else {
            (None, without_prefix)
        };

        if let Some(path) = &file_path {
            println!("📁 文件路径: {}", path);
        }

        let result = parse_m3u_content(content, &url);
        match &result {
            Ok(chs) => println!("✅ 成功解析到 {} 个频道", chs.len()),
            Err(e) => println!("❌ 解析失败: {}", e),
        }
        result?
    } else {
        println!("🌐 从 URL 下载并解析: {}", url);
        let result = fetch_and_parse_m3u(&url).await;
        match &result {
            Ok(chs) => println!("✅ 成功解析到 {} 个频道", chs.len()),
            Err(e) => println!("❌ 解析失败: {}", e),
        }
        result?
    };

    println!("📺 频道列表: {:?}", channels.iter().map(|c| &c.name).collect::<Vec<_>>());

    // 从 URL 中提取文件路径（如果是本地文件）
    let file_path = if url.starts_with("FILE_CONTENT:") {
        let without_prefix = url.strip_prefix("FILE_CONTENT:").unwrap();
        if let Some(second_colon_pos) = without_prefix.find(':') {
            Some(without_prefix[..second_colon_pos].to_string())
        } else {
            None
        }
    } else {
        None
    };

    // 更新订阅源
    {
        let mut sources = state.sources.lock().unwrap();
        if let Some(source) = sources.iter_mut().find(|s| s.id == sourceId) {
            source.name = name.clone();
            source.url = url.clone();
            source.channels = channels;
            source.file_path = file_path;
            println!("✅ 订阅源 '{}' 更新成功！", name);
        } else {
            return Err(format!("未找到订阅源: {}", sourceId));
        }
    }

    // 保存到文件
    state.save_sources()?;
    println!("========================================");

    Ok(())
}

/// 为 IPv6 URL 创建代理映射
#[tauri::command]
fn create_proxy_url(original_url: String, state: State<AppState>) -> Result<String, String> {
    // 检查是否是 IPv6 URL
    if !original_url.contains('[') || !original_url.contains(']') {
        // 不是 IPv6，直接返回原 URL
        return Ok(original_url);
    }

    println!("🔄 为 IPv6 URL 创建代理: {}", original_url);

    // 生成代理 ID
    let proxy_id = Uuid::new_v4().to_string();
    let proxy_url = format!("tauri://proxy/{}", proxy_id);

    // 存储映射
    let mut mappings = state.proxy_mappings.lock().unwrap();
    mappings.insert(proxy_id, original_url.clone());

    println!("✅ 代理 URL: {}", proxy_url);
    Ok(proxy_url)
}

/// 通过代理获取流数据
#[tauri::command]
async fn proxy_stream(proxy_id: String, state: State<'_, AppState>) -> Result<Vec<u8>, String> {
    // 获取原始 URL
    let original_url = {
        let mappings = state.proxy_mappings.lock().unwrap();
        mappings.get(&proxy_id).cloned()
            .ok_or_else(|| "代理 ID 不存在".to_string())?
    };

    println!("🌐 代理请求: {} -> {}", proxy_id, original_url);

    // 通过 reqwest 获取数据（支持 IPv6）
    let response = reqwest::get(&original_url)
        .await
        .map_err(|e| format!("代理请求失败: {}", e))?;

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("读取数据失败: {}", e))?;

    Ok(bytes.to_vec())
}

/// 简单获取 URL 内容（支持 IPv6）
#[tauri::command]
async fn fetch_url_content(url: String) -> Result<String, String> {
    println!("🌐 获取 URL 内容: {}", url);

    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| format!("创建客户端失败: {}", e))?;

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| {
            println!("❌ 请求失败: {}", e);
            format!("请求失败: {}", e)
        })?;

    let content = response
        .text()
        .await
        .map_err(|e| {
            println!("❌ 读取内容失败: {}", e);
            format!("读取内容失败: {}", e)
        })?;

    println!("✅ 成功获取内容，大小: {} 字节", content.len());
    Ok(content)
}

/// 获取并处理 IPv6 m3u8 内容，将相对 URL 转换为绝对 URL
#[tauri::command]
async fn fetch_and_proxy_m3u8(url: String) -> Result<String, String> {
    println!("🌐 获取并处理 m3u8: {}", url);

    // ⭐ 获取原始内容 - 添加完整请求头
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(10))
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("创建客户端失败: {}", e))?;

    let response = client
        .get(&url)
        .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .header("Accept", "*/*")
        .header("Accept-Language", "zh-CN,zh;q=0.9")
        .header("Cache-Control", "no-cache")
        .header("Pragma", "no-cache")
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    let content = response
        .text()
        .await
        .map_err(|e| format!("读取内容失败: {}", e))?;

    println!("📄 原始 m3u8 大小: {} 字节", content.len());

    // 解析 base URL
    let base_url = if let Some(pos) = url.rfind('/') {
        &url[..pos + 1]
    } else {
        &url
    };

    println!("🔗 Base URL: {}", base_url);

    // 处理 m3u8 内容，将相对路径转换为绝对路径
    let mut processed_lines = Vec::new();
    for line in content.lines() {
        let trimmed = line.trim();

        // 如果是注释或空行，直接保留
        if trimmed.starts_with('#') || trimmed.is_empty() {
            processed_lines.push(line.to_string());
        } else {
            // 这是一个 URL 行
            let absolute_url = if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
                // 已经是绝对 URL
                trimmed.to_string()
            } else {
                // 相对 URL，转换为绝对 URL
                format!("{}{}", base_url, trimmed)
            };
            println!("🔄 转换 URL: {} -> {}", trimmed, absolute_url);
            processed_lines.push(absolute_url);
        }
    }

    let processed_content = processed_lines.join("\n");
    println!("✅ 处理完成，新大小: {} 字节", processed_content.len());

    Ok(processed_content)
}

async fn fetch_and_parse_m3u(url: &str) -> Result<Vec<Channel>, String> {
    // 下载播放列表
    let response = reqwest::get(url)
        .await
        .map_err(|e| format!("下载失败: {}", e))?;

    let content = response
        .text()
        .await
        .map_err(|e| format!("读取内容失败: {}", e))?;

    // 解析 M3U 格式
    parse_m3u_content(&content, url)
}

fn parse_m3u_content(content: &str, url: &str) -> Result<Vec<Channel>, String> {
    let mut channels = Vec::new();
    let lines: Vec<&str> = content.lines().collect();

    // 检查是否是 HLS 视频流（而不是频道列表）
    let is_hls_stream = content.contains("#EXT-X-VERSION") ||
                        content.contains("#EXT-X-TARGETDURATION") ||
                        (content.contains("#EXTINF:") && content.contains(".ts"));

    if is_hls_stream {
        // 这是一个视频流 M3U8，将其作为单个频道返回
        return Ok(vec![Channel {
            name: "直播视频".to_string(),
            url: url.to_string(),
            logo: None,
            group: Some("视频流".to_string()),
        }]);
    }

    let mut i = 0;
    while i < lines.len() {
        let line = lines[i].trim();

        // 解析 #EXTINF 行
        if line.starts_with("#EXTINF:") {
            let mut name = String::new();
            let mut logo: Option<String> = None;
            let mut group: Option<String> = None;

            // 提取属性
            if let Some(info_part) = line.strip_prefix("#EXTINF:") {
                // 解析 tvg-logo
                if let Some(logo_start) = info_part.find("tvg-logo=\"") {
                    let logo_start = logo_start + 10;
                    if let Some(logo_end) = info_part[logo_start..].find('"') {
                        logo = Some(info_part[logo_start..logo_start + logo_end].to_string());
                    }
                }

                // 解析 group-title
                if let Some(group_start) = info_part.find("group-title=\"") {
                    let group_start = group_start + 13;
                    if let Some(group_end) = info_part[group_start..].find('"') {
                        group = Some(info_part[group_start..group_start + group_end].to_string());
                    }
                }

                // 提取频道名称（逗号后面的部分）
                if let Some(comma_pos) = info_part.find(',') {
                    name = info_part[comma_pos + 1..].trim().to_string();
                }
            }

            // 下一行应该是 URL
            if i + 1 < lines.len() {
                let next_line = lines[i + 1].trim();
                if !next_line.is_empty() && !next_line.starts_with('#') {
                    let channel_url = next_line.to_string();

                    // 检测并记录 IPv6 URL
                    if channel_url.contains('[') && channel_url.contains(']') {
                        println!("🌐 检测到 IPv6 URL: {}", channel_url);
                    }

                    channels.push(Channel {
                        name: if name.is_empty() { "未命名频道".to_string() } else { name },
                        url: channel_url,
                        logo,
                        group,
                    });
                }
                i += 2;
                continue;
            }
        }

        i += 1;
    }

    if channels.is_empty() {
        Err("未找到有效的频道信息".to_string())
    } else {
        Ok(channels)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 在后台启动代理服务器
    tauri::async_runtime::spawn(async {
        if let Err(e) = start_proxy_server().await {
            eprintln!("❌ 代理服务器启动失败: {}", e);
        }
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .register_asynchronous_uri_scheme_protocol("stream", |_app, request, responder| {
            tauri::async_runtime::spawn(async move {
                match handle_stream_protocol(&request).await {
                    Ok(response) => responder.respond(response),
                    Err(e) => {
                        eprintln!("Protocol error: {}", e);
                        let error_response = tauri::http::Response::builder()
                            .status(500)
                            .body(format!("Error: {}", e).into_bytes())
                            .unwrap();
                        responder.respond(error_response);
                    }
                }
            });
        })
        .setup(|app| {
            // 获取数据目录
            let data_dir = app.path().app_data_dir()
                .expect("无法获取数据目录");

            // 确保数据目录存在
            fs::create_dir_all(&data_dir)
                .expect("无法创建数据目录");

            println!("📁 数据目录: {:?}", data_dir);

            // 创建 AppState
            let app_state = AppState {
                sources: Mutex::new(Vec::new()),
                proxy_mappings: Arc::new(Mutex::new(HashMap::new())),
                data_dir: data_dir.clone(),
            };

            // 加载保存的数据
            if let Ok(sources) = app_state.load_sources() {
                let mut state_sources = app_state.sources.lock().unwrap();
                *state_sources = sources;
                println!("✅ 已加载 {} 个订阅源", state_sources.len());
            }

            app.manage(app_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_sources,
            add_source,
            update_source,
            delete_source,
            create_proxy_url,
            proxy_stream,
            fetch_url_content,
            fetch_and_proxy_m3u8
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// HTTP 代理服务器处理函数
#[derive(Deserialize)]
struct ProxyParams {
    url: String,
}

async fn proxy_handler(Query(params): Query<ProxyParams>) -> Result<Response, StatusCode> {
    println!("🌐 代理请求: {}", params.url);

    // ⭐ 完全复制 x-iptv-player 的请求头策略
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(10))
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| {
            eprintln!("❌ 创建客户端失败: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    // ⭐ 添加完整的浏览器请求头（模拟 x-iptv-player）
    let response = client
        .get(&params.url)
        .header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .header("Accept", "*/*")
        .header("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
        .header("Accept-Encoding", "gzip, deflate")
        .header("Origin", "https://www.example.com")
        .header("Referer", "https://www.example.com/")
        .header("Connection", "keep-alive")
        .header("Cache-Control", "no-cache")
        .header("Pragma", "no-cache")
        .send()
        .await
        .map_err(|e| {
            eprintln!("❌ 请求失败: {}", e);
            StatusCode::BAD_GATEWAY
        })?;

    // ⭐ 智能 Content-Type 检测（完全复制 x-iptv-player）
    let content_type = if let Some(ct) = response.headers().get(header::CONTENT_TYPE) {
        ct.to_str().unwrap_or("application/octet-stream").to_string()
    } else {
        // 根据 URL 推断 Content-Type
        if params.url.ends_with(".m3u8") {
            "application/vnd.apple.mpegurl".to_string()
        } else if params.url.ends_with(".ts") {
            "video/mp2t".to_string()
        } else if params.url.ends_with(".mp4") {
            "video/mp4".to_string()
        } else {
            "application/octet-stream".to_string()
        }
    };

    let bytes = response
        .bytes()
        .await
        .map_err(|e| {
            eprintln!("❌ 读取数据失败: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    // ⭐ 关键修复：如果是 m3u8 文件，重写内容中的 URL
    let final_bytes = if params.url.contains(".m3u8") {
        match String::from_utf8(bytes.to_vec()) {
            Ok(content) => {
                println!("📄 处理 m3u8 内容，原始大小: {} 字节", content.len());

                // 解析原始 URL 的 base
                let base_url = if let Some(pos) = params.url.rfind('/') {
                    &params.url[..pos + 1]
                } else {
                    &params.url
                };
                println!("🔗 Base URL: {}", base_url);

                // 重写每一行
                let processed_lines: Vec<String> = content.lines().map(|line| {
                    let trimmed = line.trim();

                    // 如果是注释或空行，保持不变
                    if trimmed.starts_with('#') || trimmed.is_empty() {
                        return line.to_string();
                    }

                    // 处理 URL 行
                    let absolute_url = if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
                        // 已经是绝对 URL
                        trimmed.to_string()
                    } else {
                        // 相对 URL，转换为绝对 URL
                        format!("{}{}", base_url, trimmed)
                    };

                    // ⭐ 关键：如果是 IPv6 URL，通过代理
                    if absolute_url.contains('[') && absolute_url.contains(']') {
                        let encoded = urlencoding::encode(&absolute_url);
                        let proxied = format!("http://127.0.0.1:18080/proxy?url={}", encoded);
                        println!("🔄 重写 URL: {} -> 代理", absolute_url.chars().take(60).collect::<String>());
                        proxied
                    } else {
                        absolute_url
                    }
                }).collect();

                let processed_content = processed_lines.join("\n");
                println!("✅ m3u8 处理完成，新大小: {} 字节", processed_content.len());
                processed_content.into_bytes()
            }
            Err(_) => {
                println!("⚠️ m3u8 内容不是有效的 UTF-8，返回原始字节");
                bytes.to_vec()
            }
        }
    } else {
        bytes.to_vec()
    };

    println!("✅ 代理成功: {} 字节, 类型: {}", final_bytes.len(), content_type);

    // ⭐ 添加 CORS 头（完全复制 x-iptv-player）
    Ok((
        StatusCode::OK,
        [
            (header::CONTENT_TYPE, content_type.as_str()),
            (header::ACCESS_CONTROL_ALLOW_ORIGIN, "*"),
            (header::ACCESS_CONTROL_ALLOW_METHODS, "GET, HEAD, OPTIONS"),
            (header::ACCESS_CONTROL_ALLOW_HEADERS, "*"),
            (header::CACHE_CONTROL, "no-cache"),
        ],
        final_bytes,
    )
        .into_response())
}

// 启动本地代理服务器
async fn start_proxy_server() -> Result<(), Box<dyn std::error::Error>> {
    let app = Router::new()
        .route("/proxy", get(proxy_handler))
        .layer(CorsLayer::permissive());

    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], 18080));
    println!("🚀 启动代理服务器: http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn handle_stream_protocol(request: &tauri::http::Request<Vec<u8>>) -> Result<tauri::http::Response<Vec<u8>>, Box<dyn std::error::Error>> {
    let url_str = request.uri().to_string();
    println!("🌐 Stream protocol request: {}", url_str);

    // 从 stream://xxx 中提取实际 URL
    // 格式: stream://encode(actual_url)
    let actual_url = url_str
        .strip_prefix("stream://")
        .ok_or("Invalid stream URL")?;

    // URL decode
    let decoded_url = urlencoding::decode(actual_url)?;

    println!("📡 Fetching: {}", decoded_url);

    // 使用 reqwest 获取数据（支持 IPv6）
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()?;

    let response = client
        .get(decoded_url.as_ref())
        .send()
        .await?;

    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("application/octet-stream")
        .to_string();

    let bytes = response.bytes().await?;

    println!("✅ Fetched {} bytes, type: {}", bytes.len(), content_type);

    tauri::http::Response::builder()
        .status(200)
        .header("Content-Type", content_type)
        .header("Access-Control-Allow-Origin", "*")
        .body(bytes.to_vec())
        .map_err(|e| e.into())
}
