# 📝 IPTV Player 日志系统指南

## 🎯 概述

IPTV Player 使用 Rust 的 `tracing` 框架实现了完善的日志系统，支持：
- ✅ 文件日志（每日滚动）
- ✅ 控制台日志（带颜色）
- ✅ 结构化日志记录
- ✅ 函数调用跟踪
- ✅ 多级别日志（ERROR, WARN, INFO, DEBUG, TRACE）

---

## 📁 日志文件位置

### macOS
```bash
~/Library/Logs/com.sai.iptv-player/iptv-player.log
```

### Windows
```bash
%APPDATA%\com.sai.iptv-player\logs\iptv-player.log
```

### Linux
```bash
~/.local/share/com.sai.iptv-player/logs/iptv-player.log
```

---

## 🔍 查看日志

### 方法 1: 直接查看文件

**macOS/Linux:**
```bash
# 实时查看日志
tail -f ~/Library/Logs/com.sai.iptv-player/iptv-player.log

# 查看最近 100 行
tail -n 100 ~/Library/Logs/com.sai.iptv-player/iptv-player.log

# 搜索特定内容
grep "错误\|失败\|ERROR" ~/Library/Logs/com.sai.iptv-player/iptv-player.log

# 查看今天的日志
grep "$(date +%Y-%m-%d)" ~/Library/Logs/com.sai.iptv-player/iptv-player.log
```

**Windows (PowerShell):**
```powershell
# 实时查看日志
Get-Content "$env:APPDATA\com.sai.iptv-player\logs\iptv-player.log" -Wait

# 查看最近 100 行
Get-Content "$env:APPDATA\com.sai.iptv-player\logs\iptv-player.log" -Tail 100

# 搜索特定内容
Select-String -Path "$env:APPDATA\com.sai.iptv-player\logs\iptv-player.log" -Pattern "ERROR|WARN"
```

### 方法 2: 从终端启动应用（查看控制台日志）

**macOS:**
```bash
# 方式 1: 使用 open 命令
open -a "IPTV Player"

# 方式 2: 直接运行可执行文件（可看到实时日志）
/Applications/IPTV\ Player.app/Contents/MacOS/IPTV\ Player
```

**Windows:**
```powershell
# 从命令行启动（显示控制台日志）
& "C:\Program Files\IPTV Player\IPTV Player.exe"
```

---

## 📊 日志级别

日志系统支持 5 个级别（从高到低）：

| 级别 | 用途 | 示例 |
|------|------|------|
| `ERROR` | 错误信息 | 网络请求失败、文件读写错误 |
| `WARN` | 警告信息 | 未找到订阅源、解析部分失败 |
| `INFO` | 一般信息 | 应用启动、订阅源操作、代理请求 |
| `DEBUG` | 调试信息 | 函数调用、数据解析过程 |
| `TRACE` | 详细跟踪 | 每个步骤的详细执行 |

---

## ⚙️ 配置日志级别

通过环境变量 `RUST_LOG` 控制日志级别：

### macOS/Linux

**临时设置（当前会话）：**
```bash
# 显示所有 INFO 及以上级别
export RUST_LOG=info
/Applications/IPTV\ Player.app/Contents/MacOS/IPTV\ Player

# 显示所有 DEBUG 及以上级别
export RUST_LOG=debug
/Applications/IPTV\ Player.app/Contents/MacOS/IPTV\ Player

# 仅显示错误
export RUST_LOG=error
/Applications/IPTV\ Player.app/Contents/MacOS/IPTV\ Player

# 详细调试（包括依赖库）
export RUST_LOG=trace
/Applications/IPTV\ Player.app/Contents/MacOS/IPTV\ Player
```

**永久设置（添加到 ~/.zshrc 或 ~/.bashrc）：**
```bash
echo 'export RUST_LOG=info' >> ~/.zshrc
source ~/.zshrc
```

### Windows (PowerShell)

**临时设置：**
```powershell
$env:RUST_LOG = "info"
& "C:\Program Files\IPTV Player\IPTV Player.exe"

# 或设置为 debug
$env:RUST_LOG = "debug"
& "C:\Program Files\IPTV Player\IPTV Player.exe"
```

**永久设置：**
```powershell
# 系统环境变量
[System.Environment]::SetEnvironmentVariable("RUST_LOG", "info", "User")
```

---

## 📋 高级过滤

### 按模块过滤

```bash
# 仅显示应用代码的 DEBUG 日志，依赖库显示 WARN
export RUST_LOG=tauri_app_lib=debug,warn

# 显示应用代码的 TRACE 日志，其他显示 INFO
export RUST_LOG=tauri_app_lib=trace,info

# 仅显示特定函数的日志
export RUST_LOG=tauri_app_lib::add_source=trace
```

### 按功能过滤

```bash
# 仅代理服务器相关的日志
grep "代理\|proxy" ~/Library/Logs/com.sai.iptv-player/iptv-player.log

# 仅订阅源操作相关
grep "订阅源\|source" ~/Library/Logs/com.sai.iptv-player/iptv-player.log

# 仅 IPv6 相关
grep "IPv6\|ipv6" ~/Library/Logs/com.sai.iptv-player/iptv-player.log

# 仅 m3u8 解析相关
grep "m3u8" ~/Library/Logs/com.sai.iptv-player/iptv-player.log
```

---

## 🔧 日志内容说明

### 日志格式

```
2025-10-26T10:30:45.123456Z  INFO tauri_app_lib:123: 添加订阅源: 名称='CCTV', URL类型='网络地址'
│                             │    │             │    │
│                             │    │             │    └─ 日志消息
│                             │    │             └─ 行号
│                             │    └─ 模块名
│                             └─ 日志级别
└─ 时间戳
```

