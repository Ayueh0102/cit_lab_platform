"""
通知系統 API 測試
測試通知列表、未讀計數、標記已讀、全部已讀
"""
import pytest


def _create_notification(client, app, user_email='test@example.com'):
    """輔助函式：直接在 DB 建立一筆通知供測試用"""
    from src.models_v2 import db, User, Notification, NotificationType
    with app.app_context():
        user = User.query.filter_by(email=user_email).first()
        if not user:
            return None
        notif = Notification(
            user_id=user.id,
            notification_type=NotificationType.SYSTEM_ANNOUNCEMENT,
            title='測試通知',
            message='這是一則測試通知',
            status='unread',
        )
        db.session.add(notif)
        db.session.commit()
        return notif.id


class TestNotifications:
    """通知系統測試"""

    def test_get_notifications_empty(self, client, auth_token):
        """取得通知列表（空）"""
        response = client.get('/api/notifications',
                              headers={'Authorization': f'Bearer {auth_token}'})

        assert response.status_code == 200
        data = response.get_json()
        assert 'notifications' in data
        assert data['total'] == 0

    def test_get_notifications_with_data(self, client, app, auth_token):
        """取得通知列表（含資料）"""
        _create_notification(client, app)

        response = client.get('/api/notifications',
                              headers={'Authorization': f'Bearer {auth_token}'})

        assert response.status_code == 200
        data = response.get_json()
        assert data['total'] >= 1
        assert data['notifications'][0]['title'] == '測試通知'

    def test_get_unread_count(self, client, app, auth_token):
        """取得未讀通知數量"""
        _create_notification(client, app)

        response = client.get('/api/notifications/unread-count',
                              headers={'Authorization': f'Bearer {auth_token}'})

        assert response.status_code == 200
        data = response.get_json()
        assert data['unread_count'] >= 1

    def test_mark_notification_as_read(self, client, app, auth_token):
        """標記單一通知為已讀"""
        notif_id = _create_notification(client, app)

        response = client.post(f'/api/notifications/{notif_id}/read',
                               headers={'Authorization': f'Bearer {auth_token}'})

        assert response.status_code == 200
        data = response.get_json()
        assert data['notification']['status'] == 'read'

    def test_mark_all_as_read(self, client, app, auth_token):
        """全部標記已讀"""
        _create_notification(client, app)
        _create_notification(client, app)

        response = client.post('/api/notifications/mark-all-read',
                               headers={'Authorization': f'Bearer {auth_token}'})

        assert response.status_code == 200

        # 確認未讀計數為 0
        count_resp = client.get('/api/notifications/unread-count',
                                headers={'Authorization': f'Bearer {auth_token}'})
        assert count_resp.get_json()['unread_count'] == 0

    def test_mark_nonexistent_notification(self, client, auth_token):
        """標記不存在的通知應返回 404"""
        response = client.post('/api/notifications/99999/read',
                               headers={'Authorization': f'Bearer {auth_token}'})

        assert response.status_code == 404

    def test_get_notifications_unauthenticated(self, client):
        """未認證存取通知應返回 401"""
        response = client.get('/api/notifications')
        assert response.status_code == 401

    def test_get_unread_count_unauthenticated(self, client):
        """未認證取得未讀計數應返回 401"""
        response = client.get('/api/notifications/unread-count')
        assert response.status_code == 401
