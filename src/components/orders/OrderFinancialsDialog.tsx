import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  History,
  Landmark,
  Loader2,
  Pencil,
  Repeat,
  RotateCcw,
  Wallet,
  Clock3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import ApiConfig from '@/config/apiConfig';
import { getDataHandlerWithToken, patchTokenDataHandler, postDataHandlerWithToken } from '@/config/services';
import { hasPermission } from '@/utils/permissions';
import {
  COVERAGE_LABEL,
  CREDIT_STATUS_BADGE,
  CreditEntry,
  LUMPSUM_PAYMENT_MODES,
  OrderFinancials,
  PAYMENT_MODE_BADGE,
  PaymentSourcesDraft,
  buildPaymentSourcesPayload,
  draftFromOrder,
  draftReasonTriggers,
  extractApiError,
  formatDateShort,
  formatINR,
  successfulSubscriptionAmount,
  toMoney,
  todayInput,
  validateDraft,
} from '@/lib/orderPayments';
import { LoanPartnerOption, PaymentSourcesEditor } from './PaymentSourcesEditor';

export type PaymentLinkTarget =
  | { type: 'credit'; creditId: string; amount: number }
  | { type: 'lumpsum'; lumpsumEntryId?: string; amount: number };

interface OrderFinancialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
  studentName?: string;
  permissions: any[];
  loanPartners: LoanPartnerOption[];
  loadingLoanPartners?: boolean;
  /** Called after any successful change so the order list can refresh. */
  onChanged?: () => void;
  /** Opens the page's payment-link flow for a credit or lumpsum balance. */
  onCollectViaLink?: (target: PaymentLinkTarget) => void;
}

const Stat = ({ label, value, tone }: { label: string; value: string; tone?: string }) => (
  <div className="rounded-xl border border-slate-100 bg-white p-3">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className={cn('mt-0.5 text-lg font-bold text-slate-800', tone)}>{value}</p>
  </div>
);

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between gap-3 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="text-right font-medium text-slate-800">{value}</span>
  </div>
);

