// BDDashboard.tsx - Completely redesigned with dynamic data and professional design
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  Phone, 
  DollarSign, 
  TrendingUp,
  Plus,
  Calendar,
  FileText,
  Users,
  Clock,
  Loader2,
  RefreshCw,
  Megaphone,
  BarChart3,
  Circle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { hasModulePermission } from '@/utils/modulePermissions';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
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
  ReferenceLine
} from 'recharts';

// Types
type DashboardStats = {
  totalLeads: number;
  todayFollowUps: number;
  monthlyConversions: number;
  approvedOrders: number;
  monthlyRevenue: number;
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

type Order = {
  _id: string;
  orderNo?: string;
  studentName: string;
  courseName: string;
  finalFee: number;
  status: string;
  counsellorName: string;
  createdAt: string;
  approvedBy?: {
    name: string;
  };
};

type DashboardActivity = {
  _id: string;
  action: string;
  user: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
};

// Helper functions
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

export function BDDashboard() {
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    todayFollowUps: 0,
    monthlyConversions: 0,
    approvedOrders: 0,
    monthlyRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentActivities, setRecentActivities] = useState<DashboardActivity[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [scheduledCalls, setScheduledCalls] = useState<any[]>([]);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([2026, 2025, 2024]);

  // Check permissions
  const hasAnyPermission = 
    hasModulePermission(permissions, "calls") ||
    hasModulePermission(permissions, "meetings") ||
    hasModulePermission(permissions, "orders") ||
    hasModulePermission(permissions, "payments") ||
    hasModulePermission(permissions, "tasks") ||
    hasModulePermission(permissions, "announcements");

  // Fetch revenue data
  const fetchRevenueData = async (year: number) => {
    try {
      const response = await getDataHandlerWithToken(
        ApiConfig.revenueGraph,
        { year },
        null,
        true
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
      return null;
    }
  };

  // Fetch user stats
  const fetchUserStats = async () => {
    try {
      const response = await getDataHandlerWithToken(
        ApiConfig.userStats,
        {},
        null,
        true
      );
      if (response) {
        setStats(response);
      }
    } catch (error) {
      console.error("Error fetching user stats", error);
    }
  };

  // Fetch recent orders
  const fetchRecentOrders = async () => {
    try {
      const response = await getDataHandlerWithToken(
        ApiConfig.Order,
        { page: 1, limit: 5, sortBy: 'createdAt:desc' },
        null,
        true
      );
      if (response?.data) {
        setRecentOrders(response.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Fetch recent tasks
  const fetchRecentTasks = async () => {
    try {
      const response = await getDataHandlerWithToken(
        ApiConfig.getMyTasks,
        { limit: 10 },
        null,
        true
      );
      if (response?.data) {
        setRecentTasks(response.data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // Fetch scheduled calls
  const fetchScheduledCalls = async () => {
    try {
      const response = await getDataHandlerWithToken(
        ApiConfig.getLeadSchedules,
        {
          dateFilter: 'today',
          status: 'upcoming',
          limit: 10,
        },
        null,
        true
      );
      if (response?.data) {
        setScheduledCalls(response.data);
      }
    } catch (error) {
      console.error("Error fetching scheduled calls:", error);
    }
  };

  // Fetch announcements count
  const fetchAnnouncementCount = async () => {
    try {
      const response = await getDataHandlerWithToken(
        'getAnnouncements',
        { page: 1, limit: 1 },
        null
      );
      setAnnouncementCount(
        response?.meta?.total ?? 
        response?.total ?? 
        (Array.isArray(response?.data) ? response.data.length : 0)
      );
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  // Fetch all data
  const fetchAllData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const [
        statsData,
        ordersData,
        tasksData,
        callsData,
        activitiesData,
        revenueRes,
        announcementsCount
      ] = await Promise.all([
        fetchUserStats(),
        fetchRecentOrders(),
        fetchRecentTasks(),
        fetchScheduledCalls(),
        getDataHandlerWithToken(ApiConfig.getLastActivities, { limit: 5 }, null, true),
        fetchRevenueData(selectedYear),
        hasModulePermission(permissions, "announcements") ? fetchAnnouncementCount() : Promise.resolve(0)
      ]);

      setRecentActivities(Array.isArray(activitiesData) ? activitiesData.map(mapActivity) : []);
      
      if (revenueRes) {
        setRevenueData(revenueRes);
        if (revenueRes.year) {
          const currentYear = revenueRes.year;
          const years = [];
          for (let y = currentYear; y >= currentYear - 3; y--) {
            years.push(y);
          }
          setAvailableYears(years);
        }
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchRevenueData(selectedYear).then(data => {
        if (data) setRevenueData(data);
      });
    }
  }, [selectedYear]);

  // Stat cards
  const statCards = useMemo(() => [
    {
      title: "My Leads",
      value: stats.totalLeads.toLocaleString(),
      icon: Target,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      change: `${stats.totalLeads} assigned leads`,
    },
    {
      title: "Follow-ups Today",
      value: stats.todayFollowUps.toString(),
      icon: Phone,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      change: "Today's schedule",
    },
    {
      title: "Conversions",
      value: stats.monthlyConversions.toString(),
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      change: "This month",
    },
    {
      title: "Revenue",
      value: `₹${stats.monthlyRevenue.toLocaleString("en-IN")}`,
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      change: `${stats.approvedOrders} approved orders`,
    },
  ], [stats]);

  // Quick actions
  const quickActions = [
    { label: 'Add Lead', icon: Plus, onClick: () => navigate('/bd/leads') },
    { label: 'Log Call', icon: Phone, onClick: () => navigate('/bd/calls') },
    { label: 'Schedule Meeting', icon: Calendar, onClick: () => navigate('/bd/meetings') },
    { label: 'Reports', icon: FileText, onClick: () => navigate('/bd/reports') },
    ...(hasModulePermission(permissions, "announcements") ? [{ label: 'Announcements', icon: Megaphone, onClick: () => navigate('/bd/announcements') }] : []),
    ...(hasModulePermission(permissions, "targets") ? [{ label: 'Targets', icon: Target, onClick: () => navigate('/bd/targets') }] : [])
  ];

  // Incomplete tasks
  const incompleteTasks = recentTasks.filter(
    (task) => task.status !== 'completed' && task.status !== 'cancelled'
  );

  // Chart data
  const currentMonthIndex = new Date().getMonth();
  const chartData = useMemo(() => {
    if (!revenueData?.data) return [];
    return revenueData.data.map((item, index) => ({
      ...item,
      isCurrentMonth: index === currentMonthIndex && new Date().getFullYear() === revenueData.year,
      isFutureMonth: index > currentMonthIndex && new Date().getFullYear() === revenueData.year,
    }));
  }, [revenueData, currentMonthIndex]);

  const maxRevenue = useMemo(() => {
    if (!chartData.length) return 100000;
    const max = Math.max(...chartData.map(d => d.revenue));
    return Math.ceil(max * 1.2) || 100000;
  }, [chartData]);

  const openTask = (taskId: string) => {
    navigate(`/bd/my-tasks/${taskId}`);
  };

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

  if (!hasAnyPermission) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">You do not have permission to access this dashboard.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">BD Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track your leads, sales, and performance</p>
        </div>
        <div className="flex items-center gap-3">
          {refreshing && (
            <div className="flex items-center text-sm text-slate-500">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Refreshing...
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAllData(true)}
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
                  <span className="text-slate-400">Year</span>
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {chartData.length === 0 || chartData.every(d => d.revenue === 0) ? (
            <div className="flex flex-col items-center justify-center py-16">
              <BarChart3 className="h-12 w-12 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-600">No revenue data available</p>
              <p className="text-xs text-slate-400">Revenue data will appear here once available</p>
            </div>
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bdRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="bdRevenueGradientFuture" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#bdRevenueGradient)"
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

      {/* Recent Orders */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <FileText className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-800">Recent Orders</CardTitle>
              <p className="text-xs text-slate-500">Latest approved orders and their status</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-600">No orders found</p>
              <p className="text-xs text-slate-400">Your approved orders will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">
                        {order.studentName || 'Unknown Student'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {order.courseName || 'Course'} • {order.counsellorName || 'No counsellor'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm font-semibold text-slate-800">
                      ₹{order.finalFee?.toLocaleString() || '0'}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs mt-1",
                        order.status === 'Fully Paid' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                        order.status === 'Partially Paid' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                        'border-slate-200 text-slate-600'
                      )}
                    >
                      {order.status || 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two Column Layout - Tasks & Scheduled Calls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incomplete Tasks */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-800">Incomplete Tasks</CardTitle>
                <p className="text-xs text-slate-500">Tasks pending completion</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {incompleteTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-10 w-10 text-emerald-300" />
                <p className="mt-2 text-sm font-medium text-slate-600">No incomplete tasks</p>
                <p className="text-xs text-slate-400">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incompleteTasks.slice(0, 5).map((task) => (
                  <button
                    key={task._id}
                    type="button"
                    onClick={() => openTask(task._id)}
                    className="flex w-full items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200 text-left"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {task.title || 'Untitled Task'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {task.assignTo?.name || 'Unassigned'}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs flex-shrink-0 ml-2",
                        task.status === 'in_progress' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                        'border-slate-200 text-slate-600'
                      )}
                    >
                      {task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Calls */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Phone className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-800">Today's Scheduled Calls</CardTitle>
                <p className="text-xs text-slate-500">Upcoming calls for today</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {scheduledCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Phone className="h-10 w-10 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-600">No scheduled calls</p>
                <p className="text-xs text-slate-400">No calls scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledCalls.slice(0, 5).map((call) => (
                  <div key={call._id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {call.leadName || `Lead #${call.leadId}`}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {call.message || 'Scheduled follow-up'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                        {call.stageName || 'Scheduled'}
                      </Badge>
                      <p className="text-xs text-slate-400 mt-1">
                        {call.scheduledAt ? new Date(call.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                  <Clock className="h-10 w-10 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-600">No recent activity</p>
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