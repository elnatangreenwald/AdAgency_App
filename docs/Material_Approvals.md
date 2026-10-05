# אזור אישור חומרים (Material Approvals)

מודול לשליחת חומרים (מודעות, באנרים, סרטונים, PDF וכו') ללקוח לאישור. עובד יוצר
בקשת אישור, מעלה קבצים, ושולח ללקוח קישור ייחודי. הלקוח פותח את הקישור **ללא
התחברות**, צופה בחומרים, ומאשר או מבקש תיקונים. יוצר הבקשה מקבל התראה בפעמון ומייל.

הקבצים נשמרים ב-Cloudflare R2, באותה תשתית של אזור הסטודיו (ראה [STUDIO.md](STUDIO.md)).
כש-R2 לא מוגדר (למשל בפיתוח מקומי) הקבצים נשמרים בדיסק המקומי של השרת (ראה [אחסון קבצים](#אחסון-קבצים)).

## תוכן עניינים
- [מבנה האזור](#מבנה-האזור)
- [תהליך העבודה](#תהליך-העבודה)
- [הרשאות](#הרשאות)
- [מודל הנתונים](#מודל-הנתונים)
- [ממשק ה-API](#ממשק-ה-api)
- [הדפים הציבוריים ללקוח](#הדפים-הציבוריים-ללקוח)
- [אחסון קבצים](#אחסון-קבצים)
- [התראות ומיילים](#התראות-ומיילים)
- [אבטחה](#אבטחה)
- [קבצים רלוונטיים](#קבצים-רלוונטיים)

## מבנה האזור

| דף | כתובת | תיאור |
|----|-------|-------|
| עמוד ראשי | `/app/approvals` | ריבוע לכל לקוח שיש לו לפחות פריט אחד (בכל סטטוס), ממוין לפי א-ב, עם חיפוש וספירה לפי סטטוס |
| עמוד לקוח פנימי | `/app/approvals/client/<client_id>` | כל הפריטים של הלקוח, סינון לפי פרויקט וסטטוס, והקישור לעמוד הלקוח המשותף |
| פריט | `/app/approvals/<id>` | גרסאות, קבצים, העלאה, שליחה ללקוח ותגובות |
| עמוד לקוח משותף (ציבורי) | `/app/client-approvals/<portal_token>` | העמוד שמשתפים עם הלקוח עצמו |
| פריט בודד (ציבורי) | `/app/approve/<token>` | קישור ישיר לפריט אחד |

### כותרת ושם פרויקט

לכל פריט יש **כותרת** (טקסט חופשי) ו**שם פרויקט** מתוך רשימה סגורה של הלקוח. הרשימה
מורכבת מהפרויקטים של הלקוח במערכת (דף הלקוח) ומשמות שנוספו ידנית בכפתור `+` ליד השדה.
השמות שנוספו ידנית נשמרים לכל לקוח בנפרד (ב-`approval_portals`). השרת דוחה שם פרויקט שלא נמצא ברשימה.

רשימות הלקוחות והפרויקטים ממוינות לפי א-ב.

## תהליך העבודה

### סטטוסים

| סטטוס | משמעות | איך מגיעים אליו |
|-------|--------|------------------|
| `טיוטה` | הלקוח לא רואה את הפריט | ביצירה, בפתיחת גרסה חדשה, או ידנית |
| `ממתין לאישור לקוח` | הפריט מוצג ללקוח עם כפתורי אישור/הערה | כפתור "שליחה ללקוח" או בחירה בסטטוס (נדרש קובץ אחד לפחות) |
| `נשלחה הערת לקוח` | הלקוח ביקש תיקונים | הלקוח שלח הערה, או עדכון ידני (הערה חובה) |
| `מאושר לקוח` | הלקוח אישר | הלקוח אישר, או עדכון ידני |
| `עלה לאוויר` | החומרים פורסמו | ידני בלבד |

הסטטוס משתנה בכרטיס "סטטוס" בדף הפריט. **עדכון ידני** של `מאושר לקוח` / `נשלחה הערת לקוח`
נועד למקרים שהלקוח הגיב מחוץ למערכת (טלפון, וואטסאפ). הוא נרשם כתגובה על הגרסה הנוכחית
עם השם "<העובד> (עדכון ידני)" ו-`manual: true`, ולא שולח התראה.

רשומות מהגרסה הראשונה של המודול (`נשלח ללקוח`, `נדרשים תיקונים`, `אושר`) ממופות אוטומטית
לשמות החדשים בקריאה (`LEGACY_APPROVAL_STATUSES` ב-`app.py`).

### זרימה רגילה

1. **טיוטה** - עובד יוצר בקשה (לקוח, כותרת ושם פרויקט חובה, תיאור/הנחיות ללקוח) ומעלה קבצים לגרסה 1.
2. **ממתין לאישור לקוח** - העובד לוחץ "שליחה ללקוח". מרגע זה הפריט מופיע בעמוד הלקוח
   המשותף. אפשר גם לשלוח ללקוח קישור ישיר לפריט הבודד.
3. הלקוח פותח את העמוד שלו (או את הקישור הישיר), מזין שם, ו:
   - **מאושר לקוח** - לוחץ "אני מאשר/ת" (הערה אופציונלית).
   - **נשלחה הערת לקוח** - כותב אילו תיקונים נדרשים (הערה חובה).
4. בסבב תיקונים העובד פותח **גרסה חדשה** (עם הערה "מה השתנה"). הבקשה חוזרת לסטטוס
   `טיוטה`, מעלים את הקבצים המתוקנים ושולחים שוב. **הקישור נשאר אותו קישור**.
5. **עלה לאוויר** - אחרי הפרסום העובד מעדכן ידנית. הלקוח רואה "החומרים עלו לאוויר".

בזמן שהבקשה בטיוטה (למשל בזמן הכנת גרסה חדשה) הלקוח רואה הודעה שהחומרים בעדכון.

כללים:
- אי אפשר להוסיף או למחוק קבצים בגרסה שכבר נשלחה. כדי להחליף קבצים פותחים גרסה חדשה.
- הלקוח יכול להגיב פעם אחת לכל גרסה. אחרי אישור לא ניתן להגיב שוב.
- אפשר לפתוח גרסה חדשה גם כשהגרסה נשלחה ועוד לא התקבלה תגובה (למשל אם נמצאה טעות).

## הרשאות

| מי | מה רואה |
|----|---------|
| מנהל / אדמין | כל הבקשות |
| יוצר הבקשה | הבקשות שלו |
| עובד משויך ללקוח | בקשות של הלקוחות שמשויכים אליו |

מחיקת בקשה: היוצר או מנהל/אדמין בלבד. ההרשאות נאכפות בשרת בכל ראוט.

## מודל הנתונים

טבלה `material_approvals` ב-PostgreSQL ([database.py](../database.py)), באותו דפוס של
`studio_requests`: עמודות עזר + `data` מסוג JSONB. הטבלה נוצרת בעצלתיים
(`_ensure_approvals_schema`) בשימוש הראשון. במצב ללא DB הנתונים נשמרים ב-`approvals_db.json`.

| עמודה | תיאור |
|-------|-------|
| `id` | מזהה (UUID) |
| `token` | מזהה ציבורי לקישור (ייחודי, עם אינדקס) |
| `status` | סטטוס |
| `client_id` | מזהה לקוח (nullable) |
| `created_by` | מזהה היוצר |
| `data` (JSONB) | כל התוכן |
| `created_at`, `updated_at` | חותמות זמן |

מבנה ה-`data`:

```json
{
  "id": "uuid",
  "token": "random-urlsafe-token",
  "title": "כותרת",
  "project_name": "שם פרויקט מהרשימה הסגורה",
  "description": "הנחיות ללקוח",
  "client_id": "id | null",
  "client_name": "שם לקוח",
  "status": "טיוטה | ממתין לאישור לקוח | נשלחה הערת לקוח | מאושר לקוח | עלה לאוויר",
  "created_by": "user_id",
  "versions": [
    {
      "number": 1,
      "note": "מה השתנה בגרסה",
      "files": [ /* ApprovalFile */ ],
      "created_at": "iso",
      "created_by": "user_id",
      "created_by_name": "שם",
      "sent_at": "iso | null",
      "response": { "decision": "approve | changes", "name": "שם הלקוח", "comment": "...", "at": "iso" }
    }
  ],
  "client_responses": [ { "version": 1, "decision": "...", "name": "...", "comment": "...", "at": "iso" } ],
  "history": [ { "action": "created | sent | new_version | client_response", "from": "...", "to": "...", "version": 1, "by": "user_id | null", "by_name": "...", "at": "iso" } ],
  "created_at": "iso",
  "updated_at": "iso"
}
```

`ApprovalFile`: `id`, `object_key` (`approvals/<id>/v<n>/<uuid>.<ext>` ב-R2, עם קידומת `local:`
באחסון מקומי, או `db:<blob_id>` באחסון ב-DB), `original_name`, `size`, `content_type`, `uploaded_by`, `uploaded_by_name`, `uploaded_at`.

טבלה נוספת `approval_portals` (עמוד הלקוח המשותף), נוצרת יחד עם `material_approvals`.
במצב ללא DB: `approval_portals.json`.

| עמודה | תיאור |
|-------|-------|
| `id` | מזהה הלקוח (`client_id`) |
| `token` | מזהה ציבורי לעמוד הלקוח (ייחודי) |
| `data` (JSONB) | `project_names` (שמות פרויקטים שנוספו ידנית), `created_at` |

רשומת ה-portal נוצרת אוטומטית בפעם הראשונה שנכנסים לעמוד הלקוח הפנימי או מוסיפים לו פרויקט.

## ממשק ה-API

### פנימי (דורש התחברות)

| Method | Route | תיאור |
|--------|-------|-------|
| GET | `/api/approvals?client_id=&status=` | רשימה מסוננת לפי הרשאה |
| GET | `/api/approvals/clients` | לקוחות שיש להם פריטים, עם ספירה לפי סטטוס (לעמוד הראשי) |
| GET | `/api/approvals/clients/<client_id>` | עמוד לקוח: פרטי לקוח, `portal_url`, `project_options`, פריטים |
| GET | `/api/approvals/clients/<client_id>/projects` | הרשימה הסגורה של שמות הפרויקטים |
| POST | `/api/approvals/clients/<client_id>/projects` | הוספת שם פרויקט (`name`) |
| POST | `/api/approvals` | יצירה (`client_id`, `title`, `project_name` חובה). טיוטה + גרסה 1 ריקה + token |
| GET | `/api/approvals/<id>` | פרטי בקשה |
| PATCH | `/api/approvals/<id>` | עדכון `title` / `description` / `project_name`, ושינוי `status` (עם `comment` בעדכון ידני). `action: "send"` שקול ל-`status: "ממתין לאישור לקוח"` |
| DELETE | `/api/approvals/<id>` | מחיקה (כולל ניקוי קבצים מ-R2) |
| POST | `/api/approvals/<id>/versions` | פתיחת גרסה חדשה (`note` אופציונלי) |
| POST | `/api/approvals/uploads/presign` | presigned PUT URL (`approval_id`, `filename`, `content_type`). מחזיר `mode: "r2"` או `mode: "local"` |
| POST | `/api/approvals/<id>/files` | רישום קובץ שהועלה ל-R2 לגרסה הנוכחית |
| POST | `/api/approvals/<id>/files/upload_local` | העלאת קובץ (multipart, שדה `file`) דרך השרת, ל-DB או לדיסק. רק כש-R2 לא מוגדר |
| GET | `/api/approvals/<id>/files/<file_id>/download` | הורדה. עם `?inline=1` לצפייה בדפדפן |
| DELETE | `/api/approvals/<id>/files/<file_id>` | מחיקת קובץ (רק מגרסה שלא נשלחה) |

כל השדות הפנימיים מוחזרים בתוספת `public_url`, `current_version`, `files_count`, `preview_files`, `created_by_name`.

### ציבורי (ללא התחברות)

| Method | Route | Rate limit | תיאור |
|--------|-------|------------|-------|
| GET | `/api/public/approvals/<token>` | 120 לשעה | נתוני תצוגה של פריט בודד |
| GET | `/api/public/approvals/<token>/files/<file_id>` | 600 לשעה | הגשת קובץ מקומי (`?download=1` להורדה) |
| POST | `/api/public/approvals/<token>/respond` | 20 לשעה | `{decision: "approve" \| "changes", name, comment}` |
| GET | `/api/public/approval-portal/<portal_token>` | 120 לשעה | עמוד הלקוח: פרטי לקוח וכל הפריטים שנשלחו אליו |
| GET | `/api/public/approval-portal/<portal_token>/items/<id>/files/<file_id>` | 600 לשעה | הגשת קובץ מקומי מעמוד הלקוח |
| POST | `/api/public/approval-portal/<portal_token>/items/<id>/respond` | 30 לשעה | תגובה לפריט מתוך עמוד הלקוח |

תשובת פריט ציבורי כוללת רק: כותרת, שם פרויקט, תיאור, שם לקוח, סטטוס, `available`, `can_respond`,
הגרסה האחרונה שנשלחה (מספר, הערה, קבצים עם `view_url` / `download_url`, תגובה), ותגובות
על גרסאות קודמות. בעמוד הלקוח מתווסף גם `id` של הפריט (לא ה-token שלו).

## הדפים הציבוריים ללקוח

שני הדפים הם נתיבי React מחוץ ל-Layout (כמו איפוס סיסמה), ומשתמשים באותה רכיב תצוגה
(`ApprovalItemView`).

**עמוד הלקוח המשותף** (`/app/client-approvals/<portal_token>`):
- לוגו ושם הלקוח, ומספר הפריטים שממתינים לאישור.
- לשונית "ממתין לאישור" (ברירת מחדל כשיש כאלה) ולשונית "הכל".
- הפריטים מקובצים לפי שם פרויקט. לחיצה על פריט פותחת אותו עם הקבצים וטופס האישור.
- מוצגים רק פריטים שנשלחו ללקוח לפחות פעם אחת. טיוטות שעוד לא נשלחו לא מופיעות.

**פריט בודד** (`/app/approve/<token>`): קישור ישיר לפריט אחד.

בשני הדפים:
- תצוגה מקדימה: תמונות, וידאו (נגן) ו-PDF (iframe). קבצים אחרים עם כפתור הורדה.
- שם המגיב נשמר ב-localStorage כדי שלא יצטרכו להקליד אותו שוב.
- מותאם למובייל ו-RTL.

## אחסון קבצים

- **R2 מוגדר** (פרודקשן): העלאה ישירה מהדפדפן ל-R2 עם presigned URL, והגשה דרך presigned GET.
- **R2 לא מוגדר**: ה-presign מחזיר `mode: "local"`, והדפדפן מעלה את הקובץ לשרת
  (`upload_local`). השרת שומר אותו לפי מצב האחסון:
  - **עם DB** (`USE_DATABASE=true`, פרודקשן ב-Railway): תוכן הקובץ נשמר בטבלה `approval_file_blobs`
    (`id`, `data` bytea, `content_type`, `size`), ו-`object_key` הוא `db:<blob_id>`. כך הקבצים
    שורדים דיפלוי, כי הדיסק של Railway נמחק בכל דיפלוי. מגבלה: 50MB לקובץ (`APPROVAL_DB_FILE_MAX_BYTES`).
  - **בלי DB** (פיתוח מקומי): הקבצים נשמרים ב-`uploads/approvals/<id>/v<n>/` (מחוץ ל-`static`,
    ולא בגיט), ו-`object_key` מתחיל ב-`local:`. השרת חוסם נתיב שמנסה לצאת מתיקיית האחסון.

  בשני המקרים הקבצים מוגשים דרך ראוטים שבודקים הרשאה או token.

קבצים שהועלו לדיסק של Railway לפני המעבר לאחסון ב-DB אבדו בדיפלוי, וצריך להעלות אותם מחדש.
לקבצי וידאו גדולים עדיף להגדיר R2.

### תצוגה וקבצים חסרים

- `FilePreview.tsx` כולל שלושה רכיבים:
  - `FileThumb`: תמונה ממוזערת (תמונה, פריים ראשון של וידאו, או אייקון).
  - `FileViewer`: תצוגה מלאה של תמונה, וידאו או PDF.
  - `FileViewerDialog`: חלון צפייה בתוך האפליקציה. כפתור הצפייה בדף הבקשה פותח אותו במקום טאב חדש.
- כשהקובץ חסר, השרת לא מחזיר JSON גולמי:
  - בצפייה (`inline`) הוא מחזיר תמונת SVG עם הכיתוב "הקובץ לא זמין".
  - בהורדה הוא מחזיר דף HTML קצר עם הסבר.
  - בפרונט, `onError` של התמונה או הווידאו מציג הודעה "הקובץ לא זמין, יש להעלות אותו מחדש".
- תמונות ממוזערות מוצגות במקומות האלה:
  - כרטיסי הפריטים בעמוד הלקוח הפנימי: עד 3 קבצים מהגרסה הנוכחית, ו-"+N" אם יש יותר.
  - רשימת הפריטים בעמוד הלקוח המשותף: הקובץ הראשון.
  - רשימת הקבצים בדף הבקשה.
- לצורך זה כל פריט פנימי מוחזר עם `preview_files`: `[{id, name, content_type, url}]`.

## התראות ומיילים

| סוג | מתי | למי |
|-----|-----|-----|
| `approval_approved` | הלקוח אישר | יוצר הבקשה |
| `approval_changes` | הלקוח ביקש תיקונים | יוצר הבקשה |

ההתראה כוללת `approval_id` ו-`link`, ולחיצה עליה בפעמון מנווטת לדף הבקשה. המייל נשלח
דרך `send_studio_notification_email` (אותן הגדרות SMTP) וכולל את הערות הלקוח וקישור לבקשה.

## אבטחה

- ה-token נוצר עם `secrets.token_urlsafe(32)` (כ-256 ביט), ואין ראוט ציבורי שמאפשר לרשום בקשות.
- הראוטים הציבוריים מוגבלים ב-rate limit.
- התשובה הציבורית לא חושפת מזהי משתמשים, את ה-token או מפתחות R2. הקישורים לקבצים הם
  presigned URLs שתוקפם 30 דקות (`R2_DOWNLOAD_URL_TTL`).
- רישום קובץ מאומת מול הקידומת `approvals/<id>/` כדי שלא יהיה אפשר לשייך קבצים של בקשה אחרת.
- אורך השם וההערה של הלקוח מוגבל (100 / 3000 תווים).
- תגובה נוספת על גרסה שכבר קיבלה תגובה נחסמת (409).
- מחיקת בקשה מבטלת את הקישור מיידית.

## קבצים רלוונטיים

| קובץ | תפקיד |
|------|-------|
| [database.py](../database.py) | מודלים `MaterialApproval`, `ApprovalPortal`, `ApprovalFileBlob` |
| [database_helpers.py](../database_helpers.py) | `load/save/delete_material_approval`, `find_material_approval_by_token`, `load/save_approval_portal`, `find_approval_portal_by_token`, `save/load/delete_approval_blob` |
| [app.py](../app.py) | אזור `MATERIAL APPROVALS API` + fallback ל-JSON |
| [backend/utils/storage.py](../backend/utils/storage.py) | `build_approval_object_key`, `generate_view_url` |
| [backend/utils/notifications.py](../backend/utils/notifications.py) | סוגי ההתראות החדשים |
| [src/pages/Approvals.tsx](../src/pages/Approvals.tsx) | עמוד ראשי: ריבועי לקוחות |
| [src/pages/ApprovalClient.tsx](../src/pages/ApprovalClient.tsx) | עמוד לקוח פנימי |
| [src/pages/ApprovalDetail.tsx](../src/pages/ApprovalDetail.tsx) | פרטי בקשה, גרסאות, העלאה ושליחה |
| [src/pages/ClientApprovalPortal.tsx](../src/pages/ClientApprovalPortal.tsx) | עמוד הלקוח המשותף (ציבורי) |
| [src/pages/PublicApproval.tsx](../src/pages/PublicApproval.tsx) | פריט בודד (ציבורי) |
| [src/components/approvals/](../src/components/approvals/) | `NewApprovalDialog`, `ProjectSelect`, `ApprovalItemView`, `FilePreview`, `utils` |
| [src/lib/api.ts](../src/lib/api.ts) | `uploadApprovalFile` (R2 או מקומי) |
