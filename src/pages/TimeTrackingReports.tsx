import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Download, Calendar, Clock, User, Building2, Edit2, Trash2, Plus, PlusCircle, MinusCircle } from 'lucide-react';

interface TimeEntry {
  id: string;
  user_id: string;
  user_name: string;
  client_id: string;
  client_name: string;
  project_id: string;
  project_title: string;
  task_id: string;
  task_title: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  note: string;
  date: string;
}

interface ReportData {
  month: string;
  total_hours: number;
  total_entries: number;
  by_client: Record<string, { hours: number; client_name: string; entries: TimeEntry[] }>;
  by_user: Record<string, { hours: number; user_name: string; entries: TimeEntry[] }>;
  entries: TimeEntry[];
}

interface ClientWithProjects {
  id: string;
  name: string;
  projects?: Array<{
    id: string;
    title: string;
    tasks?: Array<{
      id: string;
      title?: string;
      desc?: string;
    }>;
  }>;
}

export function TimeTrackingReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [users, setUsers] = useState<Record<string, { name: string }>>({});
  const [clients, setClients] = useState<Array<ClientWithProjects>>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [editForm, setEditForm] = useState({
    start_time: '',
    end_time: '',
    duration_hours: 0,
    note: '',
  });

  // Add Manual Entry Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    client_id: '',
    project_id: '',
    task_id: '',
    user_id: '',
    date: new Date().toISOString().split('T')[0],
    duration_hours: 1,
    note: '',
  });

  // Delete Confirmation State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<TimeEntry | null>(null);

  // Adjust Hours Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustingEntry, setAdjustingEntry] = useState<TimeEntry | null>(null);
  const [adjustmentHours, setAdjustmentHours] = useState(0);

  useEffect(() => {
    fetchUsers();
    fetchClients();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedUserId, selectedClientId]);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/api/admin/users');
      if (response.data.success) {
        const usersMap: Record<string, { name: string }> = {};
        response.data.users.forEach((u: any) => {
          usersMap[u.id] = { name: u.name };
        });
        setUsers(usersMap);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await apiClient.get('/api/all_clients');
      if (response.data.success) {
        setClients(response.data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  // Edit Entry Functions
  const openEditModal = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setEditForm({
      start_time: entry.start_time.slice(0, 16), // Format for datetime-local input
      end_time: entry.end_time.slice(0, 16),
      duration_hours: entry.duration_hours,
      note: entry.note || '',
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingEntry) return;

    try {
      const response = await apiClient.put(`/api/time_tracking/entry/${editingEntry.id}`, {
        start_time: new Date(editForm.start_time).toISOString(),
        end_time: new Date(editForm.end_time).toISOString(),
        note: editForm.note,
      });

      if (response.data.success) {
        toast({
          title: 'הצלחה',
          description: 'הרשומה עודכנה בהצלחה',
          variant: 'success',
        });
        setEditModalOpen(false);
        fetchReport();
      } else {
        toast({
          title: 'שגיאה',
          description: response.data.error || 'שגיאה בעדכון הרשומה',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error updating entry:', error);
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בעדכון הרשומה',
        variant: 'destructive',
      });
    }
  };

  // Delete Entry Functions
  const openDeleteDialog = (entry: TimeEntry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;

    try {
      const response = await apiClient.delete(`/api/time_tracking/entry/${entryToDelete.id}`);

      if (response.data.success) {
        toast({
          title: 'הצלחה',
          description: 'הרשומה נמחקה בהצלחה',
          variant: 'success',
        });
        setDeleteDialogOpen(false);
        fetchReport();
      } else {
        toast({
          title: 'שגיאה',
          description: response.data.error || 'שגיאה במחיקת הרשומה',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה במחיקת הרשומה',
        variant: 'destructive',
      });
    }
  };

  // Add Manual Entry Functions
  const openAddModal = () => {
    setAddForm({
      client_id: '',
      project_id: '',
      task_id: '',
      user_id: user?.id || '',
      date: new Date().toISOString().split('T')[0],
      duration_hours: 1,
      note: '',
    });
    setAddModalOpen(true);
  };

  const handleAddSubmit = async () => {
    if (!addForm.client_id || !addForm.project_id || !addForm.task_id) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור לקוח, פרויקט ומשימה',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await apiClient.post('/api/time_tracking/manual', {
        client_id: addForm.client_id,
        project_id: addForm.project_id,
        task_id: addForm.task_id,
        user_id: addForm.user_id,
        date: addForm.date,
        duration_hours: addForm.duration_hours,
        note: addForm.note || 'הוספה ידנית',
      });

      if (response.data.success) {
        toast({
          title: 'הצלחה',
          description: 'הרשומה נוספה בהצלחה',
          variant: 'success',
        });
        setAddModalOpen(false);
        fetchReport();
      } else {
        toast({
          title: 'שגיאה',
          description: response.data.error || 'שגיאה בהוספת הרשומה',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error adding entry:', error);
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בהוספת הרשומה',
        variant: 'destructive',
      });
    }
  };

  // Adjust Hours Functions
  const openAdjustModal = (entry: TimeEntry) => {
    setAdjustingEntry(entry);
    setAdjustmentHours(0);
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async () => {
    if (!adjustingEntry || adjustmentHours === 0) return;

    try {
      const response = await apiClient.post(`/api/time_tracking/adjust/${adjustingEntry.id}`, {
        adjustment_hours: adjustmentHours,
      });

      if (response.data.success) {
        toast({
          title: 'הצלחה',
          description: response.data.message,
          variant: 'success',
        });
        setAdjustModalOpen(false);
        fetchReport();
      } else {
        toast({
          title: 'שגיאה',
          description: response.data.error || 'שגיאה בהתאמת השעות',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error adjusting hours:', error);
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בהתאמת השעות',
        variant: 'destructive',
      });
    }
  };

  // Get projects for selected client
  const getProjectsForClient = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.projects || [];
  };

  // Get tasks for selected project
  const getTasksForProject = (clientId: string, projectId: string) => {
    const client = clients.find((c) => c.id === clientId);
    const project = client?.projects?.find((p) => p.id === projectId);
    return project?.tasks || [];
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { month: selectedMonth };
      if (selectedUserId && selectedUserId !== 'all') params.user_id = selectedUserId;
      if (selectedClientId && selectedClientId !== 'all') params.client_id = selectedClientId;

      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/api/time_tracking/report?${queryString}`);

      if (response.data.success) {
        setReportData(response.data);
      } else {
        toast({
          title: 'שגיאה',
          description: response.data.error || 'שגיאה בטעינת הדוח',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error fetching report:', error);
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בטעינת הדוח',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    if (!reportData) return;

    try {
      const monthName = new Date(selectedMonth + '-01').toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
      });

      // יצירת CSV
      let csv = `דוח שעות עבודה - ${monthName}\n\n`;
      csv += `סה"כ שעות: ${reportData.total_hours}\n`;
      csv += `סה"כ רשומות: ${reportData.total_entries}\n\n`;

      csv += 'פירוט לפי לקוח:\n';
      csv += 'לקוח,שעות\n';
      Object.values(reportData.by_client).forEach((data) => {
        csv += `${data.client_name},${data.hours}\n`;
      });

      csv += '\nפירוט לפי עובד:\n';
      csv += 'עובד,שעות\n';
      Object.values(reportData.by_user).forEach((data) => {
        csv += `${data.user_name},${data.hours}\n`;
      });

      csv += '\nפירוט מלא:\n';
      csv += 'תאריך,עובד,לקוח,פרויקט,משימה,שעת התחלה,שעת סיום,משך זמן (שעות),הערה\n';
      reportData.entries.forEach((entry) => {
        const startDate = new Date(entry.start_time).toLocaleString('he-IL');
        const endDate = new Date(entry.end_time).toLocaleString('he-IL');
        csv += `${entry.date},${entry.user_name},${entry.client_name},${entry.project_title},${entry.task_title},${startDate},${endDate},${entry.duration_hours},"${entry.note || ''}"\n`;
      });

      // הורדת הקובץ
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `time_tracking_report_${selectedMonth}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'הצלחה',
        description: 'הדוח הורד בהצלחה',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בייצוא הדוח',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('he-IL');
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-[#292f4c]">דוחות מדידת זמן</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button onClick={openAddModal} className="bg-[#0073ea] hover:bg-[#0060c0] w-full md:w-auto">
            <Plus className="w-4 h-4 ml-2" />
            הוספה ידנית
          </Button>
          {reportData && (
            <Button onClick={exportToExcel} className="bg-[#00c875] hover:bg-[#00b368] w-full md:w-auto">
              <Download className="w-4 h-4 ml-2" />
              ייצא ל-Excel
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>סינון דוח</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>חודש:</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="direction-ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>עובד (אופציונלי):</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="כל העובדים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל העובדים</SelectItem>
                  {Object.entries(users).map(([id, info]) => (
                    <SelectItem key={id} value={id}>
                      {info.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>לקוח (אופציונלי):</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="כל הלקוחות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הלקוחות</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-600">טוען דוח...</div>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 md:w-8 md:h-8 text-[#0073ea]" />
                  <div>
                    <div className="text-xs md:text-sm text-gray-600">סה"כ שעות</div>
                    <div className="text-xl md:text-2xl font-bold">{reportData.total_hours}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 md:w-8 md:h-8 text-[#00c875]" />
                  <div>
                    <div className="text-xs md:text-sm text-gray-600">סה"כ רשומות</div>
                    <div className="text-xl md:text-2xl font-bold">{reportData.total_entries}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="sm:col-span-2 md:col-span-1">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6 md:w-8 md:h-8 text-[#f59e0b]" />
                  <div>
                    <div className="text-xs md:text-sm text-gray-600">מספר עובדים</div>
                    <div className="text-xl md:text-2xl font-bold">
                      {Object.keys(reportData.by_user).length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* By Client */}
          {Object.keys(reportData.by_client).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  סיכום לפי לקוח
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(reportData.by_client)
                    .sort((a, b) => b[1].hours - a[1].hours)
                    .map(([clientId, data]) => (
                      <div
                        key={clientId}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="font-semibold">{data.client_name}</span>
                        <span className="text-lg font-bold text-[#0073ea]">
                          {data.hours} שעות
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* By User */}
          {Object.keys(reportData.by_user).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  סיכום לפי עובד
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(reportData.by_user)
                    .sort((a, b) => b[1].hours - a[1].hours)
                    .map(([userId, data]) => (
                      <div
                        key={userId}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="font-semibold">{data.user_name}</span>
                        <span className="text-lg font-bold text-[#00c875]">
                          {data.hours} שעות
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Entries */}
          <Card>
            <CardHeader>
              <CardTitle>פירוט מלא</CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-6">
              <div className="overflow-x-auto -mx-2 md:mx-0">
                <table className="w-full border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-right text-xs md:text-sm whitespace-nowrap">תאריך</th>
                      <th className="border p-2 text-right text-xs md:text-sm whitespace-nowrap">עובד</th>
                      <th className="border p-2 text-right text-xs md:text-sm whitespace-nowrap">לקוח</th>
                      <th className="border p-2 text-right text-xs md:text-sm whitespace-nowrap">פרויקט</th>
                      <th className="border p-2 text-right text-xs md:text-sm whitespace-nowrap">משימה</th>
                      <th className="border p-2 text-right text-xs md:text-sm whitespace-nowrap">שעת התחלה</th>
                      <th className="border p-2 text-right text-xs md:text-sm whitespace-nowrap">שעת סיום</th>
                      <th className="border p-2 text-right text-xs md:text-sm whitespace-nowrap">משך זמן</th>
                      <th className="border p-2 text-right text-xs md:text-sm whitespace-nowrap">הערה</th>
                      <th className="border p-2 text-right text-xs md:text-sm whitespace-nowrap">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="border p-2 text-xs md:text-sm whitespace-nowrap">{formatDate(entry.date)}</td>
                        <td className="border p-2 text-xs md:text-sm">{entry.user_name}</td>
                        <td className="border p-2 text-xs md:text-sm">{entry.client_name}</td>
                        <td className="border p-2 text-xs md:text-sm">{entry.project_title}</td>
                        <td className="border p-2 text-xs md:text-sm">{entry.task_title}</td>
                        <td className="border p-2 text-xs md:text-sm whitespace-nowrap">{formatTime(entry.start_time)}</td>
                        <td className="border p-2 text-xs md:text-sm whitespace-nowrap">{formatTime(entry.end_time)}</td>
                        <td className="border p-2 text-xs md:text-sm font-semibold whitespace-nowrap">
                          {entry.duration_hours} שעות
                        </td>
                        <td className="border p-2 text-xs md:text-sm text-gray-600 max-w-[150px] truncate">
                          {entry.note || '-'}
                        </td>
                        <td className="border p-2 text-xs md:text-sm whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAdjustModal(entry)}
                              title="התאמת שעות"
                              className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(entry)}
                              title="עריכה"
                              className="h-7 w-7 p-0 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(entry)}
                              title="מחיקה"
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            אין נתונים להצגה לחודש הנבחר
          </CardContent>
        </Card>
      )}

      {/* Edit Entry Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת רשומת זמן</DialogTitle>
            <DialogDescription>
              עדכן את פרטי הרשומה. שינוי הזמנים יעדכן אוטומטית את משך הזמן.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start-time">שעת התחלה</Label>
                <Input
                  id="edit-start-time"
                  type="datetime-local"
                  value={editForm.start_time}
                  onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                  className="direction-ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end-time">שעת סיום</Label>
                <Input
                  id="edit-end-time"
                  type="datetime-local"
                  value={editForm.end_time}
                  onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                  className="direction-ltr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-note">הערה</Label>
              <Textarea
                id="edit-note"
                value={editForm.note}
                onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                placeholder="הערה (אופציונלי)"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleEditSubmit} className="bg-[#0073ea] hover:bg-[#0060c0]">
              שמור שינויים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Manual Entry Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>הוספת רשומת זמן ידנית</DialogTitle>
            <DialogDescription>
              הוסף רשומת זמן חדשה באופן ידני.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label>לקוח</Label>
              <Select
                value={addForm.client_id}
                onValueChange={(value) => setAddForm({ ...addForm, client_id: value, project_id: '', task_id: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר לקוח" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project Selection */}
            <div className="space-y-2">
              <Label>פרויקט</Label>
              <Select
                value={addForm.project_id}
                onValueChange={(value) => setAddForm({ ...addForm, project_id: value, task_id: '' })}
                disabled={!addForm.client_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר פרויקט" />
                </SelectTrigger>
                <SelectContent>
                  {getProjectsForClient(addForm.client_id).map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Task Selection */}
            <div className="space-y-2">
              <Label>משימה</Label>
              <Select
                value={addForm.task_id}
                onValueChange={(value) => setAddForm({ ...addForm, task_id: value })}
                disabled={!addForm.project_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר משימה" />
                </SelectTrigger>
                <SelectContent>
                  {getTasksForProject(addForm.client_id, addForm.project_id).map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title || task.desc || 'משימה ללא שם'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* User Selection (for managers/admins) */}
            {user?.role && ['admin', 'manager'].includes(user.role) && (
              <div className="space-y-2">
                <Label>עובד</Label>
                <Select
                  value={addForm.user_id}
                  onValueChange={(value) => setAddForm({ ...addForm, user_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עובד" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(users).map(([id, info]) => (
                      <SelectItem key={id} value={id}>
                        {info.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date */}
            <div className="space-y-2">
              <Label>תאריך</Label>
              <Input
                type="date"
                value={addForm.date}
                onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                className="direction-ltr"
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>משך זמן (שעות)</Label>
              <Input
                type="number"
                min="0.25"
                step="0.25"
                value={addForm.duration_hours}
                onChange={(e) => setAddForm({ ...addForm, duration_hours: parseFloat(e.target.value) || 0 })}
                className="direction-ltr"
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label>הערה</Label>
              <Textarea
                value={addForm.note}
                onChange={(e) => setAddForm({ ...addForm, note: e.target.value })}
                placeholder="הערה (אופציונלי)"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleAddSubmit} className="bg-[#00c875] hover:bg-[#00b368]">
              <Plus className="w-4 h-4 ml-2" />
              הוסף רשומה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Hours Modal */}
      <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
        <DialogContent className="sm:max-w-[400px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>התאמת שעות</DialogTitle>
            <DialogDescription>
              הוסף או הורד שעות מהרשומה הנוכחית.
              {adjustingEntry && (
                <span className="block mt-2 font-semibold">
                  שעות נוכחיות: {adjustingEntry.duration_hours}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setAdjustmentHours((prev) => prev - 0.5)}
                className="h-12 w-12 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                <MinusCircle className="h-6 w-6" />
              </Button>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {adjustmentHours > 0 ? '+' : ''}{adjustmentHours}
                </div>
                <div className="text-sm text-gray-500">שעות</div>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setAdjustmentHours((prev) => prev + 0.5)}
                className="h-12 w-12 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
              >
                <PlusCircle className="h-6 w-6" />
              </Button>
            </div>
            <div className="text-center text-sm text-gray-600">
              {adjustingEntry && (
                <span>
                  סה"כ לאחר ההתאמה: <strong>{Math.max(0, adjustingEntry.duration_hours + adjustmentHours).toFixed(2)}</strong> שעות
                </span>
              )}
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setAdjustModalOpen(false)}>
              ביטול
            </Button>
            <Button
              onClick={handleAdjustSubmit}
              disabled={adjustmentHours === 0}
              className={adjustmentHours > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {adjustmentHours > 0 ? 'הוסף שעות' : adjustmentHours < 0 ? 'הורד שעות' : 'בחר כמות'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את רשומת הזמן לצמיתות.
              {entryToDelete && (
                <span className="block mt-2">
                  <strong>{entryToDelete.client_name}</strong> - {entryToDelete.task_title}
                  <br />
                  {entryToDelete.duration_hours} שעות ביום {formatDate(entryToDelete.date)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

