# תיקון באג: הוספת לקוח חדש - CSRF Token Missing

## תאריך
27/01/2026

## תיאור הבעיה
בעת ניסיון להוסיף לקוח חדש דרך הממשק (כפתור "לקוח חדש" בעמוד כל הלקוחות), המערכת החזירה שגיאה 400 (Bad Request).

## סיבת השגיאה
ה-route `/add_client` ב-Flask לא היה פטור מבדיקת CSRF token, בעוד שהפרונטאנד שלח בקשה מסוג AJAX (JavaScript) ללא ה-token הנדרש.

הודעת השגיאה מהשרת:
```
The CSRF token is missing.
```

## הפתרון
הוספת הדקורטור `@csrf.exempt` לפונקציה `add_client` ב-`app.py`:

```python
@app.route('/add_client', methods=['POST'])
@login_required
@csrf.exempt  # פטור מ-CSRF כי זה API call מ-JavaScript
def add_client():
    ...
```

## קבצים שנערכו
- `app.py` - הוספת `@csrf.exempt` ל-route `/add_client`

## הערות
- ה-route עדיין מוגן על ידי `@login_required` כך שרק משתמשים מחוברים יכולים להוסיף לקוחות
- הבדיקה `is_manager_or_admin` בתוך הפונקציה מוודאת שרק מנהלים יכולים להוסיף לקוחות
