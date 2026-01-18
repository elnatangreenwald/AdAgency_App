import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Archive as ArchiveIcon } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  archived_at?: string;
}

export function Archive() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchArchivedClients();
  }, []);

  const fetchArchivedClients = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/archive');
      if (response.data.success) {
        setClients(response.data.clients);
      }
    } catch (error) {
      console.error('Error fetching archived clients:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת לקוחות מאוישים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">טוען לקוחות מאוישים...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
        <CardContent className="p-6">
          <h1 className="text-3xl font-bold text-gray-600 mb-2">ארכיון לקוחות</h1>
          <p className="text-gray-500 text-sm">
            לקוחות שהועברו לארכיון - לא מוצגים בדפים הרגילים
          </p>
        </CardContent>
      </Card>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <ArchiveIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              אין לקוחות מאוישים
            </h2>
            <p className="text-gray-500">
              הארכיון ריק - כל הלקוחות פעילים
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {clients.map((client) => (
            <Link
              key={client.id}
              to={`/client/${client.id}`}
              className="bg-white p-6 rounded-2xl text-center font-bold text-gray-800 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-200 hover:border-gray-400 relative overflow-hidden group opacity-80 hover:opacity-100"
            >
              <div className="absolute right-0 top-0 w-1 h-full bg-gray-400 transform scale-y-0 group-hover:scale-y-100 transition-transform" />
              <div>{client.name}</div>
              {client.archived_at && (
                <div className="text-xs text-gray-500 mt-2 font-normal">
                  {formatDate(client.archived_at)}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
