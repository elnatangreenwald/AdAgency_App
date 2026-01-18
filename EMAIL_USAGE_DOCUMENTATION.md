# תיעוד שימושי דוא"ל במערכת

## סקירה כללית

המערכת משתמשת בדוא"ל במספר מקומות שונים. להלן פירוט מלא של כל השימושים:

---

## 1. 🔐 התחברות באמצעות Google OAuth (לא פעיל כרגע)

### מיקום בקוד:
- **קובץ**: `google_auth.py`
- **Route**: `/auth/google` ו-`/auth/google/callback`

### מה זה עושה:
- מאפשר למשתמשים להתחבר באמצעות חשבון Google שלהם
- משתמש ב-OAuth 2.0 של Google
- שומר את פרטי המשתמש (email, שם, תמונה) מהחשבון Google
- שומר credentials מוצפנים של Google לשימוש עתידי

### סטטוס:
⚠️ **לא עובד כרגע** - דורש הגדרה של:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` ב-Google Cloud Console

### פונקציות רלוונטיות:
- `get_authorization_url()` - יוצר URL להתחברות
- `get_user_info_from_token()` - מקבל פרטי משתמש מ-Google
- `save_credentials_to_user()` - שומר credentials מוצפנים

---

## 2. 📧 שליחת מייל לסטודיו בסיום מילוי טופס

### מיקום בקוד:
- **קובץ**: `app.py`
- **פונקציה**: `send_form_email()` (שורה 395)
- **Route**: `/submit_form/<form_token>` (שורה ~4650)

### מה זה עושה:
כאשר לקוח ממלא טופס ציבורי, המערכת שולחת מייל אוטומטי לסטודיו עם כל פרטי הטופס.

### פרטי המייל:

#### **שולח (FROM):**
1. **עדיפות ראשונה**: מייל של המשתמש המשויך ללקוח (אם יש לו email + email_password)
2. **עדיפות שנייה**: מייל של אלנתן (`ELNATAN@VATKIN.CO.IL`) אם קיים
3. **אם לא נמצא**: המייל לא נשלח (מחזיר False)

#### **נשלח ל (TO):**
- `studio@vatkin.co.il` (ברירת מחדל, ניתן לשנות ב-`FORM_EMAIL_TO`)
- + כל המשתמשים המשויכים ללקוח (אם יש להם email)

#### **תוכן המייל:**
- שם הטופס
- שם הלקוח
- תאריך ושעה
- כל השדות שהמשתמש מילא
- קישורי הורדה לקבצים שהועלו (אם יש)

#### **שרת SMTP:**
- **Gmail/vatkin.co.il**: `smtp.gmail.com:587`
- **Outlook/Hotmail**: `smtp-mail.outlook.com:587`
- **אחר**: מהגדרות סביבה (`SMTP_SERVER`, `SMTP_PORT`)

#### **אימות:**
- משתמש ב-`email_password` של המשתמש (מוצפן ב-base64)
- מחליף את הסיסמה לפני שליחה

### דוגמת שימוש:
```python
email_result = send_form_email(
    form_title="טופס הזמנה",
    client_name="לקוח לדוגמה",
    form_submission={...},
    uploaded_files={...},
    form_token="abc123"
)
```

### תוצאה:
- אם הצליח: מחזיר dict עם פרטי המייל שנשלח
- אם נכשל: מחזיר False
- המידע נשמר גם במשימה שנוצרת בפרויקט

---

## 3. 🔑 שליחת מייל לאיפוס סיסמה

### מיקום בקוד:
- **קובץ**: `app.py`
- **פונקציה**: `send_password_reset_email()` (שורה 970)
- **Route**: `/forgot_password` (שורה ~1040)

### מה זה עושה:
כאשר משתמש מבקש לאפס את הסיסמה שלו, המערכת שולחת מייל עם קישור לאיפוס.

### פרטי המייל:

#### **שולח (FROM):**
- `SMTP_USERNAME` מהגדרות סביבה

#### **נשלח ל (TO):**
- כתובת המייל של המשתמש שביקש איפוס

#### **תוכן המייל:**
- קישור לאיפוס סיסמה (תוקף: 24 שעות)
- הוראות ברורות בעברית
- עיצוב HTML מושקע

#### **שרת SMTP:**
- `SMTP_SERVER` מהגדרות סביבה (ברירת מחדל: `smtp.gmail.com`)
- `SMTP_PORT` מהגדרות סביבה (ברירת מחדל: `587`)

#### **דרישות:**
- `SMTP_USERNAME` חייב להיות מוגדר
- `SMTP_PASSWORD` חייב להיות מוגדר

### דוגמת שימוש:
```python
email_sent = send_password_reset_email(
    user_email="user@example.com",
    reset_token="abc123token"
)
```

### תוצאה:
- אם הצליח: מחזיר `True`
- אם נכשל: מחזיר `False`

---

## 4. 📨 שליחת מייל דרך Gmail API (לא בשימוש פעיל)

### מיקום בקוד:
- **קובץ**: `google_auth.py`
- **פונקציה**: `send_email_via_gmail()` (שורה 239)

### מה זה עושה:
פונקציה כללית לשליחת מיילים דרך Gmail API (לא דרך SMTP רגיל).

### פרטי המייל:

#### **שולח (FROM):**
- מייל של המשתמש מה-Google credentials שלו

#### **נשלח ל (TO):**
- כל כתובת שמועברת כפרמטר

#### **תכונות:**
- תומך בקבצים מצורפים
- תומך ב-HTML + טקסט
- משתמש ב-Gmail API במקום SMTP

### דרישות:
- המשתמש חייב להיות מחובר דרך Google OAuth
- המשתמש חייב להסכים ל-scope של `gmail.send`

### סטטוס:
⚠️ **לא בשימוש פעיל** - הפונקציה קיימת אבל לא נקראת משום מקום בקוד הנוכחי.

### דוגמת שימוש (תיאורטית):
```python
success = send_email_via_gmail(
    user_id="user123",
    to_email="recipient@example.com",
    subject="נושא המייל",
    body_html="<h1>תוכן HTML</h1>",
    body_text="תוכן טקסט",
    attachments=[...]
)
```

---

## 5. 💾 אחסון פרטי מייל במערכת

### מיקום בקוד:
- **קובץ**: `app.py`
- **Route**: `/admin/users` (שורה ~4360)

### מה זה עושה:
מאפשר למנהל המערכת להגדיר לכל משתמש:
- **email**: כתובת המייל שלו
- **email_password**: סיסמת המייל (מוצפנת ב-base64)

### שימוש:
- משמש לזיהוי משתמשים בהתחברות Google
- משמש לשליחת מיילים מטופסים (כשולח)
- נשמר ב-`users_db.json` (או בטבלת `users` ב-PostgreSQL)

### אבטחה:
- הסיסמה מוצפנת ב-base64 (לא הצפנה חזקה, אבל יותר טוב מטקסט פשוט)
- הסיסמה לא מוצגת בממשק המשתמש

---

## סיכום השימושים

| # | שימוש | סטטוס | שולח מ | נשלח ל | שרת |
|---|------|-------|--------|--------|-----|
| 1 | התחברות Google | ⚠️ לא פעיל | - | - | Google OAuth |
| 2 | מייל מטופס | ✅ פעיל | משתמש משויך/אלנתן | studio@vatkin.co.il + משתמשים | SMTP |
| 3 | איפוס סיסמה | ✅ פעיל | SMTP_USERNAME | משתמש | SMTP |
| 4 | Gmail API | ⚠️ לא בשימוש | משתמש Google | כל כתובת | Gmail API |
| 5 | אחסון פרטים | ✅ פעיל | - | - | - |

---

## הגדרות סביבה נדרשות

### לשליחת מיילים דרך SMTP:
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FORM_EMAIL_TO=studio@vatkin.co.il
```

### להתחברות Google:
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://your-domain.com/auth/google/callback
```

---

## הערות חשובות

1. **סיסמאות מייל**: הסיסמאות נשמרות מוצפנות ב-base64, אבל זה לא הצפנה חזקה. בפרודקשן כדאי לשקול הצפנה חזקה יותר.

2. **Gmail App Passwords**: אם משתמשים ב-Gmail, צריך ליצור "App Password" ולא להשתמש בסיסמה הרגילה.

3. **Google OAuth**: דורש הגדרה ב-Google Cloud Console ו-whitelist של redirect URI.

4. **שרת SMTP**: המערכת תומכת ב-Gmail, Outlook, ושרתי SMTP אחרים.

5. **טיפול בשגיאות**: כל הפונקציות מחזירות `True`/`False` או dict עם פרטים, ומדפיסות שגיאות לקונסול.

---

## קבצים רלוונטיים

- `app.py` - רוב הלוגיקה של שליחת מיילים
- `google_auth.py` - התחברות Google ו-Gmail API
- `templates/public_form.html` - טופס ציבורי ששולח מייל
- `setup_email.py` - סקריפט עזר להגדרת SMTP

---

**עודכן לאחרונה**: דצמבר 2024


