#!/bin/bash
# quick-build.sh - 快速打包脚本

set -e  # 遇到错误立即退出

echo "🔨 开始打包 IPTV Player"
echo "=========================="
echo ""

# 1. 清理旧构建
echo "🧹 清理旧的构建产物..."
rm -rf src-tauri/target/release/bundle
rm -rf releases
echo "✅ 清理完成"
echo ""

# 2. 安装依赖
echo "📦 检查并安装依赖..."
npm install
echo "✅ 依赖安装完成"
echo ""

# 3. 测试前端构建
echo "🔍 测试前端构建..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 前端构建失败，请检查 TypeScript 错误"
    exit 1
fi
echo "✅ 前端构建成功"
echo ""

# 4. 开始 Tauri 打包
echo "🚀 开始 Tauri 打包（这可能需要 5-10 分钟）..."
npm run tauri build

# 5. 检查构建结果
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 打包成功！"
    echo ""
    echo "📁 查找生成的安装包..."

    # 创建 releases 目录
    mkdir -p releases

    # 查找并复制 DMG 文件
    if [ -d "src-tauri/target/release/bundle/macos" ]; then
        DMG_FILE=$(find src-tauri/target/release/bundle/macos -name "*.dmg" | head -1)
        if [ -n "$DMG_FILE" ]; then
            # 获取架构信息
            if [[ "$DMG_FILE" == *"aarch64"* ]]; then
                ARCH="Apple-Silicon"
            else
                ARCH="Intel"
            fi

            # 复制并重命名
            NEW_NAME="releases/IPTV-Player-v0.1.0-macOS-${ARCH}.dmg"
            cp "$DMG_FILE" "$NEW_NAME"

            echo "✅ 已复制到: $NEW_NAME"

            # 显示文件信息
            FILE_SIZE=$(du -h "$NEW_NAME" | cut -f1)
            echo "📊 文件大小: $FILE_SIZE"
            echo ""

            # 计算 SHA256
            echo "🔐 计算 SHA256 校验和..."
            shasum -a 256 "$NEW_NAME" > "$NEW_NAME.sha256"
            echo "✅ 校验和文件: $NEW_NAME.sha256"
            cat "$NEW_NAME.sha256"
        else
            echo "⚠️  未找到 DMG 文件"
        fi
    fi

    echo ""
    echo "🎉 打包完成！"
    echo ""
    echo "📍 安装包位置: releases/"
    echo "📄 发布说明: RELEASE.md"
    echo ""
    echo "下一步："
    echo "1. 测试安装包是否可以正常安装"
    echo "2. 查看 RELEASE.md 了解分发方式"
    echo "3. 上传到云盘或 GitHub Releases"

else
    echo ""
    echo "❌ 打包失败"
    echo ""
    echo "常见问题："
    echo "1. TypeScript 错误 - 运行 'npm run build' 查看详细错误"
    echo "2. Rust 编译错误 - 运行 'cargo check' 检查"
    echo "3. 端口冲突 - 运行 'lsof -ti:1420 | xargs kill -9'"
    echo ""
    exit 1
fi
