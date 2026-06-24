# Webhook ליצירת חיוב מ-Base44 (ומערכות חיצוניות)

## סקירה

Endpoint ציבורי (ללא login) ליצירת חיוב חדש במערכת. האימות מתבצע באמצעות מפתח API סודי.

## הגדרה בשרת

הוסף ל-`.env` (מקומי) או ל-Railway Variables (פרודקשן):

```env
CHARGE_WEBHOOK_API_KEY=your-secret-key-here
```

ליצירת מפתח אקראי:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## מה לתת ל-Base44

| פרמטר | ערך |
|--------|-----|
| **URL** | `https://web-production-0d983.up.railway.app/api/webhook/charge` |
| **Method** | `POST` |
| **Header** | `X-API-Key: YOUR_SECRET_KEY` |
| **Content-Type** | `application/json` |

### שדות בגוף הבקשה (JSON)

| שדה | חובה? | תיאור |
|-----|--------|--------|
| `client_id` | כן* | UUID של הלקוח במערכת |
| `client_name` | כן* | שם הלקוח (חלופה ל-`client_id`) |
| `title` | כן | כותרת החיוב |
| `amount` | לא | סכום החיוב |
| `description` | לא | תיאור נוסף |
| `our_cost` | לא | עלות לנו |

\* נדרש `client_id` **או** `client_name` (לא שניהם).

## דוגמת בקשה (curl)

```bash
curl -X POST "https://YOUR-DOMAIN/api/webhook/charge" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_SECRET_KEY" \
  -d '{
    "client_id": "abc-123-uuid",
    "title": "עיצוב באנר",
    "amount": 1500,
    "description": "מאתר Base44"
  }'
```

## דוגמת תשובה (201)

```json
{
  "success": true,
  "message": "החיוב נוצר בהצלחה",
  "charge": {
    "id": "...",
    "title": "עיצוב באנר",
    "amount": 1500,
    "charge_number": "0010005",
    "date": "24/06/26",
    "source": "webhook"
  },
  "client": {
    "id": "abc-123-uuid",
    "name": "שם הלקוח"
  }
}
```

## שגיאות נפוצות

| קוד | סיבה |
|-----|------|
| 401 | מפתח API חסר, שגוי, או `CHARGE_WEBHOOK_API_KEY` לא הוגדר בשרת |
| 400 | חסר `title` או חסר `client_id`/`client_name` |
| 404 | לקוח לא נמצא |
| 429 | יותר מ-60 בקשות בשעה מאותה IP |

## הגדרה ב-Base44

1. צור **Action / Webhook** על הכפתור.
2. הגדר **POST** לכתובת: `https://YOUR-DOMAIN/api/webhook/charge`
3. הוסף Header: `X-API-Key` = המפתח הסודי שלך.
4. שלח JSON עם השדות מהטופס (title, amount, client_id וכו').

> **טיפ:** אם Base44 לא תומך ב-Headers, אפשר להשתמש ב-`Authorization: Bearer YOUR_SECRET_KEY`.

## אבטחה

- אל תשים את המפתח בקוד צד-לקוח (JavaScript בדפדפן) — רק ב-Backend של Base44.
- החיוב מסומן עם `"source": "webhook"` לזיהוי.
- נשלח מייל התראה (אם SMTP מוגדר) כמו בחיובים רגילים.

## קובץ קוד

- `app.py` — route `/api/webhook/charge`
