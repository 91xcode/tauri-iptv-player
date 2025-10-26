#!/usr/bin/env bash

set -e  # 遇到错误立即退出

# 检测操作系统
OS_TYPE="$(uname -s)"
case "$OS_TYPE" in
    Darwin*)
        SED_INPLACE="sed -i ''"
        ;;
    Linux*)
        SED_INPLACE="sed -i"
        ;;
    *)
        SED_INPLACE="sed -i"
        ;;
esac

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
# 1. 读取当前版本号
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
# 2. 显示已有的 Git Tags
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}🏷️  已有的 Git Tags:${NC}"
TAGS=$(git tag -l --sort=-version:refname | head -5)
if [[ -z "$TAGS" ]]; then
    echo -e "${YELLOW}  (暂无 tags)${NC}"
else
    echo -e "${BLUE}$TAGS${NC}"
fi
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3. 检查 Git 工作目录状态
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}📋 检查 Git 状态...${NC}"
GIT_STATUS=$(git status -s)

if [[ -z "$GIT_STATUS" ]]; then
    # 工作目录干净
    echo -e "${GREEN}✅ 工作目录干净（无未提交更改）${NC}"
    echo ""
    echo -e "${YELLOW}选择操作:${NC}"
    echo -e "  ${GREEN}1${NC}) 重新发布当前版本 ${BLUE}v${CURRENT_VERSION}${NC} (强制覆盖 tag)"
    echo -e "  ${GREEN}2${NC}) 创建新版本"
    echo -e "  ${GREEN}3${NC}) 退出"
    echo ""
    read -p "请选择 [1-3] (默认: 3): " CLEAN_ACTION
    CLEAN_ACTION=${CLEAN_ACTION:-3}

    case $CLEAN_ACTION in
        1)
            echo -e "${YELLOW}⚠️  将重新发布版本 v${CURRENT_VERSION}${NC}"
            REPUBLISH_MODE=true
            ;;
        2)
            echo -e "${GREEN}✓ 创建新版本${NC}"
            REPUBLISH_MODE=false
            ;;
        3)
            echo -e "${BLUE}👋 再见！${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ 无效的选择！${NC}"
            exit 1
            ;;
    esac
else
    # 有未提交的更改
    echo -e "${GREEN}✅ 检测到代码更改${NC}"
    echo -e "${BLUE}$GIT_STATUS${NC}"
    REPUBLISH_MODE=false
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4. 选择版本更新类型
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if [[ "$REPUBLISH_MODE" == true ]]; then
    # 重新发布模式：使用当前版本
    NEW_VERSION="$CURRENT_VERSION"
    UPDATE_TYPE="republish"
    echo -e "${YELLOW}⚠️  重新发布模式: v${NEW_VERSION}${NC}"
    echo ""
else
    # 新版本模式：选择版本类型
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
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 5. 输入更新说明
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}📝 输入本次更新说明:${NC}"
if [[ "$REPUBLISH_MODE" == true ]]; then
    echo -e "${YELLOW}提示: 重新发布原因（可选，直接回车跳过）${NC}"
else
    echo -e "${YELLOW}提示: 按回车结束输入，输入 '.' 单独一行表示多行输入结束${NC}"
fi
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
    if [[ "$REPUBLISH_MODE" == true ]]; then
        RELEASE_NOTES="重新发布 v${NEW_VERSION}"
    else
        RELEASE_NOTES="更新版本到 v${NEW_VERSION}"
    fi
fi

echo ""
echo -e "${BLUE}更新说明:${NC}"
echo -e "$RELEASE_NOTES"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 6. 确认发布
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📋 发布摘要${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  当前版本: ${BLUE}v${CURRENT_VERSION}${NC}"
if [[ "$REPUBLISH_MODE" == true ]]; then
    echo -e "  发布版本: ${YELLOW}v${NEW_VERSION}${NC} ${RED}(重新发布，将覆盖 tag)${NC}"
else
    echo -e "  新版本:   ${GREEN}v${NEW_VERSION}${NC}"
fi
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
# 7. 更新版本号（仅在非重新发布模式）
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if [[ "$REPUBLISH_MODE" != true && "$CURRENT_VERSION" != "$NEW_VERSION" ]]; then
    echo -e "${YELLOW}📝 更新版本号...${NC}"

    # 更新 package.json
    if [[ "$OS_TYPE" == "Darwin"* ]]; then
        sed -i '' "s/\"version\": \"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" package.json
    else
        sed -i "s/\"version\": \"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" package.json
    fi
    echo -e "  ${GREEN}✓${NC} package.json"

    # 更新 src-tauri/Cargo.toml
    if [[ "$OS_TYPE" == "Darwin"* ]]; then
        sed -i '' "s/version = \"${CURRENT_VERSION}\"/version = \"${NEW_VERSION}\"/" src-tauri/Cargo.toml
    else
        sed -i "s/version = \"${CURRENT_VERSION}\"/version = \"${NEW_VERSION}\"/" src-tauri/Cargo.toml
    fi
    echo -e "  ${GREEN}✓${NC} src-tauri/Cargo.toml"

    # 更新 src-tauri/tauri.conf.json
    if [[ "$OS_TYPE" == "Darwin"* ]]; then
        sed -i '' "s/\"version\": \"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" src-tauri/tauri.conf.json
    else
        sed -i "s/\"version\": \"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" src-tauri/tauri.conf.json
    fi
    echo -e "  ${GREEN}✓${NC} src-tauri/tauri.conf.json"

    echo -e "${GREEN}✅ 版本号更新完成${NC}"
    echo ""
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 8. 提交代码（仅在有更改时）
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}📦 提交代码到 Git...${NC}"

    git add -A

    # 生成 commit message
    COMMIT_MSG="release: v${NEW_VERSION}

${RELEASE_NOTES}"

    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}✅ 代码已提交${NC}"
    echo ""
else
    echo -e "${YELLOW}📦 无需提交（工作目录干净）${NC}"
    echo ""
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 9. 创建 Git Tag
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

# 如果是重新发布，先删除旧 tag
if [[ "$REPUBLISH_MODE" == true ]]; then
    if git rev-parse "v${NEW_VERSION}" >/dev/null 2>&1; then
        echo -e "${YELLOW}  删除旧 tag v${NEW_VERSION}...${NC}"
        git tag -d "v${NEW_VERSION}"
        git push origin ":refs/tags/v${NEW_VERSION}" 2>/dev/null || true
    fi
fi

git tag -a "v${NEW_VERSION}" -m "$TAG_MSG"
echo -e "${GREEN}✅ Tag v${NEW_VERSION} 已创建${NC}"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 10. 推送到 GitHub
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${YELLOW}☁️  推送到 GitHub...${NC}"

# 推送代码（如果有新提交）
if [[ "$REPUBLISH_MODE" != true ]]; then
    git push origin main
    echo -e "${GREEN}✅ 代码已推送${NC}"
fi

# 推送 tag（强制推送如果是重新发布）
if [[ "$REPUBLISH_MODE" == true ]]; then
    git push origin "v${NEW_VERSION}" --force
    echo -e "${GREEN}✅ Tag 已强制推送（覆盖）${NC}"
else
    git push origin "v${NEW_VERSION}"
    echo -e "${GREEN}✅ Tag 已推送${NC}"
fi
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 11. 完成
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [[ "$REPUBLISH_MODE" == true ]]; then
    echo -e "${GREEN}          ✅ 重新发布成功！${NC}"
else
    echo -e "${GREEN}          ✅ 发布成功！${NC}"
fi
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
