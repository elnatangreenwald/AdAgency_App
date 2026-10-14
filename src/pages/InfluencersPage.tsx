import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  AlertTriangle,
  ClipboardCopy,
  ExternalLink,
  Instagram,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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

export interface Influencer {
  id: string;
  name: string;
  instagram?: string;
  followers?: string;
  followers_count?: number | null;
  topics?: string;
  notes?: string;
  age?: string;
  group?: string;
  source_url?: string;
  contact?: string;
  price?: string;
  needs_verification?: boolean;
  updated_at?: string;
}

type SortKey = 'followers' | 'name';
type VerificationFilter = 'all' | 'verified' | 'unverified';

const EMPTY_FORM = {
  name: '',
  instagram: '',
  followers: '',
  topics: '',
  notes: '',
  age: '',
  group: '',
  source_url: '',
  contact: '',
  price: '',
  needs_verification: false,
};

type InfluencerForm = typeof EMPTY_FORM;

function canDelete(user: { id: string; role?: string } | null) {
  return user?.id === 'admin' || user?.role === 'אדמין' || user?.role === 'מנהל';
}

function instagramUrl(handle?: string) {
  return handle ? `https://www.instagram.com/${handle}/` : '';
}

function formatForClient(list: Influencer[]) {
  return list
    .map((inf) => {
      const lines = [inf.name];
      if (inf.instagram) lines.push(`אינסטגרם: @${inf.instagram} (${instagramUrl(inf.instagram)})`);
      if (inf.followers) lines.push(`עוקבים: ${inf.followers}`);
      if (inf.topics) lines.push(`תוכן: ${inf.topics}`);
      return lines.join('\n');
    })
    .join('\n\n');
}

