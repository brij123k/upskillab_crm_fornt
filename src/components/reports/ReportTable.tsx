import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Columns3, RotateCcw, Lock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getDataHandlerWithToken } from '@/config/services';

/* ────────────────────────────────────────────────────────────────────────── */
/* Column customisation                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

export interface ReportColumn {
  key: string;
  label: string;
  /** Locked columns (identity column) are always shown and stay first. */
  locked?: boolean;
}

interface StoredPrefs {
  /** visible, non-locked keys in the order the user ticked them */
  order: string[];
  /** every key the user has seen – lets new dynamic columns default to visible */
  known: string[];
}

const PREFIX = 'report-columns:';

function readPrefs(key: string): StoredPrefs | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.order) && Array.isArray(parsed?.known)) return parsed;
  } catch {
    /* storage unavailable */
  }
  return null;
}

function writePrefs(key: string, prefs: StoredPrefs | null) {
  try {
    if (prefs) localStorage.setItem(PREFIX + key, JSON.stringify(prefs));
    else localStorage.removeItem(PREFIX + key);
  } catch {
    /* storage unavailable */
  }
}

/**
 * Per-report column chooser state.
 * - default: every column, in its natural order
 * - ticking a column appends it to the end → columns show in tick sequence
 * - unticking hides it
 * - columns never seen before (e.g. a new stage) appear at the end, visible
 */
