# איך לוודא שמסך בחירת חשבון מופיע

## מה עשיתי

עדכנתי את הקוד כך שהוא:
1. **תמיד** שולח `prompt='select_account consent'`
2. בודק שהפרמטר אכן נמצא ב-URL

## איך לבדוק שהקוד עובד

### שלב 1: הפעל מחדש את השרת

אם השרת רץ, עצור אותו (Ctrl+C) והפעל מחדש:
```bash
python app.py
```

### שלב 2: נסה להתחבר

1. לך ל-`http://localhost:5000/login`
2. לחץ "התחבר עם Google"
3. **תסתכל בקונסול** (טרמינל) - תראה:
   ```
   [DEBUG] Authorization URL created with prompt: select_account consent
   [DEBUG] ✓ Prompt parameter IS in the URL (select_account found)
   ```

### שלב 3: פתח את ה-URL בדפדפן

אם תראה בקונסול את ה-URL המלא, העתק אותו ופתח בדפדפן. ה-URL צריך להכיל:
```
prompt=select_account%20consent
```
או
```
prompt=select_account+consent
```

## למה Google עדיין לא מציג מסך בחירה?

אפילו עם `prompt=select_account`, Google יכול לדלג על המסך אם:
1. יש רק **חשבון אחד מחובר** - אז אין מה לבחור
2. Google **זוכר את הבחירה הקודמת** מה-session

## פתרונות

### פתרון 1: התנתק מ-Google (הכי פשוט)

1. לך ל-[Google Account](https://myaccount.google.com/)
2. לחץ על התמונה שלך (פינה ימנית עליונה)
3. לחץ **"התנתק"** או **"Sign out"**
4. נסה להתחבר שוב דרך המערכת

### פתרון 2: חלון גלישה בסתר

1. לחץ **Ctrl+Shift+N** (Chrome/Edge) או **Ctrl+Shift+P** (Firefox)
2. פתח חלון גלישה בסתר
3. לך ל-`http://localhost:5000/login`
4. לחץ "התחבר עם Google"
5. עכשיו תראה מסך בחירת חשבון!

### פתרון 3: מחיקת Cookies של Google

1. לחץ **F12** (פתיחת Developer Tools)
2. לך ל-Tab **"Application"** (Chrome) או **"Storage"** (Firefox)
3. תחת **"Cookies"**, חפש `accounts.google.com`
4. לחץ ימני > **"Clear"** או מחק את כל ה-cookies
5. נסה להתחבר שוב

### פתרון 4: הוספת חשבון נוסף

אם יש לך רק חשבון אחד מחובר, הוסף חשבון נוסף:
1. לחץ על התמונה שלך ב-Google
2. לחץ **"Add another account"**
3. היכנס לחשבון העסקי
4. עכשיו כשתנסה להתחבר, תראה מסך בחירה

## בדיקה מהירה

**אם יש לך 2 חשבונות או יותר מחוברים** ו-Google עדיין לא מציג מסך בחירה:
- זה אומר ש-Google זוכר את הבחירה הקודמת
- השתמש בפתרון 1 (התנתקות) או 2 (גלישה בסתר)

## מה הקוד עושה עכשיו

הקוד **תמיד** שולח `prompt='select_account consent'` - זה אומר:
- `select_account` = Google **חייב** להציג מסך בחירת חשבון
- `consent` = Google **חייב** לבקש הסכמה מפורשת (חשוב לקבלת refresh_token)

אבל Google יכול לדלג על המסך אם הוא זוכר את הבחירה מה-session, ולכן צריך להתנתק או להשתמש בגלישה בסתר.


