# 資料庫模型 v2 完整總覽

## ✅ 完成狀態

**所有 21 個資料模型已完成建立！(100%)**

建立日期: 2025-10-02
版本: 2.0
支援功能: 完整 Google Sheets 雙向同步

---

## 📊 模型架構總覽

### 環節 1: 使用者認證與檔案管理
**檔案**: `src/models_v2/user_auth.py`

1. **User** - 使用者基本資料
   - 電子郵件、密碼、姓名、角色(admin/user)
   - 關聯: profile, sessions, work_experiences, educations, jobs, bulletins 等

2. **UserProfile** - 使用者個人檔案
   - 畢業年份、班級、目前公司、職位
   - LinkedIn、個人網站、自我介紹
   - 關聯: user, skills

3. **UserSession** - 登入會話管理
   - JWT Token、裝置資訊、IP
   - 自動過期機制

---

### 環節 2: 職涯與技能管理
**檔案**: `src/models_v2/career.py`

4. **WorkExperience** - 工作經歷
   - 公司、職位、起訖時間、工作內容
   - 是否為目前工作

5. **Education** - 教育背景
   - 學校、學位、科系、起訖時間
   - GPA、榮譽獎項

6. **Skill** - 技能項目
   - 技能名稱、分類、描述
   - 關聯: 系統技能庫

7. **UserSkill** - 使用者技能關聯
   - 熟練度等級、經驗年數
   - 是否為主要技能、認證資訊

---

### 環節 3: 職缺與媒合系統
**檔案**: `src/models_v2/jobs.py`

8. **JobCategory** - 職缺分類
   - 分類名稱、圖示、顏色
   - 排序順序

9. **Job** - 職缺資訊
   - 標題、公司、職缺描述、要求
   - 薪資範圍、地點、遠端工作
   - 職缺類型: FULL_TIME, PART_TIME, CONTRACT, INTERN, FREELANCE
   - 職缺狀態: ACTIVE, CLOSED, FILLED, EXPIRED, DRAFT
   - 關聯: category, user(發布者), job_requests

10. **JobRequest** - 職缺交流請求
    - 請求訊息、狀態(PENDING/APPROVED/REJECTED/CANCELLED)
    - 回覆訊息、回覆時間
    - 關聯: job, requester

---

### 環節 4: 私訊與對話系統
**檔案**: `src/models_v2/messages.py`

11. **Conversation** - 對話管理
    - 兩位參與者、對話類型(JOB_REQUEST/DIRECT_MESSAGE/SYSTEM)
    - 關聯職缺、最後訊息預覽
    - 未讀計數(雙方各自計數)
    - 封存功能(雙方各自封存)

12. **Message** - 訊息內容
    - 訊息內容、訊息類型(text/image/file)
    - 訊息狀態: SENT, DELIVERED, READ
    - 附件 URL、已讀時間
    - 關聯: conversation, sender

---

### 環節 5: 活動管理系統
**檔案**: `src/models_v2/events.py`

13. **EventCategory** - 活動分類
    - 分類名稱、圖示、顏色

14. **Event** - 活動資訊
    - 標題、描述、開始/結束時間
    - 地點、線上會議連結
    - 人數上限、報名截止時間
    - 活動類型: SEMINAR, NETWORKING, WORKSHOP, CAREER, SOCIAL, ACADEMIC
    - 活動狀態: UPCOMING, ONGOING, COMPLETED, CANCELLED, DRAFT
    - 報名費用、聯絡資訊
    - 統計: 瀏覽次數、報名率、候補人數

15. **EventRegistration** - 活動報名
    - 報名狀態: REGISTERED, ATTENDED, CANCELLED, WAITLIST
    - 審核機制、簽到功能
    - 取消原因記錄

---

### 環節 6: 內容管理系統
**檔案**: `src/models_v2/content.py`

16. **BulletinCategory** - 公告分類
    - 分類名稱、圖示、顏色

17. **Bulletin** - 公告/公佈欄
    - 標題、內容、摘要
    - 公告類型: ANNOUNCEMENT, NEWS, ACADEMIC, EVENT, JOB
    - 發布狀態: PUBLISHED, DRAFT, ARCHIVED, SCHEDULED
    - 封面圖片、附件、標籤
    - 置頂、精選功能
    - 統計: 瀏覽次數、按讚數、留言數

18. **BulletinComment** - 公告留言
    - 留言內容、回覆功能(parent_id)
    - 留言狀態: APPROVED, PENDING, REJECTED, HIDDEN
    - 按讚數、審核機制

19. **Article** - 文章/部落格(可選)
    - 標題、內容、摘要
    - 發布狀態、封面圖片、標籤
    - 瀏覽次數、按讚數

---

### 環節 7: 系統管理與通知
**檔案**: `src/models_v2/system.py`

20. **Notification** - 通知系統
    - 通知類型: JOB_REQUEST, EVENT_REGISTRATION, NEW_MESSAGE, BULLETIN_PUBLISHED 等
    - 通知狀態: UNREAD, READ, ARCHIVED
    - 關聯資源(job/event/message)
    - 郵件發送記錄

21. **SystemSetting** - 系統設定
    - 設定鍵值、類型(string/int/bool/json)
    - 分類、名稱、描述
    - 公開性、可編輯性
    - 智慧型別轉換: `get_value()`, `set_value()`

