import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
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
        attendanceMap[date] = { status: att.status || 'present', type: 'attendance' };
      }
    });

    leaves.forEach((leave: any) => {
      if (leave.userId === userId || leave.userId?._id === userId) {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        days.forEach((day) => {
          const date = format(day, 'yyyy-MM-dd');
          attendanceMap[date] = { status: 'leave', type: 'leave' };
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
    <Card className="bg-white border-0 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800 text-sm">Attendance Calendar</h2>
        <Button
          onClick={onRefresh}
          disabled={fetching}
          variant="outline"
          size="sm"
          className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl h-7 text-xs px-2.5"
        >
          <RefreshCw className={cn('w-3.5 h-3.5 mr-1', fetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Employee select */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Employee</label>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="rounded-lg border-slate-200 h-8 text-xs">
              <SelectValue placeholder="Select employee" />
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

        {selectedEmployee && selectedEmployeeData && (
          <div className="space-y-3">
            {/* Employee info */}
            <div className="bg-slate-50 rounded-lg p-2.5">
              <p className="text-xs font-medium text-slate-800">
                {selectedEmployeeData.name || selectedEmployeeData.userName}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Dept: {selectedEmployeeData.departmentId?.name || 'N/A'}
              </p>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between gap-1">
              <Button variant="outline" size="sm" onClick={prevMonth} className="h-6 w-6 p-0 rounded border-slate-200">
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <h3 className="text-xs font-semibold text-slate-800">
                {format(selectedMonth, 'MMMM yyyy')}
              </h3>
              <Button variant="outline" size="sm" onClick={nextMonth} className="h-6 w-6 p-0 rounded border-slate-200">
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>

            {/* Calendar grid – ultra compact */}
            <div className="grid grid-cols-7 gap-0.5">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <div key={day} className="text-center text-[10px] font-semibold text-slate-500 py-0.5">
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
                      'aspect-square flex flex-col items-center justify-center rounded border p-0.5',
                      !isCurrentMonth && 'opacity-30 bg-slate-100',
                      isTodayDate && 'ring-1 ring-orange-400'
                    )}
                  >
                    <span className={cn('text-[10px] font-medium leading-none', isTodayDate && 'text-orange-600')}>
                      {format(day, 'd')}
                    </span>
                    {dayAttendance && (
                      <span
                        className={cn(
                          'text-[8px] mt-0.5 px-1 py-0 rounded-full font-medium leading-tight',
                          getStatusColor(dayAttendance.status, dayAttendance.type)
                        )}
                      >
                        {getStatusLabel(dayAttendance.status, dayAttendance.type)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 text-[10px] pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-green-100 rounded border border-green-300"></div>
                <span className="text-slate-500">Present</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-red-100 rounded border border-red-300"></div>
                <span className="text-slate-500">Absent</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-yellow-100 rounded border border-yellow-300"></div>
                <span className="text-slate-500">Half Day</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 bg-orange-100 rounded border border-orange-300"></div>
                <span className="text-slate-500">Leave</span>
              </div>
            </div>
          </div>
        )}

        {!selectedEmployee && (
          <div className="text-center py-10">
            <RefreshCw className="w-8 h-8 mx-auto text-slate-300" />
            <h3 className="mt-2 text-sm font-medium text-slate-700">No employee selected</h3>
            <p className="text-xs text-slate-400">Choose an employee to view attendance.</p>
          </div>
        )}
      </div>
    </Card>
  );
}