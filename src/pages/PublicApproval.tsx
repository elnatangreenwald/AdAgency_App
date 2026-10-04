import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/lib/api';
import { PublicApproval as PublicApprovalData } from '@/types';
import { ApprovalItemView, PublicShell } from '@/components/approvals/ApprovalItemView';

export function PublicApproval() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicApprovalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get(`/api/public/approvals/${token}`);
        if (res.data?.success) setData(res.data.approval);
        else setError(res.data?.error || 'הקישור אינו תקף');
      } catch (err: any) {
        setError(err.response?.data?.error || 'הקישור אינו תקף');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) {
    return <PublicShell><p className="text-center text-gray-600 py-16">טוען חומרים...</p></PublicShell>;
  }

  if (error || !data) {
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
      <ApprovalItemView item={data} respondUrl={`/api/public/approvals/${token}/respond`} onUpdated={setData} />
    </PublicShell>
  );
}
