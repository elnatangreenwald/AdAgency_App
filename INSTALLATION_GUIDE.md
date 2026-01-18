# מדריך התקנה - Installation Guide

## ⚠️ חשוב: Node.js לא מותקן במחשב שלך

כדי לראות את האפליקציה החדשה עובדת, צריך להתקין Node.js.

## שלב 1: התקנת Node.js

1. **הורד Node.js:**
   - לך ל: https://nodejs.org/
   - הורד את גרסת **LTS** (מומלץ)
   - זה קובץ `.msi` ל-Windows

2. **התקן:**
   - הרץ את הקובץ שהורדת
   - לחץ "Next" בכל השלבים
   - ודא ש-"Add to PATH" מסומן (ברירת מחדל)

3. **וידוא התקנה:**
   - פתח טרמינל חדש (PowerShell או CMD)
   - הרץ: `node --version`
   - צריך לראות מספר גרסה (למשל: v20.x.x)
   - הרץ: `npm --version`
   - צריך לראות מספר גרסה (למשל: 10.x.x)

## שלב 2: התקנת חבילות הפרויקט

פתח טרמינל בתיקיית הפרויקט:

```bash
cd "C:\Users\Asus\Desktop\AdAgency_App"
npm install
```

זה יקח 2-5 דקות - זה מוריד את כל החבילות:
- React
- Vite
- Tailwind CSS
- shadcn/ui
- וכל שאר התלויות

## שלב 3: הרצת השרתים

צריך **2 טרמינלים** במקביל:

### טרמינל 1 - Flask Backend:
```bash
python app.py
```
✅ צריך לראות: `Running on http://127.0.0.1:5000`

### טרמינל 2 - React Frontend:
```bash
npm run dev
```
✅ צריך לראות: `Local: http://localhost:3000`

## שלב 4: פתיחת האפליקציה

פתח דפדפן וגש ל:
**http://localhost:3000**

## מה תראה?

- ✅ דף התחברות חדש (React + Tailwind)
- ✅ Dashboard עם לוח שנה
- ✅ QuickUpdate page
- ✅ AllClients page
- ✅ עיצוב מודרני ומהיר

## בעיות נפוצות

### "node is not recognized"
- Node.js לא מותקן או לא ב-PATH
- **פתרון**: הפעל מחדש את הטרמינל אחרי התקנת Node.js
- אם עדיין לא עובד, התקן מחדש Node.js עם "Add to PATH"

### "npm install" נכשל
- בדוק חיבור לאינטרנט
- נסה: `npm install --legacy-peer-deps`
- או: `npm cache clean --force` ואז `npm install`

### Port already in use
- שרת אחר רץ על הפורט
- **פתרון**: עצור את השרת הישן
- או שנה פורט ב-`vite.config.ts`

### CORS errors
- ודא ש-Flask רץ על פורט 5000
- ה-proxy ב-Vite אמור לטפל בזה

## מצב נוכחי

✅ **קבצי הקוד**: מוכנים  
✅ **קומפוננטים**: מוכנים  
✅ **דפים**: Dashboard, QuickUpdate, AllClients מוכנים  
❌ **Node.js**: צריך להתקין  
❌ **חבילות**: צריך להריץ `npm install`  
❌ **שרתים**: צריך להריץ  

## אחרי ההתקנה

ברגע שתסיים את השלבים האלה, תראה את כל השינויים עובדים!

---

**צריך עזרה?** בדוק את `HOW_TO_RUN.md` למדריך מפורט יותר.

