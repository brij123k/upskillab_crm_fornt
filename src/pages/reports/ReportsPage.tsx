import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Download, RefreshCw, Filter,
  PieChart, Users, PhoneCall, BarChart,
  IndianRupee, Building2, Calendar, Award
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { useToast } from '@/hooks/use-toast';

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
  SourceCampaignComparisonReport
} from '@/components/reports';

const REPORTS = [
  { id: 'stage-summary', name: 'Stages', endpoint: ApiConfig.stageSummery, icon: PieChart, hasFilter: true, filters: ['date'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: StageSummaryReport },
  { id: 'employee-stages', name: 'Employees', endpoint: ApiConfig.allEmpStages, icon: Users, hasFilter: false, component: EmployeeStagesReport },
  { id: 'pool-stages', name: 'Pools', endpoint: ApiConfig.poolWiseStages, icon: Building2, hasFilter: true, filters: ['date'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: PoolStagesReport },
  { id: 'pool-revenue', name: 'Revenue', endpoint: ApiConfig.employeePoolRevenueReport, icon: IndianRupee, hasFilter: true, filters: ['date'], dateFilterOptions: ['month', 'custom'], component: PoolRevenueReport },
  { id: 'utilization', name: 'Utilization', endpoint: ApiConfig.employeePoolUtilizationReport, icon: PhoneCall, hasFilter: true, filters: ['date'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: UtilizationReport },
  { id: 'consultant-performance', name: 'Consultants', endpoint: ApiConfig.consultantPerforment, icon: Award, hasFilter: true, filters: ['date'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: ConsultantPerformanceReport },
  { id: 'daily-utilization', name: 'Daily Calls', endpoint: ApiConfig.employeePoolDailyUtilizationReport, icon: Calendar, hasFilter: true, filters: ['date', 'poolId'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: DailyUtilizationReport },
  { id: 'source-campaign', name: 'Source Campaign', endpoint: ApiConfig.sourcecampaignstagesummary, icon: BarChart, hasFilter: true, filters: ['date'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: SourceCampaignReport },
   { id: 'source-campaign-revenue', name: 'Revenue by Source', endpoint: ApiConfig.sourcecampaignwiseleadrevenue, icon: IndianRupee, hasFilter: true, filters: ['date', 'stage', 'state'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: SourceCampaignRevenueReport },
  { id: 'source-campaign-comparison', name: 'Campaign Comparison', endpoint: ApiConfig.getSourceCampaignComparisonReport, icon: BarChart, hasFilter: false, component: SourceCampaignComparisonReport },
];

const dateFilterLabels: Record<string, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
  custom: 'Custom Range'
};

export function ReportsPage() {
  const { toast } = useToast();
  
  // State
  const [activeReport, setActiveReport] = useState(REPORTS[0].id);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [poolId, setPoolId] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pools, setPools] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
   const [stageFilter, setStageFilter] = useState('all');  // Add this
  const [stateFilter, setStateFilter] = useState('all'); 
  const currentReport = REPORTS.find(r => r.id === activeReport) || REPORTS[0];
  const CurrentComponent = currentReport.component;

  // Get default date range for a report
  const getDefaultDateRange = useCallback((reportId: string) => {
    const report = REPORTS.find(r => r.id === reportId);
    if (!report?.hasFilter || !report.dateFilterOptions?.length) return 'today';
    return report.dateFilterOptions.includes('today') ? 'today' : report.dateFilterOptions[0];
  }, []);

  // Fetch pools
  const fetchPools = useCallback(async () => {
    try {
      const res = await getDataHandlerWithToken('getAllPools', null, null);
      setPools(res?.data || res || []);
    } catch (error) {
      console.error('Failed to load pools');
    }
  }, []);

  // Validate date range (max 30 days)
  const validateDateRange = useCallback((from: string, to: string): boolean => {
    if (!from || !to) return true;
    
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 30) {
      toast({ 
        title: 'Date range too large', 
        description: 'Maximum 30 days allowed. Please select a smaller range.',
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
      
      if (dateRange === 'custom') {
        if (fromDate && toDate) {
          if (!validateDateRange(fromDate, toDate)) {
            setLoading(false);
            return;
          }
          params.fromDate = fromDate;
          params.toDate = toDate;
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
      
      // Add state filter if applicable
      if (stateFilter && stateFilter !== 'all' && currentReport.filters?.includes('state')) {
        params.state = stateFilter;
      }
      const response = await getDataHandlerWithToken(currentReport.endpoint, params, null, true);
      setReportData(response?.data || response);
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load report', variant: 'destructive' });
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange, fromDate, toDate, poolId, currentReport, validateDateRange, toast]);

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
    else csvData = [reportData];
    
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
    setActiveReport(reportId);
    setShowFilters(false);
    setDateRange(getDefaultDateRange(reportId));
    setFromDate('');
    setToDate('');
    setPoolId('');
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

  // Handle pool change
  const handlePoolChange = useCallback((value: string) => {
    setPoolId(value);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

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
    const defaultRange = getDefaultDateRange(activeReport);
    if (dateRange !== defaultRange) return true;
    if (dateRange === 'custom' && (fromDate || toDate)) return true;
    if (poolId && poolId !== " ") return true;
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
          {REPORTS.map((report) => {
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
          {currentReport.hasFilter && (
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                variant={showFilters ? "default" : "outline"} 
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
                  {/* Date Range Select */}
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
                  
                  {/* Custom Date Range */}
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
                    </>
                  )}
                  
                  {/* Pool Filter */}
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
          {/* Add your stage options here - you can fetch these from API */}
          <SelectItem value="new" className="text-xs">New Lead</SelectItem>
          <SelectItem value="dnp" className="text-xs">DNP</SelectItem>
          <SelectItem value="cbl" className="text-xs">CBL</SelectItem>
          <SelectItem value="negotiation" className="text-xs">Negotiation Done</SelectItem>
          {/* Add more stages as needed */}
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
          {/* Add your state options here - you can fetch these from API */}
          <SelectItem value="maharashtra" className="text-xs">Maharashtra</SelectItem>
          <SelectItem value="delhi" className="text-xs">Delhi</SelectItem>
          <SelectItem value="karnataka" className="text-xs">Karnataka</SelectItem>
          {/* Add more states as needed */}
        </SelectContent>
      </Select>
    </div>
  )}
            </div>
          )}

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
                  <p className="text-sm text-muted-foreground">No data available</p>
                  <Button onClick={fetchReport} variant="outline" size="sm" className="mt-3 text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Load Data
                  </Button>
                </div>
              ) : (
                <CurrentComponent 
      data={reportData} 
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      stageFilter={stageFilter}
      onStageFilterChange={setStageFilter}
      stateFilter={stateFilter}
      onStateFilterChange={setStateFilter}
    />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
