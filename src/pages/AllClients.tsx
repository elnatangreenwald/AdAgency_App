import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus } from 'lucide-react';

interface Client {
  id: string;
  name: string;
}

interface ClientsByUser {
  [userId: string]: Client[];
}

interface Users {
  [userId: string]: { name: string };
}

export function AllClients() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterUser = searchParams.get('user') || '';
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsByUser, setClientsByUser] = useState<ClientsByUser>({});
  const [users, setUsers] = useState<Users>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const userRole = user?.role || '';
  const isAdminOrManager = user?.id === 'admin' || ['מנהל', 'אדמין'].includes(userRole);

  useEffect(() => {
    fetchClients();
  }, [filterUser]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const url = filterUser ? `/api/all_clients?user=${filterUser}` : '/api/all_clients';
      const response = await apiClient.get(url);
      if (response.data.success) {
        setClients(response.data.clients);
        setClientsByUser(response.data.clients_by_user || {});
        setUsers(response.data.users || {});
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת הלקוחות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) {
      toast({
        title: 'שגיאה',
        description: 'אנא הזן שם לקוח',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', newClientName);

      const response = await apiClient.post('/add_client', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'הלקוח נוסף בהצלחה',
          variant: 'success',
        });
        setAddClientOpen(false);
        setNewClientName('');
        fetchClients();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בהוספת הלקוח',
        variant: 'destructive',
      });
    }
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClientsByUser: ClientsByUser = {};
  Object.keys(clientsByUser).forEach((userId) => {
    const userClients = clientsByUser[userId].filter((client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (userClients.length > 0) {
      filteredClientsByUser[userId] = userClients;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">טוען לקוחות...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#292f4c] m-0">לוח לקוחות המשרד</h1>
        <div className="flex gap-4 items-center">
          <div className="relative w-[300px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="חפש לקוח..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          {isAdminOrManager && (
            <Button
              onClick={() => setAddClientOpen(true)}
              className="bg-black hover:bg-gray-800 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 ml-2" />
              לקוח חדש
            </Button>
          )}
        </div>
      </div>

      {/* Clients List */}
      {filterUser ? (
        // Filtered by user
        filteredClients.length > 0 ? (
          <div>
            <div className="border-b-4 border-[#3d817a] text-[#3d817a] pb-2.5 mb-5 text-2xl font-bold">
              {users[filterUser]?.name || filterUser}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filteredClients.map((client) => (
                <Link
                  key={client.id}
                  to={`/client/${client.id}`}
                  className="bg-white p-6 rounded-2xl text-center font-bold text-gray-800 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-200 hover:border-[#0073ea] relative overflow-hidden group"
                >
                  <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-[#3d817a] to-[#2d6159] transform scale-y-0 group-hover:scale-y-100 transition-transform" />
                  {client.name}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              אין לקוחות להצגה
            </CardContent>
          </Card>
        )
      ) : (
        // All users view
        Object.keys(filteredClientsByUser).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(filteredClientsByUser).map(([userId, userClients]) => (
              <div key={userId}>
                <div className="border-b-4 border-[#3d817a] text-[#3d817a] pb-2.5 mb-5 text-2xl font-bold">
                  {users[userId]?.name || userId}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {userClients.map((client) => (
                    <Link
                      key={client.id}
                      to={`/client/${client.id}`}
                      className="bg-white p-6 rounded-2xl text-center font-bold text-gray-800 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-200 hover:border-[#0073ea] relative overflow-hidden group"
                    >
                      <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-[#3d817a] to-[#2d6159] transform scale-y-0 group-hover:scale-y-100 transition-transform" />
                      {client.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              אין לקוחות להצגה
            </CardContent>
          </Card>
        )
      )}

      {/* Add Client Modal */}
      <Dialog open={addClientOpen} onOpenChange={setAddClientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוספת לקוח חדש</DialogTitle>
            <DialogDescription>
              הזן את פרטי הלקוח החדש
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddClient} className="space-y-4">
            <div className="space-y-2">
              <Label>שם הלקוח:</Label>
              <Input
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="הזן שם לקוח..."
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddClientOpen(false)}
              >
                ביטול
              </Button>
              <Button type="submit">הוסף לקוח</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
