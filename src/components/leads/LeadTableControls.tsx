import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Megaphone, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import ApiConfig from '@/config/apiConfig';
import { getDataHandlerWithToken } from '@/config/services';

/* ------------------------------------------------------------------ */
/* Sortable column header                                              */
/* ------------------------------------------------------------------ */

interface SortableThProps {
  label: string;
  /** Current `sort` filter value. */
  sort: string;
  /** Sort value meaning "newest first" for this column (e.g. `new`, `last_call_desc`). */
  desc: string;
  /** Sort value meaning "oldest first" for this column (e.g. `old`, `last_call_asc`). */
  asc: string;
  onSort: (value: string) => void;
  className?: string;
}

/** Click toggles new → old → new. Arrow shows the active direction. */
export function SortableTh({ label, sort, desc, asc, onSort, className }: SortableThProps) {
  const active = sort === desc ? 'desc' : sort === asc ? 'asc' : null;
  return (
    <th className={cn('px-3 py-2 text-left text-xs font-medium text-slate-500', className)} aria-sort={active === 'desc' ? 'descending' : active === 'asc' ? 'ascending' : 'none'}>
      <button
        type="button"
        onClick={() => onSort(active === 'desc' ? asc : desc)}
        className={cn('inline-flex items-center gap-1 rounded px-1 -mx-1 hover:bg-slate-100 hover:text-slate-700', active && 'text-orange-600')}
        title={active === 'desc' ? 'Newest first – click for oldest first' : active === 'asc' ? 'Oldest first – click for newest first' : 'Sort newest first'}
      >
        {label}
        {active === 'desc' ? <ArrowDown className="h-3.5 w-3.5" /> : active === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3 w-3 opacity-50" />}
      </button>
    </th>
  );
}

/* ------------------------------------------------------------------ */
/* Source campaign input with suggestions                              */
/* ------------------------------------------------------------------ */

// Shared across both pages for the session: repeated terms never hit the API twice.
const suggestionCache = new Map<string, string[]>();

interface CampaignSuggestInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CampaignSuggestInput({ value, onChange, placeholder = 'Campaign name', className }: CampaignSuggestInputProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [highlight, setHighlight] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

  useEffect(() => {
    if (!open) return;
    const term = value.trim().toLowerCase();
    const cached = suggestionCache.get(term);
    if (cached) {
      setItems(cached);
      return;
    }
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await getDataHandlerWithToken(ApiConfig.suggestSourceCampaigns, { q: term, limit: 20 }, null, true);
        const list: string[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        suggestionCache.set(term, list);
        if (id === reqId.current) setItems(list);
      } catch {
        if (id === reqId.current) setItems([]);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [value, open]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setHighlight(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || !items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault();
      pick(items[highlight]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="relative">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={cn('pr-8', className)}
        autoComplete="off"
      />
      {value ? (
        <button type="button" onClick={() => pick('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" title="Clear">
          <X className="h-3.5 w-3.5" />
        </button>
      ) : loading ? (
        <Loader2 className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-slate-400" />
      ) : null}
      {open && (items.length > 0 || loading) && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {loading && !items.length && <div className="px-3 py-2 text-xs text-slate-400">Searching…</div>}
          {items.map((c, i) => (
            <button
              key={c}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(c)}
              onMouseEnter={() => setHighlight(i)}
              className={cn('flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-700', i === highlight ? 'bg-orange-50 text-orange-700' : 'hover:bg-slate-50')}
            >
              <Megaphone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{c}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
