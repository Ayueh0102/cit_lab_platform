# 🛠️ 開發指南

> 校友平台開發環境設定與開發流程說明

---

## 📋 前置需求

| 工具 | 版本 | 說明 |
|------|------|------|
| Node.js | 18+ | JavaScript 執行環境 |
| Python | 3.10+ | Python 執行環境 |
| Conda | 最新版 | Python 環境管理 (建議) |
| pnpm | 最新版 | 前端套件管理 |
| Git | 最新版 | 版本控制 |

---

## 🚀 快速開始

### 1. 克隆專案

```bash
git clone <repository-url>
cd alumni-platform-complete-final
```

### 2. 後端設定

```bash
# 建立 Conda 環境
conda create -n alumni-platform python=3.10 -y
conda activate alumni-platform

# 安裝依賴
cd alumni_platform_api
pip install -r requirements.txt

# 啟動後端服務
python src/main_v2.py
```

後端服務運行於：**http://localhost:5001**

### 3. 前端設定

```bash
# 安裝依賴
cd alumni-platform-nextjs
pnpm install

# 啟動開發伺服器
pnpm dev
```

前端服務運行於：**http://localhost:3000**

### 4. 使用快速啟動腳本

```bash
# 同時啟動前後端
./scripts/dev_up.sh

# 停止所有服務
./scripts/dev_down.sh
```

---

## 📁 專案結構

```
alumni-platform-complete-final/
├── alumni-platform-nextjs/     # Next.js 15 前端
│   ├── src/
│   │   ├── app/               # App Router 頁面
│   │   ├── components/        # React 元件
│   │   ├── lib/              # 工具函式
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
├── docs/                       # 文檔目錄
│   ├── ARCHITECTURE.md        # 系統架構
│   ├── API_REFERENCE.md       # API 參考
│   ├── DATABASE.md            # 資料庫文檔
│   └── DEVELOPMENT.md         # 開發指南 (本文件)
│
├── scripts/                    # 腳本目錄
│   ├── dev_up.sh              # 啟動開發環境
│   ├── dev_down.sh            # 停止開發環境
│   └── start_backend_conda.sh # 啟動後端 (Conda)
│
├── csv_samples/                # CSV 範例資料
├── _deprecated/                # 已棄用文件
├── README.md                   # 專案說明
└── CHANGELOG.md               # 更新日誌
```

---

## 🔧 開發指令

### 前端指令

```bash
cd alumni-platform-nextjs

pnpm dev          # 啟動開發伺服器
pnpm build        # 建置正式環境
pnpm start        # 啟動正式環境
pnpm lint         # 執行 ESLint 檢查
pnpm test         # 執行測試
```

### 後端指令

```bash
cd alumni_platform_api
conda activate alumni-platform

python src/main_v2.py          # 啟動開發伺服器
pytest                          # 執行測試
pytest --cov=src               # 執行測試 + 覆蓋率
```

---

## 🔑 測試帳號

| Email | Password | 角色 | 說明 |
|-------|----------|------|------|
| admin@example.com | admin123 | admin | 系統管理員 |
| wang@example.com | password123 | user | 一般使用者 |
| lee@example.com | password123 | user | 一般使用者 |

---

## 📝 環境變數

### 前端 `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

### 後端 `.env`

```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///database/app_v2.db
JWT_SECRET_KEY=your-jwt-secret-here
FLASK_ENV=development
```

---

## 🎨 程式碼規範

### 前端規範

- **命名規範**: 元件使用 PascalCase，函式/變數使用 camelCase
- **React 模式**: 優先使用函式元件與 Hooks
- **API 整合**: 所有 API 呼叫必須透過 `src/lib/api.ts`
- **錯誤處理**: 使用 try-catch，提供適當的 UI 回饋
- **樣式**: 使用 Tailwind CSS 和 Mantine 元件

### 後端規範

- **命名規範**: 函式/變數使用 snake_case，類別使用 PascalCase
- **Blueprint 組織**: 路由使用 Blueprint，命名格式 `<feature>_bp`
- **RESTful API**: 遵循 REST 設計原則
- **錯誤處理**: 統一的錯誤回應格式

---

## 🔄 Git 工作流程

### 分支策略

```
main          # 主分支 (穩定版本)
├── develop   # 開發分支
├── feature/* # 功能分支
├── bugfix/*  # 修復分支
└── release/* # 發布分支
```

### Commit 訊息規範

使用 Emoji 前綴：

| Emoji | 類型 | 說明 |
|-------|------|------|
| ✨ | feat | 新功能 |
| 🐛 | fix | 修復 Bug |
| 📝 | docs | 文檔更新 |
| ♻️ | refactor | 重構 |
| ✅ | test | 測試 |
| 🎨 | style | 樣式調整 |
| 🔧 | chore | 雜項 |

**範例**:
```bash
git commit -m "✨ Add job search filters"
git commit -m "🐛 Fix event registration bug"
git commit -m "📝 Update API documentation"
```

---

## 🐛 除錯技巧

### 前端除錯

1. **瀏覽器開發者工具**
   - Console: 查看錯誤訊息
   - Network: 檢查 API 請求
   - React DevTools: 檢查元件狀態

2. **常見問題**
   - Hydration 錯誤: 檢查 `'use client'` 指令
   - API 錯誤: 檢查 Token 是否有效

### 後端除錯

1. **查看日誌**
   ```bash
   tail -f backend.log
   ```

2. **API 測試**
   ```bash
   # 使用 curl 測試
   curl http://localhost:5001/api/v2/jobs
   
   # 使用 httpie
   http GET localhost:5001/api/v2/jobs
   ```

3. **資料庫檢查**
   - 使用 SQLite 瀏覽器工具
   - 檔案位置: `src/database/app_v2.db`

---

## 📦 新增依賴

### 前端

```bash
cd alumni-platform-nextjs
pnpm add <package-name>
pnpm add -D <dev-package-name>
```

### 後端

```bash
cd alumni_platform_api
conda activate alumni-platform
pip install <package-name>
pip freeze > requirements.txt
```

---

## 🚀 部署準備

### 前端建置

```bash
cd alumni-platform-nextjs
pnpm build
```

### 後端準備

1. 設定生產環境變數
2. 切換到 PostgreSQL
3. 使用 gunicorn 或 uWSGI

```bash
# 生產環境啟動
gunicorn -w 4 -b 0.0.0.0:5001 'src.main_v2:app'
```

---

## ❓ 常見問題

### Q: 後端無法啟動？

1. 確認 Conda 環境已啟動
2. 確認依賴已安裝
3. 檢查 Port 5001 是否被佔用

```bash
lsof -i :5001
kill -9 <PID>
```

### Q: 前端 API 請求失敗？

1. 確認後端服務已啟動
2. 檢查 CORS 設定
3. 確認 Token 是否有效

### Q: 資料庫遷移問題？

```bash
# 重新初始化資料庫
cd alumni_platform_api
rm src/database/app_v2.db
python src/main_v2.py
```

---

## 📚 相關文檔

- [系統架構](./ARCHITECTURE.md)
- [API 參考](./API_REFERENCE.md)
- [資料庫文檔](./DATABASE.md)
- [更新日誌](../CHANGELOG.md)

---

**文檔版本**: 2.0  
**最後更新**: 2025-11-25

