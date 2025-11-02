"""
環節 1: 使用者與認證模型
User & Authentication Models
"""
from .base import db, BaseModel, String, Integer, Boolean, Text, DateTime, ForeignKey, relationship
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import secrets


class User(BaseModel):
    """使用者基本資料表"""
    __tablename__ = 'users_v2'
    
    id = db.Column(Integer, primary_key=True)
    
    # 認證資訊
    email = db.Column(String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(String(255), nullable=False)
    
    # 角色與狀態
    role = db.Column(String(50), default='user', nullable=False)  # user, admin, moderator
    status = db.Column(String(50), default='active', nullable=False)  # active, inactive, suspended
    
    # 驗證狀態
    email_verified = db.Column(Boolean, default=False, nullable=False)
    verification_token = db.Column(String(255), nullable=True)
    
    # 登入記錄
    last_login_at = db.Column(DateTime, nullable=True)
    login_count = db.Column(Integer, default=0, nullable=False)
    
    # 關聯
    profile = relationship('UserProfile', back_populates='user', uselist=False, cascade='all, delete-orphan')
    sessions = relationship('UserSession', back_populates='user', cascade='all, delete-orphan')
    work_experiences = relationship('WorkExperience', back_populates='user', cascade='all, delete-orphan')
    skills = relationship('UserSkill', back_populates='user', cascade='all, delete-orphan')
    jobs = relationship('Job', foreign_keys='Job.user_id', back_populates='user')
    job_requests = relationship('JobRequest', foreign_keys='JobRequest.requester_id', back_populates='requester')
    organized_events = relationship('Event', foreign_keys='Event.organizer_id', back_populates='organizer')
    event_registrations = relationship('EventRegistration', back_populates='user', cascade='all, delete-orphan')
    bulletins = relationship('Bulletin', back_populates='author')
    notifications = relationship('Notification', back_populates='user', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """設定密碼(加密)"""
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')
    
    def check_password(self, password):
        """驗證密碼"""
        return check_password_hash(self.password_hash, password)
    
    def generate_verification_token(self):
        """生成電子郵件驗證 token"""
        self.verification_token = secrets.token_urlsafe(32)
        return self.verification_token
    
    def verify_email(self, token):
        """驗證電子郵件"""
        if self.verification_token == token:
            self.email_verified = True
            self.verification_token = None
            return True
        return False
    
    def record_login(self):
        """記錄登入"""
        self.last_login_at = datetime.utcnow()
        self.login_count += 1
    
    @property
    def name(self):
        """取得使用者名稱（從 profile）"""
        if self.profile:
            return self.profile.display_name or self.profile.full_name
        return self.email.split('@')[0]  # 預設使用 email 前綴
    
    def to_dict(self, include_private=False):
        """轉換為字典"""
        data = {
            'id': self.id,
            'email': self.email if include_private else None,
            'role': self.role,
            'status': self.status,
            'email_verified': self.email_verified,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None,
            'created_at': self.created_at.isoformat(),
        }
        if self.profile:
            data['profile'] = self.profile.to_dict(include_private)
        return data
    
    @classmethod
    def from_sheet_row(cls, row_data):
        """從 Google Sheets 匯入"""
        return cls(
            email=row_data.get('電子郵件'),
            role=row_data.get('角色', 'user'),
            status=row_data.get('狀態', 'active'),
            email_verified=row_data.get('已驗證', False)
        )
    
    def to_sheet_row(self):
        """匯出到 Google Sheets"""
        return {
            'ID': self.id,
            '電子郵件': self.email,
            '角色': self.role,
            '狀態': self.status,
            '已驗證': '是' if self.email_verified else '否',
            '最後登入': self.last_login_at.strftime('%Y-%m-%d %H:%M') if self.last_login_at else '',
            '註冊日期': self.created_at.strftime('%Y-%m-%d'),
        }


class UserProfile(BaseModel):
    """使用者詳細檔案表"""
    __tablename__ = 'user_profiles_v2'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'), unique=True, nullable=False)
    
    # 基本資料
    full_name = db.Column(String(100), nullable=True)
    display_name = db.Column(String(100), nullable=True)
    avatar_url = db.Column(String(500), nullable=True)
    phone = db.Column(String(20), nullable=True)
    
    # 畢業資訊
    graduation_year = db.Column(Integer, nullable=True)
    degree = db.Column(String(50), nullable=True)  # bachelor, master, phd
    major = db.Column(String(100), nullable=True)
    student_id = db.Column(String(50), nullable=True)
    
    # 目前狀態
    current_company = db.Column(String(200), nullable=True)
    current_position = db.Column(String(200), nullable=True)
    current_location = db.Column(String(200), nullable=True)
    employment_status = db.Column(String(50), nullable=True)  # employed, unemployed, student, freelance
    
    # 個人簡介
    bio = db.Column(Text, nullable=True)
    personal_website = db.Column(String(500), nullable=True)
    linkedin_url = db.Column(String(500), nullable=True)
    github_url = db.Column(String(500), nullable=True)
    
    # 隱私設定
    profile_visibility = db.Column(String(50), default='public', nullable=False)  # public, alumni_only, private
    show_email = db.Column(Boolean, default=True, nullable=False)
    show_phone = db.Column(Boolean, default=False, nullable=False)
    
    # 通知偏好設定（JSON 格式存儲）
    notification_preferences = db.Column(Text, nullable=True)  # JSON string: {"emailNotifications": true, "jobAlerts": true, ...}
    
    # 關聯
    user = relationship('User', back_populates='profile')
    
    def to_dict(self, include_private=False):
        """轉換為字典"""
        data = {
            'id': self.id,
            'full_name': self.full_name,
            'display_name': self.display_name,
            'avatar_url': self.avatar_url,
            'graduation_year': self.graduation_year,
            'degree': self.degree,
            'major': self.major,
            'current_company': self.current_company,
            'current_position': self.current_position,
            'current_location': self.current_location,
            'employment_status': self.employment_status,
            'bio': self.bio,
            'personal_website': self.personal_website,
            'linkedin_url': self.linkedin_url,
            'github_url': self.github_url,
        }
        
        if include_private or self.show_email:
            data['email'] = self.user.email if self.user else None
        if include_private or self.show_phone:
            data['phone'] = self.phone
            
        return data
    
    @classmethod
    def from_sheet_row(cls, row_data):
        """從 Google Sheets 匯入"""
        return cls(
            full_name=row_data.get('姓名'),
            graduation_year=row_data.get('畢業年份'),
            degree=row_data.get('學位'),
            major=row_data.get('主修'),
            current_company=row_data.get('目前公司'),
            current_position=row_data.get('職位'),
            current_location=row_data.get('所在地'),
            phone=row_data.get('聯絡電話'),
            linkedin_url=row_data.get('LinkedIn'),
        )
    
    def to_sheet_row(self):
        """匯出到 Google Sheets"""
        return {
            'ID': self.id,
            '使用者ID': self.user_id,
            '姓名': self.full_name or '',
            '畢業年份': self.graduation_year or '',
            '學位': self.degree or '',
            '主修': self.major or '',
            '目前公司': self.current_company or '',
            '職位': self.current_position or '',
            '所在地': self.current_location or '',
            '聯絡電話': self.phone or '',
            'LinkedIn': self.linkedin_url or '',
            '更新日期': self.updated_at.strftime('%Y-%m-%d'),
        }


class UserSession(BaseModel):
    """使用者登入會話表"""
    __tablename__ = 'user_sessions_v2'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'), nullable=False)
    
    # 會話資訊
    session_token = db.Column(String(255), unique=True, nullable=False, index=True)
    refresh_token = db.Column(String(255), unique=True, nullable=True)
    
    # 裝置與瀏覽器資訊
    ip_address = db.Column(String(45), nullable=True)  # IPv6 support
    user_agent = db.Column(Text, nullable=True)
    device_type = db.Column(String(50), nullable=True)  # desktop, mobile, tablet
    
    # 會話狀態
    is_active = db.Column(Boolean, default=True, nullable=False)
    expires_at = db.Column(DateTime, nullable=False)
    last_activity_at = db.Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # 關聯
    user = relationship('User', back_populates='sessions')
    
    @classmethod
    def create_session(cls, user_id, expires_in_days=7):
        """建立新會話"""
        from datetime import timedelta
        session = cls(
            user_id=user_id,
            session_token=secrets.token_urlsafe(32),
            refresh_token=secrets.token_urlsafe(32),
            expires_at=datetime.utcnow() + timedelta(days=expires_in_days)
        )
        return session
    
    def is_expired(self):
        """檢查是否過期"""
        return datetime.utcnow() > self.expires_at
    
    def invalidate(self):
        """使會話失效"""
        self.is_active = False
    
    def update_activity(self):
        """更新活動時間"""
        self.last_activity_at = datetime.utcnow()
