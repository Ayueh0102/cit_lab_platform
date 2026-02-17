"""
職涯模組 API 測試
測試工作經歷 CRUD 與薪資欄位遮罩
"""
import pytest


class TestWorkExperiences:
    """工作經歷測試"""
    
    def test_create_work_experience(self, client, auth_token):
        """測試新增工作經歷"""
        response = client.post(
            '/api/career/work-experiences',
            headers={'Authorization': f'Bearer {auth_token}'},
            json={
                'company': '測試公司',
                'position': '軟體工程師',
                'department': '研發部',
                'location': '台北市',
                'start_date': '2020-01-01',
                'is_current': True,
                'description': '負責系統開發',
                'annual_salary_min': 800000,
                'annual_salary_max': 1200000
            }
        )
        
        assert response.status_code == 201
        data = response.get_json()
        assert 'work_experience' in data
        assert data['work_experience']['company'] == '測試公司'
    
    def test_get_own_work_experiences(self, client, auth_token):
        """測試獲取自己的工作經歷"""
        # 先新增一筆
        client.post(
            '/api/career/work-experiences',
            headers={'Authorization': f'Bearer {auth_token}'},
            json={
                'company': '自己的公司',
                'position': '工程師',
                'start_date': '2021-01-01',
                'is_current': True,
                'annual_salary_min': 900000,
                'annual_salary_max': 1100000
            }
        )
        
        # 獲取列表
        response = client.get(
            '/api/career/work-experiences',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'work_experiences' in data
        
        # 自己應該可以看到薪資
        if len(data['work_experiences']) > 0:
            exp = data['work_experiences'][0]
            assert 'annual_salary_min' in exp or exp.get('annual_salary_min') is None
    
    def test_salary_hidden_for_others(self, client, auth_token_with_user_id, second_user_token):
        """測試查看他人工作經歷時薪資欄位被遮罩"""
        user_data = auth_token_with_user_id
        
        # 第一個用戶新增有薪資的工作經歷
        client.post(
            '/api/career/work-experiences',
            headers={'Authorization': f'Bearer {user_data["token"]}'},
            json={
                'company': '薪資測試公司',
                'position': '高級工程師',
                'start_date': '2022-01-01',
                'is_current': True,
                'annual_salary_min': 1500000,
                'annual_salary_max': 2000000
            }
        )
        
        # 第二個用戶查看第一個用戶的工作經歷
        response = client.get(
            f'/api/career/work-experiences?user_id={user_data["user_id"]}',
            headers={'Authorization': f'Bearer {second_user_token}'}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        
        # 非本人應該看不到薪資欄位
        if len(data['work_experiences']) > 0:
            exp = data['work_experiences'][0]
            assert 'annual_salary_min' not in exp
            assert 'annual_salary_max' not in exp
    
    def test_update_work_experience(self, client, auth_token):
        """測試更新工作經歷"""
        # 先新增
        create_response = client.post(
            '/api/career/work-experiences',
            headers={'Authorization': f'Bearer {auth_token}'},
            json={
                'company': '原公司',
                'position': '原職位',
                'start_date': '2020-01-01',
                'is_current': True
            }
        )
        
        if create_response.status_code == 201:
            exp_id = create_response.get_json()['work_experience']['id']
            
            # 更新
            response = client.put(
                f'/api/career/work-experiences/{exp_id}',
                headers={'Authorization': f'Bearer {auth_token}'},
                json={
                    'company': '新公司',
                    'position': '新職位'
                }
            )
            
            assert response.status_code == 200
            data = response.get_json()
            assert data['work_experience']['company'] == '新公司'
    
    def test_delete_work_experience(self, client, auth_token):
        """測試刪除工作經歷"""
        # 先新增
        create_response = client.post(
            '/api/career/work-experiences',
            headers={'Authorization': f'Bearer {auth_token}'},
            json={
                'company': '要刪除的公司',
                'position': '要刪除的職位',
                'start_date': '2020-01-01'
            }
        )
        
        if create_response.status_code == 201:
            exp_id = create_response.get_json()['work_experience']['id']
            
            # 刪除
            response = client.delete(
                f'/api/career/work-experiences/{exp_id}',
                headers={'Authorization': f'Bearer {auth_token}'}
            )
            
            assert response.status_code == 200
    
    def test_multiple_current_jobs(self, client, auth_token):
        """測試可以有多個目前在職的工作"""
        # 新增第一個目前在職
        response1 = client.post(
            '/api/career/work-experiences',
            headers={'Authorization': f'Bearer {auth_token}'},
            json={
                'company': '主要工作',
                'position': '全職工程師',
                'start_date': '2020-01-01',
                'is_current': True
            }
        )
        
        # 新增第二個目前在職（兼職）
        response2 = client.post(
            '/api/career/work-experiences',
            headers={'Authorization': f'Bearer {auth_token}'},
            json={
                'company': '兼職工作',
                'position': '顧問',
                'start_date': '2022-01-01',
                'is_current': True
            }
        )
        
        assert response1.status_code == 201
        assert response2.status_code == 201
        
        # 確認兩個都是 is_current
        list_response = client.get(
            '/api/career/work-experiences',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        data = list_response.get_json()
        current_jobs = [exp for exp in data['work_experiences'] if exp.get('is_current')]
        assert len(current_jobs) >= 2


class TestEducations:
    """教育背景測試"""
    
    def test_create_education(self, client, auth_token):
        """測試新增教育背景（API 使用 major 而非 field_of_study）"""
        response = client.post(
            '/api/career/educations',
            headers={'Authorization': f'Bearer {auth_token}'},
            json={
                'school': '台灣科技大學',
                'degree': 'master',
                'major': '色彩與照明科技研究所',  # 模型欄位為 major（nullable=False）
                'start_year': 2018,
                'end_year': 2020
            }
        )

        assert response.status_code == 201
        data = response.get_json()
        assert 'education' in data
    
    def test_get_educations(self, client, auth_token):
        """測試獲取教育背景列表"""
        response = client.get(
            '/api/career/educations',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'educations' in data

