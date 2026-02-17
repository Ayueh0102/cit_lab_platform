#!/bin/bash

# Docker 生產環境控制腳本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# 檢查 .env.prod 檔案
check_env() {
  if [ ! -f .env.prod ]; then
    echo "❌ 找不到 .env.prod 檔案"
    echo "請複製 .env.example 並修改:"
    echo "  cp .env.example .env.prod"
    exit 1
  fi
}

case "$1" in
  up)
    check_env
    echo "🐳 啟動 Docker 生產環境..."
    docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
    echo "✅ 服務已啟動"
    echo ""
    echo "⏳ 等待服務初始化... (約 30 秒)"
    sleep 10
    echo "📦 服務狀態:"
    docker-compose -f docker-compose.prod.yml ps
    ;;

  down)
    echo "⬇️  停止 Docker 容器..."
    docker-compose -f docker-compose.prod.yml down
    echo "✅ 服務已停止"
    ;;

  logs)
    docker-compose -f docker-compose.prod.yml logs -f ${@:2}
    ;;

  shell-backend)
    docker-compose -f docker-compose.prod.yml exec backend bash
    ;;

  shell-db)
    docker-compose -f docker-compose.prod.yml exec db psql -U alumni -d alumni_platform
    ;;

  restart)
    echo "🔄 重啟服務..."
    docker-compose -f docker-compose.prod.yml restart
    echo "✅ 服務已重啟"
    ;;

  rebuild)
    check_env
    echo "🔨 重新構建映像..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    echo "✅ 映像已構建"
    ;;

  ps)
    echo "📦 容器狀態:"
    docker-compose -f docker-compose.prod.yml ps
    ;;

  backup-db)
    echo "💾 備份 PostgreSQL..."
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    docker-compose -f docker-compose.prod.yml exec -T db pg_dump \
      -U alumni alumni_platform > "$BACKUP_FILE"
    echo "✅ 備份完成: $BACKUP_FILE"
    ;;

  restore-db)
    if [ -z "$2" ]; then
      echo "❌ 請指定備份檔案"
      echo "用法: $0 restore-db <備份檔案>"
      exit 1
    fi
    if [ ! -f "$2" ]; then
      echo "❌ 備份檔案不存在: $2"
      exit 1
    fi
    echo "⚠️  警告: 此操作將覆蓋現有資料庫！"
    read -p "確認繼續? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo "📥 還原 PostgreSQL..."
      docker-compose -f docker-compose.prod.yml exec -T db psql \
        -U alumni alumni_platform < "$2"
      echo "✅ 還原完成"
    else
      echo "❌ 已取消"
    fi
    ;;

  *)
    echo "Docker 生產環境控制"
    echo ""
    echo "用法: $0 <命令>"
    echo ""
    echo "命令:"
    echo "  up           - 啟動容器"
    echo "  down         - 停止容器"
    echo "  logs         - 查看日誌 (可選: backend/frontend/db/nginx)"
    echo "  shell-backend- 進入後端容器殼層"
    echo "  shell-db     - 進入 PostgreSQL 殼層"
    echo "  restart      - 重啟容器"
    echo "  rebuild      - 重新構建映像"
    echo "  ps           - 顯示容器狀態"
    echo "  backup-db    - 備份 PostgreSQL 資料庫"
    echo "  restore-db   - 還原 PostgreSQL 資料庫 (需提供備份檔案路徑)"
    echo ""
    exit 1
    ;;
esac
