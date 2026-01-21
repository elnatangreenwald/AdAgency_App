/**
 * Calendar Widget Component
 * Displays a FullCalendar with tasks
 */
import { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listWeekPlugin from '@fullcalendar/list';
import { Card, CardContent } from '@/components/ui/card';
import type { EventInput, EventClickArg } from '@fullcalendar/core';

interface CalendarTask {
  id: string;
  title: string;
  start: string;
  client_name: string;
  project_title: string;
  assignee_name: string;
  status: string;
  client_id: string;
  project_id: string;
  task_id: string;
}

interface CalendarWidgetProps {
  tasks: CalendarTask[];
  onTaskClick: (taskInfo: CalendarTask) => void;
}

// Generate consistent color for each client based on ID
const getClientColor = (clientId: string): string => {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // orange
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // dark orange
    '#6366f1', // indigo
    '#14b8a6', // teal
    '#a855f7', // dark purple
    '#22c55e', // light green
    '#eab308', // yellow
    '#f43f5e', // dark pink
  ];

  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = clientId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

export function CalendarWidget({ tasks, onTaskClick }: CalendarWidgetProps) {
  const calendarRef = useRef<FullCalendar>(null);

  const calendarEvents: EventInput[] = tasks.map((task) => ({
    id: task.task_id,
    title: task.title,
    start: task.start,
    color: getClientColor(task.client_id),
    backgroundColor: getClientColor(task.client_id),
    borderColor: getClientColor(task.client_id),
    extendedProps: task,
  }));

  const handleEventClick = (clickInfo: EventClickArg) => {
    const taskInfo = clickInfo.event.extendedProps as CalendarTask;
    onTaskClick(taskInfo);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <h2 className="text-xl sm:text-2xl font-bold text-[#292f4c]">לוח שנה - משימות</h2>
      <Card>
        <CardContent className="p-2 sm:p-6 overflow-x-auto">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, listWeekPlugin]}
            initialView="dayGridMonth"
            locale="he"
            direction="rtl"
            headerToolbar={{
              right: 'prev,next today',
              center: 'title',
              left: 'dayGridMonth,listWeek',
            }}
            validRange={{
              start: '2020-01-01',
            }}
            events={calendarEvents}
            eventClick={handleEventClick}
            height="auto"
            dayMaxEventRows={3}
            buttonText={{
              today: 'היום',
              month: 'חודש',
              week: 'שבוע',
              day: 'יום',
              list: 'רשימה',
            }}
            firstDay={0}
            views={{
              listWeek: {
                titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
                listDayFormat: { weekday: 'long', day: 'numeric', month: 'long' },
                listDaySideFormat: false,
                duration: { days: 7 },
              },
            }}
            eventDisplay="block"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
