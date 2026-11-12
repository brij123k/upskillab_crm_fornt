import { useEffect, useState } from 'react';
import { Clock, Loader2, MessageSquare, Phone, PhoneCall, Send, User as UserIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import ApiConfig from '@/config/apiConfig';
import { getDataHandlerWithToken, postDataHandlerWithToken } from '@/config/services';
import { Avatar, StageBadge, Tag } from '@/components/reports/ReportUI';
import { EnrolledCallData, EnrolledCallFeedbackModal } from './EnrolledCallFeedbackModal';
import {
  ACTION_LABEL,
  ACTIVITY_TYPES,
  BATCH_STATUS_TONE,
  ENROLLED_CALL_SAVED_EVENT,
  EnrolledHistory,
  EnrolledLead,
  EnrolledStage,
  formatDate,
  formatDateTime,
  formatDuration,
  formatINR,
  titleCase,
  unwrapError,
} from '@/lib/enrolledLeads';

interface Props {
  leadId: string | null;
  stages: EnrolledStage[];
  canUpdate: boolean;
  canCall?: boolean;
  /** Tab to open on: overview | orders | courses | calls | activity */
  initialTab?: string;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

type Detail = EnrolledLead & {
  history: EnrolledHistory[];
  courseDetails: any[];
  batchDetails: any[];
};

const KEEP_STAGE = '__keep__';

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm text-slate-800 break-words">{value || value === 0 ? value : '—'}</div>
    </div>
  );
}

export function BatchStatusPill({ status }: { status?: string }) {
  if (!status) return <span className="text-slate-400">—</span>;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        BATCH_STATUS_TONE[status.toLowerCase()] || 'bg-slate-50 text-slate-600 ring-slate-200',
      )}
    >
      {titleCase(status)}
    </span>
  );
}

export function ActiveBadge({ isActive, status }: { isActive?: boolean; status?: string }) {
  const label = isActive === undefined ? titleCase(status) || '—' : isActive ? 'Active' : 'Inactive';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        isActive === true && 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        isActive === false && 'bg-red-50 text-red-700 ring-red-200',
        isActive === undefined && 'bg-slate-50 text-slate-600 ring-slate-200',
      )}
    >
      {label}
    </span>
  );
}

/** Starts a Smartflo click-to-call; Smartflo rings the user's phone first. */
export async function startEnrolledCall(leadId: string) {
  try {
    const res = await postDataHandlerWithToken(ApiConfig.enrolledLeadCall(leadId), {}, true);
    toast({
      title: 'Calling…',
      description: res?.message || 'Call request sent to your phone. Fill the call details when it ends.',
    });
    return true;
  } catch (error) {
    toast({ title: 'Call failed', description: unwrapError(error, 'Could not start the call'), variant: 'destructive' });
    return false;
  }
}

