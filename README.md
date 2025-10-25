# IPTV Player

一个基于 Tauri + React 的跨平台 IPTV 播放器，专为稳定播放直播流而优化。

## ✨ 特性

- 📺 支持 M3U/M3U8 播放列表
- 🎬 支持 HLS 直播流播放（完全兼容 IPv6）
- 🌐 内置 HTTP 代理服务器（`http://127.0.0.1:18080`）
- 🔄 智能 URL 重写（自动处理 IPv6 和相对路径）
- 📱 现代化的用户界面
- 🔄 订阅源管理
- 📋 频道列表展示
- 🎯 轻量级打包（DMG 仅 3-10MB）
- ⚡ 高性能、低内存占用
- 🛡️ 稳定的长时间播放（支持超过 1 小时的连续直播）

## 🚀 快速开始

### 开发环境

#### 前置要求

1. **Node.js** (v16+)
2. **Rust** (安装命令: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
3. **系统依赖**:
   - macOS: 无需额外依赖
   - Linux: `sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget file libssl-dev libayatana-appindicator3-dev librsvg2-dev`
   - Windows: 安装 WebView2

#### 启动开发服务器

```bash
cd iptv-player
npm install
npm run tauri dev
```

### 生产打包

#### 打包 macOS DMG

```bash
npm run tauri build
```

打包完成后，DMG 文件在: `src-tauri/target/release/bundle/dmg/`

#### 打包其他平台

- **Windows**: 自动生成 `.msi` 和 `.exe`
- **Linux**: 自动生成 `.deb` 和 `.AppImage`

## 📖 使用说明

### 1. 添加订阅源

点击左侧边栏的 **➕** 按钮，输入:
- **订阅源名称**: 例如 "CCTV 频道"
- **订阅源地址**: M3U/M3U8 播放列表 URL

或点击 **"使用测试地址"** 按钮使用内置测试源。

### 2. 选择频道

- 点击左侧订阅源查看频道列表
- 点击频道开始播放

### 3. 测试地址

```
https://upyun.luckly-mjw.cn/Assets/media-source/example/media/index.m3u8
```

## 🛠️ 技术栈

### 前端
- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **HLS.js 1.5+** - HLS 流播放器
  - 优化的超时配置（60 秒片段加载超时）
  - 智能错误过滤和自动恢复
  - 大容量缓冲区（30-60 秒）
  - 指数退避重试机制

### 后端
- **Rust** - 系统语言
- **Tauri 2** - 桌面应用框架
- **Axum 0.7** - HTTP 代理服务器框架
- **Reqwest 0.12** - HTTP 客户端（支持 IPv6）
- **Tower-HTTP** - CORS 中间件

## 📦 项目结构

```
iptv-player/
├── src/                          # React 前端代码
│   ├── components/               # React 组件
│   │   ├── VideoPlayer.tsx       # 视频播放器 ⭐ 核心
│   │   │                         # - HLS.js 配置优化
│   │   │                         # - IPv6 URL 处理
│   │   │                         # - 智能错误恢复
│   │   ├── ChannelList.tsx       # 频道列表
│   │   ├── SourceList.tsx        # 订阅源列表
│   │   └── AddSource.tsx         # 添加订阅源对话框
│   ├── App.tsx                   # 主应用
│   └── App.css                   # 样式
├── src-tauri/                    # Rust 后端代码
│   ├── src/
│   │   ├── lib.rs                # Tauri 核心逻辑 ⭐ 核心
│   │   │                         # - HTTP 代理服务器（Axum）
│   │   │                         # - m3u8 URL 重写
│   │   │                         # - M3U 解析器
│   │   │                         # - 数据持久化
│   │   └── main.rs               # 程序入口
│   ├── Cargo.toml                # Rust 依赖
│   │                             # - axum (HTTP 服务器)
│   │                             # - reqwest (HTTP 客户端)
│   │                             # - tower-http (CORS)
│   └── tauri.conf.json           # Tauri 配置
├── package.json                  # Node.js 依赖
├── 修复总结.md                   # 技术修复记录
└── README.md                     # 本文档
```

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      前端 (React + HLS.js)                   │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  VideoPlayer   │  │ ChannelList  │  │  SourceList     │  │
│  │  - HLS.js 配置 │  │ - 频道展示   │  │  - 订阅源管理   │  │
│  │  - 错误处理    │  │ - 搜索过滤   │  │  - 添加/删除    │  │
│  └────────────────┘  └──────────────┘  └─────────────────┘  │
│           │                    │                  │           │
│           └────────────────────┼──────────────────┘           │
│                                │                              │
│                    Tauri Bridge (IPC)                         │
│                                │                              │
└────────────────────────────────┼──────────────────────────────┘
                                 │
┌────────────────────────────────▼──────────────────────────────┐
│                    后端 (Rust + Tauri)                        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │          Axum HTTP 代理服务器 (127.0.0.1:18080)         │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │  1. 接收代理请求                                  │   │  │
│  │  │  2. 通过 Reqwest 获取原始 m3u8/ts               │   │  │
│  │  │  3. 如果是 m3u8，重写所有 URL：                 │   │  │
│  │  │     - 相对路径 → 绝对路径                       │   │  │
│  │  │     - IPv6 URL → 代理 URL                       │   │  │
│  │  │  4. 添加 CORS 头和浏览器 User-Agent            │   │  │
│  │  │  5. 返回处理后的内容                            │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Tauri 命令处理器                           │  │
│  │  - get_sources: 获取订阅源列表                         │  │
│  │  - add_source: 添加新订阅源 (解析 M3U)                 │  │
│  │  - delete_source: 删除订阅源                          │  │
│  │  - fetch_url_content: 获取远程内容                    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              数据持久化 (JSON)                          │  │
│  │  路径: ~/Library/Application Support/com.sai.iptv-player │
│  │  文件: sources.json                                     │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                                 │
                                 │ Reqwest (支持 IPv6)
                                 ▼
                      ┌──────────────────────┐
                      │   IPTV 直播源服务器   │
                      │  (IPv4 / IPv6)       │
                      └──────────────────────┘
```

## 🆚 与 x-iptv-player 技术对比

本项目参考了 **x-iptv-player** (Electron) 的最佳实践，并用 Tauri 重新实现：

| 特性 | x-iptv-player (Electron) | 本项目 (Tauri) | 说明 |
|------|-------------------------|----------------|------|
| **桌面框架** | Electron | Tauri 2 | Tauri 打包更小 (3MB vs 100MB+) |
| **后端语言** | Node.js | Rust | Rust 性能更高，内存占用更低 |
| **HTTP 代理** | Node.js `http.createServer` | Axum (Rust) | 两者都在 `127.0.0.1` 固定端口 |
| **代理端口** | 动态端口 | 18080 固定端口 | Tauri 版使用固定端口避免配置 |
| **m3u8 重写** | ✅ 在代理服务器中 | ✅ 在代理服务器中 | 完全一致的实现逻辑 |
| **HLS.js 配置** | 标准配置 | 优化配置 | 超时增加、重试增加、buffer 增加 |
| **错误处理** | 基础处理 | 智能过滤 + 指数退避 | Tauri 版更健壮 |
| **Session 头注入** | ✅ Electron session API | ⚠️ 通过代理注入 | 两种不同的实现方式 |
| **播放监控** | ❌ 无 | ❌ 无（已移除） | 都让 HLS.js 自己处理 |
| **IPv6 支持** | ✅ 完美支持 | ✅ 完美支持 | 完全一致 |
| **打包体积** | ~100MB+ | ~3-10MB | Tauri 优势明显 |
| **内存占用** | ~150-300MB | ~50-100MB | Rust 优势 |

**核心借鉴点：**
1. ✅ **代理服务器模式** - 完全相同的架构
2. ✅ **m3u8 URL 重写** - 完全相同的算法
3. ✅ **简洁的播放逻辑** - 不干预 HLS.js，让其自动处理
4. ✅ **请求头注入** - User-Agent、Referer、CORS 等

**改进点：**
1. 🚀 **性能更优** - Rust 后端 + Tauri 框架
2. 📦 **体积更小** - 3MB vs 100MB+
3. 🛡️ **更健壮的错误处理** - 智能过滤 + 指数退避重试
4. ⚡ **更大的缓冲区** - 30-60 秒 buffer

## 🎯 功能特性

### 已实现
- ✅ M3U/M3U8 播放列表解析
- ✅ HLS 视频流播放（完全支持直播流）
- ✅ IPv6 URL 完美支持（自动代理）
- ✅ 本地 HTTP 代理服务器（Axum）
- ✅ 智能 m3u8 URL 重写
- ✅ 订阅源管理（添加/删除）
- ✅ 频道列表展示
- ✅ 视频播放控制
- ✅ macOS DMG 打包
- ✅ 长时间稳定播放（超过 1 小时无中断）
- ✅ 智能错误恢复（自动重试和降级）
- ✅ 数据持久化（本地 JSON 存储）

### 计划中
- 🔲 频道收藏功能
- 🔲 播放历史记录
- 🔲 频道搜索
- 🔲 频道分类
- 🔲 画质选择
- 🔲 字幕支持

## 🎥 核心技术实现

### 1. IPv6 URL 处理

项目完美支持 IPv6 直播流（如 `http://[2409:8087:8:21::18]:6610/...`）：

**工作流程：**
```
1. 前端检测 IPv6 URL
   ↓
2. 通过本地代理访问: http://127.0.0.1:18080/proxy?url=原始URL
   ↓
3. Rust 代理服务器获取 m3u8 内容
   ↓
4. 智能重写 m3u8 中的所有 URL（相对路径 → 绝对路径 → 代理 URL）
   ↓
5. 返回处理后的 m3u8 给 HLS.js
   ↓
6. HLS.js 解析并请求 .ts 片段（也通过代理）
   ↓
7. ✅ 持续稳定播放
```

**关键代码位置：**
- 前端 URL 处理: `src/components/VideoPlayer.tsx` 第 61-75 行
- 代理服务器: `src-tauri/src/lib.rs` 第 490-580 行
- URL 重写逻辑: `src-tauri/src/lib.rs` 第 545-575 行

### 2. HLS.js 配置优化

完全参考 **x-iptv-player** 项目的最佳实践：

```typescript
{
  // 超时配置（大幅增加）
  fragLoadingTimeOut: 60000,        // 60 秒
  manifestLoadingTimeOut: 30000,    // 30 秒
  levelLoadingTimeOut: 30000,       // 30 秒

  // 重试配置（增加次数）
  manifestLoadingMaxRetry: 6,       // 6 次
  levelLoadingMaxRetry: 6,          // 6 次
  fragLoadingMaxRetry: 8,           // 8 次

  // Buffer 配置（大容量）
  maxBufferLength: 30,              // 30 秒前向缓冲
  maxMaxBufferLength: 60,           // 60 秒最大缓冲
  backBufferLength: 30,             // 30 秒后向缓冲
  maxBufferSize: 120 * 1000 * 1000, // 120 MB

  // 稳定性优先
  lowLatencyMode: false,            // 关闭低延迟模式
  enableSoftwareAES: true,          // 启用软件 AES 解密
}
```

### 3. 智能错误处理

**错误过滤机制：**
- 忽略非致命错误（`fragLoadTimeOut`、`fragLoadError` 等）
- 让 HLS.js 的内置重试机制优先工作
- 只在真正致命错误时人工干预

**指数退避重试：**
```
1s → 2s → 4s → 8s（最多 3 次）
```

**错误恢复策略：**
- 网络错误 → `hls.startLoad()`
- 媒体错误 → `hls.recoverMediaError()`
- 其他错误 → 重新加载

### 4. 代理服务器实现

**技术选型：**
- 使用 **Axum** 框架（高性能、异步）
- 端口：`127.0.0.1:18080`（固定端口，避免冲突）
- 支持 CORS 跨域请求

**请求头注入：**
```rust
.header("User-Agent", "Mozilla/5.0...")
.header("Accept", "*/*")
.header("Referer", "https://www.example.com/")
.header("Cache-Control", "no-cache")
```

**m3u8 URL 重写算法：**
1. 解析 base URL
2. 遍历每一行
3. 相对路径 → 绝对路径
4. IPv6 URL → 代理 URL（`http://127.0.0.1:18080/proxy?url=...`）
5. 返回处理后的内容

## 🔧 故障排除

### 1. 播放 1 分钟后停止

**已修复！** 之前的问题原因：
- ❌ 使用 Blob URL（静态，不会更新）
- ❌ 播放进度监控干预（每 5 秒检查并重新加载）

**解决方案：**
- ✅ 直接使用代理 URL（动态，HLS.js 会定时刷新）
- ✅ 移除所有播放监控逻辑（让 HLS.js 自己处理）
- ✅ 参考 x-iptv-player 的简洁实现

### 2. IPv6 URL 无法播放

**症状：** 播放按钮无反应或立即报错

**解决步骤：**
1. 检查代理服务器是否启动：
   ```bash
   lsof -i:18080  # 应该看到 tauri-app 进程
   ```
2. 查看控制台日志，应该看到：
   ```
   🌐 检测到 IPv6 m3u8，直接通过代理访问
   🔄 代理 URL: http://127.0.0.1:18080/proxy?url=...
   ```
3. 检查 Rust 日志，应该看到：
   ```
   🚀 启动代理服务器: http://127.0.0.1:18080
   🌐 代理请求: http://[2409:8087:...]
   📄 处理 m3u8 内容，原始大小: 1520 字节
   🔄 重写 URL: http://[2409:8087:...] -> 代理
   ✅ 代理成功: 7153024 字节, 类型: video/MP2T
   ```

### 3. HLS 播放问题

如果视频无法播放:
1. 检查 M3U8 地址是否有效（可以在浏览器中打开测试）
2. 确认网络连接正常
3. 查看浏览器控制台错误信息
4. 查看 Rust 后端日志（终端输出）
5. 尝试使用测试 URL：
   ```
   https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
   ```

### 4. 打包问题

如果打包失败:
1. 确保 Rust 环境正确安装: `rustc --version`
2. 更新 Tauri CLI: `cargo install tauri-cli --force`
3. 清理缓存: `cargo clean && npm run tauri build`
4. 检查依赖: `cargo check`

### 5. 端口冲突（1420 或 18080）

**Vite 端口冲突（1420）：**
```bash
lsof -ti:1420 | xargs kill -9
npm run tauri dev
```

**代理服务器端口冲突（18080）：**
```bash
lsof -ti:18080 | xargs kill -9
# 修改 src-tauri/src/lib.rs 中的端口号
```

## 👨‍💻 开发者指南

### 修改代理服务器端口

如果 18080 端口被占用，修改 `src-tauri/src/lib.rs`：

```rust
// 第 599 行附近
let addr = std::net::SocketAddr::from(([127, 0, 0, 1], 18080)); // 改为其他端口
```

同时修改前端 `src/components/VideoPlayer.tsx`：

```typescript
// 第 73 行附近
processedUrl = `http://127.0.0.1:18080/proxy?url=${encodedUrl}`; // 改为对应端口
```

### 调试技巧

**1. 查看代理服务器日志：**
```bash
# 启动 dev 模式，日志会直接输出到终端
npm run tauri dev

# 应该看到：
# 🚀 启动代理服务器: http://127.0.0.1:18080
# 🌐 代理请求: http://[2409:8087:...]
# 📄 处理 m3u8 内容，原始大小: 1520 字节
# ✅ 代理成功: 7153024 字节, 类型: video/MP2T
```

**2. 查看浏览器控制台：**
```
右键 → 检查 → Console 标签

应该看到：
🌐 检测到 IPv6 m3u8，直接通过代理访问
🔄 代理 URL: http://127.0.0.1:18080/proxy?url=...
========== HLS播放器初始化开始 ==========
HLS清单解析完成: {...}
```

**3. 测试代理服务器：**
```bash
# 确认代理服务器在运行
lsof -i:18080

# 手动测试代理
curl "http://127.0.0.1:18080/proxy?url=https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
```

### 添加新的 Tauri 命令

1. 在 `src-tauri/src/lib.rs` 中定义命令：
   ```rust
   #[tauri::command]
   async fn my_command(param: String) -> Result<String, String> {
       Ok(format!("Hello {}", param))
   }
   ```

2. 注册命令：
   ```rust
   .invoke_handler(tauri::generate_handler![
       get_sources,
       add_source,
       my_command  // 添加这里
   ])
   ```

3. 前端调用：
   ```typescript
   import { invoke } from "@tauri-apps/api/core";

   const result = await invoke<string>("my_command", { param: "World" });
   ```

### 性能优化建议

**1. HLS.js 参数调优：**
- 网络好：减少 `maxBufferLength` 到 10-15 秒
- 网络差：增加超时时间和重试次数
- 低配设备：减少 `maxBufferSize`

**2. 代理服务器优化：**
- 增加超时时间：`timeout(std::time::Duration::from_secs(60))`
- 启用连接池：`pool_max_idle_per_host(10)`
- 启用 HTTP/2：`http2_prior_knowledge()`

**3. 前端优化：**
- 使用虚拟列表（大频道列表）
- 懒加载频道 logo
- 缓存订阅源数据

## 🐛 已知问题

### 1. ~~播放 1 分钟后自动停止~~ ✅ 已修复
**原因：** 使用了静态 Blob URL，m3u8 不会更新
**解决：** 改用动态代理 URL，让 HLS.js 定时刷新

### 2. ~~IPv6 URL 无法播放~~ ✅ 已修复
**原因：** .ts 片段 URL 未通过代理
**解决：** 在代理服务器中重写 m3u8 内容，将所有 URL 转为代理 URL

### 3. macOS 打包后首次运行提示"已损坏"
**原因：** macOS Gatekeeper 安全检查
**解决：**
```bash
# 移除扩展属性
xattr -cr /Applications/IPTV\ Player.app

# 或在系统设置中允许
系统设置 → 隐私与安全性 → 仍要打开
```

## 📚 参考资料

- [Tauri 官方文档](https://tauri.app/)
- [HLS.js GitHub](https://github.com/video-dev/hls.js)
- [Axum 文档](https://docs.rs/axum/)
- [Reqwest 文档](https://docs.rs/reqwest/)
- [x-iptv-player 项目](https://github.com/xxx/x-iptv-player) - 本项目的灵感来源

## 📝 更新日志

### v1.0.0 (2025-01-25)
- ✅ 初始版本发布
- ✅ 支持 M3U/M3U8 播放列表
- ✅ HLS 直播流播放
- ✅ macOS DMG 打包

### v1.1.0 (2025-01-25)
- ✅ 完美支持 IPv6 URL
- ✅ 内置 HTTP 代理服务器（Axum）
- ✅ 智能 m3u8 URL 重写
- ✅ 修复播放 1 分钟后停止的问题
- ✅ 优化 HLS.js 配置（超时、重试、buffer）
- ✅ 智能错误过滤和自动恢复
- ✅ 数据持久化

## 📝 License

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- **Rust**: 使用 `cargo fmt` 格式化代码
- **TypeScript**: 使用 Prettier 格式化
- **提交信息**: 使用清晰的中文或英文描述

## 💬 联系方式

- Issue Tracker: [GitHub Issues](https://github.com/yourusername/iptv-player/issues)
- 邮箱: your.email@example.com

## 🙏 致谢

- [Tauri](https://tauri.app/) - 优秀的桌面应用框架
- [HLS.js](https://github.com/video-dev/hls.js) - 强大的 HLS 播放器
- [x-iptv-player](https://github.com/xxx/x-iptv-player) - 技术参考和灵感来源
- [Axum](https://github.com/tokio-rs/axum) - 高性能 HTTP 框架

---

**Enjoy! 📺**

如有问题，欢迎提 Issue 或查看 [故障排除](#🔧-故障排除) 部分。