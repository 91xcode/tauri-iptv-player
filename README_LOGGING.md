# 🎉 日志系统集成完成

## ✅ 已完成

已成功为 IPTV Player 添加了完善的生产级日志系统！

### 📊 测试结果

```
✓ 所有日志依赖已添加
✓ 编译通过
✓ 找到 init_logging() 函数
✓ 已导入 tracing 宏
  - info!()  使用次数: 30
  - warn!()  使用次数: 5
  - error!() 使用次数: 23
  - debug!() 使用次数: 24
✓ 已使用 tracing 日志宏
✓ 已为 14 个函数添加追踪
✓ 找到 LOGGING.md 文档
✓ 找到更新说明文档
```

---

## 📁 新增文件

1. **LOGGING.md** - 完整的日志系统使用指南（4000+ 字）
2. **日志系统更新说明.md** - 更新内容和技术细节
3. **test-logging.sh** - 自动化测试脚本
4. **README_LOGGING.md** - 本文件（快速上手）

---

## 🚀 快速开始

### 1. 查看日志文件位置

应用运行后，日志会自动写入：

**macOS:**
```bash
~/Library/Logs/com.sai.iptv-player/iptv-player.log
```

### 2. 实时查看日志

```bash
# 实时查看日志（推荐）
tail -f ~/Library/Logs/com.sai.iptv-player/iptv-player.log

# 或使用快捷命令
alias iptv-logs='tail -f ~/Library/Logs/com.sai.iptv-player/iptv-player.log'
iptv-logs
```

### 3. 运行开发版本

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

### 4. 从终端启动已安装的应用

```bash
# 直接运行（可看到控制台日志）
/Applications/IPTV\ Player.app/Contents/MacOS/IPTV\ Player

# 设置日志级别
export RUST_LOG=debug
/Applications/IPTV\ Player.app/Contents/MacOS/IPTV\ Player
```

---

## 🔍 日志示例

### 应用启动
```
2025-10-26T10:30:45Z  INFO tauri_app_lib: IPTV Player 启动
2025-10-26T10:30:45Z  INFO tauri_app_lib: 版本: 0.1.0
2025-10-26T10:30:45Z  INFO tauri_app_lib: 启动 HTTP 代理服务器: http://127.0.0.1:18080
2025-10-26T10:30:45Z  INFO tauri_app_lib: 日志文件位置: "~/Library/Logs/com.sai.iptv-player/iptv-player.log"
2025-10-26T10:30:45Z  INFO tauri_app_lib: 从文件加载了 3 个订阅源
2025-10-26T10:30:45Z  INFO tauri_app_lib: 应用初始化完成
```

### 添加订阅源
```
2025-10-26T10:31:00Z  INFO add_source: 添加订阅源: 名称='CCTV 频道', URL类型='网络地址'
2025-10-26T10:31:01Z  INFO fetch_and_parse_m3u: M3U 内容下载成功，大小: 12345 字节
2025-10-26T10:31:01Z  INFO parse_m3u_content: 成功解析 123 个频道
2025-10-26T10:31:01Z  INFO save_sources: 数据已保存到: "sources.json", 数量: 4
```

### HTTP 代理
```
2025-10-26T10:32:00Z DEBUG proxy_handler: HTTP 代理请求: http://example.com/playlist.m3u8
2025-10-26T10:32:00Z  INFO proxy_handler: HTTP 代理成功: 6789 字节, 类型: application/vnd.apple.mpegurl
```

### 错误示例
```
2025-10-26T10:33:00Z ERROR fetch_and_parse_m3u: 下载失败: connection refused
2025-10-26T10:33:10Z  WARN delete_source: 未找到要删除的订阅源: ID=invalid-id
```

---

## 📚 完整文档

详细使用指南请查看 **[LOGGING.md](./LOGGING.md)**，包含：

- 📁 各平台日志文件位置
- 🔍 多种查看日志的方法
- 📊 日志级别详解
- ⚙️ 环境变量配置
- 📋 高级过滤和搜索
- 🔧 调试技巧
- 📤 问题报告指南
- 🔄 日志滚动和清理
- ❓ 常见问题解答

