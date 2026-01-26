# Task Assignment Feature - שיוך משימות לעובדים

## סקירה כללית

פיצ'ר זה מאפשר לעובדים לפתוח משימות עבור עובדים אחרים במערכת. כאשר משימה נפתחת עבור משתמש אחר, המשתמש המקבל מקבל התראה בזמן אמת.

## מרכיבי הפיצ'ר

### 1. Backend - מודול התראות

**קובץ:** `backend/utils/notifications.py`

מודול זה מנהל את כל ההתראות במערכת:

```python
# פונקציות עיקריות
create_notification(user_id, notification_type, data)  # יצירת התראה חדשה
get_user_notifications(user_id, unread_only, limit)    # קבלת התראות משתמש
get_unread_count(user_id)                              # ספירת התראות שלא נקראו
mark_notifications_read(notification_ids, user_id)     # סימון כנקראו
get_new_notifications_since(user_id, since_timestamp)  # התראות חדשות מאז timestamp
```

**מבנה התראה:**
```json
{
  "id": "uuid",
  "user_id": "recipient_user_id",
  "type": "task_assigned",
  "task_id": "task_uuid",
  "client_id": "client_id",
  "project_id": "project_id",
  "from_user_id": "creator_user_id",
  "from_user_name": "שם הפותח",
  "task_title": "כותרת המשימה",
  "client_name": "שם הלקוח",
  "message": "משימה חדשה הוקצתה לך: ...",
  "created_at": "ISO timestamp",
  "read": false
}
```

### 2. Backend - API Endpoints

**קובץ:** `backend/blueprints/api.py`

| Endpoint | Method | תיאור |
|----------|--------|-------|
| `/api/notifications` | GET | קבלת התראות המשתמש |
| `/api/notifications/unread-count` | GET | מספר התראות שלא נקראו |
| `/api/notifications/new` | GET | התראות חדשות מאז timestamp |
| `/api/notifications/mark-read` | POST | סימון התראות כנקראו |

### 3. שדה created_by במשימות

בכל משימה חדשה נוסף שדה `created_by` שמכיל את ה-ID של המשתמש שיצר את המשימה.

**קבצים מעודכנים:**
- `backend/blueprints/clients.py` - פונקציית `add_task`
- `app.py` - פונקציית `quick_add_task`
- `src/types/index.ts` - הוספת `created_by?: string` לטיפוס Task

### 4. Frontend - קומפוננטת הפעמון

**קובץ:** `src/components/NotificationBell.tsx`

קומפוננטה המציגה:
- אייקון פעמון עם Badge של מספר ההתראות שלא נקראו
- Dropdown עם רשימת ההתראות
- Polling כל 15 שניות לבדיקת התראות חדשות
- Toast alert כאשר מגיעה התראה חדשה

**מיקום:** ב-Header (מובייל) וב-Sidebar (דסקטופ)

### 5. Frontend - שיוך בטופס משימות

**קובץ:** `src/pages/Dashboard.tsx`

בטופס פתיחת משימה מהירה נוסף dropdown "שייך ל:" עם:
- ברירת מחדל: "לי" (המשתמש הנוכחי)
- רשימת כל המשתמשים במערכת

### 6. Frontend - חיווי ויזואלי

**קובץ:** `src/components/clients/TaskCard.tsx`

כאשר משימה נפתחה על ידי משתמש אחר, מופיע Badge כחול:
```
נפתחה ע"י: [שם הפותח]
```

## זרימת תהליך

```
1. משתמש A פותח משימה ובוחר "שייך ל: משתמש B"
2. המשימה נשמרת עם:
   - created_by: משתמש A
   - assigned_user: [משתמש B]
3. נוצרת התראה עבור משתמש B
4. משתמש B מקבל:
   - Toast alert (אם מחובר)
   - Badge אדום על הפעמון
   - ההתראה מופיעה ברשימת ההתראות
5. כאשר משתמש B רואה את המשימה, הוא רואה את ה-Badge "נפתחה ע"י: משתמש A"
```

## נראות משימות

- **פותח המשימה:** רואה את המשימה בדף הלקוח
- **מקבל המשימה:** רואה את המשימה בדף הלקוח + מקבל התראה
- **משתמשים אחרים:** רואים את המשימה אם יש להם גישה ללקוח

## קבצים שנוספו/עודכנו

### קבצים חדשים:
- `backend/utils/notifications.py` - מודול התראות
- `src/components/NotificationBell.tsx` - קומפוננטת פעמון
- `notifications_db.json` - קובץ אחסון התראות (נוצר אוטומטית)

### קבצים מעודכנים:
- `backend/config.py` - הוספת NOTIFICATIONS_FILE
- `backend/utils/__init__.py` - ייצוא פונקציות התראות
- `backend/blueprints/api.py` - endpoints חדשים
- `backend/blueprints/clients.py` - created_by + התראות
- `app.py` - עדכון quick_add_task
- `src/types/index.ts` - טיפוסים חדשים
- `src/pages/Dashboard.tsx` - dropdown שיוך
- `src/components/clients/TaskCard.tsx` - חיווי מי פתח
- `src/components/layout/Layout.tsx` - שילוב NotificationBell

## תלויות

- פיצ'ר זה משתמש במערכת ה-Toast הקיימת (`use-toast.ts`)
- Polling מבוסס על setInterval (לא WebSocket)
- אחסון ב-JSON (notifications_db.json)

## הגדרות ניתנות לשינוי

- **תדירות Polling:** 15 שניות (ניתן לשנות ב-NotificationBell.tsx)
- **מספר התראות בdropdown:** 20 (ניתן לשנות בקריאת ה-API)
- **משך הצגת Toast:** 5000ms (ניתן לשנות ב-NotificationBell.tsx)
