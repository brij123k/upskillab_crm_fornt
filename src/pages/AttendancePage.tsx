import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  CalendarDays,
  Clock,
  LogIn,
  LogOut,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  RefreshCw,
  Loader2,
  User,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';

// Types
interface User {
  _id: string;
  name: string;
  employeeId: number;
  email: string;
}

interface AttendanceRecord {
  _id: string;
  userId: User;
  loginTime: string;
  logoutTime?: string;
  workHours: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
  date: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

// Status configurations
const STATUS_CONFIG = {
  present: { label: 'Present', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  absent: { label: 'Absent', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  late: { label: 'Late', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertCircle },
  'half-day': { label: 'Half Day', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock }
};

export function AttendancePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('table');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  
  // Dynamic month filter
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filters, setFilters] = useState({
    status: 'all' as string,
    search: ''
  });

  // Fetch user info
  const fetchUserInfo = async () => {
    if (!userId) return;
    
    try {
      const response = await getDataHandlerWithToken(ApiConfig.getAllProfile, null, null, true);
      if (response && Array.isArray(response)) {
        const user = response.find((u: User) => u._id === userId);
        if (user) {
          setUserInfo(user);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  // Fetch attendance data
  const fetchAttendance = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await getDataHandlerWithToken(ApiConfig.getAttendanceByUserId(userId), null, null, true);
      
      if (response && Array.isArray(response)) {
        // Sort by date descending (newest first)
        const sorted = response.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setAttendance(sorted);
      } else {
        setAttendance([]);
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserInfo();
      fetchAttendance();
    }
  }, [userId]);

  // Filter attendance by selected month/year
  const filteredAttendance = useMemo(() => {
    let filtered = attendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === selectedDate.getMonth() && 
             recordDate.getFullYear() === selectedDate.getFullYear();
    });
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(record => record.status === filters.status);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(record => 
        record.userId?.name?.toLowerCase().includes(searchLower) ||
        record.userId?.email?.toLowerCase().includes(searchLower) ||
        record.status.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [attendance, selectedDate, filters]);

  // Calculate statistics
  const stats = useMemo(() => {
    const monthAttendance = attendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === selectedDate.getMonth() && 
             recordDate.getFullYear() === selectedDate.getFullYear();
    });
    
    const totalDays = monthAttendance.length;
    const presentDays = monthAttendance.filter(r => r.status === 'present').length;
    const absentDays = monthAttendance.filter(r => r.status === 'absent').length;
    const lateDays = monthAttendance.filter(r => r.status === 'late').length;
    const halfDays = monthAttendance.filter(r => r.status === 'half-day').length;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
    
    const totalWorkHours = monthAttendance.reduce((sum, record) => sum + (record.workHours || 0), 0);
    const avgWorkHours = totalDays > 0 ? totalWorkHours / totalDays : 0;
    
    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      halfDays,
      attendanceRate,
      totalWorkHours,
      avgWorkHours
    };
  }, [attendance, selectedDate]);

