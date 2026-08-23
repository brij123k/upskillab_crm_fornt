import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
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
import {
  Loader2,
  RefreshCw,
  Download,
  Filter,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StageItem {
  leadStage: string;
  count: number;
}

interface EmployeeData {
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  totalLead: number;
  stages: StageItem[];
}

interface ReportData {
  employees: EmployeeData[];
  totalLeads: number;
  totalRecords: number;
}

const dateFilterOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const EMPLOYEES_PER_PAGE = 6;

export function EmployeeStagesReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [allStages, setAllStages] = useState<string[]>([]);
  const [loadingStages, setLoadingStages] = useState(true);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);

  // ──────────── Fetch stages for headers ────────────
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const response = await getDataHandlerWithToken(
          ApiConfig.getAllStages,
          null,
          null,
          true
        );
        const stagesData = response?.data || response || [];
        if (Array.isArray(stagesData) && stagesData.length) {
          const names = stagesData.map((s: any) => s.stageName || s.name);
          setAllStages(names);
        } else {
          setAllStages([]);
        }
      } catch (error) {
        setAllStages([]);
      } finally {
        setLoadingStages(false);
      }
    };
    fetchStages();
  }, []);

  // ──────────── Fetch report data ────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateFilter === 'custom') {
        if (!fromDate || !toDate) {
          // toast({
          //   title: 'Missing Dates',
          //   description: 'Please select both start and end dates.',
          //   variant: 'destructive',
          // });
          setLoading(false);
          return;
        }
        params.assignedDateFrom = fromDate;
        params.assignedDateTo = toDate;
      } else {
        params.assignedDateFilter = dateFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.allEmpStages,
        params,
        null,
        true
      );
      if (response) {
        setData({
          employees: response.data?.employees || response.employees || [],
          totalLeads: response.data?.totalLeads ?? response.totalLeads ?? 0,
          totalRecords: response.data?.totalRecords ?? response.totalRecords ?? 0,
        });
      } else {
        setData(null);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load employee stages',
        variant: 'destructive',
      });
      setData(null);
    } finally {
      setLoading(false);
      setCurrentPage(0);
    }
  }, [dateFilter, fromDate, toDate, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ──────────── Export CSV ────────────
  const handleExport = () => {
    if (!data || !data.employees.length) {
      toast({ title: 'No data to export' });
      return;
    }

    const allEmployeeStages = data.employees;
    const stageSet = new Set<string>();
    allEmployeeStages.forEach(emp =>
      emp.stages.forEach(s => stageSet.add(s.leadStage))
    );
    const stageList = Array.from(stageSet);
    const headers = ['Employee', 'Total Lead', ...stageList, 'Email'];
    const rows = allEmployeeStages.map(emp => {
      const stageMap = new Map(emp.stages.map(s => [s.leadStage, s.count]));
      return [
        emp.employeeName,
        emp.totalLead,
        ...stageList.map(s => stageMap.get(s) || 0),
        emp.employeeEmail || '',
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee_stages_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  };

  // ──────────── Helpers ────────────
  const hasActiveFilters =
    dateFilter !== 'today' ||
    (dateFilter === 'custom' && (fromDate || toDate)) ||
    searchTerm !== '';

  const filteredEmployees = data?.employees || [];
  const totalPages = Math.ceil(filteredEmployees.length / EMPLOYEES_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice(
    currentPage * EMPLOYEES_PER_PAGE,
    (currentPage + 1) * EMPLOYEES_PER_PAGE
  );

  // Build a map for each employee: stage → count
  const employeeStageMap = paginatedEmployees.map(emp => {
    const map = new Map<string, number>();
    emp.stages.forEach(s => map.set(s.leadStage, s.count));
    return { ...emp, stageMap: map };
  });

  // Relevant stages that appear in current filtered data
  const relevantStages = (() => {
    const stageSet = new Set<string>();
    employeeStageMap.forEach(emp => {
      emp.stageMap.forEach((_, key) => stageSet.add(key));
    });
    // Order: those present in allStages first, then any extra
    const ordered = allStages.filter(s => stageSet.has(s));
    const extra = Array.from(stageSet).filter(s => !ordered.includes(s));
    return [...ordered, ...extra];
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Employee Stages</h3>
          <p className="text-sm text-slate-500">Lead distribution per employee</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="rounded-xl border-slate-200"
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
            className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
          >
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
          {hasActiveFilters && (
            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-orange-500" />
          )}
          {showFilters ? (
            <ChevronUp className="w-3 h-3 ml-1" />
          ) : (
            <ChevronDown className="w-3 h-3 ml-1" />
          )}
        </Button>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-2">
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
              </>
            )}
            <div className="relative w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
          <p className="ml-2 text-sm text-slate-500">Loading employee data...</p>
        </div>
      ) : !data || !data.employees.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No employees found</p>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting filters or search term
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary badge */}
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="font-medium text-slate-700">
              {filteredEmployees.length} employees
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>
              Total leads:{' '}
              <span className="font-semibold text-slate-800">{data.totalLeads}</span>
            </span>
          </div>

          {/* Table */}
          {loadingStages ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
              <p className="ml-2 text-sm text-slate-500">Loading stage headers...</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase sticky left-0 bg-slate-50 z-10 min-w-[140px]">
                      Lead Stage
                    </TableHead>
                    {employeeStageMap.map(emp => (
                      <TableHead
                        key={emp.employeeId}
                        className="text-xs text-center min-w-[110px] py-3"
                      >
                        <div className="font-semibold text-slate-800">{emp.employeeName}</div>
                        <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                          Total: {emp.totalLead}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Total Lead row (summary) */}
                  <TableRow className="bg-orange-50/30 hover:bg-orange-50/50 border-b border-slate-100">
                    <TableCell className="text-xs font-semibold text-slate-800 sticky left-0 bg-white border-r z-10 py-3">
                      Total Lead
                    </TableCell>
                    {employeeStageMap.map(emp => (
                      <TableCell
                        key={emp.employeeId}
                        className="text-xs text-center font-bold text-orange-700 py-3"
                      >
                        {emp.totalLead}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Stage rows */}
                  {relevantStages.map(stageName => {
                    // check if any employee has this stage to avoid all-zero rows (still show them optionally)
                    const hasAny = employeeStageMap.some(
                      emp => (emp.stageMap.get(stageName) || 0) > 0
                    );
                    // We'll still show rows even if zero, as they might want to see zeros.
                    return (
                      <TableRow
                        key={stageName}
                        className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                      >
                        <TableCell className="text-xs font-medium text-slate-700 sticky left-0 bg-white border-r z-10 py-3">
                          {stageName}
                        </TableCell>
                        {employeeStageMap.map(emp => {
                          const count = emp.stageMap.get(stageName) || 0;
                          const total = emp.totalLead || 1;
                          const pct = ((count / total) * 100).toFixed(1);
                          return (
                            <TableCell
                              key={emp.employeeId}
                              className="text-xs text-center py-3"
                            >
                              <div className="flex flex-col items-center">
                                <span
                                  className={cn(
                                    'font-medium',
                                    count > 0
                                      ? 'text-slate-800'
                                      : 'text-slate-300'
                                  )}
                                >
                                  {count || '-'}
                                </span>
                                {count > 0 && (
                                  <span className="text-[10px] text-slate-400 mt-0.5">
                                    {pct}%
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

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