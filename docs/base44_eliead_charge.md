# חיבור Base44 → חיוב ללקוח אליעד

## סטטוס

- ✅ הקוד נפרס ל-Railway
- ⚠️ **חובה:** להגדיר `CHARGE_WEBHOOK_API_KEY` ב-Railway Variables (ראה למטה)

---

## הגדרת מפתח ב-Railway (פעם אחת)

1. היכנס ל-[Railway Dashboard](https://railway.app)
2. בחר את הפרויקט של האפליקציה
3. בחר את השירות **web**
4. לשונית **Variables**
5. הוסף משתנה חדש:

| שם | ערך |
|----|-----|
| `CHARGE_WEBHOOK_API_KEY` | *(המפתח שקיבלת — אל תשתף בפומבי)* |

6. Railway יעשה redeploy אוטומטי (דקה-שתיים)

---

## מה לתת ל-Base44

### חיבור HTTP

| פרמטר | ערך |
|--------|-----|
| **URL** | `https://web-production-0d983.up.railway.app/api/webhook/charge` |
| **Method** | `POST` |
| **Content-Type** | `application/json` |

### Headers

| Header | ערך |
|--------|-----|
| `Content-Type` | `application/json` |
| `X-API-Key` | *(אותו מפתח כמו ב-Railway)* |

### Body (JSON)

```json
{
  "client_id": "b014f343-7b71-4942-89ad-433ad73d728b",
  "title": "{{שם_החיוב_מהטופס}}",
  "amount": {{סכום_החיוב_מהטופס}}
}
```

### מיפוי שדות

| שדה בטופס Base44 | שדה JSON | הערות |
|------------------|----------|--------|
| שם החיוב | `title` | חובה, טקסט |
| סכום החיוב | `amount` | חובה, **מספר** (ללא גרשיים) |
| *(קבוע)* | `client_id` | תמיד `b014f343-7b71-4942-89ad-433ad73d728b` (אליעד) |

---

## דוגמה מלאה

```http
POST https://web-production-0d983.up.railway.app/api/webhook/charge
Content-Type: application/json
X-API-Key: [YOUR_API_KEY]

{
  "client_id": "b014f343-7b71-4942-89ad-433ad73d728b",
  "title": "עיצוב פלייר",
  "amount": 2500
}
```

---

## תשובה מוצלחת

```json
{
  "success": true,
  "message": "החיוב נוצר בהצלחה",
  "charge": {
    "title": "עיצוב פלייר",
    "amount": 2500,
    "charge_number": "0420003"
  },
  "client": {
    "id": "b014f343-7b71-4942-89ad-433ad73d728b",
    "name": "אליעד"
  }
}
```

החיוב יופיע במסך **כספים**:  
https://web-production-0d983.up.railway.app/app/finance

---

## בדיקה (curl)

```bash
curl -X POST "https://web-production-0d983.up.railway.app/api/webhook/charge" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d "{\"client_id\":\"b014f343-7b71-4942-89ad-433ad73d728b\",\"title\":\"בדיקה\",\"amount\":100}"
```

---

## שגיאות

| קוד | משמעות |
|-----|---------|
| 401 + `CHARGE_WEBHOOK_API_KEY חסר` | המפתח לא הוגדר ב-Railway |
| 401 + `מפתח API לא תקין` | המפתח ב-Base44 לא תואם ל-Railway |
| 400 | חסר `title` |
| 404 | לקוח לא נמצא |

---

## אבטחה

- **אל** תשים את `X-API-Key` בקוד JavaScript בדפדפן
- השתמש רק ב-Backend / Webhook Action של Base44
