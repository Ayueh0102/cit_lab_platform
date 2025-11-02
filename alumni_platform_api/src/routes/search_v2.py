"""
全文搜索 API
支援跨模組的統一搜索功能
"""
from flask import Blueprint, request, jsonify
from src.routes.auth_v2 import token_required
from src.models_v2 import (
    db, Job, Event, Bulletin, Article, UserProfile, Message, Conversation, User
)
from sqlalchemy import or_, and_, func
from datetime import datetime

search_bp = Blueprint('search', __name__)


@search_bp.route('/api/v2/search', methods=['GET'])
@token_required
def global_search(current_user):
    """
    全局搜索
    支援搜索職缺、活動、公告、文章、用戶
    """
    try:
        query = request.args.get('q', '').strip()
        search_type = request.args.get('type', 'all')  # all, jobs, events, bulletins, articles, users
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        if not query:
            return jsonify({
                'message': 'Search query is required',
                'results': [],
                'total': 0
            }), 400

        results = {
            'jobs': [],
            'events': [],
            'bulletins': [],
            'articles': [],
            'users': [],
            'total': 0
        }

        # 搜索職缺
        if search_type in ['all', 'jobs']:
            jobs_query = Job.query.filter(
                or_(
                    Job.title.ilike(f'%{query}%'),
                    Job.company.ilike(f'%{query}%'),
                    Job.description.ilike(f'%{query}%'),
                    Job.location.ilike(f'%{query}%')
                )
            ).filter_by(status='active')
            
            jobs_pagination = jobs_query.paginate(
                page=page if search_type == 'jobs' else 1,
                per_page=per_page if search_type == 'jobs' else 5,
                error_out=False
            )
            
            results['jobs'] = [job.to_dict() for job in jobs_pagination.items]
            if search_type == 'jobs':
                results['total'] = jobs_pagination.total
                return jsonify({
                    'query': query,
                    'type': 'jobs',
                    'results': results['jobs'],
                    'total': results['total'],
                    'page': page,
                    'per_page': per_page,
                    'pages': jobs_pagination.pages
                }), 200

        # 搜索活動
        if search_type in ['all', 'events']:
            events_query = Event.query.filter(
                or_(
                    Event.title.ilike(f'%{query}%'),
                    Event.description.ilike(f'%{query}%'),
                    Event.location.ilike(f'%{query}%')
                )
            ).filter_by(status='published')
            
            events_pagination = events_query.paginate(
                page=page if search_type == 'events' else 1,
                per_page=per_page if search_type == 'events' else 5,
                error_out=False
            )
            
            results['events'] = [event.to_dict() for event in events_pagination.items]
            if search_type == 'events':
                results['total'] = events_pagination.total
                return jsonify({
                    'query': query,
                    'type': 'events',
                    'results': results['events'],
                    'total': results['total'],
                    'page': page,
                    'per_page': per_page,
                    'pages': events_pagination.pages
                }), 200

        # 搜索公告
        if search_type in ['all', 'bulletins']:
            bulletins_query = Bulletin.query.filter(
                or_(
                    Bulletin.title.ilike(f'%{query}%'),
                    Bulletin.content.ilike(f'%{query}%')
                )
            ).filter_by(status='published')
            
            bulletins_pagination = bulletins_query.paginate(
                page=page if search_type == 'bulletins' else 1,
                per_page=per_page if search_type == 'bulletins' else 5,
                error_out=False
            )
            
            results['bulletins'] = [bulletin.to_dict() for bulletin in bulletins_pagination.items]
            if search_type == 'bulletins':
                results['total'] = bulletins_pagination.total
                return jsonify({
                    'query': query,
                    'type': 'bulletins',
                    'results': results['bulletins'],
                    'total': results['total'],
                    'page': page,
                    'per_page': per_page,
                    'pages': bulletins_pagination.pages
                }), 200

        # 搜索文章
        if search_type in ['all', 'articles']:
            articles_query = Article.query.filter(
                or_(
                    Article.title.ilike(f'%{query}%'),
                    Article.subtitle.ilike(f'%{query}%'),
                    Article.content.ilike(f'%{query}%'),
                    Article.summary.ilike(f'%{query}%')
                )
            ).filter_by(status='published')
            
            articles_pagination = articles_query.paginate(
                page=page if search_type == 'articles' else 1,
                per_page=per_page if search_type == 'articles' else 5,
                error_out=False
            )
            
            results['articles'] = [article.to_dict() for article in articles_pagination.items]
            if search_type == 'articles':
                results['total'] = articles_pagination.total
                return jsonify({
                    'query': query,
                    'type': 'articles',
                    'results': results['articles'],
                    'total': results['total'],
                    'page': page,
                    'per_page': per_page,
                    'pages': articles_pagination.pages
                }), 200

        # 搜索用戶（僅限已登入用戶）
        if search_type in ['all', 'users']:
            from src.models_v2 import User
            users_query = db.session.query(UserProfile, User).join(User, UserProfile.user_id == User.id).filter(
                User.status == 'active'
            ).filter(
                or_(
                    UserProfile.full_name.ilike(f'%{query}%'),
                    UserProfile.display_name.ilike(f'%{query}%'),
                    UserProfile.current_company.ilike(f'%{query}%'),
                    UserProfile.current_position.ilike(f'%{query}%'),
                    UserProfile.bio.ilike(f'%{query}%')
                )
            )
            
            users_pagination = users_query.paginate(
                page=page if search_type == 'users' else 1,
                per_page=per_page if search_type == 'users' else 5,
                error_out=False
            )
            
            results['users'] = [
                {
                    'id': profile.user_id,
                    'full_name': profile.full_name,
                    'display_name': profile.display_name,
                    'current_company': profile.current_company,
                    'current_position': profile.current_position,
                    'graduation_year': profile.graduation_year,
                    'avatar_url': profile.avatar_url,
                }
                for profile, user in users_pagination.items
            ]
            if search_type == 'users':
                results['total'] = users_pagination.total
                return jsonify({
                    'query': query,
                    'type': 'users',
                    'results': results['users'],
                    'total': results['total'],
                    'page': page,
                    'per_page': per_page,
                    'pages': users_pagination.pages
                }), 200

        # 返回所有結果
        results['total'] = (
            len(results['jobs']) +
            len(results['events']) +
            len(results['bulletins']) +
            len(results['articles']) +
            len(results['users'])
        )

        return jsonify({
            'query': query,
            'type': 'all',
            'results': results,
            'total': results['total']
        }), 200

    except Exception as e:
        return jsonify({'message': f'Failed to search: {str(e)}'}), 500


