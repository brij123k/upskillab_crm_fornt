import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  RefreshCw,
  Download,
  Filter,
  Search,
  MapPin,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Users,
  UserCheck,
  Layers,
  TrendingUp,
  Building2,
  X,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*                               Type Definitions                              */
/* -------------------------------------------------------------------------- */
interface StageCounts {
  [stageName: string]: number;
}

interface StateDetail {
  state: string;
  totalLeads: number;
  pcatScheduled: number;
  pcatDone: number;
  registrationDone: number;
  admissionDone: number;
  revenue: number;
  stages: StageCounts;
  conversionPercentage: number;
  registrationPercentage: number;
}

interface CampaignData {
  campaignName: string;
  totalLeads: number;
  totalAdmissionDone: number;
  totalRegistrationDone: number;
  totalRevenue: number;
  states: StateDetail[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCampaigns: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ApiResponse {
  startDate: string;
  endDate: string;
  totalLeads: number;
  page: number;
  limit: number;
  totalCampaigns: number;
  totalAdmissionDone: number;
  totalRegistrationDone:number;
  totalRevenue: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  data: CampaignData[];
}

/* -------------------------------------------------------------------------- */
/*                               Date Options                                  */
/* -------------------------------------------------------------------------- */
const dateFilterOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

/* -------------------------------------------------------------------------- */
/*                          Sub-component: State Details Modal                 */
/* -------------------------------------------------------------------------- */

interface StateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  stateName: string;
  stateData: StateDetail | null;
}

function StateDetailsModal({
  isOpen,
  onClose,
  campaignName,
  stateName,
  stateData,
}: StateDetailsModalProps) {
  if (!isOpen || !stateData) return null;

  const totalStages = Object.values(stateData.stages).reduce((a, b) => a + b, 0);
  const sortedStages = Object.entries(stateData.stages).sort((a, b) => b[1] - a[1]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[85vh] p-4 flex flex-col rounded-2xl">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-800">
                State Details
              </DialogTitle>
              <div className="text-sm text-slate-500 mt-1">
                {campaignName} • <span className="font-medium text-slate-700">{stateName}</span>
              </div>
            </div>
            
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Total Leads</p>
              <p className="text-xl font-bold text-slate-800">{stateData.totalLeads}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Admissions</p>
              <p className="text-xl font-bold text-emerald-600">{stateData.admissionDone}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Revenue</p>
              <p className="text-xl font-bold text-orange-600">₹{stateData.revenue.toLocaleString()}</p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-blue-50/50 rounded-lg p-3">
              <p className="text-[10px] font-medium text-blue-600 uppercase tracking-wider">PCAT Scheduled</p>
              <p className="text-lg font-semibold text-blue-700">{stateData.pcatScheduled}</p>
            </div>
            <div className="bg-indigo-50/50 rounded-lg p-3">
              <p className="text-[10px] font-medium text-indigo-600 uppercase tracking-wider">PCAT Done</p>
              <p className="text-lg font-semibold text-indigo-700">{stateData.pcatDone}</p>
            </div>
            <div className="bg-purple-50/50 rounded-lg p-3">
              <p className="text-[10px] font-medium text-purple-600 uppercase tracking-wider">Registrations</p>
              <p className="text-lg font-semibold text-purple-700">{stateData.registrationDone}</p>
            </div>
            <div className="bg-emerald-50/50 rounded-lg p-3">
              <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">Conv. %</p>
              <p className="text-lg font-semibold text-emerald-700">{stateData.conversionPercentage || 0}%</p>
            </div>
          </div>

          {/* Stage Distribution */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage Distribution</h4>
            </div>
            <div className="p-3">
              {sortedStages.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No stage data available</p>
              ) : (
                <div className="space-y-2">
                  {sortedStages.map(([stage, count]) => {
                    const percentage = totalStages > 0 ? Math.round((count / totalStages) * 100) : 0;
                    return (
                      <div key={stage} className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-700 min-w-[100px]">{stage}</span>
                        <div className="flex-1">
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-slate-600 min-w-[60px] text-right">
                          {count} ({percentage}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-slate-200 bg-slate-50/50 flex-shrink-0">
          <Button
            onClick={onClose}
            className="rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                                */
/* -------------------------------------------------------------------------- */

export function StateWiseReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Date filter
  const [dateFilter, setDateFilter] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Campaign & State filters
  const [campaignSearch, setCampaignSearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Expanded campaigns
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());

  // State Details Modal
  const [stateModalOpen, setStateModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedStateData, setSelectedStateData] = useState<StateDetail | null>(null);

  // ─── Fetch report data ───
  const fetchData = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const params: any = {
        page: page,
        limit: 10,
      };

      if (dateFilter === 'custom') {
        if (!fromDate || !toDate) {
          setLoading(false);
          return;
        }
        const diffTime = Math.abs(new Date(toDate).getTime() - new Date(fromDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
          toast({
            title: 'Date range too large',
            description: 'Max 30 days allowed.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        params.fromDate = fromDate;
        params.toDate = toDate;
      } else {
        params.dateFilter = dateFilter;
      }

      if (campaignSearch.trim()) params.source_campaign = campaignSearch.trim();
      if (stateSearch.trim()) params.state = stateSearch.trim();

      const response = await getDataHandlerWithToken(
        ApiConfig.stateWiseReport,
        params,
        null,
        true
      );

      if (response) {
        // Handle the response structure
        let reportData: ApiResponse | null = null;
        
        if (response.startDate && Array.isArray(response.data)) {
          reportData = response as ApiResponse;
        } else if (response.data && response.data.startDate && Array.isArray(response.data.data)) {
          reportData = response.data as ApiResponse;
        } else if (Array.isArray(response.data)) {
          reportData = {
            startDate: '',
            endDate: '',
            totalLeads: 0,
            page: page,
            limit: 10,
            // totalCampaigns: response.data.length,
            totalCampaigns: response.totalCampaigns,
            totalAdmissionDone: response.totalAdmissionDone,
            totalRegistrationDone:response.totalAdmissionDone,
            totalRevenue: response.totalRevenue,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
            data: response.data as CampaignData[],
          };
        } else {
          reportData = null;
        }

        setData(reportData);
      } else {
        setData(null);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load state-wise report',
        variant: 'destructive',
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, fromDate, toDate, campaignSearch, stateSearch]);

  useEffect(() => {
    fetchData(currentPage);
  }, [fetchData, currentPage]);

  // ─── Handle page change ───
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (data && newPage > data.totalPages)) return;
    setCurrentPage(newPage);
    setExpandedCampaigns(new Set());
  };

  // ─── Export CSV ───
  const handleExport = () => {
    if (!data?.data?.length) {
      toast({ title: 'No data to export' });
      return;
    }
    const headers = [
      'Campaign',
      'State',
      'Total Leads',
      'PCAT Scheduled',
      'PCAT Done',
      'Registration Done',
      'Admission Done',
      'Revenue',
      'Conversion %',
      'Registration %',
      'Stages',
    ];
    const rows: any[] = [];
    data.data.forEach(campaign => {
      campaign.states.forEach(state => {
        const stagesStr = Object.entries(state.stages)
          .map(([k, v]) => `${k}:${v}`)
          .join('; ');
        rows.push([
          campaign.campaignName,
          state.state,
          state.totalLeads,
          state.pcatScheduled,
          state.pcatDone,
          state.registrationDone,
          state.admissionDone,
          state.revenue,
          state.conversionPercentage || 0,
          state.registrationPercentage || 0,
          stagesStr,
        ]);
      });
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `state_wise_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported Successfully!' });
  };

  // ─── Toggle campaign expansion ───
  const toggleCampaign = (campaignName: string) => {
    const newSet = new Set(expandedCampaigns);
    if (newSet.has(campaignName)) newSet.delete(campaignName);
    else newSet.add(campaignName);
    setExpandedCampaigns(newSet);
  };

  // ─── Handle state click ───
  const handleStateClick = (campaignName: string, state: StateDetail) => {
    setSelectedCampaign(campaignName);
    setSelectedState(state.state);
    setSelectedStateData(state);
    setStateModalOpen(true);
  };

  // ─── Format date range ───
  const formatDateRange = () => {
    if (data?.startDate && data?.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return `${start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} – ${end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
    return '';
  };

  // ─── Check active filters ───
  const hasActiveFilters =
    dateFilter !== 'today' ||
    (dateFilter === 'custom' && (fromDate || toDate)) ||
    campaignSearch !== '' ||
    stateSearch !== '';

  // ─── Get all unique states for summary ───
  const getUniqueStates = () => {
    const states = new Set<string>();
    data?.data?.forEach(campaign => {
      campaign.states.forEach(state => states.add(state.state));
    });
    return states.size;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">State Campaign Report</h3>
          {data?.startDate && data?.endDate && (
            <p className="text-xs text-slate-400 mt-0.5">{formatDateRange()}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(currentPage)}
            disabled={loading}
            className="rounded-xl border-slate-200"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
            )}
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
                    className="w-full h-8 px-2 text-xs border rounded-xl bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="relative w-[130px]">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-xl bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Max 30 days</span>
              </>
            )}

            {/* Campaign Search */}
            <div className="relative w-44">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Search campaign..."
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                className="pl-7 h-8 text-xs rounded-xl border-slate-200"
              />
            </div>

            {/* State Search */}
            <div className="relative w-44">
              <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Search state..."
                value={stateSearch}
                onChange={(e) => setStateSearch(e.target.value)}
                className="pl-7 h-8 text-xs rounded-xl border-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-orange-400 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading campaign data...</p>
          </div>
        </div>
      ) : !data || !data.data?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
          <Building2 className="w-14 h-14 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No campaign data found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting filters or date range</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            <Card className="p-4 bg-white border border-slate-200 shadow-sm">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Campaigns</p>
              <p className="text-2xl font-bold text-slate-800">{data.totalCampaigns || data.data.length}</p>
            </Card>
            <Card className="p-4 bg-white border border-slate-200 shadow-sm">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Total Leads</p>
              <p className="text-2xl font-bold text-slate-800">{data.totalLeads.toLocaleString()}</p>
            </Card>
            <Card className="p-4 bg-white border border-slate-200 shadow-sm">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Registrations</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.totalRegistrationDone.toLocaleString()}
              </p>
            </Card>
            <Card className="p-4 bg-white border border-slate-200 shadow-sm">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Admissions</p>
              <p className="text-2xl font-bold text-emerald-600">
                {data.totalAdmissionDone}
              </p>
            </Card>
            <Card className="p-4 bg-white border border-slate-200 shadow-sm">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Revenue</p>
              <p className="text-2xl font-bold text-orange-600">
                ₹{data.totalRevenue.toLocaleString()}
              </p>
            </Card>
          </div>

          {/* Main Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 border-b border-slate-200">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50/80 z-10 min-w-[180px] py-3 px-4">
                      Campaign
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center min-w-[100px] py-3 px-4">
                      Total Leads
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center min-w-[100px] py-3 px-4">
                      Registrations
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center min-w-[100px] py-3 px-4">
                      Admissions
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center min-w-[130px] py-3 px-4 bg-orange-50/50">
                      <div className="flex items-center justify-center gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-orange-700">Revenue</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center min-w-[80px] py-3 px-4">
                      States
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((campaign) => {
                    const isExpanded = expandedCampaigns.has(campaign.campaignName);
                    const totalStates = campaign.states.length;

                    return (
                      <>
                        {/* Campaign Row */}
                        <TableRow
                          key={campaign.campaignName}
                          className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors cursor-pointer"
                          onClick={() => toggleCampaign(campaign.campaignName)}
                        >
                          <TableCell className="text-sm sticky left-0 bg-white border-r border-slate-100 z-10 py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button className="p-0.5 hover:bg-slate-100 rounded">
                                {isExpanded ? (
                                  <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                              <span className="font-medium text-slate-800">{campaign.campaignName}</span>
                              <Badge variant="outline" className="text-[10px] bg-slate-50">
                                {totalStates} states
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-center py-3 px-4">
                            <span className="font-medium text-slate-700">{campaign.totalLeads}</span>
                          </TableCell>
                          <TableCell className="text-sm text-center py-3 px-4">
                            <span className="font-medium text-purple-600">{campaign.totalRegistrationDone}</span>
                          </TableCell>
                          <TableCell className="text-sm text-center py-3 px-4">
                            <span className="font-medium text-emerald-600">{campaign.totalAdmissionDone}</span>
                          </TableCell>
                          <TableCell className="text-sm text-center py-3 px-4 bg-orange-50/30">
                            <span className="font-semibold text-orange-600">₹{campaign.totalRevenue.toLocaleString()}</span>
                          </TableCell>
                          <TableCell className="text-sm text-center py-3 px-4">
                            <span className="text-sm text-slate-500">{totalStates}</span>
                          </TableCell>
                        </TableRow>

                        {/* States Sub-table (expanded) */}
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={6} className="p-0 bg-slate-50/30">
                              <div className="px-4 py-3">
                                <div className="flex items-center gap-2 mb-3">
                                  <MapPin className="w-4 h-4 text-orange-500" />
                                  <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">
                                    States Breakdown
                                  </span>
                                  <Badge variant="outline" className="text-[10px]">
                                    {totalStates} states
                                  </Badge>
                                </div>
                                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-orange-50/50 border-b border-slate-200">
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase min-w-[140px] py-2 px-3">
                                          State
                                        </TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center min-w-[80px] py-2 px-3">
                                          Leads
                                        </TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center min-w-[80px] py-2 px-3">
                                          PCAT S.
                                        </TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center min-w-[80px] py-2 px-3">
                                          PCAT D.
                                        </TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center min-w-[80px] py-2 px-3">
                                          Reg. D.
                                        </TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center min-w-[80px] py-2 px-3">
                                          Adm. D.
                                        </TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center min-w-[110px] py-2 px-3">
                                          Revenue
                                        </TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center min-w-[80px] py-2 px-3">
                                          Conv. %
                                        </TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center min-w-[80px] py-2 px-3">
                                          Reg. %
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {campaign.states.map((state) => (
                                        <TableRow
                                          key={state.state}
                                          className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors cursor-pointer"
                                          onClick={() => handleStateClick(campaign.campaignName, state)}
                                        >
                                          <TableCell className="text-xs font-medium text-slate-800 py-2 px-3">
                                            <div className="flex items-center gap-2">
                                              <MapPin className="w-3 h-3 text-slate-400" />
                                              {state.state}
                                              <Badge variant="outline" className="text-[8px] px-1 py-0 bg-orange-50 border-orange-200 text-orange-600">
                                                Click for details
                                              </Badge>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-xs text-center py-2 px-3 text-slate-600">
                                            {state.totalLeads}
                                          </TableCell>
                                          <TableCell className="text-xs text-center py-2 px-3 text-slate-600">
                                            {state.pcatScheduled}
                                          </TableCell>
                                          <TableCell className="text-xs text-center py-2 px-3 text-slate-600">
                                            {state.pcatDone}
                                          </TableCell>
                                          <TableCell className="text-xs text-center py-2 px-3 text-purple-600 font-medium">
                                            {state.registrationDone}
                                          </TableCell>
                                          <TableCell className="text-xs text-center py-2 px-3 text-emerald-600 font-medium">
                                            {state.admissionDone}
                                          </TableCell>
                                          <TableCell className="text-xs text-center py-2 px-3 font-medium text-orange-600">
                                            ₹{state.revenue.toLocaleString()}
                                          </TableCell>
                                          <TableCell className="text-xs text-center py-2 px-3">
                                            <span className={cn(
                                              "px-2 py-0.5 rounded-full font-medium text-[10px]",
                                              state.conversionPercentage > 50 ? "bg-emerald-100 text-emerald-700" :
                                              state.conversionPercentage > 25 ? "bg-amber-100 text-amber-700" :
                                              "bg-slate-100 text-slate-600"
                                            )}>
                                              {state.conversionPercentage || 0}%
                                            </span>
                                          </TableCell>
                                          <TableCell className="text-xs text-center py-2 px-3">
                                            <span className={cn(
                                              "px-2 py-0.5 rounded-full font-medium text-[10px]",
                                              state.registrationPercentage > 50 ? "bg-purple-100 text-purple-700" :
                                              state.registrationPercentage > 25 ? "bg-indigo-100 text-indigo-700" :
                                              "bg-slate-100 text-slate-600"
                                            )}>
                                              {state.registrationPercentage || 0}%
                                            </span>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-slate-500">
                Showing page {data.page || currentPage} of {data.totalPages}
                <span className="ml-3">
                  Total: <span className="font-medium text-slate-700">{data.totalCampaigns}</span> campaigns
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!data.hasPreviousPage || loading}
                  className="h-8 w-8 p-0 rounded-lg border-slate-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    let pageNum;
                    const totalPages = data.totalPages;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage < 3) {
                      pageNum = i + 1;
                    } else if (currentPage > totalPages - 3) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={cn(
                          "w-8 h-8 text-sm font-medium rounded-lg transition-colors",
                          isActive
                            ? "bg-orange-500 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!data.hasNextPage || loading}
                  className="h-8 w-8 p-0 rounded-lg border-slate-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span>Showing {data.data.length} campaigns</span>
            <span>Last updated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* State Details Modal */}
      <StateDetailsModal
        isOpen={stateModalOpen}
        onClose={() => setStateModalOpen(false)}
        campaignName={selectedCampaign}
        stateName={selectedState}
        stateData={selectedStateData}
      />
    </div>
  );
}

// ─── Card component for summary ───
function Card({ className, children, ...props }: any) {
  return (
    <div
      className={cn("rounded-xl bg-white", className)}
      {...props}
    >
      {children}
    </div>
  );
}