import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser } from '@/auth';
import { format } from 'date-fns';
import { 
  CheckCircle2, 
  Loader2, 
  RefreshCw, 
  ShieldAlert, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Filter, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Calendar,
  User,
  Mail,
  Briefcase,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDataHandlerWithToken, patchTokenDataHandler } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type UserRef = {
  _id: string;
  id?: string;
  name: string;
  email: string;
  employeeId: number;
  role?: string | { _id: string; name: string };
};

type LeaveRecord = {
  _id: string;
  userId: UserRef;
  createdBy: UserRef;
  reportToUserId: UserRef;
  reportToUserIds?: UserRef[];
  subject: string;
  leaveType: 'CL' | 'EL';
  leaveFrom: string;
  leaveTo?: string;
  leaveDate?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvalReason?: string;
  approvedBy?: UserRef;
  approvedAt?: string;
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  createdAt: string;
  updatedAt: string;
};

type LeaveFilters = {
  status?: string;
  leaveType?: string;
  fromDate?: string;
  toDate?: string;
  page: number;
  limit: number;
};

type MetaData = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const STATUS_STYLE: Record<LeaveRecord['status'], string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
  cancelled: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200',
};

const STATUS_ICONS: Record<LeaveRecord['status'], React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5" />,
  approved: <CheckCircle2 className="h-3.5 w-3.5" />,
  rejected: <XCircle className="h-3.5 w-3.5" />,
  cancelled: <AlertCircle className="h-3.5 w-3.5" />,
};

