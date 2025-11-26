"""
活動系統 API v2
包含活動分類、活動管理、活動報名
"""

from flask import Blueprint, request, jsonify
from src.models_v2 import db, Event, EventCategory, EventRegistration, User, UserProfile
from src.models_v2.events import EventStatus, EventType, RegistrationStatus
from src.routes.auth_v2 import token_required, admin_required
from src.routes.notification_helper import (
    create_event_registration_notification,
    create_event_cancelled_notification,
    notify_all_event_participants,
    NotificationType
)
from datetime import datetime
from sqlalchemy import or_

events_v2_bp = Blueprint('events_v2', __name__)


# ========================================
# 活動分類管理
# ========================================
@events_v2_bp.route('/api/v2/event-categories', methods=['GET'])
def get_event_categories():
    """取得所有活動分類"""
    categories = EventCategory.query.filter_by(is_active=True).all()

    return jsonify({
        'categories': [cat.to_dict() for cat in categories]
    }), 200


@events_v2_bp.route('/api/v2/event-categories', methods=['POST'])
@token_required
@admin_required
def create_event_category(current_user):
    """建立活動分類(管理員)"""
    try:
        data = request.get_json()

        if not data.get('name'):
            return jsonify({'message': 'Category name is required'}), 400

        category = EventCategory(
            name=data['name'],
            icon=data.get('icon'),
            color=data.get('color'),
            description=data.get('description')
        )

        db.session.add(category)
        db.session.commit()

        return jsonify({
            'message': 'Event category created successfully',
            'category': category.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create category: {str(e)}'}), 500


# ========================================
# 活動管理
# ========================================
@events_v2_bp.route('/api/v2/events', methods=['GET'])
def get_events():
    """取得活動列表"""
    category_id = request.args.get('category_id', type=int)
    status = request.args.get('status')
    time_filter = request.args.get('time_filter')  # upcoming, ongoing, past
    search = request.args.get('search')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Event.query

    # 篩選條件
    if category_id:
        query = query.filter_by(category_id=category_id)
    if status:
        # 如果指定了狀態，則使用指定的狀態過濾
        try:
            status_enum = EventStatus[status.upper()]
            query = query.filter_by(status=status_enum)
        except (KeyError, AttributeError):
            pass
    else:
        # 如果沒有指定狀態，只顯示已發布的活動（排除草稿和已取消）
        query = query.filter(Event.status != EventStatus.DRAFT, Event.status != EventStatus.CANCELLED)
    if search:
        query = query.filter(
            or_(
                Event.title.like(f'%{search}%'),
                Event.description.like(f'%{search}%'),
                Event.location.like(f'%{search}%')
            )
        )

    # 時間篩選
    now = datetime.utcnow()
    if time_filter == 'upcoming':
        query = query.filter(Event.start_time > now)
    elif time_filter == 'ongoing':
        query = query.filter(Event.start_time <= now, Event.end_time >= now)
    elif time_filter == 'past':
        query = query.filter(Event.end_time < now)

    # 分頁
    pagination = query.order_by(Event.start_time.asc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'events': [event.to_dict() for event in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@events_v2_bp.route('/api/v2/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    """取得單一活動詳情"""
    event = Event.query.get(event_id)

    if not event:
        return jsonify({'message': 'Event not found'}), 404

    # 增加瀏覽次數
    event.increment_views()

    # 獲取活動詳情，to_dict 方法已經包含主辦者資訊
    event_dict = event.to_dict()
    
    return jsonify(event_dict), 200


@events_v2_bp.route('/api/v2/events', methods=['POST'])
@token_required
def create_event(current_user):
    """建立新活動"""
    try:
        data = request.get_json()

        # 驗證必填欄位
        if not data.get('title'):
            return jsonify({'message': 'title is required'}), 400
        if not data.get('start_time'):
            return jsonify({'message': 'start_time is required'}), 400
        if not data.get('end_time'):
            return jsonify({'message': 'end_time is required'}), 400

        # 解析時間格式（支援 ISO 格式和自定義格式）
        def parse_datetime(time_str):
            if not time_str:
                return None
            try:
                # 嘗試 ISO 格式
                return datetime.fromisoformat(time_str.replace('Z', '+00:00'))
            except ValueError:
                try:
                    # 嘗試自定義格式
                    return datetime.strptime(time_str, '%Y-%m-%d %H:%M')
                except ValueError:
                    # 嘗試其他常見格式
                    return datetime.strptime(time_str, '%Y-%m-%dT%H:%M:%S')

        # 處理 event_type 字符串轉換為枚舉
        event_type_value = data.get('event_type', 'other')
        try:
            if isinstance(event_type_value, str):
                event_type_enum = EventType[event_type_value.upper()]
            else:
                event_type_enum = event_type_value
        except (KeyError, AttributeError):
            event_type_enum = EventType.OTHER

        event = Event(
            organizer_id=current_user.id,
            category_id=data.get('category_id') if data.get('category_id') else None,
            title=data['title'],
            description=data.get('description'),
            start_time=parse_datetime(data['start_time']),
            end_time=parse_datetime(data['end_time']),
            location=data.get('location'),
            location_detail=data.get('location_detail'),
            online_url=data.get('online_url'),
            is_online=data.get('is_online', False),
            cover_image_url=data.get('cover_image_url'),
            max_participants=data.get('max_participants'),
            is_free=data.get('is_free', True),
            fee=data.get('fee') or data.get('price', 0),
            fee_currency=data.get('fee_currency', 'TWD'),
            event_type=event_type_enum,
            registration_start=parse_datetime(data.get('registration_start')),
            registration_end=parse_datetime(data.get('registration_end')) or parse_datetime(data.get('registration_deadline')),
            allow_waitlist=data.get('allow_waitlist', True),
            require_approval=data.get('require_approval', False),
            status=EventStatus.UPCOMING,
            published_at=datetime.utcnow()
        )

        db.session.add(event)
        db.session.commit()

        return jsonify({
            'message': 'Event created successfully',
            'event': event.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create event: {str(e)}'}), 500


@events_v2_bp.route('/api/v2/events/<int:event_id>', methods=['PUT'])
@token_required
def update_event(current_user, event_id):
    """更新活動"""
    try:
        event = Event.query.get(event_id)

        if not event:
            return jsonify({'message': 'Event not found'}), 404

        # 只有主辦者或管理員可以更新
        if event.organizer_id != current_user.id and current_user.role != 'admin':
            return jsonify({'message': 'Permission denied'}), 403

        data = request.get_json()

        # 更新欄位
        updatable_fields = [
            'category_id', 'title', 'description', 'location', 'location_url',
            'cover_image_url', 'max_participants', 'is_free', 'price',
            'allow_waitlist', 'contact_email', 'contact_phone', 'status'
        ]

        for field in updatable_fields:
            if field in data:
                setattr(event, field, data[field])

        if 'start_time' in data:
            event.start_time = datetime.strptime(data['start_time'], '%Y-%m-%d %H:%M')
        if 'end_time' in data:
            event.end_time = datetime.strptime(data['end_time'], '%Y-%m-%d %H:%M')
        if 'registration_deadline' in data and data['registration_deadline']:
            event.registration_deadline = datetime.strptime(data['registration_deadline'], '%Y-%m-%d')

        db.session.commit()

        return jsonify({
            'message': 'Event updated successfully',
            'event': event.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update event: {str(e)}'}), 500


@events_v2_bp.route('/api/v2/events/<int:event_id>', methods=['DELETE'])
@token_required
def delete_event(current_user, event_id):
    """刪除活動"""
    try:
        event = Event.query.get(event_id)

        if not event:
            return jsonify({'message': 'Event not found'}), 404

        # 只有主辦者或管理員可以刪除
        if event.organizer_id != current_user.id and current_user.role != 'admin':
            return jsonify({'message': 'Permission denied'}), 403

        db.session.delete(event)
        db.session.commit()

        return jsonify({'message': 'Event deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete event: {str(e)}'}), 500


@events_v2_bp.route('/api/v2/events/<int:event_id>/cancel', methods=['POST'])
@token_required
def cancel_event(current_user, event_id):
    """取消活動"""
    try:
        event = Event.query.get(event_id)

        if not event:
            return jsonify({'message': 'Event not found'}), 404

        if event.organizer_id != current_user.id and current_user.role != 'admin':
            return jsonify({'message': 'Permission denied'}), 403

        data = request.get_json()
        event.cancel(cancellation_reason=data.get('reason'))

        # 通知所有報名者
        notify_all_event_participants(
            event_id=event_id,
            notification_type=NotificationType.EVENT_CANCELLED,
            title="活動已取消",
            message=f"活動「{event.title}」已被取消" + (f"，原因：{data.get('reason')}" if data.get('reason') else "")
        )

        return jsonify({
            'message': 'Event cancelled successfully',
            'event': event.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to cancel event: {str(e)}'}), 500


@events_v2_bp.route('/api/v2/my-events', methods=['GET'])
@token_required
def get_my_events(current_user):
    """取得我主辦的活動"""
    status = request.args.get('status')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Event.query.filter_by(organizer_id=current_user.id)

    if status:
        query = query.filter_by(status=status)

    pagination = query.order_by(Event.start_time.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'events': [event.to_dict() for event in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


# ========================================
# 活動報名
# ========================================
@events_v2_bp.route('/api/v2/events/<int:event_id>/register', methods=['POST'])
@token_required
def register_event(current_user, event_id):
    """報名活動"""
    try:
        event = Event.query.get(event_id)

        if not event:
            return jsonify({'message': 'Event not found'}), 404

        # 檢查是否已報名
        existing_registration = EventRegistration.query.filter_by(
            event_id=event_id,
            user_id=current_user.id
        ).first()

        if existing_registration:
            return jsonify({'message': 'You have already registered for this event'}), 400

        # 檢查是否已滿額
        is_waitlist = False
        if event.is_full:
            if not event.allow_waitlist:
                return jsonify({'message': 'Event is full and waitlist is not allowed'}), 400
            is_waitlist = True

        data = request.get_json()

        registration = EventRegistration(
            event_id=event_id,
            user_id=current_user.id,
            is_waitlist=is_waitlist,
            participants_count=data.get('participants_count', 1),
            contact_name=data.get('contact_name'),
            contact_phone=data.get('contact_phone'),
            contact_email=data.get('contact_email'),
            notes=data.get('notes'),
            status=RegistrationStatus.REGISTERED if not is_waitlist else RegistrationStatus.WAITLIST
        )

        db.session.add(registration)

        # 更新活動參加人數
        if is_waitlist:
            event.waitlist_count += 1
        else:
            event.current_participants += registration.participants_count

        db.session.commit()

        # 建立通知給活動主辦者
        participant_profile = UserProfile.query.filter_by(user_id=current_user.id).first()
        participant_name = participant_profile.full_name if participant_profile else current_user.email
        
        create_event_registration_notification(
            organizer_id=event.organizer_id,
            participant_name=participant_name,
            event_title=event.title,
            event_id=event_id
        )

        return jsonify({
            'message': 'Registration successful' if not is_waitlist else 'Added to waitlist',
            'registration': registration.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to register: {str(e)}'}), 500


@events_v2_bp.route('/api/v2/events/<int:event_id>/unregister', methods=['POST'])
@token_required
def unregister_event(current_user, event_id):
    """取消報名"""
    try:
        registration = EventRegistration.query.filter_by(
            event_id=event_id,
            user_id=current_user.id
        ).first()

        if not registration:
            return jsonify({'message': 'Registration not found'}), 404

        registration.cancel()

        # 更新活動參加人數
        event = Event.query.get(event_id)
        if registration.is_waitlist:
            event.waitlist_count = max(0, event.waitlist_count - 1)
        else:
            event.current_participants = max(0, event.current_participants - registration.participants_count)

        db.session.commit()

        return jsonify({'message': 'Registration cancelled successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to cancel registration: {str(e)}'}), 500


@events_v2_bp.route('/api/v2/my-registrations', methods=['GET'])
@token_required
def get_my_registrations(current_user):
    """取得我的報名記錄"""
    status = request.args.get('status')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = EventRegistration.query.filter_by(user_id=current_user.id)

    if status:
        query = query.filter_by(status=status)

    pagination = query.order_by(EventRegistration.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'registrations': [reg.to_dict(include_event=True) for reg in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@events_v2_bp.route('/api/v2/events/<int:event_id>/registrations', methods=['GET'])
@token_required
def get_event_registrations(current_user, event_id):
    """取得活動的報名列表(主辦者)"""
    event = Event.query.get(event_id)

    if not event:
        return jsonify({'message': 'Event not found'}), 404

    # 只有主辦者或管理員可以查看
    if event.organizer_id != current_user.id and current_user.role != 'admin':
        return jsonify({'message': 'Permission denied'}), 403

    status = request.args.get('status')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    query = EventRegistration.query.filter_by(event_id=event_id)

    if status:
        query = query.filter_by(status=status)

    pagination = query.order_by(EventRegistration.created_at.asc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'registrations': [reg.to_dict(include_user=True) for reg in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@events_v2_bp.route('/api/v2/event-registrations/<int:registration_id>/check-in', methods=['POST'])
@token_required
def check_in_registration(current_user, registration_id):
    """簽到(主辦者)"""
    try:
        registration = EventRegistration.query.get(registration_id)

        if not registration:
            return jsonify({'message': 'Registration not found'}), 404

        event = Event.query.get(registration.event_id)
        if event.organizer_id != current_user.id and current_user.role != 'admin':
            return jsonify({'message': 'Permission denied'}), 403

        registration.check_in()

        return jsonify({
            'message': 'Check-in successful',
            'registration': registration.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to check in: {str(e)}'}), 500
