# IPTV Player

一个基于 Tauri + React 的**全平台** IPTV 播放器，专为稳定播放直播流而优化。

## 🌍 支持平台

| 平台 | 架构 | 安装包格式 | 状态 |
|------|------|-----------|------|
| **macOS** | Apple Silicon (M1/M2/M3) | `.dmg` | ✅ 完全支持 |
| **macOS** | Intel (x86_64) | `.dmg` | ✅ 完全支持 |
| **Windows** | x64 | `.msi`, `.exe` | ✅ 完全支持 |
| **Linux** | x64 | `.deb`, `.AppImage` | ✅ 完全支持 |

## ✨ 特性

- 📺 支持 M3U/M3U8 播放列表
- 🎬 支持 HLS 直播流播放（完全兼容 IPv6）
- 🌐 内置 HTTP 代理服务器（`http://127.0.0.1:18080`）
- 🔄 智能 URL 重写（自动处理 IPv6、相对路径、混合内容）
- 📱 现代化的用户界面
- 🔄 订阅源管理
- 📋 频道列表展示
- 🎯 轻量级打包（3-10MB）
- ⚡ 高性能、低内存占用
- 🛡️ 稳定的长时间播放（支持超过 1 小时的连续直播）
- 🌍 **全平台支持**（macOS, Windows, Linux）

## 📥 下载安装

### 从 GitHub Releases 下载

