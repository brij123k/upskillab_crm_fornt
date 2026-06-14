import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Upload, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Users, Database, UserCircle, MapPin, Landmark, GraduationCap, FileText } from 'lucide-react';
import { PermissionsSelector } from './PermissionsSelector';
import { UserType, DepartmentType, PoolType } from '@/types/user';
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
    role: {
      _id: string;
      name: string;
    }
  };
}

interface CreateProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: UserType | null;
  departments: DepartmentType[];
  pools?: PoolType[];
  loadingDepartments: boolean;
  loadingPools?: boolean;
  creatingProfile: boolean;
  onSubmit: (data: any) => Promise<void>;
}

export function CreateProfileModal({
  open,
  onOpenChange,
  selectedUser,
  departments,
  pools = [],
  loadingDepartments,
  loadingPools = false,
  creatingProfile,
  onSubmit
}: CreateProfileModalProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  
  const [profileForm, setProfileForm] = useState({
    departmentId: '',
    education: '',
    salary: '',
    reportingSeniorId: '',
    poolIds: [] as string[],
    profileImage: '',
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
        const response = await getDataHandlerWithToken(endpoint, null, null, true);
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
      
      console.log('Upload response:', response); // Debug log
      
      if (response?.success && response?.data?.url) {
        // Set the URL from response
        setProfileForm({ ...profileForm, profileImage: response.data.url });
        toast({
          title: "Success",
          description: response?.message || "Profile image uploaded successfully",
        });
      } else {
        // If upload fails, clear preview
        setProfileImagePreview('');
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setProfileImagePreview('');
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to upload profile image",
        variant: "destructive",
      });
    } finally {
      setUploadingProfileImage(false);
      // Clean up the preview URL after upload is complete
      setTimeout(() => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      }, 1000);
    }
  };

  const handleRemoveProfileImage = () => {
    setProfileForm({ ...profileForm, profileImage: '' });
    setProfileImagePreview('');
  };

  const handleSubmit = async () => {
    if (!selectedUser) return;
    
    const dataToSend = {
      userId: selectedUser._id,
      departmentId: profileForm.departmentId,
      education: profileForm.education,
      salary: profileForm.salary ? parseInt(profileForm.salary) : 0,
      reportingSeniorId: profileForm.reportingSeniorId || null,
      poolIds: profileForm.poolIds,
      profileImage: profileForm.profileImage,
      address: profileForm.address,
      bankDetails: profileForm.bankDetails,
      educationalDetails: profileForm.educationalDetails,
      documents: profileForm.documents,
      extraAccessControls: profileForm.extraAccessControls.filter(
        control => control.actions.length > 0
      )
    };
    
    console.log('Data to send:', dataToSend);
    
    try {
      await onSubmit(dataToSend);
      // Reset form on success
      setProfileForm({
        departmentId: '',
        education: '',
        salary: '',
        reportingSeniorId: '',
        poolIds: [],
        profileImage: '',
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
        educationalDetails: [],
        documents: {
          aadhaarFront: '',
          aadhaarBack: '',
          panCard: '',
          educationalCertificates: []
        },
        extraAccessControls: []
      });
      setProfileImagePreview('');
    } catch (error) {
      // Error is handled by parent component
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setProfileForm({
        departmentId: '',
        education: '',
        salary: '',
        reportingSeniorId: '',
        poolIds: [],
        profileImage: '',
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
        educationalDetails: [],
        documents: {
          aadhaarFront: '',
          aadhaarBack: '',
          panCard: '',
          educationalCertificates: []
        },
        extraAccessControls: []
      });
      setProfileImagePreview('');
      setDepartmentUsers([]);
      setActiveTab('basic');
    }
    onOpenChange(isOpen);
  };

  const handleDepartmentChange = (value: string) => {
    setProfileForm({
      ...profileForm,
      departmentId: value,
      reportingSeniorId: ''
    });
  };

  if (!selectedUser) return null;

  const userOptions = departmentUsers.map(user => ({
    value: user.userId._id,
    label: user.userId.name,
    empId: user.userId.employeeId,
    email: user.userId.email,
    role: user.userId.role?.name,
  }));

  const isFormValid = profileForm.departmentId && profileForm.salary;

  // Get the image to display (preview first, then uploaded URL)
  const displayImage = profileImagePreview || profileForm.profileImage;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Profile for {selectedUser.name}</DialogTitle>
          <DialogDescription>
            Fill in the complete details to create the user profile
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
            <TabsContent value="basic" className="space-y-4">
              {/* Profile Image Upload */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCircle className="w-4 h-4" />
                    Profile Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {displayImage ? (
                      <div className="relative">
                        <img
                          src={displayImage}
                          alt="Profile preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-primary/20"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background shadow-md hover:bg-destructive hover:text-destructive-foreground"
                          onClick={handleRemoveProfileImage}
                          disabled={creatingProfile || uploadingProfileImage}
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
                        id="profile-image"
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                        disabled={creatingProfile || uploadingProfileImage}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('profile-image')?.click()}
                        disabled={creatingProfile || uploadingProfileImage}
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
                            {profileForm.profileImage ? 'Change Image' : 'Upload Profile Image'}
                          </>
                        )}
                      </Button>
                      {uploadingProfileImage && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Uploading image, please wait...
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Department Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Department *</Label>
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

                    <div className="space-y-1">
                      <Label>Salary *</Label>
                      <Input
                        type="number"
                        value={profileForm.salary}
                        onChange={(e) => setProfileForm({...profileForm, salary: e.target.value})}
                        placeholder="Monthly salary"
                        disabled={creatingProfile}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Education</Label>
                      <Input
                        value={profileForm.education}
                        onChange={(e) => setProfileForm({...profileForm, education: e.target.value})}
                        placeholder="Highest qualification"
                        disabled={creatingProfile}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>Pools</Label>
                      <MultiSelect
                        options={pools
                          .filter(pool => pool.isActive)
                          .map(pool => ({
                            value: pool._id,
                            label: pool.name,
                            disabled: !pool.isActive
                          }))}
                        selected={profileForm.poolIds}
                        onChange={(selectedValues) => setProfileForm({ 
                          ...profileForm, 
                          poolIds: selectedValues 
                        })}
                        placeholder="Select pools..."
                        loading={loadingPools}
                        disabled={creatingProfile}
                        emptyMessage="No active pools available"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <Label>Reporting Senior</Label>
                      {!profileForm.departmentId ? (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-sm text-yellow-800">
                            Please select a department first to see available seniors
                          </p>
                        </div>
                      ) : (
                        <>
                          <SearchableDropdown
                            options={[
                              { value: "", label: "Select reporting senior..." },
                              ...userOptions
                            ]}
                            value={profileForm.reportingSeniorId}
                            onValueChange={(value) => setProfileForm({...profileForm, reportingSeniorId: value})}
                            placeholder="Select reporting senior"
                            searchPlaceholder="Search by name, email, or role..."
                            emptyMessage={loadingUsers ? "Loading users..." : "No users found in this department"}
                            disabled={creatingProfile || loadingUsers || departmentUsers.length === 0}
                            allowClear
                            onClear={() => setProfileForm({...profileForm, reportingSeniorId: ""})}
                          />
                          {profileForm.departmentId && loadingUsers && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Loading department users...
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="address">
              <AddressForm
                value={profileForm.address}
                onChange={(address) => setProfileForm({...profileForm, address})}
                disabled={creatingProfile}
              />
            </TabsContent>

            <TabsContent value="bank">
              <BankDetailsForm
                value={profileForm.bankDetails}
                onChange={(bankDetails) => setProfileForm({...profileForm, bankDetails})}
                disabled={creatingProfile}
              />
            </TabsContent>

            <TabsContent value="education">
              <EducationalDetailsForm
                value={profileForm.educationalDetails}
                onChange={(educationalDetails) => setProfileForm({...profileForm, educationalDetails})}
                disabled={creatingProfile}
              />
            </TabsContent>

            <TabsContent value="documents">
              <DocumentsUpload
                value={profileForm.documents}
                onChange={(documents) => setProfileForm({...profileForm, documents})}
                disabled={creatingProfile}
              />
            </TabsContent>

            <TabsContent value="permissions">
              <PermissionsSelector
                permissions={profileForm.extraAccessControls}
                onChange={(perms) => setProfileForm({...profileForm, extraAccessControls: perms})}
                disabled={creatingProfile}
                title="Extra Access Controls"
                description="Grant additional permissions beyond the user's role"
              />
            </TabsContent>
          </div>
        </Tabs>
        
        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={creatingProfile}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={creatingProfile || !isFormValid}>
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