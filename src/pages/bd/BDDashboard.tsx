import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { BDAnnouncementWidget } from '@/components/announcements/BDAnnouncementWidget';
import { BDWarningWidget } from '@/components/announcements/BDWarningWidget';
import { TargetComparisonWidget } from '@/components/targets/TargetComparisonWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Megaphone
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, BarChart, Bar } from 'recharts';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { hasModulePermission } from '@/utils/modulePermissions';
import { formatDistanceToNow } from 'date-fns';

const stats = [
  { title: 'My Leads', value: '47', change: '+8 new today', changeType: 'positive' as const, icon: Target, iconClassName: 'bd-gradient' },
  { title: 'Follow-ups Today', value: '12', change: '3 overdue', changeType: 'negative' as const, icon: Phone, iconClassName: 'bg-warning' },
  { title: 'Conversions', value: '8', change: 'This month', changeType: 'positive' as const, icon: TrendingUp, iconClassName: 'bg-success' },
  { title: 'Revenue', value: '$45.2K', change: '+22% from last month', changeType: 'positive' as const, icon: DollarSign, iconClassName: 'bg-info' },
];

const conversionData = [
  { month: 'Jan', leads: 120, conversions: 24 },
  { month: 'Feb', leads: 150, conversions: 35 },
  { month: 'Mar', leads: 180, conversions: 42 },
  { month: 'Apr', leads: 140, conversions: 28 },
  { month: 'May', leads: 200, conversions: 52 },
  { month: 'Jun', leads: 220, conversions: 58 },
];

const funnelData = [
  { name: 'New Leads', value: 500, fill: 'hsl(199, 89%, 48%)' },
  { name: 'Contacted', value: 380, fill: 'hsl(199, 89%, 58%)' },
  { name: 'Qualified', value: 220, fill: 'hsl(38, 92%, 50%)' },
  { name: 'Proposal', value: 120, fill: 'hsl(152, 69%, 41%)' },
  { name: 'Closed', value: 65, fill: 'hsl(152, 69%, 31%)' },
];

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

const quickActions = [
  { label: 'Add Lead', icon: Plus },
  { label: 'Log Call', icon: Phone },
  { label: 'Schedule Meeting', icon: Calendar },
  { label: 'Create Report', icon: FileText },
];

