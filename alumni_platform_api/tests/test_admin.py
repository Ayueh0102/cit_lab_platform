"""
管理後台 API 測試
測試統計數據、用戶列表、權限控制
"""
import pytest


class TestAdminStatistics:
    """管理後台統計數據測試"""

    def test_get_statistics_as_admin(self, client, admin_token):
        """管理員取得統計數據"""
        response = client.get('/api/v2/admin/statistics',
                              headers={'Authorization': f'Bearer {admin_token}'})

        assert response.status_code == 200
        data = response.get_json()
        assert 'statistics' in data
        stats = data['statistics']
        assert 'users' in stats
        assert 'jobs' in stats
        assert 'events' in stats
        assert 'bulletins' in stats
        # 確認統計欄位存在
        assert 'total' in stats['users']
        assert 'active' in stats['users']

    def test_get_statistics_as_regular_user(self, client, auth_token):
        """一般使用者存取統計數據應返回 403"""
        response = client.get('/api/v2/admin/statistics',
                              headers={'Authorization': f'Bearer {auth_token}'})

        assert response.status_code == 403

    def test_get_statistics_unauthenticated(self, client):
        """未認證存取統計數據應返回 401"""
        response = client.get('/api/v2/admin/statistics')
        assert response.status_code == 401


class TestAdminUsers:
    """管理後台用戶管理測試"""

    def test_get_users_as_admin(self, client, admin_token):
        """管理員取得用戶列表"""
        response = client.get('/api/v2/admin/users',
                              headers={'Authorization': f'Bearer {admin_token}'})

        assert response.status_code == 200
        data = response.get_json()
        assert 'users' in data
        assert 'total' in data
        # admin fixture 至少建了一個使用者
        assert data['total'] >= 1

    def test_get_users_with_pagination(self, client, admin_token):
        """管理員取得用戶列表（分頁參數）"""
        response = client.get('/api/v2/admin/users?page=1&per_page=5',
                              headers={'Authorization': f'Bearer {admin_token}'})

        assert response.status_code == 200
        data = response.get_json()
        assert data['per_page'] == 5

    def test_get_users_as_regular_user(self, client, auth_token):
        """一般使用者存取用戶列表應返回 403"""
        response = client.get('/api/v2/admin/users',
                              headers={'Authorization': f'Bearer {auth_token}'})

        assert response.status_code == 403

    def test_get_users_unauthenticated(self, client):
        """未認證存取用戶列表應返回 401"""
        response = client.get('/api/v2/admin/users')
        assert response.status_code == 401

    def test_get_users_search(self, client, admin_token):
        """管理員搜尋用戶"""
        response = client.get('/api/v2/admin/users?search=admin_test',
                              headers={'Authorization': f'Bearer {admin_token}'})

        assert response.status_code == 200
        data = response.get_json()
        assert 'users' in data
