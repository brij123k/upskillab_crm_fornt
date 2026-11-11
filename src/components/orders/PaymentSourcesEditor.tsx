import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Landmark, Lock, Plus, Repeat, Trash2, Wallet, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  COVERAGE_LABEL,
  CreditDraft,
  LoanDraft,
  LUMPSUM_PAYMENT_MODES,
  LumpsumDraft,
  PaymentSourcesDraft,
  SubscriptionDraft,
  calculateDraftCoverage,
  formatINR,
  deriveLoanStatus,
  isCreditPaid,
  isLoanCancelled,
  isLoanDisbursed,
  isLumpsumInactive,
  isLumpsumReceived,
  isSubscriptionPlanLocked,
  newCreditDraft,
  newLoanDraft,
  newLumpsumDraft,
  newSubscriptionDraft,
  successfulSubscriptionAmount,
  withRegistrationAmount,
  toMoney,
} from '@/lib/orderPayments';

export interface LoanPartnerOption {
  _id: string;
  name: string;
  type?: string;
  submissionCharge?: number;
  isActive?: boolean;
}

interface PaymentSourcesEditorProps {
  value: PaymentSourcesDraft;
  onChange: (next: PaymentSourcesDraft) => void;
  finalFee: number;
  loanPartners: LoanPartnerOption[];
  loadingLoanPartners?: boolean;
  disabled?: boolean;
  /** Errors returned by the API (400 errors[]), shown above the editor. */
  serverErrors?: string[];
  /**
   * Holder of orders:revert_payment. Allows reducing or removing a saved
   * registration amount and changing its date or mode (a reason is required).
   */
  canRevertPayments?: boolean;
}

const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const fieldLabel = 'text-[11px] font-semibold text-slate-500 uppercase tracking-wide';
const inputCls = 'mt-1 h-9 rounded-lg border-slate-200';

function SectionHeader({
  icon: Icon,
  title,
  hint,
  onAdd,
  addLabel,
  disabled,
}: {
  icon: any;
  title: string;
  hint: string;
  onAdd: () => void;
  addLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 rounded-lg bg-slate-100 p-1.5">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
          <p className="text-xs text-slate-500">{hint}</p>
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onAdd} disabled={disabled} className="h-8 shrink-0 rounded-lg">
        <Plus className="mr-1 h-3.5 w-3.5" />
        {addLabel}
      </Button>
    </div>
  );
}

function EntryShell({
  title,
  badge,
  onRemove,
  removeDisabledReason,
  disabled,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  onRemove: () => void;
  removeDisabledReason?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          {title}
          {badge}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={disabled || !!removeDisabledReason}
          title={removeDisabledReason || 'Remove'}
          className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
        >
          {removeDisabledReason ? <Lock className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
        </Button>
      </div>
      {children}
    </div>
  );
}

const Pill = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium', className)}>{children}</span>
);

