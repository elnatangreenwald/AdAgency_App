# שיוך לקוחות - עמוד עצמאי

## תיאור
הפיצ'ר של "שיוך לקוח" הועבר מעמוד ניהול צוות (`/admin/users`) לעמוד עצמאי ונפרד (`/client_assignment`).
העמוד החדש פתוח לכל המשתמשים המחוברים (לא רק אדמין).

## שינויים

### Backend (`app.py`)
- **`GET /api/client_assignment`** - API חדש שמחזיר רשימת משתמשים ולקוחות. פתוח לכל המשתמשים המחוברים.
- **`POST /api/client_assignment/assign`** - API חדש לביצוע שיוך לקוח לעובדים. מקבל JSON עם `client_id` ו-`user_ids`.
- הוספת `/client_assignment` לברירת המחדל של הרשאות דפים (רמת הרשאה: `עובד`).
- הוספת `/client_assignment` לרשימת `REACT_ROUTES`.
- הוספת `/client_assignment` לרשימת הדפים ב-`all_pages`.

### Frontend
- **`src/pages/ClientAssignmentPage.tsx`** - קומפוננטת עמוד חדשה הכוללת:
  - טופס שיוך לקוח לעובדים (בחירת לקוח + בחירת עובדים מרובים)
  - פאנל סטטוס שיוכים שמציג את כל הלקוחות והעובדים המשויכים אליהם
  - חיפוש לקוחות בפאנל הסטטוס
  - לחיצה על לקוח בפאנל טוענת אותו לטופס
- **`src/App.tsx`** - הוספת Route חדש: `client_assignment`
- **`src/components/layout/Sidebar.tsx`** - הוספת טאב "שיוך לקוחות" עם אייקון Link2, גלוי לכל המשתמשים
- **`src/pages/ManageUsers.tsx`** - הסרת סקשן שיוך לקוח וניקוי קוד לא בשימוש

## נתיבים
| נתיב | תיאור | הרשאה |
|---|---|---|
| `/app/client_assignment` | עמוד שיוך לקוחות | כל משתמש מחובר |
| `/api/client_assignment` | API - נתוני שיוך | כל משתמש מחובר |
| `/api/client_assignment/assign` | API - ביצוע שיוך | כל משתמש מחובר |
