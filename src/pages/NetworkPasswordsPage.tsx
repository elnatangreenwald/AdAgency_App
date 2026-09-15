import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  KeyRound,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

export interface NetworkPasswordEntry {
  id: string;
  client: string;
  platform: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  updated_at?: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  'אינסטגרם': 'bg-pink-100 text-pink-800 border-pink-200',
  'אינסטגרם עברית': 'bg-pink-100 text-pink-800 border-pink-200',
  'טיקטוק': 'bg-gray-900 text-white border-gray-800',
  'יוטיוב/גוגל': 'bg-red-100 text-red-800 border-red-200',
  'טוויטר': 'bg-sky-100 text-sky-800 border-sky-200',
  'פרמייר': 'bg-violet-100 text-violet-800 border-violet-200',
  'פולסים': 'bg-orange-100 text-orange-800 border-orange-200',
  'אפל איידי': 'bg-slate-100 text-slate-800 border-slate-200',
};

const SUGGESTED_PLATFORMS = [
  'אינסטגרם',
  'טיקטוק',
  'יוטיוב/גוגל',
  'פייסבוק',
  'טוויטר',
  'פרמייר',
  'פולסים',
  'אפל איידי',
  'ג׳מייל',
];

const EMPTY_FORM = {
  client: '',
  platform: '',
  username: '',
  password: '',
  url: '',
  notes: '',
};

function isAdminUser(user: { id: string; role?: string } | null) {
  return user?.id === 'admin' || user?.role === 'אדמין';
}

function platformBadgeClass(platform: string) {
  return PLATFORM_COLORS[platform] || 'bg-teal-50 text-teal-800 border-teal-200';
}

