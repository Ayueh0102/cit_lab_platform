"""
聯絡申請模型
P2P 聯絡申請系統：系友可向其他系友發送聯絡申請
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .base import BaseModel, db


class ContactRequest(BaseModel):
    """聯絡申請"""
    __tablename__ = 'contact_requests'

    # 申請者
    requester_id = Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'),
                          nullable=False, comment='申請者ID')

    # 目標對象
    target_id = Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'),
                       nullable=False, comment='目標對象ID')

    # 申請附言（選填）
    message = Column(Text, nullable=True, comment='申請理由或附言')

    # 狀態：pending / accepted / rejected
    status = Column(String(20), default='pending', nullable=False,
                    comment='申請狀態: pending/accepted/rejected')

    # 回應時間
    responded_at = Column(DateTime, nullable=True, comment='回應時間')

    # 關聯
    requester = relationship('User', foreign_keys=[requester_id], backref='sent_contact_requests')
    target = relationship('User', foreign_keys=[target_id], backref='received_contact_requests')

    def __repr__(self):
        return f'<ContactRequest {self.id} from User {self.requester_id} to User {self.target_id}>'

    def accept(self):
        """接受申請"""
        self.status = 'accepted'
        self.responded_at = datetime.utcnow()

    def reject(self):
        """拒絕申請"""
        self.status = 'rejected'
        self.responded_at = datetime.utcnow()

    def to_dict(self, include_private=False):
        """轉換為字典"""
        data = {
            'id': self.id,
            'requester_id': self.requester_id,
            'target_id': self.target_id,
            'message': self.message,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
        }

        # 附帶申請者基本資訊
        if self.requester:
            requester_profile = self.requester.profile
            data['requester'] = {
                'id': self.requester.id,
                'email': self.requester.email,
                'full_name': requester_profile.full_name if requester_profile else None,
                'display_name': requester_profile.display_name if requester_profile else None,
                'avatar_url': requester_profile.avatar_url if requester_profile else None,
                'current_company': requester_profile.current_company if requester_profile else None,
                'current_position': requester_profile.current_position if requester_profile else None,
            }

        # 附帶目標對象基本資訊
        if self.target:
            target_profile = self.target.profile
            data['target'] = {
                'id': self.target.id,
                'email': self.target.email,
                'full_name': target_profile.full_name if target_profile else None,
                'display_name': target_profile.display_name if target_profile else None,
                'avatar_url': target_profile.avatar_url if target_profile else None,
                'current_company': target_profile.current_company if target_profile else None,
                'current_position': target_profile.current_position if target_profile else None,
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
            requester_id=int(row_data.get('申請者ID')),
            target_id=int(row_data.get('目標ID')),
            message=row_data.get('附言'),
            status=row_data.get('狀態', 'pending')
        )

    def to_sheet_row(self):
        """轉換為 Google Sheets 格式"""
        return {
            'ID': self.id,
            '申請者': self.requester.profile.full_name if self.requester and self.requester.profile else '',
            '目標': self.target.profile.full_name if self.target and self.target.profile else '',
            '附言': self.message or '',
            '狀態': self.status,
            '建立時間': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else '',
            '回應時間': self.responded_at.strftime('%Y-%m-%d %H:%M') if self.responded_at else '',
        }
