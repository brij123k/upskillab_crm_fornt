import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  UserCog,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────

interface StageItem {
  leadStage: string;
  count: number;
}

interface EmployeeData {
  employeeId: string;
  employeeName: string;
  employeeEmail?: string | null;
  employeeNumber?: string | null;
  employeeEmployeeId?: string | number | null;
  employeeLevel?: number | string | null;
  totalLead: number;
  stages: StageItem[];
  team?: boolean;
  teamSize?: number;
}

interface ReportData {
  employees: EmployeeData[];
  totalLeads: number;
  totalEmployees: number;
  filters?: {
    level?: string | number | null;
    team?: boolean | null;
    assignedDate?: string | null;
    assignedDateFilter?: string | null;
    assignedDateFrom?: string | null;
    assignedDateTo?: string | null;
  };
}

interface LevelType {
  _id: string;
  name: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────────────────────────────────────

const dateFilterOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const EMPLOYEES_PER_PAGE = 6;

// ───────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ───────────────────────────────────────────────────────────────────────────────

const extractLevelNumber = (levelName: string): number => {
  const match = levelName.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
};

// ───────────────────────────────────────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────────────────────────────────────

export function EmployeeStagesReport() {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [allStages, setAllStages] = useState<string[]>([]);
  const [loadingStages, setLoadingStages] = useState(true);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);

  // Level filter (using buttons like PoolStagesReport)
  const [levels, setLevels] = useState<LevelType[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('1');

  // Team filter (checkbox)
  const [showTeamOnly, setShowTeamOnly] = useState<boolean>(false);

  // Date filter
  const [dateFilter, setDateFilter] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Search (client-side)
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);

