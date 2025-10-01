from flask import Blueprint, request, jsonify, current_app
from src.models.user import db, User, Profile
import jwt
from datetime import datetime, timedelta
from functools import wraps

auth_bp = Blueprint('auth', __name__)

def token_required(f):
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
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'name', 'graduation_year']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'message': f'{field} is required'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already registered'}), 400
        
        # Create new user
        user = User(
            email=data['email'],
            name=data['name'],
            graduation_year=int(data['graduation_year']),
            class_name=data.get('class_name')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Create empty profile
        profile = Profile(user_id=user.id)
        db.session.add(profile)
        db.session.commit()

        # Generate JWT token for auto-login
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=7)
        }, current_app.config['SECRET_KEY'], algorithm='HS256')

        return jsonify({
            'message': 'User registered successfully',
            'access_token': token,
            'user_id': user.id,
            'user': user.to_dict(include_private=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password are required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if user and user.check_password(data['password']):
            # Generate JWT token
            token = jwt.encode({
                'user_id': user.id,
                'exp': datetime.utcnow() + timedelta(days=7)  # Token expires in 7 days
            }, current_app.config['SECRET_KEY'], algorithm='HS256')
            
            return jsonify({
                'access_token': token,
                'user_id': user.id,
                'user': user.to_dict(include_private=True)
            }), 200
        
        return jsonify({'message': 'Invalid email or password'}), 401
        
    except Exception as e:
        return jsonify({'message': f'Login failed: {str(e)}'}), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify(current_user.to_dict(include_private=True)), 200

@auth_bp.route('/linkedin', methods=['GET'])
def linkedin_auth():
    # This would typically redirect to LinkedIn OAuth
    # For demo purposes, we'll return a placeholder response
    return jsonify({
        'message': 'LinkedIn authentication not implemented in demo',
        'redirect_url': 'https://www.linkedin.com/oauth/v2/authorization'
    }), 200

@auth_bp.route('/linkedin/callback', methods=['GET'])
def linkedin_callback():
    # This would handle the LinkedIn OAuth callback
    # For demo purposes, we'll return a placeholder response
    return jsonify({
        'message': 'LinkedIn callback not implemented in demo'
    }), 200
