# 🚀 系友會平台優化路線圖

## 📋 總覽

本文件規劃系友會平台的完整優化步驟,重點在於建立可擴展、支援 Google Sheets 整合的資料庫系統。

---

## 🎯 優化目標

1. **模組化資料庫架構** - 6大環節獨立設計
2. **Google Sheets 整合** - 雙向同步,方便管理
3. **完善的使用者系統** - 詳細檔案、職涯追蹤
4. **資料匯入/匯出** - 批次作業,Excel/CSV 支援
5. **強化的管理後台** - 圖形化資料管理
6. **API 標準化** - RESTful 設計,完整文件

---

## 📊 階段規劃

### 🔷 Phase 1: 資料庫重構 (1-2週)

#### Step 1.1: 設計資料庫架構 ✅
- [x] 完成 `DATABASE_DESIGN.md` 文件
- [x] 規劃 6 大環節
- [x] 定義 Google Sheets 映射關係

#### Step 1.2: 建立新版資料模型 (進行中 🔄)
**檔案結構**:
```
alumni_platform_api/src/models_v2/
├── __init__.py          # 模型匯出
├── base.py              # 基礎類別與 Mixins
├── user_auth.py         # 環節1: 使用者與認證
├── career.py            # 環節2: 職涯與經歷
├── jobs.py              # 環節3: 職缺與媒合
├── messages.py          # 職缺私訊系統
├── events.py            # 環節4: 活動管理
├── content.py           # 環節5: 內容與公告
└── system.py            # 環節6: 系統與通知
```

**核心特色**:
- ✅ 每個模型包含 `sheet_row_id` 與 `last_synced_at`
- ✅ 使用 Mixin 模式共享通用欄位
- ✅ 完整的關聯設計與級聯刪除
- ✅ JSON 欄位支援複雜資料結構

#### Step 1.3: 資料庫遷移
- [ ] 建立 Alembic 遷移腳本
- [ ] 資料轉換腳本(舊DB → 新DB)
- [ ] 測試資料生成器

---

### 🔷 Phase 2: Google Sheets 整合 (1週)

#### Step 2.1: Google API 設定
- [ ] 建立 Google Cloud Project
- [ ] 啟用 Google Sheets API
- [ ] 設定 OAuth 2.0 認證
- [ ] 產生服務帳號金鑰

#### Step 2.2: Sheet 範本建立
建立以下 Google Sheets 範本:
1. **系友帳號清單** (users + user_profiles)
2. **工作經歷記錄** (work_experiences)
3. **技能清單** (skills + user_skills)
4. **職缺發布清單** (jobs)
5. **活動清單** (events)
6. **活動報名統計** (event_registrations)
7. **公告發布清單** (bulletins)

**範本特色**:
- 📊 資料驗證規則
- 🎨 條件格式化(狀態顏色)
- 📈 自動統計圖表
- 🔒 欄位保護設定

#### Step 2.3: 同步服務實作
**檔案**:  `alumni_platform_api/src/services/google_sheets.py`

**功能**:
```python
class GoogleSheetsService:
    def export_to_sheet(model_name, data)      # 匯出資料
    def import_from_sheet(sheet_name)          # 匯入資料
    def sync_model(model_name, direction)      # 同步特定模型
    def batch_sync()                           # 批次同步所有
    def resolve_conflicts(conflicts)           # 衝突解決
```

---

### 🔷 Phase 3: 後端 API 擴充 (1週)

#### Step 3.1: 新版 API 路由
**檔案結構**:
```
alumni_platform_api/src/routes_v2/
├── users.py         # 使用者管理 CRUD
├── profiles.py      # 個人檔案管理
├── career.py        # 職涯資料管理
├── jobs.py          # 職缺系統
├── events.py        # 活動系統
├── bulletins.py     # 公告系統
├── sync.py          # 同步控制 API
└── admin.py         # 管理後台 API
```

#### Step 3.2: RESTful API 設計
**標準化路由規範**:
```
GET    /api/v2/users               # 列表
GET    /api/v2/users/:id           # 單筆
POST   /api/v2/users               # 新增
PUT    /api/v2/users/:id           # 更新
DELETE /api/v2/users/:id           # 刪除

POST   /api/v2/users/:id/export    # 匯出單筆
POST   /api/v2/users/export-all    # 匯出全部
POST   /api/v2/users/import        # 批次匯入
```

