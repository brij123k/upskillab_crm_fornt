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
  TrendingUp,
  PieChart,
  Layers,
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
  const [report, setReport] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Level filter
  const [levels, setLevels] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState('1');

  // Date filter
  const [dateFilter, setDateFilter] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Client‑side filters
  const [sourceFilter, setSourceFilter] = useState('all');

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
    sourceFilter !== 'all';

  // ─── Export CSV ───
  const handleExport = () => {
    if (!rows.length && !campaigns.length) {
      toast({ title: 'No data to export' });
      return;
    }
    const headers = ['Source', ...campaigns.flatMap(c => [`${c}_leads`, `${c}_revenue`]), 'Total Leads', 'Total Revenue'];
    const csvRows = filteredRows.map((item: any) => [
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
          className="gap-1 h-8 text-xs rounded-xl"
        >
          <Filter className="w-3 h-3" />
          Filters
          {hasActiveFilters && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-orange-500" />}
          {showFilters ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
        </Button>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 w-full">
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

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-8 w-32 text-xs rounded-xl border-slate-200">
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
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-xl">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-7 px-2 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-orange-400 rounded"
                />
                <span className="text-xs text-slate-400">→</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-7 px-2 text-xs border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-orange-400 rounded"
                />
                <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-full">Max 30 days</span>
              </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Avg. Revenue/Lead</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {filteredTotals.totalLead > 0
                      ? formatCurrency(filteredTotals.totalRevenue / filteredTotals.totalLead)
                      : '—'}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
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
          </div>

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
                    <TableHead key={campaign} className="text-xs font-semibold text-slate-500 uppercase text-center min-w-[130px] px-4 py-3.5">
                      <div className="flex flex-col items-center">
                        <span className="text-slate-700">{campaign}</span>
                        <span className="text-[10px] font-normal text-slate-400">Leads / Revenue</span>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center min-w-[130px] px-4 py-3.5 bg-orange-50/50 border-l border-slate-200">
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
                    <TableRow key={item.source || idx} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <TableCell className="text-sm font-medium text-slate-800 sticky left-0 bg-white border-r border-slate-100 z-10 px-5 py-3.5">
                        {item.source}
                      </TableCell>
                      {campaigns.map(campaign => {
                        const lead = item[`${campaign}_lead`] || 0;
                        const rev = item[`${campaign}_revenue`] || 0;
                        return (
                          <TableCell key={campaign} className="text-sm text-center px-4 py-3.5">
                            <div className="font-medium text-slate-700">{lead.toLocaleString()}</div>
                            <div className="text-xs text-emerald-600 font-medium">{formatCurrency(rev)}</div>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-sm text-center px-4 py-3.5 bg-orange-50/30 border-l border-slate-200">
                        <div className="font-bold text-slate-800">{item.totalLead?.toLocaleString() || 0}</div>
                        <div className="text-xs font-semibold text-orange-600">{formatCurrency(item.totalRevenue || 0)}</div>
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
                      return (
                        <TableCell key={campaign} className="text-sm text-center px-4 py-3.5 font-semibold">
                          <div className="text-slate-800">{lead.toLocaleString()}</div>
                          <div className="text-xs text-emerald-700">{formatCurrency(rev)}</div>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-sm text-center px-4 py-3.5 font-bold bg-orange-50/50 border-l border-slate-200">
                      <div className="text-slate-800">{filteredTotals.totalLead.toLocaleString()}</div>
                      <div className="text-xs text-orange-700">{formatCurrency(filteredTotals.totalRevenue)}</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}