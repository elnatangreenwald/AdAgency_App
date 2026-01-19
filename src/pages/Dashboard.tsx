import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listWeekPlugin from '@fullcalendar/list';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { FileText, CreditCard, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { EventInput, EventClickArg } from '@fullcalendar/core';
import { TimeTracker } from '@/components/TimeTracker';

interface Client {
  id: string;
  name: string;
}

interface Project {
  id: string;
  title: string;
}

interface CalendarTask {
  id: string;
  title: string;
  start: string;
  client_name: string;
  project_title: string;
  assignee_name: string;
  status: string;
  client_id: string;
  project_id: string;
  task_id: string;
}

const statusColors: Record<string, string> = {
  'לביצוע': '#bfc9f2',
  'הועבר לסטודיו': '#2b585e',
  'הועבר לדיגיטל': '#043841',
  'נשלח ללקוח': '#b8e994',
  'הושלם': '#14a675',
};

// פונקציה ליצירת צבע קבוע לכל לקוח לפי ה-ID שלו
const getClientColor = (clientId: string): string => {
  // רשימת צבעים יפים ונוחים לעין
  const colors = [
    '#3b82f6', // כחול
    '#10b981', // ירוק
    '#f59e0b', // כתום
    '#ef4444', // אדום
    '#8b5cf6', // סגול
    '#ec4899', // ורוד
    '#06b6d4', // ציאן
    '#84cc16', // ליים
    '#f97316', // כתום כהה
    '#6366f1', // אינדיגו
    '#14b8a6', // טורקיז
    '#a855f7', // סגול כהה
    '#22c55e', // ירוק בהיר
    '#eab308', // צהוב
    '#f43f5e', // ורוד כהה
  ];
  
  // יצירת hash מה-ID של הלקוח
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = clientId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // החזרת צבע לפי ה-hash
  return colors[Math.abs(hash) % colors.length];
};

export function Dashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const calendarRef = useRef<FullCalendar>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form states
  const [taskForm, setTaskForm] = useState({
    task_title: '',
    task_status: 'לביצוע',
    task_deadline: '',
    task_note: '',
    is_daily_task: false,
  });

  const [chargeForm, setChargeForm] = useState({
    charge_title: '',
    charge_amount: '',
    charge_our_cost: '',
  });

  // Client search for charge dialog
  const [chargeClientSearch, setChargeClientSearch] = useState('');
  const [showChargeClientDropdown, setShowChargeClientDropdown] = useState(false);
  const chargeClientInputRef = useRef<HTMLInputElement>(null);

  // Client search for task dialog
  const [taskClientSearch, setTaskClientSearch] = useState('');
  const [showTaskClientDropdown, setShowTaskClientDropdown] = useState(false);
  const taskClientInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchClients();
    fetchCalendarTasks();
  }, []);

  const fetchClients = async () => {
    try {
      // This should be an API endpoint
      const response = await apiClient.get('/api/clients');
      if (response.data.success) {
        setClients(response.data.clients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchCalendarTasks = async () => {
    try {
      const response = await apiClient.get('/api/tasks/calendar');
      if (response.data.success) {
        setCalendarTasks(response.data.tasks);
      }
    } catch (error) {
      console.error('Error fetching calendar tasks:', error);
    }
  };

  const fetchProjects = async (clientId: string) => {
    try {
      const response = await apiClient.get(`/get_client_projects/${clientId}`);
      if (response.data.success) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedProjectId('');
    if (clientId) {
      fetchProjects(clientId);
    } else {
      setProjects([]);
    }
  };

  const createNewProject = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.tsx:createNewProject',message:'enter createNewProject',data:{selectedClientId,hasName:!!newProjectName.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion agent log
    if (!newProjectName.trim() || !selectedClientId) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.tsx:createNewProject',message:'blocked by validation',data:{selectedClientId,hasName:!!newProjectName.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion agent log
      toast({
        title: 'שגיאה',
        description: 'אנא הזן שם לפרויקט ובחר לקוח',
        variant: 'destructive',
      });
      return;
    }

    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.tsx:createNewProject',message:'sending add_project',data:{selectedClientId,newProjectName},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion agent log
      const response = await apiClient.post(
        `/add_project/${selectedClientId}`,
        { title: newProjectName },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      const createdProject = response.data?.data?.project;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.tsx:createNewProject',message:'add_project response',data:{status:response.data?.status,hasProject:!!createdProject,projectId:createdProject?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion agent log
      if (response.data?.status === 'success' && createdProject) {
        setProjects((prev) => {
          const exists = prev.some((project) => project.id === createdProject.id);
          return exists ? prev : [...prev, createdProject];
        });
        setSelectedProjectId(createdProject.id);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.tsx:createNewProject',message:'project added to state',data:{selectedProjectId:createdProject.id,projectsCount:projects.length+1},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion agent log
        setShowNewProject(false);
        setNewProjectName('');
        toast({
          title: 'הצלחה',
          description: response.data.message || 'הפרויקט נוצר בהצלחה',
          variant: 'success',
        });
      } else {
        toast({
          title: 'שגיאה',
          description: response.data?.error || 'שגיאה ביצירת הפרויקט',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.tsx:createNewProject',message:'add_project error',data:{status:error?.response?.status,err:error?.response?.data?.error || error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion agent log
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה ביצירת הפרויקט',
        variant: 'destructive',
      });
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.tsx:handleAddTask',message:'enter handleAddTask',data:{selectedClientId,selectedProjectId,hasTitle:!!taskForm.task_title},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion agent log
    if (!selectedClientId || !selectedProjectId || !taskForm.task_title) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a8c0c01a-2bea-45d6-8086-e4f9c7116109',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.tsx:handleAddTask',message:'blocked by validation',data:{selectedClientId,selectedProjectId,hasTitle:!!taskForm.task_title},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion agent log
      toast({
        title: 'שגיאה',
        description: 'אנא מלא את כל השדות הנדרשים',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('client_id', selectedClientId);
      formData.append('project_id', selectedProjectId);
      formData.append('task_title', taskForm.task_title);
      formData.append('task_status', taskForm.task_status);
      formData.append('task_note', taskForm.task_note);
      if (taskForm.task_deadline) {
        formData.append('task_deadline', taskForm.task_deadline);
      }
      if (taskForm.is_daily_task) {
        formData.append('is_daily_task', 'true');
      }

      const response = await apiClient.post('/quick_add_task', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (response.data && response.data.success) {
        toast({
          title: 'הצלחה',
          description: response.data.message || 'המשימה נוספה בהצלחה',
          variant: 'success',
        });
        setAddTaskOpen(false);
        setTaskForm({
          task_title: '',
          task_status: 'לביצוע',
          task_deadline: '',
          task_note: '',
          is_daily_task: false,
        });
        setSelectedClientId('');
        setSelectedProjectId('');
        setShowNewProject(false);
        setNewProjectName('');
        setTaskClientSearch('');
        setProjects([]);
        fetchCalendarTasks();
      } else {
        toast({
          title: 'שגיאה',
          description: response.data?.error || 'שגיאה בהוספת המשימה',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || error.response?.data?.message || 'שגיאה בהוספת המשימה',
        variant: 'destructive',
      });
    }
  };

  const handleAddCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !chargeForm.charge_title || !chargeForm.charge_amount) {
      toast({
        title: 'שגיאה',
        description: 'אנא מלא את כל השדות הנדרשים',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('client_id', selectedClientId);
      formData.append('charge_title', chargeForm.charge_title);
      formData.append('charge_amount', chargeForm.charge_amount);
      if (chargeForm.charge_our_cost) {
        formData.append('charge_our_cost', chargeForm.charge_our_cost);
      }

      const response = await apiClient.post('/quick_add_charge', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'החיוב נוסף בהצלחה',
          variant: 'success',
        });
        setAddChargeOpen(false);
        setChargeForm({
          charge_title: '',
          charge_amount: '',
          charge_our_cost: '',
        });
        setSelectedClientId('');
        setChargeClientSearch('');
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בהוספת החיוב',
        variant: 'destructive',
      });
    }
  };

  const handleTaskClick = (info: EventClickArg) => {
    const task = calendarTasks.find(t => t.task_id === info.event.id);
    if (task) {
      setSelectedTask(task);
      setTaskModalOpen(true);
    }
  };

  const handleUpdateTask = async (status: string, deadline: string) => {
    if (!selectedTask) return;

    try {
      const updateData: any = { status };
      if (deadline) {
        updateData.deadline = deadline;
      }

      const response = await apiClient.post(
        `/update_task_status/${selectedTask.client_id}/${selectedTask.project_id}/${selectedTask.task_id}`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      if (response.data.status === 'success') {
        toast({
          title: 'הצלחה',
          description: 'המשימה עודכנה בהצלחה',
          variant: 'success',
        });
        setTaskModalOpen(false);
        fetchCalendarTasks();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בעדכון המשימה',
        variant: 'destructive',
      });
    }
  };

  const calendarEvents: EventInput[] = calendarTasks.map(task => ({
    id: task.task_id,
    title: task.title,
    start: task.start,
    color: getClientColor(task.client_id), // צבע קבוע לפי לקוח
    backgroundColor: getClientColor(task.client_id),
    borderColor: getClientColor(task.client_id),
    extendedProps: task,
  }));

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#292f4c]">
        שלום, משתמש
      </h1>

      {/* Quick Actions */}
      <div className="space-y-4 sm:space-y-5">
        <h2 className="text-xl sm:text-2xl font-bold text-[#292f4c]">פעולות מהירות</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-4xl">
          <Card
            className="bg-[#2b585e] text-white cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 active:scale-95"
            onClick={() => setAddTaskOpen(true)}
          >
            <CardContent className="p-6 sm:p-10 text-center">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">פתיחת משימה</h3>
              <p className="text-xs sm:text-sm opacity-90">הוסף משימה חדשה ללקוח</p>
            </CardContent>
          </Card>

          <Card
            className="bg-[#14a675] text-white cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 active:scale-95"
            onClick={() => setAddChargeOpen(true)}
          >
            <CardContent className="p-6 sm:p-10 text-center">
              <CreditCard className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">הוספת חיוב</h3>
              <p className="text-xs sm:text-sm opacity-90">הוסף חיוב חדש ללקוח</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Calendar */}
      <div className="space-y-4 sm:space-y-5">
        <h2 className="text-xl sm:text-2xl font-bold text-[#292f4c]">לוח שנה - משימות</h2>
        <Card>
          <CardContent className="p-2 sm:p-6 overflow-x-auto">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, listWeekPlugin]}
              initialView="dayGridMonth"
              locale="he"
              direction="rtl"
              headerToolbar={{
                right: 'prev,next today',
                center: 'title',
                left: 'dayGridMonth,listWeek',
              }}
              validRange={{
                start: '2020-01-01',
              }}
              events={calendarEvents}
              eventClick={handleTaskClick}
              height="auto"
              dayMaxEventRows={3}
              buttonText={{
                today: 'היום',
                month: 'חודש',
                week: 'שבוע',
                day: 'יום',
                list: 'רשימה',
              }}
              firstDay={0}
              views={{
                listWeek: {
                  titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
                  listDayFormat: { weekday: 'long', day: 'numeric', month: 'long' },
                  listDaySideFormat: false,
                  duration: { days: 7 },
                },
              }}
              eventDisplay="block"
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Clients Grid */}
      <div className="space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
          <h3 className="text-lg sm:text-xl font-bold">הלקוחות שלך:</h3>
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="חפש לקוח..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
          {filteredClients.map((client) => (
            <Link
              key={client.id}
              to={`/client/${client.id}`}
              className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl text-center font-bold text-gray-800 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 active:scale-95 border border-gray-200 hover:border-[#0073ea] relative overflow-hidden group text-sm sm:text-base"
            >
              <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-[#3d817a] to-[#2d6159] transform scale-y-0 group-hover:scale-y-100 transition-transform" />
              {client.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Add Task Modal */}
      <Dialog open={addTaskOpen} onOpenChange={(open) => {
        setAddTaskOpen(open);
        if (!open) {
          setTaskClientSearch('');
          setSelectedClientId('');
          setSelectedProjectId('');
          setProjects([]);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>פתיחת משימה חדשה</DialogTitle>
            <DialogDescription>
              הוסף משימה חדשה ללקוח
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="space-y-2">
              <Label>בחר לקוח:</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  ref={taskClientInputRef}
                  type="text"
                  placeholder="הקלד לחיפוש לקוח..."
                  value={taskClientSearch}
                  onChange={(e) => {
                    setTaskClientSearch(e.target.value);
                    setShowTaskClientDropdown(true);
                    // Clear selection if user is typing something different
                    if (selectedClientId) {
                      const selectedClient = clients.find(c => c.id === selectedClientId);
                      if (selectedClient && e.target.value !== selectedClient.name) {
                        setSelectedClientId('');
                        setSelectedProjectId('');
                        setProjects([]);
                      }
                    }
                  }}
                  onFocus={() => setShowTaskClientDropdown(true)}
                  onBlur={() => {
                    // Delay to allow click on dropdown item
                    setTimeout(() => setShowTaskClientDropdown(false), 200);
                  }}
                  className="pr-10"
                />
                {showTaskClientDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {clients
                      .filter(client => 
                        client.name.toLowerCase().includes(taskClientSearch.toLowerCase())
                      )
                      .map((client) => (
                        <div
                          key={client.id}
                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                            selectedClientId === client.id ? 'bg-[#e6f4f1] text-[#2b585e] font-medium' : ''
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setTaskClientSearch(client.name);
                            setShowTaskClientDropdown(false);
                            handleClientChange(client.id);
                          }}
                        >
                          {client.name}
                        </div>
                      ))
                    }
                    {clients.filter(client => 
                      client.name.toLowerCase().includes(taskClientSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="px-4 py-2 text-gray-500 text-center">
                        לא נמצאו לקוחות
                      </div>
                    )}
                  </div>
                )}
              </div>
              {selectedClientId && (
                <p className="text-sm text-green-600">
                  ✓ נבחר: {clients.find(c => c.id === selectedClientId)?.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>בחר פרויקט:</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedProjectId}
                  onValueChange={setSelectedProjectId}
                  disabled={!selectedClientId || projects.length === 0}
                  required
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="-- בחר פרויקט --" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={() => setShowNewProject(true)}
                  disabled={!selectedClientId}
                  className="bg-[#00c875] hover:bg-[#00b869]"
                >
                  + פרויקט חדש
                </Button>
              </div>
              {showNewProject && (
                <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
                  <Input
                    placeholder="שם הפרויקט החדש..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={createNewProject}
                      className="bg-[#00c875] hover:bg-[#00b869]"
                    >
                      צור פרויקט
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNewProject(false);
                        setNewProjectName('');
                      }}
                    >
                      ביטול
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>שם המשימה:</Label>
              <Input
                value={taskForm.task_title}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, task_title: e.target.value })
                }
                placeholder="הזן שם משימה..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label>סטאטוס:</Label>
              <Select
                value={taskForm.task_status}
                onValueChange={(value) =>
                  setTaskForm({ ...taskForm, task_status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="לביצוע">לביצוע</SelectItem>
                  <SelectItem value="הועבר לסטודיו">הועבר לסטודיו</SelectItem>
                  <SelectItem value="הועבר לדיגיטל">הועבר לדיגיטל</SelectItem>
                  <SelectItem value="נשלח ללקוח">נשלח ללקוח</SelectItem>
                  <SelectItem value="הושלם">הושלם</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>תאריך לביצוע (Deadline) - אופציונלי:</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  value={taskForm.task_deadline}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, task_deadline: e.target.value })
                  }
                  className="direction-ltr text-right flex-1"
                />
                <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                  <Checkbox
                    id="is_daily_task"
                    checked={taskForm.is_daily_task}
                    onCheckedChange={(checked) =>
                      setTaskForm({ ...taskForm, is_daily_task: checked === true })
                    }
                    className="w-4 h-4"
                  />
                  <Label 
                    htmlFor="is_daily_task" 
                    className="cursor-pointer text-gray-600 hover:text-[#3d817a]"
                  >
                    יומית
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>הערה (אופציונלי):</Label>
              <Textarea
                value={taskForm.task_note}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, task_note: e.target.value })
                }
                placeholder="הערה למשימה..."
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddTaskOpen(false)}
              >
                ביטול
              </Button>
              <Button type="submit">הוסף משימה</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Charge Modal */}
      <Dialog open={addChargeOpen} onOpenChange={(open) => {
        setAddChargeOpen(open);
        if (!open) {
          setChargeClientSearch('');
          setSelectedClientId('');
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>💰 הוספת חיוב חדש</DialogTitle>
            <DialogDescription>
              הוסף חיוב חדש ללקוח
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCharge} className="space-y-4">
            <div className="space-y-2">
              <Label>בחר לקוח:</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  ref={chargeClientInputRef}
                  type="text"
                  placeholder="הקלד לחיפוש לקוח..."
                  value={chargeClientSearch}
                  onChange={(e) => {
                    setChargeClientSearch(e.target.value);
                    setShowChargeClientDropdown(true);
                    // Clear selection if user is typing something different
                    if (selectedClientId) {
                      const selectedClient = clients.find(c => c.id === selectedClientId);
                      if (selectedClient && e.target.value !== selectedClient.name) {
                        setSelectedClientId('');
                      }
                    }
                  }}
                  onFocus={() => setShowChargeClientDropdown(true)}
                  onBlur={() => {
                    // Delay to allow click on dropdown item
                    setTimeout(() => setShowChargeClientDropdown(false), 200);
                  }}
                  className="pr-10"
                />
                {showChargeClientDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {clients
                      .filter(client => 
                        client.name.toLowerCase().includes(chargeClientSearch.toLowerCase())
                      )
                      .map((client) => (
                        <div
                          key={client.id}
                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                            selectedClientId === client.id ? 'bg-[#e6f4f1] text-[#2b585e] font-medium' : ''
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedClientId(client.id);
                            setChargeClientSearch(client.name);
                            setShowChargeClientDropdown(false);
                          }}
                        >
                          {client.name}
                        </div>
                      ))
                    }
                    {clients.filter(client => 
                      client.name.toLowerCase().includes(chargeClientSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="px-4 py-2 text-gray-500 text-center">
                        לא נמצאו לקוחות
                      </div>
                    )}
                  </div>
                )}
              </div>
              {selectedClientId && (
                <p className="text-sm text-green-600">
                  ✓ נבחר: {clients.find(c => c.id === selectedClientId)?.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>כותרת החיוב:</Label>
              <Input
                value={chargeForm.charge_title}
                onChange={(e) =>
                  setChargeForm({ ...chargeForm, charge_title: e.target.value })
                }
                placeholder="לדוגמה: עבודת עיצוב..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label>סכום לחיוב:</Label>
              <Input
                type="number"
                value={chargeForm.charge_amount}
                onChange={(e) =>
                  setChargeForm({ ...chargeForm, charge_amount: e.target.value })
                }
                placeholder="הזן סכום..."
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>עלות פנימית (אופציונלי):</Label>
              <Input
                type="number"
                value={chargeForm.charge_our_cost}
                onChange={(e) =>
                  setChargeForm({ ...chargeForm, charge_our_cost: e.target.value })
                }
                placeholder="הזן עלות פנימית..."
                min="0"
                step="0.01"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddChargeOpen(false)}
              >
                ביטול
              </Button>
              <Button type="submit">הוסף חיוב</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Task Details Modal */}
      {selectedTask && (
        <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTask.title || 'פרטי משימה'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border-r-4 border-r-[#0073ea]">
                <div className="space-y-2">
                  <div>
                    <strong className="text-sm text-gray-600">לקוח:</strong>
                    <div className="text-lg font-semibold">{selectedTask.client_name}</div>
                  </div>
                  <div>
                    <strong className="text-sm text-gray-600">פרויקט:</strong>
                    <div>{selectedTask.project_title}</div>
                  </div>
                  <div>
                    <strong className="text-sm text-gray-600">אחראי:</strong>
                    <div>👤 {selectedTask.assignee_name}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>סטאטוס:</Label>
                <Select
                  defaultValue={selectedTask.status}
                  onValueChange={(value) => {
                    handleUpdateTask(value, selectedTask.start);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="לביצוע">לביצוע</SelectItem>
                    <SelectItem value="הועבר לסטודיו">הועבר לסטודיו</SelectItem>
                    <SelectItem value="הועבר לדיגיטל">הועבר לדיגיטל</SelectItem>
                    <SelectItem value="נשלח ללקוח">נשלח ללקוח</SelectItem>
                    <SelectItem value="הושלם">הושלם</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>תאריך לביצוע (Deadline):</Label>
                <Input
                  type="date"
                  defaultValue={selectedTask.start}
                  onChange={(e) => {
                    handleUpdateTask(selectedTask.status, e.target.value);
                  }}
                  className="direction-ltr text-right"
                />
              </div>

              <TimeTracker
                clientId={selectedTask.client_id}
                projectId={selectedTask.project_id}
                taskId={selectedTask.task_id}
                compact={false}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setTaskModalOpen(false)}
              >
                סגור
              </Button>
              <Button
                onClick={() => navigate(`/client/${selectedTask.client_id}`)}
              >
                עבור לדף הלקוח
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