export function InfluencersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const allowDelete = canDelete(user);

  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('followers');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Influencer | null>(null);
  const [form, setForm] = useState<InfluencerForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Influencer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchInfluencers = async () => {
    try {
      const response = await apiClient.get('/api/influencers');
      if (response.data.success) {
        setInfluencers(response.data.influencers || []);
        setGroups(response.data.groups || []);
      } else {
        toast({
          title: 'שגיאה',
          description: response.data.error || 'לא ניתן לטעון משפיענים',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'לא ניתן לטעון משפיענים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchInfluencers();
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = influencers.filter((inf) => {
      if (groupFilter !== 'all' && inf.group !== groupFilter) return false;
      if (verificationFilter === 'verified' && inf.needs_verification) return false;
      if (verificationFilter === 'unverified' && !inf.needs_verification) return false;
      if (!q) return true;
      return [inf.name, inf.instagram, inf.topics, inf.notes, inf.group, inf.contact]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
    return list.sort((a, b) => {
      if (sortKey === 'followers') {
        const diff = (b.followers_count ?? -1) - (a.followers_count ?? -1);
        if (diff !== 0) return diff;
      }
      return a.name.localeCompare(b.name, 'he');
    });
  }, [influencers, search, groupFilter, verificationFilter, sortKey]);

  const selectedList = influencers.filter((inf) => selected.has(inf.id));

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copySelected = async () => {
    try {
      await navigator.clipboard.writeText(formatForClient(selectedList));
      toast({ title: 'הועתק', description: `${selectedList.length} משפיענים הועתקו לשליחה ללקוח` });
    } catch {
      toast({ title: 'שגיאה', description: 'לא ניתן להעתיק ללוח', variant: 'destructive' });
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (inf: Influencer) => {
    setEditing(inf);
    setForm({
      name: inf.name || '',
      instagram: inf.instagram || '',
      followers: inf.followers || '',
      topics: inf.topics || '',
      notes: inf.notes || '',
      age: inf.age || '',
      group: inf.group || '',
      source_url: inf.source_url || '',
      contact: inf.contact || '',
      price: inf.price || '',
      needs_verification: !!inf.needs_verification,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'שגיאה', description: 'יש להזין שם', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      const response = editing
        ? await apiClient.post(`/api/influencers/${editing.id}`, form)
        : await apiClient.post('/api/influencers', form);
      if (response.data.success) {
        toast({ title: editing ? 'המשפיען עודכן' : 'המשפיען נוסף' });
        setDialogOpen(false);
        await fetchInfluencers();
      } else {
        toast({
          title: 'שגיאה',
          description: response.data.error || 'שמירה נכשלה',
          variant: 'destructive',
        });
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const response = await apiClient.post(`/api/influencers/${deleteTarget.id}/delete`);
      if (response.data.success) {
        toast({ title: 'המשפיען נמחק' });
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(deleteTarget.id);
          return next;
        });
        setDeleteTarget(null);
        await fetchInfluencers();
      } else {
        toast({
          title: 'שגיאה',
          description: response.data.error || 'מחיקה נכשלה',
          variant: 'destructive',
        });
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
        <LoadingSpinner text="טוען משפיענים..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#043841] to-[#3d817a] border-0 text-white">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Megaphone className="w-7 h-7" />
                <h1 className="text-2xl md:text-3xl font-bold">משפיענים</h1>
              </div>
              <p className="text-white/80 text-sm">
                ריכוז משפיענים להצעה ללקוחות · {influencers.length} במאגר
              </p>
            </div>
            <Button onClick={openCreate} className="bg-white text-[#043841] hover:bg-[#FEFAE0]">
              <Plus className="w-4 h-4 ml-2" />
              משפיען חדש
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש שם, תוכן, יוזר..."
            className="pr-9"
          />
        </div>
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger>
            <SelectValue placeholder="כל הרשימות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הרשימות</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group} value={group}>
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={verificationFilter}
          onValueChange={(v) => setVerificationFilter(v as VerificationFilter)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="verified">מאומתים</SelectItem>
            <SelectItem value="unverified">טעון אימות</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="followers">מיון: עוקבים</SelectItem>
            <SelectItem value="name">מיון: שם</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selected.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#3d817a]/30 bg-[#FEFAE0] px-4 py-3 shadow-sm">
          <span className="text-sm font-medium text-[#043841]">
            {selected.size} משפיענים נבחרו להצעה
          </span>
          <div className="flex gap-2">
            <Button size="sm" onClick={copySelected} className="bg-[#3d817a] hover:bg-[#2d6159]">
              <ClipboardCopy className="w-4 h-4 ml-2" />
              העתקה לשליחה ללקוח
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelected(new Set())}>
              <X className="w-4 h-4 ml-1" />
              ניקוי
            </Button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Megaphone}
              title="אין משפיענים להצגה"
              description="נסו לשנות את החיפוש, או הוסיפו משפיען חדש"
              actionLabel="משפיען חדש"
              onAction={openCreate}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-gray-500">{filtered.length} תוצאות</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((inf) => (
              <InfluencerCard
                key={inf.id}
                influencer={inf}
                selected={selected.has(inf.id)}
                onToggle={() => toggleSelected(inf.id)}
                onEdit={() => openEdit(inf)}
                onDelete={allowDelete ? () => setDeleteTarget(inf) : undefined}
              />
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? 'עריכת משפיען' : 'משפיען חדש'}</DialogTitle>
            <DialogDescription>רק שם הוא שדה חובה. אפשר להשלים את השאר בהמשך.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <InfluencerFields form={form} setForm={setForm} groupOptions={groups} />
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
        title="מחיקת משפיען"
        description={`למחוק את ${deleteTarget?.name || 'המשפיען'} מהמאגר?`}
        confirmText="מחיקה"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

function InfluencerCard({
  influencer: inf,
  selected,
  onToggle,
  onEdit,
  onDelete,
}: {
  influencer: Influencer;
  selected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  return (
    <Card
      className={`shadow-sm transition-colors ${
        selected ? 'border-[#3d817a] ring-1 ring-[#3d817a]' : 'border-gray-200'
      }`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <Checkbox
              checked={selected}
              onCheckedChange={onToggle}
              className="mt-1"
              aria-label={`בחירת ${inf.name}`}
            />
            <div className="min-w-0">
              <h3 className="font-bold text-[#043841] text-lg leading-tight">{inf.name}</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {inf.group && (
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-teal-50 text-teal-800 border-teal-200">
                    {inf.group}
                  </span>
                )}
                {inf.needs_verification && (
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    טעון אימות
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="w-4 h-4" />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="text-red-600 hover:text-red-700"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-sm">
          {inf.instagram ? (
            <a
              href={instagramUrl(inf.instagram)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-pink-700 hover:underline truncate"
              dir="ltr"
            >
              <Instagram className="w-4 h-4 shrink-0" />@{inf.instagram}
            </a>
          ) : (
            <span className="text-gray-400">אין קישור לאינסטגרם</span>
          )}
          <span className="font-semibold text-gray-800 shrink-0">
            {inf.followers || 'עוקבים: לא ידוע'}
          </span>
        </div>

        {inf.topics && <p className="text-sm text-gray-800">{inf.topics}</p>}

        {(inf.age || inf.price || inf.contact) && (
          <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-sm">
            {inf.age && (
              <>
                <dt className="text-gray-500">גיל</dt>
                <dd>{inf.age}</dd>
              </>
            )}
            {inf.price && (
              <>
                <dt className="text-gray-500">מחיר</dt>
                <dd>{inf.price}</dd>
              </>
            )}
            {inf.contact && (
              <>
                <dt className="text-gray-500">איש קשר</dt>
                <dd className="whitespace-pre-wrap">{inf.contact}</dd>
              </>
            )}
          </dl>
        )}

        {inf.notes && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-md p-2 whitespace-pre-wrap">
            {inf.notes}
          </p>
        )}

        {inf.source_url && (
          <a
            href={inf.source_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#3d817a] hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            מקור הנתונים
          </a>
        )}
      </CardContent>
    </Card>
  );
}

function InfluencerFields({
  form,
  setForm,
  groupOptions,
}: {
  form: InfluencerForm;
  setForm: React.Dispatch<React.SetStateAction<InfluencerForm>>;
  groupOptions: string[];
}) {
  const set = (field: keyof InfluencerForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="inf-name">שם *</Label>
        <Input id="inf-name" value={form.name} onChange={set('name')} required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="inf-instagram">אינסטגרם</Label>
          <Input
            id="inf-instagram"
            value={form.instagram}
            onChange={set('instagram')}
            placeholder="@handle או קישור לפרופיל"
            dir="ltr"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inf-followers">עוקבים</Label>
          <Input
            id="inf-followers"
            value={form.followers}
            onChange={set('followers')}
            placeholder="למשל: 120 אלף"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="inf-topics">אופי התוכן</Label>
        <Input
          id="inf-topics"
          value={form.topics}
          onChange={set('topics')}
          placeholder="אופנה, אימהות, הומור..."
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="inf-group">רשימה / קטגוריה</Label>
          <Input id="inf-group" list="inf-groups" value={form.group} onChange={set('group')} />
          <datalist id="inf-groups">
            {groupOptions.map((group) => (
              <option key={group} value={group} />
            ))}
          </datalist>
        </div>
        <div className="space-y-2">
          <Label htmlFor="inf-age">גיל</Label>
          <Input id="inf-age" value={form.age} onChange={set('age')} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="inf-contact">איש קשר / טלפון</Label>
          <Input id="inf-contact" value={form.contact} onChange={set('contact')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inf-price">מחיר</Label>
          <Input
            id="inf-price"
            value={form.price}
            onChange={set('price')}
            placeholder="למשל: 3,000 ₪ לסטורי"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="inf-source">קישור למקור</Label>
        <Input
          id="inf-source"
          value={form.source_url}
          onChange={set('source_url')}
          placeholder="https://"
          dir="ltr"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inf-notes">הערות</Label>
        <Textarea id="inf-notes" value={form.notes} onChange={set('notes')} rows={3} />
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <Checkbox
          checked={form.needs_verification}
          onCheckedChange={(checked) =>
            setForm((f) => ({ ...f, needs_verification: checked === true }))
          }
        />
        טעון אימות (קישור, עוקבים או התאמה לא נבדקו)
      </label>
    </>
  );
}