#### Step 3.3: 匯入/匯出功能
- [ ] CSV 匯出
- [ ] Excel 匯出
- [ ] JSON 匯出
- [ ] CSV 匯入(驗證 + 預覽)
- [ ] 批次更新

---

### 🔷 Phase 4: 前端優化 (1-2週)

#### Step 4.1: 表單增強
**改進項目**:
- [ ] 多步驟表單(Step Wizard)
- [ ] 即時驗證與錯誤提示
- [ ] 自動儲存草稿
- [ ] 圖片上傳與裁剪
- [ ] 日期時間選擇器
- [ ] 富文本編輯器(TipTap)

#### Step 4.2: 資料管理介面
**新增頁面**:
1. **個人檔案編輯頁** (多頁籤)
   - 基本資料
   - 工作經歷
   - 教育背景
   - 技能專長
   - 隱私設定

2. **管理後台** (僅管理員)
   - 使用者列表(篩選、搜尋、分頁)
   - 資料統計儀表板
   - 同步控制面板
   - 匯入/匯出工具
   - 系統日誌檢視

#### Step 4.3: 資料視覺化
- [ ] Chart.js 整合
- [ ] 統計圖表元件
- [ ] 即時資料更新
- [ ] 互動式儀表板

---

### 🔷 Phase 5: 測試與文件 (1週)

#### Step 5.1: 單元測試
```
tests/
├── test_models.py       # 模型測試
├── test_api.py          # API 測試
├── test_sync.py         # 同步功能測試
└── test_imports.py      # 匯入功能測試
```

**測試覆蓋率目標**: > 80%

#### Step 5.2: API 文件
- [ ] 使用 Swagger/OpenAPI 規格
- [ ] 自動生成 API 文件
- [ ] 互動式 API 測試介面
- [ ] 範例程式碼

#### Step 5.3: 使用者文件
- [ ] 使用者手冊
- [ ] 管理員手冊
- [ ] Google Sheets 設定指南
- [ ] 常見問題 FAQ

---

## 🔄 當前進度

### ✅ 已完成
1. 資料庫架構設計文件
2. 6 大環節規劃
3. Google Sheets 映射設計
4. 專案 Git repository 建立

### 🔄 進行中
1. **建立新版資料模型** (Step 1.2)
   - 建立基礎類別與 Mixins
   - 實作環節 1: 使用者與認證模型
   - 實作環節 2: 職涯與經歷模型

### ⏳ 待執行
- 其餘 4 個環節模型
- 資料庫遷移腳本
- Google Sheets 整合
- 後續所有 Phases

---

## 📅 時程估計

| 階段 | 預計時間 | 開始日期 | 完成日期 |
|------|---------|---------|---------|
| Phase 1 | 1-2週 | 2025-10-01 | 2025-10-14 |
| Phase 2 | 1週 | 2025-10-15 | 2025-10-21 |
| Phase 3 | 1週 | 2025-10-22 | 2025-10-28 |
| Phase 4 | 1-2週 | 2025-10-29 | 2025-11-11 |
| Phase 5 | 1週 | 2025-11-12 | 2025-11-18 |

**總計**: 約 5-7 週

---

## 🎯 下一步行動

### 立即執行 (今天)
1. ✅ 完成資料庫設計文件
2. 🔄 建立基礎模型類別 (`base.py`)
3. 🔄 實作環節 1 模型 (`user_auth.py`)
4. ⏳ 實作環節 2 模型 (`career.py`)

### 本週目標
- 完成所有 6 個環節的模型檔案
- 建立測試資料生成器
- 測試模型之間的關聯

### 下週目標
- 資料庫遷移腳本
- Google Sheets API 設定
- 建立第一個 Sheet 範本

---

## 📞 聯絡資訊

如有任何問題或建議,請聯繫:
- **技術團隊**: 色彩與照明科技研究所系友會
- **GitHub**: https://github.com/Ayueh0102/cit_lab_platform

---

**文件版本**: v1.0  
**最後更新**: 2025-10-01  
**維護者**: Claude Code Assistant
