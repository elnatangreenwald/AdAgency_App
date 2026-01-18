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
    } catch (error) {
      // User is not authenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'L1',location:'AuthContext.tsx:login',message:'login start',data:{hasEmail:!!email,hasPassword:!!password},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-2',hypothesisId:'L1',location:'AuthContext.tsx:login',message:'login response headers',data:{status:response.status,contentType:response.headers?.['content-type'] || null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'L1',location:'AuthContext.tsx:login',message:'login response',data:{status:response.status,hasData:!!response.data},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log

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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'L2',location:'AuthContext.tsx:login',message:'login error',data:{status:error?.response?.status || null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2',location:'AuthContext.tsx:logout',message:'logout start',data:{},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
      await apiClient.post('/logout', null, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2',location:'AuthContext.tsx:logout',message:'logout request completed',data:{},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3',location:'AuthContext.tsx:logout',message:'logout error',data:{error:(error as Error)?.message || 'unknown'},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
      console.error('Logout error:', error);
    } finally {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H4',location:'AuthContext.tsx:logout',message:'logout finally setUser null',data:{},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-2',hypothesisId:'L1',location:'AuthContext.tsx:refreshUser',message:'refreshUser start',data:{},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
      const response = await apiClient.get('/api/current_user');
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-2',hypothesisId:'L1',location:'AuthContext.tsx:refreshUser',message:'refreshUser success',data:{hasUser:true},timestamp:Date.now()})}).catch(()=>{});
        // #endregion agent log
      }
    } catch (error) {
      setUser(null);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-2',hypothesisId:'L1',location:'AuthContext.tsx:refreshUser',message:'refreshUser failed',data:{},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
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

