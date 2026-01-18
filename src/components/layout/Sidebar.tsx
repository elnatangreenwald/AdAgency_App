import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  CreditCard, 
  Calendar, 
  MapPin, 
  FileText, 
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Archive,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  currentUser?: {
    id: string;
    name: string;
  };
  sidebarUsers?: Record<string, { name: string }>;
}

export function Sidebar({ currentUser, sidebarUsers }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1',location:'Sidebar.tsx:handleLogout',message:'logout button clicked',data:{currentUserId:currentUser?.id || null,path:location.pathname},timestamp:Date.now()})}).catch(()=>{});
    // #endregion agent log
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/', icon: Home, label: 'דשבורד' },
    { 
      path: '/all_clients', 
      icon: Users, 
      label: 'לוח לקוחות',
      hasDropdown: true,
      dropdownItems: sidebarUsers ? Object.entries(sidebarUsers).map(([uid, info]) => ({
        path: `/all_clients?user=${uid}`,
        label: info.name
      })) : []
    },
    { path: '/finance', icon: CreditCard, label: 'כספים' },
    { path: '/events', icon: Calendar, label: 'אירועים' },
    { path: '/suppliers', icon: MapPin, label: 'ספקים' },
    { path: '/quotes', icon: FileText, label: 'הצעות מחיר' },
    { path: '/forms', icon: ClipboardList, label: 'טפסים' },
    { path: '/time_tracking', icon: Clock, label: 'דוחות שעות עבודה' },
    { path: '/admin/dashboard', icon: BarChart3, label: 'דוח מנהלים' },
  ];

  const adminItems = currentUser?.id === 'admin' ? [
    { path: '/admin/users', icon: Settings, label: 'ניהול צוות' },
    { path: '/archive', icon: Archive, label: 'ארכיון' },
  ] : [];

  return (
    <div className="fixed top-0 right-0 w-[260px] h-screen bg-[#043841] text-white flex flex-col z-[1000] shadow-lg overflow-y-auto">
      {/* Decorative line on left side (RTL) */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#FEFAE0] z-[1]" />
      
      {/* Logo */}
      <Link to="/" className="p-5 bg-transparent text-center flex items-center justify-center transition-all relative z-[2] hover:opacity-90">
        <img 
          src="/static/Vatkin_Logo.jpg" 
          alt="Vatkin Logo" 
          className="max-w-[150px] h-auto transition-transform rounded-lg shadow-md bg-white p-2 hover:scale-105 hover:shadow-lg"
        />
      </Link>

      {/* Navigation Links */}
      <nav className="flex-1 px-0 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          if (item.hasDropdown && item.dropdownItems) {
            return (
              <div key={item.path} className="nav-item">
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3.5 text-[#cdd1e4] no-underline transition-all hover:bg-white/10 hover:text-white whitespace-nowrap",
                    active && "bg-white/10 text-white border-r-2 border-white"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium flex-shrink-0">{item.label}</span>
                </Link>
                {item.dropdownItems.length > 0 && (
                  <div className="users-dropdown pr-6">
                    {item.dropdownItems.map((dropdownItem) => (
                      <Link
                        key={dropdownItem.path}
                        to={dropdownItem.path}
                        className="block py-1.5 text-sm text-[#cdd1e4] hover:text-white transition-colors"
                      >
                        • {dropdownItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-6 py-3.5 text-[#cdd1e4] no-underline transition-all hover:bg-white/10 hover:text-white whitespace-nowrap",
                active && "bg-white/10 text-white border-r-2 border-white"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium flex-shrink-0">{item.label}</span>
            </Link>
          );
        })}

        {adminItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-6 py-3.5 text-[#cdd1e4] no-underline transition-all hover:bg-white/10 hover:text-white whitespace-nowrap",
                active && "bg-white/10 text-white border-r-2 border-white"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium flex-shrink-0">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Area */}
      {currentUser && (
        <div className="border-t border-white/20 p-4 mt-auto">
          <div className="text-sm font-semibold mb-2">{currentUser.name}</div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 text-[#cdd1e4] hover:text-white transition-colors text-sm whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="flex-shrink-0">התנתק</span>
          </button>
        </div>
      )}
    </div>
  );
}

