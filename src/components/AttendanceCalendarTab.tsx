// AttendanceCalendarTab.tsx - Updated with employee filtering, status filtering, and attendance management
import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  Eye,
  Edit2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar as CalendarIcon,
  Users,
  Building2,
  Phone,
  PhoneCall,
  BarChart3,
  Activity,
  TrendingUp,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getDataHandlerWithToken, patchTokenDataHandler } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';

interface AttendanceRecord {
  _id: string;
  userId: {
    _id: string;
    name: string;
    employeeId: number;
    email: string;
  };
  loginTime: string;
  workHours: number;
  status: 'present' | 'absent' | 'half_day' | 'week_off' | 'logged_in' | 'holiday';
  date: string;
  kraResult: {
    // Common fields
    source?: 'holiday' | 'leave';
    
    // Holiday specific fields
    holidayId?: string;
    holidayName?: string;
    holidayDescription?: string;
    
    // Leave specific fields
    leaveId?: string;
    leaveType?: string;
    leaveStatus?: string;
    
    // Regular KRA fields (present, half_day, absent)
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
  reason?: string;
  attendanceRequest: {
    _id: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedStatus: string;
    requestReason: string;
    requestedBy: {
      _id: string;
      name: string;
      employeeId: number;
      email: string;
    };
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  statusChangeRemark?: string;
  statusChangedAt?: string;
  statusChangedBy?: string;
}

interface Employee {
  _id: string;
  name: string;
  employeeId: number;
  email: string;
}

interface AttendanceCalendarTabProps {
  employees: Employee[];
  leaves?: any[];
  onRefresh?: () => void;
  fetching?: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper to format date
const formatDateDisplay = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper to format time
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper to format duration
const formatDuration = (hours: number) => {
  if (!hours && hours !== 0) return '--:--';
  const hrs = Math.floor(hours);
  const mins = Math.round((hours - hrs) * 60);
  return `${hrs}h ${mins}m`;
};

// Helper to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'present':
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'absent':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'half_day':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'week_off':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'holiday':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'logged_in':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};

// Helper to get status label
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

// Helper to get status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'present':
      return CheckCircle;
    case 'absent':
      return XCircle;
    case 'half_day':
      return Clock;
    case 'week_off':
      return CalendarIcon;
    case 'holiday':
      return CalendarIcon;
    case 'logged_in':
      return Activity;
    default:
      return Info;
  }
};

