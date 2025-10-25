#!/bin/bash

# 日志系统测试脚本
# 用于验证日志系统是否正常工作

set -e

echo "🧪 IPTV Player 日志系统测试"
echo "========================================"
echo ""

# 获取项目根目录
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试函数
test_step() {
    echo -e "${BLUE}▶${NC} $1"
}

test_success() {
    echo -e "${GREEN}✓${NC} $1"
}

test_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

test_error() {
    echo -e "${RED}✗${NC} $1"
}

# 1. 检查依赖
test_step "检查 Cargo 依赖..."
if grep -q "tracing.*=.*\"0.1\"" src-tauri/Cargo.toml && \
   grep -q "tracing-subscriber" src-tauri/Cargo.toml && \
   grep -q "tracing-appender" src-tauri/Cargo.toml; then
    test_success "所有日志依赖已添加"
else
    test_error "日志依赖缺失"
    exit 1
fi
echo ""

# 2. 检查代码是否编译通过
test_step "编译检查..."
cd src-tauri
if cargo check --quiet 2>&1 | grep -q "error"; then
    test_error "编译失败"
    cargo check 2>&1 | grep "error" | head -10
    exit 1
else
    test_success "编译通过"
fi
cd ..
echo ""

# 3. 检查日志初始化函数
test_step "检查日志初始化函数..."
if grep -q "fn init_logging()" src-tauri/src/lib.rs; then
    test_success "找到 init_logging() 函数"
else
    test_error "未找到 init_logging() 函数"
    exit 1
fi
echo ""

# 4. 检查 tracing 使用
test_step "检查 tracing 宏使用..."
if grep -q "use tracing::{info, warn, error, debug, instrument};" src-tauri/src/lib.rs; then
    test_success "已导入 tracing 宏"
else
    test_warning "未找到完整的 tracing 导入"
fi

# 统计各级别日志使用次数
info_count=$(grep -c "info!(" src-tauri/src/lib.rs || echo "0")
warn_count=$(grep -c "warn!(" src-tauri/src/lib.rs || echo "0")
error_count=$(grep -c "error!(" src-tauri/src/lib.rs || echo "0")
debug_count=$(grep -c "debug!(" src-tauri/src/lib.rs || echo "0")

echo "  - info!()  使用次数: $info_count"
echo "  - warn!()  使用次数: $warn_count"
echo "  - error!() 使用次数: $error_count"
echo "  - debug!() 使用次数: $debug_count"

if [ "$info_count" -gt 0 ] || [ "$error_count" -gt 0 ]; then
    test_success "已使用 tracing 日志宏"
else
    test_warning "未找到日志宏使用"
fi
echo ""

# 5. 检查 #[instrument] 使用
test_step "检查函数追踪..."
instrument_count=$(grep -c "#\[instrument" src-tauri/src/lib.rs || echo "0")
echo "  - #[instrument] 使用次数: $instrument_count"

if [ "$instrument_count" -gt 5 ]; then
    test_success "已为多个函数添加追踪"
else
    test_warning "函数追踪较少（建议至少 5 个关键函数）"
fi
echo ""

# 6. 检查旧的 println! 是否还存在
test_step "检查是否清理了旧的 println!..."
println_count=$(grep -c "println!" src-tauri/src/lib.rs || echo "0")

if [ "$println_count" -eq 0 ]; then
    test_success "已完全移除 println!"
elif [ "$println_count" -lt 5 ]; then
    test_warning "还有 $println_count 个 println! 未替换"
else
    test_warning "还有大量 println! ($println_count 个) 未替换"
fi
echo ""

# 7. 检查文档
test_step "检查日志文档..."
if [ -f "LOGGING.md" ]; then
    test_success "找到 LOGGING.md 文档"
else
    test_warning "未找到 LOGGING.md 文档"
fi

if [ -f "日志系统更新说明.md" ]; then
    test_success "找到更新说明文档"
else
    test_warning "未找到更新说明文档"
fi
echo ""

# 8. 测试日志目录（如果应用已运行过）
test_step "检查日志目录..."
if [ "$(uname)" = "Darwin" ]; then
    LOG_DIR="$HOME/Library/Logs/com.sai.iptv-player"
    DATA_DIR="$HOME/Library/Application Support/com.sai.iptv-player"
elif [ "$(uname)" = "Linux" ]; then
    LOG_DIR="$HOME/.local/share/com.sai.iptv-player/logs"
    DATA_DIR="$HOME/.local/share/com.sai.iptv-player"
else
    test_warning "Windows 系统，跳过日志目录检查"
    LOG_DIR=""
fi

if [ -n "$LOG_DIR" ]; then
    if [ -d "$LOG_DIR" ]; then
        test_success "日志目录存在: $LOG_DIR"

        if [ -f "$LOG_DIR/iptv-player.log" ]; then
            log_size=$(du -h "$LOG_DIR/iptv-player.log" | cut -f1)
            test_success "日志文件存在: $log_size"

            # 显示最后几行日志
            echo ""
            echo "  📄 最后 5 行日志:"
            echo "  ----------------------------------------"
            tail -5 "$LOG_DIR/iptv-player.log" | sed 's/^/  /'
            echo "  ----------------------------------------"
        else
            test_warning "日志文件不存在（可能应用还未运行）"
        fi
    else
        test_warning "日志目录不存在（应用可能还未运行）"
    fi
    echo ""
fi

# 9. 建议的下一步
echo ""
echo "========================================"
echo "📋 测试总结"
echo "========================================"
echo ""
test_success "日志系统已成功集成！"
echo ""
echo "🚀 下一步建议："
echo ""
echo "1. 运行开发版本测试日志："
echo "   ${BLUE}npm run tauri dev${NC}"
echo ""
echo "2. 设置 DEBUG 级别查看详细日志："
echo "   ${BLUE}export RUST_LOG=debug${NC}"
echo "   ${BLUE}npm run tauri dev${NC}"
echo ""
echo "3. 查看日志文件："
if [ -n "$LOG_DIR" ]; then
    echo "   ${BLUE}tail -f $LOG_DIR/iptv-player.log${NC}"
fi
echo ""
echo "4. 打包生产版本："
echo "   ${BLUE}npm run tauri build${NC}"
echo ""
echo "5. 查看完整文档："
echo "   ${BLUE}cat LOGGING.md${NC}"
echo ""
echo "========================================"

# 10. 提供快捷命令
echo ""
echo "🔧 快捷命令："
echo ""
echo "# 实时查看日志"
if [ -n "$LOG_DIR" ]; then
    echo "alias iptv-logs='tail -f $LOG_DIR/iptv-player.log'"
fi
echo ""
echo "# 搜索错误"
if [ -n "$LOG_DIR" ]; then
    echo "alias iptv-errors='grep -E \"ERROR|WARN\" $LOG_DIR/iptv-player.log'"
fi
echo ""
echo "# 清理旧日志"
if [ -n "$LOG_DIR" ]; then
    echo "alias iptv-clean-logs='find $LOG_DIR -name \"iptv-player.log.*\" -mtime +7 -delete'"
fi
echo ""

exit 0
