# 資料庫架構設計文件

## 📋 目錄
1. [設計原則](#設計原則)
2. [資料庫環節劃分](#資料庫環節劃分)
3. [詳細資料表設計](#詳細資料表設計)
4. [Google Sheets 整合策略](#google-sheets-整合策略)
5. [資料同步機制](#資料同步機制)

---

## 🎯 設計原則

### 核心理念
- **模組化設計**: 各環節獨立,易於維護與擴展
- **Google Sheets 相容**: 設計符合試算表結構的資料模型
- **資料完整性**: 適當的關聯與約束
- **擴展性**: 預留未來功能擴展空間
- **易於遷移**: 支援 SQLite ↔ Google Sheets 雙向同步

---

## 🗂️ 資料庫環節劃分

我們將資料庫分為以下 6 個主要環節:

### 1️⃣ 使用者與認證環節 (User & Authentication)
**目的**: 管理系友帳號、身份驗證、權限控制

**資料表**:
- `users` - 使用者基本資料
- `user_profiles` - 詳細個人檔案
- `user_sessions` - 登入會話記錄

**Google Sheet 對應**: `系友帳號清單`

---

### 2️⃣ 職涯與工作經歷環節 (Career & Experience)
**目的**: 記錄系友職涯發展、工作經歷、技能專長

**資料表**:
- `work_experiences` - 工作經歷
- `educations` - 教育背景
- `skills` - 技能標籤
- `user_skills` - 使用者技能關聯

**Google Sheet 對應**: `系友職涯資料`

---

### 3️⃣ 職缺與媒合環節 (Jobs & Matching)
**目的**: 職缺發布、交流請求、私訊系統

**資料表**:
- `jobs` - 職缺資訊
- `job_requests` - 交流請求
- `job_categories` - 職缺分類
- `conversations` - 對話記錄
- `messages` - 訊息內容

**Google Sheet 對應**: `職缺發布清單`, `交流請求記錄`

---

### 4️⃣ 活動管理環節 (Events Management)
**目的**: 活動建立、報名、簽到、統計

**資料表**:
- `events` - 活動資訊
- `event_registrations` - 活動報名
- `event_categories` - 活動分類
- `event_check_ins` - 簽到記錄

**Google Sheet 對應**: `活動清單`, `活動報名表`

---

### 5️⃣ 內容與公告環節 (Content & Announcements)
**目的**: 公佈欄、新聞動態、標籤系統

**資料表**:
- `bulletins` - 公告內容
- `bulletin_categories` - 公告分類
- `tags` - 標籤
- `bulletin_tags` - 公告標籤關聯

**Google Sheet 對應**: `公告發布清單`

---

### 6️⃣ 系統與通知環節 (System & Notifications)
**目的**: 通知管理、系統日誌、設定

**資料表**:
- `notifications` - 通知記錄
- `system_logs` - 系統日誌
- `system_settings` - 系統設定

**Google Sheet 對應**: `通知記錄`, `系統日誌`

---

## 📊 詳細資料表設計

### 環節 1: 使用者與認證

#### `users` - 使用者基本資料
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',  -- user, admin, moderator
    status VARCHAR(50) DEFAULT 'active',  -- active, inactive, suspended
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,

    -- Google Sheets 同步
    sheet_row_id INTEGER,  -- 對應 Google Sheets 的行號
    last_synced_at TIMESTAMP
);
```

**Google Sheet 欄位對應**:
| 欄位名稱 | Sheet 欄位 | 說明 |
|---------|-----------|------|
| id | ID | 系統編號 |
| email | 電子郵件 | 登入帳號 |
| role | 角色 | 權限等級 |
| status | 狀態 | 帳號狀態 |
| created_at | 註冊日期 | 建立時間 |

---

#### `user_profiles` - 使用者詳細檔案
```sql
CREATE TABLE user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,

    -- 基本資料
    full_name VARCHAR(100),
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    phone VARCHAR(20),

    -- 畢業資訊
    graduation_year INTEGER,
    degree VARCHAR(50),  -- bachelor, master, phd
    major VARCHAR(100),
    student_id VARCHAR(50),

    -- 目前狀態
    current_company VARCHAR(200),
    current_position VARCHAR(200),
    current_location VARCHAR(200),
    employment_status VARCHAR(50),  -- employed, unemployed, student, freelance

    -- 個人簡介
    bio TEXT,
    personal_website VARCHAR(500),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),

    -- 隱私設定
    profile_visibility VARCHAR(50) DEFAULT 'public',  -- public, alumni_only, private
    show_email BOOLEAN DEFAULT TRUE,
    show_phone BOOLEAN DEFAULT FALSE,

    -- 同步資訊
    sheet_row_id INTEGER,
    last_synced_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Google Sheet 欄位對應**: `系友基本資料`
| Sheet 欄位 | 資料表欄位 | 類型 |
|-----------|-----------|------|
| 姓名 | full_name | 文字 |
| 畢業年份 | graduation_year | 數字 |
| 學位 | degree | 文字 |
| 目前公司 | current_company | 文字 |
| 職位 | current_position | 文字 |
| 所在地 | current_location | 文字 |
| 聯絡電話 | phone | 文字 |
| LinkedIn | linkedin_url | 網址 |

---

### 環節 2: 職涯與工作經歷

#### `work_experiences` - 工作經歷
```sql
CREATE TABLE work_experiences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,

    company_name VARCHAR(200) NOT NULL,
    position VARCHAR(200) NOT NULL,
    location VARCHAR(200),
    employment_type VARCHAR(50),  -- full_time, part_time, contract, internship

    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,

    description TEXT,
    achievements TEXT,  -- JSON array of achievements

    sheet_row_id INTEGER,
    last_synced_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Google Sheet**: `工作經歷記錄`

---

#### `skills` - 技能標籤庫
```sql
CREATE TABLE skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50),  -- technical, soft_skill, language, tool
    description TEXT,
    usage_count INTEGER DEFAULT 0,

    sheet_row_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `user_skills` - 使用者技能關聯
```sql
CREATE TABLE user_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    proficiency_level VARCHAR(50),  -- beginner, intermediate, advanced, expert
    years_of_experience INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE(user_id, skill_id)
);
```

---

### 環節 3: 職缺與媒合

#### `jobs` - 職缺資訊
```sql
CREATE TABLE jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poster_id INTEGER NOT NULL,  -- 發布者

    title VARCHAR(200) NOT NULL,
    company VARCHAR(200) NOT NULL,
    location VARCHAR(200),
    job_type VARCHAR(50),  -- full_time, part_time, contract, remote

    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(10) DEFAULT 'TWD',

    description TEXT NOT NULL,
    requirements TEXT,  -- JSON array
    benefits TEXT,  -- JSON array

    category_id INTEGER,
    status VARCHAR(50) DEFAULT 'active',  -- active, closed, expired

    views_count INTEGER DEFAULT 0,
    requests_count INTEGER DEFAULT 0,

    expires_at TIMESTAMP,

    sheet_row_id INTEGER,
    last_synced_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (poster_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES job_categories(id)
);
```

**Google Sheet**: `職缺發布清單`

---

#### `job_requests` - 交流請求
```sql
CREATE TABLE job_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    requester_id INTEGER NOT NULL,

    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',  -- pending, approved, rejected

    conversation_id INTEGER,  -- 建立對話後的 ID

    sheet_row_id INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
```

---

### 環節 4: 活動管理

#### `events` - 活動資訊
```sql
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organizer_id INTEGER NOT NULL,

    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,

    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    end_date DATE,
    end_time TIME,

    location VARCHAR(200),
    venue_details TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    online_link VARCHAR(500),

    category_id INTEGER,

    capacity INTEGER,
    current_registrations INTEGER DEFAULT 0,

    image_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'upcoming',  -- upcoming, ongoing, completed, cancelled

    registration_deadline TIMESTAMP,

    sheet_row_id INTEGER,
    last_synced_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES event_categories(id)
);
```

**Google Sheet**: `活動清單`, `活動報名統計`

---

#### `event_registrations` - 活動報名
```sql
CREATE TABLE event_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,

    registration_status VARCHAR(50) DEFAULT 'registered',  -- registered, attended, cancelled, no_show

    additional_info TEXT,  -- 報名表額外資訊 (JSON)

    checked_in_at TIMESTAMP,
    cancelled_at TIMESTAMP,

    sheet_row_id INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(event_id, user_id)
);
```

**Google Sheet**: `[活動名稱]_報名表`

---

### 環節 5: 內容與公告

#### `bulletins` - 公告內容
```sql
CREATE TABLE bulletins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL,

    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,

    category_id INTEGER,

    is_pinned BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,

    views_count INTEGER DEFAULT 0,

    published_at TIMESTAMP,

    sheet_row_id INTEGER,
    last_synced_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES bulletin_categories(id)
);
```

**Google Sheet**: `公告發布清單`

---

### 環節 6: 系統與通知

#### `notifications` - 通知記錄
```sql
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,

    type VARCHAR(50) NOT NULL,  -- job_request, event_registration, bulletin, system
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,

    related_type VARCHAR(50),  -- job, event, bulletin, user
    related_id INTEGER,

    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🔄 Google Sheets 整合策略

### 資料同步架構

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   SQLite DB     │ ←──────→│  Sync Service    │ ←──────→│ Google Sheets   │
│  (本地資料庫)    │  雙向同步  │  (同步服務)       │  API整合  │  (雲端試算表)    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

### Sheet 命名規範

1. **系友帳號清單** (`users` + `user_profiles`)
2. **工作經歷記錄** (`work_experiences`)
3. **職缺發布清單** (`jobs`)
4. **活動清單** (`events`)
5. **活動報名統計** (`event_registrations` 彙總)
6. **公告發布清單** (`bulletins`)

### 同步策略

#### 1. 欄位映射 (Field Mapping)
```python
SHEET_FIELD_MAPPING = {
    'users': {
        'ID': 'id',
        '電子郵件': 'email',
        '角色': 'role',
        '狀態': 'status',
        '註冊日期': 'created_at'
    },
    'user_profiles': {
        'ID': 'id',
        '使用者ID': 'user_id',
        '姓名': 'full_name',
        '畢業年份': 'graduation_year',
        '目前公司': 'current_company',
        '職位': 'current_position'
    }
}
```

#### 2. 同步方向
- **單向 (DB → Sheets)**: 系統日誌、通知記錄
- **雙向同步**: 使用者資料、職缺、活動
- **匯入式 (Sheets → DB)**: 批次匯入系友名單

#### 3. 衝突解決
- **時間戳優先**: 比較 `updated_at` 與 `last_synced_at`
- **來源優先**: DB 為主要資料源,Sheets 為備份與匯出
- **手動審核**: 重要資料衝突時需人工確認

---

## 🔧 實作計畫

### Phase 1: 資料庫建立 ✓ (本階段)
- [x] 設計資料庫架構
- [ ] 建立 SQLAlchemy 模型
- [ ] 建立資料庫遷移腳本
- [ ] 撰寫測試資料生成器

### Phase 2: Google Sheets 整合
- [ ] 設定 Google Sheets API 認證
- [ ] 建立 Sheet 範本
- [ ] 實作資料匯出功能
- [ ] 實作資料匯入功能

### Phase 3: 同步機制
- [ ] 建立同步服務
- [ ] 實作即時同步
- [ ] 建立排程同步任務
- [ ] 錯誤處理與日誌

### Phase 4: 管理介面
- [ ] 後台資料管理頁面
- [ ] 同步狀態監控
- [ ] 手動同步觸發按鈕
- [ ] 衝突解決介面

---

## 📝 注意事項

### Google Sheets 限制
- 單一工作表最多 **1000 萬格** (cells)
- 每分鐘最多 **100 次 API 請求**
- 建議單一 Sheet 不超過 **5000 行**

### 資料安全
- **敏感資料不同步**: 密碼、會話 token 不匯出到 Sheets
- **權限控制**: 僅管理員可存取同步功能
- **加密傳輸**: 使用 HTTPS 與 OAuth 2.0

### 效能優化
- **批次同步**: 一次同步多筆資料
- **增量同步**: 只同步變更的資料
- **快取機制**: 減少 API 呼叫次數

---

**文件版本**: v1.0
**最後更新**: 2025-10-01
**維護者**: 系友會技術團隊