export function NetworkPasswordsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<NetworkPasswordEntry[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [revealAll, setRevealAll] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NetworkPasswordEntry | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<NetworkPasswordEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/admin/network_passwords');
      if (response.data.success) {
        setEntries(response.data.entries || []);
        setClients(response.data.clients || []);
        setPlatforms(response.data.platforms || []);
      } else {
        toast({
          title: 'שגיאה',
          description: response.data.error || 'לא ניתן לטעון סיסמאות',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'שגיאה',
        description: error.response?.data?.error || 'לא ניתן לטעון סיסמאות',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminUser(user)) {
      fetchEntries();
    }
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (clientFilter !== 'all' && entry.client !== clientFilter) return false;
      if (platformFilter !== 'all' && entry.platform !== platformFilter) return false;
      if (!q) return true;
      const haystack = [
        entry.client,
        entry.platform,
        entry.username,
        entry.password,
        entry.url,
        entry.notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [entries, search, clientFilter, platformFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, NetworkPasswordEntry[]>();
    for (const entry of filtered) {
      const key = entry.client || 'ללא לקוח';
      const list = map.get(key) || [];
      list.push(entry);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const copyText = async (label: string, value?: string) => {
    if (!value) {
      toast({ title: 'אין מה להעתיק', description: `${label} ריק`, variant: 'destructive' });
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: 'הועתק', description: `${label} הועתק ללוח` });
    } catch {
      toast({ title: 'שגיאה', description: 'לא ניתן להעתיק ללוח', variant: 'destructive' });
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (entry: NetworkPasswordEntry) => {
    setEditing(entry);
    setForm({
      client: entry.client || '',
      platform: entry.platform || '',
      username: entry.username || '',
      password: entry.password || '',
      url: entry.url || '',
      notes: entry.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client.trim() && !form.platform.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם לקוח או רשת',
        variant: 'destructive',
      });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        client: form.client.trim(),
        platform: form.platform.trim(),
        username: form.username.trim(),
        password: form.password,
        url: form.url.trim(),
        notes: form.notes.trim(),
      };
      const response = editing
        ? await apiClient.post(`/api/admin/network_passwords/${editing.id}`, payload)
        : await apiClient.post('/api/admin/network_passwords', payload);
      if (response.data.success) {
        toast({ title: editing ? 'הרשומה עודכנה' : 'הרשומה נוספה' });
        setDialogOpen(false);
        await fetchEntries();
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
      const response = await apiClient.post(
        `/api/admin/network_passwords/${deleteTarget.id}/delete`
      );
      if (response.data.success) {
        toast({ title: 'הרשומה נמחקה' });
        setDeleteTarget(null);
        await fetchEntries();
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

  if (!isAdminUser(user)) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner text="טוען סיסמאות..." />
      </div>
    );
  }

  const clientOptions = Array.from(new Set([...clients, ...entries.map((e) => e.client)].filter(Boolean)));
  const platformOptions = Array.from(
    new Set([...SUGGESTED_PLATFORMS, ...platforms, ...entries.map((e) => e.platform)].filter(Boolean))
  );

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#043841] to-[#3d817a] border-0 text-white">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <KeyRound className="w-7 h-7" />
                <h1 className="text-2xl md:text-3xl font-bold">סיסמאות רשתות</h1>
              </div>
              <p className="text-white/80 text-sm">
                ריכוז יוזרים וסיסמאות לרשתות חברתיות — גישה לאדמין בלבד
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => setRevealAll((v) => !v)}
                className="bg-white/15 text-white hover:bg-white/25 border-0"
              >
                {revealAll ? <EyeOff className="w-4 h-4 ml-2" /> : <Eye className="w-4 h-4 ml-2" />}
                {revealAll ? 'הסתר הכל' : 'הצג הכל'}
              </Button>
              <Button onClick={openCreate} className="bg-white text-[#043841] hover:bg-[#FEFAE0]">
                <Plus className="w-4 h-4 ml-2" />
                רשומה חדשה
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לקוח, רשת, יוזר..."
            className="pr-9"
          />
        </div>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger>
            <SelectValue placeholder="כל הלקוחות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הלקוחות</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client} value={client}>
                {client}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger>
            <SelectValue placeholder="כל הרשתות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הרשתות</SelectItem>
            {platforms.map((platform) => (
              <SelectItem key={platform} value={platform}>
                {platform}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {grouped.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={KeyRound}
              title="אין רשומות להצגה"
              description="נסו לשנות את החיפוש, או הוסיפו רשומה חדשה"
              actionLabel="רשומה חדשה"
              onAction={openCreate}
            />
          </CardContent>
        </Card>
      ) : (
        grouped.map(([client, clientEntries]) => (
          <section key={client} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#043841]">{client}</h2>
              <span className="text-sm text-gray-500">{clientEntries.length} רשומות</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {clientEntries.map((entry) => {
                const shown = revealAll || revealed[entry.id];
                return (
                  <Card key={entry.id} className="border-gray-200 shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full border font-medium ${platformBadgeClass(
                            entry.platform
                          )}`}
                        >
                          {entry.platform || 'ללא רשת'}
                        </span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setDeleteTarget(entry)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <SecretRow
                        label="שם משתמש"
                        value={entry.username}
                        onCopy={() => copyText('שם משתמש', entry.username)}
                      />
                      <SecretRow
                        label="סיסמה"
                        value={entry.password}
                        secret={!shown}
                        onToggle={() =>
                          setRevealed((prev) => ({ ...prev, [entry.id]: !prev[entry.id] }))
                        }
                        onCopy={() => copyText('סיסמה', entry.password)}
                      />
                      {entry.url && (
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-gray-500 shrink-0">קישור</span>
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#3d817a] hover:underline truncate flex items-center gap-1"
                          >
                            {entry.url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                      {entry.notes && (
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-md p-2 whitespace-pre-wrap">
                          {entry.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? 'עריכת רשומה' : 'רשומה חדשה'}</DialogTitle>
            <DialogDescription>
              שמרו יוזר וסיסמה לפי לקוח ורשת. השדות יוצגו רק לאדמין.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="np-client">לקוח / חשבון</Label>
                <Input
                  id="np-client"
                  list="np-clients"
                  value={form.client}
                  onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                  placeholder="לדוגמה: דרך עמי"
                />
                <datalist id="np-clients">
                  {clientOptions.map((client) => (
                    <option key={client} value={client} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="np-platform">רשת / שירות</Label>
                <Input
                  id="np-platform"
                  list="np-platforms"
                  value={form.platform}
                  onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                  placeholder="לדוגמה: אינסטגרם"
                />
                <datalist id="np-platforms">
                  {platformOptions.map((platform) => (
                    <option key={platform} value={platform} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="np-username">שם משתמש / מייל</Label>
              <Input
                id="np-username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="np-password">סיסמה</Label>
              <Input
                id="np-password"
                type="text"
                autoComplete="off"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="np-url">קישור</Label>
              <Input
                id="np-url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="np-notes">הערות</Label>
              <Textarea
                id="np-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
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
        title="מחיקת רשומה"
        description={`למחוק את ${deleteTarget?.platform || 'הרשומה'} של ${deleteTarget?.client || ''}?`}
        confirmText="מחיקה"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

function SecretRow({
  label,
  value,
  secret = false,
  onToggle,
  onCopy,
}: {
  label: string;
  value?: string;
  secret?: boolean;
  onToggle?: () => void;
  onCopy: () => void;
}) {
  const display = value ? (secret ? '••••••••' : value) : '—';
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <div className="flex items-center gap-1 min-w-0">
        <span className="font-medium text-gray-800 truncate" dir="ltr">
          {display}
        </span>
        {onToggle && value && (
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onToggle}>
            {secret ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
        )}
        {value && (
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onCopy}>
            <Copy className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
