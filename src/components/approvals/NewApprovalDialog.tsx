import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { apiClient, uploadApprovalFile } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ProjectSelect } from './ProjectSelect';
import { sortByName } from './utils';

interface NewApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (approvalId: string) => void;
  /** When set, the client is fixed (e.g. opened from the client's page). */
  fixedClientId?: string;
}

const emptyForm = { client_id: '', title: '', project_name: '', description: '' };

export function NewApprovalDialog({ open, onOpenChange, onCreated, fixedClientId }: NewApprovalDialogProps) {
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [form, setForm] = useState({ ...emptyForm, client_id: fixedClientId || '' });
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadLabel, setUploadLabel] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || fixedClientId) return;
    apiClient
      .get('/api/clients')
      .then((res) => res.data.success && setClients(sortByName(res.data.clients || [])))
      .catch(() => {});
  }, [open, fixedClientId]);

  useEffect(() => {
    if (open) setForm((f) => ({ ...f, client_id: fixedClientId || f.client_id }));
  }, [open, fixedClientId]);

  useEffect(() => {
    setProjectOptions([]);
    if (!form.client_id) return;
    apiClient
      .get(`/api/approvals/clients/${form.client_id}/projects`)
      .then((res) => res.data.success && setProjectOptions(res.data.project_options || []))
      .catch(() => {});
  }, [form.client_id]);

  const reset = () => {
    setForm({ ...emptyForm, client_id: fixedClientId || '' });
    setFiles([]);
    setUploadProgress(null);
    setUploadLabel('');
  };

  const close = () => {
    onOpenChange(false);
    reset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id || !form.title.trim() || !form.project_name) {
      toast({ title: 'שגיאה', description: 'יש למלא לקוח, כותרת ופרויקט', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    let createdId: string | null = null;
    try {
      const res = await apiClient.post('/api/approvals', form);
      if (!res.data.success) throw new Error(res.data.error || 'שגיאה ביצירת הבקשה');
      createdId = res.data.approval.id as string;

      for (let i = 0; i < files.length; i++) {
        setUploadLabel(`מעלה קובץ ${i + 1} מתוך ${files.length}: ${files[i].name}`);
        setUploadProgress(0);
        await uploadApprovalFile(createdId, files[i], (p) => setUploadProgress(p));
      }

      toast({ title: 'נוצר', description: 'הבקשה נוצרה. בדקו את הקבצים ושלחו ללקוח.', variant: 'success' });
      close();
      onCreated(createdId);
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error?.response?.data?.error || error?.message || 'שגיאה ביצירת הבקשה',
        variant: 'destructive',
      });
      if (createdId) {
        close();
        onCreated(createdId);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>בקשת אישור חדשה</DialogTitle>
          <DialogDescription>
            הבקשה תיווצר כטיוטה. אחרי העלאת הקבצים שולחים אותה ללקוח, והיא תופיע בעמוד הלקוח המשותף.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!fixedClientId && (
            <div className="space-y-2">
              <Label>לקוח *</Label>
              <Select
                value={form.client_id}
                onValueChange={(v) => setForm({ ...form, client_id: v, project_name: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- בחר לקוח --" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>כותרת *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="לדוגמה: באנרים לטיקטוק"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>שם פרויקט *</Label>
            <ProjectSelect
              clientId={form.client_id}
              options={projectOptions}
              value={form.project_name}
              onChange={(v) => setForm({ ...form, project_name: v })}
              onOptionsChange={setProjectOptions}
            />
          </div>
          <div className="space-y-2">
            <Label>תיאור / הנחיות ללקוח</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="מה הלקוח צריך לבדוק ולאשר?"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>קבצים לאישור</Label>
            <Input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            {files.length > 0 && uploadProgress === null && (
              <div className="text-xs text-gray-500">{files.length} קבצים נבחרו</div>
            )}
            {uploadProgress !== null && (
              <div className="space-y-1">
                <div className="text-xs text-gray-500 truncate">{uploadLabel}</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-[#043841] h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={submitting}>
              ביטול
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'יוצר...' : 'יצירת בקשה'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
