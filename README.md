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

| 功能 | 說明 |
|------|------|
| 🔐 **使用者管理** | JWT 認證、角色權限、個人資料 |
| 💼 **職缺媒合** | 系友職缺發布、申請、交流 |
| 📅 **活動管理** | 系友會活動報名與簽到 |
| 📢 **公告系統** | 重要訊息發布與分類 |
| 💬 **即時訊息** | 系友間私訊交流 |
| 📊 **管理後台** | 統計數據、用戶管理、內容審核 |
| 📁 **CSV 匯入匯出** | 批量資料管理 |
| 🎨 **現代化 UI** | 響應式設計、深色模式支援 |

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
│   │   ├── lib/              # API 客戶端與工具
│   │   └── hooks/            # 自定義 Hooks
│   └── package.json
│
├── alumni_platform_api/        # Flask 3 後端
│   ├── src/
│   │   ├── main_v2.py        # 應用程式入口
│   │   ├── models_v2/        # SQLAlchemy 模型
│   │   ├── routes/           # API 路由
│   │   └── database/         # 資料庫檔案
│   └── requirements.txt
│
├── docs/                       # 📚 文檔目錄
│   ├── ARCHITECTURE.md        # 系統架構 (含 Mermaid 圖)
│   ├── API_REFERENCE.md       # API 完整參考
│   ├── DATABASE.md            # 資料庫模型文檔
│   └── DEVELOPMENT.md         # 開發指南
│
├── scripts/                    # 腳本目錄
├── csv_samples/                # CSV 範例資料
├── README.md                   # 本文檔
└── CHANGELOG.md               # 更新日誌
```

---

## 🔑 測試帳號

| Email | Password | 角色 | 說明 |
|-------|----------|------|------|
| admin@example.com | admin123 | admin | 系統管理員 |
| wang@example.com | password123 | user | 一般使用者 |
| lee@example.com | password123 | user | 一般使用者 |

---

## 📚 API 端點概覽

### 認證 `/api/v2/auth`
- `POST /login` - 登入
- `POST /register` - 註冊
- `GET /me` - 取得當前使用者

### 職缺 `/api/v2/jobs`
- `GET /` - 取得職缺列表
- `POST /` - 建立職缺
- `GET /:id` - 取得職缺詳情
- `POST /:id/requests` - 申請職缺

### 活動 `/api/v2/events`
- `GET /` - 取得活動列表
- `POST /` - 建立活動
- `POST /:id/register` - 報名活動

### 公告 `/api/v2/bulletins`
- `GET /` - 取得公告列表
- `POST /` - 建立公告

> 完整 API 文檔請參考：[docs/API_REFERENCE.md](docs/API_REFERENCE.md)

---

## 🛠️ 技術棧

### 前端
| 技術 | 版本 | 用途 |
|------|------|------|
| Next.js | 15.0 | React 框架 (App Router) |
| React | 19 | UI 函式庫 |
| Mantine | 7 | UI 元件庫 |
| TypeScript | 5 | 型別安全 |
| Tailwind CSS | 3 | 樣式框架 |

### 後端
| 技術 | 版本 | 用途 |
|------|------|------|
| Flask | 3.x | Web 框架 |
| SQLAlchemy | 2.0+ | ORM |
| PyJWT | 2.x | JWT 認證 |
| SQLite/PostgreSQL | - | 資料庫 |

---

## 🧪 開發指令

### 前端
```bash
pnpm dev          # 啟動開發伺服器
pnpm build        # 建置正式環境
pnpm lint         # 執行 ESLint
pnpm test         # 執行測試
```

### 後端
```bash
python src/main_v2.py    # 啟動開發伺服器
pytest                    # 執行測試
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

## 📖 文檔索引

| 文檔 | 說明 |
|------|------|
| [系統架構](docs/ARCHITECTURE.md) | 系統架構圖、資料流程、部署架構 |
| [API 參考](docs/API_REFERENCE.md) | 完整 API 端點說明與範例 |
| [資料庫文檔](docs/DATABASE.md) | 資料模型、關聯關係、枚舉定義 |
| [開發指南](docs/DEVELOPMENT.md) | 開發環境設定、程式碼規範、Git 流程 |
| [更新日誌](CHANGELOG.md) | 版本更新記錄 |

---

## 🤝 貢獻指南

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m '✨ Add amazing feature'`)
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
