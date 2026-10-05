import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api';
import { PublicApproval, PublicApprovalFile } from '@/types';
import { AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { ST_LIVE } from './utils';
import { FileViewer } from './FilePreview';

const NAME_STORAGE_KEY = 'approval_responder_name';

function FilePreview({ file }: { file: PublicApprovalFile }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <FileViewer url={file.view_url} contentType={file.content_type} name={file.name} large={false} />
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-100">
        <span className="text-sm font-medium text-[#292f4c] truncate">{file.name}</span>
        {file.download_url && (
          <a
            href={file.download_url}
            className="flex items-center gap-1 text-sm text-[#043841] hover:underline flex-shrink-0"
          >
            <Download className="w-4 h-4" /> הורדה
          </a>
        )}
      </div>
    </div>
  );
}

interface ApprovalItemViewProps {
  item: PublicApproval;
  respondUrl: string;
  onUpdated: (item: PublicApproval) => void;
  showClientName?: boolean;
}

/** Client-facing view of one approval item: details, files and approve / request-changes form. */
export function ApprovalItemView({ item, respondUrl, onUpdated, showClientName = true }: ApprovalItemViewProps) {
  const [name, setName] = useState(() => localStorage.getItem(NAME_STORAGE_KEY) || '');
  const [comment, setComment] = useState('');
  const [mode, setMode] = useState<'idle' | 'changes'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const respond = async (decision: 'approve' | 'changes') => {
    setFormError('');
    if (!name.trim()) {
      setFormError('יש להזין שם');
      return;
    }
    if (decision === 'changes' && !comment.trim()) {
      setFormError('יש לפרט אילו תיקונים נדרשים');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post(respondUrl, { decision, name: name.trim(), comment: comment.trim() });
      if (res.data?.success) {
        localStorage.setItem(NAME_STORAGE_KEY, name.trim());
        setComment('');
        setMode('idle');
        onUpdated(res.data.approval);
      } else {
        setFormError(res.data?.error || 'שגיאה בשליחת התגובה');
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'שגיאה בשליחת התגובה');
    } finally {
      setSubmitting(false);
    }
  };

  const version = item.version;
  const response = version?.response;

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl shadow-sm p-5 space-y-2">
        {showClientName && item.client_name && <div className="text-sm text-gray-500">{item.client_name}</div>}
        {item.project_name && (
          <div className="text-xs font-semibold text-[#043841] bg-[#043841]/5 inline-block px-2 py-0.5 rounded">
            {item.project_name}
          </div>
        )}
        <h1 className="text-2xl font-bold text-[#292f4c]">{item.title}</h1>
        {item.description && <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>}
        {version && (
          <div className="text-xs text-gray-400">
            גרסה {version.number}
            {version.sent_at ? ` · ${new Date(version.sent_at).toLocaleDateString('he-IL')}` : ''}
          </div>
        )}
        {item.status === ST_LIVE && (
          <div className="text-sm font-semibold bg-purple-50 text-purple-800 rounded-lg p-3">החומרים עלו לאוויר</div>
        )}
        {version?.note && (
          <div className="text-sm bg-amber-50 text-amber-900 rounded-lg p-3 whitespace-pre-wrap">
            מה השתנה בגרסה זו: {version.note}
          </div>
        )}
      </section>

      {!item.available || !version ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-600">
          החומרים נמצאים כעת בעדכון. נעדכן אתכם כשהגרסה הבאה תהיה מוכנה.
        </div>
      ) : (
        <>
          <section className="space-y-4">
            {version.files.map((f) => (
              <FilePreview key={f.id} file={f} />
            ))}
          </section>

          {response ? (
            <section
              className={`rounded-xl p-5 flex items-start gap-3 ${
                response.decision === 'approve' ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'
              }`}
            >
              {response.decision === 'approve' ? (
                <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
              )}
              <div>
                <div className="font-bold">
                  {response.decision === 'approve' ? 'החומרים אושרו. תודה!' : 'בקשת התיקונים התקבלה. תודה!'}
                </div>
                <div className="text-sm opacity-80">
                  {response.name} · {new Date(response.at).toLocaleString('he-IL')}
                </div>
                {response.comment && <div className="text-sm mt-2 whitespace-pre-wrap">{response.comment}</div>}
              </div>
            </section>
          ) : item.can_respond ? (
            <section className="bg-white rounded-xl shadow-sm p-5 space-y-4">
              <h2 className="font-bold text-[#292f4c]">התגובה שלכם</h2>
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{formError}</div>
              )}
              <div className="space-y-2">
                <Label>שם מלא *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="name" />
              </div>
              <div className="space-y-2">
                <Label>{mode === 'changes' ? 'אילו תיקונים נדרשים? *' : 'הערות (אופציונלי)'}</Label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={mode === 'changes' ? 5 : 3}
                  maxLength={3000}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {mode === 'changes' ? (
                  <>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => respond('changes')}
                      disabled={submitting}
                    >
                      {submitting ? 'שולח...' : 'שליחת בקשת תיקונים'}
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => setMode('idle')} disabled={submitting}>
                      ביטול
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => respond('approve')}
                      disabled={submitting}
                    >
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                      {submitting ? 'שולח...' : 'אני מאשר/ת'}
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => setMode('changes')} disabled={submitting}>
                      <AlertCircle className="w-4 h-4 ml-2" />
                      נדרשים תיקונים
                    </Button>
                  </>
                )}
              </div>
            </section>
          ) : null}

          {item.previous_responses.length > 0 && (
            <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="font-bold text-[#292f4c] text-sm">תגובות על גרסאות קודמות</h2>
              {item.previous_responses.map((r) => (
                <div key={`${r.version}-${r.at}`} className="text-sm border-r-2 border-gray-200 pr-3">
                  <div className="text-gray-500 text-xs">
                    גרסה {r.version} · {r.decision === 'approve' ? 'אושר' : 'נדרשו תיקונים'} · {r.name}
                  </div>
                  {r.comment && <div className="whitespace-pre-wrap text-gray-700">{r.comment}</div>}
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

export function PublicShell({ title = 'אישור חומרים', children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f6f8]" dir="rtl">
      <header className="bg-[#043841] text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="/static/Vatkin_Logo.jpg" alt="Vatkin" className="h-10 w-auto rounded bg-white p-1" />
          <span className="font-semibold">{title}</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">{children}</main>
    </div>
  );
}
