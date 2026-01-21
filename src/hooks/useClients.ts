/**
 * useClients Hook
 * Custom hook for managing clients data and operations
 */
import { useState, useEffect, useCallback } from 'react';
import { apiClient, apiFormClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { Client } from '@/types';

interface UseClientsOptions {
  autoFetch?: boolean;
  includeArchived?: boolean;
}

interface UseClientsReturn {
  clients: Client[];
  loading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  getClient: (clientId: string) => Promise<Client | null>;
  addClient: (data: Partial<Client>) => Promise<Client | null>;
  updateClient: (clientId: string, data: Partial<Client>) => Promise<boolean>;
  archiveClient: (clientId: string) => Promise<boolean>;
  toggleClientActive: (clientId: string) => Promise<boolean>;
}

export function useClients(options: UseClientsOptions = {}): UseClientsReturn {
  const { autoFetch = true, includeArchived = false } = options;
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = includeArchived ? '/api/all_clients' : '/api/clients';
      const response = await apiClient.get(endpoint);
      
      if (response.data.success) {
        setClients(response.data.clients);
      } else {
        setError(response.data.error || 'שגיאה בטעינת לקוחות');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'שגיאה בטעינת לקוחות';
      setError(errorMessage);
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }, [includeArchived]);

  const getClient = useCallback(async (clientId: string): Promise<Client | null> => {
    try {
      const response = await apiClient.get(`/api/client/${clientId}`);
      if (response.data.success) {
        return response.data.client;
      }
      return null;
    } catch (err: any) {
      console.error('Error fetching client:', err);
      return null;
    }
  }, []);

  const addClient = useCallback(async (data: Partial<Client>): Promise<Client | null> => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => formData.append(key, v));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const response = await apiFormClient.post('/add_client', formData);
      
      if (response.data.success) {
        toast({
          title: 'הצלחה',
          description: 'הלקוח נוסף בהצלחה',
          variant: 'success',
        });
        await fetchClients();
        return response.data.client;
      }
      return null;
    } catch (err: any) {
      toast({
        title: 'שגיאה',
        description: err.response?.data?.error || 'שגיאה בהוספת לקוח',
        variant: 'destructive',
      });
      return null;
    }
  }, [fetchClients, toast]);

  const updateClient = useCallback(async (clientId: string, data: Partial<Client>): Promise<boolean> => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => formData.append(key, v));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      const response = await apiFormClient.post(`/update_client/${clientId}`, formData);
      
      if (response.data.success || response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'הלקוח עודכן בהצלחה',
          variant: 'success',
        });
        await fetchClients();
        return true;
      }
      return false;
    } catch (err: any) {
      toast({
        title: 'שגיאה',
        description: err.response?.data?.error || 'שגיאה בעדכון לקוח',
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchClients, toast]);

  const archiveClient = useCallback(async (clientId: string): Promise<boolean> => {
    try {
      const response = await apiClient.post(`/archive_client/${clientId}`);
      
      if (response.data.success || response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'הלקוח הועבר לארכיון',
          variant: 'success',
        });
        await fetchClients();
        return true;
      }
      return false;
    } catch (err: any) {
      toast({
        title: 'שגיאה',
        description: err.response?.data?.error || 'שגיאה בהעברה לארכיון',
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchClients, toast]);

  const toggleClientActive = useCallback(async (clientId: string): Promise<boolean> => {
    try {
      const response = await apiClient.post(`/toggle_client_active/${clientId}`);
      
      if (response.data.success) {
        toast({
          title: 'הצלחה',
          description: response.data.active ? 'הלקוח הופעל' : 'הלקוח הועבר לארכיון',
          variant: 'success',
        });
        await fetchClients();
        return true;
      }
      return false;
    } catch (err: any) {
      toast({
        title: 'שגיאה',
        description: err.response?.data?.error || 'שגיאה בעדכון סטטוס',
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchClients, toast]);

  useEffect(() => {
    if (autoFetch) {
      fetchClients();
    }
  }, [autoFetch, fetchClients]);

  return {
    clients,
    loading,
    error,
    fetchClients,
    getClient,
    addClient,
    updateClient,
    archiveClient,
    toggleClientActive,
  };
}
