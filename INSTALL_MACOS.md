# macOS 安装说明

## ⚠️ "应用已损坏" 问题解决

从 GitHub 下载的应用提示"已损坏，无法打开"是因为应用没有经过 Apple 公证（notarization）。

### 方法1：移除隔离属性（推荐）⭐

打开终端，执行以下命令：

```bash
# 下载 DMG 后，挂载并移除隔离属性
sudo xattr -cr "/Applications/IPTV Player.app"
```

**详细步骤**：

1. 下载 `IPTV-Player-v0.2.7-macOS-*.dmg`
2. 双击打开 DMG
3. 拖拽 `IPTV Player.app` 到 `Applications` 文件夹
4. **不要直接打开**，先打开终端（Terminal.app）
5. 复制粘贴上面的命令并回车
6. 输入管理员密码
7. 现在可以正常打开应用了

### 方法2：临时允许打开

1. 双击打开应用，看到"已损坏"提示
2. 点击"取消"
3. 打开 **系统设置 → 隐私与安全性**
4. 在底部找到"仍要打开"按钮
5. 点击"打开"

### 方法3：完全禁用 Gatekeeper（不推荐）

```bash
# 临时禁用 Gatekeeper
sudo spctl --master-disable

# 打开应用后，重新启用 Gatekeeper
sudo spctl --master-enable
```

### 方法4：右键打开

1. 在访达（Finder）中找到 `IPTV Player.app`
2. **按住 Control 键点击**（或右键点击）
3. 选择"打开"
4. 在弹出窗口点击"打开"

---

## 🔐 为什么会出现这个问题？

1. **未签名**：应用没有使用 Apple Developer 证书签名
2. **未公证**：应用没有经过 Apple 的公证流程
3. **下载标记**：从互联网下载的文件会被 macOS 标记

## 💡 开发者注意

如果你是项目维护者，要彻底解决这个问题，需要：

### 1. 获取 Apple Developer 账号

- 费用：$99/年
- 网址：https://developer.apple.com

### 2. 配置代码签名

在 `tauri.conf.json` 中添加：

```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)",
      "entitlements": "entitlements.plist",
      "exceptionDomain": "",
      "provisioningProfile": null
    }
  }
}
```

### 3. 配置公证

```bash
# 公证命令
xcrun notarytool submit "IPTV Player.dmg" \
  --apple-id "your@email.com" \
  --password "app-specific-password" \
  --team-id "TEAM_ID" \
  --wait

# 装订票据
xcrun stapler staple "IPTV Player.dmg"
```

### 4. GitHub Actions 自动签名

在 `.github/workflows/build-release.yml` 中添加签名步骤：

```yaml
- name: Import Code-Signing Certificates
  if: matrix.os == 'macos-latest'
  uses: Apple-Actions/import-codesign-certs@v2
  with:
    p12-file-base64: ${{ secrets.APPLE_CERTIFICATE }}
    p12-password: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}

- name: Build and Sign
  run: npm run tauri build
  env:
    APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
    APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

---

## 📱 Intel vs Apple Silicon

**确认你的 Mac 类型**：

```bash
# 查看 CPU 架构
uname -m

# arm64 = Apple Silicon (M1/M2/M3)
# x86_64 = Intel
```

**下载对应版本**：
- Apple Silicon: `IPTV-Player-v0.2.7-macOS-Apple-Silicon.dmg`
- Intel: `IPTV-Player-v0.2.7-macOS-Intel.dmg`

---

## ✅ 推荐方案

**普通用户**：使用方法1（移除隔离属性）

```bash
sudo xattr -cr "/Applications/IPTV Player.app"
```

简单、安全、一劳永逸。
