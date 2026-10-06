import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Progress } from '@/components/ui/progress';
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
  TrendingUp,
  TrendingDown,
  Percent,
  Target,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { KpiCard, KpiGrid, ChartCard, RankedBars, DonutWithLegend, HeatChip } from './ReportUI';

/* -------------------------------------------------------------------------- */
/*                               Type Definitions                              */
/* -------------------------------------------------------------------------- */
interface ReportData {
  startDate: string;
  endDate: string;
  sourceCampaigns: string[];
  data: Array<{
    sourceCampaignName: string;
    total: number;
    [key: string]: number | string;
  }>;
  totalsByCampaign: Record<string, number>;
  admissionDoneByCampaign: Record<string, number>;
  conversionPercentage: Record<string, number>;
  grandTotal: number;
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
/*                              Main Component                                 */
/* -------------------------------------------------------------------------- */
export function SourceCampaignReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Date filter
  const [dateFilter, setDateFilter] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Client-side search
  const [searchTerm, setSearchTerm] = useState('');

  // ─── Fetch report data ───
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};

      if (dateFilter === 'custom') {
        if (!fromDate || !toDate) {
          // toast({
          //   title: 'Missing Dates',
          //   description: 'Select start and end dates.',
          //   variant: 'destructive',
          // });
          setLoading(false);
          return;
        }
        const diffTime = Math.abs(new Date(toDate).getTime() - new Date(fromDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // if (diffDays > 30) {
        //   toast({
        //     title: 'Date range too large',
        //     description: 'Max 30 days allowed.',
        //     variant: 'destructive',
        //   });
        //   setLoading(false);
        //   return;
        // }
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

      // Handle both response structures
      let reportData: ReportData | null = null;
      
      if (response?.data?.data) {
        // Response is wrapped in extra data property
        reportData = response.data as ReportData;
      } else if (response?.data) {
        // Response has data property directly
        reportData = response.data as ReportData;
      } else if (response?.sourceCampaigns) {
        // Response is the data itself
        reportData = response as ReportData;
      }

      setData(reportData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load source campaign report',
        variant: 'destructive',
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Derived data ───
  const rows = useMemo(() => {
    if (!data?.data) return [];
    return Array.isArray(data.data) ? data.data : [];
  }, [data]);

  const sourceCampaigns = useMemo(() => {
    return data?.sourceCampaigns || [];
  }, [data]);

  const totalsByCampaign = data?.totalsByCampaign || {};
  const admissionByCampaign = data?.admissionDoneByCampaign || {};
  const conversionData = data?.conversionPercentage || {};
  const grandTotal = data?.grandTotal || 0;
  const startDate = data?.startDate || '';
  const endDate = data?.endDate || '';

  // Client-side search
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  };

  const hasActiveFilters =
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
    csvRows.push([
      'Total',
      ...sourceCampaigns.map(camp => columnTotals[camp] || 0),
      columnTotals.total || 0,
    ]);
    // Add conversion percentages
    if (Object.keys(conversionData).length) {
      csvRows.push([
        'Conversion %',
        ...sourceCampaigns.map(camp => `${conversionData[camp] || 0}%`),
        '',
      ]);
    }
    const csvContent = [headers, ...csvRows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `source_campaign_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported Successfully!' });
  };

  // Get top performing campaign
  const topCampaign = useMemo(() => {
    if (!sourceCampaigns.length) return null;
    let top = sourceCampaigns[0];
    let max = conversionData[top] || 0;
    sourceCampaigns.forEach(camp => {
      if ((conversionData[camp] || 0) > max) {
        max = conversionData[camp] || 0;
        top = camp;
      }
    });
    return { name: top, rate: max };
  }, [sourceCampaigns, conversionData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Source Campaign Report</h3>
          <p className="text-sm text-slate-500">Lead distribution by campaign & stage with conversion tracking</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="rounded-xl border-slate-200 hover:border-orange-200 hover:bg-orange-50"
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
            className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1 h-8 text-xs rounded-xl"
          >
            <Filter className="w-3 h-3" />
            Filters
            {hasActiveFilters && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
            {showFilters ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 w-full mt-2 pt-2 border-t border-slate-100">
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
                  {/* <span className="text-[10px] text-slate-400">Max 30 days</span> */}
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
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-orange-400 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading source campaign data...</p>
          </div>
        </div>
      ) : !data || (!rows.length && !sourceCampaigns.length) ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
          <BarChart3 className="w-14 h-14 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No source campaign data found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting filters or date range</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* KPI tiles + charts */}
          {(() => {
            const avgConv = sourceCampaigns.length
              ? sourceCampaigns.reduce((sum, camp) => sum + (conversionData[camp] || 0), 0) / sourceCampaigns.length
              : 0;
            const totalAdmissions = sourceCampaigns.reduce((sum, camp) => sum + (admissionByCampaign[camp] || 0), 0);
            const campaignData = sourceCampaigns.map(camp => ({
              name: camp,
              value: columnTotals[camp] || totalsByCampaign[camp] || 0,
              sub: conversionData[camp] !== undefined ? `${conversionData[camp]}% conversion` : undefined,
            }));
            return (
              <>
                <KpiGrid cols={(startDate || endDate) ? 5 : 4}>
                  <KpiCard icon={BarChart3} tone="orange" label="Total Leads" value={grandTotal.toLocaleString()} sub={`${totalAdmissions.toLocaleString()} admissions`} />
                  <KpiCard icon={Layers} tone="blue" label="Campaigns" value={sourceCampaigns.length} />
                  <KpiCard icon={Target} tone="violet" label="Lead Stages" value={filteredRows.length} />
                  <KpiCard icon={Percent} tone="green" label="Avg Conversion" value={`${avgConv.toFixed(1)}%`} progress={avgConv} />
                  {(startDate || endDate) && (
                    <KpiCard icon={Calendar} tone="rose" label="Date Range" value={<span className="text-base">{formatDate(startDate)} – {formatDate(endDate)}</span>} />
                  )}
                </KpiGrid>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <ChartCard title="Lead Sources" subtitle="Leads per campaign with conversion rate">
                    <RankedBars data={campaignData} limit={7} formatValue={v => v.toLocaleString()} />
                  </ChartCard>
                  <ChartCard title="Lead Stage Distribution" subtitle="All campaigns combined">
                    <DonutWithLegend
                      data={filteredRows.map((r: any) => ({ name: r.sourceCampaignName, value: r.total || 0 }))}
                      centerValue={grandTotal.toLocaleString()}
                      centerLabel="Total Leads"
                    />
                  </ChartCard>
                </div>
              </>
            );
          })()}


          {/* Main Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100/50 hover:bg-slate-50 border-b border-slate-100">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase sticky left-0 bg-slate-50 z-10 min-w-[160px]">
                    Lead Stage / Campaign
                  </TableHead>
                  {sourceCampaigns.map((campaign: string) => (
                    <TableHead key={campaign} className="text-xs text-right min-w-[100px] py-3 font-semibold text-slate-500 uppercase">
                      <div className="flex flex-col items-end">
                        <span>{campaign}</span>
                        {conversionData[campaign] !== undefined && (
                          <span className="text-[8px] font-normal text-slate-400 mt-0.5">
                            {conversionData[campaign]}% conv.
                          </span>
                        )}
                      </div>
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
                      <div className="flex items-center gap-2">
                        <span>{item.sourceCampaignName}</span>
                        {item.sourceCampaignName === 'New Lead' && (
                          <Badge variant="outline" className="text-[8px] px-1 py-0 bg-blue-50 text-blue-600 border-blue-200">
                            Incoming
                          </Badge>
                        )}
                        {item.sourceCampaignName === 'Admission Done' && (
                          <Badge variant="outline" className="text-[8px] px-1 py-0 bg-emerald-50 text-emerald-600 border-emerald-200">
                            Converted
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    {sourceCampaigns.map((campaign: string) => (
                      <TableCell key={campaign} className="text-right py-3">
                        <HeatChip
                          count={Number(item[campaign] || 0)}
                          pct={columnTotals[campaign] ? (Number(item[campaign] || 0) / Number(columnTotals[campaign])) * 100 : 0}
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-right py-3">
                      <span className="inline-flex min-w-[2.75rem] justify-center rounded-lg bg-slate-900 px-2.5 py-1 text-[13px] font-bold text-white tabular-nums">
                        {(item.total || 0).toLocaleString()}
                      </span>
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

                {/* Conversion Row */}
                {Object.keys(conversionData).length > 0 && (
                  <TableRow className="bg-orange-50/50 border-t border-slate-200">
                    <TableCell className="text-xs font-semibold text-slate-700 sticky left-0 bg-orange-50/50 z-10 py-2">
                      Conversion %
                    </TableCell>
                    {sourceCampaigns.map((campaign: string) => {
                      const rate = conversionData[campaign] || 0;
                      return (
                        <TableCell key={campaign} className="text-xs text-right font-semibold py-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full",
                            rate > 20 ? "bg-emerald-100 text-emerald-700" :
                            rate > 10 ? "bg-amber-100 text-amber-700" :
                            rate > 0 ? "bg-orange-100 text-orange-700" :
                            "bg-slate-100 text-slate-500"
                          )}>
                            {rate}%
                          </span>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-xs text-right text-slate-500 py-2">
                      —
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span>Showing {filteredRows.length} lead stages</span>
            <span>Last updated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}