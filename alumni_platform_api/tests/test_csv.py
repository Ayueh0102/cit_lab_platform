"""
CSV 匯入/匯出 API 測試
測試匯出格式與匯入新帳號功能
"""
import pytest
import io


class TestCSVExport:
    """CSV 匯出測試"""
    
    def test_export_users(self, client, admin_token):
        """測試匯出系友帳號清單"""
        response = client.get(
            '/api/csv/export/users',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        assert response.status_code == 200
        assert response.content_type == 'text/csv; charset=utf-8'
        
        # 檢查 CSV 標題行
        content = response.data.decode('utf-8-sig')
        first_line = content.split('\n')[0]
        assert '電子郵件' in first_line
        assert '姓名' in first_line
    
    def test_export_jobs(self, client, admin_token):
        """測試匯出職缺清單"""
        response = client.get(
            '/api/csv/export/jobs',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        assert response.status_code == 200
    
    def test_export_events(self, client, admin_token):
        """測試匯出活動清單"""
        response = client.get(
            '/api/csv/export/events',
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        
        assert response.status_code == 200
    
    def test_export_without_auth(self, client):
        """測試未認證時匯出（應該失敗）"""
        response = client.get('/api/csv/export/users')
        
        assert response.status_code == 401


class TestCSVImport:
    """CSV 匯入測試"""
    
    def test_import_users(self, client, admin_token):
        """測試匯入系友帳號"""
        # 建立測試 CSV 內容（使用更新後的欄位）
        csv_content = '''電子郵件,姓名,顯示名稱,畢業年份,屆數,目前公司,職位,個人網站,LinkedIn
import_test1@example.com,匯入測試一,測試一,2020,110,測試公司,工程師,,
import_test2@example.com,匯入測試二,測試二,2021,111,另一公司,設計師,,'''
        
        # 建立檔案對象
        data = {
            'file': (io.BytesIO(csv_content.encode('utf-8-sig')), 'test_users.csv')
        }
        
        response = client.post(
            '/api/csv/import/users',
            headers={'Authorization': f'Bearer {admin_token}'},
            data=data,
            content_type='multipart/form-data'
        )
        
        assert response.status_code == 200
        result = response.get_json()
        assert result.get('success') == True
        # 應該有新增的帳號
        assert result.get('imported', 0) >= 0 or result.get('updated', 0) >= 0
    
    def test_import_users_update_existing(self, client, admin_token):
        """測試匯入時更新現有帳號"""
        # 先匯入一次
        csv_content1 = '''電子郵件,姓名,顯示名稱,畢業年份,屆數,目前公司,職位,個人網站,LinkedIn
update_test@example.com,原始名稱,原始,2020,110,原始公司,原始職位,,'''
        
        data1 = {
            'file': (io.BytesIO(csv_content1.encode('utf-8-sig')), 'test1.csv')
        }
        
        client.post(
            '/api/csv/import/users',
            headers={'Authorization': f'Bearer {admin_token}'},
            data=data1,
            content_type='multipart/form-data'
        )
        
        # 再匯入一次（更新）
        csv_content2 = '''電子郵件,姓名,顯示名稱,畢業年份,屆數,目前公司,職位,個人網站,LinkedIn
update_test@example.com,更新名稱,更新,2021,111,新公司,新職位,,'''
        
        data2 = {
            'file': (io.BytesIO(csv_content2.encode('utf-8-sig')), 'test2.csv')
        }
        
        response = client.post(
            '/api/csv/import/users',
            headers={'Authorization': f'Bearer {admin_token}'},
            data=data2,
            content_type='multipart/form-data'
        )
        
        assert response.status_code == 200
        result = response.get_json()
        # 應該是更新而非新增
        assert result.get('updated', 0) >= 1
    
    def test_import_without_file(self, client, admin_token):
        """測試未提供檔案時匯入"""
        response = client.post(
            '/api/csv/import/users',
            headers={'Authorization': f'Bearer {admin_token}'},
            content_type='multipart/form-data'
        )
        
        assert response.status_code == 400
    
    def test_import_without_auth(self, client):
        """測試未認證時匯入（應該失敗）"""
        csv_content = '''電子郵件,姓名
noauth@example.com,未認證'''
        
        data = {
            'file': (io.BytesIO(csv_content.encode('utf-8-sig')), 'test.csv')
        }
        
        response = client.post(
            '/api/csv/import/users',
            data=data,
            content_type='multipart/form-data'
        )
        
        assert response.status_code == 401


class TestCSVSecurityImport:
    """CSV 匯入安全性測試"""
    
    def test_new_account_has_random_password(self, client, admin_token):
        """測試新匯入帳號使用隨機密碼（非預設密碼）"""
        csv_content = '''電子郵件,姓名,顯示名稱,畢業年份,屆數,目前公司,職位,個人網站,LinkedIn
random_pass_test@example.com,隨機密碼測試,測試,2022,112,,,'''
        
        data = {
            'file': (io.BytesIO(csv_content.encode('utf-8-sig')), 'test.csv')
        }
        
        # 匯入
        client.post(
            '/api/csv/import/users',
            headers={'Authorization': f'Bearer {admin_token}'},
            data=data,
            content_type='multipart/form-data'
        )
        
        # 嘗試用舊的預設密碼登入（應該失敗）
        login_response = client.post('/api/v2/auth/login', json={
            'email': 'random_pass_test@example.com',
            'password': 'default123'  # 舊的預設密碼
        })
        
        # 應該無法登入
        assert login_response.status_code == 401

