import { useEffect, useState } from 'react';
import { Clock, GraduationCap, Loader2, Phone, PhoneCall } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import ApiConfig from '@/config/apiConfig';
import { getDataHandlerWithToken, postDataHandlerWithToken } from '@/config/services';
import {
  ENROLLED_CALL_SAVED_EVENT,
  EnrolledStage,
  formatDateTime,
  formatDuration,
  unwrapError,
} from '@/lib/enrolledLeads';

/** Socket payload ("call-completed" with type "enrolled") or a pending call. */
export interface EnrolledCallData {
  callId: string;
  enrolledLeadId?: string;
  enrolledLead?: { _id?: string; fullName?: string; mobileNumber?: string; stageId?: string; stageName?: string } | null;
  duration?: number;
  startedAt?: string;
  recording_url?: string;
  call?: any;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callData: EnrolledCallData | null;
  onSaved?: () => void;
}

/**
 * Details after a call with an enrolled student — same as the lead page's
 * call feedback: stage, outcome and remark. Saved in the student's history.
 */
export function EnrolledCallFeedbackModal({ open, onOpenChange, callData, onSaved }: Props) {
  const [stages, setStages] = useState<EnrolledStage[]>([]);
  const [loadingStages, setLoadingStages] = useState(false);
  const [stageId, setStageId] = useState('');
  const [outcome, setOutcome] = useState('');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setOutcome('');
    setRemark('');
    setStageId(callData?.enrolledLead?.stageId ? String(callData.enrolledLead.stageId) : '');
    setLoadingStages(true);
    getDataHandlerWithToken(ApiConfig.enrolledLeadStages, null, null, true)
      .then((res) => setStages(res || []))
      .catch(() => toast({ title: 'Error', description: 'Failed to load stages', variant: 'destructive' }))
      .finally(() => setLoadingStages(false));
  }, [open, callData]);

  const submit = async () => {
    if (!callData || !stageId || !outcome.trim()) return;
    try {
      setSubmitting(true);
      await postDataHandlerWithToken(
        ApiConfig.enrolledCallFeedback(String(callData.callId)),
        { stageId, outcome: outcome.trim(), ...(remark.trim() ? { remark: remark.trim() } : {}) },
        true,
      );
      toast({ title: 'Saved', description: 'Call details saved in the student history' });
      window.dispatchEvent(new CustomEvent(ENROLLED_CALL_SAVED_EVENT, { detail: { callId: callData.callId } }));
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Error', description: unwrapError(error, 'Failed to save call details'), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!callData) return null;
  const duration = callData.duration ?? Number(callData.call?.duration) ?? 0;
  const recording = callData.recording_url || callData.call?.recording_url;
  const startedAt = callData.startedAt || callData.call?.startedAt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-orange-500" /> Enrolled student call details
          </DialogTitle>
          <DialogDescription>Fill in what happened on the call. It is saved in the student's history.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
            <div>
              <div className="text-xs text-slate-500">Student</div>
              <div className="font-semibold text-slate-800">{callData.enrolledLead?.fullName || '—'}</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs text-slate-500"><Phone className="w-3 h-3" /> Mobile</div>
              <div className="font-medium text-slate-800">{callData.enrolledLead?.mobileNumber || callData.call?.customerNumber || '—'}</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs text-slate-500"><Clock className="w-3 h-3" /> Duration</div>
              <div className="font-medium text-slate-800">{formatDuration(duration)}{Number(duration) === 0 && <span className="ml-1 text-xs text-red-500">(not answered)</span>}</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs text-slate-500"><PhoneCall className="w-3 h-3" /> Time</div>
              <div className="font-medium text-slate-800">{formatDateTime(startedAt)}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-slate-500">Current stage</div>
              <div className="font-medium text-slate-800">{callData.enrolledLead?.stageName || '—'}</div>
            </div>
            {recording && (
              <div className="col-span-2">
                <audio controls src={recording} className="h-9 w-full" />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Stage <span className="text-red-500">*</span></Label>
            <Select value={stageId} onValueChange={setStageId} disabled={submitting || loadingStages}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder={loadingStages ? 'Loading…' : 'Select a stage'} /></SelectTrigger>
              <SelectContent>
                {stages.map((s) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Outcome <span className="text-red-500">*</span></Label>
            <Input value={outcome} onChange={(e) => setOutcome(e.target.value)} maxLength={500} placeholder="e.g. Connected, Busy, Switched off, Call back later" disabled={submitting} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Remark</Label>
            <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} maxLength={2000} placeholder="What did the student say?" disabled={submitting} className="rounded-xl" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="rounded-xl">Later</Button>
          <Button onClick={submit} disabled={submitting || !stageId || !outcome.trim()} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
