import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserRound } from 'lucide-react';
import type { PersonalDetails } from '@/types/user';

interface PersonalDetailsFormProps {
  value?: PersonalDetails;
  onChange: (details: PersonalDetails) => void;
  disabled?: boolean;
}

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const EMERGENCY_RELATIONS = ['Father', 'Mother', 'Spouse', 'Brother', 'Sister', 'Son', 'Daughter', 'Guardian', 'Friend', 'Other'];

export const EMPTY_PERSONAL_DETAILS: PersonalDetails = {
  dateOfBirth: '',
  gender: '',
  aadhaarNumber: '',
  panNumber: '',
  bloodGroup: '',
  alternateMobile: '',
  emergencyContactName: '',
  emergencyContactNumber: '',
  emergencyContactRelation: '',
};

/** Keep only the supported keys (drops any old/unknown fields from stored data). */
export function toPersonalDetails(raw?: any): PersonalDetails {
  const out: any = {};
  for (const key of Object.keys(EMPTY_PERSONAL_DETAILS)) out[key] = raw?.[key] || '';
  return out;
}

const MOBILE_RE = /^[6-9]\d{9}$/;

/** Client-side check matching the backend PersonalDetailsDto rules. */
export function validatePersonalDetails(d?: PersonalDetails): string | null {
  if (!d) return null;
  if (d.aadhaarNumber && !/^\d{12}$/.test(d.aadhaarNumber)) return 'Aadhaar number must be 12 digits';
  if (d.panNumber && !/^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(d.panNumber)) return 'PAN number is invalid (e.g. ABCDE1234F)';
  if (d.alternateMobile && !MOBILE_RE.test(d.alternateMobile)) return 'Alternate mobile must be a valid 10-digit number';
  if (d.emergencyContactNumber && !MOBILE_RE.test(d.emergencyContactNumber)) return 'Emergency contact number must be a valid 10-digit number';
  return null;
}

const digits = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);

/** Staff-side editor (Edit user / Create profile / onboarding review). */
export function PersonalDetailsForm({ value, onChange, disabled = false }: PersonalDetailsFormProps) {
  const v = value || {};
  const set = (field: keyof PersonalDetails, fieldValue: string) => onChange({ ...v, [field]: fieldValue });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserRound className="w-4 h-4" />
          Personal Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Date of Birth</Label>
            <Input type="date" value={v.dateOfBirth || ''} onChange={(e) => set('dateOfBirth', e.target.value)} disabled={disabled} />
          </div>
          <div className="space-y-1">
            <Label>Gender</Label>
            <Select value={v.gender || ''} onValueChange={(val) => set('gender', val)} disabled={disabled}>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Blood Group</Label>
            <Select value={v.bloodGroup || ''} onValueChange={(val) => set('bloodGroup', val)} disabled={disabled}>
              <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
              <SelectContent>
                {BLOOD_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Alternate Mobile</Label>
            <Input inputMode="numeric" value={v.alternateMobile || ''} onChange={(e) => set('alternateMobile', digits(e.target.value, 10))} placeholder="Optional" disabled={disabled} />
          </div>
          <div className="space-y-1">
            <Label>Emergency Contact Name</Label>
            <Input value={v.emergencyContactName || ''} onChange={(e) => set('emergencyContactName', e.target.value)} disabled={disabled} />
          </div>
          <div className="space-y-1">
            <Label>Emergency Contact No.</Label>
            <Input inputMode="numeric" value={v.emergencyContactNumber || ''} onChange={(e) => set('emergencyContactNumber', digits(e.target.value, 10))} disabled={disabled} />
          </div>
          <div className="space-y-1">
            <Label>Relation With Emergency Contact</Label>
            <Select value={v.emergencyContactRelation || ''} onValueChange={(val) => set('emergencyContactRelation', val)} disabled={disabled}>
              <SelectTrigger><SelectValue placeholder="Select relation" /></SelectTrigger>
              <SelectContent>
                {EMERGENCY_RELATIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Aadhaar Number</Label>
            <Input inputMode="numeric" value={v.aadhaarNumber || ''} onChange={(e) => set('aadhaarNumber', digits(e.target.value, 12))} placeholder="12 digits" disabled={disabled} />
          </div>
          <div className="space-y-1">
            <Label>PAN Number</Label>
            <Input value={v.panNumber || ''} onChange={(e) => set('panNumber', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))} placeholder="ABCDE1234F" disabled={disabled} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
