"""
Google Workspace Authentication Module
מנהל OAuth 2.0 flow ו-Gmail API integration
"""

import os
import json
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from werkzeug.security import generate_password_hash
import secrets

# OAuth 2.0 Scopes
SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/gmail.send',  # שליחת מיילים
    'https://www.googleapis.com/auth/gmail.compose',  # יצירת מיילים
]

# החזרת OAuth Flow
def get_oauth_flow(redirect_uri=None):
    """יוצר OAuth Flow object"""
    client_id = os.environ.get('GOOGLE_CLIENT_ID')
    client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
    # אם redirect_uri לא הועבר, נשתמש ב-env variable או ברירת מחדל
    # נתקן ל-127.0.0.1 במקום localhost אם צריך
    default_redirect = os.environ.get('GOOGLE_REDIRECT_URI', 'http://127.0.0.1:5000/auth/google/callback')
    redirect_uri = redirect_uri or default_redirect
    
    # אם redirect_uri מכיל localhost, נחליף ל-127.0.0.1 כדי להתאים ל-Google Cloud Console
    if redirect_uri and 'localhost' in redirect_uri:
        redirect_uri = redirect_uri.replace('localhost', '127.0.0.1')
    
    if not client_id or not client_secret:
        raise ValueError("GOOGLE_CLIENT_ID ו-GOOGLE_CLIENT_SECRET חייבים להיות מוגדרים ב-.env")
    
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [redirect_uri]
            }
        },
        scopes=SCOPES,
        redirect_uri=redirect_uri
    )
    
    return flow

def get_authorization_url(redirect_uri=None, force_account_selection=False):
    """מחזיר URL להתחברות עם Google"""
    flow = get_oauth_flow(redirect_uri)
    
    # תמיד נבקש בחירת חשבון + consent
    # select_account = מציג מסך בחירת חשבון (FORCES account selection)
    # consent = מבקש הסכמה מפורשת (חשוב לקבלת refresh_token)
    # הפרוד של prompt צריך להיות רשימה או מחרוזת עם רווחים
    prompt = 'select_account consent'
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt=prompt
    )
    
    # Debug: בדיקה שהפרמטר prompt אכן נשלח
    print(f"[DEBUG] Authorization URL created with prompt: {prompt}")
    
    # בדיקה שהפרמטר prompt נמצא ב-URL
    auth_url_str = str(authorization_url)
    if 'prompt=select_account' in auth_url_str or 'prompt=select_account%20consent' in auth_url_str:
        print(f"[DEBUG] ✓ Prompt parameter IS in the URL (select_account found)")
    else:
        print(f"[WARNING] ✗ Prompt parameter NOT found in URL!")
        print(f"[DEBUG] URL contains prompt: {'prompt=' in auth_url_str}")
        # ננסה לראות מה יש ב-URL (רק החלק הראשון)
        if 'prompt=' in auth_url_str:
            import urllib.parse as urlparse
            parsed = urlparse.urlparse(auth_url_str)
            params = urlparse.parse_qs(parsed.query)
            if 'prompt' in params:
                print(f"[DEBUG] Found prompt in URL: {params['prompt']}")
    
    # הדפסת ה-URL המלא (ללא הפרמטרים הרגישים - רק כדי לראות את ה-prompt)
    # נחלץ רק את החלק של prompt מה-URL
    try:
        import urllib.parse as urlparse
        parsed = urlparse.urlparse(auth_url_str)
        params = urlparse.parse_qs(parsed.query)
        if 'prompt' in params:
            print(f"[DEBUG] Prompt value in URL: {params['prompt']}")
    except:
        pass
    
    return authorization_url, state

