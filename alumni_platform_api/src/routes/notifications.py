"""
通知系統 API
包含通知管理、系統設定、活動記錄
"""

from flask import Blueprint, request, jsonify
from src.models_v2 import db, Notification, SystemSetting, UserActivity, FileUpload, UserProfile
from src.routes.auth_v2 import token_required, admin_required
from datetime import datetime
from sqlalchemy import or_
import json

notifications_bp = Blueprint('notifications', __name__)


# ========================================
# 通知管理
# ========================================
@notifications_bp.route('/api/notifications', methods=['GET'])
@token_required
def get_notifications(current_user):
    """取得使用者的通知列表"""
    status = request.args.get('status')  # unread, read, archived
    notification_type = request.args.get('type')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Notification.query.filter_by(user_id=current_user.id)

    if status:
        query = query.filter_by(status=status)
    if notification_type:
        query = query.filter_by(notification_type=notification_type)

    # 分頁
    pagination = query.order_by(Notification.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'notifications': [notif.to_dict() for notif in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@notifications_bp.route('/api/notifications/unread-count', methods=['GET'])
@token_required
def get_unread_count(current_user):
    """取得未讀通知數量"""
    count = Notification.query.filter_by(
        user_id=current_user.id,
        status='unread'
    ).count()

    return jsonify({'unread_count': count}), 200


@notifications_bp.route('/api/notifications/<int:notif_id>/read', methods=['POST'])
@token_required
def mark_notification_as_read(current_user, notif_id):
    """標記通知為已讀"""
    try:
        notification = Notification.query.filter_by(
            id=notif_id,
            user_id=current_user.id
        ).first()

        if not notification:
            return jsonify({'message': 'Notification not found'}), 404

        notification.mark_as_read()

        return jsonify({
            'message': 'Notification marked as read',
            'notification': notification.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to mark notification as read: {str(e)}'}), 500


@notifications_bp.route('/api/notifications/mark-all-read', methods=['POST'])
@token_required
def mark_all_as_read(current_user):
    """標記所有通知為已讀"""
    try:
        Notification.query.filter_by(
            user_id=current_user.id,
            status='unread'
        ).update({
            'status': 'read',
            'read_at': datetime.utcnow()
        })

        db.session.commit()

        return jsonify({'message': 'All notifications marked as read'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to mark all as read: {str(e)}'}), 500


@notifications_bp.route('/api/notifications/<int:notif_id>/archive', methods=['POST'])
@token_required
def archive_notification(current_user, notif_id):
    """封存通知"""
    try:
        notification = Notification.query.filter_by(
            id=notif_id,
            user_id=current_user.id
        ).first()

        if not notification:
            return jsonify({'message': 'Notification not found'}), 404

        notification.archive()

        return jsonify({'message': 'Notification archived'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to archive notification: {str(e)}'}), 500


@notifications_bp.route('/api/notifications/<int:notif_id>', methods=['DELETE'])
@token_required
def delete_notification(current_user, notif_id):
    """刪除通知"""
    try:
        notification = Notification.query.filter_by(
            id=notif_id,
            user_id=current_user.id
        ).first()

        if not notification:
            return jsonify({'message': 'Notification not found'}), 404

        db.session.delete(notification)
        db.session.commit()

        return jsonify({'message': 'Notification deleted'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete notification: {str(e)}'}), 500


# ========================================
# 系統設定 (管理員)
# ========================================
@notifications_bp.route('/api/system/settings', methods=['GET'])
def get_system_settings():
    """取得系統設定(公開)"""
    settings = SystemSetting.query.filter_by(is_public=True).all()

    return jsonify({
        'settings': {setting.setting_key: setting.get_value() for setting in settings}
    }), 200


@notifications_bp.route('/api/system/settings/all', methods=['GET'])
@token_required
@admin_required
def get_all_system_settings(current_user):
    """取得所有系統設定(管理員)"""
    category = request.args.get('category')

    query = SystemSetting.query
    if category:
        query = query.filter_by(category=category)

    settings = query.order_by(SystemSetting.category, SystemSetting.setting_key).all()

    return jsonify({
        'settings': [setting.to_dict() for setting in settings]
    }), 200


@notifications_bp.route('/api/system/settings/<setting_key>', methods=['GET'])
@token_required
@admin_required
def get_system_setting(current_user, setting_key):
    """取得特定系統設定"""
    setting = SystemSetting.query.filter_by(setting_key=setting_key).first()

    if not setting:
        return jsonify({'message': 'Setting not found'}), 404

    return jsonify(setting.to_dict()), 200


@notifications_bp.route('/api/system/settings/<setting_key>', methods=['PUT'])
@token_required
@admin_required
def update_system_setting(current_user, setting_key):
    """更新系統設定"""
    try:
        setting = SystemSetting.query.filter_by(setting_key=setting_key).first()

        if not setting:
            return jsonify({'message': 'Setting not found'}), 404

        if not setting.is_editable:
            return jsonify({'message': 'This setting is not editable'}), 403

        data = request.get_json()

        if 'value' in data:
            setting.set_value(data['value'])

        if 'name' in data:
            setting.name = data['name']
        if 'description' in data:
            setting.description = data['description']
        if 'is_public' in data:
            setting.is_public = data['is_public']

        db.session.commit()

        return jsonify({
            'message': 'Setting updated successfully',
            'setting': setting.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update setting: {str(e)}'}), 500


@notifications_bp.route('/api/system/settings', methods=['POST'])
@token_required
@admin_required
def create_system_setting(current_user):
    """建立新的系統設定"""
    try:
        data = request.get_json()

        if not data.get('setting_key'):
            return jsonify({'message': 'Setting key is required'}), 400

        # 檢查是否已存在
        if SystemSetting.query.filter_by(setting_key=data['setting_key']).first():
            return jsonify({'message': 'Setting key already exists'}), 400

        setting = SystemSetting(
            setting_key=data['setting_key'],
            setting_type=data.get('setting_type', 'string'),
            category=data.get('category'),
            name=data.get('name'),
            description=data.get('description'),
            is_public=data.get('is_public', False),
            is_editable=data.get('is_editable', True)
        )

        if 'value' in data:
            setting.set_value(data['value'])

        db.session.add(setting)
        db.session.commit()

        return jsonify({
            'message': 'Setting created successfully',
            'setting': setting.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create setting: {str(e)}'}), 500


# ========================================
# 使用者活動記錄
# ========================================
@notifications_bp.route('/api/activities', methods=['GET'])
@token_required
def get_user_activities(current_user):
    """取得使用者活動記錄"""
    user_id = request.args.get('user_id', current_user.id, type=int)
    activity_type = request.args.get('type')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    # 只有自己或管理員可以查看
    if user_id != current_user.id and current_user.role != 'admin':
        return jsonify({'message': 'Permission denied'}), 403

    query = UserActivity.query.filter_by(user_id=user_id)

    if activity_type:
        query = query.filter_by(activity_type=activity_type)

    pagination = query.order_by(UserActivity.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'activities': [activity.to_dict() for activity in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@notifications_bp.route('/api/activities', methods=['POST'])
@token_required
def create_user_activity(current_user):
    """記錄使用者活動"""
    try:
        data = request.get_json()

        if not data.get('activity_type'):
            return jsonify({'message': 'Activity type is required'}), 400

        activity = UserActivity(
            user_id=current_user.id,
            activity_type=data['activity_type'],
            activity_name=data.get('activity_name'),
            description=data.get('description'),
            related_type=data.get('related_type'),
            related_id=data.get('related_id'),
            extra_data=data.get('extra_data')
        )

        db.session.add(activity)
        db.session.commit()

        return jsonify({
            'message': 'Activity recorded successfully',
            'activity': activity.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to record activity: {str(e)}'}), 500


# ========================================
# 檔案上傳記錄
# ========================================
@notifications_bp.route('/api/files', methods=['GET'])
@token_required
def get_file_uploads(current_user):
    """取得檔案上傳記錄"""
    user_id = request.args.get('user_id', current_user.id, type=int)
    related_type = request.args.get('related_type')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    # 只有自己或管理員可以查看
    if user_id != current_user.id and current_user.role != 'admin':
        return jsonify({'message': 'Permission denied'}), 403

    query = FileUpload.query.filter_by(user_id=user_id, is_deleted=False)

    if related_type:
        query = query.filter_by(related_type=related_type)

    pagination = query.order_by(FileUpload.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'files': [file.to_dict() for file in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@notifications_bp.route('/api/files/<int:file_id>', methods=['DELETE'])
@token_required
def delete_file_upload(current_user, file_id):
    """刪除檔案記錄(軟刪除)"""
    try:
        file_upload = FileUpload.query.filter_by(id=file_id).first()

        if not file_upload:
            return jsonify({'message': 'File not found'}), 404

        # 只有上傳者或管理員可以刪除
        if file_upload.user_id != current_user.id and current_user.role != 'admin':
            return jsonify({'message': 'Permission denied'}), 403

        file_upload.delete()

        return jsonify({'message': 'File deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete file: {str(e)}'}), 500


# ========================================
# 用戶通知偏好設定
# ========================================
@notifications_bp.route('/api/user/notification-preferences', methods=['GET'])
@token_required
def get_notification_preferences(current_user):
    """取得用戶通知偏好設定"""
    try:
        profile = current_user.profile
        if not profile:
            # 返回默認設定
            return jsonify({
                'preferences': {
                    'emailNotifications': True,
                    'jobAlerts': True,
                    'eventReminders': True,
                    'messageNotifications': True,
                }
            }), 200
        
        # 解析 JSON 設定
        if profile.notification_preferences:
            try:
                preferences = json.loads(profile.notification_preferences)
            except:
                preferences = {
                    'emailNotifications': True,
                    'jobAlerts': True,
                    'eventReminders': True,
                    'messageNotifications': True,
                }
        else:
            preferences = {
                'emailNotifications': True,
                'jobAlerts': True,
                'eventReminders': True,
                'messageNotifications': True,
            }
        
        return jsonify({'preferences': preferences}), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get preferences: {str(e)}'}), 500


@notifications_bp.route('/api/user/notification-preferences', methods=['PUT'])
@token_required
def update_notification_preferences(current_user):
    """更新用戶通知偏好設定"""
    try:
        data = request.get_json()
        
        if not current_user.profile:
            return jsonify({'message': 'User profile not found'}), 404
        
        # 獲取現有設定
        current_preferences = {}
        if current_user.profile.notification_preferences:
            try:
                current_preferences = json.loads(current_user.profile.notification_preferences)
            except:
                pass
        
        # 更新設定
        updated_preferences = {
            'emailNotifications': data.get('emailNotifications', current_preferences.get('emailNotifications', True)),
            'jobAlerts': data.get('jobAlerts', current_preferences.get('jobAlerts', True)),
            'eventReminders': data.get('eventReminders', current_preferences.get('eventReminders', True)),
            'messageNotifications': data.get('messageNotifications', current_preferences.get('messageNotifications', True)),
        }
        
        # 保存到資料庫
        current_user.profile.notification_preferences = json.dumps(updated_preferences)
        db.session.commit()
        
        return jsonify({
            'message': 'Notification preferences updated successfully',
            'preferences': updated_preferences
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update preferences: {str(e)}'}), 500


# ========================================
# 檔案上傳
# ========================================
@notifications_bp.route('/api/files/upload', methods=['POST'])
@token_required
def upload_file(current_user):
    """上傳檔案"""
    try:
        if 'file' not in request.files:
            return jsonify({'message': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'message': 'No file selected'}), 400
        
        # 檢查檔案類型
        allowed_extensions = {'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'}
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if file_ext not in allowed_extensions:
            return jsonify({'message': f'File type not allowed. Allowed: {", ".join(allowed_extensions)}'}), 400
        
        # 檢查檔案大小 (5MB)
        file.seek(0, 2)  # 移動到檔案結尾
        file_size = file.tell()
        file.seek(0)  # 重置位置
        
        if file_size > 5 * 1024 * 1024:  # 5MB
            return jsonify({'message': 'File size exceeds 5MB limit'}), 400
        
        # 生成唯一檔名
        import os
        import uuid
        from werkzeug.utils import secure_filename
        
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        
        # 建立上傳目錄 - 使用與 Flask app 相同的 static 目錄
        # 計算 static 目錄路徑：從 src/routes/notifications.py 向上三層到 alumni_platform_api，然後進入 src/static
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        static_dir = os.path.join(base_dir, 'src', 'static')
        upload_dir = os.path.join(static_dir, 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        
        # 保存檔案
        file_path = os.path.join(upload_dir, unique_filename)
        file.save(file_path)
        
        # 記錄到資料庫
        file_type_category = 'image' if file_ext in {'jpg', 'jpeg', 'png', 'gif'} else 'document'
        related_type = request.form.get('related_type')
        related_id = request.form.get('related_id', type=int)
        
        file_upload = FileUpload(
            user_id=current_user.id,
            file_name=filename,
            file_path=f'/static/uploads/{unique_filename}',
            file_type=file.content_type or f'application/{file_ext}',  # 使用 MIME type
            file_size=file_size,
            related_type=related_type,
            related_id=related_id
        )
        
        db.session.add(file_upload)
        db.session.commit()
        
        # 構建完整的 URL
        from flask import request as flask_request
        base_url = flask_request.host_url.rstrip('/')
        file_url = f'{base_url}/static/uploads/{unique_filename}'
        
        return jsonify({
            'message': 'File uploaded successfully',
            'file': file_upload.to_dict(),
            'url': file_url
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to upload file: {str(e)}'}), 500


# ========================================
# 輔助函式:建立通知
# ========================================
def create_notification(user_id, notification_type, title, message, related_type=None, related_id=None, action_url=None):
    """建立通知的輔助函式"""
    try:
        notification = Notification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            related_type=related_type,
            related_id=related_id,
            action_url=action_url
        )

        db.session.add(notification)
        db.session.commit()

        return notification

    except Exception as e:
        db.session.rollback()
        print(f"Failed to create notification: {str(e)}")
        return None
