# 📋 專案清理與待實現功能清單

## 🗑️ 可移除的文檔（重複或過時）

### 測試報告（保留最新的即可）
- CHROME_MCP_TEST_REPORT.md ✅ 保留（最新的測試報告）
- CHROME_TEST_FINAL_REPORT.md ❌ 移除
- COMPREHENSIVE_TEST_REPORT.md ❌ 移除
- TEST_PROGRESS_REPORT.md ❌ 移除
- TEST_REPORT.md ❌ 移除

### 實現報告（保留最新的即可）
- COMPLETE_IMPLEMENTATION_SUMMARY.md ❌ 移除
- FINAL_IMPLEMENTATION_REPORT.md ❌ 移除
- FINAL_SUMMARY.md ❌ 移除
- IMPLEMENTATION_COMPLETE.md ❌ 移除
- IMPLEMENTATION_PROGRESS.md ❌ 移除
- P0_COMPLETION_REPORT.md ❌ 移除
- TASK_IMPLEMENTATION.md ❌ 移除

### 其他過時文檔
- FEATURE_COMPLETENESS_CHECK.md ❌ 移除（已過時，功能已實現）
- OPTIMIZATION_REPORT.md ❌ 移除（優化已完成）
- REFACTOR_SUMMARY.md ❌ 移除（重構已完成）

### 保留的核心文檔
- README.md ✅
- CHANGELOG.md ✅
- project_documentation.md ✅
- DATABASE_MODELS_V2_COMPLETE.md ✅
- API_V2_DOCUMENTATION.md ✅

## 🗑️ 可移除的程式碼

### 未使用的檔案
- `alumni_platform_api/src/routes/auth_v2_async.py` ❌ 未註冊使用
- `alumni_platform_api/src/routes/jobs_v2_async.py` ❌ 未註冊使用

### 舊版前端（已被 Next.js 取代）
- `alumni-platform/` 目錄 ❌ 整個目錄可移除

### 日誌和臨時檔案
- `*.log` 檔案 ❌ 應在 .gitignore 中
- `*.pid` 檔案 ❌ 應在 .gitignore 中

## ✅ 待實現功能（P2-P3 優先級）

### P2 優先級
1. **系統設定功能 API 整合**
   - 位置：`/settings/page.tsx` (第 93 行有 TODO)
   - 狀態：通知設定已部分實現，但未連接後端 API
   - 需要：實現 `api.settings.updateNotifications()` API

2. **檔案上傳功能**
   - 狀態：後端 API 存在，前端未實現
   - 需要：實現圖片上傳（頭像、活動照片等）
   - 需要：實現文件上傳（履歷、附件等）

### P3 優先級
3. **即時通知功能**
   - 需要：WebSocket 或 Polling 機制
   - 需要：瀏覽器通知 API 整合

4. **訊息即時更新**
   - 需要：WebSocket 或 Polling 機制
   - 需要：未讀訊息即時更新

5. **訊息功能增強**
   - 需要：標記已讀功能
   - 需要：刪除對話功能
   - 需要：搜尋訊息功能

## 📊 目前完成度

### 已完成功能 (約 90%)
- ✅ 認證系統 (100%)
- ✅ 職缺模組 (100%)
- ✅ 活動模組 (100%)
- ✅ 公告模組 (100%)
- ✅ 系友通訊錄 (100%)
- ✅ 訊息系統 (85%)
- ✅ 通知系統 (90%)
- ✅ 管理後台 (95%)
- ✅ 職涯管理 (100%)
- ✅ CSV 匯入匯出 (100%)

### 待完善功能 (約 10%)
- ⚠️ 系統設定功能 (70%)
- ⚠️ 檔案上傳功能 (0%)
- ⚠️ 即時通知 (0%)
- ⚠️ 訊息即時更新 (0%)

