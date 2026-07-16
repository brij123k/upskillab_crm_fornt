import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser } from '@/auth';
import { format } from 'date-fns';
import { CalendarDays, Clock3, Loader2, RefreshCw, TrendingUp, AlertCircle, CheckCircle2, Users, Eye, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MultiSelect } from '@/components/ui/multi-select';
import { getDataHandlerWithToken, patchTokenDataHandler, postDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from 'sonner';
import { FormattedTextEditor } from '@/components/editor/FormattedTextEditor';
import { FormattedText } from '@/components/editor/FormattedText';
import { Progress } from '@/components/ui/progress';

type SeniorOption = {
  _id: string;
  name: string;
  email: string;
  employeeId: number;
  profile?: {
    reportingSeniorId?: { _id: string; name: string } | string;
  };
};

type LeaveRecord = {
  _id: string;
  userId: any;
  createdBy: any;
  reportToUserId: any;
  reportToUserIds?: any[];
  subject: string;
  leaveFrom: string;
  leaveTo?: string;
  leaveDate?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvalReason?: string;
  approvedBy?: any;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type KraItem = { maxLeavePerMonth?: number };

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

const getDayCount = (leave: LeaveRecord): number => {
  const from = leave.leaveFrom || leave.leaveDate;
  const to = leave.leaveTo || leave.leaveFrom || leave.leaveDate;
  if (!from || !to) return 1;
  const start = new Date(from);
  const end = new Date(to);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

export function LeavesPage() {
  const { leaveId } = useParams<{ leaveId?: string }>();
  const currentUser = getUser();
  const currentUserId = currentUser?._id || currentUser?.id || currentUser?.userId || '';
  const currentRoleId = currentUser?.role?._id || currentUser?.role?.id || currentUser?.roleId || '';
  const [seniors, setSeniors] = useState<SeniorOption[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [kra, setKra] = useState<KraItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState<LeaveRecord | null>(null);
  const [detailLeave, setDetailLeave] = useState<LeaveRecord | null>(null);
  const [form, setForm] = useState({
    reportToUserIds: [] as string[],
    subject: '',
    leaveFrom: '',
    leaveTo: '',
    reason: '',
  });

  const fetchData = async (showSpinner = false) => {
    try {
      if (showSpinner) setRefreshing(true);
      else setLoading(true);

      const [profilesRes, leavesRes, kraRes] = await Promise.all([
        getDataHandlerWithToken(ApiConfig.getMySeniors, null, null, true),
        getDataHandlerWithToken(ApiConfig.getMyLeaves, { page: 1, limit: 100 }, null, true),
        currentRoleId ? getDataHandlerWithToken(ApiConfig.getKRAByRole(currentRoleId), null, null, true) : Promise.resolve(null),
      ]);

      setSeniors(profilesRes?.data || profilesRes || []);
      setLeaves(leavesRes?.data || []);
      setKra(kraRes?.data || kraRes || null);
    } catch (error) {
      console.error('Failed to load leave data:', error);
      toast.error('Failed to load leave data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchLeaveById = async (id: string) => {
    const cached = leaves.find((item) => item._id === id);
    if (cached) {
      setDetailLeave(cached);
      setDetailOpen(true);
      return;
    }

    const response = await getDataHandlerWithToken(ApiConfig.getMyLeaveById(id), null, null, true);
    const data = response?.data || response;
    if (data) {
      setDetailLeave(data);
      setDetailOpen(true);
    }
  };

  useEffect(() => {
    if (!currentUserId) return;
    fetchData();
  }, [currentUserId]);

  useEffect(() => {
    if (leaveId) {
      fetchLeaveById(leaveId).catch((error) => {
        console.error('Failed to load leave detail:', error);
        toast.error('Failed to load leave detail');
      });
    }
  }, [leaveId, leaves]);

  const approverOptions = useMemo(() => seniors.map((senior: any) => {
    const value = getId(senior);
    return {
      value,
      label: `${senior.name || senior.profile?.userId?.name || 'Senior'} ${senior.employeeId ? `(${senior.employeeId})` : ''}`,
      disabled: value === currentUserId,
    };
  }).filter((item) => item.value), [seniors, currentUserId]);

  const monthCount = useMemo(() => {
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    return leaves.reduce((count, leave) => {
      const start = new Date(leave.leaveFrom || leave.leaveDate);
      const end = new Date(leave.leaveTo || leave.leaveFrom || leave.leaveDate);
      if (getId(leave.userId) !== currentUserId || start.getMonth() !== month || start.getFullYear() !== year) {
        return count;
      }
      const diff = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
      return count + diff;
    }, 0);
  }, [leaves, currentUserId]);

  const myLeaves = useMemo(() => leaves.filter((leave) => getId(leave.userId) === currentUserId), [leaves, currentUserId]);
  const currentLimit = kra?.maxLeavePerMonth || 0;

  const resetForm = () => {
    setForm({
      reportToUserIds: [],
      subject: '',
      leaveFrom: '',
      leaveTo: '',
      reason: '',
    });
    setEditingLeave(null);
  };

  const openCreate = () => {
    resetForm();
    setEditOpen(true);
  };

  const openEdit = (leave: LeaveRecord) => {
    setEditingLeave(leave);
    setForm({
      reportToUserIds: Array.isArray(leave.reportToUserIds) && leave.reportToUserIds.length
        ? leave.reportToUserIds.map((item) => String(getId(item))).filter(Boolean)
        : [String(getId(leave.reportToUserId) || '')].filter(Boolean),
      subject: leave.subject || '',
      leaveFrom: leave.leaveFrom ? new Date(leave.leaveFrom).toISOString().slice(0, 10) : '',
      leaveTo: leave.leaveTo ? new Date(leave.leaveTo).toISOString().slice(0, 10) : '',
      reason: leave.reason || '',
    });
    setEditOpen(true);
  };

  const openDetails = (leave: LeaveRecord) => {
    setDetailLeave(leave);
    setDetailOpen(true);
  };

  const submitLeave = async () => {
    if (!form.subject || !form.leaveFrom || !form.reason || !form.reportToUserIds.length) {
      toast.error('Please fill all required fields');
      return;
    }

    const payload = {
      subject: form.subject,
      reason: form.reason,
      leaveFrom: form.leaveFrom,
      leaveTo: form.leaveTo || form.leaveFrom,
      reportToUserIds: form.reportToUserIds,
    };

    setSaving(true);
    try {
      if (editingLeave) {
        await patchTokenDataHandler(ApiConfig.updateMyLeave(editingLeave._id), payload, true);
        toast.success('Leave updated');
      } else {
        await postDataHandlerWithToken(ApiConfig.createLeave, payload, true);
        toast.success('Leave request submitted');
      }

      setEditOpen(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      console.error('Failed to save leave:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to save leave');
    } finally {
      setSaving(false);
    }
  };

  const cancelLeave = async (id: string) => {
    try {
      await patchTokenDataHandler(ApiConfig.cancelMyLeave(id), null, true);
      toast.success('Leave cancelled');
      await fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to cancel leave');
    }
  };

  const approvalNames = (leave: LeaveRecord) => {
    const ids = Array.isArray(leave.reportToUserIds) && leave.reportToUserIds.length
      ? leave.reportToUserIds
      : [leave.reportToUserId].filter(Boolean);
    return ids
      .map((item: any) => item?.name || item?.fullName || item?.user?.name || item?.email || item?.toString?.())
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Leave Requests</h1>
          <p className="text-muted-foreground">Submit and track your leave applications.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchData(true)} disabled={refreshing} className="gap-2">
            <RefreshCw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Refresh
          </Button>
          <Button onClick={openCreate} className="gap-2 bg-orange-600 hover:bg-orange-700">
            <CalendarDays className="h-4 w-4" />
            New Leave
          </Button>
        </div>
      </div>

      {/* Leave Balance Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700 uppercase">Total Requests</p>
                <div className="mt-2 text-3xl font-bold text-blue-900">{myLeaves.length}</div>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700 uppercase">Approved</p>
                <div className="mt-2 text-3xl font-bold text-green-900">{myLeaves.filter(l => l.status === 'approved').length}</div>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-700 uppercase">Pending</p>
                <div className="mt-2 text-3xl font-bold text-yellow-900">{myLeaves.filter(l => l.status === 'pending').length}</div>
              </div>
              <Clock3 className="h-8 w-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-700 uppercase">This Month</p>
                <div className="mt-2 text-3xl font-bold text-purple-900">{monthCount} day(s)</div>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Submission Form */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-orange-600" />
            Submit New Leave Request
          </CardTitle>
          <CardDescription>
            Specify dates, reason, and approvers. Your request will be routed for approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-sm font-semibold">Subject *</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="e.g., Annual Leave, Medical Emergency, Family Event"
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">From Date *</Label>
              <Input
                type="date"
                value={form.leaveFrom}
                onChange={(e) => setForm((prev) => ({ ...prev, leaveFrom: e.target.value }))}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">To Date *</Label>
              <Input
                type="date"
                value={form.leaveTo}
                onChange={(e) => setForm((prev) => ({ ...prev, leaveTo: e.target.value }))}
                className="rounded-lg"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="text-sm font-semibold">Approve to (Reporting Seniors) *</Label>
              <MultiSelect
                options={approverOptions}
                selected={form.reportToUserIds}
                onChange={(selected) => setForm((prev) => ({ ...prev, reportToUserIds: selected }))}
                placeholder="Select your approvers"
                searchPlaceholder="Search seniors..."
                emptyMessage="No approvers found"
              />
              <p className="text-xs text-slate-500">Select your immediate seniors for approval</p>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label className="text-sm font-semibold">Reason for Leave *</Label>
              <FormattedTextEditor
                value={form.reason}
                onChange={(value) => setForm((prev) => ({ ...prev, reason: value }))}
                placeholder="Explain your reason for taking leave..."
                previewLabel="Reason preview"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => resetForm()}
              >
                Clear
              </Button>
              <Button
                onClick={submitLeave}
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700 gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CalendarDays className="h-4 w-4" />
                    Submit Leave
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-5 w-5" />
            Your Leave History
          </CardTitle>
          <CardDescription>All submitted leave requests and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : myLeaves.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
              <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mt-3 text-lg font-semibold">No leave requests yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">Your leave requests will appear here once submitted.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myLeaves.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((leave) => {
                const dayCount = getDayCount(leave);
                const isPending = leave.status === 'pending';
                
                return (
                  <div
                    key={leave._id}
                    className={`rounded-lg border-2 p-4 transition ${
                      isPending
                        ? 'border-yellow-200 bg-yellow-50'
                        : leave.status === 'approved'
                        ? 'border-green-200 bg-green-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {leave.status === 'pending' && (
                            <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200">⏳ Pending</Badge>
                          )}
                          {leave.status === 'approved' && (
                            <Badge className="bg-green-100 text-green-800 border border-green-200">✓ Approved</Badge>
                          )}
                          {leave.status === 'rejected' && (
                            <Badge className="bg-red-100 text-red-800 border border-red-200">✗ Rejected</Badge>
                          )}
                          {leave.status === 'cancelled' && (
                            <Badge className="bg-slate-100 text-slate-800 border border-slate-200">◯ Cancelled</Badge>
                          )}
                          <span className="text-xs font-medium text-slate-600">{dayCount} day(s)</span>
                        </div>
                        <span className="text-xs text-slate-600 font-medium">{formatRange(leave)}</span>
                      </div>

                      {/* Subject */}
                      <div>
                        <h4 className="font-semibold text-slate-900">{leave.subject}</h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Submitted on {format(new Date(leave.createdAt), 'MMM dd, yyyy hh:mm a')}
                        </p>
                      </div>

                      {/* Approval Info */}
                      {leave.approvedBy && (
                        <div className="flex items-start gap-2 text-xs bg-green-100 border border-green-200 rounded p-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="text-green-800">
                            <span className="font-medium">Approved by {leave.approvedBy.name}</span>
                            {leave.approvedAt && ` on ${format(new Date(leave.approvedAt), 'MMM dd, yyyy')}`}
                          </div>
                        </div>
                      )}

                      {leave.status === 'rejected' && leave.approvalReason && (
                        <div className="flex items-start gap-2 text-xs bg-red-100 border border-red-200 rounded p-2">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="text-red-800">
                            <span className="font-medium">Rejected.</span> {leave.approvalReason}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-current border-opacity-10">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetails(leave)}
                          className="gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                        {leave.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(leave)}
                              className="gap-1"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => cancelLeave(leave._id)}
                              className="gap-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLeave ? 'Update Leave Request' : 'New Leave Request'}</DialogTitle>
            <DialogDescription>
              {editingLeave ? 'Update your pending leave request before approval.' : 'Submit a new leave request to your reporting seniors.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-semibold">Subject *</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Leave subject"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="font-semibold">From Date *</Label>
                <Input
                  type="date"
                  value={form.leaveFrom}
                  onChange={(e) => setForm((prev) => ({ ...prev, leaveFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">To Date *</Label>
                <Input
                  type="date"
                  value={form.leaveTo}
                  onChange={(e) => setForm((prev) => ({ ...prev, leaveTo: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Approvers *</Label>
              <MultiSelect
                options={approverOptions}
                selected={form.reportToUserIds}
                onChange={(selected) => setForm((prev) => ({ ...prev, reportToUserIds: selected }))}
                placeholder="Select approvers"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Reason *</Label>
              <FormattedTextEditor
                value={form.reason}
                onChange={(value) => setForm((prev) => ({ ...prev, reason: value }))}
                placeholder="Reason for leave"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={submitLeave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingLeave ? 'Update' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailLeave && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  {detailLeave.subject}
                </DialogTitle>
                <DialogDescription>
                  {formatRange(detailLeave)} • {getDayCount(detailLeave)} day(s)
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  {detailLeave.status === 'pending' && (
                    <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending</Badge>
                  )}
                  {detailLeave.status === 'approved' && (
                    <Badge className="bg-green-100 text-green-800">✓ Approved</Badge>
                  )}
                  {detailLeave.status === 'rejected' && (
                    <Badge className="bg-red-100 text-red-800">✗ Rejected</Badge>
                  )}
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label className="font-medium">Reason</Label>
                  <div className="p-3 bg-slate-50 rounded-lg text-sm whitespace-pre-wrap">
                    <FormattedText text={detailLeave.reason} />
                  </div>
                </div>

                {/* Approval Info */}
                {detailLeave.approvedBy && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Approved by <span className="font-medium">{detailLeave.approvedBy.name}</span></span>
                    </div>
                    {detailLeave.approvedAt && (
                      <div className="text-xs text-green-700 mt-1">
                        On {format(new Date(detailLeave.approvedAt), 'MMM dd, yyyy hh:mm a')}
                      </div>
                    )}
                  </div>
                )}

                {detailLeave.status === 'rejected' && detailLeave.approvalReason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm whitespace-pre-wrap">
                    <span className="font-medium">Rejection reason:</span>
                    <p className="text-red-700 mt-1">{detailLeave.approvalReason}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                {detailLeave.status === 'pending' && (
                  <Button
                    onClick={() => {
                      setDetailOpen(false);
                      openEdit(detailLeave);
                    }}
                    variant="outline"
                  >
                    Edit Request
                  </Button>
                )}
                <Button onClick={() => setDetailOpen(false)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
