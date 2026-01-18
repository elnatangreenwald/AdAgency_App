import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Download, Calendar, Clock, User, Building2 } from 'lucide-react';

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

export function TimeTrackingReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [users, setUsers] = useState<Record<string, { name: string }>>({});
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const { toast } = useToast();
  const { user } = useAuth();

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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-3',hypothesisId:'R4',location:'TimeTrackingReports.tsx:fetchUsers',message:'fetch users failed',data:{},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-3',hypothesisId:'R4',location:'TimeTrackingReports.tsx:fetchClients',message:'fetch clients failed',data:{},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
      console.error('Error fetching clients:', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { month: selectedMonth };
      if (selectedUserId) params.user_id = selectedUserId;
      if (selectedClientId) params.client_id = selectedClientId;

      const queryString = new URLSearchParams(params).toString();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-3',hypothesisId:'R1',location:'TimeTrackingReports.tsx:fetchReport',message:'report request',data:{queryString},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
      const response = await apiClient.get(`/api/time_tracking/report?${queryString}`);

      if (response.data.success) {
        setReportData(response.data);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-3',hypothesisId:'R2',location:'TimeTrackingReports.tsx:fetchReport',message:'report success',data:{entriesCount:response.data.entries?.length || 0},timestamp:Date.now()})}).catch(()=>{});
        // #endregion agent log
      } else {
        toast({
          title: 'שגיאה',
          description: response.data.error || 'שגיאה בטעינת הדוח',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix-3',hypothesisId:'R3',location:'TimeTrackingReports.tsx:fetchReport',message:'report error',data:{status:error?.response?.status || null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion agent log
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#292f4c]">דוחות מדידת זמן</h1>
        {reportData && (
          <Button onClick={exportToExcel} className="bg-[#00c875] hover:bg-[#00b368]">
            <Download className="w-4 h-4 ml-2" />
            ייצא ל-Excel
          </Button>
        )}
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
                  <SelectItem value="">כל העובדים</SelectItem>
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
                  <SelectItem value="">כל הלקוחות</SelectItem>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-[#0073ea]" />
                  <div>
                    <div className="text-sm text-gray-600">סה"כ שעות</div>
                    <div className="text-2xl font-bold">{reportData.total_hours}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-[#00c875]" />
                  <div>
                    <div className="text-sm text-gray-600">סה"כ רשומות</div>
                    <div className="text-2xl font-bold">{reportData.total_entries}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <User className="w-8 h-8 text-[#f59e0b]" />
                  <div>
                    <div className="text-sm text-gray-600">מספר עובדים</div>
                    <div className="text-2xl font-bold">
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
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-right">תאריך</th>
                      <th className="border p-2 text-right">עובד</th>
                      <th className="border p-2 text-right">לקוח</th>
                      <th className="border p-2 text-right">פרויקט</th>
                      <th className="border p-2 text-right">משימה</th>
                      <th className="border p-2 text-right">שעת התחלה</th>
                      <th className="border p-2 text-right">שעת סיום</th>
                      <th className="border p-2 text-right">משך זמן</th>
                      <th className="border p-2 text-right">הערה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="border p-2">{formatDate(entry.date)}</td>
                        <td className="border p-2">{entry.user_name}</td>
                        <td className="border p-2">{entry.client_name}</td>
                        <td className="border p-2">{entry.project_title}</td>
                        <td className="border p-2">{entry.task_title}</td>
                        <td className="border p-2">{formatTime(entry.start_time)}</td>
                        <td className="border p-2">{formatTime(entry.end_time)}</td>
                        <td className="border p-2 font-semibold">
                          {entry.duration_hours} שעות
                        </td>
                        <td className="border p-2 text-sm text-gray-600">
                          {entry.note || '-'}
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
    </div>
  );
}