def get_user_info_from_token(code, redirect_uri=None):
    """מקבל code מ-Google callback ומחזיר פרטי משתמש ו-credentials"""
    print(f"[DEBUG google_auth] get_user_info_from_token called with code: {code[:20] if code else 'None'}...")
    print(f"[DEBUG google_auth] redirect_uri: {redirect_uri}")
    
    try:
        flow = get_oauth_flow(redirect_uri)
        print("[DEBUG google_auth] OAuth flow created successfully")
        
        # החלפת code ב-access token
        print("[DEBUG google_auth] Fetching token from Google...")
        flow.fetch_token(code=code)
        print("[DEBUG google_auth] Token fetched successfully")
        
        credentials = flow.credentials
        print(f"[DEBUG google_auth] Credentials received. Has refresh_token: {credentials.refresh_token is not None}")
        
        # קבלת פרטי המשתמש דרך Google API
        print("[DEBUG google_auth] Building OAuth2 service...")
        try:
            user_info_service = build('oauth2', 'v2', credentials=credentials)
            print("[DEBUG google_auth] Fetching user info from Google...")
            user_info = user_info_service.userinfo().get().execute()
            print(f"[DEBUG google_auth] User info received: {user_info}")
        except Exception as e:
            print(f"[ERROR google_auth] Error fetching user info: {e}")
            import traceback
            traceback.print_exc()
            user_info = {}
        
        result = {
            'email': user_info.get('email'),
            'name': user_info.get('name', user_info.get('email', '')),
            'google_id': user_info.get('id'),
            'picture': user_info.get('picture'),
            'credentials': credentials
        }
        print(f"[DEBUG google_auth] Returning result: email={result.get('email')}, name={result.get('name')}")
        return result
    except Exception as e:
        print(f"[ERROR google_auth] Exception in get_user_info_from_token: {e}")
        import traceback
        traceback.print_exc()
        raise

def save_credentials_to_user(user_id, credentials, user_email=None, user_google_id=None, users_file='users_db.json'):
    """שומר credentials מוצפנים למשתמש"""
    import os
    if not os.path.exists(users_file):
        return False
    
    with open(users_file, 'r', encoding='utf-8') as f:
        users = json.load(f)
    
    # אם המשתמש לא קיים, לא ניצור אותו כאן (זה צריך להיעשות ב-app.py)
    if user_id not in users:
        return False
    
    # המרת credentials ל-JSON string ואז base64 encoding (לא הצפנה אמיתית, אבל יותר טוב מטקסט פשוט)
    creds_dict = {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes,
        'expiry': credentials.expiry.isoformat() if credentials.expiry else None
    }
    
    creds_json = json.dumps(creds_dict)
    # Base64 encoding (לא הצפנה אמיתית, אבל יותר בטוח מטקסט פשוט)
    encoded_creds = base64.b64encode(creds_json.encode('utf-8')).decode('utf-8')
    
    users[user_id]['google_credentials'] = encoded_creds
    
    # שמירת email ו-google_id אם הועברו
    if user_email:
        users[user_id]['email'] = user_email
    if user_google_id:
        users[user_id]['google_id'] = user_google_id
    
    with open(users_file, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=4)
    
    return True

def get_user_credentials(user_id, users_file='users_db.json'):
    """מחזיר credentials של משתמש (decoded)"""
    import os
    if not os.path.exists(users_file):
        return None
    
    with open(users_file, 'r', encoding='utf-8') as f:
        users = json.load(f)
    
    if user_id not in users:
        return None
    
    encoded_creds = users[user_id].get('google_credentials')
    if not encoded_creds:
        return None
    
    try:
        # Decode מ-base64
        creds_json = base64.b64decode(encoded_creds.encode('utf-8')).decode('utf-8')
        creds_dict = json.loads(creds_json)
        
        # יצירת Credentials object
        credentials = Credentials(
            token=creds_dict.get('token'),
            refresh_token=creds_dict.get('refresh_token'),
            token_uri=creds_dict.get('token_uri'),
            client_id=creds_dict.get('client_id'),
            client_secret=creds_dict.get('client_secret'),
            scopes=creds_dict.get('scopes')
        )
        
        # אם ה-token פג, נסה לרענן
        if credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
            # שמירה מחדש של ה-credentials המעודכנים
            user_email = users[user_id].get('email')
            user_google_id = users[user_id].get('google_id')
            save_credentials_to_user(user_id, credentials, user_email=user_email, user_google_id=user_google_id, users_file=users_file)
        
        return credentials
    except Exception as e:
        print(f"Error loading credentials for user {user_id}: {e}")
        return None

