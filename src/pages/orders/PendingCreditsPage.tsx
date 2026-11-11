import { useCallback, useEffect, useState } from 'react';
import { BellRing, ChevronLeft, ChevronRight, Clock3, Loader2, RefreshCw, Search, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import ApiConfig from '@/config/apiConfig';
import { getDataHandlerWithToken, postDataHandlerWithToken } from '@/config/services';
import { hasPermission } from '@/utils/permissions';
import { OrderFinancialsDialog } from '@/components/orders/OrderFinancialsDialog';
import { CREDIT_STATUS_BADGE, extractApiError, formatDateShort, formatINR } from '@/lib/orderPayments';

type Category = 'pending' | 'pastDue' | 'dueToday' | 'upcoming' | 'paid' | 'all';

interface PendingCreditRow {
  orderId: string;
  creditId: string;
  studentName: string;
  studentEmail?: string;
  mobile?: string;
  courseName?: string;
  counsellorId?: string;
  counsellorName?: string;
  finalFee: number;
  orderDate?: string;
  creditAmount: number;
  creditDueDate: string;
  creditStatus: 'Pending' | 'Overdue' | 'Paid';
  paymentReferenceId?: string;
  paymentDate?: string;
  paymentMode?: string;
  remarks?: string;
  daysOverdue: number;
}

interface PendingCreditSummary {
  totalPendingCreditAmount: number;
  totalOverdueCreditAmount: number;
  totalDueTodayAmount: number;
  totalUpcomingAmount: number;
  totalPaidAmount: number;
  totalPendingCreditRecords: number;
  totalOverdueCreditRecords: number;
  totalDueTodayRecords: number;
  totalUpcomingRecords: number;
  totalPaidRecords: number;
}

interface NotificationRun {
  _id: string;
  runDate: string;
  trigger: string;
  status: string;
  startedAt?: string;
  finishedAt?: string;
  pastDueFound?: number;
  dueTodayFound?: number;
  pastDueNotified?: number;
  dueTodayNotified?: number;
  alreadyNotified?: number;
  creditsMarkedOverdue?: number;
  recipients?: string[];
  error?: string;
}

const CATEGORY_LABEL: Record<Category, string> = {
  pending: 'All unpaid',
  pastDue: 'Overdue',
  dueToday: 'Due today',
  upcoming: 'Upcoming',
  paid: 'Paid',
  all: 'All credits',
};

interface PendingCreditsPageProps {
  panel?: 'admin' | 'bd';
}

export function PendingCreditsPage({ panel = 'bd' }: PendingCreditsPageProps) {
  const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');
  const canRead = panel === 'admin' || hasPermission(permissions, 'orders', 'read_pending_credits');

  const [filters, setFilters] = useState({
    category: 'pending' as Category,
    search: '',
    counsellorId: 'all',
    courseVertical: 'all',
    courseName: '',
    fromDate: '',
    toDate: '',
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [rows, setRows] = useState<PendingCreditRow[]>([]);
  const [summary, setSummary] = useState<PendingCreditSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [today, setToday] = useState('');
  const [loading, setLoading] = useState(false);

  const [counsellors, setCounsellors] = useState<any[]>([]);
  const [pools, setPools] = useState<any[]>([]);
  const [loanPartners, setLoanPartners] = useState<any[]>([]);

  const [financialsOrder, setFinancialsOrder] = useState<{ id: string; name: string } | null>(null);

  // Notification runs (admin only)
  const [runs, setRuns] = useState<NotificationRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [runningNow, setRunningNow] = useState(false);

  const setFilter = (key: keyof typeof filters, value: any) =>
    setFilters((prev) => ({ ...prev, [key]: value, ...(key !== 'page' ? { page: 1 } : {}) }));

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { category: filters.category, page: filters.page, limit: filters.limit };
      if (filters.search) params.search = filters.search;
      if (filters.counsellorId !== 'all') params.counsellorId = filters.counsellorId;
      if (filters.courseVertical !== 'all') params.courseVertical = filters.courseVertical;
      if (filters.courseName.trim()) params.courseName = filters.courseName.trim();
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      const res = await getDataHandlerWithToken(ApiConfig.pendingCreditsReport, params, null, true);
      setRows(res?.data || []);
      setSummary(res?.summary || null);
      setTotal(res?.total || 0);
      setTotalPages(Math.max(1, res?.totalPages || 1));
      setToday(res?.today || '');
    } catch (error) {
      toast({ title: 'Error', description: extractApiError(error, 'Failed to load pending credits').message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchRuns = useCallback(async () => {
    if (panel !== 'admin') return;
    try {
      setLoadingRuns(true);
      const res = await getDataHandlerWithToken(ApiConfig.pendingCreditNotificationRuns, { page: 1, limit: 10 }, null, true);
      setRuns(res?.data || []);
    } catch (error) {
      // History is optional on this page; the report still works without it.
      console.error('Failed to load notification runs', error);
    } finally {
      setLoadingRuns(false);
    }
  }, [panel]);

  const runNotificationsNow = async () => {
    try {
      setRunningNow(true);
      await postDataHandlerWithToken(ApiConfig.runPendingCreditNotifications, null, true);
      toast({ title: 'Notification sent', description: 'Credits already notified today were skipped.' });
      fetchRuns();
      fetchReport();
    } catch (error) {
      toast({ title: 'Error', description: extractApiError(error, 'Failed to run the notification').message, variant: 'destructive' });
    } finally {
      setRunningNow(false);
    }
  };

  useEffect(() => {
    if (canRead) fetchReport();
  }, [fetchReport, canRead]);

  useEffect(() => {
    if (!canRead) return;
    fetchRuns();
    getDataHandlerWithToken('getAllUser', null, null).then((r) => setCounsellors(Array.isArray(r) ? r : [])).catch(() => {});
    getDataHandlerWithToken('getAllPools', null, null).then((r) => setPools(Array.isArray(r) ? r : [])).catch(() => {});
    getDataHandlerWithToken('getLoanPartners', null, null).then((r) => setLoanPartners(Array.isArray(r) ? r : [])).catch(() => {});
  }, [canRead, fetchRuns]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== filters.search) setFilter('search', searchInput);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  if (!canRead) {
    return (
      <div className="p-8 text-center text-slate-500">You do not have permission to view pending credits.</div>
    );
  }

  const cards: { category: Category; label: string; amount?: number; count?: number; tone: string }[] = [
    { category: 'pending', label: 'Pending (unpaid)', amount: summary?.totalPendingCreditAmount, count: summary?.totalPendingCreditRecords, tone: 'text-slate-800' },
    { category: 'pastDue', label: 'Overdue', amount: summary?.totalOverdueCreditAmount, count: summary?.totalOverdueCreditRecords, tone: 'text-red-600' },
    { category: 'dueToday', label: 'Due today', amount: summary?.totalDueTodayAmount, count: summary?.totalDueTodayRecords, tone: 'text-amber-600' },
    { category: 'upcoming', label: 'Upcoming', amount: summary?.totalUpcomingAmount, count: summary?.totalUpcomingRecords, tone: 'text-sky-700' },
    { category: 'paid', label: 'Paid', amount: summary?.totalPaidAmount, count: summary?.totalPaidRecords, tone: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-5 p-2 md:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Pending Credits</h1>
          <p className="mt-1 text-slate-500">
            Credits on approved orders{today ? ` · today is ${formatDateShort(today)}` : ''}
          </p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={() => fetchReport()} disabled={loading}>
          <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map((c) => (
          <button
            key={c.category}
            type="button"
            onClick={() => setFilter('category', c.category)}
            className={cn(
              'rounded-xl border bg-white p-4 text-left shadow-sm transition-colors hover:border-orange-300',
              filters.category === c.category ? 'border-orange-500 ring-1 ring-orange-500' : 'border-slate-100',
            )}
          >
            <p className="text-xs font-semibold uppercase text-slate-500">{c.label}</p>
            <p className={cn('mt-1 text-xl font-bold', c.tone)}>{formatINR(c.amount)}</p>
            <p className="text-xs text-slate-400">{c.count ?? 0} credit{c.count === 1 ? '' : 's'}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="text-xs font-semibold uppercase text-slate-500">Search</Label>
            <div className="relative mt-1.5">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="rounded-xl pl-9" placeholder="Student name, email or mobile" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase text-slate-500">Category</Label>
            <Select value={filters.category} onValueChange={(v) => setFilter('category', v as Category)}>
              <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABEL) as Category[]).map((k) => (
                  <SelectItem key={k} value={k}>{CATEGORY_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase text-slate-500">Counsellor</Label>
            <SearchableDropdown
              options={[
                { value: 'all', label: 'All counsellors' },
                ...counsellors
                  .filter((u) => u.status === 'active')
                  .map((u) => ({ value: u._id, label: u.name, empId: u.employeeId })),
              ]}
              value={filters.counsellorId}
              onValueChange={(v) => setFilter('counsellorId', v)}
              placeholder="Select counsellor"
              searchPlaceholder="Search by name or ID..."
              emptyMessage="No counsellors found"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase text-slate-500">Course vertical</Label>
            <Select value={filters.courseVertical} onValueChange={(v) => setFilter('courseVertical', v)}>
              <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All verticals</SelectItem>
                {pools.map((p) => (
                  <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase text-slate-500">Course name</Label>
            <Input className="mt-1.5 rounded-xl" placeholder="Contains…" value={filters.courseName} onChange={(e) => setFilter('courseName', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase text-slate-500">Due from</Label>
            <Input type="date" className="mt-1.5 rounded-xl" value={filters.fromDate} onChange={(e) => setFilter('fromDate', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase text-slate-500">Due to</Label>
            <Input type="date" className="mt-1.5 rounded-xl" value={filters.toDate} onChange={(e) => setFilter('toDate', e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              className="rounded-xl text-slate-500"
              onClick={() => {
                setSearchInput('');
                setFilters({ category: 'pending', search: '', counsellorId: 'all', courseVertical: 'all', courseName: '', fromDate: '', toDate: '', page: 1, limit: filters.limit });
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Reset filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border-0 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-800">
            {CATEGORY_LABEL[filters.category]} <span className="text-sm font-normal text-slate-500">· {total}</span>
          </h2>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Page {filters.page} of {totalPages}</span>
            <Button variant="outline" size="sm" className="h-8 w-8 rounded-lg p-0" disabled={filters.page <= 1 || loading} onClick={() => setFilter('page', filters.page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 rounded-lg p-0" disabled={filters.page >= totalPages || loading} onClick={() => setFilter('page', filters.page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Select value={String(filters.limit)} onValueChange={(v) => setFilter('limit', parseInt(v, 10))}>
              <SelectTrigger className="h-8 w-20 rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading && rows.length === 0 ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-400" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <Clock3 className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-medium text-slate-700">No credits found</h3>
            <p className="text-sm text-slate-400">Adjust the category or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 bg-slate-50">
                  <TableHead className="text-xs font-semibold uppercase text-slate-500">Student</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-slate-500">Course</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-slate-500">Counsellor</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-slate-500">Credit</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-slate-500">Due date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-slate-500">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-slate-500">Payment</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-slate-500" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={`${r.orderId}-${r.creditId}`} className="border-b border-slate-50">
                    <TableCell>
                      <div className="text-sm font-medium text-slate-800">{r.studentName}</div>
                      <div className="text-xs text-slate-400">{r.mobile}{r.studentEmail ? ` · ${r.studentEmail}` : ''}</div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {r.courseName || '—'}
                      <div className="text-xs text-slate-400">Fee {formatINR(r.finalFee)}</div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">{r.counsellorName || '—'}</TableCell>
                    <TableCell className="text-sm font-semibold text-slate-800">{formatINR(r.creditAmount)}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-700">{formatDateShort(r.creditDueDate)}</TableCell>
                    <TableCell>
                      <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium', CREDIT_STATUS_BADGE[r.creditStatus])}>
                        {r.creditStatus}
                      </span>
                      {r.daysOverdue > 0 && <div className="mt-1 text-[11px] text-red-600">{r.daysOverdue} day{r.daysOverdue > 1 ? 's' : ''} overdue</div>}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {r.creditStatus === 'Paid' ? (
                        <>
                          <span className="font-mono">{r.paymentReferenceId}</span>
                          <div>{formatDateShort(r.paymentDate)}{r.paymentMode ? ` · ${r.paymentMode}` : ''}</div>
                        </>
                      ) : (
                        r.remarks || '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="h-8 rounded-lg px-2 text-xs" onClick={() => setFinancialsOrder({ id: r.orderId, name: r.studentName })}>
                        <Wallet className="mr-1 h-4 w-4 text-orange-500" /> Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Notification history (admin) */}
      {panel === 'admin' && (
        <Card className="overflow-hidden border-0 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-800">Daily notification</h2>
              <p className="text-xs text-slate-500">Overdue and due-today credits are sent to admins once a day. Each credit is notified at most once per day.</p>
            </div>
            <Button className="rounded-xl bg-orange-600 hover:bg-orange-700" onClick={runNotificationsNow} disabled={runningNow}>
              {runningNow ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellRing className="mr-2 h-4 w-4" />}
              Run now
            </Button>
          </div>
          {loadingRuns ? (
            <div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-orange-400" /></div>
          ) : runs.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">No runs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 bg-slate-50">
                    <TableHead className="text-xs font-semibold uppercase text-slate-500">Date</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-slate-500">Trigger</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-slate-500">Status</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-slate-500">Overdue (found / sent)</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-slate-500">Due today (found / sent)</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-slate-500">Skipped</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-slate-500">Recipients</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow key={run._id} className="border-b border-slate-50 text-sm">
                      <TableCell className="whitespace-nowrap">
                        {run.startedAt ? new Date(run.startedAt).toLocaleString('en-IN') : run.runDate}
                      </TableCell>
                      <TableCell>{run.trigger}</TableCell>
                      <TableCell>
                        <span className={cn('text-xs font-medium', run.status === 'FAILED' ? 'text-red-600' : run.status === 'RUNNING' ? 'text-amber-600' : 'text-emerald-600')}>
                          {run.status}
                        </span>
                        {run.error && <div className="max-w-xs truncate text-[11px] text-red-600" title={run.error}>{run.error}</div>}
                      </TableCell>
                      <TableCell>{run.pastDueFound ?? 0} / {run.pastDueNotified ?? 0}</TableCell>
                      <TableCell>{run.dueTodayFound ?? 0} / {run.dueTodayNotified ?? 0}</TableCell>
                      <TableCell>{run.alreadyNotified ?? 0}</TableCell>
                      <TableCell>{run.recipients?.length ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      )}

      <OrderFinancialsDialog
        open={!!financialsOrder}
        onOpenChange={(open) => !open && setFinancialsOrder(null)}
        orderId={financialsOrder?.id || null}
        studentName={financialsOrder?.name}
        permissions={permissions}
        loanPartners={loanPartners}
        onChanged={fetchReport}
      />
    </div>
  );
}

export default PendingCreditsPage;
