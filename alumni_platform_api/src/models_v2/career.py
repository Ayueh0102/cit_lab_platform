"""
環節 2: 職涯與工作經歷模型
Career & Experience Models
"""
from .base import db, BaseModel, String, Integer, Boolean, Text, Date, ForeignKey, relationship
import json


class WorkExperience(BaseModel):
    """工作經歷表"""
    __tablename__ = 'work_experiences_v2'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'), nullable=False)
    
    # 公司資訊
    company_name = db.Column(String(200), nullable=False)
    company_website = db.Column(String(500), nullable=True)
    company_industry = db.Column(String(100), nullable=True)
    
    # 職位資訊
    position = db.Column(String(200), nullable=False)
    department = db.Column(String(100), nullable=True)
    location = db.Column(String(200), nullable=True)
    employment_type = db.Column(String(50), nullable=True)  # full_time, part_time, contract, internship
    
    # 任職時間
    start_date = db.Column(Date, nullable=False)
    end_date = db.Column(Date, nullable=True)
    is_current = db.Column(Boolean, default=False, nullable=False)
    
    # 工作內容
    description = db.Column(Text, nullable=True)
    achievements = db.Column(Text, nullable=True)  # JSON array
    technologies = db.Column(Text, nullable=True)  # JSON array
    
    # 關聯
    user = relationship('User', back_populates='work_experiences')
    
    def get_achievements_list(self):
        """取得成就列表"""
        if self.achievements:
            try:
                return json.loads(self.achievements)
            except:
                return []
        return []
    
    def set_achievements_list(self, achievements_list):
        """設定成就列表"""
        self.achievements = json.dumps(achievements_list, ensure_ascii=False)
    
    def get_technologies_list(self):
        """取得技術列表"""
        if self.technologies:
            try:
                return json.loads(self.technologies)
            except:
                return []
        return []
    
    def set_technologies_list(self, tech_list):
        """設定技術列表"""
        self.technologies = json.dumps(tech_list, ensure_ascii=False)
    
    def duration_months(self):
        """計算任職月數"""
        from datetime import date
        end = self.end_date if self.end_date else date.today()
        months = (end.year - self.start_date.year) * 12 + (end.month - self.start_date.month)
        return max(months, 0)
    
    @classmethod
    def from_sheet_row(cls, row_data):
        """從 Google Sheets 匯入"""
        from datetime import datetime
        return cls(
            company_name=row_data.get('公司名稱'),
            position=row_data.get('職位'),
            location=row_data.get('地點'),
            employment_type=row_data.get('類型'),
            start_date=datetime.strptime(row_data.get('開始日期'), '%Y-%m-%d').date(),
            end_date=datetime.strptime(row_data.get('結束日期'), '%Y-%m-%d').date() if row_data.get('結束日期') else None,
            is_current=row_data.get('目前在職') == '是',
            description=row_data.get('工作內容'),
        )
    
    def to_sheet_row(self):
        """匯出到 Google Sheets"""
        return {
            'ID': self.id,
            '使用者ID': self.user_id,
            '公司名稱': self.company_name,
            '職位': self.position,
            '地點': self.location or '',
            '類型': self.employment_type or '',
            '開始日期': self.start_date.strftime('%Y-%m-%d'),
            '結束日期': self.end_date.strftime('%Y-%m-%d') if self.end_date else '',
            '目前在職': '是' if self.is_current else '否',
            '任職月數': self.duration_months(),
            '工作內容': self.description or '',
        }


