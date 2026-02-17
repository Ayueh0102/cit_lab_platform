"""
聯絡申請路由 v2
P2P 聯絡申請系統：系友可向其他系友發送聯絡申請，
對方接受後即可查看聯絡資訊（email / 電話）
"""

from flask import Blueprint, request, jsonify
from src.models_v2 import db, User, ContactRequest, NotificationType
from src.routes.auth_v2 import token_required
from src.routes.notification_helper import create_notification
from sqlalchemy import or_

contact_requests_v2_bp = Blueprint('contact_requests_v2', __name__)


# ========================================
# 發送聯絡申請
# ========================================
@contact_requests_v2_bp.route('/api/v2/contact-requests', methods=['POST'])
@token_required
def create_contact_request(current_user):
    """
    發送聯絡申請

    Request Body:
    {
        "target_id": int,      # 目標對象 ID（必填）
        "message": str         # 申請附言（選填）
    }
    """
    try:
        data = request.get_json()

        if not data or not data.get('target_id'):
            return jsonify({'message': 'target_id is required'}), 400

        target_id = data['target_id']

        # 不能對自己發送
        if target_id == current_user.id:
            return jsonify({'message': '不能對自己發送聯絡申請'}), 400

        # 確認目標使用者存在且為活躍狀態
        target_user = User.query.filter_by(id=target_id, status='active').first()
        if not target_user:
            return jsonify({'message': '目標使用者不存在'}), 404

        # 檢查是否已有 pending 或 accepted 的申請（雙向檢查）
        existing = ContactRequest.query.filter(
            or_(
                # 我對對方發過
                db.and_(
                    ContactRequest.requester_id == current_user.id,
                    ContactRequest.target_id == target_id,
                    ContactRequest.status.in_(['pending', 'accepted'])
                ),
                # 對方對我發過
                db.and_(
                    ContactRequest.requester_id == target_id,
                    ContactRequest.target_id == current_user.id,
                    ContactRequest.status.in_(['pending', 'accepted'])
                )
            )
        ).first()

        if existing:
            if existing.status == 'accepted':
                return jsonify({'message': '你們已經是聯絡人了'}), 400
            else:
                return jsonify({'message': '已有待處理的聯絡申請'}), 400

        # 建立聯絡申請
        contact_request = ContactRequest(
            requester_id=current_user.id,
            target_id=target_id,
            message=data.get('message', '').strip() if data.get('message') else None,
            status='pending'
        )
        db.session.add(contact_request)
        db.session.commit()

        # 發送通知給目標使用者
        requester_name = '系友'
        if current_user.profile:
            requester_name = current_user.profile.full_name or current_user.profile.display_name or '系友'

        create_notification(
            user_id=target_id,
            notification_type=NotificationType.CONTACT_REQUEST,
            title="新的聯絡申請",
            message=f"{requester_name} 向您發送了聯絡申請",
            related_type="contact_request",
            related_id=contact_request.id,
            action_url="/directory?tab=received"
        )

        return jsonify({
            'message': '聯絡申請已送出',
            'data': contact_request.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'發送聯絡申請失敗: {str(e)}'}), 500


