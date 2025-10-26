# 跨平台支持分析

## 📊 Tauri 支持的平台概览

### 桌面端

| 平台 | 架构 | 支持状态 | 安装包格式 |
|------|------|----------|-----------|
| **macOS** | x86_64 | ✅ 完全支持 | `.dmg`, `.app` |
| **macOS** | aarch64 (Apple Silicon) | ✅ 完全支持 | `.dmg`, `.app` |
| **Windows** | x86_64 | ✅ 完全支持 | `.msi`, `.exe` |
| **Linux** | x86_64 | ✅ 完全支持 | `.deb`, `.AppImage`, `.rpm` |

---

## 🔍 当前项目兼容性分析

### 1️⃣ 前端代码兼容性

**技术栈**：
- React 19.1.0 ✅ 全平台兼容
- Vite 7.0.4 ✅ 全平台兼容
- TypeScript 5.8.3 ✅ 全平台兼容
- HLS.js 1.6.13 ✅ 桌面端完全兼容

### 2️⃣ 后端 Rust 代码兼容性

**核心依赖**：
- `tauri = "2"` ✅ 全平台
- `reqwest` ✅ 全平台
- `tokio` ✅ 全平台
- `axum` (HTTP 服务器) ✅ 桌面端，❌ 移动端

**关键架构：HTTP 代理服务器**

```rust
// 当前实现
async fn start_proxy_server() {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:18080")
        .await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

**平台兼容性**：

| 平台 | HTTP 服务器 | 说明 |
|------|-------------|------|
| macOS | ✅ 正常 | 无限制 |
| Windows | ✅ 正常 | 无限制 |
| Linux | ✅ 正常 | 无限制 |
| iOS | ❌ **不支持** | 沙盒限制本地服务器 |
| Android | ❌ **不支持** | 沙盒限制本地服务器 |

---

## 🚀 各平台打包可行性

### ✅ Windows (x86_64) - 完全可行

**可行性**: ⭐⭐⭐⭐⭐ (95%)

**需要修改**：

1. **配置文件** (`tauri.conf.json`):
```json
"bundle": {
  "targets": ["msi", "nsis"],
  "windows": {
    "certificateThumbprint": null,
    "digestAlgorithm": "sha256"
  }
}
```

2. **GitHub Actions**:
```yaml
build-windows:
  runs-on: windows-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - uses: dtolnay/rust-toolchain@stable
      with:
        targets: x86_64-pc-windows-msvc
    - run: npm install
    - run: npm run tauri build
```

**输出格式**:
- `.msi` (Windows Installer)
- `.exe` (NSIS 安装包)

**工作量**: 0.5 天

---

### ✅ Linux (x86_64) - 完全可行

**可行性**: ⭐⭐⭐⭐⭐ (95%)

**需要修改**：

1. **配置文件**:
```json
"bundle": {
  "targets": ["deb", "appimage"],
  "linux": {
    "deb": {
      "depends": []
    }
  }
}
```

2. **GitHub Actions**:
```yaml
build-linux:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Install dependencies
      run: |
        sudo apt-get update
        sudo apt-get install -y \
          libwebkit2gtk-4.1-dev \
          build-essential \
          curl \
          wget \
          file \
          libssl-dev \
          libayatana-appindicator3-dev \
          librsvg2-dev
    - uses: actions/setup-node@v4
    - uses: dtolnay/rust-toolchain@stable
    - run: npm install
    - run: npm run tauri build
