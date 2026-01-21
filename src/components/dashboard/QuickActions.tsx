/**
 * Quick Actions Component
 * Displays quick action cards for common operations
 */
import { Card, CardContent } from '@/components/ui/card';
import { FileText, CreditCard, LucideIcon } from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
}

interface QuickActionsProps {
  onAddTask: () => void;
  onAddCharge: () => void;
}

export function QuickActions({ onAddTask, onAddCharge }: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      id: 'task',
      title: 'פתיחת משימה',
      description: 'הוסף משימה חדשה ללקוח',
      icon: FileText,
      color: 'bg-[#2b585e]',
      onClick: onAddTask,
    },
    {
      id: 'charge',
      title: 'הוספת חיוב',
      description: 'הוסף חיוב חדש ללקוח',
      icon: CreditCard,
      color: 'bg-[#14a675]',
      onClick: onAddCharge,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      <h2 className="text-xl sm:text-2xl font-bold text-[#292f4c]">פעולות מהירות</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-4xl">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.id}
              className={`${action.color} text-white cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 active:scale-95`}
              onClick={action.onClick}
            >
              <CardContent className="p-6 sm:p-10 text-center">
                <Icon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">{action.title}</h3>
                <p className="text-xs sm:text-sm opacity-90">{action.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
