"""
郵件發送工具模組
支援 SMTP 郵件發送，用於註冊通知、審核結果通知等
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from flask import current_app
import os

# 管理員郵件地址
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'qaz741945@gmail.com')

# SMTP 設定（使用 Gmail）
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')  # 使用 App Password
SMTP_FROM_NAME = os.environ.get('SMTP_FROM_NAME', '色彩所系友會')
SMTP_FROM_EMAIL = os.environ.get('SMTP_FROM_EMAIL', SMTP_USERNAME)


def send_email(to_email: str, subject: str, html_content: str, text_content: str = None):
    """
    發送郵件
    
    Args:
        to_email: 收件人郵件地址
        subject: 郵件主題
        html_content: HTML 格式的郵件內容
        text_content: 純文字格式的郵件內容（可選）
    
    Returns:
        bool: 是否發送成功
    """
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        # 如果沒有設定 SMTP，只記錄日誌
        print(f"[Email Mock] To: {to_email}, Subject: {subject}")
        print(f"[Email Mock] Content: {text_content or html_content[:200]}...")
        return True
    
    try:
        # 建立郵件
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = formataddr((SMTP_FROM_NAME, SMTP_FROM_EMAIL))
        msg['To'] = to_email
        
        # 添加純文字版本
        if text_content:
            part1 = MIMEText(text_content, 'plain', 'utf-8')
            msg.attach(part1)
        
        # 添加 HTML 版本
        part2 = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(part2)
        
        # 連接 SMTP 伺服器並發送
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM_EMAIL, to_email, msg.as_string())
        
        print(f"[Email] Successfully sent to {to_email}")
        return True
        
    except Exception as e:
        print(f"[Email Error] Failed to send email to {to_email}: {str(e)}")
        return False


def send_registration_notification_to_admin(user_data: dict):
    """
    發送新用戶註冊通知給管理員
    
    Args:
        user_data: 新用戶資料字典
    """
    subject = f"[系友會] 新會員註冊申請 - {user_data.get('full_name', '未知')}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Microsoft JhengHei', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #0052D4, #4facfe); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }}
            .info-row {{ margin-bottom: 10px; }}
            .label {{ font-weight: bold; color: #666; }}
            .value {{ color: #333; }}
            .button {{ display: inline-block; background: #0052D4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2 style="margin: 0;">📋 新會員註冊申請</h2>
            </div>
            <div class="content">
                <p>有新的系友申請加入會員，請審核以下資料：</p>
                
                <h3>📧 帳號資訊</h3>
                <div class="info-row"><span class="label">電子郵件：</span> <span class="value">{user_data.get('email', '-')}</span></div>
                
                <h3>👤 基本資料</h3>
                <div class="info-row"><span class="label">姓名：</span> <span class="value">{user_data.get('full_name', '-')}</span></div>
                <div class="info-row"><span class="label">顯示名稱：</span> <span class="value">{user_data.get('display_name', '-')}</span></div>
                <div class="info-row"><span class="label">聯絡電話：</span> <span class="value">{user_data.get('phone', '-')}</span></div>
                
                <h3>🎓 學籍資料</h3>
                <div class="info-row"><span class="label">畢業年份：</span> <span class="value">{user_data.get('graduation_year', '-')} 年</span></div>
                <div class="info-row"><span class="label">屆數：</span> <span class="value">第 {user_data.get('class_year', '-')} 屆</span></div>
                <div class="info-row"><span class="label">學位：</span> <span class="value">{user_data.get('degree', '-')}</span></div>
                <div class="info-row"><span class="label">學號：</span> <span class="value">{user_data.get('student_id', '-')}</span></div>
                <div class="info-row"><span class="label">指導教授：</span> <span class="value">{user_data.get('advisor_1', '-')}{' / ' + user_data.get('advisor_2') if user_data.get('advisor_2') else ''}</span></div>
                <div class="info-row"><span class="label">論文題目：</span> <span class="value">{user_data.get('thesis_title', '-')}</span></div>
                
                <p style="margin-top: 20px;">請登入管理後台進行審核。</p>
                <a href="https://your-domain.com/admin" class="button">前往管理後台</a>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
新會員註冊申請

有新的系友申請加入會員，請審核以下資料：

【帳號資訊】
電子郵件：{user_data.get('email', '-')}

【基本資料】
姓名：{user_data.get('full_name', '-')}
顯示名稱：{user_data.get('display_name', '-')}
聯絡電話：{user_data.get('phone', '-')}

【學籍資料】
畢業年份：{user_data.get('graduation_year', '-')} 年
屆數：第 {user_data.get('class_year', '-')} 屆
學位：{user_data.get('degree', '-')}
學號：{user_data.get('student_id', '-')}
指導教授：{user_data.get('advisor_1', '-')}{' / ' + user_data.get('advisor_2') if user_data.get('advisor_2') else ''}
論文題目：{user_data.get('thesis_title', '-')}

請登入管理後台進行審核。
    """
    
    return send_email(ADMIN_EMAIL, subject, html_content, text_content)


