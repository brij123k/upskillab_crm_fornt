import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, PhoneCall, DollarSign, ArrowUpRight } from 'lucide-react';

interface UserActivitySummaryReportProps {
  data: any;
}

const formatTalkTime = (seconds: number) => {
  if (!seconds) return '0m';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  return `${hours}h ${remainder}m`;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const renderListSummary = (items: any[], labelKey: string, valueKey: string) => {
  if (!items?.length) return <span className="text-xs text-muted-foreground">None</span>;
  return (
    <div className="space-y-1 text-[11px] text-muted-foreground">
      {items.slice(0, 3).map((item: any, index: number) => (
        <div key={index} className="truncate">
          {item[labelKey]}: {item[valueKey]}
        </div>
      ))}
      {items.length > 3 ? <div>+{items.length - 3} more</div> : null}
    </div>
  );
};

export function UserActivitySummaryReport({ data }: UserActivitySummaryReportProps) {
  const rows = Array.isArray(data?.users) ? data.users : [];
  const hasData = rows.length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">No user activity found</p>
        <p className="text-xs text-muted-foreground mt-2">Adjust the filters to load activity.</p>
      </div>
    );
  }

  const totals = rows.reduce(
    (summary: any, row: any) => ({
      totalAssigned: summary.totalAssigned + (row.totalLeadAssigned || 0),
      totalNew: summary.totalNew + (row.totalNewLeadsAssigned || 0),
      totalDialed: summary.totalDialed + (row.totalDialedCalls || 0),
      totalAnswered: summary.totalAnswered + (row.totalAnsweredCalls || 0),
      totalTalkTime: summary.totalTalkTime + (row.totalTalkTime || 0),
      totalOrders: summary.totalOrders + (row.acceptedOrderCount || 0),
      totalRevenue: summary.totalRevenue + (row.acceptedRevenue || 0),
      totalPcatRegistered: summary.totalPcatRegistered + (row.pcatRegistered || 0),
      totalPcatDone: summary.totalPcatDone + (row.pcatDone || 0),
    }),
    {
      totalAssigned: 0,
      totalNew: 0,
      totalDialed: 0,
      totalAnswered: 0,
      totalTalkTime: 0,
      totalOrders: 0,
      totalRevenue: 0,
      totalPcatRegistered: 0,
      totalPcatDone: 0,
    }
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border">
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Users</p>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-semibold">{data.totalUsers || rows.length}</p>
            <p className="text-xs text-muted-foreground">Active users in range</p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Leads Assigned</p>
              <ArrowUpRight className="h-4 w-4 text-slate-500" />
            </div>
            <p className="text-3xl font-semibold">{totals.totalAssigned}</p>
            <p className="text-xs text-muted-foreground">Total assigned leads</p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Calls</p>
              <PhoneCall className="h-4 w-4 text-slate-500" />
            </div>
            <p className="text-3xl font-semibold">{totals.totalDialed}</p>
            <p className="text-xs text-muted-foreground">Total dialed calls</p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Revenue</p>
              <DollarSign className="h-4 w-4 text-slate-500" />
            </div>
            <p className="text-3xl font-semibold">{formatCurrency(totals.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">Total orders revenue</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Card className="border">
          <CardContent>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Talk Time</p>
            <p className="mt-2 text-2xl font-semibold">{formatTalkTime(totals.totalTalkTime)}</p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">PCAT Registered</p>
            <p className="mt-2 text-2xl font-semibold">{totals.totalPcatRegistered}</p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">PCAT Done</p>
            <p className="mt-2 text-2xl font-semibold">{totals.totalPcatDone}</p>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">User</TableHead>
              <TableHead className="text-xs text-right">Assigned</TableHead>
              <TableHead className="text-xs text-right">New Leads</TableHead>
              <TableHead className="text-xs text-right">Dialed</TableHead>
              <TableHead className="text-xs text-right">Answered</TableHead>
              <TableHead className="text-xs text-right">Talk Time</TableHead>
              <TableHead className="text-xs text-right">Orders</TableHead>
              <TableHead className="text-xs text-right">Revenue</TableHead>
              <TableHead className="text-xs text-right">PCAT Reg</TableHead>
              <TableHead className="text-xs text-right">PCAT Done</TableHead>
              <TableHead className="text-xs">Sources</TableHead>
              <TableHead className="text-xs">Campaigns</TableHead>
              <TableHead className="text-xs">Stage Changes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row: any) => (
              <TableRow key={row.userId || row.email || row.name}>
                <TableCell className="text-xs font-medium">
                  <div>{row.name}</div>
                  <div className="text-muted-foreground text-[11px]">{row.employeeId || row.email || row.mobile}</div>
                </TableCell>
                <TableCell className="text-xs text-right">{row.totalLeadAssigned}</TableCell>
                <TableCell className="text-xs text-right">{row.totalNewLeadsAssigned}</TableCell>
                <TableCell className="text-xs text-right">{row.totalDialedCalls}</TableCell>
                <TableCell className="text-xs text-right">{row.totalAnsweredCalls}</TableCell>
                <TableCell className="text-xs text-right">{formatTalkTime(row.totalTalkTime)}</TableCell>
                <TableCell className="text-xs text-right">{row.acceptedOrderCount}</TableCell>
                <TableCell className="text-xs text-right">{formatCurrency(row.acceptedRevenue)}</TableCell>
                <TableCell className="text-xs text-right">{row.pcatRegistered}</TableCell>
                <TableCell className="text-xs text-right">{row.pcatDone}</TableCell>
                <TableCell className="text-xs max-w-[200px]">
                  {renderListSummary(row.sourceCounts || [], 'source', 'count')}
                </TableCell>
                <TableCell className="text-xs max-w-[200px]">
                  {renderListSummary(row.sourceCampaignCounts || [], 'campaign', 'count')}
                </TableCell>
                <TableCell className="text-xs max-w-[220px]">
                  {renderListSummary(row.stageChanges || [], 'stage', 'count')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
