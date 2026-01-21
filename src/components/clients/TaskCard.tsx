/**
 * Task Card Component
 * Displays a single task with status, priority, and actions
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Edit, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimeTracker } from '@/components/TimeTracker';
import type { Task, Project, Client } from '@/types';

interface TaskCardProps {
  task: Task;
  project: Project;
  client: Client;
  users: Array<{ id: string; name: string }>;
  onUpdateStatus: (clientId: string, projectId: string, taskId: string, status: string) => void;
  onUpdateDeadline: (clientId: string, projectId: string, taskId: string, deadline: string) => void;
  onDelete: (clientId: string, projectId: string, taskId: string) => void;
  onOpenNote: (clientId: string, projectId: string, taskId: string, note: string) => void;
}

const statusOptions = [
  'לביצוע',
  'הועבר לסטודיו',
  'הועבר לדיגיטל',
  'נשלח ללקוח',
  'הושלם',
];

export function TaskCard({
  task,
  project,
  client,
  users,
  onUpdateStatus,
  onUpdateDeadline,
  onDelete,
  onOpenNote,
}: TaskCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'לביצוע':
        return 'bg-blue-100 text-blue-800';
      case 'הועבר לסטודיו':
        return 'bg-purple-100 text-purple-800';
      case 'הועבר לדיגיטל':
        return 'bg-teal-100 text-teal-800';
      case 'נשלח ללקוח':
        return 'bg-green-100 text-green-800';
      case 'הושלם':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'low':
        return '#94a3b8';
      case 'medium':
        return '#3d817a';
      case 'high':
        return '#f59e0b';
      case 'urgent':
        return '#ef4444';
      default:
        return '#3d817a';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      if (dateStr.includes('T')) {
        return dateStr.split('T')[0];
      }
      return dateStr.substring(0, 10);
    } catch {
      return dateStr;
    }
  };

  const assignedUser = task.assignee || (Array.isArray(task.assigned_user) ? task.assigned_user[0] : task.assigned_user);
  const assignedUserName = users.find((u) => u.id === assignedUser)?.name || assignedUser || '';

  return (
    <div
      className={cn(
        'bg-white rounded-lg border p-3 sm:p-4 hover:shadow-md transition-shadow',
        task.status === 'הושלם' && 'opacity-60'
      )}
      style={{ borderRightWidth: '4px', borderRightColor: getPriorityColor(task.priority) }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Checkbox and Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Checkbox
            checked={task.status === 'הושלם'}
            onCheckedChange={(checked) =>
              onUpdateStatus(
                client.id,
                project.id,
                task.id,
                checked ? 'הושלם' : 'לביצוע'
              )
            }
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className={cn('font-medium truncate', task.status === 'הושלם' && 'line-through')}>
              {task.title}
            </div>
            {assignedUserName && (
              <div className="text-xs text-gray-500 mt-0.5">
                👤 {assignedUserName}
              </div>
            )}
          </div>
        </div>

        {/* Status and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Select */}
          <Select
            value={task.status}
            onValueChange={(value) => onUpdateStatus(client.id, project.id, task.id, value)}
          >
            <SelectTrigger className={cn('w-[130px] h-8 text-xs', getStatusColor(task.status))}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Deadline */}
          <Input
            type="date"
            value={formatDate(task.deadline)}
            onChange={(e) => onUpdateDeadline(client.id, project.id, task.id, e.target.value)}
            className="w-[130px] h-8 text-xs"
          />

          {/* Time Tracker */}
          <TimeTracker
            clientId={client.id}
            clientName={client.name}
            projectId={project.id}
            projectName={project.name || project.title || ''}
            taskId={task.id}
            taskTitle={task.title}
          />

          {/* Note Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenNote(client.id, project.id, task.id, task.note || '')}
            className={cn('h-8 w-8 p-0', task.note && 'text-[#0073ea]')}
            title={task.note ? 'יש הערה' : 'הוסף הערה'}
          >
            <FileText className="h-4 w-4" />
          </Button>

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(client.id, project.id, task.id)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Note Preview */}
      {task.note && (
        <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
          📝 {task.note.length > 100 ? task.note.substring(0, 100) + '...' : task.note}
        </div>
      )}
    </div>
  );
}
