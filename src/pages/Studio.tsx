import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
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
import { apiClient, uploadStudioFile } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { StudioRequest, StudioStatus } from '@/types';
import { Plus, Palette, Clock, User, Paperclip, AlertTriangle } from 'lucide-react';

const STATUSES: StudioStatus[] = [
  'חדשה',
  'הוקצתה',
  'בעבודה',
  'ממתינה לאישור',
  'תיקונים',
  'הושלמה',
];

const PRIORITIES = ['נמוכה', 'רגילה', 'גבוהה', 'דחוף'];
const WORK_TYPES = ['מודעה', 'פוסט לרשתות', 'באנר', 'לוגו', 'פלייר', 'מצגת', 'הזמנה', 'אחר'];

export function statusColor(status: string) {
  switch (status) {
    case 'חדשה':
      return 'bg-blue-100 text-blue-800';
    case 'הוקצתה':
      return 'bg-purple-100 text-purple-800';
    case 'בעבודה':
      return 'bg-amber-100 text-amber-800';
    case 'ממתינה לאישור':
      return 'bg-cyan-100 text-cyan-800';
    case 'תיקונים':
      return 'bg-red-100 text-red-800';
    case 'הושלמה':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function priorityColor(priority?: string) {
  switch (priority) {
    case 'דחוף':
      return 'bg-red-500 text-white';
    case 'גבוהה':
      return 'bg-orange-400 text-white';
    case 'נמוכה':
      return 'bg-gray-200 text-gray-700';
    default:
      return 'bg-blue-100 text-blue-700';
  }
}

export function Studio() {
  const [requests, setRequests] = useState<StudioRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: '',
    brief: '',
    client_id: '',
    deadline: '',
    priority: 'רגילה',
    work_type: '',
    format_required: '',
  });
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
    fetchClients();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/studio/requests');
      if (res.data.success) {
        setRequests(res.data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching studio requests:', error);
      toast({ title: 'שגיאה', description: 'שגיאה בטעינת בקשות הסטודיו', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await apiClient.get('/api/clients');
      if (res.data.success) setClients(res.data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const resetForm = () => {
    setForm({ title: '', brief: '', client_id: '', deadline: '', priority: 'רגילה', work_type: '', format_required: '' });
    setSourceFiles([]);
    setUploadProgress(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast({ title: 'שגיאה', description: 'יש להזין כותרת', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const clientName = clients.find((c) => c.id === form.client_id)?.name || '';
      const res = await apiClient.post('/api/studio/requests', {
        ...form,
        client_id: form.client_id || null,
        client_name: clientName,
      });
      if (!res.data.success) throw new Error(res.data.error || 'שגיאה ביצירת הבקשה');

      const newId = res.data.request.id as string;

      // Upload source/raw-material files directly to R2 (if any)
      if (sourceFiles.length > 0) {
        for (const file of sourceFiles) {
          setUploadProgress(0);
          await uploadStudioFile(newId, file, 'source', (p) => setUploadProgress(p));
        }
        setUploadProgress(null);
      }

      toast({ title: 'הצלחה', description: 'הבקשה נשלחה לסטודיו', variant: 'success' });
      setAddOpen(false);
      resetForm();
      navigate(`/studio/${newId}`);
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error?.response?.data?.error || error?.message || 'שגיאה ביצירת הבקשה',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isOverdue = (req: StudioRequest) => {
    if (!req.deadline || req.status === 'הושלמה') return false;
    return new Date(req.deadline) < new Date(new Date().toDateString());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">טוען בקשות סטודיו...</div>
      </div>
    );
  }

  const columns = STATUSES.map((status) => ({
    status,
    items: requests.filter((r) => r.status === status),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#292f4c] flex items-center gap-2">
            <Palette className="w-7 h-7 text-[#043841]" />
            סטודיו
          </h1>
          <p className="text-sm text-gray-500 mt-1">ניהול בקשות העיצוב של המשרד</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="w-full md:w-auto">
          <Plus className="w-4 h-4 ml-2" />
          בקשת עיצוב חדשה
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            אין בקשות עיצוב עדיין. לחצו על "בקשת עיצוב חדשה" כדי להתחיל.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {columns.map((col) => (
            <div key={col.status} className="bg-gray-50 rounded-xl p-3 min-h-[120px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(col.status)}`}>
                  {col.status}
                </span>
                <span className="text-xs text-gray-400 font-medium">{col.items.length}</span>
              </div>
              <div className="space-y-3">
                {col.items.map((req) => (
                  <Card
                    key={req.id}
                    className="cursor-pointer hover:shadow-md transition-all"
                    onClick={() => navigate(`/studio/${req.id}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-[#292f4c] text-sm leading-tight">{req.title}</h3>
                        {req.priority && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${priorityColor(req.priority)}`}>
                            {req.priority}
                          </span>
                        )}
                      </div>
                      {req.client_name && (
                        <div className="text-xs text-gray-500 mb-1">לקוח: {req.client_name}</div>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-2">
                        {req.assigned_designer_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {req.assigned_designer_name}
                          </span>
                        )}
                        {req.deadline && (
                          <span className={`flex items-center gap-1 ${isOverdue(req) ? 'text-red-600 font-semibold' : ''}`}>
                            {isOverdue(req) ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {req.deadline}
                          </span>
                        )}
                        {((req.deliverables?.length || 0) + (req.source_files?.length || 0)) > 0 && (
                          <span className="flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            {(req.deliverables?.length || 0) + (req.source_files?.length || 0)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>בקשת עיצוב חדשה</DialogTitle>
            <DialogDescription>מלאו את פרטי הבקשה. היא תישלח למנהלת הסטודיו להקצאה.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>כותרת / שם המודעה *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="לדוגמה: מודעת דרושים למחלקת שיווק"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>בריף / תיאור</Label>
              <Textarea
                value={form.brief}
                onChange={(e) => setForm({ ...form, brief: e.target.value })}
                placeholder="פרטו מה צריך, טקסטים, קונספט, דגשים..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>לקוח (אופציונלי)</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- ללא לקוח --" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>דחיפות</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>סוג עבודה</Label>
                <Select value={form.work_type} onValueChange={(v) => setForm({ ...form, work_type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- בחר --" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>דדליין</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>מידות / פורמט נדרש</Label>
              <Input
                value={form.format_required}
                onChange={(e) => setForm({ ...form, format_required: e.target.value })}
                placeholder="לדוגמה: 1080x1080, PDF להדפסה, A4"
              />
            </div>
            <div className="space-y-2">
              <Label>חומר גלם (לוגו, טקסטים, תמונות)</Label>
              <Input
                type="file"
                multiple
                onChange={(e) => setSourceFiles(Array.from(e.target.files || []))}
              />
              {sourceFiles.length > 0 && (
                <div className="text-xs text-gray-500">{sourceFiles.length} קבצים נבחרו</div>
              )}
              {uploadProgress !== null && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-[#043841] h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setAddOpen(false); resetForm(); }}>
                ביטול
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'שולח...' : 'שליחה לסטודיו'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
