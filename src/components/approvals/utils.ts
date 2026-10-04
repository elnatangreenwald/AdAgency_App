import { ApprovalStatus } from '@/types';

export const APPROVAL_STATUSES: ApprovalStatus[] = ['טיוטה', 'נשלח ללקוח', 'נדרשים תיקונים', 'אושר'];

export function approvalStatusColor(status: string) {
  switch (status) {
    case 'טיוטה':
      return 'bg-gray-100 text-gray-700';
    case 'נשלח ללקוח':
      return 'bg-cyan-100 text-cyan-800';
    case 'נדרשים תיקונים':
      return 'bg-red-100 text-red-800';
    case 'אושר':
      return 'bg-green-100 text-green-800';
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
