import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { FileText, Paperclip, Pencil, Plus, Receipt, Search, Trash2 } from 'lucide-react';
import { apiClient, apiFormClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

type PaymentTerms = 'immediate' | 'net30' | 'net60' | 'net90' | 'net120';

export interface SupplierInvoice {
  id: string;
  client_id: string;
  client_name: string;
  supplier?: string;
  invoice_number?: string;
  amount: number;
  invoice_date: string;
  payment_terms: PaymentTerms;
  due_date: string;
  is_paid: boolean;
  paid_at?: string | null;
  notes?: string;
  file?: { original_name: string; content_type?: string; size?: number } | null;
}

interface ClientOption {
  id: string;
  name: string;
}

const TERMS: { value: PaymentTerms; label: string; days: number }[] = [
  { value: 'immediate', label: 'מיידי', days: 0 },
  { value: 'net30', label: 'שוטף+30', days: 30 },
  { value: 'net60', label: 'שוטף+60', days: 60 },
  { value: 'net90', label: 'שוטף+90', days: 90 },
  { value: 'net120', label: 'שוטף+120', days: 120 },
];

const TERMS_LABEL = Object.fromEntries(TERMS.map((t) => [t.value, t.label])) as Record<PaymentTerms, string>;

type StatusFilter = 'open' | 'paid' | 'all';

function todayIso() {
  const d = new Date();
  return toIso(d);
}

function toIso(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// Mirrors _compute_invoice_due_date on the server: end of the invoice month + N days.
function computeDueDate(invoiceDate: string, terms: PaymentTerms) {
  if (!invoiceDate) return '';
  const [y, m, d] = invoiceDate.split('-').map(Number);
  const days = TERMS.find((t) => t.value === terms)?.days ?? 0;
  if (days === 0) return toIso(new Date(y, m - 1, d));
  const endOfMonth = new Date(y, m, 0);
  endOfMonth.setDate(endOfMonth.getDate() + days);
  return toIso(endOfMonth);
}

function formatDate(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function monthLabel(monthKey: string) {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
}

function formatMoney(amount: number) {
  return `₪${amount.toLocaleString('he-IL', { maximumFractionDigits: 2 })}`;
}

const EMPTY_FORM = {
  client_id: '',
  supplier: '',
  invoice_number: '',
  amount: '',
  invoice_date: todayIso(),
  payment_terms: 'net30' as PaymentTerms,
  notes: '',
};

export function InvoicesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [clientFilter, setClientFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierInvoice | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SupplierInvoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchInvoices = async () => {
    try {
      const response = await apiClient.get('/api/invoices');
      if (response.data.success) {
        setInvoices(response.data.invoices || []);
        setClients(response.data.clients || []);
        setSuppliers(response.data.suppliers || []);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        setForbidden(true);
      } else {
        toast({
          title: 'שגיאה',
          description: error.response?.data?.error || 'לא ניתן לטעון חשבוניות',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchInvoices();
  }, [user]);

  const today = todayIso();
  const currentMonth = today.slice(0, 7);

  const summary = useMemo(() => {
    const open = invoices.filter((i) => !i.is_paid);
    const sum = (list: SupplierInvoice[]) => list.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    return {
      openTotal: sum(open),
      openCount: open.length,
      thisMonth: sum(open.filter((i) => i.due_date.slice(0, 7) === currentMonth)),
      overdue: sum(open.filter((i) => i.due_date < today)),
    };
  }, [invoices, currentMonth, today]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((i) => {
      if (statusFilter === 'open' && i.is_paid) return false;
      if (statusFilter === 'paid' && !i.is_paid) return false;
      if (clientFilter !== 'all' && i.client_id !== clientFilter) return false;
      if (!q) return true;
      return [i.client_name, i.supplier, i.invoice_number, i.notes, String(i.amount)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [invoices, statusFilter, clientFilter, search]);

  const groupedByMonth = useMemo(() => {
    const map = new Map<string, SupplierInvoice[]>();
    for (const inv of filtered) {
      const key = inv.due_date.slice(0, 7);
      const list = map.get(key) || [];
      list.push(inv);
      map.set(key, list);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, list]) => ({
        month,
        invoices: list.sort((a, b) => a.due_date.localeCompare(b.due_date)),
        openSum: list.filter((i) => !i.is_paid).reduce((acc, i) => acc + Number(i.amount), 0),
        paidSum: list.filter((i) => i.is_paid).reduce((acc, i) => acc + Number(i.amount), 0),
      }));
  }, [filtered]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, invoice_date: todayIso() });
    setFile(null);
    setDialogOpen(true);
  };

  const openEdit = (inv: SupplierInvoice) => {
    setEditing(inv);
    setForm({
      client_id: inv.client_id,
      supplier: inv.supplier || '',
      invoice_number: inv.invoice_number || '',
      amount: String(inv.amount),
      invoice_date: inv.invoice_date,
      payment_terms: inv.payment_terms,
      notes: inv.notes || '',
    });
    setFile(null);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id) {
      toast({ title: 'שגיאה', description: 'יש לבחור לקוח', variant: 'destructive' });
      return;
    }
    if (!(Number(form.amount) > 0)) {
      toast({ title: 'שגיאה', description: 'יש להזין סכום', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (file) formData.append('file', file);
      const response = editing
        ? await apiFormClient.post(`/api/invoices/${editing.id}`, formData)
        : await apiFormClient.post('/api/invoices', formData);
      if (response.data.success) {
        toast({ title: editing ? 'החשבונית עודכנה' : 'החשבונית נוספה' });
        setDialogOpen(false);
        await fetchInvoices();
      } else {
        toast({ title: 'שגיאה', description: response.data.error || 'שמירה נכשלה', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שמירה נכשלה',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePaid = async (inv: SupplierInvoice, isPaid: boolean) => {
    setInvoices((prev) => prev.map((i) => (i.id === inv.id ? { ...i, is_paid: isPaid } : i)));
    try {
      const response = await apiClient.post(`/api/invoices/${inv.id}/toggle_paid`, { is_paid: isPaid });
      if (response.data.success) {
        setInvoices((prev) => prev.map((i) => (i.id === inv.id ? response.data.invoice : i)));
        return;
      }
      throw new Error(response.data.error);
    } catch (error: any) {
      setInvoices((prev) => prev.map((i) => (i.id === inv.id ? { ...i, is_paid: !isPaid } : i)));
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || error.message || 'עדכון נכשל',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const response = await apiClient.post(`/api/invoices/${deleteTarget.id}/delete`);
      if (response.data.success) {
        toast({ title: 'החשבונית נמחקה' });
        setDeleteTarget(null);
        await fetchInvoices();
      } else {
        toast({ title: 'שגיאה', description: response.data.error || 'מחיקה נכשלה', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'מחיקה נכשלה',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner text="טוען חשבוניות..." />
      </div>
    );
  }

  if (forbidden) {
    return (
      <Card>
        <CardContent>
          <EmptyState icon={Receipt} title="אין הרשאה" description="עמוד החשבוניות זמין למנהלים בלבד" />
        </CardContent>
      </Card>
    );
  }

  const previewDue = computeDueDate(form.invoice_date, form.payment_terms);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#043841] to-[#3d817a] border-0 text-white">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Receipt className="w-7 h-7" />
                <h1 className="text-2xl md:text-3xl font-bold">חשבוניות</h1>
              </div>
              <p className="text-white/80 text-sm">חשבוניות ספקים לתשלום, לפי חודש התשלום</p>
            </div>
            <Button onClick={openCreate} className="bg-white text-[#043841] hover:bg-[#FEFAE0]">
              <Plus className="w-4 h-4 ml-2" />
              העלאת חשבונית
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="סה״כ בחשבוניות פתוחות" value={formatMoney(summary.openTotal)} highlight />
        <SummaryCard label="חשבוניות פתוחות" value={String(summary.openCount)} />
        <SummaryCard label={`לתשלום ב${monthLabel(currentMonth)}`} value={formatMoney(summary.thisMonth)} />
        <SummaryCard
          label="עבר מועד התשלום"
          value={formatMoney(summary.overdue)}
          danger={summary.overdue > 0}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש ספק, לקוח, מספר חשבונית..."
            className="pr-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">פתוחות</SelectItem>
            <SelectItem value="paid">שולמו</SelectItem>
            <SelectItem value="all">הכול</SelectItem>
          </SelectContent>
        </Select>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger>
            <SelectValue placeholder="כל הלקוחות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הלקוחות</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {groupedByMonth.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Receipt}
              title="אין חשבוניות להצגה"
              description="העלו חשבונית חדשה או שנו את הסינון"
              actionLabel="העלאת חשבונית"
              onAction={openCreate}
            />
          </CardContent>
        </Card>
      ) : (
        groupedByMonth.map((group) => (
          <section key={group.month} className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2
                className={cn(
                  'text-xl font-bold',
                  group.month === currentMonth ? 'text-[#3d817a]' : 'text-[#043841]'
                )}
              >
                {monthLabel(group.month)}
              </h2>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-700">
                  פתוח: <span className="font-semibold">{formatMoney(group.openSum)}</span>
                </span>
                {group.paidSum > 0 && (
                  <span className="text-gray-500">שולם: {formatMoney(group.paidSum)}</span>
                )}
              </div>
            </div>
            <Card className="overflow-hidden">
              <div className="divide-y">
                {group.invoices.map((inv) => {
                  const overdue = !inv.is_paid && inv.due_date < today;
                  return (
                    <div
                      key={inv.id}
                      className={cn(
                        'flex flex-col md:flex-row md:items-center gap-3 p-3 md:p-4',
                        inv.is_paid && 'bg-gray-50 text-gray-400'
                      )}
                    >
                      <label className="flex items-center gap-2 shrink-0 cursor-pointer">
                        <Checkbox
                          checked={inv.is_paid}
                          onCheckedChange={(checked) => togglePaid(inv, checked === true)}
                        />
                        <span className="text-sm">שולם</span>
                      </label>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">
                          {inv.supplier || 'ספק לא צוין'}
                          {inv.invoice_number && (
                            <span className="font-normal text-gray-500"> · חשבונית {inv.invoice_number}</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {inv.client_name} · {TERMS_LABEL[inv.payment_terms]} · הופקה {formatDate(inv.invoice_date)}
                        </div>
                        {inv.notes && <div className="text-xs text-gray-500 mt-1 truncate">{inv.notes}</div>}
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-left">
                          <div className={cn('font-bold', !inv.is_paid && 'text-[#043841]')}>
                            {formatMoney(Number(inv.amount))}
                          </div>
                          <div className={cn('text-xs', overdue ? 'text-red-600 font-medium' : 'text-gray-500')}>
                            {overdue ? 'באיחור · ' : ''}לתשלום {formatDate(inv.due_date)}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {inv.file && (
                            <Button variant="ghost" size="icon" asChild title={inv.file.original_name}>
                              <a href={`/api/invoices/${inv.id}/file?inline=1`} target="_blank" rel="noreferrer">
                                <FileText className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openEdit(inv)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setDeleteTarget(inv)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>
        ))
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? 'עריכת חשבונית' : 'העלאת חשבונית'}</DialogTitle>
            <DialogDescription>מועד התשלום מחושב אוטומטית לפי תאריך החשבונית ותנאי התשלום.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inv-file">קובץ החשבונית</Label>
              <Input
                id="inv-file"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {editing?.file && !file && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  {editing.file.original_name} (בחירת קובץ חדש תחליף אותו)
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>לקוח</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחירת לקוח" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-supplier">ספק</Label>
                <Input
                  id="inv-supplier"
                  list="inv-suppliers"
                  value={form.supplier}
                  onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
                  placeholder="שם הספק"
                />
                <datalist id="inv-suppliers">
                  {suppliers.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-amount">סכום (₪)</Label>
                <Input
                  id="inv-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-number">מספר חשבונית</Label>
                <Input
                  id="inv-number"
                  value={form.invoice_number}
                  onChange={(e) => setForm((f) => ({ ...f, invoice_number: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inv-date">תאריך חשבונית</Label>
                <Input
                  id="inv-date"
                  type="date"
                  value={form.invoice_date}
                  onChange={(e) => setForm((f) => ({ ...f, invoice_date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>תנאי תשלום</Label>
                <Select
                  value={form.payment_terms}
                  onValueChange={(v) => setForm((f) => ({ ...f, payment_terms: v as PaymentTerms }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TERMS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {previewDue && (
              <p className="text-sm bg-[#FEFAE0] text-[#043841] rounded-md p-2">
                ישולם ב{monthLabel(previewDue.slice(0, 7))} ({formatDate(previewDue)})
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="inv-notes">הערות</Label>
              <Textarea
                id="inv-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#3d817a] hover:bg-[#2d6159]">
                {saving ? 'שומר...' : 'שמירה'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title="מחיקת חשבונית"
        description={`למחוק את החשבונית של ${deleteTarget?.supplier || 'הספק'} (${
          deleteTarget ? formatMoney(Number(deleteTarget.amount)) : ''
        })?`}
        confirmText="מחיקה"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlight = false,
  danger = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <Card className={cn(highlight && 'border-[#3d817a] border-2')}>
      <CardContent className="p-4">
        <div className="text-sm text-gray-500 mb-1">{label}</div>
        <div
          className={cn(
            'text-xl md:text-2xl font-bold',
            danger ? 'text-red-600' : 'text-[#043841]'
          )}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
