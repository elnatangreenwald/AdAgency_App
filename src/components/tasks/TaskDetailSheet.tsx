/**
 * Task detail panel — status, deadline, notes ("what's missing"), complete
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { TimeTracker } from '@/components/TimeTracker';
import { BoardTask, TASK_STATUS_OPTIONS, formatDeadline, isOverdue } from './types';

interface TaskDetailSheetProps {
  task: BoardTask | null;
  open: boolean;
  showAssignee?: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveStatus: (task: BoardTask, status: string, deadline: string) => Promise<boolean>;
  onSaveNote: (task: BoardTask, note: string) => Promise<boolean>;
  onComplete: (task: BoardTask) => Promise<boolean>;
}

export function TaskDetailSheet({
  task,
  open,
  showAssignee = false,
  onOpenChange,
  onSaveStatus,
  onSaveNote,
  onComplete,
}: TaskDetailSheetProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('לביצוע');
  const [deadline, setDeadline] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setStatus(
        (TASK_STATUS_OPTIONS as readonly string[]).includes(task.status)
          ? task.status
          : 'לביצוע'
      );
      setDeadline(task.deadline || '');
      setNote(task.note || '');
    }
  }, [task]);

  if (!task) return null;

  const overdue = isOverdue(deadline);

  const handleSave = async () => {
    setSaving(true);
    try {
      const statusChanged = status !== task.status || deadline !== (task.deadline || '');
      const noteChanged = note !== (task.note || '');
      let ok = true;
      if (statusChanged) {
        ok = await onSaveStatus(task, status, deadline);
      } else if (deadline !== (task.deadline || '')) {
        ok = await onSaveStatus(task, status, deadline);
      }
      if (ok && noteChanged) {
        ok = await onSaveNote(task, note);
      }
      if (ok) onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      if (note !== (task.note || '')) {
        await onSaveNote(task, note);
      }
      const ok = await onComplete(task);
      if (ok) onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-right leading-snug pr-6">
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-[#f4f7f7] p-3 border-r-4 border-r-[#3d817a] space-y-1">
            <div className="text-sm">
              <span className="text-slate-500">לקוח: </span>
              <span className="font-semibold text-[#292f4c]">{task.client_name}</span>
            </div>
            <div className="text-sm text-slate-600">פרויקט: {task.project_title}</div>
            {showAssignee && (
              <div className="text-sm text-slate-600">אחראי: {task.assignee_name}</div>
            )}
            {task.is_daily_task && (
              <div className="text-xs text-[#3d817a] font-medium">משימה יומית</div>
            )}
          </div>

          <div className="space-y-2">
            <Label>סטטוס</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>תאריך לביצוע</Label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="direction-ltr text-right"
            />
            {deadline && (
              <p className={`text-xs ${overdue ? 'text-red-600' : 'text-slate-500'}`}>
                {overdue ? 'באיחור · ' : ''}
                {formatDeadline(deadline)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>מה חסר / הערות</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="מה חסר כדי להתקדם? חומרים מהלקוח, אישור, קבצים..."
              rows={5}
            />
          </div>

          <TimeTracker
            clientId={task.client_id}
            projectId={task.project_id}
            taskId={task.task_id}
            compact={false}
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/client/${task.client_id}`)}
          >
            עבור לדף הלקוח
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none border-green-600 text-green-700 hover:bg-green-50"
              disabled={saving}
              onClick={handleComplete}
            >
              סמן כהושלם
            </Button>
            <Button
              type="button"
              className="flex-1 sm:flex-none bg-[#3d817a] hover:bg-[#2b585e]"
              disabled={saving}
              onClick={handleSave}
            >
              שמור
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