class Education(BaseModel):
    """教育背景表"""
    __tablename__ = 'educations_v2'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'), nullable=False)
    
    # 學校資訊
    school_name = db.Column(String(200), nullable=False)
    school_location = db.Column(String(200), nullable=True)
    school_website = db.Column(String(500), nullable=True)
    
    # 學位資訊
    degree = db.Column(String(100), nullable=False)  # bachelor, master, phd, diploma
    major = db.Column(String(100), nullable=False)
    minor = db.Column(String(100), nullable=True)
    
    # 就讀時間
    start_year = db.Column(Integer, nullable=False)
    end_year = db.Column(Integer, nullable=True)
    is_current = db.Column(Boolean, default=False, nullable=False)
    
    # 成績與榮譽
    gpa = db.Column(String(20), nullable=True)
    honors = db.Column(Text, nullable=True)  # JSON array
    thesis_title = db.Column(String(500), nullable=True)
    
    # 關聯
    user = relationship('User', backref='educations')
    
    @classmethod
    def from_sheet_row(cls, row_data):
        """從 Google Sheets 匯入"""
        return cls(
            school_name=row_data.get('學校名稱'),
            degree=row_data.get('學位'),
            major=row_data.get('主修'),
            start_year=int(row_data.get('入學年份')),
            end_year=int(row_data.get('畢業年份')) if row_data.get('畢業年份') else None,
            is_current=row_data.get('在學中') == '是',
        )
    
    def to_sheet_row(self):
        """匯出到 Google Sheets"""
        return {
            'ID': self.id,
            '使用者ID': self.user_id,
            '學校名稱': self.school_name,
            '學位': self.degree,
            '主修': self.major,
            '入學年份': self.start_year,
            '畢業年份': self.end_year or '',
            '在學中': '是' if self.is_current else '否',
        }


class Skill(BaseModel):
    """技能標籤庫"""
    __tablename__ = 'skills_v2'
    
    id = db.Column(Integer, primary_key=True)
    
    # 技能資訊
    name = db.Column(String(100), unique=True, nullable=False, index=True)
    name_en = db.Column(String(100), nullable=True)
    category = db.Column(String(50), nullable=True)  # technical, soft_skill, language, tool, framework
    description = db.Column(Text, nullable=True)
    
    # 統計資訊
    usage_count = db.Column(Integer, default=0, nullable=False)
    
    # 關聯
    user_skills = relationship('UserSkill', back_populates='skill', cascade='all, delete-orphan')
    
    def increment_usage(self):
        """增加使用次數"""
        self.usage_count += 1
    
    def decrement_usage(self):
        """減少使用次數"""
        self.usage_count = max(0, self.usage_count - 1)
    
    @classmethod
    def from_sheet_row(cls, row_data):
        """從 Google Sheets 匯入"""
        return cls(
            name=row_data.get('技能名稱'),
            name_en=row_data.get('英文名稱'),
            category=row_data.get('分類'),
            description=row_data.get('說明'),
        )
    
    def to_sheet_row(self):
        """匯出到 Google Sheets"""
        return {
            'ID': self.id,
            '技能名稱': self.name,
            '英文名稱': self.name_en or '',
            '分類': self.category or '',
            '說明': self.description or '',
            '使用人數': self.usage_count,
        }


class UserSkill(BaseModel):
    """使用者技能關聯表"""
    __tablename__ = 'user_skills_v2'
    
    id = db.Column(Integer, primary_key=True)
    user_id = db.Column(Integer, ForeignKey('users_v2.id', ondelete='CASCADE'), nullable=False)
    skill_id = db.Column(Integer, ForeignKey('skills_v2.id', ondelete='CASCADE'), nullable=False)
    
    # 技能程度
    proficiency_level = db.Column(String(50), nullable=True)  # beginner, intermediate, advanced, expert
    years_of_experience = db.Column(Integer, nullable=True)
    
    # 認證與證明
    certification = db.Column(String(200), nullable=True)
    certification_url = db.Column(String(500), nullable=True)
    
    # 備註
    notes = db.Column(Text, nullable=True)
    
    # 關聯
    user = relationship('User', back_populates='skills')
    skill = relationship('Skill', back_populates='user_skills')
    
    # 唯一約束
    __table_args__ = (
        db.UniqueConstraint('user_id', 'skill_id', name='unique_user_skill'),
    )
    
    def to_dict(self):
        """轉換為字典"""
        return {
            'id': self.id,
            'skill_name': self.skill.name if self.skill else None,
            'skill_category': self.skill.category if self.skill else None,
            'proficiency_level': self.proficiency_level,
            'years_of_experience': self.years_of_experience,
            'certification': self.certification,
        }
