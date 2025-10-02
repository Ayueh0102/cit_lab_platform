# CSV 匯入/匯出 API 文件

## 📋 概述

本 API 提供系友會平台資料的 CSV 匯入與匯出功能,支援:
- 系友帳號清單
- 職缺發布清單
- 活動清單
- 公告發布清單

---

## 🔐 認證

所有 API 端點都需要 JWT Token 認證。

### 取得 Token

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**回應:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "系統管理員"
  }
}
```

### 使用 Token

在所有 API 請求的 Header 中加入:
```
Authorization: Bearer <your_token_here>
```

---

## 📥 匯出 API

### 1. 匯出系友帳號清單

```bash
GET /api/csv/export/users
Authorization: Bearer <token>
```

**回應:** CSV 檔案下載
- 檔案名稱: `系友帳號清單_YYYYMMDD.csv`
- 編碼: UTF-8 with BOM (支援 Excel)

**CSV 欄位:**
```
ID, 電子郵件, 姓名, 畢業年份, 班級, 目前公司, 職位, 個人網站, LinkedIn ID, 註冊日期, 最後更新
```

**範例:**
```bash
curl -X GET http://localhost:5001/api/csv/export/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output 系友帳號清單.csv
```

---

### 2. 匯出職缺發布清單

```bash
GET /api/csv/export/jobs
Authorization: Bearer <token>
```

**回應:** CSV 檔案下載
- 檔案名稱: `職缺發布清單_YYYYMMDD.csv`

**CSV 欄位:**
```
ID, 發布者, 職缺標題, 公司名稱, 地點, 薪資範圍, 職缺描述, 交流請求數, 發布日期
```

**範例:**
```bash
curl -X GET http://localhost:5001/api/csv/export/jobs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output 職缺發布清單.csv
```

---

### 3. 匯出活動清單

```bash
GET /api/csv/export/events
Authorization: Bearer <token>
```

**回應:** CSV 檔案下載
- 檔案名稱: `活動清單_YYYYMMDD.csv`

**CSV 欄位:**
```
ID, 活動名稱, 開始時間, 結束時間, 地點, 名額, 已報名, 報名率, 報名截止日, 建立者, 活動描述, 建立日期
```

**範例:**
```bash
curl -X GET http://localhost:5001/api/csv/export/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output 活動清單.csv
```

---

### 4. 匯出公告發布清單

```bash
GET /api/csv/export/bulletins
Authorization: Bearer <token>
```

**回應:** CSV 檔案下載
- 檔案名稱: `公告發布清單_YYYYMMDD.csv`

**CSV 欄位:**
```
ID, 公告標題, 分類, 內容摘要, 是否置頂, 發布者, 發布日期
```

**範例:**
```bash
curl -X GET http://localhost:5001/api/csv/export/bulletins \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output 公告發布清單.csv
```

---

### 5. 批次匯出所有資料

```bash
GET /api/csv/export/all
Authorization: Bearer <token>
```

**回應:** ZIP 檔案下載
- 檔案名稱: `系友會資料匯出_YYYYMMDD_HHMMSS.zip`
- 包含內容:
  - 01_系友帳號清單.csv
  - 02_職缺發布清單.csv
  - 03_活動清單.csv
  - 04_公告發布清單.csv

**範例:**
```bash
curl -X GET http://localhost:5001/api/csv/export/all \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output 系友會資料匯出.zip
```

---

## 📤 匯入 API

### 1. 匯入系友帳號清單

```bash
POST /api/csv/import/users
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**請求參數:**
- `file`: CSV 檔案

**CSV 格式要求:**
- 必須包含標題列
- 必要欄位: `電子郵件`, `姓名`
- 選用欄位: `畢業年份`, `班級`, `目前公司`, `職位`, `個人網站`, `LinkedIn ID`

**範例:**
```bash
curl -X POST http://localhost:5001/api/csv/import/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@系友帳號清單.csv"
```

**成功回應:**
```json
{
  "success": true,
  "imported": 5,
  "updated": 3,
  "total": 8,
  "errors": []
}
```

**錯誤回應:**
```json
{
  "success": true,
  "imported": 5,
  "updated": 2,
  "total": 7,
  "errors": [
    "第 8 行: 缺少電子郵件",
    "第 12 行: 畢業年份格式錯誤"
  ]
}
```

**匯入邏輯:**
- 如果電子郵件已存在 → **更新**該使用者資料
- 如果電子郵件不存在 → **建立**新使用者
- 新建立的使用者預設密碼為 `default123`

---

### 2. 匯入職缺發布清單

