# GitHub Actions 工作流說明

本專案包含以下 CI/CD 工作流：

## 1. CI Pipeline (`.github/workflows/ci.yml`)

當推送到 `main` 或 `develop` 分支，或創建 Pull Request 時觸發：

### 前端測試與建置
- ✅ 安裝依賴
- ✅ 執行 ESLint 檢查
- ✅ 執行單元測試並生成覆蓋率報告
- ✅ 建置 Next.js 應用程式

### 後端測試
- ✅ 安裝 Python 依賴
- ✅ 執行 pytest 測試
- ✅ 生成代碼覆蓋率報告並上傳到 Codecov

### 整合測試
- ✅ 啟動後端服務
- ✅ 執行整合測試（預留）

## 2. 部署流程 (`.github/workflows/deploy.yml`)

當推送到 `main` 分支或創建版本標籤時觸發：

- ✅ 建置前端應用程式
- ✅ 準備後端部署
- ✅ 部署到生產環境（需配置部署憑證）

## 3. 代碼品質檢查 (`.github/workflows/quality.yml`)

在 Pull Request 時觸發：

### 前端
- ✅ ESLint 代碼檢查
- ✅ TypeScript 類型檢查

### 後端
- ✅ flake8 代碼風格檢查
- ✅ black 代碼格式檢查

## 需要的 GitHub Secrets

在 GitHub 倉庫設置中添加以下 Secrets：

### CI/CD 必需
- `NEXT_PUBLIC_API_URL`: 生產環境 API URL
- `DEPLOY_HOST`: 部署伺服器地址
- `DEPLOY_USER`: 部署用戶名
- `DEPLOY_KEY`: 部署 SSH 密鑰

### Docker 部署（可選）
- `DOCKER_REGISTRY`: Docker 倉庫地址
- `DOCKER_USERNAME`: Docker 用戶名
- `DOCKER_PASSWORD`: Docker 密碼

## 本地測試

### 測試前端
```bash
cd alumni-platform-nextjs
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

### 測試後端
```bash
cd alumni_platform_api
conda activate alumni-platform
pytest tests/ -v --cov=src
```

## 工作流狀態徽章

在 README.md 中添加以下徽章：

```markdown
![CI](https://github.com/your-username/alumni-platform-complete-final/workflows/CI%2FCD%20Pipeline/badge.svg)
![Deploy](https://github.com/your-username/alumni-platform-complete-final/workflows/Deploy%20to%20Production/badge.svg)
![Quality](https://github.com/your-username/alumni-platform-complete-final/workflows/Code%20Quality%20Checks/badge.svg)
```

## 注意事項

1. **首次設置**：工作流會在首次推送時自動運行
2. **測試覆蓋率**：確保測試覆蓋率達到要求（建議 > 70%）
3. **部署憑證**：生產環境部署需要配置相應的 SSH 密鑰或憑證
4. **環境變數**：確保所有必需的環境變數都已設置
5. **Docker 部署**：如果需要 Docker 部署，需要先設置 Dockerfile

