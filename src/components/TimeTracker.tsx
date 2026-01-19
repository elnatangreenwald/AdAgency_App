import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Play, Square, Clock, AlertCircle } from 'lucide-react';

interface TimeTrackerProps {
  clientId: string;
  projectId: string;
  taskId: string;
  compact?: boolean;
  onStop?: () => void; // Callback when time tracking stops
}

interface ActiveSession {
  id: string;
  user_id: string;
  client_id: string;
  project_id: string;
  task_id: string;
  start_time: string;
  elapsed_seconds?: number;
}

export function TimeTracker({ clientId, projectId, taskId, compact = false, onStop }: TimeTrackerProps) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderShown, setReminderShown] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reminderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkActiveSession();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [clientId, projectId, taskId]);

  // Ref לשמירת מצב התזכורת בתוך ה-interval (למניעת stale closure)
  const reminderShownRef = useRef(false);
  
  // סנכרון ה-ref עם ה-state
  useEffect(() => {
    reminderShownRef.current = reminderShown;
  }, [reminderShown]);

  useEffect(() => {
    if (activeSession && activeSession.task_id === taskId) {
      // עדכון זמן כל שנייה
      intervalRef.current = setInterval(() => {
        if (activeSession.start_time) {
          const start = new Date(activeSession.start_time);
          const now = new Date();
          const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
          setElapsedSeconds(elapsed);
          
          // בדיקה אם עברה שעה (3600 שניות) והתזכורת עדיין לא הוצגה
          if (elapsed >= 3600 && !reminderShownRef.current) {
            setShowReminder(true);
            setReminderShown(true);
          }
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (reminderTimeoutRef.current) {
        clearTimeout(reminderTimeoutRef.current);
        reminderTimeoutRef.current = null;
      }
      setElapsedSeconds(0);
      setReminderShown(false);
      setShowReminder(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (reminderTimeoutRef.current) {
        clearTimeout(reminderTimeoutRef.current);
      }
    };
  }, [activeSession, taskId]);

  const checkActiveSession = async () => {
    try {
      const response = await apiClient.get('/api/time_tracking/active');
      if (response.data.success && response.data.active_session) {
        const session = response.data.active_session;
        // בדיקה אם המדידה הפעילה היא עבור המשימה הזו
        if (session.task_id === taskId && session.client_id === clientId && session.project_id === projectId) {
          setActiveSession(session);
          if (session.elapsed_seconds) {
            setElapsedSeconds(session.elapsed_seconds);
          }
        } else {
          setActiveSession(null);
        }
      } else {
        setActiveSession(null);
      }
    } catch (error) {
      console.error('Error checking active session:', error);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/time_tracking/start', {
        client_id: clientId,
        project_id: projectId,
        task_id: taskId,
      });

      if (response.data.success) {
        // איפוס תזכורת כשמתחילה מדידה חדשה
        setReminderShown(false);
        setShowReminder(false);
        reminderShownRef.current = false;
        
        setActiveSession(response.data.session);
        setElapsedSeconds(0);
        toast({
          title: 'מדידת זמן התחילה',
          description: 'המדידה פעילה כעת',
          variant: 'success',
        });
      } else {
        if (response.data.active_session) {
          toast({
            title: 'יש מדידה פעילה אחרת',
            description: 'עצור את המדידה הקודמת לפני התחלת מדידה חדשה',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'שגיאה',
            description: response.data.error || 'שגיאה בהתחלת מדידת זמן',
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      console.error('Error starting time tracking:', error);
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בהתחלת מדידת זמן',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!activeSession) return;

    setLoading(true);
    try {
      const response = await apiClient.post('/api/time_tracking/stop', {
        note: note,
      });

      if (response.data.success) {
        setActiveSession(null);
        setElapsedSeconds(0);
        setNote('');
        setShowNoteInput(false);
        toast({
          title: 'מדידת זמן נעצרה',
          description: `נמדדו ${response.data.entry.duration_hours} שעות`,
          variant: 'success',
        });
        // Call callback if provided
        if (onStop) {
          onStop();
        }
      } else {
        toast({
          title: 'שגיאה',
          description: response.data.error || 'שגיאה בעצירת מדידת זמן',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error stopping time tracking:', error);
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בעצירת מדידת זמן',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHours = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} שעות ו-${minutes} דקות`;
    }
    return `${minutes} דקות`;
  };

  const handleContinue = () => {
    setShowReminder(false);
  };

  const handleStopFromReminder = async () => {
    setShowReminder(false);
    await handleStop();
  };

  const isActive = activeSession && activeSession.task_id === taskId;

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-2">
          {isActive ? (
            <>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleStop}
                disabled={loading}
                className="h-7 px-2 text-xs"
              >
                <Square className="w-3 h-3 ml-1" />
                עצור
              </Button>
              <div className="flex items-center gap-1 text-sm font-mono text-[#0073ea]">
                <Clock className="w-3 h-3" />
                {formatTime(elapsedSeconds)}
              </div>
            </>
          ) : (
            <Button
              size="sm"
              variant="default"
              onClick={handleStart}
              disabled={loading}
              className="h-7 px-2 text-xs bg-[#00c875] hover:bg-[#00b368]"
            >
              <Play className="w-3 h-3 ml-1" />
              התחל
            </Button>
          )}
        </div>
        
        {/* Reminder Dialog */}
        <Dialog open={showReminder} onOpenChange={setShowReminder}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-right">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                תזכורת - מדידת זמן פעילה
              </DialogTitle>
              <DialogDescription className="text-right">
                מדידת הזמן פעילה כבר {formatHours(elapsedSeconds)}.
                האם ברצונך להמשיך או לעצור את המדידה?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center">
              <div className="text-3xl font-mono font-bold text-[#0073ea] mb-2">
                {formatTime(elapsedSeconds)}
              </div>
              <div className="text-sm text-gray-500">
                זמן מצטבר
              </div>
            </div>
            <DialogFooter className="flex-row-reverse gap-2">
              <Button
                variant="default"
                onClick={handleContinue}
                className="bg-[#00c875] hover:bg-[#00b368]"
              >
                המשך מדידה
              </Button>
              <Button
                variant="destructive"
                onClick={handleStopFromReminder}
                disabled={loading}
              >
                <Square className="w-4 h-4 ml-2" />
                עצור מדידה
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#0073ea]" />
            <span className="font-semibold text-gray-800">מדידת זמן עבודה</span>
          </div>
          {isActive && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">פעיל</span>
            </div>
          )}
        </div>

        {isActive ? (
          <div className="space-y-3">
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-mono font-bold text-[#0073ea]">
                {formatTime(elapsedSeconds)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                זמן מצטבר
              </div>
            </div>

            {showNoteInput && (
              <div className="space-y-2">
                <Textarea
                  placeholder="הוסף הערה (אופציונלי)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleStop}
                disabled={loading}
                className="flex-1"
              >
                <Square className="w-4 h-4 ml-2" />
                עצור מדידה
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNoteInput(!showNoteInput)}
                className="flex-1"
              >
                {showNoteInput ? 'הסתר הערה' : 'הוסף הערה'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Button
              variant="default"
              onClick={handleStart}
              disabled={loading}
              className="bg-[#00c875] hover:bg-[#00b368] text-white"
              size="lg"
            >
              <Play className="w-5 h-5 ml-2" />
              התחל מדידת זמן
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              לחץ כדי להתחיל למדוד זמן עבודה על משימה זו
            </p>
          </div>
        )}
      </div>

      {/* Reminder Dialog */}
      <Dialog open={showReminder} onOpenChange={setShowReminder}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              תזכורת - מדידת זמן פעילה
            </DialogTitle>
            <DialogDescription className="text-right">
              מדידת הזמן פעילה כבר {formatHours(elapsedSeconds)}.
              האם ברצונך להמשיך או לעצור את המדידה?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="text-3xl font-mono font-bold text-[#0073ea] mb-2">
              {formatTime(elapsedSeconds)}
            </div>
            <div className="text-sm text-gray-500">
              זמן מצטבר
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              variant="default"
              onClick={handleContinue}
              className="bg-[#00c875] hover:bg-[#00b368]"
            >
              המשך מדידה
            </Button>
            <Button
              variant="destructive"
              onClick={handleStopFromReminder}
              disabled={loading}
            >
              <Square className="w-4 h-4 ml-2" />
              עצור מדידה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

