# עמוד משימות — ניהול אינטראקטיבי

## תיאור

עמוד ייעודי לניהול משימות פתוחות עם לוח Kanban (ברירת מחדל) ותצוגת רשימה. כל משתמש רואה את המשימות שלו; מנהל/אדמין יכולים להפעיל **מצב ניהול** ולראות את כל המשימות הפתוחות בצוות.

## נתיב

- URL: `/app/tasks`
- ניווט: פריט **משימות** בסרגל הצד (מיד אחרי דשבורד)

## הרשאות והיקף

| מצב | מי | מה מוצג |
|-----|-----|---------|
| `mine` (ברירת מחדל) | כל משתמש | משימות שמשויכות למשתמש המחובר |
| `all` (מצב ניהול) | מנהל / אדמין בלבד | כל המשימות הפתוחות |

מצב ניהול ותצוגה (לוח/רשימה) נשמרים ב־`localStorage`:
- `tasks_page_admin_mode`
- `tasks_page_view`

## API

### `GET /api/tasks/board?scope=mine|all`

מחזיר משימות עם `status != הושלם` (כולל משימות ללא deadline).

שדות עיקריים: `task_id`, `title`, `status`, `priority`, `deadline`, `note`, `client_id`, `client_name`, `project_id`, `project_title`, `assignee_id`, `assignee_name`, `is_daily_task`, `created_at`.

זיהוי אחראי: `assignee` → `assigned_to` → `assigned_user`.

### עדכונים (קיימים)

- `POST /update_task_status/<client>/<project>/<task>` — סטטוס / deadline
- `POST /update_task_note/<client>/<project>/<task>` — הערה / "מה חסר"

## ממשק

### תצוגות

1. **רשימה (ברירת מחדל)** — מקובצת לפי לקוח, בתוך כל לקוח מיון לפי deadline, עם שינוי סטטוס inline.
2. **לוח (Kanban)** — עמודות: לביצוע · הועבר לדיגיטל · נשלח ללקוח (בלי עמודת "הועבר לסטודיו"; משימות עם הסטטוס הזה מוצגות תחת לביצוע). גרירה בין עמודות עם `@dnd-kit`.

### פאנל פרטים

לחיצה על משימה פותחת דיאלוג עם:
- סטטוס, תאריך, הערות ("מה חסר")
- מעקב שעות (`TimeTracker`)
- סימון כהושלם
- מעבר לדף הלקוח

### פילטרים

חיפוש חופשי, עדיפות, לקוח, באיחור / ללא תאריך. מונים בראש העמוד: פתוחות · באיחור · ללא תאריך.

## קבצים

| קובץ | תפקיד |
|------|--------|
| `app.py` | `get_tasks_for_board`, עזרי assignee/deadline |
| `src/pages/TasksPage.tsx` | עמוד ראשי |
| `src/components/tasks/*` | Kanban, List, Card, DetailSheet, types |
| `src/App.tsx` | route `tasks` |
| `src/components/layout/Sidebar.tsx` | קישור ניווט |

## תלויות

- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`