def send_email_via_gmail(user_id, to_email, subject, body_html, body_text=None, attachments=None, users_file='users_db.json'):
    """
    שולח מייל דרך Gmail API של המשתמש
    
    Args:
        user_id: ID של המשתמש במערכת
        to_email: כתובת מייל נמען
        subject: נושא המייל
        body_html: תוכן HTML של המייל
        body_text: תוכן טקסט פשוט (אופציונלי)
        attachments: רשימת קבצים (אופציונלי) - [{'filename': 'file.pdf', 'content': bytes, 'content_type': 'application/pdf'}]
        users_file: נתיב לקובץ המשתמשים
    
    Returns:
        True אם הצליח, False אחרת
    """
    try:
        credentials = get_user_credentials(user_id, users_file)
        if not credentials:
            print(f"[ERROR] לא נמצאו credentials למשתמש {user_id}")
            return False
        
        # בניית Gmail service
        service = build('gmail', 'v1', credentials=credentials)
        
        # יצירת הודעת מייל
        message = MIMEMultipart('alternative')
        message['To'] = to_email
        
        # קבלת אימייל השולח מהמשתמש
        from_email = get_user_email(user_id, users_file)
        if not from_email:
            print(f"[ERROR] לא נמצא אימייל למשתמש {user_id}")
            return False
        
        message['From'] = from_email
        message['Subject'] = subject
        
        # הוספת תוכן טקסט פשוט (אם קיים)
        if body_text:
            text_part = MIMEText(body_text, 'plain', 'utf-8')
            message.attach(text_part)
        
        # הוספת תוכן HTML
        html_part = MIMEText(body_html, 'html', 'utf-8')
        message.attach(html_part)
        
        # הוספת קבצים מצורפים
        if attachments:
            for attachment in attachments:
                part = MIMEBase('application', attachment.get('content_type', 'octet-stream'))
                part.set_payload(attachment['content'])
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {attachment["filename"]}'
                )
                message.attach(part)
        
        # המרה ל-raw message format של Gmail
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
        
        # שליחת המייל
        send_message = service.users().messages().send(
            userId='me',
            body={'raw': raw_message}
        ).execute()
        
        print(f"[SUCCESS] מייל נשלח בהצלחה מ-{from_email} ל-{to_email}. Message ID: {send_message['id']}")
        return True
        
    except HttpError as error:
        print(f"[ERROR] שגיאה בשליחת מייל דרך Gmail API: {error}")
        return False
    except Exception as e:
        print(f"[ERROR] שגיאה כללית בשליחת מייל: {e}")
        import traceback
        traceback.print_exc()
        return False

def get_user_email(user_id, users_file='users_db.json'):
    """מחזיר את האימייל של המשתמש"""
    import os
    if not os.path.exists(users_file):
        return None
    
    with open(users_file, 'r', encoding='utf-8') as f:
        users = json.load(f)
    
    if user_id not in users:
        return None
    
    return users[user_id].get('email')

def validate_domain(email, allowed_domains=None):
    """
    בודק אם האימייל שייך לדומיין מותר
    
    Args:
        email: כתובת אימייל
        allowed_domains: רשימת דומיינים מותרים (או None לכל הדומיינים)
    
    Returns:
        True אם הדומיין מותר, False אחרת
    """
    if not email or '@' not in email:
        return False
    
    if allowed_domains is None:
        # אם לא הוגדר, נבדוק ב-.env
        allowed_domains_str = os.environ.get('GOOGLE_ALLOWED_DOMAINS', '')
        if allowed_domains_str:
            allowed_domains = [d.strip() for d in allowed_domains_str.split(',')]
        else:
            # אם לא הוגדר כלל, מאפשר הכל
            return True
    
    user_domain = email.split('@')[1].lower()
    allowed_domains_lower = [d.lower() for d in allowed_domains]
    
    return user_domain in allowed_domains_lower

