# 部署文檔索引

校友互動平台的完整部署文檔導航指南。

## 📚 文檔清單

### 快速參考 (快速查詢用)

| 文檔 | 用途 | 適用場景 |
|------|------|---------|
| **DEPLOYMENT_QUICK_REFERENCE.md** | 速查命令表 | 已熟悉部署流程，需要快速查詢命令 |
| **DEPLOYMENT_CHECKLIST.md** | 部署檢查清單 | 進行首次部署、定期部署驗證 |

### 詳細指南 (深入理解用)

| 文檔 | 用途 | 內容涵蓋 |
|------|------|---------|
| **DEPLOY.md** | 完整部署指南 | 所有功能、配置、故障排除、自動化 |
| **DEPLOYMENT_DOCS_INDEX.md** | 本檔案 | 文檔導航 |

### 配置檔案

| 檔案 | 用途 | 環境 |
|------|------|------|
| **.env.production.example** | 生產環境配置範本 | 生產部署 |
| **docker-compose.yml** | 開發環境 Docker 配置 | 本地開發 |
| **docker-compose.prod.yml** | 生產環境 Docker 配置 | 生產部署 |
| **nginx/nginx.conf** | 反向代理配置 | 生產部署 |

### 腳本檔案

| 腳本 | 用途 | 權限 |
|------|------|------|
| **scripts/deploy.sh** | 主部署腳本 | 可執行 (755) |
| **scripts/pre_deploy_check.sh** | 部署前檢查 | 可執行 (755) |
| **scripts/backup_db.sh** | 資料庫備份 | 可執行 (755) |
| **scripts/restore_db.sh** | 資料庫還原 | 可執行 (755) |
| **scripts/test_deploy.sh** | 部署腳本測試 | 可執行 (755) |

## 🚀 快速開始路徑

### 第一次部署

```
1. 閱讀 DEPLOYMENT_CHECKLIST.md 的「部署前準備」部分
   ↓
2. 執行 ./scripts/pre_deploy_check.sh
   ↓
3. 按照 DEPLOYMENT_QUICK_REFERENCE.md 執行 deploy.sh
   ↓
4. 按照 DEPLOYMENT_CHECKLIST.md 的「部署後驗證」進行驗證
```

### 定期部署

```
1. 執行 ./scripts/pre_deploy_check.sh
   ↓
2. 執行 ./scripts/deploy.sh [environment]
   ↓
3. 查看 DEPLOYMENT_QUICK_REFERENCE.md 進行快速驗證
```

### 故障排除

```
1. 查看 DEPLOYMENT_CHECKLIST.md 的「故障排除」
   ↓
2. 檢查應用日誌: docker compose logs
   ↓
3. 參考 DEPLOYMENT_QUICK_REFERENCE.md 故障速查表
   ↓
4. 必要時執行: ./scripts/deploy.sh rollback
```

## 📖 按文檔查詢

### 需要...請查看...

| 需求 | 查看文檔 | 頁面位置 |
|------|---------|---------|
| 快速部署命令 | DEPLOYMENT_QUICK_REFERENCE.md | 常用命令 |
| 詳細部署流程說明 | DEPLOY.md | 部署腳本功能 |
| 部署前完整檢查 | DEPLOYMENT_CHECKLIST.md | 部署前準備 |
| 環境變數設定 | DEPLOY.md | 環境變數 |
| 後端連接失敗 | DEPLOYMENT_CHECKLIST.md | 故障排除 |
| 回滾到上一版本 | DEPLOYMENT_QUICK_REFERENCE.md | 快速開始 |
| 備份管理 | DEPLOY.md | 備份管理 |
| Nginx 配置說明 | nginx/nginx.conf | 檔案內註解 |
| Docker 設定 | docker-compose.yml | 檔案內註解 |
| 健康檢查失敗 | DEPLOYMENT_CHECKLIST.md | 應用可達性檢查 |
| 自動化部署 | DEPLOY.md | 自動化建議 |
| 監控和日誌 | DEPLOYMENT_QUICK_REFERENCE.md | 監控和診斷 |

## 🔍 按工作流程查詢

### 開發環境部署

```bash
# 1. 前置檢查
./scripts/pre_deploy_check.sh
# → 查看 DEPLOYMENT_CHECKLIST.md 瞭解詳細項目

# 2. 執行部署
./scripts/deploy.sh
# → 查看 DEPLOYMENT_QUICK_REFERENCE.md 快速開始段落

# 3. 驗證部署
# → 查看 DEPLOYMENT_CHECKLIST.md 部署後驗證段落
```

### 生產環境部署

```bash
# 1. 環境配置
cp .env.production.example .env
# → 查看 DEPLOY.md 環境變數設定部分

# 2. 前置檢查
./scripts/pre_deploy_check.sh
# → 確保所有檢查項都通過

# 3. 執行部署
./scripts/deploy.sh production
# → 查看 DEPLOYMENT_CHECKLIST.md 部署執行段落

# 4. 驗證和測試
# → 查看 DEPLOYMENT_CHECKLIST.md 部署後驗證段落
```

