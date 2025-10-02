# CSV 匯入/匯出功能使用指南

## ✅ 功能完成狀態

已完成管理員專用的 CSV 匯入/匯出功能整合!

---

## 🔐 權限說明

**重要:** CSV 匯入/匯出功能**僅限管理員使用**

- ✅ 管理員帳號 (`role: 'admin'`) 可以使用所有功能
- ❌ 一般用戶 (`role: 'user'`) 無法看到或使用這些功能
- ⚠️ 嘗試使用時會顯示 "此功能僅限管理員使用！"

---

## 🚀 快速開始

### 1. 啟動系統

#### 啟動前端 (已運行中)
```bash
cd alumni-platform
npm run dev
```
前端網址: **http://localhost:5173/**

#### 啟動後端 API (已運行中)
```bash
cd alumni_platform_api
source venv/bin/activate
python3 src/main.py
```
後端 API: **http://localhost:5001/**

### 2. 登入管理員帳號

使用以下測試帳號登入:

```
電子郵件: admin@example.com
密碼: admin123
```

### 3. 進入管理後台

登入後,點擊側邊欄的 **🔧 管理後台**

---

## 📊 功能說明

### CSV 匯出功能

在管理後台的「資料管理 (CSV 匯入/匯出)」區塊,提供 5 個匯出按鈕:

1. **📥 匯出系友帳號清單**
   - 匯出所有系友的基本資料與個人檔案
   - 檔案名稱: `系友帳號清單_YYYY-MM-DD.csv`
   - API: `GET /api/csv/export/users`

2. **📥 匯出職缺清單**
   - 匯出所有已發布的職缺資訊
   - 檔案名稱: `職缺發布清單_YYYY-MM-DD.csv`
   - API: `GET /api/csv/export/jobs`

3. **📥 匯出活動清單**
   - 匯出所有活動資訊與報名統計
   - 檔案名稱: `活動清單_YYYY-MM-DD.csv`
   - API: `GET /api/csv/export/events`

4. **📥 匯出公告清單**
   - 匯出所有公告與公佈欄內容
   - 檔案名稱: `公告發布清單_YYYY-MM-DD.csv`
   - API: `GET /api/csv/export/bulletins`

5. **📦 批次匯出所有資料 (ZIP)**
   - 一次匯出所有資料表為 ZIP 壓縮檔
   - 檔案名稱: `系友會資料匯出_YYYY-MM-DD-HHMMSS.zip`
   - API: `GET /api/csv/export/all`

#### 操作步驟:
1. 點擊對應的匯出按鈕
2. 系統會自動下載 CSV 檔案
3. 通知中心會顯示「CSV 匯出成功」

---

### CSV 匯入功能

在管理後台的「資料管理 (CSV 匯入/匯出)」區塊,提供 3 個匯入按鈕:

1. **📤 匯入系友帳號清單**
   - 從 CSV 匯入或更新系友資料
   - API: `POST /api/csv/import/users`

2. **📤 匯入職缺清單**
   - 從 CSV 匯入或更新職缺資料
   - API: `POST /api/csv/import/jobs`

3. **📤 匯入公告清單**
   - 從 CSV 匯入或更新公告資料
   - API: `POST /api/csv/import/bulletins`

#### 操作步驟:
1. 點擊對應的匯入按鈕
2. 選擇 CSV 檔案 (系統會自動開啟檔案選擇器)
3. 等待上傳與處理
4. 系統會顯示匯入結果:
   ```
   ✅ 系友帳號匯入成功！

   新增: 5 筆
   更新: 3 筆
   總計: 8 筆

   ⚠️ 錯誤 (2 筆):
   第 8 行: 缺少電子郵件
   第 12 行: 畢業年份格式錯誤
   ```
5. 匯入成功後頁面會自動重新載入,顯示最新資料

---

## 🔄 完整使用流程

### 方案 A: 從系統匯出到 Google Sheets

```
1. 登入管理員帳號 (admin@example.com)
   ↓
2. 點擊側邊欄「管理後台」
   ↓
3. 在「資料管理」區塊點擊「匯出系友帳號清單」
   ↓
4. 下載 CSV 檔案到本地
   ↓
5. 開啟 Google Sheets
   ↓
6. 檔案 → 匯入 → 上傳 CSV
   ↓
7. 選擇「取代目前的工作表」
   ↓
8. 完成!可在 Google Sheets 編輯資料
```

