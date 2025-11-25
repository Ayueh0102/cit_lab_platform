# 🗄️ 資料庫模型文檔

> 校友平台 v2 資料庫完整架構說明

---

## 📊 模型總覽

| 環節 | 模型數量 | 主要功能 |
|------|---------|---------|
| 使用者認證 | 3 | 註冊、登入、會話管理 |
| 職涯管理 | 4 | 工作經歷、教育背景、技能 |
| 職缺媒合 | 3 | 職缺發布、交流請求 |
| 私訊系統 | 2 | 對話管理、訊息傳送 |
| 活動管理 | 3 | 活動發布、報名、簽到 |
| 內容管理 | 4 | 公告、留言、文章 |
| 系統管理 | 5 | 通知、設定、日誌 |
| **總計** | **24** | **完整系友會平台** |

---

## 📁 模型檔案結構

```
alumni_platform_api/src/models_v2/
├── __init__.py          # 模型匯出
├── base.py              # 基礎類別與 Mixins
├── user_auth.py         # 使用者與認證
├── career.py            # 職涯相關
├── jobs.py              # 職缺相關
├── events.py            # 活動相關
├── content.py           # 內容相關
├── messages.py          # 訊息相關
├── system.py            # 系統相關
├── article_category.py  # 文章分類
└── article_comment.py   # 文章留言
```

---

## 🔐 使用者與認證

### User (使用者)

```python
class User(db.Model):
    id: int              # 主鍵
    email: str           # 電子郵件 (唯一)
    password_hash: str   # 密碼雜湊
    name: str            # 姓名
    role: UserRole       # 角色 (admin/user)
    status: UserStatus   # 狀態 (active/inactive/banned)
    created_at: datetime
    updated_at: datetime
```

**關聯**:
- `profile` → UserProfile (一對一)
- `sessions` → UserSession (一對多)
- `jobs` → Job (一對多)
- `events` → Event (一對多)
- `bulletins` → Bulletin (一對多)

### UserProfile (使用者檔案)

```python
class UserProfile(db.Model):
    id: int
    user_id: int         # 外鍵 → User
    full_name: str       # 全名
    display_name: str    # 顯示名稱
    graduation_year: int # 畢業年份
    class_name: str      # 班級
    current_company: str # 目前公司
    current_position: str # 目前職位
    bio: str             # 自我介紹
    linkedin_url: str    # LinkedIn
    website_url: str     # 個人網站
    avatar_url: str      # 頭像
```

### UserSession (登入會話)

```python
class UserSession(db.Model):
    id: int
    user_id: int         # 外鍵 → User
    token: str           # JWT Token
    device_info: str     # 裝置資訊
    ip_address: str      # IP 位址
    expires_at: datetime # 過期時間
    is_active: bool      # 是否有效
```

---

## 💼 職涯管理

### WorkExperience (工作經歷)

```python
class WorkExperience(db.Model):
    id: int
    user_id: int         # 外鍵 → User
    company_name: str    # 公司名稱
    position: str        # 職位
    start_date: date     # 開始日期
    end_date: date       # 結束日期
    is_current: bool     # 是否為目前工作
    description: str     # 工作描述
    location: str        # 工作地點
```

### Education (教育背景)

```python
class Education(db.Model):
    id: int
    user_id: int         # 外鍵 → User
    school_name: str     # 學校名稱
    degree: str          # 學位
    field_of_study: str  # 科系
    start_year: int      # 開始年份
    end_year: int        # 結束年份
    gpa: float           # GPA
    honors: str          # 榮譽獎項
```

### Skill (技能)

```python
class Skill(db.Model):
    id: int
    name: str            # 技能名稱
    category: str        # 分類
    description: str     # 描述
```

### UserSkill (使用者技能)

```python
class UserSkill(db.Model):
    id: int
    user_id: int         # 外鍵 → User
    skill_id: int        # 外鍵 → Skill
    proficiency_level: int # 熟練度 (1-5)
    years_of_experience: int # 經驗年數
```

---

## 📋 職缺系統

### JobCategory (職缺分類)

```python
class JobCategory(db.Model):
    id: int
    name: str            # 分類名稱
    icon: str            # 圖示
    color: str           # 顏色
    sort_order: int      # 排序
```

### Job (職缺)

```python
class Job(db.Model):
    id: int
    user_id: int         # 發布者 ID
    category_id: int     # 分類 ID
    title: str           # 職缺標題
    company: str         # 公司名稱
    location: str        # 工作地點
    job_type: JobType    # 類型 (FULL_TIME/PART_TIME/...)
    description: str     # 職缺描述
    requirements: str    # 職缺要求
    benefits: str        # 福利待遇
    salary_min: int      # 最低薪資
    salary_max: int      # 最高薪資
    status: JobStatus    # 狀態 (ACTIVE/CLOSED/FILLED)
    is_remote: bool      # 是否遠端
    views_count: int     # 瀏覽次數
    requests_count: int  # 申請次數
    expires_at: datetime # 到期時間
```

