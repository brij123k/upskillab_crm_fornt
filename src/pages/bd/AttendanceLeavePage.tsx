// EmployeeAttendanceLeavePage.tsx
import { useEffect, useMemo, useState } from 'react';
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
  AlertTriangle,
  Edit3,
  Send,
  Info
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
  status: 'present' | 'absent' | 'half_day' | 'week_off' | 'logged_in' | 'holiday';
  date: string;
  reason?: string;
  kraResult?: {
    source?: 'holiday' | 'leave';
    holidayId?: string;
    holidayName?: string;
    holidayDescription?: string;
    leaveId?: string;
    leaveType?: string;
    leaveStatus?: string;
    roleId?: string;
    userId?: string;
    status?: string;
    appliedCriteria?: string;
    metrics?: {
      dialCalls: number;
      answeredCalls: number;
      talkTime: number;
      bookings: number;
      demoConducts: number;
    };
    thresholds?: {
      answeredCalls: number;
      talkTime: number;
      dialCalls: number;
      bookings: number;
      demoConducts: number;
    };
    reason?: string;
    startDate?: string;
    endDate?: string;
  } | null;
  attendanceRequest?: {
    _id: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedStatus: string;
    requestReason: string;
    requestedBy: UserRef;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  statusChangeRemark?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;
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
  half_day: 'bg-orange-100 text-orange-800 border-orange-200',
  week_off: 'bg-blue-100 text-blue-800 border-blue-200',
  holiday: 'bg-purple-100 text-purple-800 border-purple-200',
  logged_in: 'bg-cyan-100 text-cyan-800 border-cyan-200',
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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

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

// Helper to check if a date has an attendance request
const hasAttendanceRequest = (record: AttendanceRecord | null) => {
  return record?.attendanceRequest && record.attendanceRequest.status === 'pending';
};

export function EmployeeAttendanceLeavePage() {
  const currentUser = getUser();
  const currentUserId = currentUser?._id || currentUser?.id || currentUser?.userId || '';

  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [seniors, setSeniors] = useState<SeniorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [recheckOpen, setRecheckOpen] = useState(false);
  const [recheckReason, setRecheckReason] = useState('');
  const [recheckSubmitting, setRecheckSubmitting] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const [leaveDetailOpen, setLeaveDetailOpen] = useState(false);
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

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Fetch attendance for current month
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const query: any = {};
      if (currentMonth !== new Date().getMonth() || currentYear !== new Date().getFullYear()) {
        query.month = currentMonth + 1;
        query.year = currentYear;
      }
      
      const response = await getDataHandlerWithToken(
        ApiConfig.myattendence,
        query,
        null,
        true
      );
        console.log("response",response)
      const data = Array.isArray(response) ? response : response?.data || [];
      setAttendance(data);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch leaves
  const fetchLeaves = async () => {
    try {
      const response = await getDataHandlerWithToken(
        ApiConfig.getLeaves,
        { ...filters, userId: currentUserId },
        null,
        true
      );
      const data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setLeaves(data.sort((a: LeaveRecord, b: LeaveRecord) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
      toast.error('Failed to load leave data');
    }
  };

  // Fetch leave balance
  const fetchLeaveBalance = async () => {
    try {
      const response = await getDataHandlerWithToken(ApiConfig.getMyLeaveSummary, null, null, true);
      const data = response?.data || response || null;
      setLeaveBalance(data);
    } catch (error) {
      console.error('Failed to fetch leave balance:', error);
    }
  };

  // Fetch seniors
  const fetchSeniors = async () => {
    try {
      const response = await getDataHandlerWithToken(ApiConfig.getMySeniors, null, null, true);
      const data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setSeniors(data);
    } catch (error) {
      console.error('Failed to fetch seniors:', error);
    }
  };

  const fetchAllData = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchAttendance(),
      fetchLeaves(),
      fetchLeaveBalance(),
      fetchSeniors(),
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [currentDate, filters]);

  // Navigation functions
  const navigatePrevious = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const navigateNext = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Get attendance for a specific date
  const getAttendanceForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const records = attendance.filter(record => {
      const recordDate = new Date(record.date);
      const recordDateStr = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}-${String(recordDate.getDate()).padStart(2, '0')}`;
      return recordDateStr === dateStr;
    });

    // Sort by priority
    const priority = { present: 0, half_day: 1, absent: 2, week_off: 3, holiday: 4, logged_in: 5 };
    records.sort((a, b) => (priority[a.status as keyof typeof priority] || 99) - (priority[b.status as keyof typeof priority] || 99));
    
    return records.length > 0 ? records[0] : null;
  };

  // Handle date click
  const handleDateClick = (day: number | null) => {
    if (!day) return;
    const record = getAttendanceForDate(day);
    if (record) {
      setSelectedRecord(record);
      setDetailOpen(true);
    }
  };

  // Handle recheck request
  const handleRecheckRequest = async () => {
    if (!selectedRecord || !recheckReason.trim()) {
      toast.error('Please provide a reason for recheck');
      return;
    }

    try {
      setRecheckSubmitting(true);
      const payload = {
        requestedStatus: 'present',
        requestReason: recheckReason
      };
      const endpoint = ApiConfig.attendenceRecheck(selectedRecord._id);
      const response = await postDataHandlerWithToken(endpoint, payload, true);

      if (response) {
        toast.success('Recheck request submitted successfully');
        setRecheckOpen(false);
        setRecheckReason('');
        setSelectedRecord(null);
        await fetchAttendance();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to submit recheck request');
    } finally {
      setRecheckSubmitting(false);
    }
  };

  // Leave functions
  const openLeaveDetail = async (id: string) => {
    const cached = leaves.find((item) => item._id === id);
    if (cached) {
      setSelectedLeave(cached);
      setLeaveDetailOpen(true);
      return;
    }

    const response = await getDataHandlerWithToken(ApiConfig.getMyLeaveById(id), null, null, true);
    const data = response?.data || response;
    if (data) {
      setSelectedLeave(data);
      setLeaveDetailOpen(true);
    }
  };

  const cancelLeave = async (id: string) => {
    try {
      await patchTokenDataHandler(ApiConfig.cancelMyLeave(id), null, true);
      toast.success('Leave cancelled successfully');
      await fetchLeaves();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to cancel leave');
    }
  };

  const handleCreateLeave = async () => {
    if (!form.subject || !form.leaveFrom || !form.reason || !form.reportToUserId) {
      toast.error('Please fill all required fields');
      return;
    }

    if (form.leaveType === 'CL' && (leaveBalance?.availableCL ?? 0) <= 0) {
      toast.error('No CL leave remaining');
      return;
    }

    if (form.leaveType === 'EL' && (leaveBalance?.availableEL ?? 0) <= 0) {
      toast.error('No EL leave remaining');
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
      setForm({
        leaveType: 'CL',
        subject: '',
        leaveFrom: '',
        leaveTo: '',
        reason: '',
        reportToUserId: seniors[0]?._id || '',
      });
      await fetchLeaves();
      await fetchLeaveBalance();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to submit leave');
    } finally {
      setSaving(false);
    }
  };

  // Computed values
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

  // Generate calendar days
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  // Get status color for calendar
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-emerald-100 border-emerald-300 text-emerald-700';
      case 'absent':
        return 'bg-red-100 border-red-300 text-red-700';
      case 'half_day':
        return 'bg-orange-100 border-orange-300 text-orange-700';
      case 'week_off':
        return 'bg-blue-100 border-blue-300 text-blue-700';
      case 'holiday':
        return 'bg-purple-100 border-purple-300 text-purple-700';
      case 'logged_in':
        return 'bg-cyan-100 border-cyan-300 text-cyan-700';
      default:
        return 'bg-slate-100 border-slate-300 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      case 'half_day':
        return 'Half Day';
      case 'week_off':
        return 'Week Off';
      case 'holiday':
        return 'Holiday';
      case 'logged_in':
        return 'Logged In';
      default:
        return status;
    }
  };

  // Render calendar
  const renderCalendar = () => {
    const days = generateCalendarDays();
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-primary" />
                Attendance Calendar
              </CardTitle>
              <CardDescription className="text-xs">
                {MONTHS[currentMonth]} {currentYear} • Click on a date to view details
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={navigatePrevious} className="h-8 text-xs px-3">
                <ChevronDown className="h-3.5 w-3.5 rotate-90" />
              </Button>
              <span className="min-w-[100px] text-center text-sm font-medium">
                {MONTHS[currentMonth]} {currentYear}
              </span>
              <Button variant="outline" size="sm" onClick={navigateNext} className="h-8 text-xs px-3">
                <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
              </Button>
              <Button variant="outline" size="sm" onClick={navigateToday} className="h-8 text-xs px-3">
                Today
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map(day => (
              <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                {day}
              </div>
            ))}
            {weeks.map((week, weekIndex) => (
              week.map((day, dayIndex) => {
                const record = day ? getAttendanceForDate(day) : null;
                const isToday = day === new Date().getDate() && 
                               currentMonth === new Date().getMonth() && 
                               currentYear === new Date().getFullYear();
                const hasRequest = record ? hasAttendanceRequest(record) : false;

                return (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      "relative rounded-lg p-2 cursor-pointer transition-all duration-200 min-h-[60px]",
                      "hover:scale-[1.02] hover:shadow-md",
                      day === null && "hover:bg-transparent cursor-default",
                      record && getStatusColor(record.status),
                      isToday && "ring-2 ring-orange-500 ring-offset-1",
                      !record && day !== null && "hover:bg-slate-50 border border-dashed border-slate-200"
                    )}
                  >
                    {day !== null && (
                      <>
                        <div className={cn(
                          "text-sm font-medium",
                          record ? "text-inherit" : "text-slate-400"
                        )}>
                          {day}
                        </div>
                        {record && (
                          <div className="mt-1">
                            <div className="text-[10px] font-medium truncate">
                              {getStatusLabel(record.status)}
                            </div>
                            {hasRequest && (
                              <div className="absolute top-1 right-1">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render attendance detail modal
  const renderDetailModal = () => {
    if (!selectedRecord) return null;

    const isPast = new Date(selectedRecord.date) < new Date();
    const canRecheck = isPast && selectedRecord.status !== 'present' && selectedRecord.status !== 'week_off' && selectedRecord.status !== 'holiday';
    const hasRequest = hasAttendanceRequest(selectedRecord);

    return (
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800 flex items-center gap-2">
              <Eye className="h-5 w-5 text-orange-500" />
              Attendance Details
            </DialogTitle>
            <DialogDescription>
              {formatDate(selectedRecord.date)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {/* Basic Info */}
            <div className="bg-slate-50 p-4 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Status</p>
                  <div className="mt-1">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg",
                      ATTENDANCE_STATUS_STYLES[selectedRecord.status] || 'bg-slate-100 text-slate-800'
                    )}>
                      {getStatusLabel(selectedRecord.status)}
                    </span>
                  </div>
                </div>
               
                {selectedRecord.logoutTime && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Logout Time</p>
                    <p className="mt-1 text-slate-700">
                      {formatTime(selectedRecord.logoutTime)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Request Status */}
            {hasRequest && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">Recheck Request Submitted</p>
                    <p className="text-xs text-amber-700 mt-1">
                      <span className="font-semibold">Status:</span> {selectedRecord.attendanceRequest?.status}
                    </p>
                    <p className="text-xs text-amber-700">
                      <span className="font-semibold">Requested Status:</span> {selectedRecord.attendanceRequest?.requestedStatus}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      <span className="font-semibold">Reason:</span> {selectedRecord.attendanceRequest?.requestReason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Reason */}
            {selectedRecord.reason && (
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Reason</p>
                <div className="mt-1 bg-slate-50 p-3 rounded-xl text-sm text-slate-700">
                  {selectedRecord.reason}
                </div>
              </div>
            )}

            {/* KRA Result */}
            {selectedRecord.kraResult && (
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold mb-3">
                  {selectedRecord.kraResult.source === 'holiday' ? 'Holiday Details' : 
                   selectedRecord.kraResult.source === 'leave' ? 'Leave Details' : 
                   'KRA Performance'}
                </p>
                <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                  
                  {/* Holiday Source */}
                  {selectedRecord.kraResult.source === 'holiday' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-500">Holiday Name</p>
                          <p className="text-sm font-medium text-slate-700">
                            {selectedRecord.kraResult.holidayName || 'N/A'}
                          </p>
                        </div>
                         {selectedRecord.kraResult.holidayDescription && (
                        <div>
                          <p className="text-xs text-slate-500">Description</p>
                          <p className="text-sm text-slate-700">
                            {selectedRecord.kraResult.holidayDescription}
                          </p>
                        </div>
                      )}
                      </div>
                     
                    </div>
                  )}

                  {/* Leave Source */}
                  {selectedRecord.kraResult.source === 'leave' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-500">Leave Type</p>
                          <p className="text-sm font-medium text-slate-700">
                            {selectedRecord.kraResult.leaveType || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Leave Status</p>
                          <p className="text-sm font-medium text-slate-700">
                            {selectedRecord.kraResult.leaveStatus || 'N/A'}
                          </p>
                        </div>
                      </div>
                      {selectedRecord.kraResult.leaveId && (
                        <div>
                          <p className="text-xs text-slate-500">Leave ID</p>
                          <p className="text-sm text-slate-700">
                            {selectedRecord.kraResult.leaveId}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Regular KRA Result */}
                  {!selectedRecord.kraResult.source && selectedRecord.kraResult.status && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs text-slate-500">Status</p>
                          <p className="text-sm font-medium text-slate-700">
                            {selectedRecord.kraResult.status}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Applied Criteria</p>
                          <p className="text-sm font-medium text-slate-700">
                            {selectedRecord.kraResult.appliedCriteria}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500">Reason</p>
                          <p className="text-sm text-slate-700">
                            {selectedRecord.kraResult.reason}
                          </p>
                        </div>
                      </div>

                      {selectedRecord.kraResult.metrics && (
                        <div className="border-t border-slate-200 pt-3">
                          <p className="text-xs text-slate-500 font-semibold mb-2">Metrics</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            <div>
                              <p className="text-xs text-slate-400">Dial Calls</p>
                              <p className="text-sm font-medium text-slate-700">
                                {selectedRecord.kraResult.metrics.dialCalls}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400">Answered Calls</p>
                              <p className="text-sm font-medium text-slate-700">
                                {selectedRecord.kraResult.metrics.answeredCalls}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400">Talk Time (s)</p>
                              <p className="text-sm font-medium text-slate-700">
                                {selectedRecord.kraResult.metrics.talkTime}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400">Bookings</p>
                              <p className="text-sm font-medium text-slate-700">
                                {selectedRecord.kraResult.metrics.bookings}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400">Demo Conducts</p>
                              <p className="text-sm font-medium text-slate-700">
                                {selectedRecord.kraResult.metrics.demoConducts}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDetailOpen(false)}
              className="rounded-xl border-slate-200"
            >
              Close
            </Button>
            {canRecheck && !hasRequest && (
              <Button
                onClick={() => {
                  setDetailOpen(false);
                  setRecheckOpen(true);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Request Recheck
              </Button>
            )}
            {hasRequest && (
              <Button
                variant="outline"
                disabled
                className="rounded-xl border-amber-200 text-amber-600"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Request Pending
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Render recheck modal
  const renderRecheckModal = () => {
    return (
      <Dialog open={recheckOpen} onOpenChange={setRecheckOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800 flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-orange-500" />
              Request Attendance Recheck
            </DialogTitle>
            <DialogDescription>
              Request a recheck for your attendance on {selectedRecord ? formatDate(selectedRecord.date) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Current Status</Label>
              <div className="mt-1.5">
                <span className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg",
                  selectedRecord ? ATTENDANCE_STATUS_STYLES[selectedRecord.status] || 'bg-slate-100 text-slate-800' : ''
                )}>
                  {selectedRecord ? getStatusLabel(selectedRecord.status) : ''}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Reason for Recheck *</Label>
              <Textarea
                placeholder="Explain why your attendance should be rechecked..."
                value={recheckReason}
                onChange={(e) => setRecheckReason(e.target.value)}
                className="mt-1.5 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRecheckOpen(false);
                setRecheckReason('');
              }}
              className="rounded-xl border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecheckRequest}
              disabled={!recheckReason.trim() || recheckSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
            >
              {recheckSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Send className="h-4 w-4 mr-2" />
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Render leave detail modal
  const renderLeaveDetailModal = () => {
    if (!selectedLeave) return null;

    return (
      <Dialog open={leaveDetailOpen} onOpenChange={setLeaveDetailOpen}>
        <DialogContent className="max-w-2xl rounded-2xl">
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
              <Badge variant="outline" className={cn(
                'text-xs',
                selectedLeave.leaveType === 'CL' ? 'border-sky-200 text-sky-700 bg-sky-50' : 'border-violet-200 text-violet-700 bg-violet-50'
              )}>
                {selectedLeave.leaveType}
              </Badge>
              {selectedLeave.approvedBy && (
                <Badge variant="outline" className="text-xs">
                  <User className="h-3 w-3 mr-1" />
                  {selectedLeave.status === 'rejected' ? 'Rejected by' : 'Approved by'} {selectedLeave.approvedBy.name}
                </Badge>
              )}
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 mb-2">Reason</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedLeave.reason}</p>
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
            {selectedLeave.status === 'pending' && (
              <Button
                variant="outline"
                onClick={() => {
                  cancelLeave(selectedLeave._id);
                  setLeaveDetailOpen(false);
                }}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Leave
              </Button>
            )}
            <Button variant="outline" onClick={() => setLeaveDetailOpen(false)} size="sm">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Set default approver
  useEffect(() => {
    if (!form.reportToUserId && approverOptions.length) {
      setForm((prev) => ({ ...prev, reportToUserId: approverOptions[0].value }));
    }
  }, [approverOptions]);

  if (loading && !attendance.length) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
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
                <User className="h-4 w-4" />
                <span className="text-xs font-medium tracking-wider uppercase">My Dashboard</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">My Attendance & Leave</h1>
              <p className="mt-1 text-sm text-slate-300">Track your attendance, apply for leaves, and manage requests</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={fetchAllData} 
              disabled={refreshing} 
              className="gap-2 bg-white/10 text-white hover:bg-white/20 border-0"
            >
              <RefreshCw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Refresh
            </Button>
          </div>
        </div>
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
          {renderCalendar()}
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
                    <p className="mt-0.5 text-[11px] text-sky-600">Available</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-violet-50 to-violet-100/50 p-4 border border-violet-200">
                    <p className="text-xs font-medium text-violet-700">Earned Leave</p>
                    <p className="mt-1 text-2xl font-bold text-violet-800">{leaveStats.elRemaining}</p>
                    <p className="mt-0.5 text-[11px] text-violet-600">Available</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 border border-amber-200">
                    <p className="text-xs font-medium text-amber-700">Carried Forward</p>
                    <p className="mt-1 text-2xl font-bold text-amber-800">{leaveStats.carriedForward}</p>
                    <p className="mt-0.5 text-[11px] text-amber-600">EL from previous year</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 border border-emerald-200">
                    <p className="text-xs font-medium text-emerald-700">Encashed</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-800">{leaveStats.encashed}</p>
                    <p className="mt-0.5 text-[11px] text-emerald-600">EL encashed</p>
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
              </CardContent>
            </Card>
          </div>

          {/* Leave History */}
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
                      className="rounded-xl border border-slate-200 p-4 transition-all hover:shadow-md hover:border-slate-300 bg-white cursor-pointer"
                      onClick={() => openLeaveDetail(leave._id)}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={cn('gap-1.5 text-xs px-2.5 py-1', LEAVE_STATUS_STYLES[leave.status])}>
                              {LEAVE_STATUS_ICONS[leave.status]}
                              {statusLabel(leave.status)}
                            </Badge>
                            <Badge variant="outline" className={cn(
                              'text-xs',
                              leave.leaveType === 'CL' ? 'border-sky-200 text-sky-700 bg-sky-50' : 'border-violet-200 text-violet-700 bg-violet-50'
                            )}>
                              {leave.leaveType}
                            </Badge>
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
                            <span>Applied: {formatDateTime(leave.createdAt)}</span>
                            {leave.approvedBy && (
                              <span>
                                {leave.status === 'rejected' ? 'Rejected by' : 'Approved by'}: {leave.approvedBy.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLeaveDetail(leave._id);
                            }}
                            className="gap-1.5 h-8 text-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          {leave.status === 'pending' && (
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

      {/* Modals */}
      {renderDetailModal()}
      {renderRecheckModal()}
      {renderLeaveDetailModal()}
    </div>
  );
}