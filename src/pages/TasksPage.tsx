/**
 * Tasks management page — Kanban / list for open tasks
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckSquare, LayoutGrid, List, Search } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BoardTask,
  TasksKanban,
  TasksList,
  TaskDetailSheet,
  TasksViewMode,
  isOverdue,
} from '@/components/tasks';

const VIEW_KEY = 'tasks_page_view';
const ADMIN_MODE_KEY = 'tasks_page_admin_mode';

export function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const isManagerOrAdmin =
    user?.id === 'admin' ||
    ['מנהל', 'אדמין', 'admin', 'manager'].includes(user?.role || '');

  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<TasksViewMode>(() => {
    const saved = localStorage.getItem(VIEW_KEY);
    return saved === 'board' ? 'board' : 'list';
  });
  const [adminMode, setAdminMode] = useState(() => {
    return localStorage.getItem(ADMIN_MODE_KEY) === '1';
  });

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'overdue' | 'no_deadline'>('all');

  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const scope = isManagerOrAdmin && adminMode ? 'all' : 'mine';

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/tasks/board', {
        params: { scope },
      });
      if (response.data.success) {
        setTasks(response.data.tasks || []);
      } else {
        toast({
          title: 'שגיאה',
          description: response.data.error || 'לא ניתן לטעון משימות',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'לא ניתן לטעון משימות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [scope, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    localStorage.setItem(VIEW_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem(ADMIN_MODE_KEY, adminMode ? '1' : '0');
  }, [adminMode]);

  const clientOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tasks) {
      if (t.client_id) map.set(t.client_id, t.client_name);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'he'));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (q) {
        const hay = `${task.title} ${task.client_name} ${task.project_title}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (priorityFilter !== 'all') {
        const p = (task.priority || 'medium').toLowerCase();
        if (priorityFilter === 'urgent' && !(p === 'urgent' || p === 'דחוף')) return false;
        if (priorityFilter === 'high' && !(p === 'high' || p === 'גבוהה')) return false;
        if (priorityFilter === 'medium' && !(p === 'medium' || p === 'בינונית' || p === 'רגילה'))
          return false;
        if (priorityFilter === 'low' && !(p === 'low' || p === 'נמוכה')) return false;
      }
      if (clientFilter !== 'all' && task.client_id !== clientFilter) return false;
      if (quickFilter === 'overdue' && !isOverdue(task.deadline)) return false;
      if (quickFilter === 'no_deadline' && task.deadline) return false;
      return true;
    });
  }, [tasks, search, priorityFilter, clientFilter, quickFilter]);

  const stats = useMemo(() => {
    const open = filteredTasks.length;
    const overdue = filteredTasks.filter((t) => isOverdue(t.deadline)).length;
    const noDeadline = filteredTasks.filter((t) => !t.deadline).length;
    return { open, overdue, noDeadline };
  }, [filteredTasks]);

  const updateTaskLocally = (taskId: string, patch: Partial<BoardTask>) => {
    setTasks((prev) =>
      prev
        .map((t) => (t.task_id === taskId ? { ...t, ...patch } : t))
        .filter((t) => t.status !== 'הושלם')
    );
    setSelectedTask((prev) =>
      prev && prev.task_id === taskId ? { ...prev, ...patch } : prev
    );
  };

  const handleStatusChange = async (
    task: BoardTask,
    newStatus: string
  ): Promise<boolean> => {
    const previous = task.status;
    updateTaskLocally(task.task_id, { status: newStatus });
    try {
      const response = await apiClient.post(
        `/update_task_status/${task.client_id}/${task.project_id}/${task.task_id}`,
        { status: newStatus },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status !== 'success') {
        throw new Error(response.data.error || 'שגיאה בעדכון');
      }
      if (newStatus === 'הושלם') {
        toast({ title: 'המשימה הושלמה', description: task.title });
        // משימות יומיות חוזרות ל"לביצוע" עם deadline חדש — רענון
        if (task.is_daily_task) {
          fetchTasks();
        }
      }
      return true;
    } catch (error: any) {
      updateTaskLocally(task.task_id, { status: previous });
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || error.message || 'שגיאה בעדכון הסטטוס',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleSaveStatus = async (
    task: BoardTask,
    status: string,
    deadline: string
  ): Promise<boolean> => {
    const prevStatus = task.status;
    const prevDeadline = task.deadline;
    updateTaskLocally(task.task_id, { status, deadline });
    try {
      const body: Record<string, string> = { status };
      if (deadline) body.deadline = deadline;
      const response = await apiClient.post(
        `/update_task_status/${task.client_id}/${task.project_id}/${task.task_id}`,
        body,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.status !== 'success') {
        throw new Error(response.data.error || 'שגיאה בעדכון');
      }
      toast({ title: 'נשמר', description: 'המשימה עודכנה' });
      return true;
    } catch (error: any) {
      updateTaskLocally(task.task_id, { status: prevStatus, deadline: prevDeadline });
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || error.message || 'שגיאה בשמירה',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleSaveNote = async (task: BoardTask, note: string): Promise<boolean> => {
    const prev = task.note;
    updateTaskLocally(task.task_id, { note });
    try {
      const response = await apiClient.post(
        `/update_task_note/${task.client_id}/${task.project_id}/${task.task_id}`,
        { note },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.data.success && response.status !== 200) {
        throw new Error(response.data.error || 'שגיאה בשמירת הערה');
      }
      return true;
    } catch (error: any) {
      updateTaskLocally(task.task_id, { note: prev });
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בשמירת ההערה',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleComplete = async (task: BoardTask): Promise<boolean> => {
    return handleStatusChange(task, 'הושלם');
  };

  const openTask = (task: BoardTask) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#292f4c] flex items-center gap-2">
            <CheckSquare className="w-7 h-7 text-[#3d817a]" />
            משימות
          </h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">
            {scope === 'all'
              ? 'מצב ניהול — כל המשימות הפתוחות בצוות'
              : 'המשימות הפתוחות שלך'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isManagerOrAdmin && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <Switch
                id="admin-mode"
                checked={adminMode}
                onCheckedChange={setAdminMode}
              />
              <Label htmlFor="admin-mode" className="cursor-pointer text-sm whitespace-nowrap">
                מצב ניהול
              </Label>
            </div>
          )}

          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            <Button
              type="button"
              variant={viewMode === 'board' ? 'default' : 'ghost'}
              size="sm"
              className={
                viewMode === 'board'
                  ? 'bg-[#3d817a] hover:bg-[#2b585e] h-8'
                  : 'h-8'
              }
              onClick={() => setViewMode('board')}
            >
              <LayoutGrid className="w-4 h-4 ml-1" />
              לוח
            </Button>
            <Button
              type="button"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className={
                viewMode === 'list'
                  ? 'bg-[#3d817a] hover:bg-[#2b585e] h-8'
                  : 'h-8'
              }
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 ml-1" />
              רשימה
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
          <span className="text-slate-500">פתוחות </span>
          <span className="font-semibold text-[#292f4c]">{stats.open}</span>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
          <span className="text-slate-500">באיחור </span>
          <span className="font-semibold text-red-600">{stats.overdue}</span>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
          <span className="text-slate-500">ללא תאריך </span>
          <span className="font-semibold text-amber-600">{stats.noDeadline}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי משימה, לקוח או פרויקט..."
            className="pr-10 bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="עדיפות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל העדיפויות</SelectItem>
              <SelectItem value="urgent">דחוף</SelectItem>
              <SelectItem value="high">גבוהה</SelectItem>
              <SelectItem value="medium">בינונית</SelectItem>
              <SelectItem value="low">נמוכה</SelectItem>
            </SelectContent>
          </Select>

          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="לקוח" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הלקוחות</SelectItem>
              {clientOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={quickFilter}
            onValueChange={(v) => setQuickFilter(v as typeof quickFilter)}
          >
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="סינון" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              <SelectItem value="overdue">באיחור</SelectItem>
              <SelectItem value="no_deadline">ללא תאריך</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-20">טוען משימות...</div>
      ) : viewMode === 'board' ? (
        <TasksKanban
          tasks={filteredTasks}
          showAssignee={scope === 'all'}
          onTaskClick={openTask}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <TasksList
          tasks={filteredTasks}
          showAssignee={scope === 'all'}
          onTaskClick={openTask}
          onStatusChange={handleStatusChange}
        />
      )}

      <TaskDetailSheet
        task={selectedTask}
        open={detailOpen}
        showAssignee={scope === 'all'}
        onOpenChange={setDetailOpen}
        onSaveStatus={handleSaveStatus}
        onSaveNote={handleSaveNote}
        onComplete={handleComplete}
      />
    </div>
  );
}
