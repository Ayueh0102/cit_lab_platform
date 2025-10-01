# 色彩與照明科技研究所系友會平台

一個完整的全端系友會社群平台,提供職缺分享、活動管理、系友名錄等功能。

## 🎨 專案特色

- 活潑明亮的粉紅漸層設計風格
- 完整的前後端分離架構
- JWT 認證系統
- 響應式設計支援桌面與行動裝置

## 📁 專案結構

```
alumni-platform-complete-final/
├── alumni-platform/          # React 前端應用程式
│   ├── src/
│   │   ├── App.jsx          # 主應用程式元件
│   │   ├── App.css          # 樣式檔案
│   │   └── components/ui/   # UI 元件庫
│   └── public/              # 靜態資源與圖片
│
└── alumni_platform_api/      # Flask 後端 API
    ├── src/
    │   ├── main.py          # API 入口點
    │   ├── models/          # 資料模型
    │   └── routes/          # API 路由
    └── requirements.txt     # Python 依賴
```

## 🚀 快速開始

### 前端開發

```bash
cd alumni-platform
npm install
npm run dev
# 開啟 http://localhost:5173
```

### 後端開發

```bash
cd alumni_platform_api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python src/main.py
# API 運行在 http://localhost:5001
```

## 🔑 測試帳號

- **管理員**: admin@example.com / admin123
- **一般用戶**: wang@example.com / password123
- **一般用戶**: lee@example.com / password123

## ✨ 核心功能

### 系友管理
- ✅ 使用者註冊與登入
- ✅ 個人檔案編輯
- ✅ 工作經歷管理
- ✅ LinkedIn 資料同步

### 職缺系統
- ✅ 職缺發布與瀏覽
- ✅ 交流請求功能
- ✅ 私訊對話系統
- ✅ 職缺分類與篩選

### 活動管理
- ✅ 活動建立與編輯
- ✅ 活動報名系統
- ✅ 名額管理
- ✅ 活動分享功能

### 公佈欄
- ✅ 公告發布
- ✅ 分類管理(系友會公告/系友動態/學術新知)
- ✅ 置頂功能
- ✅ 標籤系統

### 系友名錄
- ✅ 系友資料檢索
- ✅ 技能標籤
- ✅ 聯繫請求
- ✅ 職涯資訊展示

### 通知系統
- ✅ 即時通知
- ✅ 已讀/未讀狀態
- ✅ 多種通知類型

### 管理後台
- ✅ 系統統計
- ✅ 使用者管理
- ✅ 權限控制

## 🛠️ 技術棧

### 前端
- React 18
- Vite 6
- Tailwind CSS v4
- Radix UI (shadcn/ui)
- Poppins 字型

### 後端
- Python 3.11
- Flask
- SQLAlchemy
- JWT Authentication
- SQLite Database

## 🎨 設計系統

- **主色調**: 粉紅漸層 (#ff9a9e → #fecfef)
- **側邊欄**: 彩虹漸層動畫
- **卡片**: 玻璃擬態效果
- **動畫**: bounceIn, gradientShift, colorSlide
- **字型**: Poppins (Google Fonts)

## 📝 API 規格

詳細 API 文件請參考 `api_specification.md`

- 基礎 URL: `http://localhost:5001/api`
- 認證方式: JWT Bearer Token

## 📱 響應式設計

支援以下裝置:
- 📱 手機 (< 768px)
- 💻 平板與桌面 (≥ 768px)

## 📄 授權

本專案僅供學習與展示使用。

## 👨‍💻 開發者

色彩與照明科技研究所系友會技術團隊

---

🎉 Generated with [Claude Code](https://claude.com/claude-code)
