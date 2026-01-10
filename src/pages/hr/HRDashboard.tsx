import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  UserPlus, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  UserCheck,
  FileText,
  Megaphone
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const stats = [
  { title: 'Total Employees', value: '248', change: '+5 this month', changeType: 'positive' as const, icon: Users, iconClassName: 'hr-gradient' },
  { title: 'New Joiners', value: '12', change: 'This month', changeType: 'neutral' as const, icon: UserPlus, iconClassName: 'bg-info' },
  { title: 'On Probation', value: '18', change: '6 ending soon', changeType: 'neutral' as const, icon: Clock, iconClassName: 'bg-warning' },
  { title: 'Attendance Alerts', value: '7', change: 'Requires attention', changeType: 'negative' as const, icon: AlertTriangle, iconClassName: 'bg-destructive' },
];

const departmentDistribution = [
  { name: 'Engineering', value: 85, color: 'hsl(222, 47%, 20%)' },
  { name: 'Sales', value: 62, color: 'hsl(199, 89%, 48%)' },
  { name: 'Marketing', value: 34, color: 'hsl(152, 69%, 31%)' },
  { name: 'HR', value: 18, color: 'hsl(38, 92%, 50%)' },
  { name: 'Support', value: 28, color: 'hsl(245, 58%, 51%)' },
  { name: 'Admin', value: 21, color: 'hsl(0, 84%, 60%)' },
];

const attendanceData = [
  { day: 'Mon', present: 230, absent: 18 },
  { day: 'Tue', present: 235, absent: 13 },
  { day: 'Wed', present: 228, absent: 20 },
  { day: 'Thu', present: 240, absent: 8 },
  { day: 'Fri', present: 220, absent: 28 },
];

const recentActivities = [
  { id: '1', action: 'New employee onboarded: Alice Chen', user: 'HR', time: '30 min ago', type: 'success' as const },
  { id: '2', action: 'Warning issued to employee #1234', user: 'HR Manager', time: '2 hours ago', type: 'warning' as const },
  { id: '3', action: 'Performance review completed for 5 employees', user: 'Team Lead', time: '3 hours ago', type: 'info' as const },
  { id: '4', action: 'Resignation request from John Doe', user: 'Employee', time: '5 hours ago', type: 'error' as const },
  { id: '5', action: 'Attendance updated for November', user: 'System', time: '1 day ago', type: 'info' as const },
];

const quickActions = [
  { label: 'Onboard Employee', icon: UserPlus },
  { label: 'Record Attendance', icon: UserCheck },
  { label: 'Create Report', icon: FileText },
  { label: 'Post Announcement', icon: Megaphone },
];

export function HRDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">HR Dashboard</h1>
        <p className="text-muted-foreground">Manage your workforce and employee operations.</p>
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
              <Users className="w-5 h-5 text-hr" />
              Department Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {departmentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-info" />
              Weekly Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Bar dataKey="present" fill="hsl(var(--success))" name="Present" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" fill="hsl(var(--destructive))" name="Absent" radius={[4, 4, 0, 0]} />
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
          
          {/* Performance Alerts */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-warning" />
                Performance Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm font-medium text-foreground">3 employees need review</p>
                <p className="text-xs text-muted-foreground mt-1">Performance below threshold</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm font-medium text-foreground">12 promotions due</p>
                <p className="text-xs text-muted-foreground mt-1">Based on tenure and performance</p>
              </div>
              <div className="p-3 rounded-lg bg-info/10 border border-info/20">
                <p className="text-sm font-medium text-foreground">8 probations ending</p>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
