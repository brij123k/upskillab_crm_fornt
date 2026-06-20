import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Target,
  Copy,
  Plus,
  TrendingUp,
  CalendarDays,
  Users,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MultiSelect } from '@/components/ui/multi-select';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { getDataHandlerWithToken, postDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { useToast } from '@/hooks/use-toast';

// -------------------- types & constants (unchanged) --------------------
type TargetMetricKey = 'calls' | 'meets' | 'pcatDone' | 'registrationDone' | 'revenue' | 'tasks';

const METRICS: { key: TargetMetricKey; label: string }[] = [
  { key: 'calls', label: 'Calls' },
  { key: 'meets', label: 'Meets' },
  { key: 'pcatDone', label: 'PCAT Done' },
  { key: 'registrationDone', label: 'Registration Done' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'tasks', label: 'Tasks' },
];

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value || 0));

// -------------------- component ------------------------------------------
export function TargetsPage() {
  const { toast } = useToast();
  const [month, setMonth] = useState(currentMonth());
  const [report, setReport] = useState<any>(null);
  const [compare, setCompare] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [targetMode, setTargetMode] = useState<'single' | 'bulk'>('single');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedMetric, setSelectedMetric] = useState<TargetMetricKey>('calls');
  const [copySourceMonth, setCopySourceMonth] = useState('');
  const [copyTargetMonth, setCopyTargetMonth] = useState(currentMonth());
  const [form, setForm] = useState({
    userId: '',
    userIds: [] as string[],
    calls: '0',
    meets: '0',
    pcatDone: '0',
    registrationDone: '0',
    revenue: '0',
    tasks: '0',
  });

  // -------------------- data fetching (unchanged) --------------------
  const fetchUsers = async () => {
    try {
      const response = await getDataHandlerWithToken('getAllProfile', null, null, true);
      const rows = response?.data || response || [];
      const mapped = rows.map((row: any) => ({
        userId: row?.userId?._id || row?.userId || row?._id,
        employeeId: row?.userId?.employeeId || row?.employeeId || '-',
        name: row?.userId?.name || row?.name || 'Unknown',
        email: row?.userId?.email || row?.email || '',
        roleName: row?.userId?.role?.name || row?.role?.name || '-',
      }));
      setUsers(mapped);
      if (!selectedUserId && mapped.length) {
        setSelectedUserId(String(mapped[0].userId));
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await getDataHandlerWithToken(ApiConfig.getTargetReport, { month }, null, true);
      setReport(response?.data || response || null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load target report',
        variant: 'destructive',
      });
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompare = async (userId = selectedUserId, metric = selectedMetric) => {
    if (!userId) return;
    try {
      setLoadingCompare(true);
      const response = await getDataHandlerWithToken(ApiConfig.getTargetByUser(userId), { month, metric }, null, true);
      setCompare(response?.data || response || null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load target comparison',
        variant: 'destructive',
      });
      setCompare(null);
    } finally {
      setLoadingCompare(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [month]);

  useEffect(() => {
    fetchCompare(selectedUserId, selectedMetric);
  }, [selectedUserId, selectedMetric, month]);

  // -------------------- handlers (unchanged) --------------------
  const openCreate = (mode: 'single' | 'bulk' = 'single') => {
    setTargetMode(mode);
    setForm({
      userId: selectedUserId || '',
      userIds: [],
      calls: '0',
      meets: '0',
      pcatDone: '0',
      registrationDone: '0',
      revenue: '0',
      tasks: '0',
    });
    setDialogOpen(true);
  };

  const openCopy = () => {
    setCopySourceMonth(month);
    setCopyTargetMonth(month);
    setCopyOpen(true);
  };

  const submitTarget = async () => {
    try {
      setSaving(true);
      const payload = {
        month,
        targets: {
          calls: Number(form.calls || 0),
          meets: Number(form.meets || 0),
          pcatDone: Number(form.pcatDone || 0),
          registrationDone: Number(form.registrationDone || 0),
          revenue: Number(form.revenue || 0),
          tasks: Number(form.tasks || 0),
        },
      };

      if (targetMode === 'bulk') {
        await postDataHandlerWithToken(ApiConfig.createTargetsBulk, {
          ...payload,
          userIds: form.userIds,
        }, true);
      } else {
        if (!form.userId) {
          throw new Error('Please select a user');
        }
        await postDataHandlerWithToken(ApiConfig.createTarget, {
          ...payload,
          userId: form.userId,
        }, true);
      }

      toast({ title: 'Success', description: 'Target saved successfully' });
      setDialogOpen(false);
      await fetchReport();
      if (selectedUserId) await fetchCompare(selectedUserId, selectedMetric);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save target',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const submitCopy = async () => {
    try {
      setSaving(true);
      await postDataHandlerWithToken(ApiConfig.copyTargets, {
        sourceMonth: copySourceMonth,
        targetMonth: copyTargetMonth,
      }, true);
      toast({ title: 'Success', description: 'Targets copied successfully' });
      setCopyOpen(false);
      if (copyTargetMonth) setMonth(copyTargetMonth);
      await fetchReport();
      if (selectedUserId) await fetchCompare(selectedUserId, selectedMetric);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to copy targets',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // -------------------- derived data (unchanged) --------------------
  const userOptions = useMemo(() => {
    return users.map((user) => ({
      value: user.userId || user._id || user.id,
      label: user.name || 'Unknown',
      empId: user.employeeId,
      email: user.email,
      role: user.roleName || user.role?.name,
    }));
  }, [users]);

  const selectedUser = useMemo(() => {
    return users.find((user) => String(user.userId || user._id || user.id) === String(selectedUserId)) || null;
  }, [users, selectedUserId]);

  const rows = report?.users || [];
  const summary = report?.summary || {};
  const compareMetrics = compare?.summary?.metrics || [];
  const currentCompare = compareMetrics.find((item: any) => item.metric === selectedMetric) || null;

  // -------------------- UI --------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Target Management</h1>
            <p className="text-slate-500 mt-1">Set monthly targets, copy previous targets, and compare achievement.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Month selector */}
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm"
            />
            <Button variant="outline" onClick={fetchReport} disabled={loading} className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={openCopy} className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl">
              <Copy className="mr-2 h-4 w-4" />
              Copy Month
            </Button>
            <Button onClick={() => openCreate('single')} className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-4 py-2">
              <Plus className="mr-2 h-4 w-4" />
              Add / Update
            </Button>
            <Button variant="secondary" onClick={() => openCreate('bulk')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-4 py-2">
              <Users className="mr-2 h-4 w-4" />
              Bulk Targets
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Users</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{summary.totalUsers || 0}</p>
              </div>
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Target Value</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{formatNumber(summary.totalTarget || 0)}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Achieved</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{formatNumber(summary.totalAchieved || 0)}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Month</p>
                <p className="text-sm font-medium text-slate-800 mt-1">{report?.period?.label || month}</p>
              </div>
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content: Table + Comparison */}
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          {/* Left: Monthly Targets Table */}
          <Card className="bg-white border-0 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-800">Monthly Targets</h2>
                <p className="text-xs text-slate-400">Click a row to load the comparison chart.</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as TargetMetricKey)}>
                  <SelectTrigger className="w-[180px] h-8 text-sm rounded-lg border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METRICS.map((metric) => (
                      <SelectItem key={metric.key} value={metric.key}>
                        {metric.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
                </div>
              ) : rows.length === 0 ? (
                <div className="py-16 text-center">
                  <Target className="w-12 h-12 mx-auto text-slate-300" />
                  <h3 className="mt-3 text-base font-medium text-slate-700">No targets found</h3>
                  <p className="text-sm text-slate-400">Set targets for this month to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 border-b border-slate-100">
                        <TableHead className="text-xs font-semibold text-slate-500 uppercase">Employee</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 uppercase">Role</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 uppercase text-right">Target</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 uppercase text-right">Achieved</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 uppercase text-right">Progress</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 uppercase text-right">Days Left</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 uppercase text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row: any) => {
                        const selectedMetricRow =
                          row.metrics?.find((m: any) => m.metric === selectedMetric) || row.metrics?.[0];
                        return (
                          <TableRow
                            key={row.userId}
                            className={`cursor-pointer border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${
                              String(row.userId) === String(selectedUserId) ? 'bg-slate-50' : ''
                            }`}
                            onClick={() => {
                              setSelectedUserId(String(row.userId));
                            }}
                          >
                            <TableCell>
                              <div className="font-medium text-slate-800 text-sm">{row.name}</div>
                              <div className="text-xs text-slate-400">ID: {row.employeeId || '-'}</div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">{row.roleName}</TableCell>
                            <TableCell className="text-right text-sm text-slate-700">
                              {selectedMetricRow?.target ?? 0}
                            </TableCell>
                            <TableCell className="text-right text-sm text-slate-700">
                              {selectedMetricRow?.achieved ?? 0}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
                                {selectedMetricRow?.percentage ?? 0}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-sm text-slate-600">{row.daysLeft ?? 0}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUserId(String(row.userId));
                                }}
                                className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
                              >
                                <Plus className="h-4 w-4 text-slate-400" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </Card>

          {/* Right: Comparison Card */}
          <Card className="bg-white border-0 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Comparison</h2>
              <p className="text-xs text-slate-400">
                {selectedUser ? `${selectedUser.name} - ${selectedUser.roleName}` : 'Select a user to compare'}
              </p>
            </div>
            <div className="p-5 space-y-5">
              {loadingCompare ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
                </div>
              ) : currentCompare ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Target</p>
                      <p className="text-xl font-semibold text-slate-800 mt-1">{currentCompare.target}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Achieved</p>
                      <p className="text-xl font-semibold text-slate-800 mt-1">{currentCompare.achieved}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Remaining</p>
                      <p className="text-xl font-semibold text-slate-800 mt-1">{currentCompare.remaining}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Days Left</p>
                      <p className="text-xl font-semibold text-slate-800 mt-1">{compare?.daysLeft ?? 0}</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Selected Metric</span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">
                        {selectedMetric}
                      </span>
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-slate-800">
                      {currentCompare.percentage || 0}%
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={
                            compare?.chart?.labels?.map((label: string, index: number) => ({
                              day: index + 1,
                              label,
                              target: compare?.chart?.target?.[index] ?? 0,
                              achieved: compare?.chart?.achieved?.[index] ?? 0,
                            })) || []
                          }
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="target"
                            stroke="#94a3b8"
                            strokeDasharray="5 5"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="achieved"
                            stroke="#f97316"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {compareMetrics.map((item: any) => (
                      <div
                        key={item.metric}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm"
                      >
                        <span className="capitalize text-slate-600">{item.metric}</span>
                        <span className="text-slate-800">
                          {item.achieved} / {item.target}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-16 text-center">
                  <BarChart3 className="w-12 h-12 mx-auto text-slate-300" />
                  <h3 className="mt-3 text-base font-medium text-slate-700">No user selected</h3>
                  <p className="text-sm text-slate-400">Select a user from the table to see comparison.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Add / Update Target Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="rounded-2xl max-w-3xl max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {targetMode === 'bulk' ? 'Bulk Targets' : 'Add / Update Target'}
              </DialogTitle>
              <DialogDescription>
                Set monthly values for calls, meets, PCAT done, registrations, revenue, and tasks.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2 md:grid-cols-2">
              {targetMode === 'single' ? (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase">User</Label>
                  <SearchableDropdown
                    options={userOptions}
                    value={form.userId}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, userId: value }))}
                    placeholder="Select user"
                    searchPlaceholder="Search user..."
                    emptyMessage="No users found"
                    allowClear
                    onClear={() => setForm((prev) => ({ ...prev, userId: '' }))}
                    className="mt-1.5"
                  />
                </div>
              ) : (
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase">Users</Label>
                  <MultiSelect
                    options={userOptions}
                    selected={form.userIds}
                    onChange={(selected) => setForm((prev) => ({ ...prev, userIds: selected }))}
                    placeholder="Select users to apply the same target"
                    searchPlaceholder="Search users..."
                  />
                  <p className="text-xs text-slate-400">
                    If no users are selected, the target will apply to all accessible users.
                  </p>
                </div>
              )}

              {(
                [
                  ['calls', 'Calls'],
                  ['meets', 'Meets'],
                  ['pcatDone', 'PCAT Done'],
                  ['registrationDone', 'Registration Done'],
                  ['revenue', 'Revenue'],
                  ['tasks', 'Tasks'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase">{label}</Label>
                  <Input
                    type="number"
                    value={(form as any)[key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="mt-1.5 rounded-xl border-slate-200"
                  />
                </div>
              ))}
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={submitTarget} disabled={saving} className="bg-orange-600 hover:bg-orange-700 rounded-xl">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Copy Month Dialog */}
        <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
          <DialogContent className="rounded-2xl max-w-md max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <DialogHeader>
              <DialogTitle className="text-xl">Copy Monthly Targets</DialogTitle>
              <DialogDescription>Copy any previous month target set into a new month.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase">Source Month</Label>
                <Input
                  type="month"
                  value={copySourceMonth}
                  onChange={(e) => setCopySourceMonth(e.target.value)}
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase">Target Month</Label>
                <Input
                  type="month"
                  value={copyTargetMonth}
                  onChange={(e) => setCopyTargetMonth(e.target.value)}
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
            </div>
            <DialogFooter className="pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setCopyOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={submitCopy} disabled={saving} className="bg-orange-600 hover:bg-orange-700 rounded-xl">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Copy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}