# 🏗️ 校友平台系統架構文檔

> 本文檔詳細說明校友平台的系統架構、技術棧、資料流程與部署架構

---

## 📊 系統架構總覽

```mermaid
flowchart TB
    subgraph Client["🖥️ 客戶端"]
        Browser["瀏覽器"]
        Mobile["行動裝置"]
    end
    
    subgraph Frontend["⚛️ 前端 (Next.js 15)"]
        direction TB
        AppRouter["App Router"]
        Pages["頁面元件"]
        Components["UI 元件<br/>(Mantine 7)"]
        APIClient["API 客戶端"]
        AuthLib["認證模組"]
    end
    
    subgraph Backend["🐍 後端 (Flask 3)"]
        direction TB
        Routes["API 路由"]
        Auth["JWT 認證"]
        Models["SQLAlchemy ORM"]
        Services["業務邏輯"]
    end
    
    subgraph Database["🗄️ 資料庫"]
        SQLite["SQLite<br/>(開發)"]
        PostgreSQL["PostgreSQL<br/>(生產)"]
    end
    
    Client --> Frontend
    Frontend -->|"HTTP/JSON"| Backend
    Backend --> Database
```

---

## 🔄 資料流程圖

```mermaid
sequenceDiagram
    participant U as 使用者
    participant F as 前端 (Next.js)
    participant A as API (Flask)
    participant D as 資料庫
    
    Note over U,D: 登入流程
    U->>F: 輸入帳號密碼
    F->>A: POST /api/v2/auth/login
    A->>D: 驗證使用者
    D-->>A: 使用者資料
    A-->>F: JWT Token + 使用者資訊
    F-->>U: 登入成功，跳轉首頁
    
    Note over U,D: 資料請求流程
    U->>F: 瀏覽頁面
    F->>A: GET /api/v2/xxx<br/>(含 JWT Token)
    A->>A: 驗證 Token
    A->>D: 查詢資料
    D-->>A: 回傳資料
    A-->>F: JSON 回應
    F-->>U: 渲染頁面
```

---

## 🗂️ 專案目錄結構

```mermaid
graph LR
    subgraph Root["📁 alumni-platform-complete-final"]
        direction TB
        FE["📁 alumni-platform-nextjs<br/>(前端)"]
        BE["📁 alumni_platform_api<br/>(後端)"]
        Docs["📁 docs<br/>(文檔)"]
        Scripts["📁 scripts<br/>(腳本)"]
        CSV["📁 csv_samples<br/>(範例資料)"]
    end
    
    subgraph FEDetail["前端結構"]
        direction TB
        App["src/app/<br/>頁面路由"]
        Comp["src/components/<br/>元件"]
        Lib["src/lib/<br/>工具函式"]
        Hooks["src/hooks/<br/>自定義 Hooks"]
    end
    
    subgraph BEDetail["後端結構"]
        direction TB
        Main["src/main_v2.py<br/>入口點"]
        Routes["src/routes/<br/>API 路由"]
        Models["src/models_v2/<br/>資料模型"]
        DB["src/database/<br/>資料庫檔案"]
    end
    
    FE --> FEDetail
    BE --> BEDetail
```

---

## 🔐 認證架構

```mermaid
flowchart LR
    subgraph Login["登入流程"]
        L1["使用者登入"] --> L2["驗證帳密"]
        L2 --> L3["產生 JWT"]
        L3 --> L4["回傳 Token"]
    end
    
    subgraph Request["請求驗證"]
        R1["API 請求"] --> R2["檢查 Header"]
        R2 --> R3{"Token 有效?"}
        R3 -->|是| R4["處理請求"]
        R3 -->|否| R5["401 未授權"]
    end
    
    subgraph Token["JWT Token 結構"]
        T1["Header<br/>演算法"]
        T2["Payload<br/>user_id, role, exp"]
        T3["Signature<br/>簽名驗證"]
    end
```

---

## 📦 資料庫模型架構

