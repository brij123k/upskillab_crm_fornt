import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, ArrowRight, BadgeCheck, Briefcase, Building2, Camera, CheckCircle2, ClipboardList, Clock,
  FileText, GraduationCap, HeartPulse, IdCard, Landmark, Loader2, Lock, Mail, MapPin, Pencil, Plus,
  Send, ShieldCheck, Trash2, UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ApiConfig from '@/config/apiConfig';
import { getDataHandler, postDataHandler } from '@/config/services';
import { BLOOD_GROUPS, EMERGENCY_RELATIONS, EMPTY_PERSONAL_DETAILS, toPersonalDetails } from '@/components/PersonalDetailsForm';
import { FileField } from '@/components/onboarding/FileField';
import type { PersonalDetails } from '@/types/user';
import logo from '@/assets/logo.png';

/* ------------------------------------------------------------------ */
/* types & constants                                                   */
/* ------------------------------------------------------------------ */

type RegisteredInfo = {
  name: string;
  email?: string;
  number?: string;
  employeeId?: number;
  onboardingId?: number;
  role?: string;
  department?: string;
  reportingSenior?: string;
  joinedAt?: string;
};

type OnboardingResponse = {
  linkActive: boolean;
  status: 'not_shared' | 'pending' | 'submitted' | 'approved';
  submittedAt?: string;
  hrEmail?: string;
  user: RegisteredInfo;
  profile?: any;
};

type AddressT = { addressLine1: string; addressLine2: string; city: string; state: string; country: string; pincode: string };
type BankT = { accountHolderName: string; bankName: string; accountNumber: string; ifscCode: string; branchName: string; accountType: string };
type EduT = { qualification: string; instituteName: string; boardOrUniversity: string; passingYear: string; percentageOrCGPA: string; certificate: string };
type DocsT = { aadhaarFront: string; aadhaarBack: string; panCard: string; passbook: string; educationalCertificates: string[] };

type FormState = {
  profileImage: string;
  personalDetails: PersonalDetails;
  address: AddressT;
  currentAddress: AddressT;
  sameAsPermanent: boolean;
  bankDetails: BankT;
  confirmAccountNumber: string;
  education: EduT[];
  documents: DocsT;
};

type Errors = Record<string, string>;

const DEFAULT_HR_EMAIL = 'hr@upskillab.com';
const EMPTY_ADDRESS: AddressT = { addressLine1: '', addressLine2: '', city: '', state: '', country: 'India', pincode: '' };
const EMPTY_BANK: BankT = { accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '', branchName: '', accountType: '' };
const EMPTY_DOCS: DocsT = { aadhaarFront: '', aadhaarBack: '', panCard: '', passbook: '', educationalCertificates: [] };

/** Mandatory rows, always shown first and in this order. */
const REQUIRED_EDU = [
  { qualification: '10th', title: '10th / Secondary (SSC)', board: 'Board', institute: 'School name' },
  { qualification: '12th', title: '12th / Higher Secondary (HSC)', board: 'Board', institute: 'School / College name' },
  { qualification: "Bachelor's", title: "Bachelor's Degree", board: 'University', institute: 'College name' },
];
const OPTIONAL_QUALIFICATIONS = ['Diploma', "Master's", 'PhD', 'Certification', 'Other'];

const emptyEdu = (qualification: string): EduT => ({
  qualification, instituteName: '', boardOrUniversity: '', passingYear: '', percentageOrCGPA: '', certificate: '',
});

const STEPS = [
  { key: 'personal', label: 'Personal', icon: UserRound },
  { key: 'bank', label: 'Bank', icon: Landmark },
  { key: 'education', label: 'Education', icon: GraduationCap },
  { key: 'review', label: 'Review', icon: ClipboardList },
] as const;

// step numbers: 0 = welcome, 1..4 = STEPS
const WELCOME = 0;
const PERSONAL = 1;
const BANK = 2;
const EDUCATION = 3;
const REVIEW = 4;

const MOBILE_RE = /^[6-9]\d{9}$/;
const IFSC_RE = /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/;

const errorMessage = (err: any, fallback: string) => {
  const msg = err?.message ?? err?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return typeof msg === 'string' && msg ? msg : fallback;
};

const blank = (v?: string) => !v || !String(v).trim();
const digits = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);
const fmtDate = (d?: string) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const mask = (v?: string, keep = 4) => (v ? `${'•'.repeat(Math.max(0, v.length - keep))}${v.slice(-keep)}` : '—');
const draftKey = (token: string) => `onboarding-draft:${token}`;

/** Rebuild the education list: required rows first (merged with saved data), then extras. */
function toEducation(saved: any[] = []): EduT[] {
  const rows = saved.map((d) => ({
    ...emptyEdu(d?.qualification || ''),
    ...d,
    passingYear: d?.passingYear ? String(d.passingYear) : '',
    certificate: d?.certificate || '',
  }));
  const used = new Set<number>();
  const required = REQUIRED_EDU.map((r) => {
    const i = rows.findIndex((row, idx) => !used.has(idx) && row.qualification === r.qualification);
    if (i >= 0) { used.add(i); return rows[i]; }
    return emptyEdu(r.qualification);
  });
  return [...required, ...rows.filter((_, idx) => !used.has(idx))];
}

/* ------------------------------------------------------------------ */
/* validation (mirrors the backend)                                    */
/* ------------------------------------------------------------------ */

function validateAddress(a: AddressT, prefix: string, e: Errors) {
  if (blank(a.addressLine1)) e[`${prefix}.addressLine1`] = 'Required';
  if (blank(a.city)) e[`${prefix}.city`] = 'Required';
  if (blank(a.state)) e[`${prefix}.state`] = 'Required';
  if (blank(a.pincode)) e[`${prefix}.pincode`] = 'Required';
  else if (!/^\d{6}$/.test(a.pincode)) e[`${prefix}.pincode`] = 'Must be 6 digits';
}

