# הוראות להפעלת חיבור Google

## שלב 1: וידוא Google Cloud Console

1. לך ל-[Google Cloud Console](https://console.cloud.google.com/)
2. בחר את הפרויקט שלך
3. לך ל-APIs & Services > Credentials
4. בחר את ה-OAuth 2.0 Client ID שלך
5. **וודא** שב-"Authorized redirect URIs" יש בדיוק:
   ```
   http://127.0.0.1:5000/auth/google/callback
   ```
   (אם יש `localhost` במקום `127.0.0.1`, שנה אותו)

## שלב 2: הוספת Email למשתמשים

כדי שמשתמש יוכל להתחבר עם Google, צריך להוסיף לו email ב-`users_db.json`:

1. פתח את `users_db.json`
2. לכל משתמש שרוצה להתחבר, הוסף שדה `"email"` עם המייל המדויק שלו
3. דוגמה:
   ```json
   {
       "admin": {
           "password": "...",
           "name": "מנהל המשרד",
           "role": "אדמין",
           "email": "admin@vatkin.co.il"
       }
   }
   ```

**או** השתמש בדף ניהול צוות:
- לך לדף `/admin/users`
- הוסף עובד חדש (עם email)
- או עדכן עובד קיים (הוסף email)

## שלב 3: בדיקה

1. הפעל את השרת: `python app.py`
2. לך ל-`http://127.0.0.1:5000/login`
3. לחץ על "התחבר עם Google"
4. בחר את החשבון Google עם המייל שרשום במערכת
5. תן הרשאה
6. אתה אמור להתחבר!

## הערות חשובות:

- **רק משתמשים עם email במערכת יכולים להתחבר** (לא נוצרים משתמשים חדשים אוטומטית)
- החיפוש הוא case-insensitive (לא משנה איך כתוב המייל)
- אם המייל לא נמצא, תראה הודעה: "המייל לא רשום במערכת"