```mermaid
erDiagram
    User ||--o{ UserProfile : has
    User ||--o{ UserSession : has
    User ||--o{ Job : posts
    User ||--o{ Event : organizes
    User ||--o{ Bulletin : authors
    User ||--o{ WorkExperience : has
    User ||--o{ Education : has
    User ||--o{ UserSkill : has
    
    Job ||--o{ JobRequest : receives
    Job }o--|| JobCategory : belongs_to
    
    Event ||--o{ EventRegistration : has
    Event }o--|| EventCategory : belongs_to
    
    Bulletin ||--o{ BulletinComment : has
    Bulletin }o--|| BulletinCategory : belongs_to
    
    Conversation ||--o{ Message : contains
    User ||--o{ Conversation : participates
    
    User ||--o{ Notification : receives
    
    Skill ||--o{ UserSkill : linked_by

    User {
        int id PK
        string email UK
        string password_hash
        string name
        enum role
        enum status
        datetime created_at
    }
    
    UserProfile {
        int id PK
        int user_id FK
        string full_name
        int graduation_year
        string current_company
        string current_position
    }
    
    Job {
        int id PK
        int user_id FK
        int category_id FK
        string title
        string company
        string location
        enum job_type
        enum status
    }
    
    Event {
        int id PK
        int organizer_id FK
        int category_id FK
        string title
        datetime start_time
        datetime end_time
        string location
        int capacity
    }
    
    Bulletin {
        int id PK
        int author_id FK
        int category_id FK
        string title
        text content
        enum status
        boolean is_pinned
    }
```

---

## 🌐 API 端點架構

```mermaid
graph TB
    subgraph Auth["🔐 認證 /api/v2/auth"]
        A1["POST /login"]
        A2["POST /register"]
        A3["POST /logout"]
        A4["GET /me"]
        A5["PUT /profile"]
        A6["POST /change-password"]
    end
    
    subgraph Jobs["💼 職缺 /api/v2/jobs"]
        J1["GET / - 列表"]
        J2["POST / - 建立"]
        J3["GET /:id - 詳情"]
        J4["PUT /:id - 更新"]
        J5["DELETE /:id - 刪除"]
        J6["POST /:id/requests - 申請"]
    end
    
    subgraph Events["📅 活動 /api/v2/events"]
        E1["GET / - 列表"]
        E2["POST / - 建立"]
        E3["GET /:id - 詳情"]
        E4["PUT /:id - 更新"]
        E5["POST /:id/register - 報名"]
        E6["DELETE /:id/register - 取消"]
    end
    
    subgraph Bulletins["📢 公告 /api/v2/bulletins"]
        B1["GET / - 列表"]
        B2["POST / - 建立"]
        B3["GET /:id - 詳情"]
        B4["PUT /:id - 更新"]
        B5["DELETE /:id - 刪除"]
    end
    
    subgraph Messages["💬 訊息 /api/v2/conversations"]
        M1["GET / - 對話列表"]
        M2["POST / - 建立對話"]
        M3["GET /:id/messages - 訊息"]
        M4["POST /:id/messages - 發送"]
    end
    
    subgraph Admin["⚙️ 管理 /api/v2/admin"]
        AD1["GET /statistics - 統計"]
        AD2["GET /users - 用戶列表"]
        AD3["PUT /users/:id - 更新用戶"]
        AD4["POST /jobs/:id/approve - 審核"]
    end
```

---

## 🚀 部署架構

```mermaid
flowchart TB
    subgraph Production["🌐 生產環境"]
        direction TB
        LB["負載均衡器<br/>(Nginx)"]
        
        subgraph FEServers["前端伺服器"]
            FE1["Next.js<br/>Instance 1"]
            FE2["Next.js<br/>Instance 2"]
        end
        
        subgraph BEServers["後端伺服器"]
            BE1["Flask<br/>Instance 1"]
            BE2["Flask<br/>Instance 2"]
        end
        
        DB["PostgreSQL<br/>Database"]
        Cache["Redis<br/>Cache"]
    end
    
    Users["使用者"] --> LB
    LB --> FEServers
    FEServers --> BEServers
    BEServers --> DB
    BEServers --> Cache
```