@search_bp.route('/api/v2/search/suggestions', methods=['GET'])
@token_required
def get_search_suggestions(current_user):
    """獲取搜索建議（自動完成）"""
    try:
        query = request.args.get('q', '').strip()
        
        if len(query) < 2:
            return jsonify({'suggestions': []}), 200

        suggestions = []

        # 職缺標題建議
        jobs = Job.query.filter(
            Job.title.ilike(f'%{query}%')
        ).filter_by(status='active').limit(5).all()
        
        for job in jobs:
            suggestions.append({
                'type': 'job',
                'text': job.title,
                'url': f'/jobs/{job.id}'
            })

        # 活動標題建議
        events = Event.query.filter(
            Event.title.ilike(f'%{query}%')
        ).filter_by(status='published').limit(5).all()
        
        for event in events:
            suggestions.append({
                'type': 'event',
                'text': event.title,
                'url': f'/events/{event.id}'
            })

        # 用戶名稱建議
        users = db.session.query(UserProfile, User).join(User, UserProfile.user_id == User.id).filter(
            User.status == 'active'
        ).filter(
            or_(
                UserProfile.full_name.ilike(f'%{query}%'),
                UserProfile.display_name.ilike(f'%{query}%')
            )
        ).limit(5).all()
        
        for profile, user in users:
            suggestions.append({
                'type': 'user',
                'text': profile.full_name or profile.display_name,
                'url': f'/directory'
            })

        return jsonify({
            'suggestions': suggestions[:10]  # 限制最多 10 個建議
        }), 200

    except Exception as e:
        return jsonify({'message': f'Failed to get suggestions: {str(e)}'}), 500

