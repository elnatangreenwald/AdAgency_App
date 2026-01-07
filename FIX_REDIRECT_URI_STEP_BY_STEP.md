# תיקון redirect_uri_mismatch - הוראות שלב אחר שלב

## שלב 1: בדוק מה השרת שולח

1. הפעל את השרת (אם הוא לא רץ)
2. נסה להתחבר עם Google
3. תראה בקונסול (טרמינל) שורה:
   ```
   [DEBUG] Redirect URI being used: http://localhost:5000/auth/google/callback
   ```
4. **העתק את ה-URL הזה** (החלק אחרי `Redirect URI being used:`)

## שלב 2: ודא ב-Google Cloud Console

1. לך ל-[Google Cloud Console](https://console.cloud.google.com/)
2. **בחר את ה-project הנכון** (הפרויקט שבו יצרת את ה-OAuth credentials)
3. בתפריט השמאלי, לך ל: **APIs & Services** > **Credentials**
4. תמצא רשימה של "OAuth 2.0 Client IDs"
5. **חפש את זה שיש בו את ה-Client ID שלך**: `341579716920-...`
6. **לחץ על ה-Client ID הזה** (לחץ על השם או על העיפרון)
7. גלול **למטה** עד שתגיע ל-**"Authorized redirect URIs"**
8. תראה רשימה של URIs (אם יש)

### עכשיו בדוק:

**אם יש כבר URI ברשימה:**
- האם זה בדיוק `http://localhost:5000/auth/google/callback`?
- אם לא - **מחק את ה-URI הלא נכון** (לחץ על X) או **ערוך אותו**
- לחץ **+ ADD URI**
- הכנס: `http://localhost:5000/auth/google/callback`
- לחץ **SAVE**

**אם הרשימה ריקה:**
- לחץ **+ ADD URI**
- הכנס בדיוק: `http://localhost:5000/auth/google/callback`
- **אין רווחים לפני או אחרי**
- לחץ **SAVE**

### וידוא:
- ✅ זה `http://` (לא `https://`)
- ✅ זה `localhost` (לא `127.0.0.1`)
- ✅ זה `/auth/google/callback` (לא `/auth/google/callback/`)
- ✅ אין רווחים לפני או אחרי

## שלב 3: המתן ואז נסה שוב

1. לאחר לחיצה על **SAVE** ב-Google Cloud Console
2. **המתן 5-10 שניות** (לפעמים לוקח זמן לעדכן)
3. **נסה להתחבר שוב** עם Google
4. נקה cache של הדפדפן (Ctrl+Shift+Delete) אם צריך

## אם עדיין לא עובד

### בדוק שהבחרת את ה-project הנכון
- אולי יש לך כמה projects ב-Google Cloud
- ודא שאתה ב-project שבו יצרת את ה-OAuth credentials

### בדוק שה-Client ID נכון
- ה-Client ID שלך: `341579716920-e88vrb6k1jjdk6591eg4gnc03e3aljar.apps.googleusercontent.com`
- ודא שאתה עורך את ה-Client ID הזה (לא אחר)

### נסה ליצור Client ID חדש
אם כלום לא עובד, אפשר ליצור Client ID חדש:
1. ב-Google Cloud Console > Credentials
2. לחץ **+ CREATE CREDENTIALS** > **OAuth client ID**
3. בחר **Web application**
4. שם: "AdAgency App 2" (או כל שם)
5. Authorized redirect URIs: `http://localhost:5000/auth/google/callback`
6. לחץ **CREATE**
7. העתק את ה-Client ID וה-Client Secret החדשים
8. עדכן את ה-`.env` עם הערכים החדשים

