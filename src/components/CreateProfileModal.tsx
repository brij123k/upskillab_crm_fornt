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
import { cn } from '@/lib/utils';

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

    const previewUrl = URL.createObjectURL(file);
    setProfileImagePreview(previewUrl);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingProfileImage(true);
      const response = await postDataHandlerWithTokenFormData(ApiConfig.uploadImage, formData, true);
      
      if (response?.success && response?.data?.url) {
        setProfileForm({ ...profileForm, profileImage: response.data.url });
        toast({
          title: "Success",
          description: response?.message || "Profile image uploaded successfully",
        });
      } else {
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
  const displayImage = profileImagePreview || profileForm.profileImage;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[900px] rounded-2xl border-slate-200 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800">Create Profile for {selectedUser.name}</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Fill in the complete details to create the user profile
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-1 border-b border-slate-200 pb-2 mb-4 bg-transparent">
              <TabsTrigger 
                value="basic" 
                className="flex items-center gap-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              >
                <UserCircle className="w-3 h-3" />
                Basic
              </TabsTrigger>
              <TabsTrigger 
                value="address" 
                className="flex items-center gap-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              >
                <MapPin className="w-3 h-3" />
                Address
              </TabsTrigger>
              <TabsTrigger 
                value="bank" 
                className="flex items-center gap-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              >
                <Landmark className="w-3 h-3" />
                Bank
              </TabsTrigger>
              <TabsTrigger 
                value="education" 
                className="flex items-center gap-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              >
                <GraduationCap className="w-3 h-3" />
                Education
              </TabsTrigger>
              <TabsTrigger 
                value="documents" 
                className="flex items-center gap-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              >
                <FileText className="w-3 h-3" />
                Documents
              </TabsTrigger>
              <TabsTrigger 
                value="permissions" 
                className="flex items-center gap-1 data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              >
                <Lock className="w-3 h-3" />
                Permissions
              </TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              <TabsContent value="basic" className="space-y-4">
                {/* Profile Image Upload */}
                <Card className="rounded-xl border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-orange-500" />
                      Profile Image
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4">
                      {displayImage ? (
                        <div className="relative">
                          <img
                            src={displayImage}
                            alt="Profile preview"
                            className="w-20 h-20 rounded-full object-cover border-2 border-orange-200"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white shadow-md hover:bg-red-50 hover:text-red-600"
                            onClick={handleRemoveProfileImage}
                            disabled={creatingProfile || uploadingProfileImage}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                          <UserCircle className="w-10 h-10 text-slate-400" />
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
                          className="rounded-lg border-slate-200"
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
                          <p className="text-xs text-slate-500 mt-2">Uploading image, please wait...</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Basic Information */}
                <Card className="rounded-xl border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-800">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-slate-700">Department *</Label>
                        <Select 
                          value={profileForm.departmentId} 
                          onValueChange={handleDepartmentChange}
                          disabled={creatingProfile || loadingDepartments}
                        >
                          <SelectTrigger className="h-10 rounded-lg border-slate-200">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
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
                        <Label className="text-sm font-medium text-slate-700">Salary *</Label>
                        <Input
                          type="number"
                          value={profileForm.salary}
                          onChange={(e) => setProfileForm({...profileForm, salary: e.target.value})}
                          placeholder="Monthly salary"
                          disabled={creatingProfile}
                          className="h-10 rounded-lg border-slate-200 focus:ring-orange-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-slate-700">Education</Label>
                        <Input
                          value={profileForm.education}
                          onChange={(e) => setProfileForm({...profileForm, education: e.target.value})}
                          placeholder="Highest qualification"
                          disabled={creatingProfile}
                          className="h-10 rounded-lg border-slate-200 focus:ring-orange-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-slate-700">Pools</Label>
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
                          className="rounded-lg border-slate-200"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-sm font-medium text-slate-700">Reporting Senior</Label>
                        {!profileForm.departmentId ? (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800">
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
                              triggerClassName="h-10 rounded-lg border-slate-200"
                              contentClassName="rounded-lg"
                            />
                            {profileForm.departmentId && loadingUsers && (
                              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
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
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={creatingProfile} className="rounded-lg border-slate-200">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={creatingProfile || !isFormValid} className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white">
              {creatingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Profile'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <style>{`
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </Dialog>
  );
}