**JobType 枚舉**:
- `FULL_TIME` - 全職
- `PART_TIME` - 兼職
- `CONTRACT` - 合約
- `INTERN` - 實習
- `FREELANCE` - 自由接案

**JobStatus 枚舉**:
- `ACTIVE` - 招募中
- `CLOSED` - 已關閉
- `FILLED` - 已招到人
- `EXPIRED` - 已過期
- `DRAFT` - 草稿

### JobRequest (職缺申請)

```python
class JobRequest(db.Model):
    id: int
    job_id: int          # 外鍵 → Job
    requester_id: int    # 申請者 ID
    message: str         # 申請訊息
    status: RequestStatus # 狀態
    reply_message: str   # 回覆訊息
    replied_at: datetime # 回覆時間
```

**RequestStatus 枚舉**:
- `PENDING` - 待處理
- `APPROVED` - 已通過
- `REJECTED` - 已拒絕
- `CANCELLED` - 已取消

---

## 📅 活動系統

### EventCategory (活動分類)

```python
class EventCategory(db.Model):
    id: int
    name: str            # 分類名稱
    icon: str            # 圖示
    color: str           # 顏色
```

### Event (活動)

```python
class Event(db.Model):
    id: int
    organizer_id: int    # 主辦者 ID
    category_id: int     # 分類 ID
    title: str           # 活動標題
    description: str     # 活動描述
    start_time: datetime # 開始時間
    end_time: datetime   # 結束時間
    location: str        # 活動地點
    online_url: str      # 線上會議連結
    capacity: int        # 人數上限
    registration_deadline: datetime # 報名截止
    event_type: EventType # 活動類型
    status: EventStatus  # 狀態
    fee: float           # 報名費用
    contact_info: str    # 聯絡資訊
    cover_image: str     # 封面圖片
    views_count: int     # 瀏覽次數
```

**EventType 枚舉**:
- `SEMINAR` - 研討會
- `NETWORKING` - 交流會
- `WORKSHOP` - 工作坊
- `CAREER` - 職涯活動
- `SOCIAL` - 社交活動
- `ACADEMIC` - 學術活動

**EventStatus 枚舉**:
- `DRAFT` - 草稿
- `PUBLISHED` - 已發布
- `ONGOING` - 進行中
- `COMPLETED` - 已結束
- `CANCELLED` - 已取消

### EventRegistration (活動報名)

```python
class EventRegistration(db.Model):
    id: int
    event_id: int        # 外鍵 → Event
    user_id: int         # 外鍵 → User
    status: RegistrationStatus # 報名狀態
    registered_at: datetime # 報名時間
    checked_in_at: datetime # 簽到時間
    cancel_reason: str   # 取消原因
```

**RegistrationStatus 枚舉**:
- `REGISTERED` - 已報名
- `ATTENDED` - 已出席
- `CANCELLED` - 已取消
- `WAITLIST` - 候補中

---

## 📢 內容系統

### BulletinCategory (公告分類)

```python
class BulletinCategory(db.Model):
    id: int
    name: str            # 分類名稱
    icon: str            # 圖示
    color: str           # 顏色
```

### Bulletin (公告)

```python
class Bulletin(db.Model):
    id: int
    author_id: int       # 作者 ID
    category_id: int     # 分類 ID
    title: str           # 標題
    content: str         # 內容
    summary: str         # 摘要
    bulletin_type: BulletinType # 公告類型
    status: ContentStatus # 發布狀態
    cover_image: str     # 封面圖片
    attachments: str     # 附件 (JSON)
    tags: str            # 標籤
    is_pinned: bool      # 是否置頂
    is_featured: bool    # 是否精選
    views_count: int     # 瀏覽次數
    likes_count: int     # 按讚數
    comments_count: int  # 留言數
    published_at: datetime # 發布時間
```

**BulletinType 枚舉**:
- `ANNOUNCEMENT` - 公告
- `NEWS` - 新聞
- `ACADEMIC` - 學術
- `EVENT` - 活動
- `JOB` - 職缺

**ContentStatus 枚舉**:
- `DRAFT` - 草稿
- `PUBLISHED` - 已發布
- `ARCHIVED` - 已封存
- `SCHEDULED` - 排程中
- `PENDING` - 待審核

### BulletinComment (公告留言)

```python
class BulletinComment(db.Model):
    id: int
    bulletin_id: int     # 外鍵 → Bulletin
    user_id: int         # 外鍵 → User
    parent_id: int       # 父留言 ID (回覆用)
    content: str         # 留言內容
    status: CommentStatus # 留言狀態
    likes_count: int     # 按讚數
```

---

## 💬 訊息系統

### Conversation (對話)

```python
class Conversation(db.Model):
    id: int
    participant1_id: int # 參與者 1
    participant2_id: int # 參與者 2
    conversation_type: ConversationType # 對話類型
    related_job_id: int  # 關聯職缺
    last_message_preview: str # 最後訊息預覽
    last_message_at: datetime # 最後訊息時間
    unread_count_1: int  # 參與者 1 未讀數
    unread_count_2: int  # 參與者 2 未讀數
    is_archived_1: bool  # 參與者 1 封存
    is_archived_2: bool  # 參與者 2 封存
```

