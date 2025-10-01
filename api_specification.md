
# 色彩與照明科技研究所系友會社群平台－後端 API 規格書

**版本：1.0**

**作者：Manus AI**

**日期：2025年9月30日**

---

## 1. 總覽

本文件定義了系友會社群平台後端服務的 API 端點、請求格式、回應格式以及認證機制。此 API 旨在為前端應用程式提供所有必要的功能，包括使用者管理、職缺交流、活動報名等。

- **基礎 URL**: `/api/v1`
- **認證方式**: 所有需要授權的端點皆使用 JSON Web Tokens (JWT)。使用者登入後會取得一個有時效性的 Access Token，並需將其包含在後續請求的 `Authorization` 標頭中 (格式: `Bearer <token>`)。

## 2. API 端點規格

### 2.1. 認證 (Authentication)

| 功能 | HTTP 方法 | 端點 | 認證 | 請求內容 (Body) | 成功回應 (200 OK) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **註冊新使用者** | `POST` | `/auth/register` | 否 | `email`, `password`, `name`, `graduation_year` | `{ "message": "User registered successfully" }` |
| **使用者登入** | `POST` | `/auth/login` | 否 | `email`, `password` | `{ "access_token": "...", "user_id": 1 }` |
| **LinkedIn 登入/同步** | `GET` | `/auth/linkedin` | 否 | (導向 LinkedIn 授權頁) | (回呼 `redirect_uri` 並帶有授權碼) |
| **LinkedIn 回呼** | `GET` | `/auth/linkedin/callback` | 否 | `code` (Query Param) | `{ "access_token": "...", "user_id": 1 }` |

### 2.2. 使用者與個人檔案 (Users & Profiles)

| 功能 | HTTP 方法 | 端點 | 認證 | 請求內容 (Body) | 成功回應 (200 OK) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **取得當前使用者資料** | `GET` | `/users/me` | 是 | - | `{ "id": 1, "email": "...", "name": "...", ... }` |
| **取得指定使用者公開資料** | `GET` | `/users/{user_id}` | 是 | - | `{ "id": 2, "name": "...", "graduation_year": ..., ... }` |
| **更新使用者個人檔案** | `PUT` | `/users/me/profile` | 是 | `current_company`, `current_title`, `skills`, ... | `{ "message": "Profile updated successfully" }` |

### 2.3. 職缺 (Jobs)

| 功能 | HTTP 方法 | 端點 | 認證 | 請求內容 (Body) | 成功回應 (200 OK / 201 Created) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **取得所有職缺列表** | `GET` | `/jobs` | 是 | - | `[ { "id": 1, "title": "...", "company": "...", ... } ]` |
| **發布新職缺** | `POST` | `/jobs` | 是 | `title`, `description`, `company`, `location` | `{ "id": 2, "message": "Job created successfully" }` |
| **取得單一職缺詳細資訊** | `GET` | `/jobs/{job_id}` | 是 | - | `{ "id": 1, "title": "...", "description": "...", ... }` |
| **對職缺提出交流請求** | `POST` | `/jobs/{job_id}/request` | 是 | - | `{ "request_id": 10, "status": "pending" }` |

### 2.4. 職缺交流請求 (Job Requests)

| 功能 | HTTP 方法 | 端點 | 認證 | 請求內容 (Body) | 成功回應 (200 OK) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **取得收到的交流請求** | `GET` | `/job-requests/received` | 是 | - | `[ { "id": 10, "job_title": "...", "requester": { ... } } ]` |
| **回覆交流請求** | `PUT` | `/job-requests/{request_id}` | 是 | `status` ("approved" / "rejected") | `{ "message": "Request status updated", "conversation_id": 5 }` (若同意) |

### 2.5. 活動 (Events)

| 功能 | HTTP 方法 | 端點 | 認證 | 請求內容 (Body) | 成功回應 (200 OK / 201 Created) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **取得所有活動列表** | `GET` | `/events` | 是 | - | `[ { "id": 1, "title": "...", "start_time": "...", ... } ]` |
| **建立新活動 (限管理員)** | `POST` | `/events` | 是 | `title`, `description`, `start_time`, `location`, ... | `{ "id": 2, "message": "Event created successfully" }` |
| **報名活動** | `POST` | `/events/{event_id}/register` | 是 | - | `{ "message": "Successfully registered for the event" }` |

### 2.6. 公佈欄 (Bulletins)

| 功能 | HTTP 方法 | 端點 | 認證 | 請求內容 (Body) | 成功回應 (200 OK) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **取得所有公告** | `GET` | `/bulletins` | 是 | - | `[ { "id": 1, "title": "...", "category": "...", ... } ]` |

### 2.7. 私訊 (Messaging)

| 功能 | HTTP 方法 | 端點 | 認證 | 請求內容 (Body) | 成功回應 (200 OK / 201 Created) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **取得對話列表** | `GET` | `/conversations` | 是 | - | `[ { "id": 5, "participants": [...], "last_message": "..." } ]` |
| **取得對話訊息** | `GET` | `/conversations/{conversation_id}` | 是 | - | `[ { "id": 1, "sender_id": 2, "content": "...", ... } ]` |
| **傳送新訊息** | `POST` | `/conversations/{conversation_id}` | 是 | `content` | `{ "id": 2, "message": "Message sent successfully" }` |

## 3. 資料模型 (參考)

詳細的資料庫 ERD 圖請參考 `database_schema.png`。

![資料庫ERD圖](database_schema.png)

## 4. 下一步

此 API 規格將作為後端開發的依據。完成後端開發與測試後，前端團隊即可根據此規格進行介面串接。

