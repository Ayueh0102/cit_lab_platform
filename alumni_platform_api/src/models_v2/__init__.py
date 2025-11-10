"""
New Database Models v2
完整的模組化資料庫模型,支援 Google Sheets 整合
"""

from .base import db
from .user_auth import User, UserProfile, UserSession
from .career import WorkExperience, Education, Skill, UserSkill
from .jobs import Job, JobCategory, JobRequest
from .messages import Conversation, Message
from .events import Event, EventCategory, EventRegistration
from .content import Bulletin, BulletinCategory, BulletinComment, Article, ArticleCategory
from .system import Notification, SystemLog, SystemSetting, UserActivity, FileUpload, NotificationType, NotificationStatus

__all__ = [
    'db',
    # User & Auth
    'User', 'UserProfile', 'UserSession',
    # Career
    'WorkExperience', 'Education', 'Skill', 'UserSkill',
    # Jobs
    'Job', 'JobCategory', 'JobRequest',
    # Messages
    'Conversation', 'Message',
    # Events
    'Event', 'EventCategory', 'EventRegistration',
    # Content
    'Bulletin', 'BulletinCategory', 'BulletinComment', 'Article', 'ArticleCategory',
    # System
    'Notification', 'NotificationType', 'NotificationStatus', 'SystemLog', 'SystemSetting', 'UserActivity', 'FileUpload'
]
