import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
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
  Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const stats = [
  { title: 'Total Users', value: '1,284', change: '+12% from last month', changeType: 'positive' as const, icon: Users, iconClassName: 'admin-gradient' },
  { title: 'Total Leads', value: '8,542', change: '324 unassigned', changeType: 'neutral' as const, icon: FileText, iconClassName: 'bg-info' },
  { title: 'Departments', value: '12', change: '3 new this quarter', changeType: 'positive' as const, icon: Building2, iconClassName: 'bg-success' },
  { title: 'Pending Approvals', value: '23', change: '5 urgent', changeType: 'negative' as const, icon: AlertTriangle, iconClassName: 'bg-warning' },
];

const revenueData = [
  { month: 'Jan', revenue: 65000 },
  { month: 'Feb', revenue: 78000 },
  { month: 'Mar', revenue: 90000 },
  { month: 'Apr', revenue: 81000 },
  { month: 'May', revenue: 96000 },
  { month: 'Jun', revenue: 105000 },
];

const departmentData = [
  { name: 'Sales', performance: 85 },
  { name: 'Marketing', performance: 72 },
  { name: 'Support', performance: 90 },
  { name: 'Engineering', performance: 78 },
  { name: 'HR', performance: 88 },
];

const recentActivities = [
  { id: '1', action: 'New user registered: John Smith', user: 'System', time: '5 min ago', type: 'info' as const },
  { id: '2', action: 'Bulk lead import completed (500 leads)', user: 'Admin', time: '1 hour ago', type: 'success' as const },
  { id: '3', action: 'Failed login attempt detected', user: 'Security', time: '2 hours ago', type: 'warning' as const },
  { id: '4', action: 'Department restructure approved', user: 'CEO', time: '3 hours ago', type: 'info' as const },
  { id: '5', action: 'System backup completed', user: 'System', time: '5 hours ago', type: 'success' as const },
];

const quickActions = [
  { label: 'Add User', icon: UserPlus },
  { label: 'Import Data', icon: Upload },
  { label: 'Export Report', icon: Download },
  { label: 'System Settings', icon: Settings },
];

export function AdminDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening in your organization.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Row */}
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
              <LineChart data={revenueData}>
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
              <BarChart data={departmentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={80} className="text-xs" />
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

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity activities={recentActivities} />
        </div>
        <div>
          <QuickActions actions={quickActions} />
          
          {/* System Health */}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
