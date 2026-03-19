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
from flask_migrate import Migrate

# Import models_v2
from src.models_v2 import db, User, UserProfile, WorkExperience, Education, Skill, UserSkill
from src.models_v2 import Job, JobCategory, JobRequest
from src.models_v2 import Event, EventCategory, EventRegistration
from src.models_v2 import Bulletin, BulletinCategory, BulletinComment, Article
from src.models_v2 import Conversation, Message
from src.models_v2 import Notification, SystemSetting, ContactRequest

# Import routes_v2
from src.routes.auth_v2 import auth_v2_bp
from src.routes.jobs_v2 import jobs_v2_bp
from src.routes.events_v2 import events_v2_bp
from src.routes.bulletins_v2 import bulletins_v2_bp
from src.routes.messages_v2 import messages_v2_bp
from src.routes.career import career_bp
from src.routes.notifications import notifications_bp
from src.routes.csv_import_export import csv_bp
from src.routes.admin_v2 import admin_v2_bp
from src.routes.cms_v2 import cms_v2_bp
from src.routes.search_v2 import search_bp
from src.routes.contact_requests_v2 import contact_requests_v2_bp

from datetime import datetime, timedelta

# Import database configuration
from src.config.database import get_database_config

# Import WebSocket
from src.routes.websocket import socketio

# Configure logging
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# 設置 static_folder 為 src/static 目錄
static_folder_path = os.path.join(os.path.dirname(__file__), 'static')
app = Flask(__name__, static_folder=static_folder_path)

# 安全性配置 - 從環境變數載入金鑰
# 開發環境使用預設值，生產環境必須設定環境變數
IS_PRODUCTION = os.environ.get('FLASK_ENV') == 'production' or os.environ.get('PRODUCTION') == 'true'

if IS_PRODUCTION:
    # 生產環境：強制要求環境變數
    secret_key = os.environ.get('SECRET_KEY')
    jwt_secret_key = os.environ.get('JWT_SECRET_KEY')
    if not secret_key or not jwt_secret_key:
        raise ValueError('生產環境必須設定 SECRET_KEY 和 JWT_SECRET_KEY 環境變數')
    app.config['SECRET_KEY'] = secret_key
    app.config['JWT_SECRET_KEY'] = jwt_secret_key
else:
    # 開發環境：允許使用預設值
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-for-development-only')
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-secret-key-for-development-only')

# CORS 設定 - 限制允許的來源
ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')
CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True)

app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10MB

# Register blueprints - v2 routes
app.register_blueprint(auth_v2_bp)          # /api/v2/auth/*
app.register_blueprint(jobs_v2_bp)          # /api/v2/jobs/*
app.register_blueprint(events_v2_bp)        # /api/v2/events/*
app.register_blueprint(bulletins_v2_bp)     # /api/v2/bulletins/*
app.register_blueprint(messages_v2_bp)      # /api/v2/messages/*
app.register_blueprint(career_bp)           # /api/career/*
app.register_blueprint(notifications_bp)    # /api/notifications/*, /api/system/*, /api/activities/*, /api/files/*
app.register_blueprint(csv_bp)              # /api/csv/*
app.register_blueprint(admin_v2_bp)          # /api/v2/admin/*
app.register_blueprint(cms_v2_bp)           # /api/v2/cms/*
app.register_blueprint(search_bp)            # /api/v2/search/*
app.register_blueprint(contact_requests_v2_bp)  # /api/v2/contact-requests/*, /api/v2/contacts/*
# app.register_blueprint(messages_bp, url_prefix='/api')

# Database configuration - 支援 SQLite (開發) 和 PostgreSQL (生產)
database_config = get_database_config()
app.config.update(database_config)
db.init_app(app)

# 初始化 Flask-Migrate (Alembic)
# compare_type=True: 偵測欄位類型變更
# render_as_batch=True: SQLite 批次模式（預設已啟用）
migrate = Migrate(app, db, compare_type=True)

# 初始化 WebSocket
socketio.init_app(app, cors_allowed_origins=ALLOWED_ORIGINS)


# ========================================
# Database Initialization & Seeding
# ========================================
def init_database():
    """初始化資料庫並填入測試資料"""
    import os
    db_path = os.path.join(os.path.dirname(__file__), 'database', 'app_v2.db')
    db_exists = os.path.exists(db_path)
    
    with app.app_context():
        # 建立所有資料表（如果不存在）
        db.create_all()
        
        if db_exists:
            print(f"✅ Database found at: {db_path}")
        else:
            print(f"⚠️  Database created at: {db_path}")
        
        # 檢查是否需要填入測試資料
        user_count = User.query.count()
        if user_count == 0:
            print("📊 Database is empty, seeding initial data...")
            seed_data()
            print("✅ Initial data seeded successfully")
        else:
            print(f"ℹ️  Database contains {user_count} users, skipping seed")


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
                    'class_year': 100,
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
                    'class_year': 108,
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
                    'class_year': 107,
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
                class_year=profile_data.get('class_year') or profile_data.get('class_name'),
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
def health_check():
    """健康檢查端點 - 驗證應用程式和資料庫狀態"""
    try:
        # 驗證資料庫連線
        db.session.execute(db.text('SELECT 1'))
        db_status = 'connected'
        db_code = 200
    except Exception as e:
        db_status = 'disconnected'
        db_code = 503
        return jsonify({
            'status': 'unhealthy',
            'database': db_status,
            'version': '2.0.0',
            'error': str(e)
        }), db_code

    return jsonify({
        'status': 'healthy',
        'database': db_status,
        'version': '2.0.0',
        'timestamp': datetime.utcnow().isoformat()
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
    port = int(os.environ.get('PORT', 5001))

    print("\n" + "="*50)
    print("🚀 Starting Alumni Platform API v2")
    print("="*50)
    print(f"📊 Database: app_v2.db")
    print(f"🌐 Server: http://localhost:{port}")
    print(f"📚 API Docs: http://localhost:{port}/")
    print("="*50 + "\n")

    socketio.run(app, host='0.0.0.0', port=port, debug=not IS_PRODUCTION, allow_unsafe_werkzeug=True)
