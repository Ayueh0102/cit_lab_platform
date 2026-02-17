"""
聯絡申請 API 測試
測試發送、查詢、接受、拒絕聯絡申請
"""
import pytest


class TestContactRequests:
    """聯絡申請系統測試"""

    def _get_user_id(self, email):
        """輔助方法：依 email 取得 user_id"""
        from src.models_v2 import User
        user = User.query.filter_by(email=email).first()
        return user.id if user else None

    def test_send_contact_request(self, client, auth_token, second_user_token):
        """發送聯絡申請"""
        target_id = self._get_user_id('second_user@example.com')

        response = client.post('/api/v2/contact-requests', json={
            'target_id': target_id,
            'message': '你好，想認識一下',
        }, headers={'Authorization': f'Bearer {auth_token}'})

        assert response.status_code == 201
        data = response.get_json()
        assert 'data' in data
        assert data['data']['status'] == 'pending'

    def test_send_contact_request_to_self(self, client, auth_token_with_user_id):
        """不能對自己發送聯絡申請"""
        user_id = auth_token_with_user_id['user_id']

        response = client.post('/api/v2/contact-requests', json={
            'target_id': user_id,
        }, headers={'Authorization': f'Bearer {auth_token_with_user_id["token"]}'})

        assert response.status_code == 400

    def test_send_contact_request_missing_target(self, client, auth_token):
        """缺少 target_id 應返回 400"""
        response = client.post('/api/v2/contact-requests', json={
            'message': '缺少目標',
        }, headers={'Authorization': f'Bearer {auth_token}'})

        assert response.status_code == 400

    def test_get_sent_requests(self, client, auth_token, second_user_token):
        """取得已發送的聯絡申請"""
        # 先發送一個申請
        target_id = self._get_user_id('second_user@example.com')
        client.post('/api/v2/contact-requests', json={
            'target_id': target_id,
        }, headers={'Authorization': f'Bearer {auth_token}'})

        response = client.get('/api/v2/contact-requests/sent',
                              headers={'Authorization': f'Bearer {auth_token}'})

        assert response.status_code == 200
        data = response.get_json()
        assert 'data' in data
        assert 'pagination' in data
        assert len(data['data']) >= 1

    def test_get_received_requests(self, client, auth_token, second_user_token):
        """取得已收到的聯絡申請"""
        # auth_token 使用者向 second_user 發送申請
        target_id = self._get_user_id('second_user@example.com')
        client.post('/api/v2/contact-requests', json={
            'target_id': target_id,
        }, headers={'Authorization': f'Bearer {auth_token}'})

        # second_user 查看收到的申請
        response = client.get('/api/v2/contact-requests/received',
                              headers={'Authorization': f'Bearer {second_user_token}'})

        assert response.status_code == 200
        data = response.get_json()
        assert 'data' in data
        assert len(data['data']) >= 1

    def test_accept_contact_request(self, client, auth_token, second_user_token):
        """接受聯絡申請"""
        target_id = self._get_user_id('second_user@example.com')

        # 發送申請
        create_resp = client.post('/api/v2/contact-requests', json={
            'target_id': target_id,
        }, headers={'Authorization': f'Bearer {auth_token}'})
        request_id = create_resp.get_json()['data']['id']

        # second_user 接受申請
        response = client.post(f'/api/v2/contact-requests/{request_id}/accept',
                               headers={'Authorization': f'Bearer {second_user_token}'})

        assert response.status_code == 200
        data = response.get_json()
        assert data['data']['status'] == 'accepted'

    def test_reject_contact_request(self, client, auth_token, second_user_token):
        """拒絕聯絡申請"""
        target_id = self._get_user_id('second_user@example.com')

        # 發送申請
        create_resp = client.post('/api/v2/contact-requests', json={
            'target_id': target_id,
        }, headers={'Authorization': f'Bearer {auth_token}'})
        request_id = create_resp.get_json()['data']['id']

        # second_user 拒絕申請
        response = client.post(f'/api/v2/contact-requests/{request_id}/reject',
                               headers={'Authorization': f'Bearer {second_user_token}'})

        assert response.status_code == 200
        data = response.get_json()
        assert data['data']['status'] == 'rejected'

    def test_accept_nonexistent_request(self, client, auth_token):
        """接受不存在的申請應返回 404"""
        response = client.post('/api/v2/contact-requests/99999/accept',
                               headers={'Authorization': f'Bearer {auth_token}'})

        assert response.status_code == 404

    def test_contact_requests_unauthenticated(self, client):
        """未認證存取聯絡申請應返回 401"""
        response = client.post('/api/v2/contact-requests', json={
            'target_id': 1,
        })
        assert response.status_code == 401

    def test_get_sent_requests_unauthenticated(self, client):
        """未認證取得已發送申請應返回 401"""
        response = client.get('/api/v2/contact-requests/sent')
        assert response.status_code == 401
