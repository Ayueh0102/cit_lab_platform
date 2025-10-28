# 框架升級計劃 - 最新版本實施指南

## 📊 目前版本 vs 建議版本

### 前端框架
| 框架 | 目前版本 | 最新版本 | 狀態 |
|------|---------|---------|------|
| React | 19.1.0 | 19.2+ | ✅ 已是最新，可應用新特性 |
| Vite | 6.3.5 | 7.0.0 | 🔄 建議升級 |
| Tailwind CSS | 4.1.7 | 4.1.7+ | ✅ 最新版本 |
| React Router | 7.6.1 | 7.9.4 | 🔄 可選升級 |

### 後端框架
| 框架 | 目前版本 | 最新版本 | 狀態 |
|------|---------|---------|------|
| Flask | 3.1.1 | 3.1.1 | ✅ 最新版本，可應用新特性 |
| SQLAlchemy | 2.0.41 | 2.0.41+ | ✅ 最新版本 |
| PyJWT | 2.10.1 | 2.10.1+ | ✅ 最新版本 |

## 🎯 升級優先順序

### Priority 1: Vite 7.0 升級（重要）

**主要變更：**
1. **Node.js 版本要求**
   - 必須：Node.js 20.19+ 或 22.12+
   - 目前：檢查您的版本

2. **配置變更**
   ```javascript
   // vite.config.js
   export default {
     build: {
       // 舊的 splitVendorChunkPlugin 已移除
       rollupOptions: {
         output: {
           // 改用 manualChunks 或 advancedChunks
           advancedChunks: {
             groups: [
               { name: 'vendor', test: /\/react(?:-dom)?|react-router/ }
             ]
           }
         }
       }
     }
   }
   ```

3. **Plugin Hook 更新**
   ```javascript
   // 插件開發者需注意
   export default function myPlugin() {
     return {
       name: 'my-plugin',
       transformIndexHtml: {
         order: 'pre',  // 舊的 'enforce' 改為 'order'
         handler(html, ctx) {  // 舊的 'transform' 改為 'handler'
           return html
         }
       }
     }
   }
   ```

### Priority 2: React 19 新特性應用（推薦）

**可立即應用的新特性：**

#### 1. `useOptimistic` Hook - 樂觀 UI 更新
```jsx
// 適用於表單提交、點讚、評論等互動場景
import { useOptimistic } from 'react';

function JobApplication({ job }) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(job.status);
  
  const handleApply = async (formData) => {
    setOptimisticStatus('pending');  // 立即顯示為 pending
    const result = await applyToJob(formData);
    // React 會自動更新為實際狀態
  };
  
  return (
    <div>
      <p>狀態: {optimisticStatus}</p>
      <form action={handleApply}>
        <button disabled={optimisticStatus === 'pending'}>申請職缺</button>
      </form>
    </div>
  );
}
```

#### 2. 簡化的 Context API
```jsx
// 舊寫法
import { createContext } from 'react';
const ThemeContext = createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Content />
    </ThemeContext.Provider>
  );
}

// 新寫法（React 19）
function App() {
  return (
    <ThemeContext value="dark">
      <Content />
    </ThemeContext>
  );
}
```

#### 3. `useEffectEvent` Hook - 優化 useEffect
```jsx
import { useEffect, useEffectEvent } from 'react';

function ChatRoom({ roomId, theme }) {
  // 將不需要重新連線的邏輯包在 useEffectEvent 中
  const onConnected = useEffectEvent(() => {
    showNotification('已連線！', theme);
  });
  
  useEffect(() => {
    const connection = createConnection(roomId);
    connection.on('connected', onConnected);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);  // theme 變更不會重新連線
}
```

### Priority 3: Flask 3 Async 支援（性能提升）

**原生 async/await 支援：**

```python
from flask import Flask, jsonify
import asyncio

app = Flask(__name__)

# 1. Async 路由
@app.route('/api/v2/jobs')
async def get_jobs():
    # 可以使用 await 進行 I/O 操作
    jobs = await fetch_jobs_from_db()
    return jsonify(jobs)

# 2. Async before_request hook
@app.before_request
async def before_request():
    # 非同步的前置處理
    await log_request()

# 3. HTTP 方法裝飾器簡化
@app.post('/api/v2/auth/login')  # 比 @app.route(..., methods=['POST']) 更簡潔
async def login():
    data = request.get_json()
    token = await authenticate(data)
    return jsonify({'token': token})

# 4. dataclass 支援
from dataclasses import dataclass

@dataclass
class JobPosting:
    id: int
    title: str
    company: str

@app.get('/api/v2/job/<int:job_id>')
async def get_job(job_id):
    job = JobPosting(id=job_id, title='Software Engineer', company='Tech Co')
    return jsonify(job)  # 直接序列化 dataclass
```

