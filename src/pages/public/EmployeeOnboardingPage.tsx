import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Loader2, Lock, Camera, Send, ShieldCheck, Briefcase } from 'lucide-react';
import ApiConfig from '@/config/apiConfig';
import { getDataHandler, postDataHandler } from '@/config/services';
import { PersonalDetailsForm, EMPTY_PERSONAL_DETAILS, toPersonalDetails, validatePersonalDetails } from '@/components/PersonalDetailsForm';
import { AddressForm } from '@/components/AddressForm';
import { BankDetailsForm } from '@/components/BankDetailsForm';
import { EducationalDetailsForm } from '@/components/EducationalDetailsForm';
import { DocumentsUpload } from '@/components/DocumentUpload';
import type { PersonalDetails } from '@/types/user';
import logo from '@/assets/logo.png';

type RegisteredInfo = {
  name: string;
  email?: string;
  number?: string;
  employeeId?: number;
  role?: string;
  department?: string;
  reportingSenior?: string;
};

type OnboardingResponse = {
  linkActive: boolean;
  status: 'not_shared' | 'pending' | 'submitted' | 'approved';
  submittedAt?: string;
  user: RegisteredInfo;
  profile?: any;
};

const EMPTY_ADDRESS = { addressLine1: '', addressLine2: '', city: '', state: '', country: 'India', pincode: '' };
const EMPTY_BANK = { accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '', branchName: '', accountType: '' };
const EMPTY_DOCS = { aadhaarFront: '', aadhaarBack: '', panCard: '', educationalCertificates: [] as string[] };

const errorMessage = (err: any, fallback: string) => {
  const msg = err?.message ?? err?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return typeof msg === 'string' && msg ? msg : fallback;
};

const isBlank = (obj: any) => !obj || !Object.values(obj).some((v) => (Array.isArray(v) ? v.length : v));

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
        <img src={logo} alt="" className="h-8 w-auto" />
        <span className="text-sm font-semibold text-slate-700">Employee Onboarding</span>
      </div>
    </header>
    <main className="mx-auto max-w-4xl px-4 py-6 md:py-10">{children}</main>
  </div>
);

