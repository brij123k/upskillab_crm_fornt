import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Users, Database, UserCircle, MapPin, Landmark, GraduationCap, FileText, Lock, X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PermissionsSelector } from './PermissionsSelector';
import { UserType, RoleType, DepartmentType, PoolType } from '@/types/user';
import { SearchableDropdown } from './ui/searchable-dropdown';
import { MultiSelect } from './ui/multi-select';
import { AddressForm } from './AddressForm';
import { BankDetailsForm } from './BankDetailsForm';
import { EducationalDetailsForm } from './EducationalDetailsForm';
import { DocumentsUpload } from './DocumentUpload';
import { getDataHandlerWithToken, postDataHandlerWithTokenFormData } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';

interface DepartmentUser {
  _id: string;
  userId: {
    _id: string;
    name: string;
    employeeId: number;
    email: string;
    role?: {
      _id: string;
      name: string;
    }
  };
}

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: UserType | null;
  roles: RoleType[];
  departments: DepartmentType[];
  pools: PoolType[];
  loadingPools: boolean;
  updatingUser: boolean;
  onUpdateUser: (userId: string, data: any) => Promise<void>;
}

export function EditUserModal({
  open,
  onOpenChange,
  selectedUser,
  roles,
  departments,
  pools,
  loadingPools,
  updatingUser,
  onUpdateUser
}: EditUserModalProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [departmentUsers, setDepartmentUsers] = useState<DepartmentUser[]>([]);
  const [loadingDepartmentUsers, setLoadingDepartmentUsers] = useState(false);

  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    number: '',
    role: '',
    profileImage: '',
    departmentId: '',
    education: '',
    salary: '',
    reportingSeniorId: '',
    address: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: '',
      pincode: ''
    },
    bankDetails: {
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branchName: '',
      accountType: ''
    },
    educationalDetails: [] as Array<{
      qualification: string;
      instituteName: string;
      boardOrUniversity: string;
      passingYear: number;
      percentageOrCGPA: string;
    }>,
    documents: {
      aadhaarFront: '',
      aadhaarBack: '',
      panCard: '',
      educationalCertificates: [] as string[]
    },
    poolIds: [] as string[],
    extraAccessControls: [] as Array<{ module: string; actions: string[] }>
  });

  const fetchDepartmentUsers = async (departmentId: string) => {
    if (!departmentId) {
      setDepartmentUsers([]);
      return;
    }

    try {
      setLoadingDepartmentUsers(true);
      const endpoint = ApiConfig.getUserBydepId(departmentId);
      const response = await getDataHandlerWithToken(endpoint, { status: 'active' }, null, true);
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
      setLoadingDepartmentUsers(false);
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview immediately
    const previewUrl = URL.createObjectURL(file);
    setProfileImagePreview(previewUrl);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingProfileImage(true);
      const response = await postDataHandlerWithTokenFormData(ApiConfig.uploadImage, formData, true);
      
      if (response?.success && response?.data?.url) {
        setEditUserForm({ ...editUserForm, profileImage: response.data.url });
        toast({
          title: "Success",
          description: "Profile image uploaded successfully",
        });
        // Clear preview after successful upload
        setTimeout(() => {
          URL.revokeObjectURL(previewUrl);
          setProfileImagePreview('');
        }, 1000);
      } else {
        // Clear preview on failure
        URL.revokeObjectURL(previewUrl);
        setProfileImagePreview('');
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      URL.revokeObjectURL(previewUrl);
      setProfileImagePreview('');
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to upload profile image",
        variant: "destructive",
      });
    } finally {
      setUploadingProfileImage(false);
    }
  };

  const handleRemoveProfileImage = () => {
    setEditUserForm({ ...editUserForm, profileImage: '' });
    if (profileImagePreview) {
      URL.revokeObjectURL(profileImagePreview);
      setProfileImagePreview('');
    }
  };

  const getPoolIds = (poolData: any): string[] => {
    if (!poolData) return [];
    if (Array.isArray(poolData)) {
      return poolData.map(pool => typeof pool === 'object' ? pool._id : pool);
    }
    const singlePoolId = typeof poolData === 'object' ? poolData._id : poolData;
    return singlePoolId ? [singlePoolId] : [];
  };

  useEffect(() => {
    if (selectedUser && open) {
      setEditUserForm({
        name: selectedUser.name,
        email: selectedUser.email,
        number: selectedUser.number,
        role: selectedUser.role._id,
        departmentId: selectedUser.profile?.departmentId?._id || '',
        education: selectedUser.profile?.education || '',
        salary: selectedUser.profile?.salary?.toString() || '',
        reportingSeniorId: selectedUser.profile?.reportingSeniorId?._id || '',
        poolIds: getPoolIds(selectedUser.profile?.poolIds),
        profileImage: selectedUser.profile?.profileImage || '',
        address: selectedUser.profile?.address || {
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          country: '',
          pincode: ''
        },
        bankDetails: selectedUser.profile?.bankDetails || {
          accountHolderName: '',
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          branchName: '',
          accountType: ''
        },
        educationalDetails: selectedUser.profile?.educationalDetails || [],
        documents: selectedUser.profile?.documents || {
          aadhaarFront: '',
          aadhaarBack: '',
          panCard: '',
          educationalCertificates: []
        },
        extraAccessControls: selectedUser.profile?.extraAccessControls || []
      });
      setProfileImagePreview('');

      if (selectedUser.profile?.departmentId?._id) {
        fetchDepartmentUsers(selectedUser.profile.departmentId._id);
      }
    }
  }, [selectedUser, open]);

  const handleSubmit = async () => {
    if (!selectedUser) return;
    await onUpdateUser(selectedUser._id, editUserForm);
    if (!updatingUser) {
      onOpenChange(false);
    }
  };

  if (!selectedUser) return null;

  // Get the image to display (preview first, then uploaded URL)
  const displayImage = profileImagePreview || editUserForm.profileImage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User: {selectedUser.name}</DialogTitle>
          <DialogDescription>
            Update user information, profile, and permissions.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="basic" className="flex items-center gap-1">
              <UserCircle className="w-3 h-3" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="address" className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Address
            </TabsTrigger>
            <TabsTrigger value="bank" className="flex items-center gap-1">
              <Landmark className="w-3 h-3" />
              Bank
            </TabsTrigger>
            <TabsTrigger value="education" className="flex items-center gap-1">
              <GraduationCap className="w-3 h-3" />
              Education
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Permissions
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            {/* Basic Tab Content */}
            <TabsContent value="basic" className="space-y-4">
              {/* Profile Image Upload */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-sm mb-3">Profile Image</h4>
                <div className="flex items-center gap-4">
                  {displayImage ? (
                    <div className="relative">
                      <img
                        src={displayImage}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background shadow-md hover:bg-destructive hover:text-destructive-foreground"
                        onClick={handleRemoveProfileImage}
                        disabled={updatingUser || uploadingProfileImage}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed">
                      <UserCircle className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="edit-profile-image"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      disabled={updatingUser || uploadingProfileImage}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('edit-profile-image')?.click()}
                      disabled={updatingUser || uploadingProfileImage}
                      className="w-full sm:w-auto"
                    >
                      {uploadingProfileImage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          {editUserForm.profileImage ? 'Change Image' : 'Upload Image'}
                        </>
                      )}
                    </Button>
                    {uploadingProfileImage && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Uploading image, please wait...
                      </p>
                    )}
                    {profileImagePreview && (
                      <p className="text-xs text-blue-600 mt-2">
                        Preview mode - saving will use this image
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-sm mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={editUserForm.name}
                      onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                      disabled={updatingUser}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={editUserForm.email}
                      onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                      disabled={updatingUser}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input
                      value={editUserForm.number}
                      onChange={(e) => setEditUserForm({ ...editUserForm, number: e.target.value })}
                      disabled={updatingUser}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role *</Label>
                    <Select
                      value={editUserForm.role}
                      onValueChange={(value) => setEditUserForm({ ...editUserForm, role: value })}
                      disabled={updatingUser}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role._id} value={role._id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select
                      value={editUserForm.departmentId}
                      onValueChange={(value) => {
                        setEditUserForm({
                          ...editUserForm,
                          departmentId: value,
                          reportingSeniorId: ''
                        });
                        if (value) fetchDepartmentUsers(value);
                      }}
                      disabled={updatingUser}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept._id} value={dept._id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Salary</Label>
                    <Input
                      type="number"
                      value={editUserForm.salary}
                      onChange={(e) => setEditUserForm({ ...editUserForm, salary: e.target.value })}
                      placeholder="Monthly salary"
                      disabled={updatingUser}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Education</Label>
                    <Input
                      value={editUserForm.education}
                      onChange={(e) => setEditUserForm({ ...editUserForm, education: e.target.value })}
                      placeholder="Highest qualification"
                      disabled={updatingUser}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pools</Label>
                    <MultiSelect
                      options={pools
                        .filter(pool => pool.isActive)
                        .map(pool => ({
                          value: pool._id,
                          label: pool.name,
                          disabled: !pool.isActive
                        }))}
                      selected={editUserForm.poolIds}
                      onChange={(selectedValues) => setEditUserForm({
                        ...editUserForm,
                        poolIds: selectedValues
                      })}
                      placeholder="Select pools..."
                      loading={loadingPools}
                      disabled={updatingUser}
                      emptyMessage="No active pools available"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Reporting Senior</Label>
                    {!editUserForm.departmentId ? (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">Please select a department first</p>
                      </div>
                    ) : (
                      <>
                        <SearchableDropdown
                          options={[
                            { value: "", label: "Select reporting senior..." },
                            ...departmentUsers
                              .filter((user) => user.userId && user.userId._id)
                              .map(user => ({
                                value: user.userId._id,
                                label: user.userId.name,
                                empId: user.userId.employeeId,
                                email: user.userId.email,
                                role: user.userId.role?.name
                              }))
                          ]}
                          value={editUserForm.reportingSeniorId}
                          onValueChange={(value) => setEditUserForm({ ...editUserForm, reportingSeniorId: value })}
                          placeholder="Select reporting senior"
                          disabled={updatingUser || loadingDepartmentUsers}
                          allowClear
                        />
                        {loadingDepartmentUsers && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Loading department users...
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="address">
              <AddressForm
                value={editUserForm.address}
                onChange={(address) => setEditUserForm({ ...editUserForm, address })}
                disabled={updatingUser}
              />
            </TabsContent>

            <TabsContent value="bank">
              <BankDetailsForm
                value={editUserForm.bankDetails}
                onChange={(bankDetails) => setEditUserForm({ ...editUserForm, bankDetails })}
                disabled={updatingUser}
              />
            </TabsContent>

            <TabsContent value="education">
              <EducationalDetailsForm
                value={editUserForm.educationalDetails}
                onChange={(educationalDetails) => setEditUserForm({ ...editUserForm, educationalDetails })}
                disabled={updatingUser}
              />
            </TabsContent>

            <TabsContent value="documents">
              <DocumentsUpload
                value={editUserForm.documents}
                onChange={(documents) => setEditUserForm({ ...editUserForm, documents })}
                disabled={updatingUser}
              />
            </TabsContent>

            <TabsContent value="permissions">
              <PermissionsSelector
                permissions={editUserForm.extraAccessControls}
                onChange={(perms) => setEditUserForm({ ...editUserForm, extraAccessControls: perms })}
                disabled={updatingUser}
                title="Extra Access Controls"
                description="Grant additional permissions beyond the user's role"
              />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updatingUser}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updatingUser}>
            {updatingUser ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update User'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}