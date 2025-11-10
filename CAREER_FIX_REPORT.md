# 職涯管理頁面修復報告

## 問題描述

用戶在訪問職涯管理頁面 (`http://localhost:3000/career`) 時遇到 "Load failed" 錯誤。

## 根本原因分析

通過 Chrome MCP 測試和後端日誌分析，發現兩個 API 端點返回 500 錯誤：

### 1. `/api/career/educations` 端點錯誤

**錯誤訊息**: `AttributeError: type object 'Education' has no attribute 'start_date'`

**原因**: 
- 路由代碼中使用 `Education.start_date.desc()` 進行排序
- 但 `Education` 模型實際使用的是 `start_year` (整數) 和 `end_year` (整數)
- 模型中並無 `start_date` 屬性

### 2. `/api/career/my-skills` 端點錯誤

**錯誤訊息**: `AttributeError: type object 'UserSkill' has no attribute 'is_primary'`

**原因**:
- 路由代碼中使用 `UserSkill.is_primary.desc()` 進行排序
- 路由代碼在創建和更新 UserSkill 時嘗試設置 `is_primary` 屬性
- 但 `UserSkill` 模型中並無此欄位

## 修復措施

### 文件: `alumni_platform_api/src/routes/career.py`

#### 修復 1: 更正 Education 排序欄位

```python
# 修改前
educations = Education.query.filter_by(user_id=user_id)\
    .order_by(Education.start_date.desc())\
    .all()

# 修改後
educations = Education.query.filter_by(user_id=user_id)\
    .order_by(Education.start_year.desc())\
    .all()
```

**影響函數**: `get_educations()`

#### 修復 2: 移除 UserSkill 的 is_primary 引用

**修改函數**:
- `get_user_skills()` - 移除排序中的 `is_primary`
- `get_my_skills()` - 移除排序中的 `is_primary`  
- `add_user_skill()` - 移除創建時的 `is_primary` 參數
- `add_my_skill()` - 移除創建時的 `is_primary` 參數
- `update_user_skill()` - 移除更新邏輯中的 `is_primary`

```python
# 修改前
user_skills = UserSkill.query.filter_by(user_id=user_id)\
    .order_by(UserSkill.is_primary.desc(), UserSkill.proficiency_level.desc())\
    .all()

# 修改後
user_skills = UserSkill.query.filter_by(user_id=user_id)\
    .order_by(UserSkill.proficiency_level.desc())\
    .all()
```

## 驗證測試

### 測試環境
- 後端: Flask (Python 3.10, Conda 環境 `alumni-platform`)
- 前端: Next.js (localhost:3000)
- 測試工具: Chrome MCP

### 測試結果

✅ **API 端點測試**
```bash
# 教育背景端點
curl http://localhost:5001/api/career/educations
Response: {"educations": []} (200 OK)

# 技能端點
curl http://localhost:5001/api/career/my-skills
Response: {"skills": []} (200 OK)

# 工作經歷端點
curl http://localhost:5001/api/career/work-experiences
Response: {"work_experiences": []} (200 OK)
```

✅ **前端頁面測試**
- 職涯管理頁面成功載入
- 工作經歷標籤頁正常顯示
- 教育背景標籤頁正常顯示
- 技能標籤頁正常顯示
- 無控制台錯誤
- 無網絡請求失敗

### 網絡請求狀態
所有職涯相關的 API 請求都返回 200 成功狀態：
- `GET /api/career/work-experiences` - ✅ 200
- `GET /api/career/educations` - ✅ 200
- `GET /api/career/my-skills` - ✅ 200
- `GET /api/career/skills` - ✅ 200

## 建議

### 短期建議
1. ✅ **已完成**: 修復模型與路由的欄位不匹配問題
2. 建議添加單元測試，確保 API 端點與模型定義一致

### 長期建議
1. 實施 API 合約測試 (Contract Testing)
2. 在開發環境中啟用更嚴格的錯誤檢查
3. 考慮使用 TypeScript 或 Pydantic 來定義 API 數據模型，確保類型安全
4. 在 CI/CD 流程中加入端到端測試

## 相關文件

- 資料庫模型: `alumni_platform_api/src/models_v2/career.py`
- API 路由: `alumni_platform_api/src/routes/career.py`
- 前端頁面: `alumni-platform-nextjs/src/app/career/page.tsx`
- API 客戶端: `alumni-platform-nextjs/src/lib/api.ts`

## 修復時間

- 問題發現: 2025-11-02
- 修復完成: 2025-11-02
- 測試驗證: 2025-11-02

---

**狀態**: ✅ 已修復並驗證
**嚴重程度**: 高 (影響核心功能)
**修復複雜度**: 低 (欄位名稱修正)

