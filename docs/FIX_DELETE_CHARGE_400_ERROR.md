# תיקון שגיאת 400 (Bad Request) במחיקת חיוב מדף הלקוח

## תיאור הבעיה
בעת ניסיון למחוק חיוב מתוך דף הלקוח (`/client/:id`), המערכת הציגה "שגיאה במחיקת החיוב" והקונסול דיווח על **400 Bad Request** ל-endpoint `/delete_charge/...`.

## סיבת הבעיה
1. **CSRF** – ה-route `delete_charge` ב-`app.py` לא היה פטור מ-CSRF. בקשת POST מ-React (דף לקוח) נחסמה על ידי Flask-WTF.
2. **תגובת redirect במקום JSON** – ה-endpoint החזיר `redirect(...)` (302) במקום `jsonify({'success': True})`. ה-SPA מצפה ל-JSON עם סטטוס 200.
3. **חסימת Rate Limiting** – לא היה `@limiter.exempt`, בניגוד ל-blueprint של finance (שם יש פטור).

## שינויים שבוצעו

### 1. `app.py` – ה-route `delete_charge`
- נוסף `@csrf.exempt` – פטור מ-CSRF כי הבקשה מגיעה מ-JavaScript (דף לקוח).
- נוסף `@limiter.exempt` – פטור מ-rate limiting כמו ב-finance blueprint.
- שינוי תגובה: במקום `redirect(...)` מחזירים `jsonify({'success': True})`.
- בשגיאות: `jsonify({'success': False, 'error': '...'})` עם 404/500, כדי שה-frontend יוכל להציג את ה-toast.

### 2. `src/pages/ClientPage.tsx` – `handleDeleteCharge`
- הבקשה עודכנה מ-`FormData` + `Content-Type: application/x-www-form-urlencoded` ל-`apiClient.post(..., {})`.
- ה-body לא נדרש לפעולת המחיקה; שליחת אובייקט ריק עם JSON פשוטה יותר ונכונה יותר.

## הוראות בדיקה
1. הפעל מחדש את שרת Flask: `python app.py` (או `python run.py`).
2. אם צריך – הפעל מחדש את Vite: `npm run dev`.
3. היכנס לדף לקוח, נסה למחוק חיוב – הפעולה אמורה להצליח וללא שגיאה באדום.

## קישור לתיקונים קודמים
- תיקון 429 (Rate Limiting): `docs/FIX_DELETE_CHARGE_429_ERROR.md`

## תאריך התיקון
28/01/2026
