"""
CSV 匯入/匯出功能
支援系友資料、職缺、活動、公告等資料的 CSV 匯入與匯出
"""

from flask import Blueprint, request, send_file, jsonify
from functools import wraps
import jwt
import csv
import io
import os
from datetime import datetime
from models.user import db, User, Profile, Job, Event, Bulletin, EventRegistration, JobRequest
from werkzeug.security import generate_password_hash

csv_bp = Blueprint('csv', __name__)

# JWT Token 驗證裝飾器
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return {'error': '缺少認證 token'}, 401

        try:
            if token.startswith('Bearer '):
                token = token.split(' ')[1]

            SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-secret-key-change-in-production')
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])

            if not current_user:
                return {'error': '無效的 token'}, 401

        except Exception as e:
            return {'error': f'Token 驗證失敗: {str(e)}'}, 401

        return f(current_user, *args, **kwargs)

    return decorated


# ========================================
# 匯出功能
# ========================================

@csv_bp.route('/api/csv/export/users', methods=['GET'])
@token_required
def export_users(current_user):
    """匯出系友帳號清單為 CSV"""
    try:
        # 查詢所有使用者及其檔案
        users = User.query.all()

        # 建立 CSV
        output = io.StringIO()
        writer = csv.writer(output)

        # 寫入標題
        writer.writerow([
            'ID', '電子郵件', '姓名', '畢業年份', '班級',
            '目前公司', '職位', '個人網站', 'LinkedIn ID',
            '註冊日期', '最後更新'
        ])

        # 寫入資料
        for user in users:
            profile = user.profile
            writer.writerow([
                user.id,
                user.email,
                user.name,
                user.graduation_year or '',
                user.class_name or '',
                profile.current_company if profile else '',
                profile.current_title if profile else '',
                profile.website if profile else '',
                user.linkedin_id or '',
                user.created_at.strftime('%Y-%m-%d') if user.created_at else '',
                user.updated_at.strftime('%Y-%m-%d') if user.updated_at else ''
            ])

        # 準備下載
        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8-sig')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'系友帳號清單_{datetime.now().strftime("%Y%m%d")}.csv'
        )

    except Exception as e:
        return {'error': f'匯出失敗: {str(e)}'}, 500


@csv_bp.route('/api/csv/export/jobs', methods=['GET'])
@token_required
def export_jobs(current_user):
    """匯出職缺發布清單為 CSV"""
    try:
        jobs = Job.query.all()

        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([
            'ID', '發布者', '職缺標題', '公司名稱', '地點',
            '薪資範圍', '職缺描述', '交流請求數', '發布日期'
        ])

        for job in jobs:
            poster = User.query.get(job.user_id)
            request_count = JobRequest.query.filter_by(job_id=job.id).count()

            writer.writerow([
                job.id,
                poster.name if poster else '未知',
                job.title,
                job.company,
                job.location,
                job.salary_range or '',
                (job.description or '')[:200],  # 限制長度
                request_count,
                job.created_at.strftime('%Y-%m-%d') if job.created_at else ''
            ])

        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8-sig')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'職缺發布清單_{datetime.now().strftime("%Y%m%d")}.csv'
        )

    except Exception as e:
        return {'error': f'匯出失敗: {str(e)}'}, 500


@csv_bp.route('/api/csv/export/events', methods=['GET'])
@token_required
def export_events(current_user):
    """匯出活動清單為 CSV"""
    try:
        events = Event.query.all()

        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([
            'ID', '活動名稱', '開始時間', '結束時間', '地點',
            '名額', '已報名', '報名率', '報名截止日', '建立者',
            '活動描述', '建立日期'
        ])

        for event in events:
            creator = User.query.get(event.created_by)
            registered_count = EventRegistration.query.filter_by(event_id=event.id).count()
            capacity = event.capacity or 0
            rate = f"{(registered_count/capacity*100):.1f}%" if capacity > 0 else "0%"

            writer.writerow([
                event.id,
                event.title,
                event.start_time.strftime('%Y-%m-%d %H:%M') if event.start_time else '',
                event.end_time.strftime('%Y-%m-%d %H:%M') if event.end_time else '',
                event.location,
                capacity,
                registered_count,
                rate,
                event.registration_deadline.strftime('%Y-%m-%d') if event.registration_deadline else '',
                creator.name if creator else '',
                (event.description or '')[:200],
                event.created_at.strftime('%Y-%m-%d') if event.created_at else ''
            ])

        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8-sig')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'活動清單_{datetime.now().strftime("%Y%m%d")}.csv'
        )

    except Exception as e:
        return {'error': f'匯出失敗: {str(e)}'}, 500


