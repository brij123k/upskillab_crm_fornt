import { Fragment, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, IndianRupee, Search, Target, TrendingUp, Users, CalendarDays } from 'lucide-react';

interface RevenueTargetReportProps {
  data: any;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const moneyFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

const formatMoney = (value: number) => moneyFormatter.format(Math.round(value || 0));
const formatPercent = (value: number) => `${percentFormatter.format(Number(value || 0))}%`;

export function RevenueTargetReport({ data, searchTerm = '', onSearchChange }: RevenueTargetReportProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 10;

  const months = Array.isArray(data?.months) ? data.months : [];
  const users = Array.isArray(data?.users) ? data.users : [];
  const summary = data?.summary || {};

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();

    return users.filter((user: any) => {
      return [user.name, user.employeeId, user.roleName, user.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = filteredUsers.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage,
  );

  const combinedTarget =
    summary.totalTarget ?? filteredUsers.reduce((sum: number, row: any) => sum + (row.combinedTarget || 0), 0);
  const combinedAchieved =
    summary.totalAchieved ?? filteredUsers.reduce((sum: number, row: any) => sum + (row.combinedAchieved || 0), 0);
  const combinedPercentage =
    summary.totalPercentage ?? (combinedTarget > 0 ? Math.min(100, Math.round((combinedAchieved / combinedTarget) * 100)) : 0);

  if (!users.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <IndianRupee className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No revenue target data available</p>
      </div>
    );
  }

  if (!filteredUsers.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No matching employees found</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Employees</p>
              <p className="text-xl font-semibold">{summary.totalUsers ?? users.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Combined Target</p>
              <p className="text-xl font-semibold">Rs. {formatMoney(combinedTarget)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Combined Achieved</p>
              <p className="text-xl font-semibold">Rs. {formatMoney(combinedAchieved)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Achievement</p>
              <p className="text-xl font-semibold">{formatPercent(combinedPercentage)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          {months.length} month{months.length === 1 ? '' : 's'} selected
        </div>
        {onSearchChange && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Search employee, ID, role..."
              value={searchTerm}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setCurrentPage(0);
              }}
              className="pl-7 h-9 text-xs"
            />
          </div>
        )}
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <Table className="min-w-[1200px]" style={{ minWidth: `${420 + months.length * 220}px` }}>
          <TableHeader>
            <TableRow className="bg-yellow-300/90 hover:bg-yellow-300/90">
              <TableHead rowSpan={2} className="font-semibold text-black sticky left-0 z-20 bg-yellow-300/90">
                Employee
              </TableHead>
              {months.map((month: any) => (
                <TableHead key={month.monthKey} colSpan={2} className="text-center font-semibold text-black">
                  {month.label}
                </TableHead>
              ))}
              <TableHead colSpan={2} className="text-center font-semibold text-black">
                Combined
              </TableHead>
            </TableRow>
            <TableRow className="bg-yellow-200/90 hover:bg-yellow-200/90">
              {months.map((month: any) => (
                <Fragment key={`${month.monthKey}-subheads`}>
                  <TableHead className="text-center text-black font-medium">Target</TableHead>
                  <TableHead className="text-center text-black font-medium">Ach</TableHead>
                </Fragment>
              ))}
              <TableHead className="text-center text-black font-medium">Target</TableHead>
              <TableHead className="text-center text-black font-medium">Ach</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((user: any) => (
              <TableRow key={user.userId} className="hover:bg-muted/30">
                <TableCell className="sticky left-0 z-10 bg-background border-r">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {user.employeeId ? `ID: ${user.employeeId}` : 'No employee ID'}
                    {user.roleName ? ` | ${user.roleName}` : ''}
                  </div>
                </TableCell>
                {months.map((month: any, index: number) => {
                  const monthRow = user.months?.[index] || {};
                  const achieved = Number(monthRow.achieved || 0);
                  const target = Number(monthRow.target || 0);
                  const achievedClass = achieved >= target && target > 0 ? 'text-emerald-600' : 'text-amber-600';

                  return (
                    <Fragment key={`${user.userId}-${month.monthKey}`}>
                      <TableCell className="text-center p-2">
                        <div className="space-y-1">
                          <div className="font-medium text-foreground">{formatMoney(target)}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {monthRow.percentage != null ? formatPercent(monthRow.percentage) : '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center p-2">
                        <div className={`font-semibold ${achievedClass}`}>{formatMoney(achieved)}</div>
                      </TableCell>
                    </Fragment>
                  );
                })}
                <TableCell className="text-center font-medium bg-muted/20">
                  {formatMoney(user.combinedTarget || 0)}
                </TableCell>
                <TableCell className="text-center font-semibold bg-muted/20 text-emerald-600">
                  {formatMoney(user.combinedAchieved || 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="p-1 rounded border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-1 rounded border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
