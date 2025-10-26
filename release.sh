#!/bin/bash

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}          🚀 IPTV Player 自动发布脚本${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. 检查是否有未提交的更改
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}📋 检查 Git 状态...${NC}"
if [[ -z $(git status -s) ]]; then
    echo -e "${RED}❌ 没有检测到任何更改！${NC}"
    echo -e "${YELLOW}提示: 请先修改代码后再运行此脚本${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 检测到代码更改${NC}"
git status -s
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2. 获取当前版本号
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}📦 读取当前版本...${NC}"

# 从 package.json 读取当前版本
CURRENT_VERSION=$(grep -o '"version": "[^"]*"' package.json | cut -d'"' -f4)
echo -e "当前版本: ${BLUE}v${CURRENT_VERSION}${NC}"

# 分解版本号
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3. 选择版本更新类型
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}🔢 选择版本更新类型:${NC}"
echo -e "  ${GREEN}1${NC}) Patch  (Bug 修复)    ${BLUE}${MAJOR}.${MINOR}.${PATCH}${NC} → ${GREEN}${MAJOR}.${MINOR}.$((PATCH + 1))${NC}"
echo -e "  ${GREEN}2${NC}) Minor  (新功能)      ${BLUE}${MAJOR}.${MINOR}.${PATCH}${NC} → ${GREEN}${MAJOR}.$((MINOR + 1)).0${NC}"
echo -e "  ${GREEN}3${NC}) Major  (重大更新)    ${BLUE}${MAJOR}.${MINOR}.${PATCH}${NC} → ${GREEN}$((MAJOR + 1)).0.0${NC}"
echo -e "  ${GREEN}4${NC}) Custom (自定义版本)"
echo ""

read -p "请选择 [1-4] (默认: 1): " VERSION_TYPE
VERSION_TYPE=${VERSION_TYPE:-1}

case $VERSION_TYPE in
    1)
        NEW_VERSION="${MAJOR}.${MINOR}.$((PATCH + 1))"
        UPDATE_TYPE="patch"
        ;;
    2)
        NEW_VERSION="${MAJOR}.$((MINOR + 1)).0"
        UPDATE_TYPE="minor"
        ;;
    3)
        NEW_VERSION="$((MAJOR + 1)).0.0"
        UPDATE_TYPE="major"
        ;;
    4)
        read -p "请输入新版本号 (格式: x.y.z): " NEW_VERSION
        if [[ ! $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo -e "${RED}❌ 版本号格式错误！${NC}"
            exit 1
        fi
        UPDATE_TYPE="custom"
        ;;
    *)
        echo -e "${RED}❌ 无效的选择！${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ 新版本: v${NEW_VERSION}${NC}"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4. 输入更新说明
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}📝 输入本次更新说明:${NC}"
echo -e "${YELLOW}提示: 按回车结束输入，输入 '.' 单独一行表示多行输入结束${NC}"
echo ""

RELEASE_NOTES=""
while IFS= read -r line; do
    if [[ "$line" == "." ]]; then
        break
    fi
    RELEASE_NOTES="${RELEASE_NOTES}${line}\n"
done

# 如果为空，使用默认说明
if [[ -z "$RELEASE_NOTES" ]]; then
    RELEASE_NOTES="更新版本到 v${NEW_VERSION}"
fi

echo ""
echo -e "${BLUE}更新说明:${NC}"
echo -e "$RELEASE_NOTES"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 5. 确认发布
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 发布摘要${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  当前版本: ${BLUE}v${CURRENT_VERSION}${NC}"
echo -e "  新版本:   ${GREEN}v${NEW_VERSION}${NC}"
echo -e "  更新类型: ${BLUE}${UPDATE_TYPE}${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

read -p "确认发布？[y/N]: " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ 已取消发布${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 开始发布流程...${NC}"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 6. 更新版本号
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}📝 更新版本号...${NC}"

# 更新 package.json
sed -i '' "s/\"version\": \"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" package.json
echo -e "  ${GREEN}✓${NC} package.json"

# 更新 src-tauri/Cargo.toml
sed -i '' "s/version = \"${CURRENT_VERSION}\"/version = \"${NEW_VERSION}\"/" src-tauri/Cargo.toml
echo -e "  ${GREEN}✓${NC} src-tauri/Cargo.toml"

# 更新 src-tauri/tauri.conf.json
sed -i '' "s/\"version\": \"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" src-tauri/tauri.conf.json
echo -e "  ${GREEN}✓${NC} src-tauri/tauri.conf.json"

echo -e "${GREEN}✅ 版本号更新完成${NC}"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 7. 提交代码
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}📦 提交代码到 Git...${NC}"

git add -A

# 生成 commit message
COMMIT_MSG="release: v${NEW_VERSION}

${RELEASE_NOTES}"

git commit -m "$COMMIT_MSG"
echo -e "${GREEN}✅ 代码已提交${NC}"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 8. 创建 Git Tag
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}🏷️  创建 Git Tag...${NC}"

# 生成 tag message
TAG_MSG="Release v${NEW_VERSION}

## 🎉 支持平台
✅ macOS Apple Silicon (.dmg)
✅ macOS Intel (.dmg)
✅ Windows x64 (.msi, .exe)
✅ Linux x64 (.deb, .AppImage)

## 📝 更新内容
${RELEASE_NOTES}

## 📥 安装说明
- macOS: 双击 .dmg，拖拽到 Applications
  ⚠️ 首次打开请查看 INSTALL_MACOS.md
- Windows: 运行 .msi 或 .exe
- Linux: sudo dpkg -i *.deb 或运行 .AppImage"

git tag -a "v${NEW_VERSION}" -m "$TAG_MSG"
echo -e "${GREEN}✅ Tag v${NEW_VERSION} 已创建${NC}"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 9. 推送到 GitHub
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}☁️  推送到 GitHub...${NC}"

git push origin main
echo -e "${GREEN}✅ 代码已推送${NC}"

git push origin "v${NEW_VERSION}"
echo -e "${GREEN}✅ Tag 已推送${NC}"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 10. 完成
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}          ✅ 发布成功！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📦 版本:${NC} v${NEW_VERSION}"
echo -e "${BLUE}🏷️  Tag:${NC}  v${NEW_VERSION}"
echo ""
echo -e "${YELLOW}🚀 GitHub Actions 正在构建...${NC}"
echo -e "${YELLOW}⏱️  预计时间: 5-8 分钟${NC}"
echo ""
echo -e "${BLUE}🔗 查看进度:${NC}"
echo -e "   https://github.com/91xcode/tauri-iptv-player/actions"
echo ""
echo -e "${BLUE}📦 Release 页面:${NC}"
echo -e "   https://github.com/91xcode/tauri-iptv-player/releases/tag/v${NEW_VERSION}"
echo ""
echo -e "${GREEN}预期产物（6个文件）:${NC}"
echo -e "  1️⃣  IPTV-Player-v${NEW_VERSION}-macOS-Apple-Silicon.dmg"
echo -e "  2️⃣  IPTV-Player-v${NEW_VERSION}-macOS-Intel.dmg"
echo -e "  3️⃣  IPTV-Player-v${NEW_VERSION}-Windows-x64.msi"
echo -e "  4️⃣  IPTV-Player-v${NEW_VERSION}-Windows-x64-setup.exe"
echo -e "  5️⃣  IPTV-Player-v${NEW_VERSION}-Linux-x64.deb"
echo -e "  6️⃣  IPTV-Player-v${NEW_VERSION}-Linux-x64.AppImage"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
