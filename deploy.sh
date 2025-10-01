#!/bin/bash

# 色彩所系友會平台部署腳本
# 使用方法: ./deploy.sh

echo "🚀 開始部署色彩所系友會平台..."

# 檢查必要目錄
if [ ! -d "alumni-platform" ] || [ ! -d "alumni_platform_api" ]; then
    echo "❌ 錯誤：找不到必要的專案目錄"
    echo "請確保在包含 alumni-platform 和 alumni_platform_api 目錄的位置執行此腳本"
    exit 1
fi

# 建置前端
echo "📦 建置前端應用程式..."
cd alumni-platform
if ! pnpm run build; then
    echo "❌ 前端建置失敗"
    exit 1
fi

# 複製前端檔案到後端靜態目錄
echo "📁 複製前端檔案到後端..."
cp -r dist/* ../alumni_platform_api/src/static/
echo "✅ 前端檔案複製完成"

# 回到根目錄
cd ..

# 檢查後端依賴
echo "🔍 檢查後端依賴..."
cd alumni_platform_api
source venv/bin/activate

# 更新 requirements.txt
pip freeze > requirements.txt
echo "✅ 依賴清單已更新"

# 測試後端
echo "🧪 測試後端 API..."
python -c "
import sys
sys.path.insert(0, '.')
from src.main import app
with app.test_client() as client:
    response = client.get('/api/health')
    if response.status_code == 200:
        print('✅ 後端 API 測試通過')
    else:
        print('❌ 後端 API 測試失敗')
        sys.exit(1)
"

echo "🎉 部署準備完成！"
echo ""
echo "📋 部署摘要："
echo "   - 前端已建置並整合到後端"
echo "   - 後端依賴已更新"
echo "   - API 測試通過"
echo ""
echo "🌐 本地測試："
echo "   cd alumni_platform_api"
echo "   source venv/bin/activate"
echo "   python src/main.py"
echo "   然後開啟 http://localhost:5000"
echo ""
echo "☁️  雲端部署："
echo "   使用 Manus 部署工具或手動部署到您選擇的雲端平台"

deactivate
cd ..

echo "✨ 部署腳本執行完成！"
