# 校友平台部署指南

## 快速開始

### 開發環境部署

```bash
# 執行部署腳本（自動備份、建置、啟動、健康檢查）
./scripts/deploy.sh

# 或明確指定環境
./scripts/deploy.sh staging
```

### 生產環境部署

```bash
# 需要 .env 配置檔案
./scripts/deploy.sh production
```

## 部署腳本功能

### `./scripts/deploy.sh [environment] [command]`

#### 參數

- `[environment]`: `staging` (預設) 或 `production`
- `[command]`: 可選，目前支援 `rollback`

#### 工作流程

1. **前置檢查** (`check_prerequisites`)
   - 驗證 `.env` 檔案存在（生產環境）
   - 檢查 Docker 和 Docker Compose 安裝

2. **資料庫備份** (`backup`)
   - 備份 SQLite 資料庫 (`app_v2.db`)
   - 備份 PostgreSQL 資料庫（如使用 Docker）
   - 所有備份存在 `backups/YYYYMMDD_HHMMSS/` 目錄

3. **應用建置** (`build`)
   - 生產環境：使用 `docker-compose.prod.yml`（清除快取）
   - 其他環境：使用 `docker-compose.yml`

4. **應用部署** (`deploy`)
   - 啟動容器服務（後端、前端、資料庫等）

5. **健康檢查** (`health_check`)
   - 驗證後端 API 可達性（最多重試 30 次，每次等待 2 秒）
   - 驗證前端應用可達性
   - 失敗時輸出容器日誌進行除錯

### 回滾

```bash
./scripts/deploy.sh rollback
```

- 還原最新備份的資料庫
- 檢出上一個 Git commit
- 重新建置並部署

## 備份管理

### 備份位置

所有備份存放在 `backups/YYYYMMDD_HHMMSS/` 目錄中：

```
backups/
├── 20260218_120000/
│   ├── app_v2.db           # SQLite 備份
│   └── pg_dump.sql         # PostgreSQL 備份（可選）
├── 20260217_180000/
│   └── ...
```

### 手動備份

```bash
./scripts/backup_db.sh
```

### 手動還原

```bash
./scripts/restore_db.sh /path/to/backup
```

## 配置檔案

### Docker Compose 配置

- **開發**: `docker-compose.yml`
  - 暴露埠位：前端 3000, 後端 5001
  - 用於本地開發

- **生產**: `docker-compose.prod.yml`
  - Nginx 反向代理 (80/443)
  - 優化設定（清除快取、最小化層數等）

### Nginx 配置

`nginx/nginx.conf`:
- API 代理至後端 5001
- WebSocket 代理至後端
- 靜態檔案代理
- 前端代理至 3000
- 安全 Headers 設定

#### 啟用 HTTPS

取消註解 `nginx/nginx.conf` 中的 HTTPS 區塊，並提供 SSL 憑證：

```bash
mkdir -p nginx/certs
# 放置 cert.pem 和 key.pem
```

## 環境變數

### 生產環境 `.env` 檔案

```bash
# 資料庫
DATABASE_URL=postgresql://alumni:password@db:5432/alumni_platform

# JWT 認證
JWT_SECRET_KEY=your-secure-secret-key-here

# Flask 配置
FLASK_ENV=production
FLASK_DEBUG=False

# CORS 設定
ALLOWED_ORIGINS=yourdomain.com,www.yourdomain.com

# 郵件服務（可選）
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Next.js 環境（可選）
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## 故障排除

### 後端健康檢查失敗

```bash
# 檢查後端容器日誌
docker compose logs --tail=50 backend

# 重啟後端
docker compose restart backend
```

### 前端無法連接

```bash
# 檢查前端容器日誌
docker compose logs --tail=50 frontend

# 檢查 Nginx 配置
docker compose exec nginx nginx -t

# 重載 Nginx 配置
docker compose exec nginx nginx -s reload
```

### 資料庫連接問題

```bash
# 檢查資料庫容器
docker compose ps db

# 檢查資料庫日誌
docker compose logs --tail=50 db

# 手動還原備份
./scripts/restore_db.sh backups/20260218_120000/
```

## 監控和日誌

### 查看所有服務日誌

```bash
# 即時日誌（跟蹤模式）
docker compose logs -f

# 查看特定服務
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
```

### Nginx 訪問日誌

容器內位置：`/var/log/nginx/access.log`

```bash
# 查看日誌
docker compose exec nginx tail -f /var/log/nginx/access.log
```

## 自動化建議

### CI/CD 整合

#### GitHub Actions 範例

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run deploy script
        run: ./scripts/deploy.sh production
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET_KEY: ${{ secrets.JWT_SECRET_KEY }}
```

### 定時備份

```bash
# 每天午夜執行備份（crontab）
0 0 * * * /path/to/alumni-platform-complete-final/scripts/backup_db.sh
```

## 檢查清單

部署前確認：

- [ ] `.env` 檔案已配置（生產環境）
- [ ] Docker 已安裝並運行
- [ ] 確認無未提交的重要變更（`git status`）
- [ ] 近期有備份（`ls -la backups/`）
- [ ] 必要的連接埠未被佔用（3000, 5001, 80, 443）

## 常見命令速查

```bash
# 部署和管理
./scripts/deploy.sh                    # 開發環境部署
./scripts/deploy.sh production         # 生產環境部署
./scripts/deploy.sh rollback           # 回滾

# 備份和還原
./scripts/backup_db.sh                 # 手動備份
./scripts/restore_db.sh BACKUP_PATH    # 手動還原

# Docker 管理
docker compose up -d                   # 後台啟動
docker compose down                    # 停止所有服務
docker compose ps                      # 查看執行中的容器
docker compose logs -f [SERVICE]       # 查看日誌

# 開發環境
./scripts/dev_up.sh                    # 啟動開發環境
./scripts/dev_down.sh                  # 停止開發環境
```

## 技術支持

遇到問題時：

1. 查看對應服務的日誌
2. 檢查 `.env` 配置
3. 驗證 Docker 容器狀態
4. 考慮執行回滾（`./scripts/deploy.sh rollback`）
5. 檢查 Git 提交歷史（`git log --oneline`）
