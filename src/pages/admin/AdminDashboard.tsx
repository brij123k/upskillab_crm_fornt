// AdminDashboard.tsx - Completely redesigned with dynamic data
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Building2, 
  AlertTriangle, 
  TrendingUp,
  Megaphone,
  Clock,
  ListOrdered,
  CreditCard,
  Target,
  DollarSign,
  Calendar,
  ChevronDown,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Circle,
  BarChart3,
  LineChart as LineChartIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine
} from 'recharts';
import { cn } from '@/lib/utils';

type DashboardStats = {
  users: number;
  leads: number;
  departments: number;
  warnings: number;
  announcements: number;
  orders: number;
  payments: number;
};

type RevenueData = {
  year: number;
  startDate: string;
  endDate: string;
  data: {
    month: string;
    monthNumber: number;
    revenue: number;
  }[];
  totalRevenue: number;
};

type DashboardActivity = {
  _id: string;
  action: string;
  user: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
};

const getActivityType = (action: string): DashboardActivity['type'] => {
  const value = action.toLowerCase();
  if (value.includes('fail') || value.includes('error')) return 'error';
  if (value.includes('logout')) return 'warning';
  if (value.includes('login') || value.includes('created') || value.includes('success')) return 'success';
  return 'info';
};

const formatActivityLabel = (activity: any) => {
  if (activity?.meta?.message) return activity.meta.message;
  return activity?.action
    ? activity.action
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : 'Activity';
};

