# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

這是一個使用 Next.js 15 + Mantine 7 + Flask 3 + SQLAlchemy 2.0 構建的校友互動平台，採用前後端分離架構。專案已完成 V2 重構，使用新的 API 端點 (`/api/v2/*`) 和資料模型 (`models_v2`)。

## 快速啟動指令

### 後端服務 (Flask API)
```bash
# 使用 conda 環境
cd alumni_platform_api
conda activate alumni-platform  # 或建立新環境: conda create -n alumni-platform python=3.10
python src/main_v2.py          # 啟動後端 (http://localhost:5001)
```

### 前端服務 (Next.js)
```bash
cd alumni-platform-nextjs
pnpm install                   # 首次或更新依賴後執行
pnpm dev                       # 啟動開發伺服器 (http://localhost:3000)
pnpm build                     # 建置正式環境
pnpm lint                      # ESLint 檢查
pnpm type-check                # TypeScript 型別檢查
pnpm test                      # 執行測試
```

## 核心架構

### 前端架構 (alumni-platform-nextjs/)
- **Framework**: Next.js 15 (App Router)
- **UI Library**: Mantine 7
- **Runtime**: React 19
- **Styling**: Tailwind CSS + Mantine CSS-in-JS
- **API Client**: `src/lib/api.ts` - 所有後端通訊的統一入口
- **主要頁面**:
  - 認證: `/auth/login`, `/auth/register`
  - 職缺: `/jobs`, `/jobs/[id]`, `/jobs/create`, `/jobs/my`
  - 活動: `/events`, `/events/[id]`, `/events/create`
  - 公告: `/bulletins`, `/bulletins/[id]`
  - 訊息: `/messages`, `/messages/[id]`
  - 個人檔案: `/profile`, `/career`
  - 管理: `/admin`, `/cms`

### 後端架構 (alumni_platform_api/)
- **Framework**: Flask 3.x
- **ORM**: SQLAlchemy 2.0+
- **Database**: SQLite (開發) / PostgreSQL (生產)
- **Authentication**: JWT (PyJWT)
- **Real-time**: Flask-SocketIO
- **入口點**: `src/main_v2.py`
- **路由模組** (src/routes/):
  - `auth_v2.py` - 認證與授權 (`/api/v2/auth/*`)
  - `jobs_v2.py` - 職缺管理 (`/api/v2/jobs/*`)
  - `events_v2.py` - 活動管理 (`/api/v2/events/*`)
  - `bulletins_v2.py` - 公告系統 (`/api/v2/bulletins/*`)
  - `messages_v2.py` - 私訊系統 (`/api/v2/messages/*`)
  - `career.py` - 職涯檔案 (`/api/career/*`)
  - `admin_v2.py` - 管理功能 (`/api/v2/admin/*`)
  - `cms_v2.py` - 內容管理 (`/api/v2/cms/*`)
  - `search_v2.py` - 全文搜索 (`/api/v2/search/*`)
  - `notifications.py` - 通知系統 (`/api/notifications/*`)
  - `csv_import_export.py` - CSV 匯入匯出 (`/api/csv/*`)
  - `websocket.py` - WebSocket 即時通訊

### 資料模型架構 (src/models_v2/)
所有資料模型繼承自 `base.py` 的 `db.Model`，主要模型包括：
- **使用者系統**: `User`, `UserProfile`, `UserSession` (user_auth.py)
- **職涯系統**: `WorkExperience`, `Education`, `Skill`, `UserSkill` (career.py)
- **職缺系統**: `Job`, `JobCategory`, `JobRequest` (jobs.py)
- **活動系統**: `Event`, `EventCategory`, `EventRegistration` (events.py)
- **內容系統**: `Bulletin`, `BulletinCategory`, `BulletinComment`, `Article` (content.py)
- **訊息系統**: `Conversation`, `Message` (messages.py)
- **系統設定**: `Notification`, `SystemSetting` (system.py)

完整資料庫架構請參考 `DATABASE_MODELS_V2_COMPLETE.md`。

## 開發規範

