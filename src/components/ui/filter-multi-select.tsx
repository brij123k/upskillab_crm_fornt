import * as React from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Checkbox } from './checkbox';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
  /** secondary text, e.g. employee id / role */
  hint?: string;
}

interface FilterMultiSelectProps {
  options: FilterOption[];
  /** selected values – empty array means "All" */
  value: string[];
  onChange: (value: string[]) => void;
  /** e.g. "All statuses" */
  allLabel: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Compact multi-select for filter bars.
 * - "Select all" / "Deselect all" at the top
 * - searchable list with checkboxes
 * - nothing selected = no filter ("All")
 */
export function FilterMultiSelect({
  options,
  value,
  onChange,
  allLabel,
  searchPlaceholder = 'Search…',
  disabled,
  className,
}: FilterMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const selected = React.useMemo(() => new Set(value), [value]);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.hint ?? ''}`.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (v: string) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    // keep the options' order
    onChange(options.map((o) => o.value).filter((x) => next.has(x)));
  };

  // Select all / deselect all act on the (searched) visible options
  const selectAllVisible = () => {
    const next = new Set(selected);
    visible.forEach((o) => next.add(o.value));
    onChange(options.map((o) => o.value).filter((x) => next.has(x)));
  };
  const deselectAllVisible = () => {
    const drop = new Set(visible.map((o) => o.value));
    onChange(value.filter((x) => !drop.has(x)));
  };

  const allVisibleSelected = visible.length > 0 && visible.every((o) => selected.has(o.value));

  const summary =
    value.length === 0
      ? allLabel
      : value.length === 1
        ? options.find((o) => o.value === value[0])?.label ?? '1 selected'
        : `${value.length} selected`;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(''); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm',
            'hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30 disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <span className={cn('truncate', value.length === 0 ? 'text-slate-500' : 'text-slate-800 font-medium')}>{summary}</span>
          <span className="flex items-center gap-1">
            {value.length > 1 && (
              <span className="rounded-full bg-orange-100 px-1.5 text-[11px] font-semibold text-orange-700 tabular-nums">{value.length}</span>
            )}
            {value.length > 0 && (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Clear"
                onClick={(e) => { e.stopPropagation(); onChange([]); }}
                className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[240px] p-0">
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-6 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-1.5 text-xs">
          <button
            type="button"
            onClick={allVisibleSelected ? deselectAllVisible : selectAllVisible}
            disabled={visible.length === 0}
            className="font-medium text-orange-600 hover:text-orange-700 disabled:opacity-40"
          >
            {allVisibleSelected ? 'Deselect all' : 'Select all'}
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={value.length === 0}
            className="text-slate-500 hover:text-slate-700 disabled:opacity-40"
          >
            Clear ({value.length})
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {visible.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-slate-400">No matches</p>
          ) : (
            visible.map((o) => (
              <label key={o.value} className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-slate-50">
                <Checkbox checked={selected.has(o.value)} onCheckedChange={() => toggle(o.value)} />
                <span className="flex-1 truncate text-slate-700">{o.label}</span>
                {o.hint && <span className="shrink-0 text-[11px] text-slate-400">{o.hint}</span>}
              </label>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