function validatePersonal(f: FormState): Errors {
  const e: Errors = {};
  const p = f.personalDetails;
  if (blank(p.dateOfBirth)) e.dateOfBirth = 'Required';
  if (blank(p.gender)) e.gender = 'Required';
  if (blank(p.bloodGroup)) e.bloodGroup = 'Required';
  if (p.alternateMobile && !MOBILE_RE.test(p.alternateMobile)) e.alternateMobile = 'Enter a valid 10-digit number';
  validateAddress(f.address, 'address', e);
  if (!f.sameAsPermanent) validateAddress(f.currentAddress, 'currentAddress', e);
  if (blank(p.emergencyContactName)) e.emergencyContactName = 'Required';
  if (blank(p.emergencyContactNumber)) e.emergencyContactNumber = 'Required';
  else if (!MOBILE_RE.test(p.emergencyContactNumber!)) e.emergencyContactNumber = 'Enter a valid 10-digit number';
  if (blank(p.emergencyContactRelation)) e.emergencyContactRelation = 'Required';
  if (blank(p.aadhaarNumber)) e.aadhaarNumber = 'Required';
  else if (!/^\d{12}$/.test(p.aadhaarNumber!)) e.aadhaarNumber = 'Must be 12 digits';
  if (blank(f.documents.aadhaarFront)) e.aadhaarFront = 'Upload Aadhaar front';
  if (blank(f.documents.aadhaarBack)) e.aadhaarBack = 'Upload Aadhaar back';
  if (blank(p.panNumber)) e.panNumber = 'Required';
  else if (!/^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(p.panNumber!)) e.panNumber = 'Invalid PAN (e.g. ABCDE1234F)';
  if (blank(f.documents.panCard)) e.panCard = 'Upload PAN card';
  return e;
}

function validateBank(f: FormState): Errors {
  const e: Errors = {};
  const b = f.bankDetails;
  if (blank(b.accountHolderName)) e.accountHolderName = 'Required';
  if (blank(b.bankName)) e.bankName = 'Required';
  if (blank(b.accountNumber)) e.accountNumber = 'Required';
  else if (!/^\d{6,18}$/.test(b.accountNumber)) e.accountNumber = 'Enter 6–18 digits';
  if (b.accountNumber && f.confirmAccountNumber !== b.accountNumber) e.confirmAccountNumber = 'Account numbers do not match';
  if (blank(b.ifscCode)) e.ifscCode = 'Required';
  else if (!IFSC_RE.test(b.ifscCode)) e.ifscCode = 'Invalid IFSC (e.g. HDFC0001234)';
  if (blank(b.branchName)) e.branchName = 'Required';
  if (blank(b.accountType)) e.accountType = 'Required';
  if (blank(f.documents.passbook)) e.passbook = 'Upload passbook or cancelled cheque';
  return e;
}

function validateEducation(f: FormState): Errors {
  const e: Errors = {};
  const year = new Date().getFullYear();
  f.education.forEach((row, i) => {
    const required = i < REQUIRED_EDU.length;
    const touched = required || Object.entries(row).some(([k, v]) => k !== 'qualification' && !blank(v as string));
    if (!touched) return;
    if (blank(row.qualification)) e[`edu.${i}.qualification`] = 'Required';
    if (blank(row.instituteName)) e[`edu.${i}.instituteName`] = 'Required';
    if (blank(row.boardOrUniversity)) e[`edu.${i}.boardOrUniversity`] = 'Required';
    const y = Number(row.passingYear);
    if (blank(row.passingYear)) e[`edu.${i}.passingYear`] = 'Required';
    else if (!(y >= 1950 && y <= year + 5)) e[`edu.${i}.passingYear`] = 'Invalid year';
    if (blank(row.percentageOrCGPA)) e[`edu.${i}.percentageOrCGPA`] = 'Required';
    if (required && blank(row.certificate)) e[`edu.${i}.certificate`] = 'Upload marksheet';
  });
  return e;
}

/* ------------------------------------------------------------------ */
/* small layout pieces                                                 */
/* ------------------------------------------------------------------ */

