/**
 * Types for the Tasks board page
 */

/** עמודות בלוח Kanban (בלי "הועבר לסטודיו") */
export const BOARD_STATUSES = [
  'לביצוע',
  'הועבר לדיגיטל',
  'נשלח ללקוח',
] as const;

export type BoardStatus = (typeof BOARD_STATUSES)[number];

/** אפשרויות סטטוס בטפסים — כולל סטטוסים ישנים לתאימות */
export const TASK_STATUS_OPTIONS = [
  'לביצוע',
  'הועבר לסטודיו',
  'הועבר לדיגיטל',
  'נשלח ללקוח',
  'הושלם',
] as const;

export interface BoardTask {
  task_id: string;
  title: string;
  status: string;
  priority: string;
  deadline: string;
  note: string;
  client_id: string;
  client_name: string;
  project_id: string;
  project_title: string;
  assignee_id: string;
  assignee_name: string;
  is_daily_task: boolean;
  created_at: string;
}

export type TasksViewMode = 'board' | 'list';

export function normalizeBoardStatus(status: string): BoardStatus {
  if ((BOARD_STATUSES as readonly string[]).includes(status)) {
    return status as BoardStatus;
  }
  // "הועבר לסטודיו" וסטטוסים אחרים מוצגים בעמודת לביצוע
  return 'לביצוע';
}

export function formatDeadline(deadline: string): string {
  if (!deadline) return '';
  const date = deadline.includes('T') ? deadline.split('T')[0] : deadline;
  const [y, m, d] = date.split('-');
  if (!y || !m || !d) return date;
  return `${d}/${m}/${y}`;
}

export function isOverdue(deadline: string): boolean {
  if (!deadline) return false;
  const date = deadline.includes('T') ? deadline.split('T')[0] : deadline;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return date < todayStr;
}

export function priorityLabel(priority: string): string {
  const map: Record<string, string> = {
    low: 'נמוכה',
    medium: 'בינונית',
    high: 'גבוהה',
    urgent: 'דחוף',
    נמוכה: 'נמוכה',
    רגילה: 'בינונית',
    בינונית: 'בינונית',
    גבוהה: 'גבוהה',
    דחוף: 'דחוף',
  };
  return map[priority] || 'בינונית';
}

export function priorityAccent(priority: string): string {
  const key = priority || 'medium';
  if (key === 'urgent' || key === 'דחוף') return '#ef4444';
  if (key === 'high' || key === 'גבוהה') return '#f59e0b';
  if (key === 'low' || key === 'נמוכה') return '#94a3b8';
  return '#3b82f6';
}
