# Docker 快速啟動指南

## 開發環境（5 分鐘啟動）

### 第 1 步：啟動容器

```bash
cd /Users/Ayueh/alumni-platform-complete-final
./scripts/docker_dev.sh up
```

或直接使用 docker-compose：

```bash
docker-compose up -d
```

### 第 2 步：訪問應用

- **前端**: http://localhost:3000
- **後端 API**: http://localhost:5001

### 測試帳號

- 管理員: `admin@example.com` / `admin123`
- 一般使用者: `wang@example.com` / `password123`

## 常用開發指令

```bash
# 查看日誌
./scripts/docker_dev.sh logs

# 查看特定服務日誌
./scripts/docker_dev.sh logs backend
./scripts/docker_dev.sh logs frontend

# 進入後端容器
./scripts/docker_dev.sh shell-backend

# 進入前端容器
./scripts/docker_dev.sh shell-frontend

# 重啟服務
./scripts/docker_dev.sh restart

# 停止服務
./scripts/docker_dev.sh down

# 清理（移除容器和資料）
./scripts/docker_dev.sh clean
```

## 生產環境部署

### 前置準備

1. **複製環境變數範本**：
   ```bash
   cp .env.example .env.prod
   ```

2. **編輯 .env.prod**，設定敏感資訊：
   ```bash
   # 重要：設定強密碼
   POSTGRES_PASSWORD=your-secure-password
   SECRET_KEY=生成的 32 位元十六進制字串
   JWT_SECRET_KEY=生成的 32 位元十六進制字串
   ALLOWED_ORIGINS=https://your-domain.com
   ```

3. **準備 SSL 憑證**（可選但推薦）：
   ```bash
   mkdir -p nginx/certs
   # 將 cert.pem 和 key.pem 放入此目錄
   ```

### 啟動生產環境

```bash
./scripts/docker_prod.sh up
```

### 生產環境常用指令

```bash
# 查看日誌
./scripts/docker_prod.sh logs

# 進入資料庫
./scripts/docker_prod.sh shell-db

# 備份資料庫
./scripts/docker_prod.sh backup-db

# 還原資料庫
./scripts/docker_prod.sh restore-db backup_20240218_120000.sql

# 停止服務
./scripts/docker_prod.sh down
```

## 檔案結構速查

```
/Users/Ayueh/alumni-platform-complete-final/
├── docker-compose.yml              # 開發環境配置
├── docker-compose.prod.yml         # 生產環境配置
├── .env.example                    # 環境變數範本
├── DOCKER.md                       # 完整文檔
│
├── alumni-platform-nextjs/
│   ├── Dockerfile                  # Next.js 多階段構建
│   └── .dockerignore
│
├── alumni_platform_api/
│   ├── Dockerfile                  # Flask + gunicorn
│   └── .dockerignore
│
├── nginx/
│   └── nginx.conf                  # 反向代理配置
│
└── scripts/
    ├── docker_dev.sh               # 開發環境控制腳本
    └── docker_prod.sh              # 生產環境控制腳本
```

## 映像大小

- **前端** (`alumni-platform-nextjs`): ~200MB
  - 多階段構建，最終只包含必要檔案
  
- **後端** (`alumni_platform_api`): ~400MB
  - Python 3.10 slim + gunicorn + eventlet

## 網路配置

### 開發環境

```
localhost:3000 ────> Frontend Container
                    (next dev server)

localhost:5001 ────> Backend Container
                    (gunicorn + Flask)

容器間通訊:
frontend → http://backend:5001
backend ← http://frontend:3000
```

### 生產環境

```
外網 ────> nginx:443 (HTTPS)
            ↓
        反向代理層
            ↓
    ┌───────┴───────┐
    ↓               ↓
frontend:3000   backend:5001
    (Next.js)      (Flask)
                    ↓
                  PostgreSQL:5432
```

## 故障排除

### Q: 前端無法連接後端
```bash
# 檢查後端日誌
./scripts/docker_dev.sh logs backend

# 驗證後端是否運行
docker-compose ps
```

### Q: 容器無法啟動
```bash
# 查看詳細錯誤
docker-compose logs

# 重新構建
./scripts/docker_dev.sh rebuild
```

### Q: 資料庫連接失敗
```bash
# 確保 PostgreSQL 完全啟動（需時間）
sleep 10
docker-compose ps

# 檢查環境變數
cat .env.prod | grep POSTGRES
```

## 下一步

詳見 [`DOCKER.md`](DOCKER.md) 了解更多進階配置和最佳實踐。
