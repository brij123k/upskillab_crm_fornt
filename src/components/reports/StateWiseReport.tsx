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
import { Card } from '@/components/ui/card';
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
  ChevronRight,
  BarChart3,
  IndianRupee,
  Layers,
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

interface CampaignData {
  sourceCampaign: string;
  totalLeads: number;
  pcatScheduled: number;
  pcatDone: number;
  registrationDone: number;
  admissionDone: number;
  revenue: number;
  stages: StageCounts;
  conversionPercentage: number;
}

interface StateData {
  state: string;
  totalLeads: number;
  totalAdmissionDone: number;
  totalRevenue: number;
  campaigns: CampaignData[];
}

interface ApiResponse {
  startDate: string;
  endDate: string;
  data: StateData[];
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

  // State & Campaign filters
  const [stateSearch, setStateSearch] = useState('');
  const [campaignSearch, setCampaignSearch] = useState('');

  // Expanded state rows
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());

  // ─── Fetch report data ───
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};

      // Date filter
      if (dateFilter === 'custom') {
        if (!fromDate || !toDate) {
          toast({
            title: 'Missing Dates',
            description: 'Select start and end dates.',
            variant: 'destructive',
          });
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

      // State & campaign filters
      if (stateSearch.trim()) params.state = stateSearch.trim();
      if (campaignSearch.trim()) params.source_campaign = campaignSearch.trim();

      const response = await getDataHandlerWithToken(
        ApiConfig.stateWiseReport,
        params,
        null,
        true
      );

      // The API returns the object directly: { startDate, endDate, data: [...] }
      // getDataHandlerWithToken may wrap it in another .data – handle both cases
      let report: ApiResponse | null = null;

      if (response?.startDate && Array.isArray(response.data)) {
        // Response is already the full object
        report = response as ApiResponse;
      } else if (response?.data && response.data.startDate && Array.isArray(response.data.data)) {
        // Response is wrapped in an extra .data
        report = response.data as ApiResponse;
      } else if (Array.isArray(response?.data)) {
        // Response is the array itself – missing startDate/endDate, but still usable
        report = {
          startDate: '',
          endDate: '',
          data: response.data as StateData[],
        };
      } else {
        report = null;
      }

      setData(report);
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
  }, [dateFilter, fromDate, toDate, stateSearch, campaignSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Export CSV ───
  const handleExport = () => {
    if (!data?.data?.length) {
      toast({ title: 'No data to export' });
      return;
    }
    const headers = [
      'State',
      'Total Leads',
      'Admissions',
      'Revenue',
      'Campaign',
      'Campaign Leads',
      'PCAT S.',
      'PCAT D.',
      'Reg. D.',
      'Adm. D.',
      'Campaign Revenue',
      'Conv. %',
    ];
    const rows: any[] = [];
    data.data.forEach(state => {
      state.campaigns.forEach(camp => {
        rows.push([
          state.state,
          state.totalLeads,
          state.totalAdmissionDone,
          state.totalRevenue,
          camp.sourceCampaign,
          camp.totalLeads,
          camp.pcatScheduled,
          camp.pcatDone,
          camp.registrationDone,
          camp.admissionDone,
          camp.revenue,
          camp.conversionPercentage,
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
    toast({ title: 'Exported!' });
  };

  // ─── Helpers ───
  const toggleState = (state: string) => {
    const newSet = new Set(expandedStates);
    if (newSet.has(state)) newSet.delete(state);
    else newSet.add(state);
    setExpandedStates(newSet);
  };

  const hasActiveFilters =
    dateFilter !== 'today' ||
    (dateFilter === 'custom' && (fromDate || toDate)) ||
    stateSearch !== '' ||
    campaignSearch !== '';

  const grandTotalLeads = data?.data?.reduce((sum, s) => sum + s.totalLeads, 0) || 0;
  const grandTotalAdmissions = data?.data?.reduce((sum, s) => sum + s.totalAdmissionDone, 0) || 0;
  const grandTotalRevenue = data?.data?.reduce((sum, s) => sum + s.totalRevenue, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">State Wise Report</h3>
          <p className="text-sm text-slate-500">Lead metrics aggregated by state</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
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

            {/* State Search */}
            <div className="relative w-44">
              <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Filter by state..."
                value={stateSearch}
                onChange={(e) => setStateSearch(e.target.value)}
                className="pl-7 h-8 text-xs rounded-xl border-slate-200"
              />
            </div>

            {/* Campaign Search */}
            <div className="relative w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Filter by campaign..."
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
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
          <p className="ml-2 text-sm text-slate-500">Loading state‑wise data...</p>
        </div>
      ) : !data || !data.data?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MapPin className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No state data found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting filters or date range</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 bg-white border-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">States</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{data.data.length}</p>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Leads</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{grandTotalLeads.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Admissions</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{grandTotalAdmissions.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Layers className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Revenue</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">₹{grandTotalRevenue.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* State List */}
          <div className="space-y-2">
            {data.data.map(state => (
              <Card
                key={state.state}
                className="border border-slate-200 bg-white shadow-sm overflow-hidden rounded-xl"
              >
                {/* State Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleState(state.state)}
                >
                  <div className="flex items-center gap-3">
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 text-slate-400 transition-transform",
                        expandedStates.has(state.state) && "rotate-90"
                      )}
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{state.state}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span>{state.totalLeads} leads</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>{state.totalAdmissionDone} admissions</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>₹{state.totalRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campaigns Table (expanded) */}
                {expandedStates.has(state.state) && (
                  <div className="border-t border-slate-100 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase min-w-[180px]">
                            Campaign
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">
                            Leads
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">
                            PCAT S.
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">
                            PCAT D.
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">
                            Reg. D.
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">
                            Adm. D.
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">
                            Revenue
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">
                            Conv. %
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">
                            Stages
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {state.campaigns.map(camp => (
                          <TableRow
                            key={camp.sourceCampaign}
                            className="border-b border-slate-50 hover:bg-slate-50/60"
                          >
                            <TableCell className="text-xs font-medium text-slate-800">
                              {camp.sourceCampaign}
                            </TableCell>
                            <TableCell className="text-xs text-center text-slate-600">
                              {camp.totalLeads}
                            </TableCell>
                            <TableCell className="text-xs text-center text-slate-600">
                              {camp.pcatScheduled}
                            </TableCell>
                            <TableCell className="text-xs text-center text-slate-600">
                              {camp.pcatDone}
                            </TableCell>
                            <TableCell className="text-xs text-center text-slate-600">
                              {camp.registrationDone}
                            </TableCell>
                            <TableCell className="text-xs text-center text-slate-600">
                              {camp.admissionDone}
                            </TableCell>
                            <TableCell className="text-xs text-center text-slate-600">
                              ₹{camp.revenue.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-xs text-center font-medium text-slate-800">
                              {camp.conversionPercentage}%
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {Object.entries(camp.stages).map(([stage, count]) => (
                                  <Badge
                                    key={stage}
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 bg-slate-50 border-slate-200 text-slate-600"
                                  >
                                    {stage}: {count}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}