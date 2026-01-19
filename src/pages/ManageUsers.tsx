import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Trash2, RotateCcw, Save } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email?: string;
  role: string;
}

interface Client {
  id: string;
  name: string;
  assigned_user?: string | string[];
}

interface Permission {
  route: string;
  required_role: string;
}

interface Page {
  route: string;
  name: string;
}

export function ManageUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [permissions, setPermissions] = useState<Record<string, string>>({});
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [userForm, setUserForm] = useState({
    username: '',
    name: '',
    email: '',
    email_password: '',
    password: '',
    role: 'עובד',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser?.id !== 'admin') {
      toast({
        title: 'גישה חסומה',
        description: 'רק אדמין יכול לגשת לדף זה',
        variant: 'destructive',
      });
      return;
    }
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/admin/users');
      if (response.data.success) {
        setUsers(response.data.users);
        setClients(response.data.clients);
        setPermissions(response.data.permissions || {});
        setPages(response.data.pages || []);
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

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('action', 'add_user');
      formData.append('username', userForm.username);
      formData.append('name', userForm.name);
      formData.append('email', userForm.email);
      formData.append('email_password', userForm.email_password);
      formData.append('password', userForm.password);
      formData.append('role', userForm.role);

      const response = await apiClient.post('/admin/users', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'המשתמש נוסף בהצלחה',
          variant: 'success',
        });
        setAddUserOpen(false);
        setUserForm({
          username: '',
          name: '',
          email: '',
          email_password: '',
          password: '',
          role: 'עובד',
        });
        fetchData();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בהוספת המשתמש',
        variant: 'destructive',
      });
    }
  };

  const handleAssignClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || selectedUsers.length === 0) {
      toast({
        title: 'שגיאה',
        description: 'אנא בחר לקוח ועובדים',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('action', 'assign');
      formData.append('client_id', selectedClient);
      selectedUsers.forEach((uid) => {
        formData.append('user_ids', uid);
      });

      const response = await apiClient.post('/admin/users', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'השיוך בוצע בהצלחה',
          variant: 'success',
        });
        setSelectedClient('');
        setSelectedUsers([]);
        fetchData();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בביצוע השיוך',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateEmail = async (userId: string, email: string) => {
    try {
      const formData = new FormData();
      formData.append('action', 'update_email');
      formData.append('user_id', userId);
      formData.append('email', email);

      const response = await apiClient.post('/admin/users', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'המייל עודכן בהצלחה',
          variant: 'success',
        });
        fetchData();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בעדכון המייל',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateEmailPassword = async (userId: string, emailPassword: string) => {
    try {
      const formData = new FormData();
      formData.append('action', 'update_email_password');
      formData.append('user_id', userId);
      formData.append('email_password', emailPassword);

      const response = await apiClient.post('/admin/users', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'סיסמת המייל עודכנה בהצלחה',
          variant: 'success',
        });
        fetchData();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בעדכון סיסמת המייל',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      const formData = new FormData();
      formData.append('action', 'update_role');
      formData.append('user_id', userId);
      formData.append('role', role);

      const response = await apiClient.post('/admin/users', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'התפקיד עודכן בהצלחה',
          variant: 'success',
        });
        fetchData();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בעדכון התפקיד',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) {
      toast({
        title: 'שגיאה',
        description: 'אנא הזן סיסמה חדשה',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('action', 'reset_password');
      formData.append('user_id', selectedUser.id);
      formData.append('new_password', newPassword);

      const response = await apiClient.post('/admin/users', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'הסיסמה אופסה בהצלחה',
          variant: 'success',
        });
        setResetPasswordOpen(false);
        setSelectedUser(null);
        setNewPassword('');
        fetchData();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה באיפוס הסיסמה',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const formData = new FormData();
      formData.append('action', 'delete_user');
      formData.append('user_id', selectedUser.id);

      const response = await apiClient.post('/admin/users', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'המשתמש נמחק בהצלחה',
          variant: 'success',
        });
        setDeleteUserOpen(false);
        setSelectedUser(null);
        fetchData();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה במחיקת המשתמש',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePermission = async (route: string, requiredRole: string) => {
    try {
      const formData = new FormData();
      formData.append('action', 'update_permission');
      formData.append('route', route);
      formData.append('required_role', requiredRole);

      const response = await apiClient.post('/admin/users', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'ההרשאה עודכנה בהצלחה',
          variant: 'success',
        });
        setPermissions({ ...permissions, [route]: requiredRole });
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בעדכון ההרשאה',
        variant: 'destructive',
      });
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

  if (currentUser?.id !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-600">גישה חסומה - רק אדמין יכול לגשת לדף זה</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">טוען נתונים...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#292f4c]">ניהול צוות והקצאות</h1>

      {/* Add User */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">+ הוספת עובד חדש</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>שם מלא:</Label>
                <Input
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="שם מלא"
                  required
                />
              </div>
              <div>
                <Label>מייל:</Label>
                <Input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="מייל"
                  required
                />
              </div>
              <div>
                <Label>סיסמת מייל:</Label>
                <Input
                  type="password"
                  value={userForm.email_password}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email_password: e.target.value })
                  }
                  placeholder="סיסמת מייל"
                  required
                />
              </div>
              <div>
                <Label>שם משתמש:</Label>
                <Input
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="שם משתמש"
                  required
                />
              </div>
              <div>
                <Label>סיסמה למערכת:</Label>
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="סיסמה"
                  required
                />
              </div>
              <div>
                <Label>תפקיד:</Label>
                <Select
                  value={userForm.role}
                  onValueChange={(value) => setUserForm({ ...userForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="עובד">עובד</SelectItem>
                    <SelectItem value="מנהל">מנהל</SelectItem>
                    <SelectItem value="אדמין">אדמין</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="bg-black hover:bg-gray-800">
              <Plus className="w-4 h-4 ml-2" />
              צור משתמש
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Assign Client */}
      <Card>
        <CardHeader>
          <CardTitle>🔗 שיוך לקוח</CardTitle>
        </CardHeader>
        <CardContent>
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
                  {users
                    .filter((u) => u.id !== 'admin')
                    .map((user) => (
                      <div key={user.id} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={`user-${user.id}`}
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
                          htmlFor={`user-${user.id}`}
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
            <Button type="submit">בצע שיוך</Button>
          </form>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>רשימת עובדים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="p-3 text-right font-bold">שם</th>
                  <th className="p-3 text-right font-bold">מייל</th>
                  <th className="p-3 text-right font-bold">סיסמת מייל</th>
                  <th className="p-3 text-right font-bold">שם משתמש</th>
                  <th className="p-3 text-right font-bold">תפקיד</th>
                  <th className="p-3 text-center font-bold">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-bold text-[#292f4c]">{user.name}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="email"
                          defaultValue={user.email || ''}
                          placeholder="אין מייל"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateEmail(user.id, (e.target as HTMLInputElement).value);
                            }
                          }}
                          className="w-[200px]"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            const input = document.querySelector(
                              `input[defaultValue="${user.email || ''}"]`
                            ) as HTMLInputElement;
                            if (input) {
                              handleUpdateEmail(user.id, input.value);
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="password"
                          placeholder="סיסמת מייל"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateEmailPassword(
                                user.id,
                                (e.target as HTMLInputElement).value
                              );
                            }
                          }}
                          className="w-[180px]"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            const input = document.querySelector(
                              `input[placeholder="סיסמת מייל"]`
                            ) as HTMLInputElement;
                            if (input) {
                              handleUpdateEmailPassword(user.id, input.value);
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Save className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-3 text-gray-500 font-mono text-sm">{user.id}</td>
                    <td className="p-3">
                      {user.id === 'admin' ? (
                        <span className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold">
                          אדמין
                        </span>
                      ) : (
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleUpdateRole(user.id, value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="עובד">עובד</SelectItem>
                            <SelectItem value="מנהל">מנהל</SelectItem>
                            <SelectItem value="אדמין">אדמין</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {user.id !== 'admin' && (
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setResetPasswordOpen(true);
                            }}
                            className="bg-yellow-100 hover:bg-yellow-200"
                          >
                            <RotateCcw className="w-3 h-3 ml-1" />
                            איפוס סיסמה
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteUserOpen(true);
                            }}
                            className="bg-red-100 hover:bg-red-200"
                          >
                            <Trash2 className="w-3 h-3 ml-1" />
                            מחק
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>🔐 הרשאות דפים</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            הגדר איזה תפקיד נדרש לגשת לכל דף במערכת
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="p-3 text-right font-bold">דף</th>
                  <th className="p-3 text-right font-bold">Route</th>
                  <th className="p-3 text-right font-bold">הרשאה נדרשת</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.route} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-bold text-[#292f4c]">{page.name}</td>
                    <td className="p-3 text-gray-500 font-mono text-sm">{page.route}</td>
                    <td className="p-3">
                      <Select
                        value={permissions[page.route] || 'עובד'}
                        onValueChange={(value) => handleUpdatePermission(page.route, value)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="עובד">עובד (כולם)</SelectItem>
                          <SelectItem value="מנהל">מנהל (מנהל+אדמין)</SelectItem>
                          <SelectItem value="אדמין">אדמין (רק אדמין)</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Reset Password Modal */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              איפוס סיסמה - {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>
              הזן סיסמה חדשה למשתמש
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>סיסמה חדשה:</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="הזן סיסמה חדשה"
                required
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetPasswordOpen(false)}>
                ביטול
              </Button>
              <Button onClick={handleResetPassword} className="bg-yellow-600 hover:bg-yellow-700">
                אישור איפוס
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog open={deleteUserOpen} onOpenChange={setDeleteUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחיקת משתמש</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק את המשתמש {selectedUser?.name}?
              פעולה זו לא ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              מחק
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
