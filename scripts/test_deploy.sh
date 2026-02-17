#!/bin/bash
set -euo pipefail

# ========================================
# 部署腳本單元測試
# 驗證腳本核心功能正確性
# 用法: ./scripts/test_deploy.sh
# ========================================

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TEST_PASSED=0
TEST_FAILED=0

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 測試函數
run_test() {
  local test_name=$1
  local test_cmd=$2

  echo -n "測試: $test_name ... "

  if eval "$test_cmd" > /dev/null 2>&1; then
    echo -e "${GREEN}通過${NC}"
    TEST_PASSED=$((TEST_PASSED + 1))
  else
    echo -e "${RED}失敗${NC}"
    TEST_FAILED=$((TEST_FAILED + 1))
  fi
}

echo "========================================="
echo "🧪 部署腳本測試"
echo "========================================="
echo ""

# ========== 腳本語法檢查 ==========
echo "📝 腳本語法檢查"
run_test "deploy.sh 語法" "bash -n $PROJECT_DIR/scripts/deploy.sh"
run_test "pre_deploy_check.sh 語法" "bash -n $PROJECT_DIR/scripts/pre_deploy_check.sh"
run_test "test_deploy.sh 語法" "bash -n $0"
echo ""

# ========== 執行權限檢查 ==========
echo "🔐 執行權限檢查"
run_test "deploy.sh 執行權限" "[ -x $PROJECT_DIR/scripts/deploy.sh ]"
run_test "pre_deploy_check.sh 執行權限" "[ -x $PROJECT_DIR/scripts/pre_deploy_check.sh ]"
echo ""

# ========== 檔案完整性檢查 ==========
echo "📦 檔案完整性檢查"
run_test "docker-compose.yml 存在" "[ -f $PROJECT_DIR/docker-compose.yml ]"
run_test "docker-compose.prod.yml 存在" "[ -f $PROJECT_DIR/docker-compose.prod.yml ]"
run_test "nginx.conf 存在" "[ -f $PROJECT_DIR/nginx/nginx.conf ]"
run_test ".env.production.example 存在" "[ -f $PROJECT_DIR/.env.production.example ]"
run_test "DEPLOY.md 存在" "[ -f $PROJECT_DIR/DEPLOY.md ]"
run_test "DEPLOYMENT_QUICK_REFERENCE.md 存在" "[ -f $PROJECT_DIR/DEPLOYMENT_QUICK_REFERENCE.md ]"
echo ""

# ========== 腳本功能檢查 ==========
echo "🔧 腳本功能檢查"
run_test "deploy.sh 包含 check_prerequisites" "grep -q 'check_prerequisites' $PROJECT_DIR/scripts/deploy.sh"
run_test "deploy.sh 包含 backup" "grep -q 'backup()' $PROJECT_DIR/scripts/deploy.sh"
run_test "deploy.sh 包含 build" "grep -q 'build()' $PROJECT_DIR/scripts/deploy.sh"
run_test "deploy.sh 包含 deploy" "grep -q 'deploy()' $PROJECT_DIR/scripts/deploy.sh"
run_test "deploy.sh 包含 health_check" "grep -q 'health_check()' $PROJECT_DIR/scripts/deploy.sh"
run_test "deploy.sh 包含 rollback" "grep -q 'rollback()' $PROJECT_DIR/scripts/deploy.sh"
echo ""

run_test "pre_deploy_check.sh 包含 check_command" "grep -q 'check_command()' $PROJECT_DIR/scripts/pre_deploy_check.sh"
run_test "pre_deploy_check.sh 包含 check_file" "grep -q 'check_file()' $PROJECT_DIR/scripts/pre_deploy_check.sh"
echo ""

# ========== 配置檔案檢查 ==========
echo "⚙️ 配置檔案檢查"
run_test "Nginx 包含 frontend upstream" "grep -q 'upstream frontend' $PROJECT_DIR/nginx/nginx.conf"
run_test "Nginx 包含 backend upstream" "grep -q 'upstream backend' $PROJECT_DIR/nginx/nginx.conf"
run_test "Nginx 包含 API 代理" "grep -q 'location /api/' $PROJECT_DIR/nginx/nginx.conf"
run_test "Nginx 包含 WebSocket 支援" "grep -q 'socket.io' $PROJECT_DIR/nginx/nginx.conf"
run_test "Nginx 包含安全 Headers" "grep -q 'X-Frame-Options' $PROJECT_DIR/nginx/nginx.conf"
echo ""

run_test ".env.production.example 包含 DATABASE_URL" "grep -q 'DATABASE_URL' $PROJECT_DIR/.env.production.example"
run_test ".env.production.example 包含 JWT_SECRET_KEY" "grep -q 'JWT_SECRET_KEY' $PROJECT_DIR/.env.production.example"
run_test ".env.production.example 包含 ALLOWED_ORIGINS" "grep -q 'ALLOWED_ORIGINS' $PROJECT_DIR/.env.production.example"
echo ""

# ========== 文檔檢查 ==========
echo "📖 文檔檢查"
run_test "DEPLOY.md 包含快速開始" "grep -q '快速開始' $PROJECT_DIR/DEPLOY.md"
run_test "DEPLOY.md 包含故障排除" "grep -q '故障排除' $PROJECT_DIR/DEPLOY.md"
run_test "DEPLOYMENT_QUICK_REFERENCE.md 包含快速開始" "grep -q '快速開始' $PROJECT_DIR/DEPLOYMENT_QUICK_REFERENCE.md"
run_test "DEPLOYMENT_QUICK_REFERENCE.md 包含常用命令" "grep -q '常用命令' $PROJECT_DIR/DEPLOYMENT_QUICK_REFERENCE.md"
echo ""

# ========== 總結 ==========
echo "========================================="
echo "📊 測試結果"
echo "========================================="
echo -e "通過: ${GREEN}$TEST_PASSED${NC}"
echo -e "失敗: ${RED}$TEST_FAILED${NC}"
echo ""

TOTAL=$((TEST_PASSED + TEST_FAILED))

if [ $TEST_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ 所有測試通過 ($TOTAL/$TOTAL)${NC}"
  exit 0
else
  echo -e "${RED}❌ 有 $TEST_FAILED 個測試失敗 ($TEST_PASSED/$TOTAL 通過)${NC}"
  exit 1
fi
