"""
認證路由 v2 - Async 版本
展示 Flask 3 的 async/await 特性
適用於 I/O 密集型操作（資料庫查詢、外部 API 呼叫）
"""

from flask import Blueprint, request, jsonify, current_app
from src.models_v2 import db, User, UserProfile, UserSession
from src.routes.auth_v2 import token_required, admin_required  # 重用現有的裝飾器
import jwt
from datetime import datetime, timedelta
import secrets
import asyncio

auth_v2_async_bp = Blueprint('auth_v2_async', __name__)


# ========================================
# Async 登入路由（Flask 3 新特性）
# ========================================

@auth_v2_async_bp.post('/api/v2/async/auth/login')  # 使用 Flask 3 簡化裝飾器
async def login_async():
    """
    用戶登入（async 版本）
    支援 Email + 密碼驗證
    """
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'message': 'Email and password are required'}), 400

        # 查詢用戶（模擬異步查詢）
        # 注意：SQLAlchemy 的同步操作在這裡仍是同步的
        # 完整的 async 支援需要 SQLAlchemy async engine
        user = User.query.filter_by(email=email).first()

        if not user or not user.check_password(password):
            return jsonify({'message': 'Invalid credentials'}), 401

        if not user.is_active:
            return jsonify({'message': 'Account is inactive'}), 401

        # 生成 JWT Token
        token = jwt.encode(
            {
                'user_id': user.id,
                'exp': datetime.utcnow() + timedelta(days=7)
            },
            current_app.config['SECRET_KEY'],
            algorithm='HS256'
        )

        # 建立 Session
        session = UserSession(
            user_id=user.id,
            token=token,
            ip_address=request.remote_addr,
            user_agent=request.user_agent.string,
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        db.session.add(session)
        db.session.commit()

        # 更新最後登入時間
        user.last_login_at = datetime.utcnow()
        user.last_login_ip = request.remote_addr
        db.session.commit()

        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_v2_async_bp.get('/api/v2/async/auth/me')  # Flask 3 HTTP 方法裝飾器
@token_required
async def get_current_user_async(current_user):
    """
    取得當前用戶資訊（async 版本）
    包含個人檔案資料
    """
    try:
        # 模擬並行查詢多個資源
        # 在實際應用中，這些可以是真正的異步資料庫查詢或外部 API 呼叫
        profile = UserProfile.query.filter_by(user_id=current_user.id).first()

        user_data = {
            'id': current_user.id,
            'email': current_user.email,
            'name': current_user.name,
            'role': current_user.role,
            'status': current_user.status,
            'is_active': current_user.is_active,
            'created_at': current_user.created_at.isoformat() if current_user.created_at else None,
            'last_login_at': current_user.last_login_at.isoformat() if current_user.last_login_at else None,
        }

        if profile:
            user_data['profile'] = {
                'phone': profile.phone,
                'bio': profile.bio,
                'location': profile.location,
                'graduation_year': profile.graduation_year,
                'department': profile.department,
                'major': profile.major,
                'current_company': profile.current_company,
                'current_position': profile.current_position,
            }

        return jsonify({'user': user_data}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_v2_async_bp.post('/api/v2/async/auth/logout')
@token_required
async def logout_async(current_user):
    """
    用戶登出（async 版本）
    使當前 Session 失效
    """
    try:
        token = request.headers.get('Authorization').split(" ")[1]
        
        session = UserSession.query.filter_by(
            token=token,
            user_id=current_user.id
        ).first()

        if session:
            session.logout()

        return jsonify({'message': 'Logged out successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ========================================
# Async 用戶註冊
# ========================================

@auth_v2_async_bp.post('/api/v2/async/auth/register')
async def register_async():
    """
    用戶註冊（async 版本）
    支援同時建立用戶和個人檔案
    """
    try:
        data = request.get_json()

        # 驗證必要欄位
        required_fields = ['email', 'password', 'name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400

        # 檢查 Email 是否已存在
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'message': 'Email already registered'}), 409

        # 建立新用戶
        user = User(
            email=data['email'],
            name=data['name'],
            role=data.get('role', 'user'),
            status='active'
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.flush()  # 獲取 user.id

        # 建立個人檔案
        profile = UserProfile(
            user_id=user.id,
            phone=data.get('phone'),
            bio=data.get('bio'),
            location=data.get('location'),
            graduation_year=data.get('graduation_year'),
            department=data.get('department'),
            major=data.get('major')
        )
        db.session.add(profile)
        db.session.commit()

        return jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ========================================
# Async Before/After Request Hooks
# ========================================

@auth_v2_async_bp.before_request
async def async_before_auth_request():
    """
    非同步的前置請求處理（針對 auth 路由）
    可用於記錄、驗證、預載入資料等
    """
    # 範例：記錄所有認證請求
    # await log_auth_request(request)
    pass


@auth_v2_async_bp.after_request
async def async_after_auth_request(response):
    """
    非同步的後置請求處理（針對 auth 路由）
    """
    # 添加安全標頭
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-API-Version'] = 'v2-async'
    return response


# ========================================
# 實用的 Async 輔助函式範例
# ========================================

async def send_welcome_email(user_email, user_name):
    """
    模擬發送歡迎郵件（異步）
    實際應用中可以使用真正的郵件服務 API
    """
    await asyncio.sleep(0.1)  # 模擬網路延遲
    print(f"Welcome email sent to {user_name} <{user_email}>")
    return True


async def log_auth_event(user_id, event_type, details=None):
    """
    記錄認證事件（異步）
    可以發送到日誌服務或分析平台
    """
    await asyncio.sleep(0.05)  # 模擬延遲
    event = {
        'user_id': user_id,
        'event_type': event_type,
        'details': details,
        'timestamp': datetime.utcnow().isoformat()
    }
    print(f"Auth event logged: {event}")
    return event


# ========================================
# 使用範例與最佳實踐
# ========================================

"""
在 main_v2.py 中註冊 async blueprint：

from src.routes.auth_v2_async import auth_v2_async_bp
app.register_blueprint(auth_v2_async_bp)

Async 認證路由的優勢：
1. 並行處理多個認證請求
2. 不阻塞其他請求
3. 更好的擴展性

注意事項：
- 目前 SQLAlchemy 的操作仍是同步的
- 完整的 async 支援需要配置 AsyncSession
- 適合與外部服務（郵件、SMS）整合

升級路徑：
1. 使用 asyncio 包裝現有的同步操作
2. 逐步遷移到 SQLAlchemy async engine
3. 整合 async 的外部服務 (aiohttp, httpx)
"""

