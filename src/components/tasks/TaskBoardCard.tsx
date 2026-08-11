/**
 * Compact task card for the Kanban board
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BoardTask,
  formatDeadline,
  isOverdue,
  priorityAccent,
  priorityLabel,
} from './types';

interface TaskCardVisualProps {
  task: BoardTask;
  showAssignee?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  dragHandleProps?: Record<string, unknown>;
  innerRef?: (node: HTMLElement | null) => void;
}

function TaskCardVisual({
  task,
  showAssignee = false,
  className,
  style,
  onClick,
  dragHandleProps,
  innerRef,
}: TaskCardVisualProps) {
  const overdue = isOverdue(task.deadline);

  return (
    <button
      type="button"
      ref={innerRef as React.Ref<HTMLButtonElement>}
      style={{
        ...style,
        borderRightColor: priorityAccent(task.priority),
      }}
      className={cn(
        'w-full text-right rounded-lg border border-slate-200 bg-white p-3 shadow-sm',
        'border-r-4 transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#3d817a]/40',
        className
      )}
      onClick={onClick}
      {...dragHandleProps}
    >
      <div className="font-medium text-[#292f4c] text-sm leading-snug line-clamp-2">
        {task.title}
      </div>
      <div className="mt-1.5 text-xs text-slate-500 truncate">
        {task.client_name}
        {task.project_title ? ` · ${task.project_title}` : ''}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
        {task.deadline ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded px-1.5 py-0.5',
              overdue
                ? 'bg-red-50 text-red-600'
                : 'bg-slate-100 text-slate-600'
            )}
          >
            <Calendar className="w-3 h-3" />
            {formatDeadline(task.deadline)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 text-amber-700 px-1.5 py-0.5">
            ללא תאריך
          </span>
        )}

        <span
          className="inline-flex items-center rounded px-1.5 py-0.5 text-white"
          style={{ backgroundColor: priorityAccent(task.priority) }}
        >
          {priorityLabel(task.priority)}
        </span>

        {task.note ? (
          <span className="inline-flex items-center gap-1 text-[#0073ea]">
            <MessageSquare className="w-3 h-3" />
          </span>
        ) : null}

        {showAssignee ? (
          <span className="inline-flex items-center gap-1 text-slate-500 truncate max-w-full">
            <User className="w-3 h-3 shrink-0" />
            <span className="truncate">{task.assignee_name || 'ללא אחראי'}</span>
          </span>
        ) : null}
      </div>
    </button>
  );
}

interface TaskBoardCardProps {
  task: BoardTask;
  showAssignee?: boolean;
  onClick: (task: BoardTask) => void;
  isDraggingOverlay?: boolean;
}

function SortableTaskBoardCard({
  task,
  showAssignee = false,
  onClick,
}: Omit<TaskBoardCardProps, 'isDraggingOverlay'>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.task_id,
    data: { task },
  });

  return (
    <TaskCardVisual
      task={task}
      showAssignee={showAssignee}
      innerRef={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        isDragging && 'opacity-40',
        'cursor-grab active:cursor-grabbing'
      )}
      onClick={() => onClick(task)}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
  );
}

export function TaskBoardCard({
  task,
  showAssignee = false,
  onClick,
  isDraggingOverlay = false,
}: TaskBoardCardProps) {
  if (isDraggingOverlay) {
    return (
      <TaskCardVisual
        task={task}
        showAssignee={showAssignee}
        className="opacity-90 shadow-lg ring-2 ring-[#3d817a]/30 cursor-grabbing"
      />
    );
  }

  return (
    <SortableTaskBoardCard
      task={task}
      showAssignee={showAssignee}
      onClick={onClick}
    />
  );
}
