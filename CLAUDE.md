# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

校友互動平台，前後端分離架構。

- **前端**: Next.js 16 (App Router) + React 19 + Mantine 7 + TypeScript 5 + Tailwind CSS 4
- **後端**: Flask 3 + SQLAlchemy 2.0 + Flask-SocketIO
- **資料庫**: SQLite (開發) / PostgreSQL (生產)
- **認證**: JWT Token（存於 localStorage `auth_token` key）
- **Python 環境**: Conda（環境名稱: `alumni-platform`, Python 3.10）

## 開發指令

### 啟動/停止

```bash
./scripts/dev_up.sh          # 同時啟動前後端（前端 :3000, 後端 :5001）
./scripts/dev_down.sh        # 停止所有服務
```

### 前端（在 `alumni-platform-nextjs/` 目錄下）

```bash
pnpm dev                     # 開發伺服器
pnpm build                   # 建置
pnpm lint                    # ESLint
pnpm type-check              # TypeScript 型別檢查
pnpm test                    # Jest 測試
pnpm test:watch              # 測試監聽模式
pnpm test:coverage           # 測試覆蓋率
```

### 後端（在 `alumni_platform_api/` 目錄下）

```bash
conda activate alumni-platform
python src/main_v2.py        # 啟動（自動建立 DB + seed）
pytest                       # 測試
pytest tests/test_auth.py    # 單一測試檔
pytest --cov                 # 測試覆蓋率
```

### 資料庫

```bash
./scripts/backup_db.sh       # 備份
./scripts/restore_db.sh      # 還原
# 重置 DB：刪除 alumni_platform_api/src/database/app_v2.db 後重啟後端即自動重建
```

## 架構重點

### 前端架構

- **所有 API 呼叫必須透過 `src/lib/api.ts`**，使用相對路徑（如 `/api/v2/jobs`），由 `next.config.ts` rewrites 代理到後端，避免 CORS
- **UI 框架是 Mantine 7**，不是 shadcn/ui。使用 `@mantine/core`, `@mantine/form`, `@mantine/hooks`, `@mantine/notifications`, `@mantine/dates`
- **樣式**: 混合使用 Mantine props 和 Tailwind CSS utilities
- **圖示**: `@tabler/icons-react`（如 `<IconUser size={20} />`）
- **富文本編輯器**: Tiptap（`@tiptap/react` + 多種 extensions）
- **日期處理**: dayjs
- **即時通訊**: socket.io-client
- **Theme 配置**: `src/theme.ts`，使用 `createTheme` from `@mantine/core`
- 401 回應會自動清除 localStorage 並跳轉到 `/auth/login`

### 後端架構

- **入口點**: `alumni_platform_api/src/main_v2.py`（Flask app + SocketIO + DB init + seed）
- **Blueprint 路由**: 所有路由在 `src/routes/`，命名 `<feature>_v2_bp`，但注意 **API 路徑並非全部統一**：
  - `/api/v2/*`: auth, jobs, events, bulletins, messages, admin, cms, search
  - `/api/career/*`: 職涯相關
  - `/api/notifications/*`, `/api/system/*`, `/api/files/*`, `/api/activities/*`: 通知/系統/檔案
  - `/api/csv/*`: CSV 匯入匯出
- **ORM 模型**: `src/models_v2/`，所有模型繼承 `db.Model`，必要欄位 `id`, `created_at`, `updated_at`，軟刪除用 `is_deleted`
- **JWT 認證**: 後端用 `@token_required` 裝飾器保護路由
- **WebSocket**: Flask-SocketIO，配置於 `routes/websocket.py`

### API 回應格式

```json
// 成功（單一）: { "data": {...}, "message": "..." }
// 成功（列表）: { "data": [...], "pagination": { "page", "per_page", "total", "pages" } }
// 錯誤:       { "error": "...", "message": "...", "details": {...} }
```

### 認證流程

1. `POST /api/v2/auth/login` → 回傳 `{ token, user }`
2. 後續請求帶 `Authorization: Bearer <token>` header
3. 測試帳號: `admin@example.com` / `admin123`（管理員）、`wang@example.com` / `password123`（一般使用者）

## 重要注意事項

- **Conda 環境**: 後端必須在 `alumni-platform` conda 環境下執行，不要用 venv
- **models_v2**: 使用 `models_v2/` 目錄的模型，舊版 models 已棄用
- **SECRET_KEY / JWT_SECRET_KEY**: 開發環境有預設值，生產環境必須設定環境變數
- **CORS**: 由環境變數 `ALLOWED_ORIGINS` 控制（預設 `localhost:3000,localhost:5173`）
- **圖片優化**: 開發環境已關閉（`unoptimized: true`）
- `next.config.ts` 同時代理 `/api/*` 和 `/static/*` 到後端

## 前端設計系統

