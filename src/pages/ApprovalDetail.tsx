import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { apiClient, uploadApprovalFile } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ApprovalFile, ApprovalStatus, ApprovalVersion, MaterialApproval } from '@/types';
import {
  APPROVAL_STATUSES,
  APPROVAL_STATUS_DESCRIPTIONS,
  ST_APPROVED,
  ST_COMMENT,
  ST_DRAFT,
  ST_WAITING,
  approvalStatusColor,
  copyToClipboard,
  formatFileSize,
} from '@/components/approvals/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProjectSelect } from '@/components/approvals/ProjectSelect';
import { FileThumb, FileViewerDialog } from '@/components/approvals/FilePreview';
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  AlertCircle,
  Pencil,
  Plus,
  Send,
  Trash2,
  Upload,
  User,
} from 'lucide-react';

export function ApprovalDetail() {
  const { approvalId } = useParams<{ approvalId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [approval, setApproval] = useState<MaterialApproval | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [versionToDelete, setVersionToDelete] = useState<number | null>(null);
  const [versionOpen, setVersionOpen] = useState(false);
  const [versionNote, setVersionNote] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', project_name: '' });
  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [manualStatus, setManualStatus] = useState<ApprovalStatus | null>(null);
  const [manualComment, setManualComment] = useState('');
  const [viewerFile, setViewerFile] = useState<React.ComponentProps<typeof FileViewerDialog>['file']>(null);

  const fetchApproval = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/approvals/${approvalId}`);
      if (res.data.success) setApproval(res.data.approval);
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error?.response?.data?.error || 'שגיאה בטעינת הבקשה',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [approvalId, toast]);

  useEffect(() => {
    fetchApproval();
  }, [fetchApproval]);

  const showError = (error: any, fallback: string) =>
    toast({
      title: 'שגיאה',
      description: error?.response?.data?.error || error?.message || fallback,
      variant: 'destructive',
    });

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !approvalId) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        setUploadPct(0);
        await uploadApprovalFile(approvalId, file, (p) => setUploadPct(p));
      }
      toast({ title: 'הועלה', description: 'הקבצים הועלו בהצלחה', variant: 'success' });
      await fetchApproval();
    } catch (error: any) {
      showError(error, 'שגיאה בהעלאת הקובץ');
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  };

  const changeStatus = async (status: ApprovalStatus, comment?: string) => {
    setBusy(true);
    try {
      const res = await apiClient.patch(`/api/approvals/${approvalId}`, { status, comment });
      if (res.data.success) {
        setApproval(res.data.approval);
        setManualStatus(null);
        setManualComment('');
        toast({ title: 'הסטטוס עודכן', description: `${status}: ${APPROVAL_STATUS_DESCRIPTIONS[status]}`, variant: 'success' });
      }
    } catch (error: any) {
      showError(error, 'שגיאה בעדכון הסטטוס');
    } finally {
      setBusy(false);
    }
  };

  const handleStatusSelect = (status: string) => {
    const s = status as ApprovalStatus;
    if (s === ST_APPROVED || s === ST_COMMENT) {
      setManualComment('');
      setManualStatus(s);
    } else {
      changeStatus(s);
    }
  };

  const createVersion = async () => {
    setBusy(true);
    try {
      const res = await apiClient.post(`/api/approvals/${approvalId}/versions`, { note: versionNote });
      if (res.data.success) {
        setApproval(res.data.approval);
        setVersionOpen(false);
        setVersionNote('');
        toast({ title: 'נפתחה גרסה חדשה', description: 'העלו את הקבצים המתוקנים ושלחו ללקוח', variant: 'success' });
      }
    } catch (error: any) {
      showError(error, 'שגיאה בפתיחת גרסה חדשה');
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    setBusy(true);
    try {
      const { project_name, ...fields } = editForm;
      const res = await apiClient.patch(`/api/approvals/${approvalId}`, project_name ? editForm : fields);
      if (res.data.success) {
        setApproval(res.data.approval);
        setEditOpen(false);
      }
    } catch (error: any) {
      showError(error, 'שגיאה בשמירה');
    } finally {
      setBusy(false);
    }
  };

  const deleteFile = async () => {
    if (!fileToDelete) return;
    try {
      await apiClient.delete(`/api/approvals/${approvalId}/files/${fileToDelete}`);
      await fetchApproval();
    } catch (error: any) {
      showError(error, 'שגיאה במחיקת הקובץ');
    } finally {
      setFileToDelete(null);
    }
  };

  const deleteVersion = async () => {
    if (versionToDelete === null) return;
    try {
      const res = await apiClient.delete(`/api/approvals/${approvalId}/versions/${versionToDelete}`);
      if (res.data.success) setApproval(res.data.approval);
    } catch (error: any) {
      showError(error, 'שגיאה במחיקת הגרסה');
    } finally {
      setVersionToDelete(null);
    }
  };

  const deleteApproval = async () => {
    try {
      const res = await apiClient.delete(`/api/approvals/${approvalId}`);
      if (res.data.success) {
        toast({ title: 'נמחק', description: 'הבקשה נמחקה', variant: 'success' });
        navigate(approval?.client_id ? `/approvals/client/${approval.client_id}` : '/approvals');
      }
    } catch (error: any) {
      showError(error, 'שגיאה במחיקה');
    }
  };

  const handleCopyLink = async () => {
    if (!approval?.public_url) return;
    const ok = await copyToClipboard(approval.public_url);
    toast({
      title: ok ? 'הועתק' : 'שגיאה',
      description: ok ? 'הקישור ללקוח הועתק' : 'לא ניתן להעתיק את הקישור',
      variant: ok ? 'success' : 'destructive',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">טוען בקשה...</div>
      </div>
    );
  }

  if (!approval) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate('/approvals')}>
          <ArrowRight className="w-4 h-4 ml-1" /> חזרה לאישור חומרים
        </Button>
        <Card><CardContent className="p-8 text-center text-gray-500">הבקשה לא נמצאה</CardContent></Card>
      </div>
    );
  }

  const versions = approval.versions || [];
  const current = versions[versions.length - 1];
  const isEditable = !!current && !current.response && approval.status !== ST_WAITING;
  const hasFiles = (current?.files?.length || 0) > 0;
  const canNewVersion = !!current && (!!current.response || !!current.sent_at);

  const renderFile = (f: ApprovalFile, editable: boolean) => {
    const viewUrl = `/api/approvals/${approval.id}/files/${f.id}/download?inline=1`;
    const openViewer = () =>
      setViewerFile({
        url: viewUrl,
        downloadUrl: `/api/approvals/${approval.id}/files/${f.id}/download`,
        contentType: f.content_type,
        name: f.original_name,
      });
    return (
      <div key={f.id} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={openViewer} title="צפייה">
            <FileThumb url={viewUrl} contentType={f.content_type} name={f.original_name} className="w-14 h-14" />
          </button>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{f.original_name}</div>
            <div className="text-xs text-gray-400">
              {formatFileSize(f.size)} {f.uploaded_by_name ? `· ${f.uploaded_by_name}` : ''}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button type="button" onClick={openViewer} className="p-2 text-gray-500 hover:text-[#043841]" title="צפייה">
            <Eye className="w-4 h-4" />
          </button>
          <a
            href={`/api/approvals/${approval.id}/files/${f.id}/download`}
            target="_blank"
            rel="noreferrer"
            className="p-2 text-gray-500 hover:text-[#043841]"
            title="הורדה"
          >
            <Download className="w-4 h-4" />
          </a>
          {editable && (
            <button
              type="button"
              onClick={() => setFileToDelete(f.id)}
              className="p-2 text-gray-400 hover:text-red-600"
              title="מחיקה"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderResponse = (v: ApprovalVersion) => {
    if (!v.response) {
      return v.sent_at ? (
        <div className="text-xs text-gray-500">נשלח ב-{new Date(v.sent_at).toLocaleString('he-IL')} · ממתין לתגובת הלקוח</div>
      ) : (
        <div className="text-xs text-gray-500">טרם נשלח ללקוח</div>
      );
    }
    const approved = v.response.decision === 'approve';
    return (
      <div className={`rounded-lg p-3 text-sm ${approved ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`}>
        <div className="flex items-center gap-2 font-semibold mb-1">
          {approved ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {approved ? ST_APPROVED : ST_COMMENT} · {v.response.name}
          <span className="text-xs font-normal opacity-70">{new Date(v.response.at).toLocaleString('he-IL')}</span>
        </div>
        {v.response.comment && <div className="whitespace-pre-wrap">{v.response.comment}</div>}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(approval.client_id ? `/approvals/client/${approval.client_id}` : '/approvals')}
        >
          <ArrowRight className="w-4 h-4 ml-1" /> חזרה
        </Button>
        <Button variant="outline" onClick={() => setDeleteOpen(true)} className="text-red-600 hover:text-red-700">
          <Trash2 className="w-4 h-4 ml-1" /> מחיקת בקשה
        </Button>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${approvalStatusColor(approval.status)}`}>
                {approval.status}
              </span>
              <h1 className="text-2xl font-bold text-[#292f4c] flex items-center gap-2">
                {approval.title}
                <button
                  type="button"
                  onClick={() => {
                    setEditForm({
                      title: approval.title,
                      description: approval.description || '',
                      project_name: approval.project_name || '',
                    });
                    if (approval.client_id) {
                      apiClient
                        .get(`/api/approvals/clients/${approval.client_id}/projects`)
                        .then((res) => res.data.success && setProjectOptions(res.data.project_options || []))
                        .catch(() => {});
                    }
                    setEditOpen(true);
                  }}
                  className="p-1 text-gray-400 hover:text-[#043841]"
                  title="עריכה"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </h1>
              <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {approval.client_name && <span>לקוח: {approval.client_name}</span>}
                {approval.project_name && <span>פרויקט: {approval.project_name}</span>}
                {approval.created_by_name && (
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{approval.created_by_name}</span>
                )}
              </div>
            </div>
          </div>

          {approval.description && (
            <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{approval.description}</div>
          )}

          <div className="space-y-2">
            <Label>קישור ללקוח</Label>
            <div className="flex gap-2">
              <Input value={approval.public_url || ''} readOnly dir="ltr" className="text-xs" onFocus={(e) => e.target.select()} />
              <Button type="button" variant="outline" onClick={handleCopyLink}>
                <Copy className="w-4 h-4 ml-1" /> העתקה
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="font-bold text-[#292f4c]">סטטוס</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Select value={approval.status} onValueChange={handleStatusSelect} disabled={busy}>
              <SelectTrigger className="sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPROVAL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500">{APPROVAL_STATUS_DESCRIPTIONS[approval.status]}</span>
          </div>
          {approval.status === ST_DRAFT && !hasFiles && (
            <p className="text-xs text-amber-700">
              כדי להעביר ל"{ST_WAITING}" צריך קודם להעלות לפחות קובץ אחד לגרסה הנוכחית.
            </p>
          )}
          {approval.status === ST_DRAFT && hasFiles && isEditable && (
            <Button type="button" size="sm" onClick={() => changeStatus(ST_WAITING)} disabled={busy || uploading}>
              <Send className="w-4 h-4 ml-1" /> שליחה ללקוח
            </Button>
          )}
        </CardContent>
      </Card>

      {current && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-bold text-[#292f4c]">גרסה נוכחית: {current.number}</h2>
              <div className="flex flex-wrap gap-2">
                {isEditable && (
                  <label className="inline-flex items-center gap-1 cursor-pointer text-sm px-3 h-9 rounded-md border border-gray-200 hover:bg-gray-50">
                    <Upload className="w-4 h-4" /> העלאת קבצים
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => { handleUpload(e.target.files); e.target.value = ''; }}
                    />
                  </label>
                )}
                {canNewVersion && (
                  <Button type="button" size="sm" variant="outline" onClick={() => setVersionOpen(true)}>
                    <Plus className="w-4 h-4 ml-1" /> גרסה חדשה
                  </Button>
                )}
              </div>
            </div>
            {current.note && <div className="text-sm text-gray-600">הערת גרסה: {current.note}</div>}
            {uploading && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[#043841] h-2 rounded-full transition-all" style={{ width: `${uploadPct}%` }} />
              </div>
            )}
            {current.files.length > 0 ? (
              <div className="space-y-2">{current.files.map((f) => renderFile(f, isEditable))}</div>
            ) : (
              <div className="text-sm text-gray-400">אין קבצים בגרסה זו עדיין</div>
            )}
            {renderResponse(current)}
          </CardContent>
        </Card>
      )}

      {versions.length > 1 && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="font-bold text-[#292f4c]">גרסאות קודמות</h2>
            {versions.slice(0, -1).reverse().map((v) => (
              <div key={v.number} className="border border-gray-100 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">גרסה {v.number}</span>
                  <div className="flex items-center gap-2">
                    {v.created_at && (
                      <span className="text-xs text-gray-400">{new Date(v.created_at).toLocaleDateString('he-IL')}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setVersionToDelete(v.number)}
                      className="p-1.5 text-gray-400 hover:text-red-600"
                      title="מחיקת גרסה"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {v.note && <div className="text-xs text-gray-600">{v.note}</div>}
                <div className="space-y-2">{v.files.map((f) => renderFile(f, false))}</div>
                {renderResponse(v)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <FileViewerDialog file={viewerFile} onClose={() => setViewerFile(null)} />

      <Dialog open={!!manualStatus} onOpenChange={(o) => !o && setManualStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>עדכון ידני: {manualStatus}</DialogTitle>
            <DialogDescription>
              לשימוש כשהלקוח {manualStatus === ST_APPROVED ? 'אישר' : 'העיר'} מחוץ למערכת (טלפון, וואטסאפ, מייל).
              העדכון יירשם על גרסה {current?.number}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>{manualStatus === ST_COMMENT ? 'הערת הלקוח *' : 'הערה (אופציונלי)'}</Label>
            <Textarea value={manualComment} onChange={(e) => setManualComment(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualStatus(null)}>ביטול</Button>
            <Button
              onClick={() => manualStatus && changeStatus(manualStatus, manualComment)}
              disabled={busy || (manualStatus === ST_COMMENT && !manualComment.trim())}
            >
              עדכון
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={versionOpen} onOpenChange={setVersionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>פתיחת גרסה חדשה</DialogTitle>
            <DialogDescription>
              גרסה {(current?.number || 0) + 1} תיפתח כטיוטה. מעלים אליה את הקבצים המתוקנים ושולחים שוב ללקוח, באותו קישור.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>מה השתנה? (יוצג ללקוח)</Label>
            <Textarea value={versionNote} onChange={(e) => setVersionNote(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVersionOpen(false)}>ביטול</Button>
            <Button onClick={createVersion} disabled={busy}>פתיחת גרסה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>עריכת פרטי הבקשה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>כותרת</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            {approval.client_id && (
              <div className="space-y-2">
                <Label>שם פרויקט</Label>
                <ProjectSelect
                  clientId={approval.client_id}
                  options={projectOptions}
                  value={editForm.project_name}
                  onChange={(v) => setEditForm({ ...editForm, project_name: v })}
                  onOptionsChange={setProjectOptions}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>תיאור / הנחיות ללקוח</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>ביטול</Button>
            <Button onClick={saveEdit} disabled={busy || !editForm.title.trim()}>שמירה</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={deleteApproval}
        title="מחיקת בקשת אישור"
        description="הבקשה, כל הגרסאות והקבצים יימחקו והקישור ללקוח יפסיק לעבוד. פעולה זו אינה הפיכה."
        confirmText="מחיקה"
      />
      <ConfirmDialog
        open={!!fileToDelete}
        onOpenChange={(o) => !o && setFileToDelete(null)}
        onConfirm={deleteFile}
        title="מחיקת קובץ"
        description="למחוק את הקובץ מהגרסה?"
        confirmText="מחיקה"
      />
      <ConfirmDialog
        open={versionToDelete !== null}
        onOpenChange={(o) => !o && setVersionToDelete(null)}
        onConfirm={deleteVersion}
        title={`מחיקת גרסה ${versionToDelete ?? ''}`}
        description="הגרסה, הקבצים שלה והתגובה של הלקוח עליה יימחקו. פעולה זו אינה הפיכה."
        confirmText="מחיקה"
      />
    </div>
  );
}
