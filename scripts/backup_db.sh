#!/bin/bash
# 資料庫備份腳本
# 使用方式: ./scripts/backup_db.sh [backup_name]

set -e

# 設定路徑
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DB_PATH="$PROJECT_ROOT/alumni_platform_api/src/database/app_v2.db"
BACKUP_DIR="$PROJECT_ROOT/alumni_platform_api/src/database/backups"

# 建立備份目錄（如果不存在）
mkdir -p "$BACKUP_DIR"

# 產生備份檔案名稱
if [ -n "$1" ]; then
    BACKUP_NAME="$1"
else
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
fi

BACKUP_PATH="$BACKUP_DIR/${BACKUP_NAME}.db"

# 檢查資料庫是否存在
if [ ! -f "$DB_PATH" ]; then
    echo "❌ 錯誤: 資料庫檔案不存在: $DB_PATH"
    exit 1
fi

# 執行備份
cp "$DB_PATH" "$BACKUP_PATH"

# 顯示結果
if [ -f "$BACKUP_PATH" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    echo "✅ 資料庫備份成功!"
    echo "   📁 備份位置: $BACKUP_PATH"
    echo "   📊 檔案大小: $BACKUP_SIZE"
    echo ""
    echo "📋 現有備份清單:"
    ls -lh "$BACKUP_DIR"/*.db 2>/dev/null | awk '{print "   " $9 " (" $5 ")"}'
else
    echo "❌ 備份失敗"
    exit 1
fi

