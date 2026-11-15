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

export const EMPTY_PERSONAL_DETAILS: PersonalDetails = {
  dateOfBirth: '',
  gender: '',
  aadhaarNumber: '',
  panNumber: '',
};

/** Keep only the supported keys (drops any old/unknown fields from stored data). */
export function toPersonalDetails(raw?: any): PersonalDetails {
  return {
    dateOfBirth: raw?.dateOfBirth || '',
    gender: raw?.gender || '',
    aadhaarNumber: raw?.aadhaarNumber || '',
    panNumber: raw?.panNumber || '',
  };
}

/** Client-side check matching the backend PersonalDetailsDto rules. */
export function validatePersonalDetails(d?: PersonalDetails): string | null {
  if (!d) return null;
  if (d.aadhaarNumber && !/^\d{12}$/.test(d.aadhaarNumber)) return 'Aadhaar number must be 12 digits';
  if (d.panNumber && !/^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(d.panNumber)) return 'PAN number is invalid (e.g. ABCDE1234F)';
  return null;
}

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
            <Label>Aadhaar Number</Label>
            <Input inputMode="numeric" value={v.aadhaarNumber || ''} onChange={(e) => set('aadhaarNumber', e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="12 digits" disabled={disabled} />
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
