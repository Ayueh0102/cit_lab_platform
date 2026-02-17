"""
CMS 文章系統 API 測試
測試文章 CRUD、發布、按讚、評論功能
"""
import pytest


class TestCMSArticles:
    """CMS 文章管理測試"""

    def test_create_article_as_admin(self, client, admin_token):
        """管理員建立文章"""
        response = client.post('/api/v2/cms/articles', json={
            'title': '測試文章標題',
            'content': '<p>這是測試文章內容</p>',
            'summary': '文章摘要',
            'status': 'published',
        }, headers={'Authorization': f'Bearer {admin_token}'})

        assert response.status_code == 201
        data = response.get_json()
        assert data['article']['title'] == '測試文章標題'
        assert 'id' in data['article']

    def test_create_article_as_user(self, client, auth_token):
        """一般使用者建立文章（published 被強制改為 pending）"""
        response = client.post('/api/v2/cms/articles', json={
            'title': '使用者文章',
            'content': '<p>使用者撰寫的文章</p>',
            'status': 'published',
        }, headers={'Authorization': f'Bearer {auth_token}'})

        assert response.status_code == 201
        data = response.get_json()
        # 非管理員不能直接發布，應被強制改為 PENDING
        assert data['article']['status'] in ['PENDING', 'pending']

    def test_create_article_missing_title(self, client, admin_token):
        """建立文章缺少標題應返回 400"""
        response = client.post('/api/v2/cms/articles', json={
            'content': '<p>內容</p>',
        }, headers={'Authorization': f'Bearer {admin_token}'})

        assert response.status_code == 400

    def test_get_articles_list(self, client, admin_token):
        """取得文章列表"""
        # 先建立一篇文章
        client.post('/api/v2/cms/articles', json={
            'title': '列表測試文章',
            'content': '<p>內容</p>',
        }, headers={'Authorization': f'Bearer {admin_token}'})

        response = client.get('/api/v2/cms/articles',
                              headers={'Authorization': f'Bearer {admin_token}'})

        assert response.status_code == 200
        data = response.get_json()
        assert 'articles' in data
        assert 'total' in data
        assert len(data['articles']) >= 1

    def test_get_single_article(self, client, admin_token):
        """取得單篇文章"""
        # 建立文章
        create_resp = client.post('/api/v2/cms/articles', json={
            'title': '單篇測試文章',
            'content': '<p>單篇內容</p>',
            'status': 'published',
        }, headers={'Authorization': f'Bearer {admin_token}'})
        article_id = create_resp.get_json()['article']['id']

        response = client.get(f'/api/v2/cms/articles/{article_id}',
                              headers={'Authorization': f'Bearer {admin_token}'})

        assert response.status_code == 200
        data = response.get_json()
        assert data['title'] == '單篇測試文章'

    def test_publish_article(self, client, admin_token):
        """管理員發布文章"""
        # 建立草稿文章
        create_resp = client.post('/api/v2/cms/articles', json={
            'title': '待發布文章',
            'content': '<p>內容</p>',
            'status': 'draft',
        }, headers={'Authorization': f'Bearer {admin_token}'})
        article_id = create_resp.get_json()['article']['id']

        # 發布
        response = client.post(f'/api/v2/cms/articles/{article_id}/publish',
                               headers={'Authorization': f'Bearer {admin_token}'})

        assert response.status_code == 200
        data = response.get_json()
        assert data['article']['status'] in ['PUBLISHED', 'published']

    @pytest.mark.xfail(reason="Article model 缺少 increment_likes 方法（已知 bug）")
    def test_like_article(self, client, admin_token):
        """按讚文章"""
        # 建立並發布文章
        create_resp = client.post('/api/v2/cms/articles', json={
            'title': '按讚測試文章',
            'content': '<p>內容</p>',
            'status': 'published',
        }, headers={'Authorization': f'Bearer {admin_token}'})
        article_id = create_resp.get_json()['article']['id']

        response = client.post(f'/api/v2/cms/articles/{article_id}/like',
                               headers={'Authorization': f'Bearer {admin_token}'})

        assert response.status_code == 200
        data = response.get_json()
        assert data['likes_count'] >= 1

    def test_create_article_comment(self, client, admin_token, auth_token):
        """建立文章評論"""
        # 管理員建立並發布文章
        create_resp = client.post('/api/v2/cms/articles', json={
            'title': '評論測試文章',
            'content': '<p>內容</p>',
            'status': 'published',
        }, headers={'Authorization': f'Bearer {admin_token}'})
        article_id = create_resp.get_json()['article']['id']

        # 一般使用者留言
        response = client.post(f'/api/v2/cms/articles/{article_id}/comments', json={
            'content': '這是一則測試評論',
        }, headers={'Authorization': f'Bearer {auth_token}'})

        assert response.status_code == 201
        data = response.get_json()
        assert 'comment' in data
        assert data['comment']['content'] == '這是一則測試評論'

    def test_get_articles_unauthenticated(self, client):
        """未認證存取文章列表應返回 401"""
        response = client.get('/api/v2/cms/articles')
        assert response.status_code == 401

    def test_create_article_unauthenticated(self, client):
        """未認證建立文章應返回 401"""
        response = client.post('/api/v2/cms/articles', json={
            'title': '未認證文章',
            'content': '<p>內容</p>',
        })
        assert response.status_code == 401
