import { useEffect, useState } from 'react';
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
} from '@/components/reports';

const REPORTS = [
  { id: 'stage-summary', name: 'Stages', endpoint: ApiConfig.stageSummery, icon: PieChart, hasFilter: true, filters: ['date'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: StageSummaryReport },
  { id: 'employee-stages', name: 'Employees', endpoint: ApiConfig.allEmpStages, icon: Users, hasFilter: false, component: EmployeeStagesReport },
  { id: 'pool-stages', name: 'Pools', endpoint: ApiConfig.poolWiseStages, icon: Building2, hasFilter: true, filters: ['date'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: PoolStagesReport },
  { id: 'pool-revenue', name: 'Revenue', endpoint: ApiConfig.employeePoolRevenueReport, icon: IndianRupee, hasFilter: true, filters: ['date'], dateFilterOptions: ['month', 'custom'], component: PoolRevenueReport },
  { id: 'utilization', name: 'Utilization', endpoint: ApiConfig.employeePoolUtilizationReport, icon: PhoneCall, hasFilter: true, filters: ['date'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: UtilizationReport },
  { id: 'consultant-performance', name: 'Consultants', endpoint: ApiConfig.consultantPerforment, icon: Award, hasFilter: true, filters: ['date'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: ConsultantPerformanceReport },
  { id: 'daily-utilization', name: 'Daily Calls', endpoint: ApiConfig.employeePoolDailyUtilizationReport, icon: Calendar, hasFilter: true, filters: ['date', 'poolId'], dateFilterOptions: ['today', 'week', 'month', 'year', 'custom'], component: DailyUtilizationReport },
];

// Date filter options mapping
const dateFilterLabels: Record<string, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
  custom: 'Custom Range'
};

export function ReportsPage() {
  const { toast } = useToast();
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

  const currentReport = REPORTS.find(r => r.id === activeReport) || REPORTS[0];
  const CurrentComponent = currentReport.component;

  // Reset date range when switching to revenue tab
  useEffect(() => {
    if (currentReport.id === 'pool-revenue') {
      // For revenue tab, default to 'month' if current selection is not allowed
      if (!currentReport.dateFilterOptions.includes(dateRange)) {
        setDateRange('month');
      }
    }
  }, [activeReport]);

  useEffect(() => {
    fetchPools();
  }, [activeReport]);

  const fetchPools = async () => {
    try {
      const res = await getDataHandlerWithToken('getAllPools', null, null);
      setPools(res?.data || res || []);
    } catch (error) {
      console.error('Failed to load pools');
    }
  };

  // Validate date range (max 30 days)
  const validateDateRange = (from: string, to: string): boolean => {
    if (!from || !to) return true;
    
    const fromDateObj = new Date(from);
    const toDateObj = new Date(to);
    const diffTime = Math.abs(toDateObj.getTime() - fromDateObj.getTime());
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
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = {};
      
      // For custom date range, validate first
      if (dateRange === 'custom') {
        if (fromDate && toDate) {
          if (!validateDateRange(fromDate, toDate)) {
            setLoading(false);
            return;
          }
          params.fromDate = fromDate;
          params.toDate = toDate;
        } else if (fromDate || toDate) {
          // If only one date is selected, show error
          toast({ 
            title: 'Invalid date range', 
            description: 'Please select both from and to dates',
            variant: 'destructive' 
          });
          setLoading(false);
          return;
        }
      } else {
        params.dateFilter = dateRange;
      }
      
      if (poolId && poolId !== " " && currentReport.filters?.includes('poolId')) {
        params.poolId = poolId;
      }
      
      const response = await getDataHandlerWithToken(currentReport.endpoint, params, null, true);
      setReportData(response?.data || response);
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load report', variant: 'destructive' });
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
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
  };
  
  useEffect(() => {
    if (!currentReport.hasFilter) {
      fetchReport();
    }
  }, [activeReport]);
  
  useEffect(() => {
    if (currentReport.hasFilter) {
      fetchReport();
    }
  }, [dateRange, fromDate, toDate, poolId]);

  // Check if any filters are active
  const hasFilters = () => {
    if (dateRange !== 'month') return true;
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
      <Tabs value={activeReport} onValueChange={setActiveReport} className="space-y-3">
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
          {/* Filter Bar - Only show for reports that have filters */}
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
                {hasFilters() && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">•</Badge>}
              </Button>
              
              {showFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Date Range Selector with dynamic options based on report */}
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="h-8 w-[130px] text-xs">
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
                  
                  {/* Custom Date Range Inputs */}
                  {dateRange === 'custom' && (
                    <>
                      <Input 
                        type="date" 
                        value={fromDate} 
                        onChange={(e) => setFromDate(e.target.value)} 
                        className="h-8 w-[130px] text-xs" 
                      />
                      <Input 
                        type="date" 
                        value={toDate} 
                        onChange={(e) => setToDate(e.target.value)} 
                        className="h-8 w-[130px] text-xs" 
                      />
                      {/* Show max days warning for revenue tab */}
                      {currentReport.id === 'pool-revenue' && (fromDate || toDate) && (
                        <span className="text-[10px] text-muted-foreground">
                          Max 30 days
                        </span>
                      )}
                    </>
                  )}
                  
                  {/* Pool Filter */}
                  {currentReport.filters?.includes('poolId') && pools.length > 0 && (
                    <Select value={poolId} onValueChange={setPoolId}>
                      <SelectTrigger className="h-8 w-[130px] text-xs">
                        <SelectValue placeholder="All Pools" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" " className="text-xs">All Pools</SelectItem>
                        {pools.map((p: any) => (
                          <SelectItem key={p._id} value={p._id} className="text-xs">{p.name || p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
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
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}