### 方案 B: 從 Google Sheets 匯入到系統

```
1. 在 Google Sheets 編輯資料
   ↓
2. 檔案 → 下載 → 逗號分隔值 (.csv)
   ↓
3. 登入管理員帳號
   ↓
4. 點擊側邊欄「管理後台」
   ↓
5. 在「資料管理」區塊點擊「匯入系友帳號清單」
   ↓
6. 選擇剛下載的 CSV 檔案
   ↓
7. 等待上傳完成
   ↓
8. 查看匯入結果報告
   ↓
9. 頁面自動重新載入,顯示更新後的資料
```

---

## 🔧 技術細節

### 權限檢查機制

所有 CSV 功能都包含雙重權限檢查:

#### 1. 前端檢查
```javascript
if (currentUser.role !== 'admin') {
  showMessage('⚠️ 此功能僅限管理員使用！');
  return;
}
```

#### 2. 後端檢查
```python
@token_required  # JWT Token 驗證
def export_users(current_user):
    # 只有通過認證的管理員才能執行
    ...
```

### API 通訊

#### 認證方式
- 使用 JWT Bearer Token 認證
- Token 存放在 `localStorage.authToken`
- 每個請求在 Header 中加入: `Authorization: Bearer <token>`

#### 檔案下載
```javascript
const response = await fetch(`${API_BASE_URL}/api/csv/export/users`, {
  headers: {
    'Authorization': `Bearer ${getAuthToken()}`
  }
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = '系友帳號清單.csv';
a.click();
```

