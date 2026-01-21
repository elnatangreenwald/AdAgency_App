/**
 * useTasks Hook
 * Custom hook for managing tasks operations
 */
import { useState, useCallback } from 'react';
import { apiClient, apiFormClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/types';

interface AddTaskData {
  title: string;
  assignee?: string;
  deadline?: string;
  priority?: string;
  is_recurring?: boolean;
  description?: string;
}

interface UseTasksReturn {
  loading: boolean;
  addTask: (clientId: string, projectId: string, data: AddTaskData) => Promise<Task | null>;
  updateTaskStatus: (clientId: string, projectId: string, taskId: string, status: string) => Promise<boolean>;
  updateTaskDeadline: (clientId: string, projectId: string, taskId: string, deadline: string) => Promise<boolean>;
  updateTaskNote: (clientId: string, projectId: string, taskId: string, note: string) => Promise<boolean>;
  deleteTask: (clientId: string, projectId: string, taskId: string) => Promise<boolean>;
}

export function useTasks(): UseTasksReturn {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addTask = useCallback(async (
    clientId: string,
    projectId: string,
    data: AddTaskData
  ): Promise<Task | null> => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.assignee) formData.append('assignee', data.assignee);
      if (data.deadline) formData.append('deadline', data.deadline);
      if (data.priority) formData.append('priority', data.priority);
      if (data.is_recurring) formData.append('is_recurring', 'on');
      if (data.description) formData.append('description', data.description);

      const response = await apiFormClient.post(
        `/add_task/${clientId}/${projectId}`,
        formData
      );

      if (response.data.success || response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'המשימה נוספה בהצלחה',
          variant: 'success',
        });
        return response.data.task;
      }
      return null;
    } catch (err: any) {
      toast({
        title: 'שגיאה',
        description: err.response?.data?.error || 'שגיאה בהוספת משימה',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateTaskStatus = useCallback(async (
    clientId: string,
    projectId: string,
    taskId: string,
    status: string
  ): Promise<boolean> => {
    try {
      const response = await apiClient.post(
        `/update_task_status/${clientId}/${projectId}/${taskId}`,
        { status },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.status === 'success' || response.status === 200) {
        toast({
          title: 'סטאטוס עודכן',
          description: 'סטאטוס המשימה עודכן בהצלחה',
        });
        return true;
      }
      return false;
    } catch (err: any) {
      toast({
        title: 'שגיאה',
        description: err.response?.data?.error || 'שגיאה בעדכון הסטאטוס',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const updateTaskDeadline = useCallback(async (
    clientId: string,
    projectId: string,
    taskId: string,
    deadline: string
  ): Promise<boolean> => {
    try {
      const response = await apiClient.post(
        `/update_task_status/${clientId}/${projectId}/${taskId}`,
        { deadline },
        { headers: { 'Content-Type': 'application/json' } }
      );

      return response.data.status === 'success' || response.status === 200;
    } catch (err) {
      console.error('Error updating deadline:', err);
      return false;
    }
  }, []);

  const updateTaskNote = useCallback(async (
    clientId: string,
    projectId: string,
    taskId: string,
    note: string
  ): Promise<boolean> => {
    try {
      const response = await apiClient.post(
        `/update_task_note/${clientId}/${projectId}/${taskId}`,
        { note },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.status === 'success' || response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'ההערה נשמרה בהצלחה',
          variant: 'success',
        });
        return true;
      }
      return false;
    } catch (err: any) {
      toast({
        title: 'שגיאה',
        description: err.response?.data?.error || 'שגיאה בשמירת ההערה',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const deleteTask = useCallback(async (
    clientId: string,
    projectId: string,
    taskId: string
  ): Promise<boolean> => {
    try {
      const response = await apiClient.post(
        `/delete_task/${clientId}/${projectId}/${taskId}`,
        {},
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'המשימה נמחקה בהצלחה',
          variant: 'success',
        });
        return true;
      }
      return false;
    } catch (err: any) {
      toast({
        title: 'שגיאה',
        description: err.response?.data?.error || 'שגיאה במחיקת המשימה',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  return {
    loading,
    addTask,
    updateTaskStatus,
    updateTaskDeadline,
    updateTaskNote,
    deleteTask,
  };
}
