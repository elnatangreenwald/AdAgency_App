# יומן שינויים אבטחה - ותקין בוטיק

## ✅ שינויים שבוצעו

### 1. הצפנת סיסמאות ✅
- **הוספו:** `generate_password_hash` ו-`check_password_hash` מ-werkzeug.security
- **עודכן:** כל המקומות שמייצרים/מעדכנים סיסמאות משתמשים:
  - `load_users()` - מנהל ברירת מחדל
  - `login()` - בדיקת סיסמה (תומך גם בסיסמאות ישנות למטרות migration)
  - `reset_password()` - איפוס סיסמה
  - `manage_users()` - הוספת משתמש חדש ואיפוס סיסמה
- **נוצר:** `migrate_passwords.py` - סקריפט להצפנת סיסמאות קיימות

**⚠️ חשוב:** הרץ את `migrate_passwords.py` כדי להצפין את כל הסיסמאות הקיימות!

### 2. SECRET_KEY מ-environment variable ✅
- **שונה:** `app.secret_key` עכשיו קורא מ-`os.environ.get('SECRET_KEY')`
- **ברירת מחדל:** משתמש בערך ישן עם אזהרה (לא מומלץ בפרודקשן)
- **הוספו:** הגדרות אבטחה נוספות ל-session cookies:
  - `SESSION_COOKIE_HTTPONLY = True`
  - `SESSION_COOKIE_SAMESITE = 'Lax'`
  - `SESSION_COOKIE_SECURE = True` (רק בפרודקשן)

### 3. פרטי SMTP מ-environment variables ✅
- **הוסרו:** פרטי SMTP hardcoded מהקוד
- **שונה:** `SMTP_USERNAME` ו-`SMTP_PASSWORD` עכשיו קוראים רק מ-environment variables
- **נוצר:** `.env.example` - קובץ דוגמה למשתני סביבה

### 4. CSRF Protection ✅
- **הותקן:** `flask-wtf` ו-`CSRFProtect`
- **הוגדר:** `csrf = CSRFProtect(app)` ב-app.py
- **⚠️ נדרש:** הוספת CSRF tokens לכל הטפסים (ראה למטה)

### 5. Rate Limiting ✅
- **הותקן:** `flask-limiter`
- **הוגדר:** Rate limiter עם גבולות ברירת מחדל:
  - 200 בקשות ביום
  - 50 בקשות לשעה
- **הוסף:** Rate limiting ספציפי לדף כניסה: 5 ניסיונות לדקה

### 6. Python-dotenv ✅
- **הותקן:** `python-dotenv` לטעינת משתני סביבה מקובץ `.env`
- **הוסף:** `load_dotenv()` בתחילת הקוד

---

## ⚠️ פעולות נדרשות

### 1. יצירת קובץ .env
צור קובץ `.env` בתיקיית הפרויקט עם התוכן הבא:

```env
# Secret Key - ייצור אחד חדש ואקראי (לפחות 32 תווים)
SECRET_KEY=your-random-secret-key-here-minimum-32-characters-long

# הגדרות SMTP
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-app-password-here

# סביבת עבודה
FLASK_ENV=development
```

**⚠️ חשוב:** אל תעלה את קובץ `.env` ל-Git! הוסף אותו ל-`.gitignore`.

### 2. הצפנת סיסמאות קיימות
הרץ את הסקריפט הבא כדי להצפין את כל הסיסמאות הקיימות:

```bash
python migrate_passwords.py
```

הסקריפט:
- יוצר backup אוטומטי של `users_db.json`
- מצפין את כל הסיסמאות
- שומר את הקובץ המעודכן

### 3. הוספת CSRF Tokens לטפסים
כל טופס POST צריך לכלול CSRF token. הוסף את השורה הבאה בכל טופס:

```html
<form method="POST">
    <input type="hidden" name="csrf_token" value="{{ csrf_token() }}"/>
    <!-- שאר השדות -->
</form>
```

**טפסים שצריכים עדכון:**
- `templates/login.html`
- `templates/reset_password.html`
- `templates/manage_users.html` (כל הטפסים)
- `templates/forms.html` (כל הטפסים)
- וכל שאר הטפסים ב-POST

**לטפסים ב-JavaScript/Fetch:**
צריך להוסיף את ה-CSRF token ל-headers:

```javascript
fetch('/your-endpoint', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')  // צריך להוסיף פונקציה זו
    },
    body: JSON.stringify(data)
});
```

או להשתמש ב-Meta tag:

```html
<meta name="csrf-token" content="{{ csrf_token() }}">
<script>
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
</script>
```

---

## 🔧 הגדרות נוספות מומלצות

### .gitignore
הוסף את השורות הבאות לקובץ `.gitignore`:

```
.env
*.json.backup
users_db.json.backup
__pycache__/
*.pyc
```

### יצירת SECRET_KEY חדש
ליצירת SECRET_KEY חדש ואקראי:

```python
import secrets
print(secrets.token_hex(32))
```

---

## 📝 הערות

1. **תאימות לאחור:** הקוד תומך גם בסיסמאות לא מוצפנות (ישנות) כדי לאפשר migration חלק. אחרי שהצפנת את כל הסיסמאות, תוכל להסיר את התמיכה הזו.

2. **SMTP:** אם לא הגדרת את משתני הסביבה, שליחת מיילים לא תעבוד. זה בסדר לשלב הפיתוח, אבל חשוב להגדיר בפרודקשן.

3. **CSRF:** אחרי הוספת CSRF protection, כל טופס POST ללא token יקבל שגיאה 400. וודא שהוספת את ה-tokens לכל הטפסים.

4. **Rate Limiting:** ב-prod, מומלץ לשנות את ה-storage מ-"memory://" ל-Redis.

---

## 🧪 בדיקות

לאחר ביצוע השינויים, בדוק:

1. ✅ התחברות למערכת (עם סיסמה מוצפנת)
2. ✅ יצירת משתמש חדש
3. ✅ איפוס סיסמה
4. ✅ שליחת טפסים (אם הוספת CSRF tokens)
5. ✅ Rate limiting עובד (נסה 6 ניסיונות התחברות ב-דקה)

---

## 📚 משאבים

- [Flask-WTF Documentation](https://flask-wtf.readthedocs.io/)
- [Flask-Limiter Documentation](https://flask-limiter.readthedocs.io/)
- [Werkzeug Security](https://werkzeug.palletsprojects.com/en/2.3.x/utils/#werkzeug.security.generate_password_hash)

