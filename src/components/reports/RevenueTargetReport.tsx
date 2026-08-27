import { Fragment, useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2,
  RefreshCw,
  Download,
  Filter,
  Search,
  Users,
  Target,
  TrendingUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  IndianRupee,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*                              Money & Formatters                             */
/* -------------------------------------------------------------------------- */
const moneyFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const percentFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

const formatMoney = (value: number) => moneyFormatter.format(Math.round(value || 0));
const formatPercent = (value: number) => `${percentFormatter.format(Number(value || 0))}%`;

/* -------------------------------------------------------------------------- */
/*                            Month Options Builder                            */
/* -------------------------------------------------------------------------- */
const buildMonthOptions = (count = 36) => {
  const options: { value: string; label: string }[] = [];
  const base = new Date();
  for (let i = 0; i < count; i++) {
    const date = new Date(Date.UTC(base.getFullYear(), base.getMonth() - i, 1));
    const value = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    options.push({ value, label });
  }
  return options;
};

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const ROWS_PER_PAGE = 10;

export function RevenueTargetReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  // Month filter (multi-select)
  const monthOptions = useMemo(() => buildMonthOptions(36), []);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([getCurrentMonthKey()]);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);

  const extractLevelNumber = (name: string): number => {
    const match = name.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  };

  // ─── Fetch report data ───
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        months: selectedMonths.length ? selectedMonths.join(',') : getCurrentMonthKey(),
      };

      const response = await getDataHandlerWithToken(
        ApiConfig.getRevenueTargetReport,
        params,
        null,
        true
      );
      setData(response?.data || response);
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load revenue target report', variant: 'destructive' });
      setData(null);
    } finally {
      setLoading(false);
      setCurrentPage(0);
    }
  }, [selectedMonths]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Derived data ───
  const months = data?.months || [];
  const users = data?.users || [];
  const summary = data?.summary || {};

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter((user: any) => {
      return [user.name, user.employeeId, user.roleName, user.email]
        .filter(Boolean)
        .some(val => String(val).toLowerCase().includes(term));
    });
  }, [users, searchTerm]);

  const totalPages = Math.ceil(filteredUsers.length / ROWS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    currentPage * ROWS_PER_PAGE,
    (currentPage + 1) * ROWS_PER_PAGE,
  );

  const combinedTarget =
    summary.totalTarget ?? filteredUsers.reduce((sum, row) => sum + (row.combinedTarget || 0), 0);
  const combinedAchieved =
    summary.totalAchieved ?? filteredUsers.reduce((sum, row) => sum + (row.combinedAchieved || 0), 0);
  const combinedPercentage =
    summary.totalPercentage ?? (combinedTarget > 0 ? Math.min(100, Math.round((combinedAchieved / combinedTarget) * 100)) : 0);

  const hasActiveFilters =
    selectedMonths.join(',') !== getCurrentMonthKey() ||
    searchTerm !== '';

  // ─── Export CSV ───
  const handleExport = () => {
    if (!users.length) {
      toast({ title: 'No data to export' });
      return;
    }
    const monthKeys = months.map((m: any) => m.monthKey);
    const headers = [
      'Employee', 'Employee ID', 'Role',
      ...monthKeys.flatMap(mk => [`${mk}_target`, `${mk}_achieved`]),
      'Combined Target', 'Combined Achieved', 'Combined %',
    ];
    const rows = filteredUsers.map(user => {
      const row: any[] = [user.name, user.employeeId || '', user.roleName || ''];
      monthKeys.forEach(mk => {
        const monthData = user.months?.find((m: any) => m.monthKey === mk) || {};
        row.push(monthData.target || 0, monthData.achieved || 0);
      });
      row.push(user.combinedTarget || 0, user.combinedAchieved || 0, user.combinedPercentage || 0);
      return row;
    });
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue_target_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Revenue Target</h3>
          <p className="text-sm text-slate-500">Monthly revenue target vs achievement</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="rounded-xl border-slate-200">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
            Refresh
          </Button>
          <Button size="sm" onClick={handleExport} disabled={!data || loading} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
            <Download className="w-3.5 h-3.5 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-1 h-8 text-xs rounded-xl"
        >
          <Filter className="w-3 h-3" />
          Filters
          {hasActiveFilters && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-orange-500" />}
          {showFilters ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
        </Button>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 w-full">
            {/* Month Multi-Select */}
            <div className="w-[280px]">
              <MultiSelect
                options={monthOptions}
                selected={selectedMonths}
                onChange={setSelectedMonths}
                placeholder="Select months"
                searchPlaceholder="Search month..."
                emptyMessage="No months found"
                maxDisplay={2}
              />
            </div>

            {/* Search */}
            <div className="relative w-52">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
                className="pl-7 h-8 text-xs rounded-xl border-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
          <p className="ml-2 text-sm text-slate-500">Loading revenue target data...</p>
        </div>
      ) : !users.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Target className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No revenue target data found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting filters or level</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Employees</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{summary.totalUsers ?? users.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Combined Target</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">₹ {formatMoney(combinedTarget)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Combined Achieved</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">₹ {formatMoney(combinedAchieved)}</p>
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Achievement</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{formatPercent(combinedPercentage)}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Record count */}
          <div className="text-xs text-slate-500">
            {months.length} month{months.length === 1 ? '' : 's'} selected • {filteredUsers.length} employees
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
            <Table style={{ minWidth: `${420 + months.length * 220}px` }}>
              <TableHeader>
                <TableRow className="bg-amber-50 hover:bg-amber-50 border-b border-amber-200">
                  <TableHead rowSpan={2} className="text-xs font-semibold text-amber-900 uppercase sticky left-0 z-20 bg-amber-50">
                    Employee
                  </TableHead>
                  {months.map((month: any) => (
                    <TableHead key={month.monthKey} colSpan={2} className="text-center text-xs font-semibold text-amber-900 uppercase">
                      {month.label}
                    </TableHead>
                  ))}
                  <TableHead colSpan={2} className="text-center text-xs font-semibold text-amber-900 uppercase">
                    Combined
                  </TableHead>
                </TableRow>
                <TableRow className="bg-amber-100/50 hover:bg-amber-100/50">
                  {months.map((month: any) => (
                    <Fragment key={`${month.monthKey}-sub`}>
                      <TableHead className="text-center text-xs font-medium text-amber-800">Target</TableHead>
                      <TableHead className="text-center text-xs font-medium text-amber-800">Ach</TableHead>
                    </Fragment>
                  ))}
                  <TableHead className="text-center text-xs font-medium text-amber-800">Target</TableHead>
                  <TableHead className="text-center text-xs font-medium text-amber-800">Ach</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user: any) => (
                  <TableRow key={user.userId} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <TableCell className="sticky left-0 z-10 bg-white border-r py-3">
                      <div className="font-medium text-sm text-slate-800">{user.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {user.employeeId ? `ID: ${user.employeeId}` : ''}
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
                          <TableCell className="text-center py-3">
                            <div className="font-medium text-sm text-slate-700">{formatMoney(target)}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {monthRow.percentage != null ? formatPercent(monthRow.percentage) : '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-3">
                            <div className={`font-semibold text-sm ${achievedClass}`}>{formatMoney(achieved)}</div>
                          </TableCell>
                        </Fragment>
                      );
                    })}
                    <TableCell className="text-center py-3 bg-slate-50/50">
                      <span className="font-medium text-sm text-slate-700">{formatMoney(user.combinedTarget || 0)}</span>
                    </TableCell>
                    <TableCell className="text-center py-3 bg-slate-50/50">
                      <span className="font-semibold text-sm text-emerald-600">{formatMoney(user.combinedAchieved || 0)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500">Page {currentPage + 1} of {totalPages}</div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="h-8 w-8 p-0 rounded-lg">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1} className="h-8 w-8 p-0 rounded-lg">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}