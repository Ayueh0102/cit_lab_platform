"""
認證 API 測試
"""
import pytest


def test_register_user(client):
    """測試用戶註冊"""
    response = client.post('/api/v2/auth/register', json={
        'email': 'newuser@example.com',
        'password': 'password123',
        'name': 'New User'
    })
    
    assert response.status_code == 201
    data = response.get_json()
    assert 'access_token' in data
    assert data['user']['email'] == 'newuser@example.com'


def test_login_user(client):
    """測試用戶登入"""
    # 先註冊
    client.post('/api/v2/auth/register', json={
        'email': 'loginuser@example.com',
        'password': 'password123',
        'name': 'Login User'
    })
    
    # 登入
    response = client.post('/api/v2/auth/login', json={
        'email': 'loginuser@example.com',
        'password': 'password123'
    })
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'access_token' in data


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

