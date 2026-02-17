"""
訊息系統 API 測試
測試對話管理、發送訊息、未讀計數
"""
import pytest


class TestConversations:
    """對話管理測試"""

    def test_get_conversations_empty(self, client, auth_token):
        """取得對話列表（空）"""
        response = client.get('/api/v2/conversations',
                              headers={'Authorization': f'Bearer {auth_token}'})

        assert response.status_code == 200
        data = response.get_json()
        assert 'conversations' in data
        assert data['total'] == 0

    def test_create_conversation(self, client, auth_token_with_user_id, second_user_token):
        """建立對話"""
        # 取得第二個使用者的 ID
        from src.models_v2 import User
        user2 = User.query.filter_by(email='second_user@example.com').first()

        response = client.post(f'/api/v2/conversations/with/{user2.id}',
                               headers={'Authorization': f'Bearer {auth_token_with_user_id["token"]}'})

        assert response.status_code in [200, 201]
        data = response.get_json()
        assert 'conversation' in data

    def test_create_conversation_with_self(self, client, auth_token_with_user_id):
        """不能與自己建立對話"""
        user_id = auth_token_with_user_id['user_id']

        response = client.post(f'/api/v2/conversations/with/{user_id}',
                               headers={'Authorization': f'Bearer {auth_token_with_user_id["token"]}'})

        assert response.status_code == 400

    def test_send_message(self, client, auth_token_with_user_id, second_user_token):
        """發送訊息"""
        from src.models_v2 import User
        user2 = User.query.filter_by(email='second_user@example.com').first()

        # 先建立對話
        conv_resp = client.post(f'/api/v2/conversations/with/{user2.id}',
                                headers={'Authorization': f'Bearer {auth_token_with_user_id["token"]}'})
        conv_id = conv_resp.get_json()['conversation']['id']

        # 發送訊息
        response = client.post(f'/api/v2/conversations/{conv_id}/messages', json={
            'content': '你好，這是測試訊息',
        }, headers={'Authorization': f'Bearer {auth_token_with_user_id["token"]}'})

        assert response.status_code == 201
        data = response.get_json()
        assert 'message_data' in data

    def test_send_message_empty_content(self, client, auth_token_with_user_id, second_user_token):
        """發送空內容訊息應返回 400"""
        from src.models_v2 import User
        user2 = User.query.filter_by(email='second_user@example.com').first()

        # 建立對話
        conv_resp = client.post(f'/api/v2/conversations/with/{user2.id}',
                                headers={'Authorization': f'Bearer {auth_token_with_user_id["token"]}'})
        conv_id = conv_resp.get_json()['conversation']['id']

        response = client.post(f'/api/v2/conversations/{conv_id}/messages', json={
            'content': '',
        }, headers={'Authorization': f'Bearer {auth_token_with_user_id["token"]}'})

        assert response.status_code == 400

    def test_get_unread_count(self, client, auth_token):
        """取得未讀訊息計數"""
        response = client.get('/api/v2/messages/unread-count',
                              headers={'Authorization': f'Bearer {auth_token}'})

        assert response.status_code == 200
        data = response.get_json()
        assert 'unread_count' in data
        assert data['unread_count'] >= 0

    def test_get_conversations_unauthenticated(self, client):
        """未認證存取對話列表應返回 401"""
        response = client.get('/api/v2/conversations')
        assert response.status_code == 401

    def test_send_message_unauthenticated(self, client):
        """未認證發送訊息應返回 401"""
        response = client.post('/api/v2/conversations/1/messages', json={
            'content': '未認證訊息',
        })
        assert response.status_code == 401

    def test_get_unread_count_unauthenticated(self, client):
        """未認證取得未讀計數應返回 401"""
        response = client.get('/api/v2/messages/unread-count')
        assert response.status_code == 401