### 关键日志事件

#### 1. 应用启动
```
INFO IPTV Player 启动
INFO 版本: 0.1.0
INFO 启动 HTTP 代理服务器: http://127.0.0.1:18080
INFO 数据目录: "/Users/xxx/Library/Application Support/com.sai.iptv-player"
INFO 从文件加载了 5 个订阅源
INFO 应用初始化完成
```

#### 2. 添加订阅源
```
INFO 添加订阅源: 名称='我的频道', URL类型='网络地址'
DEBUG 下载 M3U 播放列表
INFO M3U 内容下载成功，大小: 12345 字节
INFO 成功解析 123 个频道
INFO 数据已保存到: "/Users/xxx/Library/Application Support/com.sai.iptv-player/sources.json", 数量: 6
```

#### 3. 删除订阅源
```
INFO 删除订阅源: ID=abc-123
DEBUG 删除前数量: 6, 删除后数量: 5
INFO 订阅源删除成功: 名称='我的频道'
```

#### 4. HTTP 代理请求
```
DEBUG HTTP 代理请求: http://[2001:db8::1]:8080/playlist.m3u8
DEBUG 处理 m3u8 内容，原始大小: 5678 字节
DEBUG m3u8 处理完成，重写了 12 个 IPv6 URL，新大小: 6789 字节
INFO HTTP 代理成功: 6789 字节, 类型: application/vnd.apple.mpegurl
```

#### 5. 错误示例
```
ERROR 下载失败: connection refused
ERROR 解析 JSON 失败: unexpected end of file
WARN 未找到要删除的订阅源: ID=invalid-id
```

---

## 🛠️ 调试技巧

### 1. 调试订阅源添加失败

```bash
# 设置为 DEBUG 级别
export RUST_LOG=debug

# 查看完整的解析过程
tail -f ~/Library/Logs/com.sai.iptv-player/iptv-player.log | grep -E "添加订阅源|M3U|解析|频道"
```

### 2. 调试播放失败

```bash
# 查看代理请求
tail -f ~/Library/Logs/com.sai.iptv-player/iptv-player.log | grep -E "代理|proxy|m3u8"
```

### 3. 调试 IPv6 问题

```bash
# 查看 IPv6 相关日志
tail -f ~/Library/Logs/com.sai.iptv-player/iptv-player.log | grep -E "IPv6|ipv6|\[.*\]"
```

### 4. 性能分析

```bash
# 查看所有 INFO 以上的日志，统计操作耗时
grep -E "INFO|WARN|ERROR" ~/Library/Logs/com.sai.iptv-player/iptv-player.log
```

---

## 📤 报告问题

提交 Bug 时，请包含以下日志：

### macOS
```bash
# 导出最近的日志
tail -n 500 ~/Library/Logs/com.sai.iptv-player/iptv-player.log > ~/Desktop/iptv-logs.txt

# 打包日志目录
cd ~/Library/Logs
tar -czf ~/Desktop/iptv-logs.tar.gz com.sai.iptv-player/
```

### Windows
```powershell
# 导出最近的日志
Get-Content "$env:APPDATA\com.sai.iptv-player\logs\iptv-player.log" -Tail 500 | Out-File "$env:USERPROFILE\Desktop\iptv-logs.txt"

# 打包日志目录
Compress-Archive -Path "$env:APPDATA\com.sai.iptv-player\logs" -DestinationPath "$env:USERPROFILE\Desktop\iptv-logs.zip"
```

---

## 🔄 日志滚动

- **滚动策略**: 每天午夜 (00:00) 自动创建新日志文件
- **文件命名**:
  - 当前日志: `iptv-player.log`
  - 历史日志: `iptv-player.log.2025-10-25`
- **保留策略**: 默认保留所有历史日志（需要手动清理）

### 手动清理旧日志

**macOS/Linux:**
```bash
# 删除 7 天前的日志
find ~/Library/Logs/com.sai.iptv-player -name "iptv-player.log.*" -mtime +7 -delete

# 仅保留最近 10 个日志文件
cd ~/Library/Logs/com.sai.iptv-player
ls -t iptv-player.log.* | tail -n +11 | xargs rm -f
```

**Windows (PowerShell):**
```powershell
# 删除 7 天前的日志
Get-ChildItem "$env:APPDATA\com.sai.iptv-player\logs" -Filter "iptv-player.log.*" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } |
    Remove-Item
```

---

## ❓ 常见问题

### Q: 日志文件太大怎么办？
A: 日志每天自动滚动，可以定期清理旧日志（见上方清理命令）

### Q: 如何禁用日志？
A: 设置环境变量 `export RUST_LOG=off`

### Q: 如何只查看错误日志？
A: 设置环境变量 `export RUST_LOG=error`

### Q: 控制台日志和文件日志有什么区别？
A:
- 控制台日志：带颜色，格式紧凑，适合实时查看
- 文件日志：无颜色，包含完整信息（线程 ID、行号），适合事后分析

### Q: 如何查看系统控制台日志（macOS）？
A:
```bash
# 使用 log 命令
log stream --predicate 'process == "IPTV Player"' --level debug

# 或使用 Console.app
# 打开 "应用程序" → "实用工具" → "控制台"
```

---

## 📚 相关资源

- [tracing 文档](https://docs.rs/tracing/)
- [tracing-subscriber 文档](https://docs.rs/tracing-subscriber/)
- [日志最佳实践](https://rust-lang-nursery.github.io/rust-cookbook/development_tools/debugging/log.html)

---

**最后更新**: 2025-10-26
**版本**: 0.1.0
