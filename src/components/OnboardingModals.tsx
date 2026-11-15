import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Copy, ExternalLink, Link2, Loader2, Mail, RefreshCw, Unlock, Lock, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ApiConfig from '@/config/apiConfig';
import { getDataHandlerWithToken, patchTokenDataHandler, postDataHandlerWithToken } from '@/config/services';
import type { OnboardingInfo, OnboardingStatus, PersonalDetails, UserType } from '@/types/user';
import { PersonalDetailsForm, EMPTY_PERSONAL_DETAILS, toPersonalDetails, validatePersonalDetails } from './PersonalDetailsForm';
import { AddressForm } from './AddressForm';
import { BankDetailsForm } from './BankDetailsForm';
import { EducationalDetailsForm } from './EducationalDetailsForm';
import { DocumentsUpload } from './DocumentUpload';

const errorMessage = (err: any, fallback: string) => {
  const msg = err?.message ?? err?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return typeof msg === 'string' && msg ? msg : fallback;
};

export const ONBOARDING_LABELS: Record<OnboardingStatus, string> = {
  not_shared: 'Not shared',
  pending: 'Link shared',
  submitted: 'Needs review',
  approved: 'Approved',
};

export function OnboardingBadge({ onboarding }: { onboarding?: OnboardingInfo }) {
  const status = onboarding?.status || 'not_shared';
  if (status === 'not_shared') return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        status === 'pending' && 'bg-sky-50 text-sky-700 ring-sky-200',
        status === 'submitted' && 'bg-amber-50 text-amber-700 ring-amber-200',
        status === 'approved' && 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      )}
      title={onboarding?.linkActive ? 'Onboarding link is open' : 'Onboarding link is closed'}
    >
      {onboarding?.linkActive ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
      {ONBOARDING_LABELS[status]}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Share / manage link                                                 */
/* ------------------------------------------------------------------ */

interface ShareProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType | null;
  onChanged?: () => void;
}

