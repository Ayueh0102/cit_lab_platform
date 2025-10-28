"""
活動系統 API v2
包含活動分類、活動管理、活動報名
"""

from flask import Blueprint, request, jsonify
from src.models_v2 import db, Event, EventCategory, EventRegistration, User
from src.routes.auth_v2 import token_required, admin_required
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
        query = query.filter_by(status=status)
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

    return jsonify(event.to_dict(include_organizer=True)), 200


@events_v2_bp.route('/api/v2/events', methods=['POST'])
@token_required
def create_event(current_user):
    """建立新活動"""
    try:
        data = request.get_json()

        required_fields = ['title', 'category_id', 'start_time', 'end_time']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400

        event = Event(
            organizer_id=current_user.id,
            category_id=data['category_id'],
            title=data['title'],
            description=data.get('description'),
            start_time=datetime.strptime(data['start_time'], '%Y-%m-%d %H:%M'),
            end_time=datetime.strptime(data['end_time'], '%Y-%m-%d %H:%M'),
            location=data.get('location'),
            location_url=data.get('location_url'),
            cover_image_url=data.get('cover_image_url'),
            max_participants=data.get('max_participants'),
            is_free=data.get('is_free', True),
            price=data.get('price'),
            registration_deadline=datetime.strptime(data['registration_deadline'], '%Y-%m-%d') if data.get('registration_deadline') else None,
            allow_waitlist=data.get('allow_waitlist', True),
            contact_email=data.get('contact_email'),
            contact_phone=data.get('contact_phone'),
            status='published',
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

        # TODO: 通知所有報名者

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
            status='confirmed' if not is_waitlist else 'waitlisted'
        )

        db.session.add(registration)

        # 更新活動參加人數
        if is_waitlist:
            event.waitlist_count += 1
        else:
            event.current_participants += registration.participants_count

        db.session.commit()

        # TODO: 建立通知給主辦者

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
