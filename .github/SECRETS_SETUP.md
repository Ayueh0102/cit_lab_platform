# GitHub Actions Secrets 設置指南

為了讓 CI/CD 工作流正常運行，需要在 GitHub 倉庫中設置以下 Secrets。

## 如何設置 Secrets

1. 進入 GitHub 倉庫
2. 點擊 **Settings** → **Secrets and variables** → **Actions**
3. 點擊 **New repository secret**
4. 輸入名稱和值，然後點擊 **Add secret**

## 必需的 Secrets

### 前端部署
- `NEXT_PUBLIC_API_URL`: 生產環境的 API URL
  - 範例：`https://api.yourdomain.com`

### 後端部署
- `DEPLOY_HOST`: 部署伺服器的主機地址
  - 範例：`your-server.com` 或 `192.168.1.100`
- `DEPLOY_USER`: SSH 登入用戶名
  - 範例：`deploy` 或 `ubuntu`
- `DEPLOY_KEY`: SSH 私鑰（用於無密碼登入）
  - 生成 SSH 金鑰對：
    ```bash
    ssh-keygen -t rsa -b 4096 -C "deploy@github-actions"
    ```
  - 將私鑰添加到 Secrets，公鑰添加到伺服器的 `~/.ssh/authorized_keys`

### 資料庫（可選）
- `DATABASE_URL`: PostgreSQL 連接字串（生產環境）
  - 範例：`postgresql://user:password@host:5432/dbname`

## 可選的 Secrets

### Docker 部署
- `DOCKER_REGISTRY`: Docker 倉庫地址
  - 範例：`docker.io` 或 `registry.yourdomain.com`
- `DOCKER_USERNAME`: Docker 用戶名
- `DOCKER_PASSWORD`: Docker 密碼或訪問令牌

### 通知（可選）
- `SLACK_WEBHOOK_URL`: Slack Webhook URL（用於部署通知）
- `DISCORD_WEBHOOK_URL`: Discord Webhook URL（用於部署通知）

## 安全建議

1. **不要將 Secrets 提交到代碼庫**
   - 確保 `.env` 文件在 `.gitignore` 中
   - 不要在代碼中硬編碼敏感信息

2. **定期輪換 Secrets**
   - 定期更新密碼和 API 金鑰
   - 使用強密碼

3. **最小權限原則**
   - 只授予必要的權限
   - 使用專用部署用戶而非 root

4. **監控訪問**
   - 定期檢查 Secrets 的使用情況
   - 審查部署日誌

## 測試 Secrets

設置 Secrets 後，可以通過創建一個測試工作流來驗證：

```yaml
name: Test Secrets
on: workflow_dispatch
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Test secrets
        run: |
          echo "Testing secrets..."
          # 這裡可以添加測試邏輯
```

注意：測試時不要直接輸出 Secrets 的值。

