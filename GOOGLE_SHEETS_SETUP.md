# Google Sheets 整合設定指南

## 📋 目錄
1. [概述](#概述)
2. [安全性考量](#安全性考量)
3. [Google Cloud 設定步驟](#google-cloud-設定步驟)
4. [Sheet 範本結構](#sheet-範本結構)
5. [環境變數設定](#環境變數設定)
6. [使用方式](#使用方式)

---

## 🎯 概述

本系統支援將系友會資料與 Google Sheets 雙向同步,方便管理與協作。

### 優點
- ✅ 視覺化資料管理
- ✅ 多人協作編輯
- ✅ 自動備份
- ✅ 匯入/匯出方便
- ✅ 資料驗證與圖表

### 需要同步的資料表
1. **系友帳號清單** (users + profiles)
2. **工作經歷記錄** (work_experiences)
3. **職缺發布清單** (jobs)
4. **活動清單** (events)
5. **活動報名統計** (event_registrations)
6. **公告發布清單** (bulletins)

---

## 🔒 安全性考量

### ⚠️ 絕對不可上傳到 Git 的檔案

```
❌ credentials.json          # Google API 認證金鑰
❌ token.json                # OAuth 存取 token
❌ .env                      # 環境變數(包含敏感資訊)
❌ service-account-key.json  # 服務帳號金鑰
```

### ✅ 安全措施

#### 1. .gitignore 規則(已設定)
```gitignore
# Google API credentials
credentials.json
token.json
service-account-key.json
*.json.secret

# Environment variables
.env
.env.local
.env.production
```

#### 2. 環境變數管理
所有敏感資訊存放在 `.env` 檔案中,不上傳 Git。

#### 3. 權限控制
- Google Sheets 僅限特定帳號存取
- 使用服務帳號 API 存取,不使用個人帳號
- 定期輪換 API 金鑰

---

## 🚀 Google Cloud 設定步驟

### Step 1: 建立 Google Cloud Project

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊「建立專案」
3. 專案名稱: `cit-alumni-platform`
4. 點擊「建立」

### Step 2: 啟用 Google Sheets API

1. 在專案中,前往「API 和服務」→「資料庫」
2. 搜尋「Google Sheets API」
3. 點擊「啟用」
4. 同樣啟用「Google Drive API」

### Step 3: 建立服務帳號

1. 前往「API 和服務」→「憑證」
2. 點擊「建立憑證」→「服務帳號」
3. 服務帳號名稱: `alumni-platform-sync`
4. 服務帳號 ID: `alumni-platform-sync@cit-alumni-platform.iam.gserviceaccount.com`
5. 點擊「建立並繼續」
6. 角色: 選擇「編輯者」
7. 完成

### Step 4: 產生 JSON 金鑰

1. 在「憑證」頁面,找到剛建立的服務帳號
2. 點擊右側的「⋮」→「管理金鑰」
3. 點擊「新增金鑰」→「建立新金鑰」
4. 選擇「JSON」格式
5. 下載金鑰檔案(命名為 `service-account-key.json`)
6. ⚠️ 將檔案移動到專案根目錄,並確認 `.gitignore` 已包含此檔案

### Step 5: 分享 Google Sheets 給服務帳號

建立 Sheet 後,將服務帳號的電子郵件地址(如: `alumni-platform-sync@cit-alumni-platform.iam.gserviceaccount.com`)加入為「編輯者」。

---

## 📊 Sheet 範本結構

### Sheet 1: 系友帳號清單

| 欄位 | 類型 | 說明 | 資料驗證 |
|------|------|------|---------|
| ID | 數字 | 系統編號 | 自動生成 |
| 電子郵件 | 文字 | 登入帳號 | Email 格式 |
| 姓名 | 文字 | 真實姓名 | 必填 |
| 角色 | 下拉選單 | user/admin | 限定選項 |
| 狀態 | 下拉選單 | active/inactive | 限定選項 |
| 畢業年份 | 數字 | 畢業年份 | 1980-2030 |
| 目前公司 | 文字 | 目前公司 | - |
| 職位 | 文字 | 目前職位 | - |
| 所在地 | 文字 | 工作地點 | - |
| 聯絡電話 | 文字 | 手機號碼 | - |
| LinkedIn | 網址 | LinkedIn 連結 | URL 格式 |
| 註冊日期 | 日期 | 註冊日期 | 日期格式 |
| 最後更新 | 日期 | 最後更新 | 自動填入 |

**條件格式化**:
- 狀態 = active: 綠色
- 狀態 = inactive: 灰色
- 角色 = admin: 藍色底色

### Sheet 2: 職缺發布清單

| 欄位 | 類型 | 說明 |
|------|------|------|
| ID | 數字 | 職缺編號 |
| 發布者 | 文字 | 發布者姓名 |
| 職缺標題 | 文字 | 職位名稱 |
| 公司名稱 | 文字 | 公司 |
| 地點 | 文字 | 工作地點 |
| 薪資範圍 | 文字 | 薪資 |
| 職缺狀態 | 下拉選單 | active/closed |
| 交流請求數 | 數字 | 請求次數 |
| 發布日期 | 日期 | 發布時間 |

### Sheet 3: 活動清單

| 欄位 | 類型 | 說明 |
|------|------|------|
| ID | 數字 | 活動編號 |
| 活動名稱 | 文字 | 活動標題 |
| 活動日期 | 日期 | 舉辦日期 |
| 活動時間 | 時間 | 開始時間 |
| 地點 | 文字 | 活動地點 |
| 活動類型 | 下拉選單 | 年度聚會/講座/聯誼 |
| 名額 | 數字 | 總名額 |
| 已報名 | 數字 | 目前人數 |
| 報名率 | 公式 | =已報名/名額 |
| 狀態 | 下拉選單 | upcoming/completed |

**圖表**: 報名率趨勢圖、活動類型分布

### Sheet 4: 工作經歷記錄

| 欄位 | 類型 | 說明 |
|------|------|------|
| ID | 數字 | 記錄編號 |
| 使用者ID | 數字 | 系友編號 |
| 使用者姓名 | 查詢 | =VLOOKUP(B2, 系友清單!A:C, 3, 0) |
| 公司名稱 | 文字 | 公司 |
| 職位 | 文字 | 職位名稱 |
| 地點 | 文字 | 工作地點 |
| 類型 | 下拉選單 | 全職/兼職/約聘 |
| 開始日期 | 日期 | 到職日 |
| 結束日期 | 日期 | 離職日 |
| 目前在職 | 勾選框 | 是/否 |
| 任職月數 | 公式 | 計算月數 |

---

## ⚙️ 環境變數設定

建立 `.env` 檔案在專案根目錄:

```env
# Google Sheets API
GOOGLE_SHEETS_CREDENTIALS_FILE=service-account-key.json
GOOGLE_SHEETS_SCOPES=https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/drive

# Google Sheets IDs (建立後填入)
SHEET_ID_USERS=
SHEET_ID_JOBS=
SHEET_ID_EVENTS=
SHEET_ID_WORK_EXPERIENCES=
SHEET_ID_BULLETINS=

# 同步設定
SYNC_ENABLED=true
SYNC_INTERVAL_MINUTES=30
SYNC_DIRECTION=bidirectional  # bidirectional, to_sheets, from_sheets

# 安全性
ALLOWED_SYNC_IPS=127.0.0.1,YOUR_SERVER_IP
SYNC_API_KEY=YOUR_RANDOM_API_KEY_HERE
```

---

## 📝 範例 requirements.txt 新增套件

```txt
# Google API
google-auth==2.23.0
google-auth-oauthlib==1.1.0
google-auth-httplib2==0.1.1
google-api-python-client==2.100.0
gspread==5.11.0
```

---

## 💻 使用方式

### 安裝套件
```bash
cd alumni_platform_api
pip install -r requirements.txt
```

### 手動同步
```bash
python src/scripts/sync_to_sheets.py --table users
python src/scripts/sync_to_sheets.py --all
```

### API 觸發同步
```bash
curl -X POST http://localhost:5001/api/admin/sync/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔄 同步機制

### 1. 手動同步
管理員在後台點擊「同步到 Sheets」按鈕

### 2. 定時同步
每 30 分鐘自動同步一次(可設定)

### 3. 即時同步
資料更新時立即同步到 Sheets

### 衝突解決
- 比較 `updated_at` 與 `last_synced_at`
- 最新的資料為準
- 重大衝突需手動處理

---

## 📚 參考資源

- [Google Sheets API 文件](https://developers.google.com/sheets/api)
- [gspread 文件](https://docs.gspread.org/)
- [Python Quickstart](https://developers.google.com/sheets/api/quickstart/python)

---

## ⚠️ 注意事項

1. **不要提交認證檔案到 Git**
2. **定期輪換 API 金鑰**
3. **限制 Sheet 存取權限**
4. **監控 API 配額使用量**
5. **備份重要資料**

---

**最後更新**: 2025-10-01
**維護者**: 系友會技術團隊
