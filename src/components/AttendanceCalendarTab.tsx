// AttendanceCalendarTab.tsx - Compact Version
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight,RefreshCw } from 'lucide-react';
import { eachDayOfInterval, startOfMonth, endOfMonth, format, isSameMonth, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

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
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
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
        attendanceMap[date] = {
          status: att.status || 'present',
          type: 'attendance',
        };
      }
    });

    leaves.forEach((leave: any) => {
      if (leave.userId === userId || leave.userId?._id === userId) {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        days.forEach((day) => {
          const date = format(day, 'yyyy-MM-dd');
          attendanceMap[date] = {
            status: 'leave',
            type: 'leave',
          };
        });
      }
    });

    return attendanceMap;
  }, [selectedEmployee, employees, attendance, leaves]);

  const getStatusColor = (status: string, type: string) => {
    if (type === 'leave') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (status === 'present') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'absent') return 'bg-red-100 text-red-800 border-red-200';
    if (status === 'half-day') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status: string, type: string) => {
    if (type === 'leave') return 'Leave';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const prevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
  };

  const selectedEmployeeData = employees.find((e) => e._id === selectedEmployee);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Employee Attendance Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1 min-w-48">
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp._id} value={emp._id} className="text-xs">
                      {emp.name || emp.userName || 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={onRefresh} disabled={fetching} variant="outline" size="sm" className="h-8 text-xs">
              <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', fetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>

          {selectedEmployee && selectedEmployeeData && (
            <div className="space-y-4">
              {/* Employee Info - Compact */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-semibold text-foreground">
                  {selectedEmployeeData.name || selectedEmployeeData.userName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Department: {selectedEmployeeData.departmentId?.name || 'N/A'}
                </p>
              </div>

              {/* Month Navigation - Compact */}
              <div className="flex items-center justify-between gap-3">
                <Button variant="outline" size="sm" onClick={prevMonth} className="h-7 w-7 p-0">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <h3 className="text-sm font-semibold min-w-28 text-center">
                  {format(selectedMonth, 'MMMM yyyy')}
                </h3>
                <Button variant="outline" size="sm" onClick={nextMonth} className="h-7 w-7 p-0">
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Calendar Grid - Compact */}
              <div className="grid grid-cols-7 gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                  <div key={day} className="text-center font-semibold text-xs py-1">
                    {day}
                  </div>
                ))}

                {monthDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayAttendance = employeeAttendance[dateStr];
                  const isCurrentMonth = isSameMonth(day, selectedMonth);
                  const isTodayDate = isToday(day);

                  return (
                    <div
                      key={dateStr}
                      className={cn(
                        'aspect-square flex flex-col items-center justify-center rounded-md border p-0.5',
                        !isCurrentMonth && 'opacity-30 bg-muted/20',
                        isTodayDate && 'ring-1 ring-primary'
                      )}
                    >
                      <span className={cn('text-xs font-medium', isTodayDate && 'text-primary')}>
                        {format(day, 'd')}
                      </span>
                      {dayAttendance && (
                        <Badge 
                          variant="outline" 
                          className={cn('text-[10px] mt-0.5 px-1 py-0 h-4', getStatusColor(dayAttendance.status, dayAttendance.type))}
                        >
                          {getStatusLabel(dayAttendance.status, dayAttendance.type)}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend - Compact */}
              <div className="flex flex-wrap gap-3 text-xs pt-2 border-t">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-green-100 rounded border border-green-300"></div>
                  <span className="text-[11px]">Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-red-100 rounded border border-red-300"></div>
                  <span className="text-[11px]">Absent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-yellow-100 rounded border border-yellow-300"></div>
                  <span className="text-[11px]">Half Day</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-orange-100 rounded border border-orange-300"></div>
                  <span className="text-[11px]">Leave</span>
                </div>
              </div>
            </div>
          )}

          {!selectedEmployee && (
            <div className="text-center py-8">
              <p className="text-xs text-muted-foreground">Select an employee to view their attendance calendar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}