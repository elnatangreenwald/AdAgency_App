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
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, Phone, Mail, MapPin } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  category?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
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
  const { toast } = useToast();

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#292f4c]">ספקים</h1>
        <Button onClick={() => setAddSupplierOpen(true)}>
          <Plus className="w-4 h-4 ml-2" />
          ספק חדש
        </Button>
      </div>

      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            אין ספקים להצגה
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-md transition-all">
              <CardContent className="p-5">
                <h3 className="text-xl font-bold text-[#292f4c] mb-3">
                  {supplier.name}
                </h3>
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
          ))}
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
