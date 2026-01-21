/**
 * useUsers Hook
 * Custom hook for managing users data and operations
 */
import { useState, useEffect, useCallback } from 'react';
import { apiClient, apiFormClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types';

interface UseUsersOptions {
  autoFetch?: boolean;
}

interface AddUserData {
  username: string;
  name: string;
  email?: string;
  email_password?: string;
  password: string;
  role: string;
}

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  addUser: (data: AddUserData) => Promise<boolean>;
  updateUser: (username: string, data: Partial<AddUserData>) => Promise<boolean>;
  deleteUser: (username: string) => Promise<boolean>;
  resetPassword: (username: string, newPassword: string) => Promise<boolean>;
}

export function useUsers(options: UseUsersOptions = {}): UseUsersReturn {
  const { autoFetch = true } = options;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/admin/users');
      
      if (response.data.success) {
        setUsers(response.data.users);
      } else {
        setError(response.data.error || 'שגיאה בטעינת משתמשים');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'שגיאה בטעינת משתמשים';
      setError(errorMessage);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addUser = useCallback(async (data: AddUserData): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('action', 'add_user');
      formData.append('username', data.username);
      formData.append('name', data.name);
      formData.append('password', data.password);
      formData.append('role', data.role);
      if (data.email) formData.append('email', data.email);
      if (data.email_password) formData.append('email_password', data.email_password);

      const response = await apiFormClient.post('/admin/users', formData);

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'המשתמש נוסף בהצלחה',
          variant: 'success',
        });
        await fetchUsers();
        return true;
      }
      return false;
    } catch (err: any) {
      toast({
        title: 'שגיאה',
        description: err.response?.data?.error || 'שגיאה בהוספת משתמש',
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchUsers, toast]);

  const updateUser = useCallback(async (
    username: string,
    data: Partial<AddUserData>
  ): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('action', 'update_user');
      formData.append('username', username);
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value));
        }
      });

      const response = await apiFormClient.post('/admin/users', formData);

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'המשתמש עודכן בהצלחה',
          variant: 'success',
        });
        await fetchUsers();
        return true;
      }
      return false;
    } catch (err: any) {
      toast({
        title: 'שגיאה',
        description: err.response?.data?.error || 'שגיאה בעדכון משתמש',
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchUsers, toast]);

  const deleteUser = useCallback(async (username: string): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('action', 'delete_user');
      formData.append('username', username);

      const response = await apiFormClient.post('/admin/users', formData);

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'המשתמש נמחק בהצלחה',
          variant: 'success',
        });
        await fetchUsers();
        return true;
      }
      return false;
    } catch (err: any) {
      toast({
        title: 'שגיאה',
        description: err.response?.data?.error || 'שגיאה במחיקת משתמש',
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchUsers, toast]);

  const resetPassword = useCallback(async (
    username: string,
    newPassword: string
  ): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('action', 'reset_password');
      formData.append('username', username);
      formData.append('new_password', newPassword);

      const response = await apiFormClient.post('/admin/users', formData);

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'הסיסמה אופסה בהצלחה',
          variant: 'success',
        });
        return true;
      }
      return false;
    } catch (err: any) {
      toast({
        title: 'שגיאה',
        description: err.response?.data?.error || 'שגיאה באיפוס סיסמה',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  useEffect(() => {
    if (autoFetch) {
      fetchUsers();
    }
  }, [autoFetch, fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser,
    resetPassword,
  };
}