@csv_bp.route('/api/csv/export/bulletins', methods=['GET'])
@token_required
def export_bulletins(current_user):
    """匯出公告發布清單為 CSV"""
    try:
        bulletins = Bulletin.query.order_by(Bulletin.is_pinned.desc(), Bulletin.created_at.desc()).all()

        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([
            'ID', '公告標題', '分類', '內容摘要', '是否置頂',
            '發布者', '發布日期'
        ])

        for bulletin in bulletins:
            author = User.query.get(bulletin.author_id)

            writer.writerow([
                bulletin.id,
                bulletin.title,
                bulletin.category,
                (bulletin.content or '')[:300],
                '是' if bulletin.is_pinned else '否',
                author.name if author else '系統',
                bulletin.created_at.strftime('%Y-%m-%d') if bulletin.created_at else ''
            ])

        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8-sig')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'公告發布清單_{datetime.now().strftime("%Y%m%d")}.csv'
        )

    except Exception as e:
        return {'error': f'匯出失敗: {str(e)}'}, 500


# ========================================
# 匯入功能
# ========================================

@csv_bp.route('/api/csv/import/users', methods=['POST'])
@token_required
def import_users(current_user):
    """從 CSV 匯入系友帳號"""
    try:
        # 檢查檔案
        if 'file' not in request.files:
            return {'error': '請選擇檔案'}, 400

        file = request.files['file']
        if file.filename == '':
            return {'error': '請選擇檔案'}, 400

        # 讀取 CSV
        stream = io.StringIO(file.stream.read().decode('utf-8-sig'))
        reader = csv.DictReader(stream)

        imported_count = 0
        updated_count = 0
        errors = []

        for row_num, row in enumerate(reader, start=2):  # 從第 2 行開始(第 1 行是標題)
            try:
                email = row.get('電子郵件', '').strip()
                if not email:
                    errors.append(f"第 {row_num} 行: 缺少電子郵件")
                    continue

                # 檢查使用者是否存在
                user = User.query.filter_by(email=email).first()

                if user:
                    # 更新現有使用者
                    user.name = row.get('姓名', user.name)
                    user.graduation_year = int(row.get('畢業年份', 0)) or None
                    user.class_name = row.get('班級') or None
                    user.linkedin_id = row.get('LinkedIn ID') or None
                    user.updated_at = datetime.utcnow()

                    # 更新 Profile
                    if user.profile:
                        user.profile.current_company = row.get('目前公司') or None
                        user.profile.current_title = row.get('職位') or None
                        user.profile.website = row.get('個人網站') or None
                    else:
                        # 建立 Profile
                        profile = Profile(
                            user_id=user.id,
                            current_company=row.get('目前公司') or None,
                            current_title=row.get('職位') or None,
                            website=row.get('個人網站') or None
                        )
                        db.session.add(profile)

                    updated_count += 1

                else:
                    # 建立新使用者
                    user = User(
                        email=email,
                        name=row.get('姓名', ''),
                        graduation_year=int(row.get('畢業年份', 0)) or None,
                        class_name=row.get('班級') or None,
                        linkedin_id=row.get('LinkedIn ID') or None,
                        password_hash=generate_password_hash('default123')  # 預設密碼
                    )
                    db.session.add(user)
                    db.session.flush()  # 取得 user.id

                    # 建立 Profile
                    profile = Profile(
                        user_id=user.id,
                        current_company=row.get('目前公司') or None,
                        current_title=row.get('職位') or None,
                        website=row.get('個人網站') or None
                    )
                    db.session.add(profile)

                    imported_count += 1

                db.session.commit()

            except Exception as e:
                db.session.rollback()
                errors.append(f"第 {row_num} 行: {str(e)}")

        return {
            'success': True,
            'imported': imported_count,
            'updated': updated_count,
            'total': imported_count + updated_count,
            'errors': errors
        }, 200

    except Exception as e:
        return {'error': f'匯入失敗: {str(e)}'}, 500


