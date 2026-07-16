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
  UserCheck,
  XCircle,
  AlertCircle,
  TrendingUp,
  Plane,
  Briefcase,
  Timer,
  Eye,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Calendar,
  Clock,
  Check,
  X,
  Minus,
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

// Types
type UserRef = {
  _id: string;
  id?: string;
  name?: string;
  email?: string;
  employeeId?: number;
  role?: string | { _id: string; name: string };
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
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  createdAt: string;
  updatedAt: string;
};

type LeaveBalance = {
  _id: string;
  userId: UserRef;
  roleId: {
    _id: string;
    name: string;
  };
  year: number;
  availableCL: number;
  availableEL: number;
  carriedForwardEL: number;
  encashedEL: number;
  lastCreditedMonth: number;
  yearClosed: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type SeniorOption = {
  _id: string;
  name: string;
  email: string;
  employeeId?: number;
};

type LeaveFilters = {
  status?: string;
  leaveType?: string;
  fromDate?: string;
  toDate?: string;
  page: number;
  limit: number;
};

// Constants
const ATTENDANCE_STATUS_STYLES: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  absent: 'bg-red-100 text-red-800 border-red-200',
  late: 'bg-amber-100 text-amber-800 border-amber-200',
  'half-day': 'bg-orange-100 text-orange-800 border-orange-200',
  leave: 'bg-sky-100 text-sky-800 border-sky-200',
};

const LEAVE_STATUS_STYLES: Record<LeaveRecord['status'], string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
};

const LEAVE_STATUS_ICONS: Record<LeaveRecord['status'], React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  approved: <Check className="h-3 w-3" />,
  rejected: <X className="h-3 w-3" />,
  cancelled: <Minus className="h-3 w-3" />,
};

// Utility functions
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

const formatDate = (value: string) => format(new Date(value), 'MMM dd, yyyy');
const formatTime = (value: string) => format(new Date(value), 'hh:mm a');
const formatDateTime = (value: string) => format(new Date(value), 'MMM dd, yyyy hh:mm a');

// Rich Text Editor Component
const RichTextDisplay = ({ content }: { content: string }) => {
  // Simple renderer for rich text content
  const renderContent = () => {
    if (!content) return null;
    
    // Split by newlines and parse
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-semibold mt-3 mb-2">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-semibold mt-2 mb-1">{line.slice(4)}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={index} className="text-base font-semibold mt-2 mb-1">{line.slice(5)}</h4>;
      }
      if (line.startsWith('##### ')) {
        return <h5 key={index} className="text-sm font-semibold mt-1 mb-1">{line.slice(6)}</h5>;
      }
      if (line.startsWith('###### ')) {
        return <h6 key={index} className="text-xs font-semibold mt-1 mb-1">{line.slice(7)}</h6>;
      }
      if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 list-disc">{line.slice(2)}</li>;
      }
      if (line.startsWith('* ')) {
        return <li key={index} className="ml-4 list-disc">{line.slice(2)}</li>;
      }
      if (line.startsWith('> ')) {
        return <blockquote key={index} className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-2">{line.slice(2)}</blockquote>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="my-1">{line}</p>;
    });
  };

  return <div className="prose prose-sm max-w-none">{renderContent()}</div>;
};

