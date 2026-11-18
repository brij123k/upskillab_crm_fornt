import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Landmark, Loader2, Repeat, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import ApiConfig from '@/config/apiConfig';
import { getDataHandlerWithToken } from '@/config/services';
import {
  CreditEntry,
  LoanEntry,
  LumpsumPaymentEntry,
  OrderFinancials,
  PaymentSummary,
  SubscriptionEntry,
  formatDateShort,
  formatINR,
  toMoney,
} from '@/lib/orderPayments';

interface OrderLike {
  _id: string;
  totalFee?: number;
  discount?: number;
  GSTEnabled?: boolean;
  GSTAmount?: number;
  finalFee: number;
  paymentSummary?: PaymentSummary;
  lumpsumPayments?: LumpsumPaymentEntry[];
  loans?: LoanEntry[];
  subscriptions?: SubscriptionEntry[];
  credits?: CreditEntry[];
}

interface Props {
  order: OrderLike;
  /** id → name, for loans whose partner isn't populated. */
  loanPartners?: { _id: string; name: string }[];
}

const subscriptionReceived = (s: SubscriptionEntry) =>
  toMoney(
    s.totalReceived ??
      (s.paymentHistory || []).filter((p) => String(p.status).toUpperCase() === 'SUCCESS').reduce((sum, p) => sum + toMoney(p.amount), 0),
  );

function Line({ label, sub, amount, tone, bold, indent }: { label: React.ReactNode; sub?: React.ReactNode; amount: React.ReactNode; tone?: 'green' | 'orange' | 'muted' | 'red'; bold?: boolean; indent?: boolean }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 py-1.5', indent && 'pl-4')}>
      <div className="min-w-0">
        <p className={cn('text-sm', bold ? 'font-semibold text-slate-800' : 'text-slate-600')}>{label}</p>
        {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
      </div>
      <span
        className={cn(
          'shrink-0 text-sm tabular-nums',
          bold ? 'font-semibold' : 'font-medium',
          tone === 'green' && 'text-emerald-600',
          tone === 'orange' && 'text-orange-600',
          tone === 'red' && 'text-red-600',
          tone === 'muted' && 'text-slate-400',
          !tone && 'text-slate-800',
        )}
      >
        {amount}
      </span>
    </div>
  );
}

function Group({ icon: Icon, title, total, children }: { icon: any; title: string; total: number; children: React.ReactNode }) {
  return (
    <div className="border-b border-dashed border-slate-200 pb-2 last:border-0">
      <div className="flex items-center justify-between py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Icon className="h-3.5 w-3.5" /> {title}
        </span>
        <span className="text-sm font-semibold tabular-nums text-slate-800">{formatINR(total)}</span>
      </div>
      {children}
    </div>
  );
}

/**
 * Order payment details as a balance sheet: what the fee is made of on one
 * side, how it is covered (lumpsum / loans / subscriptions / credits) on the
 * other, then total received and due.
 */
