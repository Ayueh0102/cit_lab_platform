"""
環節 7: 系統管理與通知
包含通知、系統設定、日誌等功能
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime, Enum, JSON
from sqlalchemy.orm import relationship
import enum
from .base import BaseModel, db


# ========================================
# 通知類型枚舉
# ========================================
class NotificationType(enum.Enum):
    """通知類型"""
    JOB_REQUEST = "job_request"              # 職缺交流請求
    JOB_REQUEST_APPROVED = "job_request_approved"  # 職缺請求通過
    JOB_REQUEST_REJECTED = "job_request_rejected"  # 職缺請求拒絕
    EVENT_REGISTRATION = "event_registration"      # 活動報名
    EVENT_REMINDER = "event_reminder"              # 活動提醒
    EVENT_CANCELLED = "event_cancelled"            # 活動取消
    NEW_MESSAGE = "new_message"                    # 新訊息
    COMMENT_REPLY = "comment_reply"                # 留言回覆
    BULLETIN_PUBLISHED = "bulletin_published"      # 公告發布
    SYSTEM_ANNOUNCEMENT = "system_announcement"    # 系統公告
    OTHER = "other"                                # 其他


class NotificationStatus(enum.Enum):
    """通知狀態"""
    UNREAD = "unread"      # 未讀
    READ = "read"          # 已讀
    ARCHIVED = "archived"  # 已封存


class LogLevel(enum.Enum):
    """日誌等級"""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


# ========================================
# 通知系統
# ========================================
class Notification(BaseModel):
    """通知"""
    __tablename__ = 'notifications_v2'

    # 接收者
    user_id = Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'),
                    nullable=False, comment='接收者ID')

    # 通知內容
    notification_type = Column(Enum(NotificationType),
                              default=NotificationType.OTHER,
                              comment='通知類型')
    title = Column(String(200), nullable=False, comment='通知標題')
    message = Column(Text, nullable=False, comment='通知訊息')

    # 關聯資源
    related_type = Column(String(50), comment='關聯資源類型(job/event/message等)')
    related_id = Column(Integer, comment='關聯資源ID')
    action_url = Column(String(500), comment='操作連結')

    # 通知狀態
    status = Column(Enum(NotificationStatus), default=NotificationStatus.UNREAD,
                   comment='通知狀態')
    read_at = Column(DateTime, comment='已讀時間')

    # 發送設定
    is_email_sent = Column(Boolean, default=False, comment='是否已發送郵件')
    email_sent_at = Column(DateTime, comment='郵件發送時間')

    # 關聯
    user = relationship('User', backref='notifications')

    def __repr__(self):
        return f'<Notification {self.id} to User {self.user_id}>'

    @property
    def is_read(self):
        """是否已讀"""
        return self.status == NotificationStatus.READ

    def mark_as_read(self):
        """標記為已讀"""
        if self.status == NotificationStatus.UNREAD:
            self.status = NotificationStatus.READ
            self.read_at = datetime.utcnow()
            db.session.commit()

    def mark_as_unread(self):
        """標記為未讀"""
        if self.status == NotificationStatus.READ:
            self.status = NotificationStatus.UNREAD
            self.read_at = None
            db.session.commit()

    def archive(self):
        """封存通知"""
        self.status = NotificationStatus.ARCHIVED
        db.session.commit()

    def to_dict(self, include_private=False):
        """轉換為字典"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'notification_type': self.notification_type.value if self.notification_type else None,
            'title': self.title,
            'message': self.message,
            'related_type': self.related_type,
            'related_id': self.related_id,
            'action_url': self.action_url,
            'status': self.status.value if self.status else None,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'is_read': self.is_read,
            'is_email_sent': self.is_email_sent,
            'email_sent_at': self.email_sent_at.isoformat() if self.email_sent_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if include_private:
            data.update({
                'sheet_row_id': self.sheet_row_id,
                'last_synced_at': self.last_synced_at.isoformat() if self.last_synced_at else None
            })

        return data

    @classmethod
    def from_sheet_row(cls, row_data):
        """從 Google Sheets 資料建立物件"""
        return cls(
            title=row_data.get('標題'),
            message=row_data.get('訊息'),
            notification_type=NotificationType[row_data.get('類型', 'OTHER')],
            status=NotificationStatus[row_data.get('狀態', 'UNREAD')]
        )

    def to_sheet_row(self):
        """轉換為 Google Sheets 格式"""
        return {
            'ID': self.id,
            '接收者': self.user.name if hasattr(self, 'user') and self.user else '',
            '標題': self.title,
            '訊息': self.message,
            '類型': self.notification_type.value if self.notification_type else '',
            '狀態': self.status.value if self.status else '',
            '已讀': '是' if self.is_read else '否',
            '已讀時間': self.read_at.strftime('%Y-%m-%d %H:%M') if self.read_at else '',
            '建立時間': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else ''
        }


