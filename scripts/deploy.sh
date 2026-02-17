#!/bin/bash
set -euo pipefail

# ========================================
# 校友平台部署腳本
# 用法: ./scripts/deploy.sh [production|staging]
# ========================================

ENVIRONMENT="${1:-production}"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$PROJECT_DIR/backups/$TIMESTAMP"

echo "🚀 開始部署 ($ENVIRONMENT) - $TIMESTAMP"

# --- 前置檢查 ---
check_prerequisites() {
  echo "📋 檢查前置條件..."

  if [ ! -f "$PROJECT_DIR/.env" ] && [ "$ENVIRONMENT" = "production" ]; then
    echo "❌ 缺少 .env 檔案。請從 .env.production.example 建立。"
    exit 1
  fi

  command -v docker >/dev/null 2>&1 || { echo "❌ Docker 未安裝"; exit 1; }
  command -v docker compose >/dev/null 2>&1 || { echo "❌ Docker Compose 未安裝"; exit 1; }

  echo "✅ 前置條件檢查通過"
}

# --- 備份 ---
backup() {
  echo "💾 備份資料庫..."
  mkdir -p "$BACKUP_DIR"

  if [ -f "$PROJECT_DIR/alumni_platform_api/src/database/app_v2.db" ]; then
    cp "$PROJECT_DIR/alumni_platform_api/src/database/app_v2.db" "$BACKUP_DIR/app_v2.db"
    echo "✅ SQLite 備份完成: $BACKUP_DIR/app_v2.db"
  fi

  # PostgreSQL 備份（如果使用 Docker）
  if docker compose ps db 2>/dev/null | grep -q "running"; then
    docker compose exec -T db pg_dump -U alumni alumni_platform > "$BACKUP_DIR/pg_dump.sql" 2>/dev/null || true
    echo "✅ PostgreSQL 備份完成: $BACKUP_DIR/pg_dump.sql"
  fi
}

# --- 建置 ---
build() {
  echo "🔨 建置應用程式..."

  if [ "$ENVIRONMENT" = "production" ]; then
    docker compose -f docker-compose.prod.yml build --no-cache
  else
    docker compose build
  fi

  echo "✅ 建置完成"
}

# --- 部署 ---
deploy() {
  echo "🚢 部署應用程式..."

  if [ "$ENVIRONMENT" = "production" ]; then
    docker compose -f docker-compose.prod.yml up -d
  else
    docker compose up -d
  fi

  echo "✅ 容器已啟動"
}

# --- 健康檢查 ---
health_check() {
  echo "🏥 執行健康檢查..."
  local max_retries=30
  local retry=0

  while [ $retry -lt $max_retries ]; do
    if curl -sf http://localhost:5001/api/health > /dev/null 2>&1; then
      echo "✅ 後端健康檢查通過"
      break
    fi
    retry=$((retry + 1))
    echo "  等待後端啟動... ($retry/$max_retries)"
    sleep 2
  done

  if [ $retry -eq $max_retries ]; then
    echo "❌ 後端健康檢查失敗"
    echo "📋 容器日誌："
    docker compose logs --tail=20 backend
    exit 1
  fi

  # 前端檢查
  retry=0
  while [ $retry -lt $max_retries ]; do
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
      echo "✅ 前端健康檢查通過"
      break
    fi
    retry=$((retry + 1))
    echo "  等待前端啟動... ($retry/$max_retries)"
    sleep 2
  done

  if [ $retry -eq $max_retries ]; then
    echo "❌ 前端健康檢查失敗"
    exit 1
  fi
}

# --- 回滾 ---
rollback() {
  echo "⏪ 回滾到上一個版本..."

  local latest_backup=$(ls -td "$PROJECT_DIR/backups"/*/ 2>/dev/null | head -1)

  if [ -z "$latest_backup" ]; then
    echo "❌ 找不到備份"
    exit 1
  fi

  echo "使用備份: $latest_backup"

  # 還原資料庫
  if [ -f "$latest_backup/app_v2.db" ]; then
    cp "$latest_backup/app_v2.db" "$PROJECT_DIR/alumni_platform_api/src/database/app_v2.db"
  fi

  # 重啟上一個 Docker image
  git stash
  git checkout HEAD~1
  build
  deploy

  echo "✅ 回滾完成"
}

# --- 主流程 ---
main() {
  if [ "${1:-}" = "rollback" ]; then
    rollback
    exit 0
  fi

  check_prerequisites
  backup
  build
  deploy
  health_check

  echo ""
  echo "========================================="
  echo "🎉 部署完成！"
  echo "  前端: http://localhost:3000"
  echo "  後端: http://localhost:5001"
  echo "  健康檢查: http://localhost:5001/api/health"
  echo "  備份位置: $BACKUP_DIR"
  echo "========================================="
}

main "$@"
