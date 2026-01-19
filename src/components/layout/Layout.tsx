import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import ChatWidget from '@/components/ChatWidget';

export function Layout() {
  const { user, loading } = useAuth();
  const [sidebarUsers, setSidebarUsers] = useState<Record<string, { name: string }>>({});

  useEffect(() => {
    // Fetch sidebar users
    const fetchSidebarUsers = async () => {
      try {
        const response = await apiClient.get('/api/sidebar_users');
        if (response.data.success) {
          // Convert users list to dict format
          const usersDict: Record<string, { name: string }> = {};
          if (response.data.users_dict) {
            setSidebarUsers(response.data.users_dict);
          } else if (response.data.users) {
            // Fallback: convert list to dict
            response.data.users.forEach((u: { id: string; name: string }) => {
              usersDict[u.id] = { name: u.name };
            });
            setSidebarUsers(usersDict);
          }
        }
      } catch (error) {
        console.error('Error fetching sidebar users:', error);
      }
    };
    fetchSidebarUsers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] rtl" dir="rtl">
      <Sidebar currentUser={user || undefined} sidebarUsers={sidebarUsers} />
      <main className="pr-[260px] min-h-screen">
        <div className="p-10">
          <Outlet />
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}

