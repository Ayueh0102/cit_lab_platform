# 部署檢查清單

完整的部署工作流程檢查清單。在執行部署前，請按照以下步驟進行驗證。

## 部署前準備 (Pre-Deployment)

### 1. 程式碼檢查

- [ ] **本地變更已提交**
  ```bash
  git status
  # 確保沒有未提交的變更
  ```

- [ ] **同步遠端最新版本**
  ```bash
  git fetch origin
  git pull origin main
  ```

- [ ] **測試通過**
  ```bash
  # 前端測試
  cd alumni-platform-nextjs && npm test

  # 後端測試
  cd alumni_platform_api && pytest
  ```

- [ ] **程式碼檢查通過**
  ```bash
  # 前端 lint
  pnpm lint && pnpm type-check

  # 後端檢查
  cd alumni_platform_api && flake8 src/
  ```

### 2. 環境準備

- [ ] **Docker 已安裝並執行**
  ```bash
  docker --version
  docker compose --version
  docker ps
  ```

- [ ] **所需環境變數已設定**
  ```bash
  # 開發環境
  [ -f .env ]
  
  # 生產環境
  [ -f .env ] && grep -q "JWT_SECRET_KEY" .env
  ```

- [ ] **磁盤空間充足** (至少 2GB)
  ```bash
  df -h | grep -E "/$|/Volumes"
  ```

- [ ] **連接埠未被佔用**
  ```bash
  # 檢查 3000, 5001, 80, 443
  lsof -i :3000
  lsof -i :5001
  lsof -i :80
  lsof -i :443
  ```

### 3. 備份準備

- [ ] **資料庫已備份**
  ```bash
  ls -la backups/
  # 確保最新備份存在
  ```

- [ ] **備份位置有充足空間**
  ```bash
  du -sh backups/
  ```

### 4. 執行前置檢查

```bash
./scripts/pre_deploy_check.sh
# 應該顯示 ✅ 準備就緒，可以開始部署！
```

## 部署執行 (Deployment Execution)

### 5. 部署開發環境

```bash
./scripts/deploy.sh staging
```

部署過程包括：
- 前置條件檢查 ✓
- 資料庫備份 (backups/YYYYMMDD_HHMMSS/)
- Docker 應用建置
- 容器啟動
- 健康檢查 (最多 30 次重試)

### 6. 部署生產環境

```bash
./scripts/deploy.sh production
```

確保：
- [ ] 確認 .env 中的敏感資訊正確
- [ ] CORS 設定指向正確的域名
- [ ] JWT_SECRET_KEY 是強密碼
- [ ] 資料庫備份已完成

## 部署後驗證 (Post-Deployment Verification)

### 7. 應用可達性檢查

```bash
# 前端
curl -s http://localhost:3000 | head -20

# 後端 API
curl -s http://localhost:5001/api/health | jq

# Nginx (生產)
curl -s http://localhost | head -20
```

### 8. 關鍵功能測試

- [ ] **認證系統**
  - [ ] 登入頁面可訪問
  - [ ] 登入/登出功能正常
  - [ ] Token 正確儲存於 localStorage

- [ ] **首頁加載**
  - [ ] 無 JavaScript 錯誤
  - [ ] Aurora 背景動畫正常
  - [ ] 所有卡片元素顯示

- [ ] **API 連接**
  - [ ] `/api/v2/auth/login` 可呼叫
  - [ ] `/api/v2/jobs` 返回資料
  - [ ] `/api/v2/events` 返回資料

- [ ] **WebSocket 連接**
  ```bash
  # 後端日誌應顯示 socket 連接
  docker compose logs backend | grep -i socket
  ```

- [ ] **靜態檔案服務**
  - [ ] CSS 樣式正確載入
  - [ ] 圖片資源正常顯示
  - [ ] favicon.ico 可訪問

### 9. 日誌檢查

```bash
# 查看各服務日誌，確保無錯誤
docker compose logs --tail=50 backend
docker compose logs --tail=50 frontend
docker compose logs --tail=50 nginx  # 生產環境

# 確認無異常錯誤信息
docker compose logs | grep -i "error\|failed\|exception"
```

### 10. 性能基準測試

```bash
# 後端響應時間
curl -w "Time: %{time_total}s\n" -s http://localhost:5001/api/health

# 前端首屏時間
curl -w "Time: %{time_total}s\n" -s http://localhost:3000
```

## 故障排除 (Troubleshooting)

### 如果前端無法加載

```bash
# 1. 檢查前端容器
docker compose logs frontend

# 2. 檢查連接埠
lsof -i :3000

# 3. 重啟前端
docker compose restart frontend

# 4. 如果仍然失敗，回滾
./scripts/deploy.sh rollback
```

### 如果後端無法連接

```bash
# 1. 檢查後端容器
docker compose logs backend

# 2. 檢查健康端點
curl -v http://localhost:5001/api/health

# 3. 檢查資料庫連接
docker compose logs db

# 4. 還原資料庫備份
./scripts/restore_db.sh backups/YYYYMMDD_HHMMSS/

# 5. 重啟後端
docker compose restart backend
```

### 如果 Nginx 無反應 (生產)

```bash
# 1. 檢查 Nginx 配置
docker compose exec nginx nginx -t

# 2. 查看 Nginx 日誌
docker compose logs nginx

# 3. 重載配置
docker compose exec nginx nginx -s reload

# 4. 重啟 Nginx
docker compose restart nginx
```

## 回滾程序 (Rollback Procedure)

如果部署出現問題，執行回滾：

```bash
# 自動回滾（還原資料庫 + 檢出上一版本）
./scripts/deploy.sh rollback

# 驗證回滾成功
curl -s http://localhost:5001/api/health
```

## 部署完成 (Deployment Complete)

- [ ] 應用可正常訪問
- [ ] 主要功能已驗證
- [ ] 日誌無重大錯誤
- [ ] 備份已建立
- [ ] 團隊已通知

## 常見問題 (FAQ)

**Q: 部署需要多長時間？**
A: 通常 5-10 分鐘（包括備份、建置、啟動、健康檢查）

**Q: 可以在部署期間訪問應用嗎？**
A: 部署期間應用可能暫時無法訪問（容器重啟期間）

**Q: 如何回滾？**
A: 執行 `./scripts/deploy.sh rollback`，自動還原上一版本

**Q: 備份在哪裡？**
A: 在 `backups/YYYYMMDD_HHMMSS/` 目錄中

**Q: 如何手動還原特定備份？**
A: `./scripts/restore_db.sh /path/to/backup`

## 聯繫方式

遇到部署問題時：
1. 查看應用日誌
2. 檢查 DEPLOY.md 文檔
3. 執行前置檢查：`./scripts/pre_deploy_check.sh`
4. 必要時執行回滾：`./scripts/deploy.sh rollback`

---

**檢查清單版本**: v1.0  
**最後更新**: 2026-02-18  
**適用於**: 校友互動平台
