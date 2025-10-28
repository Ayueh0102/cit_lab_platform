# Alumni Platform API v2 Documentation

## 🚀 概述

API v2 是系友會平台的全新後端架構,基於 `models_v2` 資料庫模型,提供完整的 RESTful API 端點。

### 基本資訊

- **基礎 URL**: `http://localhost:5001`
- **API 版本**: `2.0.0`
- **資料庫**: SQLite (`app_v2.db`)
- **認證方式**: JWT Bearer Token
- **回應格式**: JSON

### 伺服器狀態

```bash
# 啟動伺服器
cd alumni_platform_api
source venv/bin/activate
python3 src/main_v2.py

# 伺服器資訊
# 🌐 Server: http://localhost:5001
# 📊 Database: app_v2.db
# 🔧 Debug Mode: ON
```

---

## 📚 API 端點總覽

### 1. 認證系統 (`/api/auth/v2`)

| 方法 | 端點 | 說明 | 需要認證 |
|------|------|------|----------|
| POST | `/api/auth/v2/register` | 使用者註冊 | ❌ |
| POST | `/api/auth/v2/login` | 使用者登入 | ❌ |
| POST | `/api/auth/v2/logout` | 使用者登出 | ✅ |
| GET | `/api/auth/v2/profile` | 取得個人檔案 | ✅ |
| PUT | `/api/auth/v2/profile` | 更新個人檔案 | ✅ |
| POST | `/api/auth/v2/change-password` | 修改密碼 | ✅ |
| GET | `/api/auth/v2/sessions` | 取得登入會話列表 | ✅ |
| DELETE | `/api/auth/v2/sessions/:id` | 刪除特定會話 | ✅ |

### 2. 職涯管理 (`/api/career`)

| 方法 | 端點 | 說明 | 需要認證 |
|------|------|------|----------|
| GET | `/api/career/work-experiences` | 取得工作經歷列表 | ✅ |
| POST | `/api/career/work-experiences` | 新增工作經歷 | ✅ |
| PUT | `/api/career/work-experiences/:id` | 更新工作經歷 | ✅ |
| DELETE | `/api/career/work-experiences/:id` | 刪除工作經歷 | ✅ |
| GET | `/api/career/educations` | 取得教育背景列表 | ✅ |
| POST | `/api/career/educations` | 新增教育背景 | ✅ |
| PUT | `/api/career/educations/:id` | 更新教育背景 | ✅ |
| DELETE | `/api/career/educations/:id` | 刪除教育背景 | ✅ |
| GET | `/api/career/skills` | 取得所有技能標籤 | ❌ |
| GET | `/api/career/my-skills` | 取得我的技能列表 | ✅ |
| POST | `/api/career/my-skills` | 新增技能 | ✅ |
| DELETE | `/api/career/my-skills/:id` | 刪除技能 | ✅ |

### 3. 通知系統 (`/api/notifications`)

| 方法 | 端點 | 說明 | 需要認證 |
|------|------|------|----------|
| GET | `/api/notifications` | 取得通知列表 | ✅ |
| GET | `/api/notifications/unread-count` | 取得未讀數量 | ✅ |
| POST | `/api/notifications/:id/read` | 標記為已讀 | ✅ |
| POST | `/api/notifications/mark-all-read` | 全部標記為已讀 | ✅ |
| POST | `/api/notifications/:id/archive` | 封存通知 | ✅ |
| DELETE | `/api/notifications/:id` | 刪除通知 | ✅ |

### 4. 系統設定 (`/api/system`)

| 方法 | 端點 | 說明 | 需要認證 |
|------|------|------|----------|
| GET | `/api/system/settings` | 取得公開設定 | ❌ |
| GET | `/api/system/settings/all` | 取得所有設定 | 🔑 Admin |
| GET | `/api/system/settings/:key` | 取得特定設定 | 🔑 Admin |
| PUT | `/api/system/settings/:key` | 更新設定 | 🔑 Admin |
| POST | `/api/system/settings` | 建立新設定 | 🔑 Admin |

### 5. 使用者活動 (`/api/activities`)

| 方法 | 端點 | 說明 | 需要認證 |
|------|------|------|----------|
| GET | `/api/activities` | 取得活動記錄 | ✅ |
| POST | `/api/activities` | 記錄新活動 | ✅ |

### 6. 檔案管理 (`/api/files`)

| 方法 | 端點 | 說明 | 需要認證 |
|------|------|------|----------|
| GET | `/api/files` | 取得檔案列表 | ✅ |
| DELETE | `/api/files/:id` | 刪除檔案 | ✅ |

### 7. CSV 匯入匯出 (`/api/csv`)

| 方法 | 端點 | 說明 | 需要認證 |
|------|------|------|----------|
| POST | `/api/csv/export/:model` | 匯出資料 | 🔑 Admin |
| POST | `/api/csv/import/:model` | 匯入資料 | 🔑 Admin |

---

## 🔐 認證機制

### JWT Token 取得

