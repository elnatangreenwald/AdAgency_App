/**
 * List view grouped by client
 */
import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  BoardTask,
  TASK_STATUS_OPTIONS,
  formatDeadline,
  isOverdue,
  priorityAccent,
  priorityLabel,
} from './types';

interface TasksListProps {
  tasks: BoardTask[];
  showAssignee?: boolean;
  onTaskClick: (task: BoardTask) => void;
  onStatusChange: (task: BoardTask, newStatus: string) => void;
}

function sortByDeadline(a: BoardTask, b: BoardTask) {
  if (!a.deadline && !b.deadline) return 0;
  if (!a.deadline) return 1;
  if (!b.deadline) return -1;
  return a.deadline.localeCompare(b.deadline);
}

export function TasksList({
  tasks,
  showAssignee = false,
  onTaskClick,
  onStatusChange,
}: TasksListProps) {
  const groups = useMemo(() => {
    const map = new Map<string, { clientId: string; clientName: string; tasks: BoardTask[] }>();
    for (const task of tasks) {
      const key = task.client_id || task.client_name || 'unknown';
      if (!map.has(key)) {
        map.set(key, {
          clientId: task.client_id,
          clientName: task.client_name || 'ללא לקוח',
          tasks: [],
        });
      }
      map.get(key)!.tasks.push(task);
    }
    return Array.from(map.values())
      .map((g) => ({ ...g, tasks: [...g.tasks].sort(sortByDeadline) }))
      .sort((a, b) => a.clientName.localeCompare(b.clientName, 'he'));
  }, [tasks]);

  if (groups.length === 0) {
    return (
      <div className="text-center text-slate-500 py-16 border border-dashed border-slate-200 rounded-xl">
        אין משימות פתוחות להצגה
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section
          key={group.clientId || group.clientName}
          className="rounded-xl border border-slate-200 bg-white overflow-hidden"
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#f4f7f7] border-b border-slate-200">
            <h3 className="font-semibold text-[#292f4c] text-base">{group.clientName}</h3>
            <span className="text-xs font-medium text-slate-500 bg-white rounded-full px-2.5 py-0.5 border border-slate-200">
              {group.tasks.length} משימות
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="text-right font-medium px-3 py-2">משימה</th>
                  <th className="text-right font-medium px-3 py-2">סטטוס</th>
                  <th className="text-right font-medium px-3 py-2">תאריך</th>
                  <th className="text-right font-medium px-3 py-2">עדיפות</th>
                  {showAssignee && (
                    <th className="text-right font-medium px-3 py-2">אחראי</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {group.tasks.map((task) => {
                  const overdue = isOverdue(task.deadline);
                  const statusValue = (TASK_STATUS_OPTIONS as readonly string[]).includes(
                    task.status
                  )
                    ? task.status
                    : 'לביצוע';
                  return (
                    <tr
                      key={task.task_id}
                      className="border-b border-slate-100 last:border-0 hover:bg-[#f8fafa] cursor-pointer"
                      onClick={() => onTaskClick(task)}
                    >
                      <td className="px-3 py-3">
                        <div className="font-medium text-[#292f4c]">{task.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[320px]">
                          {task.project_title}
                          {task.note ? ' · יש הערה' : ''}
                        </div>
                      </td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={statusValue}
                          onValueChange={(value) => onStatusChange(task, value)}
                        >
                          <SelectTrigger className="h-8 w-[150px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TASK_STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-3">
                        {task.deadline ? (
                          <span className={cn(overdue && 'text-red-600 font-medium')}>
                            {formatDeadline(task.deadline)}
                          </span>
                        ) : (
                          <span className="text-amber-600">ללא תאריך</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className="inline-block rounded px-2 py-0.5 text-xs text-white"
                          style={{ backgroundColor: priorityAccent(task.priority) }}
                        >
                          {priorityLabel(task.priority)}
                        </span>
                      </td>
                      {showAssignee && (
                        <td className="px-3 py-3 text-slate-600">
                          {task.assignee_name || 'ללא אחראי'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
