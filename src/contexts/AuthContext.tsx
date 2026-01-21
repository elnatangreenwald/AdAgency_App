import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Try to get current user from Flask session
      const response = await apiClient.get('/api/current_user');
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
      }
    } catch (error: any) {
      // User is not authenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email); // Flask uses 'username'
    formData.append('password', password);

    try {
      const response = await apiClient.post('/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        maxRedirects: 0, // Don't follow redirects
        validateStatus: (status) => status < 400,
      });

      // Flask returns 302 on success, which axios treats as error
      // So we check for redirect or success
      if (response.data?.status === 'success') {
        await refreshUser();
      } else if (response.status === 302) {
        await refreshUser();
      } else {
        throw new Error(response.data?.error || 'Login failed');
      }
    } catch (error: any) {
      // If we get a redirect (302), login was successful
      if (error.response?.status === 302) {
        await refreshUser();
      } else {
        throw new Error('שם משתמש או סיסמה שגויים');
      }
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/logout', null, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.get('/api/current_user');
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
