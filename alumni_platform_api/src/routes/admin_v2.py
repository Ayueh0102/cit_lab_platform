"""
管理後台 API v2
提供統計數據、用戶管理、數據審核等功能
"""

from flask import Blueprint, request, jsonify, current_app
from src.models_v2 import db, User, UserProfile, Job, Event, Bulletin, Notification
from src.models_v2.jobs import JobStatus
from src.models_v2.content import ContentStatus
from src.routes.auth_v2 import token_required, admin_required
from datetime import datetime, timedelta

admin_v2_bp = Blueprint('admin_v2', __name__)


# ========================================
# 統計數據 API
# ========================================
@admin_v2_bp.route('/api/v2/admin/statistics', methods=['GET'])
@token_required
@admin_required
def get_statistics(current_user):
    """取得系統統計數據"""
    try:
        # 用戶統計
        total_users = User.query.count()
        active_users = User.query.filter_by(status='active').count()
        
        # 最近 30 天活躍用戶
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        active_users_30d = User.query.filter(
            User.last_login_at >= thirty_days_ago
        ).count()
        
        # 職缺統計
        total_jobs = Job.query.count()
        active_jobs = Job.query.filter(Job.status == JobStatus.ACTIVE).count()
        draft_jobs = Job.query.filter(Job.status == JobStatus.DRAFT).count()
        
        # 活動統計
        total_events = Event.query.count()
        upcoming_events = Event.query.filter(
            Event.start_time > datetime.utcnow()
        ).count()
        
        # 公告統計
        total_bulletins = Bulletin.query.count()
        published_bulletins = Bulletin.query.filter(Bulletin.status == ContentStatus.PUBLISHED).count()
        
        # 本月新增統計
        this_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        jobs_this_month = Job.query.filter(Job.created_at >= this_month_start).count()
        events_this_month = Event.query.filter(Event.created_at >= this_month_start).count()
        bulletins_this_month = Bulletin.query.filter(Bulletin.created_at >= this_month_start).count()
        users_this_month = User.query.filter(User.created_at >= this_month_start).count()
        
        # 本週新增統計
        week_start = datetime.utcnow() - timedelta(days=datetime.utcnow().weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        bulletins_this_week = Bulletin.query.filter(Bulletin.created_at >= week_start).count()
        
        return jsonify({
            'statistics': {
                'users': {
                    'total': total_users,
                    'active': active_users,
                    'active_30d': active_users_30d,
                    'new_this_month': users_this_month,
                },
                'jobs': {
                    'total': total_jobs,
                    'active': active_jobs,
                    'draft': draft_jobs,
                    'new_this_month': jobs_this_month,
                },
                'events': {
                    'total': total_events,
                    'upcoming': upcoming_events,
                    'new_this_month': events_this_month,
                },
                'bulletins': {
                    'total': total_bulletins,
                    'published': published_bulletins,
                    'new_this_month': bulletins_this_month,
                    'new_this_week': bulletins_this_week,
                },
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get statistics failed: {str(e)}')
        return jsonify({'message': f'Failed to get statistics: {str(e)}'}), 500


# ========================================
# 用戶管理 API
# ========================================
@admin_v2_bp.route('/api/v2/admin/users', methods=['GET'])
@token_required
@admin_required
def get_users_admin(current_user):
    """取得用戶列表（管理後台）"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '').strip()
        role = request.args.get('role', '').strip()
        status = request.args.get('status', '').strip()
        
        if per_page > 100:
            per_page = 100
        
        query = User.query
        
        # 搜尋過濾
        if search:
            query = query.join(UserProfile, User.id == UserProfile.user_id, isouter=True)
            query = query.filter(
                db.or_(
                    User.email.ilike(f'%{search}%'),
                    UserProfile.full_name.ilike(f'%{search}%'),
                    UserProfile.display_name.ilike(f'%{search}%')
                )
            )
        
        # 角色過濾
        if role:
            query = query.filter(User.role == role)
        
        # 狀態過濾
        if status:
            query = query.filter(User.status == status)
        
        # 排序
        query = query.order_by(User.created_at.desc())
        
        # 分頁
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        users = []
        for user in pagination.items:
            user_data = {
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'status': user.status,
                'is_active': user.status == 'active',
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'last_login_at': user.last_login_at.isoformat() if user.last_login_at else None,
            }
            
            if user.profile:
                user_data['full_name'] = user.profile.full_name
                user_data['display_name'] = user.profile.display_name
            else:
                user_data['full_name'] = user.email.split('@')[0]
                user_data['display_name'] = user.email.split('@')[0]
            
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


@admin_v2_bp.route('/api/v2/admin/users/<int:user_id>', methods=['PUT'])
@token_required
@admin_required
def update_user_admin(current_user, user_id):
    """更新用戶資訊（管理後台）"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        data = request.get_json()
        
        # 檢查是否在修改自己的權限
        is_modifying_self = user_id == current_user.id
        
        # 更新角色
        if 'role' in data:
            if data['role'] in ['admin', 'user']:
                # 允許管理員修改自己的權限（包括移除管理員權限）
                user.role = data['role']
            else:
                return jsonify({'message': 'Invalid role'}), 400
        
        # 更新狀態
        if 'status' in data:
            if data['status'] in ['active', 'inactive', 'suspended']:
                # 允許管理員修改自己的狀態（包括停用自己）
                user.status = data['status']
            else:
                return jsonify({'message': 'Invalid status'}), 400
        
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'status': user.status,
            },
            'is_self': is_modifying_self
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Update user failed: {str(e)}')
        return jsonify({'message': f'Failed to update user: {str(e)}'}), 500


@admin_v2_bp.route('/api/v2/admin/users/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user_admin(current_user, user_id):
    """刪除用戶（管理後台）"""
    try:
        # 防止刪除自己
        if user_id == current_user.id:
            return jsonify({'message': 'Cannot delete yourself'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # 軟刪除：將狀態設為 inactive
        user.status = 'inactive'
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Delete user failed: {str(e)}')
        return jsonify({'message': f'Failed to delete user: {str(e)}'}), 500


# ========================================
# 數據審核 API
# ========================================
@admin_v2_bp.route('/api/v2/admin/jobs/<int:job_id>/approve', methods=['POST'])
@token_required
@admin_required
def approve_job(current_user, job_id):
    """審核通過職缺"""
    try:
        job = Job.query.get(job_id)
        if not job:
            return jsonify({'message': 'Job not found'}), 404
        
        job.status = JobStatus.ACTIVE
        db.session.commit()
        
        return jsonify({'message': 'Job approved successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to approve job: {str(e)}'}), 500


@admin_v2_bp.route('/api/v2/admin/events/<int:event_id>/approve', methods=['POST'])
@token_required
@admin_required
def approve_event(current_user, event_id):
    """審核通過活動"""
    from src.models_v2.events import EventStatus
    try:
        event = Event.query.get(event_id)
        if not event:
            return jsonify({'message': 'Event not found'}), 404
        
        event.status = EventStatus.UPCOMING
        db.session.commit()
        
        return jsonify({'message': 'Event approved successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to approve event: {str(e)}'}), 500


@admin_v2_bp.route('/api/v2/admin/bulletins/<int:bulletin_id>/approve', methods=['POST'])
@token_required
@admin_required
def approve_bulletin(current_user, bulletin_id):
    """審核通過公告"""
    try:
        bulletin = Bulletin.query.get(bulletin_id)
        if not bulletin:
            return jsonify({'message': 'Bulletin not found'}), 404
        
        bulletin.status = ContentStatus.PUBLISHED
        if not bulletin.published_at:
            bulletin.published_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Bulletin approved successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to approve bulletin: {str(e)}'}), 500

