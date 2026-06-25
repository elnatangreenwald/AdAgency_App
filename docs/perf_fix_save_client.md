# שיפור ביצועים: הוספת/עדכון משימה איטית

## התסמין

הוספת משימה חדשה (וגם עדכון סטטוס/תאריכים) הראתה עיכוב של כמה שניות —
המשתמש לחץ "הוסף", לא קיבל חיווי, ורק אחרי המתנה ארוכה המשימה נוספה.

## סיבת השורש

כל פעולת שמירה השתמשה ב-`save_data(data)`, שבמצב DB (`USE_DATABASE=true`) עשתה:

1. `load_data()` — טוען את **כל** הלקוחות עם כל ה-JSONB שלהם (projects, tasks,
   charges, files, contacts).
2. שינוי משימה אחת בזיכרון.
3. `save_data(data)` — עוברת על **כל לקוח**, מבצעת `SELECT` נפרד לכל אחד, מציבה
   מחדש את כל השדות, ומסמנת `flag_modified` על 6 עמודות JSONB → SQLAlchemy מבצע
   `UPDATE` שמשכתב את **כל השורה** (כולל בלוקי JSONB גדולים) עבור **כל הלקוחות**.

מול PostgreSQL מרוחק ב-Railway זה אומר עשרות round-trips ושכתוב כל בסיס הנתונים
על כל הוספת משימה בודדת — מכאן העיכוב של שניות.

## התיקון

נוספה פונקציה `save_client(client)` שמעדכנת **רק את הלקוח הבודד** שהשתנה:
`SELECT` אחד + `UPDATE` אחד במקום N. זהו שיפור מ-O(N) ל-O(1).

### קבצים

- `database_helpers.py`
  - נוסף `_upsert_client(db, client_data)` — לוגיקת find-or-create משותפת.
  - `save_data` עכשיו משתמשת ב-`_upsert_client` (ללא שינוי התנהגות).
  - נוספה `save_client(client_data)` — מסלול מהיר ללקוח בודד.
- `app.py`
  - נוסף `save_client` ל-imports (מצב DB) + מימוש מקביל למצב JSON.
  - **כל** המסלולים שמשנים לקוח בודד עברו מ-`save_data(data)` ל-`save_client(...)`:
    - **משימות:** `/add_task`, `/quick_add_task`, `/update_task_status`,
      `/update_task`, `/update_task_note`, `/api/task/update_dates`, `/delete_task`
    - **פרויקטים:** `/add_project`, `/delete_project`
    - **חיובים:** `/quick_add_charge`, `/update_finance`, `/toggle_charge_status`,
      `/update_charge_our_cost`, `/delete_charge`, `/api/webhook/charge` (Base44),
      `/toggle_retainer_status`
    - **אנשי קשר:** `/add_contact`, `/delete_contact`
    - **מסמכים/לוגו:** `/upload_document`, `/delete_document`, `/upload_logo`
    - **לקוחות:** `/add_client`, `/archive_client`, `/toggle_client_active`, שיוך עובדים
    - **אירועים:** `/add_event_charge`, `/edit_event_charge`
    - **טפסים:** `/submit_form`, הערת מנהל

### נשאר `save_data` (מכוון - שינוי רב-לקוחות)

מסלולים שמשנים **כמה לקוחות בו-זמנית** נשארו עם `save_data` כי זו ההתנהגות הנכונה:
- חישוב מחדש של נתוני כספים לכל הלקוחות (מסך כספים)
- מחיקת משתמש (הסרת השיוך מכל הלקוחות)
- הקצאת מספרי לקוח

## התנהגות זהה, רק מהיר יותר

`save_client` משתמשת באותה לוגיקת שמירה כמו `save_data` (אותו `_upsert_client`),
כך שהתוצאה במסד הנתונים זהה — רק שנכתב לקוח אחד במקום כולם.

## הערה — חיווי בממשק

לאחר התיקון הבקשה חוזרת מהר, כך שתחושת ה"תקיעה" נעלמת. אם בעתיד נרצה חיווי
מיידי עוד יותר אפשר להוסיף ב-Frontend מצב טעינה / עדכון אופטימי.
