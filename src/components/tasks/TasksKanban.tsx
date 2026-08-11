/**
 * Kanban board for open tasks — drag between status columns
 */
import { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { BoardTask, BOARD_STATUSES, BoardStatus, normalizeBoardStatus } from './types';
import { TaskBoardCard } from './TaskBoardCard';

interface TasksKanbanProps {
  tasks: BoardTask[];
  showAssignee?: boolean;
  onTaskClick: (task: BoardTask) => void;
  onStatusChange: (task: BoardTask, newStatus: string) => void;
}

function Column({
  status,
  tasks,
  showAssignee,
  onTaskClick,
}: {
  status: BoardStatus;
  tasks: BoardTask[];
  showAssignee?: boolean;
  onTaskClick: (task: BoardTask) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[260px] w-[280px] sm:w-[300px] shrink-0 rounded-xl bg-[#f4f7f7] border border-transparent ${
        isOver ? 'border-[#3d817a]/50 bg-[#e8f3f1]' : ''
      }`}
    >
      <div className="sticky top-0 z-[1] flex items-center justify-between px-3 py-3 border-b border-slate-200/80 bg-[#f4f7f7]/95 backdrop-blur rounded-t-xl">
        <h3 className="text-sm font-semibold text-[#292f4c]">{status}</h3>
        <span className="text-xs font-medium text-slate-500 bg-white rounded-full px-2 py-0.5 border border-slate-200">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-2 min-h-[120px] max-h-[calc(100vh-280px)] overflow-y-auto">
        <SortableContext
          items={tasks.map((t) => t.task_id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskBoardCard
              key={task.task_id}
              task={task}
              showAssignee={showAssignee}
              onClick={onTaskClick}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="text-center text-xs text-slate-400 py-8">אין משימות</div>
        )}
      </div>
    </div>
  );
}

export function TasksKanban({
  tasks,
  showAssignee = false,
  onTaskClick,
  onStatusChange,
}: TasksKanbanProps) {
  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const columns = useMemo(() => {
    const map: Record<BoardStatus, BoardTask[]> = {
      לביצוע: [],
      'הועבר לדיגיטל': [],
      'נשלח ללקוח': [],
    };
    for (const task of tasks) {
      const status = normalizeBoardStatus(task.status);
      map[status].push(task);
    }
    return map;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as BoardTask | undefined;
    setActiveTask(task || tasks.find((t) => t.task_id === event.active.id) || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const task =
      (active.data.current?.task as BoardTask | undefined) ||
      tasks.find((t) => t.task_id === active.id);
    if (!task) return;

    let targetStatus: string | null = null;
    if ((BOARD_STATUSES as readonly string[]).includes(String(over.id))) {
      targetStatus = String(over.id);
    } else {
      const overTask = tasks.find((t) => t.task_id === over.id);
      if (overTask) {
        targetStatus = normalizeBoardStatus(overTask.status);
      }
    }

    if (!targetStatus) return;
    if (normalizeBoardStatus(task.status) === targetStatus) return;
    onStatusChange(task, targetStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {BOARD_STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={columns[status]}
            showAssignee={showAssignee}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="w-[280px]">
            <TaskBoardCard
              task={activeTask}
              showAssignee={showAssignee}
              onClick={() => {}}
              isDraggingOverlay
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
