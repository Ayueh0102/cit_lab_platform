import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from src.models.user import db
from src.routes.auth import auth_bp
from src.routes.user import user_bp
from src.routes.jobs import jobs_bp
from src.routes.events import events_bp
from src.routes.bulletins import bulletins_bp
from src.routes.messages import messages_bp
from src.routes.csv_import_export import csv_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS for all routes
CORS(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(jobs_bp, url_prefix='/api')
app.register_blueprint(events_bp, url_prefix='/api')
app.register_blueprint(bulletins_bp, url_prefix='/api')
app.register_blueprint(messages_bp, url_prefix='/api')
app.register_blueprint(csv_bp)  # CSV import/export routes

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Create tables and seed data
with app.app_context():
    db.create_all()
    
    # Seed some initial data for demo
    from src.models.user import User, Profile, Job, Event, Bulletin
    from datetime import datetime, timedelta
    
    # Check if we need to seed data
    if User.query.count() == 0:
        # Create demo users
        users_data = [
            {
                'email': 'admin@example.com',
                'password': 'admin123',
                'name': '系統管理員',
                'graduation_year': 2015,
                'class_name': 'A班',
                'profile': {
                    'current_company': '系友會',
                    'current_title': '平台管理員',
                    'skills': '系統管理、社群經營',
                    'work_experience': '負責系友會平台維護與管理'
                }
            },
            {
                'email': 'wang@example.com',
                'password': 'password123',
                'name': '王小明',
                'graduation_year': 2020,
                'class_name': 'A班',
                'profile': {
                    'current_company': 'ASUS',
                    'current_title': '光學工程師',
                    'skills': '光學設計、Zemax、LightTools、色彩管理',
                    'work_experience': '2020-至今：ASUS 光學工程師，負責筆電螢幕光學設計與優化'
                }
            },
            {
                'email': 'lee@example.com',
                'password': 'password123',
                'name': '李美華',
                'graduation_year': 2019,
                'class_name': 'B班',
                'profile': {
                    'current_company': 'MediaTek',
                    'current_title': '色彩科學研究員',
                    'skills': '色彩科學、顯示技術、Python、MATLAB',
                    'work_experience': '2019-至今：MediaTek 色彩科學研究員，專注於顯示器色彩管理技術'
                }
            }
        ]
        
        created_users = []
        for user_data in users_data:
            user = User(
                email=user_data['email'],
                name=user_data['name'],
                graduation_year=user_data['graduation_year'],
                class_name=user_data['class_name']
            )
            user.set_password(user_data['password'])
            db.session.add(user)
            db.session.flush()  # Get the ID
            
            # Create profile
            profile = Profile(
                user_id=user.id,
                current_company=user_data['profile']['current_company'],
                current_title=user_data['profile']['current_title'],
                skills=user_data['profile']['skills'],
                work_experience=user_data['profile']['work_experience']
            )
            db.session.add(profile)
            created_users.append(user)
        
        # Create demo jobs
        jobs_data = [
            {
                'title': '光學工程師',
                'company': '台積電',
                'location': '新竹',
                'description': '負責先進製程光學系統設計與優化，需具備光學設計軟體操作經驗。',
                'salary_range': '80-120萬',
                'user_id': created_users[1].id
            },
            {
                'title': '色彩科學研究員',
                'company': 'Apple',
                'location': '台北',
                'description': '研發新一代顯示器色彩管理技術，需熟悉色彩空間轉換與校正。',
                'salary_range': '100-150萬',
                'user_id': created_users[2].id
            },
            {
                'title': 'LED照明設計師',
                'company': '億光電子',
                'location': '台中',
                'description': '設計高效能LED照明產品，需具備光學模擬與熱管理經驗。',
                'salary_range': '70-100萬',
                'user_id': created_users[0].id
            }
        ]
        
        for job_data in jobs_data:
            job = Job(**job_data)
            db.session.add(job)
        
        # Create demo events
        events_data = [
            {
                'title': '2025年度系友大會',
                'description': '年度系友聚會，分享職涯經驗與學術發展近況。',
                'start_time': datetime.now() + timedelta(days=15),
                'end_time': datetime.now() + timedelta(days=15, hours=4),
                'location': '國立清華大學',
                'capacity': 100,
                'registration_deadline': datetime.now() + timedelta(days=10),
                'created_by': created_users[0].id
            },
            {
                'title': '光學產業趨勢講座',
                'description': '邀請業界專家分享最新光學技術趨勢與市場機會。',
                'start_time': datetime.now() + timedelta(days=39),
                'end_time': datetime.now() + timedelta(days=39, hours=2),
                'location': '線上會議',
                'capacity': 200,
                'registration_deadline': datetime.now() + timedelta(days=35),
                'created_by': created_users[0].id
            }
        ]
        
        for event_data in events_data:
            event = Event(**event_data)
            db.session.add(event)
        
        # Create demo bulletins
        bulletins_data = [
            {
                'title': '系友會網站正式上線！',
                'content': '歡迎各位系友使用全新的系友會社群平台，一起建立更緊密的連結。',
                'category': '系友會公告',
                'author_id': created_users[0].id,
                'is_pinned': True
            },
            {
                'title': '恭賀！系友榮獲國際光學獎項',
                'content': '恭喜2018年畢業系友陳博士榮獲國際光學學會年度青年學者獎。',
                'category': '系友動態',
                'author_id': created_users[0].id,
                'is_pinned': False
            },
            {
                'title': '最新研究：量子點顯示技術突破',
                'content': '本所最新研究成果在Nature Photonics期刊發表，展現量子點技術新進展。',
                'category': '學術新知',
                'author_id': created_users[0].id,
                'is_pinned': False
            }
        ]
        
        for bulletin_data in bulletins_data:
            bulletin = Bulletin(**bulletin_data)
            db.session.add(bulletin)
        
        db.session.commit()
        print("Demo data seeded successfully!")

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Alumni Platform API is running'}), 200

# Serve frontend (catch-all route - must be last!)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Skip API routes
    if path.startswith('api/'):
        return jsonify({'error': 'API endpoint not found'}), 404

    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
