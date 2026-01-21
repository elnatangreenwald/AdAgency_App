/**
 * Task Form Component
 * Form for adding new tasks to a project
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface TaskFormProps {
  projectId: string;
  users: Array<{ id: string; name: string }>;
  onSubmit: (data: {
    title: string;
    assignee: string;
    deadline: string;
    priority: string;
    is_recurring: boolean;
  }) => void;
  formKey?: number;
}

export function TaskForm({ projectId, users, onSubmit, formKey = 0 }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isRecurring, setIsRecurring] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title,
      assignee,
      deadline,
      priority,
      is_recurring: isRecurring,
    });

    // Reset form
    setTitle('');
    setAssignee('');
    setDeadline('');
    setPriority('medium');
    setIsRecurring(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-end mt-3">
      <div className="flex-1">
        <Input
          type="text"
          placeholder="משימה חדשה..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full"
          required
        />
      </div>
      
      <Select value={assignee} onValueChange={setAssignee}>
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="אחראי" />
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="w-[130px]"
        />
        <div className="flex items-center gap-1">
          <Checkbox
            id={`recurring-${projectId}`}
            checked={isRecurring}
            onCheckedChange={(checked) => setIsRecurring(checked === true)}
          />
          <Label htmlFor={`recurring-${projectId}`} className="text-xs whitespace-nowrap">
            יומית
          </Label>
        </div>
      </div>

      <Select value={priority} onValueChange={setPriority}>
        <SelectTrigger className="w-full sm:w-[100px]">
          <SelectValue placeholder="עדיפות" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="low">נמוכה</SelectItem>
          <SelectItem value="medium">בינונית</SelectItem>
          <SelectItem value="high">גבוהה</SelectItem>
          <SelectItem value="urgent">דחוף</SelectItem>
        </SelectContent>
      </Select>

      <Button type="submit" size="sm" className="bg-[#3d817a] hover:bg-[#2d6159]">
        <Plus className="h-4 w-4 ml-1" />
        הוסף
      </Button>
    </form>
  );
}
