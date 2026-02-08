# מיון טבלת כספים לפי חיובים פתוחים

## תאריך: 08/02/2026

## תיאור השינוי
הטבלה בעמוד כספים (`Finance.tsx`) ממוינת כעת לפי סכום החיובים הפתוחים מהגבוה לנמוך.

## קובץ שהשתנה
- `src/pages/Finance.tsx`

## פרטי השינוי

### לפני השינוי
```typescript
const filteredClients =
  data?.clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
```

### אחרי השינוי
```typescript
const filteredClients =
  data?.clients
    .filter((client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.calculated_open_charges - a.calculated_open_charges) || [];
```

## התנהגות
- לקוחות עם חיובים פתוחים גבוהים יותר יופיעו בראש הטבלה
- לקוחות ללא חיובים פתוחים (0) יופיעו בתחתית הטבלה
- המיון מתבצע אוטומטית לאחר סינון לפי שם הלקוח