export function PaymentSourcesEditor({
  value,
  onChange,
  finalFee,
  loanPartners,
  loadingLoanPartners,
  disabled,
  serverErrors,
  canRevertPayments = false,
}: PaymentSourcesEditorProps) {
  const coverage = useMemo(() => calculateDraftCoverage(value, finalFee), [value, finalFee]);

  const update = <K extends keyof PaymentSourcesDraft>(key: K, list: PaymentSourcesDraft[K]) => onChange({ ...value, [key]: list });

  const patchLumpsum = (key: string, patch: Partial<LumpsumDraft>) =>
    update('lumpsumPayments', value.lumpsumPayments.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  const patchLoan = (key: string, patch: Partial<LoanDraft>) =>
    update('loans', value.loans.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  const patchSubscription = (key: string, patch: Partial<SubscriptionDraft>) =>
    update('subscriptions', value.subscriptions.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  const patchCredit = (key: string, patch: Partial<CreditDraft>) =>
    update('credits', value.credits.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  // Suggest the uncovered amount for a new entry, never a negative one.
  const uncovered = Math.max(0, toMoney(coverage.unallocatedAmount));
  const remainingForSources = Math.max(0, toMoney(coverage.finalFee - coverage.plannedPaymentCoverage - coverage.totalCredits));

  const activePartners = loanPartners.filter((p) => p.isActive !== false);

  const statusTone =
    coverage.coverageStatus === 'BALANCED'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-amber-200 bg-amber-50 text-amber-800';

  return (
    <div className="space-y-5">
      {/* Live balance */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className={fieldLabel}>Final fee</p>
            <p className="mt-0.5 text-lg font-bold text-slate-800">{formatINR(coverage.finalFee)}</p>
          </div>
          <div>
            <p className={fieldLabel}>Payment sources</p>
            <p className="mt-0.5 text-lg font-semibold text-slate-800">{formatINR(coverage.plannedPaymentCoverage)}</p>
          </div>
          <div>
            <p className={fieldLabel}>Credits</p>
            <p className="mt-0.5 text-lg font-semibold text-slate-800">{formatINR(coverage.totalCredits)}</p>
          </div>
          <div>
            <p className={fieldLabel}>Not covered</p>
            <p
              className={cn(
                'mt-0.5 text-lg font-semibold',
                Math.abs(coverage.unallocatedAmount) <= 0.01 ? 'text-emerald-600' : 'text-amber-600',
              )}
            >
              {formatINR(coverage.unallocatedAmount)}
            </p>
          </div>
        </div>
        <div className={cn('mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs', statusTone)}>
          {coverage.coverageStatus === 'BALANCED' ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          <span>
            <strong>{COVERAGE_LABEL[coverage.coverageStatus]}.</strong>{' '}
            Lumpsum + loans + subscriptions + credits must equal the final fee exactly. Amounts are never adjusted
            automatically.
            {coverage.plannedPaymentCoverage - coverage.finalFee > 0.01 &&
              ' Payment sources are higher than the final fee; reduce them.'}
            {coverage.remainingAmount <= 0.01 && value.credits.length > 0 && ' Sources already cover the fee, so remove the credits.'}
          </span>
        </div>
      </div>

      {!!serverErrors?.length && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <p className="mb-1 font-semibold">The server rejected the payment structure:</p>
          <ul className="list-disc space-y-0.5 pl-4">
            {serverErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Lumpsum */}
      <div className="space-y-3">
        <SectionHeader
          icon={Wallet}
          title="Lumpsum payments"
          hint="The registration amount is added to the amount received. Update the amount received when more is paid."
          addLabel="Add lumpsum"
          disabled={disabled}
          onAdd={() => update('lumpsumPayments', [...value.lumpsumPayments, newLumpsumDraft(remainingForSources)])}
        />
        {value.lumpsumPayments.map((d, i) => {
          const received = !!d.orig && isLumpsumReceived(d);
          const inactive = isLumpsumInactive(d);
          const locked = received && !canRevertPayments;
          const reduced = !!d.orig && toMoney(d.amountReceived) < toMoney(d.orig.amountReceived);
          const olderPlan = !!d.orig && toMoney(d.orig.amount) - toMoney(d.orig.amountReceived) > 0.01;
          return (
            <EntryShell
              key={d.key}
              title={`Lumpsum #${i + 1}`}
              badge={
                d.orig ? (
                  inactive ? <Pill className="border-slate-200 bg-white text-slate-600">{d.orig.status}</Pill> : null
                ) : (
                  <Pill className="border-orange-200 bg-orange-50 text-orange-700">New</Pill>
                )
              }
              disabled={disabled}
              removeDisabledReason={
                locked ? 'Money was received on this payment. Removing it needs the Revert Payment permission.' : undefined
              }
              onRemove={() => update('lumpsumPayments', value.lumpsumPayments.filter((x) => x.key !== d.key))}
            >
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div>
                  <Label className={fieldLabel}>Registration amount *</Label>
                  <Input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={d.registrationAmount}
                    disabled={disabled || inactive}
                    onChange={(e) =>
                      update(
                        'lumpsumPayments',
                        value.lumpsumPayments.map((x) => (x.key === d.key ? withRegistrationAmount(x, num(e.target.value)) : x)),
                      )
                    }
                  />
                </div>
                <div>
                  <Label className={fieldLabel}>Amount received *</Label>
                  <Input
                    type="number"
                    min={Math.max(toMoney(d.registrationAmount), locked ? toMoney(d.orig?.amountReceived) : 0)}
                    className={cn(inputCls, 'font-semibold text-emerald-700')}
                    value={d.amountReceived}
                    disabled={disabled || inactive}
                    onChange={(e) => patchLumpsum(d.key, { amountReceived: num(e.target.value) })}
                  />
                  {toMoney(d.amountReceived) > toMoney(d.registrationAmount) && (
                    <p className="mt-1 text-[10px] text-slate-500">
                      {formatINR(d.registrationAmount)} registration + {formatINR(toMoney(d.amountReceived) - toMoney(d.registrationAmount))} Recieved
                    </p>
                  )}
                </div>
                <div>
                  <Label className={fieldLabel}>Payment date</Label>
                  <Input type="date" className={inputCls} value={d.paymentDate} disabled={disabled || locked || inactive}
                    onChange={(e) => patchLumpsum(d.key, { paymentDate: e.target.value })} />
                </div>
                <div>
                  <Label className={fieldLabel}>Mode</Label>
                  <Select value={d.paymentMode || undefined} disabled={disabled || locked || inactive}
                    onValueChange={(v) => patchLumpsum(d.key, { paymentMode: v })}>
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {Array.from(new Set([...LUMPSUM_PAYMENT_MODES, ...(d.paymentMode ? [d.paymentMode] : [])])).map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 md:col-span-4">
                  <Label className={fieldLabel}>Remarks</Label>
                  <Input className={inputCls} value={d.remarks} disabled={disabled}
                    onChange={(e) => patchLumpsum(d.key, { remarks: e.target.value })} />
                </div>
              </div>
              {locked && (
                <p className="mt-2 text-[11px] text-slate-500">
                  Saved with {formatINR(d.orig!.amountReceived)} received. The amount received can only be increased (needs the Record
                  Payment permission); reducing it or changing the date or mode needs the Revert Payment permission.
                </p>
              )}
              {reduced && canRevertPayments && (
                <p className="mt-2 text-[11px] text-amber-700">
                  Reducing a received amount (was {formatINR(d.orig!.amountReceived)}) needs a reason.
                </p>
              )}
              {olderPlan && (
                <p className="mt-2 text-[11px] text-sky-700">
                  Older entry planned for {formatINR(d.orig!.amount)}; it keeps covering that amount until more than that is received.
                </p>
              )}
            </EntryShell>
          );
        })}
      </div>

      {/* Loans */}
      <div className="space-y-3">
        <SectionHeader
          icon={Landmark}
          title="Loans"
          hint="The loan amount counts as received on the order; reports count the disbursed amount as revenue."
          addLabel="Add loan"
          disabled={disabled}
          onAdd={() => update('loans', [...value.loans, newLoanDraft(remainingForSources)])}
        />
        {value.loans.map((d, i) => {
          const disbursed = !!d.orig && isLoanDisbursed(d);
          const cancelled = isLoanCancelled(d);
          return (
            <EntryShell
              key={d.key}
              title={`Loan #${i + 1}`}
              badge={
                d.orig ? (
                  <Pill className="border-slate-200 bg-white text-slate-600">
                    {cancelled ? 'Cancelled' : deriveLoanStatus(d.loanAmount, d.disbursementAmount)}
                  </Pill>
                ) : (
                  <Pill className="border-orange-200 bg-orange-50 text-orange-700">New</Pill>
                )
              }
              disabled={disabled}
              removeDisabledReason={disbursed ? 'This loan has a disbursement, so it cannot be removed' : undefined}
              onRemove={() => update('loans', value.loans.filter((x) => x.key !== d.key))}
            >
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="col-span-2">
                  <Label className={fieldLabel}>Loan partner *</Label>
                  <Select value={d.loanPartner || undefined} disabled={disabled}
                    onValueChange={(v) => patchLoan(d.key, { loanPartner: v })}>
                    <SelectTrigger className={inputCls}><SelectValue placeholder={loadingLoanPartners ? 'Loading…' : 'Select loan partner'} /></SelectTrigger>
                    <SelectContent>
                      {activePartners.length === 0 && (
                        <div className="px-2 py-2 text-sm text-slate-500">No loan partners available</div>
                      )}
                      {activePartners.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.name}
                          {p.type ? ` · ${p.type}` : ''}
                          {p.submissionCharge !== undefined ? ` · ${p.submissionCharge}%` : ''}
                        </SelectItem>
                      ))}
                      {d.loanPartner && !activePartners.some((p) => p._id === d.loanPartner) && (
                        <SelectItem value={d.loanPartner}>
                          {typeof d.orig?.loanPartner === 'object' ? d.orig.loanPartner.name : 'Current partner'} (inactive)
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className={fieldLabel}>Loan amount *</Label>
                  <Input type="number" min={0} className={inputCls} value={d.loanAmount} disabled={disabled}
                    onChange={(e) => patchLoan(d.key, { loanAmount: num(e.target.value) })} />
                </div>
                <div>
                  <Label className={fieldLabel}>Disbursed amount</Label>
                  <Input type="number" min={0} className={inputCls} value={d.disbursementAmount} disabled={disabled}
                    onChange={(e) => patchLoan(d.key, { disbursementAmount: num(e.target.value) })} />
                </div>
                <div>
                  <Label className={fieldLabel}>Loan date</Label>
                  <Input type="date" className={inputCls} value={d.loanDate} disabled={disabled}
                    onChange={(e) => patchLoan(d.key, { loanDate: e.target.value })} />
                </div>
                <div>
                  <Label className={fieldLabel}>First EMI date</Label>
                  <Input type="date" className={inputCls} value={d.firstEmiDate} disabled={disabled}
                    onChange={(e) => patchLoan(d.key, { firstEmiDate: e.target.value })} />
                </div>
                <div>
                  <Label className={fieldLabel}>Disbursement date</Label>
                  <Input type="date" className={inputCls} value={d.disbursementDate} disabled={disabled}
                    onChange={(e) => patchLoan(d.key, { disbursementDate: e.target.value })} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <Label className={fieldLabel}>Remarks</Label>
                  <Input className={inputCls} value={d.remarks} disabled={disabled}
                    onChange={(e) => patchLoan(d.key, { remarks: e.target.value })} />
                </div>
              </div>
              {!cancelled && (
                <p className="mt-2 text-[11px] text-slate-500">
                  Received on the order: {formatINR(d.loanAmount)} · revenue in reports: {formatINR(d.disbursementAmount)}
                </p>
              )}
              {d.orig && toMoney(d.disbursementAmount) < toMoney(d.orig.disbursementAmount) && (
                <p className="mt-2 text-[11px] text-amber-700">
                  Reducing a disbursement needs the Revert Payment permission and a reason.
                </p>
              )}
            </EntryShell>
          );
        })}
      </div>

      {/* Subscriptions */}
      <div className="space-y-3">
        <SectionHeader
          icon={Repeat}
          title="Subscriptions"
          hint="Covers installment × count; revenue counts successful installments."
          addLabel="Add subscription"
          disabled={disabled}
          onAdd={() => update('subscriptions', [...value.subscriptions, newSubscriptionDraft()])}
        />
        {value.subscriptions.map((d, i) => {
          const locked = !!d.orig && isSubscriptionPlanLocked(d);
          const paid = successfulSubscriptionAmount(d.orig);
          return (
            <EntryShell
              key={d.key}
              title={`Subscription #${i + 1}`}
              badge={
                d.orig ? (
                  <Pill className="border-slate-200 bg-white text-slate-600">{d.orig.status || (d.orig.cashfreeSubscriptionId ? 'Linked' : 'Not linked')}</Pill>
                ) : (
                  <Pill className="border-orange-200 bg-orange-50 text-orange-700">New</Pill>
                )
              }
              disabled={disabled}
              removeDisabledReason={paid > 0 ? 'Installments were received on this plan, so it cannot be removed' : undefined}
              onRemove={() => update('subscriptions', value.subscriptions.filter((x) => x.key !== d.key))}
            >
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div>
                  <Label className={fieldLabel}>Installment *</Label>
                  <Input type="number" min={0} className={inputCls} value={d.installmentAmount} disabled={disabled || locked}
                    onChange={(e) => patchSubscription(d.key, { installmentAmount: num(e.target.value) })} />
                </div>
                <div>
                  <Label className={fieldLabel}>No. of installments *</Label>
                  <Input type="number" min={1} max={120} step={1} className={inputCls} value={d.numberOfInstallments} disabled={disabled || locked}
                    onChange={(e) => patchSubscription(d.key, { numberOfInstallments: parseInt(e.target.value, 10) || 0 })} />
                </div>
                <div>
                  <Label className={fieldLabel}>First installment *</Label>
                  <Input type="date" className={inputCls} value={d.firstInstallmentDate} disabled={disabled || locked}
                    onChange={(e) => patchSubscription(d.key, { firstInstallmentDate: e.target.value })} />
                </div>
                <div>
                  <Label className={fieldLabel}>Last installment</Label>
                  <Input type="date" className={inputCls} value={d.lastInstallmentDate} disabled={disabled || locked}
                    onChange={(e) => patchSubscription(d.key, { lastInstallmentDate: e.target.value })} />
                </div>
                <div className="col-span-2 md:col-span-4">
                  <Label className={fieldLabel}>Remarks</Label>
                  <Input className={inputCls} value={d.remarks} disabled={disabled}
                    onChange={(e) => patchSubscription(d.key, { remarks: e.target.value })} />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Plan total {formatINR(toMoney(d.installmentAmount) * (Number(d.numberOfInstallments) || 0))}
                {!d.lastInstallmentDate && ' · last date defaults to first date + (count − 1) months'}
                {locked && ` · plan locked (linked to Cashfree or has payments; ${formatINR(paid)} received)`}
              </p>
            </EntryShell>
          );
        })}
      </div>

      {/* Credits */}
      <div className="space-y-3">
        <SectionHeader
          icon={Clock3}
          title="Credits (pending dues)"
          hint="Only for the part of the fee the sources don't cover. Marked paid later with a verified reference."
          addLabel="Add credit"
          disabled={disabled}
          onAdd={() => update('credits', [...value.credits, newCreditDraft(uncovered)])}
        />
        {coverage.coverageStatus === 'UNDER_COVERED' && uncovered > 0 && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => update('credits', [...value.credits, newCreditDraft(uncovered)])}
            className="w-full rounded-xl border border-dashed border-amber-300 bg-amber-50/50 px-3 py-2 text-left text-xs text-amber-800 hover:bg-amber-50"
          >
            <Plus className="mr-1 inline h-3.5 w-3.5" />
            Add a credit for the uncovered {formatINR(uncovered)} (you can split it into several due dates)
          </button>
        )}
        {value.credits.map((c, i) => {
          const paid = !!c.orig && isCreditPaid(c);
          return (
            <EntryShell
              key={c.key}
              title={`Credit #${i + 1}`}
              badge={
                c.orig ? (
                  <Pill
                    className={
                      c.orig.status === 'Paid'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : c.orig.status === 'Overdue'
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                    }
                  >
                    {c.orig.status}
                  </Pill>
                ) : (
                  <Pill className="border-orange-200 bg-orange-50 text-orange-700">New</Pill>
                )
              }
              disabled={disabled}
              removeDisabledReason={paid ? 'A paid credit cannot be removed or edited' : undefined}
              onRemove={() => update('credits', value.credits.filter((x) => x.key !== c.key))}
            >
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div>
                  <Label className={fieldLabel}>Amount *</Label>
                  <Input type="number" min={0} className={inputCls} value={c.amount} disabled={disabled || paid}
                    onChange={(e) => patchCredit(c.key, { amount: num(e.target.value) })} />
                </div>
                <div>
                  <Label className={fieldLabel}>Due date *</Label>
                  <Input type="date" className={inputCls} value={c.dueDate} disabled={disabled || paid}
                    onChange={(e) => patchCredit(c.key, { dueDate: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label className={fieldLabel}>Remarks</Label>
                  <Input className={inputCls} value={c.remarks} disabled={disabled || paid}
                    onChange={(e) => patchCredit(c.key, { remarks: e.target.value })} />
                </div>
              </div>
              {paid && c.orig?.paymentReferenceId && (
                <p className="mt-2 text-[11px] text-slate-500">Paid with reference {c.orig.paymentReferenceId}</p>
              )}
            </EntryShell>
          );
        })}
      </div>
    </div>
  );
}

export default PaymentSourcesEditor;
