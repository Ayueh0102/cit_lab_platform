#!/bin/bash
set -euo pipefail

# ========================================
# 部署前檢查清單
# 用法: ./scripts/pre_deploy_check.sh
# ========================================

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ERRORS=0
WARNINGS=0

echo "========================================="
echo "🔍 部署前檢查"
echo "========================================="
echo ""

# 顏色定義
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# 檢查函數
check_command() {
  local cmd=$1
  local name=${2:-$cmd}

  if command -v "$cmd" >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} $name 已安裝"
  else
    echo -e "${RED}❌${NC} $name 未安裝"
    ERRORS=$((ERRORS + 1))
  fi
}

check_file() {
  local file=$1
  local name=${2:-$file}

  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $name 存在"
  else
    echo -e "${RED}❌${NC} $name 不存在"
    ERRORS=$((ERRORS + 1))
  fi
}

check_file_or_warn() {
  local file=$1
  local name=${2:-$file}

  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $name 存在"
  else
    echo -e "${YELLOW}⚠️${NC} $name 不存在"
    WARNINGS=$((WARNINGS + 1))
  fi
}

# ========== 系統依賴 ==========
echo "📦 系統依賴"
check_command "docker" "Docker"
check_command "docker compose" "Docker Compose"
check_command "git" "Git"
check_command "curl" "cURL"
echo ""

# ========== 專案檔案 ==========
echo "📁 專案檔案"
check_file "$PROJECT_DIR/docker-compose.yml" "docker-compose.yml"
check_file "$PROJECT_DIR/docker-compose.prod.yml" "docker-compose.prod.yml"
check_file "$PROJECT_DIR/nginx/nginx.conf" "nginx/nginx.conf"
check_file "$PROJECT_DIR/scripts/deploy.sh" "部署腳本"
check_file_or_warn "$PROJECT_DIR/.env" ".env (開發/測試)"
echo ""

# ========== 前端檔案 ==========
echo "🎨 前端檔案"
check_file "$PROJECT_DIR/alumni-platform-nextjs/package.json" "前端 package.json"
check_file "$PROJECT_DIR/alumni-platform-nextjs/next.config.ts" "Next.js 配置"
check_file_or_warn "$PROJECT_DIR/alumni-platform-nextjs/node_modules" "前端依賴已安裝"
echo ""

# ========== 後端檔案 ==========
echo "⚙️ 後端檔案"
check_file "$PROJECT_DIR/alumni_platform_api/src/main_v2.py" "後端入口點"
check_file "$PROJECT_DIR/alumni_platform_api/requirements.txt" "後端依賴"
check_file_or_warn "$PROJECT_DIR/alumni_platform_api/src/database/app_v2.db" "資料庫檔案"
echo ""

# ========== Git 狀態 ==========
echo "📝 Git 狀態"
cd "$PROJECT_DIR"

# 檢查是否在 git 倉庫中
if git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${GREEN}✅${NC} 在 Git 倉庫中"

  # 檢查本地變更
  if git diff --quiet; then
    echo -e "${GREEN}✅${NC} 暫存區無變更"
  else
    echo -e "${YELLOW}⚠️${NC} 暫存區有變更"
    git diff --stat
    WARNINGS=$((WARNINGS + 1))
  fi

  # 檢查未追蹤檔案
  if git ls-files --others --exclude-standard | grep -q .; then
    echo -e "${YELLOW}⚠️${NC} 有未追蹤檔案"
    WARNINGS=$((WARNINGS + 1))
  else
    echo -e "${GREEN}✅${NC} 無未追蹤檔案"
  fi

  # 檢查分支
  local branch=$(git rev-parse --abbrev-ref HEAD)
  echo "  目前分支: $branch"

  # 檢查最新提交
  local last_commit=$(git log -1 --oneline)
  echo "  最新提交: $last_commit"
else
  echo -e "${RED}❌${NC} 不在 Git 倉庫中"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# ========== Docker 狀態 ==========
