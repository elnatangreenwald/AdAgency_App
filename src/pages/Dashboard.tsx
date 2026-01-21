import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { TimeTracker } from '@/components/TimeTracker';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { CalendarWidget } from '@/components/dashboard/CalendarWidget';
import { ClientsGrid } from '@/components/dashboard/ClientsGrid';

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


export function Dashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
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
    if (!newProjectName.trim() || !selectedClientId) {
      toast({
        title: 'שגיאה',
        description: 'אנא הזן שם לפרויקט ובחר לקוח',
        variant: 'destructive',
      });
      return;
    }

    try {
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
      if (response.data?.status === 'success' && createdProject) {
        setProjects((prev) => {
          const exists = prev.some((project) => project.id === createdProject.id);
          return exists ? prev : [...prev, createdProject];
        });
        setSelectedProjectId(createdProject.id);
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
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה ביצירת הפרויקט',
        variant: 'destructive',
      });
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedProjectId || !taskForm.task_title) {
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

  const handleCalendarTaskClick = (task: CalendarTask) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  return (
    <div className="space-y-6 sm:space-y-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#292f4c]">
        שלום, משתמש
      </h1>

      {/* Quick Actions */}
      <QuickActions
        onAddTask={() => setAddTaskOpen(true)}
        onAddCharge={() => setAddChargeOpen(true)}
      />

      {/* Calendar */}
      <CalendarWidget
        tasks={calendarTasks}
        onTaskClick={handleCalendarTaskClick}
      />

      {/* Clients Grid */}
      <ClientsGrid clients={clients} />

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