export function OrderFinancialsDialog({
  open,
  onOpenChange,
  orderId,
  studentName,
  permissions,
  loanPartners,
  loadingLoanPartners,
  onChanged,
  onCollectViaLink,
}: OrderFinancialsDialogProps) {
  const [data, setData] = useState<OrderFinancials | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('overview');

  // edit mode
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PaymentSourcesDraft | null>(null);
  const [draftFinalFee, setDraftFinalFee] = useState(0);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  // credit actions
  const [payCredit, setPayCredit] = useState<CreditEntry | null>(null);
  const [payForm, setPayForm] = useState({ paymentReferenceId: '', paymentDate: todayInput(), paymentMode: 'UPI', remarks: '' });
  const [revertCredit, setRevertCredit] = useState<CreditEntry | null>(null);
  const [revertReason, setRevertReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const can = (action: string) => hasPermission(permissions, 'orders', action);
  const canEdit = !!data && can('update') && (!data.approved || can('approve'));

  const load = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const res = await getDataHandlerWithToken(ApiConfig.getOrderFinancials(orderId), null, null, true);
      setData(res?.data && res?.orderId === undefined ? res.data : res);
    } catch (error) {
      toast({ title: 'Error', description: extractApiError(error, 'Failed to load payments').message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (open && orderId) {
      setTab('overview');
      setEditing(false);
      setServerErrors([]);
      load();
    }
    if (!open) setData(null);
  }, [open, orderId, load]);

  const startEdit = () => {
    if (!data) return;
    setDraft(draftFromOrder(data));
    setDraftFinalFee(toMoney(data.finalFee));
    setReason('');
    setServerErrors([]);
    setEditing(true);
  };

  const clientErrors = useMemo(() => (draft ? validateDraft(draft, draftFinalFee) : []), [draft, draftFinalFee]);
  const reasonTriggers = useMemo(() => (draft ? draftReasonTriggers(draft, data || undefined) : []), [draft, data]);
  const needsReason = reasonTriggers.length > 0;

  const saveEdit = async () => {
    if (!data || !draft) return;
    if (clientErrors.length) {
      setServerErrors([]);
      toast({ title: 'Fix the payment structure', description: clientErrors[0], variant: 'destructive' });
      return;
    }
    if (needsReason && !reason.trim()) {
      toast({ title: 'Reason required', description: `A reason is required because ${reasonTriggers.join(', ')}.`, variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      setServerErrors([]);
      const body: Record<string, any> = { ...buildPaymentSourcesPayload(draft) };
      if (toMoney(draftFinalFee) !== toMoney(data.finalFee)) body.finalFee = toMoney(draftFinalFee);
      if (reason.trim()) body.reason = reason.trim();
      await patchTokenDataHandler(ApiConfig.updateOrderFinancials(data.orderId), body, true);
      toast({ title: 'Saved', description: 'Payment sources updated' });
      setEditing(false);
      await load();
      onChanged?.();
    } catch (error) {
      const { message, errors } = extractApiError(error, 'Failed to update payment sources');
      setServerErrors(errors.length ? errors : [message]);
      toast({ title: 'Not saved', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openPay = (credit: CreditEntry) => {
    setPayCredit(credit);
    setPayForm({ paymentReferenceId: '', paymentDate: todayInput(), paymentMode: 'UPI', remarks: '' });
  };

  const submitPay = async () => {
    if (!data || !payCredit) return;
    if (!payForm.paymentReferenceId.trim()) {
      toast({ title: 'Reference required', description: 'Enter the verified bank / UPI / gateway reference', variant: 'destructive' });
      return;
    }
    try {
      setActionLoading(true);
      await postDataHandlerWithToken(
        ApiConfig.markCreditPaid(data.orderId, payCredit._id),
        {
          paymentReferenceId: payForm.paymentReferenceId.trim(),
          amount: toMoney(payCredit.amount),
          ...(payForm.paymentDate ? { paymentDate: payForm.paymentDate } : {}),
          ...(payForm.paymentMode ? { paymentMode: payForm.paymentMode } : {}),
          ...(payForm.remarks.trim() ? { remarks: payForm.remarks.trim() } : {}),
        },
        true,
      );
      toast({ title: 'Credit paid', description: `${formatINR(payCredit.amount)} recorded` });
      setPayCredit(null);
      await load();
      onChanged?.();
    } catch (error) {
      toast({ title: 'Error', description: extractApiError(error, 'Failed to record payment').message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const submitRevert = async () => {
    if (!data || !revertCredit) return;
    if (!revertReason.trim()) {
      toast({ title: 'Reason required', variant: 'destructive' });
      return;
    }
    try {
      setActionLoading(true);
      await postDataHandlerWithToken(ApiConfig.revertCreditPayment(data.orderId, revertCredit._id), { reason: revertReason.trim() }, true);
      toast({ title: 'Payment reverted', description: 'The credit is unpaid again' });
      setRevertCredit(null);
      setRevertReason('');
      await load();
      onChanged?.();
    } catch (error) {
      toast({ title: 'Error', description: extractApiError(error, 'Failed to revert payment').message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const summary = data?.summary;
  const coverage = data?.coverage;
  // Report revenue: loans count with the disbursed amount.
  const revenue = data?.revenue;
  // Received on the order: loans count with the loan amount (older backends: fall back to revenue).
  const received = data?.received ?? revenue;
  const lumpsumOutstanding = useMemo(
    () =>
      toMoney(
        (data?.lumpsumPayments || [])
          .filter((e) => !['Failed', 'Refunded'].includes(e.status))
          .reduce((s, e) => s + Math.max(0, toMoney(e.amount) - toMoney(e.amountReceived)), 0),
      ),
    [data],
  );
  const canLink = !!data?.approved && can('payment_link_generator') && data?.status !== 'Fully Paid' && !!onCollectViaLink;

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 text-xl">
              Payments &amp; Credits
              {data?.paymentModes?.map((m) => (
                <span key={m} className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium', PAYMENT_MODE_BADGE[m] || PAYMENT_MODE_BADGE.Mixed)}>
                  {m}
                </span>
              ))}
            </DialogTitle>
            <DialogDescription>
              {studentName ? `${studentName} · ` : ''}
              {data ? `Order ${data.orderId.slice(-8)} · ${data.status || ''}${data.approved ? ' · Approved' : ' · Not approved'}` : 'Loading…'}
            </DialogDescription>
          </DialogHeader>

          {loading && !data ? (
            <div className="py-16 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-400" />
            </div>
          ) : !data ? null : editing && draft ? (
            <div className="space-y-4">
              {data.approved && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  This order is approved. Every change is written to the audit log.
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Final fee</Label>
                  <Input
                    type="number"
                    min={0}
                    className="mt-1 h-9 rounded-lg"
                    value={draftFinalFee}
                    onChange={(e) => setDraftFinalFee(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Reason {needsReason ? '*' : '(recorded in the audit log)'}
                  </Label>
                  <Input className="mt-1 h-9 rounded-lg" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is the payment structure changing?" />
                </div>
              </div>
              <PaymentSourcesEditor
                value={draft}
                onChange={(next) => {
                  setDraft(next);
                  if (serverErrors.length) setServerErrors([]);
                }}
                finalFee={draftFinalFee}
                loanPartners={loanPartners}
                loadingLoanPartners={loadingLoanPartners}
                disabled={saving}
                serverErrors={serverErrors}
                canRevertPayments={can('revert_payment')}
              />
            </div>
          ) : (
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="flex-wrap">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sources">Payment sources</TabsTrigger>
                <TabsTrigger value="credits">
                  Credits{data.credits?.length ? ` (${data.credits.length})` : ''}
                </TabsTrigger>
                <TabsTrigger value="audit">Audit log</TabsTrigger>
              </TabsList>

              {/* OVERVIEW */}
              <TabsContent value="overview" className="space-y-4">
                {!data.migrated && (
                  <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    This is a legacy order. It is shown in the new format and is converted when its payments are next changed or
                    when it is approved.
                  </div>
                )}
                {!!data.validationErrors?.length && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <p className="mb-1 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5" /> This order does not balance yet
                      {!data.approved && ' and cannot be approved'}:
                    </p>
                    <ul className="list-disc space-y-0.5 pl-5">
                      {data.validationErrors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Stat label="Final fee" value={formatINR(data.finalFee)} />
                  <Stat label="Received" value={formatINR(received?.total)} tone="text-emerald-600" />
                  <Stat label="Outstanding" value={formatINR(summary?.outstandingAmount ?? Math.max(0, toMoney(data.finalFee) - toMoney(received?.total)))} tone="text-orange-600" />
                  <Stat
                    label="Pending credits"
                    value={`${formatINR(summary?.pendingCreditAmount)}${summary?.pendingCreditCount ? ` · ${summary.pendingCreditCount}` : ''}`}
                    tone={summary?.pendingCreditAmount ? 'text-amber-600' : undefined}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2 rounded-xl border border-slate-100 p-4">
                    <p className="text-sm font-semibold text-slate-800">Planned coverage</p>
                    <Row label="Lumpsum" value={formatINR(coverage?.plannedLumpsumAmount)} />
                    <Row label="Loans" value={formatINR(coverage?.plannedLoanAmount)} />
                    <Row label="Subscriptions" value={formatINR(coverage?.plannedSubscriptionAmount)} />
                    <Row label="Credits" value={formatINR(coverage?.totalCredits)} />
                    <div className="border-t border-slate-100 pt-2">
                      <Row
                        label="Not covered"
                        value={
                          <span className={Math.abs(toMoney(coverage?.unallocatedAmount)) <= 0.01 ? 'text-emerald-600' : 'text-amber-600'}>
                            {formatINR(coverage?.unallocatedAmount)}
                            {summary?.coverageStatus && ` · ${COVERAGE_LABEL[summary.coverageStatus]}`}
                          </span>
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2 rounded-xl border border-slate-100 p-4">
                    <p className="text-sm font-semibold text-slate-800">Received on this order</p>
                    <Row label="Lumpsum received" value={formatINR(received?.lumpsum)} />
                    <Row label="Loans (loan amount)" value={formatINR(received?.loan)} />
                    <Row label="Subscription installments" value={formatINR(received?.subscription)} />
                    <Row label="Credits paid" value={formatINR(received?.credit)} />
                    <div className="border-t border-slate-100 pt-2">
                      <Row label="Total" value={<span className="text-emerald-600">{formatINR(received?.total)}</span>} />
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                      Revenue in reports: <strong className="text-slate-700">{formatINR(revenue?.total)}</strong>
                      {data.loans.length > 0 && <> (loans count with the disbursed {formatINR(revenue?.loan)})</>}
                    </div>
                  </div>
                </div>
                {canLink && lumpsumOutstanding > 0 && (
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => onCollectViaLink?.({ type: 'lumpsum', amount: lumpsumOutstanding })}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Payment link for lumpsum balance ({formatINR(lumpsumOutstanding)})
                  </Button>
                )}
              </TabsContent>

              {/* SOURCES */}
              <TabsContent value="sources" className="space-y-5">
                <section className="space-y-2">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Wallet className="h-4 w-4 text-slate-500" /> Lumpsum payments
                  </h4>
                  {data.lumpsumPayments.length === 0 ? (
                    <p className="text-xs text-slate-400">None</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                          <tr>
                            <th className="px-3 py-2 text-left">Registration amount</th>
                            <th className="px-3 py-2 text-left">Amount received</th>
                            <th className="px-3 py-2 text-left">Mode</th>
                            <th className="px-3 py-2 text-left">Date</th>
                            <th className="px-3 py-2 text-left">Remarks</th>
                            <th className="px-3 py-2 text-right" />
                          </tr>
                        </thead>
                        <tbody>
                          {data.lumpsumPayments.map((e) => {
                            const due = Math.max(0, toMoney(e.amount) - toMoney(e.amountReceived));
                            return (
                              <tr key={e._id} className="border-t border-slate-100">
                                <td className="px-3 py-2">{formatINR(e.registrationAmount)}</td>
                                <td className="px-3 py-2 font-medium text-emerald-700">
                                  {formatINR(e.amountReceived)}
                                  {['Failed', 'Refunded'].includes(e.status) && (
                                    <span className="ml-1 text-[11px] font-normal text-slate-500">({e.status})</span>
                                  )}
                                  {due > 0 && (
                                    <span className="block text-[11px] font-normal text-slate-500">
                                      Older entry planned for {formatINR(e.amount)} · {formatINR(due)} due
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-xs text-slate-600">{e.paymentMode || '—'}</td>
                                <td className="px-3 py-2 text-xs">{formatDateShort(e.paymentDate)}</td>
                                <td className="max-w-[220px] truncate px-3 py-2 text-xs text-slate-500">{e.remarks || '—'}</td>
                                <td className="px-3 py-2 text-right">
                                  {canLink && due > 0 && !['Failed', 'Refunded'].includes(e.status) && (
                                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                                      onClick={() => onCollectViaLink?.({ type: 'lumpsum', lumpsumEntryId: e._id, amount: due })}>
                                      <CreditCard className="mr-1 h-3.5 w-3.5" /> Link {formatINR(due)}
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="space-y-2">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Landmark className="h-4 w-4 text-slate-500" /> Loans
                  </h4>
                  {data.loans.length === 0 ? (
                    <p className="text-xs text-slate-400">None</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                          <tr>
                            <th className="px-3 py-2 text-left">Partner</th>
                            <th className="px-3 py-2 text-left">Loan amount (received)</th>
                            <th className="px-3 py-2 text-left">Disbursed (revenue)</th>
                            <th className="px-3 py-2 text-left">First EMI</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.loans.map((e) => (
                            <tr key={e._id} className="border-t border-slate-100">
                              <td className="px-3 py-2">{typeof e.loanPartner === 'object' ? e.loanPartner?.name : loanPartners.find((p) => p._id === e.loanPartner)?.name || '—'}</td>
                              <td className="px-3 py-2 text-emerald-700">
                                {formatINR(e.loanAmount)}
                                {e.disbursementStatus === 'Cancelled' && (
                                  <span className="ml-1 text-[11px] text-slate-500">(Cancelled)</span>
                                )}
                              </td>
                              <td className="px-3 py-2">{formatINR(e.disbursementAmount)}</td>
                              <td className="px-3 py-2 text-xs">{formatDateShort(e.firstEmiDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="space-y-2">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Repeat className="h-4 w-4 text-slate-500" /> Subscriptions
                  </h4>
                  {data.subscriptions.length === 0 ? (
                    <p className="text-xs text-slate-400">None</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                          <tr>
                            <th className="px-3 py-2 text-left">Plan</th>
                            <th className="px-3 py-2 text-left">Total</th>
                            <th className="px-3 py-2 text-left">Received</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-left">Dates</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.subscriptions.map((e) => (
                            <Fragment key={e._id}>
                            <tr className="border-t border-slate-100">
                              <td className="px-3 py-2">
                                {formatINR(e.installmentAmount)} × {e.numberOfInstallments}
                              </td>
                              <td className="px-3 py-2">{formatINR(toMoney(e.installmentAmount) * (Number(e.numberOfInstallments) || 0))}</td>
                              <td className="px-3 py-2 text-emerald-700">
                                {formatINR(successfulSubscriptionAmount(e))}
                                <span className="block text-[11px] text-slate-500">
                                  {(e.paymentHistory || []).filter((p) => p.status === 'SUCCESS').length} of {e.numberOfInstallments} paid
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs">{e.status || (e.cashfreeSubscriptionId ? 'Linked' : 'Not linked')}</td>
                              <td className="px-3 py-2 text-xs">
                                {formatDateShort(e.firstInstallmentDate)} → {formatDateShort(e.lastInstallmentDate)}
                              </td>
                            </tr>
                            {(e.paymentHistory || []).length > 0 && (
                              <tr className="bg-slate-50/50">
                                <td colSpan={5} className="px-3 pb-3 pt-1">
                                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Installments received (recorded by the Cashfree webhook)
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {[...(e.paymentHistory || [])]
                                      .sort((a, b) => new Date(a.paidAt || 0).getTime() - new Date(b.paidAt || 0).getTime())
                                      .map((p, i) => (
                                        <span
                                          key={p.gatewayPaymentId || i}
                                          title={p.gatewayPaymentId ? `Payment ${p.gatewayPaymentId}` : undefined}
                                          className={cn(
                                            'rounded-lg border px-2 py-1 text-[11px]',
                                            p.status === 'SUCCESS'
                                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                              : 'border-red-200 bg-red-50 text-red-700',
                                          )}
                                        >
                                          #{p.installmentNo ?? i + 1} · {formatINR(p.amount)} · {formatDateShort(p.paidAt)}
                                          {p.status !== 'SUCCESS' ? ` · ${p.status}` : ''}
                                        </span>
                                      ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </TabsContent>

              {/* CREDITS */}
              <TabsContent value="credits" className="space-y-3">
                {data.credits.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-400">
                    <Clock3 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    No credits on this order
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left">Amount</th>
                          <th className="px-3 py-2 text-left">Due date</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Payment</th>
                          <th className="px-3 py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.credits.map((c) => (
                          <tr key={c._id} className="border-t border-slate-100 align-top">
                            <td className="px-3 py-2 font-medium">{formatINR(c.amount)}</td>
                            <td className="px-3 py-2">{formatDateShort(c.dueDate)}</td>
                            <td className="px-3 py-2">
                              <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium', CREDIT_STATUS_BADGE[c.status])}>{c.status}</span>
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-600">
                              {c.status === 'Paid' ? (
                                <>
                                  <span className="font-mono">{c.paymentReferenceId}</span>
                                  <span className="block">
                                    {formatDateShort(c.paymentDate)}
                                    {c.paymentMode ? ` · ${c.paymentMode}` : ''}
                                    {c.paidVia ? ` · ${c.paidVia === 'GATEWAY' ? 'Payment link' : c.paidVia === 'MANUAL' ? 'Manual' : c.paidVia}` : ''}
                                  </span>
                                </>
                              ) : (
                                c.remarks || '—'
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex justify-end gap-1">
                                {c.status !== 'Paid' && data.approved && can('record_payment') && (
                                  <Button size="sm" variant="outline" className="h-7 rounded-lg px-2 text-xs" onClick={() => openPay(c)}>
                                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark paid
                                  </Button>
                                )}
                                {c.status !== 'Paid' && canLink && (
                                  <Button size="sm" variant="outline" className="h-7 rounded-lg px-2 text-xs"
                                    onClick={() => onCollectViaLink?.({ type: 'credit', creditId: c._id, amount: toMoney(c.amount) })}>
                                    <CreditCard className="mr-1 h-3.5 w-3.5" /> Payment link
                                  </Button>
                                )}
                                {c.status === 'Paid' && can('revert_payment') && (
                                  <Button size="sm" variant="ghost" className="h-7 rounded-lg px-2 text-xs text-red-600 hover:text-red-700"
                                    onClick={() => { setRevertCredit(c); setRevertReason(''); }}>
                                    <RotateCcw className="mr-1 h-3.5 w-3.5" /> Revert
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {!data.approved && data.credits.some((c) => c.status !== 'Paid') && (
                  <p className="text-xs text-slate-500">Credits can be collected once the order is approved.</p>
                )}
              </TabsContent>

              {/* AUDIT */}
              <TabsContent value="audit">
                {data.financialAuditLog.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-400">
                    <History className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    No financial changes recorded yet
                  </div>
                ) : (
                  <ol className="space-y-2">
                    {[...data.financialAuditLog].reverse().map((a, i) => (
                      <li key={i} className="rounded-xl border border-slate-100 p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-slate-800">
                            {a.action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (s) => s.toUpperCase())}
                            {a.entryType ? <span className="ml-1 text-xs text-slate-500">· {a.entryType}</span> : null}
                          </span>
                          <span className="text-xs text-slate-500">
                            {a.performedAt ? new Date(a.performedAt).toLocaleString('en-IN') : ''}
                            {a.source ? ` · ${a.source}` : ''}
                            {typeof a.performedBy === 'object' && a.performedBy?.name ? ` · ${a.performedBy.name}` : ''}
                          </span>
                        </div>
                        {a.reason && <p className="mt-1 text-xs text-slate-600">Reason: {a.reason}</p>}
                      </li>
                    ))}
                  </ol>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="gap-2 border-t border-slate-100 pt-4">
            {editing ? (
              <>
                <Button variant="outline" className="rounded-xl" disabled={saving} onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button className="rounded-xl bg-orange-600 hover:bg-orange-700" disabled={saving} onClick={saveEdit}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save payment sources
                </Button>
              </>
            ) : (
              <>
                {canEdit && (
                  <Button variant="outline" className="rounded-xl" onClick={startEdit} disabled={loading}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit payment sources
                  </Button>
                )}
                <Button className="rounded-xl" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark credit paid */}
      <Dialog open={!!payCredit} onOpenChange={(o) => !o && !actionLoading && setPayCredit(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Mark credit paid</DialogTitle>
            <DialogDescription>
              {payCredit && `${formatINR(payCredit.amount)} due ${formatDateShort(payCredit.dueDate)}. Use the reference of a payment you have verified.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold uppercase text-slate-500">Payment reference *</Label>
              <Input className="mt-1 rounded-lg" value={payForm.paymentReferenceId} placeholder="Bank / UPI / gateway reference"
                onChange={(e) => setPayForm({ ...payForm, paymentReferenceId: e.target.value })} />
              <p className="mt-1 text-[11px] text-slate-500">A reference can be used only once across all orders.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold uppercase text-slate-500">Amount</Label>
                <Input className="mt-1 rounded-lg" value={payCredit ? formatINR(payCredit.amount) : ''} disabled />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-slate-500">Payment date</Label>
                <Input type="date" className="mt-1 rounded-lg" value={payForm.paymentDate}
                  onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase text-slate-500">Mode</Label>
              <Select value={payForm.paymentMode} onValueChange={(v) => setPayForm({ ...payForm, paymentMode: v })}>
                <SelectTrigger className="mt-1 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LUMPSUM_PAYMENT_MODES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase text-slate-500">Remarks</Label>
              <Textarea rows={2} className="mt-1 rounded-lg" value={payForm.remarks}
                onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" disabled={actionLoading} onClick={() => setPayCredit(null)}>
              Cancel
            </Button>
            <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700" disabled={actionLoading} onClick={submitPay}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revert credit */}
      <Dialog open={!!revertCredit} onOpenChange={(o) => !o && !actionLoading && setRevertCredit(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Revert credit payment</DialogTitle>
            <DialogDescription>
              {revertCredit &&
                `${formatINR(revertCredit.amount)} paid with ${revertCredit.paymentReferenceId}. The credit becomes unpaid again; the history is kept and the reference can be reused.`}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-xs font-semibold uppercase text-slate-500">Reason *</Label>
            <Textarea rows={3} className="mt-1 rounded-lg" value={revertReason} onChange={(e) => setRevertReason(e.target.value)} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" disabled={actionLoading} onClick={() => setRevertCredit(null)}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-xl" disabled={actionLoading || !revertReason.trim()} onClick={submitRevert}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Revert payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default OrderFinancialsDialog;
