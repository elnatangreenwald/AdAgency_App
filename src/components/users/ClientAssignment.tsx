/**
 * Client Assignment Component
 * Allows assigning users to clients
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  assigned_user?: string | string[];
}

interface User {
  id: string;
  name: string;
}

interface ClientAssignmentProps {
  clients: Client[];
  users: User[];
  onSave: (clientId: string, userIds: string[]) => void;
}

export function ClientAssignment({ clients, users, onSave }: ClientAssignmentProps) {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      const assigned = Array.isArray(client.assigned_user)
        ? client.assigned_user
        : client.assigned_user
        ? [client.assigned_user]
        : [];
      setSelectedUsers(assigned);
    } else {
      setSelectedUsers([]);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSave = () => {
    if (selectedClient) {
      onSave(selectedClient, selectedUsers);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">שיוך משתמשים ללקוחות</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>בחר לקוח</Label>
          <Select value={selectedClient} onValueChange={handleClientChange}>
            <SelectTrigger>
              <SelectValue placeholder="בחר לקוח..." />
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

        {selectedClient && (
          <>
            <div className="space-y-2">
              <Label>בחר משתמשים מטפלים</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleUserToggle(user.id)}
                    />
                    <Label
                      htmlFor={`user-${user.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {user.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleSave}
              className="bg-[#3d817a] hover:bg-[#2d6159]"
            >
              <Save className="h-4 w-4 ml-1" />
              שמור שיוך
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