```

**输出格式**:
- `.deb` (Debian/Ubuntu)
- `.AppImage` (通用格式)
- `.rpm` (RedHat/Fedora)

**工作量**: 0.5 天

---

### ⚠️ iOS - 需要重大重构

**可行性**: ⭐⭐ (40%)

**核心问题**：
1. ❌ **HTTP 代理服务器无法工作** - iOS 沙盒严格限制
2. ⚠️ HLS.js 不需要 - iOS Safari 原生支持
3. ⚠️ UI 需要移动端响应式适配

**必须重构**：
```rust
// 移除 HTTP 服务器，改用 Tauri Command
#[tauri::command]
async fn proxy_request(url: String) -> Result<Vec<u8>, String> {
    let client = reqwest::Client::new();
    let response = client.get(&url).send().await?;
    Ok(response.bytes().await?.to_vec())
}
```

**工作量**: 2-3 天

---

### ⚠️ Android - 需要重大重构

**可行性**: ⭐⭐ (40%)

**核心问题**：同 iOS

**额外问题**：
- Android 权限配置复杂
- WebView 版本兼容性
- 不同厂商的系统差异

**工作量**: 2-3 天

---

## 📊 平台优先级建议

| 平台 | 可行性 | 工作量 | 优先级 | 推荐理由 |
|------|--------|--------|--------|----------|
| **macOS Intel** | ✅ 100% | 已完成 | P0 | 已发布 |
| **macOS Apple Silicon** | ✅ 100% | 已完成 | P0 | 已发布 |
| **Windows x86_64** | ✅ 95% | 0.5 天 | **P1** | ⭐ **用户群大，强烈推荐** |
| **Linux x86_64** | ✅ 95% | 0.5 天 | P2 | 开源社区需求 |
| Windows ARM | ⚠️ 80% | 1 天 | P3 | 小众需求 |
| Linux ARM | ✅ 90% | 1 天 | P3 | 树莓派等设备 |
| iOS | ⚠️ 40% | 2-3 天 | P4 | 需要架构重构 |
| Android | ⚠️ 40% | 2-3 天 | P4 | 需要架构重构 |

---

## 🎯 推荐发布路线图

### 🚀 阶段1：当前（已完成）
- ✅ macOS Apple Silicon
- ✅ macOS Intel

### 🚀 阶段2：桌面端全覆盖（推荐，0.5-1 天）
- ⭐ **Windows x86_64** (最重要)
- ⭐ Linux x86_64

**理由**：
- 工作量小（仅需配置调整）
- HTTP 代理架构完全兼容
- 覆盖 90% 以上桌面用户

### 🔮 阶段3：可选扩展（1-2 天）
- Windows ARM64
- Linux ARM64

### 🔮 阶段4：移动端（需谨慎评估）
- iOS
- Android

**不建议立即支持移动端**，因为：
1. 需要完全重构核心架构（HTTP 代理 → Tauri Command）
2. UI 需要移动端适配（触摸、响应式、手势）
3. 测试和维护成本高
4. IPTV 播放器主要使用场景是大屏设备

---

## 💡 最简单的扩展方案

**添加 Windows + Linux 支持（推荐）**

### 方案A：统一配置（最简单）

修改 `tauri.conf.json`:
```json
"bundle": {
  "targets": "all",  // 自动选择当前平台的默认格式
  ...
}
```

### 方案B：完整的多平台 GitHub Actions

修改 `.github/workflows/build-release.yml`:

```yaml
jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        include:
          # macOS
          - os: macos-latest
            target: aarch64-apple-darwin
            name: macOS-Apple-Silicon
          - os: macos-latest
            target: x86_64-apple-darwin
            name: macOS-Intel

          # Windows
          - os: windows-latest
            target: x86_64-pc-windows-msvc
            name: Windows-x64

          # Linux
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu
            name: Linux-x64

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Install Linux dependencies
        if: matrix.os == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev \
            build-essential libssl-dev \
            libayatana-appindicator3-dev librsvg2-dev

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}

      - run: npm install

      - run: npm run tauri build -- --target ${{ matrix.target }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: IPTV-Player-${{ matrix.name }}
          path: |
            src-tauri/target/${{ matrix.target }}/release/bundle/**/*.dmg
            src-tauri/target/${{ matrix.target }}/release/bundle/**/*.msi
            src-tauri/target/${{ matrix.target }}/release/bundle/**/*.exe
            src-tauri/target/${{ matrix.target }}/release/bundle/**/*.deb
            src-tauri/target/${{ matrix.target }}/release/bundle/**/*.AppImage
```

**推送标签后**：
- 自动构建 4 个平台
- 自动创建 GitHub Release
- 自动上传所有安装包

---

## ✅ 总结

### 当前状态
- ✅ macOS 双架构支持完成
- ✅ 核心功能（HTTP 代理、HLS 播放）在桌面端完全兼容

### 推荐行动
1. **立即添加**: Windows + Linux 支持（0.5-1 天）
2. **暂缓**: 移动端支持（需要重构，2-3 天）

### 预期收益
- 覆盖 **95%+ 桌面用户**
- 工作量极小（仅配置调整）
- 无架构变更风险