export function OnboardingLinkModal({ open, onOpenChange, user, onChanged }: ShareProps) {
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [info, setInfo] = useState<OnboardingInfo | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setInfo(null);
    setLoading(true);
    getDataHandlerWithToken(ApiConfig.getOnboarding(user._id), {}, null, true)
      .then((res: any) => setInfo(res.onboarding))
      .catch((e: any) => toast.error(errorMessage(e, 'Failed to load onboarding status')))
      .finally(() => setLoading(false));
  }, [open, user]);

  const link = info?.token ? `${window.location.origin}/onboarding/${info.token}` : '';

  const generate = async (opts: { regenerate?: boolean; sendEmail?: boolean }, key: string) => {
    if (!user) return;
    setBusy(key);
    try {
      const res: any = await postDataHandlerWithToken(
        ApiConfig.generateOnboardingLink(user._id),
        { ...opts, baseUrl: window.location.origin },
        true,
      );
      setInfo(res.onboarding);
      if (opts.sendEmail) {
        res.emailSent ? toast.success(`Link emailed to ${user.email}`) : toast.error('Link is active, but the email could not be sent');
      } else {
        toast.success(opts.regenerate ? 'New link generated — the old link no longer works' : 'Link is active');
      }
      onChanged?.();
    } catch (e: any) {
      toast.error(errorMessage(e, 'Failed to update link'));
    } finally {
      setBusy(null);
    }
  };

  const revoke = async () => {
    if (!user) return;
    setBusy('revoke');
    try {
      const res: any = await patchTokenDataHandler(ApiConfig.revokeOnboardingLink(user._id), null, true);
      setInfo(res.onboarding);
      toast.success('Link deactivated');
      onChanged?.();
    } catch (e: any) {
      toast.error(errorMessage(e, 'Failed to deactivate link'));
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy — select the link and copy it manually');
    }
  };

  const shareWhatsApp = () => {
    const text = `Hi ${user?.name}, please complete your employee profile here: ${link}`;
    window.open(`https://wa.me/91${user?.number}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  if (!user) return null;
  const status = info?.status || 'not_shared';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] rounded-2xl border-slate-200 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800">Onboarding link</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {user.name} opens this link, sees their registered details and fills in the rest. After they submit, the link locks until you re-open it.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-500">Status:</span>
                <OnboardingBadge onboarding={info || undefined} />
                {status === 'not_shared' && <span className="text-slate-600">Not shared yet</span>}
                {info?.submittedAt && (
                  <span className="text-xs text-slate-400">
                    Last submitted {new Date(info.submittedAt).toLocaleString()}
                  </span>
                )}
              </div>

              {!info?.token ? (
                <Button onClick={() => generate({}, 'generate')} disabled={!!busy} className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg">
                  {busy === 'generate' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                  Generate onboarding link
                </Button>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-500">Employee link</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={link} className={cn('h-9 text-xs font-mono', !info.linkActive && 'text-slate-400 line-through')} onFocus={(e) => e.target.select()} />
                      <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={copy} title="Copy link"><Copy className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => window.open(link, '_blank', 'noopener')} title="Open link"><ExternalLink className="h-4 w-4" /></Button>
                    </div>
                    {!info.linkActive && (
                      <p className="text-xs text-amber-700">
                        The link is closed. Re-open it so {user.name.split(' ')[0]} can add or update details with the same URL.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {info.linkActive ? (
                      <Button variant="outline" onClick={revoke} disabled={!!busy} className="rounded-lg text-red-600 hover:text-red-700">
                        {busy === 'revoke' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                        Deactivate link
                      </Button>
                    ) : (
                      <Button onClick={() => generate({}, 'reopen')} disabled={!!busy} className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white">
                        {busy === 'reopen' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unlock className="mr-2 h-4 w-4" />}
                        Re-open link
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => generate({ sendEmail: true }, 'email')} disabled={!!busy} className="rounded-lg">
                      {busy === 'email' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                      {info.linkActive ? 'Email link' : 'Re-open & email'}
                    </Button>
                    <Button variant="outline" onClick={shareWhatsApp} disabled={!!busy || !info.linkActive} className="rounded-lg">
                      Share on WhatsApp
                    </Button>
                    <Button variant="ghost" onClick={() => generate({ regenerate: true }, 'regen')} disabled={!!busy} className="rounded-lg text-slate-500">
                      {busy === 'regen' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                      New URL
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-100">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg border-slate-200">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Review & approve                                                    */
/* ------------------------------------------------------------------ */

interface ReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType | null;
  onChanged?: () => void;
}

const EMPTY_ADDRESS = { addressLine1: '', addressLine2: '', city: '', state: '', country: '', pincode: '' };
const EMPTY_BANK = { accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '', branchName: '', accountType: '' };
const EMPTY_DOCS = { aadhaarFront: '', aadhaarBack: '', panCard: '', educationalCertificates: [] as string[] };

export function OnboardingReviewModal({ open, onOpenChange, user, onChanged }: ReviewProps) {
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<'approve' | 'reopen' | null>(null);
  const [info, setInfo] = useState<OnboardingInfo | null>(null);
  const [tab, setTab] = useState('personal');
  const [activateUser, setActivateUser] = useState(true);
  const [form, setForm] = useState({
    profileImage: '',
    personalDetails: { ...EMPTY_PERSONAL_DETAILS } as PersonalDetails,
    address: { ...EMPTY_ADDRESS },
    bankDetails: { ...EMPTY_BANK },
    educationalDetails: [] as any[],
    documents: { ...EMPTY_DOCS },
  });

  useEffect(() => {
    if (!open || !user) return;
    setTab('personal');
    setActivateUser(user.status !== 'active');
    setLoading(true);
    getDataHandlerWithToken(ApiConfig.getOnboarding(user._id), {}, null, true)
      .then((res: any) => {
        setInfo(res.onboarding);
        const p = res.profile || {};
        setForm({
          profileImage: p.profileImage || '',
          personalDetails: toPersonalDetails(p.personalDetails),
          address: { ...EMPTY_ADDRESS, ...(p.address || {}) },
          bankDetails: { ...EMPTY_BANK, ...(p.bankDetails || {}) },
          educationalDetails: p.educationalDetails || [],
          documents: { ...EMPTY_DOCS, ...(p.documents || {}) },
        });
      })
      .catch((e: any) => toast.error(errorMessage(e, 'Failed to load submitted details')))
      .finally(() => setLoading(false));
  }, [open, user]);

  const approve = async () => {
    if (!user) return;
    const pdErr = validatePersonalDetails(form.personalDetails);
    if (pdErr) {
      setTab('personal');
      toast.error(pdErr);
      return;
    }
    setBusy('approve');
    try {
      const res: any = await patchTokenDataHandler(
        ApiConfig.approveOnboarding(user._id),
        {
          activateUser,
          ...(form.profileImage ? { profileImage: form.profileImage } : {}),
          personalDetails: form.personalDetails,
          address: form.address,
          bankDetails: form.bankDetails,
          educationalDetails: form.educationalDetails.map((d) => ({ ...d, passingYear: Number(d.passingYear) || undefined })),
          documents: form.documents,
        },
        true,
      );
      toast.success(res?.message || 'Onboarding approved');
      onChanged?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(errorMessage(e, 'Failed to approve'));
    } finally {
      setBusy(null);
    }
  };

  const reopen = async () => {
    if (!user) return;
    setBusy('reopen');
    try {
      const res: any = await postDataHandlerWithToken(ApiConfig.generateOnboardingLink(user._id), { baseUrl: window.location.origin }, true);
      setInfo(res.onboarding);
      try { await navigator.clipboard.writeText(`${window.location.origin}/onboarding/${res.onboarding.token}`); } catch { /* ignore */ }
      toast.success('Link re-opened and copied — send it back to the employee for corrections');
      onChanged?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(errorMessage(e, 'Failed to re-open link'));
    } finally {
      setBusy(null);
    }
  };

  if (!user) return null;
  const canApprove = info?.status === 'submitted';
  const disabled = !!busy || loading;
  const tabCls = 'data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg px-3 py-1.5 text-sm font-medium';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] rounded-2xl border-slate-200 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
            Review onboarding: {user.name}
            <OnboardingBadge onboarding={info || undefined} />
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Check what the employee submitted, fix anything that's wrong, then approve.
            {info?.submittedAt && <> Submitted {new Date(info.submittedAt).toLocaleString()}.</>}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
          ) : (
            <>
              {!canApprove && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {info?.status === 'approved'
                    ? 'This onboarding is already approved. Use Edit User to change details, or re-open the link for the employee.'
                    : 'The employee has not submitted the form yet.'}
                </div>
              )}
              {form.profileImage && (
                <div className="mb-4 flex items-center gap-3">
                  <img src={form.profileImage} alt="" className="h-14 w-14 rounded-full object-cover border border-slate-200" />
                  <span className="text-sm text-slate-500">Profile photo</span>
                </div>
              )}
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent border-b border-slate-200 pb-2 mb-4">
                  <TabsTrigger value="personal" className={tabCls}>Personal</TabsTrigger>
                  <TabsTrigger value="address" className={tabCls}>Address</TabsTrigger>
                  <TabsTrigger value="bank" className={tabCls}>Bank</TabsTrigger>
                  <TabsTrigger value="education" className={tabCls}>Education</TabsTrigger>
                  <TabsTrigger value="documents" className={tabCls}>Documents</TabsTrigger>
                </TabsList>
                <TabsContent value="personal">
                  <PersonalDetailsForm value={form.personalDetails} onChange={(personalDetails) => setForm({ ...form, personalDetails })} disabled={disabled} />
                </TabsContent>
                <TabsContent value="address">
                  <AddressForm value={form.address} onChange={(address) => setForm({ ...form, address })} disabled={disabled} />
                </TabsContent>
                <TabsContent value="bank">
                  <BankDetailsForm value={form.bankDetails} onChange={(bankDetails) => setForm({ ...form, bankDetails })} disabled={disabled} />
                </TabsContent>
                <TabsContent value="education">
                  <EducationalDetailsForm value={form.educationalDetails} onChange={(educationalDetails) => setForm({ ...form, educationalDetails })} disabled={disabled} />
                </TabsContent>
                <TabsContent value="documents">
                  <DocumentsUpload value={form.documents} onChange={(documents) => setForm({ ...form, documents })} disabled={disabled} />
                </TabsContent>
              </Tabs>

              {!user.isDashboardEnabled && (
                <p className="mt-4 text-xs text-slate-500">
                  Note: dashboard access isn't enabled yet. After approving, use <strong>View Profile → Create Profile</strong> to assign department, reporting senior, pools and permissions.
                </p>
              )}
            </>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="activate-user" checked={activateUser} onCheckedChange={(v) => setActivateUser(v === true)} disabled={disabled || !canApprove} />
              <Label htmlFor="activate-user" className="text-sm font-normal text-slate-600">Set employee status to Active</Label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reopen} disabled={disabled} className="rounded-lg border-slate-200">
                {busy === 'reopen' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unlock className="mr-2 h-4 w-4" />}
                Re-open for employee
              </Button>
              <Button onClick={approve} disabled={disabled || !canApprove} className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white">
                {busy === 'approve' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Save & approve
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
