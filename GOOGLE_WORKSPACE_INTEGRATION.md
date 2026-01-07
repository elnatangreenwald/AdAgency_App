# אינטגרציה עם Google Workspace

## סקירה כללית

זה מסמך התיעוד ליישום אינטגרציה מלאה עם Google Workspace, שכוללת:
1. **Single Sign-On (SSO)** - התחברות עם חשבון Google
2. **Gmail API** - שליחת מיילים מהחשבון האישי של כל משתמש
3. **Google Calendar API** - סינכרון אירועים (אופציונלי)

---

## יתרונות

✅ **אבטחה משופרת** - אין צורך לנהל סיסמאות מקומיות
✅ **ניהול מרכזי** - מנהל ה-Workspace שולט בהרשאות
✅ **שליחת מיילים אישית** - כל משתמש שולח מהמייל שלו
✅ **סינכרון Calendar** - אירועים מופיעים ב-Google Calendar
✅ **חוויית משתמש טובה** - התחברות מהירה ללא סיסמאות

---

## מה צריך לעשות ב-Google Cloud Console

1. **יצירת Project חדש**
   - היכנס ל: https://console.cloud.google.com/
   - צור Project חדש (או בחר קיים)

2. **הפעלת APIs**
   - הפעל: **Google+ API** (להתחברות)
   - הפעל: **Gmail API** (לשליחת מיילים)
   - הפעל: **Google Calendar API** (אם רוצה סינכרון Calendar)

3. **יצירת OAuth 2.0 Credentials**
   - היכנס ל: **APIs & Services** → **Credentials**
   - לחץ **Create Credentials** → **OAuth client ID**
   - בחר **Web application**
   - הוסף **Authorized redirect URIs**: 
     - `http://localhost:5000/auth/google/callback` (לפיתוח)
     - `https://yourdomain.com/auth/google/callback` (לפרודקשן)

4. **שמור את הפרטים**
   - **Client ID**
   - **Client Secret**
   - שמור אותם ב-`.env`:

```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
```

---

## איך זה יעבוד

### 1. התחברות (Login)

**לפני:**
- משתמש מזין שם משתמש וסיסמה
- המערכת בודקת מול `users_db.json`

**אחרי:**
- משתמש לוחץ "התחבר עם Google"
- מעבר לדף ההתחברות של Google
- Google מחזיר Token
- המערכת בודקת שהאימייל שייך לדומיין שלכם (לדוגמה: `@yourcompany.com`)
- יוצר/מעדכן משתמש במערכת
- מתחבר אוטומטית

### 2. שליחת מיילים (Gmail API)

**לפני:**
- כל המיילים נשלחים מחשבון SMTP אחד (shared)

**אחרי:**
- כל משתמש שולח מהמייל האישי שלו
- המייל מופיע בשם המשתמש
- השולח רואה את המייל ב-Inbox שלו

---

## שינויים נדרשים בקוד

### 1. הוספת Packages

```bash
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

### 2. יצירת `google_auth.py`

מודול חדש לניהול OAuth ו-Gmail API.

### 3. עדכון `app.py`

- הוספת route: `/auth/google`
- הוספת route: `/auth/google/callback`
- עדכון `login()` route
- עדכון `send_form_email()` להשתמש ב-Gmail API

### 4. עדכון `login.html`

- הוספת כפתור "התחבר עם Google"

### 5. עדכון `users_db.json` Structure

הוספת שדות:
- `email` - האימייל של המשתמש ב-Google
- `google_id` - ה-ID הייחודי מ-Google
- `access_token` - Token לשליחת מיילים (מוצפן)
- `refresh_token` - Token לרענון (מוצפן)

---

## אבטחה

⚠️ **חשוב:**
- Tokens יישמרו **מוצפנים** ב-JSON
- רק משתמשים עם אימייל מדומיין שלכם יוכלו להתחבר
- Tokens יתרעננו אוטומטית לפני שפג התוקף

---

## תהליך היישום (תוכנית)

1. ✅ יצירת מסמך זה
2. ⏳ הוספת Packages הנדרשים
3. ⏳ יצירת `google_auth.py` module
4. ⏳ עדכון `app.py` עם OAuth routes
5. ⏳ עדכון `login.html` עם כפתור Google
6. ⏳ עדכון `send_form_email()` להשתמש ב-Gmail API
7. ⏳ עדכון `users_db.json` structure
8. ⏳ הוספת Domain validation
9. ⏳ בדיקות

---

## שאלות שצריך להחליט

1. **Domain Restriction:**
   - האם לאפשר רק משתמשים מדומיין מסוים? (מומלץ: כן)
   - מה שם הדומיין? (לדוגמה: `vatkin.co.il`)

2. **Backward Compatibility:**
   - האם לשמור על אפשרות התחברות עם סיסמאות? (מומלץ: כן, למשתמשים קיימים)

3. **Gmail API Scope:**
   - האם לכל המשתמשים תהיה הרשאה לשלוח מיילים? (מומלץ: כן)
   - האם רוצה גם לקרוא מיילים? (לא חובה)

4. **Google Calendar:**
   - האם רוצה סינכרון עם Calendar? (אופציונלי)

---

## הערות טכניות

- **OAuth Flow:** Authorization Code Flow (הבטוח ביותר)
- **Token Storage:** Tokens יישמרו מוצפנים ב-JSON
- **Token Refresh:** Tokens יתרעננו אוטומטית לפני שפג התוקף
- **Error Handling:** כל שגיאה תתועד ותוצג למשתמש

---

## צעדים הבאים

**אם אתה מוכן להתחיל:**
1. צור Project ב-Google Cloud Console
2. הפעל את ה-APIs הנדרשים
3. צור OAuth Credentials
4. שמור את הפרטים ב-`.env`
5. אמור לי ואתחיל ליישם!

---

**נוצר:** {{ datetime.now() }}
**מעודכן:** {{ datetime.now() }}