**ConversationType 枚舉**:
- `JOB_REQUEST` - 職缺交流
- `DIRECT_MESSAGE` - 私訊
- `SYSTEM` - 系統訊息

### Message (訊息)

```python
class Message(db.Model):
    id: int
    conversation_id: int # 外鍵 → Conversation
    sender_id: int       # 發送者 ID
    content: str         # 訊息內容
    message_type: MessageType # 訊息類型
    status: MessageStatus # 訊息狀態
    attachment_url: str  # 附件 URL
    read_at: datetime    # 已讀時間
```

**MessageType 枚舉**:
- `TEXT` - 文字
- `IMAGE` - 圖片
- `FILE` - 檔案

**MessageStatus 枚舉**:
- `SENT` - 已發送
- `DELIVERED` - 已送達
- `READ` - 已讀

---

## 🔔 系統管理

### Notification (通知)

```python
class Notification(db.Model):
    id: int
    user_id: int         # 接收者 ID
    notification_type: NotificationType # 通知類型
    title: str           # 標題
    content: str         # 內容
    status: NotificationStatus # 狀態
    related_type: str    # 關聯類型 (job/event/message)
    related_id: int      # 關聯 ID
    is_email_sent: bool  # 是否已發送郵件
```

**NotificationType 枚舉**:
- `JOB_REQUEST` - 職缺申請
- `JOB_REQUEST_APPROVED` - 申請通過
- `JOB_REQUEST_REJECTED` - 申請拒絕
- `EVENT_REGISTRATION` - 活動報名
- `EVENT_REMINDER` - 活動提醒
- `NEW_MESSAGE` - 新訊息
- `BULLETIN_PUBLISHED` - 新公告
- `SYSTEM` - 系統通知

### SystemSetting (系統設定)

```python
class SystemSetting(db.Model):
    id: int
    key: str             # 設定鍵
    value: str           # 設定值
    value_type: str      # 值類型 (string/int/bool/json)
    category: str        # 分類
    name: str            # 顯示名稱
    description: str     # 描述
    is_public: bool      # 是否公開
    is_editable: bool    # 是否可編輯
```

### SystemLog (系統日誌)

```python
class SystemLog(db.Model):
    id: int
    level: LogLevel      # 日誌等級
    action: str          # 操作名稱
    message: str         # 訊息
    category: str        # 分類
    user_id: int         # 操作者 ID
    ip_address: str      # IP 位址
    user_agent: str      # User Agent
    request_method: str  # 請求方法
    request_path: str    # 請求路徑
    error_traceback: str # 錯誤追蹤
    details: str         # 詳細資料 (JSON)
```

### FileUpload (檔案上傳)

```python
class FileUpload(db.Model):
    id: int
    user_id: int         # 上傳者 ID
    filename: str        # 檔案名稱
    original_filename: str # 原始檔名
    file_path: str       # 檔案路徑
    file_url: str        # 檔案 URL
    file_size: int       # 檔案大小
    mime_type: str       # MIME 類型
    related_type: str    # 關聯類型
    related_id: int      # 關聯 ID
    is_public: bool      # 是否公開
```

---

## 🔗 關聯關係圖

```
User ─────┬──── UserProfile (1:1)
          ├──── UserSession (1:N)
          ├──── WorkExperience (1:N)
          ├──── Education (1:N)
          ├──── UserSkill (1:N) ──── Skill (N:1)
          ├──── Job (1:N) ──── JobRequest (1:N)
          ├──── Event (1:N) ──── EventRegistration (1:N)
          ├──── Bulletin (1:N) ──── BulletinComment (1:N)
          ├──── Conversation (N:N)
          ├──── Message (1:N)
          └──── Notification (1:N)

JobCategory ──── Job (1:N)
EventCategory ──── Event (1:N)
BulletinCategory ──── Bulletin (1:N)
```

---

## 🔧 共用功能

### BaseModel Mixins

所有模型繼承自 `BaseModel`，包含：

- **TimestampMixin**: `created_at`, `updated_at` 自動時間戳記
- **SoftDeleteMixin**: `is_deleted`, `deleted_at` 軟刪除
- **GoogleSheetsMixin**: `sheet_row_id`, `last_synced_at` 同步追蹤

### 通用方法

```python
# 轉換為字典
model.to_dict(include_private=False)

# 從 Sheet 資料建立
Model.from_sheet_row(row_data)

# 轉換為 Sheet 格式
model.to_sheet_row()
```

---

## 📝 資料庫設定

### 開發環境 (SQLite)

```python
SQLALCHEMY_DATABASE_URI = 'sqlite:///database/app_v2.db'
```

### 生產環境 (PostgreSQL)

```bash
export DATABASE_URL="postgresql://user:password@host:port/dbname"
```

---

**文檔版本**: 2.0  
**最後更新**: 2025-11-25

