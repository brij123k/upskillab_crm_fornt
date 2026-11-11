/**
 * Order payments v2 – shared types and helpers.
 *
 * An order combines any number of payment sources (lumpsum payments, loans,
 * subscriptions) plus credits. The backend rule is:
 *
 *   plannedLumpsum + plannedLoan + plannedSubscription + Σcredits = finalFee
 *
 * The calculations here mirror crm-backend
 * src/api/order_management/financial/order-financial.util.ts so the form can
 * show the balance live. The backend stays the source of truth and returns a
 * 400 with an `errors[]` list when the order does not balance.
 */
import { format } from 'date-fns';

/* ------------------------------------------------------------------ */
/* Enums (string values match the backend)                             */
/* ------------------------------------------------------------------ */

export const LUMPSUM_STATUSES = ['Pending', 'Partially Received', 'Received', 'Failed', 'Refunded'] as const;
export const LOAN_STATUSES = ['Pending', 'Partially Disbursed', 'Disbursed', 'Cancelled'] as const;
export const CREDIT_STATUSES = ['Pending', 'Paid', 'Overdue'] as const;
export const LUMPSUM_PAYMENT_MODES = ['UPI', 'Cash', 'Card', 'Net Banking', 'Bank Transfer', 'Payment Link', 'Cheque'];

export type CoverageStatus = 'BALANCED' | 'UNDER_COVERED' | 'OVER_COVERED';

/* ------------------------------------------------------------------ */
/* Server shapes                                                       */
/* ------------------------------------------------------------------ */

export interface LumpsumReceipt {
  amount: number;
  receivedAt?: string;
  transactionId?: string;
  source?: string;
}

export interface LumpsumPaymentEntry {
  _id: string;
  /** Planned amount. Equals the registration amount for entries created now. */
  amount: number;
  amountReceived: number;
  /** Amount paid at registration; counted as received immediately. */
  registrationAmount?: number;
  paymentDate?: string;
  transactionId?: string;
  status: string;
  paymentMode?: string;
  remarks?: string;
  origin?: string;
  receipts?: LumpsumReceipt[];
}

export interface LoanEntry {
  _id: string;
  loanPartner?: string | { _id: string; name: string; type?: string; submissionCharge?: number };
  loanId?: string | { _id: string; status?: string };
  partnerLoanReference?: string;
  loanAmount: number;
  disbursementAmount: number;
  loanDate?: string;
  firstEmiDate?: string;
  disbursementDate?: string;
  disbursementStatus: string;
  remarks?: string;
}

export interface SubscriptionPaymentHistoryEntry {
  gatewayPaymentId?: string;
  amount: number;
  status: string;
  paidAt?: string;
  installmentNo?: number;
  source?: string;
}

export interface SubscriptionEntry {
  _id: string;
  cashfreeSubscriptionId?: string;
  gatewaySubscriptionId?: string;
  gateway?: string;
  installmentAmount: number;
  numberOfInstallments: number;
  firstInstallmentDate?: string;
  lastInstallmentDate?: string;
  status?: string;
  paymentHistory?: SubscriptionPaymentHistoryEntry[];
  totalReceived?: number;
  lastPaymentAt?: string;
  remarks?: string;
}

export interface CreditStatusChange {
  from: string;
  to: string;
  reason?: string;
  changedBy?: string;
  changedAt?: string;
}

export interface CreditEntry {
  _id: string;
  amount: number;
  dueDate: string;
  status: 'Pending' | 'Paid' | 'Overdue';
  paymentDate?: string;
  paymentReferenceId?: string;
  paymentMode?: string;
  paidVia?: 'GATEWAY' | 'MANUAL' | 'MIGRATION';
  remarks?: string;
  statusHistory?: CreditStatusChange[];
}

