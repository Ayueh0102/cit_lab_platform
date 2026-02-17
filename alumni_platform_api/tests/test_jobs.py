"""
職缺 API 測試
更新於 2026-02-18：修正必填欄位和回傳格式
"""
import pytest


def test_get_jobs(client):
    """測試獲取職缺列表（公開 API）"""
    response = client.get('/api/v2/jobs')

    assert response.status_code == 200
    data = response.get_json()
    assert 'jobs' in data
    assert isinstance(data['jobs'], list)


def test_create_job(client, auth_token):
    """測試創建職缺（需提供 category_name 或 category_id）"""
    response = client.post(
        '/api/v2/jobs',
        json={
            'title': '測試職缺',
            'company': '測試公司',
            'location': '台北',
            'description': '這是一個測試職缺',
            'job_type': 'full_time',
            'category_name': '軟體工程'  # 必填：分類名稱（會自動建立）
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
            'job_type': 'full_time',
            'category_name': '軟體工程'
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )

    assert create_response.status_code == 201
    job_id = create_response.get_json()['job']['id']

    # 獲取職缺（get_job 直接回傳 job.to_dict()，不包裹在 'job' key 中）
    response = client.get(f'/api/v2/jobs/{job_id}')

    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == job_id
    assert data['title'] == '測試職缺'
