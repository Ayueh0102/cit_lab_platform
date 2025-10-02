"""
環節 3: 職缺與媒合系統
包含職缺發布、分類、交流請求等功能
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
import enum
from .base import BaseModel, db


# ========================================
# 職缺狀態枚舉
# ========================================
class JobStatus(enum.Enum):
    """職缺狀態"""
    ACTIVE = "active"          # 開放中
    CLOSED = "closed"          # 已關閉
    FILLED = "filled"          # 已徵到人
    EXPIRED = "expired"        # 已過期
    DRAFT = "draft"            # 草稿


class JobType(enum.Enum):
    """職缺類型"""
    FULL_TIME = "full_time"    # 全職
    PART_TIME = "part_time"    # 兼職
    CONTRACT = "contract"      # 約聘
    INTERN = "intern"          # 實習
    FREELANCE = "freelance"    # 自由接案


class RequestStatus(enum.Enum):
    """交流請求狀態"""
    PENDING = "pending"        # 待處理
    APPROVED = "approved"      # 已同意
    REJECTED = "rejected"      # 已拒絕
    CANCELLED = "cancelled"    # 已取消


# ========================================
# 職缺分類
# ========================================
class JobCategory(BaseModel):
    """職缺分類"""
    __tablename__ = 'job_categories_v2'

    name = Column(String(100), nullable=False, unique=True, comment='分類名稱')
    name_en = Column(String(100), comment='英文名稱')
    description = Column(Text, comment='分類描述')
    icon = Column(String(50), comment='圖示代碼')
    color = Column(String(20), comment='顯示顏色')
    sort_order = Column(Integer, default=0, comment='排序順序')
    is_active = Column(Boolean, default=True, comment='是否啟用')

    # 關聯
    jobs = relationship('Job', back_populates='category', lazy='dynamic')

    def __repr__(self):
        return f'<JobCategory {self.name}>'

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
            'job_count': self.jobs.count() if hasattr(self, 'jobs') else 0,
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
            '職缺數量': self.jobs.count() if hasattr(self, 'jobs') else 0,
            '啟用': '是' if self.is_active else '否',
            '建立日期': self.created_at.strftime('%Y-%m-%d') if self.created_at else '',
            '更新日期': self.updated_at.strftime('%Y-%m-%d') if self.updated_at else ''
        }


# ========================================
# 職缺資訊
# ========================================
class Job(BaseModel):
    """職缺資訊"""
    __tablename__ = 'jobs_v2'

    # 基本資訊
    user_id = Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'),
                     nullable=False, comment='發布者ID')
    category_id = Column(Integer, ForeignKey('job_categories_v2.id', ondelete='SET NULL'),
                         comment='分類ID')

    title = Column(String(200), nullable=False, comment='職缺標題')
    company = Column(String(200), nullable=False, comment='公司名稱')
    company_website = Column(String(500), comment='公司網站')
    company_logo_url = Column(String(500), comment='公司 Logo URL')

    # 職缺詳情
    description = Column(Text, nullable=False, comment='職缺描述')
    requirements = Column(Text, comment='職位要求')
    responsibilities = Column(Text, comment='工作職責')
    benefits = Column(Text, comment='福利待遇')

    # 職缺屬性
    job_type = Column(Enum(JobType), default=JobType.FULL_TIME, comment='職缺類型')
    status = Column(Enum(JobStatus), default=JobStatus.ACTIVE, comment='職缺狀態')

    location = Column(String(200), comment='工作地點')
    is_remote = Column(Boolean, default=False, comment='是否遠端工作')

    salary_min = Column(Integer, comment='薪資下限(月薪)')
    salary_max = Column(Integer, comment='薪資上限(月薪)')
    salary_currency = Column(String(10), default='TWD', comment='薪資幣別')
    salary_negotiable = Column(Boolean, default=True, comment='薪資面議')

    # 其他資訊
    experience_years_min = Column(Integer, comment='最低經驗年數')
    experience_years_max = Column(Integer, comment='最高經驗年數')
    education_level = Column(String(50), comment='學歷要求')

    application_email = Column(String(255), comment='應徵信箱')
    application_url = Column(String(500), comment='應徵連結')

    views_count = Column(Integer, default=0, comment='瀏覽次數')
    requests_count = Column(Integer, default=0, comment='交流請求數')

    expires_at = Column(DateTime, comment='過期時間')
    published_at = Column(DateTime, comment='發布時間')

    # 關聯
    user = relationship('User', back_populates='jobs')
    category = relationship('JobCategory', back_populates='jobs')
    job_requests = relationship('JobRequest', back_populates='job',
                               cascade='all, delete-orphan', lazy='dynamic')

    def __repr__(self):
        return f'<Job {self.title} at {self.company}>'

    @property
    def is_expired(self):
        """檢查是否過期"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at

    @property
    def salary_range(self):
        """薪資範圍字串"""
        if self.salary_negotiable:
            return '面議'

        if self.salary_min and self.salary_max:
            return f'{self.salary_min:,}-{self.salary_max:,} {self.salary_currency}'
        elif self.salary_min:
            return f'{self.salary_min:,}+ {self.salary_currency}'
        else:
            return '未提供'

    def increment_views(self):
        """增加瀏覽次數"""
        self.views_count += 1
        db.session.commit()

    def increment_requests(self):
        """增加交流請求數"""
        self.requests_count += 1
        db.session.commit()

    def to_dict(self, include_private=False):
        """轉換為字典"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'category_id': self.category_id,
            'title': self.title,
            'company': self.company,
            'company_website': self.company_website,
            'company_logo_url': self.company_logo_url,
            'description': self.description,
            'requirements': self.requirements,
            'responsibilities': self.responsibilities,
            'benefits': self.benefits,
            'job_type': self.job_type.value if self.job_type else None,
            'status': self.status.value if self.status else None,
            'location': self.location,
            'is_remote': self.is_remote,
            'salary_range': self.salary_range,
            'salary_min': self.salary_min,
            'salary_max': self.salary_max,
            'salary_currency': self.salary_currency,
            'salary_negotiable': self.salary_negotiable,
            'experience_years_min': self.experience_years_min,
            'experience_years_max': self.experience_years_max,
            'education_level': self.education_level,
            'application_email': self.application_email,
            'application_url': self.application_url,
            'views_count': self.views_count,
            'requests_count': self.requests_count,
            'is_expired': self.is_expired,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        # 包含關聯資料
        if hasattr(self, 'user') and self.user:
            data['poster_name'] = self.user.name
            data['poster_email'] = self.user.email

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
            title=row_data.get('職缺標題'),
            company=row_data.get('公司名稱'),
            description=row_data.get('職缺描述'),
            location=row_data.get('地點'),
            job_type=JobType[row_data.get('類型', 'FULL_TIME')],
            status=JobStatus[row_data.get('狀態', 'ACTIVE')]
        )

    def to_sheet_row(self):
        """轉換為 Google Sheets 格式"""
        return {
            'ID': self.id,
            '發布者': self.user.name if hasattr(self, 'user') and self.user else '',
            '職缺標題': self.title,
            '公司名稱': self.company,
            '地點': self.location or '',
            '薪資範圍': self.salary_range,
            '類型': self.job_type.value if self.job_type else '',
            '狀態': self.status.value if self.status else '',
            '遠端工作': '是' if self.is_remote else '否',
            '瀏覽次數': self.views_count,
            '交流請求數': self.requests_count,
            '發布日期': self.published_at.strftime('%Y-%m-%d') if self.published_at else '',
            '過期日期': self.expires_at.strftime('%Y-%m-%d') if self.expires_at else '',
            '建立日期': self.created_at.strftime('%Y-%m-%d') if self.created_at else ''
        }


# ========================================
# 職缺交流請求
# ========================================
class JobRequest(BaseModel):
    """職缺交流請求"""
    __tablename__ = 'job_requests_v2'

    job_id = Column(Integer, ForeignKey('jobs_v2.id', ondelete='CASCADE'),
                    nullable=False, comment='職缺ID')
    requester_id = Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'),
                          nullable=False, comment='請求者ID')

    message = Column(Text, comment='請求訊息')
    status = Column(Enum(RequestStatus), default=RequestStatus.PENDING, comment='請求狀態')

    responded_at = Column(DateTime, comment='回覆時間')
    response_message = Column(Text, comment='回覆訊息')

    # 關聯
    job = relationship('Job', back_populates='job_requests')
    requester = relationship('User', foreign_keys=[requester_id],
                            backref='sent_job_requests')

    def __repr__(self):
        return f'<JobRequest {self.id} for Job {self.job_id}>'

    def approve(self, response_message=None):
        """同意請求"""
        self.status = RequestStatus.APPROVED
        self.responded_at = datetime.utcnow()
        if response_message:
            self.response_message = response_message
        db.session.commit()

    def reject(self, response_message=None):
        """拒絕請求"""
        self.status = RequestStatus.REJECTED
        self.responded_at = datetime.utcnow()
        if response_message:
            self.response_message = response_message
        db.session.commit()

    def cancel(self):
        """取消請求"""
        self.status = RequestStatus.CANCELLED
        db.session.commit()

    def to_dict(self, include_private=False):
        """轉換為字典"""
        data = {
            'id': self.id,
            'job_id': self.job_id,
            'requester_id': self.requester_id,
            'message': self.message,
            'status': self.status.value if self.status else None,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
            'response_message': self.response_message,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        # 包含關聯資料
        if hasattr(self, 'job') and self.job:
            data['job_title'] = self.job.title
            data['company'] = self.job.company

        if hasattr(self, 'requester') and self.requester:
            data['requester_name'] = self.requester.name
            data['requester_email'] = self.requester.email

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
            message=row_data.get('請求訊息'),
            status=RequestStatus[row_data.get('狀態', 'PENDING')]
        )

    def to_sheet_row(self):
        """轉換為 Google Sheets 格式"""
        return {
            'ID': self.id,
            '職缺ID': self.job_id,
            '職缺標題': self.job.title if hasattr(self, 'job') and self.job else '',
            '請求者': self.requester.name if hasattr(self, 'requester') and self.requester else '',
            '請求訊息': self.message or '',
            '狀態': self.status.value if self.status else '',
            '回覆訊息': self.response_message or '',
            '請求時間': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else '',
            '回覆時間': self.responded_at.strftime('%Y-%m-%d %H:%M') if self.responded_at else ''
        }
