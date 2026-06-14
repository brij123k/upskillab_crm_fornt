import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark } from 'lucide-react';

interface BankDetailsFormProps {
  value: any;
  onChange: (bankDetails: any) => void;
  disabled?: boolean;
}

export function BankDetailsForm({ value, onChange, disabled = false }: BankDetailsFormProps) {
  const handleChange = (field: string, fieldValue: string) => {
    onChange({
      ...value,
      [field]: fieldValue
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Landmark className="w-4 h-4" />
          Bank Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Account Holder Name *</Label>
            <Input
              value={value?.accountHolderName || ''}
              onChange={(e) => handleChange('accountHolderName', e.target.value)}
              placeholder="As per bank account"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1">
            <Label>Bank Name *</Label>
            <Input
              value={value?.bankName || ''}
              onChange={(e) => handleChange('bankName', e.target.value)}
              placeholder="Bank name"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1">
            <Label>Account Number *</Label>
            <Input
              value={value?.accountNumber || ''}
              onChange={(e) => handleChange('accountNumber', e.target.value)}
              placeholder="Account number"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1">
            <Label>IFSC Code *</Label>
            <Input
              value={value?.ifscCode || ''}
              onChange={(e) => handleChange('ifscCode', e.target.value)}
              placeholder="IFSC code"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1">
            <Label>Branch Name *</Label>
            <Input
              value={value?.branchName || ''}
              onChange={(e) => handleChange('branchName', e.target.value)}
              placeholder="Branch name"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1">
            <Label>Account Type *</Label>
            <Select
              value={value?.accountType || ''}
              onValueChange={(val) => handleChange('accountType', val)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Savings">Savings</SelectItem>
                <SelectItem value="Current">Current</SelectItem>
                <SelectItem value="Salary">Salary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}