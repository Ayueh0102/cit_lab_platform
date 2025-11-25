# 📚 API 參考文檔

> 校友平台 API v2 完整參考指南

---

## 🔗 基本資訊

| 項目 | 值 |
|------|-----|
| **Base URL** | `http://localhost:5001` |
| **API 版本** | v2 |
| **認證方式** | JWT Bearer Token |
| **回應格式** | JSON |
| **字元編碼** | UTF-8 |

---

## 🔐 認證

### 取得 Token

```bash
POST /api/v2/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

### 使用 Token

在所有需要認證的請求中加入 Header:

```
Authorization: Bearer <your_token>
```

---

## 📋 API 端點總覽

### 認證系統 `/api/v2/auth`

| 方法 | 端點 | 說明 | 認證 |
|------|------|------|------|
| POST | `/login` | 使用者登入 | ❌ |
| POST | `/register` | 使用者註冊 | ❌ |
| POST | `/logout` | 使用者登出 | ✅ |
| GET | `/me` | 取得當前使用者 | ✅ |
| PUT | `/profile` | 更新個人資料 | ✅ |
| POST | `/change-password` | 修改密碼 | ✅ |
| GET | `/sessions` | 取得登入會話 | ✅ |

### 職缺管理 `/api/v2/jobs`

| 方法 | 端點 | 說明 | 認證 |
|------|------|------|------|
| GET | `/` | 取得職缺列表 | ❌ |
| POST | `/` | 建立職缺 | ✅ |
| GET | `/:id` | 取得職缺詳情 | ❌ |
| PUT | `/:id` | 更新職缺 | ✅ |
| DELETE | `/:id` | 刪除職缺 | ✅ |
| GET | `/my` | 取得我的職缺 | ✅ |
| POST | `/:id/requests` | 申請職缺 | ✅ |
| GET | `/:id/requests` | 取得申請列表 | ✅ |
| PUT | `/requests/:id` | 處理申請 | ✅ |
| GET | `/categories` | 取得職缺分類 | ❌ |

### 活動管理 `/api/v2/events`

| 方法 | 端點 | 說明 | 認證 |
|------|------|------|------|
| GET | `/` | 取得活動列表 | ❌ |
| POST | `/` | 建立活動 | ✅ |
| GET | `/:id` | 取得活動詳情 | ❌ |
| PUT | `/:id` | 更新活動 | ✅ |
| DELETE | `/:id` | 刪除活動 | ✅ |
| GET | `/my` | 取得我的活動 | ✅ |
| POST | `/:id/register` | 報名活動 | ✅ |
| DELETE | `/:id/register` | 取消報名 | ✅ |
| GET | `/:id/registrations` | 取得報名列表 | ✅ |
| GET | `/categories` | 取得活動分類 | ❌ |

### 公告管理 `/api/v2/bulletins`

| 方法 | 端點 | 說明 | 認證 |
|------|------|------|------|
| GET | `/` | 取得公告列表 | ❌ |
| POST | `/` | 建立公告 | ✅ |
| GET | `/:id` | 取得公告詳情 | ❌ |
| PUT | `/:id` | 更新公告 | ✅ |
| DELETE | `/:id` | 刪除公告 | ✅ |
| GET | `/my-bulletins` | 取得我的公告 | ✅ |
| GET | `/categories` | 取得公告分類 | ❌ |

### 訊息系統 `/api/v2/conversations`

| 方法 | 端點 | 說明 | 認證 |
|------|------|------|------|
| GET | `/` | 取得對話列表 | ✅ |
| POST | `/` | 建立新對話 | ✅ |
| GET | `/:id` | 取得對話詳情 | ✅ |
| GET | `/:id/messages` | 取得訊息列表 | ✅ |
| POST | `/:id/messages` | 發送訊息 | ✅ |
| PUT | `/:id/read` | 標記已讀 | ✅ |

### 通知系統 `/api/notifications`

| 方法 | 端點 | 說明 | 認證 |
|------|------|------|------|
| GET | `/` | 取得通知列表 | ✅ |
| GET | `/unread-count` | 取得未讀數量 | ✅ |
| POST | `/:id/read` | 標記為已讀 | ✅ |
| POST | `/mark-all-read` | 全部標記已讀 | ✅ |
| DELETE | `/:id` | 刪除通知 | ✅ |

### 職涯管理 `/api/career`

| 方法 | 端點 | 說明 | 認證 |
|------|------|------|------|
| GET | `/work-experiences` | 取得工作經歷 | ✅ |
| POST | `/work-experiences` | 新增工作經歷 | ✅ |
| PUT | `/work-experiences/:id` | 更新工作經歷 | ✅ |
| DELETE | `/work-experiences/:id` | 刪除工作經歷 | ✅ |
| GET | `/educations` | 取得教育背景 | ✅ |
| POST | `/educations` | 新增教育背景 | ✅ |
| PUT | `/educations/:id` | 更新教育背景 | ✅ |
| DELETE | `/educations/:id` | 刪除教育背景 | ✅ |
| GET | `/skills` | 取得所有技能 | ❌ |
| GET | `/my-skills` | 取得我的技能 | ✅ |
| POST | `/my-skills` | 新增技能 | ✅ |
| DELETE | `/my-skills/:id` | 刪除技能 | ✅ |

### 管理後台 `/api/v2/admin`

| 方法 | 端點 | 說明 | 認證 |
|------|------|------|------|
| GET | `/statistics` | 取得統計數據 | 🔑 Admin |
| GET | `/users` | 取得用戶列表 | 🔑 Admin |
| PUT | `/users/:id` | 更新用戶資料 | 🔑 Admin |
| DELETE | `/users/:id` | 刪除用戶 | 🔑 Admin |
| POST | `/jobs/:id/approve` | 審核職缺 | 🔑 Admin |
| POST | `/events/:id/approve` | 審核活動 | 🔑 Admin |
| POST | `/bulletins/:id/approve` | 審核公告 | 🔑 Admin |

### CSV 匯入匯出 `/api/csv`

| 方法 | 端點 | 說明 | 認證 |
|------|------|------|------|
| GET | `/export/users` | 匯出用戶資料 | 🔑 Admin |
| GET | `/export/jobs` | 匯出職缺資料 | 🔑 Admin |
| GET | `/export/events` | 匯出活動資料 | 🔑 Admin |
| GET | `/export/bulletins` | 匯出公告資料 | 🔑 Admin |
| POST | `/import/users` | 匯入用戶資料 | 🔑 Admin |
| POST | `/import/jobs` | 匯入職缺資料 | 🔑 Admin |
| POST | `/import/events` | 匯入活動資料 | 🔑 Admin |
| POST | `/import/bulletins` | 匯入公告資料 | 🔑 Admin |

### 全文搜索 `/api/v2/search`

| 方法 | 端點 | 說明 | 認證 |
|------|------|------|------|
| GET | `/` | 全局搜索 | ❌ |
| GET | `/suggestions` | 搜索建議 | ❌ |

---

## 📝 請求與回應範例

### 登入

**請求**
```bash
POST /api/v2/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**回應**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": 1,
  "user": {
    "id": 1,
    "name": "系統管理員",
    "email": "admin@example.com",
    "role": "admin",
    "profile": {
      "full_name": "系統管理員",
      "graduation_year": 2020,
      "current_company": "台科大",
      "current_position": "系統管理員"
    }
  }
}
```

### 取得職缺列表

**請求**
```bash
GET /api/v2/jobs?status=active&page=1&per_page=20
```

**回應**
```json
{
  "jobs": [
    {
      "id": 1,
      "title": "資深光學工程師",
      "company": "台積電",
      "location": "新竹",
      "job_type": "full_time",
      "salary_min": 80000,
      "salary_max": 150000,
      "status": "active",
      "created_at": "2025-01-01T00:00:00Z",
      "user": {
        "id": 2,
        "name": "王小明"
      }
    }
  ],
  "total": 10,
  "page": 1,
  "per_page": 20,
  "pages": 1
}
```

### 建立活動

**請求**
```bash
POST /api/v2/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "2025 系友年會",
  "description": "一年一度的系友聚會",
  "start_time": "2025-12-01T18:00:00Z",
  "end_time": "2025-12-01T21:00:00Z",
  "location": "台科大國際大樓",
  "capacity": 100,
  "category_id": 1
}
```

**回應**
```json
{
  "message": "活動建立成功",
  "event": {
    "id": 1,
    "title": "2025 系友年會",
    "status": "draft",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

---

## 🚨 錯誤回應

### 錯誤格式

```json
{
  "error": "錯誤描述",
  "message": "詳細錯誤訊息",
  "details": {}
}
```

### HTTP 狀態碼

| 狀態碼 | 說明 |
|--------|------|
| 200 | 請求成功 |
| 201 | 資源建立成功 |
| 400 | 請求格式錯誤 |
| 401 | 未授權 (Token 無效或過期) |
| 403 | 權限不足 |
| 404 | 資源不存在 |
| 422 | 資料驗證失敗 |
| 500 | 伺服器內部錯誤 |

---

## 🔑 測試帳號

| Email | Password | 角色 | 說明 |
|-------|----------|------|------|
| admin@example.com | admin123 | admin | 系統管理員 |
| wang@example.com | password123 | user | 一般使用者 |
| lee@example.com | password123 | user | 一般使用者 |

---

## 📊 分頁參數

所有列表類 API 支援以下分頁參數：

| 參數 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| page | int | 1 | 頁碼 |
| per_page | int | 20 | 每頁筆數 |

**分頁回應格式**
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "per_page": 20,
  "pages": 5
}
```

---

## 🔍 篩選參數

### 職缺篩選

| 參數 | 類型 | 說明 |
|------|------|------|
| status | string | 狀態 (active, closed, filled) |
| job_type | string | 類型 (full_time, part_time, contract) |
| location | string | 地點 |
| category_id | int | 分類 ID |
| search | string | 關鍵字搜索 |

### 活動篩選

| 參數 | 類型 | 說明 |
|------|------|------|
| status | string | 狀態 (published, draft, cancelled) |
| category_id | int | 分類 ID |
| time_filter | string | 時間 (upcoming, past, all) |
| search | string | 關鍵字搜索 |

### 公告篩選

| 參數 | 類型 | 說明 |
|------|------|------|
| status | string | 狀態 (published, draft, archived) |
| category_id | int | 分類 ID |
| bulletin_type | string | 類型 |
| search | string | 關鍵字搜索 |

---

**文檔版本**: 2.0  
**最後更新**: 2025-11-25

