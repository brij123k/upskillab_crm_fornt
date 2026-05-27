import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Search, ChevronLeft, ChevronRight, Users, CalendarDays, Wallet } from 'lucide-react';

interface SalarySheetReportProps {
  data: any;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatMoney = (value: number) => moneyFormatter.format(Math.round(value || 0));
const formatNumber = (value: number) => numberFormatter.format(Number(value || 0));

export function SalarySheetReport({ data, searchTerm = '', onSearchChange }: SalarySheetReportProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 8;

  const employees = Array.isArray(data?.employees) ? data.employees : [];

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    const term = searchTerm.toLowerCase();
    return employees.filter((employee: any) => {
      return [employee.empName, employee.empId, employee.designation, employee.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [employees, searchTerm]);

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage,
  );

  const summary = data?.summary || {};
  const totalPayroll =
    summary.totalPayroll ?? filteredEmployees.reduce((sum: number, row: any) => sum + (row.finalSalary || 0), 0);
  const periodLabel = data?.period?.label || 'Current Month';

  if (!employees.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">No salary sheet data available</p>
      </div>
    );
  }

  if (!filteredEmployees.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No matching employees found</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Employees</p>
              <p className="text-xl font-semibold">{summary.totalEmployees ?? employees.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Payroll</p>
              <p className="text-xl font-semibold">Rs. {formatMoney(totalPayroll)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Period</p>
              <p className="text-sm font-medium">{periodLabel}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">{filteredEmployees.length} records shown</div>
        {onSearchChange && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search employee, ID, designation..."
              value={searchTerm}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setCurrentPage(0);
              }}
              className="pl-7 h-9 text-xs"
            />
          </div>
        )}
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <Table className="min-w-[1450px]">
          <TableHeader>
            <TableRow className="bg-yellow-300/90 hover:bg-yellow-300/90">
              <TableHead className="font-semibold text-black">Emp ID</TableHead>
              <TableHead className="font-semibold text-black">Emp Name</TableHead>
              <TableHead className="font-semibold text-black">Designation</TableHead>
              <TableHead className="font-semibold text-black">Vintage</TableHead>
              <TableHead className="font-semibold text-black text-right">Salary</TableHead>
              <TableHead className="font-semibold text-black text-right">Total Working Days</TableHead>
              <TableHead className="font-semibold text-black text-right">Total Present</TableHead>
              <TableHead className="font-semibold text-black text-right">Total Half Day</TableHead>
              <TableHead className="font-semibold text-black text-right">Total Leave</TableHead>
              <TableHead className="font-semibold text-black text-right">WO</TableHead>
              <TableHead className="font-semibold text-black text-right">Total Absent</TableHead>
              <TableHead className="font-semibold text-black text-right">Final Payable Days</TableHead>
              <TableHead className="font-semibold text-black text-right">Basic Salary</TableHead>
              <TableHead className="font-semibold text-black text-right">Final Salary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEmployees.map((employee: any) => (
              <TableRow key={employee.userId || `${employee.empId}-${employee.empName}`} className="hover:bg-muted/30">
                <TableCell className="font-medium">{employee.empId}</TableCell>
                <TableCell>{employee.empName}</TableCell>
                <TableCell>{employee.designation}</TableCell>
                <TableCell>{employee.vintage || '-'}</TableCell>
                <TableCell className="text-right">{formatMoney(employee.salary)}</TableCell>
                <TableCell className="text-right">{formatNumber(employee.totalWorkingDays)}</TableCell>
                <TableCell className="text-right">{formatNumber(employee.totalPresent)}</TableCell>
                <TableCell className="text-right">{formatNumber(employee.totalHalfDay)}</TableCell>
                <TableCell className="text-right">{formatNumber(employee.totalLeave)}</TableCell>
                <TableCell className="text-right">{formatNumber(employee.wo)}</TableCell>
                <TableCell className="text-right">{formatNumber(employee.totalAbsent)}</TableCell>
                <TableCell className="text-right font-medium">{formatNumber(employee.totalPayableDays)}</TableCell>
                <TableCell className="text-right">{formatMoney(employee.basicSalary)}</TableCell>
                <TableCell className="text-right font-semibold">{formatMoney(employee.finalSalary)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="p-1 rounded border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-1 rounded border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
