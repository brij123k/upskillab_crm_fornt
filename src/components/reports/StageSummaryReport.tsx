import { useState, useEffect, useCallback, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  RefreshCw,
  Download,
  Filter,
  BarChart3,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  CalendarDays,
  Users,
  PhoneCall,
  CircleCheck,
  CalendarClock,
  Target,
  Layers,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*                             Stage Summary Report                           */
/* -------------------------------------------------------------------------- */
interface StageRow {
  leadStage: string;
  count: number;
}

interface ReportData {
  report: StageRow[];
  totalLead: number;
}

const dateFilterOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

// Visual palette – colours are assigned to stages by rank (largest first)
const STAGE_COLORS = [
  '#3b82f6', // blue
  '#f97316', // orange
  '#f43f5e', // rose
  '#8b5cf6', // violet
  '#22c55e', // green
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#ec4899', // pink
  '#6366f1', // indigo
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#a855f7', // purple
];
const OTHERS_COLOR = '#94a3b8';
const DONUT_SLICES = 5;

// KPI tiles: first tile is always Total Leads, the rest are the top stages
const KPI_TONES = [
  { icon: PhoneCall,     iconBg: 'bg-blue-100',    iconText: 'text-blue-600',    label: 'text-blue-600',    bar: 'bg-blue-500' },
  { icon: CircleCheck,   iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', label: 'text-emerald-700', bar: 'bg-emerald-500' },
  { icon: CalendarClock, iconBg: 'bg-violet-100',  iconText: 'text-violet-600',  label: 'text-violet-600',  bar: 'bg-violet-500' },
  { icon: Target,        iconBg: 'bg-rose-100',    iconText: 'text-rose-600',    label: 'text-rose-600',    bar: 'bg-rose-500' },
];

export function StageSummaryReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [dateFilter, setDateFilter] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // ──────────── Data fetching ────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateFilter === 'custom') {
        // If custom range is selected, require both dates
        if (!fromDate || !toDate) {
          // toast({ title: 'Missing Dates', description: 'Please select both start and end dates.', variant: 'destructive' });
          setLoading(false);
          return;
        }
        params.assignedDateFrom = fromDate;
        params.assignedDateTo = toDate;
      } else {
        params.assignedDateFilter = dateFilter;
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.stageSummery,
        params,
        null,
        true
      );
      // The API response may be { data, totalLead, report } – adjust if necessary
      if (response) {
        setData({
          report: response.data?.report || response.report || [],
          totalLead: response.data?.totalLead ?? response.totalLead ?? 0,
        });
      } else {
        setData(null);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load report', variant: 'destructive' });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, fromDate, toDate]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ──────────── Export to CSV ────────────
  const handleExport = () => {
    if (!data || !data.report.length) {
      toast({ title: 'No data to export' });
      return;
    }
    const rows = data.report;
    const csvHeaders = ['Lead Stage', 'Count', 'Percentage'];
    const total = data.totalLead || 1;
    const csvRows = rows.map(row => [
      row.leadStage,
      row.count,
      `${((row.count / total) * 100).toFixed(1)}%`
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stage_summary_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  };

  // ──────────── Helpers ────────────
  const hasActiveFilters = dateFilter !== 'today' || (dateFilter === 'custom' && (fromDate || toDate));

  // ──────────── Derived visuals (computed from the same report data) ────────────
  const total = data?.totalLead || 0;
  const pctOf = (count: number) => (total ? ((count / total) * 100).toFixed(1) : '0.0');

  const ranked = useMemo(
    () => [...(data?.report || [])].sort((a, b) => b.count - a.count),
    [data]
  );

  // Stable colour per stage, assigned by rank
  const stageColor = useMemo(() => {
    const map = new Map<string, string>();
    ranked.forEach((row, i) => map.set(row.leadStage, STAGE_COLORS[i % STAGE_COLORS.length]));
    return map;
  }, [ranked]);

  // Donut: top stages + "Others" bucket
  const donutData = useMemo(() => {
    const top = ranked.slice(0, DONUT_SLICES).map(r => ({
      name: r.leadStage,
      value: r.count,
      color: stageColor.get(r.leadStage) || OTHERS_COLOR,
    }));
    const rest = ranked.slice(DONUT_SLICES).reduce((sum, r) => sum + r.count, 0);
    if (rest > 0) top.push({ name: 'Others', value: rest, color: OTHERS_COLOR });
    return top.filter(d => d.value > 0);
  }, [ranked, stageColor]);

  const kpiStages = ranked.slice(0, 4);
  const activeDateLabel =
    dateFilter === 'custom' && fromDate && toDate
      ? `${fromDate} → ${toDate}`
      : dateFilterOptions.find(o => o.value === dateFilter)?.label;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Stage Summary</h3>
          <p className="text-sm text-slate-500">Lead distribution across stages</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-10 px-4 rounded-xl border-slate-200 text-slate-700"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={!data || loading}
            className="h-10 px-4 rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-600 text-white shadow-[0_6px_16px_-6px_rgba(249,115,22,0.7)]"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-1 h-9 px-3.5 text-xs rounded-xl"
        >
          <Filter className="w-3 h-3" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-orange-500" />
          )}
          {showFilters ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
        </Button>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-[130px]">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-8 text-xs rounded-xl">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {dateFilterOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {dateFilter === 'custom' && (
              <>
                <div className="relative w-[130px]">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="relative w-[130px]">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {!showFilters && activeDateLabel && (
          <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            {activeDateLabel}
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-3">
            <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
          </div>
          <p className="text-sm text-slate-500">Loading stage summary...</p>
        </div>
      ) : !data || data.report.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
            <BarChart3 className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-600">No stage data available</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or refresh</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── KPI tiles ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {/* Total Leads */}
            <div className="relative overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700">Total Leads</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">{total}</p>
                  <p className="text-xs text-slate-500 mt-1">{data.report.length} stages</p>
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-orange-100/50" />
            </div>

            {/* Top stages */}
            {kpiStages.map((row, i) => {
              const tone = KPI_TONES[i];
              const pct = pctOf(row.count);
              return (
                <div
                  key={row.leadStage}
                  className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0', tone.iconBg)}>
                      <tone.icon className={cn('w-6 h-6', tone.iconText)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm font-medium truncate', tone.label)} title={row.leadStage}>
                        {row.leadStage}
                      </p>
                      <p className="text-3xl font-bold text-slate-900 mt-1 tabular-nums">{row.count}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700">{pct}%</span> of total leads
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className={cn('h-full rounded-full', tone.bar)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Distribution + Breakdown ──────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Donut */}
            <div className="xl:col-span-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[15px] font-semibold text-slate-900">Lead Stage Distribution</h4>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                  <Layers className="w-3 h-3" />
                  Top {Math.min(DONUT_SLICES, ranked.length)}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-[200px] h-[200px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={92}
                        paddingAngle={1.5}
                        stroke="#fff"
                        strokeWidth={2}
                        startAngle={90}
                        endAngle={-270}
                      >
                        {donutData.map(d => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [`${value} (${pctOf(value)}%)`, name]}
                        contentStyle={{ borderRadius: 12, border: '1px solid #eceef3', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-slate-900 tabular-nums">{total}</span>
                    <span className="text-[11px] text-slate-500">Total Leads</span>
                  </div>
                </div>

                <ul className="flex-1 w-full space-y-2.5">
                  {donutData.map(d => (
                    <li key={d.name} className="flex items-center gap-2 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="flex-1 truncate text-slate-700" title={d.name}>{d.name}</span>
                      <span className="font-semibold text-slate-900 tabular-nums">{d.value}</span>
                      <span className="w-14 text-right text-xs text-slate-500 tabular-nums">({pctOf(d.value)}%)</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Breakdown table */}
            <div className="xl:col-span-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[15px] font-semibold text-slate-900">Lead Stage Breakdown</h4>
                <span className="text-xs text-slate-500">
                  Total: <span className="font-semibold text-orange-600">{total}</span>
                </span>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Lead Stage</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase text-right">Count</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase text-right">Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.report.map((item, idx) => {
                      const percentage = pctOf(item.count);
                      const color = stageColor.get(item.leadStage) || OTHERS_COLOR;
                      return (
                        <TableRow key={idx} className="border-b border-slate-50 transition-colors">
                          <TableCell className="text-sm font-medium text-slate-800 py-2.5">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                              {item.leadStage}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-slate-700 text-right tabular-nums py-2.5">{item.count}</TableCell>
                          <TableCell className="text-sm text-slate-600 text-right py-2.5">
                            <span className="inline-flex items-center justify-end gap-3">
                              <span className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <span
                                  className="block h-full rounded-full"
                                  style={{ width: `${percentage}%`, backgroundColor: color }}
                                />
                              </span>
                              <span className="w-12 tabular-nums">{percentage}%</span>
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}