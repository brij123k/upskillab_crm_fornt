import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser } from '@/auth';
import { format } from 'date-fns';
import { CheckCircle2, Loader2, RefreshCw, ShieldAlert, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getDataHandlerWithToken, patchTokenDataHandler } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from 'sonner';
import { FormattedText } from '@/components/editor/FormattedText';
import { hasPermission } from '@/utils/permissions';

type UserRef = {
  _id: string;
  id?: string;
  name: string;
  email: string;
  employeeId: number;
};

type LeaveRecord = {
  _id: string;
  userId: UserRef;
  createdBy: UserRef;
  reportToUserId: UserRef;
  reportToUserIds?: UserRef[];
  subject: string;
  leaveFrom: string;
  leaveTo?: string;
  leaveDate?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvalReason?: string;
  approvedBy?: UserRef;
  approvedAt?: string;
  createdAt: string;
};

const STATUS_STYLE: Record<LeaveRecord['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
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

export function LeaveRequestsPage() {
  const { leaveId } = useParams<{ leaveId?: string }>();
  const currentUser = getUser();
  const currentUserId = currentUser?._id || currentUser?.id || currentUser?.userId || '';
  const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');
  const canApproveLeave = hasPermission(permissions, 'leave', 'approve');
  const [requests, setRequests] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decisionStatus, setDecisionStatus] = useState<'approved' | 'rejected'>('approved');
  const [decisionReason, setDecisionReason] = useState('');
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const [processing, setProcessing] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchRequests = async (showSpinner = false) => {
    try {
      if (showSpinner) setRefreshing(true);
      else setLoading(true);
      const response = await getDataHandlerWithToken(ApiConfig.getLeaveRequests, { page: 1, limit: 100 }, null, true);
      setRequests(response?.data || []);
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
  }, []);

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
    return { total: requests.length, pending, approved, rejected };
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
      await patchTokenDataHandler(ApiConfig.decideLeave(selectedLeave._id), {
        status: decisionStatus,
        reason: decisionReason,
      }, true);
      toast.success(`Leave ${decisionStatus}`);
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

  const canAction = (leave: LeaveRecord) => leave.status === 'pending' && getId(leave.userId) !== currentUserId;
  const approverNames = (leave: LeaveRecord) => {
    const ids = Array.isArray(leave.reportToUserIds) && leave.reportToUserIds.length
      ? leave.reportToUserIds
      : [leave.reportToUserId].filter(Boolean);
    return ids
      .map((item: any) => item?.name || item?.email || item?.toString?.())
      .filter(Boolean)
      .join(', ');
  };

  if (!canApproveLeave) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex min-h-[280px] items-center justify-center p-8 text-center">
          <div>
            <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Approval access not assigned</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You do not have permission to view or act on leave requests.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leave Requests</h1>
          <p className="text-muted-foreground">Approve or reject leave requests assigned to you.</p>
        </div>
        <Button variant="outline" onClick={() => fetchRequests(true)} disabled={refreshing} className="gap-2">
          <RefreshCw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total</p><div className="mt-2 text-3xl font-semibold">{stats.total}</div></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Pending</p><div className="mt-2 text-3xl font-semibold text-yellow-700">{stats.pending}</div></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Approved</p><div className="mt-2 text-3xl font-semibold text-green-700">{stats.approved}</div></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Rejected</p><div className="mt-2 text-3xl font-semibold text-red-700">{stats.rejected}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="h-5 w-5" />
            Requests to Review
          </CardTitle>
          <CardDescription>Open a request to see the full leave note, then approve or reject it.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
              <h3 className="text-lg font-semibold">No leave requests</h3>
              <p className="mt-2 text-sm text-muted-foreground">Requests sent to you will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((leave) => (
                <button
                  key={leave._id}
                  type="button"
                  onClick={() => openDetails(leave)}
                  className="w-full rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={STATUS_STYLE[leave.status]}>{leave.status}</Badge>
                        <Badge variant="outline">{formatRange(leave)}</Badge>
                      </div>
                      <div>
                        <h3 className="font-semibold">{leave.subject}</h3>
                        <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap line-clamp-2">{leave.reason}</p>
                        <div className="mt-3 text-xs text-muted-foreground">
                          From: {leave.userId?.name || 'Unknown'} | Report to: {approverNames(leave) || 'Unknown'}
                        </div>
                        {leave.approvedBy && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Approved by: {leave.approvedBy.name}
                            {leave.approvedAt ? ` on ${format(new Date(leave.approvedAt), 'MMM dd, yyyy hh:mm a')}` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetails(leave);
                        }}
                        className="gap-2"
                      >
                        View
                      </Button>
                      {canAction(leave) && (
                        <>
                          <Button size="sm" onClick={(e) => { e.stopPropagation(); openDecision(leave, 'approved'); }} className="gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); openDecision(leave, 'rejected'); }} className="gap-2">
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          {selectedLeave && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  {selectedLeave.subject}
                </DialogTitle>
                <DialogDescription>
                  {formatRange(selectedLeave)} | Report to {approverNames(selectedLeave) || 'Unknown'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={STATUS_STYLE[selectedLeave.status]}>{selectedLeave.status}</Badge>
                  {selectedLeave.approvedBy && (
                    <Badge variant="outline">Approved by {selectedLeave.approvedBy.name}</Badge>
                  )}
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <FormattedText text={selectedLeave.reason || ''} className="text-sm" />
                </div>
                {selectedLeave.approvalReason && (
                  <div className="rounded-2xl border border-dashed p-4">
                    <h4 className="font-semibold text-sm">Approval note</h4>
                    <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{selectedLeave.approvalReason}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
                {canAction(selectedLeave) && (
                  <>
                    <Button onClick={() => {
                      setDetailOpen(false);
                      openDecision(selectedLeave, 'approved');
                    }} className="gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button variant="destructive" onClick={() => {
                      setDetailOpen(false);
                      openDecision(selectedLeave, 'rejected');
                    }} className="gap-2">
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={decisionOpen} onOpenChange={setDecisionOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{decisionStatus === 'approved' ? 'Approve leave' : 'Reject leave'}</DialogTitle>
            <DialogDescription>
              {decisionStatus === 'approved' ? 'Confirm this leave request.' : 'Add a reason for rejection.'}
            </DialogDescription>
          </DialogHeader>

          {decisionStatus === 'rejected' && (
            <div className="space-y-2">
              <Textarea
                rows={4}
                placeholder="Reason for rejection"
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionOpen(false)}>Cancel</Button>
            <Button onClick={submitDecision} disabled={processing} className="gap-2">
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