echo "🐳 Docker 狀態"
if docker ps > /dev/null 2>&1; then
  echo -e "${GREEN}✅${NC} Docker daemon 執行中"
else
  echo -e "${RED}❌${NC} Docker daemon 未執行"
  ERRORS=$((ERRORS + 1))
fi

# 檢查容器狀態
if docker compose ps 2>/dev/null | grep -q "running"; then
  echo -e "${YELLOW}⚠️${NC} 已有執行中的容器"
  docker compose ps
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}✅${NC} 無執行中的容器"
fi
echo ""

# ========== 連接埠檢查 ==========
echo "🔌 連接埠檢查"
local ports=(3000 5001 80 443 5432)
for port in "${ports[@]}"; do
  if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️${NC} 連接埠 $port 被佔用"
    WARNINGS=$((WARNINGS + 1))
  else
    echo -e "${GREEN}✅${NC} 連接埠 $port 可用"
  fi
done
echo ""

# ========== 備份檢查 ==========
echo "💾 備份檢查"
if [ -d "$PROJECT_DIR/backups" ]; then
  local backup_count=$(find "$PROJECT_DIR/backups" -maxdepth 1 -type d | wc -l)
  if [ $backup_count -gt 1 ]; then
    echo -e "${GREEN}✅${NC} 找到 $((backup_count - 1)) 個備份"
    ls -dtr "$PROJECT_DIR/backups"/*/ | tail -3 | while read backup; do
      echo "  - $(basename "$backup")"
    done
  else
    echo -e "${YELLOW}⚠️${NC} 找不到備份"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "${YELLOW}⚠️${NC} 備份目錄不存在"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# ========== 環境變數檢查 ==========
echo "🔐 環境變數檢查"
if [ -f "$PROJECT_DIR/.env" ]; then
  echo -e "${GREEN}✅${NC} .env 檔案存在"

  # 檢查重要環數
  for var in "DATABASE_URL" "JWT_SECRET_KEY" "FLASK_ENV"; do
    if grep -q "^$var=" "$PROJECT_DIR/.env"; then
      echo -e "${GREEN}✅${NC} 設定了 $var"
    else
      echo -e "${YELLOW}⚠️${NC} 未設定 $var"
      WARNINGS=$((WARNINGS + 1))
    fi
  done
else
  echo -e "${YELLOW}⚠️${NC} .env 檔案不存在（開發環境無關緊要）"
fi
echo ""

# ========== 磁盤空間檢查 ==========
echo "💿 磁盤空間"
local available=$(df "$PROJECT_DIR" | awk 'NR==2 {print $4}')
if [ "$available" -gt 1048576 ]; then
  echo -e "${GREEN}✅${NC} 可用磁盤空間充足 ($(numfmt --to=iec-i --suffix=B $((available * 1024)) 2>/dev/null || echo $available KB))"
else
  echo -e "${RED}❌${NC} 可用磁盤空間不足"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# ========== 總結 ==========
echo "========================================="
echo "📊 檢查結果"
echo "========================================="
echo -e "❌ 錯誤: $ERRORS"
echo -e "⚠️ 警告: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ 準備就緒，可以開始部署！${NC}"
  echo ""
  echo "建議後續步驟："
  echo "  1. 檢查 Git 分支: git branch -a"
  echo "  2. 確認變更內容: git log --oneline -10"
  echo "  3. 執行部署: ./scripts/deploy.sh [environment]"
  echo ""
  exit 0
else
  echo -e "${RED}❌ 有 $ERRORS 個錯誤需要修正，無法部署${NC}"
  echo ""
  echo "故障排除建議："
  echo "  - 檢查是否有未安裝的依賴"
  echo "  - 確認必要檔案存在"
  echo "  - 檢查 Docker 是否正常運行"
  echo "  - 檢查磁盤空間"
  echo ""
  exit 1
fi
