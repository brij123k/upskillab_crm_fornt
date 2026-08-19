import React, { useState, useEffect, useCallback } from 'react';
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
  Award,
  IndianRupee,
  Users,
  ChevronUp,
  ChevronDown,
  X,
  Eye,
  Phone,
  Calendar as CalendarIcon,
  CreditCard,
  Tag,
  TrendingUp,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*                                Types                                       */
/* -------------------------------------------------------------------------- */
interface OrderDetailItem {
  _id?: string;
  studentName?: string;
  email?: string;
  mobile?: string;
  courseName?: string;
  orderDate?: string;
  paymentMode?: string;
  status?: string;
  revenue?: number;
  finalFee?: number;
  discount?: number;
  totalFee?: number;
  courseDuration?: string;
  countedRevenue?: number;
}

interface LeadDetailItem {
  _id?: string;
  name?: string;
  studentName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  city?: string;
  state?: string;
  source?: string;
  source_campaign?: string;
  leadStatus?: string;
  status?: string;
  assignedDate?: string;
  createdAt?: string;
}

interface ConsultantPerformance {
  _id?: string;
  consultantId?: string;
  consultantName: string;
  consultantEmail?: string;
  totalLeadAssigned: number;
  admDone: number;
  bookedRevenue: number;
  realisedRevenue: number;
  [key: string]: any;
}

/* -------------------------------------------------------------------------- */
/*                                Utility Helpers                              */
/* -------------------------------------------------------------------------- */
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusColor = (status: string) => {
  if (!status) return 'text-slate-600 bg-slate-50';
  const s = status.toLowerCase();
  if (s === 'fully paid' || s === 'paid') return 'text-emerald-600 bg-emerald-50';
  if (s === 'partially paid') return 'text-amber-600 bg-amber-50';
  if (s === 'pending') return 'text-orange-600 bg-orange-50';
  if (s === 'cancelled' || s === 'canceled') return 'text-red-600 bg-red-50';
  if (s === 'completed') return 'text-blue-600 bg-blue-50';
  if (s === 'assigned') return 'text-purple-600 bg-purple-50';
  if (s === 'converted') return 'text-emerald-600 bg-emerald-50';
  if (s === 'lost') return 'text-red-600 bg-red-50';
  if (s === 'active') return 'text-blue-600 bg-blue-50';
  if (s === 'pcat_registered') return 'text-purple-600 bg-purple-50';
  return 'text-slate-600 bg-slate-50';
};

const getLeadStatusColor = (status: string) => {
  if (!status) return 'text-slate-600 bg-slate-50';
  const s = status.toLowerCase();
  if (s === 'active') return 'text-blue-600 bg-blue-50';
  if (s === 'pcat_registered') return 'text-purple-600 bg-purple-50';
  if (s === 'converted') return 'text-emerald-600 bg-emerald-50';
  if (s === 'lost') return 'text-red-600 bg-red-50';
  if (s === 'assigned') return 'text-amber-600 bg-amber-50';
  return 'text-slate-600 bg-slate-50';
};

/* -------------------------------------------------------------------------- */
/*                            Date Filter Options                              */
/* -------------------------------------------------------------------------- */
const dateFilterOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

