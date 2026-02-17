#!/bin/bash

# Docker 開發環境控制腳本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

case "$1" in
  up)
    echo "🐳 啟動 Docker 開發環境..."
    docker-compose up -d
    echo "✅ 服務已啟動"
    echo ""
    echo "📍 訪問地址:"
    echo "  前端: http://localhost:3000"
    echo "  後端: http://localhost:5001"
    echo ""
    echo "📋 查看日誌: docker-compose logs -f"
    ;;

  down)
    echo "⬇️  停止 Docker 容器..."
    docker-compose down
    echo "✅ 服務已停止"
    ;;

  logs)
    echo "📊 查看日誌..."
    docker-compose logs -f ${@:2}
    ;;

  shell-backend)
    echo "🔧 進入後端容器..."
    docker-compose exec backend bash
    ;;

  shell-frontend)
    echo "🔧 進入前端容器..."
    docker-compose exec frontend sh
    ;;

  restart)
    echo "🔄 重啟服務..."
    docker-compose restart
    echo "✅ 服務已重啟"
    ;;

  rebuild)
    echo "🔨 重新構建映像..."
    docker-compose build --no-cache
    echo "✅ 映像已構建"
    ;;

  ps)
    echo "📦 容器狀態:"
    docker-compose ps
    ;;

  clean)
    echo "🧹 清理容器和 volumes..."
    docker-compose down -v
    echo "✅ 已清理"
    ;;

  *)
    echo "Docker 開發環境控制"
    echo ""
    echo "用法: $0 <命令>"
    echo ""
    echo "命令:"
    echo "  up            - 啟動容器"
    echo "  down          - 停止容器"
    echo "  logs          - 查看日誌 (可選: backend/frontend)"
    echo "  shell-backend - 進入後端容器殼層"
    echo "  shell-frontend- 進入前端容器殼層"
    echo "  restart       - 重啟容器"
    echo "  rebuild       - 重新構建映像"
    echo "  ps            - 顯示容器狀態"
    echo "  clean         - 清理容器和資料"
    echo ""
    exit 1
    ;;
esac
