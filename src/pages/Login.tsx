import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const inspirationQuote = useMemo(() => {
    const quotes = [
      "כל יום הוא הזדמנות להתחלה חדשה.",
      "אם אתם יכולים לחלום על זה, אתם יכולים לעשות את זה.",
      "הדרך הטובה ביותר לחזות את העתיד היא ליצור אותו.",
      "אל תחכו לרגע המושלם; קחו את הרגע והפכו אותו למושלם.",
      "הצלחה היא לא סופית, וכישלון אינו גורלי.",
      "צעד קטן אחד קדימה הוא עדיין התקדמות.",
      "האמינו בעצמכם, וכל השאר כבר יסתדר.",
      "תהיו השינוי שאתם רוצים לראות בעולם.",
      "קושי הוא רק מדרגה בדרך לפסגה.",
      "אל תפחדו להיכשל, פחדו לא לנסות.",
      "חיוך הוא הקו העקום היחיד שמישר הכל.",
      "החיים הם מסע, לא יעד.",
      "אל תסתכלו לאחור, אתם לא הולכים לשם.",
      "האומץ הוא לא היעדר פחד, אלא ההתגברות עליו.",
      "השמיים הם הגבול, אבל רק למי שפוחד לעוף.",
      "תנו לכל יום את הסיכוי להיות היפה ביותר בחייכם.",
      "עשייה קטנה עדיפה על תוכנית גדולה.",
      "משמעת עצמית היא אהבה עצמית בפעולה.",
      "האושר הוא בחירה, לא תוצאה.",
      "כל מה שאתם צריכים כבר נמצא בתוככם.",
      "סוף הוא תמיד התחלה של משהו אחר.",
      "אל תפסיקו ללמוד, כי החיים לא מפסיקים ללמד.",
      "חלומות גדולים דורשים עבודה קשה.",
      "תהיו הגרסה הטובה ביותר של עצמכם.",
      "הכוח לשנות נמצא בידיים שלכם.",
      "אל תתנו לרעש של אחרים להשתיק את הקול הפנימי שלכם.",
      "הדרך הכי מהירה להצליח היא פשוט להתחיל.",
      "תנשמו עמוק, זה רק יום רע, לא חיים רעים.",
      "דברים טובים לוקחים זמן, היו סבלניים.",
      "מי שמעז – מנצח.",
      "הכישלון הוא המורה הטוב ביותר בדרך להצלחה.",
      "תעריכו את הדברים הקטנים, יום אחד תבינו שהם גדולים.",
      "שום דבר אינו בלתי אפשרי למי שבאמת רוצה.",
      "הקיפו את עצמכם באנשים שמעלים אתכם למעלה.",
      "תעשו משהו היום שהעתיד שלכם יודה לכם עליו.",
      "המגבלה היחידה שלכם היא הדמיון שלכם.",
      "אל תשוו את ההתחלה שלכם לאמצע של מישהו אחר.",
      "היו אדיבים, כולם נלחמים בקרב שאתם לא יודעים עליו.",
      "הניצחון הכי גדול הוא הניצחון על עצמך.",
      "תחלמו בגדול, תתחילו בקטן.",
      "המזל הולך עם האמיצים.",
      "איפה שיש רצון, יש דרך.",
      "אל תספרו את הימים, גרמו לימים להיספר.",
      "יצירתיות היא אינטליגנציה שנהנית.",
      "השקט הוא המקום בו הרעיונות הגדולים נולדים.",
      "תהיו הניצוץ שמדליק את השינוי.",
      "כל קושי הוא הזדמנות לצמיחה.",
      "ההצלחה מחכה מעבר לפינה של ההתמדה.",
      "אתם חזקים יותר ממה שאתם חושבים.",
      "תמיד תזכרו כמה רחוק כבר הגעתם."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'L3',location:'Login.tsx:handleSubmit',message:'submit clicked',data:{hasEmail:!!email,hasPassword:!!password},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'L3',location:'Login.tsx:handleSubmit',message:'login resolved',data:{},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
      navigate('/');
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'L4',location:'Login.tsx:handleSubmit',message:'login rejected',data:{},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
      setError(err.response?.data?.error || 'שם משתמש או סיסמה שגויים');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#a8be37] rtl p-4" dir="rtl">
      <Card className="w-full max-w-md rounded-[20px] sm:rounded-[25px] shadow-[0_15px_35px_rgba(0,0,0,0.2)]">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col items-center gap-3">
            <img
              src="/static/Vatkin_Logo.jpg"
              alt="Vatkin Logo"
              className="w-24 sm:w-28 h-auto"
            />
            <CardTitle className="text-xl sm:text-2xl text-center">מערכת ניהול</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              התחבר לחשבון שלך
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="login-username">שם משתמש או אימייל</Label>
              <Input
                id="login-username"
                name="login-username"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="הזן שם משתמש או אימייל"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">סיסמה</Label>
              <Input
                id="login-password"
                name="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="הזן סיסמה"
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'מתחבר...' : 'התחבר'}
            </Button>
          </form>
          <div className="mt-6 rounded-xl border-r-4 border-r-[#0073ea] bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] px-4 py-3 text-sm italic text-[#495057] relative">
            <span className="absolute right-3 top-1 text-3xl text-[#0073ea] opacity-30">
              "
            </span>
            {inspirationQuote}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

