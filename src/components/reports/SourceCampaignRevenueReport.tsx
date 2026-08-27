// SourceCampaignRevenueReport.tsx - Updated with Lead Created & Order Created Date Filters
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  RefreshCw,
  Download,
  Filter,
  Search,
  IndianRupee,
  Users,
  BarChart3,
  ChevronUp,
  ChevronDown,
  Calendar,
  TrendingUp,
  PieChart,
  Layers,
  Eye,
  X,
  FileText,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  CalendarClock,
  UserCog,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*                               Constants & Helpers                          */
/* -------------------------------------------------------------------------- */
const dateFilterOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'fully paid':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'partially paid':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'pending':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

// Helper to check if date filter is active
const isDateFilterActive = (filterValue: string) => {
  return filterValue && filterValue !== 'none' && filterValue !== '';
};

/* -------------------------------------------------------------------------- */
/*                            Order Details Modal                             */
/* -------------------------------------------------------------------------- */
function OrderDetailsModal({
  isOpen,
  onClose,
  orders,
  title,
  source,
  campaign,
}: {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
  title: string;
  source: string;
  campaign: string;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-[90vw] max-h-[85vh] p-4 flex flex-col rounded-2xl">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-500" />
            Order Details
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {title} • Source: <span className="font-medium text-slate-700">{source}</span> • 
            Campaign: <span className="font-medium text-slate-700">{campaign}</span>
          </DialogDescription>
          {orders.length > 0 && (
            <div className="text-sm text-slate-500 mt-1">
              Total Orders: <span className="font-semibold text-slate-700">{orders.length}</span>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0 mt-3">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 h-full flex items-center justify-center">
              No orders found for this campaign
            </div>
          ) : (
            <div className="overflow-x-auto flex-1 min-h-0 border border-slate-200 rounded-xl">
              <Table>
                <TableHeader className="sticky top-0 bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Student</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Course</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Payment Mode</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Counsellor</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Order Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any, idx: number) => (
                    <TableRow key={order._id || idx} className="hover:bg-slate-50/60 border-b border-slate-100">
                      <TableCell className="py-3">
                        <div className="font-medium text-slate-800 text-sm">{order.studentName || '-'}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Phone className="h-3 w-3" />
                          {order.mobile || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 py-3">
                        <div className="max-w-[200px] truncate" title={order.courseName}>
                          {order.courseName || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-emerald-600 py-3">
                        {formatCurrency(order?.lumpsumDetails?.totalReceived || order?.loanDetails?.disbursementAmount || 0)}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={cn('text-xs', getStatusColor(order.status))}>
                          {order.status || 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 py-3">
                        {order.paymentMode || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 py-3">
                        {order.counsellorName || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 py-3">
                        {formatDateTime(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 mt-2 border-t border-slate-100 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="rounded-xl border-slate-200">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Main Component                                   */
/* -------------------------------------------------------------------------- */
export function SourceCampaignRevenueReport() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Level filter
  const [levels, setLevels] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState('1');

  // Team filter (checkbox)
  const [showTeamOnly, setShowTeamOnly] = useState<boolean>(false);

  // Date filters - all default to 'none'
  const [leadCreatedDateFilter, setLeadCreatedDateFilter] = useState<string>('none');
  const [leadCreatedFromDate, setLeadCreatedFromDate] = useState('');
  const [leadCreatedToDate, setLeadCreatedToDate] = useState('');

  const [orderCreatedDateFilter, setOrderCreatedDateFilter] = useState<string>('none');
  const [orderCreatedFromDate, setOrderCreatedFromDate] = useState('');
  const [orderCreatedToDate, setOrderCreatedToDate] = useState('');

  // Client‑side filters
  const [sourceFilter, setSourceFilter] = useState('all');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalOrders, setModalOrders] = useState<any[]>([]);
  const [modalTitle, setModalTitle] = useState('');
  const [modalSource, setModalSource] = useState('');
  const [modalCampaign, setModalCampaign] = useState('');

  // ─── Fetch levels ───
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const res = await getDataHandlerWithToken('getAllLevels', null, null);
        if (res) {
          setLevels(res);
          if (res.length) setSelectedLevel(extractLevelNumber(res[0].name).toString());
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

  // ─── Validate date range (max 31 days) ───
  const validateDateRange = (from: string, to: string): boolean => {
    if (!from || !to) return false;
    const diffTime = Math.abs(new Date(to).getTime() - new Date(from).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 31) {
      toast({ title: 'Date range too large', description: 'Max 31 days allowed', variant: 'destructive' });
      return false;
    }
    return true;
  };

  // ─── Fetch report data ───
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        level: parseInt(selectedLevel) || 1,
      };

      // Team filter
      if (showTeamOnly) {
        params.team = true;
      }

      // Lead Created Date Filter - only if not 'none'
      if (isDateFilterActive(leadCreatedDateFilter)) {
        if (leadCreatedDateFilter === 'custom') {
          if (!leadCreatedFromDate || !leadCreatedToDate) {
            setLoading(false);
            return;
          }
          if (!validateDateRange(leadCreatedFromDate, leadCreatedToDate)) {
            setLoading(false);
            return;
          }
          params.leadCreatedDateFrom = leadCreatedFromDate;
          params.leadCreatedDateTo = leadCreatedToDate;
        } else {
          params.leadCreatedDateFilter = leadCreatedDateFilter;
        }
      }

      // Order Created Date Filter - only if not 'none'
      if (isDateFilterActive(orderCreatedDateFilter)) {
        if (orderCreatedDateFilter === 'custom') {
          if (!orderCreatedFromDate || !orderCreatedToDate) {
            setLoading(false);
            return;
          }
          if (!validateDateRange(orderCreatedFromDate, orderCreatedToDate)) {
            setLoading(false);
            return;
          }
          params.orderCreatedDateFrom = orderCreatedFromDate;
          params.orderCreatedDateTo = orderCreatedToDate;
        } else {
          params.orderCreatedDateFilter = orderCreatedDateFilter;
        }
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.sourcecampaignwiseleadrevenue,
        params,
        null,
        true
      );
      setReport(response);
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load revenue report', variant: 'destructive' });
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [
    selectedLevel,
    showTeamOnly,
    leadCreatedDateFilter,
    leadCreatedFromDate,
    leadCreatedToDate,
    orderCreatedDateFilter,
    orderCreatedFromDate,
    orderCreatedToDate,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Derived data from the report ───
  const rows = useMemo(() => report?.data || [], [report]);
  const campaigns = useMemo(() => report?.campaigns || [], [report]);
  const stats = report?.stats || { totalLead: 0, totalRevenue: 0, totalOrders: 0 };
  const startDate = report?.startDate || '';
  const endDate = report?.endDate || '';

  // Available sources for filter dropdown
  const availableSources = useMemo(() => {
    if (!rows.length) return ['all'];
    const sources = rows.map((r: any) => r.source).filter(Boolean);
    return ['all', ...Array.from(new Set(sources))];
  }, [rows]);

  // Client‑side filtering
  const filteredRows = useMemo(() => {
    return rows.filter((item: any) => {
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;
      return true;
    });
  }, [rows, sourceFilter]);

  // Filtered totals
  const filteredTotals = useMemo(() => {
    if (!filteredRows.length) return { totalLead: 0, totalRevenue: 0 };
    return filteredRows.reduce(
      (acc, item) => ({
        totalLead: acc.totalLead + (item.totalLead || 0),
        totalRevenue: acc.totalRevenue + (item.totalRevenue || 0),
      }),
      { totalLead: 0, totalRevenue: 0 }
    );
  }, [filteredRows]);

  // Column totals for filtered rows
  const columnTotals = useMemo(() => {
    if (!filteredRows.length || !campaigns.length) return {};
    const totals: Record<string, { lead: number; revenue: number; orders: any[] }> = {};
    campaigns.forEach(camp => {
      let leadTotal = 0;
      let revTotal = 0;
      const allOrders: any[] = [];
      filteredRows.forEach(item => {
        leadTotal += (item[`${camp}_lead`] || 0);
        revTotal += (item[`${camp}_revenue`] || 0);
        const orders = item[`${camp}_orders`] || [];
        allOrders.push(...orders);
      });
      totals[camp] = { lead: leadTotal, revenue: revTotal, orders: allOrders };
    });
    const allOrders: any[] = [];
    filteredRows.forEach(item => {
      campaigns.forEach(camp => {
        const orders = item[`${camp}_orders`] || [];
        allOrders.push(...orders);
      });
    });
    totals['total'] = { 
      lead: filteredTotals.totalLead, 
      revenue: filteredTotals.totalRevenue,
      orders: allOrders 
    };
    return totals;
  }, [filteredRows, campaigns, filteredTotals]);

  // Check if team mode is active
  const isTeamMode = showTeamOnly;

  const hasActiveFilters =
    selectedLevel !== '1' ||
    showTeamOnly ||
    isDateFilterActive(leadCreatedDateFilter) ||
    (leadCreatedDateFilter === 'custom' && (leadCreatedFromDate || leadCreatedToDate)) ||
    isDateFilterActive(orderCreatedDateFilter) ||
    (orderCreatedDateFilter === 'custom' && (orderCreatedFromDate || orderCreatedToDate)) ||
    sourceFilter !== 'all';

  // ─── Handle click on revenue/lead numbers ───
  const handleCellClick = (source: string, campaign: string, field: string) => {
    const item = filteredRows.find((r: any) => r.source === source);
    if (!item) return;

    let orders: any[] = [];
    let title = '';

    if (campaign === 'total') {
      // Get all orders for this source across all campaigns
      campaigns.forEach(camp => {
        const campOrders = item[`${camp}_orders`] || [];
        orders.push(...campOrders);
      });
      title = `All Orders - ${source}`;
    } else {
      orders = item[`${campaign}_orders`] || [];
      title = `${field === 'lead' ? 'Leads' : 'Revenue'} Details - ${campaign}`;
    }

    if (orders.length === 0) {
      toast({ 
        title: 'No orders', 
        description: `No orders found for ${campaign} from ${source}`,
      });
      return;
    }

    setModalOrders(orders);
    setModalTitle(title);
    setModalSource(source);
    setModalCampaign(campaign === 'total' ? 'All Campaigns' : campaign);
    setModalOpen(true);
  };

  // ─── Export CSV ───
  const handleExport = () => {
    if (!rows.length && !campaigns.length) {
      toast({ title: 'No data to export' });
      return;
    }
    const headers = ['Source', ...campaigns.flatMap(c => [`${c}_leads`, `${c}_revenue`]), 'Total Leads', 'Total Revenue', 'Team Size'];
    const csvRows = filteredRows.map((item: any) => [
      item.source,
      ...campaigns.flatMap(c => [item[`${c}_lead`] || 0, item[`${c}_revenue`] || 0]),
      item.totalLead || 0,
      item.totalRevenue || 0,
      item.teamSize || '',
    ]);
    csvRows.push([
      'Total',
      ...campaigns.flatMap(c => [columnTotals[c]?.lead || 0, columnTotals[c]?.revenue || 0]),
      filteredTotals.totalLead,
      filteredTotals.totalRevenue,
      '',
    ]);
    const csvContent = [headers, ...csvRows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `source_campaign_revenue_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  };

  // Format date range
  const formatDateRange = () => {
    if (startDate && endDate) {
      return `${formatDate(startDate)} – ${formatDate(endDate)}`;
    }
    return '';
  };

  // Get display label for date filter
  const getDateFilterLabel = (filterValue: string) => {
    if (filterValue === 'none' || !filterValue) return 'None';
    const option = dateFilterOptions.find(o => o.value === filterValue);
    return option?.label || filterValue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Revenue by Source Campaign</h3>
          <p className="text-sm text-slate-500">Lead & revenue metrics per source campaign</p>
          {report && startDate && endDate && (
            <p className="text-xs text-slate-400 mt-0.5">{formatDateRange()}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="rounded-xl border-slate-200 hover:bg-slate-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={!report || loading}
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
          className={cn(
            "gap-1 h-8 text-xs rounded-xl",
            showFilters && "bg-orange-500 hover:bg-orange-600 text-white"
          )}
        >
          <Filter className="w-3 h-3" />
          Filters
          {hasActiveFilters && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-orange-500" />}
          {showFilters ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
        </Button>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 w-full pt-2">
            {/* Level Selection */}
            {levels.length > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase">Level</Label>
                <div className="flex flex-wrap gap-1">
                  {levels.map(lvl => {
                    const num = extractLevelNumber(lvl.name);
                    const isActive = selectedLevel === num.toString();
                    return (
                      <button
                        key={lvl._id}
                        onClick={() => setSelectedLevel(num.toString())}
                        className={cn(
                          "px-3 py-1 text-xs font-medium rounded-lg border transition-all",
                          isActive
                            ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {lvl.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="w-px h-6 bg-slate-200" />

            {/* Team Checkbox */}
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="team-filter-source-campaign"
                  checked={showTeamOnly}
                  onCheckedChange={(checked) => {
                    setShowTeamOnly(checked === true);
                  }}
                  className="h-4 w-4 rounded border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <Label
                  htmlFor="team-filter-source-campaign"
                  className="text-xs font-medium text-slate-600 cursor-pointer"
                >
                  Team
                </Label>
              </div>
            </div>

            <div className="w-px h-6 bg-slate-200" />

            {/* Lead Created Date Filter */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                <Label className="text-[10px] font-medium text-slate-500 uppercase whitespace-nowrap">Lead Created</Label>
              </div>
              <div className="w-[110px]">
                <Select value={leadCreatedDateFilter} onValueChange={setLeadCreatedDateFilter}>
                  <SelectTrigger className="h-8 text-xs rounded-xl border-slate-200">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">None</SelectItem>
                    {dateFilterOptions.map(opt => (
                      <SelectItem key={`lead-created-${opt.value}`} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {leadCreatedDateFilter === 'custom' && (
              <>
                <div className="relative w-[120px]">
                  <input
                    type="date"
                    value={leadCreatedFromDate}
                    onChange={(e) => setLeadCreatedFromDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="relative w-[120px]">
                  <input
                    type="date"
                    value={leadCreatedToDate}
                    onChange={(e) => setLeadCreatedToDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </>
            )}

            <div className="w-px h-6 bg-slate-200" />

            {/* Order Created Date Filter */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <Label className="text-[10px] font-medium text-slate-500 uppercase whitespace-nowrap">Order Created</Label>
              </div>
              <div className="w-[110px]">
                <Select value={orderCreatedDateFilter} onValueChange={setOrderCreatedDateFilter}>
                  <SelectTrigger className="h-8 text-xs rounded-xl border-slate-200">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">None</SelectItem>
                    {dateFilterOptions.map(opt => (
                      <SelectItem key={`order-created-${opt.value}`} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {orderCreatedDateFilter === 'custom' && (
              <>
                <div className="relative w-[120px]">
                  <input
                    type="date"
                    value={orderCreatedFromDate}
                    onChange={(e) => setOrderCreatedFromDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="relative w-[120px]">
                  <input
                    type="date"
                    value={orderCreatedToDate}
                    onChange={(e) => setOrderCreatedToDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Max 31 days</span>
              </>
            )}

            <div className="w-px h-6 bg-slate-200" />

            {/* Source Filter */}
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="h-8 w-40 text-xs rounded-xl border-slate-200">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  {availableSources.map(source => (
                    <SelectItem key={source} value={source} className="text-xs">
                      {source === 'all' ? 'All Sources' : source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Filter Summary */}
      {!loading && report && rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
          <span>
            Level:{' '}
            <span className="font-medium text-slate-700">
              {levels.find(l => extractLevelNumber(l.name).toString() === selectedLevel)?.name || `Level ${selectedLevel}`}
            </span>
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>
            Team:{' '}
            <span className="font-medium text-slate-700">
              {isTeamMode ? (
                <span className="flex items-center gap-1 text-orange-600">
                  <UserCog className="w-3 h-3" />
                  Enabled
                </span>
              ) : (
                'All'
              )}
            </span>
          </span>
          {isDateFilterActive(leadCreatedDateFilter) && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>
                Lead Created:{' '}
                <span className="font-medium text-slate-700">
                  {leadCreatedDateFilter === 'custom' 
                    ? `${formatDate(leadCreatedFromDate)} – ${formatDate(leadCreatedToDate)}`
                    : getDateFilterLabel(leadCreatedDateFilter)}
                </span>
              </span>
            </>
          )}
          {isDateFilterActive(orderCreatedDateFilter) && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>
                Order Created:{' '}
                <span className="font-medium text-slate-700">
                  {orderCreatedDateFilter === 'custom' 
                    ? `${formatDate(orderCreatedFromDate)} – ${formatDate(orderCreatedToDate)}`
                    : getDateFilterLabel(orderCreatedDateFilter)}
                </span>
              </span>
            </>
          )}
          {sourceFilter !== 'all' && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>
                Source:{' '}
                <span className="font-medium text-slate-700">{sourceFilter}</span>
              </span>
            </>
          )}
        </div>
      )}

      {/* Team Mode Banner */}
      {isTeamMode && !loading && report && rows.length > 0 && (
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
          <UserCog className="w-4 h-4 text-orange-600" />
          <span className="text-sm text-orange-800">
            <span className="font-semibold">Team Report:</span> Showing combined team data from the backend
          </span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
          <p className="ml-2 text-sm text-slate-500">Loading revenue data...</p>
        </div>
      ) : !report || (!rows.length && !campaigns.length) ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200">
          <IndianRupee className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No revenue data found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting filters or level</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary Cards */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Leads</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {filteredTotals.totalLead.toLocaleString()}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {formatCurrency(filteredTotals.totalRevenue)}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Orders</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {stats.totalOrders?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-orange-500" />
                </div>
              </div>
            </Card>
            {isTeamMode && (
              <Card className="p-5 bg-orange-50 border border-orange-200 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-orange-600 uppercase tracking-wider">Team Mode</p>
                    <p className="text-sm font-semibold text-orange-700 mt-1">Active</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center">
                    <UserCog className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </Card>
            )}
          </div> */}

          {/* Main Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 border-b border-slate-200">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase sticky left-0 bg-slate-50/80 z-10 min-w-[150px] px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5" />
                      Source
                    </div>
                  </TableHead>
                  {campaigns.map((campaign: string) => (
                    <TableHead key={campaign} className="text-xs font-semibold text-slate-500 uppercase text-center min-w-[140px] px-4 py-3.5">
                      <div className="flex flex-col items-center">
                        <span className="text-slate-700 text-xs">{campaign}</span>
                        <span className="text-[10px] font-normal text-slate-400">Leads / Revenue</span>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center min-w-[140px] px-4 py-3.5 bg-orange-50/50 border-l border-slate-200">
                    <div className="flex flex-col items-center">
                      <span className="text-orange-700">Total</span>
                      <span className="text-[10px] font-normal text-slate-400">Leads / Revenue</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={campaigns.length + 2} className="text-center py-8 text-slate-500">
                      No data found for selected filter
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((item: any, idx: number) => (
                    <TableRow key={item.source || idx} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors group">
                      <TableCell className="text-sm font-medium text-slate-800 sticky left-0 bg-white border-r border-slate-100 z-10 px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span>{item.source}</span>
                          <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500">
                            {item.totalLead || 0} leads
                          </Badge>
                          {item.teamSize && item.teamSize > 1 && (
                            <Badge className="text-[10px] bg-orange-50 text-orange-600 border-orange-200">
                              Team: {item.teamSize}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      {campaigns.map(campaign => {
                        const lead = item[`${campaign}_lead`] || 0;
                        const rev = item[`${campaign}_revenue`] || 0;
                        const hasData = lead > 0 || rev > 0;
                        return (
                          <TableCell 
                            key={campaign} 
                            className="text-sm text-center px-4 py-3.5"
                          >
                            <button
                              onClick={() => hasData && handleCellClick(item.source, campaign, 'lead')}
                              disabled={!hasData}
                              className={cn(
                                "flex flex-col items-center w-full transition-colors",
                                hasData ? "cursor-pointer hover:opacity-70" : "cursor-default opacity-50"
                              )}
                            >
                              <div className={cn(
                                "font-medium",
                                lead > 0 ? "text-slate-700" : "text-slate-400"
                              )}>
                                {lead.toLocaleString()}
                              </div>
                              <div className={cn(
                                "text-xs font-medium",
                                rev > 0 ? "text-emerald-600" : "text-slate-400"
                              )}>
                                {formatCurrency(rev)}
                              </div>
                            </button>
                          </TableCell>
                        );
                      })}
                      <TableCell 
                        className="text-sm text-center px-4 py-3.5 bg-orange-50/30 border-l border-slate-200"
                      >
                        <button
                          onClick={() => handleCellClick(item.source, 'total', 'total')}
                          className="flex flex-col items-center w-full hover:opacity-70 transition-opacity"
                        >
                          <div className="font-bold text-slate-800">
                            {item.totalLead?.toLocaleString() || 0}
                          </div>
                          <div className="text-xs font-semibold text-orange-600">
                            {formatCurrency(item.totalRevenue || 0)}
                          </div>
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}

                {/* Totals Row */}
                {filteredRows.length > 0 && (
                  <TableRow className="bg-slate-50/80 border-t-2 border-slate-200">
                    <TableCell className="text-xs font-semibold text-slate-800 sticky left-0 bg-slate-50/80 z-10 px-5 py-3.5">
                      Total
                    </TableCell>
                    {campaigns.map(campaign => {
                      const lead = columnTotals[campaign]?.lead || 0;
                      const rev = columnTotals[campaign]?.revenue || 0;
                      const orders = columnTotals[campaign]?.orders || [];
                      const hasData = lead > 0 || rev > 0;
                      return (
                        <TableCell key={campaign} className="text-sm text-center px-4 py-3.5">
                          <button
                            onClick={() => hasData && handleCellClick('All Sources', campaign, 'total')}
                            disabled={!hasData}
                            className={cn(
                              "flex flex-col items-center w-full transition-colors",
                              hasData ? "cursor-pointer hover:opacity-70" : "cursor-default opacity-50"
                            )}
                          >
                            <div className="font-semibold text-slate-800">
                              {lead.toLocaleString()}
                            </div>
                            <div className="text-xs font-semibold text-emerald-700">
                              {formatCurrency(rev)}
                            </div>
                          </button>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-sm text-center px-4 py-3.5 font-bold bg-orange-50/50 border-l border-slate-200">
                      <button
                        onClick={() => handleCellClick('All Sources', 'total', 'total')}
                        className="flex flex-col items-center w-full hover:opacity-70 transition-opacity"
                      >
                        <div className="text-slate-800">
                          {filteredTotals.totalLead.toLocaleString()}
                        </div>
                        <div className="text-xs text-orange-700">
                          {formatCurrency(filteredTotals.totalRevenue)}
                        </div>
                      </button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer note */}
          <div className="flex items-center gap-4 text-xs text-slate-400 bg-slate-50/50 px-4 py-2 rounded-lg border border-slate-100">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Click on any lead/revenue number to view order details
            </span>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        orders={modalOrders}
        title={modalTitle}
        source={modalSource}
        campaign={modalCampaign}
      />
    </div>
  );
}