# סקירת מערכת מדידת זמן (Time Tracking)

מסמך זה מתאר את הארכיטקטורה והרכיבים של מערכת מדידת שעות העבודה באפליקציה.

---

## 1. סקירה כללית

המערכת מאפשרת למשתמשים להתחיל, לעצור ולבטל מדידת זמן עבודה **לפי משימה** (Task), המקושרת ללקוח (Client) ופרויקט (Project). יש **מדידה פעילה אחת בלבד** לכל משתמש בכל רגע. הזמן מחושב מהתחלה ועד עצירה ונשמר כרשומות (entries) לשימוש בדוחות וסיכומים.

---

## 2. שכבת אחסון (Backend Storage)

### קובץ נתונים: `time_tracking.json`

הנתונים נשמרים בקובץ JSON בשורש הפרויקט. המבנה:

```json
{
  "entries": [
    {
      "id": "uuid",
      "user_id": "admin",
      "client_id": "...",
      "project_id": "...",
      "task_id": "...",
      "start_time": "2026-01-15T09:47:29.649539",
      "end_time": "2026-01-15T09:47:33.645037",
      "duration_hours": 0.01,
      "note": "",
      "date": "2026-01-15"
    }
  ],
  "active_sessions": {
    "admin": {
      "id": "uuid",
      "user_id": "admin",
      "client_id": "...",
      "project_id": "...",
      "task_id": "...",
      "start_time": "2026-01-19T16:57:11.140629"
    }
  }
}
```

- **`entries`**: רשומות מדידות שהושלמו (לאחר "עצור"). כוללות `duration_hours`, `note`, `date`.
- **`active_sessions`**: מפתח = `user_id`. לכל משתמש מדידה פעילה אחת לכל היותר.

### פונקציות עזר

- **`load_time_tracking()`** — טוען מ-`time_tracking.json` (מוגדר ב-`backend/config.py` כ-`TIME_TRACKING_FILE` או ברירת מחדל `time_tracking.json`).
- **`save_time_tracking(data)`** — שומר את האובייקט חזרה לקובץ.

ממומש ב-`backend/utils/helpers.py` ומנוצל ב-Blueprint וב-`app.py`.

---

## 3. API (Backend)

### איפה מוגדר ה-API?

קיימים **שני מימושים**:

1. **`app.py`** — routes ישירים על ה-Flask app (שורות ~6146–6440).
2. **`backend/blueprints/time_tracking.py`** — Blueprint `time_tracking_bp`, שנרשם באפליקציה.