def send_registration_confirmation_to_applicant(user_data: dict):
    """
    發送註冊確認郵件給申請人
    
    Args:
        user_data: 新用戶資料字典
    """
    to_email = user_data.get('email')
    if not to_email:
        return False
    
    subject = "[色彩所系友會] 感謝您的註冊申請"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Microsoft JhengHei', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #0052D4, #4facfe); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }}
            .content {{ background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }}
            .highlight {{ background: #e8f4fd; padding: 15px; border-radius: 6px; margin: 20px 0; }}
            .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2 style="margin: 0;">🎓 色彩與照明科技研究所系友會</h2>
            </div>
            <div class="content">
                <p>親愛的 {user_data.get('full_name', '系友')} 您好，</p>
                
                <p>感謝您申請加入色彩與照明科技研究所系友會！</p>
                
                <div class="highlight">
                    <p><strong>⏳ 您的申請目前正在等待管理員審核</strong></p>
                    <p>審核通過後，我們會再以電子郵件通知您。屆時您就可以使用註冊的帳號密碼登入系統。</p>
                </div>
                
                <p>若有任何問題，請聯繫系友會管理員。</p>
                
                <p>祝您一切順利！</p>
                <p>色彩與照明科技研究所系友會 敬上</p>
            </div>
            <div class="footer">
                <p>此為系統自動發送的郵件，請勿直接回覆。</p>
                <p>© NTUST-CIT Alumni Association</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
親愛的 {user_data.get('full_name', '系友')} 您好，

感謝您申請加入色彩與照明科技研究所系友會！

⏳ 您的申請目前正在等待管理員審核

審核通過後，我們會再以電子郵件通知您。屆時您就可以使用註冊的帳號密碼登入系統。

若有任何問題，請聯繫系友會管理員。

祝您一切順利！
色彩與照明科技研究所系友會 敬上

---
此為系統自動發送的郵件，請勿直接回覆。
    """
    
    return send_email(to_email, subject, html_content, text_content)


def send_approval_notification(user_data: dict, approved: bool, reason: str = None):
    """
    發送審核結果通知給申請人
    
    Args:
        user_data: 用戶資料字典
        approved: 是否通過審核
        reason: 拒絕原因（可選）
    """
    to_email = user_data.get('email')
    if not to_email:
        return False
    
    if approved:
        subject = "[色彩所系友會] 🎉 您的會員申請已通過！"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Microsoft JhengHei', Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #00c853, #64dd17); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }}
                .content {{ background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }}
                .button {{ display: inline-block; background: #0052D4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
                .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2 style="margin: 0;">🎉 歡迎加入系友會！</h2>
                </div>
                <div class="content">
                    <p>親愛的 {user_data.get('full_name', '系友')} 您好，</p>
                    
                    <p>恭喜您！您的會員申請已通過審核。</p>
                    
                    <p>現在您可以使用註冊時填寫的帳號密碼登入系友會平台，開始探索：</p>
                    <ul>
                        <li>📋 職缺機會媒合</li>
                        <li>🎉 系友活動報名</li>
                        <li>📢 校園公告資訊</li>
                        <li>💬 系友交流互動</li>
                    </ul>
                    
                    <p style="text-align: center;">
                        <a href="https://your-domain.com/auth/login" class="button">立即登入</a>
                    </p>
                    
                    <p>期待在平台上與您相見！</p>
                    <p>色彩與照明科技研究所系友會 敬上</p>
                </div>
                <div class="footer">
                    <p>© NTUST-CIT Alumni Association</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
親愛的 {user_data.get('full_name', '系友')} 您好，

🎉 恭喜您！您的會員申請已通過審核。

現在您可以使用註冊時填寫的帳號密碼登入系友會平台，開始探索：
- 📋 職缺機會媒合
- 🎉 系友活動報名
- 📢 校園公告資訊
- 💬 系友交流互動

期待在平台上與您相見！
色彩與照明科技研究所系友會 敬上
        """
    else:
        subject = "[色彩所系友會] 會員申請審核結果通知"
        
        reason_text = f"<p><strong>原因：</strong>{reason}</p>" if reason else ""
        reason_plain = f"\n原因：{reason}" if reason else ""
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Microsoft JhengHei', Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #f44336; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }}
                .content {{ background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }}
                .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2 style="margin: 0;">會員申請審核結果</h2>
                </div>
                <div class="content">
                    <p>親愛的 {user_data.get('full_name', '申請人')} 您好，</p>
                    
                    <p>感謝您申請加入色彩與照明科技研究所系友會。</p>
                    
                    <p>經審核後，很抱歉您的申請未能通過。</p>
                    {reason_text}
                    
                    <p>如有任何疑問，請聯繫系友會管理員。</p>
                    
                    <p>色彩與照明科技研究所系友會 敬上</p>
                </div>
                <div class="footer">
                    <p>© NTUST-CIT Alumni Association</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
親愛的 {user_data.get('full_name', '申請人')} 您好，

感謝您申請加入色彩與照明科技研究所系友會。

經審核後，很抱歉您的申請未能通過。{reason_plain}

如有任何疑問，請聯繫系友會管理員。

色彩與照明科技研究所系友會 敬上
        """
    
    return send_email(to_email, subject, html_content, text_content)



