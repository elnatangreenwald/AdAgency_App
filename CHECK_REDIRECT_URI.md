# תיקון redirect_uri_mismatch - הוראות מפורטות

## הבעיה
השגיאה `Error 400: redirect_uri_mismatch` אומרת שה-redirect URI שהשרת שולח לא תואם למה שמוגדר ב-Google Cloud Console.

## הפתרון - שלב אחר שלב

### שלב 1: בדוק מה השרת שולח

1. הפעל מחדש את השרת
2. נסה להתחבר עם Google
3. תראה בקונסול (טרמינל) שורה שמתחילה ב: `[DEBUG] Redirect URI being used:`
4. העתק את ה-URL הזה (למשל: `http://localhost:5000/auth/google/callback`)

### שלב 2: ודא ב-Google Cloud Console

1. לך ל-[Google Cloud Console](https://console.cloud.google.com/)
2. בחר את ה-project שלך (הפרויקט שבו יצרת את ה-OAuth credentials)
3. לך ל-**APIs & Services** > **Credentials** (בתפריט השמאלי)
4. לחץ על ה-**OAuth 2.0 Client ID** שיצרת (זה שיש בו את ה-Client ID שלך)
5. תחת **Authorized redirect URIs** (באזור התחתון של החלון), וודא שיש:
   
   **לפיתוח (localhost):**
   ```
   http://localhost:5000/auth/google/callback
   ```
   
   **חשוב:**
   - ✅ חייב להיות `http://` (לא `https://`)
   - ✅ חייב להיות `localhost` (לא `127.0.0.1`)
   - ✅ חייב להיות `/auth/google/callback` בדיוק (לא `/auth/google/callback/`)
   - ✅ לא צריך רווחים או תווים נוספים

6. אם ה-URL לא קיים - לחץ על **+ ADD URI** והוסף אותו
7. לחץ **SAVE** (כפתור כחול בתחתית החלון)

### שלב 3: אם אתה מריץ על שרת אחר

אם השרת שלך רץ על כתובת אחרת (למשל `http://192.168.1.100:5000`), הוסף גם את ה-URL הזה:
```
http://192.168.1.100:5000/auth/google/callback
```

### שלב 4: לפרודקשן

אם אתה בפרודקשן עם HTTPS, הוסף:
```
https://yourdomain.com/auth/google/callback
```

ועדכן את `.env`:
```env
GOOGLE_REDIRECT_URI="https://yourdomain.com/auth/google/callback"
```

### שלב 5: נסה שוב

1. ודא שהשרת רץ מחדש (אם שינית משהו)
2. נקה את ה-cache של הדפדפן (Ctrl+Shift+Delete)
3. נסה להתחבר שוב עם Google

## בחירת חשבון

אחרי שתתקן את ה-redirect URI, תראה מסך בחירת חשבון Google (אם יש לך כמה חשבונות) בזכות השינוי ב-`prompt='select_account consent'`.

## בדיקה מהירה

לאחר שמירת ה-URI ב-Google Cloud Console:
- לחץ SAVE
- המתן 2-3 שניות (לפעמים לוקח זמן לעדכון)
- נסה להתחבר שוב

אם עדיין יש בעיה, בדוק:
- שהקובץ `.env` מכיל: `GOOGLE_REDIRECT_URI="http://localhost:5000/auth/google/callback"`
- שאין רווחים או תווים נוספים ב-URI
- שה-URI ב-Google Cloud Console תואם בדיוק (אות גדולה/קטנה זה לא משנה)