22. **SystemLog** - 系統日誌
    - 日誌等級: DEBUG, INFO, WARNING, ERROR, CRITICAL
    - 操作名稱、訊息、分類
    - 請求資訊: IP、User Agent、請求方法/路徑
    - 錯誤追蹤、詳細資料(JSON)

23. **UserActivity** - 使用者活動記錄
    - 活動類型、活動名稱、描述
    - 關聯資源、額外資料(JSON)

24. **FileUpload** - 檔案上傳記錄
    - 檔案名稱、路徑、URL、大小、類型
    - 關聯資源、公開性
    - 軟刪除機制

---

## 🔧 核心功能特性

### 1. Google Sheets 雙向同步

所有模型都包含以下方法:

```python
@classmethod
def from_sheet_row(cls, row_data):
    """從 Google Sheets 資料建立物件"""
    # 將 Sheets 行資料轉換為資料庫物件

def to_sheet_row(self):
    """轉換為 Google Sheets 格式"""
    # 將資料庫物件轉換為 Sheets 行資料
```

### 2. 基礎 Mixins

所有模型繼承自 `BaseModel`,包含:

- **TimestampMixin**: `created_at`, `updated_at` 自動時間戳記
- **GoogleSheetsMixin**: `sheet_row_id`, `last_synced_at` 同步追蹤
- **SoftDeleteMixin**: `is_deleted`, `deleted_at` 軟刪除

### 3. 統一的 to_dict() 方法

所有模型都提供:

```python
def to_dict(self, include_private=False):
    """轉換為字典,支援 API JSON 回傳"""
    # include_private: 是否包含 sheet_row_id, last_synced_at
```

### 4. 業務邏輯方法

每個模型都包含實用的業務方法,例如:

- **Job**: `increment_views()`, `increment_requests()`
- **JobRequest**: `approve()`, `reject()`, `cancel()`
- **Event**: `is_full`, `available_seats`, `occupancy_rate`
- **EventRegistration**: `check_in()`, `approve()`
- **Bulletin**: `publish()`, `archive()`, `pin()`
- **Message**: `mark_as_read()`, `mark_as_delivered()`
- **Notification**: `mark_as_read()`, `archive()`

### 5. 完整的關聯關係

- User ↔ Profile (一對一)
- User ↔ WorkExperience (一對多)
- User ↔ Education (一對多)
- User ↔ Skills (多對多,透過 UserSkill)
- User ↔ Jobs (一對多,發布者)
- User ↔ Events (一對多,主辦者)
- User ↔ Bulletins (一對多,作者)
- Job ↔ JobRequests (一對多)
- Event ↔ EventRegistrations (一對多)
- Bulletin ↔ Comments (一對多)
- Conversation ↔ Messages (一對多)

---

## 📈 統計數據

| 環節 | 模型數量 | 主要功能 |
|------|---------|---------|
| 1. 使用者認證 | 3 | 註冊、登入、會話管理 |
| 2. 職涯管理 | 4 | 工作經歷、教育背景、技能 |
| 3. 職缺媒合 | 3 | 職缺發布、交流請求 |
| 4. 私訊系統 | 2 | 對話管理、訊息傳送 |
| 5. 活動管理 | 3 | 活動發布、報名、簽到 |
| 6. 內容管理 | 4 | 公告、留言、文章 |
| 7. 系統管理 | 5 | 通知、設定、日誌、活動記錄 |
| **總計** | **24** | **完整系友會平台** |

---

## 🎯 下一步建議

### 選項 1: 資料庫整合與遷移
- 建立資料庫遷移腳本
- 從舊資料庫 (models/user.py) 遷移資料到新架構
- 測試所有模型的 CRUD 操作

### 選項 2: API 路由開發
- 為每個模型建立 RESTful API 端點
- 整合 JWT 認證與權限檢查
- 建立 API 文件

### 選項 3: Google Sheets 整合測試
- 測試 CSV 匯出/匯入功能
- 驗證資料格式轉換的正確性
- 測試大量資料同步效能

### 選項 4: 前端功能串接
- 連接前端 App.jsx 與新 API
- 實作各項功能的完整流程
- 優化使用者體驗

### 選項 5: 測試與優化
- 單元測試撰寫
- 效能測試與優化
- 安全性檢查

---

## 📝 技術規格

- **ORM**: SQLAlchemy
- **資料庫**: SQLite (可切換至 PostgreSQL/MySQL)
- **編碼**: UTF-8
- **時間**: UTC (datetime.utcnow())
- **Enum 支援**: Python enum.Enum
- **JSON 欄位**: 支援 (metadata, details 等)
- **級聯刪除**: 已設定 (ondelete='CASCADE')
- **延遲載入**: lazy='dynamic' (大型關聯)

---

## 🔗 相關文件

- `DATABASE_ARCHITECTURE_V2.md` - 資料庫架構設計
- `CSV_FRONTEND_GUIDE.md` - CSV 功能前端使用指南
- `CSV_API_DOCUMENTATION.md` - CSV API 文件
- `SIMPLE_SHEETS_GUIDE.md` - Google Sheets 整合指南

---

**系友會平台資料庫模型 v2 已完成!** 🎉

所有 24 個資料模型已建立完成,支援完整的 Google Sheets 雙向同步功能。
現在可以進行資料庫遷移、API 開發或前端整合等下一步工作。
