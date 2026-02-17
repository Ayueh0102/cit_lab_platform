# Docker 容器化配置指南

校友平台的完整 Docker 容器化方案，支援開發和生產環境。

## 目錄結構

```
.
├── docker-compose.yml           # 開發環境
├── docker-compose.prod.yml      # 生產環境
├── .dockerignore                # 全局 Docker 排除清單
├── .env.example                 # 環境變數範本
├── alumni-platform-nextjs/
│   ├── Dockerfile               # 前端 Next.js 多階段構建
│   └── .dockerignore
├── alumni_platform_api/
│   ├── Dockerfile               # 後端 Flask + gunicorn
│   └── .dockerignore
└── nginx/
    └── nginx.conf               # 反向代理配置 (生產)
```

## 開發環境

### 快速啟動

```bash
cd /Users/Ayueh/alumni-platform-complete-final

# 1. 建立環境變數檔案（可選，使用預設值）
cp .env.example .env

# 2. 啟動容器
docker-compose up -d

# 3. 檢視日誌
docker-compose logs -f frontend
docker-compose logs -f backend
```

### 訪問應用

- 前端: http://localhost:3000
- 後端 API: http://localhost:5001

### 常用指令

```bash
# 檢視服務狀態
docker-compose ps

# 進入容器殼層
docker-compose exec backend bash
docker-compose exec frontend sh

# 重新構建映像
docker-compose build --no-cache

# 停止並移除容器
docker-compose down

# 移除全部（包含 volumes）
docker-compose down -v
```

### 開發模式的熱重載

開發環境已設定 volume mounts，前端和後端的檔案改動會自動反映：

```yaml
volumes:
  - ./alumni-platform-nextjs:/app         # Next.js 源碼
  - /app/node_modules                     # 保護 node_modules
  - ./alumni_platform_api:/app            # Flask 源碼
```

修改前端代碼 → Next.js dev server 自動重新載入  
修改後端代碼 → Flask 自動重啟（需要 Flask 的 debug 模式）

## 生產環境

### 前置條件

1. **DNS 配置**: 指向部署伺服器的 IP
2. **SSL 憑證**: 放在 `nginx/certs/` 目錄
   ```bash
   mkdir -p nginx/certs
   # 使用 Let's Encrypt 或其他 CA 的憑證
   # cert.pem 和 key.pem
   ```
3. **環境變數**: 建立安全的 `.env.prod` 檔案

### 啟動生產環境

```bash
# 1. 建立生產環境變數
cp .env.example .env.prod

# 編輯 .env.prod，設定：
# - POSTGRES_PASSWORD (強密碼)
# - SECRET_KEY (使用 python -c "import secrets; print(secrets.token_hex(32))")
# - JWT_SECRET_KEY (同上)
# - ALLOWED_ORIGINS (實際域名)

# 2. 啟動生產環境
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 3. 檢查服務狀態
docker-compose -f docker-compose.prod.yml ps
```

### 生產環境架構

```
┌─────────────────────────────────────┐
│      HTTPS (nginx:443)              │
│   反向代理 + SSL 終止               │
└──────────────┬──────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
  ┌───▼────┐      ┌─────▼──┐
  │Frontend │      │Backend  │
  │(Node)   │      │(Flask)  │
  └────┬────┘      └────┬────┘
       │                │
       │           ┌────▼────┐
       │           │PostgreSQL│
       │           └──────────┘
       │
  (Next.js)
  (Rewrite API calls to backend)
```

### 環境變數說明

#### PostgreSQL

```env
POSTGRES_USER=alumni
POSTGRES_PASSWORD=<強密碼，最少 16 字元>
```

#### Flask (Backend)

```env
SECRET_KEY=<32 位元十六進制字串>
JWT_SECRET_KEY=<32 位元十六進制字串>
DATABASE_URL=postgresql://alumni:PASSWORD@db:5432/alumni_platform
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
FLASK_ENV=production
```

#### Nginx

修改 `nginx/nginx.conf` 的 `server_name` 和 SSL 配置：

```conf
server {
  listen 443 ssl http2;
  server_name your-domain.com www.your-domain.com;

  ssl_certificate /etc/nginx/certs/cert.pem;
  ssl_certificate_key /etc/nginx/certs/key.pem;
  # ...
}
```