export function AttendanceLeavePage() {
  const { leaveId } = useParams<{ leaveId?: string }>();
  const currentUser = getUser();
  const currentUserId = currentUser?._id || currentUser?.id || currentUser?.userId || '';

  // State
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [seniors, setSeniors] = useState<SeniorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filters, setFilters] = useState<LeaveFilters>({
    page: 1,
    limit: 10,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [form, setForm] = useState({
    leaveType: 'CL' as 'CL' | 'EL',
    subject: '',
    leaveFrom: '',
    leaveTo: '',
    reason: '',
    reportToUserId: '',
  });

  // Fetch Data
  const fetchData = async (showSpinner = false) => {
    if (!currentUserId) return;

    try {
      if (showSpinner) setRefreshing(true);
      else setLoading(true);

      const [attendanceRes, leavesRes, balanceRes, seniorsRes] = await Promise.all([
        getDataHandlerWithToken(ApiConfig.getAttendanceByUserId(currentUserId), null, null, true),
        getDataHandlerWithToken(ApiConfig.getLeaves, { ...filters, userId: currentUserId }, null, true),
        getDataHandlerWithToken(ApiConfig.getMyLeaveSummary, null, null, true),
        getDataHandlerWithToken(ApiConfig.getMySeniors, null, null, true),
      ]);

      const attendanceData = Array.isArray(attendanceRes?.data) ? attendanceRes.data : Array.isArray(attendanceRes) ? attendanceRes : [];
      const leaveData = Array.isArray(leavesRes?.data) ? leavesRes.data : Array.isArray(leavesRes) ? leavesRes : [];
      const balanceData = balanceRes?.data || balanceRes || null;

      setAttendance(attendanceData.sort((a: AttendanceRecord, b: AttendanceRecord) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLeaves(leaveData.sort((a: LeaveRecord, b: LeaveRecord) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLeaveBalance(balanceData);
      setSeniors(Array.isArray(seniorsRes?.data) ? seniorsRes.data : Array.isArray(seniorsRes) ? seniorsRes : []);
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
  }, [currentUserId, filters]);

  useEffect(() => {
    if (leaveId) {
      openLeaveDetail(leaveId).catch((error) => {
        console.error('Failed to load leave detail:', error);
      });
    }
  }, [leaveId, leaves]);

  // Computed values
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
    const approved = leaves.filter((leave) => leave.status === 'approved');
    const rejected = leaves.filter((leave) => leave.status === 'rejected');
    const pending = leaves.filter((leave) => leave.status === 'pending');
    const approvedClDays = approved.filter((leave) => leave.leaveType === 'CL').reduce((sum, leave) => sum + countDays(leave), 0);
    const approvedElDays = approved.filter((leave) => leave.leaveType === 'EL').reduce((sum, leave) => sum + countDays(leave), 0);
    const rejectedClDays = rejected.filter((leave) => leave.leaveType === 'CL').reduce((sum, leave) => sum + countDays(leave), 0);
    const rejectedElDays = rejected.filter((leave) => leave.leaveType === 'EL').reduce((sum, leave) => sum + countDays(leave), 0);
    
    const clRemaining = leaveBalance?.availableCL ?? 0;
    const elRemaining = leaveBalance?.availableEL ?? 0;

    return {
      approved: approved.length,
      rejected: rejected.length,
      pending: pending.length,
      approvedClDays,
      approvedElDays,
      rejectedClDays,
      rejectedElDays,
      clRemaining,
      elRemaining,
      carriedForward: leaveBalance?.carriedForwardEL ?? 0,
      encashed: leaveBalance?.encashedEL ?? 0,
      year: leaveBalance?.year ?? new Date().getFullYear(),
      totalLeaves: leaves.length,
    };
  }, [leaves, leaveBalance]);

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

  // Set default approver
  useEffect(() => {
    if (!form.reportToUserId && approverOptions.length) {
      setForm((prev) => ({ ...prev, reportToUserId: approverOptions[0].value }));
    }
  }, [approverOptions]);

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
      reportToUserId: approverOptions[0]?.value || '',
    });
  };

  const handleCreateLeave = async () => {
    if (!form.subject || !form.leaveFrom || !form.reason || !form.reportToUserId) {
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
      reportToUserId: form.reportToUserId,
    };

    setSaving(true);
    try {
      await postDataHandlerWithToken(ApiConfig.createLeave, payload, true);
      toast.success('Leave request submitted successfully');
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
      toast.success('Leave cancelled successfully');
      await fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to cancel leave');
    }
  };

  const changeMonth = (offset: number) => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const leaveTypeBadge = (type?: string) => {
    if (!type) return null;
    return (
      <Badge variant="outline" className={cn(
        type === 'CL' ? 'border-sky-200 text-sky-700 bg-sky-50' : 'border-violet-200 text-violet-700 bg-violet-50',
        'text-xs font-medium'
      )}>
        {type}
      </Badge>
    );
  };

  const currentLabel = format(selectedMonth, 'MMMM yyyy');

  if (loading && !attendance.length && !leaves.length) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading attendance and leave data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Professional Header with Stats */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => window.history.back()} 
              className="gap-2 bg-white/10 text-white hover:bg-white/20 border-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-2 text-cyan-400">
                <Plane className="h-4 w-4" />
                <span className="text-xs font-medium tracking-wider uppercase">Employee Portal</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">Attendance & Leave Management</h1>
              <p className="mt-1 text-sm text-slate-300">Track your attendance, apply for leaves, and view balances</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => fetchData(true)} 
              disabled={refreshing} 
              className="gap-2 bg-white/10 text-white hover:bg-white/20 border-0"
            >
              <RefreshCw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        {/* <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <div className="rounded-xl bg-white/5 backdrop-blur-sm p-3 border border-white/10">
            <p className="text-xs text-slate-400">Total Leaves</p>
            <p className="mt-1 text-xl font-bold">{leaveStats.totalLeaves}</p>
          </div>
          <div className="rounded-xl bg-white/5 backdrop-blur-sm p-3 border border-white/10">
            <p className="text-xs text-slate-400">Pending</p>
            <p className="mt-1 text-xl font-bold text-amber-400">{leaveStats.pending}</p>
          </div>
          <div className="rounded-xl bg-white/5 backdrop-blur-sm p-3 border border-white/10">
            <p className="text-xs text-slate-400">Approved</p>
            <p className="mt-1 text-xl font-bold text-emerald-400">{leaveStats.approved}</p>
          </div>
          <div className="rounded-xl bg-white/5 backdrop-blur-sm p-3 border border-white/10">
            <p className="text-xs text-slate-400">CL Balance</p>
            <p className="mt-1 text-xl font-bold text-sky-400">{leaveStats.clRemaining}</p>
          </div>
          <div className="rounded-xl bg-white/5 backdrop-blur-sm p-3 border border-white/10">
            <p className="text-xs text-slate-400">EL Balance</p>
            <p className="mt-1 text-xl font-bold text-violet-400">{leaveStats.elRemaining}</p>
          </div>
          <div className="rounded-xl bg-white/5 backdrop-blur-sm p-3 border border-white/10">
            <p className="text-xs text-slate-400">Carried Forward</p>
            <p className="mt-1 text-xl font-bold text-amber-400">{leaveStats.carriedForward}</p>
          </div>
        </div> */}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] h-11 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="attendance" className="text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CalendarDays className="h-4 w-4 mr-2" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="leave" className="text-sm font-medium rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Plane className="h-4 w-4 mr-2" />
            Leave Management
          </TabsTrigger>
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          {/* Attendance Stats Cards */}
          <div className="grid gap-3 grid-cols-3 md:grid-cols-5">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-xs font-medium text-slate-500">Days</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{attendanceStats.total}</p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 shadow-sm bg-emerald-50/30">
              <CardContent className="p-4 text-center">
                <p className="text-xs font-medium text-emerald-600">Present</p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">{attendanceStats.present}</p>
              </CardContent>
            </Card>
            <Card className="border-red-200 shadow-sm bg-red-50/30">
              <CardContent className="p-4 text-center">
                <p className="text-xs font-medium text-red-600">Absent</p>
                <p className="mt-1 text-2xl font-bold text-red-700">{attendanceStats.absent}</p>
              </CardContent>
            </Card>
            <Card className="border-amber-200 shadow-sm bg-amber-50/30">
              <CardContent className="p-4 text-center">
                <p className="text-xs font-medium text-amber-600">Late</p>
                <p className="mt-1 text-2xl font-bold text-amber-700">{attendanceStats.late}</p>
              </CardContent>
            </Card>
            <Card className="border-orange-200 shadow-sm bg-orange-50/30">
              <CardContent className="p-4 text-center">
                <p className="text-xs font-medium text-orange-600">Half-Day</p>
                <p className="mt-1 text-2xl font-bold text-orange-700">{attendanceStats.halfDay}</p>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Table */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Attendance Records
                  </CardTitle>
                  <CardDescription className="text-xs">Monthly attendance log with status and reason</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => changeMonth(-1)} className="h-8 text-xs px-3">Prev</Button>
                  <span className="min-w-[100px] text-center text-sm font-medium">{currentLabel}</span>
                  <Button variant="outline" size="sm" onClick={() => changeMonth(1)} className="h-8 text-xs px-3">Next</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {monthAttendance.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-muted/20 p-12 text-center m-4">
                  <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-3 text-sm font-semibold">No attendance records</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Attendance for {currentLabel} will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="text-xs font-semibold h-10">Date</TableHead>
                        <TableHead className="text-xs font-semibold h-10">Login</TableHead>
                        <TableHead className="text-xs font-semibold h-10">Status</TableHead>
                        <TableHead className="text-xs font-semibold h-10">Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthAttendance.map((record) => (
                        <TableRow key={record._id} className="hover:bg-slate-50/50">
                          <TableCell className="font-medium py-2.5 text-sm">{formatDate(record.date)}</TableCell>
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-2">
                              <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">{record.loginTime ? formatTime(record.loginTime) : '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Badge className={cn('gap-1.5 text-xs px-2.5 py-1', ATTENDANCE_STATUS_STYLES[record.status] || 'bg-slate-100 text-slate-800')}>
                              {statusLabel(record.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="line-clamp-1 text-sm text-muted-foreground max-w-[280px]">
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
          {/* Apply Leave and Balance Side by Side */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Apply Leave Card */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plane className="h-4 w-4 text-primary" />
                  Apply Leave
                </CardTitle>
                <CardDescription className="text-xs">Choose CL or EL based on your available balance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Leave Type *</Label>
                    <Select
                      value={form.leaveType}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, leaveType: value as 'CL' | 'EL' }))}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {leaveTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} disabled={option.disabled} className="text-sm">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Subject *</Label>
                    <Input
                      placeholder="Brief subject"
                      value={form.subject}
                      onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">From Date *</Label>
                    <Input
                      type="date"
                      value={form.leaveFrom}
                      onChange={(e) => setForm((prev) => ({ ...prev, leaveFrom: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">To Date</Label>
                    <Input
                      type="date"
                      value={form.leaveTo}
                      onChange={(e) => setForm((prev) => ({ ...prev, leaveTo: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Report To *</Label>
                  <Select
                    value={form.reportToUserId}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, reportToUserId: value }))}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select approver" />
                    </SelectTrigger>
                    <SelectContent>
                      {approverOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} disabled={option.disabled} className="text-sm">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Reason *</Label>
                  <Textarea
                    rows={3}
                    placeholder="Describe your reason for leave..."
                    value={form.reason}
                    onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                    className="text-sm resize-none"
                  />
                </div>

                <Button 
                  onClick={handleCreateLeave} 
                  disabled={saving} 
                  className="w-full gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plane className="h-4 w-4" />}
                  Submit Leave Request
                </Button>
              </CardContent>
            </Card>

            {/* Leave Balance Overview */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  Leave Balance
                </CardTitle>
                <CardDescription className="text-xs">Your leave balances for year {leaveStats.year}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-3 grid-cols-2">
                  <div className="rounded-xl bg-gradient-to-br from-sky-50 to-sky-100/50 p-4 border border-sky-200">
                    <p className="text-xs font-medium text-sky-700">Casual Leave</p>
                    <p className="mt-1 text-2xl font-bold text-sky-800">{leaveStats.clRemaining}</p>
                    <p className="mt-0.5 text-[11px] text-sky-600">Available this month</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-violet-50 to-violet-100/50 p-4 border border-violet-200">
                    <p className="text-xs font-medium text-violet-700">Earned Leave</p>
                    <p className="mt-1 text-2xl font-bold text-violet-800">{leaveStats.elRemaining}</p>
                    <p className="mt-0.5 text-[11px] text-violet-600">Available this year</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 border border-amber-200">
                    <p className="text-xs font-medium text-amber-700">Carried Forward</p>
                    <p className="mt-1 text-2xl font-bold text-amber-800">{leaveStats.carriedForward}</p>
                    <p className="mt-0.5 text-[11px] text-amber-600">EL from previous year</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 border border-emerald-200">
                    <p className="text-xs font-medium text-emerald-700">Encashed</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-800">{leaveStats.encashed}</p>
                    <p className="mt-0.5 text-[11px] text-emerald-600">EL encashed this year</p>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-slate-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Leave Summary</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
                        <span>Approved: <strong>{leaveStats.approvedClDays}</strong> CL / <strong>{leaveStats.approvedElDays}</strong> EL</span>
                        <span>•</span>
                        <span>Rejected: <strong>{leaveStats.rejectedClDays}</strong> CL / <strong>{leaveStats.rejectedElDays}</strong> EL</span>
                        <span>•</span>
                        <span>Pending: <strong>{leaveStats.pending}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-dashed border-slate-300 p-3">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Year {leaveStats.year} • Last credited: {leaveBalance?.lastCreditedMonth ? format(new Date(leaveBalance.year, leaveBalance.lastCreditedMonth - 1, 1), 'MMMM yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leave History with Filters */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-primary" />
                    Leave History
                  </CardTitle>
                  <CardDescription className="text-xs">All your leave requests with status</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2 h-8 text-xs"
                >
                  <Filter className="h-3.5 w-3.5" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={filters.status || ''}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, status: value || undefined, page: 1 }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" " className="text-xs">All Status</SelectItem>
                        <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                        <SelectItem value="approved" className="text-xs">Approved</SelectItem>
                        <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                        <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Leave Type</Label>
                    <Select
                      value={filters.leaveType || ''}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, leaveType: value || undefined, page: 1 }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" " className="text-xs">All Types</SelectItem>
                        <SelectItem value="CL" className="text-xs">Casual Leave</SelectItem>
                        <SelectItem value="EL" className="text-xs">Earned Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">From Date</Label>
                    <Input
                      type="date"
                      value={filters.fromDate || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value || undefined, page: 1 }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">To Date</Label>
                    <Input
                      type="date"
                      value={filters.toDate || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value || undefined, page: 1 }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {leaves.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-muted/20 p-12 text-center m-4">
                  <XCircle className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-3 text-sm font-semibold">No leave requests</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Your submitted leave requests will appear here</p>
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  {leaves.map((leave) => (
                    <div
                      key={leave._id}
                      className="rounded-xl border border-slate-200 p-4 transition-all hover:shadow-md hover:border-slate-300 bg-white"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={cn('gap-1.5 text-xs px-2.5 py-1', LEAVE_STATUS_STYLES[leave.status])}>
                              {LEAVE_STATUS_ICONS[leave.status]}
                              {statusLabel(leave.status)}
                            </Badge>
                            {leaveTypeBadge(leave.leaveType)}
                            <Badge variant="outline" className="text-xs bg-slate-50">
                              {formatRange(leave)}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-slate-50">
                              {countDays(leave)} day{countDays(leave) > 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800">{leave.subject}</h3>
                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{leave.reason}</p>
                          </div>
                         <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
  <span>Applied At: {formatDateTime(leave.createdAt)}</span>
  {leave.approvedBy && (
    <span>
      {leave.status === 'rejected' ? 'Rejected by' : 'Approved by'}: {leave.approvedBy.name}
    </span>
  )}
  {leave.approvedAt && (
    <span>
      {leave.status === 'rejected' ? 'Rejected' : 'Approved'}: {formatDateTime(leave.approvedAt)}
    </span>
  )}
  {leave.cancelledAt && <span>Cancelled: {formatDateTime(leave.cancelledAt)}</span>}
</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openLeaveDetail(leave._id)}
                            className="gap-1.5 h-8 text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          {leave.status === 'pending' || leave.status ==='approved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelLeave(leave._id);
                              }}
                              className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
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
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  {selectedLeave.subject}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {formatRange(selectedLeave)} • {selectedLeave.leaveType} • {statusLabel(selectedLeave.status)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn('gap-1.5 text-sm px-3 py-1', LEAVE_STATUS_STYLES[selectedLeave.status])}>
                    {LEAVE_STATUS_ICONS[selectedLeave.status]}
                    {statusLabel(selectedLeave.status)}
                  </Badge>
                  {leaveTypeBadge(selectedLeave.leaveType)}
                  {selectedLeave.approvedBy && (
  <Badge variant="outline" className="text-xs">
    <User className="h-3 w-3 mr-1" />
    {selectedLeave.status === 'rejected' ? 'Rejected by' : 'Approved by'} {selectedLeave.approvedBy.name}
  </Badge>
)}
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <p className="text-xs font-medium text-slate-500 mb-2">Reason</p>
                  <RichTextDisplay content={selectedLeave.reason} />
                </div>

                {(selectedLeave.approvalReason || selectedLeave.cancelReason) && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                    <p className="text-xs font-medium text-amber-700 mb-2">
                      {selectedLeave.approvalReason ? 'Approval Note' : 'Cancellation Reason'}
                    </p>
                    <p className="text-sm text-amber-800 whitespace-pre-wrap">
                      {selectedLeave.approvalReason || selectedLeave.cancelReason}
                    </p>
                  </div>
                )}

               <div className="grid grid-cols-2 gap-3 text-sm">
  <div className="rounded-lg bg-slate-50 p-3">
    <p className="text-xs text-muted-foreground">Applied At</p>
    <p className="font-medium">{formatDateTime(selectedLeave.createdAt)}</p>
  </div>
  {selectedLeave.approvedAt && (
    <div className={`rounded-lg p-3 ${selectedLeave.status === 'rejected' ? 'bg-red-50' : 'bg-emerald-50'}`}>
      <p className={`text-xs ${selectedLeave.status === 'rejected' ? 'text-red-600' : 'text-emerald-600'}`}>
        {selectedLeave.status === 'rejected' ? 'Rejected' : 'Approved'}
      </p>
      <p className="font-medium">{formatDateTime(selectedLeave.approvedAt)}</p>
    </div>
  )}
  {selectedLeave.cancelledAt && (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-muted-foreground">Cancelled</p>
      <p className="font-medium">{formatDateTime(selectedLeave.cancelledAt)}</p>
    </div>
  )}
  <div className="rounded-lg bg-slate-50 p-3">
    <p className="text-xs text-muted-foreground">Days</p>
    <p className="font-medium">{countDays(selectedLeave)} day{countDays(selectedLeave) > 1 ? 's' : ''}</p>
  </div>
  <div className="rounded-lg bg-slate-50 p-3">
    <p className="text-xs text-muted-foreground">Type</p>
    <p className="font-medium">{selectedLeave.leaveType}</p>
  </div>
</div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)} size="sm">
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}