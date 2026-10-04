import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ApprovalClientSummary } from '@/types';
import { NewApprovalDialog } from '@/components/approvals/NewApprovalDialog';
import { APPROVAL_STATUSES, approvalStatusColor, compareHebrew } from '@/components/approvals/utils';
import { Plus, FileCheck, Search } from 'lucide-react';

export function Approvals() {
  const [clients, setClients] = useState<ApprovalClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/api/approvals/clients');
        if (res.data.success) {
          const list: ApprovalClientSummary[] = res.data.clients || [];
          setClients([...list].sort((a, b) => compareHebrew(a.client_name, b.client_name)));
        }
      } catch (error) {
        console.error('Error fetching approval clients:', error);
        toast({ title: 'שגיאה', description: 'שגיאה בטעינת הלקוחות', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const visible = clients.filter((c) => c.client_name.toLowerCase().includes(search.trim().toLowerCase()));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">טוען...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#292f4c] flex items-center gap-2">
            <FileCheck className="w-7 h-7 text-[#043841]" />
            אישור חומרים
          </h1>
          <p className="text-sm text-gray-500 mt-1">לקוחות עם חומרים לאישור. לכל לקוח עמוד שאפשר לשתף איתו.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="w-full md:w-auto">
          <Plus className="w-4 h-4 ml-2" />
          בקשת אישור חדשה
        </Button>
      </div>

      {clients.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש לקוח" className="pr-9" />
        </div>
      )}

      {visible.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            {clients.length === 0
              ? 'אין עדיין חומרים לאישור. לחצו על "בקשת אישור חדשה" כדי להתחיל.'
              : 'לא נמצאו לקוחות'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {visible.map((c) => (
            <Card
              key={c.client_id}
              className="cursor-pointer hover:shadow-md transition-all aspect-square"
              onClick={() => navigate(`/approvals/client/${c.client_id}`)}
            >
              <CardContent className="p-4 h-full flex flex-col items-center justify-center text-center gap-2">
                {c.logo_url ? (
                  <img src={c.logo_url} alt={c.client_name} className="w-16 h-16 object-contain" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#043841]/10 text-[#043841] flex items-center justify-center text-2xl font-bold">
                    {c.client_name.trim().charAt(0)}
                  </div>
                )}
                <div className="font-bold text-[#292f4c] leading-tight line-clamp-2">{c.client_name}</div>
                <div className="text-xs text-gray-500">{c.total} פריטים</div>
                <div className="flex flex-wrap justify-center gap-1">
                  {APPROVAL_STATUSES.filter((s) => c.counts[s] > 0).map((s) => (
                    <span key={s} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${approvalStatusColor(s)}`}>
                      {s} {c.counts[s]}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NewApprovalDialog open={addOpen} onOpenChange={setAddOpen} onCreated={(id) => navigate(`/approvals/${id}`)} />
    </div>
  );
}
