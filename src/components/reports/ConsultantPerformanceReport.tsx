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
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  const [data, setData] = useState<any[] | null>(null);
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
      // The API may return an array directly or wrapped in { data: [...] }
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

  const hasActiveFilters =
    selectedLevel !== '1' ||
    dateFilter !== 'today' ||
    (dateFilter === 'custom' && (fromDate || toDate)) ||
    selectedUserId !== 'all' ||
    searchTerm !== '';

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
          {/* Summary Card */}
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

          {/* Consultant List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConsultants.map((consultant, idx) => (
              <Card key={consultant._id || idx} className="p-5 bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all rounded-xl">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">{consultant.consultantName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {consultant.totalLeadAssigned || 0} leads assigned
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    {formatCurrency(consultant.bookedRevenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 pt-3 border-t border-slate-100">
                  <span>Admissions: <span className="font-medium text-slate-800">{consultant.admDone || 0}</span></span>
                  <span>Realised: <span className="font-medium text-slate-800">{formatCurrency(consultant.realisedRevenue)}</span></span>
                </div>
              </Card>
            ))}
          </div>

          {filteredConsultants.length === 0 && searchTerm && (
            <div className="text-center py-8 text-sm text-slate-400">
              No consultants match "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}