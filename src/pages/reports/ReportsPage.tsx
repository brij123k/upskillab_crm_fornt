import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Loader2, Download, RefreshCw, Filter,
  PieChart, Users, PhoneCall, BarChart,
  IndianRupee, Building2, Calendar, Award
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { useToast } from '@/hooks/use-toast';
import { hasPermission } from '@/utils/permissions';

// Import report components
import {
  StageSummaryReport,
  EmployeeStagesReport,
  PoolStagesReport,
  PoolRevenueReport,
  UtilizationReport,
  ConsultantPerformanceReport,
  DailyUtilizationReport,
  SourceCampaignReport,
  SourceCampaignRevenueReport,
  SourceCampaignComparisonReport,
  SalarySheetReport,
  RevenueTargetReport,
  UserActivitySummaryReport
} from '@/components/reports';

const REPORTS = [
  { id: 'stage-summary', name: 'Stages', endpoint: ApiConfig.stageSummery, icon: PieChart, hasFilter: true, requiresLevel: false, filters: ['assignedDate'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: StageSummaryReport },
  { id: 'employee-stages', name: 'Employees', endpoint: ApiConfig.allEmpStages, icon: Users, hasFilter: true, requiresLevel: false, filters: ['assignedDate'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: EmployeeStagesReport },
  { id: 'pool-stages', name: 'Pools', endpoint: ApiConfig.poolWiseStages, icon: Building2, hasFilter: true, requiresLevel: true, filters: ['date'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: PoolStagesReport },
  { id: 'pool-revenue', name: 'Revenue', endpoint: ApiConfig.employeePoolRevenueReport, icon: IndianRupee, hasFilter: true, requiresLevel: true, filters: ['date'], dateFilterOptions: ['month', 'custom'], component: PoolRevenueReport },
  { id: 'revenue-target-report', name: 'Revenue Target', endpoint: ApiConfig.getRevenueTargetReport, icon: IndianRupee, hasFilter: true, requiresLevel: true, filters: ['months'], dateFilterOptions: ['month'], component: RevenueTargetReport },
  { id: 'utilization', name: 'Utilization', endpoint: ApiConfig.employeePoolUtilizationReport, icon: PhoneCall, hasFilter: true, requiresLevel: true, filters: ['date'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: UtilizationReport },
  { id: 'consultant-performance', name: 'Consultants', endpoint: ApiConfig.consultantPerforment, icon: Award, hasFilter: true, requiresLevel: true, filters: ['date'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: ConsultantPerformanceReport },
  { id: 'daily-utilization', name: 'Daily Calls', endpoint: ApiConfig.employeePoolDailyUtilizationReport, icon: Calendar, hasFilter: true, requiresLevel: true, filters: ['date', 'poolId'], dateFilterOptions: ['today', 'custom'], component: DailyUtilizationReport },
  { id: 'source-campaign', name: 'Source Campaign', endpoint: ApiConfig.sourcecampaignstagesummary, icon: BarChart, hasFilter: true, requiresLevel: true, filters: ['date'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: SourceCampaignReport },
  { id: 'source-campaign-revenue', name: 'Revenue by Source', endpoint: ApiConfig.sourcecampaignwiseleadrevenue, icon: IndianRupee, hasFilter: true, requiresLevel: true, filters: ['date', 'stage', 'state'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: SourceCampaignRevenueReport },
  { id: 'salary-sheet', name: 'Salary Sheet', endpoint: ApiConfig.employeeSalarySheetReport, icon: IndianRupee, hasFilter: true, requiresLevel: false, filters: ['date'], dateFilterOptions: ['month', 'custom'], component: SalarySheetReport, permission: { module: 'reports', action: 'salary_sheet' } },
  { id: 'source-campaign-comparison', name: 'Campaign Comparison', endpoint: ApiConfig.getSourceCampaignComparisonReport, icon: BarChart, hasFilter: false, requiresLevel: false, component: SourceCampaignComparisonReport },
  { id: 'user-activity-summary', name: 'User Activity', endpoint: ApiConfig.userActivitySummary, icon: Users, hasFilter: true, requiresLevel: false, filters: ['date', 'user'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: UserActivitySummaryReport },
];

const dateFilterLabels: Record<string, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
  custom: 'Custom Range'
};

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split('-');
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  return date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
};

const buildMonthOptions = (count = 36) => {
  const options: { value: string; label: string }[] = [];
  const base = new Date();
  for (let i = 0; i < count; i += 1) {
    const date = new Date(Date.UTC(base.getFullYear(), base.getMonth() - i, 1));
    const value = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    options.push({
      value,
      label: formatMonthLabel(value),
    });
  }
  return options;
};

export function ReportsPage() {
  const { toast } = useToast();
  const permissions = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('permissions') || '[]');
    } catch {
      return [];
    }
  }, []);
  const visibleReports = useMemo(() => {
    return REPORTS.filter((report: any) => {
      if (!report.permission) return true;
      return hasPermission(permissions, report.permission.module, report.permission.action);
    });
  }, [permissions]);
  
  // State
  const [activeReport, setActiveReport] = useState(() => visibleReports[0]?.id || REPORTS[0].id);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [assignedDateRange, setAssignedDateRange] = useState('today');
  const [assignedDateFrom, setAssignedDateFrom] = useState('');
  const [assignedDateTo, setAssignedDateTo] = useState('');
  const [poolId, setPoolId] = useState('');
  const [levelFilter, setLevelFilter] = useState('1');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([getCurrentMonthKey()]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pools, setPools] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
   const [stageFilter, setStageFilter] = useState('all');  // Add this
  const [stateFilter, setStateFilter] = useState('all'); 
  const monthOptions = useMemo(() => buildMonthOptions(36), []);
  const currentReport = visibleReports.find(r => r.id === activeReport) || visibleReports[0] || REPORTS[0];
  const CurrentComponent = currentReport.component;
  const currentReportRequiresLevel = currentReport.requiresLevel !== false;
  const currentComponentProps: any = {
    data: reportData,
  };

  if (currentReport.id === 'employee-stages') {
    currentComponentProps.searchTerm = searchTerm;
    currentComponentProps.onSearchChange = setSearchTerm;
  }

  // Get default date range for a report
  const getDefaultDateRange = useCallback((reportId: string) => {
    const report = REPORTS.find(r => r.id === reportId);
    if (!report?.hasFilter || !report.dateFilterOptions?.length) return 'today';
    return report.dateFilterOptions.includes('today') ? 'today' : report.dateFilterOptions[0];
  }, []);

  useEffect(() => {
    if (!visibleReports.length) return;
    const currentIsVisible = visibleReports.some((report) => report.id === activeReport);
    if (!currentIsVisible) {
      setActiveReport(visibleReports[0].id);
    }
  }, [activeReport, visibleReports]);

  // Fetch pools
  const fetchPools = useCallback(async () => {
    try {
      const res = await getDataHandlerWithToken('getAllPools', null, null);
      setPools(res?.data || res || []);
    } catch (error) {
      console.error('Failed to load pools');
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getDataHandlerWithToken('getAllUser', null, null);
      setUsers(res?.data || res || []);
    } catch (error) {
      console.error('Failed to load users');
    }
  }, []);

  // Validate date range (max 30 days)
  const validateDateRange = useCallback((from: string, to: string, maxDays = 30): boolean => {
    if (!from || !to) return true;
    
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays + 1 > maxDays) {
      toast({ 
        title: 'Date range too large', 
        description: `Maximum ${maxDays} days allowed. Please select a smaller range.`,
        variant: 'destructive' 
      });
      return false;
    }
    return true;
  }, [toast]);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};

      if (currentReportRequiresLevel) {
        const levelValue = levelFilter.trim() ? Number(levelFilter) : 1;
        if (Number.isNaN(levelValue)) {
          toast({ title: 'Invalid level', description: 'Level must be a number', variant: 'destructive' });
          setReportData(null);
          setLoading(false);
          return;
        }

        params.level = levelValue;
      }

      if (currentReport.filters?.includes('assignedDate')) {
        if (assignedDateRange === 'custom') {
          if (assignedDateFrom || assignedDateTo) {
            const maxDays = currentReport.id === 'daily-utilization' ? 5 : 30;
            const rangeStart = assignedDateFrom || assignedDateTo;
            const rangeEnd = assignedDateTo || assignedDateFrom;
            if (!validateDateRange(rangeStart, rangeEnd, maxDays)) {
              setLoading(false);
              return;
            }
            params.assignedDateFrom = rangeStart;
            params.assignedDateTo = rangeEnd;
          }
        } else {
          params.assignedDateFilter = assignedDateRange;
        }
      } else if (currentReport.id === 'revenue-target-report') {
        const months = selectedMonths.length ? selectedMonths : [getCurrentMonthKey()];
        params.months = months.join(',');
        params.month = months[0];
      } else {
        if (dateRange === 'custom') {
          if (fromDate || toDate) {
            const maxDays = currentReport.id === 'daily-utilization' ? 5 : 30;
            const rangeStart = fromDate || toDate;
            const rangeEnd = toDate || fromDate;
            if (!validateDateRange(rangeStart, rangeEnd, maxDays)) {
              setLoading(false);
              return;
            }
            params.fromDate = rangeStart;
            params.toDate = rangeEnd;
          }
        } else {
          params.dateFilter = dateRange;
        }
        
        if (poolId && poolId !== " " && currentReport.filters?.includes('poolId')) {
          params.poolId = poolId;
        }
        if (stageFilter && stageFilter !== 'all' && currentReport.filters?.includes('stage')) {
          params.stage = stageFilter;
        }
        
        if (stateFilter && stateFilter !== 'all' && currentReport.filters?.includes('state')) {
          params.state = stateFilter;
        }

        if (currentReport.filters?.includes('user') && selectedUserId && selectedUserId !== 'all') {
          params.userId = selectedUserId;
        }
      }
      const response = await getDataHandlerWithToken(currentReport.endpoint, params, null, true);
      setReportData(response?.data || response);
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load report', variant: 'destructive' });
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange, fromDate, toDate, poolId, currentReport, validateDateRange, levelFilter, toast, currentReportRequiresLevel, selectedMonths,assignedDateRange,
  assignedDateFrom,
  assignedDateTo,
]);

  // Export to CSV
  const handleExport = useCallback(() => {
    if (!reportData) {
      toast({ title: 'No data to export' });
      return;
    }
    
    let csvData: any[] = [];
    if (currentReport.id === 'stage-summary' && reportData.report) csvData = reportData.report;
    else if (currentReport.id === 'employee-stages' && reportData.employees) {
      csvData = reportData.employees.flatMap((emp: any) => 
        emp.stages.map((s: any) => ({ employee: emp.employeeName, stage: s.leadStage, count: s.count }))
      );
    } else if (currentReport.id === 'pool-stages' && reportData.poolWiseData) csvData = reportData.poolWiseData;
    else if (currentReport.id === 'pool-revenue' && reportData.employees) {
      csvData = reportData.employees.flatMap((emp: any) =>
        emp.pools?.flatMap((pool: any) =>
          pool.revenueByMonth?.map((rev: any) => ({
            employee: emp.employeeName,
            pool: pool.poolName,
            month: rev.month,
            revenue: rev.revenue
          }))
        )
      );
    } else if (currentReport.id === 'utilization' && reportData.employees) csvData = reportData.employees;
    else if (currentReport.id === 'consultant-performance' && Array.isArray(reportData)) csvData = reportData;
    else if (currentReport.id === 'salary-sheet' && reportData.employees) csvData = reportData.employees;
    else if (currentReport.id === 'revenue-target-report' && reportData.users) {
      csvData = reportData.users.map((user: any) => {
        const flatMonths = (user.months || []).reduce((acc: any, month: any) => {
          const key = String(month.label || month.monthKey || 'month').replace(/[^a-z0-9]+/gi, '_');
          acc[`${key}_target`] = month.target || 0;
          acc[`${key}_achieved`] = month.achieved || 0;
          return acc;
        }, {});

        return {
          employee: user.name,
          employeeId: user.employeeId,
          role: user.roleName,
          ...flatMonths,
          combinedTarget: user.combinedTarget || 0,
          combinedAchieved: user.combinedAchieved || 0,
          combinedRemaining: user.combinedRemaining || 0,
          combinedPercentage: user.combinedPercentage || 0,
        };
      });
    } else if (currentReport.id === 'user-activity-summary' && reportData.users) {
      csvData = reportData.users.map((row: any) => ({
        userId: row.userId,
        name: row.name,
        employeeId: row.employeeId,
        email: row.email,
        mobile: row.mobile,
        totalLeadAssigned: row.totalLeadAssigned,
        totalNewLeadsAssigned: row.totalNewLeadsAssigned,
        totalDialedCalls: row.totalDialedCalls,
        totalAnsweredCalls: row.totalAnsweredCalls,
        totalTalkTime: row.totalTalkTime,
        acceptedOrderCount: row.acceptedOrderCount,
        acceptedRevenue: row.acceptedRevenue,
        pcatRegistered: row.pcatRegistered,
        pcatDone: row.pcatDone,
        sourceCounts: row.sourceCounts?.map((item: any) => `${item.source}:${item.count}`).join('; ') || '',
        sourceCampaignCounts: row.sourceCampaignCounts?.map((item: any) => `${item.campaign}:${item.count}`).join('; ') || '',
        stageChanges: row.stageChanges?.map((item: any) => `${item.stage}:${item.count}`).join('; ') || '',
      }));
    } else csvData = [reportData];

    if (!csvData.length) return toast({ title: 'No data to export' });

    const headers = Object.keys(csvData[0]);
    const csvRows = [headers.join(',')];
    csvData.forEach(row => {
      const values = headers.map(h => String(row[h] || '').replace(/,/g, ' '));
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentReport.id}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  }, [reportData, currentReport.id, toast]);

  // Handle report change
  const handleReportChange = useCallback((reportId: string) => {
    const nextReport = REPORTS.find(r => r.id === reportId) || REPORTS[0];
    setActiveReport(reportId);
    setShowFilters(false);
    setDateRange(getDefaultDateRange(reportId));
    setFromDate('');
    setToDate('');
    setAssignedDateRange(getDefaultDateRange(reportId));
    setAssignedDateFrom('');
    setAssignedDateTo('');
    setPoolId('');
    setLevelFilter(nextReport.requiresLevel === false ? '' : '1');
    setSelectedMonths([getCurrentMonthKey()]);
    setSelectedUserId('all');
    setStageFilter('all');
    setStateFilter('all');
    setSearchTerm('');
    setReportData(null);
  }, [getDefaultDateRange]);

  // Handle date range change
  const handleDateRangeChange = useCallback((value: string) => {
    setDateRange(value);
    if (value !== 'custom') {
      setFromDate('');
      setToDate('');
    }
  }, []);

  const handleAssignedDateRangeChange = useCallback((value: string) => {
    setAssignedDateRange(value);
    if (value !== 'custom') {
      setAssignedDateFrom('');
      setAssignedDateTo('');
    }
  }, []);

  // Handle from date change
  const handleFromDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFromDate(value);
    if (toDate && value > toDate) {
      setToDate(value);
    }
  }, [toDate]);

  // Handle to date change
  const handleToDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setToDate(value);
    if (fromDate && value < fromDate) {
      setFromDate(value);
    }
  }, [fromDate]);

  // Handle assigned from date change
  const handleAssignedDateFromChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAssignedDateFrom(value);
    if (assignedDateTo && value > assignedDateTo) {
      setAssignedDateTo(value);
    }
  }, [assignedDateTo]);

  // Handle assigned to date change
  const handleAssignedDateToChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAssignedDateTo(value);
    if (assignedDateFrom && value < assignedDateFrom) {
      setAssignedDateFrom(value);
    }
  }, [assignedDateFrom]);

  // Handle pool change
  const handlePoolChange = useCallback((value: string) => {
    setPoolId(value);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPools();
    fetchUsers();
  }, [fetchPools, fetchUsers]);

  // Fetch report when dependencies change
  useEffect(() => {
    if (currentReport.hasFilter) {
      fetchReport();
    } else {
      fetchReport();
    }
  }, [activeReport, dateRange, fromDate, toDate, poolId, fetchReport, currentReport.hasFilter]);

  // Check if filters are active
  const hasFiltersActive = () => {
    if (currentReport.id === 'revenue-target-report') {
      const defaultMonths = [getCurrentMonthKey()];
      if (selectedMonths.length !== defaultMonths.length) return true;
      if (selectedMonths[0] !== defaultMonths[0]) return true;
      if (currentReportRequiresLevel && levelFilter.trim() && levelFilter.trim() !== '1') return true;
      return false;
    }

    const defaultRange = getDefaultDateRange(activeReport);
    if (currentReport.filters?.includes('assignedDate')) {
      if (assignedDateRange !== defaultRange) return true;
      if (assignedDateRange === 'custom' && (assignedDateFrom || assignedDateTo)) return true;
    } else {
      if (dateRange !== defaultRange) return true;
      if (dateRange === 'custom' && (fromDate || toDate)) return true;
    }

    if (poolId && poolId !== " ") return true;
    if (currentReport.filters?.includes('user') && selectedUserId !== 'all') return true;
    if (currentReportRequiresLevel && levelFilter.trim() && levelFilter.trim() !== '1') return true;
    return false;
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="text-xs text-muted-foreground">Analytics & performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={fetchReport} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            <span className="ml-1 text-xs">Refresh</span>
          </Button>
          <Button size="sm" onClick={handleExport} disabled={!reportData || loading}>
            <Download className="h-3 w-3 mr-1" />
            <span className="text-xs">Export</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeReport} onValueChange={handleReportChange} className="space-y-3">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          {visibleReports.map((report) => {
            const Icon = report.icon;
            return (
              <TabsTrigger key={report.id} value={report.id} className="gap-1.5 px-3 py-1.5 text-xs">
                <Icon className="h-3 w-3" />
                {report.name}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeReport} className="space-y-3">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {currentReportRequiresLevel && (
              <div className="w-[130px]">
                <Input
                  type="number"
                  min="1"
                  placeholder="Level"
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            )}
            {currentReport.hasFilter && (
              <>
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-1 h-8 text-xs"
                >
                  <Filter className="h-3 w-3" />
                  Filters
                  {hasFiltersActive() && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">•</Badge>}
                </Button>

                {showFilters && (
                  <div className="flex flex-wrap items-center gap-2">
                    {currentReport.id === 'revenue-target-report' ? (
                      <div className="w-[320px]">
                        <MultiSelect
                          options={monthOptions}
                          selected={selectedMonths}
                          onChange={setSelectedMonths}
                          placeholder="Select months"
                          searchPlaceholder="Search month..."
                          emptyMessage="No months found"
                          maxDisplay={2}
                        />
                      </div>
                    ) : (
                      <>
                        {currentReport.filters?.includes('assignedDate') ? (
                          <>
                            <div className="w-[130px]">
                              <Select value={assignedDateRange} onValueChange={handleAssignedDateRangeChange}>
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Assigned Date" />
                                </SelectTrigger>
                                <SelectContent>
                                  {currentReport.dateFilterOptions.map((option) => (
                                    <SelectItem key={option} value={option} className="text-xs">
                                      {dateFilterLabels[option]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {assignedDateRange === 'custom' && (
                              <>
                                <div className="relative w-[130px]">
                                  <input
                                    type="date"
                                    value={assignedDateFrom}
                                    onChange={handleAssignedDateFromChange}
                                    className="w-full h-8 px-2 text-xs border rounded-md bg-background cursor-pointer"
                                    style={{ fontFamily: 'inherit' }}
                                  />
                                </div>
                                <div className="relative w-[130px]">
                                  <input
                                    type="date"
                                    value={assignedDateTo}
                                    onChange={handleAssignedDateToChange}
                                    className="w-full h-8 px-2 text-xs border rounded-md bg-background cursor-pointer"
                                    style={{ fontFamily: 'inherit' }}
                                  />
                                </div>
                                {currentReport.id === 'pool-revenue' && (assignedDateFrom || assignedDateTo) && (
                                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                    Max 30 days
                                  </span>
                                )}
                                {currentReport.id === 'daily-utilization' && (assignedDateFrom || assignedDateTo) && (
                                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                    Max 5 days
                                  </span>
                                )}
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="w-[130px]">
                              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {currentReport.dateFilterOptions.map((option) => (
                                    <SelectItem key={option} value={option} className="text-xs">
                                      {dateFilterLabels[option]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {dateRange === 'custom' && (
                              <>
                                <div className="relative w-[130px]">
                                  <input
                                    type="date"
                                    value={fromDate}
                                    onChange={handleFromDateChange}
                                    className="w-full h-8 px-2 text-xs border rounded-md bg-background cursor-pointer"
                                    style={{ fontFamily: 'inherit' }}
                                  />
                                </div>
                                <div className="relative w-[130px]">
                                  <input
                                    type="date"
                                    value={toDate}
                                    onChange={handleToDateChange}
                                    className="w-full h-8 px-2 text-xs border rounded-md bg-background cursor-pointer"
                                    style={{ fontFamily: 'inherit' }}
                                  />
                                </div>
                                {currentReport.id === 'pool-revenue' && (fromDate || toDate) && (
                                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                    Max 30 days
                                  </span>
                                )}
                                {currentReport.id === 'daily-utilization' && (fromDate || toDate) && (
                                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                    Max 5 days
                                  </span>
                                )}
                              </>
                            )}
                          </>
                        )}

                        {currentReport.filters?.includes('poolId') && pools.length > 0 && (
                          <div className="w-[130px]">
                            <Select value={poolId} onValueChange={handlePoolChange}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="All Pools" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value=" " className="text-xs">All Pools</SelectItem>
                                {pools.map((p: any) => (
                                  <SelectItem key={p._id} value={p._id} className="text-xs">
                                    {p.name || p.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {currentReport.filters?.includes('user') && (
                          <div className="w-[220px]">
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="All Users" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all" className="text-xs">All Users</SelectItem>
                                {users.map((user: any) => (
                                  <SelectItem key={user._id || user.userId || user.id} value={user._id || user.userId || user.id} className="text-xs">
                                    {user.name || user.fullName || user.email}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                {showFilters && currentReport.filters?.includes('stage') && (
                  <div className="w-[130px]">
                    <Select value={stageFilter} onValueChange={setStageFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All Stages" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">All Stages</SelectItem>
                        <SelectItem value="new" className="text-xs">New Lead</SelectItem>
                        <SelectItem value="dnp" className="text-xs">DNP</SelectItem>
                        <SelectItem value="cbl" className="text-xs">CBL</SelectItem>
                        <SelectItem value="negotiation" className="text-xs">Negotiation Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {showFilters && currentReport.filters?.includes('state') && (
                  <div className="w-[130px]">
                    <Select value={stateFilter} onValueChange={setStateFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All States" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">All States</SelectItem>
                        <SelectItem value="maharashtra" className="text-xs">Maharashtra</SelectItem>
                        <SelectItem value="delhi" className="text-xs">Delhi</SelectItem>
                        <SelectItem value="karnataka" className="text-xs">Karnataka</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Report Content */}
          <Card className="border">
            <CardContent className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !reportData ? (
                <div className="text-center py-12">
                  <BarChart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {currentReportRequiresLevel
                      ? 'No data available for the selected level and filters.'
                      : 'No data available for the selected filters.'}
                  </p>
                  <Button onClick={fetchReport} variant="outline" size="sm" className="mt-3 text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Load Data
                  </Button>
                </div>
              ) : (
                <CurrentComponent {...currentComponentProps} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


