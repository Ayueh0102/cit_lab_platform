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
# Helper functions
# ========================================
def _get_jwt_secret():
    """
    取得 JWT 加密金鑰
    優先使用 JWT_SECRET_KEY，否則退回 SECRET_KEY
    """
    secret = current_app.config.get('JWT_SECRET_KEY') or current_app.config.get('SECRET_KEY')
    if not secret:
        raise RuntimeError('JWT 秘鑰未設定')
    return secret


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
            data = jwt.decode(token, _get_jwt_secret(), algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])

            if not current_user:
                return jsonify({'message': 'User not found'}), 401

            if not current_user.status == "active":
                return jsonify({'message': 'Account is inactive'}), 401

            # 檢查 Session 是否仍然有效
            session = UserSession.query.filter_by(
                session_token=token,
                user_id=current_user.id,
                is_active=True
            ).first()

            if session and session.is_expired():
                session.invalidate()
                db.session.commit()
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
    """
    使用者註冊
    新用戶註冊後狀態為 pending，需等待管理員審核
    """
    try:
        data = request.get_json()

        # 驗證必填欄位
        required_fields = ['email', 'password']
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
        existing_user = User.query.filter_by(email=data['email']).first()
        
        if existing_user:
            # 如果用戶狀態是 inactive（已被刪除/停用）或 rejected（被拒絕），允許重新申請
            if existing_user.status in ['inactive', 'rejected']:
                # 重新啟用用戶，設為 pending 等待審核
                existing_user.status = 'pending'
                existing_user.set_password(data['password'])
                
                # 更新個人檔案
                profile = existing_user.profile
                if profile:
                    profile.full_name = data.get('name')
                    profile.display_name = data.get('display_name') or data.get('name')
                    profile.phone = data.get('phone')
                    profile.graduation_year = data.get('graduation_year')
                    profile.class_year = data.get('class_year')
                    profile.degree = data.get('degree')
                    profile.major = data.get('major', '色彩與照明科技研究所')
                    profile.student_id = data.get('student_id')
                    profile.thesis_title = data.get('thesis_title')
                    profile.advisor_1 = data.get('advisor_1')
                    profile.advisor_2 = data.get('advisor_2')
                else:
                    # 如果沒有 profile，創建新的
                    profile = UserProfile(
                        user_id=existing_user.id,
                        full_name=data.get('name'),
                        display_name=data.get('display_name') or data.get('name'),
                        phone=data.get('phone'),
                        graduation_year=data.get('graduation_year'),
                        class_year=data.get('class_year'),
                        degree=data.get('degree'),
                        major=data.get('major', '色彩與照明科技研究所'),
                        student_id=data.get('student_id'),
                        thesis_title=data.get('thesis_title'),
                        advisor_1=data.get('advisor_1'),
                        advisor_2=data.get('advisor_2'),
                    )
                    db.session.add(profile)
                
                db.session.commit()
                
                # 發送郵件通知（重新申請）
                try:
                    from src.utils.email import (
                        send_registration_notification_to_admin,
                        send_registration_confirmation_to_applicant
                    )
                    
                    user_data = {
                        'email': data['email'],
                        'full_name': data.get('name'),
                        'display_name': data.get('display_name') or data.get('name'),
                        'phone': data.get('phone'),
                        'graduation_year': data.get('graduation_year'),
                        'class_year': data.get('class_year'),
                        'degree': data.get('degree'),
                        'student_id': data.get('student_id'),
                        'thesis_title': data.get('thesis_title'),
                        'advisor_1': data.get('advisor_1'),
                        'advisor_2': data.get('advisor_2'),
                    }
                    
                    send_registration_notification_to_admin(user_data)
                    send_registration_confirmation_to_applicant(data['email'], data.get('name'))
                except Exception as e:
                    print(f"Email notification error: {e}")
                
                # 發送站內通知給管理員
                try:
                    from src.routes.notification_helper import create_user_registration_notification_to_admins
                    create_user_registration_notification_to_admins(
                        applicant_name=data.get('name'),
                        applicant_email=data['email'],
                        user_id=existing_user.id
                    )
                except Exception as notification_error:
                    print(f"Admin notification failed: {str(notification_error)}")
                
                return jsonify({
                    'message': '重新申請成功！請等待管理員審核。',
                    'user': {
                        'id': existing_user.id,
                        'email': existing_user.email,
                        'status': existing_user.status
                    }
                }), 201
            else:
                # 用戶狀態是 active 或 pending，不允許重複註冊
                return jsonify({'message': 'Email already registered'}), 400

        # 建立新使用者 - 狀態為 pending（等待審核）
        user = User(
            email=data['email'],
            role=data.get('role', 'user'),  # 預設為一般使用者
            status='pending'  # 新用戶需要審核
        )
        user.set_password(data['password'])

        db.session.add(user)
        db.session.flush()  # 取得 user.id

        # 建立使用者個人檔案 (包含完整學籍資料)
        profile = UserProfile(
            user_id=user.id,
            full_name=data.get('name'),  # 從 name 參數存到 full_name
            display_name=data.get('display_name') or data.get('name'),  # 顯示名稱
            phone=data.get('phone'),
            graduation_year=data.get('graduation_year'),
            class_year=data.get('class_year'),
            degree=data.get('degree'),
            major=data.get('major', '色彩與照明科技研究所'),  # 預設為色彩所
            student_id=data.get('student_id'),
            thesis_title=data.get('thesis_title'),
            advisor_1=data.get('advisor_1'),
            advisor_2=data.get('advisor_2'),
        )
        db.session.add(profile)
        db.session.commit()

        # 發送郵件通知
        try:
            from src.utils.email import (
                send_registration_notification_to_admin,
                send_registration_confirmation_to_applicant
            )
            
            # 準備用戶資料
            user_data = {
                'email': data['email'],
                'full_name': data.get('name'),
                'display_name': data.get('display_name') or data.get('name'),
                'phone': data.get('phone'),
                'graduation_year': data.get('graduation_year'),
                'class_year': data.get('class_year'),
                'degree': data.get('degree'),
                'student_id': data.get('student_id'),
                'thesis_title': data.get('thesis_title'),
                'advisor_1': data.get('advisor_1'),
                'advisor_2': data.get('advisor_2'),
            }
            
            # 發送通知給管理員
            send_registration_notification_to_admin(user_data)
            
            # 發送確認郵件給申請人
            send_registration_confirmation_to_applicant(user_data)
            
        except Exception as email_error:
            # 郵件發送失敗不影響註冊流程
            print(f"Email notification failed: {str(email_error)}")

        # 發送站內通知給管理員
        try:
            from src.routes.notification_helper import create_user_registration_notification_to_admins
            create_user_registration_notification_to_admins(
                applicant_name=data.get('name'),
                applicant_email=data['email'],
                user_id=user.id
            )
        except Exception as notification_error:
            print(f"Admin notification failed: {str(notification_error)}")

        # 註冊成功，但不發放 Token（因為需要等待審核）
        return jsonify({
            'message': '註冊申請已送出，請等待管理員審核',
            'status': 'pending',
            'user_id': user.id,
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
        
        # 確保 data 是字典
        if not isinstance(data, dict):
            return jsonify({'message': 'Invalid request format'}), 400

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
        secret_key = _get_jwt_secret()
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=7)
        }, secret_key, algorithm='HS256')

        # 建立登入會話
        session = UserSession(
            user_id=user.id,
            session_token=token,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')[:500],
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        db.session.add(session)

        # 更新最後登入時間
        user.last_login_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'access_token': token,
            'user_id': user.id,
            'user': user.to_dict(include_private=True)
        }), 200

    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"Login error: {str(e)}")
        print(traceback.format_exc())
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
    return jsonify(current_user.to_dict(include_private=True)), 200


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
        if 'full_name' in data:
            profile.full_name = data['full_name']
        if 'display_name' in data:
            profile.display_name = data['display_name']
        if 'graduation_year' in data:
            profile.graduation_year = data['graduation_year']
        if 'class_year' in data:
            profile.class_year = data['class_year']  # 屆數（如：101, 102, 103）
        elif 'class_name' in data:
            # 舊版欄位相容：嘗試將 class_name 轉換為 class_year
            try:
                profile.class_year = int(data['class_name']) if data['class_name'] is not None else None
            except (ValueError, TypeError):
                profile.class_year = data.get('class_name')
        if 'phone' in data:
            profile.phone = data['phone']
        if 'location' in data:
            profile.current_location = data['location']  # API 使用 location，模型使用 current_location
        
        # 學籍資料
        if 'degree' in data:
            profile.degree = data['degree']
        if 'major' in data:
            profile.major = data['major']
        if 'student_id' in data:
            profile.student_id = data['student_id']
        if 'thesis_title' in data:
            profile.thesis_title = data['thesis_title']
        if 'advisor_1' in data:
            profile.advisor_1 = data['advisor_1']
        if 'advisor_2' in data:
            profile.advisor_2 = data['advisor_2']

        # 職涯資訊
        if 'current_company' in data:
            profile.current_company = data['current_company']
        if 'current_position' in data:
            profile.current_position = data['current_position']
        if 'industry' in data:
            profile.industry = data['industry']

        # 社交連結
        if 'linkedin_url' in data:
            profile.linkedin_url = data['linkedin_url']
        elif 'linkedin_id' in data:
            profile.linkedin_id = data['linkedin_id']
        if 'personal_website' in data:
            profile.personal_website = data['personal_website']
        if 'github_url' in data:
            profile.github_url = data['github_url']
        elif 'github_username' in data:
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
            'user': current_user.to_dict(include_private=True)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Profile update failed: {str(e)}'}), 500