# ========================================
# 系統設定
# ========================================
class SystemSetting(BaseModel):
    """系統設定"""
    __tablename__ = 'system_settings_v2'

    # 設定項目
    setting_key = Column(String(100), nullable=False, unique=True, comment='設定鍵')
    setting_value = Column(Text, comment='設定值')
    setting_type = Column(String(50), default='string',
                         comment='設定類型(string/int/bool/json)')

    # 設定描述
    category = Column(String(100), comment='設定分類')
    name = Column(String(200), comment='設定名稱')
    description = Column(Text, comment='設定描述')

    # 狀態
    is_public = Column(Boolean, default=False, comment='是否公開')
    is_editable = Column(Boolean, default=True, comment='是否可編輯')

    def __repr__(self):
        return f'<SystemSetting {self.setting_key}>'

    def get_value(self):
        """取得設定值(根據類型轉換)"""
        if not self.setting_value:
            return None

        if self.setting_type == 'int':
            return int(self.setting_value)
        elif self.setting_type == 'bool':
            return self.setting_value.lower() in ['true', '1', 'yes']
        elif self.setting_type == 'json':
            import json
            return json.loads(self.setting_value)
        else:
            return self.setting_value

    def set_value(self, value):
        """設定值(根據類型轉換)"""
        if self.setting_type == 'int':
            self.setting_value = str(int(value))
        elif self.setting_type == 'bool':
            self.setting_value = 'true' if value else 'false'
        elif self.setting_type == 'json':
            import json
            self.setting_value = json.dumps(value, ensure_ascii=False)
        else:
            self.setting_value = str(value)
        db.session.commit()

    def to_dict(self, include_private=False):
        """轉換為字典"""
        data = {
            'id': self.id,
            'setting_key': self.setting_key,
            'setting_value': self.get_value(),
            'setting_type': self.setting_type,
            'category': self.category,
            'name': self.name,
            'description': self.description,
            'is_public': self.is_public,
            'is_editable': self.is_editable,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_private:
            data.update({
                'sheet_row_id': self.sheet_row_id,
                'last_synced_at': self.last_synced_at.isoformat() if self.last_synced_at else None
            })

        return data

    @classmethod
    def from_sheet_row(cls, row_data):
        """從 Google Sheets 資料建立物件"""
        return cls(
            setting_key=row_data.get('設定鍵'),
            setting_value=row_data.get('設定值'),
            setting_type=row_data.get('類型', 'string'),
            category=row_data.get('分類'),
            name=row_data.get('名稱'),
            is_public=row_data.get('公開') == '是'
        )

    def to_sheet_row(self):
        """轉換為 Google Sheets 格式"""
        return {
            'ID': self.id,
            '設定鍵': self.setting_key,
            '設定值': str(self.setting_value or ''),
            '類型': self.setting_type,
            '分類': self.category or '',
            '名稱': self.name or '',
            '描述': self.description or '',
            '公開': '是' if self.is_public else '否',
            '可編輯': '是' if self.is_editable else '否',
            '更新日期': self.updated_at.strftime('%Y-%m-%d') if self.updated_at else ''
        }


# ========================================
# 系統日誌
# ========================================
class SystemLog(BaseModel):
    """系統日誌"""
    __tablename__ = 'system_logs_v2'

    # 日誌資訊
    log_level = Column(Enum(LogLevel), default=LogLevel.INFO, comment='日誌等級')
    category = Column(String(100), comment='日誌分類')
    action = Column(String(200), comment='操作名稱')
    message = Column(Text, comment='日誌訊息')

    # 關聯使用者
    user_id = Column(Integer, ForeignKey('users_v2.id', ondelete='SET NULL'),
                    comment='操作者ID')

    # 請求資訊
    ip_address = Column(String(50), comment='IP 位址')
    user_agent = Column(String(500), comment='瀏覽器 User Agent')
    request_method = Column(String(10), comment='請求方法(GET/POST等)')
    request_path = Column(String(500), comment='請求路徑')

    # 詳細資料
    details = Column(JSON, comment='詳細資料(JSON)')
    error_trace = Column(Text, comment='錯誤追蹤')

    # 關聯
    user = relationship('User', backref='system_logs')

    def __repr__(self):
        return f'<SystemLog {self.id} - {self.log_level.value if self.log_level else ""}>'

    def to_dict(self, include_private=False):
        """轉換為字典"""
        data = {
            'id': self.id,
            'log_level': self.log_level.value if self.log_level else None,
            'category': self.category,
            'action': self.action,
            'message': self.message,
            'user_id': self.user_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'request_method': self.request_method,
            'request_path': self.request_path,
            'details': self.details,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if hasattr(self, 'user') and self.user:
            data['user_name'] = self.user.name
            data['user_email'] = self.user.email

        if include_private:
            data.update({
                'error_trace': self.error_trace,
                'sheet_row_id': self.sheet_row_id,
                'last_synced_at': self.last_synced_at.isoformat() if self.last_synced_at else None
            })

        return data

    @classmethod
    def from_sheet_row(cls, row_data):
        """從 Google Sheets 資料建立物件"""
        return cls(
            log_level=LogLevel[row_data.get('等級', 'INFO')],
            category=row_data.get('分類'),
            action=row_data.get('操作'),
            message=row_data.get('訊息')
        )

    def to_sheet_row(self):
        """轉換為 Google Sheets 格式"""
        return {
            'ID': self.id,
            '等級': self.log_level.value if self.log_level else '',
            '分類': self.category or '',
            '操作': self.action or '',
            '訊息': self.message or '',
            '操作者': self.user.name if hasattr(self, 'user') and self.user else '',
            'IP 位址': self.ip_address or '',
            '請求方法': self.request_method or '',
            '請求路徑': self.request_path or '',
            '時間': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else ''
        }


# ========================================
# 使用者活動記錄
# ========================================
class UserActivity(BaseModel):
    """使用者活動記錄"""
    __tablename__ = 'user_activities_v2'

    user_id = Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'),
                    nullable=False, comment='使用者ID')

    # 活動資訊
    activity_type = Column(String(50), nullable=False, comment='活動類型')
    activity_name = Column(String(200), comment='活動名稱')
    description = Column(Text, comment='活動描述')

    # 關聯資源
    related_type = Column(String(50), comment='關聯資源類型')
    related_id = Column(Integer, comment='關聯資源ID')

    # 詳細資料
    extra_data = Column(JSON, comment='額外資料(JSON)')

    # 關聯
    user = relationship('User', backref='activities')

    def __repr__(self):
        return f'<UserActivity {self.id} - {self.activity_type}>'

    def to_dict(self, include_private=False):
        """轉換為字典"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'activity_type': self.activity_type,
            'activity_name': self.activity_name,
            'description': self.description,
            'related_type': self.related_type,
            'related_id': self.related_id,
            'extra_data': self.extra_data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if hasattr(self, 'user') and self.user:
            data['user_name'] = self.user.name
            data['user_email'] = self.user.email

        if include_private:
            data.update({
                'sheet_row_id': self.sheet_row_id,
                'last_synced_at': self.last_synced_at.isoformat() if self.last_synced_at else None
            })

        return data

    @classmethod
    def from_sheet_row(cls, row_data):
        """從 Google Sheets 資料建立物件"""
        return cls(
            activity_type=row_data.get('活動類型'),
            activity_name=row_data.get('活動名稱'),
            description=row_data.get('描述')
        )

    def to_sheet_row(self):
        """轉換為 Google Sheets 格式"""
        return {
            'ID': self.id,
            '使用者': self.user.name if hasattr(self, 'user') and self.user else '',
            '活動類型': self.activity_type,
            '活動名稱': self.activity_name or '',
            '描述': self.description or '',
            '時間': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else ''
        }


# ========================================
# 檔案上傳記錄
# ========================================
class FileUpload(BaseModel):
    """檔案上傳記錄"""
    __tablename__ = 'file_uploads_v2'

    user_id = Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'),
                    nullable=False, comment='上傳者ID')

    # 檔案資訊
    file_name = Column(String(200), nullable=False, comment='檔案名稱')
    file_path = Column(String(500), nullable=False, comment='檔案路徑')
    file_url = Column(String(500), comment='檔案 URL')
    file_size = Column(Integer, comment='檔案大小(bytes)')
    file_type = Column(String(100), comment='檔案類型(MIME)')

    # 關聯資源
    related_type = Column(String(50), comment='關聯資源類型')
    related_id = Column(Integer, comment='關聯資源ID')

    # 狀態
    is_public = Column(Boolean, default=False, comment='是否公開')
    is_deleted = Column(Boolean, default=False, comment='是否已刪除')
    deleted_at = Column(DateTime, comment='刪除時間')

    # 關聯
    user = relationship('User', backref='file_uploads')

    def __repr__(self):
        return f'<FileUpload {self.file_name}>'

    def delete(self):
        """標記為已刪除"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
        db.session.commit()

    def to_dict(self, include_private=False):
        """轉換為字典"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'file_name': self.file_name,
            'file_path': self.file_path,
            'file_url': self.file_url,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'related_type': self.related_type,
            'related_id': self.related_id,
            'is_public': self.is_public,
            'is_deleted': self.is_deleted,
            'deleted_at': self.deleted_at.isoformat() if self.deleted_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        if hasattr(self, 'user') and self.user:
            data['user_name'] = self.user.name
            data['user_email'] = self.user.email

        if include_private:
            data.update({
                'sheet_row_id': self.sheet_row_id,
                'last_synced_at': self.last_synced_at.isoformat() if self.last_synced_at else None
            })

        return data

    @classmethod
    def from_sheet_row(cls, row_data):
        """從 Google Sheets 資料建立物件"""
        return cls(
            file_name=row_data.get('檔案名稱'),
            file_path=row_data.get('檔案路徑'),
            file_size=int(row_data.get('檔案大小', 0)) if row_data.get('檔案大小') else None,
            is_public=row_data.get('公開') == '是'
        )

    def to_sheet_row(self):
        """轉換為 Google Sheets 格式"""
        return {
            'ID': self.id,
            '上傳者': self.user.name if hasattr(self, 'user') and self.user else '',
            '檔案名稱': self.file_name,
            '檔案大小': f'{self.file_size:,} bytes' if self.file_size else '',
            '檔案類型': self.file_type or '',
            '公開': '是' if self.is_public else '否',
            '已刪除': '是' if self.is_deleted else '否',
            '上傳時間': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else ''
        }
