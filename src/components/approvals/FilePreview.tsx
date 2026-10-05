import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Download, FileText, Film } from 'lucide-react';

export type PreviewKind = 'image' | 'video' | 'pdf' | 'other';

export function previewKind(contentType?: string | null, name?: string | null): PreviewKind {
  const type = contentType || '';
  const ext = (name || '').split('.').pop()?.toLowerCase() || '';
  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (type.startsWith('video/') || ['mp4', 'mov', 'webm'].includes(ext)) return 'video';
  if (type === 'application/pdf' || ext === 'pdf') return 'pdf';
  return 'other';
}

function MissingFile({ compact }: { compact?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 w-full h-full text-gray-400 bg-gray-100">
      <AlertCircle className={compact ? 'w-5 h-5' : 'w-10 h-10'} />
      {!compact && (
        <>
          <span className="text-sm font-medium text-gray-600">הקובץ לא זמין</span>
          <span className="text-xs">יש להעלות אותו מחדש</span>
        </>
      )}
    </div>
  );
}

interface FileThumbProps {
  url: string | null;
  contentType?: string | null;
  name?: string | null;
  className?: string;
}

/** Small square preview of a file: image / first video frame, or a type icon. */
export function FileThumb({ url, contentType, name, className = 'w-16 h-16' }: FileThumbProps) {
  const [failed, setFailed] = useState(false);
  const kind = previewKind(contentType, name);

  let content: React.ReactNode;
  if (!url || failed) {
    content = url ? <MissingFile compact /> : <FileText className="w-6 h-6 text-gray-400" />;
  } else if (kind === 'image') {
    content = (
      <img src={url} alt={name || ''} loading="lazy" className="w-full h-full object-cover" onError={() => setFailed(true)} />
    );
  } else if (kind === 'video') {
    content = (
      <div className="relative w-full h-full bg-black">
        <video src={`${url}#t=0.1`} preload="metadata" muted className="w-full h-full object-cover" onError={() => setFailed(true)} />
        <Film className="absolute bottom-1 left-1 w-4 h-4 text-white drop-shadow" />
      </div>
    );
  } else {
    content = (
      <div className="flex flex-col items-center justify-center text-gray-400">
        <FileText className="w-6 h-6" />
        {kind === 'pdf' && <span className="text-[10px] font-bold">PDF</span>}
      </div>
    );
  }

  return (
    <div className={`${className} flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center`}>
      {content}
    </div>
  );
}

interface FileViewerProps {
  url: string | null;
  contentType?: string | null;
  name?: string | null;
  large?: boolean;
}

/** Full-size inline viewer for image / video / PDF, with a friendly message when the file is missing. */
export function FileViewer({ url, contentType, name, large = true }: FileViewerProps) {
  const [failed, setFailed] = useState(false);
  const kind = previewKind(contentType, name);
  const height = large ? 'max-h-[75vh]' : 'max-h-[70vh]';

  if (!url || failed) {
    return (
      <div className="h-64">
        <MissingFile />
      </div>
    );
  }
  if (kind === 'image') {
    return (
      <div className="bg-gray-100 flex justify-center">
        <img src={url} alt={name || ''} className={`w-full ${height} object-contain`} onError={() => setFailed(true)} />
      </div>
    );
  }
  if (kind === 'video') {
    return <video src={url} controls className={`w-full ${height} bg-black`} onError={() => setFailed(true)} />;
  }
  if (kind === 'pdf') {
    return <iframe src={url} title={name || 'PDF'} className="w-full h-[75vh] bg-gray-100" />;
  }
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 bg-gray-50 text-gray-500">
      <FileText className="w-10 h-10" />
      <span className="text-sm">אין תצוגה מקדימה לקובץ זה</span>
    </div>
  );
}

interface FileViewerDialogProps {
  file: { url: string; downloadUrl?: string; contentType?: string | null; name?: string | null } | null;
  onClose: () => void;
}

export function FileViewerDialog({ file, onClose }: FileViewerDialogProps) {
  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden">
        {file && (
          <>
            <DialogHeader className="px-4 pt-4">
              <DialogTitle className="truncate text-base">{file.name}</DialogTitle>
            </DialogHeader>
            <FileViewer key={file.url} url={file.url} contentType={file.contentType} name={file.name} />
            {file.downloadUrl && (
              <div className="px-4 pb-4">
                <a href={file.downloadUrl} className="inline-flex items-center gap-1 text-sm text-[#043841] hover:underline">
                  <Download className="w-4 h-4" /> הורדה
                </a>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
