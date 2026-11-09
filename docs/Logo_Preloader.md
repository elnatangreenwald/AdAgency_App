# Logo Preloader - הנפשת לוגו בטעינה

## תיאור

קומפוננטת הנפשה של הלוגו "ותקין'ס בוטיק" שמוצגת בזמן טעינת המערכת.
ההנפשה מציגה את אלמנטי הלוגו אחד אחד בצורה מרשימה.

## קומפוננטות זמינות

### 1. `LogoPreloader` - גרסה בסיסית

הנפשה פשוטה וקלילה:
- הריבוע הירוק מופיע ראשון
- ה-'ס מופיע בתוך הריבוע
- "ותקין" מופיע מימין
- "בוטיק" מופיע משמאל
- נקודות טעינה קופצות

```tsx
import { LogoPreloader } from '@/components/shared/LogoPreloader';

<LogoPreloader 
  text="טוען..." 
  fullScreen={true}
  onComplete={() => console.log('Animation done')}
/>
```

### 2. `LogoPreloaderPremium` - גרסה מתקדמת

הנפשה מרשימה עם אפקטים:
- חלקיקים צפים ברקע (particles)
- אפקט זוהר (glow) מאחורי הלוגו
- מעבר צבעים מסתובב סביב הריבוע
- פס התקדמות (progress bar)
- רקע עם gradient

```tsx
import { LogoPreloaderPremium } from '@/components/shared/LogoPreloader';

<LogoPreloaderPremium 
  text="טוען את המערכת..." 
  fullScreen={true}
/>
```

### 3. `LogoPreloaderMini` - גרסה מינימלית

לשימוש inline בתוך רכיבים אחרים:

```tsx
import { LogoPreloaderMini } from '@/components/shared/LogoPreloader';

<LogoPreloaderMini />
```

## Props

| Prop | Type | Default | תיאור |
|------|------|---------|--------|
| `text` | `string` | `undefined` | טקסט להצגה מתחת ללוגו |
| `fullScreen` | `boolean` | `true` | האם להציג על כל המסך |
| `onComplete` | `() => void` | `undefined` | Callback בסיום ההנפשה |

## שלבי ההנפשה

| שלב | זמן (ms) | מה קורה |
|-----|----------|---------|
| 0 | 0 | מצב התחלתי - הכל מוסתר |
| 1 | 100/200 | הריבוע הירוק מופיע |
| 2 | 400/500 | ה-'ס מופיע בריבוע |
| 3 | 700/800 | "ותקין" מופיע מימין |
| 4 | 1000/1100 | "בוטיק" מופיע משמאל |
| 5 | 1400/1500 | הלוגו מורכב במלואו |

## צבעי הלוגו

```css
/* ירוק הריבוע */
--logo-green: #9CAD3C;

/* טורקיז המערכת */
--system-teal: #3d817a;

/* כחול כהה */
--dark-blue: #043841;

/* שחור הטקסט */
--text-black: #1a1a1a;
```

## שימוש

### בטעינת האפליקציה (Layout)

```tsx
// src/components/layout/Layout.tsx
import { LogoPreloaderPremium } from '@/components/shared/LogoPreloader';

if (loading) {
  return <LogoPreloaderPremium text="טוען את המערכת..." />;
}
```

### בתוך דף ספציפי

```tsx
if (loading) {
  return <LogoPreloader text="טוען לקוחות..." fullScreen={false} />;
}
```

## התאמה אישית

ניתן ליצור גרסה מותאמת על ידי שינוי:
- זמני ההנפשה בתוך ה-`useEffect`
- צבעי הרקע והחלקיקים
- גודל הלוגו (text-4xl, text-5xl וכו')
- סוג ההנפשות (fade, slide, scale, rotate)
