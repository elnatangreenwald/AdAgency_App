/**
 * Client Header Component
 * Displays client logo, name, and basic info
 */
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';
import type { Client } from '@/types';

interface ClientHeaderProps {
  client: Client;
  users: Array<{ id: string; name: string }>;
  timeTrackingSummary: { totalHours: number; thisMonthHours: number } | null;
  isAdminOrManager: boolean;
  onToggleActive: (checked: boolean) => void;
  onUploadLogo: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ClientHeader({
  client,
  users,
  timeTrackingSummary,
  isAdminOrManager,
  onToggleActive,
  onUploadLogo,
}: ClientHeaderProps) {
  const assignedUsers = Array.isArray(client.assigned_user)
    ? client.assigned_user
    : client.assigned_user
    ? [client.assigned_user]
    : [];
  const assignedNames = assignedUsers
    .map((uid) => users.find((u) => u.id === uid)?.name || uid)
    .join(', ') || 'לא שויך';

  return (
    <Card className="relative">
      <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-[#3d817a] to-[#2d6159] rounded-t-lg" />
      <CardContent className="p-4 sm:p-6 pt-6 sm:pt-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Mobile: Switch at top */}
          {isAdminOrManager && (
            <div className="flex sm:hidden items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-200 shadow-sm self-start">
              <Switch
                id="client-active-mobile"
                checked={!client.archived}
                onCheckedChange={onToggleActive}
                className="data-[state=checked]:bg-[#3d817a]"
              />
              <Label htmlFor="client-active-mobile" className="text-sm font-medium text-[#043841] whitespace-nowrap cursor-pointer">
                לקוח פעיל
              </Label>
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 flex-1">
            {/* Logo */}
            <div
              className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#0073ea] hover:scale-105 transition-all relative overflow-hidden group flex-shrink-0"
              onClick={() => document.getElementById('logoInput')?.click()}
            >
              {client.logo_url ? (
                <img
                  src={`/static/logos/${client.logo_url}?v=${Date.now()}`}
                  alt="Logo"
                  className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-gray-400 text-xs">לחץ להעלאה</span>
              )}
              <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent text-white text-xs text-center py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                החלף לוגו
              </div>
            </div>
            <input
              type="file"
              id="logoInput"
              accept="image/*"
              className="hidden"
              onChange={onUploadLogo}
            />
            {/* Client Info */}
            <div className="flex-1 text-center sm:text-right">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#292f4c] mb-2">{client.name}</h1>
              <div className="text-sm text-gray-600 mb-1">
                מספר לקוח: {client.client_number || 'N/A'}
              </div>
              <div className="text-sm text-[#0073ea] mb-2">👤 מנהל: {assignedNames}</div>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1 text-[#00c875] font-semibold">
                  <Clock className="w-4 h-4" />
                  סה"כ שעות: {timeTrackingSummary ? timeTrackingSummary.totalHours : 0}
                </div>
                <div className="flex items-center gap-1 text-[#0073ea] font-semibold">
                  <Clock className="w-4 h-4" />
                  שעות החודש: {timeTrackingSummary ? timeTrackingSummary.thisMonthHours : 0}
                </div>
              </div>
            </div>
          </div>
          {/* Desktop: Switch at side */}
          {isAdminOrManager && (
            <div className="hidden sm:flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-200 shadow-sm flex-shrink-0">
              <Switch
                id="client-active"
                checked={!client.archived}
                onCheckedChange={onToggleActive}
                className="data-[state=checked]:bg-[#3d817a]"
              />
              <Label htmlFor="client-active" className="text-sm font-medium text-[#043841] whitespace-nowrap cursor-pointer">
                לקוח פעיל
              </Label>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
