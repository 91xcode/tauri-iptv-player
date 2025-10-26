# 构建 Intel (x86_64) 版本的步骤

## 问题原因

当前 Rust 工具链是在 Rosetta 2 (x86_64 模拟) 下安装的：
```
Default host: x86_64-apple-darwin  # ← 应该是 aarch64-apple-darwin
```

这导致无法交叉编译到 x86_64 目标。

## 解决方案1：重新安装原生 ARM64 Rust（推荐）

### 步骤：

1. **卸载当前 Rust**
   ```bash
   rustup self uninstall
   ```

2. **重新安装 ARM64 原生 Rust**
   ```bash
   # 确保在原生 ARM64 shell 下（不是 Rosetta）
   arch  # 应该显示 arm64

   # 安装 rustup
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

3. **添加 x86_64 目标**
   ```bash
   rustup target add x86_64-apple-darwin
   ```

4. **构建 Intel 版本**
   ```bash
   cd /Users/sai/good_tool/tauri-iptv-player
   npm run tauri build -- --target x86_64-apple-darwin
   ```

5. **复制 DMG**
   ```bash
   cp "src-tauri/target/x86_64-apple-darwin/release/bundle/dmg/IPTV Player_0.2.3_x86_64.dmg" \
      "releases/IPTV-Player-v0.2.3-macOS-Intel.dmg"
   ```

## 解决方案2：使用 GitHub Actions（最简单）⭐

在 GitHub Actions 上构建，它可以同时构建两个架构。

创建 `.github/workflows/build.yml`：

```yaml
name: Build Multi-Arch

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-macos:
    strategy:
      fail-fast: false
      matrix:
        include:
          - target: aarch64-apple-darwin
            runner: macos-latest
          - target: x86_64-apple-darwin
            runner: macos-latest

    runs-on: ${{ matrix.runner }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run tauri build -- --target ${{ matrix.target }}

      - name: Upload DMG
        uses: actions/upload-artifact@v3
        with:
          name: IPTV-Player-${{ matrix.target }}
          path: src-tauri/target/${{ matrix.target }}/release/bundle/dmg/*.dmg
```

使用方法：
```bash
# 方式1: 推送标签自动触发
git tag v0.2.3
git push origin v0.2.3

# 方式2: 手动触发
# 在 GitHub 仓库页面: Actions → Build Multi-Arch → Run workflow
```

构建完成后，在 Actions 页面下载两个架构的 DMG。

## 解决方案3：在 Intel Mac 上构建

如果你有 Intel Mac 电脑，直接在上面构建：
```bash
npm run tauri build
```

会自动生成 x86_64 版本的 DMG。

## 当前状态

| 架构 | 状态 | 文件 |
|------|------|------|
| Apple Silicon (ARM64) | ✅ 已构建 | `releases/IPTV-Player-v0.2.3-macOS-Apple-Silicon.dmg` |
| Intel (x86_64) | ❌ 需要重新配置工具链 | 待构建 |

## 推荐方案

**使用 GitHub Actions（方案2）**，原因：
- ✅ 最方便，不影响本地开发环境
- ✅ 自动化，推送标签即可
- ✅ 可以同时构建多个架构
- ✅ 构建结果可以直接下载

## 验证方法

构建完成后，使用 `file` 命令查看二进制文件架构：

```bash
# Apple Silicon 版本
file "releases/IPTV Player.app/Contents/MacOS/tauri-app"
# 应该显示: Mach-O 64-bit executable arm64

# Intel 版本
file "releases/IPTV Player.app/Contents/MacOS/tauri-app"
# 应该显示: Mach-O 64-bit executable x86_64
```
