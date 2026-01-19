import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import ChatWidget from '@/components/ChatWidget';
import { Menu, X } from 'lucide-react';

export function Layout() {
  const { user, loading } = useAuth();
  const [sidebarUsers, setSidebarUsers] = useState<Record<string, { name: string }>>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
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
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 right-0 left-0 h-16 bg-[#043841] z-[1001] flex items-center justify-between px-4 shadow-lg">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <img 
          src="/static/Vatkin_Logo.jpg" 
          alt="Vatkin Logo" 
          className="h-10 rounded-lg bg-white p-1"
        />
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-[999]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, shown when menu open */}
      <div className={`
        fixed top-0 right-0 h-screen z-[1000] transition-transform duration-300
        lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar 
          currentUser={user || undefined} 
          sidebarUsers={sidebarUsers} 
          onNavClick={() => setIsMobileMenuOpen(false)}
        />
      </div>

      {/* Main Content */}
      <main className="min-h-screen pt-16 lg:pt-0 lg:pr-[260px]">
        <div className="p-4 sm:p-6 lg:p-10">
          <Outlet />
        </div>
      </main>

      <ChatWidget />
    </div>
  );
}
