#!/bin/bash

echo "🔨 Tauri 构建监控"
echo "=================="
echo ""

while true; do
    if ps aux | grep "cargo" | grep -v grep > /dev/null; then
        echo "⏳ 正在编译 Rust 代码..."
        tail -3 /tmp/tauri-build.log 2>/dev/null | grep -v "^$"
    elif ps aux | grep "tauri build" | grep -v grep > /dev/null; then
        echo "📦 正在打包..."
    else
        echo ""
        echo "✅ 构建完成或已停止"
        echo ""
        echo "📁 查找构建产物："
        if [ -d "src-tauri/target/release/bundle" ]; then
            find src-tauri/target/release/bundle -name "*.dmg" -o -name "*.app" -o -name "*.pkg" 2>/dev/null
        else
            echo "   未找到 bundle 目录"
        fi
        echo ""
        echo "📄 最后20行构建日志："
        tail -20 /tmp/tauri-build.log
        break
    fi
    sleep 5
done
