import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw, Target, Copy, Plus, TrendingUp, CalendarDays, Users, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MultiSelect } from '@/components/ui/multi-select';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { getDataHandlerWithToken, postDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { useToast } from '@/hooks/use-toast';

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

const formatNumber = (value: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value || 0));

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

  const rows = report?.users || [];
  const summary = report?.summary || {};
  const compareMetrics = compare?.summary?.metrics || [];
  const currentCompare = compareMetrics.find((item: any) => item.metric === selectedMetric) || null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Target Management</h1>
          <p className="text-muted-foreground">Set monthly targets, copy previous targets, and compare achievement.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          />
          <Button variant="outline" onClick={fetchReport} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={openCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Month
          </Button>
          <Button onClick={() => openCreate('single')}>
            <Plus className="mr-2 h-4 w-4" />
            Add / Update
          </Button>
          <Button variant="secondary" onClick={() => openCreate('bulk')}>
            <Users className="mr-2 h-4 w-4" />
            Bulk Targets
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Users</p>
              <p className="text-xl font-semibold">{summary.totalUsers || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">Target Value</p>
              <p className="text-xl font-semibold">{formatNumber(summary.totalTarget || 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Achieved</p>
              <p className="text-xl font-semibold">{formatNumber(summary.totalAchieved || 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-xs text-muted-foreground">Month</p>
              <p className="text-sm font-medium">{report?.period?.label || month}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Monthly Targets</CardTitle>
              <p className="text-xs text-muted-foreground">Click a row to load the comparison line.</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as TargetMetricKey)}>
                <SelectTrigger className="w-[180px]">
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
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No targets found for this month.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Target</TableHead>
                      <TableHead className="text-right">Achieved</TableHead>
                      <TableHead className="text-right">Progress</TableHead>
                      <TableHead className="text-right">Days Left</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row: any) => {
                      const selectedMetricRow = row.metrics?.find((m: any) => m.metric === selectedMetric) || row.metrics?.[0];
                      return (
                        <TableRow
                          key={row.userId}
                          className={`cursor-pointer ${String(row.userId) === String(selectedUserId) ? 'bg-muted/40' : ''}`}
                          onClick={() => {
                            setSelectedUserId(String(row.userId));
                          }}
                        >
                          <TableCell>
                            <div className="font-medium">{row.name}</div>
                            <div className="text-xs text-muted-foreground">ID: {row.employeeId || '-'}</div>
                          </TableCell>
                          <TableCell>{row.roleName}</TableCell>
                          <TableCell className="text-right">{selectedMetricRow?.target ?? 0}</TableCell>
                          <TableCell className="text-right">{selectedMetricRow?.achieved ?? 0}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{selectedMetricRow?.percentage ?? 0}%</Badge>
                          </TableCell>
                          <TableCell className="text-right">{row.daysLeft ?? 0}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUserId(String(row.userId));
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comparison</CardTitle>
            <p className="text-xs text-muted-foreground">
              {selectedUser ? `${selectedUser.name} - ${selectedUser.roleName}` : 'Select a user to compare'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingCompare ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : currentCompare ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="text-xl font-semibold">{currentCompare.target}</p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">Achieved</p>
                    <p className="text-xl font-semibold">{currentCompare.achieved}</p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="text-xl font-semibold">{currentCompare.remaining}</p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="text-xs text-muted-foreground">Days Left</p>
                    <p className="text-xl font-semibold">{compare?.daysLeft ?? 0}</p>
                  </div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Selected Metric</span>
                    <Badge>{selectedMetric}</Badge>
                  </div>
                  <div className="mt-2 text-2xl font-semibold">{currentCompare.percentage || 0}%</div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={compare?.chart?.labels?.map((label: string, index: number) => ({
                        day: index + 1,
                        label,
                        target: compare?.chart?.target?.[index] ?? 0,
                        achieved: compare?.chart?.achieved?.[index] ?? 0,
                      })) || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="target" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="achieved" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="grid gap-2">
                  {compareMetrics.map((item: any) => (
                    <div key={item.metric} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                      <span className="capitalize">{item.metric}</span>
                      <span>{item.achieved} / {item.target}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Select a user to see the comparison line.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{targetMode === 'bulk' ? 'Bulk Targets' : 'Add / Update Target'}</DialogTitle>
            <DialogDescription>
              Set monthly values for calls, meets, PCAT done, registrations, revenue, and tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 md:grid-cols-2">
            {targetMode === 'single' ? (
              <div className="space-y-2 md:col-span-2">
                <Label>User</Label>
                <SearchableDropdown
                  options={userOptions}
                  value={form.userId}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, userId: value }))}
                  placeholder="Select user"
                  searchPlaceholder="Search user..."
                  emptyMessage="No users found"
                  allowClear
                  onClear={() => setForm((prev) => ({ ...prev, userId: '' }))}
                />
              </div>
            ) : (
              <div className="space-y-2 md:col-span-2">
                <Label>Users</Label>
                <MultiSelect
                  options={userOptions}
                  selected={form.userIds}
                  onChange={(selected) => setForm((prev) => ({ ...prev, userIds: selected }))}
                  placeholder="Select users to apply the same target"
                  searchPlaceholder="Search users..."
                />
                <p className="text-xs text-muted-foreground">If no users are selected, the target will apply to all accessible users.</p>
              </div>
            )}

            {[
              ['calls', 'Calls'],
              ['meets', 'Meets'],
              ['pcatDone', 'PCAT Done'],
              ['registrationDone', 'Registration Done'],
              ['revenue', 'Revenue'],
              ['tasks', 'Tasks'],
            ].map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  type="number"
                  value={(form as any)[key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitTarget} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={copyOpen} onOpenChange={setCopyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy Monthly Targets</DialogTitle>
            <DialogDescription>Copy any previous month target set into a new month.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Source Month</Label>
              <Input type="month" value={copySourceMonth} onChange={(e) => setCopySourceMonth(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Target Month</Label>
              <Input type="month" value={copyTargetMonth} onChange={(e) => setCopyTargetMonth(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyOpen(false)}>Cancel</Button>
            <Button onClick={submitCopy} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
