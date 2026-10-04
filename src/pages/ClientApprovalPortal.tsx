import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { PublicApproval } from '@/types';
import { ApprovalItemView, PublicShell } from '@/components/approvals/ApprovalItemView';
import { approvalStatusColor, compareHebrew } from '@/components/approvals/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

type Filter = 'pending' | 'all';

export function ClientApprovalPortal() {
  const { token } = useParams<{ token: string }>();
  const [client, setClient] = useState<{ name: string; logo_url?: string | null } | null>(null);
  const [items, setItems] = useState<PublicApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('pending');
  const [openId, setOpenId] = useState<string | null>(null);
  const [respondedIds, setRespondedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get(`/api/public/approval-portal/${token}`);
        if (res.data?.success) {
          setClient(res.data.client);
          const loaded: PublicApproval[] = res.data.items || [];
          setItems(loaded);
          if (!loaded.some((i) => i.can_respond)) setFilter('all');
        } else {
          setError(res.data?.error || 'הקישור אינו תקף');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'הקישור אינו תקף');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const pendingCount = items.filter((i) => i.can_respond).length;

  const groups = useMemo(() => {
    const visible =
      filter === 'pending' ? items.filter((i) => i.can_respond || respondedIds.has(i.id || '')) : items;
    const byProject = new Map<string, PublicApproval[]>();
    for (const item of visible) {
      const key = item.project_name || 'כללי';
      byProject.set(key, [...(byProject.get(key) || []), item]);
    }
    return [...byProject.entries()].sort(([a], [b]) => compareHebrew(a, b));
  }, [items, filter, respondedIds]);

  const updateItem = (updated: PublicApproval) => {
    if (updated.id) setRespondedIds((prev) => new Set(prev).add(updated.id as string));
    setItems((prev) => prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)));
  };

  if (loading) {
    return <PublicShell><p className="text-center text-gray-600 py-16">טוען חומרים...</p></PublicShell>;
  }

  if (error || !client) {
    return (
      <PublicShell>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-6 rounded-xl text-center">
          {error || 'הקישור אינו תקף'}
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <section className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
        {client.logo_url && (
          <img src={client.logo_url} alt={client.name} className="w-14 h-14 object-contain rounded-lg border border-gray-100" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-[#292f4c]">{client.name}</h1>
          <p className="text-sm text-gray-500">
            {pendingCount > 0 ? `${pendingCount} פריטים ממתינים לאישורכם` : 'אין פריטים שממתינים לאישור כרגע'}
          </p>
        </div>
      </section>

      <div className="flex gap-2">
        {([['pending', `ממתין לאישור (${pendingCount})`], ['all', `הכל (${items.length})`]] as [Filter, string][]).map(
          ([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === key ? 'bg-[#043841] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">אין פריטים להצגה</div>
      ) : (
        groups.map(([project, projectItems]) => (
          <section key={project} className="space-y-3">
            <h2 className="font-bold text-[#292f4c] text-lg">{project}</h2>
            {projectItems.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : item.id || null)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-right hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[#292f4c] truncate">{item.title}</div>
                      {item.version && (
                        <div className="text-xs text-gray-400">
                          גרסה {item.version.number} · {item.version.files.length} קבצים
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${approvalStatusColor(item.status)}`}>
                        {item.can_respond ? 'ממתין לאישורכם' : item.status === 'טיוטה' ? 'בעדכון' : item.status}
                      </span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="bg-[#f5f6f8] p-3 sm:p-4">
                      <ApprovalItemView
                        item={item}
                        respondUrl={`/api/public/approval-portal/${token}/items/${item.id}/respond`}
                        onUpdated={updateItem}
                        showClientName={false}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        ))
      )}
    </PublicShell>
  );
}
