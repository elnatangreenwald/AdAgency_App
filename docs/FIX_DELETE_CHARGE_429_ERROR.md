# תיקון שגיאת 429 (TOO MANY REQUESTS) במחיקת חיוב

## תיאור הבעיה
בעת ניסיון למחוק חיוב, המערכת החזירה שגיאת HTTP 429 (TOO MANY REQUESTS).

## סיבת הבעיה
1. **Vite Proxy** - הנתיב `/delete_charge` לא היה מוגדר ב-vite.config.ts, כך שהבקשות לא הועברו כראוי לשרת Flask.
2. **Rate Limiting** - הפונקציה `delete_charge` לא הייתה פטורה מ-rate limiting, מה שגרם לחסימה אחרי מספר בקשות.
3. **Time Tracking Auto-Refresh** - גם הנתיב `/api/time_tracking/active` לא היה פטור מ-rate limiting, וכיוון שהוא נקרא באופן אוטומטי הרבה פעמים, הוא הגיע למגבלה.

## שינויים שבוצעו

### 1. vite.config.ts
נוספו הנתיבים הבאים ל-proxy:
- `delete_charge`
- `update_charge_our_cost`
- `update_finance`

### 2. backend/blueprints/finance.py
- נוסף import של `limiter` מ-`backend.extensions`
- נוסף `@limiter.exempt` לפונקציה `delete_charge`

### 3. backend/blueprints/time_tracking.py
- נוסף import של `limiter` מ-`backend.extensions`
- נוסף `@limiter.exempt` לפונקציה `api_time_tracking_active`

## הוראות בדיקה
1. הפעל מחדש את שרת Vite: `npm run dev`
2. הפעל מחדש את שרת Flask: `python app.py` או `python run.py`
3. נסה למחוק חיוב - אמור לעבוד ללא שגיאה

## תאריך התיקון
27/01/2026
