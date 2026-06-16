import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  ChevronUp,
  ChevronDown,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  CalendarDays,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { getDataHandlerWithToken, patchTokenDataHandler } from '@/config/services';
import ApiConfig from '@/config/apiConfig';

interface FollowUpType {
  _id: string;
  leadId: number;
  leadName: string;
  leadNumber: string;
  stageName: string;
  scheduledAt: string;
  message: string;
  status: 'upcoming' | 'overdue' | 'completed';
  isTriggered: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Filters {
  search: string;
  status: string;
  dateFilter: string;
  fromDate: string;
  toDate: string;
  group: string;
}

export function FollowUpPage() {
  const [followUps, setFollowUps] = useState<FollowUpType[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFollowUps, setTotalFollowUps] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'upcoming',
    dateFilter: 'all',
    fromDate: '',
    toDate: '',
    group: 'false',
  });

  // Build query params
  const buildQueryParams = useCallback(() => {
    const params: Record<string, any> = {
      page,
      limit,
    };

    if (filters.search) params.search = filters.search;
    if (filters.status && filters.status !== 'all') params.status = filters.status;
    if (filters.dateFilter && filters.dateFilter !== 'all') params.dateFilter = filters.dateFilter;
    if (filters.fromDate) params.from = filters.fromDate;
    if (filters.toDate) params.to = filters.toDate;
    if (filters.group === 'true') params.group = true;

    return params;
  }, [filters, page, limit]);

  // Fetch follow-ups
  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const queryParams = buildQueryParams();
      const response = await getDataHandlerWithToken(ApiConfig.getFollowUp, queryParams, null, true);
      if (response?.data) {
        setFollowUps(response.data);
        setTotalFollowUps(response.total);
        setTotalPages(response.totalPages);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch follow-ups',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Mark follow-up as complete
  const handleComplete = async (id: string) => {
    try {
      setCompletingId(id);
      await patchTokenDataHandler(ApiConfig.markFollowUp(id), {},true);
      toast({
        title: 'Success',
        description: 'Follow-up marked as completed',
      });
      fetchFollowUps(); // refresh list
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to complete follow-up',
        variant: 'destructive',
      });
    } finally {
      setCompletingId(null);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      dateFilter: 'all',
      fromDate: '',
      toDate: '',
      group: 'false',
    });
    setPage(1);
  };

  // Toggle group filter
  const toggleGroupFilter = () => {
    setFilters(prev => ({
      ...prev,
      group: prev.group === 'true' ? 'false' : 'true',
    }));
    setPage(1);
  };

  // Format date for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'text-orange-600';
      case 'overdue':
        return 'text-red-600';
      case 'completed':
        return 'text-emerald-600';
      default:
        return 'text-slate-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'overdue':
        return 'Overdue';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [page, limit, filters]);

  return (
    <div className="space-y-4 p-4 md:p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Follow‑Ups</h1>
          <p className="text-sm text-slate-500">Manage scheduled follow‑up activities</p>
        </div>
      </div>

      {/* Group Filter Checkbox */}
      <div className="flex items-center space-x-2 bg-white p-3 rounded-xl border border-slate-200">
        <Checkbox
          id="group-filter"
          checked={filters.group === 'true'}
          onCheckedChange={toggleGroupFilter}
        />
        <Label htmlFor="group-filter" className="text-sm font-medium cursor-pointer">
          Group by Lead
        </Label>
        {filters.group === 'true' && (
          <Badge variant="secondary" className="ml-2 bg-orange-50 text-orange-700 border-orange-200">
            Grouped View
          </Badge>
        )}
      </div>

      {/* Filters Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-xl border-slate-200"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
        {showFilters && (
          <Button variant="outline" size="sm" onClick={resetFilters} className="rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" /> Reset Filters
          </Button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="border-slate-200 rounded-xl">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Lead name, phone, ID..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-8 h-9 text-sm rounded-lg border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date Filter</Label>
                <Select
                  value={filters.dateFilter}
                  onValueChange={(value) => setFilters({ ...filters, dateFilter: value })}
                >
                  <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Group</Label>
                <Select
                  value={filters.group}
                  onValueChange={(value) => setFilters({ ...filters, group: value })}
                >
                  <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200">
                    <SelectValue placeholder="Ungrouped" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="false">Ungrouped</SelectItem>
                    <SelectItem value="true">Group by Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filters.dateFilter === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">From Date</Label>
                  <Input
                    type="datetime-local"
                    value={filters.fromDate}
                    onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                    className="h-9 text-sm rounded-lg border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">To Date</Label>
                  <Input
                    type="datetime-local"
                    value={filters.toDate}
                    onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                    className="h-9 text-sm rounded-lg border-slate-200"
                  />
                </div>
              </div>
            )}

            {/* Active filters summary */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400">Active filters:</span>
              {filters.status !== 'all' && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs rounded-full">
                  Status: {getStatusText(filters.status)}
                </Badge>
              )}
              {filters.dateFilter !== 'all' && filters.dateFilter !== 'custom' && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs rounded-full">
                  Date: {filters.dateFilter}
                </Badge>
              )}
              {filters.group === 'true' && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs rounded-full">
                  Grouped by Lead
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-slate-800">
            Scheduled Follow‑Ups ({totalFollowUps})
            {loading && <Loader2 className="w-3 h-3 inline animate-spin ml-2 text-slate-400" />}
          </h2>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Lead</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Contact</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Stage</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Scheduled At</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Mark Complete</th>
              </tr>
            </thead>
            <tbody>
              {followUps.map((item) => {
                const { date, time } = formatDateTime(item.scheduledAt);
                return (
                  <tr
                    key={item._id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-800">{item.leadName}</div>
                      <div className="text-xs text-slate-400">ID: {item.leadId}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="relative group">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                            {item.leadNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-slate-700">{item.stageName}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-slate-700">{date}</div>
                      <div className="text-xs text-slate-400">{time}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn("text-sm font-medium", getStatusColor(item.status))}>
                        {getStatusText(item.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {item.status !== 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleComplete(item._id)}
                          disabled={completingId === item._id}
                          className="h-7 px-2 text-xs rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                        >
                          {completingId === item._id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          <span className="ml-1">Complete</span>
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {followUps.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                    No follow‑ups found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {followUps.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
            <div className="text-xs text-slate-500 order-2 sm:order-1">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalFollowUps)} of {totalFollowUps} follow‑ups
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="h-8 px-3 text-xs rounded-lg"
              >
                <ChevronLeft className="w-3 h-3 mr-1" /> Prev
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-7 h-7 p-0 text-xs rounded-lg"
                      onClick={() => setPage(pageNum)}
                      disabled={loading}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="h-8 px-3 text-xs rounded-lg"
              >
                Next <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="flex items-center gap-2 order-3">
              <span className="text-xs text-slate-500">Show:</span>
              <Select
                value={limit.toString()}
                onValueChange={(v) => { setLimit(parseInt(v)); setPage(1); }}
              >
                <SelectTrigger className="w-20 h-8 text-xs rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}