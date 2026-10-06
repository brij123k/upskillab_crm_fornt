import type { ComponentType, ReactNode } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Shared presentational pieces for report tabs (visual only, no data logic) */
/* -------------------------------------------------------------------------- */

export const CHART_COLORS = [
  '#f97316', // orange
  '#3b82f6', // blue
  '#22c55e', // green
  '#8b5cf6', // violet
  '#f43f5e', // rose
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#ec4899', // pink
  '#6366f1', // indigo
  '#06b6d4', // cyan
];
export const OTHERS_COLOR = '#94a3b8';

export type KpiTone = 'orange' | 'blue' | 'green' | 'violet' | 'rose' | 'teal' | 'amber';

const TONES: Record<KpiTone, { card: string; iconBg: string; icon: string; label: string; bar: string }> = {
  orange: { card: 'from-orange-50 border-orange-100',   iconBg: 'bg-orange-100',  icon: 'text-orange-600',  label: 'text-slate-700',   bar: 'bg-orange-500' },
  blue:   { card: 'from-blue-50 border-blue-100',       iconBg: 'bg-blue-100',    icon: 'text-blue-600',    label: 'text-blue-700',    bar: 'bg-blue-500' },
  green:  { card: 'from-emerald-50 border-emerald-100', iconBg: 'bg-emerald-100', icon: 'text-emerald-600', label: 'text-emerald-700', bar: 'bg-emerald-500' },
  violet: { card: 'from-violet-50 border-violet-100',   iconBg: 'bg-violet-100',  icon: 'text-violet-600',  label: 'text-violet-700',  bar: 'bg-violet-500' },
  rose:   { card: 'from-rose-50 border-rose-100',       iconBg: 'bg-rose-100',    icon: 'text-rose-600',    label: 'text-rose-700',    bar: 'bg-rose-500' },
  teal:   { card: 'from-teal-50 border-teal-100',       iconBg: 'bg-teal-100',    icon: 'text-teal-600',    label: 'text-teal-700',    bar: 'bg-teal-500' },
  amber:  { card: 'from-amber-50 border-amber-100',     iconBg: 'bg-amber-100',   icon: 'text-amber-600',   label: 'text-amber-700',   bar: 'bg-amber-500' },
};

/* ── KPI tile ────────────────────────────────────────────────────────────── */
interface KpiCardProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: KpiTone;
  /** 0–100, renders a thin progress bar under the tile */
  progress?: number;
}

export function KpiCard({ icon: Icon, label, value, sub, tone = 'orange', progress }: KpiCardProps) {
  const t = TONES[tone];
  return (
    <div className={cn('relative overflow-hidden rounded-2xl border bg-gradient-to-br via-white to-white p-5 shadow-sm', t.card)}>
      <div className="flex items-start gap-4">
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0', t.iconBg)}>
          <Icon className={cn('w-6 h-6', t.icon)} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-medium truncate', t.label)} title={label}>{label}</p>
          <div className="text-[26px] leading-8 font-bold text-slate-900 mt-1 tabular-nums truncate">{value}</div>
          {sub && <div className="text-xs text-slate-500 mt-1 truncate">{sub}</div>}
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
          <div className={cn('h-full rounded-full', t.bar)} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
        </div>
      )}
    </div>
  );
}

export function KpiGrid({ children, cols = 4 }: { children: ReactNode; cols?: 3 | 4 | 5 }) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 gap-4',
        cols === 3 && 'lg:grid-cols-3',
        cols === 4 && 'xl:grid-cols-4',
        cols === 5 && 'xl:grid-cols-5'
      )}
    >
      {children}
    </div>
  );
}