export interface PaymentSummary {
  plannedLumpsumAmount: number;
  plannedLoanAmount: number;
  plannedSubscriptionAmount: number;
  plannedPaymentCoverage: number;
  remainingAmount: number;
  totalCredits: number;
  unallocatedAmount: number;
  lumpsumReceived: number;
  /** Σ loan amount – counted as received on the order. */
  loanReceived?: number;
  /** Σ disbursed amount – counted as revenue in reports. */
  loanDisbursed: number;
  subscriptionReceived: number;
  creditsReceived: number;
  /** Received on the order (loans count with their loan amount). */
  actualReceivedRevenue: number;
  /** Revenue counted by the reports (loans count with their disbursed amount). */
  reportedRevenue?: number;
  outstandingAmount: number;
  pendingCreditAmount: number;
  pendingCreditCount: number;
  coverageStatus: CoverageStatus;
  calculatedAt?: string;
}

export interface FinancialAuditEntry {
  action: string;
  entryType?: string;
  entryId?: string;
  before?: any;
  after?: any;
  reason?: string;
  performedBy?: string | { _id: string; name?: string };
  source?: string;
  performedAt?: string;
}

export interface MoneyBreakdown {
  lumpsum: number;
  loan: number;
  subscription: number;
  credit: number;
  total: number;
}

/** GET /order/:id/financials */
export interface OrderFinancials {
  orderId: string;
  finalFee: number;
  approved: boolean;
  paymentSchemaVersion: number;
  migrated: boolean;
  paymentMode?: string;
  paymentModes?: string[];
  status?: string;
  coverage: {
    plannedLumpsumAmount: number;
    plannedLoanAmount: number;
    plannedSubscriptionAmount: number;
    plannedPaymentCoverage: number;
    remainingAmount: number;
    totalCredits: number;
    unallocatedAmount: number;
  };
  /** Revenue as counted by the reports (loan = disbursed amount). */
  revenue: MoneyBreakdown;
  /** Received on the order (loan = loan amount). Missing on older backends. */
  received?: MoneyBreakdown;
  summary?: PaymentSummary;
  validationErrors: string[];
  lumpsumPayments: LumpsumPaymentEntry[];
  loans: LoanEntry[];
  subscriptions: SubscriptionEntry[];
  credits: CreditEntry[];
  financialAuditLog: FinancialAuditEntry[];
}

/* ------------------------------------------------------------------ */
/* Draft (form) shapes                                                 */
/* ------------------------------------------------------------------ */

let draftKeySeq = 0;
const nextKey = () => `draft-${Date.now()}-${++draftKeySeq}`;

/**
 * A lumpsum entry has a registration amount (what was paid at registration,
 * kept as a record) and an amount received (registration + later payments).
 * The amount received is what counts as received.
 */
export interface LumpsumDraft {
  key: string;
  _id?: string;
  registrationAmount: number;
  amountReceived: number;
  paymentDate: string;
  paymentMode: string;
  remarks: string;
  orig?: LumpsumPaymentEntry;
}

export interface LoanDraft {
  key: string;
  _id?: string;
  loanPartner: string;
  partnerLoanReference: string;
  loanAmount: number;
  disbursementAmount: number;
  loanDate: string;
  firstEmiDate: string;
  disbursementDate: string;
  remarks: string;
  orig?: LoanEntry;
}

export interface SubscriptionDraft {
  key: string;
  _id?: string;
  gateway: string;
  installmentAmount: number;
  numberOfInstallments: number;
  firstInstallmentDate: string;
  lastInstallmentDate: string;
  remarks: string;
  orig?: SubscriptionEntry;
}

export interface CreditDraft {
  key: string;
  _id?: string;
  amount: number;
  dueDate: string;
  remarks: string;
  orig?: CreditEntry;
}

export interface PaymentSourcesDraft {
  lumpsumPayments: LumpsumDraft[];
  loans: LoanDraft[];
  subscriptions: SubscriptionDraft[];
  credits: CreditDraft[];
}

/* ------------------------------------------------------------------ */
/* Small utils                                                         */
/* ------------------------------------------------------------------ */

export const toMoney = (value: any): number => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

export const MONEY_EPSILON = 0.01;

/** Local calendar date (YYYY-MM-DD) for <input type="date">. */
export const toDateInput = (value?: string | Date | null): string => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : format(d, 'yyyy-MM-dd');
};

export const todayInput = () => format(new Date(), 'yyyy-MM-dd');

