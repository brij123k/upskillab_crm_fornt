import { useState, useEffect, useCallback } from 'react';
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
  Calendar,
  Phone,
  ChevronUp,
  ChevronDown,
  Layers,
  Users,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*                               Date & Helpers                               */
/* -------------------------------------------------------------------------- */
const dateFilterOptions = [
  { value: 'today', label: 'Today' },
  { value: 'custom', label: 'Custom Range' },
];

const formatDateShort = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export function DailyUtilizationReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Level filter
  const [levels, setLevels] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState('1');

  // Date filter
  const [dateFilter, setDateFilter] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pool filter
  const [pools, setPools] = useState<any[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState('all');

  // Employee search (client‑side)
  const [searchTerm, setSearchTerm] = useState('');

  // ─── Fetch levels & pools ───
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
    const fetchPools = async () => {
      try {
        const res = await getDataHandlerWithToken('getAllPools', null, null);
        setPools(res?.data || res || []);
      } catch (error) {
        /* ignore */
      }
    };
    fetchLevels();
    fetchPools();
  }, []);

  const extractLevelNumber = (name: string): number => {
    const match = name.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  };

  // ─── Fetch daily utilization data ───
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        level: parseInt(selectedLevel) || 1,
      };

      // Date filter
      if (dateFilter === 'custom') {
        if (!fromDate || !toDate) {
          // toast({ title: 'Missing Dates', description: 'Select start and end dates.', variant: 'destructive' });
          setLoading(false);
          return;
        }
        const diffTime = Math.abs(new Date(toDate).getTime() - new Date(fromDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 5) {
          toast({ title: 'Date range too large', description: 'Max 5 days allowed for daily view.', variant: 'destructive' });
          setLoading(false);
          return;
        }
        params.fromDate = fromDate;
        params.toDate = toDate;
      } else {
        params.dateFilter = dateFilter;
      }

      // Pool filter
      if (selectedPoolId && selectedPoolId !== 'all') {
        params.poolId = selectedPoolId;
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.employeePoolDailyUtilizationReport,
        params,
        null,
        true
      );

      // Response structure: { employees: [...], dateStrings: [...] }
      const report = response?.data || response;
      setData(report || null);
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load daily utilization', variant: 'destructive' });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedLevel, dateFilter, fromDate, toDate, selectedPoolId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Export CSV ───
  const handleExport = () => {
    if (!data?.employees || !data?.dateStrings) {
      toast({ title: 'No data to export' });
      return;
    }
    const dates = data.dateStrings;
    const headers = ['Employee', ...dates.flatMap(d => [`${formatDateShort(d)} Dials`, `${formatDateShort(d)} Answered`])];
    const rows = data.employees.map((emp: any) => {
      const row: any[] = [emp.employeeName];
      dates.forEach(date => {
        const metric = emp.dailyMetrics?.find((m: any) => m.date === date);
        row.push(metric?.dial || 0, metric?.answered || 0);
      });
      return row;
    });
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily_utilization_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  };

  // ─── Filtered employees (client‑side search) ───
  const filteredEmployees = data?.employees?.filter((emp: any) =>
    searchTerm ? emp.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) : true
  ) || [];

  const dates = data?.dateStrings || [];

  const hasActiveFilters =
    selectedLevel !== '1' ||
    dateFilter !== 'today' ||
    (dateFilter === 'custom' && (fromDate || toDate)) ||
    (selectedPoolId && selectedPoolId !== 'all') ||
    searchTerm !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Daily Calls</h3>
          <p className="text-sm text-slate-500">Day‑wise call & answer metrics per employee</p>
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
                <span className="text-[10px] text-slate-400">Max 5 days</span>
              </>
            )}

            {/* Pool Filter */}
            {/* <div className="w-[180px]">
              <Select value={selectedPoolId} onValueChange={setSelectedPoolId}>
                <SelectTrigger className="h-8 text-xs rounded-xl">
                  <SelectValue placeholder="All Pools" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Pools</SelectItem>
                  {pools.map((p: any) => (
                    <SelectItem key={p._id} value={p._id} className="text-xs">
                      {p.name || p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            {/* Employee Search */}
            <div className="relative w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Search employee..."
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
          <p className="ml-2 text-sm text-slate-500">Loading daily data...</p>
        </div>
      ) : !data || !data.employees?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No daily utilization data found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting filters or level</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase sticky left-0 bg-slate-50 z-10 min-w-[140px]">
                  Employee
                </TableHead>
                {dates.map((date: string) => (
                  <TableHead key={date} className="text-xs text-center min-w-[100px] py-3">
                    <div className="font-semibold text-slate-800">{formatDateShort(date)}</div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((emp: any, idx: number) => (
                <TableRow key={emp.employeeId || idx} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <TableCell className="text-xs font-medium text-slate-800 sticky left-0 bg-white border-r z-10 py-3">
                    {emp.employeeName}
                  </TableCell>
                  {dates.map((date: string) => {
                    const metric = emp.dailyMetrics?.find((m: any) => m.date === date);
                    const hasData = metric?.dial > 0;
                    return (
                      <TableCell key={date} className="text-center py-3">
                        {hasData ? (
                          <div className="inline-flex flex-col items-center px-2 py-1 rounded-lg bg-orange-50/70">
                            <span className="text-sm font-medium text-slate-800">{metric.dial}</span>
                            {metric.answered > 0 && (
                              <span className="text-[10px] text-orange-600 mt-0.5">
                                {metric.answered} ans
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-300">-</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredEmployees.length === 0 && searchTerm && (
            <div className="text-center py-8 text-sm text-slate-400">
              No employees match "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}