/* ── Section card with a title row ───────────────────────────────────────── */
interface ChartCardProps {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function ChartCard({ title, subtitle, action, className, children }: ChartCardProps) {
  return (
    <div className={cn('rounded-2xl border border-slate-100 bg-white p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h4 className="text-[15px] font-semibold text-slate-900">{title}</h4>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ── Donut with legend ───────────────────────────────────────────────────── */
export interface DonutDatum {
  name: string;
  value: number;
  color?: string;
}

interface DonutProps {
  data: DonutDatum[];
  centerValue: ReactNode;
  centerLabel: string;
  /** slices beyond this are grouped into "Others" */
  maxSlices?: number;
  formatValue?: (v: number) => string;
}

export function DonutWithLegend({ data, centerValue, centerLabel, maxSlices = 5, formatValue = v => String(v) }: DonutProps) {
  const sorted = [...data].filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, d) => s + d.value, 0);
  const slices: DonutDatum[] = sorted.slice(0, maxSlices).map((d, i) => ({
    ...d,
    color: d.color || CHART_COLORS[i % CHART_COLORS.length],
  }));
  const rest = sorted.slice(maxSlices).reduce((s, d) => s + d.value, 0);
  if (rest > 0) slices.push({ name: 'Others', value: rest, color: OTHERS_COLOR });
  const pct = (v: number) => (total ? ((v / total) * 100).toFixed(1) : '0.0');

  if (!slices.length) {
    return <div className="py-12 text-center text-sm text-slate-400">No data to display</div>;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative w-[190px] h-[190px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={56}
              outerRadius={88}
              paddingAngle={1.5}
              stroke="#fff"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
            >
              {slices.map(d => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${formatValue(value)} (${pct(value)}%)`, name]}
              contentStyle={{ borderRadius: 12, border: '1px solid #eceef3', fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <span className="text-xl font-bold text-slate-900 tabular-nums leading-tight">{centerValue}</span>
          <span className="text-[11px] text-slate-500">{centerLabel}</span>
        </div>
      </div>
      <ul className="flex-1 w-full space-y-2.5 min-w-0">
        {slices.map(d => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="flex-1 truncate text-slate-700" title={d.name}>{d.name}</span>
            <span className="font-semibold text-slate-900 tabular-nums">{formatValue(d.value)}</span>
            <span className="w-14 text-right text-xs text-slate-500 tabular-nums">({pct(d.value)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Ranked horizontal bars (e.g. top employees / sources) ───────────────── */
export interface BarDatum {
  name: string;
  value: number;
  sub?: string;
}

interface RankedBarsProps {
  data: BarDatum[];
  limit?: number;
  formatValue?: (v: number) => string;
  color?: string;
  showShare?: boolean;
}

export function RankedBars({ data, limit = 6, formatValue = v => String(v), color, showShare = true }: RankedBarsProps) {
  const sorted = [...data].filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, limit);
  const max = top[0]?.value || 1;
  const total = sorted.reduce((s, d) => s + d.value, 0) || 1;

  if (!top.length) {
    return <div className="py-12 text-center text-sm text-slate-400">No data to display</div>;
  }

  return (
    <ul className="space-y-3.5">
      {top.map((d, i) => (
        <li key={`${d.name}-${i}`} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,10rem)_auto_minmax(0,1fr)_3.5rem] items-center gap-x-3 gap-y-1">
          <span className="truncate text-sm text-slate-700" title={d.name}>
            {d.name}
            {d.sub && <span className="block text-[11px] text-slate-400 truncate">{d.sub}</span>}
          </span>
          <span className="text-sm font-semibold text-slate-900 tabular-nums text-right">{formatValue(d.value)}</span>
          <span className="col-span-2 sm:col-span-1 h-2 rounded-full bg-slate-100 overflow-hidden">
            <span
              className="block h-full rounded-full"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: color || CHART_COLORS[i % CHART_COLORS.length] }}
            />
          </span>
          {showShare && (
            <span className="hidden sm:block text-xs text-slate-500 text-right tabular-nums">
              {((d.value / total) * 100).toFixed(1)}%
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ── Target vs achieved progress list ────────────────────────────────────── */
export interface ProgressDatum {
  name: string;
  target: number;
  achieved: number;
}

interface ProgressListProps {
  data: ProgressDatum[];
  limit?: number;
  formatValue?: (v: number) => string;
}

export function TargetProgressList({ data, limit = 6, formatValue = v => String(v) }: ProgressListProps) {
  const rows = [...data].filter(d => d.target > 0 || d.achieved > 0).sort((a, b) => b.target - a.target).slice(0, limit);
  if (!rows.length) {
    return <div className="py-12 text-center text-sm text-slate-400">No data to display</div>;
  }
  return (
    <ul className="space-y-4">
      {rows.map((d, i) => {
        const pct = d.target > 0 ? Math.round((d.achieved / d.target) * 100) : 0;
        const hit = d.target > 0 && d.achieved >= d.target;
        return (
          <li key={`${d.name}-${i}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Avatar name={d.name} className="w-7 h-7 text-[10px]" />
              <span className="flex-1 truncate text-sm font-medium text-slate-700" title={d.name}>{d.name}</span>
              <span className="text-xs text-slate-500 tabular-nums">
                {formatValue(d.achieved)} / {formatValue(d.target)}
              </span>
              <span
                className={cn(
                  'ml-1 inline-flex min-w-[3rem] justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
                  hit ? 'bg-emerald-50 text-emerald-700' : pct >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                )}
              >
                {pct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={cn('h-full rounded-full', hit ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500')}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Conversion funnel (each step relative to the first, % vs previous) ──── */
export interface FunnelStep {
  name: string;
  value: number;
}

export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const base = steps[0]?.value || 0;
  if (!steps.length || steps.every(s => !s.value)) {
    return <div className="py-12 text-center text-sm text-slate-400">No data to display</div>;
  }
  return (
    <ul className="space-y-3">
      {steps.map((s, i) => {
        const width = base ? Math.max(2, (s.value / base) * 100) : s.value ? 100 : 0;
        const prev = i > 0 ? steps[i - 1].value : 0;
        const conv = i > 0 && prev ? ((s.value / prev) * 100).toFixed(1) : null;
        return (
          <li key={s.name} className="grid grid-cols-[8.5rem_minmax(0,1fr)_4.5rem] items-center gap-3">
            <span className="truncate text-sm text-slate-700" title={s.name}>{s.name}</span>
            <span className="relative h-7 rounded-lg bg-slate-50 overflow-hidden">
              <span
                className="absolute inset-y-0 left-0 rounded-lg flex items-center px-2.5 text-xs font-semibold text-white tabular-nums"
                style={{ width: `${width}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              >
                {width > 12 ? s.value.toLocaleString('en-IN') : ''}
              </span>
              {width <= 12 && (
                <span className="absolute inset-y-0 flex items-center text-xs font-semibold text-slate-700 tabular-nums" style={{ left: `calc(${width}% + 6px)` }}>
                  {s.value.toLocaleString('en-IN')}
                </span>
              )}
            </span>
            <span className="text-right text-xs text-slate-500 tabular-nums">{conv !== null ? `${conv}%` : '—'}</span>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Area trend chart (one or more series over an x-axis) ────────────────── */
export interface TrendSeries {
  key: string;
  label: string;
  color: string;
}

interface TrendChartProps {
  data: Record<string, any>[];
  xKey: string;
  series: TrendSeries[];
  height?: number;
  formatValue?: (v: number) => string;
}

export function TrendChart({ data, xKey, series, height = 260, formatValue = v => v.toLocaleString('en-IN') }: TrendChartProps) {
  if (!data.length) {
    return <div className="py-12 text-center text-sm text-slate-400">No data to display</div>;
  }
  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-3">
        {series.map(s => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
            <defs>
              {series.map(s => (
                <linearGradient key={s.key} id={`trend-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" vertical={false} />
            <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} minTickGap={16} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              formatter={(value: number, name: string) => [formatValue(value), series.find(s => s.key === name)?.label || name]}
              contentStyle={{ borderRadius: 12, border: '1px solid #eceef3', fontSize: 12 }}
            />
            {series.map(s => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2.25}
                fill={`url(#trend-${s.key})`}
                dot={data.length <= 14 ? { r: 3, fill: s.color, strokeWidth: 0 } : false}
                activeDot={{ r: 5 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ── Radial gauge for a single percentage ────────────────────────────────── */
export function Gauge({ value, label, sub }: { value: number; label: string; sub?: ReactNode }) {
  const v = Math.max(0, Math.min(100, value || 0));
  const data = [
    { name: 'done', value: v },
    { name: 'rest', value: 100 - v },
  ];
  const color = v >= 100 ? '#22c55e' : v >= 50 ? '#f97316' : '#f43f5e';
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[200px] h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              startAngle={180}
              endAngle={0}
              cy="100%"
              innerRadius={70}
              outerRadius={96}
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill={color} />
              <Cell fill="#f1f5f9" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="text-3xl font-bold text-slate-900 tabular-nums">{Math.round(value || 0)}%</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-slate-700">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5 text-center">{sub}</p>}
    </div>
  );
}

/* ── Heat-map chip for matrix cells (count + share) ──────────────────────── */
export function HeatChip({ count, pct }: { count: number; pct?: number }) {
  if (!count) return <span className="text-slate-300 font-normal">–</span>;
  const p = Math.max(0, Math.min(100, pct ?? 0));
  // 4 intensity steps keep the table calm but scannable
  const tone =
    p >= 40 ? 'bg-orange-500 text-white ring-orange-500'
    : p >= 20 ? 'bg-orange-200/80 text-orange-900 ring-orange-300'
    : p >= 8 ? 'bg-orange-100 text-orange-800 ring-orange-200'
    : 'bg-slate-50 text-slate-700 ring-slate-200';
  return (
    <span className="inline-flex flex-col items-center gap-0.5">
      <span className={cn('min-w-[2.25rem] px-2 py-1 rounded-lg text-[13px] font-semibold leading-none ring-1 ring-inset tabular-nums', tone)}>
        {count.toLocaleString('en-IN')}
      </span>
      {pct !== undefined && <span className="text-[10.5px] font-medium text-slate-400 tabular-nums">{p.toFixed(1)}%</span>}
    </span>
  );
}

/* ── Metric pill for highlighted numeric columns ─────────────────────────── */
const PILL_TONES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  slate: 'bg-slate-50 text-slate-700 ring-slate-200',
} as const;

export function MetricPill({ value, tone = 'slate' }: { value: ReactNode; tone?: keyof typeof PILL_TONES }) {
  const empty = value === 0 || value === '0' || value === null || value === undefined || value === '';
  if (empty) return <span className="text-slate-300 font-normal">0</span>;
  return (
    <span className={cn('inline-flex items-center justify-center min-w-[2.25rem] px-2.5 py-1 rounded-full text-[12.5px] font-semibold ring-1 ring-inset tabular-nums', PILL_TONES[tone])}>
      {value}
    </span>
  );
}

/* ── Employee identity cell (avatar + name + sub line) ───────────────────── */
export function PersonCell({ name, sub, children }: { name: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <Avatar name={name} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-slate-900 truncate">{name}</span>
          {children}
        </div>
        {sub && <div className="text-[11px] font-normal text-slate-400 truncate">{sub}</div>}
      </div>
    </div>
  );
}

/* ── Stage / status badge with meaning-based colours ─────────────────────── */
const STAGE_RULES: [RegExp, string][] = [
  [/admission|converted|enrol|won|paid|success|approved|completed|active/i, 'bg-emerald-50 text-emerald-700 ring-emerald-200'],
  [/interest/i, 'bg-green-50 text-green-700 ring-green-200'],
  [/follow|callback|call back|scheduled|pcat/i, 'bg-violet-50 text-violet-700 ring-violet-200'],
  [/new|fresh|open/i, 'bg-blue-50 text-blue-700 ring-blue-200'],
  [/dnp|not pick|no answer|rejected|failed|cancel|resigned|blocked/i, 'bg-rose-50 text-rose-700 ring-rose-200'],
  [/cbl|busy|pending|probation|hold|registration/i, 'bg-amber-50 text-amber-700 ring-amber-200'],
  [/lost|junk|invalid|inactive|closed|dead/i, 'bg-slate-100 text-slate-600 ring-slate-200'],
];
const HASH_TONES = [
  'bg-orange-50 text-orange-700 ring-orange-200',
  'bg-sky-50 text-sky-700 ring-sky-200',
  'bg-teal-50 text-teal-700 ring-teal-200',
  'bg-indigo-50 text-indigo-700 ring-indigo-200',
  'bg-pink-50 text-pink-700 ring-pink-200',
];

export function stageTone(label?: string | null) {
  const text = String(label || '');
  for (const [re, cls] of STAGE_RULES) if (re.test(text)) return cls;
  const code = text.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return HASH_TONES[code % HASH_TONES.length];
}

export function StageBadge({ label, className }: { label?: string | null; className?: string }) {
  if (!label) return <span className="text-slate-300">—</span>;
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', stageTone(label), className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

/* ── Neutral tag (source, campaign, pool …) ───────────────────────────────── */
export function Tag({ children, className }: { children?: ReactNode; className?: string }) {
  if (children === null || children === undefined || children === '' || children === '—') {
    return <span className="text-slate-300">—</span>;
  }
  return (
    <span className={cn('inline-flex max-w-[12rem] truncate rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700', className)}>
      {children}
    </span>
  );
}

/* ── Avatar initials (used in employee tables/lists) ─────────────────────── */
const AVATAR_TONES = [
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-rose-100 text-rose-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
];

export function initials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function Avatar({ name, className }: { name?: string | null; className?: string }) {
  const code = (name || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-semibold flex-shrink-0',
        AVATAR_TONES[code % AVATAR_TONES.length],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}

/** Sum stage counts across a list of rows that each carry `stages: {leadStage,count}[]` */
export function sumStages(rows: { stages?: { leadStage: string; count: number }[] }[]): DonutDatum[] {
  const map = new Map<string, number>();
  rows.forEach(r => r.stages?.forEach(s => map.set(s.leadStage, (map.get(s.leadStage) || 0) + (s.count || 0))));
  return Array.from(map, ([name, value]) => ({ name, value }));
}
