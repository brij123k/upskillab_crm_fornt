import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DownloadCloud,
  Filter,
  GraduationCap,
  History,
  Layers,
  PhoneCall,
  PhoneIncoming,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Settings2,
  TrendingUp,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import ApiConfig from '@/config/apiConfig';
import { getDataHandlerWithToken, postDataHandlerWithToken } from '@/config/services';
import { Avatar, KpiCard, KpiGrid, StageBadge, Tag } from '@/components/reports/ReportUI';
import { ActiveBadge, BatchStatusPill, EnrolledLeadDetailDialog, startEnrolledCall } from '@/components/enrolled/EnrolledLeadDetailDialog';
import { EnrolledCallData, EnrolledCallFeedbackModal } from '@/components/enrolled/EnrolledCallFeedbackModal';
import { EnrolledStagesDialog } from '@/components/enrolled/EnrolledStagesDialog';
import {
  ACTION_LABEL,
  ENROLLED_CALL_SAVED_EVENT,
  EnrolledBatch,
  EnrolledCourse,
  EnrolledLead,
  EnrolledMeta,
  SyncRun,
  enrolledPermissions,
  formatDate,
  formatDateTime,
  formatDuration,
  formatINR,
  titleCase,
  unwrapError,
} from '@/lib/enrolledLeads';

interface Props {
  panel?: 'admin' | 'bd';
}

const ALL = 'all';

const EMPTY_FILTERS = {
  search: '',
  stageId: ALL,
  active: ALL,
  status: ALL,
  courseId: ALL,
  batchId: ALL,
  batchStatus: ALL,
  assignedTo: ALL,
  fromDate: '',
  toDate: '',
};

