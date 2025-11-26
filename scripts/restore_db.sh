#!/bin/bash
# 資料庫還原腳本
# 使用方式: ./scripts/restore_db.sh <backup_name>

set -e

# 設定路徑
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DB_PATH="$PROJECT_ROOT/alumni_platform_api/src/database/app_v2.db"
BACKUP_DIR="$PROJECT_ROOT/alumni_platform_api/src/database/backups"

# 檢查參數
if [ -z "$1" ]; then
    echo "使用方式: ./scripts/restore_db.sh <backup_name>"
    echo ""
    echo "📋 可用的備份清單:"
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A $BACKUP_DIR/*.db 2>/dev/null)" ]; then
        ls -lh "$BACKUP_DIR"/*.db | awk '{print "   " $9 " (" $5 ", " $6 " " $7 " " $8 ")"}'
    else
        echo "   (沒有找到備份檔案)"
    fi
    exit 1
fi

BACKUP_NAME="$1"

# 處理備份檔案路徑
if [[ "$BACKUP_NAME" == *.db ]]; then
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
else
    BACKUP_PATH="$BACKUP_DIR/${BACKUP_NAME}.db"
fi

# 檢查備份檔案是否存在
if [ ! -f "$BACKUP_PATH" ]; then
    echo "❌ 錯誤: 備份檔案不存在: $BACKUP_PATH"
    echo ""
    echo "📋 可用的備份清單:"
    ls -lh "$BACKUP_DIR"/*.db 2>/dev/null | awk '{print "   " $9}'
    exit 1
fi

# 確認還原操作
echo "⚠️  警告: 這將會覆蓋現有的資料庫!"
echo "   備份來源: $BACKUP_PATH"
echo "   目標資料庫: $DB_PATH"
echo ""
read -p "確定要繼續嗎? (y/N): " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "❌ 操作已取消"
    exit 0
fi

# 先備份現有資料庫
if [ -f "$DB_PATH" ]; then
    CURRENT_BACKUP="$BACKUP_DIR/before_restore_$(date +%Y%m%d_%H%M%S).db"
    cp "$DB_PATH" "$CURRENT_BACKUP"
    echo "📦 已備份現有資料庫到: $CURRENT_BACKUP"
fi

# 執行還原
cp "$BACKUP_PATH" "$DB_PATH"

if [ -f "$DB_PATH" ]; then
    echo "✅ 資料庫還原成功!"
    echo "   📁 已還原: $BACKUP_PATH -> $DB_PATH"
    echo ""
    echo "⚠️  請重新啟動後端服務以載入還原的資料庫"
else
    echo "❌ 還原失敗"
    exit 1
fi

