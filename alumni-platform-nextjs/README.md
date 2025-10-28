# 🎓 校友平台 - Next.js 15 + Mantine 7 重構版

> 現代化的校友互動平台，採用最新的 Next.js 15 和 Mantine 7 框架打造

## ✨ 主要特性

- **🚀 現代化技術棧**
  - Next.js 15 + App Router
  - React 19
  - Mantine 7.17
  - TypeScript 5
  - Tailwind CSS 4

- **🎨 美觀的 UI**
  - Mantine 7 組件庫
  - 響應式設計
  - 深色模式支援
  - 流暢的動畫效果

- **⚡ 優秀的效能**
  - Server Components 優化
  - 智能代碼分割
  - 圖片優化
  - 快速的頁面載入

- **🔒 安全的認證**
  - JWT Token 認證
  - 安全的密碼處理
  - 角色權限管理

## 📦 功能模組

### 1. 認證系統
- ✅ 使用者註冊
- ✅ 登入/登出
- ✅ JWT Token 管理
- ✅ 個人資料管理

### 2. 職缺媒合
- ✅ 職缺列表與搜尋
- ✅ 職缺詳情查看
- ✅ 線上申請
- ✅ 職缺篩選

### 3. 活動管理
- ✅ 活動列表
- ✅ 活動詳情
- ✅ 線上報名
- ✅ 參與人數管理

### 4. 公告系統
- ✅ 公告列表
- ✅ 優先級標記
- ✅ 分類管理

### 5. 訊息系統
- ✅ 對話列表
- ✅ 即時訊息
- ✅ 未讀提醒

## 🛠️ 開發環境設定

### 前置需求

- Node.js ≥ 18.0
- npm 或 pnpm
- Python 3.10+ (後端 API)

### 安裝步驟

1. **安裝前端依賴**
```bash
cd alumni-platform-nextjs
npm install
```

2. **設定環境變數**
```bash
# 複製環境變數範例檔案
cp .env.example .env.local

# 編輯 .env.local，設定後端 API 地址
NEXT_PUBLIC_API_URL=http://localhost:5001
```

3. **啟動後端 API** (在另一個終端)
```bash
cd ../alumni_platform_api
conda activate alumni-platform
python src/main_v2.py
```

4. **啟動前端開發伺服器**
```bash
npm run dev
```

5. **打開瀏覽器**
```
http://localhost:3000
```

## 📁 專案結構

```
alumni-platform-nextjs/
├── src/
│   ├── app/                    # Next.js App Router 頁面
│   │   ├── auth/              # 認證相關頁面
│   │   │   ├── login/         # 登入頁
│   │   │   └── register/      # 註冊頁
│   │   ├── jobs/              # 職缺頁面
│   │   ├── events/            # 活動頁面
│   │   ├── bulletins/         # 公告頁面
│   │   ├── messages/          # 訊息頁面
│   │   ├── layout.tsx         # 根佈局
│   │   └── page.tsx           # 首頁
│   ├── components/            # React 元件
│   │   ├── layout/            # 佈局元件
│   │   └── providers/         # Context Providers
│   ├── lib/                   # 工具函式庫
│   │   ├── api.ts             # API 客戶端
│   │   └── auth.ts            # 認證工具
│   └── theme.ts               # Mantine 主題配置
├── public/                    # 靜態資源
├── next.config.ts             # Next.js 配置
├── tsconfig.json              # TypeScript 配置
└── package.json               # 專案依賴
```

## 🔧 可用指令

```bash
# 開發模式
npm run dev

# 建置正式版本
npm run build

# 啟動正式版本
npm start

# 程式碼檢查
npm run lint
```

## 🌐 API 整合

本專案前端透過 `/src/lib/api.ts` 與 Flask 後端 API 進行通訊。

### API 端點

- `POST /api/v2/auth/login` - 使用者登入
- `POST /api/v2/auth/register` - 使用者註冊
- `GET /api/v2/jobs` - 獲取職缺列表
- `GET /api/v2/events` - 獲取活動列表
- `GET /api/v2/bulletins` - 獲取公告列表
- `GET /api/v2/messages/conversations` - 獲取對話列表

完整 API 文檔請參考：`../alumni_platform_api/API_V2_DOCUMENTATION.md`

## 🎨 Mantine 7 特性

### 主題配置

在 `src/theme.ts` 中自定義主題：

```typescript
import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
  // ... 更多配置
});
```

### 常用組件

- `Container` - 容器佈局
- `Stack` / `Group` - 彈性佈局
- `Card` - 卡片容器
- `Button` - 按鈕
- `TextInput` - 文字輸入
- `Modal` - 對話框
- `Notifications` - 通知系統

## 🚀 部署指南

### 建置專案

```bash
npm run build
```

建置產物位於 `.next` 目錄。

### 環境變數

正式環境需要設定以下環境變數：

```bash
NEXT_PUBLIC_API_URL=https://your-api-domain.com
JWT_SECRET=your-production-secret-key
```

### Vercel 部署

1. 連接 GitHub 儲存庫
2. 選擇 `alumni-platform-nextjs` 作為根目錄
3. 設定環境變數
4. 部署

### 自行部署

```bash
npm run build
npm start
```

## 🐛 故障排除

### 常見問題

**Q: 無法連接到後端 API？**
A: 確認後端服務已啟動，並檢查 `.env.local` 中的 `NEXT_PUBLIC_API_URL` 是否正確。

**Q: 登入後頁面沒有更新？**
A: 清除瀏覽器的 localStorage 並重新登入。

**Q: Mantine 樣式沒有載入？**
A: 確認 `src/components/providers/MantineProvider.tsx` 中已正確匯入 Mantine CSS。

## 📝 開發注意事項

### 程式碼風格

- 使用 TypeScript 進行類型檢查
- 遵循 ESLint 規則
- 使用 'use client' 標記客戶端元件
- 保持元件小而專注

### 效能優化

- 使用 Server Components 作為預設
- 只在需要互動時使用 Client Components
- 適當使用 Next.js Image 組件
- 實作程式碼分割

## 🤝 貢獻指南

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m '✨ Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

本專案採用 MIT 授權 - 詳見 LICENSE 檔案

## 🙏 致謝

- [Next.js](https://nextjs.org/) - React 框架
- [Mantine](https://mantine.dev/) - React 組件庫
- [Vercel](https://vercel.com/) - 部署平台

## 📞 聯絡方式

如有任何問題或建議，歡迎開啟 Issue 或聯繫維護團隊。

---

**Built with ❤️ using Next.js 15 + Mantine 7**
