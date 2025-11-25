"""
文章評論模型
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel, db, enum_type
import enum


class CommentStatus(enum.Enum):
    """評論狀態"""
    APPROVED = "approved"      # 已審核
    PENDING = "pending"        # 待審核
    REJECTED = "rejected"      # 已拒絕
    HIDDEN = "hidden"          # 已隱藏


class ArticleComment(BaseModel):
    """文章評論"""
    __tablename__ = 'article_comments_v2'

    article_id = Column(Integer, ForeignKey('articles_v2.id', ondelete='CASCADE'),
                       nullable=False, comment='文章ID')
    user_id = Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'),
                    nullable=False, comment='評論者ID')
    parent_id = Column(Integer, ForeignKey('article_comments_v2.id', ondelete='CASCADE'),
                      comment='父評論ID（用於回覆）')

    content = Column(Text, nullable=False, comment='評論內容')
    status = Column(enum_type(CommentStatus), default=CommentStatus.PENDING,
                   comment='評論狀態')
    likes_count = Column(Integer, default=0, comment='按讚數')

    # 關聯
    article = relationship('Article', backref='comments')
    user = relationship('User', foreign_keys=[user_id])
    parent = relationship('ArticleComment', remote_side='ArticleComment.id',
                         backref='replies')

    def __repr__(self):
        return f'<ArticleComment {self.id}>'

    def to_dict(self, include_private=False):
        """轉換為字典"""
        data = {
            'id': self.id,
            'article_id': self.article_id,
            'user_id': self.user_id,
            'user_name': self.user.profile.full_name if self.user and self.user.profile else '未知',
            'user_email': self.user.email if self.user else None,
            'parent_id': self.parent_id,
            'content': self.content,
            'status': self.status.value if self.status else None,
            'likes_count': self.likes_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

        if include_private:
            data.update({
                'sheet_row_id': self.sheet_row_id,
                'last_synced_at': self.last_synced_at.isoformat() if self.last_synced_at else None
            })

        return data