```bash
POST /api/csv/import/jobs
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**請求參數:**
- `file`: CSV 檔案

**CSV 格式要求:**
- 必要欄位: `職缺標題`, `公司名稱`, `地點`
- 選用欄位: `ID`, `薪資範圍`, `職缺描述`

**範例:**
```bash
curl -X POST http://localhost:5001/api/csv/import/jobs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@職缺發布清單.csv"
```

**匯入邏輯:**
- 如果有 `ID` 欄位且存在 → **更新**該職缺
- 如果沒有 `ID` 或 ID 不存在 → **建立**新職缺(發布者為當前登入使用者)

---

### 3. 匯入公告發布清單

```bash
POST /api/csv/import/bulletins
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**請求參數:**
- `file`: CSV 檔案

**CSV 格式要求:**
- 必要欄位: `公告標題`, `分類`, `內容摘要`
- 選用欄位: `ID`, `是否置頂`

**範例:**
```bash
curl -X POST http://localhost:5001/api/csv/import/bulletins \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@公告發布清單.csv"
```

**匯入邏輯:**
- 如果有 `ID` 欄位且存在 → **更新**該公告
- 如果沒有 `ID` 或 ID 不存在 → **建立**新公告(作者為當前登入使用者)

---

## 🔧 使用情境

### 情境 1: 定期備份資料

```bash
# 每週備份一次所有資料
curl -X GET http://localhost:5001/api/csv/export/all \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output backup_$(date +%Y%m%d).zip
```

### 情境 2: 從 Google Sheets 更新系友資料

1. 從 Google Sheets 下載 CSV
2. 上傳更新:
```bash
curl -X POST http://localhost:5001/api/csv/import/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@系友帳號清單.csv"
```

### 情境 3: 批次新增職缺

1. 建立 CSV 檔案(不包含 ID 欄位)
2. 匯入:
```bash
curl -X POST http://localhost:5001/api/csv/import/jobs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@新職缺清單.csv"
```

---

## ⚠️ 注意事項

### 編碼
- 所有 CSV 檔案使用 **UTF-8 with BOM** 編碼
- 確保 Excel 可正確顯示中文

### 日期格式
- 標準格式: `YYYY-MM-DD` (例: 2025-10-01)
- 日期時間格式: `YYYY-MM-DD HH:MM` (例: 2025-10-01 14:30)

### 檔案大小限制
- 預設上傳限制: 10MB
- 可在環境變數中調整: `MAX_UPLOAD_SIZE=20`

### 資料驗證
- 電子郵件必須為有效格式
- 畢業年份必須為數字
- 是否置頂必須為 `是` 或 `否`

---

## 🐛 錯誤處理

### 常見錯誤

#### 401 Unauthorized
```json
{
  "error": "缺少認證 token"
}
```
**解決方法:** 確認 Authorization header 正確設定

#### 400 Bad Request
```json
{
  "error": "請選擇檔案"
}
```
**解決方法:** 確認檔案欄位名稱為 `file`

#### 500 Internal Server Error
```json
{
  "error": "匯入失敗: database locked"
}
```
**解決方法:** 檢查資料庫是否被其他程序佔用

---

## 📚 完整工作流程範例

### 使用 Python 腳本自動化

```python
import requests

# 1. 登入取得 Token
login_response = requests.post('http://localhost:5001/api/auth/login', json={
    'email': 'admin@example.com',
    'password': 'admin123'
})
token = login_response.json()['token']

# 2. 匯出資料
headers = {'Authorization': f'Bearer {token}'}
response = requests.get('http://localhost:5001/api/csv/export/users', headers=headers)

with open('系友帳號清單.csv', 'wb') as f:
    f.write(response.content)

print("✅ 匯出完成!")

# 3. 匯入資料
files = {'file': open('系友帳號清單_更新.csv', 'rb')}
response = requests.post('http://localhost:5001/api/csv/import/users',
                        headers=headers, files=files)

result = response.json()
print(f"✅ 匯入完成!")
print(f"   新增: {result['imported']} 筆")
print(f"   更新: {result['updated']} 筆")
print(f"   總計: {result['total']} 筆")

if result['errors']:
    print(f"⚠️  錯誤: {len(result['errors'])} 筆")
    for error in result['errors']:
        print(f"   - {error}")
```

---

## 🔗 相關文件

- **SIMPLE_SHEETS_GUIDE.md** - Google Sheets 整合指南
- **GOOGLE_SHEETS_TEMPLATE.md** - Google Sheets 範本建立指南
- **csv_samples/** - CSV 範例檔案

---

**最後更新**: 2025-10-01
**API 版本**: 1.0
**維護者**: 系友會技術團隊
