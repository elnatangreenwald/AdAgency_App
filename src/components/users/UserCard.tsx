/**
 * User Card Component
 * Displays a single user with actions
 */
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, RotateCcw, Mail, User } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface UserCardProps {
  user: {
    id: string;
    name: string;
    email?: string;
    role: string;
  };
  onResetPassword: (user: { id: string; name: string }) => void;
  onDelete: (user: { id: string; name: string }) => void;
  isCurrentUser: boolean;
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'אדמין':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'מנהל':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function UserCard({ user, onResetPassword, onDelete, isCurrentUser }: UserCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3d817a] text-white rounded-full flex items-center justify-center font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="font-medium flex items-center gap-2">
                {user.name}
                {isCurrentUser && (
                  <span className="text-xs text-gray-500">(אתה)</span>
                )}
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <User className="h-3 w-3" />
                {user.id}
              </div>
              {user.email && (
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs px-2 py-1 rounded-full border ${getRoleColor(user.role)}`}>
              {user.role}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onResetPassword(user)}
                className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                title="איפוס סיסמה"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              {!isCurrentUser && user.id !== 'admin' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(user)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  title="מחק משתמש"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
