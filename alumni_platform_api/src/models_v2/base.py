"""
Base Models and Mixins
基礎類別與混入類,提供共用功能
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy import Column, Integer, DateTime

db = SQLAlchemy()


class TimestampMixin:
    """時間戳混入類 - 自動管理建立與更新時間"""
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class GoogleSheetsMixin:
    """Google Sheets 同步混入類"""
    sheet_row_id = Column(Integer, nullable=True, comment='對應 Google Sheets 的行號')
    last_synced_at = Column(DateTime, nullable=True, comment='最後同步時間')
    
    def mark_synced(self):
        """標記為已同步"""
        self.last_synced_at = datetime.utcnow()
    
    def needs_sync(self, threshold_minutes=5):
        """檢查是否需要同步"""
        if not self.last_synced_at:
            return True
        elapsed = (datetime.utcnow() - self.last_synced_at).total_seconds() / 60
        return elapsed > threshold_minutes


class BaseModel(db.Model, TimestampMixin, GoogleSheetsMixin):
    """抽象基礎模型 - 所有模型的父類"""
    __abstract__ = True
    
    def to_dict(self, include_private=False):
        """轉換為字典格式"""
        data = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # 處理日期時間格式
            if isinstance(value, datetime):
                data[column.name] = value.isoformat()
            else:
                data[column.name] = value
        return data
    
    def update_from_dict(self, data):
        """從字典更新屬性"""
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    @classmethod
    def from_sheet_row(cls, row_data):
        """從 Google Sheets 行資料建立實例"""
        # 子類需實作具體的欄位映射
        raise NotImplementedError("Subclass must implement from_sheet_row()")
    
    def to_sheet_row(self):
        """轉換為 Google Sheets 行格式"""
        # 子類需實作具體的欄位映射
        raise NotImplementedError("Subclass must implement to_sheet_row()")


class SoftDeleteMixin:
    """軟刪除混入類 - 標記刪除而非真正刪除"""
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(db.Boolean, default=False, nullable=False)
    
    def soft_delete(self):
        """執行軟刪除"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()
    
    def restore(self):
        """恢復已刪除的記錄"""
        self.is_deleted = False
        self.deleted_at = None


# 匯出常用類型別名
String = db.String
Integer = db.Integer
Boolean = db.Boolean
Text = db.Text
Date = db.Date
Time = db.Time
DateTime = db.DateTime
ForeignKey = db.ForeignKey
relationship = db.relationship
