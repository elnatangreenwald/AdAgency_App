# תיקון בעיית רענון דף - Routing Fix

## תאריך: 2026-02-08

## הבעיה
כאשר המשתמש מרענן את הדף בכל כתובת שאינה העמוד הראשי, הוא הופנה אוטומטית לעמוד הראשי (`/app`) במקום להישאר באותה כתובת.

### סיבת הבעיה
אי-התאמה בין הגדרות ה-routing:
1. **React Router** - השתמש בנתיבים ללא prefix (למשל `/finance`, `/client/123`)
2. **Flask** - הגיש את אפליקציית React רק עבור נתיבים שמתחילים ב-`/app`

כתוצאה מכך, כשהמשתמש רענן דף כמו `/finance`, Flask לא זיהה את הנתיב והפנה לעמוד הראשי.

## הפתרון
הוספת `basename="/app"` ל-React Router כך שכל הנתיבים יהיו תחת `/app`:
- `/app/` - Dashboard
- `/app/finance` - Finance
- `/app/client/123` - Client Page
- וכו'

## קבצים שהשתנו

### 1. `src/App.tsx`
```tsx
// לפני
<BrowserRouter>

// אחרי
<BrowserRouter basename="/app">
```

### 2. `vite.config.ts`
```ts
// הוספת base path לבנייה
export default defineConfig({
  plugins: [react()],
  base: '/app/',  // חדש
  // ...
})
```

### 3. `app.py`
עדכון ה-catch-all route להגשת React app:
```python
@app.route('/app')
@app.route('/app/')
@app.route('/app/<path:path>')
def serve_react_app(path=''):
    """Serve React SPA for /app routes"""
    # ...
```

## איך זה עובד עכשיו
1. המשתמש נכנס ל-`/app/finance`
2. Flask מזהה שזה נתיב תחת `/app` ומגיש את `index.html`
3. React Router מקבל את הבקשה ומנתב לקומפוננטת Finance
4. **בעת רענון** - Flask שוב מגיש את `index.html` ו-React Router מנתב לאותו עמוד

## הערות
- כל הלינקים הפנימיים באפליקציה ימשיכו לעבוד כרגיל כי React Router מטפל בהם
- ה-`basename` מוסיף אוטומטית את `/app` לכל הנתיבים