### 視覺風格：Aurora Glassmorphism

全站採用「極光毛玻璃」風格 -- 柔和、現代、有呼吸感。

- **Aurora 背景**: 全站共用固定極光背景（`AuroraBackground.tsx`），4 層色彩獨立呼吸動畫 20~28s，GPU 加速
- **毛玻璃層級**: `.glass-panel`（側邊欄, blur 12px）> `.glass-card`（卡片, blur 8px, hover 上浮）> `.dashboard-main`（主區域裝飾點）
- **語意漸層**: `.gradient-warm`(活動,紅橘) / `.gradient-fresh`(職涯,青綠) / `.gradient-light`(系友,藍) / `.gradient-magic`(管理,紫粉)，各有文字版 `.text-gradient-*`
- **圓角偏大**: theme radius xs=0.5rem ~ xl=2rem; Button 膠囊圓角(radius=xl)
- **陰影極柔和**: rgba(0,0,0,0.02~0.12) 大擴散; Card 預設 **無邊框** (withBorder:false)
- **裝飾元件**: `src/components/ui/decorations.tsx` -- SpectralWaves/CIEPlot/Prism/FloatingOrbs/ColorChecker（色彩科學主題 SVG，position:absolute）

### 頁面結構模板

```tsx
<ProtectedRoute>
  <SidebarLayout>
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* 標題區: Group justify="space-between" */}
        {/* 篩選區: Grid 響應式 span={{ base:12, md:6 }} */}
        {/* 內容區: Card 列表或 Bento Grid */}
      </Stack>
    </Container>
  </SidebarLayout>
</ProtectedRoute>
```

Container 尺寸：xl(儀表板/管理) > lg(列表頁) > md(設定) > 420~520(登入/註冊)

### 頁面模式速查

| 模式 | 範例頁面 | 關鍵特徵 |
|------|---------|---------|
| Bento Grid 儀表板 | 首頁 | 漸層大卡+glass小卡, 交錯 slide-up 入場, SVG 裝飾 |
| 列表頁 | Jobs/Events/Directory | Card withBorder + Badge light + 元資訊行 + Pagination 居中 |
| Tabs 管理 | Admin | Tabs 切換, Table striped highlightOnHover, ActionIcon light |
| 表單頁 | Profile/CMS Create | Paper withBorder p=xl, Grid 多欄, Divider label 分區 |
| 全屏沉浸 | 登入/註冊 | 無 SidebarLayout, 輪播背景+漸層覆蓋, 毛玻璃卡片 radius 30px, CSS Module |

### 樣式方法優先順序

1. **Mantine props**（主要）: shadow, radius, padding, c, fw, fz, variant, color
2. **自訂 CSS class**（globals.css）: .glass-panel, .glass-card, .gradient-*, .animate-slide-up, .card-hover-effect
3. **CSS Modules**（僅登入/註冊）
4. **Inline style**（局部）: 裝飾定位、特殊漸層

> Tailwind CSS 已引入但幾乎未使用，樣式主要靠 Mantine + 自訂 CSS class。

### 動畫慣例

- **入場**: `.animate-slide-up` + animationDelay 交錯（0.6s cubic-bezier(0.16,1,0.3,1)）
- **Hover 卡片**: `.card-hover-effect` scale(1.02) translateY(-5px)，彈性曲線 cubic-bezier(0.34,1.56,0.64,1)
- **側邊欄項目**: hover translateX(5px)
- **按鈕**: transition 0.2s ease, hover translateY(-2px)
- **背景**: 極光呼吸 20~28s + shimmer 30s

## 關鍵檔案

| 用途 | 路徑 |
|------|------|
| 後端入口 | `alumni_platform_api/src/main_v2.py` |
| 前端 API 客戶端 | `alumni-platform-nextjs/src/lib/api.ts` |
| DB 配置 | `alumni_platform_api/src/models_v2/base.py` |
| Next.js 配置 | `alumni-platform-nextjs/next.config.ts` |
| Theme | `alumni-platform-nextjs/src/theme.ts` |
| 認證工具 | `alumni-platform-nextjs/src/lib/auth.ts` |

## 常見工作流程

### 新增 API 端點

1. 在 `alumni_platform_api/src/routes/<feature>_v2.py` 新增路由
2. 若需新模型，在 `models_v2/` 新增並於 `__init__.py` 匯出
3. 新模組需在 `main_v2.py` 註冊 Blueprint
4. 前端在 `src/lib/api.ts` 新增對應函式

### 新增前端頁面

1. 在 `src/app/` 建立路由資料夾與 `page.tsx`
2. 使用 Mantine 元件建構 UI（優先用 Stack/Group 佈局，而非 raw div）
3. 透過 `src/lib/api.ts` 呼叫後端 API

## Git

- `main`: 穩定版本
- `refactor/nextjs15-mantine7`: 當前開發分支
