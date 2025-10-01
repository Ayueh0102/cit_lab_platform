from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import json

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    graduation_year = db.Column(db.Integer, nullable=False)
    class_name = db.Column(db.String(50))
    linkedin_id = db.Column(db.String(100), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    profile = db.relationship('Profile', backref='user', uselist=False, cascade='all, delete-orphan')
    jobs = db.relationship('Job', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    job_requests = db.relationship('JobRequest', foreign_keys='JobRequest.requester_id', backref='requester', lazy='dynamic')
    event_registrations = db.relationship('EventRegistration', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    bulletins = db.relationship('Bulletin', backref='author', lazy='dynamic', cascade='all, delete-orphan')
    sent_messages = db.relationship('Message', foreign_keys='Message.sender_id', backref='sender', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self, include_private=False):
        data = {
            'id': self.id,
            'name': self.name,
            'graduation_year': self.graduation_year,
            'class_name': self.class_name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_private:
            data.update({
                'email': self.email,
                'linkedin_id': self.linkedin_id,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None
            })
            
        if self.profile:
            data['profile'] = self.profile.to_dict()
            
        return data

class Profile(db.Model):
    __tablename__ = 'profiles'
    
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    current_company = db.Column(db.String(200))
    current_title = db.Column(db.String(200))
    work_experience = db.Column(db.Text)
    skills = db.Column(db.Text)
    website = db.Column(db.String(200))
    privacy_settings = db.Column(db.Text)  # JSON string
    
    def get_privacy_settings(self):
        if self.privacy_settings:
            return json.loads(self.privacy_settings)
        return {}
    
    def set_privacy_settings(self, settings):
        self.privacy_settings = json.dumps(settings)
    
    def to_dict(self):
        return {
            'current_company': self.current_company,
            'current_title': self.current_title,
            'work_experience': self.work_experience,
            'skills': self.skills,
            'website': self.website,
            'privacy_settings': self.get_privacy_settings()
        }

class Job(db.Model):
    __tablename__ = 'jobs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    company = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(200))
    salary_range = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    requests = db.relationship('JobRequest', backref='job', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'company': self.company,
            'location': self.location,
            'salary_range': self.salary_range,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'author': {
                'id': self.author.id,
                'name': self.author.name,
                'graduation_year': self.author.graduation_year
            } if self.author else None
        }

class JobRequest(db.Model):
    __tablename__ = 'job_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    requester_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'job_id': self.job_id,
            'job_title': self.job.title if self.job else None,
            'job_company': self.job.company if self.job else None,
            'requester': self.requester.to_dict() if self.requester else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Event(db.Model):
    __tablename__ = 'events'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime)
    location = db.Column(db.String(200))
    capacity = db.Column(db.Integer)
    registration_deadline = db.Column(db.DateTime)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    registrations = db.relationship('EventRegistration', backref='event', lazy='dynamic', cascade='all, delete-orphan')
    creator = db.relationship('User', foreign_keys=[created_by])
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'location': self.location,
            'capacity': self.capacity,
            'registration_deadline': self.registration_deadline.isoformat() if self.registration_deadline else None,
            'registered_count': self.registrations.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class EventRegistration(db.Model):
    __tablename__ = 'event_registrations'
    
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Unique constraint to prevent duplicate registrations
    __table_args__ = (db.UniqueConstraint('event_id', 'user_id', name='unique_event_user'),)

class Bulletin(db.Model):
    __tablename__ = 'bulletins'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50))
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_pinned = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'category': self.category,
            'is_pinned': self.is_pinned,
            'author': {
                'id': self.author.id,
                'name': self.author.name
            } if self.author else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Conversation(db.Model):
    __tablename__ = 'conversations'
    
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    participants = db.relationship('ConversationParticipant', backref='conversation', lazy='dynamic', cascade='all, delete-orphan')
    messages = db.relationship('Message', backref='conversation', lazy='dynamic', cascade='all, delete-orphan')

class ConversationParticipant(db.Model):
    __tablename__ = 'conversation_participants'
    
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id'), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    
    # Relationships
    user = db.relationship('User')

class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'sender_id': self.sender_id,
            'sender_name': self.sender.name if self.sender else None,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