### 應急回滾

```bash
# 執行回滾
./scripts/deploy.sh rollback
# → 查看 DEPLOYMENT_CHECKLIST.md 回滾程序段落

# 驗證回滾
curl http://localhost:5001/api/health
# → 查看應用日誌確認恢復正常
```

## 🛠️ 腳本使用說明

### deploy.sh - 主部署腳本

**用途**: 自動化完整部署流程

**語法**:
```bash
./scripts/deploy.sh [environment] [command]
```

**參數**:
- `[environment]`: `staging`(預設) 或 `production`
- `[command]`: 可選，目前支援 `rollback`

**工作流程**:
1. 前置檢查
2. 資料庫備份
3. 應用建置
4. 容器啟動
5. 健康檢查

**查看詳細**: DEPLOY.md 的「部署腳本功能」

### pre_deploy_check.sh - 部署前檢查

**用途**: 驗證部署環境就緒

**語法**:
```bash
./scripts/pre_deploy_check.sh
```

**檢查項目**:
- 系統依賴 (Docker, Docker Compose)
- 專案檔案完整性
- Git 狀態
- Docker daemon
- 連接埠可用性
- 備份存在性
- 環境變數

**查看詳細**: DEPLOYMENT_CHECKLIST.md 的「執行前置檢查」

### backup_db.sh - 資料庫備份

**用途**: 手動備份資料庫

**語法**:
```bash
./scripts/backup_db.sh
```

**輸出**: `backups/YYYYMMDD_HHMMSS/app_v2.db`

**查看詳細**: DEPLOY.md 的「備份管理」

### restore_db.sh - 資料庫還原

**用途**: 從備份還原資料庫

**語法**:
```bash
./scripts/restore_db.sh /path/to/backup
```

**範例**:
```bash
./scripts/restore_db.sh backups/20260218_120000/
```

**查看詳細**: DEPLOY.md 的「備份管理」

## 📋 常見場景查詢表

| 場景 | 第一步 | 參考文檔 | 命令 |
|------|-------|---------|------|
| 準備首次部署 | 了解流程 | DEPLOYMENT_CHECKLIST.md | - |
| 執行部署 | 執行檢查 | DEPLOY.md | `./scripts/pre_deploy_check.sh` |
| 部署出錯 | 查看日誌 | DEPLOYMENT_CHECKLIST.md | `docker compose logs` |
| 需要回滾 | 確認狀態 | DEPLOYMENT_CHECKLIST.md | `./scripts/deploy.sh rollback` |
| 手動備份 | 準備空間 | DEPLOY.md | `./scripts/backup_db.sh` |
| 還原備份 | 選擇備份 | DEPLOY.md | `./scripts/restore_db.sh` |
| 查詢命令 | 快速查閱 | DEPLOYMENT_QUICK_REFERENCE.md | - |
| CI/CD 設定 | 閱讀示例 | DEPLOY.md | - |

## 🎓 學習路徑

### 初學者路徑 (新手)
```
1. DEPLOYMENT_QUICK_REFERENCE.md - 快速開始
   ↓
2. DEPLOYMENT_CHECKLIST.md - 完整流程
   ↓
3. DEPLOY.md - 深入理解
```

### 經驗者路徑 (進階)
```
1. DEPLOYMENT_QUICK_REFERENCE.md - 快速查詢
   ↓
2. 按需查閱其他文檔
```

### 自動化路徑 (DevOps)
```
1. DEPLOY.md - 自動化建議
   ↓
2. docker-compose.prod.yml - 生產配置
   ↓
3. nginx/nginx.conf - 反向代理配置
```

## 📞 文檔維護

| 項目 | 值 |
|------|-----|
| 最後更新 | 2026-02-18 |
| 維護者 | 開發團隊 |
| 版本 | 1.0 |
| 適用專案 | 校友互動平台 |

## 🔗 相關檔案

### 專案說明
- **CLAUDE.md** - 專案概述、架構、開發指令

### 配置檔案
- **.env.production.example** - 生產環境變數範本
- **docker-compose.yml** - 開發環境 Docker 配置
- **docker-compose.prod.yml** - 生產環境 Docker 配置
- **nginx/nginx.conf** - Nginx 反向代理設定

### 指令碼
- **scripts/deploy.sh** - 主部署指令碼
- **scripts/pre_deploy_check.sh** - 前置檢查指令碼
- **scripts/backup_db.sh** - 備份指令碼
- **scripts/restore_db.sh** - 還原指令碼
- **scripts/test_deploy.sh** - 部署測試指令碼

---

**快速鏈結**:
- [快速開始](DEPLOYMENT_QUICK_REFERENCE.md#快速開始)
- [常用命令](DEPLOYMENT_QUICK_REFERENCE.md#常用命令)
- [故障排除](DEPLOYMENT_CHECKLIST.md#故障排除)
- [完整指南](DEPLOY.md)
