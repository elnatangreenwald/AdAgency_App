import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Textarea } from '@/components/ui/textarea';
import { Search, Download, Plus, ChevronDown, ChevronUp, Calendar, Archive } from 'lucide-react';

interface Charge {
  id: string;
  title?: string;
  description?: string;
  amount: number;
  our_cost?: number;
  date: string;
  completed?: boolean;
  paid?: boolean;
  charge_number?: string;
  notes?: string;
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
  retainer_payments?: Record<string, boolean>;
  /** מלא רק במיפוי לתצוגה: חודשים פתוחים (מפתחות "01"–"12") בתצוגת כל החודשים */
  open_retainer_month_keys?: string[];
}

interface FinanceData {
  clients: Client[];
  total_open_charges: number;
  total_monthly_revenue: number;
  current_month: string;
  current_year: string;
}

const HEBREW_MONTH_NAMES = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר',
];

/** מפתח חודש "01"–"12" → שם בעברית */
function hebrewMonthName(monthKey: string): string {
  const idx = parseInt(monthKey, 10) - 1;
  if (idx < 0 || idx > 11) return monthKey;
  return HEBREW_MONTH_NAMES[idx];
}

/**
 * בתצוגת "כל החודשים": כל חודש מתחילת השנה עד החודש הנוכחי שבו הרטיינר לא סומן כשולם.
 */
function getOpenRetainerMonthKeysYtd(
  retainer: number,
  retainerPayments: Record<string, boolean> | undefined,
  reference: Date
): string[] {
  if (retainer <= 0) return [];
  const currentMonth = reference.getMonth() + 1;
  const open: string[] = [];
  for (let m = 1; m <= currentMonth; m++) {
    const key = String(m).padStart(2, '0');
    const legacyKey = String(m); // backward-compat: older data may store "3" not "03"
    const paidValue = (retainerPayments as any)?.[key] ?? (retainerPayments as any)?.[legacyKey];
    const isPaid =
      paidValue === true ||
      paidValue === 'true' ||
      paidValue === 1 ||
      paidValue === '1';
    if (!isPaid) {
      open.push(key);
    }
  }
  return open;
}

