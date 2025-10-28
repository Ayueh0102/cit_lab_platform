# 🗄️ 後端與資料庫架構建議

## 📋 目錄
1. [當前狀況分析](#當前狀況分析)
2. [V2 後端問題分析](#v2-後端問題分析)
3. [資料庫選擇建議](#資料庫選擇建議)
4. [建議方案](#建議方案)
5. [實施計劃](#實施計劃)

---

## 📊 當前狀況分析

### 現有架構

```
├── 後端 V1 (main.py) ✅ 正常運行
│   ├── Flask 3.x
│   ├── SQLAlchemy ORM
│   ├── SQLite 資料庫
│   └── JWT 認證
│
└── 後端 V2 (main_v2.py) ❌ 模型關聯問題
    ├── Flask 3.x
    ├── SQLAlchemy ORM
    ├── SQLite 資料庫
    ├── JWT 認證
    └── 更完整的模型設計
```

### V1 vs V2 對比

| 項目 | V1 (main.py) | V2 (main_v2.py) |
|------|-------------|----------------|
| **狀態** | ✅ 運行正常 | ❌ 啟動失敗 |
| **模型複雜度** | 簡單 | 複雜（更完整） |
| **API 端點** | `/api/*` | `/api/v2/*` |
| **關聯定義** | 較少 | 更多（有錯誤） |
| **功能完整度** | 基本功能 | 功能更全面 |
| **維護性** | 良好 | 需要修復 |

---

## 🐛 V2 後端問題分析

### 主要錯誤

#### 錯誤 #1: 模型關聯不匹配
```python
# user_auth.py
posted_jobs = relationship('Job', foreign_keys='Job.poster_id', back_populates='poster')
                                                    ^^^^^^^^^^
# jobs.py
user_id = Column(Integer, ForeignKey('users_v2.id'), ...)
user = relationship('User', back_populates='jobs')
                                           ^^^^^
```

**問題**: 
- User 模型期待 Job 有 `poster_id` 欄位
- 但 Job 模型實際使用 `user_id` 欄位
- `back_populates` 名稱不匹配

#### 錯誤 #2: 缺少關聯屬性
```python
AttributeError: Mapper 'Mapper[User(users_v2)]' has no property 'organized_events'
```

**問題**: Event 模型的 `organizer` 關聯期待 User 有 `organized_events` 屬性

#### 錯誤 #3: 重複的關聯定義
```python
sqlalchemy.exc.ArgumentError: Error creating backref 'event_registrations' 
on relationship 'EventRegistration.user': property of that name exists
```

**問題**: `event_registrations` 被定義了兩次

### 修復難度評估

| 問題 | 難度 | 預估時間 | 風險 |
|------|------|---------|------|
| 關聯名稱統一 | 中 | 2-3 小時 | 中 |
| 外鍵欄位對齊 | 中 | 1-2 小時 | 低 |
| 刪除重複定義 | 低 | 30 分鐘 | 低 |
| 完整測試 | 中 | 2-3 小時 | 中 |
| **總計** | - | **6-9 小時** | **中** |

---

## 💡 資料庫選擇建議

### Option A: 保持 SQLite ⭐⭐⭐⭐⭐ (推薦)

#### 優點 ✅
1. **零配置**: 不需要額外安裝資料庫伺服器
2. **輕量級**: 單檔案資料庫，易於備份和部署
3. **效能優秀**: 對於中小型應用效能足夠
4. **跨平台**: 支援所有主要平台
5. **已有經驗**: 團隊已熟悉 SQLAlchemy + SQLite
6. **適合場景**: 
   - 校友平台規模（預計 < 10,000 使用者）
   - 讀取密集型應用
   - 單一伺服器部署

#### 缺點 ❌
1. 並發寫入較弱（但讀取並發無限制）
2. 不適合分散式部署
3. 沒有使用者權限管理

#### 建議 ✅
**保持 SQLite，但做以下優化：**

```python
# 優化配置
SQLALCHEMY_DATABASE_URI = 'sqlite:///app.db'
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_pre_ping': True,
    'pool_recycle': 3600,
    'connect_args': {
        'check_same_thread': False,  # 允許多執行緒
        'timeout': 30,               # 鎖定等待時間
    }
}
```

**適用情境**:
- ✅ 校友平台（當前需求）
- ✅ 單一伺服器部署
- ✅ < 100 QPS
- ✅ < 50 GB 資料量

---

### Option B: 升級到 PostgreSQL ⭐⭐⭐⭐

#### 優點 ✅
1. **強大的並發**: 優秀的 MVCC 支援
2. **JSON 支援**: 原生 JSONB 類型
3. **全文搜尋**: 內建全文搜尋引擎
4. **擴充性強**: 豐富的擴充功能
5. **成熟穩定**: 業界標準的關聯式資料庫
6. **免費開源**: 完全免費使用

#### 缺點 ❌
1. 需要額外安裝和維護資料庫伺服器
2. 記憶體佔用較大
3. 配置較複雜
4. 需要學習 PostgreSQL 特定語法

#### 遷移成本
- **時間**: 3-5 天
- **風險**: 中等
- **學習曲線**: 低（SQLAlchemy 抽象化了大部分差異）

#### 建議時機 ⏰
**當以下情況發生時考慮遷移：**
- 日活躍使用者 > 1,000
- 並發寫入請求 > 50/秒
- 需要複雜的查詢和分析
- 計劃部署到雲端（如 AWS RDS、Google Cloud SQL）

---

### Option C: MongoDB ⭐⭐ (不建議)

#### 為什麼不推薦 MongoDB？

##### 1. 與現有架構不相容 ❌
```python
# 現有: SQLAlchemy ORM
class User(db.Model):
    id = Column(Integer, primary_key=True)
    jobs = relationship('Job', back_populates='user')

# 需改為: MongoEngine ODM
class User(Document):
    id = ObjectIdField()
    jobs = ListField(ReferenceField('Job'))
```

**影響**: 需要重寫所有模型（20+ 個檔案）

##### 2. 關聯式資料更適合 ❌
校友平台的資料高度關聯：
- User ↔ Job（職缺發布）
- User ↔ Event（活動主辦/報名）
- User ↔ Message（訊息對話）
- Job ↔ JobRequest（申請記錄）

**問題**: MongoDB 不支援原生 JOIN，需要手動處理

##### 3. 遷移成本極高 ❌
- 重寫所有模型定義
- 重寫所有查詢邏輯
- 重寫所有關聯處理
- 學習 MongoDB 和 MongoEngine
- 資料遷移腳本

**預估時間**: 3-4 週  
**風險等級**: 極高

##### 4. 無明顯優勢 ❌
MongoDB 的優勢（文檔儲存、靈活 schema）在此專案用不到：
- ✅ SQLite/PostgreSQL 已滿足需求
- ✅ Schema 穩定，不需要靈活性
- ✅ 關聯查詢是核心需求

---

## 🎯 建議方案

### 方案 A: 修復 V2 + SQLite (推薦) ⭐⭐⭐⭐⭐

#### 優點
- ✅ 功能最完整（V2 API 設計更好）
- ✅ 無需改變資料庫
- ✅ 保持現有架構
- ✅ 一次性修復

#### 實施步驟

**1. 修復模型關聯（3-4 小時）**
```python
# user_auth.py - 統一關聯名稱
jobs = relationship('Job', foreign_keys='Job.user_id', back_populates='user')
organized_events = relationship('Event', foreign_keys='Event.organizer_id', back_populates='organizer')
event_registrations = relationship('EventRegistration', back_populates='user')
```

**2. 完整測試（2-3 小時）**
- 測試所有 API 端點
- 驗證模型關聯
- 檢查資料完整性

**3. 更新前端配置（10 分鐘）**
```typescript
// 改回使用 V2 API
fetchAPI('/api/v2/auth/login', ...)
```

**總時間**: 6-8 小時  
**風險**: 低-中  
**效益**: 高

---

### 方案 B: 保持 V1 + 漸進式改進 ⭐⭐⭐⭐

#### 優點
- ✅ 立即可用
- ✅ 零風險
- ✅ 穩定可靠

#### 缺點
- ❌ 功能較少（CSV 匯入/匯出等）
- ❌ API 設計較簡單
- ❌ 長期維護兩套代碼

#### 實施步驟
1. 繼續使用 V1
2. 慢慢將 V2 的優秀功能移植到 V1
3. 最終淘汰 V2

**總時間**: 持續  
**風險**: 低  
**效益**: 中

---

### 方案 C: V1 + PostgreSQL ⭐⭐⭐

#### 適用時機
- 使用者量快速增長
- 需要更強的並發能力
- 有專業 DBA 支援

#### 實施步驟
1. 設定 PostgreSQL
2. 修改資料庫連線
3. 測試遷移
4. 資料轉移

**總時間**: 2-3 天  
**風險**: 中  
**效益**: 中-高（未來擴充性）

---

## 📝 最終建議

### 🎯 短期（1-2 週）
**方案 A: 修復 V2 + 保持 SQLite**

**理由**:
1. ✅ V2 API 設計更好，值得投資修復
2. ✅ SQLite 完全滿足當前需求
3. ✅ 修復成本可控（6-8 小時）
4. ✅ 功能更完整（CSV、更好的模型設計）

**行動步驟**:
```bash
# 1. 修復模型關聯
- 統一外鍵欄位名稱
- 修正 back_populates 名稱
- 刪除重複定義

# 2. 測試所有 API
- 認證系統
- 職缺系統
- 活動系統
- 訊息系統

# 3. 更新前端
- 改回使用 /api/v2/*
- 測試完整流程
```

### 🚀 中期（3-6 個月）
**保持 SQLite，優化效能**

**理由**:
- SQLite 效能優秀
- 無需額外維護
- 成本低

**優化項目**:
- 加入適當的索引
- 優化查詢效能
- 實作快取機制（Redis）

### 🌟 長期（6-12 個月）
**根據實際需求評估是否升級**

**升級到 PostgreSQL 的時機**:
- ✅ 日活躍 > 1,000 人
- ✅ 資料量 > 10 GB
- ✅ 並發寫入頻繁
- ✅ 需要分散式部署

**不需要 MongoDB，因為**:
- ❌ 關聯式資料為主
- ❌ Schema 穩定
- ❌ 遷移成本極高
- ❌ 無明顯優勢

---

## 📊 決策矩陣

| 方案 | 實施時間 | 風險 | 成本 | 效益 | 推薦度 |
|------|---------|------|------|------|--------|
| **修復 V2 + SQLite** | 6-8 小時 | 低-中 | 低 | 高 | ⭐⭐⭐⭐⭐ |
| **保持 V1 + SQLite** | 0 | 極低 | 極低 | 中 | ⭐⭐⭐⭐ |
| **V1 + PostgreSQL** | 2-3 天 | 中 | 中 | 中-高 | ⭐⭐⭐ |
| **V2 + PostgreSQL** | 1 週 | 中 | 中-高 | 高 | ⭐⭐⭐ |
| **V2 + MongoDB** | 3-4 週 | 極高 | 極高 | 低 | ⭐ |

---

## 🎓 總結

### ✅ 推薦方案
**修復 V2 後端 + 保持 SQLite**

### 📌 核心建議
1. **不要遷移到 MongoDB** - 不適合關聯式資料
2. **保持 SQLite** - 完全滿足當前需求
3. **修復 V2** - 投資報酬率最高
4. **未來可升級 PostgreSQL** - 但不急

### 🚫 不建議
- ❌ 遷移到 MongoDB（成本高、收益低、風險大）
- ❌ 同時維護 V1 和 V2（浪費資源）
- ❌ 立即升級到 PostgreSQL（過早優化）

---

**建議撰寫時間**: 2025年1月28日  
**下一步**: 修復 V2 後端模型關聯問題  
**預計完成**: 1-2 天

---

**Built with ❤️ by Alumni Platform Team**

