import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Search, Download, Plus } from 'lucide-react';

interface Charge {
  id: string;
  title: string;
  amount: number;
  our_cost?: number;
  date: string;
  completed: boolean;
  charge_number?: string;
}

interface Client {
  id: string;
  name: string;
  retainer: number;
  extra_charges: Charge[];
  calculated_extra: number;
  calculated_retainer: number;
  calculated_total: number;
  calculated_open_charges: number;
  calculated_monthly_revenue: number;
}

interface FinanceData {
  clients: Client[];
  total_open_charges: number;
  total_monthly_revenue: number;
  current_month: string;
  current_year: string;
}

export function Finance() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [editRetainerOpen, setEditRetainerOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [chargeForm, setChargeForm] = useState({
    title: '',
    amount: '',
    our_cost: '',
  });
  const [retainerAmount, setRetainerAmount] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchFinanceData();
  }, [monthFilter]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const url = monthFilter && monthFilter !== 'all' ? `/api/finance?month=${monthFilter}` : '/api/finance';
      const response = await apiClient.get(url);
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Error fetching finance data:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת נתוני כספים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !chargeForm.title || !chargeForm.amount) {
      toast({
        title: 'שגיאה',
        description: 'אנא מלא את כל השדות הנדרשים',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('action', 'extra');
      formData.append('title', chargeForm.title);
      formData.append('amount', chargeForm.amount);
      if (chargeForm.our_cost) {
        formData.append('our_cost', chargeForm.our_cost);
      }

      const response = await apiClient.post(
        `/update_finance/${selectedClient.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'החיוב נוסף בהצלחה',
          variant: 'success',
        });
        setAddChargeOpen(false);
        setChargeForm({ title: '', amount: '', our_cost: '' });
        setSelectedClient(null);
        fetchFinanceData();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בהוספת החיוב',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRetainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !retainerAmount) {
      toast({
        title: 'שגיאה',
        description: 'אנא הזן סכום',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('action', 'retainer');
      formData.append('amount', retainerAmount);

      const response = await apiClient.post(
        `/update_finance/${selectedClient.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'הרטינר עודכן בהצלחה',
          variant: 'success',
        });
        setEditRetainerOpen(false);
        setRetainerAmount('');
        setSelectedClient(null);
        fetchFinanceData();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בעדכון הרטינר',
        variant: 'destructive',
      });
    }
  };

  const handleExportOpenCharges = () => {
    window.location.href = '/export_open_charges';
  };

  const handleGenerateInvoice = (clientId: string) => {
    const url = monthFilter
      ? `/generate_invoice/${clientId}?month=${monthFilter}`
      : `/generate_invoice/${clientId}`;
    window.location.href = url;
  };

  const filteredClients =
    data?.clients.filter((client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const months = [
    { value: 'all', label: 'כל החודשים' },
    { value: '01', label: 'ינואר' },
    { value: '02', label: 'פברואר' },
    { value: '03', label: 'מרץ' },
    { value: '04', label: 'אפריל' },
    { value: '05', label: 'מאי' },
    { value: '06', label: 'יוני' },
    { value: '07', label: 'יולי' },
    { value: '08', label: 'אוגוסט' },
    { value: '09', label: 'ספטמבר' },
    { value: '10', label: 'אוקטובר' },
    { value: '11', label: 'נובמבר' },
    { value: '12', label: 'דצמבר' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">טוען נתוני כספים...</div>
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
    <div className="space-y-6 sm:space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#292f4c] mb-6 sm:mb-8">
        ריכוז כספי לקוחות
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <Card className="bg-gradient-to-br from-[#d66b74] to-[#c55a65] text-white border-0">
          <CardContent className="p-5 sm:p-8">
            <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-5">כמה חייבים לנו?</h2>
            <div className="text-3xl sm:text-5xl font-bold mb-3 sm:mb-5">
              ₪{data.total_open_charges.toLocaleString()}
            </div>
            <Button
              onClick={handleExportOpenCharges}
              className="bg-white text-[#d66b74] hover:bg-gray-100 font-bold text-sm sm:text-base"
            >
              <Download className="w-4 h-4 ml-2" />
              <span className="hidden sm:inline">הורד פירוט לאקסל</span>
              <span className="sm:hidden">הורדה</span>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#28a745] to-[#218838] text-white border-0">
          <CardContent className="p-5 sm:p-8">
            <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-5">כמה הרווחנו החודש?</h2>
            <div className="text-3xl sm:text-5xl font-bold">
              ₪{data.total_monthly_revenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
            <div className="relative flex-1 min-w-0 sm:min-w-[250px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="🔍 חפש לקוח..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Label className="text-gray-600 font-bold whitespace-nowrap text-sm sm:text-base">
                חודש:
              </Label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-[140px] sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#043841] text-white">
                  <th className="p-3 text-right font-bold">לקוח</th>
                  <th className="p-3 text-right font-bold">רטינר</th>
                  <th className="p-3 text-right font-bold">חיובים נוספים</th>
                  <th className="p-3 text-right font-bold">סה"כ</th>
                  <th className="p-3 text-right font-bold">חיובים פתוחים</th>
                  <th className="p-3 text-right font-bold">הכנסות חודשיות</th>
                  <th className="p-3 text-right font-bold">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-3">
                      <Link
                        to={`/client/${client.id}`}
                        className="text-[#0073ea] hover:underline font-semibold"
                      >
                        {client.name}
                      </Link>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        ₪{client.calculated_retainer.toLocaleString()}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedClient(client);
                            setRetainerAmount(client.retainer.toString());
                            setEditRetainerOpen(true);
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          ערוך
                        </Button>
                      </div>
                    </td>
                    <td className="p-3">
                      ₪{client.calculated_extra.toLocaleString()}
                    </td>
                    <td className="p-3 font-bold">
                      ₪{client.calculated_total.toLocaleString()}
                    </td>
                    <td className="p-3 text-[#d66b74] font-semibold">
                      ₪{client.calculated_open_charges.toLocaleString()}
                    </td>
                    <td className="p-3 text-[#28a745] font-semibold">
                      ₪{client.calculated_monthly_revenue.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedClient(client);
                            setChargeForm({ title: '', amount: '', our_cost: '' });
                            setAddChargeOpen(true);
                          }}
                        >
                          <Plus className="w-3 h-3 ml-1" />
                          חיוב
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateInvoice(client.id)}
                        >
                          <Download className="w-3 h-3 ml-1" />
                          חשבונית
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Charge Modal */}
      <Dialog open={addChargeOpen} onOpenChange={setAddChargeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוספת חיוב נוסף</DialogTitle>
            <DialogDescription>
              הוסף חיוב נוסף ל{selectedClient?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCharge} className="space-y-4">
            <div className="space-y-2">
              <Label>כותרת החיוב:</Label>
              <Input
                value={chargeForm.title}
                onChange={(e) =>
                  setChargeForm({ ...chargeForm, title: e.target.value })
                }
                placeholder="הזן כותרת..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label>סכום:</Label>
              <Input
                type="number"
                value={chargeForm.amount}
                onChange={(e) =>
                  setChargeForm({ ...chargeForm, amount: e.target.value })
                }
                placeholder="הזן סכום..."
                min="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>עלות פנימית (אופציונלי):</Label>
              <Input
                type="number"
                value={chargeForm.our_cost}
                onChange={(e) =>
                  setChargeForm({ ...chargeForm, our_cost: e.target.value })
                }
                placeholder="הזן עלות פנימית..."
                min="0"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddChargeOpen(false)}
              >
                ביטול
              </Button>
              <Button type="submit">הוסף חיוב</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Retainer Modal */}
      <Dialog open={editRetainerOpen} onOpenChange={setEditRetainerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>עריכת רטינר</DialogTitle>
            <DialogDescription>
              עדכן את סכום הרטינר ל{selectedClient?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateRetainer} className="space-y-4">
            <div className="space-y-2">
              <Label>סכום רטינר:</Label>
              <Input
                type="number"
                value={retainerAmount}
                onChange={(e) => setRetainerAmount(e.target.value)}
                placeholder="הזן סכום..."
                min="0"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditRetainerOpen(false)}
              >
                ביטול
              </Button>
              <Button type="submit">עדכן רטינר</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
