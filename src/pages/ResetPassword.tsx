import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';

export function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setInvalid(true);
        setChecking(false);
        return;
      }
      try {
        const response = await apiClient.get(`/api/reset_password/${token}`);
        if (!response.data?.success) {
          setInvalid(true);
          setError(response.data?.error || 'קישור לא תקין או שפג תוקפו');
        }
      } catch (err: any) {
        setInvalid(true);
        setError(err.response?.data?.error || 'קישור לא תקין או שפג תוקפו');
      } finally {
        setChecking(false);
      }
    };
    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 4) {
      setError('סיסמה חייבת להכיל לפחות 4 תווים');
      return;
    }
    if (password !== confirmPassword) {
      setError('הסיסמאות לא תואמות');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post(
        `/reset_password/${token}`,
        { password, confirm_password: confirmPassword },
        {
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );
      if (response.data?.success) {
        navigate('/login', { replace: true });
      } else {
        setError(response.data?.error || 'שגיאה בעדכון הסיסמה');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'שגיאה בעדכון הסיסמה');
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
            <CardTitle className="text-xl sm:text-2xl text-center">איפוס סיסמה</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              בחרו סיסמה חדשה לחשבון
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {checking ? (
            <p className="text-center text-gray-600">בודק קישור...</p>
          ) : invalid ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error || 'קישור לא תקין או שפג תוקפו'}
              </div>
              <Link to="/login" className="block text-center text-sm text-[#0073ea] hover:underline">
                חזרה להתחברות
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="new-password">סיסמה חדשה</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={4}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">אישור סיסמה</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={4}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'שומר...' : 'עדכון סיסמה'}
              </Button>
              <Link to="/login" className="block text-center text-sm text-[#0073ea] hover:underline">
                חזרה להתחברות
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
