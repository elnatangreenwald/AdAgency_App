# אזור הסטודיו (Studio)

מודול לניהול בקשות עיצוב במשרד, שמחליף את תהליך המייל הקיים. עובד פותח בקשת
עיצוב, מנהלת הסטודיו מקצה מעצבת, המעצבת עובדת ומעלה קבצים מוגמרים, והמבקש מאשר.
כל הקבצים (כולל כבדים) נשמרים ב-Cloudflare R2 בהעלאה/הורדה ישירה מהדפדפן.

## תוכן עניינים
- [תהליך העבודה](#תהליך-העבודה)
- [תפקידים והרשאות](#תפקידים-והרשאות)
- [מודל הנתונים](#מודל-הנתונים)
- [ארכיטקטורת קבצים (R2)](#ארכיטקטורת-קבצים-r2)
- [ממשק ה-API](#ממשק-ה-api)
- [התראות ומיילים](#התראות-ומיילים)
- [הקמת Cloudflare R2](#הקמת-cloudflare-r2)
- [בנייה ופריסה](#בנייה-ופריסה)

## תהליך העבודה

השלבים (סטטוסים) של בקשה:

`חדשה` -> `הוקצתה` -> `בעבודה` -> `ממתינה לאישור` -> `תיקונים` -> `הושלמה`

1. **חדשה** - עובד פותח בקשה (כותרת, בריף, לקוח אופציונלי, דדליין, דחיפות, סוג עבודה, פורמט, חומר גלם).
2. **הוקצתה** - מנהלת הסטודיו מקצה מעצבת (הבקשה עוברת אוטומטית מ"חדשה" ל"הוקצתה").
3. **בעבודה** - המעצבת עובדת על הבקשה.
4. **ממתינה לאישור** - המעצבת מעלה קבצים מוגמרים ומסמנת שמוכן; המבקש מקבל התראה.
5. **תיקונים** - אם נדרשים תיקונים, המבקש מחזיר לסטטוס זה + מוסיף הערה; המעצבת מקבלת התראה.
6. **הושלמה** - הבקשה אושרה ונסגרה.

## תפקידים והרשאות

מעבר לתפקידים הקיימים (`עובד`, `מנהל`, `אדמין`) נוספו שני תפקידים:

| תפקיד | יכולות באזור הסטודיו |
|-------|----------------------|
| `עובד` | פתיחת בקשות, צפייה בבקשות **שהוא פתח**, העלאת חומר גלם, אישור/החזרה לתיקונים |
| `מעצבת` | צפייה בבקשות **שהוקצו לה** (וכאלה שפתחה), העלאת קבצים מוגמרים, שינוי סטטוס |
| `מנהלת סטודיו` | צפייה ב**כל** הבקשות, הקצאת מעצבות, ניהול מלא |
| `מנהל` / `אדמין` | גישה מלאה כמו מנהלת סטודיו |

הגישה נאכפת גם בשרת (scoped) בכל ראוט, לא רק ב-UI. ההרשאה לדף `/studio` מוגדרת
כ-`עובד` ב-`permissions_db.json` (כלומר פתוח לכולם), אך הסינון בפועל נעשה לפי תפקיד.

## מודל הנתונים

טבלה חדשה `studio_requests` ב-PostgreSQL (`database.py`), בדפוס של Event/Supplier:
עמודות עזר לסינון מהיר + `data` מסוג JSONB לכל שאר התוכן.

| עמודה | תיאור |
|-------|-------|
| `id` | מזהה (UUID) |
| `status` | סטטוס הבקשה |
| `created_by` | מזהה המבקש |
| `assigned_designer` | מזהה המעצבת (nullable) |
| `data` (JSONB) | כל תוכן הבקשה (ראה למטה) |
| `created_at`, `updated_at` | חותמות זמן |

מבנה ה-`data` (וגם המבנה ב-`studio_db.json` במצב ללא DB):

```json
{
  "id": "uuid",
  "title": "כותרת",
  "brief": "תיאור חופשי",
  "client_id": "id | null",
  "client_name": "שם לקוח",
  "deadline": "YYYY-MM-DD",
  "priority": "נמוכה | רגילה | גבוהה | דחוף",
  "work_type": "מודעה | פוסט | באנר | ...",
  "format_required": "מידות/פורמט",
  "status": "חדשה",
  "created_by": "user_id",
  "assigned_designer": "user_id | null",
  "source_files": [ /* StudioFile - חומר גלם */ ],
  "deliverables": [ /* StudioFile - קבצים מוגמרים */ ],
  "comments": [ { "id", "text", "by", "by_name", "at" } ],
  "history": [ { "action", "from", "to", "by", "by_name", "at" } ],
  "created_at": "iso",
  "updated_at": "iso"
}
```

`StudioFile`:

```json
{
  "id": "uuid",
  "object_key": "studio/<request_id>/<kind>/<uuid>.<ext>",
  "original_name": "שם מקורי",
  "size": 12345,
  "content_type": "image/png",
  "kind": "source | deliverable",
  "uploaded_by": "user_id",
  "uploaded_by_name": "שם",
  "uploaded_at": "iso"
}
```

הטבלה נוצרת בעצלתיים (`_ensure_studio_schema`) בקריאה הראשונה, כדי לא לחסום את
עליית ה-worker ב-gunicorn (כמו `_ensure_clients_schema`).

## ארכיטקטורת קבצים (R2)

הקבצים **לא עוברים דרך שרת ה-Flask**. הזרימה:

1. הדפדפן מבקש מהשרת presigned PUT URL (`POST /api/studio/uploads/presign`).
2. הדפדפן מעלה את הקובץ **ישירות ל-R2** (PUT) עם progress bar.
3. הדפדפן מדווח לשרת על הקובץ שהועלה (`POST /api/studio/requests/<id>/files`).
4. הורדה: השרת מייצר presigned GET URL ומפנה אליו (`GET .../files/<file_id>/download`).

יתרונות: עוקף את מגבלת ה-120 שניות של gunicorn, לא מעמיס workers/זיכרון, תומך
בקבצים עד 5GB (presigned PUT יחיד), והקבצים **לא נמחקים בדיפלוי** (בניגוד ל-`static/`).

המודול: `backend/utils/storage.py` (boto3 מול endpoint תואם-S3).

## ממשק ה-API

| Method | Route | תיאור |
|--------|-------|-------|
| GET | `/api/studio/requests` | רשימת בקשות מסוננת לפי תפקיד |
| POST | `/api/studio/requests` | יצירת בקשה |
| GET | `/api/studio/requests/<id>` | פרטי בקשה |
| PATCH/POST | `/api/studio/requests/<id>` | עדכון סטטוס/שדות |
| POST | `/api/studio/requests/<id>/assign` | הקצאת מעצבת (מנהלת סטודיו) |
| DELETE | `/api/studio/requests/<id>` | מחיקת בקשה (יוצר/מנהלת) |
| POST | `/api/studio/requests/<id>/comments` | הוספת הערה |
| POST | `/api/studio/uploads/presign` | קבלת presigned PUT URL |
| POST | `/api/studio/requests/<id>/files` | רישום קובץ שהועלה |
| GET | `/api/studio/requests/<id>/files/<file_id>/download` | הורדה (redirect ל-presigned GET) |
| DELETE | `/api/studio/requests/<id>/files/<file_id>` | מחיקת קובץ |
| GET | `/api/studio/designers` | רשימת מעצבות להקצאה |

## התראות ומיילים

מעבר להתראות בתוך המערכת (פעמון), נשלח גם **מייל במקביל** בתקופת המעבר.
סוגי ההתראות (ב-`backend/utils/notifications.py`):

| סוג | מתי | למי |
|-----|-----|-----|
| `studio_new` | בקשה חדשה נפתחה | מנהלת/ות הסטודיו |
| `studio_assigned` | הוקצתה מעצבת | המעצבת |
| `studio_ready` | סטטוס -> "ממתינה לאישור" | המבקש |
| `studio_revisions` | סטטוס -> "תיקונים" | המעצבת |

מיילים נשלחים דרך `send_studio_notification_email` ב-`backend/utils/email.py`,
לפי הגדרות ה-SMTP הקיימות (`SMTP_*` env vars). אם SMTP לא מוגדר, המייל פשוט מדולג.

## הקמת Cloudflare R2

נדרשים משתני הסביבה הבאים (ב-Railway ובקובץ `.env` המקומי):

```
R2_ACCOUNT_ID=<account id>
R2_ACCESS_KEY_ID=<access key>
R2_SECRET_ACCESS_KEY=<secret>
R2_BUCKET=<bucket name>
R2_ENDPOINT=https://<account id>.r2.cloudflarestorage.com   # אופציונלי
```

שלבים:
1. חשבון Cloudflare -> R2 -> Create bucket (למשל `adagency-studio`).
2. R2 -> Manage R2 API Tokens -> Create API token עם הרשאת Object Read & Write ל-bucket.
   שמור את ה-Access Key ID וה-Secret.
3. ה-Account ID מופיע בעמוד R2.
4. **CORS על ה-bucket** (חובה כדי לאפשר העלאה ישירה מהדפדפן) - Settings -> CORS policy:

```json
[
  {
    "AllowedOrigins": ["https://web-production-0d983.up.railway.app", "http://localhost:5000"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

5. הזן את המשתנים ב-Railway (Variables) וב-`.env` המקומי.

## בנייה ופריסה

1. התקנת תלות חדשה: `boto3` (נוסף ל-`requirements.txt`).
2. בניית הפרונט: `npm run build` (הפלט ל-`static/dist`).
3. הגדרת משתני R2 ב-Railway (ראה למעלה).
4. פריסה. הטבלה `studio_requests` נוצרת אוטומטית בשימוש הראשון.
