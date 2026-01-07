# המלצות אבטחה למערכת ותקין בוטיק

## 🔴 קריטי - יש לתקן מיד

### 1. סיסמאות לא מוצפנות
**בעיה:** הסיסמאות נשמרות בטקסט פשוט בקובץ `users_db.json`

**פתרון מומלץ:**
```python
from werkzeug.security import generate_password_hash, check_password_hash

# בעת יצירת/עדכון סיסמה:
hashed_password = generate_password_hash(password)

# בעת בדיקת סיסמה:
if check_password_hash(user['password'], input_password):
    # סיסמה נכונה
```

**השפעה:** כל מי שיש לו גישה לקובץ JSON יכול לראות את כל הסיסמאות.

---

### 2. SECRET_KEY חשוף בקוד
**בעיה:** `app.secret_key = 'vatkin_master_final_v100'` נכתב ישירות בקוד

**פתרון:**
```python
import os
app.secret_key = os.environ.get('SECRET_KEY') or os.urandom(32).hex()
```

**או ב-`.env` file:**
```env
SECRET_KEY=your-random-secret-key-here-min-32-chars
```

**השפעה:** חשיפת ה-secret key מאפשרת זיוף sessions ומתן הרשאות לא מורשות.

---

### 3. פרטי SMTP בקוד
**בעיה:** שם משתמש וסיסמת SMTP נכתבים בקוד

**פתרון:**
```python
SMTP_USERNAME = os.environ.get('SMTP_USERNAME')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')
if not SMTP_USERNAME or not SMTP_PASSWORD:
    raise ValueError("SMTP credentials must be set via environment variables")
```

**או ב-`.env`:**
```env
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

**השפעה:** חשיפת פרטי התחברות לחשבון המייל.

---

## 🟠 חשוב - יש לתקן בהקדם

### 4. אין הגנה מפני CSRF
**בעיה:** אין CSRF tokens בטופסים

**פתרון:**
```python
from flask_wtf.csrf import CSRFProtect

csrf = CSRFProtect(app)
```

**בטופסים:**
```html
<form method="POST">
    <input type="hidden" name="csrf_token" value="{{ csrf_token() }}"/>
    <!-- שאר השדות -->
</form>
```

**השפעה:** משתמש יכול להיות מותקף על ידי אתר אחר שישתמש בזהותו.

---

### 5. אין Rate Limiting
**בעיה:** אין הגנה מפני brute force attacks על דף הכניסה

**פתרון:**
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/login', methods=['POST'])
@limiter.limit("5 per minute")  # מקסימום 5 ניסיונות לדקה
def login():
    # קוד התחברות
```

**השפעה:** מתקפה יכול לנסות לנחש סיסמאות ללא הגבלה.

---

### 6. אין בדיקות קלט מספקות
**בעיה:** לא תמיד מתבצעות בדיקות על הקלט מהמשתמש

**המלצות:**
- בדוק אורך מקסימלי לכל שדה
- בדוק סוגי קבצים מותרים בהעלאות
- בדוק גודל קבצים מקסימלי
- סנן HTML/JavaScript מתוכן משתמש

**דוגמה:**
```python
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'doc', 'docx'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
```

---

### 7. File Upload Security
**בעיה:** צריך לוודא הגבלות על קבצים מועלים

**המלצות:**
```python
# הגבל גודל קובץ
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

# בדוק הרשאה לפני העלאה
def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'doc', 'docx', 'xlsx'}
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# בדוק תוכן קובץ (לא רק extension)
# שימוש ב-python-magic או filetype
```

---

## 🟡 מומלץ - שיפורי אבטחה נוספים

### 8. XSS Protection
**וודא שהתבניות משתמשות ב-Jinja2 auto-escaping:**
```python
# זה כבר מופעל כברירת מחדל ב-Flask
# אבל וודא שאתה משתמש ב-|safe רק כשצריך
{{ user_input }}  # ✅ אוטומטית escaped
{{ user_input|safe }}  # ⚠️ רק אם אתה בטוח שהתוכן בטוח
```

---

### 9. Session Security
**המלצות:**
```python
app.config['SESSION_COOKIE_SECURE'] = True  # רק HTTPS (בפרודקשן)
app.config['SESSION_COOKIE_HTTPONLY'] = True  # למנוע גישה מ-JavaScript
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  # הגנה מפני CSRF
```

---

### 10. Logging & Monitoring
**הוסף logging לפעולות חשובות:**
```python
import logging

logging.basicConfig(
    filename='security.log',
    level=logging.WARNING,
    format='%(asctime)s %(levelname)s %(message)s'
)

# לוג ניסיונות התחברות כושלים
if login_failed:
    logging.warning(f"Failed login attempt for user: {username} from IP: {request.remote_addr}")
```

---

### 11. Input Sanitization
**נקה קלט לפני שמירה:**
```python
def sanitize_input(text, max_length=1000):
    if not text:
        return ""
    # הסר תווים מסוכנים
    text = text.strip()[:max_length]
    # ניתן להוסיף עוד ניקוי לפי הצורך
    return text
```

---

### 12. Database Security (JSON Files)
**הגן על קבצי JSON:**
- וודא שהקבצים לא נגישים דרך web server
- שים את הקבצים מחוץ לתיקיית `static`
- הגדר הרשאות קבצים נכונות (600 על Linux/Mac)

---

## 📋 תוכנית יישום מומלצת

### שלב 1 (דחוף - השבוע):
1. ✅ הצפן סיסמאות (generate_password_hash)
2. ✅ העבר SECRET_KEY ל-environment variable
3. ✅ העבר פרטי SMTP ל-environment variables

### שלב 2 (חשוב - החודש):
4. ✅ הוסף CSRF protection
5. ✅ הוסף Rate Limiting לדף כניסה
6. ✅ שפר בדיקות קלט

### שלב 3 (שיפורים - 2-3 חודשים):
7. ✅ שיפור File Upload Security
8. ✅ הוסף Logging & Monitoring
9. ✅ הגדר Session Security headers
10. ✅ בדיקות אבטחה תקופתיות

---

## 🛠️ כלים שימושיים

### לבדיקת אבטחה:
- **Bandit** - בדיקת קוד Python לאיתור בעיות אבטחה
- **Safety** - בדיקת תלויות Python לבעיות ידועות
- **Flask-Security** - ספרייה מקיפה לאבטחה ב-Flask

### התקנה:
```bash
pip install bandit safety flask-security flask-wtf flask-limiter
```

### הפעלה:
```bash
bandit -r app.py  # בדיקת קוד
safety check      # בדיקת תלויות
```

---

## 📝 הערות נוספות

1. **HTTPS בפרודקשן:** וודא שהשרת רץ על HTTPS בפרודקשן
2. **Backup:** וודא שיש backup קבוע לקבצי JSON
3. **עדכונים:** שמור על Flask וכל הספריות מעודכנים
4. **Audit Logs:** רשום פעולות חשובות (מחיקות, שינויים הרשאות, וכו')

---

## ⚠️ אזהרה חשובה

**אל תבצע את כל השינויים בבת אחת בפרודקשן!**

1. בדוק כל שינוי בסביבת פיתוח/בדיקה
2. במיוחד - שינוי הצפנת סיסמאות דורש migration script
3. גבה את כל הקבצים לפני שינויים
4. תן למשתמשים זמן לשנות סיסמאות לאחר הוספת הצפנה

