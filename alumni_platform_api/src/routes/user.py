from flask import Blueprint, request, jsonify
from src.models.user import db, User, Profile
from src.routes.auth import token_required

user_bp = Blueprint('user', __name__)

@user_bp.route('/users', methods=['GET'])
@token_required
def get_users(current_user):
    try:
        # Get all users for alumni directory
        users = User.query.order_by(User.graduation_year.desc(), User.name.asc()).all()
        return jsonify([user.to_dict() for user in users]), 200
    except Exception as e:
        return jsonify({'message': f'Failed to fetch users: {str(e)}'}), 500

@user_bp.route('/users/<int:user_id>', methods=['GET'])
@token_required
def get_user(current_user, user_id):
    try:
        user = User.query.get_or_404(user_id)
        
        # Return public profile or private profile if it's the current user
        include_private = (user_id == current_user.id)
        return jsonify(user.to_dict(include_private=include_private)), 200
    except Exception as e:
        return jsonify({'message': f'Failed to fetch user: {str(e)}'}), 500

@user_bp.route('/users/me', methods=['GET'])
@token_required
def get_current_user_profile(current_user):
    try:
        return jsonify(current_user.to_dict(include_private=True)), 200
    except Exception as e:
        return jsonify({'message': f'Failed to fetch profile: {str(e)}'}), 500

@user_bp.route('/users/me/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    try:
        data = request.get_json()
        
        # Get or create profile
        profile = current_user.profile
        if not profile:
            profile = Profile(user_id=current_user.id)
            db.session.add(profile)
        
        # Update profile fields
        if 'current_company' in data:
            profile.current_company = data['current_company']
        if 'current_title' in data:
            profile.current_title = data['current_title']
        if 'work_experience' in data:
            profile.work_experience = data['work_experience']
        if 'skills' in data:
            profile.skills = data['skills']
        if 'website' in data:
            profile.website = data['website']
        if 'privacy_settings' in data:
            profile.set_privacy_settings(data['privacy_settings'])
        
        # Update user fields
        if 'name' in data:
            current_user.name = data['name']
        if 'class_name' in data:
            current_user.class_name = data['class_name']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': current_user.to_dict(include_private=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update profile: {str(e)}'}), 500

@user_bp.route('/users/search', methods=['GET'])
@token_required
def search_users(current_user):
    try:
        query = request.args.get('q', '').strip()
        graduation_year = request.args.get('year')
        company = request.args.get('company')
        
        # Build search query
        search_query = User.query
        
        if query:
            search_query = search_query.filter(
                User.name.contains(query)
            )
        
        if graduation_year:
            search_query = search_query.filter(
                User.graduation_year == int(graduation_year)
            )
        
        if company:
            search_query = search_query.join(Profile).filter(
                Profile.current_company.contains(company)
            )
        
        users = search_query.order_by(User.graduation_year.desc(), User.name.asc()).all()
        return jsonify([user.to_dict() for user in users]), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to search users: {str(e)}'}), 500

@user_bp.route('/users/me/linkedin-sync', methods=['POST'])
@token_required
def sync_linkedin_data(current_user):
    try:
        # This would typically integrate with LinkedIn API
        # For demo purposes, we'll return a placeholder response
        return jsonify({
            'message': 'LinkedIn sync not implemented in demo',
            'note': 'In a real application, this would fetch and update user data from LinkedIn API'
        }), 200
    except Exception as e:
        return jsonify({'message': f'Failed to sync LinkedIn data: {str(e)}'}), 500
