import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GraduationCap } from 'lucide-react';

interface EducationalDetail {
  qualification: string;
  instituteName: string;
  boardOrUniversity: string;
  passingYear: number;
  percentageOrCGPA: string;
}

interface EducationalDetailsFormProps {
  value: EducationalDetail[];
  onChange: (details: EducationalDetail[]) => void;
  disabled?: boolean;
}

export function EducationalDetailsForm({ value = [], onChange, disabled = false }: EducationalDetailsFormProps) {
  const handleAdd = () => {
    onChange([
      ...value,
      {
        qualification: '',
        instituteName: '',
        boardOrUniversity: '',
        passingYear: new Date().getFullYear(),
        percentageOrCGPA: ''
      }
    ]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: string, fieldValue: any) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: fieldValue };
    onChange(updated);
  };

  const qualifications = ['10th', '12th', 'Diploma', 'Bachelor\'s', 'Master\'s', 'PhD', 'Other'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Educational Details
          </CardTitle>
          {!disabled && (
            <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {value.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No educational details added yet
          </p>
        )}
        {value.map((detail, index) => (
          <div key={index} className="border rounded-lg p-4 relative">
            {!disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Qualification *</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={detail.qualification}
                  onChange={(e) => handleChange(index, 'qualification', e.target.value)}
                  disabled={disabled}
                >
                  <option value="">Select qualification</option>
                  {qualifications.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Institute Name *</Label>
                <Input
                  value={detail.instituteName}
                  onChange={(e) => handleChange(index, 'instituteName', e.target.value)}
                  placeholder="School/College name"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label>Board/University *</Label>
                <Input
                  value={detail.boardOrUniversity}
                  onChange={(e) => handleChange(index, 'boardOrUniversity', e.target.value)}
                  placeholder="Board or University"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label>Passing Year *</Label>
                <Input
                  type="number"
                  value={detail.passingYear}
                  onChange={(e) => handleChange(index, 'passingYear', parseInt(e.target.value))}
                  placeholder="Year"
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1">
                <Label>Percentage/CGPA *</Label>
                <Input
                  value={detail.percentageOrCGPA}
                  onChange={(e) => handleChange(index, 'percentageOrCGPA', e.target.value)}
                  placeholder="e.g., 85% or 8.5 CGPA"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}