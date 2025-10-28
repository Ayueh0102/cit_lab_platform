"""
認證路由 v2 - 使用 models_v2
支援 JWT 認證、註冊、登入、會話管理
"""

from flask import Blueprint, request, jsonify, current_app
from src.models_v2 import db, User, UserProfile, UserSession
import jwt
from datetime import datetime, timedelta
from functools import wraps
import secrets

auth_v2_bp = Blueprint('auth_v2', __name__)


# ========================================
# JWT Token 認證裝飾器
# ========================================
def token_required(f):
    """JWT Token 認證裝飾器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header:
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'message': 'Token format invalid'}), 401

        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            # 解碼 JWT Token
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])

            if not current_user:
                return jsonify({'message': 'User not found'}), 401

            if not current_user.status == "active":
                return jsonify({'message': 'Account is inactive'}), 401

            # 檢查 Session 是否仍然有效
            session = UserSession.query.filter_by(
                session_token=token,
                user_id=current_user.id,
                status="active"
            ).first()

            if session and session.is_expired:
                session.logout()
                return jsonify({'message': 'Session has expired'}), 401

        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid'}), 401

        return f(current_user, *args, **kwargs)

    return decorated


def admin_required(f):
    """管理員權限裝飾器"""
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)

    return decorated


# ========================================
# 註冊
# ========================================
@auth_v2_bp.route('/api/v2/auth/register', methods=['POST'])
def register():
    """使用者註冊"""
    try:
        data = request.get_json()

        # 驗證必填欄位
        required_fields = ['email', 'password', 'name']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'message': f'{field} is required'}), 400

        # 檢查 email 格式
        if '@' not in data['email']:
            return jsonify({'message': 'Invalid email format'}), 400

        # 檢查密碼強度
        if len(data['password']) < 6:
            return jsonify({'message': 'Password must be at least 6 characters'}), 400

        # 檢查使用者是否已存在
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already registered'}), 400

        # 建立新使用者
        user = User(
            email=data['email'],
            name=data['name'],
            role=data.get('role', 'user')  # 預設為一般使用者
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.flush()  # 取得 user.id

        # 建立使用者個人檔案
        profile = UserProfile(
            user_id=user.id,
            graduation_year=data.get('graduation_year'),
            class_name=data.get('class_name'),
            phone=data.get('phone')
        )
        db.session.add(profile)
        db.session.commit()

        # 產生 JWT Token
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=7)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')

        # 建立登入會話
        session = UserSession(
            user_id=user.id,
            session_token=token,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')[:500],
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        db.session.add(session)
        db.session.commit()

        return jsonify({
            'message': 'User registered successfully',
            'access_token': token,
            'user_id': user.id,
            'user': user.to_dict(include_profile=True)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Registration failed: {str(e)}'}), 500


# ========================================
# 登入
# ========================================
@auth_v2_bp.route('/api/v2/auth/login', methods=['POST'])
def login():
    """使用者登入"""
    try:
        data = request.get_json()

        if not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400

        user = User.query.filter_by(email=data['email']).first()

        if not user:
            return jsonify({'message': 'Invalid email or password'}), 401

        if not user.check_password(data['password']):
            return jsonify({'message': 'Invalid email or password'}), 401

        if not user.status == "active":
            return jsonify({'message': 'Account is inactive'}), 401

        # 產生 JWT Token
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=7)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')

        # 建立登入會話
        session = UserSession(
            user_id=user.id,
            session_token=token,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')[:500],
            device_info=data.get('device_info'),
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        db.session.add(session)

        # 更新最後登入時間
        user.last_login_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'access_token': token,
            'user_id': user.id,
            'user': user.to_dict(include_profile=True)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Login failed: {str(e)}'}), 500


# ========================================
# 登出
# ========================================
@auth_v2_bp.route('/api/v2/auth/logout', methods=['POST'])
@token_required
def logout(current_user):
    """使用者登出"""
    try:
        token = request.headers.get('Authorization').split(" ")[1]

        # 將當前 Session 標記為登出
        session = UserSession.query.filter_by(
            session_token=token,
            user_id=current_user.id,
            status="active"
        ).first()

        if session:
            session.logout()
            db.session.commit()

        return jsonify({'message': 'Logged out successfully'}), 200

    except Exception as e:
        return jsonify({'message': f'Logout failed: {str(e)}'}), 500


# ========================================
# 取得當前使用者資訊
# ========================================
@auth_v2_bp.route('/api/v2/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """取得當前登入使用者的完整資訊"""
    return jsonify(current_user.to_dict(include_profile=True, include_private=True)), 200


# ========================================
# 更新個人檔案
# ========================================
@auth_v2_bp.route('/api/v2/auth/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """更新使用者個人檔案"""
    try:
        data = request.get_json()

        # 更新 User 資料
        if 'name' in data:
            current_user.name = data['name']

        # 更新 Profile 資料
        profile = current_user.profile
        if not profile:
            profile = UserProfile(user_id=current_user.id)
            db.session.add(profile)

        # 基本資料
        if 'graduation_year' in data:
            profile.graduation_year = data['graduation_year']
        if 'class_name' in data:
            profile.class_name = data['class_name']
        if 'phone' in data:
            profile.phone = data['phone']

        # 職涯資訊
        if 'current_company' in data:
            profile.current_company = data['current_company']
        if 'current_position' in data:
            profile.current_position = data['current_position']
        if 'industry' in data:
            profile.industry = data['industry']

        # 社交連結
        if 'linkedin_id' in data:
            profile.linkedin_id = data['linkedin_id']
        if 'personal_website' in data:
            profile.personal_website = data['personal_website']
        if 'github_username' in data:
            profile.github_username = data['github_username']

        # 個人介紹
        if 'bio' in data:
            profile.bio = data['bio']
        if 'avatar_url' in data:
            profile.avatar_url = data['avatar_url']

        # 隱私設定
        if 'show_email' in data:
            profile.show_email = data['show_email']
        if 'show_phone' in data:
            profile.show_phone = data['show_phone']

        db.session.commit()

        return jsonify({
            'message': 'Profile updated successfully',
            'user': current_user.to_dict(include_profile=True)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Profile update failed: {str(e)}'}), 500


# ========================================
# 修改密碼
# ========================================
@auth_v2_bp.route('/api/auth/v2/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    """修改密碼"""
    try:
        data = request.get_json()

        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'message': 'Current password and new password are required'}), 400

        # 驗證目前密碼
        if not current_user.check_password(data['current_password']):
            return jsonify({'message': 'Current password is incorrect'}), 401

        # 檢查新密碼強度
        if len(data['new_password']) < 6:
            return jsonify({'message': 'New password must be at least 6 characters'}), 400

        # 設定新密碼
        current_user.set_password(data['new_password'])
        db.session.commit()

        return jsonify({'message': 'Password changed successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Password change failed: {str(e)}'}), 500


# ========================================
# 取得使用者的登入會話列表
# ========================================
@auth_v2_bp.route('/api/auth/v2/sessions', methods=['GET'])
@token_required
def get_sessions(current_user):
    """取得當前使用者的所有登入會話"""
    sessions = UserSession.query.filter_by(
        user_id=current_user.id,
        status="active"
    ).order_by(UserSession.created_at.desc()).all()

    return jsonify({
        'sessions': [session.to_dict() for session in sessions]
    }), 200


# ========================================
# 登出特定會話
# ========================================
@auth_v2_bp.route('/api/auth/v2/sessions/<int:session_id>', methods=['DELETE'])
@token_required
def revoke_session(current_user, session_id):
    """登出特定會話"""
    try:
        session = UserSession.query.filter_by(
            id=session_id,
            user_id=current_user.id
        ).first()

        if not session:
            return jsonify({'message': 'Session not found'}), 404

        session.logout()
        db.session.commit()

        return jsonify({'message': 'Session revoked successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Session revoke failed: {str(e)}'}), 500


# ========================================
# LinkedIn OAuth (預留)
# ========================================
@auth_v2_bp.route('/api/auth/v2/linkedin', methods=['GET'])
def linkedin_auth():
    """LinkedIn 認證 (預留功能)"""
    return jsonify({
        'message': 'LinkedIn authentication not implemented',
        'redirect_url': 'https://www.linkedin.com/oauth/v2/authorization'
    }), 200


@auth_v2_bp.route('/api/auth/v2/linkedin/callback', methods=['GET'])
def linkedin_callback():
    """LinkedIn OAuth Callback (預留功能)"""
    return jsonify({
        'message': 'LinkedIn callback not implemented'
    }), 200
