/**
 * חיווי מדידת זמן בדשבורד – מציג מדידה פעילה או "אין מדידה"
 * מוצג בפינה השמאלית העליונה של הדשבורד.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface ActiveSession {
  client_id: string;
  client_name: string;
  project_id: string;
  project_title: string;
  task_id: string;
  task_title: string;
  start_time: string;
  elapsed_seconds?: number;
}

export function TimeTrackingIndicator() {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();

  const fetchActive = async () => {
    try {
      const res = await apiClient.get('/api/time_tracking/active');
      if (res.data.success && res.data.active_session) {
        const s = res.data.active_session;
        setSession(s);
        setElapsed(s.elapsed_seconds ?? 0);
      } else {
        setSession(null);
        setElapsed(0);
      }
    } catch {
      // אל תנקה מדידה בשגיאה – רק כשמקבלים במפורש אין מדידה
      // מונע "אין מדידה" כשבפועל יש מדידה (למשל timeout/רשת)
    }
  };

  useEffect(() => {
    fetchActive();
    const t = setInterval(fetchActive, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onFocus = () => fetchActive();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail?.active_session;
      if (d) {
        setSession(d);
        setElapsed(d.elapsed_seconds ?? 0);
      }
    };
    window.addEventListener('time-tracking:active-session', handler);
    return () => window.removeEventListener('time-tracking:active-session', handler);
  }, []);

  useEffect(() => {
    if (!session) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [session]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!session) {
    return (
      <div
        className="flex items-center gap-2 text-sm text-gray-500"
        aria-label="אין מדידת זמן פעילה"
      >
        <Clock className="w-4 h-4 text-gray-400" />
        <span>אין מדידה פעילה</span>
      </div>
    );
  }

  const label = `${session.client_name} › ${session.project_title} › ${session.task_title}`;

  return (
    <button
      type="button"
      onClick={() => navigate(`/client/${session.client_id}`)}
      className="flex items-center gap-2 text-right rounded-lg px-3 py-2 bg-[#e8f5f3] border border-[#3d817a]/30 hover:bg-[#d4edeb] transition-colors group"
      aria-label={`מדידה פעילה: ${label}`}
    >
      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      <Clock className="w-4 h-4 text-[#3d817a]" />
      <div className="flex flex-col items-end">
        <span className="text-xs text-gray-600 font-medium max-w-[200px] truncate block" title={label}>
          {label}
        </span>
        <span className="font-mono text-sm font-bold text-[#292f4c]">{formatTime(elapsed)}</span>
      </div>
    </button>
  );
}
