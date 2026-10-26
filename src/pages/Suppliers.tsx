import { useState, useEffect, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  category?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

const ALL_CATEGORIES = '__all__';
const NO_CATEGORY = '__none__';

function toWhatsAppNumber(raw: string): string | null {
  const normalized = raw
    .split(/[\/,;|]/)
    .map((part) => {
      let digits = part.replace(/\D/g, '');
      if (digits.startsWith('00')) digits = digits.slice(2);
      if (digits.startsWith('972')) return digits;
      if (digits.startsWith('0')) return '972' + digits.slice(1);
      if (digits.length === 8 || digits.length === 9) return '972' + digits;
      return digits;
    })
    .filter((d) => d.length >= 11);

  return normalized.find((d) => d.startsWith('9725')) ?? normalized[0] ?? null;
}

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    category: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORIES);
  const { toast } = useToast();

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    let uncategorized = 0;
    suppliers.forEach((s) => {
      const cat = s.category?.trim();
      if (cat) counts.set(cat, (counts.get(cat) || 0) + 1);
      else uncategorized++;
    });
    const list = Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0], 'he'))
      .map(([name, count]) => ({ key: name, label: name, count }));
    if (uncategorized > 0) {
      list.push({ key: NO_CATEGORY, label: 'ללא קטגוריה', count: uncategorized });
    }
    return list;
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    if (selectedCategory === ALL_CATEGORIES) return suppliers;
    if (selectedCategory === NO_CATEGORY) return suppliers.filter((s) => !s.category?.trim());
    return suppliers.filter((s) => s.category?.trim() === selectedCategory);
  }, [suppliers, selectedCategory]);

  useEffect(() => {
    if (
      selectedCategory !== ALL_CATEGORIES &&
      !categories.some((c) => c.key === selectedCategory)
    ) {
      setSelectedCategory(ALL_CATEGORIES);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/suppliers');
      if (response.data.success) {
        setSuppliers(response.data.suppliers);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בטעינת ספקים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name) {
      toast({
        title: 'שגיאה',
        description: 'אנא הזן שם ספק',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', supplierForm.name);
      if (supplierForm.category) formData.append('category', supplierForm.category);
      if (supplierForm.phone) formData.append('phone', supplierForm.phone);
      if (supplierForm.email) formData.append('email', supplierForm.email);
      if (supplierForm.address) formData.append('address', supplierForm.address);
      if (supplierForm.notes) formData.append('notes', supplierForm.notes);

      const response = await apiClient.post('/add_supplier', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.status === 200) {
        toast({
          title: 'הצלחה',
          description: 'הספק נוסף בהצלחה',
          variant: 'success',
        });
        setAddSupplierOpen(false);
        setSupplierForm({
          name: '',
          category: '',
          phone: '',
          email: '',
          address: '',
          notes: '',
        });
        fetchSuppliers();
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'שגיאה בהוספת הספק',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">טוען ספקים...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-[#292f4c]">ספקים</h1>
        <Button onClick={() => setAddSupplierOpen(true)} className="w-full md:w-auto">
          <Plus className="w-4 h-4 ml-2" />
          ספק חדש
        </Button>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600 ml-1">סינון לפי קטגוריה:</span>
          {[{ key: ALL_CATEGORIES, label: 'הכל', count: suppliers.length }, ...categories].map(
            (cat) => {
              const active = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    active
                      ? 'bg-[#292f4c] text-white border-[#292f4c]'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {cat.label}
                  <span className={`mr-1.5 text-xs ${active ? 'text-gray-200' : 'text-gray-400'}`}>
                    ({cat.count})
                  </span>
                </button>
              );
            }
          )}
        </div>
      )}

      {filteredSuppliers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            אין ספקים להצגה
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filteredSuppliers.map((supplier) => {
            const whatsappNumber = supplier.phone ? toWhatsAppNumber(supplier.phone) : null;
            return (
            <Card key={supplier.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-lg md:text-xl font-bold text-[#292f4c]">
                    {supplier.name}
                  </h3>
                  {whatsappNumber && (
                    <a
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`שליחת הודעת וואטסאפ ל${supplier.name}`}
                      className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#25D366] hover:bg-[#1ebe5b] text-white text-xs font-medium px-2.5 py-1 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      וואטסאפ
                    </a>
                  )}
                </div>
                {supplier.category && (
                  <div className="text-sm text-gray-600 mb-2">
                    קטגוריה: {supplier.category}
                  </div>
                )}
                <div className="space-y-2 text-sm">
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-4 h-4" />
                      {supplier.phone}
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-4 h-4" />
                      {supplier.email}
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4" />
                      {supplier.address}
                    </div>
                  )}
                </div>
                {supplier.notes && (
                  <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                    {supplier.notes}
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {/* Add Supplier Modal */}
      <Dialog open={addSupplierOpen} onOpenChange={setAddSupplierOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוספת ספק חדש</DialogTitle>
            <DialogDescription>
              הוסף ספק חדש למערכת
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSupplier} className="space-y-4">
            <div className="space-y-2">
              <Label>שם הספק:</Label>
              <Input
                value={supplierForm.name}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, name: e.target.value })
                }
                placeholder="הזן שם ספק..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label>קטגוריה (אופציונלי):</Label>
              <Input
                value={supplierForm.category}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, category: e.target.value })
                }
                placeholder="לדוגמה: צילום, הגברה..."
              />
            </div>
            <div className="space-y-2">
              <Label>טלפון (אופציונלי):</Label>
              <Input
                type="tel"
                value={supplierForm.phone}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, phone: e.target.value })
                }
                placeholder="הזן מספר טלפון..."
              />
            </div>
            <div className="space-y-2">
              <Label>אימייל (אופציונלי):</Label>
              <Input
                type="email"
                value={supplierForm.email}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, email: e.target.value })
                }
                placeholder="הזן אימייל..."
              />
            </div>
            <div className="space-y-2">
              <Label>כתובת (אופציונלי):</Label>
              <Input
                value={supplierForm.address}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, address: e.target.value })
                }
                placeholder="הזן כתובת..."
              />
            </div>
            <div className="space-y-2">
              <Label>הערות (אופציונלי):</Label>
              <Textarea
                value={supplierForm.notes}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, notes: e.target.value })
                }
                placeholder="הערות..."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddSupplierOpen(false)}
              >
                ביטול
              </Button>
              <Button type="submit">הוסף ספק</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
