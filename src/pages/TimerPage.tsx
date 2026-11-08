/**
 * Timer Page
 * עמוד מדידת זמן ידידותי: בחירת לקוח (פרויקט/משימה אופציונליים) ושעון גדול להתחלה ועצירה
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { Client, Project } from '@/types';
import { Play, Square, Timer, AlertCircle, X } from 'lucide-react';

const NONE = '__none__';

interface ActiveSession {
  id: string;
  client_id: string;
  project_id?: string | null;
  task_id?: string | null;
  start_time: string;
  elapsed_seconds?: number;
  client_name?: string;
  project_title?: string;
  task_title?: string;
}

interface TimeEntry {
  id: string;
  user_id: string;
  client_name?: string;
  project_title?: string;
  task_title?: string;
  start_time: string;
  duration_hours: number;
  note?: string;
  date: string;
}

const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const sessionLabel = (s: Pick<ActiveSession, 'client_name' | 'project_title' | 'task_title'>) =>
  [s.client_name, s.project_title, s.task_title].filter(Boolean).join(' › ');

const localDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function TimerPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientId, setClientId] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(NONE);
  const [taskId, setTaskId] = useState(NONE);

  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [conflictSession, setConflictSession] = useState<ActiveSession | null>(null);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);

  const notifyIndicator = (session: ActiveSession | null) => {
    window.dispatchEvent(
      new CustomEvent('time-tracking:active-session', { detail: { active_session: session } })
    );
  };

  const fetchClients = async () => {
    try {
      const res = await apiClient.get('/api/clients');
      if (res.data.success) setClients(res.data.clients || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchProjects = async (id: string) => {
    try {
      const res = await apiClient.get(`/api/client/${id}`);
      setProjects(res.data.success ? res.data.client?.projects || [] : []);
    } catch (err) {
      console.error('Error fetching client projects:', err);
      setProjects([]);
    }
  };

  const fetchActive = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/time_tracking/active');
      if (!res.data.success) return;
      const s: ActiveSession | null = res.data.active_session;
      setActiveSession(s);
      if (s) {
        setElapsed(s.elapsed_seconds ?? 0);
        setClientId(s.client_id);
        setClientSearch(s.client_name || '');
        setProjectId(s.project_id || NONE);
        setTaskId(s.task_id || NONE);
      }
    } catch (err) {
      console.error('Error checking active session:', err);
    }
  }, []);

  const fetchTodayEntries = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    const month = localDateKey(now).slice(0, 7);
    try {
      const res = await apiClient.get('/api/time_tracking/entries', {
        params: { month, user_id: user.id },
      });
      if (res.data.success) {
        const today = localDateKey(now);
        setTodayEntries(
          (res.data.entries || []).filter(
            (e: TimeEntry) => localDateKey(new Date(e.start_time)) === today
          )
        );
      }
    } catch (err) {
      console.error('Error fetching entries:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchClients();
    fetchActive();
  }, [fetchActive]);

  useEffect(() => {
    fetchTodayEntries();
  }, [fetchTodayEntries]);

  useEffect(() => {
    const onFocus = () => fetchActive();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchActive]);

  useEffect(() => {
    if (clientId) fetchProjects(clientId);
    else setProjects([]);
  }, [clientId]);

  useEffect(() => {
    if (!activeSession?.start_time) return;
    const start = new Date(activeSession.start_time).getTime();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [activeSession]);

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    return q ? clients.filter((c) => c.name.toLowerCase().includes(q)) : clients;
  }, [clients, clientSearch]);

  const selectedProject = projects.find((p) => p.id === projectId);
  const tasks = (selectedProject?.tasks || []).filter((t) => t.status !== 'הושלם');

  const selectClient = (client: Client) => {
    setClientId(client.id);
    setClientSearch(client.name);
    setShowClientDropdown(false);
    setProjectId(NONE);
    setTaskId(NONE);
  };

  const clearClient = () => {
    setClientId('');
    setClientSearch('');
    setProjectId(NONE);
    setTaskId(NONE);
  };

  const startPayload = () => ({
    client_id: clientId,
    project_id: projectId !== NONE ? projectId : undefined,
    task_id: projectId !== NONE && taskId !== NONE ? taskId : undefined,
  });

  const onStarted = (session: ActiveSession) => {
    const client = clients.find((c) => c.id === session.client_id);
    const enriched: ActiveSession = {
      ...session,
      client_name: client?.name,
      project_title: selectedProject?.title || selectedProject?.name || '',
      task_title: tasks.find((t) => t.id === session.task_id)?.title || '',
    };
    setActiveSession(enriched);
    setElapsed(0);
    setNote('');
    notifyIndicator({ ...enriched, elapsed_seconds: 0 });
  };

  const handleStart = async () => {
    if (!clientId) {
      toast({ title: 'יש לבחור לקוח', description: 'בחר לקוח כדי להתחיל מדידה', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/api/time_tracking/start', startPayload());
      if (res.data.success) {
        onStarted(res.data.session);
        toast({ title: 'מדידת זמן התחילה', description: 'המדידה פעילה כעת', variant: 'success' });
      }
    } catch (error: any) {
      const data = error.response?.data;
      if (error.response?.status === 400 && data?.active_session) {
        setConflictSession(data.active_session);
      } else {
        toast({ title: 'שגיאה', description: data?.error || 'שגיאה בהתחלת מדידת זמן', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post('/api/time_tracking/stop', { note });
      if (res.data.success) {
        setActiveSession(null);
        setElapsed(0);
        setNote('');
        notifyIndicator(null);
        fetchTodayEntries();
        toast({
          title: 'מדידת זמן נעצרה',
          description: `נמדדו ${res.data.entry.duration_hours} שעות`,
          variant: 'success',
        });
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בעצירת מדידת זמן',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post('/api/time_tracking/cancel');
      if (res.data.success) {
        setActiveSession(null);
        setElapsed(0);
        setNote('');
        notifyIndicator(null);
        toast({ title: 'מדידה בוטלה', description: 'המדידה בוטלה ללא שמירה', variant: 'success' });
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בביטול המדידה',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStopAndStartNew = async () => {
    setLoading(true);
    try {
      await apiClient.post('/api/time_tracking/stop', { note: '' });
      const res = await apiClient.post('/api/time_tracking/start', startPayload());
      if (res.data.success) {
        setConflictSession(null);
        onStarted(res.data.session);
        fetchTodayEntries();
        toast({
          title: 'מדידת זמן התחילה',
          description: 'המדידה הקודמת נעצרה ומדידה חדשה החלה',
          variant: 'success',
        });
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בעת מעבר למדידה חדשה',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isActive = !!activeSession;
  const todayTotal = todayEntries.reduce((sum, e) => sum + (e.duration_hours || 0), 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
      <div className="flex items-center gap-3">
        <Timer className="w-7 h-7 text-[#292f4c]" />
        <h1 className="text-2xl sm:text-3xl font-bold text-[#292f4c]">מדידת זמן</h1>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-10 space-y-8">
          {isActive ? (
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-500">מודד עכשיו עבור</p>
              <p className="text-xl sm:text-2xl font-bold text-[#292f4c]">
                {sessionLabel(activeSession) || 'לקוח'}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-base">לקוח</Label>
                <div className="relative">
                  <Input
                    placeholder="הקלד שם לקוח לחיפוש..."
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setShowClientDropdown(true);
                      if (clientId) {
                        setClientId('');
                        setProjectId(NONE);
                        setTaskId(NONE);
                      }
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    onBlur={() => setShowClientDropdown(false)}
                    className="h-14 text-lg pl-10"
                  />
                  {clientSearch && (
                    <button
                      type="button"
                      onClick={clearClient}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="נקה בחירה"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                  {showClientDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto">
                      {filteredClients.map((client) => (
                        <div
                          key={client.id}
                          className={`px-4 py-3 text-base cursor-pointer hover:bg-gray-100 ${
                            clientId === client.id ? 'bg-[#e6f4f1] text-[#2b585e] font-medium' : ''
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectClient(client);
                          }}
                        >
                          {client.name}
                        </div>
                      ))}
                      {filteredClients.length === 0 && (
                        <div className="px-4 py-3 text-gray-500 text-center">לא נמצאו לקוחות</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {clientId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>פרויקט (אופציונלי)</Label>
                    <Select
                      value={projectId}
                      onValueChange={(v) => {
                        setProjectId(v);
                        setTaskId(NONE);
                      }}
                      disabled={projects.length === 0}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="ללא פרויקט" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>ללא פרויקט</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.title || p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>משימה (אופציונלי)</Label>
                    <Select
                      value={taskId}
                      onValueChange={setTaskId}
                      disabled={projectId === NONE || tasks.length === 0}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="ללא משימה" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>ללא משימה</SelectItem>
                        {tasks.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              {isActive && <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
              <span
                dir="ltr"
                className={`font-mono font-bold tracking-tight text-6xl sm:text-8xl ${
                  isActive ? 'text-[#292f4c]' : 'text-gray-300'
                }`}
              >
                {formatTime(elapsed)}
              </span>
            </div>

            <button
              type="button"
              onClick={isActive ? handleStop : handleStart}
              disabled={loading || (!isActive && !clientId)}
              className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full text-white flex flex-col items-center justify-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed ${
                isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-[#00c875] hover:bg-[#00b368]'
              }`}
            >
              {isActive ? <Square className="w-12 h-12" fill="currentColor" /> : <Play className="w-12 h-12" fill="currentColor" />}
              <span className="text-xl font-bold">{isActive ? 'עצור' : 'התחל'}</span>
            </button>

            {!isActive && !clientId && <p className="text-sm text-gray-500">בחר לקוח כדי להתחיל</p>}
          </div>

          {isActive && (
            <div className="space-y-3">
              <Textarea
                placeholder="הערה למדידה (אופציונלי)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
              <div className="flex justify-center">
                <Button variant="ghost" onClick={handleCancel} disabled={loading} className="text-gray-500">
                  בטל ללא שמירה
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#292f4c]">המדידות שלי היום</h2>
            <span className="text-sm text-gray-600">
              סה"כ: <span className="font-bold text-[#292f4c]">{todayTotal.toFixed(2)} שעות</span>
            </span>
          </div>
          {todayEntries.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">עוד אין מדידות היום</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {todayEntries.map((e) => (
                <li key={e.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-[#292f4c] truncate">{sessionLabel(e)}</p>
                    {e.note && <p className="text-sm text-gray-500 truncate">{e.note}</p>}
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-mono font-bold text-[#292f4c]">{e.duration_hours} ש'</p>
                    <p className="text-xs text-gray-500" dir="ltr">
                      {new Date(e.start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!conflictSession} onOpenChange={(open) => !open && setConflictSession(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              יש מדידה פעילה
            </DialogTitle>
            <DialogDescription className="text-right">כרגע רצה מדידה עבור:</DialogDescription>
          </DialogHeader>
          {conflictSession && (
            <div className="py-4 space-y-3 text-right">
              <p className="font-medium text-[#292f4c]">{sessionLabel(conflictSession)}</p>
              <p className="text-sm text-gray-500">
                זמן מצטבר:{' '}
                <span className="font-mono font-bold text-[#0073ea]">
                  {formatTime(conflictSession.elapsed_seconds ?? 0)}
                </span>
              </p>
            </div>
          )}
          <DialogFooter className="flex-row-reverse gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => {
                setConflictSession(null);
                fetchActive();
              }}
            >
              המשך במדידה הנוכחית
            </Button>
            <Button variant="destructive" onClick={handleStopAndStartNew} disabled={loading}>
              <Square className="w-4 h-4 ml-2" />
              עצור מדידה זאת והתחל מדידה חדשה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
