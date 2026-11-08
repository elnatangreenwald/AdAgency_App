# תיקון: העלאת מסמכים לתיק לקוח

## תאריך
08/11/2026

## הבעיות שנמצאו

### 1. כל העלאה נכשלה - CSRF
`CSRFProtect` פעיל על כל האפליקציה, אבל ה-routes `upload_document` ו-`delete_document`
לא סומנו ב-`@csrf.exempt` (בניגוד לשאר ה-API, למשל `upload_logo`).
אפליקציית ה-React לא שולחת CSRF token, ולכן השרת החזיר
`400 Bad Request - The CSRF token is missing` (HTML) לכל העלאה ולכל מחיקה.

### 2. מסמכים נמחקו בכל דיפלוי
הקבצים נשמרו בדיסק המקומי (`static/client_docs`). ב-Railway הדיסק זמני ומתאפס בכל דיפלוי,
כך שהרשומה נשארה ברשימה אבל הקובץ עצמו נעלם ("קובץ לא נמצא").

## הפתרון

| מצב | איפה נשמר הקובץ |
|-----|-----------------|
| פרודקשן (`USE_DATABASE=true`) | ב-DB, בטבלת ה-blobs המשותפת (כמו חשבוניות ספקים וקבצי אישורים) |
| פיתוח מקומי | `uploads/approvals/client_docs/<client_id>/` |

- `_store_server_file(local_dir, upload)` - פונקציה משותפת לשמירת קובץ (הוצאה מ-`_store_invoice_file`).
- מגבלת גודל בפרודקשן: 50MB (`APPROVAL_DB_FILE_MAX_BYTES`).

## Routes

| Route | תיאור |
|-------|-------|
| `POST /upload_document/<client_id>` | העלאה. שדות: `document` (קובץ), `doc_name` (אופציונלי) |
| `GET /download_doc/<client_id>/<doc_id>` | צפייה (inline). `?download=1` להורדה |
| `POST /delete_document/<client_id>/<doc_id>` | מחיקת המסמך והקובץ |
| `GET /download_doc/<filename>` | legacy - נשאר לתאימות לאחור |

כל התשובות של upload/delete הן JSON: `{success, error?}`.

## מבנה מסמך חדש

```json
{
  "id": "uuid",
  "display_name": "חוזה.pdf",
  "file": { "object_key": "db:<uuid>", "original_name": "חוזה.pdf", "content_type": "application/pdf", "size": 12345 },
  "upload_date": "08/11/26 11:43",
  "uploaded_by": "user_id"
}
```

מסמכים ישנים (עם `file_path` במקום `file`) ממשיכים לעבוד מהדיסק אם הקובץ עדיין קיים.
מסמכים ישנים שהקובץ שלהם כבר נמחק בדיפלוי יציגו "הקובץ לא זמין" - יש להעלות אותם מחדש.

## Frontend (`ClientPage.tsx`)
- הקישור למסמך עבר ל-`/download_doc/<client_id>/<doc_id>` ונפתח בטאב חדש.
- כפתור ההעלאה ננעל בזמן העלאה ("מעלה...") כדי למנוע העלאה כפולה.
