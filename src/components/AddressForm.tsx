import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface AddressFormProps {
  value: any;
  onChange: (address: any) => void;
  disabled?: boolean;
}

export function AddressForm({ value, onChange, disabled = false }: AddressFormProps) {
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
          <MapPin className="w-4 h-4" />
          Address Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Address Line 1 *</Label>
            <Input
              value={value?.addressLine1 || ''}
              onChange={(e) => handleChange('addressLine1', e.target.value)}
              placeholder="House/Flat No., Building Name"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1">
            <Label>Address Line 2</Label>
            <Input
              value={value?.addressLine2 || ''}
              onChange={(e) => handleChange('addressLine2', e.target.value)}
              placeholder="Street, Area"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1">
            <Label>City *</Label>
            <Input
              value={value?.city || ''}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="City"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1">
            <Label>State *</Label>
            <Input
              value={value?.state || ''}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="State"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1">
            <Label>Country *</Label>
            <Input
              value={value?.country || ''}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="Country"
              disabled={disabled}
            />
          </div>
          <div className="space-y-1">
            <Label>Pincode *</Label>
            <Input
              value={value?.pincode || ''}
              onChange={(e) => handleChange('pincode', e.target.value)}
              placeholder="Pincode"
              disabled={disabled}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}