/* -------------------------------------------------------------------------- */
/*                             Main Report Component                          */
/* -------------------------------------------------------------------------- */
export function ConsultantPerformanceReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ConsultantPerformance[] | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Level filter
  const [levels, setLevels] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState('1');

  // Date filter
  const [dateFilter, setDateFilter] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // User filter
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('all');

  // Search (consultant name)
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState<{
    title: string;
    type: string;
    consultantName: string;
    total: number;
    items: any[];
  } | null>(null);

  // Pagination for modal
  const [modalPage, setModalPage] = useState(0);
  const [modalSearch, setModalSearch] = useState('');
  const ITEMS_PER_PAGE = 10;

  // ─── Fetch levels & users ───
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
    const fetchUsers = async () => {
      try {
        const res = await getDataHandlerWithToken('getAllUser', null, null);
        setUsers(res?.data || res || []);
      } catch (error) {
        /* ignore */
      }
    };
    fetchLevels();
    fetchUsers();
  }, []);

  const extractLevelNumber = (name: string): number => {
    const match = name.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  };

  // ─── Fetch consultant data ───
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        level: parseInt(selectedLevel) || 1,
      };
      if (dateFilter === 'custom') {
        if (!fromDate || !toDate) {
          toast({ title: 'Missing Dates', description: 'Select start and end dates.', variant: 'destructive' });
          setLoading(false);
          return;
        }
        const diffTime = Math.abs(new Date(toDate).getTime() - new Date(fromDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
          toast({ title: 'Date range too large', description: 'Max 30 days', variant: 'destructive' });
          setLoading(false);
          return;
        }
        params.fromDate = fromDate;
        params.toDate = toDate;
      } else {
        params.dateFilter = dateFilter;
      }

      if (selectedUserId && selectedUserId !== 'all') {
        params.userId = selectedUserId;
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.consultantPerforment,
        params,
        null,
        true
      );
      const consultants = response?.data || response || [];
      setData(Array.isArray(consultants) ? consultants : []);
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load consultant performance', variant: 'destructive' });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedLevel, dateFilter, fromDate, toDate, selectedUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Fetch detail data for modal ───
  const fetchDetailData = async (consultantId: string, consultantName: string, type: string, title: string) => {
    setModalLoading(true);
    setModalPage(0);
    setModalSearch('');
    try {
      const params: any = {
        counsellorId: consultantId,
        type: type,
      };

      if (dateFilter === 'custom') {
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
      } else {
        params.dateFilter = dateFilter;
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.consultantPerformentDetail,
        params,
        null,
        true
      );
      setModalData({
        title: title,
        type: type,
        consultantName: consultantName,
        total: response.total || 0,
        items: response.data || [],
      });
      setIsModalOpen(true);
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load details', variant: 'destructive' });
    } finally {
      setModalLoading(false);
    }
  };

  // ─── Handle click on metrics ───
  const handleMetricClick = (consultant: ConsultantPerformance, type: string) => {
    const consultantId = consultant._id || consultant.consultantId;
    if (!consultantId) {
      toast({ title: 'Error', description: 'Consultant ID not found' });
      return;
    }

    let title = '';
    let count = 0;

    switch (type) {
      case 'assigned-leads':
        title = 'Assigned Leads';
        count = consultant.totalLeadAssigned || 0;
        break;
      case 'admission-leads':
        title = 'Admission Leads';
        count = consultant.admDone || 0;
        break;
      case 'orders':
        title = 'Orders';
        count = consultant.realisedRevenue > 0 ? 1 : 0;
        break;
      default:
        return;
    }

    if (count === 0) {
      toast({ title: 'No data', description: `No ${title.toLowerCase()} found for this consultant` });
      return;
    }

    fetchDetailData(consultantId, consultant.consultantName, type, title);
  };

  // ─── Export CSV ───
  const handleExport = () => {
    if (!data || data.length === 0) {
      toast({ title: 'No data to export' });
      return;
    }
    const headers = ['Consultant', 'Leads Assigned', 'Admissions', 'Booked Revenue', 'Realised Revenue'];
    const rows = data.map(c => [
      c.consultantName || '',
      c.totalLeadAssigned || 0,
      c.admDone || 0,
      c.bookedRevenue || 0,
      c.realisedRevenue || 0,
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consultant_performance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  };

  // ─── Client‑side search ───
  const filteredConsultants = data?.filter(c =>
    searchTerm ? c.consultantName?.toLowerCase().includes(searchTerm.toLowerCase()) : true
  ) || [];

  const totalRevenue = filteredConsultants.reduce((sum, c) => sum + (c.bookedRevenue || 0), 0);
  const totalLeads = filteredConsultants.reduce((sum, c) => sum + (c.totalLeadAssigned || 0), 0);
  const totalAdmissions = filteredConsultants.reduce((sum, c) => sum + (c.admDone || 0), 0);

  const hasActiveFilters =
    selectedLevel !== '1' ||
    dateFilter !== 'today' ||
    (dateFilter === 'custom' && (fromDate || toDate)) ||
    selectedUserId !== 'all' ||
    searchTerm !== '';

  // ─── Modal filtering and pagination ───
  const filteredModalItems = modalData?.items?.filter(item => {
    if (!modalSearch) return true;
    const searchLower = modalSearch.toLowerCase();
    const name = item.studentName || item.name || '';
    const email = item.email || '';
    const phone = item.mobile || item.phone || '';
    return name.toLowerCase().includes(searchLower) ||
           email.toLowerCase().includes(searchLower) ||
           phone.includes(searchLower);
  }) || [];

  const paginatedModalItems = filteredModalItems.slice(
    modalPage * ITEMS_PER_PAGE,
    (modalPage + 1) * ITEMS_PER_PAGE
  );

  const modalTotalPages = Math.ceil(filteredModalItems.length / ITEMS_PER_PAGE);

  // ─── Render Lead Item ───
  const renderLeadItem = (item: LeadDetailItem) => {
    return (
      <TableRow className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
        <TableCell className="text-sm py-3">
          <div className="flex flex-col">
            <span className="font-medium text-slate-800">{item.name || item.studentName || 'N/A'}</span>
            <span className="text-xs text-slate-400">{item.email || 'No email'}</span>
          </div>
        </TableCell>
        <TableCell className="text-sm py-3">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm">{item.phone || item.mobile || 'N/A'}</span>
          </div>
        </TableCell>
        <TableCell className="text-sm py-3">
          <div className="flex flex-col">
            <span className="text-sm">{item.city || 'N/A'}</span>
            <span className="text-xs text-slate-400">{item.state || ''}</span>
          </div>
        </TableCell>
        <TableCell className="text-sm py-3">
          <span className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full",
            getLeadStatusColor(item.leadStatus || item.status || 'active')
          )}>
            {item.leadStatus || item.status || 'Active'}
          </span>
        </TableCell>
        <TableCell className="text-sm py-3">
          <div className="flex flex-col">
            <span className="text-xs">{item.source || 'N/A'}</span>
            {item.source_campaign && (
              <span className="text-[10px] text-slate-400">{item.source_campaign}</span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-sm py-3 text-slate-500">
          {formatDate(item.assignedDate || item.createdAt || '')}
        </TableCell>
      </TableRow>
    );
  };

  // ─── Render Order Item ───
  const renderOrderItem = (item: OrderDetailItem) => {
    const revenue = item.revenue || item.countedRevenue || 0;
    const finalFee = item.finalFee || item.totalFee || 0;
    const discount = item.discount || 0;
    const hasDiscount = discount > 0;
    const isFullyPaid = item.status?.toLowerCase() === 'fully paid';
    const isPartiallyPaid = item.status?.toLowerCase() === 'partially paid';

    return (
      <TableRow className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
        <TableCell className="text-sm py-3">
          <div className="flex flex-col">
            <span className="font-medium text-slate-800">{item.studentName || 'N/A'}</span>
            <span className="text-xs text-slate-400">{item.email || 'No email'}</span>
          </div>
        </TableCell>
        <TableCell className="text-sm py-3">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm">{item.mobile || 'N/A'}</span>
          </div>
        </TableCell>
        <TableCell className="text-sm py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">{item.courseName || 'N/A'}</span>
            {item.courseDuration && (
              <span className="text-xs text-slate-400">{item.courseDuration} days</span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-sm py-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-emerald-600">
              {formatCurrency(revenue)}
            </span>
            {isPartiallyPaid && (
              <span className="text-xs text-amber-600">Partially Paid</span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-sm py-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-slate-700">
              {formatCurrency(finalFee)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-emerald-600">
                Discount: -{formatCurrency(discount)}
              </span>
            )}
            {item.totalFee && item.totalFee !== finalFee && (
              <span className="text-xs text-slate-400 line-through">
                {formatCurrency(item.totalFee)}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-sm py-3 text-slate-500">
          {formatDate(item.orderDate || '')}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Consultant Performance</h3>
          <p className="text-sm text-slate-500">Revenue & admissions by consultant</p>
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
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-8 text-xs rounded-xl">
                  <SelectValue placeholder="Select date" />
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

            {dateFilter === 'custom' && (
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

            {/* User Filter */}
            <div className="w-[180px]">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="h-8 text-xs rounded-xl">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Users</SelectItem>
                  {users.map((u: any) => (
                    <SelectItem key={u._id || u.id} value={u._id || u.id} className="text-xs">
                      {u.name || u.fullName || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Consultant Search */}
            <div className="relative w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Search consultant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
          <p className="ml-2 text-sm text-slate-500">Loading consultant data...</p>
        </div>
      ) : !data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Award className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No consultant data found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting filters or level</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Leads</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{totalLeads}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Admissions</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{totalAdmissions}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Consultant Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConsultants.map((consultant, idx) => {
              const hasLeads = (consultant.totalLeadAssigned || 0) > 0;
              const hasAdmissions = (consultant.admDone || 0) > 0;
              const hasRevenue = (consultant.realisedRevenue || 0) > 0;

              return (
                <Card key={consultant._id || idx} className="p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all rounded-xl">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{consultant.consultantName}</h4>
                      {consultant.consultantEmail && (
                        <p className="text-xs text-slate-400 mt-0.5">{consultant.consultantEmail}</p>
                      )}
                    </div>
                    {/* <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      {formatCurrency(consultant.bookedRevenue)}
                    </span> */}
                    

                    {/* Realised Revenue */}
                    <button
                      onClick={() => handleMetricClick(consultant, 'orders')}
                      disabled={!hasRevenue}
                      className={cn(
                        "text-center p-2 rounded-lg transition-all",
                        hasRevenue 
                          ? "hover:bg-orange-50 cursor-pointer" 
                          : "cursor-not-allowed opacity-60"
                      )}
                    >
                      <p className="text-xs text-slate-400">Realised</p>
                      <p className="text-base font-bold text-orange-600">
                        {formatCurrency(consultant.realisedRevenue)}
                      </p>
                      {/* {hasRevenue && (
                        <Eye className="w-3 h-3 mx-auto mt-0.5 text-slate-400" />
                      )} */}
                    </button>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                    {/* Leads Assigned */}
                      <button
                      onClick={() => handleMetricClick(consultant, 'assigned-leads')}
                      disabled={!hasLeads}
                      className={cn(
                        "text-center p-2 rounded-lg transition-all",
                        hasLeads 
                          ? "hover:bg-blue-50 cursor-pointer" 
                          : "cursor-not-allowed opacity-60"
                      )}
                    >
                      <p className="text-xs text-slate-400">Assigned Leads</p>
                      <p className="text-base font-bold text-blue-600">
                        {consultant.totalLeadAssigned || 0}
                      </p>
                      {/* {hasLeads && (
                        <Eye className="w-3 h-3 mx-auto mt-0.5 text-slate-400" />
                      )} */}
                    </button>

                    {/* Admissions */}
                    <button
                      onClick={() => handleMetricClick(consultant, 'admission-leads')}
                      disabled={!hasAdmissions}
                      className={cn(
                        "text-center p-2 rounded-lg transition-all",
                        hasAdmissions 
                          ? "hover:bg-emerald-50 cursor-pointer" 
                          : "cursor-not-allowed opacity-60"
                      )}
                    >
                      <p className="text-xs text-slate-400">Admissions</p>
                      <p className="text-base font-bold text-emerald-600">
                        {consultant.admDone || 0}
                      </p>
                      {/* {hasAdmissions && (
                        <Eye className="w-3 h-3 mx-auto mt-0.5 text-slate-400" />
                      )} */}
                    </button>

                    
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredConsultants.length === 0 && searchTerm && (
            <div className="text-center py-8 text-sm text-slate-400">
              No consultants match "{searchTerm}"
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{modalData.title}</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  <span className="font-medium text-slate-700">{modalData.consultantName}</span>
                  <span className="mx-2">•</span>
                  <span className="font-medium text-slate-700">{modalData.total}</span> {modalData.type === 'orders' ? 'orders' : 'leads'} found
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                  <span className="ml-2 text-sm text-slate-500">Loading details...</span>
                </div>
              ) : modalData.items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No {modalData.title.toLowerCase()} found</p>
                </div>
              ) : (
                <>
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder={`Search ${modalData.type === 'orders' ? 'orders' : 'leads'}...`}
                      value={modalSearch}
                      onChange={(e) => {
                        setModalSearch(e.target.value);
                        setModalPage(0);
                      }}
                      className="pl-10 h-9 text-sm rounded-xl border-slate-200"
                    />
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80 border-b border-slate-200">
                          {modalData.type === 'orders' ? (
                            <>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[180px] py-3 px-4">
                                Student
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[130px] py-3 px-4">
                                Contact
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[180px] py-3 px-4">
                                Course
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right min-w-[130px] py-3 px-4 bg-orange-50/50">
                                <span className="text-orange-700">Revenue</span>
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right min-w-[140px] py-3 px-4">
                                Final Fee
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[120px] py-3 px-4">
                                Order Date
                              </TableHead>
                            </>
                          ) : (
                            <>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[180px] py-3 px-4">
                                Lead Name
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[130px] py-3 px-4">
                                Contact
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[140px] py-3 px-4">
                                Location
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[100px] py-3 px-4">
                                Status
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[140px] py-3 px-4">
                                Source
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[120px] py-3 px-4">
                                Assigned Date
                              </TableHead>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedModalItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={modalData.type === 'orders' ? 7 : 6} className="text-center py-8 text-slate-500">
                              No results found
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedModalItems.map((item, index) => (
                            <React.Fragment key={item._id || item.orderId || item.leadId || index}>
                              {modalData.type === 'orders' ? renderOrderItem(item) : renderLeadItem(item)}
                            </React.Fragment>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {modalTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <div className="text-sm text-slate-500">
                        Showing {modalPage * ITEMS_PER_PAGE + 1} to{' '}
                        {Math.min((modalPage + 1) * ITEMS_PER_PAGE, filteredModalItems.length)} of{' '}
                        {filteredModalItems.length}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModalPage(p => Math.max(0, p - 1))}
                          disabled={modalPage === 0}
                          className="h-8 w-8 p-0 rounded-lg border-slate-200"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-1.5">
                          {Array.from({ length: Math.min(5, modalTotalPages) }, (_, i) => {
                            let pageNum;
                            if (modalTotalPages <= 5) {
                              pageNum = i;
                            } else if (modalPage < 3) {
                              pageNum = i;
                            } else if (modalPage > modalTotalPages - 3) {
                              pageNum = modalTotalPages - 5 + i;
                            } else {
                              pageNum = modalPage - 2 + i;
                            }
                            const isActive = pageNum === modalPage;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setModalPage(pageNum)}
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
                          onClick={() => setModalPage(p => Math.min(modalTotalPages - 1, p + 1))}
                          disabled={modalPage === modalTotalPages - 1}
                          className="h-8 w-8 p-0 rounded-lg border-slate-200"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-4 border-t border-slate-200 bg-slate-50/50">
              <div className="text-sm text-slate-500">
                Total: <span className="font-medium text-slate-700">{filteredModalItems.length}</span> items
              </div>
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