  // Calendar view data
  const calendarDays = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const record = attendance.find(a => isSameDay(new Date(a.date), day));
      return { date: day, record };
    });
  }, [attendance, selectedDate]);

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'hh:mm a');
  };

  const formatWorkHours = (hours: number) => {
    const hrs = Math.floor(hours);
    const mins = Math.round((hours - hrs) * 60);
    return `${hrs}h ${mins}m`;
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    const Icon = config?.icon || AlertCircle;
    return (
      <Badge className={cn("gap-1", config?.color)}>
        <Icon className="w-3 h-3" />
        {config?.label || status}
      </Badge>
    );
  };

  const handlePreviousMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleViewRecord = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setDetailsModalOpen(true);
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      search: ''
    });
  };

  // Available months for quick navigation
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    attendance.forEach(record => {
      const date = new Date(record.date);
      months.add(`${date.getFullYear()}-${date.getMonth()}`);
    });
    return Array.from(months).sort().reverse();
  }, [attendance]);

  const goToMonth = (year: number, month: number) => {
    setSelectedDate(new Date(year, month, 1));
  };

  if (loading && attendance.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <CalendarDays className="w-6 h-6" />
                Attendance Record
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Attendance history for {userInfo?.name || `User ${userId}`}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'calendar' ? 'table' : 'calendar')}
          >
            {viewMode === 'calendar' ? 'Table View' : 'Calendar View'}
          </Button>
        </div>

        {/* User Info Card */}
        {userInfo && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-semibold">{userInfo.name}</h2>
                    <Badge variant="secondary">
                      ID: {userInfo.employeeId}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {userInfo.email}
                  </p>
                </div>
                {/* <div className="text-right">
                  <div className="text-2xl font-bold">{stats.totalDays}</div>
                  <div className="text-xs text-muted-foreground">Total Days</div>
                </div> */}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-3">
              <div className="text-xs text-green-700 mb-1">Present</div>
              <div className="text-2xl font-bold text-green-700">{stats.presentDays}</div>
              <div className="text-xs text-green-600">{stats.totalDays} total</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-3">
              <div className="text-xs text-red-700 mb-1">Absent</div>
              <div className="text-2xl font-bold text-red-700">{stats.absentDays}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-3">
              <div className="text-xs text-yellow-700 mb-1">Late</div>
              <div className="text-2xl font-bold text-yellow-700">{stats.lateDays}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-3">
              <div className="text-xs text-orange-700 mb-1">Half Day</div>
              <div className="text-2xl font-bold text-orange-700">{stats.halfDays}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Attendance Rate</div>
              <div className="text-2xl font-bold">{stats.attendanceRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Total Hours</div>
              <div className="text-2xl font-bold">{formatWorkHours(stats.totalWorkHours)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Avg Hours/Day</div>
              <div className="text-2xl font-bold">{formatWorkHours(stats.avgWorkHours)}</div>
            </CardContent>
          </Card>
        </div> */}

        {/* Filters Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
                <RefreshCw className="w-3 h-3" />
                Reset Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              {/* Month Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousMonth}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium min-w-[140px] text-center">
                  {format(selectedDate, 'MMMM yyyy')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Month Dropdown for quick navigation */}
              {/* <Select
                value={`${selectedDate.getFullYear()}-${selectedDate.getMonth()}`}
                onValueChange={(value) => {
                  const [year, month] = value.split('-');
                  goToMonth(parseInt(year), parseInt(month));
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map(monthKey => {
                    const [year, month] = monthKey.split('-');
                    const date = new Date(parseInt(year), parseInt(month), 1);
                    return (
                      <SelectItem key={monthKey} value={monthKey}>
                        {format(date, 'MMMM yyyy')}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select> */}

              {/* Status Filter */}
              {/* <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="half-day">Half Day</SelectItem>
                </SelectContent>
              </Select> */}

              {/* Search */}
              {/* <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search by name, email, or status..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div> */}
            </div>
          </CardContent>
        </Card>

        {/* Content Area */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading attendance data...</p>
            </CardContent>
          </Card>
        ) : viewMode === 'calendar' ? (
          // Calendar View
          <Card>
            <CardContent className="pt-6">
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-7 bg-muted border-b">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-3 text-center text-sm font-medium">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarDays.map(({ date, record }, index) => {
                    const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
                    const status = record?.status;
                    
                    return (
                      <div
                        key={index}
                        className={cn(
                          "min-h-[100px] p-2 border-b border-r",
                          !isCurrentMonth && "bg-gray-50",
                          record && "cursor-pointer hover:bg-muted/50 transition-colors"
                        )}
                        onClick={() => record && handleViewRecord(record)}
                      >
                        <div className={cn(
                          "text-sm mb-2",
                          !isCurrentMonth && "text-muted-foreground"
                        )}>
                          {format(date, 'd')}
                        </div>
                        {status && (
                          <div className="flex flex-col items-center gap-1">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              status === 'present' && "bg-green-100",
                              status === 'absent' && "bg-red-100",
                              status === 'late' && "bg-yellow-100",
                              status === 'half-day' && "bg-orange-100"
                            )}>
                              {status === 'present' && <CheckCircle className="w-4 h-4 text-green-600" />}
                              {status === 'absent' && <XCircle className="w-4 h-4 text-red-600" />}
                              {status === 'late' && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                              {status === 'half-day' && <Clock className="w-4 h-4 text-orange-600" />}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {STATUS_CONFIG[status]?.label || status}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Table View
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Login Time</TableHead>
                      <TableHead>Logout Time</TableHead>
                      <TableHead>Work Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                          <p className="text-muted-foreground">
                            No attendance records found for {format(selectedDate, 'MMMM yyyy')}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAttendance.map((record) => (
                        <TableRow key={record._id}>
                          <TableCell>
                            <div className="font-medium">{formatDate(record.date)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <LogIn className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm">{formatTime(record.loginTime)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {record.logoutTime ? (
                              <div className="flex items-center gap-1">
                                <LogOut className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm">{formatTime(record.logoutTime)}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {record.workHours > 0 ? formatWorkHours(record.workHours) : '—'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(record.status)}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm line-clamp-1 max-w-[200px]">
                              {record.reason || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewRecord(record)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Summary */}
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs">Present</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs">Absent</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-xs">Late</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-xs">Half Day</span>
                </div>
              </div>
              <div className="text-muted-foreground">
                Showing {filteredAttendance.length} of {stats.totalDays} records for {format(selectedDate, 'MMMM yyyy')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-lg">
          {selectedRecord && (
            <>
              <DialogHeader>
                <DialogTitle>Attendance Details</DialogTitle>
                <DialogDescription>
                  Detailed attendance record for {formatDate(selectedRecord.date)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div>{getStatusBadge(selectedRecord.status)}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <p className="text-sm font-medium">{formatDate(selectedRecord.date)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Login Time</Label>
                    <div className="flex items-center gap-2">
                      <LogIn className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{formatTime(selectedRecord.loginTime)}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Logout Time</Label>
                    <div className="flex items-center gap-2">
                      <LogOut className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {selectedRecord.logoutTime ? formatTime(selectedRecord.logoutTime) : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Work Hours</Label>
                    <p className="text-sm font-medium">
                      {selectedRecord.workHours > 0 ? formatWorkHours(selectedRecord.workHours) : '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Employee</Label>
                    <p className="text-sm font-medium">{selectedRecord.userId?.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {selectedRecord.userId?.employeeId}</p>
                  </div>
                </div>

                {selectedRecord.reason && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Reason / Notes</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{selectedRecord.reason}</p>
                    </div>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>
                      <span>Created:</span>
                      <p>{formatDateTime(selectedRecord.createdAt)}</p>
                    </div>
                    <div>
                      <span>Last Updated:</span>
                      <p>{formatDateTime(selectedRecord.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
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