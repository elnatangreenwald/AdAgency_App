import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, MapPin, Users } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  type: string;
  date: string;
  location?: string;
  client_id: string;
  client_name?: string;
  is_active?: boolean;
}

export function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    type: 'כנס',
    date: '',
    location: '',
    client_id: '',
  });
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
    fetchClients();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/events');
      if (response.data.success) {
        setEvents(response.data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת אירועים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await apiClient.get('/api/clients');
      if (response.data.success) {
        setClients(response.data.clients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.date || !eventForm.client_id) {
      toast({
        title: 'שגיאה',
        description: 'אנא מלא את כל השדות הנדרשים',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', eventForm.title);
      formData.append('type', eventForm.type);
      formData.append('event_type', eventForm.type);
      formData.append('date', eventForm.date);
      if (eventForm.location) {
        formData.append('location', eventForm.location);
      }
      formData.append('client_id', eventForm.client_id);

      const response = await apiClient.post('/add_event', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'האירוע נוסף בהצלחה',
          variant: 'success',
        });
        setAddEventOpen(false);
        setEventForm({
          title: '',
          type: 'כנס',
          date: '',
          location: '',
          client_id: '',
        });
        fetchEvents();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בהוספת האירוע',
        variant: 'destructive',
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'כנס':
        return 'bg-blue-100 text-blue-700';
      case 'חתונה':
        return 'bg-pink-100 text-pink-700';
      case 'השקה':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">טוען אירועים...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#292f4c]">אירועים</h1>
        <Button onClick={() => setAddEventOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 ml-2" />
          אירוע חדש
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="p-6 sm:p-8 text-center text-gray-500">
            אין אירועים להצגה
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {events.map((event) => (
            <Card
              key={event.id}
              className="border-r-4 border-r-[#3d817a] hover:shadow-md transition-all"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3 sm:mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-[#292f4c] mb-2">
                      {event.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {event.date}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      )}
                      {event.client_name && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <Link
                            to={`/client/${event.client_id}`}
                            className="text-[#0073ea] hover:underline"
                          >
                            {event.client_name}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold self-start ${getTypeColor(
                      event.type
                    )}`}
                  >
                    {event.type}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to={`/event/${event.id}`}>פרטים</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Event Modal */}
      <Dialog open={addEventOpen} onOpenChange={setAddEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוספת אירוע חדש</DialogTitle>
            <DialogDescription>
              הוסף אירוע חדש למערכת
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="space-y-2">
              <Label>שם האירוע:</Label>
              <Input
                value={eventForm.title}
                onChange={(e) =>
                  setEventForm({ ...eventForm, title: e.target.value })
                }
                placeholder="הזן שם אירוע..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label>סוג אירוע:</Label>
              <Select
                value={eventForm.type}
                onValueChange={(value) =>
                  setEventForm({ ...eventForm, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="כנס">כנס</SelectItem>
                  <SelectItem value="חתונה">חתונה</SelectItem>
                  <SelectItem value="השקה">השקה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>תאריך:</Label>
              <Input
                type="date"
                value={eventForm.date}
                onChange={(e) =>
                  setEventForm({ ...eventForm, date: e.target.value })
                }
                required
                className="direction-ltr text-right"
              />
            </div>
            <div className="space-y-2">
              <Label>מיקום (אופציונלי):</Label>
              <Input
                value={eventForm.location}
                onChange={(e) =>
                  setEventForm({ ...eventForm, location: e.target.value })
                }
                placeholder="הזן מיקום..."
              />
            </div>
            <div className="space-y-2">
              <Label>לקוח:</Label>
              <Select
                value={eventForm.client_id}
                onValueChange={(value) =>
                  setEventForm({ ...eventForm, client_id: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="-- בחר לקוח --" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddEventOpen(false)}
              >
                ביטול
              </Button>
              <Button type="submit">הוסף אירוע</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
