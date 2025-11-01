"""
職缺系統 API v2
包含職缺分類、職缺管理、職缺交流請求
"""

from flask import Blueprint, request, jsonify
from src.models_v2 import db, Job, JobCategory, JobRequest, User
from src.models_v2.jobs import JobType, JobStatus, RequestStatus
from src.routes.auth_v2 import token_required, admin_required
from datetime import datetime
from sqlalchemy import or_, and_

jobs_v2_bp = Blueprint('jobs_v2', __name__)


# ========================================
# 職缺分類管理
# ========================================
@jobs_v2_bp.route('/api/v2/job-categories', methods=['GET'])
def get_job_categories():
    """取得所有職缺分類"""
    categories = JobCategory.query.filter_by(is_active=True).all()

    return jsonify({
        'categories': [cat.to_dict() for cat in categories]
    }), 200


@jobs_v2_bp.route('/api/v2/job-categories', methods=['POST'])
@token_required
@admin_required
def create_job_category(current_user):
    """建立職缺分類(管理員)"""
    try:
        data = request.get_json()

        if not data.get('name'):
            return jsonify({'message': 'Category name is required'}), 400

        category = JobCategory(
            name=data['name'],
            icon=data.get('icon'),
            color=data.get('color'),
            description=data.get('description')
        )

        db.session.add(category)
        db.session.commit()

        return jsonify({
            'message': 'Job category created successfully',
            'category': category.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create category: {str(e)}'}), 500


# ========================================
# 職缺管理
# ========================================
@jobs_v2_bp.route('/api/v2/jobs', methods=['GET'])
def get_jobs():
    """取得職缺列表"""
    category_id = request.args.get('category_id', type=int)
    job_type = request.args.get('job_type')
    location = request.args.get('location')
    status = request.args.get('status', 'ACTIVE')
    search = request.args.get('search')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Job.query

    # 篩選條件
    if category_id:
        query = query.filter_by(category_id=category_id)
    if job_type:
        # 將小寫轉換為大寫 enum
        try:
            job_type_enum = JobType[job_type.upper().replace('-', '_')]
            query = query.filter_by(job_type=job_type_enum)
        except:
            pass
    if location:
        query = query.filter(Job.location.like(f'%{location}%'))
    if status:
        # 將小寫轉換為大寫 enum
        try:
            status_enum = JobStatus[status.upper()]
            query = query.filter_by(status=status_enum)
        except:
            pass
    if search:
        query = query.filter(
            or_(
                Job.title.like(f'%{search}%'),
                Job.company.like(f'%{search}%'),
                Job.description.like(f'%{search}%')
            )
        )

    # 分頁
    pagination = query.order_by(Job.published_at.desc(), Job.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'jobs': [job.to_dict() for job in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@jobs_v2_bp.route('/api/v2/jobs/<int:job_id>', methods=['GET'])
def get_job(job_id):
    """取得單一職缺詳情"""
    job = Job.query.get(job_id)

    if not job:
        return jsonify({'message': 'Job not found'}), 404

    # 增加瀏覽次數
    job.increment_views()

    return jsonify(job.to_dict()), 200


@jobs_v2_bp.route('/api/v2/jobs', methods=['POST'])
@token_required
def create_job(current_user):
    """發布新職缺"""
    try:
        data = request.get_json()

        required_fields = ['title', 'company', 'category_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400

        job = Job(
            user_id=current_user.id,
            category_id=data['category_id'],
            title=data['title'],
            company=data['company'],
            company_website=data.get('company_website'),
            company_logo_url=data.get('company_logo_url'),
            description=data.get('description'),
            requirements=data.get('requirements'),
            responsibilities=data.get('responsibilities'),
            benefits=data.get('benefits'),
            location=data.get('location'),
            job_type=JobType[data.get('job_type', 'full_time').upper().replace('-', '_')] if data.get('job_type') else JobType.FULL_TIME,
            is_remote=data.get('work_mode') == 'remote' if data.get('work_mode') else False,
            salary_min=data.get('salary_min'),
            salary_max=data.get('salary_max'),
            salary_negotiable=data.get('salary_negotiable', False),
            experience_years_min=int(data.get('experience_required', '').split('年')[0]) if data.get('experience_required') and '年' in str(data.get('experience_required')) else None,
            education_level=data.get('education_required') or data.get('education_level'),
            application_email=data.get('contact_email') or data.get('application_email'),
            application_url=data.get('application_url'),
            expires_at=datetime.strptime(data['deadline'], '%Y-%m-%d') if data.get('deadline') else None,
            status=JobStatus.ACTIVE,
            published_at=datetime.utcnow()
        )

        db.session.add(job)
        db.session.commit()

        return jsonify({
            'message': 'Job created successfully',
            'job': job.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create job: {str(e)}'}), 500


@jobs_v2_bp.route('/api/v2/jobs/<int:job_id>', methods=['PUT'])
@token_required
def update_job(current_user, job_id):
    """更新職缺"""
    try:
        job = Job.query.get(job_id)

        if not job:
            return jsonify({'message': 'Job not found'}), 404

        # 只有發布者或管理員可以更新
        if job.user_id != current_user.id and current_user.role != 'admin':
            return jsonify({'message': 'Permission denied'}), 403

        data = request.get_json()

        # 更新欄位
        updatable_fields = [
            'category_id', 'title', 'company', 'company_website', 'company_logo_url',
            'description', 'requirements', 'responsibilities', 'benefits',
            'location', 'job_type', 'salary_min', 'salary_max',
            'salary_negotiable', 'education_level',
            'application_email', 'application_url', 'status'
        ]

        for field in updatable_fields:
            if field in data:
                setattr(job, field, data[field])
        
        # 處理 work_mode -> is_remote 轉換
        if 'work_mode' in data:
            job.is_remote = data['work_mode'] == 'remote'
        
        # 處理 experience_required -> experience_years_min
        if 'experience_required' in data and data['experience_required']:
            exp_str = str(data['experience_required'])
            if '年' in exp_str:
                try:
                    job.experience_years_min = int(exp_str.split('年')[0])
                except:
                    pass
        
        # 處理 education_required -> education_level
        if 'education_required' in data:
            job.education_level = data['education_required']
        
        # 處理 contact_email -> application_email
        if 'contact_email' in data:
            job.application_email = data['contact_email']
        
        # 處理 deadline -> expires_at
        if 'deadline' in data and data['deadline']:
            job.expires_at = datetime.strptime(data['deadline'], '%Y-%m-%d')

        db.session.commit()

        return jsonify({
            'message': 'Job updated successfully',
            'job': job.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update job: {str(e)}'}), 500


@jobs_v2_bp.route('/api/v2/jobs/<int:job_id>', methods=['DELETE'])
@token_required
def delete_job(current_user, job_id):
    """刪除職缺"""
    try:
        job = Job.query.get(job_id)

        if not job:
            return jsonify({'message': 'Job not found'}), 404

        # 只有發布者或管理員可以刪除
        if job.user_id != current_user.id and current_user.role != 'admin':
            return jsonify({'message': 'Permission denied'}), 403

        db.session.delete(job)
        db.session.commit()

        return jsonify({'message': 'Job deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete job: {str(e)}'}), 500


@jobs_v2_bp.route('/api/v2/jobs/<int:job_id>/close', methods=['POST'])
@token_required
def close_job(current_user, job_id):
    """關閉職缺"""
    try:
        job = Job.query.get(job_id)

        if not job:
            return jsonify({'message': 'Job not found'}), 404

        if job.user_id != current_user.id and current_user.role != 'admin':
            return jsonify({'message': 'Permission denied'}), 403

        job.close()

        return jsonify({
            'message': 'Job closed successfully',
            'job': job.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to close job: {str(e)}'}), 500


@jobs_v2_bp.route('/api/v2/my-jobs', methods=['GET'])
@token_required
def get_my_jobs(current_user):
    """取得我發布的職缺"""
    status = request.args.get('status')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Job.query.filter_by(user_id=current_user.id)

    if status:
        try:
            status_enum = JobStatus[status.upper()]
            query = query.filter(Job.status == status_enum)
        except:
            pass

    pagination = query.order_by(Job.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'jobs': [job.to_dict() for job in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


# ========================================
# 職缺交流請求
# ========================================
@jobs_v2_bp.route('/api/v2/job-requests', methods=['POST'])
@token_required
def create_job_request(current_user):
    """建立職缺交流請求"""
    try:
        data = request.get_json()

        if not data.get('job_id'):
            return jsonify({'message': 'Job ID is required'}), 400

        job = Job.query.get(data['job_id'])
        if not job:
            return jsonify({'message': 'Job not found'}), 404

        # 檢查是否已經發送過請求
        existing_request = JobRequest.query.filter_by(
            job_id=data['job_id'],
            requester_id=current_user.id
        ).first()

        if existing_request:
            return jsonify({'message': 'You have already sent a request for this job'}), 400

        job_request = JobRequest(
            job_id=data['job_id'],
            requester_id=current_user.id,
            message=data.get('message'),
            status=RequestStatus.PENDING
        )

        db.session.add(job_request)
        db.session.commit()

        # TODO: 建立通知給職缺發布者

        return jsonify({
            'message': 'Job request sent successfully',
            'job_request': job_request.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create job request: {str(e)}'}), 500


@jobs_v2_bp.route('/api/v2/job-requests/received', methods=['GET'])
@token_required
def get_received_requests(current_user):
    """取得收到的交流請求"""
    status = request.args.get('status')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    # 通過 job.user_id 找到發送給當前用戶的請求
    query = JobRequest.query.join(Job).filter(Job.user_id == current_user.id)

    if status:
        try:
            status_enum = RequestStatus[status.upper()]
            query = query.filter(JobRequest.status == status_enum)
        except:
            pass

    pagination = query.order_by(JobRequest.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'requests': [req.to_dict() for req in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@jobs_v2_bp.route('/api/v2/job-requests/sent', methods=['GET'])
@token_required
def get_sent_requests(current_user):
    """取得發送的交流請求"""
    status = request.args.get('status')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = JobRequest.query.filter_by(requester_id=current_user.id)

    if status:
        query = query.filter_by(status=status)

    pagination = query.order_by(JobRequest.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'requests': [req.to_dict() for req in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@jobs_v2_bp.route('/api/v2/job-requests/<int:request_id>/accept', methods=['POST'])
@token_required
def accept_job_request(current_user, request_id):
    """接受交流請求"""
    try:
        job_request = JobRequest.query.get(request_id)

        if not job_request:
            return jsonify({'message': 'Request not found'}), 404

        # 檢查職缺是否屬於當前用戶
        job = Job.query.get(job_request.job_id)
        if not job or job.user_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403

        job_request.approve()

        # TODO: 建立對話
        # TODO: 建立通知給請求者

        return jsonify({
            'message': 'Request accepted successfully',
            'job_request': job_request.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to accept request: {str(e)}'}), 500


@jobs_v2_bp.route('/api/v2/job-requests/<int:request_id>/reject', methods=['POST'])
@token_required
def reject_job_request(current_user, request_id):
    """拒絕交流請求"""
    try:
        job_request = JobRequest.query.get(request_id)

        if not job_request:
            return jsonify({'message': 'Request not found'}), 404

        # 檢查職缺是否屬於當前用戶
        job = Job.query.get(job_request.job_id)
        if not job or job.user_id != current_user.id:
            return jsonify({'message': 'Permission denied'}), 403

        data = request.get_json()
        job_request.reject(response_message=data.get('reason'))

        # TODO: 建立通知給請求者

        return jsonify({
            'message': 'Request rejected',
            'job_request': job_request.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to reject request: {str(e)}'}), 500
