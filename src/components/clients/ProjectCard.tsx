/**
 * Project Card Component
 * Displays a project with its tasks in an expandable card
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import type { Project, Client } from '@/types';

interface ProjectCardProps {
  project: Project;
  client: Client;
  users: Array<{ id: string; name: string }>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDeleteProject: (clientId: string, projectId: string) => void;
  onAddTask: (projectId: string, data: {
    title: string;
    assignee: string;
    deadline: string;
    priority: string;
    is_recurring: boolean;
  }) => void;
  onUpdateTaskStatus: (clientId: string, projectId: string, taskId: string, status: string) => void;
  onUpdateTaskDeadline: (clientId: string, projectId: string, taskId: string, deadline: string) => void;
  onDeleteTask: (clientId: string, projectId: string, taskId: string) => void;
  onOpenTaskNote: (clientId: string, projectId: string, taskId: string, note: string) => void;
  isAdminOrManager: boolean;
}

export function ProjectCard({
  project,
  client,
  users,
  isExpanded,
  onToggleExpand,
  onDeleteProject,
  onAddTask,
  onUpdateTaskStatus,
  onUpdateTaskDeadline,
  onDeleteTask,
  onOpenTaskNote,
  isAdminOrManager,
}: ProjectCardProps) {
  const projectName = project.name || project.title || 'פרויקט ללא שם';
  const taskCount = project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter((t) => t.status === 'הושלם').length || 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <CardTitle className="text-lg">{projectName}</CardTitle>
              <div className="text-sm text-gray-500 mt-1">
                {project.project_number && (
                  <span className="ml-3">מס׳ {project.project_number}</span>
                )}
                <span>
                  {completedTasks}/{taskCount} משימות הושלמו
                </span>
              </div>
            </div>
          </div>
          {isAdminOrManager && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('האם אתה בטוח שברצונך למחוק את הפרויקט?')) {
                  onDeleteProject(client.id, project.id);
                }
              }}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {/* Progress bar */}
        {taskCount > 0 && (
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3d817a] transition-all duration-300"
              style={{ width: `${(completedTasks / taskCount) * 100}%` }}
            />
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-4 pt-0 border-t">
          {/* Tasks List */}
          <div className="space-y-2 mt-4">
            {project.tasks && project.tasks.length > 0 ? (
              project.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  project={project}
                  client={client}
                  users={users}
                  onUpdateStatus={onUpdateTaskStatus}
                  onUpdateDeadline={onUpdateTaskDeadline}
                  onDelete={onDeleteTask}
                  onOpenNote={onOpenTaskNote}
                />
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                אין משימות בפרויקט זה
              </div>
            )}
          </div>

          {/* Add Task Form */}
          <TaskForm
            projectId={project.id}
            users={users}
            onSubmit={(data) => onAddTask(project.id, data)}
          />
        </CardContent>
      )}
    </Card>
  );
}
