import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { TimeTracker } from '@/components/TimeTracker';

interface Task {
  id: string;
  desc: string;
  status: 'ממתין' | 'בביצוע' | 'בוצע';
  notes: string;
  assigned_to_name: string;
}

interface TaskItem {
  client_id: string;
  client_name: string;
  project_id: string;
  project_title: string;
  task: Task;
}

const statusColors = {
  ממתין: 'bg-gray-400',
  בביצוע: 'bg-[#fdab3d]',
  בוצע: 'bg-[#00c875]',
};

export function QuickUpdate() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // This endpoint should be created in Flask to return JSON
      const response = await apiClient.get('/api/quick_update_tasks');
      if (response.data.success) {
        setTasks(response.data.tasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    clientId: string,
    projectId: string,
    taskId: string,
    newStatus: string,
    notes: string
  ) => {
    const taskKey = `${clientId}-${projectId}-${taskId}`;
    setUpdating({ ...updating, [taskKey]: true });

    try {
      const response = await apiClient.post(
        `/update_task/${clientId}/${projectId}/${taskId}`,
        {
          status: newStatus,
          notes: notes,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      if (response.data.status === 'success') {
        // Update local state
        setTasks((prevTasks) =>
          prevTasks.map((item) =>
            item.client_id === clientId &&
            item.project_id === projectId &&
            item.task.id === taskId
              ? {
                  ...item,
                  task: {
                    ...item.task,
                    status: newStatus as Task['status'],
                    notes: notes,
                  },
                }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('שגיאה בעדכון המשימה');
    } finally {
      setUpdating({ ...updating, [taskKey]: false });
    }
  };

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>,
    clientId: string,
    projectId: string,
    taskId: string
  ) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const status = formData.get('status') as string;
    const notes = (formData.get('notes') as string) || '';

    handleStatusChange(clientId, projectId, taskId, status, notes);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">טוען משימות...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-[#292f4c] mb-6">
        עדכון משימות מהיר (כל הלקוחות)
      </h1>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            אין משימות לעדכון
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((item) => (
            <Card
              key={`${item.client_id}-${item.project_id}-${item.task.id}`}
              className="border border-gray-200"
            >
              <CardContent className="p-4">
                <form
                  onSubmit={(e) =>
                    handleSubmit(e, item.client_id, item.project_id, item.task.id)
                  }
                  className="grid grid-cols-1 md:grid-cols-4 gap-5 items-center"
                >
                  {/* Task Info */}
                  <div className="md:col-span-1">
                    <div className="text-sm text-[#0073ea] mb-1">
                      {item.client_name} • {item.project_title}
                    </div>
                    <div className="font-bold text-gray-800">
                      {item.task.desc}
                    </div>
                  </div>

                  {/* Assigned To */}
                  <div className="text-gray-700">
                    👤 {item.task.assigned_to_name}
                  </div>

                  {/* Status Select */}
                  <div>
                    <Select
                      name="status"
                      defaultValue={item.task.status}
                      onValueChange={(value) => {
                        // Auto-submit on status change
                        handleStatusChange(
                          item.client_id,
                          item.project_id,
                          item.task.id,
                          value,
                          item.task.notes
                        );
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          'text-white font-bold border-none cursor-pointer',
                          statusColors[item.task.status]
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ממתין">ממתין</SelectItem>
                        <SelectItem value="בביצוע">בביצוע</SelectItem>
                        <SelectItem value="בוצע">בוצע</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes and Save */}
                  <div className="flex gap-2.5 items-center">
                    <TimeTracker
                      clientId={item.client_id}
                      projectId={item.project_id}
                      taskId={item.task.id}
                      compact={true}
                    />
                    <Input
                      type="text"
                      name="notes"
                      defaultValue={item.task.notes}
                      placeholder="הוסף הערה..."
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      className="bg-[#0073ea] hover:bg-[#005bb5]"
                      disabled={
                        updating[
                          `${item.client_id}-${item.project_id}-${item.task.id}`
                        ]
                      }
                    >
                      {updating[
                        `${item.client_id}-${item.project_id}-${item.task.id}`
                      ]
                        ? 'שומר...'
                        : 'שמור'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

