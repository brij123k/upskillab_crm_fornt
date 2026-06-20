import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  RefreshCw,
  Download,
  Filter,
  Search,
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Layers,
  Users,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RevenueByMonth {
  month: string;
  revenue: number;
}

interface EmployeeRevenue {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  pools: {
    poolId: string;
    poolName: string;
    revenueByMonth: RevenueByMonth[];
  }[];
}

interface ReportData {
  employees: EmployeeRevenue[];
  pools: {
    poolId: string;
    poolName: string;
  }[];
  months: string[];
  totalRevenue?: number;
}

interface LevelType {
  _id: string;
  name: string;
}

const dateFilterOptions = [
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
];

const EMPLOYEES_PER_PAGE = 10;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount || 0);

export function PoolRevenueReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [levels, setLevels] = useState<LevelType[]>([]);
  const [selectedLevel, setSelectedLevel] = useState('1');
  const [dateRange, setDateRange] = useState('month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [poolSearch, setPoolSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);

  // Fetch levels
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const res = await getDataHandlerWithToken('getAllLevels', null, null);
        if (res) {
          setLevels(res);
          if (res.length > 0) {
            const num = extractLevelNumber(res[0].name);
            setSelectedLevel(num.toString());
          }
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load levels', variant: 'destructive' });
      }
    };
    fetchLevels();
  }, []);

  const extractLevelNumber = (name: string): number => {
    const match = name.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  };

  // Fetch revenue data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        level: parseInt(selectedLevel) || 1,
      };
      if (dateRange === 'custom') {
        if (!fromDate || !toDate) {
          toast({ title: 'Missing Dates', description: 'Please select start and end dates.', variant: 'destructive' });
          setLoading(false);
          return;
        }
        // Validate max 30 days
        const diffTime = Math.abs(new Date(toDate).getTime() - new Date(fromDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
          toast({ title: 'Date range too large', description: 'Max 30 days allowed', variant: 'destructive' });
          setLoading(false);
          return;
        }
        params.fromDate = fromDate;
        params.toDate = toDate;
      } else {
        params.dateFilter = dateRange;
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.employeePoolRevenueReport,
        params,
        null,
        true
      );
      if (response) {
        setData({
          employees: response.data?.employees || response.employees || [],
          pools: response.data?.pools || response.pools || [],
          months: response.data?.months || response.months || [],
          totalRevenue: response.data?.totalRevenue ?? response.totalRevenue,
        });
      } else {
        setData(null);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load revenue', variant: 'destructive' });
      setData(null);
    } finally {
      setLoading(false);
      setCurrentPage(0);
    }
  }, [selectedLevel, dateRange, fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Export CSV
  const handleExport = () => {
    if (!data || !data.employees.length) {
      toast({ title: 'No data to export' });
      return;
    }
    const pools = data.pools || [];
    const rows = data.employees.map(emp => {
      const poolMap = new Map<string, number>();
      emp.pools?.forEach(p => {
        const revenue = p.revenueByMonth?.[0]?.revenue || 0;
        poolMap.set(p.poolName, revenue);
      });
      return {
        employee: emp.employeeName,
        email: emp.employeeEmail,
        ...Object.fromEntries(pools.map(p => [p.poolName, poolMap.get(p.poolName) || 0])),
        total: Array.from(poolMap.values()).reduce((a, b) => a + b, 0),
      };
    });
    const headers = ['Employee', 'Email', ...pools.map(p => p.poolName), 'Total'];
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(h => String(row[h] || '').replace(/,/g, ' ')).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pool_revenue_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  };

  // Client‑side filtering
  const filteredEmployees = data?.employees?.filter(emp => {
    if (employeeSearch && !emp.employeeName.toLowerCase().includes(employeeSearch.toLowerCase())) return false;
    return true;
  }) || [];

  const allPools = data?.pools || [];

  const paginatedEmployees = filteredEmployees.slice(
    currentPage * EMPLOYEES_PER_PAGE,
    (currentPage + 1) * EMPLOYEES_PER_PAGE
  );

  const totalRevenue = filteredEmployees.reduce((sum, emp) => {
    const empTotal = emp.pools?.reduce((s, p) => s + (p.revenueByMonth?.[0]?.revenue || 0), 0) || 0;
    return sum + empTotal;
  }, 0);

  const activeEmployees = filteredEmployees.length;
  const totalPages = Math.ceil(filteredEmployees.length / EMPLOYEES_PER_PAGE);

  const hasActiveFilters =
    selectedLevel !== '1' ||
    dateRange !== 'month' ||
    (dateRange === 'custom' && (fromDate || toDate)) ||
    employeeSearch !== '' ||
    poolSearch !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Revenue by Pool</h3>
          <p className="text-sm text-slate-500">Employee revenue across pools</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="rounded-xl border-slate-200"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={!data || loading}
            className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
          >
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
            {/* Level Radio Buttons */}
            {levels.length > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase">Level</Label>
                <div className="flex flex-wrap gap-1">
                  {levels.map(lvl => (
                    <button
                      key={lvl._id}
                      onClick={() => setSelectedLevel(extractLevelNumber(lvl.name).toString())}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-lg border transition-all",
                        selectedLevel === extractLevelNumber(lvl.name).toString()
                          ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {lvl.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Date Filter */}
            <div className="w-[130px]">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="h-8 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateFilterOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div className="relative w-[130px]">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="relative w-[130px]">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Max 30 days</span>
              </>
            )}

            {/* Employee Search */}
            <div className="relative w-48">
              <Users className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Search employee..."
                value={employeeSearch}
                onChange={(e) => { setEmployeeSearch(e.target.value); setCurrentPage(0); }}
                className="pl-7 h-8 text-xs rounded-xl border-slate-200"
              />
            </div>

            {/* Pool Search */}
            <div className="relative w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Search pool..."
                value={poolSearch}
                onChange={(e) => setPoolSearch(e.target.value)}
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
          <p className="ml-2 text-sm text-slate-500">Loading revenue data...</p>
        </div>
      ) : !data || !data.employees.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <IndianRupee className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No revenue data found</p>
          <p className="text-xs text-slate-400 mt-1">Adjust level, date, or search terms</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Employees</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{activeEmployees}</p>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pools</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{allPools.length}</p>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Layers className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase sticky left-0 bg-slate-50 z-10 min-w-[160px]">
                    Employee
                  </TableHead>
                  {allPools
                    .filter(p => !poolSearch || p.poolName.toLowerCase().includes(poolSearch.toLowerCase()))
                    .map(pool => (
                      <TableHead key={pool.poolId} className="text-xs text-center min-w-[120px] py-3">
                        <div className="font-semibold text-slate-800">{pool.poolName}</div>
                      </TableHead>
                    ))}
                  <TableHead className="text-xs text-center min-w-[100px] py-3 bg-slate-50">
                    <div className="font-semibold text-slate-800">Total</div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmployees.map(emp => {
                  const poolMap = new Map<string, number>();
                  emp.pools?.forEach(p => {
                    const rev = p.revenueByMonth?.[0]?.revenue || 0;
                    poolMap.set(p.poolName, rev);
                  });
                  const empTotal = Array.from(poolMap.values()).reduce((a, b) => a + b, 0);

                  return (
                    <TableRow key={emp.employeeId} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <TableCell className="text-xs sticky left-0 bg-white border-r z-10 py-3">
                        <div className="font-medium text-slate-800">{emp.employeeName}</div>
                        <div className="text-[10px] text-slate-400">{emp.employeeEmail}</div>
                      </TableCell>
                      {allPools
                        .filter(p => !poolSearch || p.poolName.toLowerCase().includes(poolSearch.toLowerCase()))
                        .map(pool => {
                          const amount = poolMap.get(pool.poolName) || 0;
                          return (
                            <TableCell key={pool.poolId} className="text-xs text-center py-3">
                              {amount > 0 ? (
                                <span className="font-medium text-emerald-600">{formatCurrency(amount)}</span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </TableCell>
                          );
                        })}
                      <TableCell className="text-xs text-center font-semibold bg-slate-50/50 py-3">
                        {formatCurrency(empTotal)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500">
                Page {currentPage + 1} of {totalPages}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="h-8 w-8 p-0 rounded-lg"
                >
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