export function EnrolledLeadDetailDialog({
  leadId,
  stages,
  canUpdate,
  canCall = false,
  initialTab = 'overview',
  onOpenChange,
  onChanged,
}: Props) {
  const [lead, setLead] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(initialTab);
  const [calls, setCalls] = useState<any[]>([]);
  const [callsLoading, setCallsLoading] = useState(false);
  const [calling, setCalling] = useState(false);
  const [feedbackCall, setFeedbackCall] = useState<EnrolledCallData | null>(null);

  const reload = async (id = leadId) => {
    if (!id) return;
    try {
      setLead(await getDataHandlerWithToken(ApiConfig.enrolledLead(id), null, null, true));
    } catch {
      // keep what is shown
    }
  };

  const loadCalls = async (id = leadId) => {
    if (!id) return;
    try {
      setCallsLoading(true);
      setCalls((await getDataHandlerWithToken(ApiConfig.enrolledLeadCalls(id), null, null, true)) || []);
    } catch (error) {
      toast({ title: 'Error', description: unwrapError(error, 'Failed to load calls'), variant: 'destructive' });
    } finally {
      setCallsLoading(false);
    }
  };

  // Refresh when call details are saved anywhere (e.g. the pop-up after a call)
  useEffect(() => {
    const onSaved = () => {
      reload();
      loadCalls();
    };
    window.addEventListener(ENROLLED_CALL_SAVED_EVENT, onSaved);
    return () => window.removeEventListener(ENROLLED_CALL_SAVED_EVENT, onSaved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  useEffect(() => {
    if (tab === 'calls') loadCalls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, leadId]);

  const callNow = async () => {
    if (!lead) return;
    setCalling(true);
    await startEnrolledCall(lead._id);
    setCalling(false);
    setTab('calls');
  };

  const [activityType, setActivityType] = useState<string>('call');
  const [stageId, setStageId] = useState<string>(KEEP_STAGE);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!leadId) return;
    setTab(initialTab);
    setCalls([]);
    setActivityType('call');
    setStageId(KEEP_STAGE);
    setNote('');
    setLead(null);
    setLoading(true);
    getDataHandlerWithToken(ApiConfig.enrolledLead(leadId), null, null, true)
      .then((res) => setLead(res))
      .catch((error) => {
        toast({ title: 'Error', description: unwrapError(error, 'Failed to load student'), variant: 'destructive' });
        onOpenChange(false);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const submitActivity = async () => {
    if (!lead) return;
    const changeStage = stageId !== KEEP_STAGE;
    if (activityType === 'stage_changed' && !changeStage) {
      toast({ title: 'Pick a stage', description: 'Choose the new stage for this student', variant: 'destructive' });
      return;
    }
    if (activityType === 'note' && !note.trim() && !changeStage) {
      toast({ title: 'Write a note', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      const body: Record<string, any> = { type: activityType };
      if (changeStage) body.stageId = stageId;
      if (note.trim()) body.note = note.trim();
      const updated = await postDataHandlerWithToken(ApiConfig.enrolledLeadActivity(lead._id), body, true);
      setLead(updated);
      setNote('');
      setStageId(KEEP_STAGE);
      toast({ title: 'Saved', description: changeStage ? `Stage set to ${updated.stageName}` : 'Activity logged' });
      onChanged();
    } catch (error) {
      toast({ title: 'Error', description: unwrapError(error, 'Failed to save'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  /** Contact buttons open the app and prefill the matching activity. */
  const quickAction = (type: string) => {
    setActivityType(type);
    setTab('activity');
  };

  const phone = (lead?.mobileNumber || '').replace(/\D/g, '');
  const waPhone = phone.length === 10 ? `91${phone}` : phone;
  const summary = lead?.paymentSummary || {};

  return (
    <Dialog open={!!leadId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[960px] max-h-[90vh] overflow-y-auto rounded-2xl border-slate-200">
        {loading || !lead ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-start justify-between gap-3 pr-6">
                <div className="flex items-center gap-3">
                  <Avatar name={lead.fullName} className="w-11 h-11 text-sm" />
                  <div>
                    <DialogTitle className="text-lg text-slate-900">{lead.fullName || lead.username || 'Student'}</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                      Student ID {lead.studentId} · enrolled {formatDate(lead.studentCreatedAt)}
                    </DialogDescription>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StageBadge label={lead.stageName} />
                  <ActiveBadge isActive={lead.isActive} status={lead.status} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-3">
                {phone && canCall && (
                  <Button size="sm" onClick={callNow} disabled={calling} className="rounded-xl h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                    {calling ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <PhoneCall className="w-3.5 h-3.5 mr-1.5" />}
                    Click to call
                  </Button>
                )}
                {phone && !canCall && (
                  <Button asChild variant="outline" size="sm" className="rounded-xl h-8" onClick={() => quickAction('call')}>
                    <a href={`tel:${lead.mobileNumber}`}>
                      <Phone className="w-3.5 h-3.5 mr-1.5" /> Call
                    </a>
                  </Button>
                )}
                {phone && (
                  <Button asChild variant="outline" size="sm" className="rounded-xl h-8 text-green-700" onClick={() => quickAction('whatsapp')}>
                    <a href={`https://web.whatsapp.com/send?phone=${waPhone}`} target="_blank" rel="noopener noreferrer">
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </DialogHeader>

            <Tabs value={tab} onValueChange={setTab} className="mt-2">
              <TabsList className="rounded-xl">
                <TabsTrigger value="overview">Details</TabsTrigger>
                <TabsTrigger value="orders">Orders ({lead.orders?.length || 0})</TabsTrigger>
                <TabsTrigger value="courses">Courses & Batches</TabsTrigger>
                <TabsTrigger value="calls">Calls</TabsTrigger>
                <TabsTrigger value="activity">Activity & History ({lead.history?.length || 0})</TabsTrigger>
              </TabsList>

              {/* ---------------- details ---------------- */}
              <TabsContent value="overview" className="space-y-5 pt-3">
                <section>
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700"><UserIcon className="w-4 h-4" /> User details</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-xl border border-slate-100 p-4">
                    <Field label="Email" value={lead.email} />
                    <Field label="Mobile" value={lead.mobileNumber} />
                    <Field label="Username" value={lead.username} />
                    <Field label="User type" value={lead.userType} />
                    <Field label="Active" value={lead.isActive === undefined ? undefined : lead.isActive ? 'Yes' : 'No'} />
                    <Field label="Status" value={titleCase(lead.status)} />
                    <Field label="User ID" value={lead.userId} />
                    <Field label="Updated on Upskillab" value={formatDate(lead.studentUpdatedAt)} />
                  </div>
                </section>
                <section>
                  <h4 className="mb-2 text-sm font-semibold text-slate-700">Student details</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-xl border border-slate-100 p-4">
                    <Field label="Full name" value={lead.fullName} />
                    <Field label="College" value={lead.college} />
                    <Field label="Student type" value={titleCase(lead.studentType)} />
                    <Field label="Skills" value={lead.skills?.length ? lead.skills.join(', ') : undefined} />
                    <div className="col-span-2 md:col-span-4">
                      <Field label="Bio" value={lead.bio} />
                    </div>
                  </div>
                </section>
                <section>
                  <h4 className="mb-2 text-sm font-semibold text-slate-700">Payment summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 rounded-xl border border-slate-100 p-4">
                    <Field label="Orders" value={summary.totalOrders ?? 0} />
                    <Field label="Total amount" value={formatINR(summary.totalAmount)} />
                    <Field label="Paid" value={<span className="font-semibold text-emerald-700">{formatINR(summary.amountPaid)}</span>} />
                    <Field label="Discount" value={formatINR(summary.discountAmount)} />
                    <Field label="Balance due" value={<span className="font-semibold text-red-600">{formatINR(summary.balanceDue)}</span>} />
                  </div>
                </section>
                <section>
                  <h4 className="mb-2 text-sm font-semibold text-slate-700">CRM</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-xl border border-slate-100 p-4">
                    <Field label="Stage" value={lead.stageName} />
                    <Field label="Assigned to" value={lead.assignedTo ? `${lead.assignedTo.name}${lead.assignedTo.employeeId ? ` (${lead.assignedTo.employeeId})` : ''}` : 'Not assigned'} />
                    <Field label="Last activity" value={lead.lastActivityAt ? `${ACTION_LABEL[lead.lastActivityType || ''] || lead.lastActivityType} · ${formatDateTime(lead.lastActivityAt)}` : undefined} />
                    <Field label="Imported / last synced" value={`${formatDate(lead.firstSyncedAt)} / ${formatDateTime(lead.lastSyncedAt)}`} />
                  </div>
                </section>
              </TabsContent>

              {/* ---------------- orders ---------------- */}
              <TabsContent value="orders" className="pt-3">
                {!lead.orders?.length ? (
                  <p className="py-8 text-center text-sm text-slate-500">No orders on Upskillab.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Order</th>
                          <th className="px-3 py-2 text-left font-medium">Course / Batch</th>
                          <th className="px-3 py-2 text-left font-medium">Batch status</th>
                          <th className="px-3 py-2 text-left font-medium">Teacher</th>
                          <th className="px-3 py-2 text-left font-medium">Status</th>
                          <th className="px-3 py-2 text-right font-medium">Total</th>
                          <th className="px-3 py-2 text-right font-medium">Paid</th>
                          <th className="px-3 py-2 text-right font-medium">Balance</th>
                          <th className="px-3 py-2 text-left font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lead.orders.map((o: any, i: number) => (
                          <tr key={o.orderId || i} className="border-t border-slate-100 align-top">
                            <td className="px-3 py-2">
                              <div className="font-medium text-slate-800">{o.serialNumber || o.orderId}</div>
                              <div className="text-[11px] text-slate-400">
                                {[o.mode, o.source].filter(Boolean).join(' · ')}
                                {o.coupon?.code ? ` · coupon ${o.coupon.code}` : ''}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="text-slate-800">{o.courseId?.courseName || o.courseName || '—'}</div>
                              <div className="text-[11px] text-slate-500">
                                {o.batchId?.batchCode || '—'}
                                {o.batchStartDate ? ` · starts ${formatDate(o.batchStartDate)}` : ''}
                                {o.batchStartTime ? ` ${o.batchStartTime}` : ''}
                              </div>
                            </td>
                            <td className="px-3 py-2"><BatchStatusPill status={o.batchStatus} /></td>
                            <td className="px-3 py-2 text-slate-700">{o.teacher?.name || '—'}</td>
                            <td className="px-3 py-2"><Tag>{o.status || '—'}</Tag></td>
                            <td className="px-3 py-2 text-right">{formatINR(o.totalAmount)}</td>
                            <td className="px-3 py-2 text-right text-emerald-700">{formatINR(o.amountPaid)}</td>
                            <td className="px-3 py-2 text-right text-red-600">{formatINR(o.balanceDue)}</td>
                            <td className="px-3 py-2 text-slate-600">{formatDate(o.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* ---------------- courses / batches ---------------- */}
              <TabsContent value="courses" className="space-y-4 pt-3">
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-xl border border-slate-100 p-3">
                    <div className="text-[11px] uppercase text-slate-400">Courses</div>
                    <div className="mt-1 flex flex-wrap gap-1">{lead.courses?.length ? lead.courses.map((c) => <Tag key={c} className="bg-orange-50 text-orange-700">{c}</Tag>) : '—'}</div>
                  </div>
                  {[
                    ['Ongoing batches', lead.ongoingBatches, 'ongoing'],
                    ['Upcoming batches', lead.upcomingBatches, 'upcoming'],
                    ['Completed batches', lead.completedBatches, 'completed'],
                  ].map(([label, list, status]) => (
                    <div key={label as string} className="rounded-xl border border-slate-100 p-3">
                      <div className="text-[11px] uppercase text-slate-400">{label as string}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(list as string[])?.length
                          ? (list as string[]).map((b) => (
                              <span key={b} className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', BATCH_STATUS_TONE[status as string])}>{b}</span>
                            ))
                          : '—'}
                      </div>
                    </div>
                  ))}
                </div>
                {lead.batchDetails?.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Batch</th>
                          <th className="px-3 py-2 text-left font-medium">Course</th>
                          <th className="px-3 py-2 text-left font-medium">Teacher</th>
                          <th className="px-3 py-2 text-left font-medium">Start / End</th>
                          <th className="px-3 py-2 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lead.batchDetails.map((b: any) => (
                          <tr key={b._id} className="border-t border-slate-100">
                            <td className="px-3 py-2 font-medium text-slate-800">{b.batchCode}</td>
                            <td className="px-3 py-2">{b.courseName || '—'}</td>
                            <td className="px-3 py-2">{b.teacherName || '—'}</td>
                            <td className="px-3 py-2 text-slate-600">{formatDate(b.startDate)} – {formatDate(b.endDate)}</td>
                            <td className="px-3 py-2"><BatchStatusPill status={b.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* ---------------- calls ---------------- */}
              <TabsContent value="calls" className="space-y-3 pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Calls made with Click to call and calls from this student. Fill the details after every call.
                  </p>
                  {phone && canCall && (
                    <Button size="sm" onClick={callNow} disabled={calling} className="rounded-xl h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                      {calling ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <PhoneCall className="w-3.5 h-3.5 mr-1.5" />}
                      Call now
                    </Button>
                  )}
                </div>
                {callsLoading && !calls.length ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-orange-500" /></div>
                ) : !calls.length ? (
                  <p className="py-8 text-center text-sm text-slate-500">No calls yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">When</th>
                          <th className="px-3 py-2 text-left font-medium">By</th>
                          <th className="px-3 py-2 text-left font-medium">Duration</th>
                          <th className="px-3 py-2 text-left font-medium">Outcome</th>
                          <th className="px-3 py-2 text-left font-medium">Stage</th>
                          <th className="px-3 py-2 text-left font-medium">Recording</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calls.map((c) => (
                          <tr key={c._id} className="border-t border-slate-100 align-top">
                            <td className="px-3 py-2 whitespace-nowrap">{formatDateTime(c.startedAt || c.createdAt)}</td>
                            <td className="px-3 py-2">{c.userId?.name || '—'}</td>
                            <td className="px-3 py-2">
                              {formatDuration(c.duration)}
                              {!c.startedAt && <div className="text-[11px] text-amber-600">waiting for call to end…</div>}
                              {c.startedAt && Number(c.duration) === 0 && <div className="text-[11px] text-red-500">not answered</div>}
                            </td>
                            <td className="px-3 py-2">
                              {c.isFormSubmitted ? (
                                c.outcome
                              ) : c.startedAt ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 rounded-lg border-orange-200 text-xs text-orange-600 hover:bg-orange-50"
                                  onClick={() =>
                                    setFeedbackCall({
                                      callId: c._id,
                                      enrolledLeadId: lead._id,
                                      enrolledLead: { fullName: lead.fullName, mobileNumber: lead.mobileNumber, stageId: lead.stageId, stageName: lead.stageName },
                                      duration: Number(c.duration) || 0,
                                      startedAt: c.startedAt,
                                      recording_url: c.recording_url,
                                    })
                                  }
                                >
                                  Fill details
                                </Button>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2">{c.enrolledStageId?.name || '—'}</td>
                            <td className="px-3 py-2">
                              {c.recording_url ? <audio controls src={c.recording_url} className="h-8 w-56" /> : <span className="text-slate-400">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* ---------------- activity + history ---------------- */}
              <TabsContent value="activity" className="space-y-4 pt-3">
                {canUpdate && (
                  <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-4 space-y-3">
                    <div className="text-sm font-semibold text-slate-700">Log what you did and update the stage</div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">Activity</Label>
                        <Select value={activityType} onValueChange={setActivityType}>
                          <SelectTrigger className="h-9 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ACTIVITY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500">New stage {activityType === 'stage_changed' ? '*' : '(optional)'}</Label>
                        <Select value={stageId} onValueChange={setStageId}>
                          <SelectTrigger className="h-9 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={KEEP_STAGE}>Keep "{lead.stageName}"</SelectItem>
                            {stages.filter((s) => s.name !== lead.stageName).map((s) => (
                              <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">Note {activityType === 'note' ? '*' : '(optional)'}</Label>
                      <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} placeholder="e.g. Called, student will join the next live class" className="rounded-xl bg-white" />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={submitActivity} disabled={saving} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Save
                      </Button>
                    </div>
                  </div>
                )}

                {!lead.history?.length ? (
                  <p className="py-6 text-center text-sm text-slate-500">No history yet.</p>
                ) : (
                  <ol className="relative space-y-3 border-l border-slate-200 pl-5">
                    {lead.history.map((h) => (
                      <li key={h._id} className="relative">
                        <span className="absolute -left-[27px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange-500 ring-4 ring-white" />
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-semibold text-slate-800">{ACTION_LABEL[h.actionType] || h.actionType}</span>
                          {h.toStage && (
                            <span className="text-xs text-slate-500">
                              {h.fromStage ? `${h.fromStage} → ` : '→ '}<span className="font-medium text-slate-700">{h.toStage}</span>
                            </span>
                          )}
                          {h.changes?.status && (
                            <span className="text-xs text-slate-500">status {String(h.changes.status.from ?? '—')} → {String(h.changes.status.to ?? '—')}</span>
                          )}
                          {h.changes?.isActive && !h.changes?.status && (
                            <span className="text-xs text-slate-500">{h.changes.isActive.to ? 'now active' : 'now inactive'}</span>
                          )}
                        </div>
                        {h.actionType === 'call' && h.changes?.outcome && (
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                            <Tag>{h.changes.outcome}</Tag>
                            <span>Duration {formatDuration(h.changes.duration)}</span>
                            {h.changes.recordingUrl && <audio controls src={h.changes.recordingUrl} className="h-7 w-52" />}
                          </div>
                        )}
                        {h.note && <p className="mt-0.5 text-sm text-slate-600 whitespace-pre-wrap">{h.note}</p>}
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" /> {formatDateTime(h.createdAt)} · {h.actionBy?.name || 'System'}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
      <EnrolledCallFeedbackModal
        open={!!feedbackCall}
        onOpenChange={(open) => !open && setFeedbackCall(null)}
        callData={feedbackCall}
        onSaved={onChanged}
      />
    </Dialog>
  );
}
