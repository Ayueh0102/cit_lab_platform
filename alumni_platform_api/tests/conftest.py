"""
後端測試配置
"""
import pytest
import sys
import os

# 添加專案根目錄到 Python 路徑
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

@pytest.fixture
def app():
    """創建 Flask 應用程式實例"""
    from src.main_v2 import app
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SECRET_KEY'] = 'test-secret-key'
    app.config['JWT_SECRET_KEY'] = 'test-jwt-secret-key'
    
    with app.app_context():
        from src.models_v2 import db
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    """創建測試客戶端"""
    return app.test_client()

@pytest.fixture
def auth_token(client):
    """創建測試用戶並獲取認證 token"""
    # 註冊測試用戶
    response = client.post('/api/v2/auth/register', json={
        'email': 'test@example.com',
        'password': 'test123456',
        'name': 'Test User'
    })
    
    # 登入獲取 token
    response = client.post('/api/v2/auth/login', json={
        'email': 'test@example.com',
        'password': 'test123456'
    })
    
    data = response.get_json()
    return data.get('access_token')

@pytest.fixture
def admin_token(client):
    """創建管理員用戶並獲取認證 token"""
    # 註冊管理員用戶
    response = client.post('/api/v2/auth/register', json={
        'email': 'admin_test@example.com',
        'password': 'admin123456',
        'name': 'Admin User'
    })
    
    # 登入獲取 token
    login_response = client.post('/api/v2/auth/login', json={
        'email': 'admin_test@example.com',
        'password': 'admin123456'
    })
    
    data = login_response.get_json()
    token = data.get('access_token')
    
    # 設置為管理員（在實際應用中應該通過資料庫操作）
    from src.models_v2 import User, db
    with client.application.app_context():
        user = User.query.filter_by(email='admin_test@example.com').first()
        if user:
            user.role = 'admin'
            db.session.commit()
    
    return token

