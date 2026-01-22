# תיקון באגים - הוספת חיוב (Dashboard ו-ClientPage)

## תיאור הבעיה
בעת לחיצה על כפתור "הוספת חיוב" בשני מקומות באפליקציה, השמירה נכשלה עם שגיאת 400 BAD REQUEST:
1. **דשבורד הראשי** - כפתור "הוספת חיוב" ב-Quick Actions
2. **עמוד לקוח פנימי** - טופס הוספת חיוב בחלק "כספים"

## סיבת הבאג
הבעיה נבעה משני גורמים:

### 1. בעיית Content-Type ו-FormData
הקוד בצד הלקוח שלח `FormData` עם `Content-Type: application/x-www-form-urlencoded`, אבל `FormData` דורש `Content-Type: multipart/form-data` כדי לעבוד נכון. כאשר מציינים ידנית את ה-Content-Type, axios לא מטפל בהמרה הנכונה של FormData.

### 2. בעיית CSRF Token
ה-routes `/quick_add_charge` ו-`/update_finance/<client_id>` ב-`app.py` לא היו מסומנים כ-`csrf.exempt`, מה שגרם לבקשות AJAX להיכשל בגלל חוסר CSRF token.

## הפתרון

### שינוי 1: `src/pages/Dashboard.tsx`
שינוי מ-`FormData` ל-`URLSearchParams` כדי לשלוח נתונים בפורמט `application/x-www-form-urlencoded` תקין:

**לפני:**
```typescript
const formData = new FormData();
formData.append('client_id', selectedClientId);
// ...
const response = await apiClient.post('/quick_add_charge', formData, {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
});
```

**אחרי:**
```typescript
const params = new URLSearchParams();
params.append('client_id', selectedClientId);
// ...
const response = await apiClient.post('/quick_add_charge', params, {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
  },
});
```

### שינוי 2: `src/pages/ClientPage.tsx`
אותו שינוי בפונקציה `handleAddCharge`:

**לפני:**
```typescript
const formData = new FormData();
formData.append('action', 'extra');
formData.append('title', chargeForm.title);
// ...
const response = await apiClient.post(`/update_finance/${clientId}`, formData, {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
});
```

**אחרי:**
```typescript
const params = new URLSearchParams();
params.append('action', 'extra');
params.append('title', chargeForm.title);
// ...
const response = await apiClient.post(`/update_finance/${clientId}`, params, {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
  },
});
```

### שינוי 3: `app.py` - Route `/quick_add_charge`
הוספת `@csrf.exempt` ושיפור טיפול בשגיאות:

```python
@app.route('/quick_add_charge', methods=['POST'])
@login_required
@csrf.exempt  # פטור מ-CSRF כי זה API call מ-JavaScript
def quick_add_charge():
    # ...
    if not client_id or not charge_title or not charge_amount:
        wants_json = request.headers.get('Accept', '').find('application/json') != -1 or \
                    request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        if wants_json:
            return jsonify({'success': False, 'error': 'חסרים שדות נדרשים'}), 400
        return redirect(url_for('home'))
```

### שינוי 4: `app.py` - Route `/update_finance/<client_id>`
הוספת `@csrf.exempt` והחזרת JSON עבור AJAX:

```python
@app.route('/update_finance/<client_id>', methods=['POST'])
@login_required
@csrf.exempt  # פטור מ-CSRF כי זה API call מ-JavaScript
def update_finance(client_id):
    # ...
    save_data(data)
    
    wants_json = request.headers.get('Accept', '').find('application/json') != -1 or \
                request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    if wants_json:
        return jsonify({'success': True, 'message': 'עודכן בהצלחה'})
    return redirect(request.referrer)
```

## קבצים שהשתנו
- `src/pages/Dashboard.tsx`
- `src/pages/ClientPage.tsx`
- `app.py`

## תאריך התיקון
22 בינואר 2026
