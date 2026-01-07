# הנחיות אבטחה - ותקין בוטיק

## 🚀 התקנה ראשונית

### 1. התקנת חבילות נדרשות
כבר הותקנו האוטומטית:
- `flask-wtf` - CSRF Protection
- `flask-limiter` - Rate Limiting
- `python-dotenv` - ניהול משתני סביבה

### 2. יצירת קובץ .env
צור קובץ `.env` בתיקיית הפרויקט (באותה תיקייה של `app.py`) עם התוכן:

```env
SECRET_KEY=your-random-secret-key-minimum-32-characters
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-app-password
FLASK_ENV=development
```

**ליצירת SECRET_KEY חדש:**
```python
import secrets
print(secrets.token_hex(32))
```

### 3. הצפנת סיסמאות קיימות
הרץ את הסקריפט:
```bash
python migrate_passwords.py
```

זה ייצור backup ויצפין את כל הסיסמאות הקיימות.

---

## ⚠️ חשוב לפני שימוש

1. **קובץ .env** - אל תעלה אותו ל-Git!
2. **Backup** - שמור את `users_db.json.backup` במקום בטוח
3. **CSRF Tokens** - כל טופס POST צריך CSRF token (ראה למטה)

---

## 📝 הוספת CSRF Tokens לטפסים

### טופס HTML רגיל:
```html
<form method="POST">
    <input type="hidden" name="csrf_token" value="{{ csrf_token() }}"/>
    <!-- שאר השדות -->
</form>
```

### טופס JavaScript/Fetch:
```javascript
// הוסף Meta tag ב-head של התבנית:
<meta name="csrf-token" content="{{ csrf_token() }}">

// ב-JavaScript:
const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

fetch('/your-endpoint', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
    },
    body: JSON.stringify(data)
});
```

---

## 🔒 משתני סביבה נדרשים

| משתנה | תיאור | דוגמה |
|--------|-------|-------|
| `SECRET_KEY` | מפתח סודי למערכת (חובה) | `secrets.token_hex(32)` |
| `SMTP_USERNAME` | שם משתמש SMTP | `your-email@gmail.com` |
| `SMTP_PASSWORD` | סיסמת SMTP | `your-app-password` |
| `SMTP_SERVER` | שרת SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | פורט SMTP | `587` |
| `FLASK_ENV` | סביבת עבודה | `development` / `production` |

---

## ✅ מה עוד נדרש?

ראה את `SECURITY_CHANGES_LOG.md` לרשימה מפורטת של כל השינויים והפעולות הנדרשות.

