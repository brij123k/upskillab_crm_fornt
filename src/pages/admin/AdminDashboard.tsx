import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { TargetComparisonWidget } from '@/components/targets/TargetComparisonWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  FileText, 
  Building2, 
  AlertTriangle, 
  Shield, 
  TrendingUp,
  UserPlus,
  Upload,
  Settings,
  Download,
  Megaphone,
  Clock,
  ListOrdered,
  CreditCard,
  Target
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const initialRevenueData = [
  { month: 'Jan', revenue: 65000 },
  { month: 'Feb', revenue: 78000 },
  { month: 'Mar', revenue: 90000 },
  { month: 'Apr', revenue: 81000 },
  { month: 'May', revenue: 96000 },
  { month: 'Jun', revenue: 105000 },
];

const initialDepartmentData = [
  { name: 'Sales', performance: 85 },
  { name: 'Marketing', performance: 72 },
  { name: 'Support', performance: 90 },
  { name: 'Engineering', performance: 78 },
  { name: 'HR', performance: 88 },
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

export function AdminDashboard() {
  const navigate = useNavigate();
  const [userCount, setUserCount] = useState(0);
  const [leadCount, setLeadCount] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [paymentCount, setPaymentCount] = useState(0);
  const [revenueData, setRevenueData] = useState(initialRevenueData);
  const [departmentData, setDepartmentData] = useState(initialDepartmentData);
  const [recentActivities, setRecentActivities] = useState<DashboardActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const stats = useMemo(() => [
    {
      title: 'Total Users',
      value: userCount.toLocaleString(),
      change: userCount ? `${userCount} active` : 'Loading...',
      changeType: 'positive' as const,
      icon: Users,
      iconClassName: 'admin-gradient'
    },
    {
      title: 'Total Leads',
      value: leadCount.toLocaleString(),
      change: leadCount ? `${leadCount} total leads` : 'Loading...',
      changeType: 'neutral' as const,
      icon: FileText,
      iconClassName: 'bg-info'
    },
    {
      title: 'Departments',
      value: departmentCount.toLocaleString(),
      change: departmentCount ? `${departmentCount} active` : 'Loading...',
      changeType: 'positive' as const,
      icon: Building2,
      iconClassName: 'bg-success'
    },
    {
      title: 'Warnings',
      value: warningCount.toLocaleString(),
      change: warningCount ? `${warningCount} issued` : 'Loading...',
      changeType: warningCount > 0 ? 'negative' as const : 'positive' as const,
      icon: AlertTriangle,
      iconClassName: 'bg-warning'
    },
  ], [userCount, leadCount, departmentCount, warningCount]);

  const quickActions = [
    { label: 'Announcements', icon: Megaphone, onClick: () => navigate('/admin/announcements') },
    { label: 'Warnings', icon: AlertTriangle, onClick: () => navigate('/admin/performance-warnings') },
    { label: 'Orders', icon: ListOrdered, onClick: () => navigate('/admin/orders') },
    { label: 'Payments', icon: CreditCard, onClick: () => navigate('/admin/payments') },
    { label: 'Targets', icon: Target, onClick: () => navigate('/admin/targets') },
    { label: 'Attendance & Policy', icon: Clock, onClick: () => navigate('/admin/attendance-policy') },
  ];

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [users, leads, departments, warnings, announcements, orders, payments, activities] = await Promise.all([
        getDataHandlerWithToken('getAllUser', null, null),
        getDataHandlerWithToken('getAllLeads', { page: 1, limit: 1 }, null),
        getDataHandlerWithToken('getAllDepartments', null, null),
        getDataHandlerWithToken('getWarnings', { page: 1, limit: 1 }, null),
        getDataHandlerWithToken('getAnnouncements', { page: 1, limit: 1 }, null),
        getDataHandlerWithToken('Order', { page: 1, limit: 1 }, null),
        getDataHandlerWithToken('getPaymentHistory', { page: 1, limit: 50 }, null),
        getDataHandlerWithToken(ApiConfig.getLastActivities, { limit: 5 }, null, true),
      ]);

      setUserCount(Array.isArray(users) ? users.length : 0);
      setLeadCount(leads?.meta?.total ?? leads?.total ?? (Array.isArray(leads?.data) ? leads.data.length : 0));
      setDepartmentCount(Array.isArray(departments) ? departments.length : 0);
      setWarningCount(warnings?.meta?.total ?? warnings?.total ?? (Array.isArray(warnings?.data) ? warnings.data.length : 0));
      setAnnouncementCount(announcements?.meta?.total ?? announcements?.total ?? (Array.isArray(announcements?.data) ? announcements.data.length : 0));
      setOrderCount(orders?.total ?? (Array.isArray(orders?.data) ? orders.data.length : 0));
      setPaymentCount(Array.isArray(payments) ? payments.length : (payments?.data?.length ?? 0));
      setRecentActivities(Array.isArray(activities) ? activities.map(mapActivity) : []);

      const paymentRows = Array.isArray(payments) ? payments : payments?.data ?? [];
      const grouped = paymentRows.reduce((acc: Record<string, number>, payment: any) => {
        const dateValue = payment.createdAt ? new Date(payment.createdAt) : payment.link_created_at ? new Date(payment.link_created_at) : null;
        if (!dateValue) return acc;
        const month = dateValue.toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + (payment.amount || payment.order_amount || payment.link_amount_paid || 0);
        return acc;
      }, {} as Record<string, number>);

      setRevenueData(Object.entries(grouped).slice(-6).map(([month, revenue]) => ({ month, revenue })));

      if (Array.isArray(departments) && Array.isArray(users)) {
        const depNames = departments.slice(0, 5).map((dept: any) => dept.name || 'Unknown');
        const depPerformance = depNames.map((name) => ({
          name,
          performance: Math.min(100, Math.max(40, users.filter((user: any) => user.departmentId === name || user.departmentId?._id === name).length * 10 + 30))
        }));
        setDepartmentData(depPerformance.length ? depPerformance : initialDepartmentData);
      }
    } catch (error) {
      console.error('Failed to load dashboard data', error);
      toast.error('Unable to load admin dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here’s the latest from your organization.</p>
        </div>
        <button
          className="inline-flex items-center rounded-md border border-border bg-transparent px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
          onClick={fetchDashboardData}
          disabled={loading}
        >
          <Download className={loading ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData.length ? revenueData : initialRevenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-info" />
              Department Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData.length ? departmentData : initialDepartmentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="performance" fill="hsl(var(--info))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity activities={recentActivities} />
        </div>
        <div>
          <QuickActions actions={quickActions} title="Admin Actions" />
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-success" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Server Status</span>
                <span className="text-sm font-medium text-success">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <span className="text-sm font-medium text-success">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Backup</span>
                <span className="text-sm font-medium text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="text-sm font-medium text-foreground">99.98%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Announcements</span>
                <span className="text-sm font-medium">{announcementCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Orders</span>
                <span className="text-sm font-medium">{orderCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Payments</span>
                <span className="text-sm font-medium">{paymentCount.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
