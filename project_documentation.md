# 色彩與照明科技研究所系友會社群平台

## 專案概述

本專案為色彩與照明科技研究所設計開發的完整系友會社群平台，採用現代化的全端技術架構，提供豐富的功能模組和優雅的RGB主題視覺設計。

## 主要功能特色

### 🎯 核心功能模組

1. **職缺分享系統**
   - 系友可發布職缺資訊
   - 其他系友可申請交流請求
   - 系統自動建立對話機制
   - 支援聯絡資訊交換

2. **活動申請管理**
   - 活動建立與管理
   - 線上報名系統
   - 容量控制與截止日期
   - 參與者名單管理

3. **系友名錄管理**
   - 完整的系友資料庫
   - 個人檔案管理
   - LinkedIn 資料同步（預留介面）
   - 隱私設定控制

4. **公佈欄系統**
   - 系友會公告發布
   - 置頂功能
   - 分類管理
   - 內容編輯與管理

5. **私訊通訊系統**
   - 一對一私訊功能
   - 對話歷史記錄
   - 系統通知機制

### 🎨 設計特色

- **RGB 主題視覺設計**：採用紅、綠、藍三原色為主要色彩，搭配深色背景
- **霓虹光暈效果**：現代化的視覺特效，提升使用體驗
- **響應式設計**：支援桌面和行動裝置
- **直觀的使用者介面**：清晰的導航和互動設計

## 技術架構

### 前端技術
- **React 18**：現代化的前端框架
- **Vite**：快速的建置工具
- **Tailwind CSS**：實用優先的CSS框架
- **Lucide Icons**：現代化圖示庫

### 後端技術
- **Flask**：輕量級Python網頁框架
- **SQLAlchemy**：ORM資料庫操作
- **SQLite**：輕量級資料庫
- **JWT**：安全的身份驗證機制
- **Flask-CORS**：跨域資源共享支援

### 資料庫設計
- 使用者管理（Users, Profiles）
- 職缺系統（Jobs, JobRequests）
- 活動管理（Events, EventRegistrations）
- 公佈欄（Bulletins）
- 訊息系統（Conversations, Messages）

## 專案結構

```
├── alumni-platform/                 # React 前端專案
│   ├── src/
│   │   ├── App.jsx                 # 主要應用程式元件
│   │   ├── App.css                 # 主要樣式檔案
│   │   └── index.html              # HTML 模板
│   └── dist/                       # 建置輸出目錄
│
├── alumni_platform_api/             # Flask 後端專案
│   ├── src/
│   │   ├── models/
│   │   │   └── user.py             # 資料庫模型
│   │   ├── routes/
│   │   │   ├── auth.py             # 認證路由
│   │   │   ├── user.py             # 使用者路由
│   │   │   ├── jobs.py             # 職缺路由
│   │   │   ├── events.py           # 活動路由
│   │   │   ├── bulletins.py        # 公佈欄路由
│   │   │   └── messages.py         # 訊息路由
│   │   ├── static/                 # 前端靜態檔案
│   │   ├── database/
│   │   │   └── app.db              # SQLite 資料庫
│   │   └── main.py                 # Flask 主程式
│   ├── venv/                       # Python 虛擬環境
│   └── requirements.txt            # Python 依賴套件
│
└── 專案文件/
    ├── alumni_platform_specification.md  # 需求規格書
    ├── database_schema.mmd               # 資料庫ERD
    ├── api_specification.md              # API規格文件
    └── ui_ux_design.md                   # UI/UX設計文件
```

## 安裝與部署指南

### 本地開發環境設置

#### 1. 後端設置
```bash
cd alumni_platform_api
source venv/bin/activate
pip install -r requirements.txt
python src/main.py
```

#### 2. 前端開發（可選）
```bash
cd alumni-platform
pnpm install
pnpm run dev
```

### 生產環境部署

#### 方法一：使用 Manus 部署工具
```bash
# 在 alumni_platform_api 目錄下執行
manus deploy-backend flask .
```

#### 方法二：手動部署
1. 建置前端：`cd alumni-platform && pnpm run build`
2. 複製前端檔案：`cp -r dist/* ../alumni_platform_api/src/static/`
3. 部署 Flask 應用程式到雲端服務

## 預設測試帳號

系統已預設建立以下測試帳號：

| 帳號 | 密碼 | 角色 | 說明 |
|------|------|------|------|
| admin@example.com | admin123 | 管理員 | 系統管理員帳號 |
| wang@example.com | password123 | 系友 | 2020年畢業，ASUS光學工程師 |
| lee@example.com | password123 | 系友 | 2019年畢業，MediaTek色彩科學研究員 |

## API 端點說明

### 認證相關
- `POST /api/register` - 使用者註冊
- `POST /api/login` - 使用者登入
- `GET /api/me` - 取得當前使用者資訊

### 職缺管理
- `GET /api/jobs` - 取得職缺列表
- `POST /api/jobs` - 建立新職缺
- `POST /api/jobs/{id}/request` - 申請職缺交流

### 活動管理
- `GET /api/events` - 取得活動列表
- `POST /api/events` - 建立新活動
- `POST /api/events/{id}/register` - 報名活動

### 系友名錄
- `GET /api/users` - 取得系友列表
- `GET /api/users/search` - 搜尋系友
- `PUT /api/users/me/profile` - 更新個人檔案

### 公佈欄
- `GET /api/bulletins` - 取得公告列表
- `POST /api/bulletins` - 發布新公告

### 訊息系統
- `GET /api/conversations` - 取得對話列表
- `GET /api/conversations/{id}` - 取得對話訊息
- `POST /api/conversations/{id}` - 發送訊息

## 功能展示

### 主要畫面
1. **首頁儀表板**：顯示最新職缺、即將到來的活動、活躍系友統計
2. **職缺分享頁面**：職缺列表、發布職缺、申請交流功能
3. **活動列表頁面**：活動資訊、報名功能、活動管理
4. **系友名錄頁面**：系友搜尋、個人檔案瀏覽
5. **公佈欄頁面**：系友會公告、學術新知、系友動態
6. **個人檔案頁面**：資料編輯、隱私設定、LinkedIn同步

### 特色功能
- **智慧職缺交流**：系統化的職缺分享與交流申請流程
- **活動管理系統**：完整的活動建立、報名、管理功能
- **隱私保護機制**：使用者可控制個人資訊的可見度
- **即時通訊功能**：支援系友間的私訊交流

## 未來擴展計畫

1. **LinkedIn API 整合**：實現真實的 LinkedIn 資料同步
2. **推播通知系統**：重要訊息的即時推播
3. **行動應用程式**：開發 iOS/Android 原生應用
4. **進階搜尋功能**：更精確的系友搜尋與篩選
5. **活動直播功能**：支援線上活動直播
6. **檔案分享系統**：支援文件、簡報等檔案分享

## 技術支援

如需技術支援或功能建議，請聯繫開發團隊或透過系友會官方管道反映。

---

**開發完成日期**：2025年9月30日  
**版本**：v1.0.0  
**開發者**：Manus AI 系統
