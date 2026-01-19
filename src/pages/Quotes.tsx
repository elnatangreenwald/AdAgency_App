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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText } from 'lucide-react';

interface QuoteItem {
  description: string;
  quantity: number;
  price: number;
}

interface Quote {
  id: string;
  client_id: string;
  client_name?: string;
  title: string;
  items: QuoteItem[];
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  total: number;
  created_at?: string;
}

export function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [addQuoteOpen, setAddQuoteOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    title: '',
    client_id: '',
  });
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuotes();
    fetchClients();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/quotes');
      if (response.data.success) {
        setQuotes(response.data.quotes);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת הצעות מחיר',
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

  const handleAddQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.title || !quoteForm.client_id) {
      toast({
        title: 'שגיאה',
        description: 'אנא מלא את כל השדות הנדרשים',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', quoteForm.title);
      formData.append('client_id', quoteForm.client_id);

      const response = await apiClient.post('/add_quote', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'ההצעה נוספה בהצלחה',
          variant: 'success',
        });
        setAddQuoteOpen(false);
        setQuoteForm({ title: '', client_id: '' });
        fetchQuotes();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בהוספת ההצעה',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'sent':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'טיוטה';
      case 'sent':
        return 'נשלח';
      case 'approved':
        return 'אושר';
      case 'rejected':
        return 'נדחה';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">טוען הצעות מחיר...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-[#292f4c]">הצעות מחיר</h1>
        <Button onClick={() => setAddQuoteOpen(true)} className="w-full md:w-auto">
          <Plus className="w-4 h-4 ml-2" />
          הצעה חדשה
        </Button>
      </div>

      {quotes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            אין הצעות מחיר להצגה
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4 md:p-5">
                <div className="flex flex-col md:flex-row justify-between items-start gap-3 mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-bold text-[#292f4c] mb-1">
                      {quote.title}
                    </h3>
                    {quote.client_name && (
                      <div className="text-sm text-gray-600 mb-2">
                        לקוח: {quote.client_name}
                      </div>
                    )}
                    <div className="text-base md:text-lg font-bold text-[#0073ea]">
                      סה"כ: ₪{quote.total.toLocaleString()}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs md:text-sm font-bold ${getStatusColor(
                      quote.status
                    )}`}
                  >
                    {getStatusLabel(quote.status)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="w-full md:w-auto">
                    <FileText className="w-3 h-3 ml-1" />
                    צפה
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Quote Modal */}
      <Dialog open={addQuoteOpen} onOpenChange={setAddQuoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>יצירת הצעת מחיר חדשה</DialogTitle>
            <DialogDescription>
              צור הצעת מחיר חדשה ללקוח
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddQuote} className="space-y-4">
            <div className="space-y-2">
              <Label>כותרת:</Label>
              <Input
                value={quoteForm.title}
                onChange={(e) =>
                  setQuoteForm({ ...quoteForm, title: e.target.value })
                }
                placeholder="הזן כותרת..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label>לקוח:</Label>
              <Select
                value={quoteForm.client_id}
                onValueChange={(value) =>
                  setQuoteForm({ ...quoteForm, client_id: value })
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
                onClick={() => setAddQuoteOpen(false)}
              >
                ביטול
              </Button>
              <Button type="submit">צור הצעה</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