export function BDDashboard() {
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");
  const [loading, setLoading] = useState(true);
  const [recentCallLogs, setRecentCallLogs] = useState<any[]>([]);
  const [recentMeetingLogs, setRecentMeetingLogs] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [scheduledCalls, setScheduledCalls] = useState<any[]>([]);
  const [paymentChartData, setPaymentChartData] = useState<any[]>([]);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [fetchingData, setFetchingData] = useState(false);
  const [recentActivities, setRecentActivities] = useState<DashboardActivity[]>([]);

  const dynamicQuickActions = [
    ...quickActions,
    ...(hasModulePermission(permissions, "announcements") ? [{ label: 'Announcements', icon: Megaphone, onClick: () => navigate('/bd/announcements') }] : []),
    ...(hasModulePermission(permissions, "targets") ? [{ label: 'Targets', icon: Target, onClick: () => navigate('/bd/targets') }] : [])
  ];

  // Fetch recent call logs
  const fetchRecentCallLogs = async () => {
    try {
      const response = await getDataHandlerWithToken(ApiConfig.CallLog, { limit: 5 }, null, true);
      if (response?.data) {
        setRecentCallLogs(response.data);
      }
    } catch (error) {
      console.error("Error fetching call logs:", error);
    }
  };

  // Fetch recent meeting logs
  const fetchRecentMeetingLogs = async () => {
    try {
      const response = await getDataHandlerWithToken(ApiConfig.getMeetingLog, { limit: 5 }, null, true);
      if (response?.data) {
        setRecentMeetingLogs(response.data);
      }
    } catch (error) {
      console.error("Error fetching meeting logs:", error);
    }
  };

  // Fetch recent orders
  const fetchRecentOrders = async () => {
    try {
      const response = await getDataHandlerWithToken(ApiConfig.Order, { limit: 5 }, null, true);
      if (response?.data) {
        setRecentOrders(response.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Fetch recent payments
  const fetchRecentPayments = async () => {
    try {
      const response = await getDataHandlerWithToken(ApiConfig.getPaymentHistory, { limit: 10 }, null, true);
      if (response?.data) {
        setRecentPayments(response.data.slice(0, 5));
        
        // Format data for chart
        const chartData = response.data.slice(0, 10).reduce((acc: any[], payment: any) => {
          const date = new Date(payment.createdAt).toLocaleDateString();
          const existing = acc.find(d => d.date === date);
          if (existing) {
            existing.amount += payment.amount || 0;
            existing.count += 1;
          } else {
            acc.push({ date, amount: payment.amount || 0, count: 1 });
          }
          return acc;
        }, []);
        setPaymentChartData(chartData);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  // Fetch recent tasks
  const fetchRecentTasks = async () => {
    console.log("Fetching recent tasks...");
    try {
      const response = await getDataHandlerWithToken(ApiConfig.getMyTasks, { limit: 10 }, null, true);
      if (response?.data) {
        setRecentTasks(response.data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchScheduledCalls = async () => {
    try {
      const response = await getDataHandlerWithToken(ApiConfig.getLeadSchedules, {
        dateFilter: 'today',
        status: 'upcoming',
        limit: 10,
      }, null, true);
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
      const response = await getDataHandlerWithToken('getAnnouncements', { page: 1, limit: 1 }, null);
      setAnnouncementCount(response?.meta?.total ?? response?.total ?? (Array.isArray(response?.data) ? response.data.length : 0));
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setFetchingData(true);
      setLoading(true);
      
      if (hasModulePermission(permissions, "calls")) {
        await fetchRecentCallLogs();
      }
      if (hasModulePermission(permissions, "meetings")) {
        await fetchRecentMeetingLogs();
      }
      if (hasModulePermission(permissions, "orders")) {
        await fetchRecentOrders();
      }
      if (hasModulePermission(permissions, "payments")) {
        await fetchRecentPayments();
      }
      await fetchRecentTasks();
      await fetchScheduledCalls();
      if (hasModulePermission(permissions, "announcements")) {
        await fetchAnnouncementCount();
      }

      const activities = await getDataHandlerWithToken(ApiConfig.getLastActivities, { limit: 5 }, null, true);
      setRecentActivities(Array.isArray(activities) ? activities.map(mapActivity) : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setFetchingData(false);
    }
  };

  // Initialize on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Check if user has any permissions
  const hasAnyPermission = 
    hasModulePermission(permissions, "calls") ||
    hasModulePermission(permissions, "meetings") ||
    hasModulePermission(permissions, "orders") ||
    hasModulePermission(permissions, "payments") ||
    hasModulePermission(permissions, "tasks") ||
    hasModulePermission(permissions, "announcements");

  const openTask = (taskId: string) => {
    navigate(`/bd/my-tasks/${taskId}`);
  };

  const incompleteTasks = recentTasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled');
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">BD Dashboard</h1>
          <p className="text-muted-foreground">Track your leads and sales performance.</p>
        </div>
        <div className="flex items-center gap-2">
          {fetchingData && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Refreshing...
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
            disabled={fetchingData || loading}
          >
            <RefreshCw className={loading || fetchingData ? "w-4 h-4 mr-2 animate-spin" : "w-4 h-4 mr-2"} />
            Refresh
          </Button>
        </div>
      </div>

      {!hasAnyPermission ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">You do not have permission to access this dashboard.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          <TargetComparisonWidget managePath="/bd/targets" />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-bd" />
                  Leads vs Conversions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={conversionData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="leads" 
                      stackId="1"
                      stroke="hsl(var(--bd-accent))" 
                      fill="hsl(var(--bd-accent) / 0.2)" 
                      name="Leads"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="conversions" 
                      stackId="2"
                      stroke="hsl(var(--success))" 
                      fill="hsl(var(--success) / 0.2)" 
                      name="Conversions"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-info" />
                  Sales Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <FunnelChart>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Funnel
                      dataKey="value"
                      data={funnelData}
                      isAnimationActive
                    >
                      <LabelList position="center" fill="#fff" stroke="none" dataKey="name" fontSize={12} />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Data Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Call Logs */}
            {hasModulePermission(permissions, "calls") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="w-5 h-5 text-info" />
                    Recent Call Logs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : recentCallLogs.length > 0 ? (
                    <div className="space-y-3">
                      {recentCallLogs.map((log) => (
                        <div key={log._id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center">
                              <Phone className="w-4 h-4 text-info" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">Lead #{log.leadId}</p>
                              <p className="text-xs text-muted-foreground">{log.userId?.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{log.duration}s</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No call logs</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Meeting Logs */}
            {hasModulePermission(permissions, "meetings") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-warning" />
                    Recent Meeting Logs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : recentMeetingLogs.length > 0 ? (
                    <div className="space-y-3">
                      {recentMeetingLogs.map((log) => (
                        <div key={log._id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-warning" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">{log.title || `Meeting ${log._id.slice(0, 8)}`}</p>
                              <p className="text-xs text-muted-foreground">{log.attendees?.length || 0} attendees</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No meeting logs</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Payment Chart and Recent Payments */}
          {hasModulePermission(permissions, "payments") && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-success" />
                    Payment Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : paymentChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={paymentChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Bar 
                          dataKey="amount" 
                          fill="hsl(var(--success))" 
                          name="Payment Amount"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No payment data</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-success" />
                    Recent Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : recentPayments.length > 0 ? (
                    <div className="space-y-3">
                      {recentPayments.map((payment) => (
                        <div key={payment._id} className="p-3 rounded-lg bg-secondary/50">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-foreground text-sm">₹{payment.amount?.toFixed(2)}</p>
                            <Badge variant="outline" className="text-xs">
                              {payment.status || "Completed"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No payments</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Orders and Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            {hasModulePermission(permissions, "orders") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-success" />
                    Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : recentOrders.length > 0 ? (
                    <div className="space-y-3">
                      {recentOrders.map((order) => (
                        <div key={order._id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-success" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">Order #{order.orderNo}</p>
                              <p className="text-xs text-muted-foreground">{order.lead?.name || "N/A"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">₹{order.amount?.toFixed(2) || "0"}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {order.status || "Pending"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No orders</p>
                  )}
                </CardContent>
              </Card>
            )}

          </div>

          {/* Announcements and Warnings */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <BDAnnouncementWidget />
            <BDWarningWidget />
          </div>

          {/* Recent Incomplete Tasks and Scheduled Calls */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-warning" />
                    Recent Incomplete Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : incompleteTasks.length > 0 ? (
                    <div className="space-y-3">
                      {incompleteTasks.map((task) => (
                        <button
                          key={task._id}
                          type="button"
                          onClick={() => openTask(task._id)}
                          className="flex w-full items-center justify-between rounded-lg bg-secondary/50 p-4 text-left transition hover:bg-secondary"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                              <Clock className="w-5 h-5 text-warning" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{task.title}</p>
                              <p className="text-sm text-muted-foreground">{task.assignTo?.name || 'Unassigned'}</p>
                            </div>
                          </div>
                          <Badge
                            variant={task.status === 'in_progress' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {task.status || 'Pending'}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No incomplete tasks</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-info" />
                    Today&apos;s Scheduled Calls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : scheduledCalls.length > 0 ? (
                    <div className="space-y-3">
                      {scheduledCalls.map((call) => (
                        <div key={call._id} className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                              <Phone className="w-5 h-5 text-info" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {call.leadName || `Lead #${call.leadId}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {call.message || 'Scheduled follow-up'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-xs">
                              {call.stageName || 'Scheduled'}
                            </Badge>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {call.scheduledAt ? new Date(call.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No scheduled calls today</p>
                  )}
                </CardContent>
              </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentActivity activities={recentActivities} title="My / Team Activity" />
            </div>
            <div>
              <QuickActions actions={dynamicQuickActions} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
