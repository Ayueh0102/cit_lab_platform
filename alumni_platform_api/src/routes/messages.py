from flask import Blueprint, request, jsonify
from src.models.user import db, Conversation, ConversationParticipant, Message, User
from src.routes.auth import token_required
from sqlalchemy import and_, or_

messages_bp = Blueprint('messages', __name__)

@messages_bp.route('/conversations', methods=['GET'])
@token_required
def get_conversations(current_user):
    try:
        # Get conversations where current user is a participant
        conversations = db.session.query(Conversation).join(ConversationParticipant).filter(
            ConversationParticipant.user_id == current_user.id
        ).order_by(Conversation.created_at.desc()).all()
        
        result = []
        for conversation in conversations:
            # Get other participants
            other_participants = db.session.query(User).join(ConversationParticipant).filter(
                and_(
                    ConversationParticipant.conversation_id == conversation.id,
                    ConversationParticipant.user_id != current_user.id
                )
            ).all()
            
            # Get last message
            last_message = Message.query.filter_by(
                conversation_id=conversation.id
            ).order_by(Message.created_at.desc()).first()
            
            result.append({
                'id': conversation.id,
                'participants': [p.to_dict() for p in other_participants],
                'last_message': {
                    'content': last_message.content,
                    'sender_name': last_message.sender.name,
                    'created_at': last_message.created_at.isoformat()
                } if last_message else None,
                'created_at': conversation.created_at.isoformat() if conversation.created_at else None
            })
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'message': f'Failed to fetch conversations: {str(e)}'}), 500

@messages_bp.route('/conversations/<int:conversation_id>', methods=['GET'])
@token_required
def get_conversation_messages(current_user, conversation_id):
    try:
        # Verify user is participant in this conversation
        participant = ConversationParticipant.query.filter_by(
            conversation_id=conversation_id,
            user_id=current_user.id
        ).first()
        
        if not participant:
            return jsonify({'message': 'Unauthorized'}), 403
        
        # Get messages
        messages = Message.query.filter_by(
            conversation_id=conversation_id
        ).order_by(Message.created_at.asc()).all()
        
        return jsonify([message.to_dict() for message in messages]), 200
    except Exception as e:
        return jsonify({'message': f'Failed to fetch messages: {str(e)}'}), 500

@messages_bp.route('/conversations/<int:conversation_id>', methods=['POST'])
@token_required
def send_message(current_user, conversation_id):
    try:
        # Verify user is participant in this conversation
        participant = ConversationParticipant.query.filter_by(
            conversation_id=conversation_id,
            user_id=current_user.id
        ).first()
        
        if not participant:
            return jsonify({'message': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        if not data.get('content'):
            return jsonify({'message': 'Content is required'}), 400
        
        message = Message(
            conversation_id=conversation_id,
            sender_id=current_user.id,
            content=data['content']
        )
        
        db.session.add(message)
        db.session.commit()
        
        return jsonify({
            'id': message.id,
            'message': 'Message sent successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to send message: {str(e)}'}), 500

@messages_bp.route('/conversations', methods=['POST'])
@token_required
def create_conversation(current_user):
    try:
        data = request.get_json()
        
        participant_ids = data.get('participant_ids', [])
        if not participant_ids:
            return jsonify({'message': 'At least one participant is required'}), 400
        
        # Add current user to participants
        if current_user.id not in participant_ids:
            participant_ids.append(current_user.id)
        
        # Check if conversation already exists between these users
        if len(participant_ids) == 2:
            existing_conversation = db.session.query(Conversation).join(ConversationParticipant).filter(
                ConversationParticipant.user_id.in_(participant_ids)
            ).group_by(Conversation.id).having(
                db.func.count(ConversationParticipant.user_id) == len(participant_ids)
            ).first()
            
            if existing_conversation:
                return jsonify({
                    'conversation_id': existing_conversation.id,
                    'message': 'Conversation already exists'
                }), 200
        
        # Create new conversation
        conversation = Conversation()
        db.session.add(conversation)
        db.session.flush()  # Get the ID
        
        # Add participants
        for user_id in participant_ids:
            participant = ConversationParticipant(
                conversation_id=conversation.id,
                user_id=user_id
            )
            db.session.add(participant)
        
        db.session.commit()
        
        return jsonify({
            'conversation_id': conversation.id,
            'message': 'Conversation created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create conversation: {str(e)}'}), 500
