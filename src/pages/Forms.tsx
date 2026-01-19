import { useState, useEffect } from 'react';
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
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, Link as LinkIcon, Copy } from 'lucide-react';

interface FormField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
}

interface Form {
  id: string;
  title: string;
  fields: FormField[];
  token: string;
  client_id?: string;
  client_name?: string;
  created_at?: string;
}

export function Forms() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/forms');
      if (response.data.success) {
        setForms(response.data.forms);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת טפסים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast({
        title: 'שגיאה',
        description: 'אנא הזן כותרת טופס',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', formTitle);

      const response = await apiClient.post('/add_form', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'הטופס נוצר בהצלחה',
          variant: 'success',
        });
        setAddFormOpen(false);
        setFormTitle('');
        fetchForms();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה ביצירת הטופס',
        variant: 'destructive',
      });
    }
  };

  const copyFormLink = (token: string) => {
    const link = `${window.location.origin}/public_form/${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'הועתק',
      description: 'קישור הטופס הועתק ללוח',
      variant: 'success',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">טוען טפסים...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-[#292f4c]">טפסים</h1>
        <Button onClick={() => setAddFormOpen(true)} className="w-full md:w-auto">
          <Plus className="w-4 h-4 ml-2" />
          טופס חדש
        </Button>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            אין טפסים להצגה
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {forms.map((form) => (
            <Card key={form.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4 md:p-5">
                <h3 className="text-lg md:text-xl font-bold text-[#292f4c] mb-3">
                  {form.title}
                </h3>
                {form.client_name && (
                  <div className="text-sm text-gray-600 mb-3">
                    לקוח: {form.client_name}
                  </div>
                )}
                <div className="text-sm text-gray-500 mb-4">
                  {form.fields?.length || 0} שדות
                </div>
                <div className="bg-blue-50 p-2 md:p-3 rounded-lg border-2 border-dashed border-blue-300 mb-3">
                  <div className="text-xs text-gray-600 mb-1">קישור ציבורי:</div>
                  <div className="text-xs md:text-sm font-mono text-blue-700 break-all">
                    {`${window.location.origin}/public_form/${form.token}`}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => copyFormLink(form.token)}
                >
                  <Copy className="w-3 h-3 ml-1" />
                  העתק קישור
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Form Modal */}
      <Dialog open={addFormOpen} onOpenChange={setAddFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>יצירת טופס חדש</DialogTitle>
            <DialogDescription>
              צור טופס חדש למערכת
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddForm} className="space-y-4">
            <div className="space-y-2">
              <Label>כותרת הטופס:</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="הזן כותרת טופס..."
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddFormOpen(false)}
              >
                ביטול
              </Button>
              <Button type="submit">צור טופס</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
