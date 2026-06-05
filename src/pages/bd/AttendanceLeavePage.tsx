import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  ShieldAlert,
  User,
  UserCheck,
  XCircle,
  AlertCircle,
  TrendingUp,
  Plane,
} from 'lucide-react';
import { getUser } from '@/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MultiSelect } from '@/components/ui/multi-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getDataHandlerWithToken, patchTokenDataHandler, postDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type UserRef = {
  _id: string;
  id?: string;
  name?: string;
  email?: string;
  employeeId?: number;
};

type AttendanceRecord = {
  _id: string;
  userId: UserRef;
  loginTime: string;
  logoutTime?: string;
  workHours: number;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'leave';
  date: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
};

type LeaveRecord = {
  _id: string;
  userId: UserRef;
  createdBy: UserRef;
  reportToUserId: UserRef;
  reportToUserIds?: UserRef[];
  subject: string;
  leaveType: 'CL' | 'EL';
  leaveFrom: string;
  leaveTo?: string;
  leaveDate?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvalReason?: string;
  approvedBy?: UserRef;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type LeavePolicy = {
  casualLeavePerMonth?: number;
  earnedLeavePerYear?: number;
  earnedLeaveCarryForwardCap?: number;
  allowEarnedLeaveCarryForward?: boolean;
};

type LeaveSummary = {
  policy?: LeavePolicy;
  month?: {
    casualLeaveLimit?: number;
    casualLeaveUsed?: number;
    casualLeaveRemaining?: number;
  };
  year?: {
    earnedLeaveOpening?: number;
    earnedLeaveUsed?: number;
    earnedLeaveRemaining?: number;
  };
};

type SeniorOption = {
  _id: string;
  name: string;
  email: string;
  employeeId?: number;
};

const ATTENDANCE_STATUS_STYLES: Record<string, string> = {
  present: 'bg-green-100 text-green-800 border-green-200',
  absent: 'bg-red-100 text-red-800 border-red-200',
  late: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'half-day': 'bg-orange-100 text-orange-800 border-orange-200',
  leave: 'bg-sky-100 text-sky-800 border-sky-200',
};

const LEAVE_STATUS_STYLES: Record<LeaveRecord['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
};

const getId = (value: any) => value?._id || value?.id || value;

const formatRange = (leave: LeaveRecord) => {
  const from = leave.leaveFrom || leave.leaveDate;
  const to = leave.leaveTo || leave.leaveFrom || leave.leaveDate;
  if (!from) return '-';
  const fromText = format(new Date(from), 'MMM dd, yyyy');
  const toText = to ? format(new Date(to), 'MMM dd, yyyy') : fromText;
  return fromText === toText ? fromText : `${fromText} - ${toText}`;
};

const countDays = (leave: LeaveRecord) => {
  const start = new Date(leave.leaveFrom || leave.leaveDate);
  const end = new Date(leave.leaveTo || leave.leaveFrom || leave.leaveDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
};

const statusLabel = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export function AttendanceLeavePage() {
  const { leaveId } = useParams<{ leaveId?: string }>();
  const currentUser = getUser();
  const currentUserId = currentUser?._id || currentUser?.id || currentUser?.userId || '';
  const currentRoleId = currentUser?.role?._id || currentUser?.roleId || currentUser?.role?.id || '';

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [summary, setSummary] = useState<LeaveSummary | null>(null);
  const [policy, setPolicy] = useState<LeavePolicy | null>(null);
  const [seniors, setSeniors] = useState<SeniorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({
    leaveType: 'CL' as 'CL' | 'EL',
    subject: '',
    leaveFrom: '',
    leaveTo: '',
    reason: '',
    reportToUserIds: [] as string[],
  });

  const fetchData = async (showSpinner = false) => {
    if (!currentUserId) return;

    try {
      if (showSpinner) setRefreshing(true);
      else setLoading(true);

      const requests = [
        getDataHandlerWithToken(ApiConfig.getAttendanceByUserId(currentUserId), null, null, true),
        getDataHandlerWithToken(ApiConfig.getMyLeaves, { page: 1, limit: 200 }, null, true),
        getDataHandlerWithToken(ApiConfig.getMyLeaveSummary, null, null, true),
        getDataHandlerWithToken(ApiConfig.getMySeniors, null, null, true),
      ];

      if (currentRoleId) {
        requests.push(getDataHandlerWithToken(ApiConfig.getLeavePolicyByRole(currentRoleId), null, null, true));
      } else {
        requests.push(Promise.resolve(null));
      }

      const [attendanceRes, leavesRes, summaryRes, seniorsRes, policyRes] = await Promise.all(requests);

      const attendanceData = Array.isArray(attendanceRes?.data) ? attendanceRes.data : Array.isArray(attendanceRes) ? attendanceRes : [];
      const leaveData = Array.isArray(leavesRes?.data) ? leavesRes.data : Array.isArray(leavesRes) ? leavesRes : [];
      const seniorData = Array.isArray(seniorsRes?.data) ? seniorsRes.data : Array.isArray(seniorsRes) ? seniorsRes : [];

      setAttendance(attendanceData.sort((a: AttendanceRecord, b: AttendanceRecord) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLeaves(leaveData.sort((a: LeaveRecord, b: LeaveRecord) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setSummary(summaryRes?.data || summaryRes || null);
      setSeniors(seniorData);
      setPolicy(policyRes?.data || policyRes || null);
    } catch (error) {
      console.error('Failed to load attendance/leave data:', error);
      toast.error('Failed to load attendance and leave data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openLeaveDetail = async (id: string) => {
    const cached = leaves.find((item) => item._id === id);
    if (cached) {
      setSelectedLeave(cached);
      setDetailOpen(true);
      return;
    }

    const response = await getDataHandlerWithToken(ApiConfig.getMyLeaveById(id), null, null, true);
    const data = response?.data || response;
    if (data) {
      setSelectedLeave(data);
      setDetailOpen(true);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUserId, currentRoleId]);

  useEffect(() => {
    if (leaveId) {
      openLeaveDetail(leaveId).catch((error) => {
        console.error('Failed to load leave detail:', error);
      });
    }
  }, [leaveId, leaves]);

  const monthAttendance = useMemo(() => {
    return attendance.filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === selectedMonth.getMonth() && recordDate.getFullYear() === selectedMonth.getFullYear();
    });
  }, [attendance, selectedMonth]);

  const attendanceStats = useMemo(() => {
    const total = monthAttendance.length;
    const present = monthAttendance.filter((record) => record.status === 'present').length;
    const absent = monthAttendance.filter((record) => record.status === 'absent').length;
    const late = monthAttendance.filter((record) => record.status === 'late').length;
    const halfDay = monthAttendance.filter((record) => record.status === 'half-day').length;
    const leave = monthAttendance.filter((record) => record.status === 'leave').length;
    return { total, present, absent, late, halfDay, leave };
  }, [monthAttendance]);

  const leaveStats = useMemo(() => {
    const totalDays = leaves.reduce((sum, leave) => sum + countDays(leave), 0);
    const approved = leaves.filter((leave) => leave.status === 'approved');
    const rejected = leaves.filter((leave) => leave.status === 'rejected');
    const pending = leaves.filter((leave) => leave.status === 'pending');
    const approvedClDays = approved.filter((leave) => leave.leaveType === 'CL').reduce((sum, leave) => sum + countDays(leave), 0);
    const approvedElDays = approved.filter((leave) => leave.leaveType === 'EL').reduce((sum, leave) => sum + countDays(leave), 0);
    const rejectedClDays = rejected.filter((leave) => leave.leaveType === 'CL').reduce((sum, leave) => sum + countDays(leave), 0);
    const rejectedElDays = rejected.filter((leave) => leave.leaveType === 'EL').reduce((sum, leave) => sum + countDays(leave), 0);
    const clRemaining = summary?.month?.casualLeaveRemaining ?? 0;
    const elRemaining = summary?.year?.earnedLeaveRemaining ?? 0;
    const clLimit = summary?.month?.casualLeaveLimit ?? policy?.casualLeavePerMonth ?? 0;
    const elLimit = summary?.year?.earnedLeaveOpening ?? policy?.earnedLeavePerYear ?? 0;

    return {
      totalDays,
      approved: approved.length,
      rejected: rejected.length,
      pending: pending.length,
      approvedClDays,
      approvedElDays,
      rejectedClDays,
      rejectedElDays,
      clRemaining,
      elRemaining,
      clLimit,
      elLimit,
    };
  }, [leaves, summary, policy]);

  const approverOptions = useMemo(() => {
    return seniors
      .map((senior) => ({
        value: senior._id,
        label: `${senior.name}${senior.employeeId ? ` (${senior.employeeId})` : ''}`,
        disabled: senior._id === currentUserId,
      }))
      .filter((item) => item.value);
  }, [seniors, currentUserId]);

  const leaveTypeOptions = useMemo(() => {
    return [
      {
        value: 'CL',
        label: `Casual Leave ${leaveStats.clRemaining > 0 ? `(${leaveStats.clRemaining} left)` : '(No balance)'}`,
        disabled: leaveStats.clRemaining <= 0,
      },
      {
        value: 'EL',
        label: `Earned Leave ${leaveStats.elRemaining > 0 ? `(${leaveStats.elRemaining} left)` : '(No balance)'}`,
        disabled: leaveStats.elRemaining <= 0,
      },
    ];
  }, [leaveStats.clRemaining, leaveStats.elRemaining]);

  useEffect(() => {
    if (!leaveTypeOptions.find((item) => item.value === form.leaveType && !item.disabled)) {
      const fallback = leaveTypeOptions.find((item) => !item.disabled)?.value || 'CL';
      setForm((prev) => ({ ...prev, leaveType: fallback as 'CL' | 'EL' }));
    }
  }, [leaveTypeOptions]);

  const resetForm = () => {
    const defaultLeaveType = leaveTypeOptions.find((item) => !item.disabled)?.value || 'CL';
    setForm({
      leaveType: defaultLeaveType as 'CL' | 'EL',
      subject: '',
      leaveFrom: '',
      leaveTo: '',
      reason: '',
      reportToUserIds: approverOptions[0]?.value ? [approverOptions[0].value] : [],
    });
  };

  useEffect(() => {
    if (!form.reportToUserIds.length && approverOptions.length) {
      setForm((prev) => ({ ...prev, reportToUserIds: [approverOptions[0].value] }));
    }
  }, [approverOptions]);

  const handleCreateLeave = async () => {
    if (!form.subject || !form.leaveFrom || !form.reason || !form.reportToUserIds.length) {
      toast.error('Please fill all required fields');
      return;
    }

    if (form.leaveType === 'CL' && leaveStats.clRemaining <= 0) {
      toast.error('No CL leave remaining for this month');
      return;
    }

    if (form.leaveType === 'EL' && leaveStats.elRemaining <= 0) {
      toast.error('No EL leave remaining for this year');
      return;
    }

    const payload = {
      leaveType: form.leaveType,
      subject: form.subject,
      leaveFrom: form.leaveFrom,
      leaveTo: form.leaveTo || form.leaveFrom,
      reason: form.reason,
      reportToUserIds: form.reportToUserIds,
    };

    setSaving(true);
    try {
      await postDataHandlerWithToken(ApiConfig.createLeave, payload, true);
      toast.success('Leave request submitted');
      resetForm();
      await fetchData();
    } catch (error: any) {
      console.error('Failed to submit leave:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to submit leave');
    } finally {
      setSaving(false);
    }
  };

  const cancelLeave = async (id: string) => {
    try {
      await patchTokenDataHandler(ApiConfig.cancelMyLeave(id), null, true);
      toast.success('Leave cancelled');
      await fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to cancel leave');
    }
  };

  const formatDate = (value: string) => format(new Date(value), 'MMM dd, yyyy');
  const formatTime = (value: string) => format(new Date(value), 'hh:mm a');
  const formatHours = (hours: number) => `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
  const currentLabel = format(selectedMonth, 'MMMM yyyy');

  const changeMonth = (offset: number) => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const leaveTypeBadge = (type?: string) => {
    if (!type) return null;
    return (
      <Badge variant="outline" className={cn(type === 'CL' ? 'border-sky-200 text-sky-700 bg-sky-50' : 'border-violet-200 text-violet-700 bg-violet-50')}>
        {type}
      </Badge>
    );
  };

  if (loading && !attendance.length && !leaves.length) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Loading attendance and leave data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      {/* Header Section */}
      <div className="rounded-2xl border bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-4 text-white shadow-lg">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <Button variant="secondary" size="sm" onClick={() => window.history.back()} className="gap-1.5 h-8 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-1.5 text-cyan-200">
                <Plane className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">BDA Attendance & Leave</span>
              </div>
              <h1 className="mt-1 text-xl font-bold tracking-tight">Track attendance and manage leave</h1>
              <p className="mt-1 text-xs text-slate-300">Review monthly attendance and apply CL/EL based on policy</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => fetchData(true)} disabled={refreshing} className="gap-1.5 h-8 text-xs">
              <RefreshCw className={refreshing ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Compact */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="border-slate-200/70 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">CL Remaining</p>
                <p className="mt-1 text-2xl font-semibold">{leaveStats.clRemaining}</p>
              </div>
              <div className="rounded-xl bg-sky-100 p-2 text-sky-700">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Limit {leaveStats.clLimit}/month</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200/70 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">EL Remaining</p>
                <p className="mt-1 text-2xl font-semibold">{leaveStats.elRemaining}</p>
              </div>
              <div className="rounded-xl bg-violet-100 p-2 text-violet-700">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Limit {leaveStats.elLimit}/year</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200/70 shadow-sm">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Approved</p>
            <p className="mt-1 text-2xl font-semibold">{leaveStats.approvedClDays} / {leaveStats.approvedElDays}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">CL / EL days</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200/70 shadow-sm">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">{leaveStats.pending}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-[320px] h-9">
          <TabsTrigger value="attendance" className="text-xs">Attendance</TabsTrigger>
          <TabsTrigger value="leave" className="text-xs">Leave Management</TabsTrigger>
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          {/* Attendance Stats */}
          <div className="grid gap-3 grid-cols-3 md:grid-cols-5">
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Days</p><p className="mt-1 text-2xl font-semibold">{attendanceStats.total}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Present</p><p className="mt-1 text-2xl font-semibold text-green-700">{attendanceStats.present}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Absent</p><p className="mt-1 text-2xl font-semibold text-red-700">{attendanceStats.absent}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Late</p><p className="mt-1 text-2xl font-semibold text-amber-700">{attendanceStats.late}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Half-Day</p><p className="mt-1 text-2xl font-semibold text-orange-700">{attendanceStats.halfDay}</p></CardContent></Card>
          </div>

          {/* Attendance Table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarDays className="h-4 w-4" />
                    Attendance Records
                  </CardTitle>
                  <CardDescription className="text-xs">Monthly attendance log with status and reason</CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => changeMonth(-1)} className="h-7 text-xs px-2">Prev</Button>
                  <span className="min-w-[100px] text-center text-xs font-medium">{currentLabel}</span>
                  <Button variant="outline" size="sm" onClick={() => changeMonth(1)} className="h-7 text-xs px-2">Next</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {monthAttendance.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
                  <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No attendance records</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Attendance for {currentLabel} will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-xs">
                        <TableHead className="text-xs h-9">Date</TableHead>
                        <TableHead className="text-xs h-9">Login</TableHead>
                        <TableHead className="text-xs h-9">Logout</TableHead>
                        <TableHead className="text-xs h-9">Hours</TableHead>
                        <TableHead className="text-xs h-9">Status</TableHead>
                        <TableHead className="text-xs h-9">Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthAttendance.map((record) => (
                        <TableRow key={record._id} className="text-xs">
                          <TableCell className="font-medium py-2">{formatDate(record.date)}</TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1.5">
                              <Clock3 className="h-3 w-3 text-muted-foreground" />
                              {record.loginTime ? formatTime(record.loginTime) : '-'}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            {record.logoutTime ? (
                              <div className="flex items-center gap-1.5">
                                <Clock3 className="h-3 w-3 text-muted-foreground" />
                                {formatTime(record.logoutTime)}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="py-2">{record.workHours > 0 ? formatHours(record.workHours) : '-'}</TableCell>
                          <TableCell className="py-2">
                            <Badge className={cn('gap-1 text-xs px-2 py-0', ATTENDANCE_STATUS_STYLES[record.status] || 'bg-slate-100 text-slate-800')}>
                              {statusLabel(record.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[280px] py-2">
                            <div className="line-clamp-1 text-xs text-muted-foreground">
                              {record.reason || '-'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Tab */}
        <TabsContent value="leave" className="space-y-4">
          {/* Apply Leave Form - Compact */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Apply Leave Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plane className="h-4 w-4" />
                  Apply Leave
                </CardTitle>
                <CardDescription className="text-xs">Choose CL or EL based on your balance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Leave Type</Label>
                    <Select
                      value={form.leaveType}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, leaveType: value as 'CL' | 'EL' }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        {leaveTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} disabled={option.disabled} className="text-xs">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Subject</Label>
                    <Input
                      placeholder="Leave subject"
                      value={form.subject}
                      onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">From Date</Label>
                    <Input
                      type="date"
                      value={form.leaveFrom}
                      onChange={(e) => setForm((prev) => ({ ...prev, leaveFrom: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">To Date</Label>
                    <Input
                      type="date"
                      value={form.leaveTo}
                      onChange={(e) => setForm((prev) => ({ ...prev, leaveTo: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Report To</Label>
                  <MultiSelect
                    options={approverOptions}
                    selected={form.reportToUserIds}
                    onChange={(selected) => setForm((prev) => ({ ...prev, reportToUserIds: selected }))}
                    placeholder="Select approver"
                    searchPlaceholder="Search approver..."
                    emptyMessage="No approver found"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Reason</Label>
                  <Textarea
                    rows={3}
                    placeholder="Write your leave reason..."
                    value={form.reason}
                    onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                    className="text-xs"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 p-3">
                  <div className="text-xs text-muted-foreground">
                    Validated against role policy
                  </div>
                  <Button onClick={handleCreateLeave} disabled={saving} size="sm" className="gap-1.5 h-8 text-xs">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plane className="h-3.5 w-3.5" />}
                    Submit
                  </Button>
                </div>

                <div className="grid gap-2 grid-cols-2">
                  <div className="rounded-xl border p-2.5">
                    <p className="text-xs text-muted-foreground">Policy</p>
                    <div className="mt-1 flex gap-1.5">
                      <Badge variant="outline" className="text-xs">CL {policy?.casualLeavePerMonth ?? summary?.month?.casualLeaveLimit ?? 0}/mo</Badge>
                      <Badge variant="outline" className="text-xs">EL {policy?.earnedLeavePerYear ?? summary?.year?.earnedLeaveOpening ?? 0}/yr</Badge>
                    </div>
                  </div>
                  <div className="rounded-xl border p-2.5">
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <div className="mt-1 flex gap-1.5">
                      <Badge className="bg-sky-100 text-sky-800 border-sky-200 text-xs">CL {leaveStats.clRemaining}</Badge>
                      <Badge className="bg-violet-100 text-violet-800 border-violet-200 text-xs">EL {leaveStats.elRemaining}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leave Balance Overview - Compact */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldAlert className="h-4 w-4" />
                  Leave Balance
                </CardTitle>
                <CardDescription className="text-xs">Approved, rejected, and remaining leave days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 grid-cols-2">
                  <div className="rounded-xl border p-2.5">
                    <p className="text-xs text-muted-foreground">Max CL</p>
                    <p className="mt-1 text-xl font-semibold">{leaveStats.clLimit}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">per month</p>
                  </div>
                  <div className="rounded-xl border p-2.5">
                    <p className="text-xs text-muted-foreground">Max EL</p>
                    <p className="mt-1 text-xl font-semibold">{leaveStats.elLimit}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">per year</p>
                  </div>
                  <div className="rounded-xl border p-2.5">
                    <p className="text-xs text-muted-foreground">Approved CL</p>
                    <p className="mt-1 text-xl font-semibold text-sky-700">{leaveStats.approvedClDays}</p>
                  </div>
                  <div className="rounded-xl border p-2.5">
                    <p className="text-xs text-muted-foreground">Approved EL</p>
                    <p className="mt-1 text-xl font-semibold text-violet-700">{leaveStats.approvedElDays}</p>
                  </div>
                  <div className="rounded-xl border p-2.5">
                    <p className="text-xs text-muted-foreground">Rejected CL</p>
                    <p className="mt-1 text-xl font-semibold text-red-600">{leaveStats.rejectedClDays}</p>
                  </div>
                  <div className="rounded-xl border p-2.5">
                    <p className="text-xs text-muted-foreground">Rejected EL</p>
                    <p className="mt-1 text-xl font-semibold text-red-600">{leaveStats.rejectedElDays}</p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border bg-muted/20 p-2.5">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-medium">Carry-forward</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Unused EL may roll into next year up to cap
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leave History - Compact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Leave History</CardTitle>
              <CardDescription className="text-xs">Your CL and EL requests with status</CardDescription>
            </CardHeader>
            <CardContent>
              {leaves.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
                  <XCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No leaves yet</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Submitted leave requests will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaves.map((leave) => (
                    <button
                      key={leave._id}
                      type="button"
                      onClick={() => openLeaveDetail(leave._id)}
                      className="w-full rounded-xl border p-3 text-left transition-all hover:shadow-sm"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge className={cn('text-xs px-2 py-0', LEAVE_STATUS_STYLES[leave.status])}>{statusLabel(leave.status)}</Badge>
                            {leaveTypeBadge(leave.leaveType)}
                            <Badge variant="outline" className="text-xs">{formatRange(leave)}</Badge>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">{leave.subject}</h3>
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{leave.reason}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                            <span>Created: {formatDate(leave.createdAt)}</span>
                            <span>Days: {countDays(leave)}</span>
                            {leave.approvedBy && <span>By: {leave.approvedBy.name}</span>}
                          </div>
                        </div>
                        {leave.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelLeave(leave._id);
                            }}
                            className="h-7 text-xs"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Leave Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          {selectedLeave && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {selectedLeave.subject}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {formatRange(selectedLeave)} | {selectedLeave.leaveType} | {selectedLeave.status}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge className={cn('text-xs', LEAVE_STATUS_STYLES[selectedLeave.status])}>{statusLabel(selectedLeave.status)}</Badge>
                  {leaveTypeBadge(selectedLeave.leaveType)}
                  {selectedLeave.approvedBy && <Badge variant="outline" className="text-xs">By {selectedLeave.approvedBy.name}</Badge>}
                </div>
                <div className="rounded-xl border bg-muted/30 p-3">
                  <p className="text-sm whitespace-pre-wrap">{selectedLeave.reason}</p>
                </div>
                {selectedLeave.approvalReason && (
                  <div className="rounded-xl border border-dashed p-3">
                    <p className="text-xs font-semibold">Approval Note</p>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{selectedLeave.approvalReason}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)} size="sm" className="text-xs">Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}