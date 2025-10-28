"""
公告系統 API v2
包含公告分類、公告管理、留言功能
"""

from flask import Blueprint, request, jsonify
from src.models_v2 import db, Bulletin, BulletinCategory, BulletinComment, User
from src.routes.auth_v2 import token_required, admin_required
from datetime import datetime
from sqlalchemy import or_

bulletins_v2_bp = Blueprint('bulletins_v2', __name__)


# ========================================
# 公告分類管理
# ========================================
@bulletins_v2_bp.route('/api/v2/bulletin-categories', methods=['GET'])
def get_bulletin_categories():
    """取得所有公告分類"""
    categories = BulletinCategory.query.filter_by(is_active=True).all()
    return jsonify({'categories': [cat.to_dict() for cat in categories]}), 200


@bulletins_v2_bp.route('/api/v2/bulletin-categories', methods=['POST'])
@token_required
@admin_required
def create_bulletin_category(current_user):
    """建立公告分類(管理員)"""
    try:
        data = request.get_json()
        category = BulletinCategory(
            name=data['name'],
            icon=data.get('icon'),
            color=data.get('color'),
            description=data.get('description')
        )
        db.session.add(category)
        db.session.commit()
        return jsonify({'message': 'Category created', 'category': category.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed: {str(e)}'}), 500


# ========================================
# 公告管理
# ========================================
@bulletins_v2_bp.route('/api/v2/bulletins', methods=['GET'])
def get_bulletins():
    """取得公告列表"""
    category_id = request.args.get('category_id', type=int)
    bulletin_type = request.args.get('type')
    status = request.args.get('status', 'published')
    search = request.args.get('search')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Bulletin.query

    if category_id:
        query = query.filter_by(category_id=category_id)
    if bulletin_type:
        query = query.filter_by(bulletin_type=bulletin_type)
    if status:
        query = query.filter_by(status=status)
    if search:
        query = query.filter(or_(
            Bulletin.title.like(f'%{search}%'),
            Bulletin.content.like(f'%{search}%')
        ))

    pagination = query.order_by(
        Bulletin.is_pinned.desc(),
        Bulletin.published_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'bulletins': [b.to_dict() for b in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@bulletins_v2_bp.route('/api/v2/bulletins/<int:bulletin_id>', methods=['GET'])
def get_bulletin(bulletin_id):
    """取得單一公告"""
    bulletin = Bulletin.query.get(bulletin_id)
    if not bulletin:
        return jsonify({'message': 'Bulletin not found'}), 404

    bulletin.increment_views()
    return jsonify(bulletin.to_dict(include_author=True, include_comments=True)), 200


@bulletins_v2_bp.route('/api/v2/bulletins', methods=['POST'])
@token_required
def create_bulletin(current_user):
    """建立公告"""
    try:
        data = request.get_json()
        bulletin = Bulletin(
            author_id=current_user.id,
            category_id=data['category_id'],
            title=data['title'],
            content=data['content'],
            bulletin_type=data.get('bulletin_type', 'announcement'),
            cover_image_url=data.get('cover_image_url'),
            is_pinned=data.get('is_pinned', False),
            is_featured=data.get('is_featured', False),
            allow_comments=data.get('allow_comments', True),
            status='published',
            published_at=datetime.utcnow()
        )
        db.session.add(bulletin)
        db.session.commit()
        return jsonify({'message': 'Bulletin created', 'bulletin': bulletin.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed: {str(e)}'}), 500


@bulletins_v2_bp.route('/api/v2/bulletins/<int:bulletin_id>', methods=['PUT'])
@token_required
def update_bulletin(current_user, bulletin_id):
    """更新公告"""
    try:
        bulletin = Bulletin.query.get(bulletin_id)
        if not bulletin:
            return jsonify({'message': 'Not found'}), 404
        if bulletin.author_id != current_user.id and current_user.role != 'admin':
            return jsonify({'message': 'Permission denied'}), 403

        data = request.get_json()
        for field in ['category_id', 'title', 'content', 'bulletin_type', 'cover_image_url', 'is_pinned', 'is_featured', 'allow_comments', 'status']:
            if field in data:
                setattr(bulletin, field, data[field])

        db.session.commit()
        return jsonify({'message': 'Updated', 'bulletin': bulletin.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed: {str(e)}'}), 500


@bulletins_v2_bp.route('/api/v2/bulletins/<int:bulletin_id>', methods=['DELETE'])
@token_required
def delete_bulletin(current_user, bulletin_id):
    """刪除公告"""
    try:
        bulletin = Bulletin.query.get(bulletin_id)
        if not bulletin:
            return jsonify({'message': 'Not found'}), 404
        if bulletin.author_id != current_user.id and current_user.role != 'admin':
            return jsonify({'message': 'Permission denied'}), 403

        db.session.delete(bulletin)
        db.session.commit()
        return jsonify({'message': 'Deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed: {str(e)}'}), 500


@bulletins_v2_bp.route('/api/v2/bulletins/<int:bulletin_id>/pin', methods=['POST'])
@token_required
@admin_required
def pin_bulletin(current_user, bulletin_id):
    """置頂公告"""
    bulletin = Bulletin.query.get(bulletin_id)
    if not bulletin:
        return jsonify({'message': 'Not found'}), 404
    bulletin.pin()
    return jsonify({'message': 'Pinned', 'bulletin': bulletin.to_dict()}), 200


@bulletins_v2_bp.route('/api/v2/bulletins/<int:bulletin_id>/unpin', methods=['POST'])
@token_required
@admin_required
def unpin_bulletin(current_user, bulletin_id):
    """取消置頂"""
    bulletin = Bulletin.query.get(bulletin_id)
    if not bulletin:
        return jsonify({'message': 'Not found'}), 404
    bulletin.unpin()
    return jsonify({'message': 'Unpinned', 'bulletin': bulletin.to_dict()}), 200


# ========================================
# 留言功能
# ========================================
@bulletins_v2_bp.route('/api/v2/bulletins/<int:bulletin_id>/comments', methods=['POST'])
@token_required
def create_comment(current_user, bulletin_id):
    """發表留言"""
    try:
        bulletin = Bulletin.query.get(bulletin_id)
        if not bulletin:
            return jsonify({'message': 'Bulletin not found'}), 404
        if not bulletin.allow_comments:
            return jsonify({'message': 'Comments are disabled'}), 403

        data = request.get_json()
        comment = BulletinComment(
            bulletin_id=bulletin_id,
            user_id=current_user.id,
            parent_id=data.get('parent_id'),
            content=data['content']
        )
        db.session.add(comment)
        bulletin.comments_count += 1
        db.session.commit()
        return jsonify({'message': 'Comment created', 'comment': comment.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed: {str(e)}'}), 500


@bulletins_v2_bp.route('/api/v2/comments/<int:comment_id>', methods=['DELETE'])
@token_required
def delete_comment(current_user, comment_id):
    """刪除留言"""
    try:
        comment = BulletinComment.query.get(comment_id)
        if not comment:
            return jsonify({'message': 'Not found'}), 404
        if comment.user_id != current_user.id and current_user.role != 'admin':
            return jsonify({'message': 'Permission denied'}), 403

        bulletin = Bulletin.query.get(comment.bulletin_id)
        db.session.delete(comment)
        bulletin.comments_count = max(0, bulletin.comments_count - 1)
        db.session.commit()
        return jsonify({'message': 'Deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed: {str(e)}'}), 500
