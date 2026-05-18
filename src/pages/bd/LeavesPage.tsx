import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser } from '@/auth';
import { format } from 'date-fns';
import { CalendarDays, Clock3, Loader2, RefreshCw, ShieldAlert, Users, Eye } from 'lucide-react';
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
          <h1 className="text-2xl font-bold text-foreground">My Leaves</h1>
          <p className="text-muted-foreground">Create leave requests and track approvals.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchData(true)} disabled={refreshing} className="gap-2">
            <RefreshCw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Refresh
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <CalendarDays className="h-4 w-4" />
            New Leave
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Applied this month</p>
            <div className="mt-2 text-3xl font-semibold">{monthCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Max leave / month</p>
            <div className="mt-2 text-3xl font-semibold">{currentLimit || 'No limit'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Your requests</p>
            <div className="mt-2 text-3xl font-semibold">{myLeaves.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5" />
            Apply Leave
          </CardTitle>
          <CardDescription>
            Add a subject, rich-text reason, date range, and one or more approvers.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Report To</Label>
            <MultiSelect
              options={approverOptions}
              selected={form.reportToUserIds}
              onChange={(selected) => setForm((prev) => ({ ...prev, reportToUserIds: selected }))}
              placeholder="Select approvers"
              searchPlaceholder="Search approvers..."
              emptyMessage="No approvers found"
            />
          </div>
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={form.subject}
              onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
              placeholder="Leave subject"
            />
          </div>
          <div className="space-y-2">
            <Label>From Date</Label>
            <Input
              type="date"
              value={form.leaveFrom}
              onChange={(e) => setForm((prev) => ({ ...prev, leaveFrom: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>To Date</Label>
            <Input
              type="date"
              value={form.leaveTo}
              onChange={(e) => setForm((prev) => ({ ...prev, leaveTo: e.target.value }))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Reason</Label>
            <FormattedTextEditor
              value={form.reason}
              onChange={(value) => setForm((prev) => ({ ...prev, reason: value }))}
              placeholder="Explain why you need leave..."
              previewLabel="Reason preview"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={submitLeave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
              {editingLeave ? 'Update Leave' : 'Submit Leave'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="h-5 w-5" />
            Leave History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : myLeaves.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
              <h3 className="text-lg font-semibold">No leave requests yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">Your applied leaves will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myLeaves.map((leave) => (
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
                        <h3 className="font-semibold text-foreground">{leave.subject}</h3>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5" />
                          Created on {format(new Date(leave.createdAt), 'MMM dd, yyyy hh:mm a')}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Report to: {approvalNames(leave) || 'Unknown'}
                        {leave.approvedBy ? ` | Approved by: ${leave.approvedBy.name}` : ''}
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
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      {leave.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(leave);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelLeave(leave._id);
                            }}
                          >
                            Cancel
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLeave ? 'Update Leave' : 'Apply Leave'}</DialogTitle>
            <DialogDescription>
              {editingLeave ? 'Update your pending leave request.' : 'Submit a new leave request.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={form.leaveFrom}
                  onChange={(e) => setForm((prev) => ({ ...prev, leaveFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={form.leaveTo}
                  onChange={(e) => setForm((prev) => ({ ...prev, leaveTo: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Report To</Label>
              <MultiSelect
                options={approverOptions}
                selected={form.reportToUserIds}
                onChange={(selected) => setForm((prev) => ({ ...prev, reportToUserIds: selected }))}
                placeholder="Select approvers"
                searchPlaceholder="Search approvers..."
                emptyMessage="No approvers found"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <FormattedTextEditor
                value={form.reason}
                onChange={(value) => setForm((prev) => ({ ...prev, reason: value }))}
                placeholder="Write your leave reason..."
                previewLabel="Reason preview"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Close</Button>
            <Button onClick={submitLeave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          {detailLeave && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  {detailLeave.subject}
                </DialogTitle>
                <DialogDescription>
                  {formatRange(detailLeave)} | Report to {approvalNames(detailLeave) || 'Unknown'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={STATUS_STYLE[detailLeave.status]}>{detailLeave.status}</Badge>
                  <Badge variant="outline">
                    {detailLeave.approvedBy ? `Approved by ${detailLeave.approvedBy.name}` : 'Pending approval'}
                  </Badge>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <FormattedText text={detailLeave.reason || ''} className="text-sm" />
                </div>
                {detailLeave.approvalReason && (
                  <div className="rounded-2xl border border-dashed p-4">
                    <h4 className="font-semibold text-sm">Approval note</h4>
                    <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{detailLeave.approvalReason}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
                {detailLeave.status === 'pending' && (
                  <Button onClick={() => {
                    setDetailOpen(false);
                    openEdit(detailLeave);
                  }}>
                    Edit Request
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
