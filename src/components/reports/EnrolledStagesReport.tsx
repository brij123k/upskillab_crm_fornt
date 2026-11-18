import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart3, CheckCircle2, ChevronDown, ChevronUp, Download, Filter, GraduationCap, Layers, Loader2, RefreshCw, Search, Users, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { KpiCard, KpiGrid, ChartCard, DonutWithLegend, RankedBars, HeatChip, Avatar } from './ReportUI';
import { defaultLevelForUser, fetchLevelsForUser, isAdminUser, useReportColumns, RT, ReportTableHeader } from './ReportTable';

/* -------------------------------------------------------------------------- */
/*                               Type Definitions                              */
/* -------------------------------------------------------------------------- */
type Stage = { _id: string; name: string; color?: string; description?: string };
type Counts = { total: number; byStage: Record<string, number> };
type BatchRow = Counts & { batchId: string; batchCode: string; courseName?: string; status?: string; startDate?: string };
type PersonRow = Counts & { userId: string; name: string; employeeId?: number; roleName?: string; level?: number | null; teamSize: number };
type ReportData = {
  groupBy: 'batch' | 'counsellor';
  stages: Stage[];
  totals: Counts & { active: number; assigned: number };
  unassigned?: Counts | null;
  rows: (BatchRow | PersonRow)[];
};
type Options = {
  stages: Stage[];
  courses: { upskillabId: string; courseName?: string }[];
  batches: { upskillabId: string; batchCode?: string; courseId?: string; courseName?: string; status?: string }[];
};
type Drill = { userId?: string; userName?: string; stageId?: string; stageName?: string; batchId?: string; batchCode?: string };

const ALL = 'all';
const levelNum = (l: any) => {
  const n = Number(l?.level ?? l?.levelNumber);
  if (Number.isFinite(n) && n > 0) return n;
  const m = String(l?.name ?? '').match(/\d+/);
  return m ? Number(m[0]) : 0;
};
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

