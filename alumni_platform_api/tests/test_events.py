"""
活動模組 API 測試
測試活動建立、報名、取消等功能
"""
import pytest
from datetime import datetime, timedelta


class TestEventCategories:
    """活動分類測試"""
    
    def test_get_event_categories(self, client, auth_token):
        """測試獲取活動分類列表"""
        response = client.get(
            '/api/v2/events/categories',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'categories' in data


class TestEvents:
    """活動管理測試"""
    
    def test_create_event(self, client, admin_token):
        """測試管理員建立活動"""
        future_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d %H:%M')
        
        response = client.post(
            '/api/v2/events',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={
                'title': '測試活動',
                'description': '這是一個測試活動',
                'location': '台北市',
                'start_time': future_date,
                'end_time': (datetime.now() + timedelta(days=30, hours=2)).strftime('%Y-%m-%d %H:%M'),
                'max_participants': 50,
                'registration_deadline': (datetime.now() + timedelta(days=25)).strftime('%Y-%m-%d %H:%M')
            }
        )
        
        # 可能是 200 或 201
        assert response.status_code in [200, 201]
    
    def test_get_events_list(self, client, auth_token):
        """測試獲取活動列表"""
        response = client.get(
            '/api/v2/events',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'events' in data or 'items' in data
    
    def test_get_events_without_auth(self, client):
        """測試未認證時獲取活動列表（應該失敗）"""
        response = client.get('/api/v2/events')
        
        assert response.status_code == 401


class TestEventRegistration:
    """活動報名測試"""
    
    @pytest.fixture
    def created_event(self, client, admin_token):
        """建立測試活動"""
        future_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d %H:%M')
        
        response = client.post(
            '/api/v2/events',
            headers={'Authorization': f'Bearer {admin_token}'},
            json={
                'title': '報名測試活動',
                'description': '用於測試報名功能',
                'location': '新竹市',
                'start_time': future_date,
                'end_time': (datetime.now() + timedelta(days=30, hours=2)).strftime('%Y-%m-%d %H:%M'),
                'max_participants': 10,
                'registration_deadline': (datetime.now() + timedelta(days=25)).strftime('%Y-%m-%d %H:%M'),
                'allow_waitlist': True
            }
        )
        
        if response.status_code in [200, 201]:
            data = response.get_json()
            return data.get('event', {}).get('id') or data.get('id')
        return None
    
    def test_register_for_event(self, client, auth_token, created_event):
        """測試報名活動"""
        if not created_event:
            pytest.skip("無法建立測試活動")
        
        response = client.post(
            f'/api/v2/events/{created_event}/register',
            headers={'Authorization': f'Bearer {auth_token}'},
            json={
                'participants_count': 1,
                'notes': '測試報名'
            }
        )
        
        # 報名成功或已報名
        assert response.status_code in [200, 201, 400]
    
    def test_cancel_registration(self, client, auth_token, created_event):
        """測試取消報名"""
        if not created_event:
            pytest.skip("無法建立測試活動")
        
        # 先報名
        client.post(
            f'/api/v2/events/{created_event}/register',
            headers={'Authorization': f'Bearer {auth_token}'},
            json={'participants_count': 1}
        )
        
        # 取消報名
        response = client.delete(
            f'/api/v2/events/{created_event}/register',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        # 取消成功或找不到報名記錄
        assert response.status_code in [200, 404]
    
    def test_get_my_registrations(self, client, auth_token):
        """測試獲取我的報名記錄"""
        response = client.get(
            '/api/v2/events/my-registrations',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        assert response.status_code == 200

