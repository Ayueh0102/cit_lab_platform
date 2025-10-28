# 🎓 校友平台 Alumni Platform

> 基於 Next.js 15 + Mantine 7 + Flask 3 + SQLAlchemy 2.0 打造的現代化校友互動平台

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Mantine](https://img.shields.io/badge/Mantine-7-339af0)](https://mantine.dev/)
[![Flask](https://img.shields.io/badge/Flask-3-green)](https://flask.palletsprojects.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-red)](https://www.sqlalchemy.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

---

## ✨ 功能特色

- 🔐 **使用者管理** - JWT 認證、角色權限
- 💼 **職缺媒合** - 系友職缺發布與申請
- 📅 **活動管理** - 系友會活動報名與簽到
- 📢 **公告系統** - 重要訊息發布
- 💬 **即時訊息** - 系友間私訊交流
- 📊 **數據管理** - CSV 匯入匯出
- 🎨 **現代化 UI** - 響應式設計、深色模式支援

---

## 🚀 快速開始

### 前置需求

- **Node.js** 18+ 
- **Python** 3.10+
- **Conda** (建議)
- **pnpm** (前端套件管理)

### 安裝步驟

#### 1. 克隆專案
```bash
git clone <repository-url>
cd alumni-platform-complete-final
```

#### 2. 後端設定
```bash
# 使用 conda 建立環境
conda create -n alumni-platform python=3.10 -y
conda activate alumni-platform

# 安裝依賴
cd alumni_platform_api
pip install -r requirements.txt

# 啟動後端服務
python src/main_v2.py
```

後端服務運行於：**http://localhost:5001**

#### 3. 前端設定
```bash
# 安裝依賴
cd alumni-platform-nextjs
pnpm install

# 啟動開發伺服器
pnpm dev
```

前端服務運行於：**http://localhost:3000**

---

## 📁 專案結構

```
alumni-platform-complete-final/
├── alumni-platform-nextjs/     # Next.js 15 前端
│   ├── src/
│   │   ├── app/               # App Router 頁面
│   │   ├── components/        # React 元件
│   │   └── lib/              # API 客戶端與工具
│   └── package.json
│
├── alumni_platform_api/        # Flask 3 後端
│   ├── src/
│   │   ├── models_v2/        # SQLAlchemy 模型
│   │   ├── routes/           # API 路由
│   │   └── main_v2.py        # 應用程式入口
│   └── requirements.txt
│
├── README.md                   # 本文檔
└── DATABASE_MODELS_V2_COMPLETE.md  # 資料庫文檔
```

---

## 🔑 測試帳號

| Email | Password | 角色 | 說明 |
|-------|----------|------|------|
| admin@example.com | admin123 | admin | 系統管理員 |
| wang@example.com | password123 | user | 一般使用者 |
| lee@example.com | password123 | user | 一般使用者 |

---

## 📚 API 文檔

### 認證端點
- `POST /api/v2/auth/register` - 註冊
- `POST /api/v2/auth/login` - 登入
- `POST /api/v2/auth/logout` - 登出
- `GET /api/v2/auth/me` - 取得當前使用者資訊

### 職缺端點
- `GET /api/v2/jobs` - 取得職缺列表
- `POST /api/v2/jobs` - 建立職缺
- `GET /api/v2/jobs/:id` - 取得職缺詳情
- `PUT /api/v2/jobs/:id` - 更新職缺
- `DELETE /api/v2/jobs/:id` - 刪除職缺

### 活動端點
- `GET /api/v2/events` - 取得活動列表
- `POST /api/v2/events` - 建立活動
- `POST /api/v2/events/:id/register` - 報名活動

完整 API 文檔請參考：[API_V2_DOCUMENTATION.md](alumni_platform_api/API_V2_DOCUMENTATION.md)

---

## 🛠️ 技術棧

### 前端
- **Framework**: Next.js 15.0 (App Router)
- **UI Library**: Mantine 7
- **Runtime**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Mantine CSS-in-JS
- **Build Tool**: Turbopack

### 後端
- **Framework**: Flask 3.x
- **ORM**: SQLAlchemy 2.0+
- **Database**: SQLite (開發) / PostgreSQL (生產)
- **Authentication**: PyJWT
- **API**: RESTful (`/api/v2/*`)

---

## 🗄️ 資料庫

### 主要資料表
- `users_v2` - 使用者帳號
- `user_profiles_v2` - 使用者檔案
- `jobs_v2` - 職缺資訊
- `events_v2` - 活動資訊
- `bulletins_v2` - 公告資訊
- `conversations_v2` - 對話
- `messages_v2` - 訊息

完整資料庫結構請參考：[DATABASE_MODELS_V2_COMPLETE.md](DATABASE_MODELS_V2_COMPLETE.md)

---

## 🧪 開發指令

### 前端
```bash
pnpm dev          # 啟動開發伺服器
pnpm build        # 建置正式環境
pnpm lint         # 執行 ESLint
pnpm type-check   # TypeScript 型別檢查
```

### 後端
```bash
python src/main_v2.py              # 啟動開發伺服器
python -m pytest                    # 執行測試 (待實作)
```

---

## 📝 環境變數

### 前端 (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### 後端 (`.env`)
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///database/app_v2.db
JWT_SECRET_KEY=your-jwt-secret-here
```

---

## 🤝 貢獻指南

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

---

## 📄 授權

本專案採用 MIT License

---

## 👥 聯絡方式

如有問題或建議，請開啟 Issue 或聯繫專案維護者。

---

**Made with ❤️ by Alumni Platform Team**
