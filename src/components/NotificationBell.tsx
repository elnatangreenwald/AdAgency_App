import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Notification } from '@/types';
import { useToast } from '@/hooks/use-toast';

const API_BASE = '';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [lastChecked, setLastChecked] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/notifications/unread-count`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.count);
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Fetch new notifications (for toast alerts)
  const fetchNewNotifications = useCallback(async () => {
    try {
      const url = lastChecked 
        ? `${API_BASE}/api/notifications/new?since=${encodeURIComponent(lastChecked)}`
        : `${API_BASE}/api/notifications/new`;
      
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.notifications && data.notifications.length > 0) {
          // Show toast for each new notification
          data.notifications.forEach((notification: Notification) => {
            toast({
              title: 'משימה חדשה הוקצתה לך',
              description: notification.message,
              variant: 'default',
              duration: 5000,
            });
          });
          
          // Update last checked time
          if (data.notifications.length > 0) {
            setLastChecked(data.notifications[0].created_at);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching new notifications:', error);
    }
  }, [lastChecked, toast]);

  // Fetch all notifications for dropdown
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/notifications?limit=20`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  // Mark notifications as read
  const markAsRead = async (notificationIds?: string[]) => {
    try {
      const response = await fetch(`${API_BASE}/api/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(
          notificationIds 
            ? { notification_ids: notificationIds }
            : { mark_all: true }
        ),
      });
      
      if (response.ok) {
        // Update local state
        if (notificationIds) {
          setNotifications(prev => 
            prev.map(n => 
              notificationIds.includes(n.id) ? { ...n, read: true } : n
            )
          );
          setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
        } else {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          setUnreadCount(0);
        }
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Navigate to task
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead([notification.id]);
    }
    
    // Navigate to client page with the task
    if (notification.client_id) {
      navigate(`/client/${notification.client_id}`);
    }
    
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
    setLastChecked(new Date().toISOString());
  }, [fetchUnreadCount]);

  // Polling for unread count and new notifications (every 15 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchNewNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount, fetchNewNotifications]);

  // Fetch full notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'עכשיו';
    if (diffMins < 60) return `לפני ${diffMins} דקות`;
    if (diffHours < 24) return `לפני ${diffHours} שעות`;
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    return date.toLocaleDateString('he-IL');
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
        aria-label="התראות"
      >
        <Bell className="w-5 h-5 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[400px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-800">התראות</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAsRead()}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  title="סמן הכל כנקרא"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>אין התראות</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors",
                    !notification.read && "bg-blue-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                      notification.read ? "bg-gray-300" : "bg-blue-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm text-gray-800",
                        !notification.read && "font-medium"
                      )}>
                        {notification.message}
                      </p>
                      {notification.client_name && (
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.client_name}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.read && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead([notification.id]);
                        }}
                        className="text-gray-400 hover:text-blue-600 p-1"
                        title="סמן כנקרא"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