# ========================================
# 修改密碼
# ========================================
@auth_v2_bp.route('/api/v2/auth/change-password', methods=['POST'])
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


# ========================================
# 系友通訊錄 API
# ========================================
@auth_v2_bp.route('/api/v2/users', methods=['GET'])
def get_users():
    """
    獲取系友列表（支援搜尋和篩選）
    
    Query Parameters:
    - search: 搜尋關鍵字（姓名、公司、職位）
    - graduation_year: 畢業年份
    - industry: 產業別
    - page: 頁碼（默認 1）
    - per_page: 每頁數量（默認 20）
    """
    try:
        # 獲取查詢參數
        search = request.args.get('search', '').strip()
        graduation_year = request.args.get('graduation_year', type=int)
        industry = request.args.get('industry', '').strip()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # 限制每頁數量
        if per_page > 100:
            per_page = 100
        
        # 基本查詢：只返回活躍用戶
        query = User.query.filter_by(status='active')
        
        # 搜尋功能（姓名、公司、職位）
        if search:
            query = query.join(UserProfile, User.id == UserProfile.user_id, isouter=True)
            query = query.filter(
                db.or_(
                    UserProfile.full_name.ilike(f'%{search}%'),
                    UserProfile.display_name.ilike(f'%{search}%'),
                    UserProfile.current_company.ilike(f'%{search}%'),
                    UserProfile.current_position.ilike(f'%{search}%')
                )
            )
        else:
            # 如果沒有搜尋，也需要 join 來使用篩選
            if graduation_year or industry:
                query = query.join(UserProfile, User.id == UserProfile.user_id, isouter=True)
        
        # 畢業年份篩選
        if graduation_year:
            query = query.filter(UserProfile.graduation_year == graduation_year)
        
        # 產業別篩選 (暫時不支援,因為 UserProfile 沒有 industry 欄位)
        # if industry:
        #     query = query.filter(UserProfile.industry == industry)
        
        # 排序：最近登入的在前
        query = query.order_by(User.last_login_at.desc().nullslast())
        
        # 分頁
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # 組裝用戶列表
        users = []
        for user in pagination.items:
            user_data = {
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'status': user.status,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'last_login_at': user.last_login_at.isoformat() if user.last_login_at else None,
            }
            
            # 加入個人資料（如果有）
            if user.profile:
                profile = user.profile
                user_data['profile'] = {
                    'full_name': profile.full_name,
                    'display_name': profile.display_name,
                    'avatar_url': profile.avatar_url,
                    'graduation_year': profile.graduation_year,
                    'major': profile.major,
                    'degree': profile.degree,
                    'current_company': profile.current_company,
                    'current_position': profile.current_position,
                    'location': profile.current_location,
                    'bio': profile.bio,
                    'linkedin_url': profile.linkedin_url,
                    'github_url': profile.github_url,
                    'personal_website': profile.personal_website,
                    'show_email': profile.show_email,
                    'show_phone': profile.show_phone,
                }
                
                # 只在用戶允許的情況下顯示聯絡方式
                if profile.show_email:
                    user_data['profile']['email'] = user.email
                if profile.show_phone:
                    user_data['profile']['phone'] = profile.phone
            
            users.append(user_data)
        
        return jsonify({
            'users': users,
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get users failed: {str(e)}')
        return jsonify({'message': f'Failed to get users: {str(e)}'}), 500


@auth_v2_bp.route('/api/v2/users/<int:user_id>', methods=['GET'])
def get_user_by_id(user_id):
    """獲取指定用戶的詳細資料"""
    try:
        user = User.query.filter_by(id=user_id, status='active').first()
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        user_data = {
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'status': user.status,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'last_login_at': user.last_login_at.isoformat() if user.last_login_at else None,
        }
        
        # 加入個人資料
        if user.profile:
            profile = user.profile
            user_data['profile'] = {
                'full_name': profile.full_name,
                'display_name': profile.display_name,
                'avatar_url': profile.avatar_url,
                'graduation_year': profile.graduation_year,
                'major': profile.major,
                'degree': profile.degree,
                'current_company': profile.current_company,
                'current_position': profile.current_position,
                'location': profile.current_location,
                'bio': profile.bio,
                'linkedin_url': profile.linkedin_url,
                'github_url': profile.github_url,
                'personal_website': profile.personal_website,
                'show_email': profile.show_email,
                'show_phone': profile.show_phone,
            }
            
            # 只在用戶允許的情況下顯示聯絡方式
            if profile.show_email:
                user_data['profile']['email'] = user.email
            if profile.show_phone:
                user_data['profile']['phone'] = profile.phone
        
        return jsonify({'user': user_data}), 200
        
    except Exception as e:
        current_app.logger.error(f'Get user failed: {str(e)}')
        return jsonify({'message': f'Failed to get user: {str(e)}'}), 500
