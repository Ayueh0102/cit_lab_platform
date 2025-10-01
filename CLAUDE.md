# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

色彩與照明科技研究所系友會社群平台 - 一個完整的全端應用程式,包含前端 React 應用程式和 Flask 後端 API。

## 開發指令

### 前端開發 (推薦使用 `alumni-platform/` 版本)

```bash
cd alumni-platform
npm install                 # 安裝依賴
npm run dev                 # 啟動開發伺服器 (http://localhost:5173)
npm run build              # 建置生產版本
npm run preview            # 預覽生產版本
npm run lint               # 執行 ESLint 檢查
```

### 後端開發

```bash
cd alumni_platform_api
source venv/bin/activate    # 啟動虛擬環境
pip install -r requirements.txt  # 安裝依賴
python src/main.py          # 啟動 Flask 伺服器 (http://localhost:5001)
```

**注意**: 後端預設 port 為 5001,資料庫會自動初始化並建立測試資料。

## 專案架構

### 目錄結構

本專案包含三個主要版本:
- **`alumni-platform/`**: 原始版本(推薦使用) - 功能最完整、測試最充分
- **`alumni-platform-bright/`**: 明亮版本(實驗性) - UI 設計變體
- **`alumni_platform_api/`**: Flask 後端 API - 所有版本共用

### 後端架構 (Flask)

```
alumni_platform_api/src/
├── main.py              # 應用程式入口點,包含 Flask app 設定與資料庫初始化
├── models/
│   └── user.py          # 所有資料模型: User, Profile, Job, Event, Bulletin, Message 等
└── routes/              # API 路由模組(Blueprint 架構)
    ├── auth.py          # 認證相關: /api/auth/login, /api/auth/register
    ├── user.py          # 使用者管理: /api/users/*
    ├── jobs.py          # 職缺系統: /api/jobs/*, /api/job-requests/*
    ├── events.py        # 活動系統: /api/events/*
    ├── bulletins.py     # 公佈欄: /api/bulletins/*
    └── messages.py      # 私訊系統: /api/conversations/*
```

**重要設計模式**:
- 所有資料模型定義在單一檔案 `models/user.py` 中
- API 路由使用 Flask Blueprint 組織,統一前綴 `/api`
- JWT 認證透過 decorator 實作在各 route 檔案中
- 資料庫使用 SQLite,位於 `src/database/app.db`
- 初次執行會自動建立測試帳號與範例資料

### 前端架構 (React + Vite)

```
alumni-platform/src/
├── App.jsx              # 主應用程式元件,包含所有頁面邏輯與狀態管理
├── main.jsx             # React 入口點
├── components/ui/       # Radix UI + Tailwind 元件庫(47個元件)
├── lib/utils.js         # 工具函式(cn 等)
└── hooks/
    └── use-mobile.js    # 響應式設計 hook
```

**重要設計特徵**:
- **單一檔案應用**: 所有頁面、功能、狀態管理都在 `App.jsx` 中實作(約2000+行)
- **無路由器**: 使用狀態 `currentPage` 控制頁面切換,而非 React Router
- **內建測試資料**: 包含完整的職缺、活動、系友資料等範例
- **本地狀態管理**: 使用 React Hooks (useState, useEffect),無外部狀態庫
- **背景圖片輪播**: 自動切換活動照片作為背景
- **JWT 認證**: Token 儲存在 localStorage,透過 Authorization header 傳送

### UI 設計系統

- **元件庫**: 完整的 Radix UI 元件(shadcn/ui)
- **樣式**: Tailwind CSS v4
- **主題**:
  - `alumni-platform`: 粉紅色漸層背景,RGB 霓虹光暈效果
  - `alumni-platform-bright`: 明亮版本變體
- **響應式**: 支援桌面與行動裝置

## 核心功能模組

1. **系友資料管理**: 註冊/登入、個人檔案(包含職涯資訊、技能)
2. **職缺分享系統**: 發布職缺、交流請求、私訊對話
3. **活動管理**: 活動建立、報名系統、名額管理
4. **公佈欄**: 公告發布、分類(系友會公告/系友動態/學術新知)、置頂功能
5. **私訊系統**: 一對一對話,由職缺交流請求觸發
6. **通知中心**: 即時通知(交流請求、活動報名等)
7. **管理後台**: 系統統計、使用者管理(管理員限定)

## API 規格

- **基礎 URL**: `http://localhost:5001/api`
- **認證**: JWT Bearer Token (透過 `/api/auth/login` 取得)
- **主要端點**: 參考 `api_specification.md` 完整文件

## 測試帳號

| Email | 密碼 | 角色 |
|-------|------|------|
| admin@example.com | admin123 | 管理員 |
| wang@example.com | password123 | 一般用戶(光學工程師) |
| lee@example.com | password123 | 一般用戶(色彩科學研究員) |

## 開發注意事項

### 修改前端邏輯
- 主要邏輯在 `App.jsx`,需注意該檔案較大,建議使用搜尋功能定位特定功能
- 頁面切換透過 `setCurrentPage()` 控制
- API 呼叫使用 `fetch`,需在 `Authorization` header 中加入 JWT token
- 圖片資源位於 `public/` 目錄

### 修改後端 API
- 新增 route 需在 `main.py` 註冊對應的 Blueprint
- 資料模型新增欄位後需刪除舊資料庫 `src/database/app.db` 讓其重新建立
- CORS 已啟用,可跨域存取
- 使用 `@token_required` decorator 保護需要認證的端點

### 設計原則
- 保持 RGB 色彩主題與光學科技的視覺連結
- 卡片式設計語言需保持一致性
- 新增功能應遵循現有的 API 命名規範與回應格式