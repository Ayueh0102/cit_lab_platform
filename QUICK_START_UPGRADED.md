# 🚀 升級後快速啟動指南

## 環境檢查

```bash
# 檢查 Node.js 版本（需要 20.19+）
node --version
# 應顯示: v24.8.0 或更高

# 檢查 Python 版本（需要 3.10+）
python --version
# 應顯示: Python 3.10.x 或更高

# 檢查 Conda 環境
conda env list | grep alumni-platform
# 應顯示: alumni-platform
```

## 🎯 快速啟動（推薦）

### 方式 1: 使用 Makefile（最快）
```bash
make dev     # 同時啟動前後端
make down    # 停止所有服務
```

### 方式 2: 分別啟動

#### 後端（Conda 環境）
```bash
# 啟動後端
conda activate alumni-platform
cd alumni_platform_api
python src/main_v2.py

# 後端將運行在 http://localhost:5001
```

#### 前端（Vite 7）
```bash
# 另開終端
cd alumni-platform
pnpm dev

# 前端將運行在 http://localhost:5173
```

## 📊 驗證升級成功

### 檢查 Vite 7
```bash
cd alumni-platform
pnpm list vite
# 應顯示: vite 7.1.12
```

### 檢查建置產物
```bash
cd alumni-platform
pnpm build
# 應看到分割後的 chunks:
# - vendor-react.js (~182 kB)
# - index.js (~53 kB)
# - vendor.js (~4 kB)
```

### 檢查前端運行
```bash
# 開啟瀏覽器訪問
open http://localhost:5173

# 應該能看到校友平台首頁
# 檢查瀏覽器 Console，確認沒有錯誤
```

### 檢查後端運行
```bash
# 測試 API 端點
curl http://localhost:5001/api/v2/auth/login

# 應回傳類似:
# <h1>Method Not Allowed</h1>
# (因為需要 POST 方法，這表示 API 正常運行)
```

## ✨ 使用新特性

### React 19 - useOptimistic Hook

**範例 1: 職缺申請**
```jsx
import { OptimisticJobApplication } from '@/components/OptimisticJobApplication';
import { applyToJob } from '@/services/api';

function JobDetailPage({ job }) {
  return (
    <OptimisticJobApplication 
      job={job} 
      onApply={applyToJob}
    />
  );
}
```

**範例 2: 自定義樂觀更新**
```jsx
import { useOptimisticJobApplication } from '@/hooks/use-optimistic';

function MyJobCard({ job }) {
  const [optimisticJob, applyOptimistically] = useOptimisticJobApplication(job);
  
  const handleApply = async () => {
    applyOptimistically({ ...job, applied: true });
    await applyToJob(job.id);
  };
  
  return (
    <button onClick={handleApply} disabled={optimisticJob.applied}>
      {optimisticJob.applied ? '已申請' : '立即申請'}
    </button>
  );
}
```

### Flask 3 - Async 路由

**啟用 Async 路由:**
```python
# 在 main_v2.py 中
from src.routes.jobs_v2_async import jobs_v2_async_bp
app.register_blueprint(jobs_v2_async_bp)
```

**建立 Async 路由:**
```python
from flask import Blueprint, jsonify

my_bp = Blueprint('my_feature', __name__)

@my_bp.get('/api/v2/my-endpoint')  # 使用簡化的裝飾器
async def get_data():
    # 可以使用 await 進行非同步操作
    data = await fetch_from_database()
    return jsonify(data)
```

## 🔧 常見問題排除

### Q: 前端建置失敗
```bash
# 清除快取並重新安裝
cd alumni-platform
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### Q: 後端無法啟動
```bash
# 重新建立 Conda 環境
conda deactivate
conda remove -n alumni-platform --all -y
conda create -n alumni-platform python=3.10 -y
conda activate alumni-platform
cd alumni_platform_api
pip install -r requirements.txt
```

### Q: Port 5001 或 5173 被佔用
```bash
# 查看佔用的程序
lsof -ti:5001
lsof -ti:5173

# 停止程序
kill $(lsof -ti:5001)
kill $(lsof -ti:5173)
```

### Q: Vite 啟動時出現警告
```
⚠️ @tailwindcss/vite requires vite ^5.2.0 || ^6
```
**解決方式**: 這是正常的，可以忽略。@tailwindcss/vite 即將支援 Vite 7。

## 📈 效能對比

### 建置時間
- **升級前** (Vite 6.3.5): ~394ms
- **升級後** (Vite 7.1.12): ~362ms
- **提升**: 約 8%

### Bundle 大小優化
- **升級前**: 單一 bundle (~240 kB)
- **升級後**: 智能分割
  - React vendor: 182.52 kB
  - App code: 53.16 kB  
  - Other vendor: 3.85 kB
- **優勢**: 更好的快取策略，首次載入後 vendor 不需重新下載

### 開發體驗
- ✅ HMR 更快速
- ✅ 冷啟動速度提升
- ✅ 型別提示更準確
- ✅ 錯誤訊息更清晰

## 📚 相關文檔

- [FRAMEWORK_UPGRADE_PLAN.md](mdc:FRAMEWORK_UPGRADE_PLAN.md) - 完整升級計劃
- [UPGRADE_SUMMARY.md](mdc:UPGRADE_SUMMARY.md) - 升級總結
- [README.md](mdc:README.md) - 專案說明
- [project_documentation.md](mdc:project_documentation.md) - 專案文檔

## 🎉 開始開發

一切就緒！您現在可以：
1. ✅ 使用 React 19 的新 Hooks
2. ✅ 享受 Vite 7 的更快建置速度
3. ✅ 撰寫 Flask 3 的 async 路由
4. ✅ 利用智能代碼分割

**Happy Coding! 🚀**

