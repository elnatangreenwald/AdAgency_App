import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface ProjectSelectProps {
  clientId: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  onOptionsChange: (options: string[]) => void;
  disabled?: boolean;
}

/** Closed list of project names per client, with an option to add a new one. */
export function ProjectSelect({ clientId, options, value, onChange, onOptionsChange, disabled }: ProjectSelectProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const addProject = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const res = await apiClient.post(`/api/approvals/clients/${clientId}/projects`, { name });
      if (res.data.success) {
        onOptionsChange(res.data.project_options || []);
        onChange(res.data.name);
        setNewName('');
        setAdding(false);
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error?.response?.data?.error || 'שגיאה בהוספת הפרויקט',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (adding) {
    return (
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="שם הפרויקט החדש"
          maxLength={120}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addProject();
            }
          }}
        />
        <Button type="button" onClick={addProject} disabled={saving || !newName.trim()}>
          הוספה
        </Button>
        <Button type="button" variant="outline" onClick={() => setAdding(false)}>
          ביטול
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onChange} disabled={disabled || !clientId}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={clientId ? '-- בחר פרויקט --' : 'בחרו לקוח קודם'} />
        </SelectTrigger>
        <SelectContent>
          {options.map((p) => (
            <SelectItem key={p} value={p}>{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        onClick={() => setAdding(true)}
        disabled={disabled || !clientId}
        title="הוספת פרויקט לרשימה"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}
