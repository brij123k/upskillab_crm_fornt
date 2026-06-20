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
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2,
  RefreshCw,
  Download,
  Filter,
  Search,
  BarChart3,
  ChevronUp,
  ChevronDown,
  Calendar,
  Layers,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*                               Date Options                                 */
/* -------------------------------------------------------------------------- */
const dateFilterOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

/* -------------------------------------------------------------------------- */
/*                              Main Component                                 */
/* -------------------------------------------------------------------------- */
export function SourceCampaignReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);          // full API response
  const [showFilters, setShowFilters] = useState(false);

  // Level filter
  const [levels, setLevels] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState('1');

  // Date filter
  const [dateFilter, setDateFilter] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Client‑side search
  const [searchTerm, setSearchTerm] = useState('');

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
        ApiConfig.sourcecampaignstagesummary,
        params,
        null,
        true
      );
      // The response might be { data: [...], sourceCampaigns: [...], ... } or just an array
      const report = response?.data || response;
      setData(report);
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load source campaign report', variant: 'destructive' });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedLevel, dateFilter, fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Derived data ───
  const rows = useMemo(() => {
    if (!data) return [];
    // The API may return array directly or inside data.data
    const raw = Array.isArray(data) ? data : data.data;
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const sourceCampaigns = useMemo(() => {
    if (!data) return [];
    return data.sourceCampaigns || [];
  }, [data]);

  const grandTotal = data?.grandTotal || 0;
  const startDate = data?.startDate || '';
  const endDate = data?.endDate || '';
  const totalsByCampaign = data?.totalsByCampaign || {};

  // Client‑side search
  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;
    return rows.filter((item: any) =>
      item.sourceCampaignName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rows, searchTerm]);

  // Column totals for filtered rows
  const columnTotals = useMemo(() => {
    if (!filteredRows.length) return {};
    const totals: Record<string, number> = {};
    sourceCampaigns.forEach((campaign: string) => {
      totals[campaign] = filteredRows.reduce((sum, item) => sum + (item[campaign] || 0), 0);
    });
    totals['total'] = filteredRows.reduce((sum, item) => sum + (item.total || 0), 0);
    return totals;
  }, [filteredRows, sourceCampaigns]);

  const hasActiveFilters =
    selectedLevel !== '1' ||
    dateFilter !== 'today' ||
    (dateFilter === 'custom' && (fromDate || toDate)) ||
    searchTerm !== '';

  // ─── Export CSV ───
  const handleExport = () => {
    if (!rows.length && !sourceCampaigns.length) {
      toast({ title: 'No data to export' });
      return;
    }
    const headers = ['Lead Stage / Campaign', ...sourceCampaigns, 'Total'];
    const csvRows = rows.map(row => [
      row.sourceCampaignName,
      ...sourceCampaigns.map(camp => row[camp] || 0),
      row.total || 0,
    ]);
    // Add totals row
    csvRows.push(['Total', ...sourceCampaigns.map(camp => columnTotals[camp] || 0), columnTotals.total || 0]);
    const csvContent = [headers, ...csvRows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `source_campaign_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Source Campaign</h3>
          <p className="text-sm text-slate-500">Lead distribution by campaign & stage</p>
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

            {/* Search */}
            <div className="relative w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Search campaign..."
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
          <p className="ml-2 text-sm text-slate-500">Loading source campaign data...</p>
        </div>
      ) : !data || (!rows.length && !sourceCampaigns.length) ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No source campaign data found</p>
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
                  <p className="text-2xl font-bold text-slate-800 mt-1">{grandTotal.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Campaigns</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{sourceCampaigns.length}</p>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Layers className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Lead Stages</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{filteredRows.length}</p>
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
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase sticky left-0 bg-slate-50 z-10 min-w-[160px]">
                    Lead Stage / Campaign
                  </TableHead>
                  {sourceCampaigns.map((campaign: string) => (
                    <TableHead key={campaign} className="text-xs text-right min-w-[100px] py-3 font-semibold text-slate-500 uppercase">
                      {campaign}
                    </TableHead>
                  ))}
                  <TableHead className="text-xs text-right font-semibold text-slate-500 uppercase bg-slate-50 min-w-[80px] py-3">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((item: any, idx: number) => (
                  <TableRow key={item.sourceCampaignName || idx} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <TableCell className="text-xs font-medium text-slate-800 sticky left-0 bg-white border-r z-10 py-3">
                      {item.sourceCampaignName}
                    </TableCell>
                    {sourceCampaigns.map((campaign: string) => (
                      <TableCell key={campaign} className="text-xs text-right text-slate-600 py-3">
                        {(item[campaign] || 0).toLocaleString()}
                      </TableCell>
                    ))}
                    <TableCell className="text-xs text-right font-semibold text-slate-800 py-3">
                      {(item.total || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Totals Row */}
                <TableRow className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                  <TableCell className="text-xs font-semibold text-slate-800 sticky left-0 bg-slate-50 z-10 py-3">
                    Total
                  </TableCell>
                  {sourceCampaigns.map((campaign: string) => (
                    <TableCell key={campaign} className="text-xs text-right font-semibold text-slate-800 py-3">
                      {(columnTotals[campaign] || 0).toLocaleString()}
                    </TableCell>
                  ))}
                  <TableCell className="text-xs text-right font-bold text-slate-800 py-3">
                    {(columnTotals.total || 0).toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Campaign Totals Summary (only when no search) */}
          {totalsByCampaign && Object.keys(totalsByCampaign).length > 0 && !searchTerm && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Campaign‑wise Totals</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(totalsByCampaign).map(([campaign, total]) => (
                  <div key={campaign} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-xs text-slate-600 truncate">{campaign}</span>
                    <span className="text-xs font-semibold text-slate-800">{(total as number).toLocaleString()}</span>
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