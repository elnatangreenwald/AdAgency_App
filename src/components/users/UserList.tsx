/**
 * User List Component
 * Displays a list of users with search
 */
import { useState } from 'react';
import { UserCard } from './UserCard';
import { SearchBar } from '@/components/shared/SearchBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { Users } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email?: string;
  role: string;
}

interface UserListProps {
  users: User[];
  currentUserId: string;
  onResetPassword: (user: { id: string; name: string }) => void;
  onDelete: (user: { id: string; name: string }) => void;
}

export function UserList({ users, currentUserId, onResetPassword, onDelete }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="חפש משתמש..."
        className="max-w-md"
      />

      {filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onResetPassword={onResetPassword}
              onDelete={onDelete}
              isCurrentUser={user.id === currentUserId}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="לא נמצאו משתמשים"
          description={searchTerm ? 'נסה לחפש במילים אחרות' : 'עדיין אין משתמשים במערכת'}
        />
      )}
    </div>
  );
}