const Shell = ({ children, hrEmail }: { children: React.ReactNode; hrEmail?: string }) => (
  <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#fff7ed_0%,_#f8fafc_45%,_#ffffff_100%)]">
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Upskillab" className="h-8 w-auto" />
          <span className="hidden h-5 w-px bg-slate-200 sm:block" />
          <span className="hidden text-sm font-semibold text-slate-700 sm:block">Employee Onboarding</span>
        </div>
        <a href={`mailto:${hrEmail || DEFAULT_HR_EMAIL}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-orange-600">
          <Mail className="h-3.5 w-3.5" />
          <span className="truncate">{hrEmail || DEFAULT_HR_EMAIL}</span>
        </a>
      </div>
    </header>
    <main className="mx-auto max-w-5xl px-4 py-6 md:py-10">{children}</main>
    <footer className="pb-8 text-center text-xs text-slate-400">
      <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
      Your information is encrypted in transit and visible only to the HR / administration team.
    </footer>
  </div>
);

const Message = ({ icon, title, text, hrEmail, children }: { icon: React.ReactNode; title: string; text: string; hrEmail?: string; children?: React.ReactNode }) => (
  <Shell hrEmail={hrEmail}>
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm md:p-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-50">{icon}</div>
      <h1 className="mt-4 text-2xl font-bold text-slate-800">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{text}</p>
      {children}
    </div>
  </Shell>
);

function Section({ icon: Icon, title, subtitle, children, action }: { icon: any; title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, required, error, children, className }: { label: string; required?: boolean; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-sm font-medium text-slate-700">
        {label} {required ? <span className="text-red-500">*</span> : <span className="text-xs font-normal text-slate-400">(optional)</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputCls = (err?: string) => cn('h-10 rounded-lg', err && 'border-red-300 focus-visible:ring-red-300');

function ReviewRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <dt className="w-48 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="break-words text-sm text-slate-800">{value || '—'}</dd>
    </div>
  );
}

function DocLink({ url, label }: { url?: string; label: string }) {
  if (!url) return <span className="text-sm text-red-500">Not uploaded</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 hover:underline">
      <FileText className="h-3.5 w-3.5" /> {label}
    </a>
  );
}

const fmtAddress = (a: AddressT) =>
  [a.addressLine1, a.addressLine2, a.city, a.state, a.pincode, a.country].filter((x) => x && String(x).trim()).join(', ');

/* ------------------------------------------------------------------ */
/* page                                                                */
/* ------------------------------------------------------------------ */

export function EmployeeOnboardingPage() {
  const { token = '' } = useParams();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<OnboardingResponse | null>(null);
  const [step, setStep] = useState(WELCOME);
  const [errors, setErrors] = useState<Errors>({});
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<FormState>({
    profileImage: '',
    personalDetails: { ...EMPTY_PERSONAL_DETAILS },
    address: { ...EMPTY_ADDRESS },
    currentAddress: { ...EMPTY_ADDRESS },
    sameAsPermanent: false,
    bankDetails: { ...EMPTY_BANK },
    confirmAccountNumber: '',
    education: toEducation(),
    documents: { ...EMPTY_DOCS },
  });

  useEffect(() => {
    document.title = 'Employee Onboarding | Upskillab';
    (async () => {
      try {
        const res: OnboardingResponse = await getDataHandler(ApiConfig.publicOnboarding(token), {}, {}, true);
        setData(res);
        const p = res.profile || {};
        const address = { ...EMPTY_ADDRESS, ...(p.address || {}) };
        const currentAddress = { ...EMPTY_ADDRESS, ...(p.currentAddress || {}) };
        const sameAsPermanent = !!address.addressLine1 && fmtAddress(address) === fmtAddress(currentAddress);
        let next: FormState = {
          profileImage: p.profileImage || '',
          personalDetails: toPersonalDetails(p.personalDetails),
          address,
          currentAddress,
          sameAsPermanent,
          bankDetails: { ...EMPTY_BANK, ...(p.bankDetails || {}) },
          confirmAccountNumber: p.bankDetails?.accountNumber || '',
          education: toEducation(p.educationalDetails),
          documents: { ...EMPTY_DOCS, ...(p.documents || {}) },
        };
        // Restore an unsent draft from this browser (survives refresh).
        try {
          const raw = localStorage.getItem(draftKey(token));
          if (raw && res.linkActive) next = { ...next, ...JSON.parse(raw) };
        } catch { /* storage unavailable */ }
        setForm(next);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Save the draft as the employee types.
  useEffect(() => {
    if (loading || !data?.linkActive || submittedAt) return;
    const t = setTimeout(() => {
      try { localStorage.setItem(draftKey(token), JSON.stringify(form)); } catch { /* ignore */ }
    }, 400);
    return () => clearTimeout(t);
  }, [form, loading, data, token, submittedAt]);

  const goTo = (n: number) => {
    setStep(n);
    setErrors({});
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  /* -------- setters -------- */
  const setPD = (k: keyof PersonalDetails, v: string) => setForm((f) => ({ ...f, personalDetails: { ...f.personalDetails, [k]: v } }));
  const setAddr = (which: 'address' | 'currentAddress', k: keyof AddressT, v: string) => setForm((f) => ({ ...f, [which]: { ...f[which], [k]: v } }));
  const setBank = (k: keyof BankT, v: string) => setForm((f) => ({ ...f, bankDetails: { ...f.bankDetails, [k]: v } }));
  const setDoc = (k: keyof DocsT, v: string) => setForm((f) => ({ ...f, documents: { ...f.documents, [k]: v } }));
  const setEdu = (i: number, k: keyof EduT, v: string) =>
    setForm((f) => ({ ...f, education: f.education.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)) }));

  /** Token-scoped upload – works without login, only while the link is active. */
  const uploadFile = async (file: File): Promise<string | null> => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be 5 MB or smaller');
      return null;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(ApiConfig.publicOnboardingUpload(token), formData);
      return res.data?.data?.url || null;
    } catch (err: any) {
      toast.error(errorMessage(err?.response?.data, 'Upload failed'));
      return null;
    }
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    setUploadingPhoto(true);
    const url = await uploadFile(file);
    setUploadingPhoto(false);
    if (url) {
      setForm((f) => ({ ...f, profileImage: url }));
      toast.success('Photo uploaded');
    }
  };

  const validators: Record<number, (f: FormState) => Errors> = {
    [PERSONAL]: validatePersonal,
    [BANK]: validateBank,
    [EDUCATION]: validateEducation,
  };

  const next = () => {
    const v = validators[step];
    if (v) {
      const errs = v(form);
      if (Object.keys(errs).length) {
        setErrors(errs);
        toast.error('Please complete the highlighted fields');
        requestAnimationFrame(() => document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
        return;
      }
    }
    goTo(step + 1);
  };

  const effectiveCurrent = form.sameAsPermanent ? form.address : form.currentAddress;

  const handleSubmit = async () => {
    // Re-check every step in case the employee jumped around.
    for (const s of [PERSONAL, BANK, EDUCATION]) {
      const errs = validators[s](form);
      if (Object.keys(errs).length) {
        goTo(s);
        setTimeout(() => setErrors(errs), 0);
        toast.error('Some details are missing. Please review this step.');
        return;
      }
    }
    if (!confirmed) {
      toast.error('Please confirm the declaration to submit');
      return;
    }
    setSubmitting(true);
    try {
      const educationalDetails = form.education
        .filter((row, i) => i < REQUIRED_EDU.length || !blank(row.instituteName))
        .map((row) => ({ ...row, passingYear: Number(row.passingYear) || undefined }));
      const payload = {
        profileImage: form.profileImage || undefined,
        personalDetails: form.personalDetails,
        address: form.address,
        currentAddress: effectiveCurrent,
        bankDetails: { ...form.bankDetails, ifscCode: form.bankDetails.ifscCode.toUpperCase() },
        educationalDetails,
        documents: {
          ...form.documents,
          educationalCertificates: educationalDetails.map((d) => d.certificate).filter(Boolean),
        },
      };
      await postDataHandler(ApiConfig.publicOnboarding(token), payload, true);
      try { localStorage.removeItem(draftKey(token)); } catch { /* ignore */ }
      setSubmittedAt(new Date());
      window.scrollTo({ top: 0 });
    } catch (e: any) {
      toast.error(errorMessage(e, 'Could not submit your details. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const u = data?.user;
  const hrEmail = data?.hrEmail || DEFAULT_HR_EMAIL;
  const onboardingId = u?.onboardingId ?? u?.employeeId;
  const firstName = useMemo(() => (u?.name || '').split(' ')[0], [u?.name]);

  /* -------- terminal states -------- */

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm text-slate-500">Loading your onboarding form…</p>
      </div>
    );
  }

  if (notFound || !data || !u) {
    return <Message icon={<Lock className="h-6 w-6 text-orange-500" />} title="Invalid link" text={`This onboarding link is not valid. Please contact ${DEFAULT_HR_EMAIL} for a new link.`} />;
  }

  if (submittedAt) {
    return (
      <Message
        hrEmail={hrEmail}
        icon={<BadgeCheck className="h-7 w-7 text-emerald-600" />}
        title="Onboarding form submitted"
        text={`Thank you, ${firstName}. Your details have been received successfully. Our administration team will verify the information and documents you provided and will notify you once the review is complete.`}
      >
        <div className="mt-6 grid gap-3 rounded-xl bg-slate-50 p-4 text-left text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-400">Onboarding ID</p>
            <p className="font-semibold text-slate-800">{onboardingId ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Submitted on</p>
            <p className="font-semibold text-slate-800">{submittedAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
        </div>
        <ul className="mt-5 space-y-2 text-left text-sm text-slate-600">
          <li className="flex gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" /> Review usually takes 1–2 working days.</li>
          <li className="flex gap-2"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" /> This link is now locked. To correct anything, write to <a className="font-medium text-orange-600" href={`mailto:${hrEmail}`}>{hrEmail}</a>.</li>
        </ul>
      </Message>
    );
  }

  if (!data.linkActive) {
    const submittedBefore = data.status === 'submitted' || data.status === 'approved';
    return (
      <Message
        hrEmail={hrEmail}
        icon={submittedBefore ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <Lock className="h-6 w-6 text-orange-500" />}
        title={submittedBefore ? (data.status === 'approved' ? 'Onboarding approved' : 'Under review') : 'Link not active'}
        text={
          submittedBefore
            ? `Hi ${u.name}, your onboarding details have been submitted${data.status === 'approved' ? ' and approved. Welcome aboard!' : ' and are being reviewed by the administration team.'} If you need to update anything, please write to ${hrEmail}.`
            : `This onboarding link is currently inactive. Please contact ${hrEmail}.`
        }
      />
    );
  }

  /* -------- registered details (shown on every step after welcome) -------- */

  const registered: [string, React.ReactNode][] = [
    ['Onboarding ID', onboardingId],
    ['Email', u.email],
    ['Mobile', u.number],
    ['Role', u.role],
    ['Department', u.department],
    ['Reporting To', u.reportingSenior],
  ];

  const EmployeeCard = (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-16 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400" />
      <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end">
        <div className="-mt-10 flex items-end gap-3">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow">
            {form.profileImage ? (
              <img src={form.profileImage} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-400">{u.name.charAt(0).toUpperCase()}</div>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            )}
            {step < REVIEW && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-tl-lg bg-orange-500 text-white hover:bg-orange-600"
                title={form.profileImage ? 'Change photo' : 'Upload photo'}
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          <div className="pb-1">
            <p className="text-lg font-bold leading-tight text-slate-800">{u.name}</p>
            <p className="text-xs text-slate-500">{[u.role, u.department].filter(Boolean).join(' · ') || 'New employee'}</p>
          </div>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 px-5 py-4 md:grid-cols-3 lg:grid-cols-6">
        {registered.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{k}</dt>
            <dd className={cn('truncate text-sm font-medium', k === 'Onboarding ID' ? 'text-orange-600' : 'text-slate-800')} title={String(v ?? '')}>{v ?? '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );

  /* -------- welcome -------- */

  if (step === WELCOME) {
    const checklist = [
      'Aadhaar card (front & back) and PAN card',
      'Bank passbook or a cancelled cheque',
      "10th, 12th and Bachelor's marksheets",
      'Permanent and current address, emergency contact',
    ];
    return (
      <Shell hrEmail={hrEmail}>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-amber-500 p-7 text-white shadow-lg shadow-orange-200 md:p-10 lg:col-span-3">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 right-10 h-40 w-40 rounded-full bg-white/10" />
            <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-orange-100">Welcome aboard</p>
            <h1 className="relative mt-3 text-3xl font-bold leading-tight md:text-4xl">Hello {firstName}, welcome to Upskillab!</h1>
            <p className="relative mt-4 max-w-lg text-sm leading-relaxed text-orange-50 md:text-base">
              We're excited to have you join the team. Before your first day, please complete your onboarding form so we can set up your
              employee records, payroll and access.
            </p>
            <div className="relative mt-6 flex flex-wrap gap-3 text-xs">
              <span className="rounded-full bg-white/15 px-3 py-1.5">Onboarding ID: <strong>{onboardingId ?? '—'}</strong></span>
              <span className="rounded-full bg-white/15 px-3 py-1.5"><Clock className="mr-1 inline h-3.5 w-3.5" />Takes about 10 minutes</span>
            </div>
            <Button onClick={() => goTo(PERSONAL)} size="lg" className="relative mt-8 h-14 rounded-xl bg-white px-8 text-base font-bold text-white shadow-xl shadow-orange-900/20 ring-2 ring-white/60 transition-transform hover:-translate-y-0.5 hover:bg-orange-50">
              Start <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-800">How it works</h2>
              <ol className="mt-4 space-y-4">
                {STEPS.map((s, i) => (
                  <li key={s.key} className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-bold text-orange-600">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{s.label === 'Personal' ? 'Personal information' : s.label === 'Bank' ? 'Bank details for CTC' : s.label === 'Education' ? 'Education & marksheets' : 'Review & submit'}</p>
                      <p className="text-xs text-slate-500">
                        {['Address, emergency contact and ID proofs', 'Salary account and passbook', "10th, 12th and Bachelor's details", 'Check everything, then submit for HR review'][i]}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900"><FileText className="h-4 w-4" /> Keep these ready</h2>
              <ul className="mt-3 space-y-2">
                {checklist.map((c) => (
                  <li key={c} className="flex gap-2 text-sm text-amber-900/80"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  /* -------- steps -------- */

  const err = (k: string) => errors[k];
  const errAttr = (k: string) => ({ 'data-error': errors[k] ? 'true' : undefined });

  const addressFields = (which: 'address' | 'currentAddress', disabled = false) => {
    const a = form[which];
    const k = (f: string) => `${which}.${f}`;
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Address line 1" required error={err(k('addressLine1'))} className="md:col-span-2">
          <Input {...errAttr(k('addressLine1'))} className={inputCls(err(k('addressLine1')))} value={a.addressLine1} onChange={(e) => setAddr(which, 'addressLine1', e.target.value)} placeholder="House / flat no., building" disabled={disabled} />
        </Field>
        <Field label="Address line 2" error={err(k('addressLine2'))} className="md:col-span-2">
          <Input className={inputCls()} value={a.addressLine2} onChange={(e) => setAddr(which, 'addressLine2', e.target.value)} placeholder="Street, area, landmark" disabled={disabled} />
        </Field>
        <Field label="City" required error={err(k('city'))}>
          <Input {...errAttr(k('city'))} className={inputCls(err(k('city')))} value={a.city} onChange={(e) => setAddr(which, 'city', e.target.value)} disabled={disabled} />
        </Field>
        <Field label="State" required error={err(k('state'))}>
          <Input {...errAttr(k('state'))} className={inputCls(err(k('state')))} value={a.state} onChange={(e) => setAddr(which, 'state', e.target.value)} disabled={disabled} />
        </Field>
        <Field label="Pincode" required error={err(k('pincode'))}>
          <Input {...errAttr(k('pincode'))} inputMode="numeric" className={inputCls(err(k('pincode')))} value={a.pincode} onChange={(e) => setAddr(which, 'pincode', digits(e.target.value, 6))} disabled={disabled} />
        </Field>
        <Field label="Country" required>
          <Input className={inputCls()} value={a.country} onChange={(e) => setAddr(which, 'country', e.target.value)} disabled={disabled} />
        </Field>
      </div>
    );
  };

  const pd = form.personalDetails;

  const personalStep = (
    <div className="space-y-5">
      <Section icon={UserRound} title="Basic details" subtitle="As per your government ID">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Date of birth" required error={err('dateOfBirth')}>
            <Input {...errAttr('dateOfBirth')} type="date" max={new Date().toISOString().slice(0, 10)} className={inputCls(err('dateOfBirth'))} value={pd.dateOfBirth || ''} onChange={(e) => setPD('dateOfBirth', e.target.value)} />
          </Field>
          <Field label="Gender" required error={err('gender')}>
            <div {...errAttr('gender')}>
              <Select value={pd.gender || ''} onValueChange={(v) => setPD('gender', v)}>
                <SelectTrigger className={inputCls(err('gender'))}><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Field>
          <Field label="Blood group" required error={err('bloodGroup')}>
            <div {...errAttr('bloodGroup')}>
              <Select value={pd.bloodGroup || ''} onValueChange={(v) => setPD('bloodGroup', v)}>
                <SelectTrigger className={inputCls(err('bloodGroup'))}><SelectValue placeholder="Select blood group" /></SelectTrigger>
                <SelectContent>{BLOOD_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </Field>
          <Field label="Alternate mobile" error={err('alternateMobile')}>
            <Input {...errAttr('alternateMobile')} inputMode="numeric" className={inputCls(err('alternateMobile'))} value={pd.alternateMobile || ''} onChange={(e) => setPD('alternateMobile', digits(e.target.value, 10))} placeholder="10-digit number" />
          </Field>
        </div>
      </Section>

      <Section icon={MapPin} title="Permanent address">{addressFields('address')}</Section>

      <Section
        icon={Building2}
        title="Current address"
        action={
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
            <Checkbox checked={form.sameAsPermanent} onCheckedChange={(v) => setForm((f) => ({ ...f, sameAsPermanent: v === true }))} />
            Same as permanent
          </label>
        }
      >
        {form.sameAsPermanent ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">{fmtAddress(form.address) || 'Fill your permanent address above.'}</p>
        ) : (
          addressFields('currentAddress')
        )}
      </Section>

      <Section icon={HeartPulse} title="Emergency contact" subtitle="Someone we can reach in case of an emergency">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Contact person name" required error={err('emergencyContactName')}>
            <Input {...errAttr('emergencyContactName')} className={inputCls(err('emergencyContactName'))} value={pd.emergencyContactName || ''} onChange={(e) => setPD('emergencyContactName', e.target.value)} />
          </Field>
          <Field label="Contact number" required error={err('emergencyContactNumber')}>
            <Input {...errAttr('emergencyContactNumber')} inputMode="numeric" className={inputCls(err('emergencyContactNumber'))} value={pd.emergencyContactNumber || ''} onChange={(e) => setPD('emergencyContactNumber', digits(e.target.value, 10))} placeholder="10-digit number" />
          </Field>
          <Field label="Relation" required error={err('emergencyContactRelation')}>
            <div {...errAttr('emergencyContactRelation')}>
              <Select value={pd.emergencyContactRelation || ''} onValueChange={(v) => setPD('emergencyContactRelation', v)}>
                <SelectTrigger className={inputCls(err('emergencyContactRelation'))}><SelectValue placeholder="Select relation" /></SelectTrigger>
                <SelectContent>{EMERGENCY_RELATIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </Field>
        </div>
      </Section>

      <Section icon={IdCard} title="Identity documents" subtitle="Clear photos or scans, all four corners visible">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Aadhaar number" required error={err('aadhaarNumber')}>
              <Input {...errAttr('aadhaarNumber')} inputMode="numeric" className={inputCls(err('aadhaarNumber'))} value={pd.aadhaarNumber || ''} onChange={(e) => setPD('aadhaarNumber', digits(e.target.value, 12))} placeholder="12 digits" />
            </Field>
            <div {...errAttr('aadhaarFront')}>
              <FileField label="Aadhaar front" required value={form.documents.aadhaarFront} onChange={(v) => setDoc('aadhaarFront', v)} uploader={uploadFile} error={err('aadhaarFront')} />
            </div>
            <div {...errAttr('aadhaarBack')}>
              <FileField label="Aadhaar back" required value={form.documents.aadhaarBack} onChange={(v) => setDoc('aadhaarBack', v)} uploader={uploadFile} error={err('aadhaarBack')} />
            </div>
          </div>
          <div className="h-px bg-slate-100" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="PAN number" required error={err('panNumber')}>
              <Input {...errAttr('panNumber')} className={cn(inputCls(err('panNumber')), 'uppercase')} value={pd.panNumber || ''} onChange={(e) => setPD('panNumber', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))} placeholder="ABCDE1234F" />
            </Field>
            <div {...errAttr('panCard')} className="md:col-span-2">
              <FileField label="PAN card" required value={form.documents.panCard} onChange={(v) => setDoc('panCard', v)} uploader={uploadFile} error={err('panCard')} />
            </div>
          </div>
        </div>
      </Section>
    </div>
  );

  const b = form.bankDetails;
  const bankStep = (
    <Section icon={Landmark} title="Bank details for CTC" subtitle="Your salary will be credited to this account. Use an account in your own name.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Account holder name" required error={err('accountHolderName')} className="md:col-span-2">
          <Input {...errAttr('accountHolderName')} className={inputCls(err('accountHolderName'))} value={b.accountHolderName} onChange={(e) => setBank('accountHolderName', e.target.value)} placeholder="As printed on passbook" />
        </Field>
        <Field label="Bank name" required error={err('bankName')}>
          <Input {...errAttr('bankName')} className={inputCls(err('bankName'))} value={b.bankName} onChange={(e) => setBank('bankName', e.target.value)} placeholder="e.g. HDFC Bank" />
        </Field>
        <Field label="Branch name" required error={err('branchName')}>
          <Input {...errAttr('branchName')} className={inputCls(err('branchName'))} value={b.branchName} onChange={(e) => setBank('branchName', e.target.value)} />
        </Field>
        <Field label="Account number" required error={err('accountNumber')}>
          <Input {...errAttr('accountNumber')} inputMode="numeric" className={inputCls(err('accountNumber'))} value={b.accountNumber} onChange={(e) => setBank('accountNumber', digits(e.target.value, 18))} />
        </Field>
        <Field label="Confirm account number" required error={err('confirmAccountNumber')}>
          <Input
            {...errAttr('confirmAccountNumber')}
            inputMode="numeric"
            className={inputCls(err('confirmAccountNumber'))}
            value={form.confirmAccountNumber}
            onChange={(e) => setForm((f) => ({ ...f, confirmAccountNumber: digits(e.target.value, 18) }))}
            onPaste={(e) => e.preventDefault()}
            placeholder="Re-enter account number"
          />
        </Field>
        <Field label="IFSC code" required error={err('ifscCode')}>
          <Input {...errAttr('ifscCode')} className={cn(inputCls(err('ifscCode')), 'uppercase')} value={b.ifscCode} onChange={(e) => setBank('ifscCode', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))} placeholder="HDFC0001234" />
        </Field>
        <Field label="Account type" required error={err('accountType')}>
          <div {...errAttr('accountType')}>
            <Select value={b.accountType} onValueChange={(v) => setBank('accountType', v)}>
              <SelectTrigger className={inputCls(err('accountType'))}><SelectValue placeholder="Select account type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Savings">Savings</SelectItem>
                <SelectItem value="Current">Current</SelectItem>
                <SelectItem value="Salary">Salary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Field>
        <div {...errAttr('passbook')} className="md:col-span-2">
          <FileField label="Passbook front page / cancelled cheque" required value={form.documents.passbook} onChange={(v) => setDoc('passbook', v)} uploader={uploadFile} error={err('passbook')} hint="Must show account number, IFSC and holder name · JPG, PNG or PDF" />
        </div>
      </div>
    </Section>
  );

  const usedOptional = new Set(form.education.slice(REQUIRED_EDU.length).map((r) => r.qualification));
  const educationStep = (
    <div className="space-y-5">
      {form.education.map((row, i) => {
        const req = REQUIRED_EDU[i];
        const k = (f: string) => `edu.${i}.${f}`;
        const complete = !blank(row.instituteName) && !blank(row.boardOrUniversity) && !blank(row.passingYear) && !blank(row.percentageOrCGPA) && (!req || !blank(row.certificate));
        return (
          <Section
            key={i}
            icon={GraduationCap}
            title={req ? req.title : row.qualification || 'Additional qualification'}
            subtitle={req ? 'Required · details and marksheet' : 'Optional'}
            action={
              req ? (
                complete ? <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Complete</span> : null
              ) : (
                <button type="button" onClick={() => setForm((f) => ({ ...f, education: f.education.filter((_, idx) => idx !== i) }))} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500" title="Remove">
                  <Trash2 className="h-4 w-4" />
                </button>
              )
            }
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {!req && (
                <Field label="Qualification" required error={err(k('qualification'))} className="md:col-span-2">
                  <div {...errAttr(k('qualification'))}>
                    <Select value={row.qualification} onValueChange={(v) => setEdu(i, 'qualification', v)}>
                      <SelectTrigger className={inputCls(err(k('qualification')))}><SelectValue placeholder="Select qualification" /></SelectTrigger>
                      <SelectContent>{OPTIONAL_QUALIFICATIONS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </Field>
              )}
              <Field label={req ? req.institute : 'Institute name'} required error={err(k('instituteName'))}>
                <Input {...errAttr(k('instituteName'))} className={inputCls(err(k('instituteName')))} value={row.instituteName} onChange={(e) => setEdu(i, 'instituteName', e.target.value)} />
              </Field>
              <Field label={req ? req.board : 'Board / University'} required error={err(k('boardOrUniversity'))}>
                <Input {...errAttr(k('boardOrUniversity'))} className={inputCls(err(k('boardOrUniversity')))} value={row.boardOrUniversity} onChange={(e) => setEdu(i, 'boardOrUniversity', e.target.value)} placeholder={i === 0 ? 'e.g. CBSE' : undefined} />
              </Field>
              <Field label="Passing year" required error={err(k('passingYear'))}>
                <Input {...errAttr(k('passingYear'))} inputMode="numeric" className={inputCls(err(k('passingYear')))} value={row.passingYear} onChange={(e) => setEdu(i, 'passingYear', digits(e.target.value, 4))} placeholder="YYYY" />
              </Field>
              <Field label="Percentage / CGPA" required error={err(k('percentageOrCGPA'))}>
                <Input {...errAttr(k('percentageOrCGPA'))} className={inputCls(err(k('percentageOrCGPA')))} value={row.percentageOrCGPA} onChange={(e) => setEdu(i, 'percentageOrCGPA', e.target.value)} placeholder="e.g. 82% or 8.4 CGPA" />
              </Field>
              <div {...errAttr(k('certificate'))} className="md:col-span-2">
                <FileField
                  label={req ? 'Marksheet' : 'Certificate / marksheet'}
                  required={!!req}
                  value={row.certificate}
                  onChange={(v) => setEdu(i, 'certificate', v)}
                  uploader={uploadFile}
                  error={err(k('certificate'))}
                  hint={req && i === 2 ? 'Final-year marksheet or degree certificate · JPG, PNG or PDF' : undefined}
                />
              </div>
            </div>
          </Section>
        );
      })}
      <button
        type="button"
        onClick={() => setForm((f) => ({ ...f, education: [...f.education, emptyEdu(OPTIONAL_QUALIFICATIONS.find((q) => !usedOptional.has(q)) || 'Other')] }))}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-4 text-sm font-medium text-slate-500 hover:border-orange-300 hover:text-orange-600"
      >
        <Plus className="h-4 w-4" /> Add another qualification (Diploma, Master's…)
      </button>
    </div>
  );

  const editBtn = (target: number) => (
    <Button type="button" variant="ghost" size="sm" onClick={() => goTo(target)} className="h-8 text-orange-600 hover:bg-orange-50 hover:text-orange-700">
      <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
    </Button>
  );

  const reviewStep = (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">Review your details</p>
          <p className="text-xs text-slate-600">Please check everything carefully. You can't change it after submitting.</p>
        </div>
        <Button variant="outline" onClick={() => goTo(PERSONAL)} className="rounded-lg border-orange-300 bg-white text-orange-700 hover:bg-orange-50">
          <Pencil className="mr-2 h-4 w-4" /> Edit from start
        </Button>
      </div>

      <Section icon={UserRound} title="Personal information" action={editBtn(PERSONAL)}>
        <dl className="divide-y divide-slate-100">
          <ReviewRow label="Date of birth" value={fmtDate(pd.dateOfBirth)} />
          <ReviewRow label="Gender" value={pd.gender} />
          <ReviewRow label="Blood group" value={pd.bloodGroup} />
          <ReviewRow label="Alternate mobile" value={pd.alternateMobile} />
          <ReviewRow label="Permanent address" value={fmtAddress(form.address)} />
          <ReviewRow label="Current address" value={form.sameAsPermanent ? 'Same as permanent address' : fmtAddress(form.currentAddress)} />
          <ReviewRow label="Emergency contact" value={[pd.emergencyContactName, pd.emergencyContactRelation && `(${pd.emergencyContactRelation})`, pd.emergencyContactNumber].filter(Boolean).join(' ')} />
          <ReviewRow label="Aadhaar" value={<span className="flex flex-wrap items-center gap-2">{mask(pd.aadhaarNumber)} <DocLink url={form.documents.aadhaarFront} label="Front" /> <DocLink url={form.documents.aadhaarBack} label="Back" /></span>} />
          <ReviewRow label="PAN" value={<span className="flex flex-wrap items-center gap-2">{pd.panNumber} <DocLink url={form.documents.panCard} label="PAN card" /></span>} />
        </dl>
      </Section>

      <Section icon={Landmark} title="Bank details for CTC" action={editBtn(BANK)}>
        <dl className="divide-y divide-slate-100">
          <ReviewRow label="Account holder" value={b.accountHolderName} />
          <ReviewRow label="Bank / branch" value={[b.bankName, b.branchName].filter(Boolean).join(' · ')} />
          <ReviewRow label="Account number" value={mask(b.accountNumber)} />
          <ReviewRow label="IFSC" value={b.ifscCode} />
          <ReviewRow label="Account type" value={b.accountType} />
          <ReviewRow label="Passbook / cheque" value={<DocLink url={form.documents.passbook} label="View document" />} />
        </dl>
      </Section>

      <Section icon={GraduationCap} title="Education" action={editBtn(EDUCATION)}>
        <div className="-mx-5 -my-5 overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-2.5 font-medium">Qualification</th>
                <th className="px-3 py-2.5 font-medium">Institute</th>
                <th className="px-3 py-2.5 font-medium">Board / University</th>
                <th className="px-3 py-2.5 font-medium">Year</th>
                <th className="px-3 py-2.5 font-medium">Score</th>
                <th className="px-5 py-2.5 font-medium">Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {form.education.filter((r, i) => i < REQUIRED_EDU.length || !blank(r.instituteName)).map((r, i) => (
                <tr key={i}>
                  <td className="px-5 py-3 font-medium text-slate-800">{r.qualification}</td>
                  <td className="px-3 py-3 text-slate-700">{r.instituteName}</td>
                  <td className="px-3 py-3 text-slate-700">{r.boardOrUniversity}</td>
                  <td className="px-3 py-3 text-slate-700">{r.passingYear}</td>
                  <td className="px-3 py-3 text-slate-700">{r.percentageOrCGPA}</td>
                  <td className="px-5 py-3">{r.certificate ? <DocLink url={r.certificate} label="View" /> : <span className="text-xs text-slate-400">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} disabled={submitting} className="mt-0.5" />
          <span className="text-sm leading-relaxed text-slate-600">
            I hereby declare that the information and documents provided above are true and correct to the best of my knowledge. I understand
            that any false information may lead to cancellation of my employment.
          </span>
        </label>
      </div>
    </div>
  );

  const stepMeta: Record<number, { title: string; subtitle: string }> = {
    [PERSONAL]: { title: 'Personal information', subtitle: 'Tell us about yourself and upload your ID proofs.' },
    [BANK]: { title: 'Bank details for CTC', subtitle: 'Where your salary will be credited.' },
    [EDUCATION]: { title: 'Education', subtitle: "Add your 10th, 12th and Bachelor's details with marksheets." },
    [REVIEW]: { title: 'Preview & submit', subtitle: 'One last look before sending it to HR.' },
  };

  const StepIcon = STEPS[step - 1].icon;
  const progress = Math.round(((step - 1) / STEPS.length) * 100);
  const nextLabel = step < REVIEW ? STEP_DETAILS[step].title : '';
  const backLabel = step === PERSONAL ? 'Welcome' : STEP_DETAILS[step - 2].title;

  return (
    <Shell hrEmail={hrEmail}>
      <div ref={topRef} className="scroll-mt-20 space-y-6 pb-24 sm:pb-0">
        {EmployeeCard}

        <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          {/* Sidebar: progress + steps (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Your progress</span>
                  <span className="font-semibold text-orange-600">{progress}%</span>
                </div>
                <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <VerticalStepper step={step} onJump={(n) => n < step && goTo(n)} />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
                <p className="text-sm font-semibold">Need help?</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">Our HR team is happy to help with any question about your onboarding.</p>
                <a href={`mailto:${hrEmail}`} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20">
                  <Mail className="h-3.5 w-3.5" /> {hrEmail}
                </a>
              </div>
            </div>
          </aside>

          {/* Main column */}
          <div className="min-w-0 space-y-5">
            {/* mobile progress */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Step {step} of {STEPS.length}</span>
                <span className="font-semibold text-orange-600">{progress}% complete</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* step header */}
            <div className="flex items-start gap-4 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-white p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-200">
                <StepIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">Step {step} of {STEPS.length}</p>
                <h1 className="mt-0.5 text-xl font-bold text-slate-900 sm:text-2xl">{stepMeta[step].title}</h1>
                <p className="mt-0.5 text-sm text-slate-600">{stepMeta[step].subtitle}</p>
              </div>
            </div>

            {step === PERSONAL && personalStep}
            {step === BANK && bankStep}
            {step === EDUCATION && educationStep}
            {step === REVIEW && reviewStep}

            {/* action bar: fixed at the bottom on phones, inline card on larger screens */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] sm:static sm:rounded-2xl sm:border sm:px-5 sm:py-4 sm:shadow-sm">
              <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => goTo(step - 1)}
                  disabled={submitting}
                  className="h-12 rounded-xl border-2 border-slate-300 bg-white px-4 font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 sm:px-5"
                >
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to {backLabel}</span>
                </Button>
                {step < REVIEW ? (
                  <Button
                    onClick={next}
                    className="h-12 flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 text-base font-semibold text-white shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-orange-700 sm:flex-none sm:px-8"
                  >
                    <span className="flex flex-col items-start leading-tight">
                      <span>{step === EDUCATION ? 'Save & preview' : 'Save & continue'}</span>
                      <span className="text-[11px] font-normal text-orange-100">Next: {nextLabel}</span>
                    </span>
                    <ArrowRight className="ml-3 h-5 w-5" />
                  </Button>
                ) : (
                  <div className="flex flex-1 flex-col items-end gap-1 sm:flex-none">
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || !confirmed}
                      className="h-12 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 text-base font-semibold text-white shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none sm:w-auto"
                    >
                      {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                      Submit for HR review
                    </Button>
                    {!confirmed && <span className="text-[11px] text-slate-500">Tick the declaration above to submit</span>}
                  </div>
                )}
              </div>
            </div>
            <p className="hidden items-center justify-center gap-1.5 text-xs text-slate-400 sm:flex">
              <Briefcase className="h-3.5 w-3.5" /> Your progress is saved on this device automatically.
            </p>
          </div>
        </div>
      </div>
    </Shell>
  );
}

const STEP_DETAILS = [
  { title: 'Personal information', desc: 'Address, emergency contact, ID proofs' },
  { title: 'Bank details', desc: 'Salary account & passbook' },
  { title: 'Education', desc: "10th, 12th & Bachelor's marksheets" },
  { title: 'Review & submit', desc: 'Check and send to HR' },
];

function VerticalStepper({ step, onJump }: { step: number; onJump: (n: number) => void }) {
  return (
    <ol className="relative space-y-1">
      {STEPS.map((s, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        const Icon = s.icon;
        return (
          <li key={s.key} className="relative">
            {i < STEPS.length - 1 && (
              <span className={cn('absolute left-[19px] top-11 h-[calc(100%-28px)] w-0.5', done ? 'bg-emerald-400' : 'bg-slate-200')} />
            )}
            <button
              type="button"
              onClick={() => onJump(n)}
              disabled={!done}
              className={cn(
                'flex w-full items-start gap-3 rounded-xl p-2 text-left transition-colors',
                active && 'bg-orange-50',
                done && 'hover:bg-slate-50',
                !done && !active && 'cursor-default',
              )}
            >
              <span
                className={cn(
                  'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-white',
                  done && 'border-emerald-500 bg-emerald-500 text-white',
                  active && 'border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-200',
                  !done && !active && 'border-slate-200 text-slate-400',
                )}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className="min-w-0 pt-0.5">
                <span className={cn('block text-sm font-semibold', active ? 'text-slate-900' : done ? 'text-slate-700' : 'text-slate-400')}>
                  {STEP_DETAILS[i].title}
                </span>
                <span className="block text-xs text-slate-500">
                  {done ? 'Completed · click to edit' : active ? 'In progress' : STEP_DETAILS[i].desc}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
