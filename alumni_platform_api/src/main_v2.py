"""
Flask Application v2 - 使用 models_v2 架構
支援完整的資料庫模型與 Google Sheets 整合
"""

import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS

# Import models_v2
from src.models_v2 import db, User, UserProfile, WorkExperience, Education, Skill, UserSkill
from src.models_v2 import Job, JobCategory, JobRequest
from src.models_v2 import Event, EventCategory, EventRegistration
from src.models_v2 import Bulletin, BulletinCategory, BulletinComment
from src.models_v2 import Conversation, Message
from src.models_v2 import Notification, SystemSetting

# Import routes_v2
from src.routes.auth_v2 import auth_v2_bp
from src.routes.jobs_v2 import jobs_v2_bp
from src.routes.events_v2 import events_v2_bp
from src.routes.bulletins_v2 import bulletins_v2_bp
from src.routes.messages_v2 import messages_v2_bp
from src.routes.career import career_bp
from src.routes.notifications import notifications_bp
from src.routes.csv_import_export import csv_bp

# 保留相容舊版的 routes (暫時) - 已註釋以避免模型衝突
# from src.routes.user import user_bp
# from src.routes.jobs import jobs_bp
# from src.routes.events import events_bp
# from src.routes.bulletins import bulletins_bp
# from src.routes.messages import messages_bp

from datetime import datetime, timedelta

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS for all routes
CORS(app)

# Register blueprints - v2 routes
app.register_blueprint(auth_v2_bp)          # /api/v2/auth/*
app.register_blueprint(jobs_v2_bp)          # /api/v2/jobs/*
app.register_blueprint(events_v2_bp)        # /api/v2/events/*
app.register_blueprint(bulletins_v2_bp)     # /api/v2/bulletins/*
app.register_blueprint(messages_v2_bp)      # /api/v2/messages/*
app.register_blueprint(career_bp)           # /api/career/*
app.register_blueprint(notifications_bp)    # /api/notifications/*, /api/system/*, /api/activities/*, /api/files/*
app.register_blueprint(csv_bp)              # /api/csv/*

# Register blueprints - v1 routes (backward compatibility) - 已註釋以避免模型衝突
# app.register_blueprint(user_bp, url_prefix='/api')
# app.register_blueprint(jobs_bp, url_prefix='/api')
# app.register_blueprint(events_bp, url_prefix='/api')
# app.register_blueprint(bulletins_bp, url_prefix='/api')
# app.register_blueprint(messages_bp, url_prefix='/api')