访问 [Releases 页面](https://github.com/91xcode/tauri-iptv-player/releases) 下载最新版本：

**macOS**:
- Apple Silicon (M1/M2/M3): `IPTV-Player-v*-macOS-Apple-Silicon.dmg`
- Intel: `IPTV-Player-v*-macOS-Intel.dmg`
- 安装: 双击 `.dmg`，拖拽到 Applications

**Windows**:
- `IPTV-Player-v*-Windows-x64.msi` (推荐)
- `IPTV-Player-v*-Windows-x64-setup.exe` (NSIS 安装器)
- 安装: 双击运行安装程序

**Linux**:
- Debian/Ubuntu: `IPTV-Player-v*-Linux-x64.deb`
  ```bash
  sudo dpkg -i IPTV-Player-v*-Linux-x64.deb
  ```
- 通用格式: `IPTV-Player-v*-Linux-x64.AppImage`
  ```bash
  chmod +x IPTV-Player-v*-Linux-x64.AppImage
  ./IPTV-Player-v*-Linux-x64.AppImage
  ```

---

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

#### 📦 打包前准备

1. **清理旧的构建产物**
   ```bash
   cd /Users/sai/good_tool/palyer/iptv-player
   rm -rf src-tauri/target/release/bundle
   ```

2. **确认依赖已安装**
   ```bash
   npm install
   ```

3. **修复 TypeScript 错误（如需要）**
   ```bash
   npm run build  # 测试前端构建
   ```

#### 🔨 开始打包

**方法 1：直接打包（推荐）**
```bash
npm run tauri build
```

**方法 2：后台打包（长时间任务）**
```bash
npm run tauri build > /tmp/tauri-build.log 2>&1 &

# 查看构建进度
tail -f /tmp/tauri-build.log

# 或使用提供的监控脚本
./check-build.sh
```

#### 📍 打包产物位置

打包成功后，文件位于：

**macOS**
```
src-tauri/target/release/bundle/macos/
├── IPTV Player.app                    # 应用程序包
└── IPTV Player_0.1.0_aarch64.dmg     # DMG 安装包（推荐分发）
```

**Windows** (在 Windows 系统上构建)
```
src-tauri/target/release/bundle/msi/
└── IPTV Player_0.1.0_x64_en-US.msi   # MSI 安装包

src-tauri/target/release/bundle/nsis/
└── IPTV Player_0.1.0_x64-setup.exe   # NSIS 安装包
```

**Linux** (在 Linux 系统上构建)
```
src-tauri/target/release/bundle/deb/
└── iptv-player_0.1.0_amd64.deb       # Debian 包

src-tauri/target/release/bundle/appimage/
└── iptv-player_0.1.0_amd64.AppImage  # AppImage 包
```

#### 📦 整理发布包

项目提供了自动整理脚本，会将安装包复制到 `releases/` 目录：

```bash
# 脚本会自动创建 releases 目录并重命名文件
mkdir -p releases
cp "src-tauri/target/release/bundle/macos/IPTV Player_0.1.0_aarch64.dmg" \
   "releases/IPTV-Player-v0.1.0-macOS-Apple-Silicon.dmg"
```

重命名后的文件：
- macOS (Apple Silicon): `IPTV-Player-v0.1.0-macOS-Apple-Silicon.dmg`
- macOS (Intel): `IPTV-Player-v0.1.0-macOS-Intel.dmg`
- Windows: `IPTV-Player-v0.1.0-Windows-x64.msi`
- Linux: `IPTV-Player-v0.1.0-Linux-x64.deb`

#### 🚀 分发安装包

**分享给其他用户：**
1. 上传到云盘（百度网盘、阿里云盘等）
2. 发布到 GitHub Releases
3. 托管到自己的服务器

**用户安装步骤（macOS）：**
1. 下载 `.dmg` 文件
2. 双击打开 DMG
3. 拖拽 "IPTV Player.app" 到 "Applications" 文件夹
4. 首次运行：右键点击 → "打开" → 在弹窗中再次点击 "打开"

#### ⚙️ 构建脚本说明

项目包含以下构建相关脚本：

**1. `check-build.sh` - 构建监控脚本**
```bash
#!/bin/bash
# 自动监控构建进度，显示实时日志
# 构建完成后自动查找生成的安装包

chmod +x check-build.sh
./check-build.sh
```

**功能：**
- ⏳ 实时显示编译进度
- 📦 自动检测打包状态
- 📁 构建完成后列出所有生成的安装包
- 📄 显示最后 20 行构建日志

**2. 构建时间参考**

| 平台 | 首次构建 | 增量构建 | 说明 |
|------|---------|---------|------|
| macOS (M1/M2/M3) | 5-10 分钟 | 2-5 分钟 | Rust 依赖编译较慢 |
| Windows | 8-15 分钟 | 3-6 分钟 | 需要额外编译 WebView2 |
| Linux | 6-12 分钟 | 2-5 分钟 | 取决于系统配置 |

**3. 构建优化建议**

**加速首次构建：**
```bash
# 使用国内 Rust 镜像
export RUSTUP_DIST_SERVER="https://rsproxy.cn"
export RUSTUP_UPDATE_ROOT="https://rsproxy.cn/rustup"

# 或编辑 ~/.cargo/config.toml
[source.crates-io]
replace-with = 'tuna'

[source.tuna]
registry = "https://mirrors.tuna.tsinghua.edu.cn/git/crates.io-index.git"
```

**增量构建（跳过依赖重新编译）：**
```bash
# 只有代码修改时使用
npm run tauri build -- --no-bundle  # 仅编译，不打包
```

#### 🐛 打包常见问题

**1. TypeScript 编译错误**
```bash
# 错误: error TS6133: 'xxx' is declared but its value is never read
# 解决: 添加 @ts-ignore 注释或移除未使用的导入

# 示例修复
// @ts-ignore - 保留用于未来功能
import { invoke } from "@tauri-apps/api/core";
```

**2. Rust 编译错误**
```bash
# 错误: missing field 'xxx' in initializer
# 解决: 检查结构体定义，确保所有字段都已初始化

# 清理并重新构建
cargo clean
npm run tauri build
```

**3. 打包体积过大**
```bash
# 优化构建（生产模式已默认启用）
# Cargo.toml 中配置：
[profile.release]
opt-level = "z"     # 优化体积
lto = true          # 链接时优化
codegen-units = 1   # 单个编译单元
strip = true        # 移除符号信息
```

**4. 端口冲突导致打包失败**
```bash
# 检查端口占用
lsof -i:1420   # Vite 开发服务器
lsof -i:18080  # 代理服务器

# 杀死占用进程
lsof -ti:1420 | xargs kill -9
lsof -ti:18080 | xargs kill -9
```

**5. macOS 打包后无法打开**
```bash
# 移除隔离属性
xattr -cr "/Applications/IPTV Player.app"

# 或在系统设置中允许
系统设置 → 隐私与安全性 → 仍要打开
```

#### 📊 版本号管理

**修改版本号：**

1. **修改 package.json**
   ```json
   {
     "version": "0.2.0"
   }
   ```

2. **修改 src-tauri/Cargo.toml**
   ```toml
   [package]
   version = "0.2.0"
   ```

3. **修改 src-tauri/tauri.conf.json**
   ```json
   {
     "version": "0.2.0"
   }
   ```

**重新打包：**
```bash
npm run tauri build
```

生成的文件名会自动包含新版本号：
- `IPTV Player_0.2.0_aarch64.dmg`

#### 🎯 CI/CD 自动化打包

如果使用 GitHub Actions，可以参考以下配置：

```yaml
name: Build Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        platform: [macos-latest, ubuntu-latest, windows-latest]

    runs-on: ${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Install dependencies
        run: npm install

      - name: Build Tauri app
        run: npm run tauri build

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.platform }}-build
          path: src-tauri/target/release/bundle/
```

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

## 📊 日志系统

### 概述

项目集成了生产级日志系统，使用 Rust 的 `tracing` 框架实现：
- ✅ 文件日志（每日滚动）
- ✅ 控制台日志（带颜色）
- ✅ 结构化日志记录
- ✅ 函数调用自动追踪
- ✅ 多级别日志（ERROR, WARN, INFO, DEBUG, TRACE）

### 日志文件位置

**macOS:**
```bash
~/Library/Logs/com.sai.iptv-player/iptv-player.log.YYYY-MM-DD
```

**注意：** 日志文件名会自动添加日期后缀（如 `iptv-player.log.2025-10-25`），这是 `tracing-appender` 的日期滚动策略，**这是正常行为**。每天午夜会自动创建新的日志文件。

**Windows:**
```bash
%APPDATA%\com.sai.iptv-player\logs\iptv-player.log.YYYY-MM-DD
```

**Linux:**
```bash
~/.local/share/com.sai.iptv-player/logs/iptv-player.log.YYYY-MM-DD
```

### 快速使用

**1. 实时查看日志（推荐）：**
```bash
# macOS/Linux - 使用通配符自动匹配最新日志
tail -f ~/Library/Logs/com.sai.iptv-player/iptv-player.log.*

# 查看所有日志
cat ~/Library/Logs/com.sai.iptv-player/*.log.*

# 搜索错误
grep -E "ERROR|WARN" ~/Library/Logs/com.sai.iptv-player/*.log.*
```

**快捷别名（推荐）：**
```bash
# 添加到 ~/.zshrc 或 ~/.bashrc
echo 'alias iptv-log="tail -f ~/Library/Logs/com.sai.iptv-player/iptv-player.log.*"' >> ~/.zshrc
echo 'alias iptv-errors="grep -E \"ERROR|WARN\" ~/Library/Logs/com.sai.iptv-player/*.log.*"' >> ~/.zshrc
source ~/.zshrc

# 使用
iptv-log        # 实时查看日志
iptv-errors     # 查看错误日志
```

**2. 设置日志级别：**
```bash
# 默认 INFO 级别
npm run tauri dev

# DEBUG 级别（查看详细信息）
export RUST_LOG=debug
npm run tauri dev

# TRACE 级别（最详细）
export RUST_LOG=trace
npm run tauri dev
```

**3. 从终端启动已安装应用（查看日志）：**
```bash
# macOS
/Applications/IPTV\ Player.app/Contents/MacOS/IPTV\ Player

# 设置日志级别
export RUST_LOG=debug
/Applications/IPTV\ Player.app/Contents/MacOS/IPTV\ Player
```

### 日志示例

**应用启动（实际日志）：**
```
2025-10-25T19:59:07Z  INFO 日志系统初始化完成
2025-10-25T19:59:07Z  INFO 日志文件位置: "/Users/sai/Library/Logs/com.sai.iptv-player/iptv-player.log"
2025-10-25T19:59:07Z  INFO ========================================
2025-10-25T19:59:07Z  INFO IPTV Player 启动
2025-10-25T19:59:07Z  INFO 版本: 0.1.0
2025-10-25T19:59:07Z  INFO ========================================
2025-10-25T19:59:07Z  INFO 启动 HTTP 代理服务器: http://127.0.0.1:18080
2025-10-25T19:59:08Z  INFO 数据目录: "/Users/sai/Library/Application Support/com.sai.iptv-player"
2025-10-25T19:59:08Z  INFO 从文件加载了 3 个订阅源
2025-10-25T19:59:08Z  INFO 应用初始化完成
```

**添加订阅源：**
```
INFO 添加订阅源: 名称='CCTV', URL类型='网络地址'
INFO M3U 内容下载成功，大小: 12345 字节
INFO 成功解析 123 个频道
```

**HTTP 代理：**
```
DEBUG HTTP 代理请求
INFO HTTP 代理成功: 6789 字节
```

### 日志级别说明

| 级别 | 环境变量 | 用途 | 适用场景 |
|------|---------|------|---------|
| ERROR | `RUST_LOG=error` | 仅错误 | 生产环境 |
| WARN | `RUST_LOG=warn` | 警告+错误 | 生产环境 |
| INFO | `RUST_LOG=info` | 关键操作 | 默认/生产 |
| DEBUG | `RUST_LOG=debug` | 详细信息 | 开发/调试 |
| TRACE | `RUST_LOG=trace` | 完整追踪 | 深度调试 |

### 调试技巧

**调试订阅源添加失败：**
```bash
export RUST_LOG=debug
tail -f ~/Library/Logs/com.sai.iptv-player/iptv-player.log.* | grep "订阅源\|M3U\|解析"
```

**调试播放失败：**
```bash
tail -f ~/Library/Logs/com.sai.iptv-player/iptv-player.log.* | grep "代理\|proxy"
```

**调试 IPv6 问题：**
```bash
tail -f ~/Library/Logs/com.sai.iptv-player/iptv-player.log.* | grep "IPv6\|ipv6"
```

### 清理日志

```bash
# 删除 7 天前的日志
find ~/Library/Logs/com.sai.iptv-player -name "iptv-player.log.*" -mtime +7 -delete

# 删除所有历史日志（保留当前）
rm ~/Library/Logs/com.sai.iptv-player/iptv-player.log.*
```

### 完整文档

详细使用指南请查看 **[LOGGING.md](./LOGGING.md)**，包含：
- 各平台日志位置详解
- 高级过滤和搜索技巧
- 环境变量配置方法
- 问题报告指南
- 常见问题解答

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