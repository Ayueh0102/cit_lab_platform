"""
環節 5: 活動管理系統
包含活動發布、報名、簽到等功能
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
import enum
from .base import BaseModel, db, enum_type


# ========================================
# 活動狀態枚舉
# ========================================
class EventStatus(enum.Enum):
    """活動狀態"""
    UPCOMING = "upcoming"      # 即將舉行
    ONGOING = "ongoing"        # 進行中
    COMPLETED = "completed"    # 已結束
    CANCELLED = "cancelled"    # 已取消
    DRAFT = "draft"            # 草稿


class EventType(enum.Enum):
    """活動類型"""
    SEMINAR = "seminar"           # 演講/講座
    NETWORKING = "networking"     # 系友聚會
    WORKSHOP = "workshop"         # 工作坊
    CAREER = "career"             # 職涯活動
    SOCIAL = "social"             # 社交活動
    ACADEMIC = "academic"         # 學術活動
    OTHER = "other"               # 其他


class RegistrationStatus(enum.Enum):
    """報名狀態"""
    REGISTERED = "registered"  # 已報名
    ATTENDED = "attended"      # 已參加
    CANCELLED = "cancelled"    # 已取消
    WAITLIST = "waitlist"      # 候補


# ========================================
# 活動分類
# ========================================
class EventCategory(BaseModel):
    """活動分類"""
    __tablename__ = 'event_categories_v2'

    name = Column(String(100), nullable=False, unique=True, comment='分類名稱')
    name_en = Column(String(100), comment='英文名稱')
    description = Column(Text, comment='分類描述')
    icon = Column(String(50), comment='圖示代碼')
    color = Column(String(20), comment='顯示顏色')
    sort_order = Column(Integer, default=0, comment='排序順序')
    is_active = Column(Boolean, default=True, comment='是否啟用')

    # 關聯
    events = relationship('Event', back_populates='category', lazy='dynamic')

    def __repr__(self):
        return f'<EventCategory {self.name}>'

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
            'event_count': self.events.count() if hasattr(self, 'events') else 0,
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
            '活動數量': self.events.count() if hasattr(self, 'events') else 0,
            '啟用': '是' if self.is_active else '否',
            '建立日期': self.created_at.strftime('%Y-%m-%d') if self.created_at else '',
            '更新日期': self.updated_at.strftime('%Y-%m-%d') if self.updated_at else ''
        }


# ========================================
# 活動資訊
# ========================================
class Event(BaseModel):
    """活動資訊"""
    __tablename__ = 'events_v2'

    # 基本資訊
    organizer_id = Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'),
                         nullable=False, comment='主辦者ID')
    category_id = Column(Integer, ForeignKey('event_categories_v2.id', ondelete='SET NULL'),
                        comment='分類ID')

    title = Column(String(200), nullable=False, comment='活動標題')
    subtitle = Column(String(200), comment='副標題')
    description = Column(Text, nullable=False, comment='活動描述')

    # 活動屬性
    event_type = Column(enum_type(EventType), default=EventType.OTHER, comment='活動類型')
    status = Column(enum_type(EventStatus), default=EventStatus.UPCOMING, comment='活動狀態')

    # 時間與地點
    start_time = Column(DateTime, nullable=False, comment='開始時間')
    end_time = Column(DateTime, nullable=False, comment='結束時間')
    location = Column(String(200), comment='活動地點')
    location_detail = Column(Text, comment='地點詳細資訊')
    is_online = Column(Boolean, default=False, comment='是否線上活動')
    online_url = Column(String(500), comment='線上會議連結')

    # 報名資訊
    max_participants = Column(Integer, comment='人數上限')
    current_participants = Column(Integer, default=0, comment='目前報名人數')
    allow_waitlist = Column(Boolean, default=True, comment='是否開放候補')
    waitlist_count = Column(Integer, default=0, comment='候補人數')

    registration_start = Column(DateTime, comment='報名開始時間')
    registration_end = Column(DateTime, comment='報名截止時間')
    require_approval = Column(Boolean, default=False, comment='是否需要審核')

    # 其他資訊
    cover_image_url = Column(String(500), comment='封面圖片 URL')
    tags = Column(String(500), comment='標籤(逗號分隔)')

    fee = Column(Integer, default=0, comment='報名費用')
    fee_currency = Column(String(10), default='TWD', comment='幣別')
    is_free = Column(Boolean, default=True, comment='是否免費')

    contact_name = Column(String(100), comment='聯絡人姓名')
    contact_email = Column(String(255), comment='聯絡信箱')
    contact_phone = Column(String(20), comment='聯絡電話')

    views_count = Column(Integer, default=0, comment='瀏覽次數')

    published_at = Column(DateTime, comment='發布時間')
    cancelled_at = Column(DateTime, comment='取消時間')
    cancellation_reason = Column(Text, comment='取消原因')

    # 關聯
    organizer = relationship('User', back_populates='organized_events')
    category = relationship('EventCategory', back_populates='events')
    registrations = relationship('EventRegistration', back_populates='event',
                                cascade='all, delete-orphan', lazy='dynamic')

    def __repr__(self):
        return f'<Event {self.title}>'

    @property
    def is_full(self):
        """是否已額滿"""
        if not self.max_participants:
            return False
        return self.current_participants >= self.max_participants

    @property
    def available_seats(self):
        """剩餘名額"""
        if not self.max_participants:
            return None
        return max(0, self.max_participants - self.current_participants)

    @property
    def registration_open(self):
        """報名是否開放"""
        now = datetime.utcnow()
        if self.registration_start and now < self.registration_start:
            return False
        if self.registration_end and now > self.registration_end:
            return False
        return self.status in [EventStatus.UPCOMING, EventStatus.ONGOING]

    @property
    def occupancy_rate(self):
        """報名率"""
        if not self.max_participants or self.max_participants == 0:
            return 0
        return round((self.current_participants / self.max_participants) * 100, 1)

    def increment_views(self):
        """增加瀏覽次數"""
        self.views_count += 1
        db.session.commit()

    def increment_participants(self):
        """增加報名人數"""
        self.current_participants += 1
        db.session.commit()

    def decrement_participants(self):
        """減少報名人數"""
        if self.current_participants > 0:
            self.current_participants -= 1
            db.session.commit()

    def increment_waitlist(self):
        """增加候補人數"""
        self.waitlist_count += 1
        db.session.commit()

    def decrement_waitlist(self):
        """減少候補人數"""
        if self.waitlist_count > 0:
            self.waitlist_count -= 1
            db.session.commit()

    def cancel(self, reason=None):
        """取消活動"""
        self.status = EventStatus.CANCELLED
        self.cancelled_at = datetime.utcnow()
        if reason:
            self.cancellation_reason = reason
        db.session.commit()

    def to_dict(self, include_private=False):
        """轉換為字典"""
        data = {
            'id': self.id,
            'organizer_id': self.organizer_id,
            'category_id': self.category_id,
            'title': self.title,
            'subtitle': self.subtitle,
            'description': self.description,
            'event_type': self.event_type.value if self.event_type else None,
            'status': self.status.value if self.status else None,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'location': self.location,
            'location_detail': self.location_detail,
            'is_online': self.is_online,
            'online_url': self.online_url,
            'max_participants': self.max_participants,
            'current_participants': self.current_participants,
            'available_seats': self.available_seats,
            'allow_waitlist': self.allow_waitlist,
            'waitlist_count': self.waitlist_count,
            'registration_start': self.registration_start.isoformat() if self.registration_start else None,
            'registration_end': self.registration_end.isoformat() if self.registration_end else None,
            'require_approval': self.require_approval,
            'cover_image_url': self.cover_image_url,
            'tags': self.tags,
            'fee': self.fee,
            'fee_currency': self.fee_currency,
            'is_free': self.is_free,
            'contact_name': self.contact_name,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone,
            'views_count': self.views_count,
            'is_full': self.is_full,
            'registration_open': self.registration_open,
            'occupancy_rate': self.occupancy_rate,
            'published_at': self.published_at.isoformat() if self.published_at else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'cancellation_reason': self.cancellation_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        # 包含關聯資料
        if hasattr(self, 'organizer') and self.organizer:
            data['organizer_name'] = self.organizer.name
            data['organizer_email'] = self.organizer.email

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
            title=row_data.get('活動標題'),
            description=row_data.get('活動描述'),
            start_time=datetime.strptime(row_data.get('開始時間'), '%Y-%m-%d %H:%M') if row_data.get('開始時間') else None,
            end_time=datetime.strptime(row_data.get('結束時間'), '%Y-%m-%d %H:%M') if row_data.get('結束時間') else None,
            location=row_data.get('地點'),
            event_type=EventType[row_data.get('類型', 'OTHER')],
            status=EventStatus[row_data.get('狀態', 'UPCOMING')],
            max_participants=int(row_data.get('人數上限', 0)) if row_data.get('人數上限') else None,
            is_free=row_data.get('免費') == '是'
        )

    def to_sheet_row(self):
        """轉換為 Google Sheets 格式"""
        return {
            'ID': self.id,
            '活動標題': self.title,
            '主辦者': self.organizer.name if hasattr(self, 'organizer') and self.organizer else '',
            '開始時間': self.start_time.strftime('%Y-%m-%d %H:%M') if self.start_time else '',
            '結束時間': self.end_time.strftime('%Y-%m-%d %H:%M') if self.end_time else '',
            '地點': self.location or '',
            '類型': self.event_type.value if self.event_type else '',
            '狀態': self.status.value if self.status else '',
            '人數上限': self.max_participants or '',
            '已報名': self.current_participants,
            '候補': self.waitlist_count,
            '報名率': f'{self.occupancy_rate}%',
            '免費': '是' if self.is_free else '否',
            '費用': f'{self.fee} {self.fee_currency}' if not self.is_free else '',
            '瀏覽次數': self.views_count,
            '報名截止': self.registration_end.strftime('%Y-%m-%d') if self.registration_end else '',
            '發布日期': self.published_at.strftime('%Y-%m-%d') if self.published_at else '',
            '建立日期': self.created_at.strftime('%Y-%m-%d') if self.created_at else ''
        }


# ========================================
# 活動報名
# ========================================
class EventRegistration(BaseModel):
    """活動報名"""
    __tablename__ = 'event_registrations_v2'

    event_id = Column(Integer, ForeignKey('events_v2.id', ondelete='CASCADE'),
                     nullable=False, comment='活動ID')
    user_id = Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'),
                    nullable=False, comment='報名者ID')

    # 報名資訊
    status = Column(enum_type(RegistrationStatus), default=RegistrationStatus.REGISTERED,
                   comment='報名狀態')
    registration_note = Column(Text, comment='報名備註')

    # 審核資訊 (如需要審核)
    is_approved = Column(Boolean, default=True, comment='是否通過審核')
    approved_at = Column(DateTime, comment='審核時間')
    approval_note = Column(Text, comment='審核備註')

    # 簽到資訊
    checked_in = Column(Boolean, default=False, comment='是否已簽到')
    check_in_time = Column(DateTime, comment='簽到時間')

    # 取消資訊
    cancelled_at = Column(DateTime, comment='取消時間')
    cancellation_reason = Column(Text, comment='取消原因')

    # 關聯
    event = relationship('Event', back_populates='registrations')
    user = relationship('User', back_populates='event_registrations')

    def __repr__(self):
        return f'<EventRegistration {self.id} - Event {self.event_id} by User {self.user_id}>'

    def approve(self, note=None):
        """通過審核"""
        self.is_approved = True
        self.approved_at = datetime.utcnow()
        if note:
            self.approval_note = note
        db.session.commit()

    def reject(self, note=None):
        """拒絕審核"""
        self.is_approved = False
        self.approved_at = datetime.utcnow()
        if note:
            self.approval_note = note
        db.session.commit()

    def check_in(self):
        """簽到"""
        self.checked_in = True
        self.check_in_time = datetime.utcnow()
        self.status = RegistrationStatus.ATTENDED
        db.session.commit()

    def cancel(self, reason=None):
        """取消報名"""
        self.status = RegistrationStatus.CANCELLED
        self.cancelled_at = datetime.utcnow()
        if reason:
            self.cancellation_reason = reason
        db.session.commit()

    def to_dict(self, include_private=False):
        """轉換為字典"""
        data = {
            'id': self.id,
            'event_id': self.event_id,
            'user_id': self.user_id,
            'status': self.status.value if self.status else None,
            'registration_note': self.registration_note,
            'is_approved': self.is_approved,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'approval_note': self.approval_note,
            'checked_in': self.checked_in,
            'check_in_time': self.check_in_time.isoformat() if self.check_in_time else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'cancellation_reason': self.cancellation_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

        # 包含關聯資料
        if hasattr(self, 'event') and self.event:
            data['event_title'] = self.event.title
            data['event_start_time'] = self.event.start_time.isoformat() if self.event.start_time else None

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
            registration_note=row_data.get('報名備註'),
            status=RegistrationStatus[row_data.get('狀態', 'REGISTERED')],
            is_approved=row_data.get('通過審核') == '是',
            checked_in=row_data.get('已簽到') == '是'
        )

    def to_sheet_row(self):
        """轉換為 Google Sheets 格式"""
        return {
            'ID': self.id,
            '活動ID': self.event_id,
            '活動名稱': self.event.title if hasattr(self, 'event') and self.event else '',
            '報名者': self.user.name if hasattr(self, 'user') and self.user else '',
            '報名者信箱': self.user.email if hasattr(self, 'user') and self.user else '',
            '狀態': self.status.value if self.status else '',
            '通過審核': '是' if self.is_approved else '否',
            '已簽到': '是' if self.checked_in else '否',
            '報名時間': self.created_at.strftime('%Y-%m-%d %H:%M') if self.created_at else '',
            '簽到時間': self.check_in_time.strftime('%Y-%m-%d %H:%M') if self.check_in_time else '',
            '取消時間': self.cancelled_at.strftime('%Y-%m-%d %H:%M') if self.cancelled_at else '',
            '取消原因': self.cancellation_reason or ''
        }
