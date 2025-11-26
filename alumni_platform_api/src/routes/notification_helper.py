"""
通知建立輔助函數
用於在各個路由中統一的建立通知
"""
from src.models_v2 import db, Notification, NotificationType, NotificationStatus
from src.models_v2.events import RegistrationStatus
from src.routes.websocket import emit_notification
from datetime import datetime


def create_notification(
    user_id: int,
    notification_type: NotificationType,
    title: str,
    message: str,
    related_type: str = None,
    related_id: int = None,
    action_url: str = None
):
    """
    建立通知
    
    Args:
        user_id: 接收者使用者 ID
        notification_type: 通知類型
        title: 通知標題
        message: 通知訊息
        related_type: 關聯資源類型 (job/event/message/conversation等)
        related_id: 關聯資源 ID
        action_url: 操作連結
    """
    try:
        notification = Notification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            related_type=related_type,
            related_id=related_id,
            action_url=action_url,
            status=NotificationStatus.UNREAD
        )
        
        db.session.add(notification)
        db.session.commit()
        
        # 發送 WebSocket 通知
        from src.models_v2 import Notification as NotificationModel
        unread_count = NotificationModel.query.filter_by(
            user_id=user_id,
            status=NotificationStatus.UNREAD
        ).count()
        
        emit_notification(user_id, {
            **notification.to_dict(),
            'unread_count': unread_count
        })
        
        return notification
    except Exception as e:
        db.session.rollback()
        print(f"Failed to create notification: {str(e)}")
        return None


def create_job_request_notification(job_owner_id: int, requester_name: str, job_title: str, job_id: int, request_id: int):
    """建立職缺交流請求通知給職缺發布者"""
    return create_notification(
        user_id=job_owner_id,
        notification_type=NotificationType.JOB_REQUEST,
        title="新的職缺交流請求",
        message=f"{requester_name} 對您的職缺「{job_title}」發出了交流請求",
        related_type="job_request",
        related_id=request_id,
        action_url=f"/jobs/{job_id}/requests"
    )


def create_job_request_approved_notification(requester_id: int, job_title: str, job_id: int, request_id: int):
    """建立職缺請求通過通知給請求者"""
    return create_notification(
        user_id=requester_id,
        notification_type=NotificationType.JOB_REQUEST_APPROVED,
        title="職缺交流請求已通過",
        message=f"您的職缺「{job_title}」交流請求已被接受",
        related_type="job_request",
        related_id=request_id,
        action_url=f"/jobs/{job_id}"
    )


def create_job_request_rejected_notification(requester_id: int, job_title: str, job_id: int, request_id: int):
    """建立職缺請求拒絕通知給請求者"""
    return create_notification(
        user_id=requester_id,
        notification_type=NotificationType.JOB_REQUEST_REJECTED,
        title="職缺交流請求已拒絕",
        message=f"您的職缺「{job_title}」交流請求已被拒絕",
        related_type="job_request",
        related_id=request_id,
        action_url=f"/jobs/{job_id}"
    )


def create_event_registration_notification(organizer_id: int, participant_name: str, event_title: str, event_id: int):
    """建立活動報名通知給活動主辦者"""
    return create_notification(
        user_id=organizer_id,
        notification_type=NotificationType.EVENT_REGISTRATION,
        title="新的活動報名",
        message=f"{participant_name} 報名了您的活動「{event_title}」",
        related_type="event",
        related_id=event_id,
        action_url=f"/events/{event_id}"
    )


def create_event_cancelled_notification(participant_id: int, event_title: str, event_id: int):
    """建立活動取消通知給報名者"""
    return create_notification(
        user_id=participant_id,
        notification_type=NotificationType.EVENT_CANCELLED,
        title="活動已取消",
        message=f"活動「{event_title}」已被取消",
        related_type="event",
        related_id=event_id,
        action_url=f"/events/{event_id}"
    )


def create_event_reminder_notification(participant_id: int, event_title: str, event_id: int, start_time: datetime):
    """建立活動提醒通知給報名者"""
    return create_notification(
        user_id=participant_id,
        notification_type=NotificationType.EVENT_REMINDER,
        title="活動提醒",
        message=f"活動「{event_title}」將於 {start_time.strftime('%Y-%m-%d %H:%M')} 開始",
        related_type="event",
        related_id=event_id,
        action_url=f"/events/{event_id}"
    )


def create_new_message_notification(receiver_id: int, sender_name: str, conversation_id: int, message_preview: str = None):
    """建立新訊息通知給接收者"""
    preview = message_preview[:50] + "..." if message_preview and len(message_preview) > 50 else (message_preview or "")
    return create_notification(
        user_id=receiver_id,
        notification_type=NotificationType.NEW_MESSAGE,
        title="新訊息",
        message=f"{sender_name} 發送了一則新訊息" + (f": {preview}" if preview else ""),
        related_type="conversation",
        related_id=conversation_id,
        action_url=f"/messages/{conversation_id}"
    )


def create_conversation_notification(user_id: int, job_title: str, job_id: int, conversation_id: int):
    """建立對話建立通知"""
    return create_notification(
        user_id=user_id,
        notification_type=NotificationType.JOB_REQUEST_APPROVED,
        title="職缺交流已開啟",
        message=f"您與職缺「{job_title}」發布者的對話已開啟",
        related_type="conversation",
        related_id=conversation_id,
        action_url=f"/messages/{conversation_id}"
    )


def notify_all_event_participants(event_id: int, notification_type: NotificationType, title: str, message: str):
    """通知所有活動報名者"""
    from src.models_v2 import EventRegistration
    
    registrations = EventRegistration.query.filter_by(
        event_id=event_id,
        status=RegistrationStatus.REGISTERED
    ).all()
    
    notifications = []
    for registration in registrations:
        notification = create_notification(
            user_id=registration.user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            related_type="event",
            related_id=event_id,
            action_url=f"/events/{event_id}"
        )
        if notification:
            notifications.append(notification)
    
    return notifications

