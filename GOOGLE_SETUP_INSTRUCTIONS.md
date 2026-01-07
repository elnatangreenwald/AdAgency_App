# הוראות התקנה והגדרה - Google Workspace Integration

## שלב 1: התקנת Packages

הרץ את הפקודה הבאה בטרמינל:

```bash
pip install -r requirements.txt
```

או אם יש לך venv:

```bash
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

## שלב 2: יצירת Google OAuth Credentials

### 2.1. כניסה ל-Google Cloud Console

1. לך ל-[Google Cloud Console](https://console.cloud.google.com/)
2. בחר project קיים או צור project חדש

### 2.2. הפעלת Google APIs הנדרשות

1. עבור ל-**APIs & Services** > **Library**
2. חפש והפעל את ה-APIs הבאים:
   - **Gmail API** - לשליחת מיילים
   - **Google+ API** (או User Info API) - למידע על המשתמש

### 2.3. יצירת OAuth 2.0 Credentials

1. עבור ל-**APIs & Services** > **Credentials**
2. לחץ על **+ CREATE CREDENTIALS** > **OAuth client ID**
3. אם זו הפעם הראשונה, תתבקש להגדיר **OAuth consent screen**:
   - בחר **Internal** (אם יש לך Google Workspace) או **External**
   - מלא את הפרטים הבאים:
     - **App name**: ותקין בוטיק
     - **User support email**: האימייל שלך
     - **Developer contact information**: האימייל שלך
   - לחץ **SAVE AND CONTINUE**
   - **Scopes** - לחץ **ADD OR REMOVE SCOPES** והוסף:
     - `../auth/userinfo.email`
     - `../auth/userinfo.profile`
     - `../auth/gmail.send`
     - `../auth/gmail.compose`
   - לחץ **SAVE AND CONTINUE**
   - **Test users** (אם בחרת External) - הוסף את האימיילים של המשתמשים
   - לחץ **SAVE AND CONTINUE**
   - בדוק את הפרטים ולחץ **BACK TO DASHBOARD**

4. חזור ל-**Credentials** ולחץ **+ CREATE CREDENTIALS** > **OAuth client ID**
5. בחר **Web application**
6. מלא את הפרטים:
   - **Name**: AdAgency App
   - **Authorized redirect URIs**: הוסף:
     ```
     http://localhost:5000/auth/google/callback
     ```
     (לפיתוח - אם אתה בפרודקשן, הוסף גם את ה-URL של השרת שלך)
7. לחץ **CREATE**
8. תוצג לך חלון עם **Client ID** ו-**Client Secret** - העתק אותם!

## שלב 3: הגדרת משתני סביבה

1. צור קובץ `.env` בתיקיית הפרויקט (אם אין כזה כבר)
2. הוסף את השורות הבאות:

```env
# Google OAuth 2.0 Settings
GOOGLE_CLIENT_ID="your_client_id_here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_client_secret_here"
GOOGLE_REDIRECT_URI="http://localhost:5000/auth/google/callback"

# Google Workspace Domain Restriction (אופציונלי)
# אם אתה רוצה לאפשר רק משתמשים מדומיין מסוים (למשל: vatkin.co.il)
# הוסף:
GOOGLE_ALLOWED_DOMAINS="vatkin.co.il"
# אם אתה רוצה לאפשר כמה דומיינים, הפרד בפסיקים:
# GOOGLE_ALLOWED_DOMAINS="vatkin.co.il,company.com"
# אם לא תוסיף שורה זו, כל משתמש Google יוכל להתחבר
```

**⚠️ חשוב**: החלף את `your_client_id_here` ו-`your_client_secret_here` בערכים האמיתיים שקיבלת!

## שלב 4: בדיקות

### 4.1. בדיקת התחברות

1. הפעל את השרת: `python app.py`
2. פתח בדפדפן: `http://localhost:5000/login`
3. לחץ על **"התחבר עם Google"**
4. תתבקש להתחבר עם חשבון Google
5. תן הרשאות למערכת
6. אם הכל תקין, תועבר לדף הבית

### 4.2. בדיקת שליחת מייל

לאחר ההתחברות, המשתמש יוכל לשלוח מיילים דרך ה-Gmail API שלו.

## פתרון בעיות

### שגיאה: "redirect_uri_mismatch"
- ודא ש-`GOOGLE_REDIRECT_URI` ב-`.env` תואם בדיוק ל-**Authorized redirect URIs** ב-Google Cloud Console
- ודא שאתה משתמש ב-`http://localhost:5000/auth/google/callback` (לא `https://` לפיתוח)

### שגיאה: "access_denied"
- ודא שה-APIs מופעלות ב-Google Cloud Console
- אם בחרת "External" ב-OAuth consent screen, ודא שהוספת את האימייל שלך כ-Test User

### שגיאה: "invalid_client"
- ודא שה-Client ID ו-Client Secret נכונים ב-`.env`
- ודא שאין רווחים נוספים או תווים מיותרים

### המשתמש לא יכול לשלוח מיילים
- ודא שהמשתמש נתן את כל ההרשאות בעת ההתחברות
- ודא ש-Gmail API מופעל ב-Google Cloud Console
- בדוק את ה-logs של השרת לשגיאות

## הערות נוספות

- כל משתמש צריך להתחבר פעם אחת דרך Google כדי לשמור את ה-credentials שלו
- ה-credentials נשמרים מוצפנים ב-`users_db.json`
- אם משתמש משנה את הסיסמה ב-Google, הוא יצטרך להתחבר שוב
- אם אתה רוצה לאפשר רק משתמשים מדומיין מסוים, השתמש ב-`GOOGLE_ALLOWED_DOMAINS`

