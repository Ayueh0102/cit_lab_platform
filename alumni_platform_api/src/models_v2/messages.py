"""
環節 4: 私訊與對話系統
包含對話管理、訊息傳送等功能
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
import enum
from .base import BaseModel, db


# ========================================
# 訊息狀態枚舉
# ========================================
class MessageStatus(enum.Enum):
    """訊息狀態"""
    SENT = "sent"              # 已發送
    DELIVERED = "delivered"    # 已送達
    READ = "read"              # 已讀


class ConversationType(enum.Enum):
    """對話類型"""
    JOB_REQUEST = "job_request"      # 職缺交流
    DIRECT_MESSAGE = "direct_message" # 直接私訊
    SYSTEM = "system"                 # 系統訊息


# ========================================
# 對話管理
# ========================================
class Conversation(BaseModel):
    """對話管理"""
    __tablename__ = 'conversations_v2'

    # 參與者
    user1_id = Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'),
                     nullable=False, comment='參與者1 ID')
    user2_id = Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'),
                     nullable=False, comment='參與者2 ID')

    # 對話屬性
    conversation_type = Column(Enum(ConversationType),
                              default=ConversationType.DIRECT_MESSAGE,
                              comment='對話類型')

    # 關聯職缺 (如果是職缺交流)
    job_id = Column(Integer, ForeignKey('jobs_v2.id', ondelete='SET NULL'),
                   comment='關聯職缺ID')
    job_request_id = Column(Integer, ForeignKey('job_requests_v2.id', ondelete='SET NULL'),
                           comment='關聯交流請求ID')

    # 對話狀態
    title = Column(String(200), comment='對話標題')
    is_active = Column(Boolean, default=True, comment='是否啟用')
    is_archived_by_user1 = Column(Boolean, default=False, comment='使用者1是否封存')
    is_archived_by_user2 = Column(Boolean, default=False, comment='使用者2是否封存')
    user1_deleted = Column(Boolean, default=False, comment='使用者1是否刪除')
    user2_deleted = Column(Boolean, default=False, comment='使用者2是否刪除')

    # 最後訊息
    last_message_at = Column(DateTime, comment='最後訊息時間')
    last_message_preview = Column(String(200), comment='最後訊息預覽')

    # 未讀計數
    unread_count_user1 = Column(Integer, default=0, comment='使用者1未讀數')
    unread_count_user2 = Column(Integer, default=0, comment='使用者2未讀數')

    # 關聯
    user1 = relationship('User', foreign_keys=[user1_id],
                        backref='conversations_as_user1')
    user2 = relationship('User', foreign_keys=[user2_id],
                        backref='conversations_as_user2')
    job = relationship('Job', backref='conversations')
    job_request = relationship('JobRequest', backref='conversation', uselist=False)
    messages = relationship('Message', back_populates='conversation',
                          cascade='all, delete-orphan', lazy='dynamic',
                          order_by='Message.created_at')

    def __repr__(self):
        return f'<Conversation {self.id} between User {self.user1_id} and {self.user2_id}>'

    def get_other_user(self, current_user_id):
        """取得對話中的另一位使用者"""
        return self.user2_id if current_user_id == self.user1_id else self.user1_id

    def get_unread_count(self, user_id):
        """取得指定使用者的未讀數"""
        if user_id == self.user1_id:
            return self.unread_count_user1
        elif user_id == self.user2_id:
            return self.unread_count_user2
        return 0

    def mark_as_read(self, user_id):
        """標記為已讀"""
        if user_id == self.user1_id:
            self.unread_count_user1 = 0
        elif user_id == self.user2_id:
            self.unread_count_user2 = 0
        db.session.commit()

    def increment_unread(self, sender_id):
        """增加未讀計數 (對方的未讀數)"""
        if sender_id == self.user1_id:
            self.unread_count_user2 += 1
        elif sender_id == self.user2_id:
            self.unread_count_user1 += 1
        db.session.commit()

    def update_last_message(self, message_content):
        """更新最後訊息資訊"""
        self.last_message_at = datetime.utcnow()
        # 限制預覽長度
        self.last_message_preview = message_content[:197] + '...' if len(message_content) > 200 else message_content
        db.session.commit()

    def archive(self, user_id):
        """封存對話"""
        if user_id == self.user1_id:
            self.is_archived_by_user1 = True
        elif user_id == self.user2_id:
            self.is_archived_by_user2 = True
        db.session.commit()

    def unarchive(self, user_id):
        """解除封存"""
        if user_id == self.user1_id:
            self.is_archived_by_user1 = False
        elif user_id == self.user2_id:
            self.is_archived_by_user2 = False
        db.session.commit()

    def is_archived_for(self, user_id):
        """檢查是否已被指定使用者封存"""
        if user_id == self.user1_id:
            return self.is_archived_by_user1
        elif user_id == self.user2_id:
            return self.is_archived_by_user2
        return False

    def to_dict(self, current_user_id=None, include_private=False):
        """轉換為字典"""
        data = {
            'id': self.id,
            'user1_id': self.user1_id,
            'user2_id': self.user2_id,
            'conversation_type': self.conversation_type.value if self.conversation_type else None,
            'job_id': self.job_id,
            'job_request_id': self.job_request_id,
            'title': self.title,
            'is_active': self.is_active,
            'last_message_at': self.last_message_at.isoformat() if self.last_message_at else None,
            'last_message_preview': self.last_message_preview,
            'message_count': self.messages.count() if hasattr(self, 'messages') else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        # 如果提供了當前使用者 ID,加入個人化資訊
        if current_user_id:
            data['other_user_id'] = self.get_other_user(current_user_id)
            data['unread_count'] = self.get_unread_count(current_user_id)
            data['is_archived'] = self.is_archived_for(current_user_id)

        # 包含關聯資料
        if hasattr(self, 'user1') and self.user1:
            data['user1_name'] = self.user1.name
            data['user1_email'] = self.user1.email

        if hasattr(self, 'user2') and self.user2:
            data['user2_name'] = self.user2.name
            data['user2_email'] = self.user2.email

        if hasattr(self, 'job') and self.job:
            data['job_title'] = self.job.title
            data['company'] = self.job.company

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
            title=row_data.get('對話標題'),
            conversation_type=ConversationType[row_data.get('類型', 'DIRECT_MESSAGE')],
            is_active=row_data.get('啟用') == '是'
        )

    def to_sheet_row(self):
        """轉換為 Google Sheets 格式"""
        return {
            'ID': self.id,
            '參與者1': self.user1.name if hasattr(self, 'user1') and self.user1 else '',
            '參與者2': self.user2.name if hasattr(self, 'user2') and self.user2 else '',
            '對話標題': self.title or '',
            '類型': self.conversation_type.value if self.conversation_type else '',
            '關聯職缺': self.job.title if hasattr(self, 'job') and self.job else '',
            '訊息數量': self.messages.count() if hasattr(self, 'messages') else 0,
            '最後訊息時間': self.last_message_at.strftime('%Y-%m-%d %H:%M') if self.last_message_at else '',
            '啟用': '是' if self.is_active else '否',
            '建立日期': self.created_at.strftime('%Y-%m-%d') if self.created_at else ''
        }


# ========================================
# 訊息內容
# ========================================
class Message(BaseModel):
    """訊息內容"""
    __tablename__ = 'messages_v2'

    conversation_id = Column(Integer, ForeignKey('conversations_v2.id', ondelete='CASCADE'),
                            nullable=False, comment='對話ID')
    sender_id = Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'),
                      nullable=False, comment='發送者ID')

    # 訊息內容
    content = Column(Text, nullable=False, comment='訊息內容')
    message_type = Column(String(50), default='text', comment='訊息類型(text/image/file)')
    attachment_url = Column(String(500), comment='附件URL')
    attachment_name = Column(String(200), comment='附件名稱')

    # 訊息狀態
    status = Column(Enum(MessageStatus), default=MessageStatus.SENT, comment='訊息狀態')
    read_at = Column(DateTime, comment='已讀時間')

    # 系統訊息標記
    is_system_message = Column(Boolean, default=False, comment='是否為系統訊息')

    # 關聯
    conversation = relationship('Conversation', back_populates='messages')
    sender = relationship('User', foreign_keys=[sender_id], backref='sent_messages')

    def __repr__(self):
        return f'<Message {self.id} from User {self.sender_id}>'

    def mark_as_read(self):
        """標記為已讀"""
        if self.status != MessageStatus.READ:
            self.status = MessageStatus.READ
            self.read_at = datetime.utcnow()
            db.session.commit()

    def mark_as_delivered(self):
        """標記為已送達"""
        if self.status == MessageStatus.SENT:
            self.status = MessageStatus.DELIVERED
            db.session.commit()

    @property
    def is_read(self):
        """是否已讀"""
        return self.status == MessageStatus.READ

    @property
    def content_preview(self):
        """內容預覽"""
        if self.message_type == 'text':
            return self.content[:50] + '...' if len(self.content) > 50 else self.content
        elif self.message_type == 'image':
            return '[圖片]'
        elif self.message_type == 'file':
            return f'[檔案: {self.attachment_name}]'
        else:
            return '[訊息]'

    def to_dict(self, include_private=False):
        """轉換為字典"""
        data = {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender_id': self.sender_id,
            'content': self.content,
            'message_type': self.message_type,
            'attachment_url': self.attachment_url,
            'attachment_name': self.attachment_name,
            'status': self.status.value if self.status else None,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'is_system_message': self.is_system_message,
            'is_read': self.is_read,
            'content_preview': self.content_preview,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        # 包含發送者資訊
        if hasattr(self, 'sender') and self.sender:
            data['sender_name'] = self.sender.name
            data['sender_email'] = self.sender.email

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
            content=row_data.get('訊息內容'),
            message_type=row_data.get('類型', 'text'),
            status=MessageStatus[row_data.get('狀態', 'SENT')],
            is_system_message=row_data.get('系統訊息') == '是'
        )

    def to_sheet_row(self):
        """轉換為 Google Sheets 格式"""
        return {
            'ID': self.id,
            '對話ID': self.conversation_id,
            '發送者': self.sender.name if hasattr(self, 'sender') and self.sender else '',
            '訊息內容': self.content_preview,
            '完整內容': self.content,
            '類型': self.message_type,
            '狀態': self.status.value if self.status else '',
            '系統訊息': '是' if self.is_system_message else '否',
            '已讀時間': self.read_at.strftime('%Y-%m-%d %H:%M') if self.read_at else '',
            '發送時間': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else ''
        }