@csv_bp.route('/api/csv/import/jobs', methods=['POST'])
@token_required
def import_jobs(current_user):
    """從 CSV 匯入職缺"""
    try:
        if 'file' not in request.files:
            return {'error': '請選擇檔案'}, 400

        file = request.files['file']
        stream = io.StringIO(file.stream.read().decode('utf-8-sig'))
        reader = csv.DictReader(stream)

        imported_count = 0
        updated_count = 0
        errors = []

        for row_num, row in enumerate(reader, start=2):
            try:
                job_id = row.get('ID', '').strip()

                if job_id and job_id.isdigit():
                    # 更新現有職缺
                    job = Job.query.get(int(job_id))
                    if job:
                        job.title = row.get('職缺標題', job.title)
                        job.company = row.get('公司名稱', job.company)
                        job.location = row.get('地點', job.location)
                        job.salary_range = row.get('薪資範圍') or None
                        job.description = row.get('職缺描述') or job.description
                        updated_count += 1
                    else:
                        errors.append(f"第 {row_num} 行: 找不到 ID={job_id} 的職缺")
                        continue
                else:
                    # 建立新職缺 (需要指定發布者)
                    # 這裡使用當前使用者作為發布者
                    job = Job(
                        user_id=current_user.id,
                        title=row.get('職缺標題', ''),
                        company=row.get('公司名稱', ''),
                        location=row.get('地點', ''),
                        salary_range=row.get('薪資範圍') or None,
                        description=row.get('職缺描述') or ''
                    )
                    db.session.add(job)
                    imported_count += 1

                db.session.commit()

            except Exception as e:
                db.session.rollback()
                errors.append(f"第 {row_num} 行: {str(e)}")

        return {
            'success': True,
            'imported': imported_count,
            'updated': updated_count,
            'total': imported_count + updated_count,
            'errors': errors
        }, 200

    except Exception as e:
        return {'error': f'匯入失敗: {str(e)}'}, 500


@csv_bp.route('/api/csv/import/bulletins', methods=['POST'])
@token_required
def import_bulletins(current_user):
    """從 CSV 匯入公告"""
    try:
        if 'file' not in request.files:
            return {'error': '請選擇檔案'}, 400

        file = request.files['file']
        stream = io.StringIO(file.stream.read().decode('utf-8-sig'))
        reader = csv.DictReader(stream)

        imported_count = 0
        updated_count = 0
        errors = []

        for row_num, row in enumerate(reader, start=2):
            try:
                bulletin_id = row.get('ID', '').strip()

                if bulletin_id and bulletin_id.isdigit():
                    # 更新現有公告
                    bulletin = Bulletin.query.get(int(bulletin_id))
                    if bulletin:
                        bulletin.title = row.get('公告標題', bulletin.title)
                        bulletin.category = row.get('分類', bulletin.category)
                        bulletin.content = row.get('內容摘要', bulletin.content)
                        bulletin.is_pinned = (row.get('是否置頂', '否') == '是')
                        updated_count += 1
                    else:
                        errors.append(f"第 {row_num} 行: 找不到 ID={bulletin_id} 的公告")
                        continue
                else:
                    # 建立新公告
                    bulletin = Bulletin(
                        author_id=current_user.id,
                        title=row.get('公告標題', ''),
                        category=row.get('分類', '系友會公告'),
                        content=row.get('內容摘要', ''),
                        is_pinned=(row.get('是否置頂', '否') == '是')
                    )
                    db.session.add(bulletin)
                    imported_count += 1

                db.session.commit()

            except Exception as e:
                db.session.rollback()
                errors.append(f"第 {row_num} 行: {str(e)}")

        return {
            'success': True,
            'imported': imported_count,
            'updated': updated_count,
            'total': imported_count + updated_count,
            'errors': errors
        }, 200

    except Exception as e:
        return {'error': f'匯入失敗: {str(e)}'}, 500


# ========================================
# 批次匯出所有資料
# ========================================

