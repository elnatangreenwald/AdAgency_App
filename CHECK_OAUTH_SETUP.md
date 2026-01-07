# בדיקת הגדרות OAuth - אחרי שה-URI הוגדר

## מה אני רואה
✅ ה-URI מוגדר נכון: `http://localhost:5000/auth/google/callback`

## מה לעשות עכשיו

### 1. ודא שאתה משתמש ב-Client ID הנכון

אם יצרת Client חדש, צריך:
1. לבדוק מה ה-Client ID החדש (תחת "Client ID" במסך)
2. לעדכן את ה-`.env` עם ה-Client ID וה-Client Secret החדשים

### 2. שמור את ההגדרות (אם לא שמרת)
- לחץ על כפתור **"Save"** הכחול (אם הוא עדיין פעיל)

### 3. המתן
- הערה במסך: "It may take 5 minutes to a few hours for settings to take effect"
- **המתן 2-3 דקות** לפחות
- אם עדיין לא עובד, נסה שוב בעוד כמה דקות

### 4. נקה cache
1. לחץ Ctrl+Shift+Delete
2. בחר "Cookies" ו-"Cached images and files"
3. לחץ "Clear data"
4. נסה להתחבר שוב

### 5. בדוק את הקונסול
כשאתה מנסה להתחבר, בקונסול (טרמינל) אמור להופיע:
```
[DEBUG] Redirect URI being used: http://localhost:5000/auth/google/callback
```
ודא שזה תואם בדיוק למה שמוגדר ב-Google Cloud Console.

### 6. אם יצרת Client חדש
אם יצרת OAuth Client חדש (ולא ערכת את הישן), צריך:
1. להעתיק את ה-Client ID החדש (מספר ארוך שמתחיל ב-`...`.apps.googleusercontent.com`)
2. להעתיק את ה-Client Secret החדש
3. לעדכן את ה-`.env`:

```env
GOOGLE_CLIENT_ID="המספר_החדש.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="המספר_החדש"
```

4. הפעל מחדש את השרת

## אם עדיין לא עובד אחרי 5 דקות

נסה:
1. יצירת OAuth Client חדש לחלוטין
2. או בדוק שיש לך את ה-Client ID הנכון (אולי יש לך כמה)

