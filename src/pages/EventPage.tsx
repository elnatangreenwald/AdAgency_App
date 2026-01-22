import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowRight,
  Calendar,
  MapPin,
  Users,
  CheckSquare,
  FileText,
  DollarSign,
  Package,
  Truck,
  Edit,
  Trash2,
  Plus,
  Save,
} from 'lucide-react';

interface ChecklistItem {
  task: string;
  completed: boolean;
}

interface Charge {
  description: string;
  amount: number;
  our_cost?: number;
}

interface Supplier {
  supplier_id: string;
  supplier_name: string;
  service: string;
  cost?: number;
  notes?: string;
}

interface EventData {
  id: string;
  title: string;
  name: string;
  type: string;
  event_type: string;
  date: string;
  location?: string;
  client_id: string;
  client_name?: string;
  notes?: string;
  checklist: ChecklistItem[];
  charges: Charge[];
  suppliers: Supplier[];
  equipment: Array<{ name: string; quantity: number }>;
  graphics_items: Array<{ name: string; status: string }>;
  is_active?: boolean;
}

type TabType = 'details' | 'checklist' | 'suppliers' | 'charges' | 'notes';

export function EventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);
  
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    date: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/event/${eventId}`);
      if (response.data.success) {
        setEvent(response.data.event);
        setTotalBudget(response.data.total_budget || 0);
        setTotalExpenses(response.data.total_expenses || 0);
        setProfitMargin(response.data.profit_margin || 0);
        setEditForm({
          name: response.data.event.name || response.data.event.title || '',
          date: response.data.event.date || '',
          location: response.data.event.location || '',
          notes: response.data.event.notes || '',
        });
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת פרטי האירוע',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistToggle = async (index: number) => {
    if (!event) return;
    
    const updatedChecklist = [...event.checklist];
    updatedChecklist[index].completed = !updatedChecklist[index].completed;
    
    try {
      const formData = new FormData();
      formData.append('checklist', JSON.stringify(updatedChecklist));
      
      await apiClient.post(`/update_event_checklist/${eventId}`, formData);
      
      setEvent({ ...event, checklist: updatedChecklist });
    } catch (error) {
      console.error('Error updating checklist:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בעדכון הצ\'ק-ליסט',
        variant: 'destructive',
      });
    }
  };

  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim() || !eventId) return;
    
    try {
      const formData = new FormData();
      formData.append('new_item', newChecklistItem.trim());
      formData.append('tab', 'checklist');
      
      await apiClient.post(`/add_checklist_item/${eventId}`, formData);
      
      setNewChecklistItem('');
      fetchEventDetails();
      
      toast({
        title: 'הצלחה',
        description: 'הפריט נוסף בהצלחה',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error adding checklist item:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בהוספת פריט',
        variant: 'destructive',
      });
    }
  };

  const handleSaveDetails = async () => {
    if (!eventId) return;
    
    try {
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('date', editForm.date);
      formData.append('location', editForm.location);
      formData.append('notes', editForm.notes);
      formData.append('tab', 'details');
      
      await apiClient.post(`/update_event/${eventId}`, formData);
      
      setIsEditing(false);
      fetchEventDetails();
      
      toast({
        title: 'הצלחה',
        description: 'הפרטים נשמרו בהצלחה',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error saving details:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בשמירת הפרטים',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">טוען פרטי אירוע...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-lg text-gray-600">האירוע לא נמצא</div>
        <Button onClick={() => navigate('/events')}>
          <ArrowRight className="w-4 h-4 ml-2" />
          חזרה לאירועים
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'details', label: 'פרטים', icon: FileText },
    { id: 'checklist', label: 'צ\'ק-ליסט', icon: CheckSquare },
    { id: 'suppliers', label: 'ספקים', icon: Truck },
    { id: 'charges', label: 'תקציב', icon: DollarSign },
    { id: 'notes', label: 'הערות', icon: Edit },
  ];

  const completedTasks = event.checklist.filter((item) => item.completed).length;
  const totalTasks = event.checklist.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/events')}>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#292f4c]">
            {event.title || event.name}
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
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
              <Link to={`/client/${event.client_id}`} className="text-[#0073ea] hover:underline">
                {event.client_name}
              </Link>
            </div>
          )}
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
            {event.type || event.event_type}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3d817a] transition-all"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {completedTasks}/{totalTasks} משימות ({completionPercentage}%)
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.id as TabType)}
              className="whitespace-nowrap"
            >
              <Icon className="w-4 h-4 ml-1" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Tab Content */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          {activeTab === 'details' && (
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label>שם האירוע</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>תאריך</Label>
                    <Input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>מיקום</Label>
                    <Input
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveDetails}>
                      <Save className="w-4 h-4 ml-1" />
                      שמור
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      ביטול
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500">שם האירוע</Label>
                      <p className="font-medium">{event.title || event.name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">סוג אירוע</Label>
                      <p className="font-medium">{event.type || event.event_type}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">תאריך</Label>
                      <p className="font-medium">{event.date}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">מיקום</Label>
                      <p className="font-medium">{event.location || 'לא צוין'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">לקוח</Label>
                      <p className="font-medium">
                        {event.client_name ? (
                          <Link to={`/client/${event.client_id}`} className="text-[#0073ea] hover:underline">
                            {event.client_name}
                          </Link>
                        ) : (
                          'לא משויך'
                        )}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 ml-1" />
                    ערוך פרטים
                  </Button>
                </>
              )}
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="הוסף משימה חדשה..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                />
                <Button onClick={handleAddChecklistItem}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {event.checklist.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">אין משימות בצ'ק-ליסט</p>
                ) : (
                  event.checklist.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        item.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => handleChecklistToggle(index)}
                      />
                      <span className={item.completed ? 'line-through text-gray-400' : ''}>
                        {item.task}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div className="space-y-4">
              {event.suppliers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">אין ספקים משויכים לאירוע</p>
              ) : (
                <div className="space-y-3">
                  {event.suppliers.map((supplier, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold">{supplier.supplier_name}</h4>
                          <p className="text-sm text-gray-600">{supplier.service}</p>
                          {supplier.notes && (
                            <p className="text-sm text-gray-500 mt-1">{supplier.notes}</p>
                          )}
                        </div>
                        {supplier.cost && (
                          <span className="text-lg font-bold text-[#3d817a]">
                            ₪{supplier.cost.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'charges' && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">תקציב כולל</p>
                  <p className="text-2xl font-bold text-blue-700">₪{totalBudget.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-600">הוצאות</p>
                  <p className="text-2xl font-bold text-orange-700">₪{totalExpenses.toLocaleString()}</p>
                </div>
                <div className={`p-4 rounded-lg ${profitMargin >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className={`text-sm ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>רווח</p>
                  <p className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    ₪{profitMargin.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Charges List */}
              {event.charges.length === 0 ? (
                <p className="text-gray-500 text-center py-4">אין חיובים באירוע</p>
              ) : (
                <div className="space-y-3">
                  {event.charges.map((charge, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{charge.description}</span>
                        <div className="text-right">
                          <p className="font-bold text-[#3d817a]">₪{charge.amount.toLocaleString()}</p>
                          {charge.our_cost !== undefined && charge.our_cost > 0 && (
                            <p className="text-sm text-gray-500">עלות: ₪{charge.our_cost.toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <Textarea
                    placeholder="הערות לאירוע..."
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={6}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveDetails}>
                      <Save className="w-4 h-4 ml-1" />
                      שמור
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      ביטול
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="min-h-[150px] p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                    {event.notes || 'אין הערות'}
                  </div>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 ml-1" />
                    ערוך הערות
                  </Button>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
