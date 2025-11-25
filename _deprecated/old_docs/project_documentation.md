# 📘 校友平台專案文檔

## 📖 目錄

1. [架構概述](#架構概述)
2. [技術棧](#技術棧)
3. [開發環境設定](#開發環境設定)
4. [專案結構](#專案結構)
5. [API 端點](#api-端點)
6. [資料庫模型](#資料庫模型)
7. [開發流程](#開發流程)
8. [部署指南](#部署指南)

---

## 架構概述

本專案採用前後端分離架構：

- **前端**: Next.js 15 (App Router) + Mantine 7 + TypeScript
- **後端**: Flask 3 + SQLAlchemy 2.0 + SQLite/PostgreSQL
- **通訊**: RESTful API (JSON)
- **認證**: JWT Token

```
┌─────────────────┐      HTTP/JSON      ┌─────────────────┐
│   Next.js App   │ ◄──────────────────► │   Flask API     │
│  (Port 3000)    │                      │  (Port 5001)    │
└─────────────────┘                      └────────┬────────┘
                                                  │
                                         ┌────────▼────────┐
                                         │   SQLite DB     │
                                         └─────────────────┘
```

---

## 技術棧

### 前端技術
- **Next.js 15.0** - React 框架 (App Router)
- **React 19** - UI 函式庫
- **Mantine 7** - UI 元件庫
- **TypeScript** - 型別安全
- **Tailwind CSS** - 樣式框架
- **Turbopack** - 建置工具

### 後端技術
- **Flask 3.x** - Python 微框架
- **SQLAlchemy 2.0+** - ORM
- **PyJWT** - JWT 認證
- **Flask-CORS** - 跨域支援
- **SQLite** - 資料庫 (開發環境)

---

## 開發環境設定

### 1. 後端設定

```bash
# 建立 Conda 環境
conda create -n alumni-platform python=3.10 -y
conda activate alumni-platform

# 安裝依賴
cd alumni_platform_api
pip install -r requirements.txt

# 初始化資料庫 (自動執行種子資料)
python src/main_v2.py
```

### 2. 前端設定

```bash
# 安裝 pnpm (如果尚未安裝)
npm install -g pnpm

# 安裝依賴
cd alumni-platform-nextjs
pnpm install

# 啟動開發伺服器
pnpm dev
```

### 3. 快速啟動

```bash
# 後端
cd alumni_platform_api
conda activate alumni-platform
python src/main_v2.py

# 前端 (新終端機)
cd alumni-platform-nextjs
pnpm dev
```

---

## 專案結構

### 前端結構
```
alumni-platform-nextjs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # 根佈局
│   │   ├── page.tsx           # 首頁
│   │   ├── auth/              # 認證頁面
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── jobs/              # 職缺頁面
│   │   ├── events/            # 活動頁面
│   │   ├── bulletins/         # 公告頁面
│   │   └── messages/          # 訊息頁面
│   ├── components/            # React 元件
│   │   ├── layout/           # 佈局元件
│   │   └── providers/        # Context Providers
│   ├── lib/                   # 工具函式
│   │   ├── api.ts            # API 客戶端
│   │   └── auth.ts           # 認證工具
│   └── theme.ts              # Mantine 主題
├── public/                    # 靜態資源
└── package.json              # 依賴管理
```

### 後端結構
```
alumni_platform_api/
├── src/
│   ├── main_v2.py            # 應用程式入口
│   ├── models_v2/            # 資料模型
│   │   ├── user_auth.py     # 使用者與認證
│   │   ├── jobs.py          # 職缺相關
│   │   ├── events.py        # 活動相關
│   │   ├── content.py       # 公告相關
│   │   ├── messages.py      # 訊息相關
│   │   ├── career.py        # 職涯相關
│   │   └── system.py        # 系統相關
│   ├── routes/               # API 路由
│   │   ├── auth_v2.py       # 認證端點
│   │   ├── jobs_v2.py       # 職缺端點
│   │   ├── events_v2.py     # 活動端點
│   │   ├── bulletins_v2.py  # 公告端點
│   │   ├── messages_v2.py   # 訊息端點
│   │   └── csv_import_export.py  # CSV 功能
│   └── database/            # 資料庫檔案
│       └── app_v2.db        # SQLite 資料庫
└── requirements.txt         # Python 依賴
```

---

## API 端點

### 認證 API (`/api/v2/auth/*`)
| 方法 | 端點 | 說明 | 需要認證 |
|------|------|------|---------|
| POST | `/api/v2/auth/register` | 註冊新使用者 | ❌ |
| POST | `/api/v2/auth/login` | 使用者登入 | ❌ |
| POST | `/api/v2/auth/logout` | 使用者登出 | ✅ |
| GET | `/api/v2/auth/me` | 取得當前使用者 | ✅ |
| PUT | `/api/v2/auth/profile` | 更新個人檔案 | ✅ |

### 職缺 API (`/api/v2/jobs/*`)
| 方法 | 端點 | 說明 | 需要認證 |
|------|------|------|---------|
| GET | `/api/v2/jobs` | 取得職缺列表 | ❌ |
| GET | `/api/v2/jobs/:id` | 取得職缺詳情 | ❌ |
| POST | `/api/v2/jobs` | 建立職缺 | ✅ |
| PUT | `/api/v2/jobs/:id` | 更新職缺 | ✅ |
| DELETE | `/api/v2/jobs/:id` | 刪除職缺 | ✅ |
| POST | `/api/v2/jobs/:id/requests` | 申請職缺 | ✅ |

### 活動 API (`/api/v2/events/*`)
| 方法 | 端點 | 說明 | 需要認證 |
|------|------|------|---------|
| GET | `/api/v2/events` | 取得活動列表 | ❌ |
| GET | `/api/v2/events/:id` | 取得活動詳情 | ❌ |
| POST | `/api/v2/events` | 建立活動 | ✅ |
| PUT | `/api/v2/events/:id` | 更新活動 | ✅ |
| DELETE | `/api/v2/events/:id` | 刪除活動 | ✅ |
| POST | `/api/v2/events/:id/register` | 報名活動 | ✅ |

### 公告 API (`/api/v2/bulletins/*`)
| 方法 | 端點 | 說明 | 需要認證 |
|------|------|------|---------|
| GET | `/api/v2/bulletins` | 取得公告列表 | ❌ |
| GET | `/api/v2/bulletins/:id` | 取得公告詳情 | ❌ |
| POST | `/api/v2/bulletins` | 建立公告 | ✅ (admin) |
| PUT | `/api/v2/bulletins/:id` | 更新公告 | ✅ (admin) |
| DELETE | `/api/v2/bulletins/:id` | 刪除公告 | ✅ (admin) |

### 訊息 API (`/api/v2/conversations/*`)
| 方法 | 端點 | 說明 | 需要認證 |
|------|------|------|---------|
| GET | `/api/v2/conversations` | 取得對話列表 | ✅ |
| POST | `/api/v2/conversations` | 建立新對話 | ✅ |
| GET | `/api/v2/conversations/:id/messages` | 取得訊息列表 | ✅ |

完整 API 文檔：[API_V2_DOCUMENTATION.md](alumni_platform_api/API_V2_DOCUMENTATION.md)

---

## 資料庫模型

### 核心模型

#### User (使用者)
- `id` - 主鍵
- `email` - 電子郵件 (唯一)
- `password_hash` - 密碼雜湊
- `role` - 角色 (admin/user)
- `status` - 狀態 (active/inactive/banned)

#### UserProfile (使用者檔案)
- `id` - 主鍵
- `user_id` - 外鍵 → User
- `full_name` - 全名
- `display_name` - 顯示名稱
- `graduation_year` - 畢業年份
- `current_company` - 目前公司
- `current_position` - 目前職位

#### Job (職缺)
- `id` - 主鍵
- `user_id` - 發布者 ID (外鍵 → User)
- `title` - 職缺標題
- `company` - 公司名稱
- `location` - 工作地點
- `salary_range` - 薪資範圍
- `status` - 狀態 (active/filled/closed)

#### Event (活動)
- `id` - 主鍵
- `organizer_id` - 主辦者 ID (外鍵 → User)
- `title` - 活動標題
- `start_time` - 開始時間
- `end_time` - 結束時間
- `location` - 活動地點
- `capacity` - 容納人數

完整資料庫文檔：[DATABASE_MODELS_V2_COMPLETE.md](DATABASE_MODELS_V2_COMPLETE.md)

---

## 開發流程

### 1. 功能開發流程
1. 建立新分支 `feature/功能名稱`
2. 開發功能
3. 測試功能
4. 提交 Pull Request
5. Code Review
6. 合併至 main

### 2. Git Commit 規範
```bash
# 格式
<type>: <subject>

# 範例
feat: 新增職缺篩選功能
fix: 修復登入頁面錯誤
docs: 更新 API 文檔
style: 調整按鈕樣式
refactor: 重構使用者模型
```

### 3. 測試流程
- 前端：`pnpm lint` (ESLint 檢查)
- 後端：手動測試 API 端點
- 使用測試帳號驗證功能

### 4. 部署流程
```bash
# 前端建置
cd alumni-platform-nextjs
pnpm build

# 後端部署
# 使用 gunicorn 或其他 WSGI 伺服器
```

---

## 部署指南

### 環境變數設定

#### 前端 `.env.production`
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

#### 後端 `.env`
```env
SECRET_KEY=your-production-secret-key
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET_KEY=your-jwt-secret
FLASK_ENV=production
```

### 生產環境建議
- 使用 PostgreSQL 替代 SQLite
- 啟用 HTTPS
- 設定反向代理 (Nginx)
- 使用環境變數管理機密
- 定期備份資料庫

---

## 📞 支援

如有問題或建議，請開啟 Issue 或聯繫開發團隊。

---

**Last Updated:** 2025-10-28