const csvCell = (v: any) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
function downloadCsv(filename: string, rows: any[][]) {
  const blob = new Blob(['﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const filterCls = 'h-8 text-xs rounded-xl';

/* -------------------------------------------------------------------------- */
/*                              Main Component                                 */
/* -------------------------------------------------------------------------- */
export function EnrolledStagesReport() {
  const [params, setParams] = useSearchParams();
  const [options, setOptions] = useState<Options | null>(null);
  const [levels, setLevels] = useState<any[]>([]);
  const [groupBy, setGroupBy] = useState<'batch' | 'counsellor'>(params.get('view') === 'counsellor' ? 'counsellor' : 'batch');
  const [courseId, setCourseId] = useState(params.get('courseId') || '');
  const [batchId, setBatchId] = useState(params.get('batchId') || '');
  const [level, setLevel] = useState<string>(() => (isAdminUser() ? ALL : defaultLevelForUser('1')));
  const [team, setTeam] = useState(false);
  const [active, setActive] = useState(ALL);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(!!(params.get('courseId') || params.get('batchId')));
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [drill, setDrill] = useState<Drill | null>(null);

  useEffect(() => {
    getDataHandlerWithToken(ApiConfig.enrolledStageReportOptions, null, null, true)
      .then((res: any) => setOptions(res))
      .catch(() => setOptions({ stages: [], courses: [], batches: [] }));
    fetchLevelsForUser().then(setLevels).catch(() => setLevels([]));
  }, []);

  const batchOptions = useMemo(
    () => (options?.batches || []).filter((b) => !courseId || b.courseId === courseId),
    [options, courseId],
  );

  // keep deep-link params in sync (shareable URL)
  useEffect(() => {
    const next = new URLSearchParams(params);
    courseId ? next.set('courseId', courseId) : next.delete('courseId');
    batchId ? next.set('batchId', batchId) : next.delete('batchId');
    groupBy === 'counsellor' ? next.set('view', 'counsellor') : next.delete('view');
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, batchId, groupBy]);

  const query = useMemo(() => {
    const q: Record<string, string> = { groupBy };
    if (courseId) q.courseId = courseId;
    if (batchId) q.batchId = batchId;
    if (groupBy === 'counsellor') {
      q.level = level;
      q.team = String(team);
    }
    if (active !== ALL) q.active = active;
    if (fromDate) q.fromDate = fromDate;
    if (toDate) q.toDate = toDate;
    return q;
  }, [groupBy, courseId, batchId, level, team, active, fromDate, toDate]);

  // ─── Fetch report data ───
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await getDataHandlerWithToken(ApiConfig.enrolledStageReport, query, null, true);
      setData(res);
    } catch (e: any) {
      setData(null);
      toast({ title: 'Error', description: e?.message || 'Failed to load the enrolled stage report', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Derived data ───
  const stages = data?.stages || [];
  const isBatch = (data?.groupBy || groupBy) === 'batch';
  const totals = data?.totals || { total: 0, byStage: {}, active: 0, assigned: 0 };

  const columnsUi = useReportColumns(isBatch ? 'enrolled-stages-batch' : 'enrolled-stages', [
    { key: 'row', label: isBatch ? 'Batch' : 'Counsellor', locked: true },
    ...(isBatch ? [{ key: '__status', label: 'Batch status' }] : [{ key: '__level', label: 'Level' }, ...(team ? [{ key: '__team', label: 'Team size' }] : [])]),
    ...stages.map((s) => ({ key: `stage:${s._id}`, label: s.name })),
    { key: '__total', label: 'Total' },
  ]);
  const dataColumns = columnsUi.visibleColumns.filter((c) => !c.locked);

  const rows = useMemo(() => {
    const list = data?.rows || [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r: any) =>
      (isBatch ? `${r.batchCode} ${r.courseName ?? ''}` : `${r.name} ${r.employeeId ?? ''} ${r.roleName ?? ''}`).toLowerCase().includes(q),
    );
  }, [data, searchTerm, isBatch]);

  // Column totals for the rows shown (batch rows can overlap, so KPIs use data.totals)
  const columnTotals = useMemo(() => {
    const t: Record<string, number> = { total: 0 };
    for (const r of rows) {
      t.total += r.total;
      for (const s of stages) t[s._id] = (t[s._id] || 0) + (r.byStage[s._id] || 0);
    }
    return t;
  }, [rows, stages]);

  const levelOptions = levels.map((l) => ({ value: String(levelNum(l)), label: l?.name || `Level ${levelNum(l)}` })).filter((l) => l.value !== '0');
  const courseName = options?.courses.find((c) => c.upskillabId === courseId)?.courseName;
  const batchCode = options?.batches.find((b) => b.upskillabId === batchId)?.batchCode;
  const context = [courseName || (courseId ? courseId : 'All courses'), batchCode || (batchId ? batchId : 'all batches')].join(' · ');

  const hasActiveFilters = !!(courseId || batchId || active !== ALL || fromDate || toDate || searchTerm || (groupBy === 'counsellor' && (team || level !== ALL)));
  const clearFilters = () => {
    setCourseId('');
    setBatchId('');
    setActive(ALL);
    setFromDate('');
    setToDate('');
    setSearchTerm('');
    setTeam(false);
    setLevel(isAdminUser() ? ALL : defaultLevelForUser('1'));
  };

  // ─── Export CSV ───
  const handleExport = () => {
    if (!rows.length) {
      toast({ title: 'No data to export' });
      return;
    }
    const head = isBatch
      ? ['Batch', 'Course', 'Batch status', ...stages.map((s) => s.name), 'Total']
      : ['Counsellor', 'Employee ID', 'Role', 'Level', ...(team ? ['Team size'] : []), ...stages.map((s) => s.name), 'Total'];
    const body = rows.map((r: any) =>
      isBatch
        ? [r.batchCode, r.courseName || '', r.status || '', ...stages.map((s) => r.byStage[s._id] || 0), r.total]
        : [r.name, r.employeeId ?? '', r.roleName ?? '', r.level ?? '', ...(team ? [r.teamSize] : []), ...stages.map((s) => r.byStage[s._id] || 0), r.total],
    );
    if (!isBatch && data?.unassigned?.total) {
      body.push(['Not assigned', '', '', '', ...(team ? [''] : []), ...stages.map((s) => data.unassigned!.byStage[s._id] || 0), data.unassigned.total]);
    }
    body.push([isBatch ? 'Total (all students)' : 'All students', ...(isBatch ? ['', ''] : ['', '', '', ...(team ? [''] : [])]), ...stages.map((s) => totals.byStage[s._id] || 0), totals.total]);
    downloadCsv(`enrolled_stages_${isBatch ? 'batches' : 'counsellors'}_${new Date().toISOString().split('T')[0]}.csv`, [head, ...body]);
    toast({ title: 'Exported Successfully!' });
  };

  const stageDonut = stages.map((s) => ({ name: s.name, value: totals.byStage[s._id] || 0, color: s.color }));
  const rankData = rows.slice(0, 50).map((r: any) => ({
    name: isBatch ? r.batchCode : r.name,
    value: r.total,
    sub: isBatch ? r.courseName : r.roleName,
  }));

  const openCell = (r: any | null, stage: Stage | null, value: number) => {
    if (!value) return;
    if (!r) return setDrill({ stageId: stage?._id, stageName: stage?.name });
    if (isBatch) return setDrill({ batchId: r.batchId, batchCode: r.batchCode, stageId: stage?._id, stageName: stage?.name });
    return setDrill({ userId: r.userId, userName: r.name, stageId: stage?._id, stageName: stage?.name });
  };

  const cellButton = (r: any | null, stage: Stage | null, value: number, total: number, strong = false) => (
    <button type="button" disabled={!value} onClick={() => openCell(r, stage, value)} className={cn(value && 'cursor-pointer hover:opacity-80')} title={value ? 'View students' : undefined}>
      {strong ? (
        <span className="inline-flex min-w-[2.75rem] justify-center rounded-md bg-slate-100 text-slate-900 ring-1 ring-inset ring-slate-200 px-2.5 py-1 text-[13px] font-bold tabular-nums">
          {value.toLocaleString('en-IN')}
        </span>
      ) : (
        <HeatChip count={value} pct={total ? (value / total) * 100 : 0} />
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Enrolled Students – Stages</h3>
          <p className="text-sm text-slate-500">Enrolled students by current stage, per batch or per counsellor</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="rounded-xl border-slate-200 hover:border-orange-200 hover:bg-orange-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={!data || loading}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1 h-8 text-xs rounded-xl"
          >
            <Filter className="w-3 h-3" />
            Filters
            {hasActiveFilters && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
            {showFilters ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>

          {/* View switch */}
          <div className="inline-flex h-8 items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5">
            {(['batch', 'counsellor'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setGroupBy(v)}
                className={cn(
                  'h-7 rounded-lg px-3 text-xs font-medium transition-colors',
                  groupBy === v ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                )}
              >
                {v === 'batch' ? 'By batch' : 'By counsellor'}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs rounded-xl text-slate-500">
              <X className="w-3 h-3 mr-1" /> Clear
            </Button>
          )}

          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 w-full mt-2 pt-2 border-t border-slate-100">
              <div className="w-full sm:w-[200px]">
                <SearchableDropdown
                  options={[{ value: '', label: 'All courses' }, ...(options?.courses || []).map((c) => ({ value: c.upskillabId, label: c.courseName || c.upskillabId }))]}
                  value={courseId}
                  onValueChange={(v) => {
                    setCourseId(v || '');
                    setBatchId('');
                  }}
                  placeholder="All courses"
                  searchPlaceholder="Search course…"
                  showBadge={false}
                  triggerClassName={filterCls}
                />
              </div>
              <div className="w-full sm:w-[180px]">
                <SearchableDropdown
                  options={[{ value: '', label: 'All batches' }, ...batchOptions.map((b) => ({ value: b.upskillabId, label: `${b.batchCode || b.upskillabId}${b.status ? ` · ${b.status}` : ''}` }))]}
                  value={batchId}
                  onValueChange={(v) => setBatchId(v || '')}
                  placeholder="All batches"
                  searchPlaceholder="Search batch…"
                  showBadge={false}
                  triggerClassName={filterCls}
                />
              </div>
              <div className="w-[130px]">
                <Select value={active} onValueChange={setActive}>
                  <SelectTrigger className={filterCls}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL} className="text-xs">All students</SelectItem>
                    <SelectItem value="active" className="text-xs">Active only</SelectItem>
                    <SelectItem value="inactive" className="text-xs">Inactive only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {groupBy === 'counsellor' && (
                <>
                  <div className="w-[130px]">
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger className={filterCls}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL} className="text-xs">All levels</SelectItem>
                        {levelOptions.map((l) => <SelectItem key={l.value} value={l.value} className="text-xs">{l.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex h-8 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600">
                    <Switch checked={team} onCheckedChange={setTeam} className="scale-75" />
                    Team view
                  </label>
                </>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Enrolled</span>
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-[130px] h-8 px-2 text-xs border rounded-xl bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <span className="text-[11px] text-slate-400">to</span>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-[130px] h-8 px-2 text-xs border rounded-xl bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div className="relative w-48">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <Input
                  placeholder={groupBy === 'batch' ? 'Search batch / course…' : 'Search counsellor…'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8 text-xs rounded-xl border-slate-200"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-orange-400 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading enrolled students…</p>
          </div>
        </div>
      ) : !data || !rows.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
          <BarChart3 className="w-14 h-14 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No enrolled students found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting the filters</p>
        </div>
      ) : (
        <div className={cn('space-y-5', loading && 'opacity-60 transition-opacity')}>
          <KpiGrid cols={4}>
            <KpiCard icon={GraduationCap} tone="orange" label="Enrolled Students" value={totals.total.toLocaleString('en-IN')} sub={context} />
            <KpiCard icon={CheckCircle2} tone="green" label="Active on Upskillab" value={totals.active.toLocaleString('en-IN')} sub={`${pct(totals.active, totals.total)}% of students`} progress={pct(totals.active, totals.total)} />
            <KpiCard icon={Users} tone="blue" label="Assigned" value={totals.assigned.toLocaleString('en-IN')} sub={`${(totals.total - totals.assigned).toLocaleString('en-IN')} not assigned`} progress={pct(totals.assigned, totals.total)} />
            <KpiCard icon={Layers} tone="violet" label={isBatch ? 'Batches' : 'Counsellors'} value={rows.length} sub={`${stages.length} stages`} />
          </KpiGrid>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ChartCard title="Stage Distribution" subtitle={context}>
              <DonutWithLegend data={stageDonut} centerValue={totals.total.toLocaleString('en-IN')} centerLabel="Students" maxSlices={6} />
            </ChartCard>
            <ChartCard title={isBatch ? 'Students per Batch' : 'Students per Counsellor'} subtitle={isBatch ? 'Largest batches first' : team ? 'Including each person’s team' : 'Assigned directly'}>
              <RankedBars data={rankData} limit={7} formatValue={(v) => v.toLocaleString('en-IN')} />
            </ChartCard>
          </div>

          {/* Main Table */}
          <ReportTableHeader
            title={isBatch ? 'Batch × Stage' : 'Counsellor × Stage'}
            subtitle="Click a number to see the students"
            chooser={columnsUi.chooser}
          />
          <div className={RT.wrap}>
            <Table>
              <TableHeader>
                <TableRow className={RT.headRow}>
                  <TableHead className={cn(RT.thLeft, RT.thSticky, 'min-w-[200px]')}>{isBatch ? 'Batch' : 'Counsellor'}</TableHead>
                  {dataColumns.map((c) => {
                    const stage = c.key.startsWith('stage:') ? stages.find((s) => `stage:${s._id}` === c.key) : null;
                    return (
                      <TableHead key={c.key} className={cn(RT.th, 'min-w-[110px]')} title={stage?.description || undefined}>
                        <div className="flex flex-col items-center">
                          <span className="inline-flex items-center gap-1.5">
                            {stage && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color || '#94a3b8' }} />}
                            {c.label}
                          </span>
                          {stage && totals.total > 0 && (
                            <span className="text-[10px] font-normal normal-case tracking-normal text-slate-400">{pct(totals.byStage[stage._id] || 0, totals.total)}%</span>
                          )}
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r: any) => (
                  <TableRow key={isBatch ? r.batchId : r.userId} className={RT.row}>
                    <TableCell className={cn(RT.tdLeft, RT.tdSticky, 'font-medium text-slate-800')}>
                      {isBatch ? (
                        <div>
                          <p className="font-medium text-slate-900">{r.batchCode}</p>
                          <p className="text-xs text-slate-500">{[r.courseName, r.startDate && `from ${fmtDate(r.startDate)}`].filter(Boolean).join(' · ')}</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.name} className="h-8 w-8 text-[11px]" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{r.name}</p>
                            <p className="truncate text-xs text-slate-500">{[r.employeeId, r.roleName].filter(Boolean).join(' · ')}</p>
                          </div>
                        </div>
                      )}
                    </TableCell>
                    {dataColumns.map((c) => {
                      if (c.key === '__status') return <TableCell key={c.key} className={RT.td}><span className="text-xs text-slate-600">{r.status || '—'}</span></TableCell>;
                      if (c.key === '__level') return <TableCell key={c.key} className={RT.td}>{r.level ?? '—'}</TableCell>;
                      if (c.key === '__team') return <TableCell key={c.key} className={RT.td}>{r.teamSize}</TableCell>;
                      if (c.key === '__total') return <TableCell key={c.key} className={RT.td}>{cellButton(r, null, r.total, 0, true)}</TableCell>;
                      const stage = stages.find((s) => `stage:${s._id}` === c.key)!;
                      return <TableCell key={c.key} className={RT.td}>{cellButton(r, stage, r.byStage[stage._id] || 0, columnTotals[stage._id] || 0)}</TableCell>;
                    })}
                  </TableRow>
                ))}

                {!isBatch && data.unassigned && data.unassigned.total > 0 && (
                  <TableRow className={cn(RT.row, 'bg-rose-50/40')}>
                    <TableCell className={cn(RT.tdLeft, 'sticky left-0 z-10 bg-rose-50 font-medium text-rose-700')}>Not assigned</TableCell>
                    {dataColumns.map((c) => {
                      const r = { userId: 'unassigned', name: 'Not assigned' };
                      if (c.key === '__total') return <TableCell key={c.key} className={RT.td}>{cellButton(r, null, data.unassigned!.total, 0, true)}</TableCell>;
                      if (c.key.startsWith('stage:')) {
                        const stage = stages.find((s) => `stage:${s._id}` === c.key)!;
                        return <TableCell key={c.key} className={RT.td}>{cellButton(r, stage, data.unassigned!.byStage[stage._id] || 0, 0)}</TableCell>;
                      }
                      return <TableCell key={c.key} className={cn(RT.td, 'text-slate-400')}>—</TableCell>;
                    })}
                  </TableRow>
                )}

                {/* Totals Row – real student totals (a student in two batches counts once) */}
                <TableRow className={RT.totalRow}>
                  <TableCell className={cn(RT.tdLeft, 'sticky left-0 z-10 bg-slate-100 font-semibold text-slate-800')}>Total students</TableCell>
                  {dataColumns.map((c) => {
                    if (c.key === '__total') {
                      return (
                        <TableCell key={c.key} className={RT.tdTotal}>
                          <button type="button" onClick={() => openCell(null, null, totals.total)} className="hover:underline">{totals.total.toLocaleString('en-IN')}</button>
                        </TableCell>
                      );
                    }
                    if (c.key.startsWith('stage:')) {
                      const stage = stages.find((s) => `stage:${s._id}` === c.key)!;
                      const v = totals.byStage[stage._id] || 0;
                      return (
                        <TableCell key={c.key} className={RT.tdTotal}>
                          {v ? <button type="button" onClick={() => openCell(null, stage, v)} className="hover:underline">{v.toLocaleString('en-IN')}</button> : 0}
                        </TableCell>
                      );
                    }
                    return <TableCell key={c.key} className={RT.tdTotal} />;
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span>
              Showing {rows.length} {isBatch ? 'batches' : 'counsellors'}
              {isBatch && ' · a student enrolled in two batches is counted in both rows'}
              {!isBatch && team && ' · team rows can overlap'}
            </span>
            <span>Last updated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      )}

      <StudentsDialog drill={drill} onClose={() => setDrill(null)} query={query} team={team && groupBy === 'counsellor'} context={context} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* drill-down                                                          */
/* ------------------------------------------------------------------ */

function StudentsDialog({ drill, onClose, query, team, context }: { drill: Drill | null; onClose: () => void; query: Record<string, string>; team: boolean; context: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [res, setRes] = useState<{ data: any[]; total: number; totalPages: number } | null>(null);

  useEffect(() => {
    setPage(1);
    setSearch('');
    setDebounced('');
  }, [drill]);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => setPage(1), [debounced]);

  const params = useMemo(() => {
    const p: Record<string, any> = { ...query, team: String(team && !!drill?.userId && drill.userId !== 'unassigned') };
    if (drill?.userId) p.userId = drill.userId;
    if (drill?.stageId) p.stageId = drill.stageId;
    if (drill?.batchId) p.batchId = drill.batchId;
    if (debounced.trim()) p.search = debounced.trim();
    return p;
  }, [drill, query, team, debounced]);

  useEffect(() => {
    if (!drill) return;
    setLoading(true);
    getDataHandlerWithToken(ApiConfig.enrolledStageReportStudents, { ...params, page, limit: 25 }, null, true)
      .then((r: any) => setRes(r))
      .catch((e: any) => toast({ title: 'Error', description: e?.message || 'Failed to load students', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [drill, params, page]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const r: any = await getDataHandlerWithToken(ApiConfig.enrolledStageReportStudents, { ...params, page: 1, limit: 5000 }, null, true);
      const header = ['Student', 'Email', 'Mobile', 'Stage', 'Upskillab status', 'Active', 'Assigned to', 'Employee ID', 'Enrolled on', 'Last activity'];
      const body = (r?.data || []).map((s: any) => [
        s.fullName || s.username, s.email, s.mobileNumber, s.stageName, s.status, s.isActive ? 'Yes' : 'No',
        s.assignedTo?.name || '', s.assignedTo?.employeeId || '', fmtDate(s.studentCreatedAt), s.lastActivityAt ? `${fmtDate(s.lastActivityAt)} ${s.lastActivityType || ''}` : '',
      ]);
      downloadCsv(`students_${context}_${drill?.stageName || 'all'}.csv`.replace(/[^\w.-]+/g, '_'), [header, ...body]);
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Export failed', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const title = [drill?.batchCode, drill?.userName, drill?.stageName].filter(Boolean).join(' · ') || 'All students';

  return (
    <Dialog open={!!drill} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-[960px]">
        <DialogHeader className="border-b border-slate-100 px-6 pb-4 pt-6">
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription>
            {context}
            {res ? ` · ${res.total.toLocaleString('en-IN')} students` : ''}
            {team && drill?.userId && drill.userId !== 'unassigned' ? ' · including team' : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2 px-6 pt-4">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, mobile" className="h-9 pl-8 pr-8" />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X className="h-3.5 w-3.5" /></button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting || !res?.total} className="ml-auto h-9 gap-1.5">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export CSV
          </Button>
        </div>
        <div className="max-h-[58vh] overflow-auto px-6 py-4">
          <div className={RT.wrap}>
            <Table>
              <TableHeader>
                <TableRow className={RT.headRow}>
                  {['Student', 'Contact', 'Stage', 'Status', 'Assigned to', 'Enrolled', 'Last activity'].map((h) => (
                    <TableHead key={h} className={RT.thLeft}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !res?.data?.length ? (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-orange-500" /></TableCell></TableRow>
                ) : !res?.data?.length ? (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-slate-500">No students found.</TableCell></TableRow>
                ) : (
                  res.data.map((s: any) => (
                    <TableRow key={s._id} className={cn(RT.row, loading && 'opacity-60')}>
                      <TableCell className={RT.tdLeft}>
                        <p className="font-medium">{s.fullName || s.username || '—'}</p>
                        {s.username && s.fullName && <p className="text-xs text-slate-400">@{s.username}</p>}
                      </TableCell>
                      <TableCell className={RT.tdLeft}>
                        <p className="text-sm">{s.mobileNumber || '—'}</p>
                        <p className="max-w-[200px] truncate text-xs text-slate-500">{s.email}</p>
                      </TableCell>
                      <TableCell className={RT.tdLeft}><span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{s.stageName || 'No stage'}</span></TableCell>
                      <TableCell className={RT.tdLeft}>
                        <span className={cn('text-xs font-medium', s.isActive ? 'text-emerald-600' : 'text-slate-400')}>{s.isActive ? 'Active' : 'Inactive'}</span>
                        {s.status && <p className="text-xs capitalize text-slate-400">{String(s.status).toLowerCase()}</p>}
                      </TableCell>
                      <TableCell className={RT.tdLeft}>{s.assignedTo?.name ? <span>{s.assignedTo.name}{s.assignedTo.employeeId ? <span className="text-xs text-slate-400"> · {s.assignedTo.employeeId}</span> : null}</span> : <span className="text-xs text-rose-600">Not assigned</span>}</TableCell>
                      <TableCell className={cn(RT.tdLeft, 'whitespace-nowrap')}>{fmtDate(s.studentCreatedAt)}</TableCell>
                      <TableCell className={cn(RT.tdLeft, 'whitespace-nowrap')}>
                        {s.lastActivityAt ? <>{fmtDate(s.lastActivityAt)}<p className="text-xs capitalize text-slate-400">{String(s.lastActivityType || '').replace(/_/g, ' ').toLowerCase()}</p></> : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {res && res.totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
              <span>Page {page} of {res.totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= res.totalPages || loading} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
