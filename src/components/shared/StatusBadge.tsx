/**
 * Status Badge Component
 * Displays status with appropriate color coding
 */
import { cn } from '@/lib/utils';

type StatusType = 'task' | 'project' | 'quote' | 'payment' | 'event';

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusColors: Record<StatusType, Record<string, string>> = {
  task: {
    'לביצוע': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'בתהליך': 'bg-blue-100 text-blue-800 border-blue-200',
    'הושלם': 'bg-green-100 text-green-800 border-green-200',
    'ממתין': 'bg-gray-100 text-gray-800 border-gray-200',
    'default': 'bg-gray-100 text-gray-800 border-gray-200',
  },
  project: {
    'פעיל': 'bg-green-100 text-green-800 border-green-200',
    'בתהליך': 'bg-blue-100 text-blue-800 border-blue-200',
    'הושלם': 'bg-gray-100 text-gray-800 border-gray-200',
    'מושהה': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'default': 'bg-gray-100 text-gray-800 border-gray-200',
  },
  quote: {
    'ממתין': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'אושר': 'bg-green-100 text-green-800 border-green-200',
    'נדחה': 'bg-red-100 text-red-800 border-red-200',
    'פג תוקף': 'bg-gray-100 text-gray-800 border-gray-200',
    'default': 'bg-gray-100 text-gray-800 border-gray-200',
  },
  payment: {
    'שולם': 'bg-green-100 text-green-800 border-green-200',
    'לא שולם': 'bg-red-100 text-red-800 border-red-200',
    'חלקי': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'default': 'bg-gray-100 text-gray-800 border-gray-200',
  },
  event: {
    'פעיל': 'bg-green-100 text-green-800 border-green-200',
    'הסתיים': 'bg-gray-100 text-gray-800 border-gray-200',
    'בוטל': 'bg-red-100 text-red-800 border-red-200',
    'default': 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function StatusBadge({
  status,
  type = 'task',
  size = 'md',
  className,
}: StatusBadgeProps) {
  const colors = statusColors[type];
  const colorClass = colors[status] || colors['default'];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        colorClass,
        sizeClasses[size],
        className
      )}
    >
      {status}
    </span>
  );
}