# Database configuration
db_path = os.path.join(os.path.dirname(__file__), 'database', 'app_v2.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)


# ========================================
# Database Initialization & Seeding
# ========================================
def init_database():
    """初始化資料庫並填入測試資料"""
    with app.app_context():
        # 建立所有資料表
        db.create_all()
        print("✅ Database tables created successfully")

        # 檢查是否需要填入測試資料
        if User.query.count() == 0:
            print("📊 Seeding initial data...")
            seed_data()
            print("✅ Initial data seeded successfully")
        else:
            print("ℹ️  Database already contains data, skipping seed")


def seed_data():
    """填入測試資料"""
    try:
        # ========================================
        # 建立測試使用者
        # ========================================
        users_data = [
            {
                'email': 'admin@example.com',
                'password': 'admin123',
                'name': '系統管理員',
                'role': 'admin',
                'profile': {
                    'graduation_year': 2015,
                    'class_name': 'A班',
                    'current_company': '系友會',
                    'current_position': '平台管理員',
                    'bio': '負責系友會平台的維護與管理'
                }
            },
            {
                'email': 'wang@example.com',
                'password': 'password123',
                'name': '王小明',
                'role': 'user',
                'profile': {
                    'graduation_year': 2020,
                    'class_name': 'A班',
                    'current_company': 'ASUS',
                    'current_position': '光學工程師',
                    'industry': '電子製造',
                    'bio': '專注於筆電螢幕光學設計與優化'
                }
            },
            {
                'email': 'lee@example.com',
                'password': 'password123',
                'name': '李美華',
                'role': 'user',
                'profile': {
                    'graduation_year': 2019,
                    'class_name': 'B班',
                    'current_company': 'MediaTek',
                    'current_position': '色彩科學研究員',
                    'industry': '半導體',
                    'bio': '專注於顯示器色彩管理技術研發'
                }
            }
        ]

        created_users = []
        for user_data in users_data:
            user = User(
                email=user_data['email'],
                role=user_data['role']
            )
            user.set_password(user_data['password'])
            db.session.add(user)
            db.session.flush()

            # 建立使用者檔案
            profile_data = user_data['profile']
            profile = UserProfile(
                user_id=user.id,
                full_name=user_data['name'],  # name 從 user_data 移到 profile
                display_name=user_data['name'].split()[0] if user_data['name'] else None,
                graduation_year=profile_data.get('graduation_year'),
                current_company=profile_data.get('current_company'),
                current_position=profile_data.get('current_position'),
                bio=profile_data.get('bio')
            )
            db.session.add(profile)

            created_users.append(user)

        db.session.commit()
        print(f"  ✓ Created {len(created_users)} users")

        # ========================================
        # 建立技能項目
        # ========================================
        skills_data = [
            {'name': 'Python', 'category': '程式語言'},
            {'name': 'JavaScript', 'category': '程式語言'},
            {'name': 'Zemax', 'category': '光學軟體'},
            {'name': 'LightTools', 'category': '光學軟體'},
            {'name': '色彩管理', 'category': '專業技能'},
            {'name': '光學設計', 'category': '專業技能'},
        ]

        created_skills = []
        for skill_data in skills_data:
            skill = Skill(
                name=skill_data['name'],
                category=skill_data['category']
            )
            db.session.add(skill)
            created_skills.append(skill)

        db.session.commit()
        print(f"  ✓ Created {len(created_skills)} skills")

        # ========================================
        # 建立職缺分類
        # ========================================
        job_categories = [
            {'name': '光學工程', 'icon': '🔬', 'color': '#3b82f6'},
            {'name': '色彩科學', 'icon': '🎨', 'color': '#8b5cf6'},
            {'name': '軟體開發', 'icon': '💻', 'color': '#10b981'},
        ]

        created_job_cats = []
        for cat_data in job_categories:
            category = JobCategory(
                name=cat_data['name'],
                icon=cat_data['icon'],
                color=cat_data['color']
            )
            db.session.add(category)
            created_job_cats.append(category)

        db.session.commit()
        print(f"  ✓ Created {len(created_job_cats)} job categories")

        # ========================================
        # 建立測試職缺
        # ========================================
        if created_users and created_job_cats:
            job = Job(
                user_id=created_users[1].id,
                category_id=created_job_cats[0].id,
                title='光學工程師',
                company='台積電',
                description='負責先進製程光學系統設計與優化',
                location='新竹',
                job_type='full_time',
                status='active',
                salary_min=80000,
                salary_max=120000,
                published_at=datetime.utcnow()
            )
            db.session.add(job)
            db.session.commit()
            print("  ✓ Created 1 sample job")

        # ========================================
        # 建立活動分類
        # ========================================
        event_categories = [
            {'name': '系友聚會', 'icon': '👥', 'color': '#f59e0b'},
            {'name': '學術講座', 'icon': '📚', 'color': '#06b6d4'},
        ]

        created_event_cats = []
        for cat_data in event_categories:
            category = EventCategory(
                name=cat_data['name'],
                icon=cat_data['icon'],
                color=cat_data['color']
            )
            db.session.add(category)
            created_event_cats.append(category)

        db.session.commit()
        print(f"  ✓ Created {len(created_event_cats)} event categories")

        # ========================================
        # 建立測試活動
        # ========================================
        if created_users and created_event_cats:
            event = Event(
                organizer_id=created_users[0].id,
                category_id=created_event_cats[0].id,
                title='2025年度系友大會',
                description='年度系友聚會,歡迎所有系友參加',
                start_time=datetime.utcnow() + timedelta(days=30),
                end_time=datetime.utcnow() + timedelta(days=30, hours=4),
                location='國立清華大學',
                max_participants=100,
                is_free=True,
                published_at=datetime.utcnow()
            )
            db.session.add(event)
            db.session.commit()
            print("  ✓ Created 1 sample event")

        # ========================================
        # 建立公告分類
        # ========================================
        bulletin_categories = [
            {'name': '系友會公告', 'icon': '📢', 'color': '#ef4444'},
            {'name': '系友動態', 'icon': '🌟', 'color': '#06b6d4'},
        ]

        created_bulletin_cats = []
        for cat_data in bulletin_categories:
            category = BulletinCategory(
                name=cat_data['name'],
                icon=cat_data['icon'],
                color=cat_data['color']
            )
            db.session.add(category)
            created_bulletin_cats.append(category)

        db.session.commit()
        print(f"  ✓ Created {len(created_bulletin_cats)} bulletin categories")

        # ========================================
        # 建立測試公告
        # ========================================
        if created_users and created_bulletin_cats:
            bulletin = Bulletin(
                author_id=created_users[0].id,
                category_id=created_bulletin_cats[0].id,
                title='歡迎使用系友會平台',
                content='感謝各位系友使用本平台,期待大家多多交流!',
                bulletin_type='announcement',
                status='published',
                is_pinned=True,
                published_at=datetime.utcnow()
            )
            db.session.add(bulletin)
            db.session.commit()
            print("  ✓ Created 1 sample bulletin")

        # ========================================
        # 建立系統設定
        # ========================================
        settings_data = [
            {'key': 'site_name', 'value': '色彩與照明科技研究所系友會', 'type': 'string', 'public': True, 'category': '基本設定'},
            {'key': 'site_description', 'value': '系友會社群平台', 'type': 'string', 'public': True, 'category': '基本設定'},
            {'key': 'enable_registration', 'value': 'true', 'type': 'bool', 'public': True, 'category': '功能設定'},
            {'key': 'max_file_size', 'value': '5242880', 'type': 'int', 'public': False, 'category': '系統設定'},
        ]

        for setting_data in settings_data:
            setting = SystemSetting(
                setting_key=setting_data['key'],
                setting_type=setting_data['type'],
                category=setting_data['category'],
                is_public=setting_data['public']
            )
            setting.set_value(setting_data['value'])
            db.session.add(setting)

        db.session.commit()
        print(f"  ✓ Created {len(settings_data)} system settings")

    except Exception as e:
        db.session.rollback()
        print(f"❌ Error seeding data: {str(e)}")
        raise


# ========================================
# API Routes
# ========================================
@app.route('/')
def index():
    return jsonify({
        'message': 'Alumni Platform API v2',
        'version': '2.0.0',
        'database': 'models_v2',
        'endpoints': {
            'auth': '/api/auth/v2',
            'career': '/api/career',
            'notifications': '/api/notifications',
            'csv': '/api/csv'
        }
    })


@app.route('/api/health')
def health():
    return jsonify({
        'status': 'healthy',
        'database': 'connected',
        'version': '2.0.0'
    }), 200


# ========================================
# Static Files
# ========================================
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)


# ========================================
# Main Entry Point
# ========================================
if __name__ == '__main__':
    # 初始化資料庫
    init_database()

    # 啟動 Flask 應用程式
    print("\n" + "="*50)
    print("🚀 Starting Alumni Platform API v2")
    print("="*50)
    print(f"📊 Database: app_v2.db")
    print(f"🌐 Server: http://localhost:5001")
    print(f"📚 API Docs: http://localhost:5001/")
    print("="*50 + "\n")

    app.run(host='0.0.0.0', port=5001, debug=True)
