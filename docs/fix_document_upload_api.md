# תיקון: העלאת מסמכים - תגובת API

## תאריך
05/05/2026

## תיאור הבעיה
בעמוד הלקוח, ניסיון להעלות מסמך תחת סעיף "מסמכים" נכשל עם שגיאה.

## סיבת הבעיה
הפונקציה `upload_document` ב-`app.py` החזירה `redirect` response במקום JSON response.
הפרונטאנד (React) ציפה לקבל JSON עם status 200, אבל קיבל redirect (302) או HTML.

## הקובץ שתוקן
`app.py` - פונקציה `upload_document`

## השינויים
1. החלפת `redirect()` בתגובות `jsonify()` מתאימות
2. הוספת בדיקה אם לא נבחר קובץ - מחזיר שגיאה 400
3. הוספת בדיקה אם הלקוח לא נמצא - מחזיר שגיאה 404
4. בהצלחה - מחזיר JSON עם `success: True` ופרטי המסמך החדש

## דוגמת קוד - לפני

```python
return redirect(request.referrer or url_for('client_page', client_id=client_id))
```

## דוגמת קוד - אחרי

```python
return jsonify({'success': True, 'document': new_doc}), 200
```

## בדיקה
העלה מסמך בעמוד לקוח תחת "מסמכים" וודא שההעלאה מצליחה ומופיעה הודעת הצלחה.
