"""
環節 6: 內容管理系統
包含公告、文章、分類等功能
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
import enum
from .base import BaseModel, db


# ========================================
# 內容狀態枚舉
# ========================================
class ContentStatus(enum.Enum):
    """內容狀態"""
    PUBLISHED = "published"    # 已發布
    DRAFT = "draft"            # 草稿
    ARCHIVED = "archived"      # 已封存
    SCHEDULED = "scheduled"    # 排程發布


class BulletinType(enum.Enum):
    """公告類型"""
    ANNOUNCEMENT = "announcement"  # 系友會公告
    NEWS = "news"                  # 系友動態
    ACADEMIC = "academic"          # 學術新知
    EVENT = "event"                # 活動公告
    JOB = "job"                    # 職缺公告
    OTHER = "other"                # 其他


class CommentStatus(enum.Enum):
    """留言狀態"""
    APPROVED = "approved"      # 已核准
    PENDING = "pending"        # 待審核
    REJECTED = "rejected"      # 已拒絕
    HIDDEN = "hidden"          # 已隱藏


# ========================================
# 公告分類
# ========================================
class BulletinCategory(BaseModel):
    """公告分類"""
    __tablename__ = 'bulletin_categories_v2'

    name = Column(String(100), nullable=False, unique=True, comment='分類名稱')
    name_en = Column(String(100), comment='英文名稱')
    description = Column(Text, comment='分類描述')
    icon = Column(String(50), comment='圖示代碼')
    color = Column(String(20), comment='顯示顏色')
    sort_order = Column(Integer, default=0, comment='排序順序')
    is_active = Column(Boolean, default=True, comment='是否啟用')

    # 關聯
    bulletins = relationship('Bulletin', back_populates='category', lazy='dynamic')

    def __repr__(self):
        return f'<BulletinCategory {self.name}>'

    def to_dict(self, include_private=False):
        """轉換為字典"""
        data = {
            'id': self.id,
            'name': self.name,
            'name_en': self.name_en,
            'description': self.description,
            'icon': self.icon,
            'color': self.color,
            'sort_order': self.sort_order,
            'is_active': self.is_active,
            'bulletin_count': self.bulletins.count() if hasattr(self, 'bulletins') else 0,
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
            name=row_data.get('分類名稱'),
            name_en=row_data.get('英文名稱'),
            description=row_data.get('描述'),
            icon=row_data.get('圖示'),
            color=row_data.get('顏色'),
            sort_order=int(row_data.get('排序', 0)),
            is_active=row_data.get('啟用') == '是'
        )

    def to_sheet_row(self):
        """轉換為 Google Sheets 格式"""
        return {
            'ID': self.id,
            '分類名稱': self.name,
            '英文名稱': self.name_en or '',
            '描述': self.description or '',
            '圖示': self.icon or '',
            '顏色': self.color or '',
            '排序': self.sort_order,
            '公告數量': self.bulletins.count() if hasattr(self, 'bulletins') else 0,
            '啟用': '是' if self.is_active else '否',
            '建立日期': self.created_at.strftime('%Y-%m-%d') if self.created_at else '',
            '更新日期': self.updated_at.strftime('%Y-%m-%d') if self.updated_at else ''
        }


# ========================================
# 公告/公佈欄
# ========================================
class Bulletin(BaseModel):
    """公告/公佈欄"""
    __tablename__ = 'bulletins_v2'

    # 基本資訊
    author_id = Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'),
                      nullable=False, comment='作者ID')
    category_id = Column(Integer, ForeignKey('bulletin_categories_v2.id', ondelete='SET NULL'),
                        comment='分類ID')

    title = Column(String(200), nullable=False, comment='標題')
    subtitle = Column(String(200), comment='副標題')
    content = Column(Text, nullable=False, comment='內容')
    summary = Column(Text, comment='摘要')

    # 內容屬性
    bulletin_type = Column(Enum(BulletinType), default=BulletinType.ANNOUNCEMENT,
                          comment='公告類型')
    status = Column(Enum(ContentStatus), default=ContentStatus.PUBLISHED,
                   comment='發布狀態')

    # 媒體資源
    cover_image_url = Column(String(500), comment='封面圖片 URL')
    attachment_url = Column(String(500), comment='附件 URL')
    attachment_name = Column(String(200), comment='附件名稱')

    # 標籤與分類
    tags = Column(String(500), comment='標籤(逗號分隔)')

    # 顯示設定
    is_pinned = Column(Boolean, default=False, comment='是否置頂')
    is_featured = Column(Boolean, default=False, comment='是否精選')
    allow_comments = Column(Boolean, default=True, comment='是否允許留言')

    # 統計資訊
    views_count = Column(Integer, default=0, comment='瀏覽次數')
    likes_count = Column(Integer, default=0, comment='按讚數')
    comments_count = Column(Integer, default=0, comment='留言數')

    # 發布時間
    published_at = Column(DateTime, comment='發布時間')
    scheduled_at = Column(DateTime, comment='排程發布時間')
    archived_at = Column(DateTime, comment='封存時間')

    # 關聯
    author = relationship('User', back_populates='bulletins')
    category = relationship('BulletinCategory', back_populates='bulletins')
    comments = relationship('BulletinComment', back_populates='bulletin',
                          cascade='all, delete-orphan', lazy='dynamic')

    def __repr__(self):
        return f'<Bulletin {self.title}>'

    @property
    def is_published(self):
        """是否已發布"""
        return self.status == ContentStatus.PUBLISHED

    def publish(self):
        """發布公告"""
        self.status = ContentStatus.PUBLISHED
        if not self.published_at:
            self.published_at = datetime.utcnow()
        db.session.commit()

    def archive(self):
        """封存公告"""
        self.status = ContentStatus.ARCHIVED
        self.archived_at = datetime.utcnow()
        db.session.commit()

    def pin(self):
        """置頂"""
        self.is_pinned = True
        db.session.commit()

    def unpin(self):
        """取消置頂"""
        self.is_pinned = False
        db.session.commit()

    def increment_views(self):
        """增加瀏覽次數"""
        self.views_count += 1
        db.session.commit()

    def increment_likes(self):
        """增加按讚數"""
        self.likes_count += 1
        db.session.commit()

    def decrement_likes(self):
        """減少按讚數"""
        if self.likes_count > 0:
            self.likes_count -= 1
            db.session.commit()

    def increment_comments(self):
        """增加留言數"""
        self.comments_count += 1
        db.session.commit()

    def decrement_comments(self):
        """減少留言數"""
        if self.comments_count > 0:
            self.comments_count -= 1
            db.session.commit()

    def to_dict(self, include_private=False):
        """轉換為字典"""
        data = {
            'id': self.id,
            'author_id': self.author_id,
            'category_id': self.category_id,
            'title': self.title,
            'subtitle': self.subtitle,
            'content': self.content,
            'summary': self.summary,
            'bulletin_type': self.bulletin_type.value if self.bulletin_type else None,
            'status': self.status.value if self.status else None,
            'cover_image_url': self.cover_image_url,
            'attachment_url': self.attachment_url,
            'attachment_name': self.attachment_name,
            'tags': self.tags,
            'is_pinned': self.is_pinned,
            'is_featured': self.is_featured,
            'allow_comments': self.allow_comments,
            'views_count': self.views_count,
            'likes_count': self.likes_count,
            'comments_count': self.comments_count,
            'is_published': self.is_published,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'scheduled_at': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'archived_at': self.archived_at.isoformat() if self.archived_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        # 包含關聯資料
        if hasattr(self, 'author') and self.author:
            data['author_name'] = self.author.name
            data['author_email'] = self.author.email

        if hasattr(self, 'category') and self.category:
            data['category_name'] = self.category.name

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
            content=row_data.get('內容'),
            bulletin_type=BulletinType[row_data.get('類型', 'ANNOUNCEMENT')],
            status=ContentStatus[row_data.get('狀態', 'PUBLISHED')],
            is_pinned=row_data.get('置頂') == '是',
            is_featured=row_data.get('精選') == '是'
        )

    def to_sheet_row(self):
        """轉換為 Google Sheets 格式"""
        return {
            'ID': self.id,
            '標題': self.title,
            '作者': self.author.name if hasattr(self, 'author') and self.author else '',
            '分類': self.category.name if hasattr(self, 'category') and self.category else '',
            '類型': self.bulletin_type.value if self.bulletin_type else '',
            '狀態': self.status.value if self.status else '',
            '置頂': '是' if self.is_pinned else '否',
            '精選': '是' if self.is_featured else '否',
            '瀏覽次數': self.views_count,
            '按讚數': self.likes_count,
            '留言數': self.comments_count,
            '發布日期': self.published_at.strftime('%Y-%m-%d') if self.published_at else '',
            '建立日期': self.created_at.strftime('%Y-%m-%d') if self.created_at else ''
        }


# ========================================
# 公告留言
# ========================================
class BulletinComment(BaseModel):
    """公告留言"""
    __tablename__ = 'bulletin_comments_v2'

    bulletin_id = Column(Integer, ForeignKey('bulletins_v2.id', ondelete='CASCADE'),
                        nullable=False, comment='公告ID')
    user_id = Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'),
                    nullable=False, comment='留言者ID')
    parent_id = Column(Integer, ForeignKey('bulletin_comments_v2.id', ondelete='CASCADE'),
                      comment='上層留言ID (如果是回覆)')

    # 留言內容
    content = Column(Text, nullable=False, comment='留言內容')
    status = Column(Enum(CommentStatus), default=CommentStatus.APPROVED,
                   comment='留言狀態')

    # 統計
    likes_count = Column(Integer, default=0, comment='按讚數')

    # 審核資訊
    moderated_at = Column(DateTime, comment='審核時間')
    moderation_note = Column(Text, comment='審核備註')

    # 關聯
    bulletin = relationship('Bulletin', back_populates='comments')
    user = relationship('User', backref='bulletin_comments')
    parent = relationship('BulletinComment', remote_side='BulletinComment.id',
                         backref='replies')

    def __repr__(self):
        return f'<BulletinComment {self.id} on Bulletin {self.bulletin_id}>'

    @property
    def is_reply(self):
        """是否為回覆"""
        return self.parent_id is not None

    def approve(self):
        """核准留言"""
        self.status = CommentStatus.APPROVED
        self.moderated_at = datetime.utcnow()
        db.session.commit()

    def reject(self, note=None):
        """拒絕留言"""
        self.status = CommentStatus.REJECTED
        self.moderated_at = datetime.utcnow()
        if note:
            self.moderation_note = note
        db.session.commit()

    def hide(self):
        """隱藏留言"""
        self.status = CommentStatus.HIDDEN
        db.session.commit()

    def increment_likes(self):
        """增加按讚數"""
        self.likes_count += 1
        db.session.commit()

    def decrement_likes(self):
        """減少按讚數"""
        if self.likes_count > 0:
            self.likes_count -= 1
            db.session.commit()

    def to_dict(self, include_private=False):
        """轉換為字典"""
        data = {
            'id': self.id,
            'bulletin_id': self.bulletin_id,
            'user_id': self.user_id,
            'parent_id': self.parent_id,
            'content': self.content,
            'status': self.status.value if self.status else None,
            'likes_count': self.likes_count,
            'is_reply': self.is_reply,
            'moderated_at': self.moderated_at.isoformat() if self.moderated_at else None,
            'moderation_note': self.moderation_note,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        # 包含關聯資料
        if hasattr(self, 'user') and self.user:
            data['user_name'] = self.user.name
            data['user_email'] = self.user.email

        if hasattr(self, 'bulletin') and self.bulletin:
            data['bulletin_title'] = self.bulletin.title

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
            content=row_data.get('留言內容'),
            status=CommentStatus[row_data.get('狀態', 'APPROVED')]
        )

    def to_sheet_row(self):
        """轉換為 Google Sheets 格式"""
        return {
            'ID': self.id,
            '公告ID': self.bulletin_id,
            '公告標題': self.bulletin.title if hasattr(self, 'bulletin') and self.bulletin else '',
            '留言者': self.user.name if hasattr(self, 'user') and self.user else '',
            '留言內容': self.content,
            '狀態': self.status.value if self.status else '',
            '按讚數': self.likes_count,
            '是否回覆': '是' if self.is_reply else '否',
            '留言時間': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else ''
        }


# ========================================
# 文章/部落格 (可選功能)
# ========================================
class Article(BaseModel):
    """文章/部落格"""
    __tablename__ = 'articles_v2'

    # 基本資訊
    author_id = Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'),
                      nullable=False, comment='作者ID')

    title = Column(String(200), nullable=False, comment='標題')
    subtitle = Column(String(200), comment='副標題')
    content = Column(Text, nullable=False, comment='內容')
    summary = Column(Text, comment='摘要')

    # 文章屬性
    status = Column(Enum(ContentStatus), default=ContentStatus.DRAFT,
                   comment='發布狀態')

    # 媒體資源
    cover_image_url = Column(String(500), comment='封面圖片 URL')
    tags = Column(String(500), comment='標籤(逗號分隔)')

    # 統計資訊
    views_count = Column(Integer, default=0, comment='瀏覽次數')
    likes_count = Column(Integer, default=0, comment='按讚數')

    # 發布時間
    published_at = Column(DateTime, comment='發布時間')

    # 關聯
    author = relationship('User', backref='articles')

    def __repr__(self):
        return f'<Article {self.title}>'

    def publish(self):
        """發布文章"""
        self.status = ContentStatus.PUBLISHED
        if not self.published_at:
            self.published_at = datetime.utcnow()
        db.session.commit()

    def increment_views(self):
        """增加瀏覽次數"""
        self.views_count += 1
        db.session.commit()

    def to_dict(self, include_private=False):
        """轉換為字典"""
        data = {
            'id': self.id,
            'author_id': self.author_id,
            'title': self.title,
            'subtitle': self.subtitle,
            'content': self.content,
            'summary': self.summary,
            'status': self.status.value if self.status else None,
            'cover_image_url': self.cover_image_url,
            'tags': self.tags,
            'views_count': self.views_count,
            'likes_count': self.likes_count,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if hasattr(self, 'author') and self.author:
            data['author_name'] = self.author.name
            data['author_email'] = self.author.email

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
            content=row_data.get('內容'),
            status=ContentStatus[row_data.get('狀態', 'DRAFT')]
        )

    def to_sheet_row(self):
        """轉換為 Google Sheets 格式"""
        return {
            'ID': self.id,
            '標題': self.title,
            '作者': self.author.name if hasattr(self, 'author') and self.author else '',
            '狀態': self.status.value if self.status else '',
            '瀏覽次數': self.views_count,
            '按讚數': self.likes_count,
            '發布日期': self.published_at.strftime('%Y-%m-%d') if self.published_at else '',
            '建立日期': self.created_at.strftime('%Y-%m-%d') if self.created_at else ''
        }
