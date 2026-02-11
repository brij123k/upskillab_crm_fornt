import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { PermissionsSelector } from './PermissionsSelector';
import { UserType, DepartmentType } from '@/types/user';

interface CreateProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: UserType | null;
  departments: DepartmentType[];
  loadingDepartments: boolean;
  creatingProfile: boolean;
  onSubmit: (data: any) => Promise<void>;
}

export function CreateProfileModal({
  open,
  onOpenChange,
  selectedUser,
  departments,
  loadingDepartments,
  creatingProfile,
  onSubmit
}: CreateProfileModalProps) {
  const [profileForm, setProfileForm] = useState({
    departmentId: '',
    education: '',
    salary: '',
    reportingSenierId:'',
    extraAccessControls: [] as Array<{ module: string; actions: string[] }>
  });

  const handleSubmit = async () => {
    if (!selectedUser) return;
    
    try {
      await onSubmit(profileForm);
      // Reset form on success
      setProfileForm({
        departmentId: '',
        education: '',
        salary: '',
        reportingSenierId:'',
        extraAccessControls: []
      });
    } catch (error) {
      // Error is handled by parent component
    }
  };

  // Reset form when modal closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setProfileForm({
        departmentId: '',
        education: '',
        salary: '',
        reportingSenierId:'',
        extraAccessControls: []
      });
    }
    onOpenChange(isOpen);
  };

  if (!selectedUser) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Profile</DialogTitle>
          <DialogDescription>
            Create profile for {selectedUser.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Department Selection */}
          <div className="grid gap-2">
            <Label htmlFor="department">Department *</Label>
            <Select 
              value={profileForm.departmentId} 
              onValueChange={(value) => setProfileForm({...profileForm, departmentId: value})}
              disabled={creatingProfile || loadingDepartments}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {loadingDepartments ? (
                  <div className="py-2 text-center">
                    <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                  </div>
                ) : (
                  departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Education */}
          <div className="grid gap-2">
            <Label htmlFor="education">Education</Label>
            <Input
              id="education"
              value={profileForm.education}
              onChange={(e) => setProfileForm({...profileForm, education: e.target.value})}
              placeholder="e.g., Bachelor's Degree"
              disabled={creatingProfile}
            />
          </div>

          {/* Salary */}
          <div className="grid gap-2">
            <Label htmlFor="salary">Salary</Label>
            <Input
              id="salary"
              type="number"
              value={profileForm.salary}
              onChange={(e) => setProfileForm({...profileForm, salary: e.target.value})}
              placeholder="e.g., 50000"
              disabled={creatingProfile}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="salary">Reporting Senior</Label>
            <Input
              id="reportingSenierId"
              value={profileForm.reportingSenierId}
              onChange={(e) => setProfileForm({...profileForm, reportingSenierId: e.target.value})}
              placeholder="e.g., Senoir Name"
              disabled={creatingProfile}
            />
          </div>
          
          {/* Extra Access Controls */}
          <PermissionsSelector
            permissions={profileForm.extraAccessControls}
            onChange={(perms) => setProfileForm({...profileForm, extraAccessControls: perms})}
            disabled={creatingProfile}
            title="Extra Access Controls"
            description="Grant additional permissions beyond the user's role"
          />
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)} 
            disabled={creatingProfile}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={creatingProfile || !profileForm.departmentId}
          >
            {creatingProfile ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Profile'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}