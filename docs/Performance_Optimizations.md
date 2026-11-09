# אופטימיזציות ביצועים

## תאריך: 9 בנובמבר 2026

## סיכום הבעיות שזוהו

### בעיות בצד הלקוח (Frontend)

1. **קריאות API מרובות בטעינת דשבורד**:
   - `/api/current_user` (אימות)
   - `/api/sidebar_users` (Layout)
   - `/api/time_tracking/active` (כל 10 שניות)
   - `/api/notifications/unread-count` (כל 15 שניות)
   - `/api/clients` (Dashboard)
   - `/api/tasks/calendar` (Dashboard)
   - `/api/sidebar_users` **כפילות!** (Dashboard)

2. **Polling תדיר מדי**:
   - TimeTrackingIndicator: כל 10 שניות
   - NotificationBell: כל 15 שניות

### בעיות בצד השרת (Backend)

1. **קריאת קבצי JSON מהדיסק בכל בקשה** - `load_data()` ו-`load_users()` קוראים את כל הקובץ בכל פעם
2. **אין caching בכלל** - כל בקשה גורמת לקריאת דיסק
3. **מורכבות O(n³)** בטעינת משימות (לולאות מקוננות)

---

## התיקונים שבוצעו

### 1. In-Memory Caching בשרת

**קובץ**: `backend/utils/helpers.py`

נוסף מנגנון caching עם TTL (Time To Live) של 5 שניות:

```python
_cache = {
    'users': None,
    'data': None,
}
_cache_lock = threading.Lock()
CACHE_TTL = 5  # שניות

def _is_cache_valid(cache_key: str, file_path: str) -> bool:
    """בודק אם ה-cache עדיין תקף לפי TTL ו-mtime של הקובץ"""
    ...

def invalidate_cache(cache_key: str = None):
    """מבטל cache - נקרא אחרי פעולות שמירה"""
    ...
```

- ה-cache נשמר בזיכרון ונבדק לפני כל קריאת דיסק
- ה-cache מתבטל אוטומטית כשהקובץ משתנה (mtime) או אחרי 5 שניות
- ה-cache מתבטל במפורש אחרי פעולות שמירה

### 2. Combined Dashboard Endpoint

**קובץ**: `backend/blueprints/api.py`

נוסף endpoint חדש `/api/dashboard` שמחזיר את כל נתוני הדשבורד בקריאה אחת:

```python
@api_bp.route('/api/dashboard')
@login_required
def api_dashboard():
    """
    Combined API endpoint for dashboard - returns all data needed in a single request.
    This reduces the number of API calls from 4+ to 1.
    """
    return jsonify({
        'success': True,
        'clients': clients_slim,      # רשימת לקוחות מצומצמת
        'calendar_tasks': tasks,      # משימות ללוח שנה
        'users': users_list,          # רשימת משתמשים
        'users_dict': users_dict      # מילון משתמשים
    })
```

### 3. שימוש ב-Endpoint המשולב

**קובץ**: `src/pages/Dashboard.tsx`

הקומפוננט עודכן להשתמש בקריאה אחת במקום 3:

```typescript
const fetchDashboardData = async () => {
  const response = await apiClient.get('/api/dashboard');
  if (response.data.success) {
    setClients(response.data.clients || []);
    setCalendarTasks(response.data.calendar_tasks || []);
    setUsers(response.data.users || []);
  }
};
```

### 4. הפחתת תדירות Polling

**קבצים**: 
- `src/components/dashboard/TimeTrackingIndicator.tsx`
- `src/components/NotificationBell.tsx`

שונה מ-10/15 שניות ל-30 שניות:

```typescript
// TimeTrackingIndicator
const t = setInterval(fetchActive, 30000);  // היה 10000

// NotificationBell
const interval = setInterval(() => {
  fetchUnreadCount();
  fetchNewNotifications();
}, 30000);  // היה 15000
```

---

## תוצאות צפויות

| מדד | לפני | אחרי | שיפור |
|------|------|------|--------|
| קריאות API בטעינת דשבורד | 7 | 4 | -43% |
| קריאות דיסק לבקשה | 2+ | 0 (מ-cache) | -100%* |
| Polling בדקה | 10 | 4 | -60% |

*\* ברוב המקרים (כש-cache תקף)*

---

## המלצות להמשך

1. **React Query / SWR**: הוספת ניהול state וcaching בצד הלקוח
2. **Pagination**: לעמודים עם הרבה נתונים (לקוחות, משימות)
3. **Lazy Loading**: טעינת נתונים רק כשצריך
4. **Database Indexing**: אם עוברים ל-PostgreSQL מלא, להוסיף אינדקסים
5. **Redis Cache**: לסביבת production עם מספר workers