@csv_bp.route('/api/csv/export/all', methods=['GET'])
@token_required
def export_all(current_user):
    """批次匯出所有資料為 ZIP"""
    try:
        import zipfile
        from io import BytesIO

        # 建立記憶體中的 ZIP 檔案
        zip_buffer = BytesIO()

        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # 匯出各個 CSV 檔案到 ZIP
            csv_exports = [
                ('01_系友帳號清單.csv', export_users_csv()),
                ('02_職缺發布清單.csv', export_jobs_csv()),
                ('03_活動清單.csv', export_events_csv()),
                ('04_公告發布清單.csv', export_bulletins_csv())
            ]

            for filename, content in csv_exports:
                zip_file.writestr(filename, content)

        zip_buffer.seek(0)

        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name=f'系友會資料匯出_{datetime.now().strftime("%Y%m%d_%H%M%S")}.zip'
        )

    except Exception as e:
        return {'error': f'批次匯出失敗: {str(e)}'}, 500


# Helper 函數 (生成 CSV 內容字串)
def export_users_csv():
    """生成系友帳號 CSV 內容"""
    users = User.query.all()
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(['ID', '電子郵件', '姓名', '畢業年份', '班級', '目前公司', '職位', '個人網站', 'LinkedIn ID', '註冊日期', '最後更新'])

    for user in users:
        profile = user.profile
        writer.writerow([
            user.id, user.email, user.name, user.graduation_year or '', user.class_name or '',
            profile.current_company if profile else '', profile.current_title if profile else '',
            profile.website if profile else '', user.linkedin_id or '',
            user.created_at.strftime('%Y-%m-%d') if user.created_at else '',
            user.updated_at.strftime('%Y-%m-%d') if user.updated_at else ''
        ])

    return output.getvalue().encode('utf-8-sig')


def export_jobs_csv():
    """生成職缺 CSV 內容"""
    jobs = Job.query.all()
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(['ID', '發布者', '職缺標題', '公司名稱', '地點', '薪資範圍', '職缺描述', '交流請求數', '發布日期'])

    for job in jobs:
        poster = User.query.get(job.user_id)
        request_count = JobRequest.query.filter_by(job_id=job.id).count()
        writer.writerow([
            job.id, poster.name if poster else '未知', job.title, job.company, job.location,
            job.salary_range or '', (job.description or '')[:200], request_count,
            job.created_at.strftime('%Y-%m-%d') if job.created_at else ''
        ])

    return output.getvalue().encode('utf-8-sig')


def export_events_csv():
    """生成活動 CSV 內容"""
    events = Event.query.all()
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(['ID', '活動名稱', '開始時間', '結束時間', '地點', '名額', '已報名', '報名率', '報名截止日', '建立者', '活動描述', '建立日期'])

    for event in events:
        creator = User.query.get(event.created_by)
        registered_count = EventRegistration.query.filter_by(event_id=event.id).count()
        capacity = event.capacity or 0
        rate = f"{(registered_count/capacity*100):.1f}%" if capacity > 0 else "0%"

        writer.writerow([
            event.id, event.title,
            event.start_time.strftime('%Y-%m-%d %H:%M') if event.start_time else '',
            event.end_time.strftime('%Y-%m-%d %H:%M') if event.end_time else '',
            event.location, capacity, registered_count, rate,
            event.registration_deadline.strftime('%Y-%m-%d') if event.registration_deadline else '',
            creator.name if creator else '', (event.description or '')[:200],
            event.created_at.strftime('%Y-%m-%d') if event.created_at else ''
        ])

    return output.getvalue().encode('utf-8-sig')


def export_bulletins_csv():
    """生成公告 CSV 內容"""
    bulletins = Bulletin.query.order_by(Bulletin.is_pinned.desc(), Bulletin.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(['ID', '公告標題', '分類', '內容摘要', '是否置頂', '發布者', '發布日期'])

    for bulletin in bulletins:
        author = User.query.get(bulletin.author_id)
        writer.writerow([
            bulletin.id, bulletin.title, bulletin.category, (bulletin.content or '')[:300],
            '是' if bulletin.is_pinned else '否', author.name if author else '系統',
            bulletin.created_at.strftime('%Y-%m-%d') if bulletin.created_at else ''
        ])

    return output.getvalue().encode('utf-8-sig')