  // ─── Fetch Levels ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await getDataHandlerWithToken('getAllLevels', null, null);
        if (response && Array.isArray(response)) {
          setLevels(response);
          // Set default to Level 1
          if (response.length > 0) {
            const firstLevelNumeric = extractLevelNumber(response[0].name);
            setSelectedLevel(firstLevelNumeric.toString());
          }
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch levels',
          variant: 'destructive',
        });
      }
    };
    fetchLevels();
  }, []);

  // ─── Fetch Stages ──────────────────────────────────────────────────────────
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

  // ─── Fetch Report Data ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};

      // Level parameter
      if (selectedLevel) {
        params.level = parseInt(selectedLevel, 10) || 1;
      }

      // Team filter - send as boolean when checked
      if (showTeamOnly) {
        params.team = true;
      }

      // Date filter
      if (dateFilter === 'custom') {
        if (!fromDate || !toDate) {
          setLoading(false);
          return;
        }
        params.assignedDateFrom = fromDate;
        params.assignedDateTo = toDate;
      } else {
        params.assignedDateFilter = dateFilter;
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
          totalEmployees: response.data?.totalEmployees ?? response.totalEmployees ?? 0,
          filters: response.data?.filters || response.filters || {},
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
  }, [selectedLevel, showTeamOnly, dateFilter, fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Reset pagination when filters change ──────────────────────────────
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedLevel, showTeamOnly, dateFilter, fromDate, toDate, searchTerm]);

  // ─── Export CSV ──────────────────────────────────────────────────────────
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
    const headers = ['Employee', 'Employee ID', 'Level', 'Total Lead', ...stageList, 'Email', 'Phone', 'Team Size'];
    const rows = allEmployeeStages.map(emp => {
      const stageMap = new Map(emp.stages.map(s => [s.leadStage, s.count]));
      return [
        emp.employeeName,
        emp.employeeEmployeeId || emp.employeeId || '',
        emp.employeeLevel || '',
        emp.totalLead,
        ...stageList.map(s => stageMap.get(s) || 0),
        emp.employeeEmail || '',
        emp.employeeNumber || '',
        emp.teamSize || '',
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

  // ─── Client-side filtering ──────────────────────────────────────────────

  // First, filter employees by search term (client-side)
  const searchFilteredEmployees = data?.employees
    ? data.employees.filter(emp =>
        emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.employeeEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (emp.employeeNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
    : [];

  // Pagination
  const totalPages = Math.ceil(searchFilteredEmployees.length / EMPLOYEES_PER_PAGE);
  const paginatedEmployees = searchFilteredEmployees.slice(
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
    const ordered = allStages.filter(s => stageSet.has(s));
    const extra = Array.from(stageSet).filter(s => !ordered.includes(s));
    return [...ordered, ...extra];
  })();

  // Active filters check
  const defaultLevel = levels.length > 0 ? extractLevelNumber(levels[0].name).toString() : '1';
  const hasActiveFilters =
    selectedLevel !== defaultLevel ||
    showTeamOnly ||
    dateFilter !== 'today' ||
    (dateFilter === 'custom' && (fromDate || toDate)) ||
    searchTerm !== '';

  // Check if team mode is active (from API response)
  const isTeamMode = data?.filters?.team === true || showTeamOnly;

  // ─── Render ──────────────────────────────────────────────────────────────
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
          <div className="flex flex-wrap items-center gap-3 w-full">
            {/* Level Buttons - matching PoolStagesReport style */}
            {levels.length > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">
                  Level
                </Label>
                <div className="flex flex-wrap gap-1">
                  {levels.map(lvl => {
                    const num = extractLevelNumber(lvl.name);
                    return (
                      <button
                        key={lvl._id}
                        onClick={() => {
                          setSelectedLevel(num.toString());
                        }}
                        className={cn(
                          "px-3 py-1 text-xs font-medium rounded-lg border transition-all",
                          selectedLevel === num.toString()
                            ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {lvl.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Team Checkbox */}
            <div className="flex items-center gap-2 ml-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="team-filter"
                  checked={showTeamOnly}
                  onCheckedChange={(checked) => {
                    setShowTeamOnly(checked === true);
                  }}
                  className="h-4 w-4 rounded border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <Label
                  htmlFor="team-filter"
                  className="text-xs font-medium text-slate-600 cursor-pointer"
                >
                  Team
                </Label>
              </div>
            </div>

            {/* Date filter */}
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

            {/* Custom Date Range */}
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

            {/* Search - client-side */}
            <div className="relative w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="pl-7 h-8 text-xs rounded-xl border-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter Summary */}
      {!loading && data && data.employees.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
          <span>
            Level:{' '}
            <span className="font-medium text-slate-700">
              {levels.find(l => extractLevelNumber(l.name).toString() === selectedLevel)?.name || `Level ${selectedLevel}`}
            </span>
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>
            Team:{' '}
            <span className="font-medium text-slate-700">
              {isTeamMode ? (
                <span className="flex items-center gap-1 text-orange-600">
                  <UserCog className="w-3 h-3" />
                  Enabled
                </span>
              ) : (
                'All'
              )}
            </span>
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>
            Date:{' '}
            <span className="font-medium text-slate-700">
              {dateFilterOptions.find(o => o.value === dateFilter)?.label || dateFilter}
            </span>
          </span>
          {dateFilter === 'custom' && fromDate && toDate && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>
                Range:{' '}
                <span className="font-medium text-slate-700">
                  {fromDate} to {toDate}
                </span>
              </span>
            </>
          )}
          {searchTerm && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>
                Search:{' '}
                <span className="font-medium text-slate-700">"{searchTerm}"</span>
              </span>
            </>
          )}
        </div>
      )}

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
      ) : searchFilteredEmployees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No matching employees</p>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search term
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary badge */}
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="font-medium text-slate-700">
              {searchFilteredEmployees.length} employees
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>
              Total leads:{' '}
              <span className="font-semibold text-slate-800">
                {searchFilteredEmployees.reduce((sum, emp) => sum + emp.totalLead, 0)}
              </span>
            </span>
            {isTeamMode && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1 text-orange-600">
                  <UserCog className="w-3.5 h-3.5" />
                  <span className="font-medium">Team View</span>
                </span>
              </>
            )}
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
                        {emp.employeeLevel && (
                          <div className="text-[9px] font-normal text-slate-400 mt-0.5">
                            L{emp.employeeLevel}
                          </div>
                        )}
                        {emp.teamSize && emp.teamSize > 1 && (
                          <div className="text-[9px] font-normal text-orange-500 mt-0.5">
                            Team: {emp.teamSize}
                          </div>
                        )}
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
                  {relevantStages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={employeeStageMap.length + 1} className="text-center py-8 text-sm text-slate-500">
                        No stage data for the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    relevantStages.map(stageName => (
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
                    ))
                  )}
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