const Message = ({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) => (
  <Shell>
    <Card className="mx-auto max-w-lg text-center">
      <CardContent className="space-y-3 py-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">{icon}</div>
        <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
        <p className="text-sm text-slate-500">{text}</p>
      </CardContent>
    </Card>
  </Shell>
);

export function EmployeeOnboardingPage() {
  const { token = '' } = useParams();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<OnboardingResponse | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    profileImage: '',
    personalDetails: { ...EMPTY_PERSONAL_DETAILS } as PersonalDetails,
    address: { ...EMPTY_ADDRESS },
    bankDetails: { ...EMPTY_BANK },
    educationalDetails: [] as any[],
    documents: { ...EMPTY_DOCS },
  });

  useEffect(() => {
    document.title = 'Employee Onboarding';
    (async () => {
      try {
        const res: OnboardingResponse = await getDataHandler(ApiConfig.publicOnboarding(token), {}, {}, true);
        setData(res);
        const p = res.profile || {};
        setForm({
          profileImage: p.profileImage || '',
          personalDetails: toPersonalDetails(p.personalDetails),
          address: { ...EMPTY_ADDRESS, ...(p.address || {}) },
          bankDetails: { ...EMPTY_BANK, ...(p.bankDetails || {}) },
          educationalDetails: p.educationalDetails || [],
          documents: { ...EMPTY_DOCS, ...(p.documents || {}) },
        });
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  /** Token-scoped upload – works without login, only while the link is active. */
  const uploadFile = async (file: File): Promise<string | null> => {
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

  const validate = (): string | null => {
    const pdErr = validatePersonalDetails(form.personalDetails);
    if (pdErr) return pdErr;
    const a = form.address;
    if (!a.addressLine1 || !a.city || !a.state || !a.pincode) return 'Please fill address line 1, city, state and pincode';
    if (a.pincode && !/^\d{6}$/.test(a.pincode)) return 'Pincode must be 6 digits';
    const b = form.bankDetails;
    if (!isBlank(b)) {
      if (!b.accountHolderName || !b.bankName || !b.accountNumber || !b.ifscCode) return 'Please complete bank details (holder name, bank, account number, IFSC)';
      if (!/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(b.ifscCode)) return 'IFSC code is invalid (e.g. HDFC0001234)';
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    if (!confirmed) {
      toast.error('Please confirm the details are correct');
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        profileImage: form.profileImage || undefined,
        personalDetails: form.personalDetails,
        address: form.address,
        educationalDetails: form.educationalDetails.map((d) => ({ ...d, passingYear: Number(d.passingYear) || undefined })),
        documents: form.documents,
      };
      if (!isBlank(form.bankDetails)) payload.bankDetails = form.bankDetails;
      await postDataHandler(ApiConfig.publicOnboarding(token), payload, true);
      setSubmitted(true);
      window.scrollTo({ top: 0 });
    } catch (e: any) {
      toast.error(errorMessage(e, 'Could not submit your details. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (notFound || !data) {
    return <Message icon={<Lock className="h-6 w-6 text-orange-500" />} title="Invalid link" text="This onboarding link is not valid. Please ask your manager for a new link." />;
  }

  if (submitted) {
    return (
      <Message
        icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
        title="Details submitted"
        text="Thank you! Your manager will review your details and activate your profile. This link is now closed; ask your manager to re-open it if you need to change anything."
      />
    );
  }

  if (!data.linkActive) {
    const submittedBefore = data.status === 'submitted' || data.status === 'approved';
    return (
      <Message
        icon={<Lock className="h-6 w-6 text-orange-500" />}
        title={submittedBefore ? 'Already submitted' : 'Link not active'}
        text={
          submittedBefore
            ? `Hi ${data.user.name}, your details have already been submitted${data.status === 'approved' ? ' and approved' : ' and are under review'}. Contact your manager to re-open this link if you need to update them.`
            : 'This onboarding link is currently inactive. Please contact your manager.'
        }
      />
    );
  }

  const u = data.user;
  const registered: [string, React.ReactNode][] = [
    ['Name', u.name],
    ['Employee ID', u.employeeId],
    ['Email', u.email],
    ['Mobile', u.number],
    ['Role', u.role],
    ['Department', u.department],
    ['Reporting To', u.reportingSenior],
  ];

  return (
    <Shell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome, {u.name.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Please complete your profile below. You can submit this form once; after that the link is locked until your manager re-opens it.
          </p>
        </div>

        {/* Registered (read-only) details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4" />
              Registered Details
            </CardTitle>
            <CardDescription>These were set by your manager. Contact them if anything is wrong.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex flex-col items-center gap-2">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100">
                  {form.profileImage ? (
                    <img src={form.profileImage} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-slate-400">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                <Button type="button" variant="outline" size="sm" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto}>
                  <Camera className="mr-1 h-3.5 w-3.5" />
                  {form.profileImage ? 'Change photo' : 'Upload photo'}
                </Button>
              </div>
              <dl className="grid flex-1 grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {registered
                  .filter(([, v]) => v !== undefined && v !== null && v !== '')
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-slate-500">{k}</dt>
                      <dd className="break-words text-sm font-medium text-slate-800">{v}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          </CardContent>
        </Card>

        <PersonalDetailsForm value={form.personalDetails} onChange={(personalDetails) => setForm((f) => ({ ...f, personalDetails }))} disabled={submitting} />
        <AddressForm value={form.address} onChange={(address) => setForm((f) => ({ ...f, address }))} disabled={submitting} />
        <BankDetailsForm value={form.bankDetails} onChange={(bankDetails) => setForm((f) => ({ ...f, bankDetails }))} disabled={submitting} />
        <EducationalDetailsForm value={form.educationalDetails} onChange={(educationalDetails) => setForm((f) => ({ ...f, educationalDetails }))} disabled={submitting} />
        <DocumentsUpload value={form.documents} onChange={(documents) => setForm((f) => ({ ...f, documents }))} disabled={submitting} uploader={uploadFile} />

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-start gap-3">
              <Checkbox id="confirm" checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} disabled={submitting} />
              <Label htmlFor="confirm" className="text-sm font-normal leading-relaxed text-slate-600">
                I confirm these details are correct. I understand I can't edit them after submitting unless my manager re-opens this link.
              </Label>
            </div>
            <Button onClick={handleSubmit} disabled={submitting || uploadingPhoto} className="w-full bg-orange-500 text-white hover:bg-orange-600 sm:w-auto">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit details
            </Button>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Your information is only visible to your HR / manager.
            </p>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