function Pager({
  page,
  totalPages,
  total,
  limit,
  loading,
  onPage,
  onLimit,
  noun,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  loading: boolean;
  onPage: (p: number) => void;
  onLimit?: (l: number) => void;
  noun: string;
}) {
  if (!total) return null;
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5 || page <= 3) return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
  });
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
      <div className="text-xs text-slate-500 order-2 sm:order-1">
        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} {noun}
      </div>
      <div className="flex items-center gap-2 order-1 sm:order-2">
        <Button variant="outline" size="sm" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1 || loading} className="h-8 px-3 text-xs rounded-lg">
          <ChevronLeft className="w-3 h-3 mr-1" /> Prev
        </Button>
        <div className="flex items-center gap-1">
          {pages.map((p) => (
            <Button key={p} variant={page === p ? 'default' : 'outline'} size="sm" className="w-7 h-7 p-0 text-xs rounded-lg" onClick={() => onPage(p)} disabled={loading}>
              {p}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages || loading} className="h-8 px-3 text-xs rounded-lg">
          Next <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
      {onLimit && (
        <div className="flex items-center gap-2 order-3">
          <span className="text-xs text-slate-500">Show:</span>
          <Select value={String(limit)} onValueChange={(v) => onLimit(parseInt(v))}>
            <SelectTrigger className="w-20 h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100, 500].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export function EnrolledLeadsPage({ panel = 'bd' }: Props) {
  const perms = useMemo(() => enrolledPermissions(panel), [panel]);

  const [tab, setTab] = useState('students');
  const [meta, setMeta] = useState<EnrolledMeta | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  // ---------------- students ----------------
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [leads, setLeads] = useState<EnrolledLead[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTo, setAssignTo] = useState('');
  const [stageOpen, setStageOpen] = useState(false);
  const [bulkStageId, setBulkStageId] = useState('');
  const [bulkNote, setBulkNote] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState('overview');
  const openDetail = (id: string, tabName = 'overview') => {
    setDetailTab(tabName);
    setDetailId(id);
  };

  // ---------------- calls ----------------
  const [callingId, setCallingId] = useState<string | null>(null);
  const [pendingCalls, setPendingCalls] = useState<EnrolledCallData[]>([]);
  const [feedbackCall, setFeedbackCall] = useState<EnrolledCallData | null>(null);
  const [stagesOpen, setStagesOpen] = useState(false);

  // ---------------- sync ----------------
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncRun | null>(null);
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [runsPage, setRunsPage] = useState(1);
  const [runsTotal, setRunsTotal] = useState(0);
  const [runsLoading, setRunsLoading] = useState(false);

  // ---------------- courses / batches ----------------
  const [courseSearch, setCourseSearch] = useState('');
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [coursePage, setCoursePage] = useState(1);
  const [courseTotal, setCourseTotal] = useState(0);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const [batchSearch, setBatchSearch] = useState('');
  const [batchCourse, setBatchCourse] = useState(ALL);
  const [batchStatusFilter, setBatchStatusFilter] = useState(ALL);
  const [batches, setBatches] = useState<EnrolledBatch[]>([]);
  const [batchPage, setBatchPage] = useState(1);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchesLoading, setBatchesLoading] = useState(false);

  const CATALOG_LIMIT = 25;

  const setFilter = (key: keyof typeof EMPTY_FILTERS, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, ...(key === 'courseId' ? { batchId: ALL } : {}) }));
    setPage(1);
  };

  // ---------------- loaders ----------------
  const fetchMeta = useCallback(async () => {
    try {
      setMeta(await getDataHandlerWithToken(ApiConfig.enrolledLeadsMeta, null, null, true));
    } catch (error) {
      toast({ title: 'Error', description: unwrapError(error, 'Failed to load filters'), variant: 'destructive' });
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page, limit };
      (Object.keys(filters) as (keyof typeof filters)[]).forEach((key) => {
        const value = filters[key];
        if (value && value !== ALL) params[key] = value;
      });
      const res = await getDataHandlerWithToken(ApiConfig.enrolledLeads, params, null, true);
      setLeads(res?.data || []);
      setTotal(res?.total || 0);
      setTotalPages(Math.max(1, res?.totalPages || 1));
      setStats(res?.stats || null);
    } catch (error) {
      toast({ title: 'Error', description: unwrapError(error, 'Failed to load enrolled leads'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  const fetchRuns = useCallback(async () => {
    try {
      setRunsLoading(true);
      const res = await getDataHandlerWithToken(ApiConfig.enrolledLeadsSyncRuns, { page: runsPage, limit: 20 }, null, true);
      setRuns(res?.data || []);
      setRunsTotal(res?.total || 0);
    } catch (error) {
      toast({ title: 'Error', description: unwrapError(error, 'Failed to load sync history'), variant: 'destructive' });
    } finally {
      setRunsLoading(false);
    }
  }, [runsPage]);

  const fetchCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      const params: Record<string, any> = { page: coursePage, limit: CATALOG_LIMIT };
      if (courseSearch.trim()) params.search = courseSearch.trim();
      const res = await getDataHandlerWithToken(ApiConfig.enrolledCourses, params, null, true);
      setCourses(res?.data || []);
      setCourseTotal(res?.total || 0);
    } catch (error) {
      toast({ title: 'Error', description: unwrapError(error, 'Failed to load courses'), variant: 'destructive' });
    } finally {
      setCoursesLoading(false);
    }
  }, [coursePage, courseSearch]);

  const fetchBatches = useCallback(async () => {
    try {
      setBatchesLoading(true);
      const params: Record<string, any> = { page: batchPage, limit: CATALOG_LIMIT };
      if (batchSearch.trim()) params.search = batchSearch.trim();
      if (batchCourse !== ALL) params.courseId = batchCourse;
      if (batchStatusFilter !== ALL) params.status = batchStatusFilter;
      const res = await getDataHandlerWithToken(ApiConfig.enrolledBatches, params, null, true);
      setBatches(res?.data || []);
      setBatchTotal(res?.total || 0);
    } catch (error) {
      toast({ title: 'Error', description: unwrapError(error, 'Failed to load batches'), variant: 'destructive' });
    } finally {
      setBatchesLoading(false);
    }
  }, [batchPage, batchSearch, batchCourse, batchStatusFilter]);

  useEffect(() => {
    fetchMeta();
    if (perms.canAssign) {
      getDataHandlerWithToken('getAllUser', null, null)
        .then((res) => setUsers(res?.data || res || []))
        .catch(() => undefined);
    }
  }, [fetchMeta, perms.canAssign]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Calls that ended but still need details (same rule as the lead page)
  const fetchPendingCalls = useCallback(async () => {
    if (!perms.canCall) return;
    try {
      setPendingCalls((await getDataHandlerWithToken(ApiConfig.enrolledPendingCalls, null, null, true)) || []);
    } catch {
      // not critical
    }
  }, [perms.canCall]);

  useEffect(() => {
    fetchPendingCalls();
    const timer = setInterval(fetchPendingCalls, 60_000);
    const onSaved = () => {
      fetchPendingCalls();
      fetchLeads();
    };
    window.addEventListener(ENROLLED_CALL_SAVED_EVENT, onSaved);
    return () => {
      clearInterval(timer);
      window.removeEventListener(ENROLLED_CALL_SAVED_EVENT, onSaved);
    };
  }, [fetchPendingCalls, fetchLeads]);

  const callLead = async (lead: EnrolledLead) => {
    setCallingId(lead._id);
    await startEnrolledCall(lead._id);
    setCallingId(null);
    // the call log appears in "waiting for details" once Smartflo reports the end
    setTimeout(fetchPendingCalls, 15_000);
  };

  useEffect(() => {
    if (tab === 'history') fetchRuns();
  }, [tab, fetchRuns]);

  useEffect(() => {
    if (tab !== 'courses') return;
    const t = setTimeout(fetchCourses, 300);
    return () => clearTimeout(t);
  }, [tab, fetchCourses]);

  useEffect(() => {
    if (tab !== 'batches') return;
    const t = setTimeout(fetchBatches, 300);
    return () => clearTimeout(t);
  }, [tab, fetchBatches]);

  // Debounced search box
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== filters.search) setFilter('search', searchInput);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // ---------------- actions ----------------
  const runSync = async () => {
    try {
      setSyncing(true);
      const run: SyncRun = await postDataHandlerWithToken(ApiConfig.enrolledLeadsSync, {}, true);
      setSyncResult(run);
      toast({
        title: 'Students fetched',
        description: `${run.newStudents} new students added, ${run.updatedStudents} already in the CRM (updated, not duplicated).`,
      });
      await Promise.all([fetchMeta(), fetchLeads()]);
      if (tab === 'history') fetchRuns();
      if (tab === 'courses') fetchCourses();
      if (tab === 'batches') fetchBatches();
    } catch (error) {
      toast({ title: 'Fetch failed', description: unwrapError(error, 'Could not fetch students from Upskillab'), variant: 'destructive' });
      if (tab === 'history') fetchRuns();
    } finally {
      setSyncing(false);
    }
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const allOnPageSelected = leads.length > 0 && leads.every((l) => selected.includes(l._id));
  const toggleSelectPage = () =>
    setSelected((prev) =>
      allOnPageSelected
        ? prev.filter((id) => !leads.some((l) => l._id === id))
        : [...new Set([...prev, ...leads.map((l) => l._id)])],
    );
  const exitSelect = () => {
    setSelectMode(false);
    setSelected([]);
  };

  const submitAssign = async (unassign = false) => {
    if (!unassign && !assignTo) return;
    try {
      setBulkBusy(true);
      const res = await postDataHandlerWithToken(
        ApiConfig.enrolledLeadsAssign,
        unassign ? { ids: selected } : { ids: selected, assignedTo: assignTo },
        true,
      );
      toast({ title: unassign ? 'Unassigned' : 'Assigned', description: `${res?.updated ?? selected.length} students updated` });
      setAssignOpen(false);
      setAssignTo('');
      exitSelect();
      fetchLeads();
    } catch (error) {
      toast({ title: 'Error', description: unwrapError(error, 'Failed to assign'), variant: 'destructive' });
    } finally {
      setBulkBusy(false);
    }
  };

  const submitBulkStage = async () => {
    if (!bulkStageId) return;
    try {
      setBulkBusy(true);
      const res = await postDataHandlerWithToken(
        ApiConfig.enrolledLeadsBulkStage,
        { ids: selected, stageId: bulkStageId, ...(bulkNote.trim() ? { note: bulkNote.trim() } : {}) },
        true,
      );
      toast({ title: 'Stage updated', description: `${res?.updated ?? 0} students moved` });
      setStageOpen(false);
      setBulkStageId('');
      setBulkNote('');
      exitSelect();
      fetchLeads();
    } catch (error) {
      toast({ title: 'Error', description: unwrapError(error, 'Failed to change stage'), variant: 'destructive' });
    } finally {
      setBulkBusy(false);
    }
  };

  // ---------------- derived ----------------
  const stages = meta?.stages || [];
  const stageCount = (id: string) => stats?.byStage?.find((s: any) => s.stageId === id)?.count || 0;
  const stageTotal = (stats?.byStage || []).reduce((sum: number, s: any) => sum + s.count, 0);
  const batchOptions = (meta?.batches || []).filter((b) => filters.courseId === ALL || b.courseId === filters.courseId);
  const activeFilterCount = (Object.keys(EMPTY_FILTERS) as (keyof typeof EMPTY_FILTERS)[]).filter(
    (k) => filters[k] !== EMPTY_FILTERS[k],
  ).length;
  const lastSync = syncResult || meta?.lastSync || null;
  const userOptions = users
    .filter((u) => !u.status || u.status === 'active')
    .map((u) => ({ value: u._id, label: u.name, empId: u.employeeId }));

  return (
    <div className="space-y-4 animate-fade-in bg-transparent">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <GraduationCap className="w-5 h-5 text-orange-500" /> Enrolled Leads
          </h1>
          <p className="text-sm text-slate-500">
            Students from Upskillab. New students are fetched every night at 12 AM; use Fetch more to fetch now.
          </p>
          {lastSync && (
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              {lastSync.status === 'SUCCESS' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : lastSync.status === 'FAILED' ? (
                <XCircle className="w-3.5 h-3.5 text-red-500" />
              ) : (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
              )}
              Last fetch {formatDateTime(lastSync.finishedAt || lastSync.startedAt)} ({lastSync.trigger === 'CRON' ? 'nightly' : 'manual'})
              {lastSync.status === 'SUCCESS' && ` · ${lastSync.newStudents} new`}
              {lastSync.status === 'FAILED' && lastSync.error && <span className="text-red-600"> · {lastSync.error}</span>}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectMode ? (
            <>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 rounded-lg">{selected.length} selected</Badge>
              <Button variant="outline" onClick={exitSelect} className="rounded-xl border-slate-200">
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              {perms.canAssign && (
                <Button onClick={() => setAssignOpen(true)} disabled={!selected.length} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
                  <Users className="w-4 h-4 mr-2" /> Assign ({selected.length})
                </Button>
              )}
              {perms.canUpdate && (
                <Button variant="outline" onClick={() => setStageOpen(true)} disabled={!selected.length} className="rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600">
                  <TrendingUp className="w-4 h-4 mr-2" /> Change Stage ({selected.length})
                </Button>
              )}
            </>
          ) : (
            (perms.canAssign || perms.canUpdate) && (
              <Button variant="outline" onClick={() => { setTab('students'); setSelectMode(true); }} className="rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600">
                <Users className="w-4 h-4 mr-2" /> Select Students
              </Button>
            )
          )}
          {perms.canManageStages && (
            <Button variant="outline" onClick={() => setStagesOpen(true)} className="rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600">
              <Settings2 className="w-4 h-4 mr-2" /> Stages
            </Button>
          )}
          {perms.canSync && (
            <Button onClick={runSync} disabled={syncing} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
              {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DownloadCloud className="w-4 h-4 mr-2" />}
              {syncing ? 'Fetching…' : 'Fetch more'}
            </Button>
          )}
        </div>
      </div>

      {syncResult && syncResult.status === 'SUCCESS' && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-2 text-xs text-emerald-800">
          <span className="font-semibold">Fetch complete:</span>
          <span>{syncResult.studentsFetched} students received</span>
          <span>{syncResult.newStudents} new added</span>
          <span>{syncResult.updatedStudents} already in CRM (not duplicated)</span>
          <span>{syncResult.statusChanged} status changes</span>
          <span>{syncResult.newCourses} new courses · {syncResult.newBatches} new batches</span>
          <button className="ml-auto text-emerald-700 hover:text-emerald-900" onClick={() => setSyncResult(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {pendingCalls.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <PhoneIncoming className="w-4 h-4" /> {pendingCalls.length} call{pendingCalls.length > 1 ? 's' : ''} waiting for details
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {pendingCalls.slice(0, 8).map((c) => (
              <button
                key={String(c.callId)}
                onClick={() => setFeedbackCall(c)}
                className="flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-orange-300 hover:bg-orange-50"
              >
                <span className="font-medium">{c.enrolledLead?.fullName || 'Student'}</span>
                <span className="text-slate-400">{formatDateTime(c.startedAt)} · {formatDuration(c.duration)}</span>
                <span className="font-semibold text-orange-600">Fill details</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="students"><GraduationCap className="w-4 h-4 mr-1.5" /> Students</TabsTrigger>
          <TabsTrigger value="courses"><BookOpen className="w-4 h-4 mr-1.5" /> Courses</TabsTrigger>
          <TabsTrigger value="batches"><Layers className="w-4 h-4 mr-1.5" /> Batches</TabsTrigger>
          <TabsTrigger value="history"><History className="w-4 h-4 mr-1.5" /> Fetch history</TabsTrigger>
        </TabsList>

        {/* ================= STUDENTS ================= */}
        <TabsContent value="students" className="space-y-4 pt-2">
          <KpiGrid cols={4}>
            <KpiCard icon={GraduationCap} tone="orange" label="Students" value={total.toLocaleString('en-IN')} sub="matching the filters" />
            <KpiCard icon={CheckCircle2} tone="green" label="Active" value={(stats?.active || 0).toLocaleString('en-IN')} sub="on Upskillab" />
            <KpiCard icon={XCircle} tone="rose" label="Inactive" value={(stats?.inactive || 0).toLocaleString('en-IN')} sub="on Upskillab" />
            <KpiCard icon={Users} tone="blue" label="Unassigned" value={(stats?.unassigned || 0).toLocaleString('en-IN')} sub="no counsellor yet" />
          </KpiGrid>

          {/* Stage chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('stageId', ALL)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                filters.stageId === ALL ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
              )}
            >
              All stages <span className="ml-1 opacity-80">{stageTotal}</span>
            </button>
            {stages.map((s) => (
              <button
                key={s._id}
                onClick={() => setFilter('stageId', s._id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  filters.stageId === s._id ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name} <span className="opacity-70">{stageCount(s._id)}</span>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search name, email, mobile, username…" className="pl-8 h-9 rounded-xl" />
            </div>
            <Button variant={showFilters ? 'default' : 'outline'} size="sm" onClick={() => setShowFilters((v) => !v)} className="h-9 rounded-xl gap-1">
              <Filter className="w-3.5 h-3.5" /> Filters
              {activeFilterCount > 0 && <span className="ml-1 rounded-full bg-orange-500 px-1.5 text-[10px] text-white">{activeFilterCount}</span>}
            </Button>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { setFilters(EMPTY_FILTERS); setSearchInput(''); setPage(1); }} className="h-9 rounded-xl text-slate-500">
                Clear all
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => { fetchLeads(); fetchMeta(); }} disabled={loading} className="h-9 rounded-xl ml-auto">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            </Button>
          </div>

          {showFilters && (
            <Card className="rounded-xl border-slate-200 shadow-sm">
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Student status (Active / Inactive)</Label>
                  <Select value={filters.active} onValueChange={(v) => setFilter('active', v)}>
                    <SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Upskillab status</Label>
                  <Select value={filters.status} onValueChange={(v) => setFilter('status', v)}>
                    <SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All</SelectItem>
                      {(meta?.statuses || []).map((s) => <SelectItem key={s} value={s}>{titleCase(s)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Course</Label>
                  <SearchableDropdown
                    options={[{ value: ALL, label: 'All courses' }, ...(meta?.courses || []).map((c) => ({ value: c.upskillabId, label: c.courseName || c.upskillabId }))]}
                    value={filters.courseId}
                    onValueChange={(v) => setFilter('courseId', v || ALL)}
                    placeholder="All courses"
                    searchPlaceholder="Search course…"
                    showBadge={false}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Batch</Label>
                  <SearchableDropdown
                    options={[{ value: ALL, label: 'All batches' }, ...batchOptions.map((b) => ({ value: b.upskillabId, label: `${b.batchCode || b.upskillabId}${b.courseName ? ` · ${b.courseName}` : ''}` }))]}
                    value={filters.batchId}
                    onValueChange={(v) => setFilter('batchId', v || ALL)}
                    placeholder="All batches"
                    searchPlaceholder="Search batch…"
                    showBadge={false}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Batch status</Label>
                  <Select value={filters.batchStatus} onValueChange={(v) => setFilter('batchStatus', v)}>
                    <SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All</SelectItem>
                      {(meta?.batchStatuses || []).map((s) => <SelectItem key={s} value={s}>{titleCase(s)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Stage</Label>
                  <Select value={filters.stageId} onValueChange={(v) => setFilter('stageId', v)}>
                    <SelectTrigger className="h-9 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All stages</SelectItem>
                      {stages.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {perms.canAssign && (
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Assigned to</Label>
                    <SearchableDropdown
                      options={[{ value: ALL, label: 'Anyone' }, { value: 'unassigned', label: 'Not assigned' }, ...userOptions]}
                      value={filters.assignedTo}
                      onValueChange={(v) => setFilter('assignedTo', v || ALL)}
                      placeholder="Anyone"
                      searchPlaceholder="Search by name…"
                      showBadge={false}
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Enrolled between</Label>
                  <div className="flex gap-2">
                    <Input type="date" value={filters.fromDate} onChange={(e) => setFilter('fromDate', e.target.value)} className="h-9 rounded-xl text-xs" />
                    <Input type="date" value={filters.toDate} onChange={(e) => setFilter('toDate', e.target.value)} className="h-9 rounded-xl text-xs" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          <div>
            <h2 className="mb-2 text-base font-semibold text-slate-800">
              All Students ({total})
              {loading && <Loader2 className="w-3 h-3 inline animate-spin ml-2 text-slate-400" />}
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {selectMode && (
                      <th className="w-8 px-3 py-2">
                        <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectPage} className="w-4 h-4 rounded border-slate-300 accent-orange-500" />
                      </th>
                    )}
                    {['Student', 'Contact', 'Courses', 'Batches', 'Batch status', 'Payment', 'Stage', 'Status', 'Enrolled', 'Assigned To', 'Last Activity', 'Actions'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-medium text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!loading && leads.length === 0 && (
                    <tr>
                      <td colSpan={selectMode ? 13 : 12} className="py-14 text-center">
                        <GraduationCap className="mx-auto mb-2 w-10 h-10 text-slate-300" />
                        <p className="text-sm font-medium text-slate-600">No enrolled students found</p>
                        <p className="text-xs text-slate-400">
                          {activeFilterCount ? 'Try changing the filters.' : perms.canSync ? 'Click Fetch more to import students from Upskillab.' : 'Students assigned to you will appear here.'}
                        </p>
                      </td>
                    </tr>
                  )}
                  {leads.map((lead) => (
                    <tr
                      key={lead._id}
                      onClick={() => (selectMode ? toggleSelect(lead._id) : openDetail(lead._id))}
                      className={cn('border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors', selected.includes(lead._id) && 'bg-orange-50')}
                    >
                      {selectMode && (
                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selected.includes(lead._id)} onChange={() => toggleSelect(lead._id)} className="w-4 h-4 rounded border-slate-300 accent-orange-500" />
                        </td>
                      )}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={lead.fullName || lead.username} className="w-8 h-8 text-[11px]" />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate max-w-[180px]">{lead.fullName || lead.username || '—'}</div>
                            <div className="text-[11px] text-slate-400">{lead.studentType ? titleCase(lead.studentType) : lead.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1 text-slate-700 whitespace-nowrap"><Phone className="w-3 h-3 text-emerald-600" />{lead.mobileNumber || '—'}</div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 truncate max-w-[200px]"><Mail className="w-3 h-3 text-blue-500" />{lead.email || '—'}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {lead.courses?.length ? lead.courses.slice(0, 2).map((c) => <Tag key={c} className="bg-orange-50 text-orange-700">{c}</Tag>) : <span className="text-slate-400">—</span>}
                          {lead.courses?.length > 2 && <Tag>+{lead.courses.length - 2}</Tag>}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {lead.batches?.length ? lead.batches.slice(0, 2).map((b) => <Tag key={b}>{b}</Tag>) : <span className="text-slate-400">—</span>}
                          {lead.batches?.length > 2 && <Tag>+{lead.batches.length - 2}</Tag>}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {lead.batchStatuses?.length ? lead.batchStatuses.map((s) => <BatchStatusPill key={s} status={s} />) : <span className="text-slate-400">—</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-emerald-700 font-medium">{formatINR(lead.paymentSummary?.amountPaid)}</div>
                        {Number(lead.paymentSummary?.balanceDue) > 0 && <div className="text-[11px] text-red-600">{formatINR(lead.paymentSummary?.balanceDue)} due</div>}
                      </td>
                      <td className="px-3 py-2"><StageBadge label={lead.stageName} /></td>
                      <td className="px-3 py-2"><ActiveBadge isActive={lead.isActive} status={lead.status} /></td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-700">{formatDate(lead.studentCreatedAt)}</td>
                      <td className="px-3 py-2">
                        {lead.assignedTo ? (
                          <div>
                            <div className="flex items-center gap-2"><Avatar name={lead.assignedTo.name} className="w-7 h-7 text-[10px]" /><span className="text-sm font-medium text-slate-800">{lead.assignedTo.name}</span></div>
                            {lead.assignedTo.employeeId && <div className="text-xs text-slate-400">ID: {lead.assignedTo.employeeId}</div>}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">Not assigned</span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {lead.lastActivityAt ? (
                          <>
                            <div className="text-slate-700">{ACTION_LABEL[lead.lastActivityType || ''] || lead.lastActivityType}</div>
                            <div className="text-[11px] text-slate-400">{formatDateTime(lead.lastActivityAt)}</div>
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {perms.canCall && lead.mobileNumber && (
                            <button
                              onClick={() => callLead(lead)}
                              disabled={callingId === lead._id}
                              title="Click to call"
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100 hover:bg-emerald-100 disabled:opacity-50"
                            >
                              {callingId === lead._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PhoneCall className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          {lead.mobileNumber && (
                            <a
                              href={`https://web.whatsapp.com/send?phone=${(() => {
                                const d = lead.mobileNumber.replace(/\D/g, '');
                                return d.length === 10 ? `91${d}` : d;
                              })()}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open WhatsApp Web"
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-green-50 text-green-600 ring-1 ring-inset ring-green-100 hover:bg-green-100"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.032 2.008c-5.525 0-10 4.472-10 9.994 0 1.766.453 3.498 1.317 5.016L2 21.992l5.06-1.315c1.466.846 3.118 1.292 4.883 1.292 5.525 0 10-4.472 10-9.994 0-5.522-4.475-9.994-10-9.994zM12.032 18.42c-1.452 0-2.86-.395-4.058-1.143l-2.973.775.796-2.907c-.84-1.244-1.283-2.677-1.283-4.176 0-4.195 3.417-7.614 7.618-7.614 4.205 0 7.618 3.419 7.618 7.614 0 4.195-3.413 7.614-7.618 7.614z" />
                              </svg>
                            </a>
                          )}
                          <button
                            onClick={() => openDetail(lead._id, 'activity')}
                            title="History (from import to every step)"
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-50 text-orange-600 ring-1 ring-inset ring-orange-100 hover:bg-orange-100"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} totalPages={totalPages} total={total} limit={limit} loading={loading} onPage={setPage} onLimit={(l) => { setLimit(l); setPage(1); }} noun="students" />
          </div>
        </TabsContent>

        {/* ================= COURSES ================= */}
        <TabsContent value="courses" className="space-y-3 pt-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input value={courseSearch} onChange={(e) => { setCourseSearch(e.target.value); setCoursePage(1); }} placeholder="Search course, category, language…" className="pl-8 h-9 rounded-xl" />
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                <tr>
                  {['Course', 'Category', 'Language', 'Students in CRM', 'Last synced', ''].map((h) => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {coursesLoading && !courses.length && (
                  <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="mx-auto w-5 h-5 animate-spin text-orange-500" /></td></tr>
                )}
                {!coursesLoading && !courses.length && (
                  <tr><td colSpan={6} className="py-10 text-center text-sm text-slate-500">No courses yet. They are added with Fetch more.</td></tr>
                )}
                {courses.map((c) => (
                  <tr key={c._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800">{c.courseName || c.upskillabId}</td>
                    <td className="px-3 py-2">{c.category || '—'}</td>
                    <td className="px-3 py-2">{c.language || '—'}</td>
                    <td className="px-3 py-2 font-semibold">{c.crmStudents ?? 0}</td>
                    <td className="px-3 py-2 text-slate-500">{formatDateTime(c.lastSyncedAt)}</td>
                    <td className="px-3 py-2 text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-orange-600" onClick={() => { setFilters({ ...EMPTY_FILTERS, courseId: c.upskillabId }); setSearchInput(''); setPage(1); setTab('students'); }}>
                        View students
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={coursePage} totalPages={Math.max(1, Math.ceil(courseTotal / CATALOG_LIMIT))} total={courseTotal} limit={CATALOG_LIMIT} loading={coursesLoading} onPage={setCoursePage} noun="courses" />
        </TabsContent>

        {/* ================= BATCHES ================= */}
        <TabsContent value="batches" className="space-y-3 pt-2">
          <div className="flex flex-wrap gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input value={batchSearch} onChange={(e) => { setBatchSearch(e.target.value); setBatchPage(1); }} placeholder="Search batch, course, teacher…" className="pl-8 h-9 rounded-xl" />
            </div>
            <div className="w-full sm:w-56">
              <SearchableDropdown
                options={[{ value: ALL, label: 'All courses' }, ...(meta?.courses || []).map((c) => ({ value: c.upskillabId, label: c.courseName || c.upskillabId }))]}
                value={batchCourse}
                onValueChange={(v) => { setBatchCourse(v || ALL); setBatchPage(1); }}
                placeholder="All courses"
                showBadge={false}
              />
            </div>
            <Select value={batchStatusFilter} onValueChange={(v) => { setBatchStatusFilter(v); setBatchPage(1); }}>
              <SelectTrigger className="h-9 w-full sm:w-44 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All batch statuses</SelectItem>
                {(meta?.batchStatuses || []).map((s) => <SelectItem key={s} value={s}>{titleCase(s)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                <tr>
                  {['Batch', 'Course', 'Teacher', 'Start', 'End', 'Status', 'Seats', 'Enrolled', 'Paid', 'In CRM', ''].map((h) => <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {batchesLoading && !batches.length && (
                  <tr><td colSpan={11} className="py-10 text-center"><Loader2 className="mx-auto w-5 h-5 animate-spin text-orange-500" /></td></tr>
                )}
                {!batchesLoading && !batches.length && (
                  <tr><td colSpan={11} className="py-10 text-center text-sm text-slate-500">No batches found.</td></tr>
                )}
                {batches.map((b) => (
                  <tr key={b._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-800">{b.batchCode || b.upskillabId}</div>
                      {(b.startTime || b.duration) && <div className="text-[11px] text-slate-400">{[b.startTime, b.duration].filter(Boolean).join(' · ')}</div>}
                    </td>
                    <td className="px-3 py-2">{b.courseName || '—'}</td>
                    <td className="px-3 py-2">{b.teacherName || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatDate(b.startDate)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatDate(b.endDate)}</td>
                    <td className="px-3 py-2"><BatchStatusPill status={b.status} /></td>
                    <td className="px-3 py-2">{b.seats ?? '—'}</td>
                    <td className="px-3 py-2">{b.enrolledStudents ?? '—'}</td>
                    <td className="px-3 py-2">{b.paidStudents ?? '—'}</td>
                    <td className="px-3 py-2 font-semibold">{b.crmStudents ?? 0}</td>
                    <td className="px-3 py-2 text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-orange-600" onClick={() => { setFilters({ ...EMPTY_FILTERS, courseId: b.courseId || ALL, batchId: b.upskillabId }); setSearchInput(''); setPage(1); setTab('students'); }}>
                        View students
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={batchPage} totalPages={Math.max(1, Math.ceil(batchTotal / CATALOG_LIMIT))} total={batchTotal} limit={CATALOG_LIMIT} loading={batchesLoading} onPage={setBatchPage} noun="batches" />
        </TabsContent>

        {/* ================= FETCH HISTORY ================= */}
        <TabsContent value="history" className="space-y-3 pt-2">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                <tr>
                  {['Started', 'Trigger', 'Status', 'Students received', 'New', 'Already in CRM', 'Status changes', 'Courses (new)', 'Batches (new)', 'Duration'].map((h) => <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {runsLoading && !runs.length && (
                  <tr><td colSpan={10} className="py-10 text-center"><Loader2 className="mx-auto w-5 h-5 animate-spin text-orange-500" /></td></tr>
                )}
                {!runsLoading && !runs.length && (
                  <tr><td colSpan={10} className="py-10 text-center text-sm text-slate-500">No fetches yet.</td></tr>
                )}
                {runs.map((r) => (
                  <tr key={r._id} className="border-b border-slate-100 align-top">
                    <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(r.startedAt)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.trigger === 'CRON' ? 'Nightly (12 AM)' : `Fetch more${r.triggeredBy?.name ? ` · ${r.triggeredBy.name}` : ''}`}
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                        r.status === 'SUCCESS' && 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                        r.status === 'FAILED' && 'bg-red-50 text-red-700 ring-red-200',
                        r.status === 'RUNNING' && 'bg-amber-50 text-amber-700 ring-amber-200',
                      )}>
                        {titleCase(r.status.toLowerCase())}
                      </span>
                      {r.error && <div className="mt-1 max-w-[260px] text-[11px] text-red-600">{r.error}</div>}
                    </td>
                    <td className="px-3 py-2">{r.studentsFetched}</td>
                    <td className="px-3 py-2 font-semibold text-emerald-700">{r.newStudents}</td>
                    <td className="px-3 py-2">{r.updatedStudents}</td>
                    <td className="px-3 py-2">{r.statusChanged}</td>
                    <td className="px-3 py-2">{r.coursesFetched} ({r.newCourses})</td>
                    <td className="px-3 py-2">{r.batchesFetched} ({r.newBatches})</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                      {r.finishedAt ? `${Math.max(1, Math.round((new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()) / 1000))}s` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={runsPage} totalPages={Math.max(1, Math.ceil(runsTotal / 20))} total={runsTotal} limit={20} loading={runsLoading} onPage={setRunsPage} noun="fetches" />
        </TabsContent>
      </Tabs>

      {/* ================= DIALOGS ================= */}
      <EnrolledLeadDetailDialog
        leadId={detailId}
        stages={stages}
        canUpdate={perms.canUpdate}
        canCall={perms.canCall}
        initialTab={detailTab}
        onOpenChange={(open) => !open && setDetailId(null)}
        onChanged={fetchLeads}
      />

      <EnrolledCallFeedbackModal
        open={!!feedbackCall}
        onOpenChange={(open) => !open && setFeedbackCall(null)}
        callData={feedbackCall}
      />

      <EnrolledStagesDialog open={stagesOpen} onOpenChange={setStagesOpen} onChanged={() => { fetchMeta(); fetchLeads(); }} />

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl border-slate-200">
          <DialogHeader>
            <DialogTitle>Assign {selected.length} students</DialogTitle>
            <DialogDescription>The assignee will see these students on their Enrolled Leads page.</DialogDescription>
          </DialogHeader>
          <SearchableDropdown options={userOptions} value={assignTo} onValueChange={setAssignTo} placeholder="Select counsellor" searchPlaceholder="Search by name…" />
          <div className="flex justify-between gap-2 pt-2">
            <Button variant="ghost" onClick={() => submitAssign(true)} disabled={bulkBusy} className="rounded-xl text-slate-500">Unassign</Button>
            <Button onClick={() => submitAssign(false)} disabled={!assignTo || bulkBusy} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
              {bulkBusy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={stageOpen} onOpenChange={setStageOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl border-slate-200">
          <DialogHeader>
            <DialogTitle>Change stage of {selected.length} students</DialogTitle>
            <DialogDescription>Recorded in each student's history.</DialogDescription>
          </DialogHeader>
          <Select value={bulkStageId} onValueChange={setBulkStageId}>
            <SelectTrigger className="h-9 rounded-xl"><SelectValue placeholder="Select stage" /></SelectTrigger>
            <SelectContent>
              {stages.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea value={bulkNote} onChange={(e) => setBulkNote(e.target.value)} rows={2} maxLength={2000} placeholder="Note (optional)" className="rounded-xl" />
          <div className="flex justify-end pt-2">
            <Button onClick={submitBulkStage} disabled={!bulkStageId || bulkBusy} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
              {bulkBusy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Update stage
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
