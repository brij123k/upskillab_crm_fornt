import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Card } from '@/components/ui/card';
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

/* -------------------------------------------------------------------------- */
/*                            Main Component                                   */
/* -------------------------------------------------------------------------- */
export function SourceCampaignRevenueReport() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);   // the full API response
  const [showFilters, setShowFilters] = useState(false);

  // Level filter
  const [levels, setLevels] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState('1');

  // Date filter
  const [dateFilter, setDateFilter] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Client‑side filters
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');   // not used, kept for UI consistency

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

  // ─── Fetch report data ───
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

      // No stage / state sent to API – they are only client-side filters for the table
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
  }, [selectedLevel, dateFilter, fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Derived data from the report ───
  const rows = useMemo(() => report?.data || [], [report]);
  const campaigns = useMemo(() => report?.campaigns || [], [report]);
  const totals = report?.totals?.total || { totalLead: 0, revenue: 0 };
  const startDate = report?.startDate || '';
  const endDate = report?.endDate || '';
  const byCampaign = report?.totals?.byCampaign || {};

  // Available stages for filter dropdown (unique source names)
  const availableStages = useMemo(() => {
    if (!rows.length) return ['all'];
    const stages = rows.map((r: any) => r.source).filter(Boolean);
    return ['all', ...Array.from(new Set(stages))];
  }, [rows]);

  // Client‑side filtering
  const filteredRows = useMemo(() => {
    return rows.filter((item: any) => {
      if (searchTerm && !item.source.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (stageFilter !== 'all' && item.source !== stageFilter) return false;
      return true;
    });
  }, [rows, searchTerm, stageFilter]);

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
    const totals: Record<string, { lead: number; revenue: number }> = {};
    campaigns.forEach(camp => {
      const leadTotal = filteredRows.reduce((sum, item) => sum + (item[`${camp}_lead`] || 0), 0);
      const revTotal = filteredRows.reduce((sum, item) => sum + (item[`${camp}_revenue`] || 0), 0);
      totals[camp] = { lead: leadTotal, revenue: revTotal };
    });
    totals['total'] = { lead: filteredTotals.totalLead, revenue: filteredTotals.totalRevenue };
    return totals;
  }, [filteredRows, campaigns, filteredTotals]);

  const hasActiveFilters =
    selectedLevel !== '1' ||
    dateFilter !== 'today' ||
    (dateFilter === 'custom' && (fromDate || toDate)) ||
    stageFilter !== 'all' ||
    searchTerm !== '';

  // ─── Export CSV ───
  const handleExport = () => {
    if (!rows.length && !campaigns.length) {
      toast({ title: 'No data to export' });
      return;
    }
    const headers = ['Source', ...campaigns.flatMap(c => [`${c}_leads`, `${c}_revenue`]), 'Total Leads', 'Total Revenue'];
    const csvRows = filteredRows.map(item => [
      item.source,
      ...campaigns.flatMap(c => [item[`${c}_lead`] || 0, item[`${c}_revenue`] || 0]),
      item.totalLead || 0,
      item.totalRevenue || 0,
    ]);
    csvRows.push([
      'Total',
      ...campaigns.flatMap(c => [columnTotals[c]?.lead || 0, columnTotals[c]?.revenue || 0]),
      filteredTotals.totalLead,
      filteredTotals.totalRevenue,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Revenue by Source Campaign</h3>
          <p className="text-sm text-slate-500">Lead & revenue metrics per source campaign</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="rounded-xl border-slate-200">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
            Refresh
          </Button>
          <Button size="sm" onClick={handleExport} disabled={!report || loading} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
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

            {/* Stage Filter (client‑side only) */}
            <div className="w-[130px]">
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="h-8 text-xs rounded-xl">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  {availableStages.map(stage => (
                    <SelectItem key={stage} value={stage} className="text-xs">
                      {stage === 'all' ? 'All Sources' : stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="relative w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Search source..."
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
          <p className="ml-2 text-sm text-slate-500">Loading revenue data...</p>
        </div>
      ) : !report || (!rows.length && !campaigns.length) ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <IndianRupee className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No revenue data found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting filters or level</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Leads</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {filteredTotals.totalLead.toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {formatCurrency(filteredTotals.totalRevenue)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Avg. Revenue/Lead</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {filteredTotals.totalLead > 0
                      ? formatCurrency(filteredTotals.totalRevenue / filteredTotals.totalLead)
                      : '—'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            </Card>
            {(startDate || endDate) && (
              <Card className="p-5 bg-white border-0 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Date Range</p>
                    <p className="text-sm font-medium text-slate-700 mt-1">
                      {startDate ? new Date(startDate).toLocaleDateString() : '?'} – {endDate ? new Date(endDate).toLocaleDateString() : '?'}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-slate-600" />
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Main Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase sticky left-0 bg-slate-50 z-10 min-w-[140px]">
                    Source / Campaign
                  </TableHead>
                  {campaigns.map((campaign: string) => (
                    <TableHead key={campaign} className="text-xs text-center min-w-[120px] py-3 font-semibold text-slate-500 uppercase">
                      <div>{campaign}</div>
                      <div className="text-[10px] font-normal text-slate-400">Leads / Revenue</div>
                    </TableHead>
                  ))}
                  <TableHead className="text-xs text-center font-semibold text-slate-500 uppercase bg-slate-50 min-w-[120px] py-3">
                    <div>Total</div>
                    <div className="text-[10px] font-normal text-slate-400">Leads / Revenue</div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((item: any, idx: number) => (
                  <TableRow key={item.source || idx} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <TableCell className="text-xs font-medium text-slate-800 sticky left-0 bg-white border-r z-10 py-3">
                      {item.source}
                    </TableCell>
                    {campaigns.map(campaign => {
                      const lead = item[`${campaign}_lead`] || 0;
                      const rev = item[`${campaign}_revenue`] || 0;
                      return (
                        <TableCell key={campaign} className="text-xs text-center py-3">
                          <div className="font-medium text-slate-700">{lead.toLocaleString()}</div>
                          <div className="text-[10px] text-emerald-600">{formatCurrency(rev)}</div>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-xs text-center py-3 bg-slate-50/50">
                      <div className="font-bold text-slate-800">{item.totalLead?.toLocaleString() || 0}</div>
                      <div className="text-[10px] font-semibold text-emerald-600">{formatCurrency(item.totalRevenue || 0)}</div>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Totals Row */}
                {filteredRows.length > 0 && (
                  <TableRow className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                    <TableCell className="text-xs font-semibold text-slate-800 sticky left-0 bg-slate-50 z-10 py-3">
                      Total
                    </TableCell>
                    {campaigns.map(campaign => (
                      <TableCell key={campaign} className="text-xs text-center py-3 font-semibold">
                        <div className="text-slate-800">{columnTotals[campaign]?.lead.toLocaleString() || 0}</div>
                        <div className="text-[10px] text-emerald-700">{formatCurrency(columnTotals[campaign]?.revenue || 0)}</div>
                      </TableCell>
                    ))}
                    <TableCell className="text-xs text-center py-3 font-bold bg-slate-50">
                      <div className="text-slate-800">{filteredTotals.totalLead.toLocaleString()}</div>
                      <div className="text-[10px] text-emerald-700">{formatCurrency(filteredTotals.totalRevenue)}</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Campaign‑wise Totals Summary (only when no search/stage filters) */}
          {Object.keys(byCampaign).length > 0 && !searchTerm && stageFilter === 'all' && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Campaign‑wise Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(byCampaign)
                  .filter(([_, value]: [string, any]) => value.totalLead > 0 || value.revenue > 0)
                  .map(([campaign, value]: [string, any]) => (
                    <div key={campaign} className="p-3 bg-white border border-slate-200 rounded-xl">
                      <p className="text-xs font-medium text-slate-600 truncate">{campaign}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-slate-400">Leads:</span>
                        <span className="text-xs font-semibold">{value.totalLead.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">Revenue:</span>
                        <span className="text-xs font-semibold text-emerald-600">{formatCurrency(value.revenue)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}