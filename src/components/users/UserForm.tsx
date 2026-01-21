/**
 * User Form Component
 * Form for adding/editing users
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

interface UserFormData {
  username: string;
  name: string;
  email: string;
  email_password: string;
  password: string;
  role: string;
}

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData) => void;
  initialData?: Partial<UserFormData>;
  isEdit?: boolean;
}

const roles = ['עובד', 'מנהל', 'אדמין'];

export function UserForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEdit = false,
}: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    username: initialData?.username || '',
    name: initialData?.name || '',
    email: initialData?.email || '',
    email_password: initialData?.email_password || '',
    password: '',
    role: initialData?.role || 'עובד',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      username: '',
      name: '',
      email: '',
      email_password: '',
      password: '',
      role: 'עובד',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'עריכת משתמש' : 'הוספת משתמש חדש'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'ערוך את פרטי המשתמש' : 'מלא את הפרטים להוספת משתמש חדש'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">שם משתמש</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="שם משתמש להתחברות"
              required
              disabled={isEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">שם מלא</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="שם מלא"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_password">סיסמת אימייל (App Password)</Label>
            <Input
              id="email_password"
              type="password"
              value={formData.email_password}
              onChange={(e) => setFormData({ ...formData, email_password: e.target.value })}
              placeholder="סיסמת אפליקציה לשליחת מיילים"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {isEdit ? 'סיסמה חדשה (השאר ריק לשמירת הקיימת)' : 'סיסמה'}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="סיסמה"
              required={!isEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">תפקיד</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר תפקיד" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              ביטול
            </Button>
            <Button type="submit" className="bg-[#3d817a] hover:bg-[#2d6159]">
              <Plus className="h-4 w-4 ml-1" />
              {isEdit ? 'שמור שינויים' : 'הוסף משתמש'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
