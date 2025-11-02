"""
文章 CMS 系統 API v2
管理員專用的內容管理系統
"""

from flask import Blueprint, request, jsonify
from src.models_v2 import db, Article, User
from src.models_v2.content import ContentStatus, ArticleCategory
from src.routes.auth_v2 import token_required, admin_required
from datetime import datetime
from sqlalchemy import or_

cms_v2_bp = Blueprint('cms_v2', __name__)


# ========================================
# 文章管理
# ========================================
@cms_v2_bp.route('/api/v2/cms/articles', methods=['GET'])
@token_required
def get_articles(current_user):
    """取得文章列表（管理員可查看所有，一般用戶只能查看已發布）"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status')
        search = request.args.get('search', '').strip()
        
        # 建立查詢
        if current_user.role == 'admin':
            # 管理員可以查看所有文章
            query = Article.query
        else:
            # 一般用戶只能查看已發布的文章
            query = Article.query.filter(Article.status == ContentStatus.PUBLISHED)
        
        # 分類篩選
        category_id = request.args.get('category_id', type=int)
        if category_id:
            query = query.filter(Article.category_id == category_id)
        
        # 狀態篩選
        if status:
            # 將字符串轉換為 ContentStatus enum
            try:
                status_enum = ContentStatus[status.upper()]
                query = query.filter(Article.status == status_enum)
            except (KeyError, AttributeError):
                pass  # 如果狀態無效，忽略篩選
        
        # 搜尋
        if search:
            query = query.filter(
                or_(
                    Article.title.ilike(f'%{search}%'),
                    Article.subtitle.ilike(f'%{search}%'),
                    Article.content.ilike(f'%{search}%'),
                    Article.summary.ilike(f'%{search}%')
                )
            )
        
        # 排序和分頁
        pagination = query.order_by(Article.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'articles': [article.to_dict(include_private=(current_user.role == 'admin')) for article in pagination.items],
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get articles: {str(e)}'}), 500


@cms_v2_bp.route('/api/v2/cms/articles/<int:article_id>', methods=['GET'])
@token_required
def get_article(current_user, article_id):
    """取得單一文章"""
    try:
        article = Article.query.get(article_id)
        
        if not article:
            return jsonify({'message': 'Article not found'}), 404
        
        # 非管理員只能查看已發布的文章
        if current_user.role != 'admin':
            if article.status != ContentStatus.PUBLISHED:
                return jsonify({'message': 'Article not found'}), 404
        
        # 增加瀏覽次數
        article.increment_views()
        
        return jsonify(article.to_dict(include_private=(current_user.role == 'admin'))), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to get article: {str(e)}'}), 500


@cms_v2_bp.route('/api/v2/cms/articles', methods=['POST'])
@token_required
@admin_required
def create_article(current_user):
    """建立新文章（僅管理員）"""
    try:
        data = request.get_json()
        
        if not data.get('title'):
            return jsonify({'message': 'Title is required'}), 400
        
        if not data.get('content'):
            return jsonify({'message': 'Content is required'}), 400
        
        # 建立文章
        article = Article(
            author_id=current_user.id,
            category_id=data.get('category_id'),
            title=data['title'],
            subtitle=data.get('subtitle'),
            content=data['content'],
            summary=data.get('summary'),
            status=ContentStatus[data.get('status', 'draft').upper()],
            cover_image_url=data.get('cover_image_url'),
            tags=data.get('tags'),
        )
        
        # 如果狀態是已發布，設置發布時間
        if article.status == ContentStatus.PUBLISHED:
            article.published_at = datetime.utcnow()
        
        db.session.add(article)
        db.session.commit()
        
        return jsonify({
            'message': 'Article created successfully',
            'article': article.to_dict(include_private=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create article: {str(e)}'}), 500


@cms_v2_bp.route('/api/v2/cms/articles/<int:article_id>', methods=['PUT'])
@token_required
@admin_required
def update_article(current_user, article_id):
    """更新文章（僅管理員）"""
    try:
        article = Article.query.get(article_id)
        
        if not article:
            return jsonify({'message': 'Article not found'}), 404
        
        data = request.get_json()
        
        # 更新欄位
        if 'title' in data:
            article.title = data['title']
        if 'subtitle' in data:
            article.subtitle = data.get('subtitle')
        if 'content' in data:
            article.content = data['content']
        if 'summary' in data:
            article.summary = data.get('summary')
        if 'category_id' in data:
            article.category_id = data.get('category_id')
        if 'status' in data:
            old_status = article.status
            article.status = ContentStatus[data['status'].upper()]
            # 如果從草稿變為已發布，設置發布時間
            if old_status != ContentStatus.PUBLISHED and article.status == ContentStatus.PUBLISHED:
                article.published_at = datetime.utcnow()
        if 'cover_image_url' in data:
            article.cover_image_url = data.get('cover_image_url')
        if 'tags' in data:
            article.tags = data.get('tags')
        
        db.session.commit()
        
        return jsonify({
            'message': 'Article updated successfully',
            'article': article.to_dict(include_private=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update article: {str(e)}'}), 500


@cms_v2_bp.route('/api/v2/cms/articles/<int:article_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_article(current_user, article_id):
    """刪除文章（僅管理員）"""
    try:
        article = Article.query.get(article_id)
        
        if not article:
            return jsonify({'message': 'Article not found'}), 404
        
        db.session.delete(article)
        db.session.commit()
        
        return jsonify({'message': 'Article deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete article: {str(e)}'}), 500


@cms_v2_bp.route('/api/v2/cms/articles/<int:article_id>/publish', methods=['POST'])
@token_required
@admin_required
def publish_article(current_user, article_id):
    """發布文章（僅管理員）"""
    try:
        article = Article.query.get(article_id)
        
        if not article:
            return jsonify({'message': 'Article not found'}), 404
        
        article.publish()
        
        return jsonify({
            'message': 'Article published successfully',
            'article': article.to_dict(include_private=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to publish article: {str(e)}'}), 500


@cms_v2_bp.route('/api/v2/cms/articles/<int:article_id>/archive', methods=['POST'])
@token_required
@admin_required
def archive_article(current_user, article_id):
    """封存文章（僅管理員）"""
    try:
        article = Article.query.get(article_id)
        
        if not article:
            return jsonify({'message': 'Article not found'}), 404
        
        article.status = ContentStatus.ARCHIVED
        article.archived_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Article archived successfully',
            'article': article.to_dict(include_private=True)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to archive article: {str(e)}'}), 500


@cms_v2_bp.route('/api/v2/cms/articles/<int:article_id>/like', methods=['POST'])
@token_required
def like_article(current_user, article_id):
    """按讚文章"""
    try:
        article = Article.query.get(article_id)
        
        if not article:
            return jsonify({'message': 'Article not found'}), 404
        
        article.increment_likes()
        
        return jsonify({
            'message': 'Article liked successfully',
            'likes_count': article.likes_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to like article: {str(e)}'}), 500


# ========================================
# 文章分類管理
# ========================================
@cms_v2_bp.route('/api/v2/cms/article-categories', methods=['GET'])
@token_required
def get_article_categories(current_user):
    """取得所有文章分類"""
    try:
        categories = ArticleCategory.query.filter_by(is_active=True)\
            .order_by(ArticleCategory.sort_order, ArticleCategory.name)\
            .all()
        return jsonify({
            'categories': [cat.to_dict() for cat in categories]
        }), 200
    except Exception as e:
        return jsonify({'message': f'Failed to get categories: {str(e)}'}), 500


@cms_v2_bp.route('/api/v2/cms/article-categories', methods=['POST'])
@token_required
@admin_required
def create_article_category(current_user):
    """建立文章分類（僅管理員）"""
    try:
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({'message': 'Category name is required'}), 400
        
        # 檢查是否已存在
        existing = ArticleCategory.query.filter_by(name=data['name']).first()
        if existing:
            return jsonify({'message': 'Category name already exists'}), 400
        
        category = ArticleCategory(
            name=data['name'],
            name_en=data.get('name_en'),
            description=data.get('description'),
            icon=data.get('icon'),
            color=data.get('color'),
            sort_order=data.get('sort_order', 0),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Category created successfully',
            'category': category.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create category: {str(e)}'}), 500


@cms_v2_bp.route('/api/v2/cms/article-categories/<int:category_id>', methods=['PUT'])
@token_required
@admin_required
def update_article_category(current_user, category_id):
    """更新文章分類（僅管理員）"""
    try:
        category = ArticleCategory.query.get(category_id)
        
        if not category:
            return jsonify({'message': 'Category not found'}), 404
        
        data = request.get_json()
        
        if 'name' in data:
            # 檢查名稱是否與其他分類衝突
            existing = ArticleCategory.query.filter(
                ArticleCategory.name == data['name'],
                ArticleCategory.id != category_id
            ).first()
            if existing:
                return jsonify({'message': 'Category name already exists'}), 400
            category.name = data['name']
        
        if 'name_en' in data:
            category.name_en = data.get('name_en')
        if 'description' in data:
            category.description = data.get('description')
        if 'icon' in data:
            category.icon = data.get('icon')
        if 'color' in data:
            category.color = data.get('color')
        if 'sort_order' in data:
            category.sort_order = data.get('sort_order')
        if 'is_active' in data:
            category.is_active = data.get('is_active')
        
        db.session.commit()
        
        return jsonify({
            'message': 'Category updated successfully',
            'category': category.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to update category: {str(e)}'}), 500


@cms_v2_bp.route('/api/v2/cms/article-categories/<int:category_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_article_category(current_user, category_id):
    """刪除文章分類（僅管理員）"""
    try:
        category = ArticleCategory.query.get(category_id)
        
        if not category:
            return jsonify({'message': 'Category not found'}), 404
        
        # 檢查是否有文章使用此分類
        if category.articles.count() > 0:
            return jsonify({
                'message': 'Cannot delete category with articles. Please reassign articles first.'
            }), 400
        
        db.session.delete(category)
        db.session.commit()
        
        return jsonify({'message': 'Category deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to delete category: {str(e)}'}), 500

