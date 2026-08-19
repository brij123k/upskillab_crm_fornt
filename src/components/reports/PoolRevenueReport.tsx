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
  Users,
  Building2,
  Calendar,
  TrendingUp,
  X,
  Eye,
  Clock,
  User,
  Mail,
  Phone,
  CreditCard,
  Calendar as CalendarIcon,
  Tag,
  FileText,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RevenueByMonth {
  month: string;
  revenue: number;
}

interface Order {
  orderId: string;
  studentName: string;
  email: string;
  mobile: string;
  fatherName: string;
  courseName: string;
  courseDuration: string;
  paymentMode: string;
  orderDate: string;
  feeDepositDate: string;
  totalFee: number;
  discount: number;
  finalFee: number;
  revenue: number;
  loanDisbursementAmount: number | null;
  lumpsumTotalReceived: number | null;
  status: string;
  approved: boolean;
}

interface PoolWithOrders {
  poolId: string;
  poolName: string;
  revenueByMonth: RevenueByMonth[];
  orders: Order[];
}

interface EmployeeRevenue {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeNumber?: string;
  employeeEmployeeId?: string;
  pools: PoolWithOrders[];
}

interface ReportData {
  employees: EmployeeRevenue[];
  pools: {
    poolId: string;
    poolName: string;
  }[];
  months: string[];
  startDate?: Date;
  endDate?: Date;
}

interface LevelType {
  _id: string;
  name: string;
}

interface OrderModalData {
  employeeName: string;
  poolName: string;
  orders: Order[];
  totalRevenue: number;
}

const EMPLOYEES_PER_PAGE = 10;
const MAX_DAYS = 31;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'fully paid':
      return 'text-emerald-600 bg-emerald-50';
    case 'partially paid':
      return 'text-amber-600 bg-amber-50';
    case 'pending':
      return 'text-orange-600 bg-orange-50';
    default:
      return 'text-slate-600 bg-slate-50';
  }
};

