# סיכום - אינטגרציה עם Google Workspace

## מה הושלם ✅

1. **יצירת `requirements.txt`** - כולל כל ה-packages הנדרשים
2. **יצירת `google_auth.py`** - מודול מלא לניהול OAuth 2.0 ו-Gmail API
3. **עדכון `app.py`**:
   - הוספת routes: `/auth/google` ו-`/auth/google/callback`
   - תמיכה בהתחברות דרך Google OAuth
   - יצירת משתמשים אוטומטית מ-Google accounts
   - שמירת credentials מוצפנים במערכת
4. **עדכון `templates/login.html`** - הוספת כפתור "התחבר עם Google"
5. **יצירת `GOOGLE_SETUP_INSTRUCTIONS.md`** - הוראות מפורטות

## איך זה עובד

### התחברות
1. המשתמש לוחץ על "התחבר עם Google" בדף הכניסה
2. מועבר ל-Google OAuth consent screen
3. לאחר הסכמה, Google מחזיר authorization code
4. המערכת מחליפה את ה-code ב-access token ו-refresh token
5. המשתמש מתחבר למערכת אוטומטית
6. ה-credentials נשמרים מוצפנים ב-`users_db.json`

### שליחת מיילים
- כל משתמש שנכנס דרך Google יכול לשלוח מיילים דרך `send_email_via_gmail()` ב-`google_auth.py`
- הפונקציה משתמשת ב-Gmail API של המשתמש
- המייל נשלח מהאימייל של המשתמש עצמו

## מה צריך ממך עכשיו

### 1. התקנת Packages
```bash
pip install -r requirements.txt
```

### 2. יצירת Google OAuth Credentials
1. לך ל-[Google Cloud Console](https://console.cloud.google.com/)
2. צור/בחר project
3. הפעל את **Gmail API** ו-**Google+ API** (או User Info API)
4. צור **OAuth 2.0 Client ID** מסוג **Web application**
5. הוסף redirect URI: `http://localhost:5000/auth/google/callback`
6. העתק את **Client ID** ו-**Client Secret**

### 3. הגדרת `.env`
צור קובץ `.env` בתיקיית הפרויקט והוסף:

```env
GOOGLE_CLIENT_ID="your_client_id_here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_client_secret_here"
GOOGLE_REDIRECT_URI="http://localhost:5000/auth/google/callback"

# אופציונלי - אם רוצה לאפשר רק דומיין מסוים:
# GOOGLE_ALLOWED_DOMAINS="vatkin.co.il"
```

### 4. בדיקה
1. הפעל את השרת: `python app.py`
2. פתח `http://localhost:5000/login`
3. לחץ על "התחבר עם Google"
4. התחבר עם חשבון Google
5. אם הכל תקין, תועבר לדף הבית

## שימוש ב-Gmail API לשליחת מיילים

אם אתה רוצה שמשתמש מחובר ישלח מייל דרך החשבון שלו, השתמש ב:

```python
from google_auth import send_email_via_gmail

# בתוך route עם @login_required
user_id = current_user.id
success = send_email_via_gmail(
    user_id=user_id,
    to_email="recipient@example.com",
    subject="נושא המייל",
    body_html="<p>תוכן HTML של המייל</p>",
    body_text="תוכן טקסט פשוט",
    users_file=USERS_FILE  # מהגדרות app.py
)
```

## הערות חשובות

- כל משתמש צריך להתחבר פעם אחת דרך Google כדי לשמור credentials
- ה-credentials נשמרים מוצפנים (base64) ב-`users_db.json`
- אם משתמש משנה סיסמה ב-Google, הוא יצטרך להתחבר שוב
- לפרודקשן, עדכן את `GOOGLE_REDIRECT_URI` ל-URL של השרת שלך
- אם אתה רוצה לאפשר רק משתמשים מדומיין מסוים, השתמש ב-`GOOGLE_ALLOWED_DOMAINS`

## תיעוד נוסף

ראה `GOOGLE_SETUP_INSTRUCTIONS.md` להוראות מפורטות עם צילומי מסך.