```bash
# 登入取得 Token
curl -X POST http://localhost:5001/api/auth/v2/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'

# 回應範例
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": 1,
  "user": {
    "id": 1,
    "name": "系統管理員",
    "email": "admin@example.com",
    "role": "admin",
    "profile": { ... }
  }
}
```

### 使用 Token

在所有需要認證的請求中加入 Header:

```bash
Authorization: Bearer <your_token_here>
```

範例:

```bash
curl http://localhost:5001/api/career/work-experiences \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📊 資料模型架構

### 環節 1: 使用者與認證
- `User` - 使用者基本資料
- `UserProfile` - 使用者詳細檔案
- `UserSession` - 登入會話管理

### 環節 2: 職涯與工作經歷
- `WorkExperience` - 工作經歷
- `Education` - 教育背景
- `Skill` - 技能標籤庫
- `UserSkill` - 使用者技能關聯

### 環節 3: 職缺與交流
- `JobCategory` - 職缺分類
- `Job` - 職缺資訊
- `JobRequest` - 職缺交流請求

### 環節 4: 訊息系統
- `Conversation` - 對話管理
- `Message` - 訊息內容

### 環節 5: 活動系統
- `EventCategory` - 活動分類
- `Event` - 活動資訊
- `EventRegistration` - 活動報名

### 環節 6: 內容管理
- `BulletinCategory` - 公告分類
- `Bulletin` - 公告內容
- `BulletinComment` - 公告留言
- `Article` - 文章(選用)

### 環節 7: 系統管理
- `Notification` - 通知系統
- `SystemSetting` - 系統設定
- `SystemLog` - 系統日誌
- `UserActivity` - 使用者活動記錄
- `FileUpload` - 檔案上傳記錄

---

## 🧪 API 測試範例

### 1. 使用者註冊與登入

```bash
# 註冊新使用者
curl -X POST http://localhost:5001/api/auth/v2/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "測試用戶"
  }'

# 登入
curl -X POST http://localhost:5001/api/auth/v2/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### 2. 新增工作經歷

```bash
curl -X POST http://localhost:5001/api/career/work-experiences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "company_name": "台積電",
    "position": "光學工程師",
    "start_date": "2020-01-01",
    "is_current": true,
    "description": "負責先進製程光學系統設計"
  }'
```

### 3. 取得通知列表

```bash
curl http://localhost:5001/api/notifications \
  -H "Authorization: Bearer <token>"
```

### 4. 取得系統設定

```bash
# 公開設定 (無需認證)
curl http://localhost:5001/api/system/settings

# 回應範例
{
  "settings": {
    "site_name": "色彩與照明科技研究所系友會",
    "site_description": "系友會社群平台",
    "enable_registration": true
  }
}
```

---

## 🔧 測試帳號

| Email | 密碼 | 角色 | 說明 |
|-------|------|------|------|
| admin@example.com | admin123 | admin | 管理員帳號 |
| wang@example.com | password123 | user | 光學工程師 |
| lee@example.com | password123 | user | 色彩科學研究員 |

---

## 📝 回應格式

### 成功回應

```json
{
  "data": { ... },
  "message": "Success message"
}
```

### 錯誤回應

```json
{
  "message": "Error message",
  "error": "Detailed error description"
}
```

### 分頁回應

```json
{
  "items": [ ... ],
  "total": 100,
  "page": 1,
  "per_page": 20,
  "pages": 5
}
```

---

## 🚨 錯誤代碼

| 狀態碼 | 說明 |
|--------|------|
| 200 | 請求成功 |
| 201 | 資源建立成功 |
| 400 | 請求格式錯誤 |
| 401 | 未授權 (Token 無效或過期) |
| 403 | 權限不足 |
| 404 | 資源不存在 |
| 500 | 伺服器內部錯誤 |

---

## 🔄 與 v1 API 的差異

| 功能 | v1 API | v2 API |
|------|--------|--------|
| 資料庫 | `app.db` | `app_v2.db` |
| 模型架構 | `models/user.py` | `models_v2/*` (模組化) |
| 認證端點 | `/api/auth/login` | `/api/auth/v2/login` |
| 職涯管理 | ❌ | ✅ `/api/career` |
| 通知系統 | ❌ | ✅ `/api/notifications` |
| 系統設定 | ❌ | ✅ `/api/system/settings` |
| CSV 匯入匯出 | ❌ | ✅ `/api/csv` |
| Google Sheets | ❌ | ✅ 所有模型支援 |

---

## 🎯 下一步

1. ✅ **後端 API v2 完成** - 所有 34+ 端點已實作並測試通過
2. 📝 **撰寫前端整合指南** - 待辦
3. 🔗 **前端整合 API v2** - 待辦
4. 🎨 **UI/UX 優化** - 待辦
5. 🚀 **部署準備** - 待辦

---

## 📞 聯絡與支援

- 專案位置: `/Users/Ayueh/alumni-platform-complete-final/`
- API 伺服器: `alumni_platform_api/src/main_v2.py`
- 模型定義: `alumni_platform_api/src/models_v2/`
- 路由定義: `alumni_platform_api/src/routes/`

---

**最後更新**: 2025-10-02
**版本**: 2.0.0
**狀態**: ✅ 已上線並測試通過
