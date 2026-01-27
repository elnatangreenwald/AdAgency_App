# תיקון שגיאות מדידת זמן (429 ו-400)

## רקע

בבדיקה בדפדפן ב־`http://localhost:3000/` בעת לחיצה על "התחל מדידת זמן" התגלו שתי שגיאות:

1. **429 Too Many Requests** – על `GET /api/time_tracking/active` ו־`GET /api/notifications/unread-count`
2. **400 Bad Request** – על `POST /api/time_tracking/start` – "Error starting time tracking"

## סיבות שהתגלו

### 429 – Rate Limiting

- ב־`app.py` הוגדר **limiter מקומי** (`Limiter(app=app, ...)`).
- ה־blueprints (כולל `time_tracking` ו־`api`) משתמשים ב־`backend.extensions.limiter` ו־`@limiter.exempt` על הנתיבים הרלוונטיים.
- ה־exempt חל רק על ה־limiter שאליו מחובר ה־route; ה־app השתמש ב־limiter אחר, ולכן הפטורים מה־blueprints לא חלו ונוצרו 429.

### 400 – Bad Request על start

- ה־backend מחזיר 400 כאשר חסרים `client_id`, `project_id` או `task_id`.
- מאחורי פרוקסי (Vite או אחר) לפעמים `request.get_json()` לא קורא נכון את גוף הבקשה, ולכן הפלט נתפס כ־ריק וחלק מה־IDs חסרים.

## שינויים שבוצעו

### 1. שימוש ב־limiter של extensions ב־`app.py`

- **הוסר:** יצירת limiter מקומי ב־`app.py` ו־`from flask_limiter import Limiter` ו־`get_remote_address`.
- **נוסף:** חיבור ה־app ל־limiter של extensions:

```python
# Rate Limiting – use extensions limiter so blueprint @limiter.exempt applies
from backend.extensions import limiter
limiter.init_app(app)
```

כך כל ה־`@limiter.exempt` ב־blueprints (time_tracking, api וכו') חלים על אותו limiter שמחובר ל־app, ונתיבים כמו `/api/time_tracking/active` ו־`/api/notifications/unread-count` לא נחסמים ב־429.

### 2. קריאת body ב־`/api/time_tracking/start`

ב־`backend/blueprints/time_tracking.py` ב־`api_time_tracking_start`:

- קודם reads גוף הבקשה הגולמי: `request.get_data(as_text=True)` ואז `json.loads(raw)`.
- אם אין תוכן ב־body, משתמשים ב־`request.form`.
- השדות `client_id`, `project_id`, `task_id` (ו־`client_name`, `project_name`, `task_title`) נמשכים תמיד מאותו `data` אחד (JSON או form).

זה מטפל במקרים שבהם מאחורי פרוקסי ה־body לא נקרא כ־JSON בצד השרת.

## קבצים ששונו

- `app.py` – החלפת limiter מקומי ב־`limiter` מ־extensions ו־`limiter.init_app(app)`.
- `backend/blueprints/time_tracking.py` – לוגיקת קריאת body ב־`api_time_tracking_start` כמתואר למעלה.

## איך לבדוק

1. להפעיל Backend (למשל פורט 5000) ו־Frontend (למשל `npm run dev` על 3000).
2. להיכנס ל־`http://localhost:3000/`, להציג משימה (למשל מלוח השנה), לפתוח את המודל של המשימה.
3. ללחוץ "התחל מדידת זמן".

אמורות להפסק:

- שגיאות 429 על `time_tracking/active` ו־`notifications/unread-count`.
- שגיאת 400 על `time_tracking/start` (בתנאי שהמשימה כוללת `client_id`, `project_id`, `task_id` תקינים).

אם עדיין מתקבל 400 על start, לבדוק ב־Network/Backend שהבקשה ל־`/api/time_tracking/start` נשלחת עם גוף JSON שמכיל `client_id`, `project_id`, `task_id`.

## תאריך

ינואר 2026
