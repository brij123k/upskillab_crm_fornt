import { useRef, useState } from 'react';
import { CheckCircle2, Eye, FileText, Loader2, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Uploader = (file: File) => Promise<string | null | undefined>;

const isImageUrl = (url: string) => /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url);
const fileName = (url: string) => decodeURIComponent(url.split('?')[0].split('/').pop() || 'Document');

interface FileFieldProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  uploader: Uploader;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  accept?: string;
  className?: string;
}

/** Drop-zone style upload box: image thumbnail or file chip once uploaded. */
export function FileField({
  label,
  value,
  onChange,
  uploader,
  required,
  disabled,
  error,
  hint = 'JPG, PNG or PDF · max 5 MB',
  accept = 'image/*,application/pdf',
  className,
}: FileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploader(file);
      if (url) onChange(url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={pick} disabled={disabled || uploading} />
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5">
          {isImageUrl(value) ? (
            <img src={value} alt={label} className="h-12 w-12 shrink-0 rounded-lg border border-emerald-100 object-cover" />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600">
              <FileText className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
            </p>
            <p className="truncate text-xs text-slate-500">{fileName(value)}</p>
          </div>
          <a href={value} target="_blank" rel="noopener noreferrer" className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-slate-700" title="View">
            <Eye className="h-4 w-4" />
          </a>
          {!disabled && (
            <button type="button" onClick={() => inputRef.current?.click()} className="rounded-md px-2 py-1 text-xs font-medium text-orange-600 hover:bg-white">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Replace'}
            </button>
          )}
          {!disabled && !required && (
            <button type="button" onClick={() => onChange('')} className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-red-500" title="Remove">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl border-2 border-dashed px-3 py-3 text-left transition-colors',
            error ? 'border-red-300 bg-red-50/50' : 'border-slate-200 bg-slate-50/60 hover:border-orange-300 hover:bg-orange-50/40',
            (disabled || uploading) && 'cursor-not-allowed opacity-70',
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-orange-500 shadow-sm">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-700">{uploading ? 'Uploading…' : 'Click to upload'}</p>
            <p className="text-xs text-slate-400">{hint}</p>
          </div>
        </button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
