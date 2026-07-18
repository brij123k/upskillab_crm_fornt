import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RefreshCw, Calendar, User, Users } from 'lucide-react';
import { 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  format, 
  isSameMonth, 
  isToday,
  getDay,
  startOfWeek,
  endOfWeek,
  addDays
} from 'date-fns';
import { cn } from '@/lib/utils';

export enum AttendanceStatus {
  PRESENT = 'present',
  LOGGEDIN = 'logged_in',
  HALF_DAY = 'half_day',
  ABSENT = 'absent',
  LEAVE = 'leave',
  WEEK_OFF = 'week_off',
  HOLIDAY = 'holiday',
  OTHER = 'other',
}

type Props = {
  employees: any[];
  attendance: any[];
  leaves: any[];
  onRefresh: () => Promise<void>;
  fetching: boolean;
};

export function AttendanceCalendarTab({ employees, attendance, leaves, onRefresh, fetching }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(selectedMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(selectedMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [selectedMonth]);

  const employeeAttendance = useMemo(() => {
    if (!selectedEmployee) return {};
    const emp = employees.find((e) => e._id === selectedEmployee);
    if (!emp) return {};
    const attendanceMap: Record<string, { status: string; type: string }> = {};
    const userId = emp.userId || emp._id;

    attendance.forEach((att: any) => {
      if (att.userId === userId || att.userId?._id === userId) {
        const date = format(new Date(att.date || att.createdAt), 'yyyy-MM-dd');
        attendanceMap[date] = { status: att.status || AttendanceStatus.PRESENT, type: 'attendance' };
      }
    });

    leaves.forEach((leave: any) => {
      if (leave.userId === userId || leave.userId?._id === userId) {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        days.forEach((day) => {
          const date = format(day, 'yyyy-MM-dd');
          attendanceMap[date] = { status: AttendanceStatus.LEAVE, type: 'leave' };
        });
      }
    });

    return attendanceMap;
  }, [selectedEmployee, employees, attendance, leaves]);

  const getStatusConfig = (status: string, type: string) => {
    // Leave takes precedence over attendance status
    if (type === 'leave') {
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        label: 'Leave',
        dot: 'bg-purple-500',
        icon: '📅'
      };
    }

    switch (status) {
      case AttendanceStatus.PRESENT:
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          label: 'Present',
          dot: 'bg-emerald-500',
          icon: '✅'
        };
      case AttendanceStatus.LOGGEDIN:
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          label: 'Logged In',
          dot: 'bg-blue-500',
          icon: '🟢'
        };
      case AttendanceStatus.HALF_DAY:
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          label: 'Half Day',
          dot: 'bg-amber-500',
          icon: '🌓'
        };
      case AttendanceStatus.ABSENT:
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-700',
          border: 'border-rose-200',
          label: 'Absent',
          dot: 'bg-rose-500',
          icon: '❌'
        };
      case AttendanceStatus.WEEK_OFF:
        return {
          bg: 'bg-indigo-50',
          text: 'text-indigo-700',
          border: 'border-indigo-200',
          label: 'Week Off',
          dot: 'bg-indigo-500',
          icon: '🏖️'
        };
      case AttendanceStatus.HOLIDAY:
        return {
          bg: 'bg-pink-50',
          text: 'text-pink-700',
          border: 'border-pink-200',
          label: 'Holiday',
          dot: 'bg-pink-500',
          icon: '🎉'
        };
      case AttendanceStatus.OTHER:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          label: 'Other',
          dot: 'bg-gray-500',
          icon: '📌'
        };
      default:
        return {
          bg: 'bg-slate-50',
          text: 'text-slate-700',
          border: 'border-slate-200',
          label: 'Unknown',
          dot: 'bg-slate-400',
          icon: '❓'
        };
    }
  };

  const prevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
  };

  const selectedEmployeeData = employees.find((e) => e._id === selectedEmployee);
  const totalDays = monthDays.filter(d => isSameMonth(d, selectedMonth)).length;
  
  // Calculate stats based on all statuses
  const presentDays = Object.values(employeeAttendance).filter(a => 
    a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LOGGEDIN
  ).length;
  const absentDays = Object.values(employeeAttendance).filter(a => 
    a.status === AttendanceStatus.ABSENT
  ).length;
  const leaveDays = Object.values(employeeAttendance).filter(a => 
    a.type === 'leave' || a.status === AttendanceStatus.LEAVE
  ).length;
  const halfDays = Object.values(employeeAttendance).filter(a => 
    a.status === AttendanceStatus.HALF_DAY
  ).length;
  const weekOffDays = Object.values(employeeAttendance).filter(a => 
    a.status === AttendanceStatus.WEEK_OFF
  ).length;
  const holidayDays = Object.values(employeeAttendance).filter(a => 
    a.status === AttendanceStatus.HOLIDAY
  ).length;

  // Get all unique statuses present in the data for dynamic legend
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    Object.values(employeeAttendance).forEach(a => {
      if (a.type === 'leave') {
        statuses.add('Leave');
      } else if (a.status) {
        const config = getStatusConfig(a.status, 'attendance');
        statuses.add(config.label);
      }
    });
    return Array.from(statuses);
  }, [employeeAttendance]);

  return (
    <Card className="bg-white border-0 shadow-md overflow-hidden">
      {/* Header with gradient accent */}
      <div className="relative px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-600" />
            <h2 className="font-semibold text-sm text-slate-800 tracking-tight">Attendance Overview</h2>
          </div>
          <Button
            onClick={onRefresh}
            disabled={fetching}
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', fetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Employee select with icon */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <label className="text-[11px] font-medium text-slate-600 uppercase tracking-wider">Select Employee</label>
          </div>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-full rounded-lg border-slate-200 bg-slate-50/50 h-9 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
              <SelectValue placeholder="Choose employee to view calendar" />
            </SelectTrigger>
            <SelectContent>
              {employees.filter(user => user.status === "active").map((emp) => (
                <SelectItem key={emp._id} value={emp._id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                      <span className="text-[10px] font-medium text-slate-600">
                        {emp.name?.[0] || emp.userName?.[0] || '?'}
                      </span>
                    </div>
                    <span>{emp.name || emp.userName || 'Unknown'}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedEmployee && selectedEmployeeData ? (
          <div className="space-y-4">
            {/* Employee info card */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-lg p-3.5 border border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <p className="text-sm font-semibold text-slate-800">
                      {selectedEmployeeData.name || selectedEmployeeData.userName}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 ml-5.5">
                    {selectedEmployeeData.departmentId?.name || 'No Department'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">ID</p>
                  <p className="text-xs font-mono text-slate-700">{selectedEmployeeData.employeeId || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Stats row - now with 6 columns for all statuses */}
            <div className="grid grid-cols-6 gap-1.5">
              <div className="bg-emerald-50 rounded-lg p-1.5 text-center border border-emerald-100/50">
                <p className="text-base font-bold text-emerald-700">{presentDays}</p>
                <p className="text-[8px] font-medium text-emerald-600 uppercase tracking-wider">Present</p>
              </div>
              <div className="bg-rose-50 rounded-lg p-1.5 text-center border border-rose-100/50">
                <p className="text-base font-bold text-rose-700">{absentDays}</p>
                <p className="text-[8px] font-medium text-rose-600 uppercase tracking-wider">Absent</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-1.5 text-center border border-amber-100/50">
                <p className="text-base font-bold text-amber-700">{halfDays}</p>
                <p className="text-[8px] font-medium text-amber-600 uppercase tracking-wider">Half Day</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-1.5 text-center border border-purple-100/50">
                <p className="text-base font-bold text-purple-700">{leaveDays}</p>
                <p className="text-[8px] font-medium text-purple-600 uppercase tracking-wider">Leave</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-1.5 text-center border border-indigo-100/50">
                <p className="text-base font-bold text-indigo-700">{weekOffDays}</p>
                <p className="text-[8px] font-medium text-indigo-600 uppercase tracking-wider">Week Off</p>
              </div>
              <div className="bg-pink-50 rounded-lg p-1.5 text-center border border-pink-100/50">
                <p className="text-base font-bold text-pink-700">{holidayDays}</p>
                <p className="text-[8px] font-medium text-pink-600 uppercase tracking-wider">Holiday</p>
              </div>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between bg-slate-50/50 rounded-lg px-2 py-1.5">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={prevMonth} 
                className="h-7 w-7 p-0 rounded hover:bg-white"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <h3 className="text-sm font-semibold text-slate-800 tracking-tight">
                {format(selectedMonth, 'MMMM yyyy')}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={nextMonth} 
                className="h-7 w-7 p-0 rounded hover:bg-white"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Calendar grid */}
            <div>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-1">
                    {day.slice(0, 3)}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayAttendance = employeeAttendance[dateStr];
                  const isCurrentMonth = isSameMonth(day, selectedMonth);
                  const isTodayDate = isToday(day);
                  const statusConfig = dayAttendance ? getStatusConfig(dayAttendance.status, dayAttendance.type) : null;

                  return (
                    <div
                      key={dateStr}
                      className={cn(
                        'relative aspect-square rounded-lg transition-all duration-200',
                        !isCurrentMonth && 'opacity-20',
                        isCurrentMonth && 'hover:shadow-sm hover:border-slate-300',
                        isTodayDate && 'ring-2 ring-emerald-500 ring-offset-1',
                        isCurrentMonth && !isTodayDate && 'border border-transparent',
                        statusConfig && statusConfig.bg
                      )}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={cn(
                          'text-xs font-medium leading-none',
                          !isCurrentMonth && 'text-slate-400',
                          isCurrentMonth && 'text-slate-700',
                          isTodayDate && 'text-emerald-700 font-bold'
                        )}>
                          {format(day, 'd')}
                        </span>
                        {statusConfig && (
                          <div className="mt-1 flex items-center gap-1">
                            <div className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dot)} />
                            <span className={cn(
                              'text-[7px] font-semibold uppercase tracking-wider',
                              statusConfig.text
                            )}>
                              {statusConfig.label}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Legend */}
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
              {[
                { status: 'Present', color: 'bg-emerald-500' },
                { status: 'Logged In', color: 'bg-blue-500' },
                { status: 'Half Day', color: 'bg-amber-500' },
                { status: 'Absent', color: 'bg-rose-500' },
                { status: 'Leave', color: 'bg-purple-500' },
                { status: 'Week Off', color: 'bg-indigo-500' },
                { status: 'Holiday', color: 'bg-pink-500' },
                { status: 'Other', color: 'bg-gray-500' },
              ].map((item) => (
                <div key={item.status} className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded-full">
                  <div className={cn('w-1.5 h-1.5 rounded-full', item.color)} />
                  <span className="text-[8px] font-medium text-slate-600">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1">No Employee Selected</h3>
            <p className="text-xs text-slate-400">Choose an employee from the dropdown above to view their attendance calendar.</p>
          </div>
        )}
      </div>
    </Card>
  );
}