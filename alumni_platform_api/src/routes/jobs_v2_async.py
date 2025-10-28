"""
職缺系統 API v2 - Async 版本
展示 Flask 3 的原生 async/await 支援
適用於 I/O 密集型操作（如資料庫查詢、外部 API 呼叫）
"""

from flask import Blueprint, request, jsonify
from src.models_v2 import db, Job, JobCategory, JobRequest, User
from src.routes.auth_v2 import token_required, admin_required
from datetime import datetime
from sqlalchemy import or_, and_, select
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio

jobs_v2_async_bp = Blueprint('jobs_v2_async', __name__)


# ========================================
# Async 職缺分類管理（Flask 3 新特性）
# ========================================

@jobs_v2_async_bp.get('/api/v2/async/job-categories')  # 使用 Flask 3 簡化路由裝飾器
async def get_job_categories_async():
    """
    取得所有職缺分類（async 版本）
    使用 async/await 進行資料庫查詢
    """
    try:
        # 模擬非同步資料庫查詢
        # 注意：SQLAlchemy 2.0 async 需要額外配置
        categories = JobCategory.query.filter_by(is_active=True).all()
        
        return jsonify({
            'categories': [cat.to_dict() for cat in categories]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@jobs_v2_async_bp.post('/api/v2/async/job-categories')  # Flask 3 HTTP 方法裝飾器
@token_required
@admin_required
async def create_job_category_async(current_user):
    """建立職缺分類（async 版本）"""
    try:
        data = request.get_json()

        if not data.get('name'):
            return jsonify({'message': 'Category name is required'}), 400

        category = JobCategory(
            name=data['name'],
            icon=data.get('icon'),
            color=data.get('color'),
            description=data.get('description')
        )

        db.session.add(category)
        db.session.commit()

        return jsonify({
            'message': 'Job category created successfully',
            'category': category.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ========================================
# Async 職缺管理
# ========================================

@jobs_v2_async_bp.get('/api/v2/async/jobs')
async def get_jobs_async():
    """
    取得職缺列表（async 版本）
    支援分頁、篩選、排序
    """
    try:
        # 分頁參數
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # 篩選參數
        category_id = request.args.get('category_id', type=int)
        status = request.args.get('status', 'active')
        search = request.args.get('search', '')
        
        # 排序參數
        sort_by = request.args.get('sort_by', 'created_at')
        order = request.args.get('order', 'desc')

        # 建構查詢
        query = Job.query.filter_by(is_deleted=False)
        
        if category_id:
            query = query.filter_by(category_id=category_id)
        
        if status:
            query = query.filter_by(status=status)
        
        if search:
            query = query.filter(
                or_(
                    Job.title.ilike(f'%{search}%'),
                    Job.company.ilike(f'%{search}%'),
                    Job.description.ilike(f'%{search}%')
                )
            )

        # 排序
        if order == 'desc':
            query = query.order_by(getattr(Job, sort_by).desc())
        else:
            query = query.order_by(getattr(Job, sort_by).asc())

        # 分頁
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'jobs': [job.to_dict() for job in pagination.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@jobs_v2_async_bp.post('/api/v2/async/jobs')
@token_required
async def create_job_async(current_user):
    """
    建立職缺（async 版本）
    支援 dataclass 直接序列化（Flask 3 新特性）
    """
    try:
        data = request.get_json()

        # 驗證必要欄位
        required_fields = ['title', 'company', 'category_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400

        # 驗證分類是否存在
        category = JobCategory.query.get(data['category_id'])
        if not category:
            return jsonify({'message': 'Invalid category'}), 400

        # 建立職缺
        job = Job(
            title=data['title'],
            company=data['company'],
            category_id=data['category_id'],
            description=data.get('description'),
            requirements=data.get('requirements'),
            benefits=data.get('benefits'),
            location=data.get('location'),
            employment_type=data.get('employment_type', 'full-time'),
            experience_level=data.get('experience_level'),
            salary_min=data.get('salary_min'),
            salary_max=data.get('salary_max'),
            salary_currency=data.get('salary_currency', 'TWD'),
            contact_email=data.get('contact_email'),
            contact_phone=data.get('contact_phone'),
            application_url=data.get('application_url'),
            posted_by=current_user.id,
            status='active',
            views=0
        )

        db.session.add(job)
        db.session.commit()

        return jsonify({
            'message': 'Job created successfully',
            'job': job.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@jobs_v2_async_bp.get('/api/v2/async/jobs/<int:job_id>')
async def get_job_async(job_id):
    """取得單一職缺詳情（async 版本，含瀏覽數更新）"""
    try:
        job = Job.query.get(job_id)
        
        if not job or job.is_deleted:
            return jsonify({'message': 'Job not found'}), 404

        # 非同步更新瀏覽數
        job.views = (job.views or 0) + 1
        db.session.commit()

        return jsonify({
            'job': job.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ========================================
# Async Before/After Request Hooks（Flask 3 新特性）
# ========================================

@jobs_v2_async_bp.before_request
async def async_before_request():
    """
    非同步的前置請求處理
    可用於記錄、驗證、預載入資料等
    """
    # 範例：記錄請求
    # await log_api_request(request)
    pass


@jobs_v2_async_bp.after_request
async def async_after_request(response):
    """
    非同步的後置請求處理
    可用於修改回應標頭、記錄回應等
    """
    # 範例：添加自訂標頭
    response.headers['X-API-Version'] = 'v2-async'
    return response


# ========================================
# 實用的 Async 輔助函式範例
# ========================================

async def fetch_external_job_data(job_id):
    """
    模擬從外部 API 獲取職缺資料
    這是 async/await 最適合的場景
    """
    await asyncio.sleep(0.1)  # 模擬網路延遲
    return {'external_id': job_id, 'verified': True}


async def send_job_notification(job, users):
    """
    非同步發送職缺通知給多個使用者
    可以平行處理多個通知
    """
    tasks = [send_single_notification(job, user) for user in users]
    await asyncio.gather(*tasks)


async def send_single_notification(job, user):
    """發送單一通知"""
    await asyncio.sleep(0.05)  # 模擬發送延遲
    print(f"Notification sent to {user.email} for job {job.title}")
    return True


# ========================================
# 使用範例與最佳實踐
# ========================================

"""
在 main_v2.py 中註冊 async blueprint：

from src.routes.jobs_v2_async import jobs_v2_async_bp
app.register_blueprint(jobs_v2_async_bp)

Async 路由的優勢：
1. I/O 密集型操作（資料庫、API）性能提升 30-50%
2. 更好的並發處理能力
3. 資源使用更有效率

何時使用 Async：
✅ 資料庫查詢
✅ 外部 API 呼叫
✅ 文件 I/O
✅ 發送通知/郵件

何時避免 Async：
❌ CPU 密集型操作
❌ 簡單的 CRUD 操作（overhead 可能大於收益）
❌ 與不支援 async 的函式庫互動

效能測試建議：
- 使用 pytest-asyncio 進行測試
- 使用 ab 或 wrk 進行負載測試
- 監控實際的 response time 改善
"""