export const formatINR = (amount: number | null | undefined) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(
    Number(amount) || 0,
  );

export const formatDateShort = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : format(d, 'dd MMM yyyy');
};

export const refId = (value: any): string => (value && typeof value === 'object' ? value._id || '' : value || '');

/**
 * Error thrown by config/services: the response body, e.g.
 * { message: 'Invalid order financials', errors: ['...'] } or Nest's
 * { message: string | string[] }.
 */
export function extractApiError(error: any, fallback = 'Request failed'): { message: string; errors: string[] } {
  const body = error?.response?.data ?? error;
  const errors: string[] = Array.isArray(body?.errors)
    ? body.errors.map(String)
    : Array.isArray(body?.message)
      ? body.message.map(String)
      : [];
  const message =
    (typeof body?.message === 'string' && body.message) ||
    (typeof body?.error === 'string' && body.error) ||
    (typeof error?.message === 'string' && error.message) ||
    fallback;
  return { message, errors };
}

export const describeApiError = (error: any, fallback?: string) => {
  const { message, errors } = extractApiError(error, fallback);
  return errors.length ? `${message}: ${errors.join('; ')}` : message;
};

/* ------------------------------------------------------------------ */
/* Draft construction                                                  */
/* ------------------------------------------------------------------ */

export const emptyPaymentSources = (): PaymentSourcesDraft => ({
  lumpsumPayments: [],
  loans: [],
  subscriptions: [],
  credits: [],
});

export const newLumpsumDraft = (registrationAmount = 0): LumpsumDraft => ({
  key: nextKey(),
  registrationAmount,
  amountReceived: registrationAmount,
  paymentDate: todayInput(),
  paymentMode: 'UPI',
  remarks: '',
});

export const newLoanDraft = (loanAmount = 0): LoanDraft => ({
  key: nextKey(),
  loanPartner: '',
  partnerLoanReference: '',
  loanAmount,
  disbursementAmount: 0,
  loanDate: todayInput(),
  firstEmiDate: '',
  disbursementDate: '',
  remarks: '',
});

export const newSubscriptionDraft = (): SubscriptionDraft => ({
  key: nextKey(),
  gateway: 'Cashfree',
  installmentAmount: 0,
  numberOfInstallments: 1,
  firstInstallmentDate: todayInput(),
  lastInstallmentDate: '',
  remarks: '',
});

export const newCreditDraft = (amount = 0, dueDate = todayInput()): CreditDraft => ({
  key: nextKey(),
  amount,
  dueDate,
  remarks: '',
});