### 數據持久化

生產環境使用命名 volumes，資料存儲在 Docker 管理的位置：

```yaml
volumes:
  pg-data:        # PostgreSQL 資料庫檔案
  backend-uploads: # 上傳檔案儲存
```

檢查 volumes:

```bash
docker volume ls
docker volume inspect alumni-platform-complete-final_pg-data
```

### 備份和還原

#### 備份 PostgreSQL

```bash
docker-compose -f docker-compose.prod.yml exec db pg_dump \
  -U alumni alumni_platform > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### 還原 PostgreSQL

```bash
docker-compose -f docker-compose.prod.yml exec -T db psql \
  -U alumni alumni_platform < backup_20240218_120000.sql
```

#### 備份上傳檔案

```bash
docker run --rm -v alumni-platform-complete-final_backend-uploads:/data \
  -v $(pwd):/backup alpine tar czf /backup/uploads_backup.tar.gz -C /data .
```

### 監控和日誌

```bash
# 檢視所有服務日誌
docker-compose -f docker-compose.prod.yml logs -f

# 特定服務日誌
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f db

# 檢視 nginx 日誌
docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/access.log
```

## Docker 映像構建

### 前端映像 (alumni-platform-nextjs)

**多階段構建**: 優化最終映像大小

1. **deps 階段**: 安裝 pnpm 依賴 (~500MB)
2. **builder 階段**: 執行 `pnpm build` (~1.5GB)
3. **runner 階段**: 僅複製必要檔案 (~200MB)

最終映像大小: ~200MB

```dockerfile
FROM node:20-alpine AS deps
  # 安裝依賴
FROM node:20-alpine AS builder
  # 構建應用
FROM node:20-alpine AS runner
  # 執行環境
```

### 後端映像 (alumni_platform_api)

基於 `python:3.10-slim`，使用 gunicorn + eventlet worker:

```dockerfile
FROM python:3.10-slim
  # 安裝系統依賴 (gcc, libpq-dev for PostgreSQL)
  # 安裝 Python 套件
  # 建立資料庫和上傳目錄
```

映像大小: ~400MB

## 常見問題

### Q: 前端無法連接後端
A: 檢查 `NEXT_PUBLIC_API_URL` 環境變數是否正確指向後端 URL

### Q: PostgreSQL 連接失敗
A: 確認密碼設定正確，且等待 db 服務完全啟動（healthcheck）

### Q: 上傳檔案無法存儲
A: 檢查 `backend-uploads` volume 是否掛載，並確認權限

### Q: 如何更新應用程式版本
```bash
# 1. 拉取最新代碼
git pull

# 2. 重新構建映像
docker-compose -f docker-compose.prod.yml build

# 3. 重啟服務
docker-compose -f docker-compose.prod.yml up -d
```

## 安全最佳實踐

1. **永遠使用強密碼**: 至少 16 字元，包含大小寫字母、數字、特殊字元
2. **安全保管密鑰**: 不提交 `.env` 到 Git，使用環境變數或密鑰管理工具
3. **啟用 SSL/TLS**: 使用有效的 SSL 憑證（Let's Encrypt 免費）
4. **限制 ALLOWED_ORIGINS**: 只允許實際的生產域名
5. **定期備份**: 至少每日備份 PostgreSQL 和上傳檔案
6. **監控日誌**: 定期檢查錯誤日誌，監測異常活動
7. **更新映像**: 定期更新基礎映像和依賴套件

## 效能優化

### 前端
- 使用 Alpine Linux 基礎映像 (29MB vs 150MB)
- 多階段構建減少最終映像大小
- 禁用 Next.js Telemetry

### 後端
- 使用 eventlet worker 支援高併發
- 使用 gunicorn 而非 Flask 開發伺服器
- SQLite 在開發環境，PostgreSQL 在生產環境

### Nginx
- 啟用 HTTP/2 (生產環境 nginx.conf)
- 快取靜態資源
- 啟用 gzip 壓縮

## 參考資源

- [Docker 官方文檔](https://docs.docker.com/)
- [Docker Compose 文檔](https://docs.docker.com/compose/)
- [Nginx 文檔](https://nginx.org/en/docs/)
- [PostgreSQL 文檔](https://www.postgresql.org/docs/)