#### 檔案上傳
```javascript
const formData = new FormData();
formData.append('file', file);

const response = await fetch(`${API_BASE_URL}/api/csv/import/users`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${getAuthToken()}`
  },
  body: formData
});
```

---

## 📋 CSV 檔案格式

### 系友帳號清單.csv
```csv
ID,電子郵件,姓名,畢業年份,班級,目前公司,職位,個人網站,LinkedIn ID,註冊日期,最後更新
1,admin@example.com,系統管理員,2015,A班,系友會,平台管理員,,,2025-09-30,2025-09-30
2,wang@example.com,王小明,2020,A班,ASUS,光學工程師,,,2025-09-30,2025-09-30
```

### 職缺發布清單.csv
```csv
ID,發布者,職缺標題,公司名稱,地點,薪資範圍,職缺描述,交流請求數,發布日期
1,王小明,光學工程師,台積電,新竹,80-120萬,負責先進製程光學系統設計...,12,2025-09-30
```

### 活動清單.csv
```csv
ID,活動名稱,開始時間,結束時間,地點,名額,已報名,報名率,報名截止日,建立者,活動描述,建立日期
1,2025年度系友大會,2025-10-15 14:00,2025-10-15 18:00,國立清華大學,100,67,67.0%,2025-10-10,系友會,年度系友聚會...,2025-09-30
```

---

## ⚠️ 注意事項

### 1. 編碼格式
- 所有 CSV 檔案使用 **UTF-8 with BOM** 編碼
- 確保 Excel 可以正確顯示中文

### 2. 匯入邏輯
- **系友帳號**: 根據電子郵件判斷,存在則更新,不存在則新增
- **職缺/公告**: 根據 ID 判斷,有 ID 則更新,無 ID 則新增

### 3. 安全性
- 僅管理員可使用 (前後端雙重驗證)
- 所有 API 請求需要 JWT Token
- 上傳檔案僅接受 .csv 格式

### 4. 錯誤處理
- 匯入時逐行處理,單筆錯誤不影響其他資料
- 詳細錯誤訊息會顯示在結果報告中
- 前 5 個錯誤會直接顯示,超過則顯示總數

---

## 🎯 測試流程

### 測試匯出功能

1. 登入管理員帳號: `admin@example.com / admin123`
2. 進入管理後台
3. 點擊「📥 匯出系友帳號清單」
4. 確認下載了 CSV 檔案
5. 用 Excel 或文字編輯器開啟檢查

### 測試匯入功能

1. 編輯匯出的 CSV 檔案,修改部分資料
2. 回到管理後台
3. 點擊「📤 匯入系友帳號清單」
4. 選擇剛編輯的 CSV 檔案
5. 等待上傳完成
6. 檢查匯入結果報告
7. 頁面重新載入後,確認資料已更新

### 測試權限控制

1. 登出管理員帳號
2. 登入一般用戶帳號: `wang@example.com / password123`
3. 確認側邊欄沒有「管理後台」選項
4. (如果手動進入) 確認無法看到 CSV 匯入/匯出按鈕

---

## 🐛 常見問題

### Q1: 點擊匯出按鈕沒有反應?
**A**:
1. 確認後端 API 已啟動 (http://localhost:5001)
2. 開啟瀏覽器開發者工具 (F12) 檢查 Console 錯誤
3. 確認網路請求狀態 (Network 標籤)

### Q2: 匯入後看不到新資料?
**A**: 匯入成功後頁面會自動重新載入 (2 秒後),請稍等。如果沒有自動刷新,請手動重新載入頁面 (F5)。

### Q3: CSV 檔案在 Excel 中顯示亂碼?
**A**: 確認檔案編碼為 UTF-8 with BOM。本系統匯出的檔案已使用正確編碼,可直接在 Excel 中開啟。

### Q4: 匯入時顯示 "缺少認證 token"?
**A**:
1. 確認已登入管理員帳號
2. 檢查 localStorage 中是否有 `authToken`
3. 可能需要重新登入以取得新的 Token

### Q5: 批次匯出的 ZIP 檔解壓縮後檔名亂碼?
**A**: 使用支援 UTF-8 的解壓縮軟體,如 7-Zip (Windows) 或內建工具 (macOS)。

---

## 📊 功能對照表

| 功能 | 前端位置 | 後端 API | 權限 | 狀態 |
|------|---------|----------|------|------|
| 匯出系友帳號 | 管理後台 → 資料管理 | GET /api/csv/export/users | 僅管理員 | ✅ 完成 |
| 匯出職缺清單 | 管理後台 → 資料管理 | GET /api/csv/export/jobs | 僅管理員 | ✅ 完成 |
| 匯出活動清單 | 管理後台 → 資料管理 | GET /api/csv/export/events | 僅管理員 | ✅ 完成 |
| 匯出公告清單 | 管理後台 → 資料管理 | GET /api/csv/export/bulletins | 僅管理員 | ✅ 完成 |
| 批次匯出 ZIP | 管理後台 → 資料管理 | GET /api/csv/export/all | 僅管理員 | ✅ 完成 |
| 匯入系友帳號 | 管理後台 → 資料管理 | POST /api/csv/import/users | 僅管理員 | ✅ 完成 |
| 匯入職缺清單 | 管理後台 → 資料管理 | POST /api/csv/import/jobs | 僅管理員 | ✅ 完成 |
| 匯入公告清單 | 管理後台 → 資料管理 | POST /api/csv/import/bulletins | 僅管理員 | ✅ 完成 |

---

## 📚 相關文件

- **SIMPLE_SHEETS_GUIDE.md** - 簡易 Google Sheets 整合指南
- **GOOGLE_SHEETS_TEMPLATE.md** - Google Sheets 範本建立指南
- **CSV_API_DOCUMENTATION.md** - API 使用文件
- **CSV_INTEGRATION_SUMMARY.md** - 整合完成摘要

---

## 🎉 總結

現在你可以:
- ✅ 使用管理員帳號匯出所有資料為 CSV
- ✅ 在 Google Sheets 或 Excel 中編輯資料
- ✅ 將編輯後的資料匯入回系統
- ✅ 批次匯出所有資料為 ZIP 備份
- ✅ 完整的權限控制(僅管理員可用)
- ✅ 詳細的匯入結果報告

**開始使用:** 登入 http://localhost:5173/ 並使用 `admin@example.com / admin123` 測試功能!

---

**建立日期**: 2025-10-02
**版本**: 1.0
**維護者**: 系友會技術團隊
