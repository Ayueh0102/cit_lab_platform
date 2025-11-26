"""
WebSocket 事件處理
處理即時通訊、通知更新等 WebSocket 事件
"""
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import current_app
from src.models_v2 import db, Notification, Message, Conversation
from functools import wraps
import jwt

socketio = SocketIO(async_mode='threading')


def _get_jwt_secret():
    """取得 JWT 秘鑰"""
    secret = current_app.config.get('JWT_SECRET_KEY') or current_app.config.get('SECRET_KEY')
    if not secret:
        raise RuntimeError('JWT secret not configured')
    return secret


def socketio_token_required(f):
    """WebSocket 認證裝飾器"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = kwargs.get('token') or (args[0] if args else {}).get('token')
        if not token:
            emit('error', {'message': 'Token is required'})
            return False
        
        try:
            payload = jwt.decode(token, _get_jwt_secret(), algorithms=['HS256'])
            kwargs['user_id'] = payload['user_id']
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            emit('error', {'message': 'Token has expired'})
            return False
        except jwt.InvalidTokenError:
            emit('error', {'message': 'Invalid token'})
            return False
    return wrapper


@socketio.on('connect')
def handle_connect(auth):
    """處理客戶端連接"""
    token = auth.get('token') if auth else None
    if not token:
        return False
    
    try:
        from flask import current_app
        with current_app.app_context():
            payload = jwt.decode(token, _get_jwt_secret(), algorithms=['HS256'])
            user_id = payload['user_id']
            
            # 加入用戶專屬房間
            join_room(f'user_{user_id}')
            emit('connected', {'message': 'Connected successfully', 'user_id': user_id})
            return True
    except Exception as e:
        print(f"WebSocket connection error: {e}")
        return False


@socketio.on('subscribe_notifications')
def handle_subscribe_notifications(auth):
    """訂閱通知更新"""
    token = auth.get('token') if auth else None
    if not token:
        emit('error', {'message': 'Token is required'})
        return False
    
    try:
        from flask import current_app
        with current_app.app_context():
            payload = jwt.decode(token, _get_jwt_secret(), algorithms=['HS256'])
            user_id = payload['user_id']
            
            join_room(f'user_{user_id}_notifications')
            emit('subscribed', {'room': f'user_{user_id}_notifications'})
            return True
    except Exception as e:
        emit('error', {'message': f'Failed to subscribe: {str(e)}'})
        return False


@socketio.on('subscribe_messages')
def handle_subscribe_messages(auth, data):
    """訂閱訊息更新"""
    token = auth.get('token') if auth else None
    if not token:
        emit('error', {'message': 'Token is required'})
        return False
    
    try:
        from flask import current_app
        with current_app.app_context():
            payload = jwt.decode(token, _get_jwt_secret(), algorithms=['HS256'])
            user_id = payload['user_id']
            
            conversation_id = data.get('conversation_id')
            if conversation_id:
                room = f'conversation_{conversation_id}'
                join_room(room)
                emit('subscribed', {'room': room})
            return True
    except Exception as e:
        emit('error', {'message': f'Failed to subscribe: {str(e)}'})
        return False


def emit_notification(user_id, notification_data):
    """發送通知給指定用戶"""
    socketio.emit('new_notification', notification_data, room=f'user_{user_id}_notifications')
    socketio.emit('notification_count_update', {
        'unread_count': notification_data.get('unread_count', 0)
    }, room=f'user_{user_id}')


def emit_message(conversation_id, message_data):
    """發送訊息給對話中的所有用戶"""
    socketio.emit('new_message', message_data, room=f'conversation_{conversation_id}')


def emit_conversation_update(user_id, conversation_data):
    """更新對話列表"""
    socketio.emit('conversation_update', conversation_data, room=f'user_{user_id}')

