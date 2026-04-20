import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, Download, RefreshCw, Filter, ChevronUp, ChevronDown,
  PieChart, Users, TrendingUp, DollarSign, PhoneCall, BarChart, UserCheck, Calendar,
  Award, Target, Clock, CheckCircle, XCircle, Phone, PhoneIncoming, Timer,
  IndianRupee, UserPlus, Building2, CalendarDays, TrendingDown, Zap
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { useToast } from '@/hooks/use-toast';

const REPORTS = [
  {
    id: 'stage-summary',
    name: 'Lead Stage Summary',
    shortName: 'Stages',
    endpoint: ApiConfig.stageSummery,
    description: 'Lead distribution across different stages',
    icon: PieChart,
    color: 'from-purple-500 to-pink-500',
    filters: ['date', 'status', 'source', 'stageId', 'poolId', 'assignedTo', 'counsellorId'],
  },
  {
    id: 'employee-stages',
    name: 'Employee Stage Performance',
    shortName: 'Emp Stages',
    endpoint: ApiConfig.allEmpStages,
    description: 'Lead stage breakdown by employee',
    icon: Users,
    color: 'from-blue-500 to-cyan-500',
    filters: ['date', 'counsellorId'],
  },
  {
    id: 'pool-stages',
    name: 'Pool Wise Stages',
    shortName: 'Pool Stages',
    endpoint: ApiConfig.poolWiseStages,
    description: 'Lead distribution across pools',
    icon: Building2,
    color: 'from-green-500 to-emerald-500',
    filters: ['date'],
  },
  {
    id: 'pool-revenue',
    name: 'Revenue by Pool',
    shortName: 'Revenue',
    endpoint: ApiConfig.employeePoolRevenueReport,
    description: 'Revenue breakdown by employee and pool',
    icon: IndianRupee,
    color: 'from-yellow-500 to-orange-500',
    filters: ['date', 'poolId', 'counsellorId'],
  },
  {
    id: 'utilization',
    name: 'Employee Utilization',
    shortName: 'Utilization',
    endpoint: ApiConfig.employeePoolUtilizationReport,
    description: 'Employee performance metrics',
    icon: PhoneCall,
    color: 'from-red-500 to-rose-500',
    filters: ['date', 'poolId'],
  },
  {
    id: 'consultant-performance',
    name: 'Consultant Performance',
    shortName: 'Consultants',
    endpoint: ApiConfig.consultantPerforment,
    description: 'Revenue and achievement metrics',
    icon: Award,
    color: 'from-indigo-500 to-violet-500',
    filters: ['date', 'counsellorId'],
  },
//   {
//     id: 'daily-utilization',
//     name: 'Daily Call Activity',
//     shortName: 'Daily Calls',
//     endpoint: ApiConfig.employeePoolDailyUtilizationReport,
//     description: 'Daily call metrics by employee',
//     icon: Calendar,
//     color: 'from-teal-500 to-green-500',
//     filters: ['date', 'poolId'],
//   },
];

const dateFilterOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

