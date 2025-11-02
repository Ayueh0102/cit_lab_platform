"""
文章分類模型擴展
為 Article 添加分類支援
"""

from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel, db


class ArticleCategory(BaseModel):
    """文章分類"""
    __tablename__ = 'article_categories_v2'

    name = Column(db.String(100), nullable=False, unique=True, comment='分類名稱')
    name_en = Column(db.String(100), comment='英文名稱')
    description = Column(db.Text, comment='分類描述')
    icon = Column(db.String(50), comment='圖示代碼')
    color = Column(db.String(20), comment='顯示顏色')
    sort_order = Column(db.Integer, default=0, comment='排序順序')
    is_active = Column(db.Boolean, default=True, comment='是否啟用')

    # 關聯
    articles = relationship('Article', back_populates='category', lazy='dynamic')

    def __repr__(self):
        return f'<ArticleCategory {self.name}>'

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
            'article_count': self.articles.count() if hasattr(self, 'articles') else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_private:
            data.update({
                'sheet_row_id': self.sheet_row_id,
                'last_synced_at': self.last_synced_at.isoformat() if self.last_synced_at else None
            })

        return data


# 更新 Article 模型以添加分類支援
# 需要在 content.py 中添加 category_id 欄位和關聯

