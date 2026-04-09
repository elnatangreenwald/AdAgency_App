import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Link2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface User {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
  assigned_user?: string | string[];
}

export function ClientAssignmentPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/client_assignment');
      if (response.data.success) {
        setUsers(response.data.users);
        setClients(response.data.clients);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת הנתונים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getClientAssignedUsers = (clientId: string): string[] => {
    const client = clients.find((c) => c.id === clientId);
    if (!client || !client.assigned_user) return [];
    return Array.isArray(client.assigned_user)
      ? client.assigned_user
      : [client.assigned_user];
  };

  useEffect(() => {
    if (selectedClient) {
      setSelectedUsers(getClientAssignedUsers(selectedClient));
    }
  }, [selectedClient, clients]);

  const handleAssignClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      toast({
        title: 'שגיאה',
        description: 'אנא בחר לקוח',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiClient.post('/api/client_assignment/assign', {
        client_id: selectedClient,
        user_ids: selectedUsers,
      });

      if (response.data.success) {
        toast({
          title: 'הצלחה',
          description: response.data.message || 'השיוך בוצע בהצלחה',
          variant: 'success',
        });
        fetchData();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בביצוע השיוך',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <LoadingSpinner text="טוען נתונים..." />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#292f4c]">
        שיוך לקוחות לעובדים
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Link2 className="w-5 h-5" />
                שיוך לקוח
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <form onSubmit={handleAssignClient} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>בחר לקוח:</Label>
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger>
                        <SelectValue placeholder="-- בחר לקוח --" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>שייך לעובדים (ניתן לבחור כמה):</Label>
                    <div className="border rounded-lg p-4 max-h-[200px] overflow-y-auto space-y-2">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2 space-x-reverse">
                          <Checkbox
                            id={`assign-user-${user.id}`}
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter((id) => id !== user.id));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`assign-user-${user.id}`}
                            className="cursor-pointer flex-1"
                          >
                            {user.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedClient && getClientAssignedUsers(selectedClient).length > 0 && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-600">
                        <strong>שויך כרגע ל:</strong>{' '}
                        {getClientAssignedUsers(selectedClient)
                          .map(
                            (uid) => users.find((u) => u.id === uid)?.name || uid
                          )
                          .join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'מבצע שיוך...' : 'בצע שיוך'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Current Assignments Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">סטטוס שיוכים</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="mb-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="חפש לקוח..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9"
                  />
                </div>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredClients.map((client) => {
                  const assigned = getClientAssignedUsers(client.id);
                  return (
                    <div
                      key={client.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedClient === client.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedClient(client.id)}
                    >
                      <div className="font-medium text-sm text-[#292f4c]">{client.name}</div>
                      {assigned.length > 0 ? (
                        <div className="text-xs text-gray-500 mt-1">
                          {assigned
                            .map((uid) => users.find((u) => u.id === uid)?.name || uid)
                            .join(', ')}
                        </div>
                      ) : (
                        <div className="text-xs text-orange-500 mt-1">לא משויך</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