/** Builds an editable draft from an order (or its /financials view). */
export function draftFromOrder(source: {
  lumpsumPayments?: LumpsumPaymentEntry[];
  loans?: LoanEntry[];
  subscriptions?: SubscriptionEntry[];
  credits?: CreditEntry[];
}): PaymentSourcesDraft {
  return {
    lumpsumPayments: (source.lumpsumPayments || []).map((e) => ({
      key: e._id || nextKey(),
      _id: e._id,
      registrationAmount: toMoney(e.registrationAmount),
      amountReceived: toMoney(e.amountReceived),
      paymentDate: toDateInput(e.paymentDate),
      paymentMode: e.paymentMode || '',
      remarks: e.remarks || '',
      orig: e,
    })),
    loans: (source.loans || []).map((e) => ({
      key: e._id || nextKey(),
      _id: e._id,
      loanPartner: refId(e.loanPartner),
      partnerLoanReference: e.partnerLoanReference || '',
      loanAmount: toMoney(e.loanAmount),
      disbursementAmount: toMoney(e.disbursementAmount),
      loanDate: toDateInput(e.loanDate),
      firstEmiDate: toDateInput(e.firstEmiDate),
      disbursementDate: toDateInput(e.disbursementDate),
      remarks: e.remarks || '',
      orig: e,
    })),
    subscriptions: (source.subscriptions || []).map((e) => ({
      key: e._id || nextKey(),
      _id: e._id,
      gateway: e.gateway || 'Cashfree',
      installmentAmount: toMoney(e.installmentAmount),
      numberOfInstallments: Number(e.numberOfInstallments) || 1,
      firstInstallmentDate: toDateInput(e.firstInstallmentDate),
      lastInstallmentDate: toDateInput(e.lastInstallmentDate),
      remarks: e.remarks || '',
      orig: e,
    })),
    credits: (source.credits || []).map((c) => ({
      key: c._id || nextKey(),
      _id: c._id,
      amount: toMoney(c.amount),
      dueDate: toDateInput(c.dueDate),
      remarks: c.remarks || '',
      orig: c,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Locks (what the backend refuses to change)                          */
/* ------------------------------------------------------------------ */

export const successfulSubscriptionAmount = (e?: SubscriptionEntry) =>
  toMoney((e?.paymentHistory || []).filter((p) => p.status === 'SUCCESS').reduce((s, p) => s + toMoney(p.amount), 0));

/**
 * Saved lumpsum with money on it: its date and mode can only be changed, and
 * it can only be reduced or removed, with the Revert Payment permission.
 */
export const isLumpsumReceived = (d: LumpsumDraft) => toMoney(d.orig?.amountReceived) > 0;
/** Lumpsum entries that no longer count (old Failed / Refunded entries). */
export const isLumpsumInactive = (d: LumpsumDraft) => d.orig?.status === 'Failed' || d.orig?.status === 'Refunded';
/** A cancelled loan (set on older orders) no longer counts. */
export const isLoanCancelled = (d: LoanDraft) => d.orig?.disbursementStatus === 'Cancelled';
/** Disbursed loan cannot be removed. */
export const isLoanDisbursed = (d: LoanDraft) => toMoney(d.orig?.disbursementAmount) > 0;
/** Plan is frozen once linked to Cashfree or once it has payments. */
export const isSubscriptionPlanLocked = (d: SubscriptionDraft) =>
  !!(d.orig?.cashfreeSubscriptionId || d.orig?.gatewaySubscriptionId || (d.orig?.paymentHistory || []).length);
export const isCreditPaid = (d: CreditDraft) => d.orig?.status === 'Paid';

/* ------------------------------------------------------------------ */
/* Live calculation (mirrors calculatePlannedCoverage)                 */
/* ------------------------------------------------------------------ */

/**
 * Amount an entry contributes to the fee: what has been received. An older
 * entry planned for more than was received keeps its plan until the received
 * amount goes beyond it (mirrors the backend).
 */
export const lumpsumPlannedAmount = (d: LumpsumDraft): number => {
  const received = toMoney(d.amountReceived);
  if (!d.orig) return received;
  const planned = toMoney(d.orig.amount);
  const olderPlan = planned - toMoney(d.orig.amountReceived) > MONEY_EPSILON;
  return olderPlan && received <= planned ? planned : received;
};

/** Changing the registration amount moves the amount received by the same difference. */
export const withRegistrationAmount = (d: LumpsumDraft, registrationAmount: number): LumpsumDraft => {
  const next = toMoney(registrationAmount);
  const received = toMoney(toMoney(d.amountReceived) + next - toMoney(d.registrationAmount));
  return { ...d, registrationAmount: next, amountReceived: Math.max(next, received) };
};

/** Loan status shown to users: always follows from the amounts. */
export const deriveLoanStatus = (loanAmount: number, disbursementAmount: number): string => {
  const disbursed = toMoney(disbursementAmount);
  if (disbursed <= 0) return 'Pending';
  return toMoney(loanAmount) - disbursed > MONEY_EPSILON ? 'Partially Disbursed' : 'Disbursed';
};

export interface DraftCoverage {
  finalFee: number;
  plannedLumpsumAmount: number;
  plannedLoanAmount: number;
  plannedSubscriptionAmount: number;
  plannedPaymentCoverage: number;
  remainingAmount: number;
  totalCredits: number;
  unallocatedAmount: number;
  coverageStatus: CoverageStatus;
}

export function calculateDraftCoverage(draft: PaymentSourcesDraft, finalFeeInput: number): DraftCoverage {
  const finalFee = toMoney(finalFeeInput);
  const plannedLumpsumAmount = toMoney(
    draft.lumpsumPayments.filter((d) => !isLumpsumInactive(d)).reduce((s, d) => s + lumpsumPlannedAmount(d), 0),
  );
  const plannedLoanAmount = toMoney(
    draft.loans.filter((d) => !isLoanCancelled(d)).reduce((s, d) => s + toMoney(d.loanAmount), 0),
  );
  const plannedSubscriptionAmount = toMoney(
    draft.subscriptions.reduce((s, d) => s + toMoney(d.installmentAmount) * (Number(d.numberOfInstallments) || 0), 0),
  );
  const plannedPaymentCoverage = toMoney(plannedLumpsumAmount + plannedLoanAmount + plannedSubscriptionAmount);
  const remainingAmount = toMoney(finalFee - plannedPaymentCoverage);
  const totalCredits = toMoney(draft.credits.reduce((s, c) => s + toMoney(c.amount), 0));
  const unallocatedAmount = toMoney(remainingAmount - totalCredits);
  let coverageStatus: CoverageStatus = 'BALANCED';
  if (unallocatedAmount > MONEY_EPSILON) coverageStatus = 'UNDER_COVERED';
  else if (unallocatedAmount < -MONEY_EPSILON) coverageStatus = 'OVER_COVERED';
  return {
    finalFee,
    plannedLumpsumAmount,
    plannedLoanAmount,
    plannedSubscriptionAmount,
    plannedPaymentCoverage,
    remainingAmount,
    totalCredits,
    unallocatedAmount,
    coverageStatus,
  };
}

/** Client-side checks that mirror validateOrderFinancials (backend re-checks everything). */
export function validateDraft(draft: PaymentSourcesDraft, finalFee: number): string[] {
  const errors: string[] = [];
  if (!(toMoney(finalFee) > 0)) errors.push('Final fee must be greater than 0');

  const hasSources = draft.lumpsumPayments.length + draft.loans.length + draft.subscriptions.length + draft.credits.length > 0;
  if (!hasSources) errors.push('Add at least one payment source (lumpsum, loan, subscription or credit)');

  draft.lumpsumPayments.forEach((d, i) => {
    const label = `Lumpsum #${i + 1}`;
    if (isLumpsumInactive(d)) return;
    if (toMoney(d.registrationAmount) < 0) errors.push(`${label}: registration amount cannot be negative`);
    if (!(toMoney(d.amountReceived) > 0)) errors.push(`${label}: amount received must be greater than 0`);
    if (toMoney(d.registrationAmount) - toMoney(d.amountReceived) > MONEY_EPSILON)
      errors.push(`${label}: amount received cannot be less than the registration amount`);
  });
  draft.loans.forEach((d, i) => {
    const label = `Loan #${i + 1}`;
    if (!d.loanPartner) errors.push(`${label}: loan partner is required`);
    if (!(toMoney(d.loanAmount) > 0)) errors.push(`${label}: loan amount must be greater than 0`);
    if (toMoney(d.disbursementAmount) - toMoney(d.loanAmount) > MONEY_EPSILON)
      errors.push(`${label}: disbursement cannot exceed the loan amount`);
  });
  draft.subscriptions.forEach((d, i) => {
    const label = `Subscription #${i + 1}`;
    if (!(toMoney(d.installmentAmount) > 0)) errors.push(`${label}: installment amount must be greater than 0`);
    if (!Number.isInteger(Number(d.numberOfInstallments)) || Number(d.numberOfInstallments) < 1)
      errors.push(`${label}: number of installments must be a whole number of at least 1`);
    if (!d.firstInstallmentDate) errors.push(`${label}: first installment date is required`);
  });
  draft.credits.forEach((c, i) => {
    const label = `Credit #${i + 1}`;
    if (!(toMoney(c.amount) > 0)) errors.push(`${label}: amount must be greater than 0`);
    if (!c.dueDate) errors.push(`${label}: due date is required`);
  });

  const cov = calculateDraftCoverage(draft, finalFee);
  if (cov.plannedPaymentCoverage - cov.finalFee > MONEY_EPSILON) {
    errors.push(
      `Payment sources (${formatINR(cov.plannedPaymentCoverage)}) exceed the final fee (${formatINR(cov.finalFee)}) by ${formatINR(
        cov.plannedPaymentCoverage - cov.finalFee,
      )}`,
    );
  } else if (cov.remainingAmount <= MONEY_EPSILON && draft.credits.length > 0) {
    errors.push('Payment sources already cover the final fee, so credits must be empty');
  } else if (cov.coverageStatus === 'UNDER_COVERED') {
    errors.push(`${formatINR(cov.unallocatedAmount)} of the final fee is not covered. Add a payment source or a credit.`);
  } else if (cov.coverageStatus === 'OVER_COVERED') {
    errors.push(`Credits exceed the remaining amount by ${formatINR(-cov.unallocatedAmount)}`);
  }
  return errors;
}

/* ------------------------------------------------------------------ */
/* Payload                                                             */
/* ------------------------------------------------------------------ */

const sameDay = (a?: string | null, b?: string | null) => toDateInput(a) === toDateInput(b);
const setIfChanged = (out: Record<string, any>, key: string, next: any, prev: any, isNew: boolean) => {
  if (isNew || next !== prev) out[key] = next;
};
const setDateIfChanged = (out: Record<string, any>, key: string, next: string, prev: any, isNew: boolean) => {
  if (!next) return; // never clear a date by omission
  if (isNew || !sameDay(next, prev)) out[key] = next;
};

/**
 * Converts the draft to the API arrays. New entries are sent in full;
 * existing entries are sent as `_id` + only the fields that changed, so
 * unchanged frozen fields (e.g. the reference of a received payment) are
 * never re-sent.
 */
export function buildPaymentSourcesPayload(draft: PaymentSourcesDraft) {
  const lumpsumPayments = draft.lumpsumPayments.map((d) => {
    const isNew = !d._id;
    const o = d.orig;
    const out: Record<string, any> = isNew ? {} : { _id: d._id };
    setIfChanged(out, 'registrationAmount', toMoney(d.registrationAmount), toMoney(o?.registrationAmount), isNew);
    setIfChanged(out, 'amountReceived', toMoney(d.amountReceived), toMoney(o?.amountReceived), isNew);
    setDateIfChanged(out, 'paymentDate', d.paymentDate, o?.paymentDate, isNew);
    if (d.paymentMode) setIfChanged(out, 'paymentMode', d.paymentMode, o?.paymentMode || '', isNew);
    if (d.remarks.trim() || o?.remarks) setIfChanged(out, 'remarks', d.remarks.trim(), o?.remarks || '', isNew);
    return out;
  });

  const loans = draft.loans.map((d) => {
    const isNew = !d._id;
    const o = d.orig;
    const out: Record<string, any> = isNew ? {} : { _id: d._id };
    setIfChanged(out, 'loanPartner', d.loanPartner, refId(o?.loanPartner), isNew);
    if (d.partnerLoanReference.trim() || o?.partnerLoanReference)
      setIfChanged(out, 'partnerLoanReference', d.partnerLoanReference.trim(), o?.partnerLoanReference || '', isNew);
    setIfChanged(out, 'loanAmount', toMoney(d.loanAmount), toMoney(o?.loanAmount), isNew);
    setIfChanged(out, 'disbursementAmount', toMoney(d.disbursementAmount), toMoney(o?.disbursementAmount), isNew);
    setDateIfChanged(out, 'loanDate', d.loanDate, o?.loanDate, isNew);
    setDateIfChanged(out, 'firstEmiDate', d.firstEmiDate, o?.firstEmiDate, isNew);
    setDateIfChanged(out, 'disbursementDate', d.disbursementDate, o?.disbursementDate, isNew);
    // Loan status is derived by the server from the amounts; it is never sent.
    if (d.remarks.trim() || o?.remarks) setIfChanged(out, 'remarks', d.remarks.trim(), o?.remarks || '', isNew);
    return out;
  });

  const subscriptions = draft.subscriptions.map((d) => {
    const isNew = !d._id;
    const o = d.orig;
    const out: Record<string, any> = isNew ? {} : { _id: d._id };
    if (!(o && isSubscriptionPlanLocked(d))) {
      if (isNew) out.gateway = d.gateway || 'Cashfree';
      setIfChanged(out, 'installmentAmount', toMoney(d.installmentAmount), toMoney(o?.installmentAmount), isNew);
      setIfChanged(out, 'numberOfInstallments', Number(d.numberOfInstallments), Number(o?.numberOfInstallments), isNew);
      setDateIfChanged(out, 'firstInstallmentDate', d.firstInstallmentDate, o?.firstInstallmentDate, isNew);
      setDateIfChanged(out, 'lastInstallmentDate', d.lastInstallmentDate, o?.lastInstallmentDate, isNew);
    }
    if (d.remarks.trim() || o?.remarks) setIfChanged(out, 'remarks', d.remarks.trim(), o?.remarks || '', isNew);
    return out;
  });

  const credits = draft.credits.map((c) => {
    const isNew = !c._id;
    const o = c.orig;
    const out: Record<string, any> = isNew ? {} : { _id: c._id };
    if (!(o && isCreditPaid(c))) {
      setIfChanged(out, 'amount', toMoney(c.amount), toMoney(o?.amount), isNew);
      setDateIfChanged(out, 'dueDate', c.dueDate, o?.dueDate, isNew);
      if (c.remarks.trim() || o?.remarks) setIfChanged(out, 'remarks', c.remarks.trim(), o?.remarks || '', isNew);
    }
    return out;
  });

  return { lumpsumPayments, loans, subscriptions, credits };
}

/** Changes that need the Revert Payment permission and a reason. */
export function draftReasonTriggers(draft: PaymentSourcesDraft, original?: { lumpsumPayments?: LumpsumPaymentEntry[] }): string[] {
  const triggers: string[] = [];
  if (draft.loans.some((d) => d.orig && toMoney(d.disbursementAmount) < toMoney(d.orig.disbursementAmount) - MONEY_EPSILON))
    triggers.push('a loan disbursement is reduced');
  if (draft.lumpsumPayments.some((d) => d.orig && toMoney(d.amountReceived) < toMoney(d.orig.amountReceived) - MONEY_EPSILON))
    triggers.push('an amount received is reduced');
  if (
    draft.lumpsumPayments.some(
      (d) =>
        d.orig &&
        isLumpsumReceived(d) &&
        ((d.paymentMode && d.paymentMode !== (d.orig.paymentMode || '')) || (d.paymentDate && !sameDay(d.paymentDate, d.orig.paymentDate))),
    )
  )
    triggers.push('the date or mode of a received payment is changed');
  const kept = new Set(draft.lumpsumPayments.map((d) => d._id).filter(Boolean));
  if ((original?.lumpsumPayments || []).some((e) => toMoney(e.amountReceived) > 0 && !kept.has(e._id)))
    triggers.push('a received lumpsum payment is removed');
  return triggers;
}

/** True when the draft needs a reason (and the Revert Payment permission). */
export function draftNeedsReason(draft: PaymentSourcesDraft, original?: { lumpsumPayments?: LumpsumPaymentEntry[] }): boolean {
  return draftReasonTriggers(draft, original).length > 0;
}

/* ------------------------------------------------------------------ */
/* Display helpers                                                     */
/* ------------------------------------------------------------------ */

export const PAYMENT_MODE_BADGE: Record<string, string> = {
  Lumpsum: 'bg-sky-50 text-sky-700 border-sky-200',
  Loan: 'bg-violet-50 text-violet-700 border-violet-200',
  Subscription: 'bg-teal-50 text-teal-700 border-teal-200',
  Credit: 'bg-amber-50 text-amber-700 border-amber-200',
  Mixed: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const CREDIT_STATUS_BADGE: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Overdue: 'bg-red-50 text-red-700 border-red-200',
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const COVERAGE_LABEL: Record<CoverageStatus, string> = {
  BALANCED: 'Balanced',
  UNDER_COVERED: 'Under-covered',
  OVER_COVERED: 'Over-covered',
};
