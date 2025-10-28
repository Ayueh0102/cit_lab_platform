"""
訊息系統 API v2
包含對話管理、訊息發送、已讀狀態
"""

from flask import Blueprint, request, jsonify
from src.models_v2 import db, Conversation, Message, User
from src.routes.auth_v2 import token_required
from datetime import datetime
from sqlalchemy import or_, and_

messages_v2_bp = Blueprint('messages_v2', __name__)


# ========================================
# 對話管理
# ========================================
@messages_v2_bp.route('/api/v2/conversations', methods=['GET'])
@token_required
def get_conversations(current_user):
    """取得對話列表"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Conversation.query.filter(
        or_(
            Conversation.user1_id == current_user.id,
            Conversation.user2_id == current_user.id
        )
    )

    pagination = query.order_by(Conversation.last_message_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'conversations': [conv.to_dict(current_user_id=current_user.id) for conv in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@messages_v2_bp.route('/api/v2/conversations/<int:conversation_id>', methods=['GET'])
@token_required
def get_conversation(current_user, conversation_id):
    """取得單一對話"""
    conversation = Conversation.query.get(conversation_id)

    if not conversation:
        return jsonify({'message': 'Conversation not found'}), 404

    # 檢查權限
    if conversation.user1_id != current_user.id and conversation.user2_id != current_user.id:
        return jsonify({'message': 'Permission denied'}), 403

    return jsonify(conversation.to_dict(current_user_id=current_user.id)), 200


@messages_v2_bp.route('/api/v2/conversations/with/<int:user_id>', methods=['POST'])
@token_required
def create_or_get_conversation(current_user, user_id):
    """建立或取得與特定使用者的對話"""
    try:
        if user_id == current_user.id:
            return jsonify({'message': 'Cannot create conversation with yourself'}), 400

        # 檢查對方是否存在
        other_user = User.query.get(user_id)
        if not other_user:
            return jsonify({'message': 'User not found'}), 404

        # 檢查是否已存在對話
        conversation = Conversation.query.filter(
            or_(
                and_(Conversation.user1_id == current_user.id, Conversation.user2_id == user_id),
                and_(Conversation.user1_id == user_id, Conversation.user2_id == current_user.id)
            )
        ).first()

        if conversation:
            return jsonify({
                'message': 'Conversation already exists',
                'conversation': conversation.to_dict(current_user_id=current_user.id)
            }), 200

        # 建立新對話
        conversation = Conversation(
            user1_id=current_user.id,
            user2_id=user_id
        )
        db.session.add(conversation)
        db.session.commit()

        return jsonify({
            'message': 'Conversation created',
            'conversation': conversation.to_dict(current_user_id=current_user.id)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create conversation: {str(e)}'}), 500


# ========================================
# 訊息管理
# ========================================
@messages_v2_bp.route('/api/v2/conversations/<int:conversation_id>/messages', methods=['GET'])
@token_required
def get_messages(current_user, conversation_id):
    """取得對話的訊息列表"""
    conversation = Conversation.query.get(conversation_id)

    if not conversation:
        return jsonify({'message': 'Conversation not found'}), 404

    # 檢查權限
    if conversation.user1_id != current_user.id and conversation.user2_id != current_user.id:
        return jsonify({'message': 'Permission denied'}), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    query = Message.query.filter_by(conversation_id=conversation_id)

    pagination = query.order_by(Message.created_at.asc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'messages': [msg.to_dict() for msg in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@messages_v2_bp.route('/api/v2/conversations/<int:conversation_id>/messages', methods=['POST'])
@token_required
def send_message(current_user, conversation_id):
    """發送訊息"""
    try:
        conversation = Conversation.query.get(conversation_id)

        if not conversation:
            return jsonify({'message': 'Conversation not found'}), 404

        # 檢查權限
        if conversation.user1_id != current_user.id and conversation.user2_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403

        data = request.get_json()

        if not data.get('content'):
            return jsonify({'message': 'Message content is required'}), 400

        # 建立訊息
        message = Message(
            conversation_id=conversation_id,
            sender_id=current_user.id,
            content=data['content'],
            message_type=data.get('message_type', 'text'),
            attachment_url=data.get('attachment_url'),
            attachment_name=data.get('attachment_name')
        )

        db.session.add(message)

        # 更新對話狀態
        conversation.last_message_at = datetime.utcnow()
        conversation.last_message_content = data['content']

        # 增加未讀計數
        if current_user.id == conversation.user1_id:
            conversation.unread_count_user2 += 1
        else:
            conversation.unread_count_user1 += 1

        db.session.commit()

        # TODO: 建立通知給接收者

        return jsonify({
            'message': 'Message sent successfully',
            'message_data': message.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to send message: {str(e)}'}), 500


@messages_v2_bp.route('/api/v2/messages/<int:message_id>', methods=['DELETE'])
@token_required
def delete_message(current_user, message_id):
    """刪除訊息"""
    try:
        message = Message.query.get(message_id)

        if not message:
            return jsonify({'message': 'Message not found'}), 404

        # 只有發送者可以刪除
        if message.sender_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403

        db.session.delete(message)
        db.session.commit()

        return jsonify({'message': 'Message deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete message: {str(e)}'}), 500


@messages_v2_bp.route('/api/v2/conversations/<int:conversation_id>/mark-read', methods=['POST'])
@token_required
def mark_conversation_as_read(current_user, conversation_id):
    """標記對話為已讀"""
    try:
        conversation = Conversation.query.get(conversation_id)

        if not conversation:
            return jsonify({'message': 'Conversation not found'}), 404

        # 檢查權限
        if conversation.user1_id != current_user.id and conversation.user2_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403

        # 標記為已讀
        conversation.mark_as_read(current_user.id)

        # 更新訊息的已讀狀態
        Message.query.filter(
            Message.conversation_id == conversation_id,
            Message.sender_id != current_user.id,
            Message.is_read == False
        ).update({
            'is_read': True,
            'read_at': datetime.utcnow()
        })

        db.session.commit()

        return jsonify({'message': 'Conversation marked as read'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to mark as read: {str(e)}'}), 500


@messages_v2_bp.route('/api/v2/messages/unread-count', methods=['GET'])
@token_required
def get_unread_count(current_user):
    """取得未讀訊息總數"""
    conversations = Conversation.query.filter(
        or_(
            Conversation.user1_id == current_user.id,
            Conversation.user2_id == current_user.id
        )
    ).all()

    total_unread = 0
    for conv in conversations:
        if conv.user1_id == current_user.id:
            total_unread += conv.unread_count_user1
        else:
            total_unread += conv.unread_count_user2

    return jsonify({'unread_count': total_unread}), 200
