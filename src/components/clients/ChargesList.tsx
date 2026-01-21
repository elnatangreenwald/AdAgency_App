/**
 * Charges List Component
 * Displays and manages client charges/billing
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';
import type { Charge } from '@/types';

interface ChargesListProps {
  charges: Charge[];
  retainer: number;
  onAddCharge: (data: { title: string; amount: string; our_cost: string }) => void;
  onToggleCharge: (chargeId: string, completed: boolean) => void;
  onDeleteCharge: (chargeId: string) => void;
  onUpdateRetainer: (amount: string) => void;
}

export function ChargesList({
  charges,
  retainer,
  onAddCharge,
  onToggleCharge,
  onDeleteCharge,
  onUpdateRetainer,
}: ChargesListProps) {
  const [chargeForm, setChargeForm] = useState({
    title: '',
    amount: '',
    our_cost: '',
  });
  const [retainerAmount, setRetainerAmount] = useState(retainer.toString());

  const totalCharges = charges.reduce((sum, ch) => sum + (ch.amount || 0), 0);
  const totalOurCost = charges.reduce((sum, ch) => sum + (ch.our_cost || 0), 0);
  const profit = totalCharges - totalOurCost;

  const handleAddCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeForm.title || !chargeForm.amount) return;
    onAddCharge(chargeForm);
    setChargeForm({ title: '', amount: '', our_cost: '' });
  };

  const handleUpdateRetainer = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRetainer(retainerAmount);
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">כספים וחיובים</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-xs text-gray-600">רטיינר</div>
            <div className="text-lg font-bold text-blue-600">₪{retainer.toLocaleString()}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-xs text-gray-600">סה"כ חיובים</div>
            <div className="text-lg font-bold text-green-600">₪{totalCharges.toLocaleString()}</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-xs text-gray-600">עלות לנו</div>
            <div className="text-lg font-bold text-red-600">₪{totalOurCost.toLocaleString()}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-xs text-gray-600">רווח</div>
            <div className={`text-lg font-bold ${profit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              ₪{profit.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Retainer Update */}
        <form onSubmit={handleUpdateRetainer} className="flex gap-2 mb-4">
          <Input
            type="number"
            placeholder="עדכון רטיינר"
            value={retainerAmount}
            onChange={(e) => setRetainerAmount(e.target.value)}
            className="w-32"
          />
          <Button type="submit" size="sm" variant="outline">
            עדכן רטיינר
          </Button>
        </form>

        {/* Charges List */}
        <div className="space-y-2 mb-4">
          {charges.length > 0 ? (
            charges.map((charge) => (
              <div
                key={charge.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={charge.completed || charge.paid}
                    onCheckedChange={(checked) => onToggleCharge(charge.id, checked === true)}
                  />
                  <div>
                    <div className={charge.completed || charge.paid ? 'line-through text-gray-400' : ''}>
                      {charge.title || charge.description}
                    </div>
                    <div className="text-xs text-gray-500">
                      {charge.charge_number && `מס׳ ${charge.charge_number} | `}
                      {charge.date}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <div className="font-medium">₪{charge.amount.toLocaleString()}</div>
                    {charge.our_cost !== undefined && charge.our_cost > 0 && (
                      <div className="text-xs text-gray-500">עלות: ₪{charge.our_cost.toLocaleString()}</div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('האם אתה בטוח שברצונך למחוק את החיוב?')) {
                        onDeleteCharge(charge.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">אין חיובים</div>
          )}
        </div>

        {/* Add Charge Form */}
        <form onSubmit={handleAddCharge} className="flex flex-col sm:flex-row gap-2">
          <Input
            type="text"
            placeholder="תיאור חיוב"
            value={chargeForm.title}
            onChange={(e) => setChargeForm({ ...chargeForm, title: e.target.value })}
            className="flex-1"
            required
          />
          <Input
            type="number"
            placeholder="סכום"
            value={chargeForm.amount}
            onChange={(e) => setChargeForm({ ...chargeForm, amount: e.target.value })}
            className="w-24"
            required
          />
          <Input
            type="number"
            placeholder="עלות לנו"
            value={chargeForm.our_cost}
            onChange={(e) => setChargeForm({ ...chargeForm, our_cost: e.target.value })}
            className="w-24"
          />
          <Button type="submit" size="sm" className="bg-[#3d817a] hover:bg-[#2d6159]">
            <Plus className="h-4 w-4 ml-1" />
            הוסף
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
