import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Phone, 
  DollarSign, 
  TrendingUp,
  Plus,
  Calendar,
  FileText,
  Users
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList } from 'recharts';

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

const recentActivities = [
  { id: '1', action: 'Call completed with ABC Corp - Interested', user: 'You', time: '15 min ago', type: 'success' as const },
  { id: '2', action: 'New lead assigned: XYZ Industries', user: 'Manager', time: '1 hour ago', type: 'info' as const },
  { id: '3', action: 'Meeting scheduled with Tech Solutions', user: 'You', time: '2 hours ago', type: 'info' as const },
  { id: '4', action: 'Proposal sent to Global Services', user: 'You', time: '3 hours ago', type: 'success' as const },
  { id: '5', action: 'Follow-up reminder: Delta Inc', user: 'System', time: '5 hours ago', type: 'warning' as const },
];

const quickActions = [
  { label: 'Add Lead', icon: Plus },
  { label: 'Log Call', icon: Phone },
  { label: 'Schedule Meeting', icon: Calendar },
  { label: 'Create Report', icon: FileText },
];

const todayFollowUps = [
  { id: '1', company: 'ABC Corp', contact: 'John Smith', time: '10:00 AM', type: 'call', priority: 'high' },
  { id: '2', company: 'XYZ Industries', contact: 'Sarah Lee', time: '11:30 AM', type: 'email', priority: 'medium' },
  { id: '3', company: 'Tech Solutions', contact: 'Mike Brown', time: '2:00 PM', type: 'meeting', priority: 'high' },
  { id: '4', company: 'Global Services', contact: 'Emily Davis', time: '4:00 PM', type: 'call', priority: 'low' },
];

export function BDDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">BD Dashboard</h1>
        <p className="text-muted-foreground">Track your leads and sales performance.</p>
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

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-warning" />
                Today's Follow-ups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayFollowUps.map((followUp) => (
                  <div key={followUp.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-bd/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-bd" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{followUp.company}</p>
                        <p className="text-sm text-muted-foreground">{followUp.contact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{followUp.type}</Badge>
                      <span className="text-sm text-muted-foreground">{followUp.time}</span>
                      <Badge 
                        variant={followUp.priority === 'high' ? 'destructive' : followUp.priority === 'medium' ? 'default' : 'secondary'}
                      >
                        {followUp.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <QuickActions actions={quickActions} />
          <RecentActivity activities={recentActivities} title="My Activity" />
        </div>
      </div>
    </div>
  );
}