export function PoolRevenueReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [levels, setLevels] = useState<LevelType[]>([]);

  // Filter states
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [dateRange, setDateRange] = useState<'month' | 'custom'>('month');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [poolSearch, setPoolSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<OrderModalData | null>(null);

  // Fetch levels
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const res = await getDataHandlerWithToken('getAllLevels', null, null);
        if (res && res.length > 0) {
          setLevels(res);
          const num = extractLevelNumber(res[0].name);
          setSelectedLevel(num.toString());
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

  // Validate date range (max 31 days)
  const validateDateRange = (from: string, to: string): boolean => {
    if (!from || !to) return false;
    const diffTime = Math.abs(new Date(to).getTime() - new Date(from).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > MAX_DAYS) {
      toast({
        title: 'Date range too large',
        description: `Maximum ${MAX_DAYS} days allowed`,
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  // Fetch revenue data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        level: parseInt(selectedLevel) || 1,
      };

      if (dateRange === 'custom') {
        if (!validateDateRange(fromDate, toDate)) {
          setLoading(false);
          return;
        }
        params.fromDate = fromDate;
        params.toDate = toDate;
      } else {
        params.dateFilter = 'month';
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.employeePoolRevenueReport,
        params,
        null,
        true
      );

      if (response) {
        setData({
          employees: response.employees || [],
          pools: response.pools || [],
          months: response.months || [],
          startDate: response.startDate,
          endDate: response.endDate,
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
    if (selectedLevel) {
      fetchData();
    }
  }, [fetchData, selectedLevel]);

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
    toast({ title: 'Export successful' });
  };

  // Handle click on revenue amount
  const handleRevenueClick = (employee: EmployeeRevenue, poolName: string, orders: Order[]) => {
    if (!orders || orders.length === 0) return;
    
    const totalRevenue = orders.reduce((sum, order) => sum + (order.revenue || 0), 0);
    setModalData({
      employeeName: employee.employeeName,
      poolName: poolName,
      orders: orders,
      totalRevenue: totalRevenue,
    });
    setIsModalOpen(true);
  };

  // Client-side filtering
  const filteredEmployees = data?.employees?.filter(emp => {
    if (employeeSearch && !emp.employeeName.toLowerCase().includes(employeeSearch.toLowerCase())) return false;
    return true;
  }) || [];

  const allPools = data?.pools || [];
  const filteredPools = allPools.filter(p => 
    !poolSearch || p.poolName.toLowerCase().includes(poolSearch.toLowerCase())
  );

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
    selectedLevel !== '' ||
    dateRange !== 'month' ||
    (dateRange === 'custom' && (fromDate || toDate)) ||
    employeeSearch !== '' ||
    poolSearch !== '';

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Pool Revenue Report</h2>
          <p className="text-sm text-slate-500 mt-0.5">Track employee revenue distribution across pools</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-9 px-4 text-sm rounded-xl border-slate-200 hover:bg-slate-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={!data || loading}
            className="h-9 px-4 text-sm rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-4">
          {/* Level Selection */}
          <div className="flex items-center gap-3">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Level</Label>
            <div className="flex gap-1.5">
              {levels.map(lvl => {
                const num = extractLevelNumber(lvl.name);
                const isActive = selectedLevel === num.toString();
                return (
                  <button
                    key={lvl._id}
                    onClick={() => setSelectedLevel(num.toString())}
                    className={cn(
                      "px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                        : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {lvl.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-px h-7 bg-slate-200" />

          {/* Date Range */}
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-400" />
            <Select value={dateRange} onValueChange={(v: 'month' | 'custom') => setDateRange(v)}>
              <SelectTrigger className="h-9 w-36 text-sm rounded-xl border-slate-200 bg-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month" className="text-sm">This Month</SelectItem>
                <SelectItem value="custom" className="text-sm">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 px-3 text-sm border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-orange-400 rounded-lg"
              />
              <span className="text-sm text-slate-400">→</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8 px-3 text-sm border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-orange-400 rounded-lg"
              />
              <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded-full">Max {MAX_DAYS} days</span>
            </div>
          )}

          <div className="w-px h-7 bg-slate-200" />

          {/* Search Fields */}
          <div className="flex items-center gap-3 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Search employee..."
                value={employeeSearch}
                onChange={(e) => { setEmployeeSearch(e.target.value); setCurrentPage(0); }}
                className="pl-9 h-9 text-sm rounded-xl border-slate-200 bg-slate-50"
              />
            </div>
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Search pool..."
                value={poolSearch}
                onChange={(e) => setPoolSearch(e.target.value)}
                className="pl-9 h-9 text-sm rounded-xl border-slate-200 bg-slate-50"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              Filters active
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
          <p className="mt-3 text-sm text-slate-500">Loading revenue data...</p>
        </div>
      ) : !data || !data.employees.length ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <IndianRupee className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-base font-medium text-slate-600">No revenue data found</p>
          <p className="text-sm text-slate-400 mt-1">Try adjusting level or date range</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1.5">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-orange-500" />
                </div>
              </div>
            </Card>
            
            <Card className="p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Employees</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1.5">{activeEmployees}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </Card>
            
            <Card className="p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Pools</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1.5">{allPools.length}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </Card>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 border-b border-slate-200">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50/80 z-10 min-w-[180px] px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        Employee
                      </div>
                    </TableHead>
                    {filteredPools.map(pool => (
                      <TableHead key={pool.poolId} className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center min-w-[110px] px-4 py-3.5">
                        <div className="flex flex-col items-center">
                          <span className="text-slate-700">{pool.poolName}</span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center min-w-[100px] px-4 py-3.5 bg-orange-50/50 border-l border-slate-200">
                      <div className="flex items-center justify-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-orange-700">Total</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEmployees.map((emp) => {
                    const poolMap = new Map<string, { amount: number; orders: Order[] }>();
                    emp.pools?.forEach(p => {
                      const rev = p.revenueByMonth?.[0]?.revenue || 0;
                      poolMap.set(p.poolName, { amount: rev, orders: p.orders || [] });
                    });
                    const empTotal = Array.from(poolMap.values()).reduce((a, b) => a + b.amount, 0);

                    return (
                      <TableRow 
                        key={emp.employeeId} 
                        className="border-b border-slate-100 transition-colors hover:bg-slate-50/50"
                      >
                        <TableCell className="text-sm sticky left-0 bg-white border-r border-slate-100 z-10 px-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">{emp.employeeName}</span>
                            <span className="text-xs text-slate-400">{emp.employeeEmail}</span>
                            {emp.employeeEmployeeId && (
                              <span className="text-[10px] text-slate-400 mt-0.5">ID: {emp.employeeEmployeeId}</span>
                            )}
                          </div>
                        </TableCell>
                        {filteredPools.map(pool => {
                          const poolData = poolMap.get(pool.poolName);
                          const amount = poolData?.amount || 0;
                          const orders = poolData?.orders || [];
                          const hasOrders = orders.length > 0;

                          return (
                            <TableCell key={pool.poolId} className="text-sm text-center px-4 py-3.5">
                              {amount > 0 ? (
                                <button
                                  onClick={() => handleRevenueClick(emp, pool.poolName, orders)}
                                  className={cn(
                                    "font-medium cursor-pointer transition-all hover:scale-105 inline-flex items-center gap-1.5",
                                    "text-emerald-600 hover:text-emerald-700"
                                  )}
                                  title="Click to view orders"
                                >
                                  {formatCurrency(amount)}
                                  <Eye className="w-3 h-3 opacity-60" />
                                </button>
                              ) : (
                                <span className="text-slate-400">
                                  {formatCurrency(amount)}
                                </span>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-sm text-center font-semibold px-4 py-3.5 bg-orange-50/30 border-l border-slate-200">
                          <span className={cn(
                            empTotal > 0 ? "text-orange-600" : "text-slate-400"
                          )}>
                            {formatCurrency(empTotal)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-slate-500">
                Showing <span className="font-medium text-slate-700">{currentPage * EMPLOYEES_PER_PAGE + 1}</span> to{' '}
                <span className="font-medium text-slate-700">
                  {Math.min((currentPage + 1) * EMPLOYEES_PER_PAGE, filteredEmployees.length)}
                </span>{' '}
                of <span className="font-medium text-slate-700">{filteredEmployees.length}</span> employees
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="h-8 w-8 p-0 rounded-lg border-slate-200 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (currentPage < 3) {
                      pageNum = i;
                    } else if (currentPage > totalPages - 3) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={cn(
                          "w-8 h-8 text-sm font-medium rounded-lg transition-colors",
                          isActive
                            ? "bg-orange-500 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="h-8 w-8 p-0 rounded-lg border-slate-200 hover:bg-slate-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orders Modal */}
      {isModalOpen && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Order Details</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  <span className="font-medium text-slate-700">{modalData.employeeName}</span> • 
                  <span className="font-medium text-slate-700 ml-1">{modalData.poolName}</span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(modalData.totalRevenue)}</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {modalData.orders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No orders found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modalData.orders.map((order, index) => (
                    <div
                      key={order.orderId || index}
                      className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-slate-800">{order.studentName}</h4>
                            <span className={cn(
                              "text-xs font-medium px-2.5 py-0.5 rounded-full",
                              getStatusColor(order.status)
                            )}>
                              {order.status || 'N/A'}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs">{order.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs">{order.mobile}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Tag className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs">{order.courseName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs">{order.courseDuration} days</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs">{order.paymentMode}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs">{formatDate(order.orderDate)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right min-w-[120px]">
                          <div className="flex flex-col items-end gap-1">
                            <div>
                              <span className="text-xs text-slate-400">Revenue</span>
                              <p className="text-lg font-bold text-emerald-600">
                                {formatCurrency(order.revenue)}
                              </p>
                            </div>
                            <div className="flex gap-3 text-xs text-slate-500">
                              <span>Actual Fee: {formatCurrency(order.totalFee)}</span>
                              <span>Discounted Fee: {formatCurrency(order.finalFee)}</span>
                              {order.discount > 0 && (
                                <span>Discount: {formatCurrency(order.discount)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-4 border-t border-slate-200 bg-slate-50/50">
              <Button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}