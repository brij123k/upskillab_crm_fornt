import { useState, useEffect } from 'react';
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
import { Loader2, Users } from 'lucide-react';
import { PermissionsSelector } from './PermissionsSelector';
import { UserType, DepartmentType } from '@/types/user';
import { SearchableDropdown } from './ui/searchable-dropdown';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';

interface DepartmentUser {
  _id: string;
  userId: {
    _id: string;
    name: string;
    employeeId: number;
    email: string;
    role:{
      _id:string;
      name:string;
    }
  };
}

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
    reportingSeniorId: '',
    extraAccessControls: [] as Array<{ module: string; actions: string[] }>
  });

  const [departmentUsers, setDepartmentUsers] = useState<DepartmentUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch users when department is selected
  useEffect(() => {
    const fetchDepartmentUsers = async () => {
      if (!profileForm.departmentId) {
        setDepartmentUsers([]);
        return;
      }

      try {
        setLoadingUsers(true);
        const endpoint = ApiConfig.getUserBydepId(profileForm.departmentId);
        console.log(endpoint)
        const response = await getDataHandlerWithToken(endpoint, null, null,true);
        console.log(response)
        if (response) {
          setDepartmentUsers(response);
        }
      } catch (error) {
        console.error('Error fetching department users:', error);
        toast({
          title: "Error",
          description: "Failed to fetch department users",
          variant: "destructive",
        });
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchDepartmentUsers();
  }, [profileForm.departmentId]);

  const handleSubmit = async () => {
    if (!selectedUser) return;
    
    try {
      await onSubmit(profileForm);
      // Reset form on success
      setProfileForm({
        departmentId: '',
        education: '',
        salary: '',
        reportingSeniorId: '',
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
        reportingSeniorId: '',
        extraAccessControls: []
      });
      setDepartmentUsers([]);
    }
    onOpenChange(isOpen);
  };

  // Reset reporting senior when department changes
  const handleDepartmentChange = (value: string) => {
    setProfileForm({
      ...profileForm,
      departmentId: value,
      reportingSeniorId: '' // Reset reporting senior when department changes
    });
  };

  if (!selectedUser) return null;

  // Transform department users for searchable dropdown
  const userOptions = departmentUsers.map(user => ({
    value: user.userId._id,
    label: user.userId.name,
    empId: user.userId.employeeId,
    email: user.userId.email,
    role:user.userId.role.name,
  }));

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
              onValueChange={handleDepartmentChange}
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

          {/* Reporting Senior - Searchable Dropdown */}
          <div className="grid gap-2">
            <Label htmlFor="reportingSenior">Reporting Senior</Label>
            {!profileForm.departmentId ? (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Please select a department first to see available seniors
                </p>
              </div>
            ) : (
              <SearchableDropdown
                options={[
                  { value: "", label: "Select reporting senior..." },
                  ...userOptions
                ]}
                value={profileForm.reportingSeniorId}
                onValueChange={(value) => setProfileForm({...profileForm, reportingSeniorId: value})}
                placeholder="Select reporting senior"
                searchPlaceholder="Search by name or email..."
                emptyMessage={loadingUsers ? "Loading users..." : "No users found in this department"}
                disabled={creatingProfile || loadingUsers || departmentUsers.length === 0}
                allowClear
                onClear={() => setProfileForm({...profileForm, reportingSeniorId: ""})}
                triggerClassName="h-10 sm:h-11 text-sm sm:text-base"
                contentClassName="w-full sm:max-w-[var(--radix-popover-trigger-width)]"
              />
            )}
            
            {/* Show loading state when fetching users */}
            {profileForm.departmentId && loadingUsers && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading department users...
              </div>
            )}
            
            {/* Show user count when users are loaded */}
            {profileForm.departmentId && !loadingUsers && departmentUsers.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Users className="w-3 h-3" />
                {departmentUsers.length} user{departmentUsers.length !== 1 ? 's' : ''} available
              </div>
            )}
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