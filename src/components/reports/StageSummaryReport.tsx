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
  BarChart3,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*                             Stage Summary Report                           */
/* -------------------------------------------------------------------------- */
interface StageRow {
  leadStage: string;
  count: number;
}

interface ReportData {
  report: StageRow[];
  totalLead: number;
}

const dateFilterOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

export function StageSummaryReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [dateFilter, setDateFilter] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // ──────────── Data fetching ────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateFilter === 'custom') {
        // If custom range is selected, require both dates
        if (!fromDate || !toDate) {
          toast({ title: 'Missing Dates', description: 'Please select both start and end dates.', variant: 'destructive' });
          setLoading(false);
          return;
        }
        params.assignedDateFrom = fromDate;
        params.assignedDateTo = toDate;
      } else {
        params.assignedDateFilter = dateFilter;
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.stageSummery,
        params,
        null,
        true
      );
      // The API response may be { data, totalLead, report } – adjust if necessary
      if (response) {
        setData({
          report: response.data?.report || response.report || [],
          totalLead: response.data?.totalLead ?? response.totalLead ?? 0,
        });
      } else {
        setData(null);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load report', variant: 'destructive' });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, fromDate, toDate]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ──────────── Export to CSV ────────────
  const handleExport = () => {
    if (!data || !data.report.length) {
      toast({ title: 'No data to export' });
      return;
    }
    const rows = data.report;
    const csvHeaders = ['Lead Stage', 'Count', 'Percentage'];
    const total = data.totalLead || 1;
    const csvRows = rows.map(row => [
      row.leadStage,
      row.count,
      `${((row.count / total) * 100).toFixed(1)}%`
    ]);

    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stage_summary_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  };

  // ──────────── Helpers ────────────
  const hasActiveFilters = dateFilter !== 'today' || (dateFilter === 'custom' && (fromDate || toDate));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Stage Summary</h3>
          <p className="text-sm text-slate-500">Lead distribution across stages</p>
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
          {hasActiveFilters && (
            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-orange-500" />
          )}
          {showFilters ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
        </Button>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-[130px]">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-8 text-xs rounded-xl">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {dateFilterOptions.map((opt) => (
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
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
          <p className="ml-2 text-sm text-slate-500">Loading stage summary...</p>
        </div>
      ) : !data || data.report.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No stage data available</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or refresh</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Total Leads Summary Card */}
          <div className="flex items-center gap-4">
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 rounded-xl px-5 py-3 shadow-sm">
              <div className="text-xs font-medium text-orange-700 uppercase tracking-wider">Total Leads</div>
              <div className="text-2xl font-bold text-orange-600 mt-0.5">{data.totalLead}</div>
            </Card>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase">Lead Stage</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase text-right">Count</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.report.map((item, idx) => {
                  const percentage = data.totalLead ? ((item.count / data.totalLead) * 100).toFixed(1) : '0.0';
                  return (
                    <TableRow key={idx} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <TableCell className="text-sm font-medium text-slate-800 py-3">{item.leadStage}</TableCell>
                      <TableCell className="text-sm text-slate-600 text-right">{item.count}</TableCell>
                      <TableCell className="text-sm text-slate-600 text-right">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <span
                              className="block h-full bg-orange-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </span>
                          {percentage}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}