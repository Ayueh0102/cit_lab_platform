"""
職涯管理 API
包含工作經歷、教育背景、技能管理
"""

from flask import Blueprint, request, jsonify
from src.models_v2 import db, WorkExperience, Education, Skill, UserSkill
from src.routes.auth_v2 import token_required
from datetime import datetime

career_bp = Blueprint('career', __name__)


# ========================================
# 工作經歷管理
# ========================================
@career_bp.route('/api/career/work-experiences', methods=['GET'])
@token_required
def get_work_experiences(current_user):
    """取得使用者的工作經歷列表"""
    user_id = request.args.get('user_id', current_user.id, type=int)

    experiences = WorkExperience.query.filter_by(user_id=user_id)\
        .order_by(WorkExperience.is_current.desc(), WorkExperience.start_date.desc())\
        .all()

    return jsonify({
        'work_experiences': [exp.to_dict() for exp in experiences]
    }), 200


@career_bp.route('/api/career/work-experiences', methods=['POST'])
@token_required
def create_work_experience(current_user):
    """新增工作經歷"""
    try:
        data = request.get_json()

        # 驗證必填欄位
        if not data.get('company') or not data.get('position'):
            return jsonify({'message': 'Company and position are required'}), 400

        # 如果設為目前工作,將其他工作設為非目前
        if data.get('is_current'):
            WorkExperience.query.filter_by(user_id=current_user.id, is_current=True)\
                .update({'is_current': False})

        experience = WorkExperience(
            user_id=current_user.id,
            company=data['company'],
            position=data['position'],
            department=data.get('department'),
            location=data.get('location'),
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data.get('start_date') else None,
            end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data.get('end_date') else None,
            is_current=data.get('is_current', False),
            description=data.get('description'),
            achievements=data.get('achievements')
        )

        db.session.add(experience)
        db.session.commit()

        return jsonify({
            'message': 'Work experience created successfully',
            'work_experience': experience.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create work experience: {str(e)}'}), 500


@career_bp.route('/api/career/work-experiences/<int:exp_id>', methods=['PUT'])
@token_required
def update_work_experience(current_user, exp_id):
    """更新工作經歷"""
    try:
        experience = WorkExperience.query.filter_by(id=exp_id, user_id=current_user.id).first()

        if not experience:
            return jsonify({'message': 'Work experience not found'}), 404

        data = request.get_json()

        # 如果設為目前工作,將其他工作設為非目前
        if data.get('is_current') and not experience.is_current:
            WorkExperience.query.filter_by(user_id=current_user.id, is_current=True)\
                .filter(WorkExperience.id != exp_id)\
                .update({'is_current': False})

        # 更新欄位
        if 'company' in data:
            experience.company = data['company']
        if 'position' in data:
            experience.position = data['position']
        if 'department' in data:
            experience.department = data['department']
        if 'location' in data:
            experience.location = data['location']
        if 'start_date' in data:
            experience.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data['start_date'] else None
        if 'end_date' in data:
            experience.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data['end_date'] else None
        if 'is_current' in data:
            experience.is_current = data['is_current']
        if 'description' in data:
            experience.description = data['description']
        if 'achievements' in data:
            experience.achievements = data['achievements']

        db.session.commit()

        return jsonify({
            'message': 'Work experience updated successfully',
            'work_experience': experience.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update work experience: {str(e)}'}), 500


@career_bp.route('/api/career/work-experiences/<int:exp_id>', methods=['DELETE'])
@token_required
def delete_work_experience(current_user, exp_id):
    """刪除工作經歷"""
    try:
        experience = WorkExperience.query.filter_by(id=exp_id, user_id=current_user.id).first()

        if not experience:
            return jsonify({'message': 'Work experience not found'}), 404

        db.session.delete(experience)
        db.session.commit()

        return jsonify({'message': 'Work experience deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete work experience: {str(e)}'}), 500


# ========================================
# 教育背景管理
# ========================================
@career_bp.route('/api/career/educations', methods=['GET'])
@token_required
def get_educations(current_user):
    """取得使用者的教育背景列表"""
    user_id = request.args.get('user_id', current_user.id, type=int)

    educations = Education.query.filter_by(user_id=user_id)\
        .order_by(Education.start_date.desc())\
        .all()

    return jsonify({
        'educations': [edu.to_dict() for edu in educations]
    }), 200


@career_bp.route('/api/career/educations', methods=['POST'])
@token_required
def create_education(current_user):
    """新增教育背景"""
    try:
        data = request.get_json()

        if not data.get('school') or not data.get('degree'):
            return jsonify({'message': 'School and degree are required'}), 400

        education = Education(
            user_id=current_user.id,
            school=data['school'],
            degree=data['degree'],
            major=data.get('major'),
            minor=data.get('minor'),
            start_date=datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data.get('start_date') else None,
            end_date=datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data.get('end_date') else None,
            gpa=float(data['gpa']) if data.get('gpa') else None,
            honors=data.get('honors'),
            description=data.get('description')
        )

        db.session.add(education)
        db.session.commit()

        return jsonify({
            'message': 'Education created successfully',
            'education': education.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create education: {str(e)}'}), 500


@career_bp.route('/api/career/educations/<int:edu_id>', methods=['PUT'])
@token_required
def update_education(current_user, edu_id):
    """更新教育背景"""
    try:
        education = Education.query.filter_by(id=edu_id, user_id=current_user.id).first()

        if not education:
            return jsonify({'message': 'Education not found'}), 404

        data = request.get_json()

        if 'school' in data:
            education.school = data['school']
        if 'degree' in data:
            education.degree = data['degree']
        if 'major' in data:
            education.major = data['major']
        if 'minor' in data:
            education.minor = data['minor']
        if 'start_date' in data:
            education.start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date() if data['start_date'] else None
        if 'end_date' in data:
            education.end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date() if data['end_date'] else None
        if 'gpa' in data:
            education.gpa = float(data['gpa']) if data['gpa'] else None
        if 'honors' in data:
            education.honors = data['honors']
        if 'description' in data:
            education.description = data['description']

        db.session.commit()

        return jsonify({
            'message': 'Education updated successfully',
            'education': education.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update education: {str(e)}'}), 500


@career_bp.route('/api/career/educations/<int:edu_id>', methods=['DELETE'])
@token_required
def delete_education(current_user, edu_id):
    """刪除教育背景"""
    try:
        education = Education.query.filter_by(id=edu_id, user_id=current_user.id).first()

        if not education:
            return jsonify({'message': 'Education not found'}), 404

        db.session.delete(education)
        db.session.commit()

        return jsonify({'message': 'Education deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete education: {str(e)}'}), 500


# ========================================
# 技能管理
# ========================================
@career_bp.route('/api/career/skills', methods=['GET'])
def get_all_skills():
    """取得所有技能項目(公開)"""
    category = request.args.get('category')

    query = Skill.query.filter_by(is_active=True)
    if category:
        query = query.filter_by(category=category)

    skills = query.order_by(Skill.category, Skill.name).all()

    return jsonify({
        'skills': [skill.to_dict() for skill in skills]
    }), 200


@career_bp.route('/api/career/user-skills', methods=['GET'])
@token_required
def get_user_skills(current_user):
    """取得使用者的技能列表"""
    user_id = request.args.get('user_id', current_user.id, type=int)

    user_skills = UserSkill.query.filter_by(user_id=user_id)\
        .order_by(UserSkill.is_primary.desc(), UserSkill.proficiency_level.desc())\
        .all()

    return jsonify({
        'user_skills': [us.to_dict() for us in user_skills]
    }), 200


@career_bp.route('/api/career/user-skills', methods=['POST'])
@token_required
def add_user_skill(current_user):
    """新增使用者技能"""
    try:
        data = request.get_json()

        if not data.get('skill_id'):
            return jsonify({'message': 'Skill ID is required'}), 400

        # 檢查技能是否存在
        skill = Skill.query.get(data['skill_id'])
        if not skill:
            return jsonify({'message': 'Skill not found'}), 404

        # 檢查是否已新增
        existing = UserSkill.query.filter_by(
            user_id=current_user.id,
            skill_id=data['skill_id']
        ).first()

        if existing:
            return jsonify({'message': 'Skill already added'}), 400

        user_skill = UserSkill(
            user_id=current_user.id,
            skill_id=data['skill_id'],
            proficiency_level=data.get('proficiency_level', 'intermediate'),
            years_of_experience=data.get('years_of_experience'),
            is_primary=data.get('is_primary', False),
            certification=data.get('certification')
        )

        db.session.add(user_skill)
        db.session.commit()

        return jsonify({
            'message': 'User skill added successfully',
            'user_skill': user_skill.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to add user skill: {str(e)}'}), 500


@career_bp.route('/api/career/user-skills/<int:user_skill_id>', methods=['PUT'])
@token_required
def update_user_skill(current_user, user_skill_id):
    """更新使用者技能"""
    try:
        user_skill = UserSkill.query.filter_by(id=user_skill_id, user_id=current_user.id).first()

        if not user_skill:
            return jsonify({'message': 'User skill not found'}), 404

        data = request.get_json()

        if 'proficiency_level' in data:
            user_skill.proficiency_level = data['proficiency_level']
        if 'years_of_experience' in data:
            user_skill.years_of_experience = data['years_of_experience']
        if 'is_primary' in data:
            user_skill.is_primary = data['is_primary']
        if 'certification' in data:
            user_skill.certification = data['certification']

        db.session.commit()

        return jsonify({
            'message': 'User skill updated successfully',
            'user_skill': user_skill.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update user skill: {str(e)}'}), 500


@career_bp.route('/api/career/user-skills/<int:user_skill_id>', methods=['DELETE'])
@token_required
def delete_user_skill(current_user, user_skill_id):
    """刪除使用者技能"""
    try:
        user_skill = UserSkill.query.filter_by(id=user_skill_id, user_id=current_user.id).first()

        if not user_skill:
            return jsonify({'message': 'User skill not found'}), 404

        db.session.delete(user_skill)
        db.session.commit()

        return jsonify({'message': 'User skill deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete user skill: {str(e)}'}), 500


# ========================================
# 技能管理別名路由 (為了兼容 API 文檔)
# ========================================
@career_bp.route('/api/career/my-skills', methods=['GET'])
@token_required
def get_my_skills(current_user):
    """取得我的技能列表 (別名路由)"""
    return get_user_skills(current_user)


@career_bp.route('/api/career/my-skills', methods=['POST'])
@token_required
def add_my_skill(current_user):
    """新增技能 (別名路由)"""
    return add_user_skill(current_user)


@career_bp.route('/api/career/my-skills/<int:user_skill_id>', methods=['DELETE'])
@token_required
def delete_my_skill(current_user, user_skill_id):
    """刪除技能 (別名路由)"""
    return delete_user_skill(current_user, user_skill_id)
