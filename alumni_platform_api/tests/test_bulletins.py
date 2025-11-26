"""
公告模組 API 測試
測試公告建立、更新、刪除等功能
"""
import pytest


class TestBulletinCategories:
    """公告分類測試"""
    
    def test_get_bulletin_categories(self, client, auth_token):
        """測試獲取公告分類列表"""
        response = client.get(
            '/api/v2/bulletins/categories',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'categories' in data


class TestBulletins:
    """公告管理測試"""
    
    def test_create_bulletin(self, client, admin_token):
        """測試管理員建立公告"""
        response = client.post(
            '/api/v2/bulletins',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={
                'title': '測試公告',
                'content': '這是一個測試公告的內容',
                'is_pinned': False,
                'is_published': True
            }
        )
        
        # 可能是 200 或 201
        assert response.status_code in [200, 201]
    
    def test_create_pinned_bulletin(self, client, admin_token):
        """測試建立置頂公告"""
        response = client.post(
            '/api/v2/bulletins',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={
                'title': '置頂公告',
                'content': '這是一個置頂公告',
                'is_pinned': True,
                'is_published': True
            }
        )
        
        assert response.status_code in [200, 201]
    
    def test_get_bulletins_list(self, client, auth_token):
        """測試獲取公告列表"""
        response = client.get(
            '/api/v2/bulletins',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'bulletins' in data or 'items' in data
    
    def test_get_bulletins_without_auth(self, client):
        """測試未認證時獲取公告列表（應該失敗）"""
        response = client.get('/api/v2/bulletins')
        
        assert response.status_code == 401
    
    @pytest.fixture
    def created_bulletin(self, client, admin_token):
        """建立測試公告"""
        response = client.post(
            '/api/v2/bulletins',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={
                'title': 'Fixture 公告',
                'content': '用於測試的公告',
                'is_published': True
            }
        )
        
        if response.status_code in [200, 201]:
            data = response.get_json()
            return data.get('bulletin', {}).get('id') or data.get('id')
        return None
    
    def test_get_bulletin_detail(self, client, auth_token, created_bulletin):
        """測試獲取公告詳情"""
        if not created_bulletin:
            pytest.skip("無法建立測試公告")
        
        response = client.get(
            f'/api/v2/bulletins/{created_bulletin}',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        assert response.status_code == 200
    
    def test_update_bulletin(self, client, admin_token, created_bulletin):
        """測試更新公告"""
        if not created_bulletin:
            pytest.skip("無法建立測試公告")
        
        response = client.put(
            f'/api/v2/bulletins/{created_bulletin}',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={
                'title': '更新後的公告標題',
                'content': '更新後的公告內容'
            }
        )
        
        assert response.status_code == 200
    
    def test_delete_bulletin(self, client, admin_token):
        """測試刪除公告"""
        # 先建立一個要刪除的公告
        create_response = client.post(
            '/api/v2/bulletins',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={
                'title': '要刪除的公告',
                'content': '這個公告會被刪除',
                'is_published': True
            }
        )
        
        if create_response.status_code in [200, 201]:
            data = create_response.get_json()
            bulletin_id = data.get('bulletin', {}).get('id') or data.get('id')
            
            # 刪除
            response = client.delete(
                f'/api/v2/bulletins/{bulletin_id}',
                headers={'Authorization': f'Bearer {admin_token}'}
            )
            
            assert response.status_code == 200
    
    def test_non_admin_cannot_create(self, client, auth_token):
        """測試非管理員無法建立公告"""
        response = client.post(
            '/api/v2/bulletins',
            headers={'Authorization': f'Bearer {auth_token}'},
            json={
                'title': '非管理員公告',
                'content': '這應該會失敗'
            }
        )
        
        # 應該是 403 Forbidden
        assert response.status_code in [403, 401]


class TestBulletinComments:
    """公告留言測試"""
    
    @pytest.fixture
    def bulletin_for_comment(self, client, admin_token):
        """建立用於留言測試的公告"""
        response = client.post(
            '/api/v2/bulletins',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={
                'title': '留言測試公告',
                'content': '用於測試留言功能',
                'is_published': True
            }
        )
        
        if response.status_code in [200, 201]:
            data = response.get_json()
            return data.get('bulletin', {}).get('id') or data.get('id')
        return None
    
    def test_add_comment(self, client, auth_token, bulletin_for_comment):
        """測試新增留言"""
        if not bulletin_for_comment:
            pytest.skip("無法建立測試公告")
        
        response = client.post(
            f'/api/v2/bulletins/{bulletin_for_comment}/comments',
            headers={'Authorization': f'Bearer {auth_token}'},
            json={
                'content': '這是一則測試留言'
            }
        )
        
        # 可能是 200 或 201
        assert response.status_code in [200, 201]
    
    def test_get_comments(self, client, auth_token, bulletin_for_comment):
        """測試獲取公告留言"""
        if not bulletin_for_comment:
            pytest.skip("無法建立測試公告")
        
        response = client.get(
            f'/api/v2/bulletins/{bulletin_for_comment}/comments',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        assert response.status_code == 200