## 🚀 實施步驟

### 階段 1: 環境準備（1-2 小時）

```bash
# 1. 檢查 Node.js 版本
node --version
# 如果 < 20.19，使用 nvm 升級：
# nvm install 20
# nvm use 20

# 2. 檢查 Python 版本（已滿足 3.10+）
python --version

# 3. 備份當前專案
git add .
git commit -m "📦 Backup before framework upgrade"
git branch backup-before-upgrade
```

### 階段 2: 前端升級（2-3 小時）

```bash
cd alumni-platform

# 1. 升級 Vite
pnpm add -D vite@^7.0.0

# 2. 升級其他建議套件
pnpm add react@latest react-dom@latest
pnpm add -D @vitejs/plugin-react@latest

# 3. 更新 package.json scripts（如需要）
# 4. 測試建置
pnpm build
pnpm dev
```

### 階段 3: 配置調整（1 小時）

**更新 `vite.config.js`：**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'baseline-widely-available',  // Vite 7 新預設值
    rollupOptions: {
      output: {
        advancedChunks: {
          groups: [
            { 
              name: 'vendor', 
              test: /node_modules\/(react|react-dom|react-router-dom)/ 
            }
          ]
        }
      }
    }
  }
})
```

### 階段 4: 應用新特性（3-4 小時）

#### 前端重構建議：

1. **在 `src/services/api.js` 應用 useOptimistic**
   - 職缺申請
   - 活動報名
   - 公告發布

2. **簡化 Context 使用**
   - 檢查是否有使用 Context.Provider
   - 改用直接的 Context 語法

3. **優化 useEffect**
   - 使用 useEffectEvent 減少不必要的重新執行

#### 後端重構建議：

1. **轉換為 async 路由**
   ```python
   # alumni_platform_api/src/routes/jobs_v2.py
   
   @jobs_bp.route('/api/v2/jobs', methods=['GET'])
   async def get_jobs():
       # 可以在此使用 await 進行資料庫查詢
       page = request.args.get('page', 1, type=int)
       jobs = await Job.query.paginate(page=page, per_page=20)
       return jsonify([job.to_dict() for job in jobs.items])
   ```

2. **使用新的路由裝飾器**
   ```python
   @jobs_bp.post('/api/v2/jobs')  # 更簡潔
   @token_required
   async def create_job(current_user):
       data = request.get_json()
       # ...
   ```

### 階段 5: 測試與驗證（2-3 小時）

```bash
# 前端測試
cd alumni-platform
pnpm lint
pnpm build
pnpm dev

# 後端測試
cd ../alumni_platform_api
conda activate alumni-platform
python src/main_v2.py

# 功能測試清單：
# ✓ 登入/登出
# ✓ 職缺瀏覽與申請
# ✓ 活動報名
# ✓ 公告查看
# ✓ 個人檔案編輯
```

## 📝 遷移檢查清單

### Vite 7 遷移
- [ ] Node.js 版本 >= 20.19
- [ ] 移除 `splitVendorChunkPlugin` 使用
- [ ] 更新 `transformIndexHtml` hooks（如有自定義 plugin）
- [ ] 檢查 `build.target` 設定
- [ ] 測試建置產物

### React 19 特性
- [ ] 識別可使用 `useOptimistic` 的場景
- [ ] 簡化 Context.Provider 語法
- [ ] 使用 `useEffectEvent` 優化 useEffect
- [ ] 更新錯誤處理（createRoot options）

### Flask 3 Async
- [ ] 識別 I/O 密集路由
- [ ] 轉換為 async 路由
- [ ] 使用簡化的路由裝飾器
- [ ] 測試 async 性能提升

## 🎁 預期收益

### 性能提升
- ⚡ Vite 7: 更快的冷啟動和 HMR
- ⚡ React 19: 更流暢的 UI 更新體驗
- ⚡ Flask async: I/O 操作性能提升 30-50%

### 開發體驗
- 🛠️ 更簡潔的程式碼
- 🛠️ 更好的型別提示
- 🛠️ 更符合現代標準

### 維護性
- 📦 保持最新版本，獲得安全更新
- 📦 社群支援更活躍
- 📦 未來升級更容易

## ⚠️ 注意事項

1. **漸進式升級**：建議先在開發環境測試，確認無誤後再部署到正式環境
2. **版本相容性**：確保所有相依套件都支援新版本
3. **回退計劃**：保留備份分支，必要時可以快速回退
4. **團隊溝通**：確保團隊成員了解新特性和變更

## 📚 參考資源

- [Vite 7 Migration Guide](https://github.com/vitejs/vite/blob/v7.0.0/docs/guide/migration.md)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [Flask 3 Async/Await](https://flask.palletsprojects.com/async-await/)
- [Context7 Documentation](https://context7.com/)