**בפועל** משתמשים ב-routes של `app.py` (אלו שמופיעים ב-Client, Dashboard וכו'). ה-Blueprint משתמש ב-`request.form` בעוד ה-Frontend שולח JSON; `app.py` תומך ב-`request.get_json()` וב-`request.form.to_dict()`.

### Endpoints

| Endpoint | Method | תיאור |
|----------|--------|--------|
| `/api/time_tracking/start` | POST | התחלת מדידה. body: `client_id`, `project_id`, `task_id`. |
| `/api/time_tracking/stop` | POST | עצירת מדידה ושמירת רשומה. body: `note` (אופציונלי). |
| `/api/time_tracking/cancel` | POST | ביטול מדידה פעילה בלי שמירה. |
| `/api/time_tracking/active` | GET | החזרת מדידה פעילה של המשתמש הנוכחי + `elapsed_seconds`. |
| `/api/time_tracking/entries` | GET | רשימת רשומות. query: `client_id`, `user_id`, `task_id`, `month` (אופציונלי). |
| `/api/time_tracking/report` | GET | דוח חודשי. query: `month`, `user_id`, `client_id` (אופציונלי). |

כולם דורשים התחברות (`@login_required`). ל-start/stop/cancel/active יש `@csrf.exempt`.

### Start

- בודק שיש `client_id`, `project_id`, `task_id`.
- בודק שאין למשתמש מדידה פעילה ב-`active_sessions`.
- יוצר `session` עם `id`, `user_id`, `client_id`, `project_id`, `task_id`, `start_time`.
- שומר ב-`active_sessions[user_id]`.

### Stop

- מוציא את ה-session של המשתמש.
- מחשב `duration_seconds` ו-`duration_hours`.
- יוצר `entry` עם כל השדות הרלוונטיים + `note` מה-body.
- מוסיף ל-`entries`, מוחק מ-`active_sessions`, מחזיר את ה-`entry`.

### Active

- מחזיר `active_sessions[user_id]` אם קיים.
- מוסיף `elapsed_seconds` לפי `start_time` → `now`.

### Entries

- מסנן לפי `user_id`, `client_id`, `task_id`, `month` אם נשלחו.
- ממיין לפי `start_time` (חדש ראשון).
- מוסיף `client_name`, `project_title`, `task_title`, `user_name` מתוך `load_data()` ו-`load_users()`.

### Report

- מסנן לפי `month` (חובה), `user_id`, `client_id`.
- מחשב `total_hours`, `by_client`, `by_user`.
- מחזיר `entries`, סיכומים, ורשימות משתמשים/לקוחות לשמות.

---

## 4. Frontend — רכיב `TimeTracker`

### מיקום

`src/components/TimeTracker.tsx`

### Props

- `clientId`, `projectId`, `taskId` — חובה.
- `compact?: boolean` — תצוגה מקוצרת (למשל בתוך כרטיס משימה).
- `onStop?: () => void` — callback אחרי עצירה מוצלחת (למשל לרענון סיכום שעות).

### לוגיקה עיקרית

1. **בטעינה** קורא ל-`GET /api/time_tracking/active` ובודק אם יש מדידה פעילה **למשימה הנוכחית** (`task_id` + `client_id` + `project_id`).
2. **התחלה**: `POST /api/time_tracking/start` עם `client_id`, `project_id`, `task_id`. מחזיק state מקומי של ה-session.
3. **עצירה**: `POST /api/time_tracking/stop` עם `note` (אם הוזן). אחרי הצלחה קורא ל-`onStop` אם הועבר.
4. **ביטול**: `POST /api/time_tracking/cancel` — מסיר מדידה פעילה בלי שמירה.

### טיימר ו־UI

- **Interval**: כל שנייה מעדכן `elapsedSeconds` מ-`start_time` עד עכשיו.
- **תצוגה**: `HH:MM:SS` ו־"X שעות ו-Y דקות" כשצריך.
- **תזכורת**: אחרי **שעה** (3600 שניות) נפתח דיאלוג — "המשך מדידה" / "עצור ושמור" / "בטל (ללא שמירה)".

### מצבים

- **לא פעיל**: כפתור "התחל מדידת זמן" (או "התחל" ב-compact).
- **פעיל**: צג זמן, כפתור "עצור", אופציה "הוסף הערה", ואייקון/סטטוס "פעיל".

---

## 5. שימוש ב-`TimeTracker` בממשק

| מקום | קובץ | הערות |
|------|------|--------|
| דף לקוח | `ClientPage.tsx` | בתוך רשימת המשימות לפרויקט. `compact={true}`, `onStop={fetchTimeTrackingSummary}`. |
| לוח בקרה | `Dashboard.tsx` | בוחרים משימה מ-`selectedTask`; מעבירים `client_id`, `project_id`, `task_id`. |
| כרטיס משימה | `TaskCard.tsx` | `compact`, מקושר ל-client/project/task. |
| עדכון מהיר | `QuickUpdate.tsx` | ליד כל משימה ברשימה, `compact`. |

בכל המקרים נדרשים `clientId`, `projectId`, `taskId` — התאמה ל-API.

---

## 6. סיכום שעות בדף לקוח

ב-`ClientPage`:

- **`fetchTimeTrackingSummary`**: `GET /api/time_tracking/entries?client_id={clientId}`.
- מחושבות:
  - **סה"כ שעות**: סכום `duration_hours` על כל ה-entries של הלקוח.
  - **שעות החודש**: סכום רק ל-entries ש-`date` מתחיל ב-`YYYY-MM` של החודש הנוכחי.

הערכים מוצגים ב-`ClientHeader` וב-ClientPage. אחרי "עצור" ב-TimeTracker קוראים ל-`onStop` → `fetchTimeTrackingSummary` לרענון.

---

## 7. דוחות שעות — `TimeTrackingReports`

### נתיב

`/time_tracking` (Route ב-`App.tsx`), רכיב `TimeTrackingReports.tsx`.

### פונקציונליות

- בחירת **חודש** (`YYYY-MM`), **משתמש**, **לקוח** (אופציונלי).
- `GET /api/time_tracking/report?month=...&user_id=...&client_id=...`.
- הצגת טבלה: עובד, לקוח, פרויקט, משימה, תאריך, התחלה, סיום, משך (שעות), הערות.
- **ייצוא CSV**: בניית קובץ מתוך `entries` והורדה.

בסרגל הצד: "דוחות שעות עבודה" (`/time_tracking`).

---

## 8. טיפוסים (Types)

ב-`src/types/index.ts`:

- **`TimeEntry`**: `id`, `user_id`, `client_id`, `project_id`, `task_id`, `start_time`, `end_time`, `duration_seconds`, `notes`, `user_name`, `client_name`, וכו'.
- **`ActiveSession`**: `client_id`, `project_id`, `task_id`, `start_time`, ועוד לפי הצורך.

השדות בפועל ב-API (למשל `duration_hours`, `note`, `date`) משמשים ב-UI ובי export.

---

## 9. תרשים זרימה (מצומצם)

```
[משתמש לוחץ "התחל"]
    → POST /api/time_tracking/start { client_id, project_id, task_id }
    → active_sessions[user_id] = session
    → Frontend: setInterval עדכון elapsedSeconds + תזכורת אחרי שעה

[משתמש לוחץ "עצור"]
    → POST /api/time_tracking/stop { note? }
    → entry חדש ב-entries, מחיקת active_sessions[user_id]
    → onStop?.() → fetchTimeTrackingSummary בדף לקוח

[דוח / סיכום]
    → GET /api/time_tracking/entries (או report)
    → סינון לפי client_id, month, user_id…
    → הצגה ב-ClientHeader, TimeTrackingReports, ייצוא CSV
```

---

## 10. הערות חשובות

- **מדידה אחת למשתמש**: לא ניתן להפעיל שתי מדידות במקביל לאותו user.
- **תזכורת שעה**: מונעת "שכחה" של מדידה פתוחה.
- **ביטול ללא שמירה**: `cancel` מוחק את ה-session ולא יוצר `entry`.
- **שמות**: `client_name`, `project_title`, `task_title` מחושבים ב-entries/report מתוך `load_data()` ו-`load_users()` — לא נשמרים ב-session או ב-entry גולמי.
- **התאמה ל-API**: ה-Frontend שולח JSON; ה-routes ב-`app.py` תומכים ב-JSON ו-form. ה-Blueprint ב-`time_tracking.py` כרגע עובד עם form — אם מחליפים ל-Blueprint בלבד, יש לוודא תאימות ל-JSON.
- **ניקוי מדידות "תקועות"**: לפני שימוש ב-`active_sessions` (ב-`/active` ו-`/start`), מסירים אוטומטית מדידות ש־`start_time` שלהן ישן מ־**2 שעות** (`_drop_stale_active_sessions`). מונע הודעות "מדידה של שעתיים" שנשארו פעילות בשרת (דפדפן נסגר וכו').

---

## 11. חיווי בדשבורד ומודל קונפליקט

### חיווי מדידה פעילה (TimeTrackingIndicator)

- **מיקום**: פינה שמאלית עליונה בדשבורד, באותה שורה עם "שלום, משתמש".
- **רכיב**: `src/components/dashboard/TimeTrackingIndicator.tsx`.
- **תפקיד**:
  - כשהמשתמש מפעיל מדידה: מציג את המדידה הפעילה — לקוח › פרויקט › משימה, טיימר מתעדכן כל שנייה, לחיצה מובילה לדף הלקוח.
  - כשאין מדידה: מציג "אין מדידה פעילה".
- **סקירה**: קורא ל-`GET /api/time_tracking/active` בטעינה וכל 30 שניות.

### מודל קונפליקט — "יש מדידה פעילה"

- **מתי מוצג**: כאשר המשתמש לוחץ "התחל" ב-TimeTracker בזמן שכבר רצה מדידה אחרת.
- **תוכן המודל**:
  - כותרת: "יש מדידה פעילה".
  - טקסט: "כרגע רצה מדידה עבור: [לקוח › פרויקט › משימה]" ו־זמן מצטבר.
  - **המשך במדידה הנוכחית**: סגירת המודל, ללא שינוי.
  - **עצור מדידה זאת והתחל מדידה חדשה**: עצירת המדידה הקיימת (ושמירתה כ-entry), התחלת מדידה חדשה למשימה הנוכחית.
- **API**: תגובת 400 מ-`POST /api/time_tracking/start` כוללת `active_session` מעושר בשמות (`client_name`, `project_title`, `task_title`) ו-`elapsed_seconds`. העשרה מתבצעת ב-`_enrich_time_tracking_session` ב-`app.py`.

---

*תיעוד מעודכן: ינואר 2026*
