import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { apiClient, apiFormClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus,
  Trash2,
  Upload,
  ChevronDown,
  ChevronUp,
  Edit,
  Phone,
  Mail,
  Calendar,
  FileText,
  Clock,
  Users,
  Bell,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { TimeTracker } from '@/components/TimeTracker';

interface Task {
  id: string;
  title: string;
  status: string;
  note?: string;
  deadline?: string;
  priority?: string;
  assignee?: string;
  created_date?: string;
  estimated_hours?: number;
  dependencies?: string[];
  manager_note?: string;
  created_by?: string;
}

interface Project {
  id: string;
  title: string;
  project_number?: string;
  tasks: Task[];
  is_shared?: boolean;
  created_by?: string;
}

interface Charge {
  id: string;
  title: string;
  amount: number;
  our_cost?: number;
  date: string;
  completed?: boolean;
  charge_number?: string;
}

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface Document {
  id: string;
  display_name: string;
  file_path: string;
  upload_date: string;
}

interface Activity {
  id: string;
  activity_type: string;
  title?: string;
  content?: string;
  duration?: string;
  participants?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
  timestamp: string;
  user_id: string;
}

interface Client {
  id: string;
  name: string;
  client_number?: string;
  logo_url?: string;
  retainer: number;
  projects: Project[];
  extra_charges: Charge[];
  contacts: Contact[];
  documents: Document[];
  assigned_user?: string | string[];
  archived?: boolean;
  activities?: Activity[];
}

export function ClientPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [timeTrackingSummary, setTimeTrackingSummary] = useState<{
    totalHours: number;
    thisMonthHours: number;
  } | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{
    clientId: string;
    projectId: string;
    taskId: string;
    taskTitle: string;
  } | null>(null);
  const [currentTask, setCurrentTask] = useState<{
    clientId: string;
    projectId: string;
    taskId: string;
    note: string;
  } | null>(null);
  const [currentActivityType, setCurrentActivityType] = useState<string>('');
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [noteText, setNoteText] = useState('');
  const [activityForm, setActivityForm] = useState({
    title: '',
    content: '',
    duration: '',
    participants: '',
    follow_up_required: false,
    follow_up_date: '',
  });
  const [taskFormKeys, setTaskFormKeys] = useState<Record<string, number>>({});
  const [projectForm, setProjectForm] = useState({
    title: '',
    is_shared: 'false',
  });
  const [chargeForm, setChargeForm] = useState({
    title: '',
    description: '',
    amount: '',
    our_cost: '',
  });
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [retainerAmount, setRetainerAmount] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (clientId) {
      fetchClient();
      fetchUsers();
      fetchTimeTrackingSummary();
    }
  }, [clientId]);

  const fetchTimeTrackingSummary = async () => {
    if (!clientId) return;
    try {
      const response = await apiClient.get(`/api/time_tracking/entries?client_id=${clientId}`);
      if (response.data.success) {
        const entries = response.data.entries || [];
        const totalHours = entries.reduce((sum: number, e: any) => sum + (e.duration_hours || 0), 0);
        
        // שעות החודש הנוכחי
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const thisMonthEntries = entries.filter((e: any) => e.date?.startsWith(currentMonth));
        const thisMonthHours = thisMonthEntries.reduce((sum: number, e: any) => sum + (e.duration_hours || 0), 0);
        
        setTimeTrackingSummary({
          totalHours: Math.round(totalHours * 100) / 100,
          thisMonthHours: Math.round(thisMonthHours * 100) / 100,
        });
      } else {
        // אם אין נתונים, עדיין נציג 0
        setTimeTrackingSummary({
          totalHours: 0,
          thisMonthHours: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching time tracking summary:', error);
      // גם במקרה של שגיאה, נציג 0
      setTimeTrackingSummary({
        totalHours: 0,
        thisMonthHours: 0,
      });
    }
  };

  const fetchClient = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/client/${clientId}`);
      if (response.data.success) {
        setClient(response.data.client);
        setRetainerAmount(response.data.client.retainer?.toString() || '0');
        // Projects are collapsed by default - no need to expand them
        setExpandedProjects(new Set<string>());
      }
    } catch (error: any) {
      console.error('Error fetching client:', error);
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בטעינת פרטי הלקוח',
        variant: 'destructive',
      });
      if (error.response?.status === 404) {
        navigate('/all_clients');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/sidebar_users');
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleToggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title.trim()) {
      toast({
        title: 'שגיאה',
        description: 'אנא הזן שם פרויקט',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', projectForm.title);
      formData.append('is_shared', projectForm.is_shared);

      const response = await apiClient.post(`/add_project/${clientId}`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data.success || response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'הפרויקט נוסף בהצלחה',
          variant: 'success',
        });
        setProjectForm({ title: '', is_shared: 'false' });
        fetchClient();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בהוספת הפרויקט',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הפרויקט?')) return;

    try {
      const formData = new FormData();
      const response = await apiClient.post(`/delete_project/${clientId}/${projectId}`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'הפרויקט נמחק בהצלחה',
          variant: 'success',
        });
        fetchClient();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה במחיקת הפרויקט',
        variant: 'destructive',
      });
    }
  };

  const handleAddTask = async (
    e: React.FormEvent,
    projectId: string,
    formData: any
  ) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast({
        title: 'שגיאה',
        description: 'אנא הזן שם משימה',
        variant: 'destructive',
      });
      return;
    }

    try {
      const taskData = new FormData();
      taskData.append('title', formData.title);
      taskData.append('status', formData.status || 'לביצוע');
      if (formData.note) taskData.append('note', formData.note);
      if (formData.deadline) taskData.append('deadline', formData.deadline);
      if (formData.priority) taskData.append('priority', formData.priority);
      if (formData.assignee) taskData.append('assignee', formData.assignee);
      if (formData.estimated_hours)
        taskData.append('estimated_hours', formData.estimated_hours);
      if (formData.dependencies && Array.isArray(formData.dependencies)) {
        formData.dependencies.forEach((dep: string) => {
          taskData.append('dependencies', dep);
        });
      }
      if (formData.is_daily_task) {
        taskData.append('is_daily_task', 'true');
      }

      const response = await apiClient.post(
        `/add_task/${clientId}/${projectId}`,
        taskData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      if (response.data && (response.data.status === 'success' || response.data.success)) {
        toast({
          title: 'הצלחה',
          description: response.data.message || 'המשימה נוספה בהצלחה',
          variant: 'success',
        });
        // Reset form by updating key
        setTaskFormKeys((prev) => ({ ...prev, [projectId]: (prev[projectId] || 0) + 1 }));
        fetchClient();
      } else {
        toast({
          title: 'שגיאה',
          description: response.data?.error || response.data?.message || 'שגיאה בהוספת המשימה',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || error.response?.data?.message || 'שגיאה בהוספת המשימה',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateTaskStatus = async (
    clientId: string,
    projectId: string,
    taskId: string,
    newStatus: string
  ) => {
    try {
      const response = await apiClient.post(
        `/update_task_status/${clientId}/${projectId}/${taskId}`,
        { status: newStatus },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 'success') {
        toast({
          title: 'סטאטוס עודכן',
          description: 'סטאטוס המשימה עודכן בהצלחה',
        });
        fetchClient();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בעדכון הסטאטוס',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateTaskDeadline = async (
    clientId: string,
    projectId: string,
    taskId: string,
    deadline: string
  ) => {
    try {
      const response = await apiClient.post(
        `/update_task_status/${clientId}/${projectId}/${taskId}`,
        { deadline },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 'success') {
        fetchClient();
      }
    } catch (error) {
      console.error('Error updating deadline:', error);
    }
  };

  const handleDeleteTask = async (
    clientId: string,
    projectId: string,
    taskId: string,
    taskTitle?: string
  ) => {
    // Open confirmation dialog
    setTaskToDelete({ clientId, projectId, taskId, taskTitle: taskTitle || 'המשימה' });
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    
    const { clientId, projectId, taskId } = taskToDelete;
    setDeleteConfirmOpen(false);

    try {
      const formData = new FormData();
      const response = await apiClient.post(
        `/delete_task/${clientId}/${projectId}/${taskId}`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (response.status === 200 && response.data?.success) {
        toast({
          title: 'הצלחה',
          description: response.data?.message || 'המשימה נמחקה בהצלחה',
          variant: 'success',
        });
        fetchClient();
      } else {
        toast({
          title: 'שגיאה',
          description: response.data?.error || 'שגיאה במחיקת המשימה',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה במחיקת המשימה',
        variant: 'destructive',
      });
    }
  };

  const handleOpenNoteModal = (
    clientId: string,
    projectId: string,
    taskId: string,
    currentNote: string
  ) => {
    setCurrentTask({ clientId, projectId, taskId, note: currentNote || '' });
    setNoteText(currentNote || '');
    setNoteModalOpen(true);
  };

  const handleSaveNote = async () => {
    if (!currentTask) return;

    try {
      const response = await apiClient.post(
        `/update_task_note/${currentTask.clientId}/${currentTask.projectId}/${currentTask.taskId}`,
        { note: noteText },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 'success') {
        toast({
          title: 'הצלחה',
          description: 'ההערה נשמרה בהצלחה',
          variant: 'success',
        });
        setNoteModalOpen(false);
        setCurrentTask(null);
        fetchClient();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בשמירת ההערה',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNote = async () => {
    if (!currentTask) return;
    await handleSaveNote(); // Save empty note to delete
  };

  const handleUpdateRetainer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('action', 'retainer');
      formData.append('amount', retainerAmount);

      const response = await apiClient.post(`/update_finance/${clientId}`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'הרטינר עודכן בהצלחה',
          variant: 'success',
        });
        fetchClient();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בעדכון הרטינר',
        variant: 'destructive',
      });
    }
  };

  const handleAddCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeForm.title || !chargeForm.amount) {
      toast({
        title: 'שגיאה',
        description: 'אנא מלא את כל השדות הנדרשים',
        variant: 'destructive',
      });
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('action', 'extra');
      params.append('title', chargeForm.title);
      params.append('amount', chargeForm.amount);
      if (chargeForm.description) {
        params.append('description', chargeForm.description);
      }
      if (chargeForm.our_cost) {
        params.append('our_cost', chargeForm.our_cost);
      }

      const response = await apiClient.post(`/update_finance/${clientId}`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'החיוב נוסף בהצלחה',
          variant: 'success',
        });
        setChargeForm({ title: '', description: '', amount: '', our_cost: '' });
        fetchClient();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בהוספת החיוב',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCharge = async (chargeId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את החיוב?')) return;

    try {
      const response = await apiClient.post(`/delete_charge/${clientId}/${chargeId}`, {});

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'החיוב נמחק בהצלחה',
          variant: 'success',
        });
        fetchClient();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה במחיקת החיוב',
        variant: 'destructive',
      });
    }
  };

  const handleUploadDocument = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await apiFormClient.post(`/upload_document/${clientId}`, formData);

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'המסמך הועלה בהצלחה',
          variant: 'success',
        });
        form.reset();
        fetchClient();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בהעלאת המסמך',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המסמך?')) return;

    try {
      const formData = new FormData();
      const response = await apiClient.post(`/delete_document/${clientId}/${docId}`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'המסמך נמחק בהצלחה',
          variant: 'success',
        });
        fetchClient();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה במחיקת המסמך',
        variant: 'destructive',
      });
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim()) {
      toast({
        title: 'שגיאה',
        description: 'אנא הזן שם איש קשר',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', contactForm.name);
      if (contactForm.phone) formData.append('phone', contactForm.phone);
      if (contactForm.email) formData.append('email', contactForm.email);

      const response = await apiClient.post(`/add_contact/${clientId}`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'איש הקשר נוסף בהצלחה',
          variant: 'success',
        });
        setContactForm({ name: '', phone: '', email: '' });
        fetchClient();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בהוספת איש הקשר',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את איש הקשר?')) return;

    try {
      const formData = new FormData();
      const response = await apiClient.post(`/delete_contact/${clientId}/${contactId}`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'איש הקשר נמחק בהצלחה',
          variant: 'success',
        });
        fetchClient();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה במחיקת איש הקשר',
        variant: 'destructive',
      });
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('activity_type', currentActivityType);
      if (activityForm.title) formData.append('title', activityForm.title);
      if (activityForm.content) formData.append('content', activityForm.content);
      if (activityForm.duration) formData.append('duration', activityForm.duration);
      if (activityForm.participants) formData.append('participants', activityForm.participants);
      formData.append('follow_up_required', activityForm.follow_up_required ? 'true' : 'false');
      if (activityForm.follow_up_date) formData.append('follow_up_date', activityForm.follow_up_date);

      const response = await apiClient.post(`/add_activity/${clientId}`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'הפעילות נוספה בהצלחה',
          variant: 'success',
        });
        setActivityModalOpen(false);
        setActivityForm({
          title: '',
          content: '',
          duration: '',
          participants: '',
          follow_up_required: false,
          follow_up_date: '',
        });
        fetchClient();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בהוספת הפעילות',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הפעילות?')) return;

    try {
      const formData = new FormData();
      formData.append('client_id', clientId || '');
      const response = await apiClient.post(`/delete_activity/${activityId}`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'הפעילות נמחקה בהצלחה',
          variant: 'success',
        });
        fetchClient();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה במחיקת הפעילות',
        variant: 'destructive',
      });
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await apiFormClient.post(`/upload_logo/${clientId}`, formData, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        },
      });

      if (response.data?.success || response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'הלוגו הועלה בהצלחה',
          variant: 'success',
        });
        fetchClient();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בהעלאת הלוגו',
        variant: 'destructive',
      });
    }
    // Reset input to allow re-uploading the same file
    e.target.value = '';
  };

  const handleToggleClientActive = async (checked: boolean) => {
    try {
      const response = await apiClient.post(`/toggle_client_active/${clientId}`, {
        active: checked,
      });

      if (response.data.success) {
        toast({
          title: 'הצלחה',
          description: checked ? 'הלקוח הופעל' : 'הלקוח הועבר לארכיון',
          variant: 'success',
        });
        if (!checked) {
          if (confirm('הלקוח הועבר לארכיון. האם ברצונך לעבור לדף הארכיון?')) {
            navigate('/archive');
          } else {
            fetchClient();
          }
        } else {
          fetchClient();
        }
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בעדכון הסטטוס',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'לביצוע':
        return 'bg-blue-100 text-blue-800';
      case 'הועבר לסטודיו':
        return 'bg-purple-100 text-purple-800';
      case 'הועבר לדיגיטל':
        return 'bg-teal-100 text-teal-800';
      case 'נשלח ללקוח':
        return 'bg-green-100 text-green-800';
      case 'הושלם':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'low':
        return '#94a3b8';
      case 'medium':
        return '#3d817a';
      case 'high':
        return '#f59e0b';
      case 'urgent':
        return '#ef4444';
      default:
        return '#3d817a';
    }
  };

  const getPriorityText = (priority?: string) => {
    switch (priority) {
      case 'low':
        return 'נמוכה';
      case 'medium':
        return 'בינונית';
      case 'high':
        return 'גבוהה';
      case 'urgent':
        return 'דחוף';
      default:
        return 'בינונית';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      if (dateStr.includes('T')) {
        return dateStr.split('T')[0];
      }
      return dateStr.substring(0, 10);
    } catch {
      return dateStr;
    }
  };

  const userRole = currentUser?.role || '';
  const isAdminOrManager =
    currentUser?.id === 'admin' || ['מנהל', 'אדמין'].includes(userRole);

  // Check if a project has new tasks from other users (created in last 24 hours)
  const hasNewTasksFromOthers = (project: Project): boolean => {
    if (!project.tasks || project.tasks.length === 0) return false;
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return project.tasks.some((task) => {
      // Check if task was created by someone else
      if (task.created_by && task.created_by !== currentUser?.id) {
        // Check if created within last 24 hours
        if (task.created_date) {
          try {
            // Handle different date formats
            let taskDate: Date;
            if (task.created_date.includes('/')) {
              // Format: dd/mm/yy or dd/mm/yyyy
              const parts = task.created_date.split(' ')[0].split('/');
              if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                let year = parseInt(parts[2], 10);
                if (year < 100) year += 2000;
                taskDate = new Date(year, month, day);
              } else {
                return false;
              }
            } else if (task.created_date.includes('-')) {
              // Format: yyyy-mm-dd
              taskDate = new Date(task.created_date);
            } else {
              return false;
            }
            return taskDate >= oneDayAgo;
          } catch {
            return false;
          }
        }
      }
      return false;
    });
  };

  // Count new tasks from others in a project
  const countNewTasksFromOthers = (project: Project): number => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return project.tasks.filter((task) => {
      if (task.created_by && task.created_by !== currentUser?.id) {
        if (task.created_date) {
          try {
            let taskDate: Date;
            if (task.created_date.includes('/')) {
              const parts = task.created_date.split(' ')[0].split('/');
              if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                let year = parseInt(parts[2], 10);
                if (year < 100) year += 2000;
                taskDate = new Date(year, month, day);
              } else {
                return false;
              }
            } else if (task.created_date.includes('-')) {
              taskDate = new Date(task.created_date);
            } else {
              return false;
            }
            return taskDate >= oneDayAgo;
          } catch {
            return false;
          }
        }
      }
      return false;
    }).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">טוען פרטי לקוח...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-600">לקוח לא נמצא</div>
      </div>
    );
  }

  const assignedUsers = Array.isArray(client.assigned_user)
    ? client.assigned_user
    : client.assigned_user
    ? [client.assigned_user]
    : [];
  const assignedNames = assignedUsers
    .map((uid) => users.find((u) => u.id === uid)?.name || uid)
    .join(', ') || 'לא שויך';

  const totalCharges = client.extra_charges?.reduce((sum, ch) => sum + (ch.amount || 0), 0) || 0;
  const totalOurCost = client.extra_charges?.reduce((sum, ch) => sum + (ch.our_cost || 0), 0) || 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Client Header */}
      <Card className="relative">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-[#3d817a] to-[#2d6159] rounded-t-lg" />
        <CardContent className="p-4 sm:p-6 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Mobile: Switch at top */}
            {isAdminOrManager && (
              <div className="flex sm:hidden items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-200 shadow-sm self-start">
                <Switch
                  id="client-active-mobile"
                  checked={!client.archived}
                  onCheckedChange={handleToggleClientActive}
                  className="data-[state=checked]:bg-[#3d817a]"
                />
                <Label htmlFor="client-active-mobile" className="text-sm font-medium text-[#043841] whitespace-nowrap cursor-pointer">
                  לקוח פעיל
                </Label>
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 flex-1">
              <div
                className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#0073ea] hover:scale-105 transition-all relative overflow-hidden group flex-shrink-0"
                onClick={() => document.getElementById('logoInput')?.click()}
              >
                {client.logo_url ? (
                  <img
                    src={`/static/logos/${client.logo_url}?v=${Date.now()}`}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-gray-400 text-xs">לחץ להעלאה</span>
                )}
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent text-white text-xs text-center py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  החלף לוגו
                </div>
              </div>
              <input
                type="file"
                id="logoInput"
                accept="image/*"
                className="hidden"
                onChange={handleUploadLogo}
              />
              <div className="flex-1 text-center sm:text-right">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#292f4c] mb-2">{client.name}</h1>
                <div className="text-sm text-gray-600 mb-1">
                  מספר לקוח: {client.client_number || 'N/A'}
                </div>
                <div className="text-sm text-[#0073ea] mb-2">👤 מנהל: {assignedNames}</div>
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-1 text-[#00c875] font-semibold">
                    <Clock className="w-4 h-4" />
                    סה"כ שעות: {timeTrackingSummary ? timeTrackingSummary.totalHours : 0}
                  </div>
                  <div className="flex items-center gap-1 text-[#0073ea] font-semibold">
                    <Clock className="w-4 h-4" />
                    שעות החודש: {timeTrackingSummary ? timeTrackingSummary.thisMonthHours : 0}
                  </div>
                </div>
              </div>
            </div>
            {/* Desktop: Switch at side */}
            {isAdminOrManager && (
              <div className="hidden sm:flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-200 shadow-sm flex-shrink-0">
                <Switch
                  id="client-active"
                  checked={!client.archived}
                  onCheckedChange={handleToggleClientActive}
                  className="data-[state=checked]:bg-[#3d817a]"
                />
                <Label htmlFor="client-active" className="text-sm font-medium text-[#043841] whitespace-nowrap cursor-pointer">
                  לקוח פעיל
                </Label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Projects and Tasks */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
            <CardTitle className="text-lg sm:text-xl">פרויקטים ומשימות</CardTitle>
            <form onSubmit={handleAddProject} className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-end">
              <Input
                type="text"
                placeholder="שם פרויקט חדש..."
                value={projectForm.title}
                onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                className="w-full sm:min-w-[200px] lg:min-w-[250px]"
                required
              />
              <div className="flex gap-2 sm:gap-3">
                <Select
                  value={projectForm.is_shared}
                  onValueChange={(value) => setProjectForm({ ...projectForm, is_shared: value })}
                >
                  <SelectTrigger className="w-[100px] sm:w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">פרטי</SelectItem>
                    <SelectItem value="true">משותף</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" className="bg-black hover:bg-gray-800 whitespace-nowrap">
                  <Plus className="w-4 h-4 sm:ml-2" />
                  <span className="hidden sm:inline">הוסף פרויקט</span>
                </Button>
              </div>
            </form>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {client.projects && client.projects.length > 0 ? (
            client.projects.map((project) => (
              <Card
                key={project.id}
                className={cn(
                  'bg-gray-50 border-2 border-gray-200 transition-all',
                  expandedProjects.has(project.id) ? '' : 'overflow-hidden'
                )}
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => handleToggleProject(project.id)}
                    >
                      {expandedProjects.has(project.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                      <h3 className="text-xl font-bold text-[#3d817a] flex items-center gap-2">
                        {project.title}
                        {project.project_number && (
                          <span className="text-sm text-gray-500 font-normal font-mono">
                            #{project.project_number}
                          </span>
                        )}
                        {/* New tasks notification badge */}
                        {hasNewTasksFromOthers(project) && (
                          <span className="relative flex items-center">
                            <Bell className="w-5 h-5 text-orange-500 animate-pulse" />
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                              {countNewTasksFromOthers(project)}
                            </span>
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/project/${clientId}/${project.id}/gantt`)}
                      >
                        תרשים גאנט
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 ml-1" />
                        מחק
                      </Button>
                    </div>
                  </div>

                  {expandedProjects.has(project.id) && (
                    <div className="space-y-3 mt-4">
                      {/* Tasks List */}
                      {project.tasks && project.tasks.length > 0 && (
                        <div className="space-y-2">
                          {project.tasks.map((task) => {
                            // Check if this is a new task from another user
                            const isNewFromOther = (() => {
                              if (task.created_by && task.created_by !== currentUser?.id && task.created_date) {
                                try {
                                  const now = new Date();
                                  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                                  let taskDate: Date;
                                  if (task.created_date.includes('/')) {
                                    const parts = task.created_date.split(' ')[0].split('/');
                                    if (parts.length === 3) {
                                      const day = parseInt(parts[0], 10);
                                      const month = parseInt(parts[1], 10) - 1;
                                      let year = parseInt(parts[2], 10);
                                      if (year < 100) year += 2000;
                                      taskDate = new Date(year, month, day);
                                    } else return false;
                                  } else if (task.created_date.includes('-')) {
                                    taskDate = new Date(task.created_date);
                                  } else return false;
                                  return taskDate >= oneDayAgo;
                                } catch { return false; }
                              }
                              return false;
                            })();
                            
                            return (
                            <div
                              key={task.id}
                              className={cn(
                                "bg-white p-4 rounded-lg border-r-4 flex items-center gap-4 flex-wrap",
                                isNewFromOther && "ring-2 ring-orange-400 ring-offset-2 bg-orange-50"
                              )}
                              style={{
                                borderRightColor: getPriorityColor(task.priority),
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="font-bold text-[#292f4c]">{task.title}</div>
                                  {isNewFromOther && (
                                    <span className="px-2 py-1 rounded-full text-xs font-bold text-white bg-orange-500 flex items-center gap-1">
                                      <Bell className="w-3 h-3" />
                                      חדש
                                    </span>
                                  )}
                                  {task.priority && ['high', 'urgent'].includes(task.priority) && (
                                    <span
                                      className="px-2 py-1 rounded-full text-xs font-bold text-white"
                                      style={{
                                        backgroundColor: getPriorityColor(task.priority),
                                      }}
                                    >
                                      {getPriorityText(task.priority)}
                                    </span>
                                  )}
                                  <Input
                                    type="date"
                                    value={formatDate(task.deadline)}
                                    onChange={(e) =>
                                      handleUpdateTaskDeadline(
                                        client.id,
                                        project.id,
                                        task.id,
                                        e.target.value
                                      )
                                    }
                                    className="w-[140px] text-xs border-[#3d817a] bg-[#3d817a] text-white"
                                    style={{ direction: 'ltr' }}
                                  />
                                </div>
                              </div>
                              <Select
                                value={task.status}
                                onValueChange={(value) =>
                                  handleUpdateTaskStatus(client.id, project.id, task.id, value)
                                }
                              >
                                <SelectTrigger
                                  className={cn('w-[180px]', getStatusColor(task.status))}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="לביצוע">לביצוע</SelectItem>
                                  <SelectItem value="הועבר לסטודיו">הועבר לסטודיו</SelectItem>
                                  <SelectItem value="הועבר לדיגיטל">הועבר לדיגיטל</SelectItem>
                                  <SelectItem value="נשלח ללקוח">נשלח ללקוח</SelectItem>
                                  <SelectItem value="הושלם">הושלם</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                {task.created_date || 'ללא תאריך'}
                              </div>
                              <TimeTracker
                                clientId={client.id}
                                projectId={project.id}
                                taskId={task.id}
                                compact={true}
                                onStop={fetchTimeTrackingSummary}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleOpenNoteModal(
                                    client.id,
                                    project.id,
                                    task.id,
                                    task.note || ''
                                  )
                                }
                                className="text-[#043841]"
                              >
                                <Edit className="w-4 h-4 ml-1" />
                                {task.note ? 'דגשים' : 'דגשים'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTask(client.id, project.id, task.id, task.title)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add Task Form */}
                      <Card className="bg-white border-dashed">
                        <CardContent className="p-4">
                          <TaskForm
                            key={`task-form-${project.id}-${taskFormKeys[project.id] || 0}`}
                            projectId={project.id}
                            clientId={client.id}
                            onSubmit={(formData) => handleAddTask({ preventDefault: () => {} } as React.FormEvent, project.id, formData)}
                            users={users}
                            currentUserId={currentUser?.id || ''}
                            existingTasks={project.tasks || []}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📁</div>
              <div className="font-bold mb-2">אין פרויקטים עדיין</div>
              <div className="text-sm">הוסף פרויקט ראשון באמצעות הטופס למעלה</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Finance Section */}
      <Card>
        <CardHeader>
          <CardTitle>כספים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Retainer */}
          <form onSubmit={handleUpdateRetainer} className="flex items-center gap-4">
            <Label className="font-bold text-[#292f4c]">ריטיינר:</Label>
            <Input
              type="number"
              value={retainerAmount}
              onChange={(e) => setRetainerAmount(e.target.value)}
              className="w-[120px] font-bold"
            />
            <Button type="submit" className="bg-black hover:bg-gray-800">
              עדכן
            </Button>
          </form>

          {/* Add Charge */}
          <form onSubmit={handleAddCharge} className="grid grid-cols-5 gap-4 items-end">
            <div>
              <Label>שם החיוב:</Label>
              <Input
                value={chargeForm.title}
                onChange={(e) => setChargeForm({ ...chargeForm, title: e.target.value })}
                placeholder="למשל: משלוחים"
                required
              />
            </div>
            <div>
              <Label>תיאור (אופציונלי):</Label>
              <Input
                value={chargeForm.description}
                onChange={(e) => setChargeForm({ ...chargeForm, description: e.target.value })}
                placeholder="פירוט נוסף..."
              />
            </div>
            <div>
              <Label>סכום לחיוב:</Label>
              <Input
                type="number"
                value={chargeForm.amount}
                onChange={(e) => setChargeForm({ ...chargeForm, amount: e.target.value })}
                placeholder="סכום"
                required
              />
            </div>
            <div>
              <Label>עלות פנימית (אופציונלי):</Label>
              <Input
                type="number"
                step="0.01"
                value={chargeForm.our_cost}
                onChange={(e) => setChargeForm({ ...chargeForm, our_cost: e.target.value })}
                placeholder="עלות פנימית"
              />
            </div>
            <Button type="submit" className="bg-black hover:bg-gray-800">
              הוסף חיוב
            </Button>
          </form>

          {/* Charges Table */}
          {client.extra_charges && client.extra_charges.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-[#043841] text-white">
                    <th className="p-3 text-right font-bold">שם / תיאור</th>
                    <th className="p-3 text-center font-bold">סכום לחיוב</th>
                    <th className="p-3 text-center font-bold">עלות פנימית</th>
                    <th className="p-3 text-center font-bold">תאריך</th>
                    <th className="p-3 text-center font-bold">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {client.extra_charges.map((charge) => (
                    <tr key={charge.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          {charge.charge_number && (
                            <span className="text-xs text-gray-500 font-mono mr-2">
                              #{charge.charge_number}
                            </span>
                          )}
                          <span className="font-medium">{charge.title}</span>
                          {charge.description && (
                            <div className="text-sm text-gray-600 mt-1">
                              {charge.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center text-green-600 font-bold text-lg">
                        ₪{charge.amount.toLocaleString()}
                      </td>
                      <td className="p-3 text-center text-gray-600">
                        {charge.our_cost && charge.our_cost > 0 ? (
                          `₪${charge.our_cost.toLocaleString()}`
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3 text-center text-gray-600">{charge.date}</td>
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCharge(charge.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold">
                    <td className="p-4 text-lg">סה"כ חיובים נוספים:</td>
                    <td className="p-4 text-center text-green-600 text-xl">
                      ₪{totalCharges.toLocaleString()}
                    </td>
                    <td className="p-4 text-center text-gray-600">
                      {totalOurCost > 0 ? `₪${totalOurCost.toLocaleString()}` : '-'}
                    </td>
                    <td></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle>מסמכים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleUploadDocument} className="flex gap-3">
            <Input
              type="file"
              name="document"
              required
              className="flex-1"
            />
            <Button type="submit" className="bg-black hover:bg-gray-800">
              <Upload className="w-4 h-4 ml-2" />
              העלה מסמך
            </Button>
          </form>

          {client.documents && client.documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {client.documents.map((doc) => (
                <Card key={doc.id} className="bg-gradient-to-br from-white to-gray-50">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex-1">
                      <a
                        href={`/download_doc/${doc.file_path}`}
                        className="text-[#0073ea] font-bold hover:underline block mb-1"
                      >
                        📄 {doc.display_name}
                      </a>
                      <div className="text-sm text-gray-600">{doc.upload_date}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📄</div>
              <div className="font-bold">אין מסמכים עדיין</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contacts Section */}
      <Card>
        <CardHeader>
          <CardTitle>יצירת קשר</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddContact} className="grid grid-cols-4 gap-4">
            <div>
              <Label>שם:</Label>
              <Input
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>טלפון:</Label>
              <Input
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label>מייל:</Label>
              <Input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              />
            </div>
            <Button type="submit" className="bg-black hover:bg-gray-800">
              הוסף איש קשר
            </Button>
          </form>

          {client.contacts && client.contacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {client.contacts.map((contact) => (
                <Card key={contact.id} className="bg-gradient-to-br from-white to-gray-50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-bold text-[#292f4c]">{contact.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-[#0073ea] hover:underline"
                          >
                            {contact.phone}
                          </a>
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-[#0073ea] hover:underline"
                          >
                            {contact.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">👤</div>
              <div className="font-bold">אין אנשי קשר עדיין</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity History Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>היסטוריית קשר</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentActivityType('call');
                  setActivityModalOpen(true);
                }}
              >
                <Phone className="w-4 h-4 ml-1" />
                שיחה
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentActivityType('meeting');
                  setActivityModalOpen(true);
                }}
              >
                <Calendar className="w-4 h-4 ml-1" />
                פגישה
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentActivityType('note');
                  setActivityModalOpen(true);
                }}
              >
                <FileText className="w-4 h-4 ml-1" />
                הערה
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {client.activities && client.activities.length > 0 ? (
            <div className="space-y-4">
              {client.activities.map((activity) => (
                <Card
                  key={activity.id}
                  className="border-r-4"
                  style={{
                    borderRightColor:
                      activity.activity_type === 'call'
                        ? '#25D366'
                        : activity.activity_type === 'meeting'
                        ? '#667eea'
                        : activity.activity_type === 'note'
                        ? '#f59e0b'
                        : '#3d817a',
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {activity.activity_type === 'call' && (
                            <>
                              <span className="text-xl">📞</span>
                              <strong className="text-[#292f4c]">שיחת טלפון</strong>
                            </>
                          )}
                          {activity.activity_type === 'meeting' && (
                            <>
                              <span className="text-xl">📅</span>
                              <strong className="text-[#292f4c]">פגישה</strong>
                            </>
                          )}
                          {activity.activity_type === 'note' && (
                            <>
                              <span className="text-xl">📝</span>
                              <strong className="text-[#292f4c]">הערה</strong>
                            </>
                          )}
                          {activity.title && (
                            <span className="text-gray-600">- {activity.title}</span>
                          )}
                        </div>
                        {activity.content && (
                          <div className="text-gray-600 mb-2">{activity.content}</div>
                        )}
                        {activity.duration && (
                          <div className="text-sm text-gray-600 mb-1">
                            <Clock className="w-3 h-3 inline ml-1" />
                            {activity.duration}
                          </div>
                        )}
                        {activity.participants && (
                          <div className="text-sm text-gray-600 mb-1">
                            <Users className="w-3 h-3 inline ml-1" />
                            {activity.participants}
                          </div>
                        )}
                        {activity.follow_up_required && activity.follow_up_date && (
                          <div className="text-sm text-yellow-600 font-bold mt-2">
                            ⏰ תזכורת: {activity.follow_up_date}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-xs text-gray-500">
                          {activity.timestamp.split('T')[0]}{' '}
                          {activity.timestamp.split('T')[1]?.substring(0, 5)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {users.find((u) => u.id === activity.user_id)?.name || activity.user_id}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteActivity(activity.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📋</div>
              <div className="font-bold mb-2">אין פעילויות רשומות עדיין</div>
              <div className="text-sm">הוסף פעילות ראשונה באמצעות הכפתורים למעלה</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note Modal */}
      <Dialog open={noteModalOpen} onOpenChange={setNoteModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              הערה למשימה
            </DialogTitle>
            <DialogDescription>
              הוסף או ערוך הערה למשימה
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="הזן הערה כאן..."
              rows={8}
              className="min-h-[200px]"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setNoteModalOpen(false)}>
                ביטול
              </Button>
              {noteText && (
                <Button variant="destructive" onClick={handleDeleteNote}>
                  <Trash2 className="w-4 h-4 ml-1" />
                  מחק הערה
                </Button>
              )}
              <Button onClick={handleSaveNote} className="bg-black hover:bg-gray-800">
                שמור הערה
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity Modal */}
      <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentActivityType === 'call' && '📞 שיחת טלפון'}
              {currentActivityType === 'meeting' && '📅 פגישה'}
              {currentActivityType === 'note' && '📝 הערה'}
            </DialogTitle>
            <DialogDescription>
              הוסף פעילות חדשה ללקוח
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddActivity} className="space-y-4">
            <div>
              <Label>נושא:</Label>
              <Input
                value={activityForm.title}
                onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
              />
            </div>
            {(currentActivityType === 'call' || currentActivityType === 'meeting') && (
              <>
                <div>
                  <Label>משך זמן:</Label>
                  <Input
                    value={activityForm.duration}
                    onChange={(e) => setActivityForm({ ...activityForm, duration: e.target.value })}
                    placeholder="לדוגמה: 30 דקות"
                  />
                </div>
                {currentActivityType === 'meeting' && (
                  <div>
                    <Label>משתתפים:</Label>
                    <Input
                      value={activityForm.participants}
                      onChange={(e) =>
                        setActivityForm({ ...activityForm, participants: e.target.value })
                      }
                      placeholder="רשום שמות משתתפים"
                    />
                  </div>
                )}
              </>
            )}
            <div>
              <Label>תוכן/הערות:</Label>
              <Textarea
                value={activityForm.content}
                onChange={(e) => setActivityForm({ ...activityForm, content: e.target.value })}
                rows={4}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="followUp"
                checked={activityForm.follow_up_required}
                onChange={(e) =>
                  setActivityForm({ ...activityForm, follow_up_required: e.target.checked })
                }
                className="w-4 h-4"
              />
              <Label htmlFor="followUp" className="cursor-pointer">
                דרושה תזכורת
              </Label>
              {activityForm.follow_up_required && (
                <Input
                  type="date"
                  value={activityForm.follow_up_date}
                  onChange={(e) =>
                    setActivityForm({ ...activityForm, follow_up_date: e.target.value })
                  }
                  className="flex-1"
                />
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActivityModalOpen(false)}>
                ביטול
              </Button>
              <Button type="submit" className="bg-black hover:bg-gray-800">
                שמור
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחיקת משימה</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק את המשימה "{taskToDelete?.taskTitle}"?
              פעולה זו לא ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              ביטול
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTask}>
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Task Form Component
function TaskForm({
  projectId,
  clientId,
  onSubmit,
  users,
  currentUserId,
  existingTasks,
}: {
  projectId: string;
  clientId: string;
  onSubmit: (formData: any) => void;
  users: Array<{ id: string; name: string }>;
  currentUserId: string;
  existingTasks: Task[];
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    status: 'לביצוע',
    priority: 'medium',
    deadline: '',
    note: '',
    assignee: currentUserId,
    estimated_hours: '',
    dependencies: [] as string[],
    is_daily_task: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      title: '',
      status: 'לביצוע',
      priority: 'medium',
      deadline: '',
      note: '',
      assignee: currentUserId,
      estimated_hours: '',
      dependencies: [],
      is_daily_task: false,
    });
    setShowAdvanced(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <Label className="text-xs text-gray-600">שם המשימה:</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="שם המשימה..."
            required
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-600">סטאטוס:</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="לביצוע">לביצוע</SelectItem>
              <SelectItem value="הועבר לסטודיו">הועבר לסטודיו</SelectItem>
              <SelectItem value="הועבר לדיגיטל">הועבר לדיגיטל</SelectItem>
              <SelectItem value="נשלח ללקוח">נשלח ללקוח</SelectItem>
              <SelectItem value="הושלם">הושלם</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-gray-600">עדיפות:</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value })}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">נמוכה</SelectItem>
              <SelectItem value="medium">בינונית</SelectItem>
              <SelectItem value="high">גבוהה</SelectItem>
              <SelectItem value="urgent">דחוף</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-gray-600">תאריך יעד:</Label>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="text-sm flex-1"
              style={{ direction: 'ltr' }}
            />
            <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
              <Checkbox
                id={`is_daily_task_${projectId}`}
                checked={formData.is_daily_task}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_daily_task: checked === true })
                }
                className="w-3.5 h-3.5"
              />
              <Label 
                htmlFor={`is_daily_task_${projectId}`} 
                className="cursor-pointer text-gray-600 hover:text-[#3d817a]"
              >
                יומית
              </Label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" className="bg-black hover:bg-gray-800">
          הוסף משימה
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'פשוט' : 'פרטים נוספים'}
        </Button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-3 gap-3 pt-3 border-t">
          <div>
            <Label className="text-xs text-gray-600">אחראי:</Label>
            <Select
              value={formData.assignee}
              onValueChange={(value) => setFormData({ ...formData, assignee: value })}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="בחר אחראי" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">בחר אחראי</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-600">שעות משוערות:</Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={formData.estimated_hours}
              onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
              placeholder="שעות"
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-600">תלויות:</Label>
            <select
              multiple
              value={formData.dependencies}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                setFormData({ ...formData, dependencies: selected });
              }}
              className="w-full p-2 border rounded text-sm min-h-[80px]"
            >
              {existingTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
            <small className="text-xs text-gray-500 block mt-1">
              לחיצה מרובת - משימות שצריכות להסתיים קודם
            </small>
          </div>
          <div className="col-span-3">
            <Label className="text-xs text-gray-600">הערה:</Label>
            <Textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="הערה (אופציונלי)"
              rows={2}
              className="text-sm"
            />
          </div>
        </div>
      )}
    </form>
  );
}