export function ReportsPage() {
  const { toast } = useToast();
  const [activeReport, setActiveReport] = useState(REPORTS[0].id);
  const [showFilters, setShowFilters] = useState(true);
  
  const [dateFilter, setDateFilter] = useState('month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [poolId, setPoolId] = useState('');
  const [counsellorId, setCounsellorId] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [stageId, setStageId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pools, setPools] = useState<any[]>([]);
  const [counsellors, setCounsellors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const currentReport = REPORTS.find(r => r.id === activeReport) || REPORTS[0];

  const fetchFilters = async () => {
    try {
      const [poolRes, userRes] = await Promise.all([
        getDataHandlerWithToken('getAllPools', null, null),
        getDataHandlerWithToken('getAllProfile', null, null)
      ]);
      setPools(poolRes?.data || poolRes || []);
      setCounsellors(userRes?.data || userRes || []);
    } catch (error) {
      console.error('Failed to load filters:', error);
    }
  };

  const buildQueryParams = () => {
    const params: any = {};
    if (dateFilter === 'custom') {
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
    } else if (dateFilter !== 'month') {
      params.dateFilter = dateFilter;
    }
    if (poolId && currentReport.filters.includes('poolId')) params.poolId = poolId;
    if (counsellorId && currentReport.filters.includes('counsellorId')) params.counsellorId = counsellorId;
    if (status && currentReport.filters.includes('status')) params.status = status;
    if (source && currentReport.filters.includes('source')) params.source = source;
    if (stageId && currentReport.filters.includes('stageId')) params.stageId = stageId;
    if (assignedTo && currentReport.filters.includes('assignedTo')) params.assignedTo = assignedTo;
    return params;
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = buildQueryParams();
      const response = await getDataHandlerWithToken(currentReport.endpoint, params, null, true);
      const data = response?.data || response;
      setReportData(data);
    } catch (error: any) {
      console.error('Report failed:', error);
      toast({ title: 'Error', description: error?.message || 'Failed to load report', variant: 'destructive' });
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData) {
      toast({ title: 'No data', description: 'Run report first' });
      return;
    }
    
    let csvData: any[] = [];
    
    if (currentReport.id === 'stage-summary' && reportData.report) {
      csvData = reportData.report;
    } else if (currentReport.id === 'employee-stages' && reportData.employees) {
      csvData = reportData.employees.flatMap((emp: any) => 
        emp.stages.map((stage: any) => ({
          employeeName: emp.employeeName,
          employeeEmail: emp.employeeEmail,
          totalLead: emp.totalLead,
          leadStage: stage.leadStage,
          count: stage.count
        }))
      );
    } else if (currentReport.id === 'pool-stages' && reportData.poolWiseData) {
      csvData = reportData.poolWiseData;
    } else if (currentReport.id === 'pool-revenue' && reportData.employees) {
      csvData = reportData.employees.flatMap((emp: any) =>
        emp.pools.flatMap((pool: any) =>
          pool.revenueByMonth.map((rev: any) => ({
            employeeName: emp.employeeName,
            poolName: pool.poolName,
            month: rev.month,
            revenue: rev.revenue
          }))
        )
      );
    } else if (currentReport.id === 'utilization' && reportData.employees) {
      csvData = reportData.employees;
    } else if (currentReport.id === 'consultant-performance' && Array.isArray(reportData)) {
      csvData = reportData;
    } else if (currentReport.id === 'daily-utilization' && reportData.employees) {
      csvData = reportData.employees.flatMap((emp: any) =>
        emp.dailyMetrics.map((metric: any) => ({
          employeeName: emp.employeeName,
          date: metric.date,
          dials: metric.dial,
          answered: metric.answered,
          talkTime: metric.talkTime
        }))
      );
    }
    
    if (!csvData.length) {
      toast({ title: 'No data to export' });
      return;
    }
    
    const headers = Object.keys(csvData[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of csvData) {
      const values = headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        return String(val).replace(/,/g, ' ');
      });
      csvRows.push(values.join(','));
    }
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentReport.id}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export complete' });
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [activeReport]);

  const activeFilterCount = [fromDate, toDate, poolId, counsellorId, status, source, stageId, assignedTo].filter(Boolean).length;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format time (seconds to minutes)
  const formatTime = (seconds: number) => {
    if (!seconds) return '0 min';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };

  // Filter employees by search
  const filteredEmployees = (employees: any[]) => {
    if (!searchTerm) return employees;
    return employees.filter((emp: any) => 
      emp.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const renderStageSummary = () => {
    if (!reportData?.report) return null;
    const total = reportData.totalLead;
    const stages = reportData.report;
    
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Leads</p>
                  <p className="text-3xl font-bold mt-1">{total}</p>
                </div>
                <Users className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unique Stages</p>
                  <p className="text-2xl font-bold mt-1">{stages.length}</p>
                </div>
                <PieChart className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Highest Stage</p>
                  <p className="text-lg font-bold mt-1 truncate">{stages.sort((a,b) => b.count - a.count)[0]?.leadStage}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold mt-1">
                    {((stages.find(s => s.leadStage === 'Registration Done')?.count || 0) / total * 100).toFixed(1)}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stages.map((item: any, idx: number) => {
            const percentage = (item.count / total) * 100;
            let colorClass = '';
            if (item.leadStage === 'New Lead') colorClass = 'from-blue-500 to-cyan-500';
            else if (item.leadStage === 'PCAT Schedule') colorClass = 'from-purple-500 to-pink-500';
            else if (item.leadStage === 'PCAT Done') colorClass = 'from-indigo-500 to-purple-500';
            else if (item.leadStage === 'Registration Done') colorClass = 'from-green-500 to-emerald-500';
            else if (item.leadStage === 'Lost') colorClass = 'from-red-500 to-rose-500';
            else colorClass = 'from-gray-500 to-gray-600';
            
            return (
              <Card key={idx} className="overflow-hidden">
                <div className={`bg-gradient-to-r ${colorClass} h-2`} />
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{item.leadStage}</h3>
                      <p className="text-2xl font-bold mt-1">{item.count}</p>
                    </div>
                    <Badge variant="outline">{percentage.toFixed(1)}%</Badge>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderEmployeeStages = () => {
    if (!reportData?.employees) return null;
    const employees = filteredEmployees(reportData.employees);
    
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Leads</p>
                  <p className="text-3xl font-bold">{reportData.totalLeads}</p>
                </div>
                <Users className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{reportData.totalEmployees}</p>
                </div>
                <UserCheck className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Leads/Employee</p>
                  <p className="text-2xl font-bold">{(reportData.totalLeads / reportData.totalEmployees).toFixed(0)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Input
            placeholder="Search employee by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Employee Cards */}
        <div className="space-y-4">
          {employees.map((emp: any, idx: number) => {
            const topStages = emp.stages.sort((a,b) => b.count - a.count).slice(0, 3);
            return (
              <Card key={idx} className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div>
                      <CardTitle className="text-lg">{emp.employeeName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{emp.employeeEmail}</p>
                    </div>
                    <Badge variant="secondary" className="w-fit">
                      Total: {emp.totalLead} leads
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {topStages.map((stage: any, sIdx: number) => (
                      <div key={sIdx} className="flex justify-between items-center p-2 rounded-lg bg-muted/20">
                        <span className="text-sm">{stage.leadStage}</span>
                        <Badge variant="outline">{stage.count}</Badge>
                      </div>
                    ))}
                    {emp.stages.length > 3 && (
                      <div className="flex justify-between items-center p-2 rounded-lg bg-muted/20">
                        <span className="text-sm">Other stages</span>
                        <Badge variant="outline">{emp.stages.length - 3}</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPoolStages = () => {
    if (!reportData?.poolWiseData) return null;
    const pools = reportData.poolWiseData;
    const totalLeads = pools.reduce((sum: number, p: any) => sum + p.totalLead, 0);
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Leads</p>
                  <p className="text-3xl font-bold">{totalLeads}</p>
                </div>
                <Building2 className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Pools</p>
                  <p className="text-2xl font-bold">{pools.length}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Coverage</p>
                  <p className="text-2xl font-bold">
                    {(pools.reduce((sum: number, p: any) => sum + parseFloat(p.coverage || '0'), 0) / pools.length).toFixed(1)}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pools.map((pool: any, idx: number) => (
            <Card key={idx} className="overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-1" />
              <CardHeader>
                <CardTitle className="text-lg">{pool.poolName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Leads</span>
                    <span className="font-bold text-xl">{pool.totalLead}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">CBL</span>
                    <span>{pool.CBL || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Negotiation Done</span>
                    <span>{pool.negotiationDone || 0}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-muted-foreground">Coverage</span>
                    <Badge variant={parseFloat(pool.coverage) > 10 ? "default" : "secondary"}>
                      {pool.coverage}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderPoolRevenue = () => {
    if (!reportData?.employees) return null;
    const employees = filteredEmployees(reportData.employees);
    const totalRevenue = employees.reduce((sum: number, emp: any) => 
      sum + emp.pools.reduce((s: number, p: any) => 
        s + (p.revenueByMonth[0]?.revenue || 0), 0), 0);
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                </div>
                <IndianRupee className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Employees</p>
                  <p className="text-2xl font-bold">{employees.filter((e: any) => e.pools.length).length}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Month</p>
                  <p className="text-xl font-bold">{reportData.months?.[0] || '-'}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {employees.map((emp: any, idx: number) => (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{emp.employeeName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{emp.employeeEmail}</p>
                  </div>
                  <Badge variant="outline" className="text-lg">
                    {formatCurrency(emp.pools.reduce((s: number, p: any) => s + (p.revenueByMonth[0]?.revenue || 0), 0))}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {emp.pools.map((pool: any, pIdx: number) => (
                    <div key={pIdx} className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                      <span className="text-sm font-medium">{pool.poolName}</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(pool.revenueByMonth[0]?.revenue || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderUtilization = () => {
    if (!reportData?.employees) return null;
    const employees = filteredEmployees(reportData.employees);
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-red-500 to-rose-500 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Employees</p>
                  <p className="text-2xl font-bold">{employees.length}</p>
                </div>
                <Users className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Dials</p>
                  <p className="text-2xl font-bold">{employees.reduce((s, e) => s + (e.totalDial || 0), 0)}</p>
                </div>
                <Phone className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Talk Time</p>
                  <p className="text-2xl font-bold">{formatTime(employees.reduce((s, e) => s + (e.answeredTalkTime || 0), 0))}</p>
                </div>
                <Timer className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Admissions</p>
                  <p className="text-2xl font-bold">{employees.reduce((s, e) => s + (e.admissionDone || 0), 0)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Dials</TableHead>
                <TableHead className="text-center">Answered</TableHead>
                <TableHead className="text-center">Talk Time</TableHead>
                <TableHead className="text-center">PCAT</TableHead>
                <TableHead className="text-center">Admissions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{emp.employeeName}</div>
                      <div className="text-xs text-muted-foreground">{emp.designation}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{emp.designation}</Badge>
                  </TableCell>
                  <TableCell className="text-center font-mono">{emp.totalDial || 0}</TableCell>
                  <TableCell className="text-center font-mono">{emp.answeredTalkTime ? '✓' : '-'}</TableCell>
                  <TableCell className="text-center font-mono">{formatTime(emp.answeredTalkTime)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-1 justify-center">
                      <Badge variant="secondary" className="text-xs">S: {emp.pcatScheduled || 0}</Badge>
                      <Badge variant="default" className="text-xs">D: {emp.pcatDone || 0}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {emp.admissionDone > 0 ? (
                      <Badge className="bg-green-500">{emp.admissionDone}</Badge>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderConsultantPerformance = () => {
    if (!Array.isArray(reportData)) return null;
    const consultants = filteredEmployees(reportData);
    const totalRevenue = consultants.reduce((sum, c) => sum + (c.bookedRevenue || 0), 0);
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Revenue</p>
                  <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
                </div>
                <IndianRupee className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Realised Revenue</p>
                  <p className="text-xl font-bold">{formatCurrency(consultants.reduce((s, c) => s + (c.realisedRevenue || 0), 0))}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Consultants</p>
                  <p className="text-2xl font-bold">{consultants.filter(c => c.totalLeadAssigned > 0).length}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Admissions</p>
                  <p className="text-2xl font-bold">{consultants.reduce((s, c) => s + (c.admDone || 0), 0)}</p>
                </div>
                <Award className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {consultants.map((cons: any, idx: number) => (
            <Card key={idx} className="overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-1" />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{cons.consultantName}</CardTitle>
                    <p className="text-xs text-muted-foreground">{cons.consultantEmail}</p>
                  </div>
                  <Badge variant={cons.bookedRevenue > 0 ? "default" : "secondary"}>
                    {cons.bookedRevenue > 0 ? formatCurrency(cons.bookedRevenue) : 'No Revenue'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between p-2 rounded bg-muted/20">
                    <span className="text-muted-foreground">Leads:</span>
                    <span className="font-semibold">{cons.totalLeadAssigned}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/20">
                    <span className="text-muted-foreground">Admissions:</span>
                    <span className="font-semibold">{cons.admDone || 0}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/20">
                    <span className="text-muted-foreground">Realised:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(cons.realisedRevenue)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-muted/20">
                    <span className="text-muted-foreground">Unrealised:</span>
                    <span className="font-semibold text-orange-600">{formatCurrency(cons.unrealisedRevenue)}</span>
                  </div>
                </div>
                {cons.lastSalePunchDate && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Last Sale: {new Date(cons.lastSalePunchDate).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderDailyUtilization = () => {
    if (!reportData?.employees || !reportData?.dateStrings) return null;
    const dates = reportData.dateStrings.slice(0, 7);
    const employees = filteredEmployees(reportData.employees).slice(0, 10);
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-teal-500 to-green-500 text-white">
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm opacity-90">Employees Tracked</p>
                  <p className="text-2xl font-bold">{employees.length}</p>
                </div>
                <Users className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Date Range</p>
                  <p className="text-sm font-medium">
                    {new Date(dates[dates.length-1]).toLocaleDateString()} - {new Date(dates[0]).toLocaleDateString()}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Dials (7 days)</p>
                  <p className="text-2xl font-bold">
                    {employees.reduce((sum, e) => sum + e.dailyMetrics.reduce((s, m) => s + (m.dial || 0), 0), 0)}
                  </p>
                </div>
                <PhoneCall className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background min-w-[150px]">Employee</TableHead>
                {dates.map((date: string) => (
                  <TableHead key={date} className="text-center min-w-[100px]">
                    {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="sticky left-0 bg-background font-medium">
                    <div>
                      <div>{emp.employeeName}</div>
                      <div className="text-xs text-muted-foreground">{emp.designation}</div>
                    </div>
                  </TableCell>
                  {dates.map((date: string) => {
                    const metric = emp.dailyMetrics.find((m: any) => m.date === date);
                    const hasActivity = metric && metric.dial > 0;
                    return (
                      <TableCell key={date} className="text-center p-2">
                        {hasActivity ? (
                          <div className="bg-green-50 dark:bg-green-950 rounded-lg p-2">
                            <div className="flex items-center justify-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              <span className="font-mono">{metric.dial}</span>
                            </div>
                            {metric.answered > 0 && (
                              <div className="flex items-center justify-center gap-1 text-xs text-green-600">
                                <PhoneIncoming className="h-2 w-2" />
                                <span>{metric.answered}</span>
                                <Timer className="h-2 w-2 ml-1" />
                                <span>{Math.floor(metric.talkTime / 60)}m</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-xs">-</div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading report data...</p>
        </div>
      );
    }
    
    if (!reportData) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <BarChart className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No Data Available</h3>
          <p className="text-muted-foreground mt-2">Apply filters and click refresh to load data</p>
          <Button onClick={fetchReport} className="mt-4" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      );
    }
    
    switch (activeReport) {
      case 'stage-summary': return renderStageSummary();
      case 'employee-stages': return renderEmployeeStages();
      case 'pool-stages': return renderPoolStages();
      case 'pool-revenue': return renderPoolRevenue();
      case 'utilization': return renderUtilization();
      case 'consultant-performance': return renderConsultantPerformance();
      case 'daily-utilization': return renderDailyUtilization();
      default: return <pre className="text-xs">{JSON.stringify(reportData, null, 2)}</pre>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Reports Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Comprehensive analytics for leads, revenue, and employee performance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchReport} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">Refresh</span>
            </Button>
            <Button onClick={handleExport} disabled={!reportData || loading} variant="default">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeReport} onValueChange={setActiveReport} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
            {REPORTS.map((report) => {
              const Icon = report.icon;
              const isActive = activeReport === report.id;
              return (
                <TabsTrigger 
                  key={report.id} 
                  value={report.id} 
                  className={`gap-2 data-[state=active]:bg-background rounded-lg transition-all ${isActive ? 'shadow-md' : ''}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{report.shortName}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={activeReport} className="space-y-4 mt-0">
            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2 rounded-full">
                <Filter className="h-4 w-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {activeFilterCount > 0 && <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>}
              </Button>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : reportData ? 'bg-green-500' : 'bg-gray-500'}`} />
                <span className="text-sm text-muted-foreground">
                  {currentReport.name}
                </span>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <Card className="border shadow-sm">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Date Range</Label>
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="rounded-lg">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          {dateFilterOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {dateFilter === 'custom' && (
                      <>
                        <div className="space-y-2">
                          <Label>From Date</Label>
                          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg" />
                        </div>
                        <div className="space-y-2">
                          <Label>To Date</Label>
                          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg" />
                        </div>
                      </>
                    )}

                    {currentReport.filters.includes('poolId') && (
                      <div className="space-y-2">
                        <Label>Filter by Pool</Label>
                        <Select value={poolId} onValueChange={setPoolId}>
                          <SelectTrigger className="rounded-lg">
                            <SelectValue placeholder="All Pools" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=" ">All Pools</SelectItem>
                            {pools.map((p: any) => (
                              <SelectItem key={p._id} value={p._id}>{p.name || p.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {currentReport.filters.includes('counsellorId') && (
                      <div className="space-y-2">
                        <Label>Filter by Employee</Label>
                        <Select value={counsellorId} onValueChange={setCounsellorId}>
                          <SelectTrigger className="rounded-lg">
                            <SelectValue placeholder="All Employees" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=" ">All Employees</SelectItem>
                            {counsellors.map((c: any) => (
                              <SelectItem key={c._id} value={c._id}>{c.name || c.email}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {currentReport.filters.includes('source') && (
                      <div className="space-y-2">
                        <Label>Lead Source</Label>
                        <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="facebook, google..." className="rounded-lg" />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-2">
                    <Button onClick={fetchReport} disabled={loading} className="rounded-full px-6">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                      Apply Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Report Content */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="p-4 md:p-6">
                {renderContent()}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}