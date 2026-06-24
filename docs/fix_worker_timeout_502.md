# תיקון: השרת לא עולה / איטי מאוד (502 - WORKER TIMEOUT)

## התסמין

האפליקציה בפרודקשן (Railway) החזירה **502 Bad Gateway** לכל בקשה, או נטענה לאט מאוד.

לוגי gunicorn הראו לולאה אינסופית:

```
Booting worker with pid: 131
[CRITICAL] WORKER TIMEOUT (pid:131)
Worker exited with code 1
Booting worker with pid: 133
[CRITICAL] WORKER TIMEOUT (pid:133)
... חוזר חלילה
```

ה-worker מת כל ~35 שניות **בלי שום בקשה** — כלומר הקריסה היא בזמן עליית האפליקציה (boot), לא בטיפול בבקשה.

## סיבת השורש

כאשר `USE_DATABASE=true`, הקובץ `database_helpers.py` נטען בעליית האפליקציה והריץ
`_ensure_clients_schema()` **בזמן ה-import** — פעולה שמתחברת מיד ל-PostgreSQL.

ה-`create_engine` ב-`database.py` הוגדר **ללא `connect_timeout`**, ולכן אם ה-DB
לא נגיש (הושהה / נמחק / `DATABASE_URL` השתנה / רשת איטית), החיבור נתקע **לנצח**.
gunicorn ממתין 30 שניות, הורג את ה-worker (WORKER TIMEOUT), ומנסה שוב — ללא הצלחה.
התוצאה: השרת אף פעם לא מסיים לעלות → 502.

## התיקון

### 1. `database.py` — timeout לחיבור
נוסף `connect_timeout` (וגם `pool_recycle`) ל-`create_engine`, כך שחיבור ל-DB
לא-נגיש נכשל מהר (10 שניות) במקום להיתקע.

### 2. `database_helpers.py` — לא לחסום את העלייה
`_ensure_clients_schema()` כבר **לא נקרא בזמן ה-import**. במקום זה הוא רץ פעם אחת,
בעצלתיים (lazy), בקריאה הראשונה ל-`load_data()`, ועם דגל `_schema_checked` שמונע
ריצות חוזרות. כך עליית האפליקציה לעולם לא תלויה בזמינות ה-DB.

### 3. `Procfile` + `Dockerfile` — הגדרות gunicorn
נוסף `--timeout 120 --workers 2 --graceful-timeout 30` כדי שבקשה כבדה אחת
לא תקפיא את כל השרת, ושיהיה מרווח נשימה גדול יותר.

## חשוב — בדיקה נוספת

התיקון מונע את לולאת ה-502 גם אם ה-DB איטי/נופל. אך אם שירות ה-PostgreSQL עצמו
**מת או נמחק**, האפליקציה תעלה אך תהיה ללא נתונים. יש לוודא ב-Railway:

- שירות ה-**PostgreSQL** קיים ופעיל (Active, לא Removed/Paused)
- המשתנה `DATABASE_URL` קיים ותקין ב-Variables של שירות **web**

## קבצים שהשתנו

- `database.py`
- `database_helpers.py`
- `Procfile`
- `Dockerfile`
