import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import heLocale from '@fullcalendar/core/locales/he';
import { CalendarOptions } from '@fullcalendar/core';

interface TaskStats {
  user_id: string;
  user_name: string;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  overloaded?: boolean;
}

interface DashboardData {
  task_stats: TaskStats[];
  calendar_events: any[];
  monthly_revenue: number;
  total_clients: number;
  active_projects: number;
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/admin/dashboard');
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת נתוני הדשבורד',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: heLocale,
    direction: 'rtl',
    headerToolbar: {
      right: 'prev,next today',
      center: 'title',
      left: 'dayGridMonth',
    },
    events: data?.calendar_events || [],
    height: 'auto',
    buttonText: {
      today: 'היום',
      month: 'חודש',
    },
    firstDay: 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">טוען דשבורד מנהלים...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-600">שגיאה בטעינת הנתונים</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold text-[#292f4c]">דוח מנהלים</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        <Card>
          <CardHeader className="p-3 md:p-6 pb-2">
            <CardTitle className="text-sm md:text-lg">לקוחות פעילים</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-2xl md:text-3xl font-bold text-[#0073ea]">
              {data.total_clients}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 md:p-6 pb-2">
            <CardTitle className="text-sm md:text-lg">פרויקטים פעילים</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-2xl md:text-3xl font-bold text-[#3d817a]">
              {data.active_projects}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 md:p-6 pb-2">
            <CardTitle className="text-sm md:text-lg">הכנסות חודשיות</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-2xl md:text-3xl font-bold text-[#28a745]">
              ₪{data.monthly_revenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 md:p-6 pb-2">
            <CardTitle className="text-sm md:text-lg">סה"כ משימות</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="text-2xl md:text-3xl font-bold text-[#292f4c]">
              {data.task_stats.reduce((sum, stat) => sum + stat.total_tasks, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Statistics by User */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">פילוח משימות לפי עובד</CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {data.task_stats.map((stat) => (
              <Card
                key={stat.user_id}
                className={stat.overloaded ? 'border-red-300 bg-red-50' : ''}
              >
                <CardContent className="p-3 md:p-4">
                  <div className="text-sm md:text-lg font-bold text-[#292f4c] mb-2">
                    {stat.user_name}
                  </div>
                  <div className="space-y-1 text-xs md:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">סה"כ:</span>
                      <span className="font-bold">{stat.total_tasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">הושלמו:</span>
                      <span className="font-bold text-green-600">
                        {stat.completed_tasks}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ממתינים:</span>
                      <span className="font-bold text-orange-600">
                        {stat.pending_tasks}
                      </span>
                    </div>
                    {stat.overloaded && (
                      <div className="mt-2 text-xs text-red-600 font-bold">
                        ⚠️ עומס יתר
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">לוח שנה - משימות</CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-6 pt-0 overflow-x-auto">
          <div className="min-w-[300px]">
            <FullCalendar {...calendarOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