export function Finance() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [editRetainerOpen, setEditRetainerOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [showArchive, setShowArchive] = useState(false);
  const [chargeForm, setChargeForm] = useState({
    title: '',
    description: '',
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
      if (chargeForm.description) {
        formData.append('description', chargeForm.description);
      }
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
        setChargeForm({ title: '', description: '', amount: '', our_cost: '' });
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

  const handleToggleChargeStatus = async (clientId: string, chargeId: string) => {
    try {
      const response = await apiClient.post(`/toggle_charge_status/${clientId}/${chargeId}`);
      if (response.data.success) {
        toast({
          title: 'הצלחה',
          description: 'סטטוס החיוב עודכן',
          variant: 'success',
        });
        fetchFinanceData();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בעדכון סטטוס החיוב',
        variant: 'destructive',
      });
    }
  };

  const handleToggleRetainerStatus = async (clientId: string, month: string) => {
    try {
      const normalizedMonth = String(month).padStart(2, '0');
      const response = await apiClient.post(
        `/toggle_retainer_status/${clientId}/${normalizedMonth}`
      );
      if (response.data.success) {
        const returnedMonth: string =
          typeof response.data.month === 'string'
            ? response.data.month
            : normalizedMonth;
        const paid: boolean = response.data.paid === true;

        // Optimistic state update: ensures UI reflects toggle immediately.
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            clients: prev.clients.map((c) => {
              if (c.id !== clientId) return c;
              const existing = c.retainer_payments ?? {};
              return {
                ...c,
                retainer_payments: {
                  ...existing,
                  [returnedMonth]: paid,
                },
              };
            }),
          };
        });

        toast({
          title: 'הצלחה',
          description: paid ? 'ריטיינר סומן כשולם' : 'ריטיינר סומן כלא שולם',
          variant: 'success',
        });
        fetchFinanceData();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בעדכון סטטוס הריטיינר',
        variant: 'destructive',
      });
    }
  };

  const getCurrentMonthName = () => {
    const currentMonth =
      monthFilter !== 'all' ? parseInt(monthFilter, 10) - 1 : new Date().getMonth();
    return HEBREW_MONTH_NAMES[currentMonth] ?? '';
  };

  const getDisplayMonth = () => {
    if (monthFilter !== 'all') {
      return monthFilter;
    }
    return String(new Date().getMonth() + 1).padStart(2, '0');
  };

  const handleExportOpenCharges = () => {
    window.location.href = '/export_open_charges';
  };

  const handleGenerateInvoice = (clientId: string) => {
    const url = monthFilter && monthFilter !== 'all'
      ? `/generate_invoice/${clientId}?month=${monthFilter}`
      : `/generate_invoice/${clientId}`;
    window.location.href = url;
  };

  const toggleClientExpanded = (clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) {
      return dateStr;
    }
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return dateStr;
  };

  const getChargeMonth = (dateStr: string): string => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length >= 2) {
        return parts[1].padStart(2, '0');
      }
    }
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        return parts[1].padStart(2, '0');
      }
    }
    return '';
  };

  const filterChargesByMonth = (charges: Charge[]): Charge[] => {
    if (!monthFilter || monthFilter === 'all') {
      return charges;
    }
    return charges.filter(charge => {
      const chargeMonth = getChargeMonth(charge.date);
      return chargeMonth === monthFilter;
    });
  };

  const filteredClients =
    data?.clients
      .filter((client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map(client => {
        const all_filtered_charges = filterChargesByMonth(client.extra_charges);
        const open_charges = all_filtered_charges.filter(ch => !ch.completed && !ch.paid);
        const archived_charges = all_filtered_charges.filter(ch => ch.completed || ch.paid);
        const filtered_total = all_filtered_charges.reduce((sum, ch) => sum + (ch.amount || 0), 0);
        const filtered_open_charges = open_charges.reduce((sum, ch) => sum + (ch.amount || 0), 0);

        const now = new Date();
        const openRetainerMonthKeys =
          monthFilter === 'all'
            ? getOpenRetainerMonthKeysYtd(
                client.retainer,
                client.retainer_payments,
                now
              )
            : [];

        let retainerOpenAmount = 0;
        if (monthFilter === 'all') {
          retainerOpenAmount = openRetainerMonthKeys.length * client.retainer;
        } else if (monthFilter && client.retainer > 0) {
          const isPaid = client.retainer_payments?.[monthFilter] === true;
          if (!isPaid) {
            retainerOpenAmount = client.retainer;
          }
        }

        return {
          ...client,
          filtered_charges: open_charges,
          archived_charges,
          filtered_total,
          filtered_open_charges: filtered_open_charges + retainerOpenAmount,
          open_retainer_month_keys: openRetainerMonthKeys,
        };
      })
      .sort((a, b) => b.filtered_total - a.filtered_total) || [];

  const totalArchivedCharges = filteredClients.reduce(
    (sum, client) => sum + client.archived_charges.length, 0
  );

  const allArchivedCharges = filteredClients
    .flatMap(client => 
      client.archived_charges.map(charge => ({
        ...charge,
        clientId: client.id,
        clientName: client.name
      }))
    )
    .sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA);
    });

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

  const totalFilteredOpenCharges = filteredClients.reduce(
    (sum, client) => sum + client.filtered_open_charges, 0
  );

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
              ₪{(monthFilter === 'all' ? data.total_open_charges : totalFilteredOpenCharges).toLocaleString()}
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
                  <th className="p-3 text-right font-bold">ריטיינר</th>
                  <th className="p-3 text-right font-bold">חיובים נוספים</th>
                  <th className="p-3 text-right font-bold">חיובים פתוחים</th>
                  <th className="p-3 text-right font-bold">הכנסות חודשיות</th>
                  <th className="p-3 text-right font-bold">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <>
                    <tr
                      key={client.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3">
                        <button
                          onClick={() => toggleClientExpanded(client.id)}
                          className="flex items-center gap-2 text-[#0073ea] hover:underline font-semibold cursor-pointer text-right"
                        >
                          {expandedClients.has(client.id) ? (
                            <ChevronUp className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 flex-shrink-0" />
                          )}
                          {client.name}
                          {client.filtered_charges.length > 0 && (
                            <span className="text-xs text-gray-500 font-normal">
                              ({client.filtered_charges.length} חיובים)
                            </span>
                          )}
                        </button>
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
                      <td className="p-3 text-[#d66b74] font-semibold">
                        ₪{client.filtered_open_charges.toLocaleString()}
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
                              setChargeForm({ title: '', description: '', amount: '', our_cost: '' });
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
                    {expandedClients.has(client.id) && (
                      <tr key={`${client.id}-charges`} className="bg-gray-50">
                        <td colSpan={6} className="p-0">
                          <div className="p-4 border-b-2 border-gray-200">
                            <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              פירוט חיובים - {client.name} -{' '}
                              {monthFilter === 'all'
                                ? `כל החודשים (${new Date().getFullYear()}, רטיינרים פתוחים מתחילת השנה)`
                                : getCurrentMonthName()}
                            </h4>
                            {(() => {
                              const showRetainerDetail =
                                monthFilter === 'all'
                                  ? (client.open_retainer_month_keys?.length ?? 0) > 0
                                  : client.retainer > 0;
                              const noChargesToShow = client.filtered_charges.length === 0;
                              if (!showRetainerDetail && noChargesToShow) {
                                return (
                                  <p className="text-gray-500 text-sm">אין חיובים להצגה</p>
                                );
                              }
                              return (
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="p-2 text-right font-semibold">שם / תיאור</th>
                                      <th className="p-2 text-right font-semibold">תאריך</th>
                                      <th className="p-2 text-right font-semibold">סכום</th>
                                      <th className="p-2 text-right font-semibold">עלות פנימית</th>
                                      <th className="p-2 text-right font-semibold">שולם</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {monthFilter === 'all' &&
                                      client.retainer > 0 &&
                                      (client.open_retainer_month_keys ?? []).map((monthKey) => (
                                        <tr
                                          key={`retainer-${client.id}-${monthKey}`}
                                          className="border-b border-gray-100 bg-blue-50"
                                        >
                                          <td className="p-2">
                                            <div className="font-medium text-blue-700">
                                              ריטיינר חודשי - {hebrewMonthName(monthKey)}
                                            </div>
                                          </td>
                                          <td className="p-2 text-blue-700">
                                            {hebrewMonthName(monthKey)}
                                          </td>
                                          <td className="p-2 font-semibold text-blue-700">
                                            ₪{client.retainer.toLocaleString()}
                                          </td>
                                          <td className="p-2 text-blue-700">-</td>
                                          <td className="p-2">
                                            <div className="flex items-center gap-2">
                                              <Switch
                                                checked={
                                                  client.retainer_payments?.[monthKey] || false
                                                }
                                                onCheckedChange={() =>
                                                  handleToggleRetainerStatus(client.id, monthKey)
                                                }
                                              />
                                              <span
                                                className={`text-xs ${
                                                  client.retainer_payments?.[monthKey]
                                                    ? 'text-green-500'
                                                    : 'text-red-500'
                                                }`}
                                              >
                                                {client.retainer_payments?.[monthKey]
                                                  ? 'שולם'
                                                  : 'לא שולם'}
                                              </span>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    {monthFilter !== 'all' && client.retainer > 0 && (
                                      <tr className="border-b border-gray-100 bg-blue-50">
                                        <td className="p-2">
                                          <div className="font-medium text-blue-700">
                                            ריטיינר חודשי - {getCurrentMonthName()}
                                          </div>
                                        </td>
                                        <td className="p-2 text-blue-700">
                                          {getCurrentMonthName()}
                                        </td>
                                        <td className="p-2 font-semibold text-blue-700">
                                          ₪{client.retainer.toLocaleString()}
                                        </td>
                                        <td className="p-2 text-blue-700">-</td>
                                        <td className="p-2">
                                          <div className="flex items-center gap-2">
                                            <Switch
                                              checked={
                                                client.retainer_payments?.[getDisplayMonth()] ||
                                                false
                                              }
                                              onCheckedChange={() =>
                                                handleToggleRetainerStatus(
                                                  client.id,
                                                  getDisplayMonth()
                                                )
                                              }
                                            />
                                            <span
                                              className={`text-xs ${
                                                client.retainer_payments?.[getDisplayMonth()]
                                                  ? 'text-green-500'
                                                  : 'text-red-500'
                                              }`}
                                            >
                                              {client.retainer_payments?.[getDisplayMonth()]
                                                ? 'שולם'
                                                : 'לא שולם'}
                                            </span>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                    {/* Extra Charges */}
                                    {client.filtered_charges.map((charge) => (
                                      <tr
                                        key={charge.id}
                                        className="border-b border-gray-100"
                                      >
                                        <td className="p-2">
                                          <div>
                                            <div className="font-medium">{charge.title || '-'}</div>
                                            {charge.description && (
                                              <div className="text-sm text-gray-600">
                                                {charge.description}
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                        <td className="p-2">
                                          {formatDate(charge.date)}
                                        </td>
                                        <td className="p-2 font-semibold">
                                          ₪{(charge.amount || 0).toLocaleString()}
                                        </td>
                                        <td className="p-2">
                                          {charge.our_cost ? `₪${charge.our_cost.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="p-2">
                                          <div className="flex items-center gap-2">
                                            <Switch
                                              checked={false}
                                              onCheckedChange={() => handleToggleChargeStatus(client.id, charge.id)}
                                            />
                                            <span className="text-xs text-red-500">
                                              לא שולם
                                            </span>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Archive Section */}
      {totalArchivedCharges > 0 && (
        <Card>
          <CardContent className="p-0">
            <button
              onClick={() => setShowArchive(!showArchive)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 text-gray-700 font-bold">
                <Archive className="w-5 h-5" />
                ארכיון חיובים ששולמו ({totalArchivedCharges} חיובים)
              </div>
              {showArchive ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            {showArchive && (
              <div className="border-t border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-3 text-right font-semibold">לקוח</th>
                        <th className="p-3 text-right font-semibold">תיאור</th>
                        <th className="p-3 text-right font-semibold">תאריך</th>
                        <th className="p-3 text-right font-semibold">סכום</th>
                        <th className="p-3 text-right font-semibold">הערות</th>
                        <th className="p-3 text-right font-semibold">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allArchivedCharges.map((charge) => (
                        <tr
                          key={charge.id}
                          className="border-b border-gray-100 bg-green-50"
                        >
                          <td className="p-3 font-semibold text-gray-600">
                            {charge.clientName}
                          </td>
                          <td className="p-3 text-gray-500 line-through">
                            <div>
                              <div>{charge.title || '-'}</div>
                              {charge.description && (
                                <div className="text-sm">{charge.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-gray-500">
                            {formatDate(charge.date)}
                          </td>
                          <td className="p-3 text-gray-500">
                            ₪{(charge.amount || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-gray-500 text-xs max-w-[200px] truncate">
                            {charge.notes || '-'}
                          </td>
                          <td className="p-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleChargeStatus(charge.clientId, charge.id)}
                              className="text-xs"
                            >
                              החזר לפתוחים
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
              <Label>שם החיוב:</Label>
              <Input
                value={chargeForm.title}
                onChange={(e) =>
                  setChargeForm({ ...chargeForm, title: e.target.value })
                }
                placeholder="למשל: משלוחים, עיצוב, פרסום..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label>תיאור (אופציונלי):</Label>
              <Textarea
                value={chargeForm.description}
                onChange={(e) =>
                  setChargeForm({ ...chargeForm, description: e.target.value })
                }
                placeholder="פירוט נוסף על החיוב..."
                rows={2}
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
