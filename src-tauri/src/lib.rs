use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use uuid::Uuid;

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
}

struct AppState {
    sources: Mutex<Vec<Source>>,
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
        println!("📄 从本地文件内容解析");
        let content = url.strip_prefix("FILE_CONTENT:").unwrap();
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

    let source = Source {
        id: Uuid::new_v4().to_string(),
        name: name.clone(),
        url: url.clone(),
        channels,
    };

    let mut sources = state.sources.lock().unwrap();
    sources.push(source);
    println!("✅ 订阅源 '{}' 添加成功！当前总数: {}", name, sources.len());
    println!("========================================");

    Ok(())
}

#[tauri::command]
fn delete_source(source_id: String, state: State<AppState>) -> Result<(), String> {
    let mut sources = state.sources.lock().unwrap();
    sources.retain(|s| s.id != source_id);
    Ok(())
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
                    channels.push(Channel {
                        name: if name.is_empty() { "未命名频道".to_string() } else { name },
                        url: next_line.to_string(),
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
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState {
            sources: Mutex::new(Vec::new()),
        })
        .invoke_handler(tauri::generate_handler![
            get_sources,
            add_source,
            delete_source
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