const mapActivity = (activity: any): DashboardActivity => ({
  _id: activity?._id ?? crypto.randomUUID(),
  action: formatActivityLabel(activity),
  user: activity?.userName || activity?.userId?.name || 'System',
  time: activity?.createdAt
    ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })
    : 'just now',
  type: getActivityType(activity?.action || ''),
});

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-4 min-w-[160px]">
        <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
        <p className="text-lg font-bold text-slate-800">
          ₹{payload[0].value.toLocaleString()}
        </p>
        <p className="text-[10px] text-slate-400 mt-1">
          Revenue for {label}
        </p>
      </div>
    );
  }
  return null;
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    leads: 0,
    departments: 0,
    warnings: 0,
    announcements: 0,
    orders: 0,
    payments: 0
  });
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([2026, 2025, 2024]);
  const [recentActivities, setRecentActivities] = useState<DashboardActivity[]>([]);

  const fetchRevenueData = async (year: number) => {
    try {
      const response = await getDataHandlerWithToken(
        ApiConfig.revenueGraph,
        { year },
        null,
        true
      );
      console.log(response)
      return response;
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
      return null;
    }
  };

  const fetchDashboardData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const [
        usersRes,
        leadsRes,
        departmentsRes,
        warningsRes,
        announcementsRes,
        ordersRes,
        paymentsRes,
        activitiesRes,
        revenueRes
      ] = await Promise.all([
        getDataHandlerWithToken('getAllUser', null, null),
        getDataHandlerWithToken('getAllLeads', { page: 1, limit: 1 }, null),
        getDataHandlerWithToken('getAllDepartments', null, null),
        getDataHandlerWithToken('getWarnings', { page: 1, limit: 1 }, null),
        getDataHandlerWithToken('getAnnouncements', { page: 1, limit: 1 }, null),
        getDataHandlerWithToken('Order', { page: 1, limit: 1 }, null),
        getDataHandlerWithToken('getPaymentHistory', { page: 1, limit: 50 }, null),
        getDataHandlerWithToken(ApiConfig.getLastActivities, { limit: 5 }, null, true),
        fetchRevenueData(selectedYear)
      ]);

      setStats({
        users: Array.isArray(usersRes) ? usersRes.length : 0,
        leads: leadsRes?.meta?.total ?? leadsRes?.total ?? (Array.isArray(leadsRes?.data) ? leadsRes.data.length : 0),
        departments: Array.isArray(departmentsRes) ? departmentsRes.length : 0,
        warnings: warningsRes?.meta?.total ?? warningsRes?.total ?? (Array.isArray(warningsRes?.data) ? warningsRes.data.length : 0),
        announcements: announcementsRes?.meta?.total ?? announcementsRes?.total ?? (Array.isArray(announcementsRes?.data) ? announcementsRes.data.length : 0),
        orders: ordersRes?.total ?? (Array.isArray(ordersRes?.data) ? ordersRes.data.length : 0),
        payments: Array.isArray(paymentsRes) ? paymentsRes.length : (paymentsRes?.length ?? 0)
      });

      setRecentActivities(Array.isArray(activitiesRes) ? activitiesRes.map(mapActivity) : []);
      
      if (revenueRes) {
        console.log("data",revenueRes)
        setRevenueData(revenueRes);
        // Extract years from response or keep default
        if (revenueRes.year) {
          const currentYear = revenueRes.year;
          const years = [];
          for (let y = currentYear; y >= currentYear - 3; y--) {
            years.push(y);
          }
          setAvailableYears(years);
        }
      }

    } catch (error: any) {
      console.error('Failed to load dashboard data', error);
      toast.error('Unable to load dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchRevenueData(selectedYear).then(data => {
        if (data) setRevenueData(data);
      });
    }
  }, [selectedYear]);

  const statCards = useMemo(() => [
    {
      title: 'Total Users',
      value: stats.users.toLocaleString(),
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      change: `${stats.users} active users`,
    },
    {
      title: 'Total Leads',
      value: stats.leads.toLocaleString(),
      icon: FileText,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      change: `${stats.leads} total leads`,
    },
    {
      title: 'Departments',
      value: stats.departments.toLocaleString(),
      icon: Building2,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      change: `${stats.departments} departments`,
    },
    {
      title: 'Warnings',
      value: stats.warnings.toLocaleString(),
      icon: AlertTriangle,
      color: stats.warnings > 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600',
      bgColor: stats.warnings > 0 ? 'bg-red-50' : 'bg-green-50',
      iconColor: stats.warnings > 0 ? 'text-red-600' : 'text-green-600',
      change: stats.warnings > 0 ? `${stats.warnings} warnings` : 'No warnings',
    },
  ], [stats]);

  const quickActions = [
    { label: 'Announcements', icon: Megaphone, onClick: () => navigate('/admin/announcements') },
    { label: 'Warnings', icon: AlertTriangle, onClick: () => navigate('/admin/performance-warnings') },
    { label: 'Orders', icon: ListOrdered, onClick: () => navigate('/admin/orders') },
    { label: 'Payments', icon: CreditCard, onClick: () => navigate('/admin/payments') },
    { label: 'Targets', icon: Target, onClick: () => navigate('/admin/targets') },
    { label: 'Attendance & Policy', icon: Clock, onClick: () => navigate('/admin/attendance-policy') },
  ];

  // Get current month index (0-11)
  const currentMonthIndex = new Date().getMonth();

  // Format revenue data for chart
  const chartData = useMemo(() => {
    if (!revenueData?.data) return [];
    return revenueData.data.map((item, index) => ({
      ...item,
      isCurrentMonth: index === currentMonthIndex && new Date().getFullYear() === revenueData.year,
      isFutureMonth: index > currentMonthIndex && new Date().getFullYear() === revenueData.year,
    }));
  }, [revenueData, currentMonthIndex]);

  // Get max revenue for chart domain
  const maxRevenue = useMemo(() => {
    if (!chartData.length) return 100000;
    const max = Math.max(...chartData.map(d => d.revenue));
    return Math.ceil(max * 1.2) || 100000;
  }, [chartData]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-orange-500" />
          <p className="mt-4 text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Overview of your organization's performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="gap-2 border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{stat.change}</p>
                  </div>
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", stat.bgColor)}>
                    <Icon className={cn("h-5 w-5", stat.iconColor)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue Graph */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-800">Revenue Overview</CardTitle>
                {revenueData && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Total Revenue: <span className="font-semibold text-slate-700">₹{revenueData.totalRevenue.toLocaleString()}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-[120px] h-9 text-sm border-slate-200 rounded-lg">
                  <Calendar className="h-3.5 w-3.5 mr-2 text-slate-400" />
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()} className="text-sm">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>Revenue</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {chartData.length === 0 || chartData.every(d => d.revenue === 0) ? (
            <div className="flex flex-col items-center justify-center py-16">
              <LineChartIcon className="h-12 w-12 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-600">No revenue data available</p>
              <p className="text-xs text-slate-400">Revenue data will appear here once available</p>
            </div>
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="revenueGradientFuture" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    domain={[0, maxRevenue]}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                    dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#f97316' }}
                  />
                  <ReferenceLine 
                    x={chartData[currentMonthIndex]?.month} 
                    stroke="#f97316" 
                    strokeDasharray="5 5"
                    label={{ 
                      value: 'Current Month', 
                      position: 'top', 
                      fill: '#f97316',
                      fontSize: 10,
                      fontWeight: 500
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {recentActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600">No recent activity</p>
                  <p className="text-xs text-slate-400">Activities will appear here as they happen</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const dotColors = {
                      success: 'bg-emerald-500',
                      error: 'bg-red-500',
                      warning: 'bg-amber-500',
                      info: 'bg-blue-500'
                    };
                    return (
                      <div key={activity._id} className="flex items-start gap-3 group">
                        <div className="flex-shrink-0 mt-0.5">
                          <Circle className={cn("h-2.5 w-2.5 fill-current", dotColors[activity.type])} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700">{activity.action}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-slate-400">{activity.user}</span>
                            <span className="text-xs text-slate-300">•</span>
                            <span className="text-xs text-slate-400">{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Target className="h-4 w-4 text-slate-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={action.onClick}
                      className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 hover:border-orange-200 hover:bg-orange-50 transition-all duration-200 group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-orange-100 flex items-center justify-center transition-colors duration-200">
                        <Icon className="h-4 w-4 text-slate-600 group-hover:text-orange-600 transition-colors duration-200" />
                      </div>
                      <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800 mt-2 text-center">
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}