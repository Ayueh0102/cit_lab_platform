"""
後端測試配置
符合 pytest-flask 最佳實踐
"""
import pytest
import sys
import os

# 添加專案根目錄到 Python 路徑
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


def _activate_user(client, email):
    """輔助函式：將使用者狀態設為 active（因為註冊後預設是 pending）"""
    from src.models_v2 import User, db
    with client.application.app_context():
        user = User.query.filter_by(email=email).first()
        if user:
            user.status = 'active'
            db.session.commit()


@pytest.fixture(scope='function')
def app():
    """
    創建 Flask 應用程式實例

    使用 function scope 確保每個測試都有獨立的資料庫
    符合 pytest-flask 最佳實踐
    """
    from src.main_v2 import app as flask_app

    # 測試環境配置
    flask_app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SECRET_KEY': 'test-secret-key',
        'JWT_SECRET_KEY': 'test-jwt-secret-key',
        'WTF_CSRF_ENABLED': False,  # 測試時停用 CSRF
        'PRESERVE_CONTEXT_ON_EXCEPTION': False,
    })

    with flask_app.app_context():
        from src.models_v2 import db
        db.create_all()
        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """
    創建測試客戶端

    pytest-flask 標準 fixture
    自動推送 request context
    """
    return app.test_client()


@pytest.fixture
def runner(app):
    """創建 CLI 測試 runner"""
    return app.test_cli_runner()

@pytest.fixture
def auth_token(client):
    """創建測試用戶並獲取認證 token"""
    # 註冊測試用戶 (使用更新後的欄位：移除 name，改用 profile 欄位)
    client.post('/api/v2/auth/register', json={
        'email': 'test@example.com',
        'password': 'test123456'
    })

    # 啟用使用者（註冊後預設為 pending 狀態）
    _activate_user(client, 'test@example.com')

    # 登入獲取 token
    response = client.post('/api/v2/auth/login', json={
        'email': 'test@example.com',
        'password': 'test123456'
    })

    data = response.get_json()
    return data.get('access_token')

@pytest.fixture
def auth_token_with_user_id(client):
    """創建測試用戶並返回 token 和 user_id"""
    # 註冊測試用戶
    client.post('/api/v2/auth/register', json={
        'email': 'test_with_id@example.com',
        'password': 'test123456'
    })

    # 啟用使用者
    _activate_user(client, 'test_with_id@example.com')

    # 登入獲取 token
    response = client.post('/api/v2/auth/login', json={
        'email': 'test_with_id@example.com',
        'password': 'test123456'
    })

    data = response.get_json()
    return {
        'token': data.get('access_token'),
        'user_id': data.get('user', {}).get('id')
    }

@pytest.fixture
def admin_token(client):
    """創建管理員用戶並獲取認證 token"""
    # 註冊管理員用戶 (使用更新後的欄位)
    client.post('/api/v2/auth/register', json={
        'email': 'admin_test@example.com',
        'password': 'admin123456'
    })

    # 啟用使用者並設置為管理員
    from src.models_v2 import User, db
    with client.application.app_context():
        user = User.query.filter_by(email='admin_test@example.com').first()
        if user:
            user.status = 'active'
            user.role = 'admin'
            db.session.commit()

    # 登入獲取 token
    login_response = client.post('/api/v2/auth/login', json={
        'email': 'admin_test@example.com',
        'password': 'admin123456'
    })

    data = login_response.get_json()
    return data.get('access_token')

@pytest.fixture
def second_user_token(client):
    """創建第二個測試用戶並獲取認證 token（用於測試隱私控制）"""
    client.post('/api/v2/auth/register', json={
        'email': 'second_user@example.com',
        'password': 'test123456'
    })

    # 啟用使用者
    _activate_user(client, 'second_user@example.com')

    response = client.post('/api/v2/auth/login', json={
        'email': 'second_user@example.com',
        'password': 'test123456'
    })

    data = response.get_json()
    return data.get('access_token')