### 前端開發規範
- **命名規範**: 元件使用 PascalCase，函式/變數使用 camelCase
- **React 模式**: 優先使用函式元件與 Hooks
- **API 整合**: 所有 API 呼叫必須透過 `src/lib/api.ts`
- **錯誤處理**: 使用 try-catch，提供適當的 UI 回饋
- **樣式**: 使用 Tailwind CSS 和 Mantine 元件，避免 inline styles
- **型別安全**: 使用 TypeScript，所有 API 回應需定義介面

### 後端開發規範
- **命名規範**: 函式/變數使用 snake_case，類別使用 PascalCase
- **Blueprint 組織**: 路由使用 Blueprint，命名格式 `<feature>_bp`
- **RESTful API**:
  - GET: 查詢資料
  - POST: 建立資源
  - PUT/PATCH: 更新資源
  - DELETE: 刪除資源
- **HTTP 狀態碼**: 200 (成功), 201 (已建立), 400 (錯誤請求), 401 (未授權), 403 (禁止), 404 (找不到), 500 (伺服器錯誤)
- **錯誤回應格式**: `{"error": "錯誤描述", "details": {...}}`
- **安全性**: 密碼加密、JWT 驗證、環境變數存放機密

### JWT 認證流程
1. 登入 `POST /api/v2/auth/login` 取得 token
2. 後續請求在 Header 帶入: `Authorization: Bearer <token>`
3. 使用 `@token_required` decorator 保護需要認證的路由

### 資料庫操作原則
- 使用 SQLAlchemy ORM，避免 N+1 查詢問題
- 使用 `joinedload` 或 `subqueryload` 優化關聯查詢
- 事務管理: `db.session.commit()` 成功後提交，錯誤時 `db.session.rollback()`
- 軟刪除: 使用 `is_deleted` 欄位，不直接刪除資料

## 測試與除錯

### 測試帳號
| Email | Password | 角色 |
|-------|----------|------|
| admin@example.com | admin123 | admin |
| wang@example.com | password123 | user |
| lee@example.com | password123 | user |

### 除錯工具
- **前端**: 瀏覽器開發者工具 (Console, Network)
- **後端**: 查看 `backend-dev.log` 日誌
- **API 測試**: Postman 或 curl
- **資料庫**: SQLite 瀏覽器工具檢視 `src/database/app_v2.db`

## Git 工作流程

### Commit 訊息規範
- 使用 Emoji 前綴: ✨ (新功能), 🐛 (修復), 📝 (文檔), ♻️ (重構), ✅ (測試), 🎨 (樣式)
- 格式: `<emoji> <簡短描述>`
- 範例: `✨ Add job search filters`, `🐛 Fix event registration bug`

### Pull Request 要求
- 說明變更範圍 (受影響的路由/元件)
- 資料庫結構變更需特別註明
- UI 變更附上截圖
- 包含測試步驟

## 重要注意事項

### 環境變數
- 前端 `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:5001`
- 後端 `.env`: `SECRET_KEY`, `JWT_SECRET_KEY`, `DATABASE_URL`

### 常見陷阱
- **不要直接編輯**: `dist/` 或 `alumni_platform_api/static/` (自動生成)
- **資料庫遷移**: 更改模型後需重新初始化或執行遷移
- **依賴更新**: 更新後記得同步 `requirements.txt` 或 `package.json`
- **API 版本**: 新開發使用 `/api/v2/*` 端點，避免使用舊版 `/api/*`
- **Token 過期**: JWT token 有過期時間，需處理 401 錯誤並重新登入

### 效能考量
- 前端大型列表使用分頁或虛擬化
- 適當使用 React.memo, useMemo, useCallback
- 後端使用 joinedload 避免 N+1 查詢
- 批次處理大量資料操作

## 參考文檔
- `README.md` - 快速開始與基本說明
- `DATABASE_MODELS_V2_COMPLETE.md` - 資料庫完整文檔
- `alumni_platform_api/API_V2_DOCUMENTATION.md` - API 規格說明
- `.cursor/rules/` - 詳細開發規範 (Cursor IDE 專用)
