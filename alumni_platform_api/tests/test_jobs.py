"""
職缺 API 測試
"""
import pytest


def test_get_jobs(client):
    """測試獲取職缺列表"""
    response = client.get('/api/v2/jobs')
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'jobs' in data
    assert isinstance(data['jobs'], list)


def test_create_job(client, auth_token):
    """測試創建職缺"""
    response = client.post(
        '/api/v2/jobs',
        json={
            'title': '測試職缺',
            'company': '測試公司',
            'location': '台北',
            'description': '這是一個測試職缺',
            'job_type': 'full_time'
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    
    assert response.status_code == 201
    data = response.get_json()
    assert 'job' in data
    assert data['job']['title'] == '測試職缺'


def test_get_job_by_id(client, auth_token):
    """測試獲取單一職缺"""
    # 先創建職缺
    create_response = client.post(
        '/api/v2/jobs',
        json={
            'title': '測試職缺',
            'company': '測試公司',
            'location': '台北',
            'description': '這是一個測試職缺',
            'job_type': 'full_time'
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    
    job_id = create_response.get_json()['job']['id']
    
    # 獲取職缺
    response = client.get(f'/api/v2/jobs/{job_id}')
    
    assert response.status_code == 200
    data = response.get_json()
    assert data['job']['id'] == job_id

