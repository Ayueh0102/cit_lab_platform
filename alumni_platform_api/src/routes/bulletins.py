from flask import Blueprint, request, jsonify
from src.models.user import db, Bulletin, User
from src.routes.auth import token_required

bulletins_bp = Blueprint('bulletins', __name__)

@bulletins_bp.route('/bulletins', methods=['GET'])
@token_required
def get_bulletins(current_user):
    try:
        # Get bulletins ordered by pinned status and creation date
        bulletins = Bulletin.query.order_by(
            Bulletin.is_pinned.desc(),
            Bulletin.created_at.desc()
        ).all()
        
        return jsonify([bulletin.to_dict() for bulletin in bulletins]), 200
    except Exception as e:
        return jsonify({'message': f'Failed to fetch bulletins: {str(e)}'}), 500

@bulletins_bp.route('/bulletins', methods=['POST'])
@token_required
def create_bulletin(current_user):
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'content']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'message': f'{field} is required'}), 400
        
        # For demo purposes, allow any user to create bulletins
        # In a real application, you might want to restrict this to admins
        bulletin = Bulletin(
            title=data['title'],
            content=data['content'],
            category=data.get('category', '系友會公告'),
            author_id=current_user.id,
            is_pinned=data.get('is_pinned', False)
        )
        
        db.session.add(bulletin)
        db.session.commit()
        
        return jsonify({
            'id': bulletin.id,
            'message': 'Bulletin created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create bulletin: {str(e)}'}), 500

@bulletins_bp.route('/bulletins/<int:bulletin_id>', methods=['GET'])
@token_required
def get_bulletin(current_user, bulletin_id):
    try:
        bulletin = Bulletin.query.get_or_404(bulletin_id)
        return jsonify(bulletin.to_dict()), 200
    except Exception as e:
        return jsonify({'message': f'Failed to fetch bulletin: {str(e)}'}), 500

@bulletins_bp.route('/bulletins/<int:bulletin_id>', methods=['PUT'])
@token_required
def update_bulletin(current_user, bulletin_id):
    try:
        bulletin = Bulletin.query.get_or_404(bulletin_id)
        
        # Only author can update bulletin
        if bulletin.author_id != current_user.id:
            return jsonify({'message': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Update fields if provided
        if 'title' in data:
            bulletin.title = data['title']
        if 'content' in data:
            bulletin.content = data['content']
        if 'category' in data:
            bulletin.category = data['category']
        if 'is_pinned' in data:
            bulletin.is_pinned = data['is_pinned']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Bulletin updated successfully',
            'bulletin': bulletin.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update bulletin: {str(e)}'}), 500

@bulletins_bp.route('/bulletins/<int:bulletin_id>', methods=['DELETE'])
@token_required
def delete_bulletin(current_user, bulletin_id):
    try:
        bulletin = Bulletin.query.get_or_404(bulletin_id)
        
        # Only author can delete bulletin
        if bulletin.author_id != current_user.id:
            return jsonify({'message': 'Unauthorized'}), 403
        
        db.session.delete(bulletin)
        db.session.commit()
        
        return jsonify({'message': 'Bulletin deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete bulletin: {str(e)}'}), 500
