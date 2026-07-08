import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  RefreshCw,
  Download,
  Filter,
  Search,
  MapPin,
  Users,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  BarChart3,
  IndianRupee,
  Layers,
  UserCheck,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*                               Type Definitions                              */
/* -------------------------------------------------------------------------- */
interface StageCounts {
  [stageName: string]: number;
}

interface StateDetail {
  state: string;
  totalLeads: number;
  pcatScheduled: number;
  pcatDone: number;
  registrationDone: number;
  admissionDone: number;
  revenue: number;
  stages: StageCounts;
  conversionPercentage: number;
}

interface EmployeeData {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeCode: number;
  totalLeads: number;
  totalAdmissionDone: number;
  totalRevenue: number;
  states: StateDetail[];
}

interface ApiResponse {
  startDate: string;
  endDate: string;
  data: EmployeeData[];
}

/* -------------------------------------------------------------------------- */
/*                               Date Options                                  */
/* -------------------------------------------------------------------------- */
const dateFilterOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

/* -------------------------------------------------------------------------- */
/*                               Main Component                                */
/* -------------------------------------------------------------------------- */
export function StateWiseEmployeeReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Date filter
  const [dateFilter, setDateFilter] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Client-side search
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');

  // Expanded employees
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

  // ─── Fetch data ───
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};

      if (dateFilter === 'custom') {
        if (!fromDate || !toDate) {
          toast({
            title: 'Missing Dates',
            description: 'Select start and end dates.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        const diffTime = Math.abs(new Date(toDate).getTime() - new Date(fromDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
          toast({
            title: 'Date range too large',
            description: 'Max 30 days allowed.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        params.fromDate = fromDate;
        params.toDate = toDate;
      } else {
        params.dateFilter = dateFilter;
      }

      if (employeeSearch.trim()) params.employee = employeeSearch.trim();
      if (stateSearch.trim()) params.state = stateSearch.trim();

      const response = await getDataHandlerWithToken(
        ApiConfig.stateWiseEmployeeReport,
        params,
        null,
        true
      );

      let report: ApiResponse | null = null;

      if (response?.startDate && Array.isArray(response.data)) {
        report = response as ApiResponse;
      } else if (response?.data && response.data.startDate && Array.isArray(response.data.data)) {
        report = response.data as ApiResponse;
      } else if (Array.isArray(response?.data)) {
        report = {
          startDate: '',
          endDate: '',
          data: response.data as EmployeeData[],
        };
      }

      setData(report);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load employee report',
        variant: 'destructive',
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, fromDate, toDate, employeeSearch, stateSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Export CSV ───
  const handleExport = () => {
    if (!data?.data?.length) {
      toast({ title: 'No data to export' });
      return;
    }
    const headers = [
      'Employee Name',
      'Employee Code',
      'Total Leads',
      'Total Admissions',
      'Total Revenue',
      'State',
      'State Leads',
      'PCAT S.',
      'PCAT D.',
      'Reg. D.',
      'Adm. D.',
      'State Revenue',
      'Conv. %',
      'Stages',
    ];
    const rows: any[] = [];
    data.data.forEach(employee => {
      employee.states.forEach(state => {
        const stagesStr = Object.entries(state.stages)
          .map(([k, v]) => `${k}:${v}`)
          .join('; ');
        rows.push([
          employee.employeeName,
          employee.employeeCode,
          employee.totalLeads,
          employee.totalAdmissionDone,
          employee.totalRevenue,
          state.state,
          state.totalLeads,
          state.pcatScheduled,
          state.pcatDone,
          state.registrationDone,
          state.admissionDone,
          state.revenue,
          state.conversionPercentage,
          stagesStr,
        ]);
      });
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee_state_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported Successfully!' });
  };

  // ─── Helpers ───
  const toggleEmployee = (employeeId: string) => {
    const newSet = new Set(expandedEmployees);
    if (newSet.has(employeeId)) newSet.delete(employeeId);
    else newSet.add(employeeId);
    setExpandedEmployees(newSet);
  };

  const hasActiveFilters =
    dateFilter !== 'today' ||
    (dateFilter === 'custom' && (fromDate || toDate)) ||
    employeeSearch !== '' ||
    stateSearch !== '';

  // Grand totals
  const totalEmployees = data?.data?.length || 0;
  const totalLeads = data?.data?.reduce((sum, emp) => sum + emp.totalLeads, 0) || 0;
  const totalAdmissions = data?.data?.reduce((sum, emp) => sum + emp.totalAdmissionDone, 0) || 0;
  const totalRevenue = data?.data?.reduce((sum, emp) => sum + emp.totalRevenue, 0) || 0;

  // Get unique states across all employees
  const uniqueStates = new Set<string>();
  data?.data?.forEach(employee => {
    employee.states.forEach(state => uniqueStates.add(state.state));
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Employee State Report</h3>
          <p className="text-sm text-slate-500">Employee performance across different states</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="rounded-xl border-slate-200 hover:border-orange-200 hover:bg-orange-50"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
            )}
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={!data || loading}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1 h-8 text-xs rounded-xl"
          >
            <Filter className="w-3 h-3" />
            Filters
            {hasActiveFilters && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
            {showFilters ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 w-full mt-2 pt-2 border-t border-slate-100">
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
                      className="w-full h-8 px-2 text-xs border rounded-xl bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <div className="relative w-[130px]">
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full h-8 px-2 text-xs border rounded-xl bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">Max 30 days</span>
                </>
              )}

              {/* Employee Search */}
              <div className="relative w-48">
                <Users className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <Input
                  placeholder="Search employee..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="pl-7 h-8 text-xs rounded-xl border-slate-200"
                />
              </div>

              {/* State Search */}
              <div className="relative w-44">
                <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <Input
                  placeholder="Search state..."
                  value={stateSearch}
                  onChange={(e) => setStateSearch(e.target.value)}
                  className="pl-7 h-8 text-xs rounded-xl border-slate-200"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-orange-400 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading employee data...</p>
          </div>
        </div>
      ) : !data || !data.data?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
          <UserCheck className="w-14 h-14 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No employee data found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting filters or date range</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="p-4 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Employees</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{totalEmployees}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">States</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{uniqueStates.size}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Total Leads</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{totalLeads.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Admissions</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{totalAdmissions.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center">
                  <Layers className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Revenue</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">₹{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Employee List - New card-based design */}
          <div className="space-y-3">
            {data.data.map((employee, index) => {
              const isExpanded = expandedEmployees.has(employee.employeeId);
              const topStates = employee.states.slice(0, 3);
              const remainingStates = employee.states.length - 3;

              return (
                <Card
                  key={employee.employeeId}
                  className={cn(
                    "border border-slate-200 bg-white overflow-hidden transition-all duration-200",
                    isExpanded ? "shadow-md" : "shadow-sm hover:shadow-md"
                  )}
                >
                  {/* Employee Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
                    onClick={() => toggleEmployee(employee.employeeId)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold text-white shrink-0",
                        isExpanded ? "bg-orange-500" : "bg-slate-400"
                      )}>
                        {index + 1}
                      </div>
                      <ChevronRight
                        className={cn(
                          "w-4 h-4 text-slate-400 transition-transform shrink-0",
                          isExpanded && "rotate-90"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-800 truncate">
                            {employee.employeeName}
                          </h4>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50 border-slate-200 text-slate-500 shrink-0">
                            #{employee.employeeCode}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {employee.states.length} states
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span>{employee.totalLeads} leads</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span>{employee.totalAdmissionDone} admissions</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="font-medium text-emerald-600">₹{employee.totalRevenue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick stats chips */}
                    <div className="hidden sm:flex items-center gap-2 ml-4">
                      {topStates.map(state => (
                        <Badge
                          key={state.state}
                          variant="outline"
                          className="text-[10px] px-2 py-0 bg-slate-50 border-slate-200 text-slate-600"
                        >
                          {state.state}: {state.totalLeads}
                        </Badge>
                      ))}
                      {remainingStates > 0 && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0 bg-slate-50 border-slate-200">
                          +{remainingStates} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* States Table (expanded) */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/50 hover:bg-slate-50">
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase min-w-[140px]">
                              State
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">
                              Leads
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">
                              PCAT S.
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">
                              PCAT D.
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">
                              Reg. D.
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">
                              Adm. D.
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">
                              Revenue
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">
                              Conv. %
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500 uppercase min-w-[180px]">
                              Stage Distribution
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employee.states.map(state => {
                            const totalStages = Object.values(state.stages).reduce((a, b) => a + b, 0);
                            return (
                              <TableRow
                                key={state.state}
                                className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                              >
                                <TableCell className="text-xs font-medium text-slate-800">
                                  {state.state}
                                </TableCell>
                                <TableCell className="text-xs text-center text-slate-600">
                                  {state.totalLeads}
                                </TableCell>
                                <TableCell className="text-xs text-center text-slate-600">
                                  {state.pcatScheduled}
                                </TableCell>
                                <TableCell className="text-xs text-center text-slate-600">
                                  {state.pcatDone}
                                </TableCell>
                                <TableCell className="text-xs text-center text-slate-600">
                                  {state.registrationDone}
                                </TableCell>
                                <TableCell className="text-xs text-center text-slate-600">
                                  {state.admissionDone}
                                </TableCell>
                                <TableCell className="text-xs text-center font-medium text-emerald-600">
                                  ₹{state.revenue.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-xs text-center">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full font-medium",
                                    state.conversionPercentage > 50 ? "bg-emerald-100 text-emerald-700" :
                                    state.conversionPercentage > 25 ? "bg-amber-100 text-amber-700" :
                                    "bg-slate-100 text-slate-600"
                                  )}>
                                    {state.conversionPercentage}%
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs">
                                  <div className="flex flex-wrap gap-1 max-w-[220px]">
                                    {Object.entries(state.stages).map(([stage, count]) => {
                                      const percentage = totalStages > 0 ? Math.round((count / totalStages) * 100) : 0;
                                      return (
                                        <Badge
                                          key={stage}
                                          variant="outline"
                                          className="text-[10px] px-1.5 py-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                        >
                                          {stage}: {count}
                                          <span className="text-[8px] text-slate-400 ml-0.5">({percentage}%)</span>
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span>Showing {data.data.length} employees</span>
            <span>Last updated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}