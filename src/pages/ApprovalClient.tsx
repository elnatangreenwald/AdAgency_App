import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { MaterialApproval } from '@/types';
import { NewApprovalDialog } from '@/components/approvals/NewApprovalDialog';
import { FileThumb } from '@/components/approvals/FilePreview';
import {
  APPROVAL_STATUSES,
  approvalStatusColor,
  compareHebrew,
  copyToClipboard,
} from '@/components/approvals/utils';
import { ArrowRight, Clock, Copy, ExternalLink, Paperclip, Plus } from 'lucide-react';

const ALL = '__all__';

export function ApprovalClient() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [client, setClient] = useState<{ id: string; name: string; logo_url?: string | null } | null>(null);
  const [portalUrl, setPortalUrl] = useState('');
  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [approvals, setApprovals] = useState<MaterialApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/approvals/clients/${clientId}`);
      if (res.data.success) {
        setClient(res.data.client);
        setPortalUrl(res.data.portal_url);
        setProjectOptions(res.data.project_options || []);
        setApprovals(res.data.approvals || []);
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error?.response?.data?.error || 'שגיאה בטעינת הלקוח',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [clientId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(portalUrl);
    toast({
      title: ok ? 'הועתק' : 'שגיאה',
      description: ok ? 'הקישור לעמוד הלקוח הועתק' : 'לא ניתן להעתיק את הקישור',
      variant: ok ? 'success' : 'destructive',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">טוען...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate('/approvals')}>
          <ArrowRight className="w-4 h-4 ml-1" /> חזרה לאישור חומרים
        </Button>
        <Card><CardContent className="p-8 text-center text-gray-500">הלקוח לא נמצא</CardContent></Card>
      </div>
    );
  }

  const usedProjects = [...new Set(approvals.map((a) => a.project_name || '').filter(Boolean))].sort(compareHebrew);
  const visible = approvals.filter(
    (a) =>
      (projectFilter === ALL || a.project_name === projectFilter) &&
      (statusFilter === ALL || a.status === statusFilter)
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Button variant="outline" onClick={() => navigate('/approvals')}>
        <ArrowRight className="w-4 h-4 ml-1" /> חזרה
      </Button>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              {client.logo_url && (
                <img src={client.logo_url} alt={client.name} className="w-14 h-14 object-contain rounded-lg border border-gray-100" />
              )}
              <div>
                <h1 className="text-2xl font-bold text-[#292f4c]">{client.name}</h1>
                <p className="text-sm text-gray-500">
                  {approvals.length} פריטים · {projectOptions.length} פרויקטים ברשימה
                </p>
              </div>
            </div>
            <Button onClick={() => setAddOpen(true)} className="w-full md:w-auto">
              <Plus className="w-4 h-4 ml-2" /> בקשת אישור חדשה
            </Button>
          </div>

          <div className="space-y-2">
            <Label>קישור לעמוד הלקוח (לשיתוף עם הלקוח)</Label>
            <div className="flex gap-2">
              <Input value={portalUrl} readOnly dir="ltr" className="text-xs" onFocus={(e) => e.target.select()} />
              <Button type="button" variant="outline" onClick={handleCopy}>
                <Copy className="w-4 h-4 ml-1" /> העתקה
              </Button>
              <a
                href={portalUrl.replace(/^https?:\/\/[^/]+/, '')}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-3 rounded-md border border-gray-200 hover:bg-gray-50"
                title="פתיחת העמוד כפי שהלקוח רואה אותו"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-gray-500">הלקוח רואה בעמוד הזה את כל הפריטים שנשלחו אליו, ויכול לאשר או לבקש תיקונים.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="כל הפרויקטים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>כל הפרויקטים</SelectItem>
            {usedProjects.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="כל הסטטוסים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>כל הסטטוסים</SelectItem>
            {APPROVAL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            {approvals.length === 0 ? 'אין עדיין פריטים ללקוח זה.' : 'אין פריטים התואמים לסינון.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((a) => (
            <Card
              key={a.id}
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate(`/approvals/${a.id}`)}
            >
              <CardContent className="p-4">
                {a.project_name && (
                  <div className="text-xs font-semibold text-[#043841] mb-1">{a.project_name}</div>
                )}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-[#292f4c] leading-tight">{a.title}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0 ${approvalStatusColor(a.status)}`}>
                    {a.status}
                  </span>
                </div>
                {a.preview_files && a.preview_files.length > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    {a.preview_files.map((f) => (
                      <FileThumb key={f.id} url={f.url} contentType={f.content_type} name={f.name} />
                    ))}
                    {(a.files_count || 0) > a.preview_files.length && (
                      <span className="text-xs font-semibold text-gray-500">+{(a.files_count || 0) - a.preview_files.length}</span>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-3">
                  {a.current_version && <span>גרסה {a.current_version}</span>}
                  <span className="flex items-center gap-1">
                    <Paperclip className="w-3 h-3" />
                    {a.files_count || 0}
                  </span>
                  {a.updated_at && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(a.updated_at).toLocaleDateString('he-IL')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NewApprovalDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        fixedClientId={client.id}
        onCreated={(id) => navigate(`/approvals/${id}`)}
      />
    </div>
  );
}
