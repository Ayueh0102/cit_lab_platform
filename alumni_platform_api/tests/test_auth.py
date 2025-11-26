"""
認證 API 測試
更新於 2025-11-26：配合註冊欄位修改（移除 name 參數）
"""
import pytest


def test_register_user(client):
    """測試用戶註冊（使用更新後的欄位）"""
    response = client.post('/api/v2/auth/register', json={
        'email': 'newuser@example.com',
        'password': 'password123'
        # 注意：name 參數已移除，改用 profile 的 full_name/display_name
    })
    
    assert response.status_code == 201
    data = response.get_json()
    assert 'access_token' in data
    assert data['user']['email'] == 'newuser@example.com'


def test_register_user_with_profile(client):
    """測試用戶註冊並設定 profile 欄位"""
    response = client.post('/api/v2/auth/register', json={
        'email': 'profileuser@example.com',
        'password': 'password123',
        'name': 'Profile User',  # 會存到 profile.full_name
        'display_name': 'P. User',
        'graduation_year': 2020,
        'class_year': 110
    })
    
    assert response.status_code == 201
    data = response.get_json()
    assert 'access_token' in data


def test_register_duplicate_email(client):
    """測試重複 email 註冊"""
    # 第一次註冊
    client.post('/api/v2/auth/register', json={
        'email': 'duplicate@example.com',
        'password': 'password123'
    })
    
    # 第二次註冊（應該失敗）
    response = client.post('/api/v2/auth/register', json={
        'email': 'duplicate@example.com',
        'password': 'password456'
    })
    
    assert response.status_code == 400
    data = response.get_json()
    assert 'already registered' in data.get('message', '').lower()


def test_register_weak_password(client):
    """測試弱密碼註冊"""
    response = client.post('/api/v2/auth/register', json={
        'email': 'weakpass@example.com',
        'password': '123'  # 太短
    })
    
    assert response.status_code == 400


def test_login_user(client):
    """測試用戶登入"""
    # 先註冊
    client.post('/api/v2/auth/register', json={
        'email': 'loginuser@example.com',
        'password': 'password123'
    })
    
    # 登入
    response = client.post('/api/v2/auth/login', json={
        'email': 'loginuser@example.com',
        'password': 'password123'
    })
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data


def test_login_wrong_password(client):
    """測試錯誤密碼登入"""
    # 先註冊
    client.post('/api/v2/auth/register', json={
        'email': 'wrongpass@example.com',
        'password': 'password123'
    })
    
    # 使用錯誤密碼登入
    response = client.post('/api/v2/auth/login', json={
        'email': 'wrongpass@example.com',
        'password': 'wrongpassword'
    })
    
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    """測試不存在的用戶登入"""
    response = client.post('/api/v2/auth/login', json={
        'email': 'nonexistent@example.com',
        'password': 'password123'
    })
    
    assert response.status_code == 401


def test_get_current_user(client, auth_token):
    """測試獲取當前用戶資訊"""
    response = client.get(
        '/api/v2/auth/me',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'user' in data
    assert data['user']['email'] == 'test@example.com'


def test_get_current_user_no_token(client):
    """測試未認證時獲取用戶資訊"""
    response = client.get('/api/v2/auth/me')
    
    assert response.status_code == 401


def test_get_current_user_invalid_token(client):
    """測試無效 token 獲取用戶資訊"""
    response = client.get(
        '/api/v2/auth/me',
        headers={'Authorization': 'Bearer invalid_token_here'}
    )
    
    assert response.status_code == 401