export function useReportColumns(storageKey: string, columns: ReportColumn[]) {
  const [prefs, setPrefs] = useState<StoredPrefs | null>(() => readPrefs(storageKey));

  useEffect(() => {
    setPrefs(readPrefs(storageKey));
  }, [storageKey]);

  const columnKeySig = columns.map((c) => c.key).join('|');

  const visibleColumns = useMemo(() => {
    const locked = columns.filter((c) => c.locked);
    const free = columns.filter((c) => !c.locked);
    if (!prefs) return [...locked, ...free];
    const byKey = new Map(free.map((c) => [c.key, c]));
    const known = new Set(prefs.known);
    const ordered = prefs.order.map((k) => byKey.get(k)).filter(Boolean) as ReportColumn[];
    const fresh = free.filter((c) => !known.has(c.key));
    return [...locked, ...ordered, ...fresh];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs, columnKeySig]);

  const visibleKeys = useMemo(() => new Set(visibleColumns.map((c) => c.key)), [visibleColumns]);

  const save = useCallback(
    (order: string[]) => {
      const known = Array.from(new Set([...(prefs?.known || []), ...columns.filter((c) => !c.locked).map((c) => c.key)]));
      const next = { order, known };
      setPrefs(next);
      writePrefs(storageKey, next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prefs, columnKeySig, storageKey],
  );

  const currentFreeOrder = () => visibleColumns.filter((c) => !c.locked).map((c) => c.key);

  const toggle = (key: string) => {
    const order = currentFreeOrder();
    save(order.includes(key) ? order.filter((k) => k !== key) : [...order, key]);
  };

  const showAll = () => {
    const order = currentFreeOrder();
    const rest = columns.filter((c) => !c.locked && !order.includes(c.key)).map((c) => c.key);
    save([...order, ...rest]);
  };

  const hideAll = () => save([]);

  const reset = () => {
    setPrefs(null);
    writePrefs(storageKey, null);
  };

  const chooser = (
    <ColumnChooser
      columns={columns}
      visibleColumns={visibleColumns}
      onToggle={toggle}
      onShowAll={showAll}
      onHideAll={hideAll}
      onReset={reset}
    />
  );

  return {
    visibleColumns,
    isVisible: (key: string) => visibleKeys.has(key),
    /** number of rendered columns – use for colSpan on full-width rows */
    colCount: visibleColumns.length,
    chooser,
  };
}

interface ChooserProps {
  columns: ReportColumn[];
  visibleColumns: ReportColumn[];
  onToggle: (key: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onReset: () => void;
}

export function ColumnChooser({ columns, visibleColumns, onToggle, onShowAll, onHideAll, onReset }: ChooserProps) {
  const freeVisible = visibleColumns.filter((c) => !c.locked);
  const position = new Map(freeVisible.map((c, i) => [c.key, i + 1]));
  const total = columns.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 rounded-lg border-slate-200 text-slate-700">
          <Columns3 className="h-4 w-4" />
          Columns
          <span className="rounded-md bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-600 tabular-nums">
            {visibleColumns.length}/{total}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="border-b border-slate-100 px-3 py-2.5">
          <p className="text-sm font-semibold text-slate-800">Show columns</p>
          <p className="text-[11px] text-slate-500">Columns appear in the order you tick them.</p>
        </div>
        <div className="flex items-center gap-1 border-b border-slate-100 px-2 py-1.5">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onShowAll}>Select all</Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onHideAll}>Deselect all</Button>
          <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1 px-2 text-xs text-slate-500" onClick={onReset}>
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        </div>
        <div className="max-h-72 overflow-y-auto py-1">
          {columns.map((col) => {
            const pos = position.get(col.key);
            const checked = col.locked || pos !== undefined;
            return (
              <label
                key={col.key}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-slate-50',
                  col.locked && 'cursor-default opacity-70',
                )}
              >
                <Checkbox checked={checked} disabled={col.locked} onCheckedChange={() => !col.locked && onToggle(col.key)} />
                <span className="flex-1 truncate text-slate-700">{col.label}</span>
                {col.locked ? (
                  <Lock className="h-3 w-3 text-slate-400" />
                ) : pos !== undefined ? (
                  <span className="min-w-[1.25rem] rounded bg-orange-50 px-1 text-center text-[10px] font-semibold text-orange-700 tabular-nums">
                    {pos}
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Readable table styling (shared by every report)                             */
/* ────────────────────────────────────────────────────────────────────────── */

export const RT = {
  wrap: 'overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]',
  headRow: 'bg-slate-50 hover:bg-slate-50 border-b border-slate-200',
  th: 'h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-600 whitespace-nowrap text-center',
  thLeft: 'h-11 px-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-600 whitespace-nowrap text-left',
  thSticky: 'sticky left-0 z-20 bg-slate-50 border-r border-slate-200',
  row: 'border-b border-slate-100 bg-white hover:bg-slate-50/70 transition-colors',
  td: 'px-4 py-3 text-[13.5px] font-medium text-slate-800 text-center tabular-nums whitespace-nowrap',
  tdLeft: 'px-4 py-3 text-[13.5px] text-slate-900 text-left',
  tdSticky: 'sticky left-0 z-10 bg-white border-r border-slate-100',
  totalRow: 'bg-slate-50 hover:bg-slate-50 border-t border-slate-300 font-semibold',
  tdTotal: 'px-4 py-3 text-[13.5px] font-bold text-slate-900 text-center tabular-nums whitespace-nowrap',
} as const;

/** Number cell: zero/empty values are muted so real numbers stand out. */
export function Num({
  value,
  bold,
  format,
}: {
  value: number | string | null | undefined;
  bold?: boolean;
  format?: (v: number) => string;
}) {
  const n = typeof value === 'number' ? value : Number(value);
  const empty = value === null || value === undefined || value === '' || (!Number.isNaN(n) && n === 0);
  if (empty) return <span className="font-normal text-slate-400">{format ? format(0) : 0}</span>;
  const text = typeof value === 'number' ? (format ? format(value) : value.toLocaleString('en-IN')) : String(value);
  return <span className={cn('text-slate-900', bold ? 'font-bold' : 'font-medium')}>{text}</span>;
}

/** Title row above a report table with the column chooser on the right. */
export function ReportTableHeader({
  title,
  subtitle,
  chooser,
  children,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  chooser?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {title && <h3 className="text-base font-semibold text-slate-900">{title}</h3>}
        {subtitle && <p className="text-[13px] text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {chooser}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Access scope helpers (frontend only)                                        */
/* ────────────────────────────────────────────────────────────────────────── */

export function getCurrentUser(): any {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export function isAdminUser(user = getCurrentUser()) {
  const role = user?.role;
  return !!(role?.isSuperAdmin || String(role?.name || '').toLowerCase() === 'admin');
}

/** Numeric level of the logged-in user's role (null = admin / unknown). */
export function currentUserLevel(): number | null {
  const user = getCurrentUser();
  if (!user || isAdminUser(user)) return null;
  const lvl = Number(user?.role?.level);
  return Number.isFinite(lvl) && lvl > 0 ? lvl : null;
}

const levelNumber = (lvl: any): number => {
  if (typeof lvl === 'number') return lvl;
  const fromField = Number(lvl?.level ?? lvl?.levelNumber);
  if (Number.isFinite(fromField) && fromField > 0) return fromField;
  const m = String(lvl?.name ?? lvl ?? '').match(/\d+/);
  return m ? Number(m[0]) : 0;
};

/** Level options a user may pick: admin → all; others → own level and below. */
export function filterLevelsForUser<T>(levels: T[]): T[] {
  const own = currentUserLevel();
  if (own === null) return levels;
  return levels.filter((l) => {
    const n = levelNumber(l);
    return n > 0 && n <= own;
  });
}

/** Default level for a report: the user's own level (admin keeps fallback). */
export function defaultLevelForUser(fallback = '1'): string {
  const own = currentUserLevel();
  return own === null ? fallback : String(own);
}

/**
 * Ids of users the logged-in user may see in reports:
 * admin → null (everyone); others → self + direct/indirect reports.
 */
let scopeCache: { userId: string; promise: Promise<Set<string> | null> } | null = null;
export function loadReportScope(): Promise<Set<string> | null> {
  const user = getCurrentUser();
  if (!user || isAdminUser(user)) return Promise.resolve(null);
  const selfId = String(user.id || user._id || '');
  // cache per logged-in user (a different login in the same tab refetches)
  if (!scopeCache || scopeCache.userId !== selfId) {
    const promise = getDataHandlerWithToken('getAllUser', { status: 'all' }, null)
      .then((res: any) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        const ids = new Set<string>(list.map((u: any) => String(u?._id)).filter(Boolean));
        if (selfId) ids.add(selfId);
        return ids;
      })
      .catch(() => (selfId ? new Set([selfId]) : new Set<string>()));
    scopeCache = { userId: selfId, promise };
  }
  return scopeCache.promise;
}

/** React hook form of loadReportScope. `null` = unrestricted. */
export function useReportScope() {
  const [scope, setScope] = useState<Set<string> | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    loadReportScope().then((s) => alive && setScope(s));
    return () => {
      alive = false;
    };
  }, []);
  /** keep only rows whose employee id is in scope */
  const filterRows = useCallback(
    <T,>(rows: T[], getId: (row: T) => any): T[] => {
      if (scope === null) return rows; // admin – unrestricted
      if (scope === undefined) return isAdminUser() ? rows : []; // still loading – show nothing yet
      return rows.filter((r) => scope.has(String(getId(r) ?? '')));
    },
    [scope],
  );
  return { scope, ready: scope !== undefined, filterRows };
}

/** Clear cached scope (call on logout / user switch). */
export function resetReportScope() {
  scopeCache = null;
}

/**
 * Levels for the report level picker.
 * Admin: every level (original order). Others: own level and below,
 * own level first – so reports default to the user's own level.
 */
export async function fetchLevelsForUser(): Promise<any[]> {
  const res = await getDataHandlerWithToken('getAllLevels', null, null);
  const list: any[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
  if (currentUserLevel() === null) return list;
  return filterLevelsForUser(list).sort((a, b) => levelNumber(b) - levelNumber(a));
}