---

## 🔧 常用命令速查

### 查看日志
```bash
# 实时查看
tail -f ~/Library/Logs/com.sai.iptv-player/iptv-player.log

# 查看最近 100 行
tail -n 100 ~/Library/Logs/com.sai.iptv-player/iptv-player.log

# 搜索错误
grep -E "ERROR|WARN" ~/Library/Logs/com.sai.iptv-player/iptv-player.log

# 搜索特定功能
grep "订阅源" ~/Library/Logs/com.sai.iptv-player/iptv-player.log
grep "代理" ~/Library/Logs/com.sai.iptv-player/iptv-player.log
```

### 日志级别设置
```bash
# 默认（INFO）
npm run tauri dev

# 调试（DEBUG）
export RUST_LOG=debug && npm run tauri dev

# 详细（TRACE）
export RUST_LOG=trace && npm run tauri dev

# 仅错误（ERROR）
export RUST_LOG=error && npm run tauri dev
```

### 清理日志
```bash
# 删除 7 天前的日志
find ~/Library/Logs/com.sai.iptv-player -name "iptv-player.log.*" -mtime +7 -delete

# 删除所有历史日志（保留当前）
rm ~/Library/Logs/com.sai.iptv-player/iptv-player.log.*
```

---

## 📊 日志级别说明

| 级别 | 环境变量 | 用途 | 适用场景 |
|------|---------|------|---------|
| **ERROR** | `RUST_LOG=error` | 仅错误 | 生产环境 |
| **WARN** | `RUST_LOG=warn` | 警告+错误 | 生产环境 |
| **INFO** | `RUST_LOG=info` | 关键操作 | 默认/生产 |
| **DEBUG** | `RUST_LOG=debug` | 详细信息 | 开发/调试 |
| **TRACE** | `RUST_LOG=trace` | 完整追踪 | 深度调试 |

---

## 🎯 使用建议

### 日常开发
```bash
export RUST_LOG=debug
npm run tauri dev
```

### 调试特定问题
```bash
# 订阅源问题
tail -f ~/Library/Logs/com.sai.iptv-player/iptv-player.log | grep "订阅源\|source"

# 网络请求问题
tail -f ~/Library/Logs/com.sai.iptv-player/iptv-player.log | grep "代理\|请求\|下载"

# IPv6 相关问题
tail -f ~/Library/Logs/com.sai.iptv-player/iptv-player.log | grep "IPv6\|ipv6"
```

### 生产环境
```bash
# 永久设置为 INFO 级别
echo 'export RUST_LOG=info' >> ~/.zshrc
source ~/.zshrc
```

---

## 🐛 问题排查

### 应用无法启动？
```bash
# 查看启动日志
tail ~/Library/Logs/com.sai.iptv-player/iptv-player.log

# 从终端运行查看详细错误
/Applications/IPTV\ Player.app/Contents/MacOS/IPTV\ Player
```

### 订阅源添加失败？
```bash
# 设置 DEBUG 级别查看详细信息
export RUST_LOG=debug
npm run tauri dev

# 查看解析过程
tail -f ~/Library/Logs/com.sai.iptv-player/iptv-player.log | grep "添加订阅源\|M3U\|解析"
```

### 播放失败？
```bash
# 查看代理日志
tail -f ~/Library/Logs/com.sai.iptv-player/iptv-player.log | grep "代理\|proxy"
```

---

## 📝 更新记录

### 2025-10-26
- ✅ 集成 tracing 日志框架
- ✅ 替换所有 `println!` 为结构化日志
- ✅ 添加文件日志（每日滚动）
- ✅ 添加 14 个函数追踪
- ✅ 支持环境变量配置日志级别
- ✅ 编写完整文档

---

## 🙏 反馈

如有问题或建议，请查看 [LOGGING.md](./LOGGING.md) 获取帮助。

---

**快速链接:**
- [完整日志指南](./LOGGING.md)
- [更新说明](./日志系统更新说明.md)
- [测试脚本](./test-logging.sh)
