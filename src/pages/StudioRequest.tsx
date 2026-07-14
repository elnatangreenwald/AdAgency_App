import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient, uploadStudioFile } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { StudioRequest, StudioFile } from '@/types';
import { statusColor, priorityColor } from './Studio';
import {
  ArrowRight,
  Download,
  Trash2,
  Upload,
  FileText,
  User,
  Clock,
  Send,
  Image as ImageIcon,
} from 'lucide-react';

const STATUSES = ['חדשה', 'הוקצתה', 'בעבודה', 'ממתינה לאישור', 'תיקונים', 'הושלמה'];

function formatSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function StudioRequestPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [req, setReq] = useState<StudioRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [designers, setDesigners] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDesigner, setSelectedDesigner] = useState('');
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState(0);

  const fetchRequest = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/api/studio/requests/${requestId}`);
      if (res.data.success) {
        setReq(res.data.request);
        setCanManage(res.data.can_manage);
        setSelectedDesigner(res.data.request.assigned_designer || '');
      } else {
        toast({ title: 'שגיאה', description: res.data.error || 'הבקשה לא נמצאה', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error?.response?.data?.error || 'שגיאה בטעינת הבקשה',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [requestId, toast]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  useEffect(() => {
    if (canManage) {
      apiClient.get('/api/studio/designers').then((res) => {
        if (res.data.success) setDesigners(res.data.designers || []);
      }).catch(() => {});
    }
  }, [canManage]);

  const changeStatus = async (status: string) => {
    try {
      const res = await apiClient.patch(`/api/studio/requests/${requestId}`, { status });
      if (res.data.success) {
        setReq(res.data.request);
        toast({ title: 'עודכן', description: `הסטטוס עודכן ל"${status}"`, variant: 'success' });
      }
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error?.response?.data?.error || 'שגיאה בעדכון סטטוס', variant: 'destructive' });
    }
  };

  const assignDesigner = async () => {
    if (!selectedDesigner) return;
    try {
      const res = await apiClient.post(`/api/studio/requests/${requestId}/assign`, { designer_id: selectedDesigner });
      if (res.data.success) {
        setReq(res.data.request);
        toast({ title: 'הוקצה', description: 'המעצבת קיבלה התראה', variant: 'success' });
      }
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error?.response?.data?.error || 'שגיאה בהקצאה', variant: 'destructive' });
    }
  };

  const handleUpload = async (files: FileList | null, kind: 'source' | 'deliverable') => {
    if (!files || files.length === 0 || !requestId) return;
    setUploading(kind);
    try {
      for (const file of Array.from(files)) {
        setUploadPct(0);
        await uploadStudioFile(requestId, file, kind, (p) => setUploadPct(p));
      }
      toast({ title: 'הועלה', description: 'הקובץ הועלה בהצלחה', variant: 'success' });
      await fetchRequest();
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error?.response?.data?.error || error?.message || 'שגיאה בהעלאת הקובץ',
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
      setUploadPct(0);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm('למחוק את הקובץ?')) return;
    try {
      const res = await apiClient.delete(`/api/studio/requests/${requestId}/files/${fileId}`);
      if (res.data.success) {
        await fetchRequest();
      }
    } catch (error: any) {
      toast({ title: 'שגיאה', description: 'שגיאה במחיקת הקובץ', variant: 'destructive' });
    }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    try {
      const res = await apiClient.post(`/api/studio/requests/${requestId}/comments`, { text: comment });
      if (res.data.success) {
        setComment('');
        await fetchRequest();
      }
    } catch (error: any) {
      toast({ title: 'שגיאה', description: 'שגיאה בהוספת הערה', variant: 'destructive' });
    }
  };

  const deleteRequest = async () => {
    if (!confirm('למחוק את הבקשה כולה? פעולה זו אינה הפיכה.')) return;
    try {
      const res = await apiClient.delete(`/api/studio/requests/${requestId}`);
      if (res.data.success) {
        toast({ title: 'נמחק', description: 'הבקשה נמחקה', variant: 'success' });
        navigate('/studio');
      }
    } catch (error: any) {
      toast({ title: 'שגיאה', description: error?.response?.data?.error || 'שגיאה במחיקה', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">טוען בקשה...</div>
      </div>
    );
  }

  if (!req) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate('/studio')}>
          <ArrowRight className="w-4 h-4 ml-1" /> חזרה לסטודיו
        </Button>
        <Card><CardContent className="p-8 text-center text-gray-500">הבקשה לא נמצאה</CardContent></Card>
      </div>
    );
  }

  const renderFileList = (files: StudioFile[] | undefined, kind: 'source' | 'deliverable') => {
    if (!files || files.length === 0) {
      return <div className="text-sm text-gray-400 py-2">אין קבצים</div>;
    }
    return (
      <div className="space-y-2">
        {files.map((f) => (
          <div key={f.id} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 min-w-0">
              {kind === 'deliverable' ? <ImageIcon className="w-4 h-4 text-[#043841] flex-shrink-0" /> : <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{f.original_name}</div>
                <div className="text-xs text-gray-400">
                  {formatSize(f.size)} {f.uploaded_by_name ? `· ${f.uploaded_by_name}` : ''}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <a
                href={`/api/studio/requests/${requestId}/files/${f.id}/download`}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-gray-500 hover:text-[#043841]"
                title="הורדה"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => deleteFile(f.id)}
                className="p-2 text-gray-400 hover:text-red-600"
                title="מחיקה"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={() => navigate('/studio')}>
          <ArrowRight className="w-4 h-4 ml-1" /> חזרה
        </Button>
        <Button variant="outline" onClick={deleteRequest} className="text-red-600 hover:text-red-700">
          <Trash2 className="w-4 h-4 ml-1" /> מחיקת בקשה
        </Button>
      </div>

      {/* Header */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row justify-between items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(req.status)}`}>{req.status}</span>
                {req.priority && (
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${priorityColor(req.priority)}`}>{req.priority}</span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-[#292f4c]">{req.title}</h1>
              {req.client_name && <div className="text-sm text-gray-600 mt-1">לקוח: {req.client_name}</div>}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div>
              <div className="text-gray-400 text-xs">נפתח ע"י</div>
              <div className="font-medium flex items-center gap-1"><User className="w-3 h-3" />{req.created_by_name || '-'}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs">מעצבת</div>
              <div className="font-medium">{req.assigned_designer_name || 'טרם הוקצתה'}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs">דדליין</div>
              <div className="font-medium flex items-center gap-1"><Clock className="w-3 h-3" />{req.deadline || '-'}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs">סוג / פורמט</div>
              <div className="font-medium">{[req.work_type, req.format_required].filter(Boolean).join(' · ') || '-'}</div>
            </div>
          </div>

          {req.brief && (
            <div className="mt-4">
              <div className="text-gray-400 text-xs mb-1">בריף</div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{req.brief}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions: status + assign */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-bold text-[#292f4c]">ניהול הבקשה</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>סטטוס</Label>
              <Select value={req.status} onValueChange={changeStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {canManage && (
              <div className="space-y-2">
                <Label>הקצאת מעצבת</Label>
                <div className="flex gap-2">
                  <Select value={selectedDesigner} onValueChange={setSelectedDesigner}>
                    <SelectTrigger><SelectValue placeholder="-- בחר מעצבת --" /></SelectTrigger>
                    <SelectContent>
                      {designers.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={assignDesigner} disabled={!selectedDesigner}>הקצה</Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Files */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[#292f4c]">חומר גלם</h2>
              <label className="cursor-pointer text-sm text-[#043841] hover:underline flex items-center gap-1">
                <Upload className="w-4 h-4" /> הוספה
                <input type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files, 'source')} />
              </label>
            </div>
            {uploading === 'source' && (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div className="bg-[#043841] h-2 rounded-full transition-all" style={{ width: `${uploadPct}%` }} />
              </div>
            )}
            {renderFileList(req.source_files, 'source')}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[#292f4c]">קבצים מוגמרים</h2>
              <label className="cursor-pointer text-sm text-[#043841] hover:underline flex items-center gap-1">
                <Upload className="w-4 h-4" /> העלאה
                <input type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files, 'deliverable')} />
              </label>
            </div>
            {uploading === 'deliverable' && (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div className="bg-[#043841] h-2 rounded-full transition-all" style={{ width: `${uploadPct}%` }} />
              </div>
            )}
            {renderFileList(req.deliverables, 'deliverable')}
          </CardContent>
        </Card>
      </div>

      {/* Comments */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-bold text-[#292f4c] mb-3">הערות ותקשורת</h2>
          <div className="space-y-3 mb-4">
            {(req.comments && req.comments.length > 0) ? (
              req.comments.map((c) => (
                <div key={c.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-[#292f4c]">{c.by_name}</span>
                    <span className="text-xs text-gray-400">{c.at ? new Date(c.at).toLocaleString('he-IL') : ''}</span>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{c.text}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-400">אין הערות עדיין</div>
            )}
          </div>
          <div className="flex gap-2">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="הוסיפו הערה, בקשת תיקון או עדכון..."
              rows={2}
              className="flex-1"
            />
            <Button type="button" onClick={addComment} disabled={!comment.trim()} className="self-end">
              <Send className="w-4 h-4 ml-1" /> שליחה
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
