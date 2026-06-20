import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2,
  RefreshCw,
  Download,
  Filter,
  Search,
  Users,
  Wallet,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*                               Constants & Helpers                          */
/* -------------------------------------------------------------------------- */
const dateFilterOptions = [
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
];

const moneyFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const formatMoney = (value: number) => moneyFormatter.format(Math.round(value || 0));
const formatNumber = (value: number) => numberFormatter.format(Number(value || 0));

const ROWS_PER_PAGE = 8;

export function SalarySheetReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Level filter
  const [levels, setLevels] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState('1');

  // Date filter
  const [dateFilter, setDateFilter] = useState('month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Search (client-side)
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);

  // ─── Fetch levels ───
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const res = await getDataHandlerWithToken('getAllLevels', null, null);
        if (res) {
          setLevels(res);
          if (res.length) setSelectedLevel(extractLevelNumber(res[0].name).toString());
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load levels', variant: 'destructive' });
      }
    };
    fetchLevels();
  }, []);

  const extractLevelNumber = (name: string): number => {
    const match = name.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  };

  // ─── Fetch salary data ───
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        level: parseInt(selectedLevel) || 1,
      };

      if (dateFilter === 'custom') {
        if (!fromDate || !toDate) {
          toast({ title: 'Missing Dates', description: 'Select start and end dates.', variant: 'destructive' });
          setLoading(false);
          return;
        }
        const diffTime = Math.abs(new Date(toDate).getTime() - new Date(fromDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 31) {
          toast({ title: 'Date range too large', description: 'Max 31 days allowed', variant: 'destructive' });
          setLoading(false);
          return;
        }
        params.fromDate = fromDate;
        params.toDate = toDate;
      } else {
        params.dateFilter = dateFilter;
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.employeeSalarySheetReport,
        params,
        null,
        true
      );
      setData(response?.data || response);
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load salary sheet', variant: 'destructive' });
      setData(null);
    } finally {
      setLoading(false);
      setCurrentPage(0);
    }
  }, [selectedLevel, dateFilter, fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Derived data ───
  const employees = useMemo(() => (data?.employees ? data.employees : []), [data]);
  const summary = data?.summary || {};
  const periodLabel = data?.period?.label || 'Current Month';

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    const term = searchTerm.toLowerCase();
    return employees.filter((emp: any) => {
      return [emp.empName, emp.empId, emp.designation, emp.email]
        .filter(Boolean)
        .some(val => String(val).toLowerCase().includes(term));
    });
  }, [employees, searchTerm]);

  const totalPages = Math.ceil(filteredEmployees.length / ROWS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice(
    currentPage * ROWS_PER_PAGE,
    (currentPage + 1) * ROWS_PER_PAGE,
  );

  const totalPayroll =
    summary.totalPayroll ??
    filteredEmployees.reduce((sum: number, row: any) => sum + (row.finalSalary || 0), 0);

  const hasActiveFilters =
    selectedLevel !== '1' ||
    dateFilter !== 'month' ||
    (dateFilter === 'custom' && (fromDate || toDate)) ||
    searchTerm !== '';

  // ─── Export CSV ───
  const handleExport = () => {
    if (!employees.length) {
      toast({ title: 'No data to export' });
      return;
    }
    const headers = [
      'Emp ID', 'Emp Name', 'Designation', 'Vintage', 'Salary',
      'Total Working Days', 'Total Present', 'Total Half Day', 'Total Leave', 'WO',
      'Total Absent', 'Final Payable Days', 'Basic Salary', 'Final Salary',
    ];
    const rows = filteredEmployees.map(emp => [
      emp.empId,
      emp.empName,
      emp.designation,
      emp.vintage || '-',
      Math.round(emp.salary || 0),
      emp.totalWorkingDays,
      emp.totalPresent,
      emp.totalHalfDay,
      emp.totalLeave,
      emp.wo,
      emp.totalAbsent,
      emp.totalPayableDays,
      Math.round(emp.basicSalary || 0),
      Math.round(emp.finalSalary || 0),
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary_sheet_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Salary Sheet</h3>
          <p className="text-sm text-slate-500">Employee attendance & payroll summary</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="rounded-xl border-slate-200">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
            Refresh
          </Button>
          <Button size="sm" onClick={handleExport} disabled={!data || loading} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
            <Download className="w-3.5 h-3.5 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-1 h-8 text-xs rounded-xl"
        >
          <Filter className="w-3 h-3" />
          Filters
          {hasActiveFilters && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-orange-500" />}
          {showFilters ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
        </Button>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 w-full">
            {/* Level Radio Buttons */}
            {/* {levels.length > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase">Level</Label>
                <div className="flex flex-wrap gap-1">
                  {levels.map(lvl => (
                    <button
                      key={lvl._id}
                      onClick={() => setSelectedLevel(extractLevelNumber(lvl.name).toString())}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-lg border transition-all",
                        selectedLevel === extractLevelNumber(lvl.name).toString()
                          ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {lvl.name}
                    </button>
                  ))}
                </div>
              </div>
            )} */}

            {/* Date Filter */}
            <div className="w-[130px]">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-8 text-xs rounded-xl">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {dateFilterOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {dateFilter === 'custom' && (
              <>
                <div className="relative w-[130px]">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="relative w-[130px]">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Max 31 days</span>
              </>
            )}

            {/* Search */}
            <div className="relative w-52">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Search employee, ID..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
                className="pl-7 h-8 text-xs rounded-xl border-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
          <p className="ml-2 text-sm text-slate-500">Loading salary data...</p>
        </div>
      ) : !employees.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Wallet className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No salary data found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting filters or level</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Employees</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {summary.totalEmployees ?? employees.length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Payroll</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    ₹ {formatMoney(totalPayroll)}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Period</p>
                  <p className="text-sm font-semibold text-slate-700 mt-1">{periodLabel}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Info & Search (already integrated into filter bar, but we still show record count) */}
          <div className="text-xs text-slate-500">
            {filteredEmployees.length} records shown
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
            <Table className="min-w-[1450px]">
              <TableHeader>
                <TableRow className="bg-amber-50 hover:bg-amber-50 border-b border-amber-200">
                  <TableHead className="text-xs font-semibold text-amber-900 uppercase">Emp ID</TableHead>
                  <TableHead className="text-xs font-semibold text-amber-900 uppercase">Emp Name</TableHead>
                  <TableHead className="text-xs font-semibold text-amber-900 uppercase">Designation</TableHead>
                  <TableHead className="text-xs font-semibold text-amber-900 uppercase">Vintage</TableHead>
                  <TableHead className="text-xs font-semibold text-amber-900 uppercase text-right">Salary</TableHead>
                  <TableHead className="text-xs font-semibold text-amber-900 uppercase text-right">Total Days</TableHead>
                  <TableHead className="text-xs font-semibold text-amber-900 uppercase text-right">Present</TableHead>
                  <TableHead className="text-xs font-semibold text-amber-900 uppercase text-right">Half Day</TableHead>
                  <TableHead className="text-xs font-semibold text-amber-900 uppercase text-right">Leave</TableHead>
                  <TableHead className="text-xs font-semibold text-amber-900 uppercase text-right">WO</TableHead>
                  <TableHead className="text-xs font-semibold text-amber-900 uppercase text-right">Absent</TableHead>
                  <TableHead className="text-xs font-semibold text-amber-900 uppercase text-right">Pay Days</TableHead>
                  <TableHead className="text-xs font-semibold text-amber-900 uppercase text-right">Basic Salary</TableHead>
                  <TableHead className="text-xs font-semibold text-amber-900 uppercase text-right">Final Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmployees.map((emp: any) => (
                  <TableRow key={emp.userId || `${emp.empId}-${emp.empName}`} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <TableCell className="text-xs font-medium text-slate-800">{emp.empId}</TableCell>
                    <TableCell className="text-xs text-slate-700">{emp.empName}</TableCell>
                    <TableCell className="text-xs text-slate-600">{emp.designation}</TableCell>
                    <TableCell className="text-xs text-slate-600">{emp.vintage || '-'}</TableCell>
                    <TableCell className="text-xs text-right text-slate-700">{formatMoney(emp.salary)}</TableCell>
                    <TableCell className="text-xs text-right text-slate-600">{formatNumber(emp.totalWorkingDays)}</TableCell>
                    <TableCell className="text-xs text-right text-slate-600">{formatNumber(emp.totalPresent)}</TableCell>
                    <TableCell className="text-xs text-right text-slate-600">{formatNumber(emp.totalHalfDay)}</TableCell>
                    <TableCell className="text-xs text-right text-slate-600">{formatNumber(emp.totalLeave)}</TableCell>
                    <TableCell className="text-xs text-right text-slate-600">{formatNumber(emp.wo)}</TableCell>
                    <TableCell className="text-xs text-right text-slate-600">{formatNumber(emp.totalAbsent)}</TableCell>
                    <TableCell className="text-xs text-right font-medium text-slate-800">{formatNumber(emp.totalPayableDays)}</TableCell>
                    <TableCell className="text-xs text-right text-slate-700">{formatMoney(emp.basicSalary)}</TableCell>
                    <TableCell className="text-xs text-right font-semibold text-slate-800">{formatMoney(emp.finalSalary)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500">
                Page {currentPage + 1} of {totalPages}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}