const STATUS_LABELS: Record<LeaveRecord['status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const getId = (value: any) => value?._id || value?.id || value;

const formatRange = (leave: LeaveRecord) => {
  const from = leave.leaveFrom || leave.leaveDate;
  const to = leave.leaveTo || leave.leaveFrom || leave.leaveDate;
  if (!from) return '-';
  const fromText = format(new Date(from), 'MMM dd, yyyy');
  const toText = to ? format(new Date(to), 'MMM dd, yyyy') : fromText;
  return fromText === toText ? fromText : `${fromText} - ${toText}`;
};

const getDayCount = (leave: LeaveRecord): number => {
  const from = leave.leaveFrom || leave.leaveDate;
  const to = leave.leaveTo || leave.leaveFrom || leave.leaveDate;
  if (!from || !to) return 1;
  const start = new Date(from);
  const end = new Date(to);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

const formatDate = (value: string) => format(new Date(value), 'MMM dd, yyyy');
const formatDateTime = (value: string) => format(new Date(value), 'MMM dd, yyyy hh:mm a');

export function LeaveRequestsPage() {
  const { leaveId } = useParams<{ leaveId?: string }>();
  const currentUser = getUser();
  const currentUserId = currentUser?._id || currentUser?.id || currentUser?.userId || '';
  const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');

  const [requests, setRequests] = useState<LeaveRecord[]>([]);
  const [meta, setMeta] = useState<MetaData>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decisionStatus, setDecisionStatus] = useState<'approved' | 'rejected'>('approved');
  const [decisionReason, setDecisionReason] = useState('');
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const [processing, setProcessing] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<LeaveFilters>({
    page: 1,
    limit: 10,
  });

  const fetchRequests = async (showSpinner = false) => {
    try {
      if (showSpinner) setRefreshing(true);
      else setLoading(true);

      const params: any = { page: filters.page, limit: filters.limit };
      if (filters.status) params.status = filters.status;
      if (filters.leaveType) params.leaveType = filters.leaveType;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;

      const response = await getDataHandlerWithToken(ApiConfig.getLeaveRequests, params, null, true);
      const data = response?.data || [];
      const metaData = response?.meta || { total: 0, page: 1, limit: 10, totalPages: 0 };
      
      setRequests(data);
      setMeta(metaData);
    } catch (error) {
      console.error('Failed to load leave requests:', error);
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openById = async (id: string) => {
    const cached = requests.find((item) => item._id === id);
    if (cached) {
      setSelectedLeave(cached);
      setDetailOpen(true);
      return;
    }
    const response = await getDataHandlerWithToken(ApiConfig.getLeaveRequestById(id), null, null, true);
    const data = response?.data || response;
    if (data) {
      setSelectedLeave(data);
      setDetailOpen(true);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filters]);

  useEffect(() => {
    if (leaveId) {
      openById(leaveId).catch((error) => {
        console.error('Failed to load leave detail:', error);
        toast.error('Failed to load leave detail');
      });
    }
  }, [leaveId, requests]);

  const stats = useMemo(() => {
    const pending = requests.filter((r) => r.status === 'pending').length;
    const approved = requests.filter((r) => r.status === 'approved').length;
    const rejected = requests.filter((r) => r.status === 'rejected').length;
    const cancelled = requests.filter((r) => r.status === 'cancelled').length;
    return { total: requests.length, pending, approved, rejected, cancelled };
  }, [requests]);

  const openDecision = (leave: LeaveRecord, status: 'approved' | 'rejected') => {
    setSelectedLeave(leave);
    setDecisionStatus(status);
    setDecisionReason('');
    setDecisionOpen(true);
  };

  const openDetails = (leave: LeaveRecord) => {
    setSelectedLeave(leave);
    setDetailOpen(true);
  };

  const submitDecision = async () => {
    if (!selectedLeave) return;
    if (decisionStatus === 'rejected' && !decisionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setProcessing(true);
    try {
      const payload: any = { status: decisionStatus };
      if (decisionStatus === 'rejected') {
        payload.reason = decisionReason;
      }

      await patchTokenDataHandler(ApiConfig.decideLeave(selectedLeave._id), payload, true);
      
      toast.success(`Leave ${decisionStatus} successfully`);
      setDecisionOpen(false);
      setSelectedLeave(null);
      await fetchRequests();
    } catch (error: any) {
      console.error('Failed to update leave decision:', error);
      toast.error(error?.response?.data?.message || 'Failed to update leave');
    } finally {
      setProcessing(false);
    }
  };

  const canAction = (leave: LeaveRecord) => {
    return leave.status === 'pending' && getId(leave.userId) !== currentUserId;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= meta.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleFilterChange = (key: keyof LeaveFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 10 });
    setShowFilters(false);
  };

  const leaveTypeBadge = (type?: string) => {
    if (!type) return null;
    return (
      <Badge variant="outline" className={cn(
        type === 'CL' ? 'border-sky-200 text-sky-700 bg-sky-50' : 'border-violet-200 text-violet-700 bg-violet-50',
        'text-xs font-medium'
      )}>
        {type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Leave Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">Review and manage leave requests from your team members</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => fetchRequests(true)} 
          disabled={refreshing} 
          className="gap-2 border-slate-200 hover:border-slate-300"
        >
          <RefreshCw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100">
          <CardContent className="p-3">
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">Total</p>
            <div className="mt-1 text-2xl font-bold text-slate-800">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-3">
            <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Pending</p>
            <div className="mt-1 text-2xl font-bold text-amber-700">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-3">
            <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Approved</p>
            <div className="mt-1 text-2xl font-bold text-emerald-700">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 shadow-sm bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-3">
            <p className="text-xs font-medium text-red-700 uppercase tracking-wider">Rejected</p>
            <div className="mt-1 text-2xl font-bold text-red-700">{stats.rejected}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100">
          <CardContent className="p-3">
            <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">Cancelled</p>
            <div className="mt-1 text-2xl font-bold text-slate-700">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Filters</span>
              {(filters.status || filters.leaveType || filters.fromDate || filters.toDate) && (
                <Badge variant="secondary" className="text-xs">Active</Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1 h-8 text-xs"
            >
              {showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {showFilters ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Status</Label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => handleFilterChange('status', value || undefined)}
                >
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" " className="text-xs">All Status</SelectItem>
                    <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                    <SelectItem value="approved" className="text-xs">Approved</SelectItem>
                    <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                    <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Leave Type</Label>
                <Select
                  value={filters.leaveType || ''}
                  onValueChange={(value) => handleFilterChange('leaveType', value || undefined)}
                >
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" " className="text-xs">All Types</SelectItem>
                    <SelectItem value="CL" className="text-xs">Casual Leave</SelectItem>
                    <SelectItem value="EL" className="text-xs">Earned Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">From Date</Label>
                <Input
                  type="date"
                  value={filters.fromDate || ''}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value || undefined)}
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">To Date</Label>
                <Input
                  type="date"
                  value={filters.toDate || ''}
                  onChange={(e) => handleFilterChange('toDate', e.target.value || undefined)}
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>
            {(filters.status || filters.leaveType || filters.fromDate || filters.toDate) && (
              <div className="mt-2 flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Requests List */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                Leave Requests
                <Badge variant="secondary" className="ml-2 text-xs">
                  {meta.total} total
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">Click on a request to view details and take action</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Page {meta.page} of {meta.totalPages}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="mt-3 text-sm text-muted-foreground">Loading leave requests...</p>
              </div>
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 p-12 text-center m-4">
              <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-3 text-sm font-semibold text-slate-700">No leave requests found</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {filters.status || filters.leaveType || filters.fromDate || filters.toDate
                  ? 'Try adjusting your filters'
                  : 'Leave requests from your team will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {requests.map((leave) => {
                const dayCount = getDayCount(leave);
                const isPending = leave.status === 'pending';
                
                return (
                  <div
                    key={leave._id}
                    className={cn(
                      "rounded-xl border p-4 transition-all hover:shadow-md cursor-pointer",
                      isPending 
                        ? 'border-amber-200 bg-amber-50/30 hover:border-amber-300 hover:bg-amber-50' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    )}
                    onClick={() => openDetails(leave)}
                  >
                    <div className="space-y-3">
                      {/* Header Row */}
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={cn('gap-1.5 text-xs px-2.5 py-1', STATUS_STYLE[leave.status])}>
                            {STATUS_ICONS[leave.status]}
                            {STATUS_LABELS[leave.status]}
                          </Badge>
                          {leaveTypeBadge(leave.leaveType)}
                          <Badge variant="outline" className="text-xs bg-white">
                            {dayCount} day{dayCount > 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{formatRange(leave)}</span>
                      </div>

                      {/* Subject & Employee */}
                      <div>
                        <h3 className="font-semibold text-slate-800">{leave.subject}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-medium">{leave.userId?.name || 'Unknown'}</span>
                            <span className="text-xs text-slate-400">(ID: {leave.userId?.employeeId})</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs">{leave.userId?.email}</span>
                          </span>
                        </div>
                      </div>

                      {/* Reason Preview */}
                      {leave.reason && (
                        <p className="text-sm text-slate-600 line-clamp-2 bg-slate-50/50 p-2 rounded-lg">
                          <span className="font-medium text-slate-700">Reason:</span> {leave.reason}
                        </p>
                      )}

                      {/* Approval Info */}
                      {leave.approvedBy && leave.status === 'approved' && (
                        <div className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-emerald-700">
                            <span className="font-medium">Approved by {leave.approvedBy.name}</span>
                            {leave.approvedAt && ` on ${formatDateTime(leave.approvedAt)}`}
                          </div>
                        </div>
                      )}

                      {leave.status === 'rejected' && leave.approvedBy && (
                        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-2.5">
                          <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-red-700">
                            <span className="font-medium">Rejected by {leave.approvedBy.name}</span>
                            {leave.approvedAt && ` on ${formatDateTime(leave.approvedAt)}`}
                            {leave.approvalReason && (
                              <div className="mt-1 text-red-600 bg-red-100/50 p-1.5 rounded">
                                <span className="font-medium">Reason:</span> {leave.approvalReason}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {leave.status === 'cancelled' && (
                        <div className="flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-200 p-2.5">
                          <AlertCircle className="h-4 w-4 text-slate-600 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-slate-600">
                            <span className="font-medium">Cancelled</span>
                            {leave.cancelledAt && ` on ${formatDateTime(leave.cancelledAt)}`}
                            {leave.cancelReason && (
                              <div className="mt-1 text-slate-500 bg-slate-100/50 p-1.5 rounded">
                                <span className="font-medium">Reason:</span> {leave.cancelReason}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {isPending && canAction(leave) && (
                        <div className="flex gap-2 pt-2 border-t border-amber-200">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDecision(leave, 'approved');
                            }}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2 text-xs h-8"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDecision(leave, 'rejected');
                            }}
                            className="flex-1 gap-2 text-xs h-8"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      {isPending && !canAction(leave) && (
                        <div className="flex gap-2 pt-2 border-t border-amber-200">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetails(leave);
                            }}
                            className="flex-1 gap-2 text-xs h-8"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Details
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[40px] text-center">
                  {meta.page} / {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedLeave && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2 text-lg">
                  <Badge className={cn('gap-1.5 text-sm px-3 py-1', STATUS_STYLE[selectedLeave.status])}>
                    {STATUS_ICONS[selectedLeave.status]}
                    {STATUS_LABELS[selectedLeave.status]}
                  </Badge>
                  {selectedLeave.subject}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 text-sm">
                  {formatRange(selectedLeave)} • {selectedLeave.leaveType} • {getDayCount(selectedLeave)} day(s)
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Employee Info */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-slate-500" />
                    <span className="font-medium">{selectedLeave.userId?.name}</span>
                    <span className="text-slate-400">(ID: {selectedLeave.userId?.employeeId})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span>{selectedLeave.userId?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-slate-500" />
                    <span>Role: {typeof selectedLeave.userId?.role === 'object' ? selectedLeave.userId.role.name : selectedLeave.userId?.role || 'N/A'}</span>
                  </div>
                </div>

                {/* Leave Reason */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Reason for Leave
                  </label>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm whitespace-pre-wrap">
                    {selectedLeave.reason}
                  </div>
                </div>

                {/* Approval/Rejection Info */}
                {selectedLeave.approvedBy && selectedLeave.status === 'approved' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-emerald-700">Approval Status</label>
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>
                          <span className="font-medium">Approved by {selectedLeave.approvedBy.name}</span>
                          {selectedLeave.approvedAt && ` on ${formatDateTime(selectedLeave.approvedAt)}`}
                        </span>
                      </div>
                      {selectedLeave.approvalReason && (
                        <div className="mt-2 text-emerald-600 bg-emerald-100/50 p-2 rounded">
                          <span className="font-medium">Note:</span> {selectedLeave.approvalReason}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedLeave.status === 'rejected' && selectedLeave.approvedBy && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-red-700">Rejection Status</label>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span>
                          <span className="font-medium">Rejected by {selectedLeave.approvedBy.name}</span>
                          {selectedLeave.approvedAt && ` on ${formatDateTime(selectedLeave.approvedAt)}`}
                        </span>
                      </div>
                      {selectedLeave.approvalReason && (
                        <div className="mt-2 text-red-600 bg-red-100/50 p-2 rounded">
                          <span className="font-medium">Reason:</span> {selectedLeave.approvalReason}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedLeave.status === 'cancelled' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Cancellation</label>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-slate-600" />
                        <span>
                          <span className="font-medium">Cancelled</span>
                          {selectedLeave.cancelledAt && ` on ${formatDateTime(selectedLeave.cancelledAt)}`}
                        </span>
                      </div>
                      {selectedLeave.cancelReason && (
                        <div className="mt-2 text-slate-600 bg-slate-100/50 p-2 rounded">
                          <span className="font-medium">Reason:</span> {selectedLeave.cancelReason}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                {canAction(selectedLeave) && (
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button variant="outline" onClick={() => setDetailOpen(false)} className="sm:flex-1">
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        setDetailOpen(false);
                        openDecision(selectedLeave, 'approved');
                      }}
                      className="sm:flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        setDetailOpen(false);
                        openDecision(selectedLeave, 'rejected');
                      }}
                      variant="destructive"
                      className="sm:flex-1 gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
                {!canAction(selectedLeave) && (
                  <Button onClick={() => setDetailOpen(false)}>Close</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Decision Dialog */}
      <Dialog open={decisionOpen} onOpenChange={setDecisionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {decisionStatus === 'approved' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {decisionStatus === 'approved' ? 'Approve' : 'Reject'} Leave Request
            </DialogTitle>
            <DialogDescription>
              {decisionStatus === 'rejected' && 'Please provide a reason for the rejection.'}
              {decisionStatus === 'approved' && 'This action will approve the leave request.'}
            </DialogDescription>
          </DialogHeader>

          {selectedLeave && (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" />
                  <span className="font-medium">{selectedLeave.userId?.name}</span>
                  <span className="text-slate-400">({selectedLeave.userId?.employeeId})</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>{formatRange(selectedLeave)}</span>
                  <span className="text-slate-300">•</span>
                  <span>{getDayCount(selectedLeave)} day(s)</span>
                </div>
                <div className="text-slate-600">
                  <span className="font-medium">Subject:</span> {selectedLeave.subject}
                </div>
              </div>

              {decisionStatus === 'rejected' && (
                <div>
                  <Label className="text-sm font-medium text-slate-700">
                    Rejection Reason <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="Explain why you're rejecting this leave request..."
                    className="mt-2 rounded-xl resize-none"
                    rows={4}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    This reason will be shared with the employee
                  </p>
                </div>
              )}

              {decisionStatus === 'approved' && (
                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="text-emerald-700">
                    <p className="font-medium">You are about to approve this leave request</p>
                    <p className="text-xs text-emerald-600 mt-0.5">The employee will be notified via email</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitDecision}
              disabled={processing || (decisionStatus === 'rejected' && !decisionReason.trim())}
              className={decisionStatus === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : decisionStatus === 'approved' ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}