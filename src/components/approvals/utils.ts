import { ApprovalStatus } from '@/types';

export const ST_DRAFT: ApprovalStatus = 'טיוטה';
export const ST_WAITING: ApprovalStatus = 'ממתין לאישור לקוח';
export const ST_COMMENT: ApprovalStatus = 'נשלחה הערת לקוח';
export const ST_APPROVED: ApprovalStatus = 'מאושר לקוח';
export const ST_LIVE: ApprovalStatus = 'עלה לאוויר';

export const APPROVAL_STATUSES: ApprovalStatus[] = [ST_DRAFT, ST_WAITING, ST_COMMENT, ST_APPROVED, ST_LIVE];

export const APPROVAL_STATUS_DESCRIPTIONS: Record<ApprovalStatus, string> = {
  [ST_DRAFT]: 'הלקוח לא רואה את הפריט',
  [ST_WAITING]: 'הפריט מוצג ללקוח וממתין לאישור או להערה',
  [ST_COMMENT]: 'הלקוח שלח הערות לתיקון',
  [ST_APPROVED]: 'הלקוח אישר את החומרים',
  [ST_LIVE]: 'החומרים פורסמו',
};

export function approvalStatusColor(status: string) {
  switch (status) {
    case ST_DRAFT:
      return 'bg-gray-100 text-gray-700';
    case ST_WAITING:
      return 'bg-cyan-100 text-cyan-800';
    case ST_COMMENT:
      return 'bg-red-100 text-red-800';
    case ST_APPROVED:
      return 'bg-green-100 text-green-800';
    case ST_LIVE:
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  }
}

export function compareHebrew(a: string, b: string) {
  return (a || '').trim().localeCompare((b || '').trim(), 'he', { sensitivity: 'base' });
}

export function sortByName<T extends { name: string }>(items: T[]) {
  return [...items].sort((a, b) => compareHebrew(a.name, b.name));
}
