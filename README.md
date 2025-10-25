# IPTV Player

一个基于 Tauri + React 的跨平台 IPTV 播放器

## ✨ 特性

- 📺 支持 M3U/M3U8 播放列表
- 🎬 支持 HLS 直播流播放
- 📱 现代化的用户界面
- 🔄 订阅源管理
- 📋 频道列表展示
- 🎯 轻量级打包（DMG 仅 3-10MB）
- ⚡ 高性能、低内存占用

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
- **HLS.js** - HLS 流播放

### 后端
- **Rust** - 系统语言
- **Tauri 2** - 桌面应用框架
- **Reqwest** - HTTP 客户端

## 📦 项目结构

```
iptv-player/
├── src/                    # React 前端代码
│   ├── components/         # React 组件
│   │   ├── VideoPlayer.tsx # 视频播放器
│   │   ├── ChannelList.tsx # 频道列表
│   │   └── AddSource.tsx   # 添加订阅源
│   ├── App.tsx            # 主应用
│   └── App.css            # 样式
├── src-tauri/             # Rust 后端代码
│   ├── src/
│   │   └── lib.rs        # Tauri 命令处理
│   ├── Cargo.toml        # Rust 依赖
│   └── tauri.conf.json   # Tauri 配置
└── package.json          # Node.js 依赖
```

## 🎯 功能特性

### 已实现
- ✅ M3U/M3U8 播放列表解析
- ✅ HLS 视频流播放
- ✅ 订阅源管理（添加/删除）
- ✅ 频道列表展示
- ✅ 视频播放控制
- ✅ macOS DMG 打包

### 计划中
- 🔲 频道收藏功能
- 🔲 播放历史记录
- 🔲 频道搜索
- 🔲 频道分类
- 🔲 画质选择
- 🔲 字幕支持
- 🔲 数据持久化（本地存储）

## 🔧 故障排除

### HLS 播放问题

如果视频无法播放:
1. 检查 M3U8 地址是否有效
2. 确认网络连接正常
3. 查看控制台错误信息

### 打包问题

如果打包失败:
1. 确保 Rust 环境正确安装: `rustc --version`
2. 更新 Tauri CLI: `cargo install tauri-cli --force`
3. 清理缓存: `cargo clean && npm run tauri build`

## 📝 License

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Enjoy! 📺**