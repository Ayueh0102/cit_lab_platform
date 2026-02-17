# 部署快速參考

## 🚀 快速開始

```bash
# 第一次部署 - 執行前置檢查
./scripts/pre_deploy_check.sh

# 開發環境部署
./scripts/deploy.sh

# 生產環境部署
./scripts/deploy.sh production
```

## 📋 常用命令

### 部署相關
| 命令 | 說明 |
|------|------|
| `./scripts/deploy.sh` | 開發環境部署（預設） |
| `./scripts/deploy.sh production` | 生產環境部署 |
| `./scripts/pre_deploy_check.sh` | 部署前檢查 |
| `./scripts/deploy.sh rollback` | 回滾到上一版本 |

### 備份和還原
| 命令 | 說明 |
|------|------|
| `./scripts/backup_db.sh` | 手動備份資料庫 |
| `./scripts/restore_db.sh PATH` | 從備份還原 |

### Docker 操作
| 命令 | 說明 |
|------|------|
| `docker compose up -d` | 後台啟動容器 |
| `docker compose down` | 停止並移除容器 |
| `docker compose ps` | 查看容器狀態 |
| `docker compose logs -f [SERVICE]` | 查看日誌 |

## 🔧 部署流程

```
前置檢查 → 資料庫備份 → 應用建置 → 容器啟動 → 健康檢查 → 部署完成
```

## 📁 重要檔案位置

```
alumni-platform-complete-final/
├── scripts/
│   ├── deploy.sh                  # 主部署腳本
│   ├── pre_deploy_check.sh        # 前置檢查
│   ├── backup_db.sh               # 備份腳本
│   └── restore_db.sh              # 還原腳本
├── backups/                       # 自動備份目錄
│   └── YYYYMMDD_HHMMSS/
│       ├── app_v2.db
│       └── pg_dump.sql
├── .env.production.example        # 生產環境配置範本
├── docker-compose.yml             # 開發 Docker 配置
├── docker-compose.prod.yml        # 生產 Docker 配置
├── nginx/
│   └── nginx.conf                 # Nginx 反向代理配置
├── DEPLOY.md                      # 完整部署指南
└── DEPLOYMENT_QUICK_REFERENCE.md  # 本檔案
```

## ⚡ 部署前檢查清單

```bash
# 1. 執行自動檢查
./scripts/pre_deploy_check.sh

# 2. 手動驗證
□ 已提交重要變更 (git status)
□ .env 已配置（生產環境）
□ Docker 已安裝
□ 有可用磁盤空間 (> 1GB)
□ 連接埠無衝突 (3000, 5001, 80, 443)
□ 最近有備份
```

## 🔴 故障排除速查

| 問題 | 解決方案 |
|------|---------|
| 後端無法連接 | `docker compose logs backend` \| 檢查 5001 埠 |
| 前端無法載入 | `docker compose logs frontend` \| 檢查 3000 埠 |
| 資料庫錯誤 | `./scripts/restore_db.sh backups/LATEST/` |
| Nginx 無反應 | `docker compose exec nginx nginx -t` |
| 部署失敗 | `./scripts/deploy.sh rollback` |

## 🔐 生產環境設定

```bash
# 1. 建立生產環境配置
cp .env.production.example .env

# 2. 填入實際值
nano .env
# 必須設定：
# - DATABASE_URL (PostgreSQL)
# - JWT_SECRET_KEY (強密碼)
# - ALLOWED_ORIGINS (允許的域名)
# - SMTP_* (郵件設定)

# 3. 確保 .env 不被追蹤
echo ".env" >> .gitignore
git add .gitignore && git commit -m "Add .env to gitignore"

# 4. 部署
./scripts/deploy.sh production
```

## 📊 監控和診斷

```bash
# 查看所有容器日誌
docker compose logs -f

# 查看特定服務
docker compose logs -f backend    # 後端日誌
docker compose logs -f frontend   # 前端日誌
docker compose logs -f nginx      # Nginx 日誌

# 查看容器資源使用
docker stats

# 進入容器執行命令
docker compose exec backend bash
docker compose exec db psql -U alumni -d alumni_platform
```

## 🔄 持續部署建議

### GitHub Actions 工作流
```yaml
# .github/workflows/deploy.yml
name: Auto Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: ./scripts/pre_deploy_check.sh
      - run: ./scripts/deploy.sh production
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET_KEY: ${{ secrets.JWT_SECRET_KEY }}
```

### 定時備份 (Crontab)
```bash
# 每天午夜備份
0 0 * * * cd /path/to/alumni-platform && ./scripts/backup_db.sh

# 每周一上午 2 點清理舊備份（超過 30 天）
0 2 * * 1 find /path/to/alumni-platform/backups -maxdepth 1 -type d -mtime +30 -exec rm -rf {} \;
```

## 📞 支援資訊

- **部署文檔**: `DEPLOY.md`
- **專案說明**: `CLAUDE.md`
- **Docker 文檔**: `docker-compose.yml` 內的註解
- **Nginx 配置**: `nginx/nginx.conf` 內的註解

---

最後更新: 2026-02-18
