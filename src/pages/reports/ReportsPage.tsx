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
  { id: 'stage-summary', name: 'Stages', endpoint: ApiConfig.stageSummery, icon: PieChart,hasFilter:true, filters: ['date'], component: StageSummaryReport },
  { id: 'employee-stages', name: 'Employees', endpoint: ApiConfig.allEmpStages, icon: Users,hasFilter:false, component: EmployeeStagesReport },
  { id: 'pool-stages', name: 'Pools', endpoint: ApiConfig.poolWiseStages, icon: Building2,hasFilter:true, filters: ['date'], component: PoolStagesReport },
  { id: 'pool-revenue', name: 'Revenue', endpoint: ApiConfig.employeePoolRevenueReport, icon: IndianRupee,hasFilter:true, filters: ['date'], component: PoolRevenueReport },
  { id: 'utilization', name: 'Utilization', endpoint: ApiConfig.employeePoolUtilizationReport, icon: PhoneCall,hasFilter:true, filters: ['date'], component: UtilizationReport },
  { id: 'consultant-performance', name: 'Consultants', endpoint: ApiConfig.consultantPerforment, icon: Award,hasFilter:true, filters: ['date'], component: ConsultantPerformanceReport },
  { id: 'daily-utilization', name: 'Daily Calls', endpoint: ApiConfig.employeePoolDailyUtilizationReport, icon: Calendar,hasFilter:true, filters: ['date', 'poolId'], component: DailyUtilizationReport },
];

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

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateRange === 'custom') {
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
      } else if (dateRange !== 'month') {
        params.dateFilter = dateRange;
      }
      if (!poolId ==" " && currentReport.filters.includes('poolId')) params.poolId = poolId;
      
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
    else if (currentReport.id === 'utilization' && reportData.employees) csvData = reportData.employees;
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
    if (!currentReport.hasFilters) {
      fetchReport();
    }
  }, [activeReport]);
  
  useEffect(() => {
  fetchReport();
}, [dateRange, fromDate, toDate, poolId]);

  const hasFilters = dateRange !== 'month' || (dateRange === 'custom' && (fromDate || toDate)) || poolId;

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
              {hasFilters && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">•</Badge>}
            </Button>
            
            {showFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="h-8 w-[110px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today" className="text-xs">Today</SelectItem>
                    <SelectItem value="week" className="text-xs">This Week</SelectItem>
                    <SelectItem value="month" className="text-xs">This Month</SelectItem>
                    <SelectItem value="year" className="text-xs">This Year</SelectItem>
                    <SelectItem value="custom" className="text-xs">Custom</SelectItem>
                  </SelectContent>
                </Select>
                
                {dateRange === 'custom' && (
                  <>
                    <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8 w-[130px] text-xs" />
                    <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8 w-[130px] text-xs" />
                  </>
                )}
                
                {currentReport.filters.includes('poolId') && pools.length > 0 && (
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