export function PaymentBalanceSheet({ order, loanPartners = [] }: Props) {
  const [fin, setFin] = useState<OrderFinancials | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getDataHandlerWithToken(ApiConfig.getOrderFinancials(order._id), null, null, true)
      .then((res: OrderFinancials) => alive && setFin(res))
      .catch(() => alive && setFin(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [order._id]);

  const lumpsums = fin?.lumpsumPayments || order.lumpsumPayments || [];
  const loans = fin?.loans || order.loans || [];
  const subs = fin?.subscriptions || order.subscriptions || [];
  const credits = fin?.credits || order.credits || [];
  const summary = fin?.summary || order.paymentSummary;

  const partnerName = (l: LoanEntry) =>
    typeof l.loanPartner === 'object' && l.loanPartner
      ? l.loanPartner.name
      : loanPartners.find((p) => p._id === l.loanPartner)?.name || 'Loan partner';

  const activeLumpsums = lumpsums.filter((l) => l.status !== 'Failed' && l.status !== 'Refunded');
  const activeLoans = loans.filter((l) => l.disbursementStatus !== 'Cancelled');

  const lumpsumTotal = toMoney(activeLumpsums.reduce((s, l) => s + toMoney(l.amountReceived), 0));
  const loanTotal = toMoney(activeLoans.reduce((s, l) => s + toMoney(l.loanAmount), 0));
  const subPlanTotal = toMoney(subs.reduce((s, x) => s + toMoney(x.installmentAmount) * (Number(x.numberOfInstallments) || 0), 0));
  const subReceived = toMoney(subs.reduce((s, x) => s + subscriptionReceived(x), 0));
  const creditTotal = toMoney(credits.reduce((s, c) => s + toMoney(c.amount), 0));
  const creditPaid = toMoney(credits.filter((c) => c.status === 'Paid').reduce((s, c) => s + toMoney(c.amount), 0));

  const finalFee = toMoney(fin?.finalFee ?? order.finalFee);
  const covered = toMoney(lumpsumTotal + loanTotal + subPlanTotal + creditTotal);
  const difference = toMoney(finalFee - covered);

  // Received = lumpsum received + loan amount (counts as received on the order) + successful installments + paid credits
  const received = toMoney(summary?.actualReceivedRevenue ?? lumpsumTotal + loanTotal + subReceived + creditPaid);
  const due = toMoney(summary?.outstandingAmount ?? Math.max(0, finalFee - received));

  const noEntries = !lumpsums.length && !loans.length && !subs.length && !credits.length;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        {/* Fee side */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Course fee</p>
          <Line label="Total course fee" amount={formatINR(order.totalFee ?? finalFee)} />
          {toMoney(order.discount) > 0 && <Line label="Less: discount" amount={`− ${formatINR(order.discount)}`} tone="red" />}
          {order.GSTEnabled && toMoney(order.GSTAmount) > 0 && <Line label="Add: GST" amount={`+ ${formatINR(order.GSTAmount)}`} />}
          <div className="mt-2 border-t border-slate-200 pt-2">
            <Line label="Final fee payable" amount={formatINR(finalFee)} bold />
          </div>
        </div>

        {/* Coverage side */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Covered by {loading && <Loader2 className="h-3 w-3 animate-spin" />}
          </p>
          {noEntries && !loading && <p className="py-2 text-sm text-slate-400">No payment sources recorded.</p>}

          {activeLumpsums.length > 0 && (
            <Group icon={Wallet} title="Lumpsum" total={lumpsumTotal}>
              {activeLumpsums.map((l, i) => {
                const reg = toMoney(l.registrationAmount);
                const admission = Math.max(0, toMoney(toMoney(l.amountReceived) - reg));
                return (
                  <Line
                    key={l._id || i}
                    indent
                    label={activeLumpsums.length > 1 ? `Lumpsum #${i + 1}` : 'Lumpsum received'}
                    sub={[`Registration ${formatINR(reg)} + Admission fee ${formatINR(admission)}`, l.paymentMode, l.paymentDate && formatDateShort(l.paymentDate)].filter(Boolean).join(' · ')}
                    amount={formatINR(l.amountReceived)}
                  />
                );
              })}
            </Group>
          )}

          {activeLoans.length > 0 && (
            <Group icon={Landmark} title={`Loan${activeLoans.length > 1 ? 's' : ''}`} total={loanTotal}>
              {activeLoans.map((l, i) => (
                <Line
                  key={l._id || i}
                  indent
                  label={`${partnerName(l)}${activeLoans.length > 1 ? ` (#${i + 1})` : ''}`}
                  sub={`${l.disbursementStatus || 'Pending'} · disbursed ${formatINR(l.disbursementAmount)}${l.disbursementDate ? ` on ${formatDateShort(l.disbursementDate)}` : ''}`}
                  amount={formatINR(l.loanAmount)}
                />
              ))}
            </Group>
          )}

          {subs.length > 0 && (
            <Group icon={Repeat} title={`Subscription${subs.length > 1 ? 's' : ''}`} total={subPlanTotal}>
              {subs.map((s, i) => (
                <Line
                  key={s._id || i}
                  indent
                  label={`${formatINR(s.installmentAmount)} × ${s.numberOfInstallments}${subs.length > 1 ? ` (#${i + 1})` : ''}`}
                  sub={`${s.status || 'Not linked'} · received ${formatINR(subscriptionReceived(s))}`}
                  amount={formatINR(toMoney(s.installmentAmount) * (Number(s.numberOfInstallments) || 0))}
                />
              ))}
            </Group>
          )}

          {credits.length > 0 && (
            <Group icon={Clock3} title={`Credit${credits.length > 1 ? 's' : ''}`} total={creditTotal}>
              {credits.map((c, i) => (
                <Line
                  key={c._id || i}
                  indent
                  label={`Credit #${i + 1} · due ${formatDateShort(c.dueDate)}`}
                  sub={[c.status, c.paymentReferenceId && `ref ${c.paymentReferenceId}`, c.remarks].filter(Boolean).join(' · ')}
                  amount={formatINR(c.amount)}
                  tone={c.status === 'Paid' ? 'green' : c.status === 'Overdue' ? 'red' : undefined}
                />
              ))}
            </Group>
          )}

          <div className="mt-2 border-t border-slate-200 pt-2">
            <Line label="Total covered" amount={formatINR(covered)} bold />
          </div>
        </div>
      </div>

      {/* Balance check + received / due */}
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
          Math.abs(difference) <= 0.01 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800',
        )}
      >
        {Math.abs(difference) <= 0.01 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
        {Math.abs(difference) <= 0.01
          ? `Balanced: final fee ${formatINR(finalFee)} = covered ${formatINR(covered)}`
          : difference > 0
            ? `${formatINR(difference)} of the final fee is not covered`
            : `Covered amount exceeds the final fee by ${formatINR(-difference)}`}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Total received</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700">{formatINR(received)}</p>
          <p className="mt-0.5 text-[11px] text-emerald-700/70">Lumpsum + loan amount + paid installments + paid credits</p>
        </div>
        <div className={cn('rounded-xl border p-4', due > 0.01 ? 'border-orange-200 bg-orange-50/60' : 'border-slate-200 bg-slate-50')}>
          <p className={cn('text-xs font-semibold uppercase tracking-wide', due > 0.01 ? 'text-orange-700' : 'text-slate-500')}>Due amount</p>
          <p className={cn('mt-1 text-xl font-bold tabular-nums', due > 0.01 ? 'text-orange-600' : 'text-slate-700')}>{formatINR(due)}</p>
          {summary?.pendingCreditCount ? (
            <p className="mt-0.5 text-[11px] text-orange-700/70">
              incl. {summary.pendingCreditCount} pending credit{summary.pendingCreditCount > 1 ? 's' : ''} ({formatINR(summary.pendingCreditAmount)})
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default PaymentBalanceSheet;