export function AttendanceCalendarTab({ 
  employees, 
  leaves = [],
  onRefresh,
  fetching 
}: AttendanceCalendarTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editRemark, setEditRemark] = useState('');
  const [editStatus, setEditStatus] = useState('');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Fetch attendance for selected employee and month
  const fetchAttendance = async () => {
    if (!selectedEmployee) {
      setAttendanceData([]);
      return;
    }

    try {
      setLoading(true);
      const query = {
        userId: selectedEmployee,
        month: currentMonth + 1,
        year: currentYear
      };
      const response = await getDataHandlerWithToken(
        ApiConfig.getAttendance,
        query,
        null,
        true
      );
      
      const data = Array.isArray(response) ? response : response?.data || [];
      setAttendanceData(data);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEmployee) {
      fetchAttendance();
    }
  }, [selectedEmployee, currentMonth, currentYear]);

  // Get attendance for a specific date
  const getAttendanceForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const records = attendanceData.filter(record => {
      const recordDate = new Date(record.date);
      const recordDateStr = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}-${String(recordDate.getDate()).padStart(2, '0')}`;
      return recordDateStr === dateStr;
    });

    // Sort by priority: present > half_day > absent > week_off > logged_in
    const priority = { present: 0, half_day: 1, absent: 2, week_off: 3, holiday: 4, logged_in: 5 };
    records.sort((a, b) => (priority[a.status as keyof typeof priority] || 99) - (priority[b.status as keyof typeof priority] || 99));
    
    return records.length > 0 ? records[0] : null;
  };

  // Check if a date has attendance request
  const hasAttendanceRequest = (record: AttendanceRecord | null) => {
    return record?.attendanceRequest && record.attendanceRequest.status === 'pending';
  };

  // Get filtered attendance records for display
  const getFilteredRecords = () => {
    if (statusFilter === 'all') return attendanceData;
    return attendanceData.filter(record => record.status === statusFilter);
  };

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

  // Handle date click
  const handleDateClick = (day: number | null) => {
    if (!day || !selectedEmployee) return;
    const record = getAttendanceForDate(day);
    if (record) {
      setSelectedRecord(record);
      setEditRemark(record.reason || '');
      setEditStatus(record.status);
      setIsViewModalOpen(true);
    } else {
      toast({
        title: 'No Record',
        description: 'No attendance record found for this date',
      });
    }
  };

  // Handle mark as present
  const handleMarkAsPresent = async () => {
    if (!selectedRecord) return;

    try {
      setIsSubmitting(true);
      const endpoint = ApiConfig.changeattendenceStatus(selectedRecord._id);
      const payload = {
        status: 'present',
        remark: editRemark
      };
      const response = await patchTokenDataHandler(endpoint, payload, true);

      if (response) {
        toast({
          title: 'Success',
          description: 'Attendance status updated successfully',
        });
        setIsEditModalOpen(false);
        setIsViewModalOpen(false);
        setSelectedRecord(null);
        await fetchAttendance();
        if (onRefresh) onRefresh();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to update attendance',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit modal
  const openEditModal = () => {
    setIsViewModalOpen(false);
    setEditStatus(selectedRecord?.status || '');
    setEditRemark(selectedRecord?.reason || '');
    setIsEditModalOpen(true);
  };

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

  // Render monthly calendar
  const renderMonthlyCalendar = () => {
    const days = generateCalendarDays();
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <Card className="bg-white border-0 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS.map(day => (
            <div key={day} className="py-2 text-center text-xs font-medium text-slate-500 bg-slate-50">
              {day}
            </div>
          ))}
        </div>
        <div className="p-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-0.5">
              {week.map((day, dayIndex) => {
                const record = day ? getAttendanceForDate(day) : null;
                const hasRequest = record ? hasAttendanceRequest(record) : false;
                const isToday = day === new Date().getDate() && 
                               currentMonth === new Date().getMonth() && 
                               currentYear === new Date().getFullYear();

                return (
                  <div
                    key={dayIndex}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      "relative rounded-lg p-2 cursor-pointer transition-all duration-200 min-h-[60px]",
                      "hover:bg-slate-50 hover:scale-[1.02]",
                      day === null && "hover:bg-transparent cursor-default",
                      record && getStatusColor(record.status).split(' ')[1],
                      isToday && "ring-2 ring-orange-500 ring-offset-1",
                      !record && day !== null && "hover:bg-slate-50"
                    )}
                  >
                    {day !== null && (
                      <>
                        <div className={cn(
                          "text-sm font-medium",
                          record ? "text-slate-700" : "text-slate-400"
                        )}>
                          {day}
                        </div>
                        {record && (
                          <div className="mt-1 space-y-0.5">
                            <div className="text-[8px] font-medium text-slate-600 truncate">
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
              })}
            </div>
          ))}
        </div>
      </Card>
    );
  };

  // Render stats summary
  const renderStats = () => {
    const total = attendanceData.length;
    const present = attendanceData.filter(r => r.status === 'present').length;
    const absent = attendanceData.filter(r => r.status === 'absent').length;
    const halfDay = attendanceData.filter(r => r.status === 'half_day').length;
    const weekOff = attendanceData.filter(r => r.status === 'week_off').length;
    const pendingRequests = attendanceData.filter(r => r.attendanceRequest?.status === 'pending').length;

    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{total}</p>
            </div>
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-slate-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Present</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{present}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Absent</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{absent}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Half Day</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{halfDay}</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending Requests</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{pendingRequests}</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-1 min-w-[200px]">
            <SearchableDropdown
              options={employees.map(emp => ({
                value: emp._id,
                label: `${emp.name} (#${emp.employeeId})`
              }))}
              value={selectedEmployee}
              onValueChange={(value) => {
                setSelectedEmployee(value);
                setStatusFilter('all');
              }}
              placeholder="Select employee"
              className="mt-1"
            />
          </div>
          {/* <div className="w-[180px]">
            <Label className="text-xs font-semibold text-slate-500 uppercase">Status</Label>
            <Select 
              value={statusFilter} 
              onValueChange={setStatusFilter}
              disabled={!selectedEmployee}
            >
              <SelectTrigger className="mt-1 rounded-xl border-slate-200">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="half_day">Half Day</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="week_off">Week Off</SelectItem>
                <SelectItem value="logged_in">Logged In</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={navigatePrevious}
              className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-slate-700 min-w-[100px] text-center">
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateNext}
              className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToday}
            className="h-9 px-3 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
          >
            Today
          </Button>
          {selectedEmployee && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAttendance}
              disabled={loading}
              className="h-9 px-3 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {selectedEmployee && !loading && attendanceData.length > 0 && renderStats()}

      {/* Content */}
      {!selectedEmployee ? (
        <Card className="bg-white border-0 shadow-sm">
          <div className="flex flex-col items-center justify-center py-20">
            <Users className="w-12 h-12 text-slate-300" />
            <h3 className="mt-3 text-base font-medium text-slate-700">Select an Employee</h3>
            <p className="text-sm text-slate-400">Choose an employee to view their attendance</p>
          </div>
        </Card>
      ) : loading ? (
        <Card className="bg-white border-0 shadow-sm">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-400" />
            <p className="mt-3 text-slate-500">Loading attendance data...</p>
          </div>
        </Card>
      ) : attendanceData.length === 0 ? (
        <Card className="bg-white border-0 shadow-sm">
          <div className="flex flex-col items-center justify-center py-20">
            <CalendarIcon className="w-12 h-12 text-slate-300" />
            <h3 className="mt-3 text-base font-medium text-slate-700">No attendance records</h3>
            <p className="text-sm text-slate-400">No attendance data found for this period</p>
          </div>
        </Card>
      ) : (
        renderMonthlyCalendar()
      )}

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
  <DialogContent className="rounded-2xl max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-xl text-slate-800 flex items-center gap-2">
        <Eye className="h-5 w-5 text-orange-500" />
        Attendance Details
      </DialogTitle>
      <DialogDescription>
        {selectedRecord && formatDateDisplay(selectedRecord.date)}
      </DialogDescription>
    </DialogHeader>
    {selectedRecord && (
      <div className="space-y-5">
        {/* Basic Info */}
        <div className="bg-slate-50 p-4 rounded-xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Employee</p>
              <p className="mt-1 font-medium text-slate-800">
                {selectedRecord.userId?.name || 'Unknown'}
              </p>
              <p className="text-xs text-slate-500">
                #{selectedRecord.userId?.employeeId || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">Status</p>
              <div className="mt-1">
                <span className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg",
                  getStatusColor(selectedRecord.status)
                )}>
                  {(() => {
                    const Icon = getStatusIcon(selectedRecord.status);
                    return <Icon className="w-3.5 h-3.5" />;
                  })()}
                  {getStatusLabel(selectedRecord.status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Request */}
        {selectedRecord.attendanceRequest && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Attendance Request</p>
                <p className="text-xs text-amber-700 mt-1">
                  <span className="font-semibold">Status:</span> {selectedRecord.attendanceRequest.status}
                </p>
                <p className="text-xs text-amber-700">
                  <span className="font-semibold">Requested Status:</span> {selectedRecord.attendanceRequest.requestedStatus}
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  <span className="font-semibold">Reason:</span> {selectedRecord.attendanceRequest.requestReason}
                </p>
              </div>
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

              {/* Regular KRA Result (present, half_day, absent) */}
              {!selectedRecord.kraResult.source && (
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

        {selectedRecord.reason && !selectedRecord.kraResult && (
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Reason</p>
            <div className="mt-1 bg-slate-50 p-3 rounded-xl text-sm text-slate-700">
              {selectedRecord.reason}
            </div>
          </div>
        )}
      </div>
    )}
    <DialogFooter className="gap-2">
      <Button
        variant="outline"
        onClick={() => setIsViewModalOpen(false)}
        className="rounded-xl border-slate-200"
      >
        Close
      </Button>
      {selectedRecord && selectedRecord.status !== 'present' && selectedRecord.status !== 'holiday' && selectedRecord.status !== 'week_off' && (
        <Button
          onClick={openEditModal}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
        >
          <Edit2 className="h-4 w-4 mr-2" />
          Mark as Present
        </Button>
      )}
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Edit Attendance Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800">Mark as Present</DialogTitle>
            <DialogDescription>
              Update attendance status to present
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Current Status</Label>
              <div className="mt-1.5">
                <span className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg",
                  getStatusColor(editStatus)
                )}>
                  {getStatusLabel(editStatus)}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Remark</Label>
              <Textarea
                placeholder="Add a remark for this change..."
                value={editRemark}
                onChange={(e) => setEditRemark(e.target.value)}
                className="mt-1.5 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-xl border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkAsPresent}
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Present
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}