# ========================================
# 我發出的申請列表
# ========================================
@contact_requests_v2_bp.route('/api/v2/contact-requests/sent', methods=['GET'])
@token_required
def get_sent_requests(current_user):
    """
    取得我發出的聯絡申請列表

    Query Parameters:
    - status: 篩選狀態（pending/accepted/rejected，選填）
    - page: 頁碼（默認 1）
    - per_page: 每頁數量（默認 20）
    """
    try:
        status = request.args.get('status', '').strip()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        if per_page > 100:
            per_page = 100

        query = ContactRequest.query.filter_by(requester_id=current_user.id)

        if status and status in ['pending', 'accepted', 'rejected']:
            query = query.filter_by(status=status)

        query = query.order_by(ContactRequest.created_at.desc())

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'data': [req.to_dict() for req in pagination.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200

    except Exception as e:
        return jsonify({'message': f'取得發出的申請列表失敗: {str(e)}'}), 500


# ========================================
# 我收到的申請列表
# ========================================
@contact_requests_v2_bp.route('/api/v2/contact-requests/received', methods=['GET'])
@token_required
def get_received_requests(current_user):
    """
    取得我收到的聯絡申請列表

    Query Parameters:
    - status: 篩選狀態（pending/accepted/rejected，選填）
    - page: 頁碼（默認 1）
    - per_page: 每頁數量（默認 20）
    """
    try:
        status = request.args.get('status', '').strip()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        if per_page > 100:
            per_page = 100

        query = ContactRequest.query.filter_by(target_id=current_user.id)

        if status and status in ['pending', 'accepted', 'rejected']:
            query = query.filter_by(status=status)

        query = query.order_by(ContactRequest.created_at.desc())

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'data': [req.to_dict() for req in pagination.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200

    except Exception as e:
        return jsonify({'message': f'取得收到的申請列表失敗: {str(e)}'}), 500


# ========================================
# 接受聯絡申請
# ========================================
@contact_requests_v2_bp.route('/api/v2/contact-requests/<int:request_id>/accept', methods=['POST'])
@token_required
def accept_contact_request(current_user, request_id):
    """接受聯絡申請"""
    try:
        contact_request = ContactRequest.query.get(request_id)

        if not contact_request:
            return jsonify({'message': '聯絡申請不存在'}), 404

        # 只有目標對象可以接受
        if contact_request.target_id != current_user.id:
            return jsonify({'message': '無權限操作此申請'}), 403

        # 只有 pending 狀態可以接受
        if contact_request.status != 'pending':
            return jsonify({'message': f'此申請已經是 {contact_request.status} 狀態'}), 400

        contact_request.accept()
        db.session.commit()

        # 發送通知給申請者
        target_name = '系友'
        if current_user.profile:
            target_name = current_user.profile.full_name or current_user.profile.display_name or '系友'

        create_notification(
            user_id=contact_request.requester_id,
            notification_type=NotificationType.CONTACT_ACCEPTED,
            title="聯絡申請已接受",
            message=f"{target_name} 已接受您的聯絡申請",
            related_type="contact_request",
            related_id=contact_request.id,
            action_url=f"/directory/{current_user.id}"
        )

        return jsonify({
            'message': '已接受聯絡申請',
            'data': contact_request.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'接受申請失敗: {str(e)}'}), 500


# ========================================
# 拒絕聯絡申請
# ========================================
@contact_requests_v2_bp.route('/api/v2/contact-requests/<int:request_id>/reject', methods=['POST'])
@token_required
def reject_contact_request(current_user, request_id):
    """拒絕聯絡申請"""
    try:
        contact_request = ContactRequest.query.get(request_id)

        if not contact_request:
            return jsonify({'message': '聯絡申請不存在'}), 404

        # 只有目標對象可以拒絕
        if contact_request.target_id != current_user.id:
            return jsonify({'message': '無權限操作此申請'}), 403

        # 只有 pending 狀態可以拒絕
        if contact_request.status != 'pending':
            return jsonify({'message': f'此申請已經是 {contact_request.status} 狀態'}), 400

        contact_request.reject()
        db.session.commit()

        # 發送通知給申請者
        target_name = '系友'
        if current_user.profile:
            target_name = current_user.profile.full_name or current_user.profile.display_name or '系友'

        create_notification(
            user_id=contact_request.requester_id,
            notification_type=NotificationType.CONTACT_REJECTED,
            title="聯絡申請已拒絕",
            message=f"{target_name} 婉拒了您的聯絡申請",
            related_type="contact_request",
            related_id=contact_request.id,
            action_url="/directory"
        )

        return jsonify({
            'message': '已拒絕聯絡申請',
            'data': contact_request.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'拒絕申請失敗: {str(e)}'}), 500


# ========================================
# 已建立聯絡的系友清單
# ========================================
@contact_requests_v2_bp.route('/api/v2/contacts', methods=['GET'])
@token_required
def get_contacts(current_user):
    """
    取得已建立聯絡的系友清單（雙向查詢 accepted 的申請）

    Query Parameters:
    - page: 頁碼（默認 1）
    - per_page: 每頁數量（默認 20）
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        if per_page > 100:
            per_page = 100

        # 雙向查詢：我是 requester 或 target，且狀態為 accepted
        query = ContactRequest.query.filter(
            ContactRequest.status == 'accepted',
            or_(
                ContactRequest.requester_id == current_user.id,
                ContactRequest.target_id == current_user.id
            )
        ).order_by(ContactRequest.responded_at.desc())

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        contacts = []
        for req in pagination.items:
            # 找出對方是誰
            if req.requester_id == current_user.id:
                contact_user = req.target
            else:
                contact_user = req.requester

            if not contact_user:
                continue

            profile = contact_user.profile
            contact_data = {
                'id': contact_user.id,
                'email': contact_user.email,
                'full_name': profile.full_name if profile else None,
                'display_name': profile.display_name if profile else None,
                'avatar_url': profile.avatar_url if profile else None,
                'current_company': profile.current_company if profile else None,
                'current_position': profile.current_position if profile else None,
                'graduation_year': profile.graduation_year if profile else None,
                'bio': profile.bio if profile else None,
                'connected_at': req.responded_at.isoformat() if req.responded_at else None,
                'contact_request_id': req.id,
            }

            # 已接受的聯絡人可以看到聯絡資訊
            if profile:
                contact_data['phone'] = profile.phone
                contact_data['linkedin_url'] = profile.linkedin_url
                contact_data['github_url'] = profile.github_url
                contact_data['personal_website'] = profile.personal_website

            contacts.append(contact_data)

        return jsonify({
            'data': contacts,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200

    except Exception as e:
        return jsonify({'message': f'取得聯絡人清單失敗: {str(e)}'}), 500


# ========================================
# 查詢與特定使用者的聯絡狀態
# ========================================
@contact_requests_v2_bp.route('/api/v2/contacts/status/<int:user_id>', methods=['GET'])
@token_required
def get_contact_status(current_user, user_id):
    """
    查詢與特定使用者的聯絡狀態

    回傳狀態：
    - none: 無任何申請
    - pending_sent: 我已發送，等待對方回應
    - pending_received: 對方已發送，等待我回應
    - accepted: 已建立聯絡
    - rejected: 已拒絕（可重新申請）
    """
    try:
        if user_id == current_user.id:
            return jsonify({
                'status': 'self',
                'message': '無法查詢自己的聯絡狀態'
            }), 200

        # 查詢雙向的申請記錄（取最近一筆）
        contact_request = ContactRequest.query.filter(
            or_(
                db.and_(
                    ContactRequest.requester_id == current_user.id,
                    ContactRequest.target_id == user_id
                ),
                db.and_(
                    ContactRequest.requester_id == user_id,
                    ContactRequest.target_id == current_user.id
                )
            )
        ).order_by(ContactRequest.created_at.desc()).first()

        if not contact_request:
            return jsonify({
                'status': 'none',
                'contact_request': None
            }), 200

        # 細分 pending 狀態方向
        status = contact_request.status
        if status == 'pending':
            if contact_request.requester_id == current_user.id:
                status = 'pending_sent'
            else:
                status = 'pending_received'

        return jsonify({
            'status': status,
            'contact_request': contact_request.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'message': f'查詢聯絡狀態失敗: {str(e)}'}), 500