---

## 📱 前端頁面結構

```mermaid
graph TB
    subgraph Public["公開頁面"]
        Login["登入 /auth/login"]
        Register["註冊 /auth/register"]
    end
    
    subgraph Protected["需登入頁面"]
        Home["首頁 /"]
        
        subgraph JobsModule["職缺模組"]
            JobsList["職缺列表 /jobs"]
            JobDetail["職缺詳情 /jobs/:id"]
            JobCreate["發布職缺 /jobs/create"]
            MyJobs["我的職缺 /jobs/my"]
        end
        
        subgraph EventsModule["活動模組"]
            EventsList["活動列表 /events"]
            EventDetail["活動詳情 /events/:id"]
            EventCreate["建立活動 /events/create"]
            MyEvents["我的活動 /events/my"]
        end
        
        subgraph BulletinsModule["公告模組"]
            BulletinsList["公告列表 /bulletins"]
            BulletinDetail["公告詳情 /bulletins/:id"]
            MyBulletins["我的公告 /bulletins/my"]
        end
        
        subgraph UserModule["使用者模組"]
            Profile["個人資料 /profile"]
            Career["職涯管理 /career"]
            Settings["設定 /settings"]
            Directory["系友名錄 /directory"]
        end
        
        Messages["訊息 /messages"]
        Notifications["通知 /notifications"]
    end
    
    subgraph AdminModule["管理後台"]
        Admin["管理面板 /admin"]
        CMS["內容管理 /cms"]
    end
```

---

## 🔧 技術棧詳細說明

### 前端技術棧

| 技術 | 版本 | 用途 |
|------|------|------|
| Next.js | 15.0 | React 框架 (App Router) |
| React | 19 | UI 函式庫 |
| Mantine | 7 | UI 元件庫 |
| TypeScript | 5 | 型別安全 |
| Tailwind CSS | 3 | 樣式框架 |
| TipTap | 2 | 富文本編輯器 |
| Socket.IO Client | 4 | WebSocket 客戶端 |

### 後端技術棧

| 技術 | 版本 | 用途 |
|------|------|------|
| Flask | 3.x | Web 框架 |
| SQLAlchemy | 2.0+ | ORM |
| PyJWT | 2.x | JWT 認證 |
| Flask-CORS | 4.x | 跨域支援 |
| Flask-SocketIO | 5.x | WebSocket |
| Werkzeug | 3.x | 密碼加密 |

### 資料庫

| 環境 | 資料庫 | 說明 |
|------|--------|------|
| 開發 | SQLite | 輕量、無需安裝 |
| 生產 | PostgreSQL | 高效能、可擴展 |

---

## 📝 設計原則

### 前端設計原則

1. **元件化開發** - 可重用的 UI 元件
2. **型別安全** - TypeScript 確保型別正確
3. **響應式設計** - 支援各種螢幕尺寸
4. **漸進式載入** - 優化使用者體驗

### 後端設計原則

1. **RESTful API** - 標準化的 API 設計
2. **模組化架構** - Blueprint 分離功能
3. **安全優先** - JWT 認證、密碼加密
4. **可擴展性** - 支援水平擴展

### 資料庫設計原則

1. **正規化** - 減少資料冗餘
2. **軟刪除** - 保留歷史記錄
3. **時間戳記** - 追蹤資料變更
4. **索引優化** - 提升查詢效能

---

## 🔄 開發流程

```mermaid
flowchart LR
    Dev["開發"] --> Test["測試"]
    Test --> Review["審查"]
    Review --> Merge["合併"]
    Merge --> Deploy["部署"]
    
    subgraph CI["CI/CD"]
        Lint["程式碼檢查"]
        UnitTest["單元測試"]
        Build["建置"]
    end
    
    Test --> CI
```

---

**文檔版本**: 2.0  
**最後更新**: 2025-11-25

