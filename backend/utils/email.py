"""
Email Utilities
Contains functions for sending emails
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from flask import current_app


def get_smtp_config():
    """Get SMTP configuration from environment or config"""
    return {
        'server': os.environ.get('SMTP_SERVER', 'smtp.gmail.com'),
        'port': int(os.environ.get('SMTP_PORT', '587')),
        'username': os.environ.get('SMTP_USERNAME'),
        'password': os.environ.get('SMTP_PASSWORD'),
    }


def send_password_reset_email(user_email, reset_token):
    """Send password reset email"""
    try:
        smtp = get_smtp_config()
        
        if not smtp['username'] or not smtp['password']:
            print("[WARNING] Email disabled - no SMTP configuration")
            return False
        
        reset_url = f"http://127.0.0.1:5000/reset_password/{reset_token}"
        
        email_body = f"""
        <html dir='rtl'>
        <body style='font-family: Heebo, sans-serif;'>
            <h2 style='color: #0073ea;'>איפוס סיסמה</h2>
            <p>שלום,</p>
            <p>התקבלה בקשה לאיפוס הסיסמה שלך במערכת.</p>
            <p>לחץ על הקישור הבא כדי לאפס את הסיסמה:</p>
            <p><a href='{reset_url}' style='background: #0073ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 15px 0;'>איפוס סיסמה</a></p>
            <p>או העתק את הקישור הבא לדפדפן:</p>
            <p style='background: #f8fafc; padding: 10px; border-radius: 5px; word-break: break-all;'>{reset_url}</p>
            <p>אם לא ביקשת לאפס את הסיסמה, אנא התעלם ממייל זה.</p>
            <p>תוקף הקישור: 24 שעות</p>
        </body>
        </html>
        """
        
        msg = MIMEMultipart('alternative')
        msg['From'] = smtp['username']
        msg['To'] = user_email
        msg['Subject'] = 'איפוס סיסמה - מערכת ניהול'
        
        html_part = MIMEText(email_body, 'html', 'utf-8')
        msg.attach(html_part)
        
        server = smtplib.SMTP(smtp['server'], smtp['port'])
        server.starttls()
        server.login(smtp['username'], smtp['password'])
        server.send_message(msg)
        server.quit()
        
        print(f"[SUCCESS] Password reset email sent to {user_email}")
        return True
    except Exception as e:
        print(f"[ERROR] Error sending password reset email: {e}")
        return False


def send_form_email(form_title, client_name, form_submission, uploaded_files, form_token, forms_list=None):
    """
    Send email with form details
    Returns True on success, False on failure
    """
    from backend.utils.helpers import load_forms, load_data, load_users
    from html import escape
    from datetime import datetime
    
    print("\n" + "="*80)
    print("[EMAIL] ========== Starting Email Send Process ==========")
    print(f"[EMAIL] Form: {form_title}")
    print(f"[EMAIL] Client: {client_name}")
    print("="*80 + "\n")
    
    try:
        smtp = get_smtp_config()
        
        if not smtp['username'] or not smtp['password']:
            print("[WARNING] Email disabled - no SMTP configuration")
            return False
        
        # Get form and user info
        if forms_list is None:
            forms_list = load_forms()
        
        form = next((f for f in forms_list if f.get('token') == form_token), None)
        
        # Get assigned user email
        recipient_email = None
        if form and form.get('client_id'):
            clients = load_data()
            client = next((c for c in clients if c.get('id') == form['client_id']), None)
            if client:
                assigned_users = client.get('assigned_user', [])
                if isinstance(assigned_users, str):
                    assigned_users = [assigned_users]
                
                if assigned_users:
                    users = load_users()
                    for uid in assigned_users:
                        if uid in users and users[uid].get('email'):
                            recipient_email = users[uid]['email']
                            break
        
        # Default to admin email if no recipient found
        if not recipient_email:
            users = load_users()
            if 'admin' in users and users['admin'].get('email'):
                recipient_email = users['admin']['email']
            else:
                recipient_email = smtp['username']
        
        # Build email body
        current_date = datetime.now().strftime('%d/%m/%Y %H:%M')
        
        email_body_parts = [f"""
        <html dir='rtl'>
        <head>
            <style>
                body {{ font-family: Heebo, Arial, sans-serif; direction: rtl; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #0073ea, #00a8ff); color: white; padding: 25px; border-radius: 12px 12px 0 0; }}
                table {{ width: 100%; border-collapse: collapse; }}
                td {{ padding: 12px 16px; border-bottom: 1px solid #e2e8f0; }}
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1 style='margin: 0;'>📋 {form_title}</h1>
                    <p style='margin: 10px 0 0 0;'>לקוח: {client_name}</p>
                    <p style='margin: 5px 0 0 0;'>תאריך: {current_date}</p>
                </div>
                <div style='background: white; padding: 20px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);'>
                    <h2 style='color: #2d3748;'>📝 פרטי הטופס</h2>
                    <table>
        """]
        
        # Add form fields
        for field_id, field_data in form_submission.items():
            field_label = escape(str(field_data['label']))
            field_value = field_data['value'] if field_data['value'] else ''
            if field_value:
                field_value = escape(str(field_value)).replace('\n', '<br>')
            else:
                field_value = '<span style="color: #a0aec0;">לא הוזן</span>'
            
            email_body_parts.append(f"""
                        <tr>
                            <td><strong>{field_label}</strong></td>
                            <td>{field_value}</td>
                        </tr>
            """)
        
        # Add uploaded files info
        if uploaded_files:
            email_body_parts.append("""
                        <tr>
                            <td colspan='2' style='background: #fff5e6; padding: 15px;'>
                                <strong>📎 קבצים שהועלו:</strong><br>
            """)
            for f in uploaded_files:
                email_body_parts.append(f"• {f['original_name']}<br>")
            email_body_parts.append("</td></tr>")
        
        email_body_parts.append("""
                    </table>
                </div>
            </div>
        </body>
        </html>
        """)
        
        email_body = ''.join(email_body_parts)
        
        # Create and send email
        msg = MIMEMultipart('alternative')
        msg['From'] = smtp['username']
        msg['To'] = recipient_email
        msg['Subject'] = f'טופס חדש: {form_title} - {client_name}'
        
        html_part = MIMEText(email_body, 'html', 'utf-8')
        msg.attach(html_part)
        
        server = smtplib.SMTP(smtp['server'], smtp['port'])
        server.starttls()
        server.login(smtp['username'], smtp['password'])
        server.send_message(msg)
        server.quit()
        
        print(f"[SUCCESS] Form email sent to {recipient_email}")
        return True
    except Exception as e:
        print(f"[ERROR] Error sending form email: {e}")
        import traceback
        traceback.print_exc()
        return False
