// src/components/ViewUserProfileModal.tsx
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { UserType, PoolType } from '@/types/user';
import { Database, User,Edit } from 'lucide-react';

interface ViewUserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: UserType | null;
  pools: PoolType[];
  onEditClick?: () => void;
  onCreateProfileClick?: () => void;
}

export function ViewUserProfileModal({
  open,
  onOpenChange,
  selectedUser,
  pools,
  onEditClick,
  onCreateProfileClick
}: ViewUserProfileModalProps) {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPoolName = (poolId: any): string => {
    if (!poolId) return 'Not Assigned';
    if (typeof poolId === 'object' && poolId.name) return poolId.name;
    const foundPool = pools.find(p => p._id === poolId);
    return foundPool?.name || 'Unknown Pool';
  };

  const getPoolIdsToDisplay = (poolData: any): string[] => {
    if (!poolData) return [];
    if (Array.isArray(poolData)) {
      return poolData.map(pool => typeof pool === 'object' ? pool._id : pool);
    }
    const singlePoolId = typeof poolData === 'object' ? poolData._id : poolData;
    return singlePoolId ? [singlePoolId] : [];
  };

  const isPoolActive = (poolId: any): boolean => {
    if (!poolId) return false;
    if (typeof poolId === 'object' && poolId.isActive !== undefined) return poolId.isActive;
    const foundPool = pools.find(p => p._id === poolId);
    return foundPool?.isActive || false;
  };

  if (!selectedUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] h-auto overflow-hidden flex flex-col p-0">
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-lg sm:text-xl">User Profile</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Complete profile details for {selectedUser.name}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-6">
            {/* User Basic Info - Avatar and Profile Image */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              {selectedUser.profile?.profileImage ? (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-primary/20 mx-auto sm:mx-0">
                  <img
                    src={selectedUser.profile.profileImage}
                    alt={selectedUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto sm:mx-0">
                  <span className="text-3xl sm:text-4xl font-medium text-primary">
                    {getInitials(selectedUser.name)}
                  </span>
                </div>
              )}
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-xl sm:text-2xl font-semibold">{selectedUser.name}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{selectedUser.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    ID: {selectedUser.employeeId}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      selectedUser.status === 'active' && 'border-green-500 text-green-700 bg-green-50',
                      selectedUser.status === 'inactive' && 'border-gray-500 text-gray-700 bg-gray-50',
                      selectedUser.status === 'probation' && 'border-yellow-500 text-yellow-700 bg-yellow-50',
                      selectedUser.status === 'resigned' && 'border-red-500 text-red-700 bg-red-50'
                    )}
                  >
                    {selectedUser.status}
                  </Badge>
                  {selectedUser.isBlocked && (
                    <Badge variant="destructive" className="text-xs">Blocked</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* User Details Grid - Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
              <div>
                <Label className="text-xs text-muted-foreground">Phone Number</Label>
                <p className="text-sm font-medium mt-1">{selectedUser.number || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Role</Label>
                <p className="text-sm font-medium mt-1">
                  {selectedUser.role.name}
                  {selectedUser.role.isSuperAdmin && (
                    <Badge variant="secondary" className="ml-2 text-xs bg-purple-100 text-purple-800">
                      Super Admin
                    </Badge>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Dashboard Access</Label>
                <p className="text-sm font-medium mt-1">
                  {selectedUser.isDashboardEnabled ? (
                    <span className="text-green-600">Enabled</span>
                  ) : (
                    <span className="text-red-600">Disabled</span>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">IVR Access</Label>
                <p className="text-sm font-medium mt-1">
                  {selectedUser.IVREnabled ? (
                    <span className="text-green-600">Enabled</span>
                  ) : (
                    <span className="text-gray-600">Disabled</span>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Member Since</Label>
                <p className="text-sm font-medium mt-1">{formatDate(selectedUser.createdAt)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Last Login</Label>
                <p className="text-sm font-medium mt-1">
                  {selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : 'Never'}
                </p>
              </div>
            </div>

            {/* Profile Details Section */}
            {selectedUser.profile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-base">Profile Information</h4>
                  <Badge variant="outline" className="text-xs">
                    Created: {formatDate(selectedUser.profile.createdAt)}
                  </Badge>
                </div>

                {/* Employment Details */}
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium text-sm mb-3">Employment Details</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-muted/20 p-3 rounded-md">
                      <Label className="text-xs text-muted-foreground">Department</Label>
                      <p className="text-sm font-medium mt-1">{selectedUser.profile.departmentId?.name || 'N/A'}</p>
                    </div>
                    <div className="bg-muted/20 p-3 rounded-md">
                      <Label className="text-xs text-muted-foreground">Education</Label>
                      <p className="text-sm font-medium mt-1">{selectedUser.profile.education || 'N/A'}</p>
                    </div>
                    <div className="bg-muted/20 p-3 rounded-md">
                      <Label className="text-xs text-muted-foreground">Salary</Label>
                      <p className="text-sm font-medium mt-1">
                        {selectedUser.profile.salary ? `₹${selectedUser.profile.salary.toLocaleString()}` : 'N/A'}
                      </p>
                    </div>
                    <div className="bg-muted/20 p-3 rounded-md col-span-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                        <Database className="w-3 h-3" />
                        Pools
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.profile.poolIds && selectedUser.profile.poolIds.length > 0 ? (
                          getPoolIdsToDisplay(selectedUser.profile.poolIds).map((poolId, index) => {
                            const poolName = getPoolName(poolId);
                            const poolActive = isPoolActive(poolId);
                            return (
                              <Badge
                                key={index}
                                variant="outline"
                                className={cn(
                                  "flex items-center gap-1",
                                  poolActive
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-gray-50 text-gray-500 border-gray-200"
                                )}
                              >
                                <Database className="w-3 h-3" />
                                {poolName}
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-sm text-muted-foreground">No pools assigned</span>
                        )}
                      </div>
                    </div>
                    <div className="bg-muted/20 p-3 rounded-md col-span-2">
                      <Label className="text-xs text-muted-foreground">Reporting Senior</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedUser.profile.reportingSeniorId ? (
                          <>
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {selectedUser.profile.reportingSeniorId.name?.charAt(0) || 'S'}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{selectedUser.profile.reportingSeniorId.name}</p>
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">No reporting senior assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                {selectedUser.profile.address && Object.values(selectedUser.profile.address).some(v => v) && (
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium text-sm mb-3">Address Details</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Address Line 1</Label>
                        <p className="text-sm mt-1">{selectedUser.profile.address.addressLine1 || 'N/A'}</p>
                      </div>
                      {selectedUser.profile.address.addressLine2 && (
                        <div className="col-span-2">
                          <Label className="text-xs text-muted-foreground">Address Line 2</Label>
                          <p className="text-sm mt-1">{selectedUser.profile.address.addressLine2}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs text-muted-foreground">City</Label>
                        <p className="text-sm mt-1">{selectedUser.profile.address.city || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">State</Label>
                        <p className="text-sm mt-1">{selectedUser.profile.address.state || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Country</Label>
                        <p className="text-sm mt-1">{selectedUser.profile.address.country || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Pincode</Label>
                        <p className="text-sm mt-1">{selectedUser.profile.address.pincode || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Details Section */}
                {selectedUser.profile.bankDetails && Object.values(selectedUser.profile.bankDetails).some(v => v) && (
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium text-sm mb-3">Bank Details</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Account Holder Name</Label>
                        <p className="text-sm mt-1">{selectedUser.profile.bankDetails.accountHolderName || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Bank Name</Label>
                        <p className="text-sm mt-1">{selectedUser.profile.bankDetails.bankName || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Account Number</Label>
                        <p className="text-sm mt-1">
                          {selectedUser.profile.bankDetails.accountNumber 
                            ? `****${selectedUser.profile.bankDetails.accountNumber.slice(-4)}` 
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">IFSC Code</Label>
                        <p className="text-sm mt-1">{selectedUser.profile.bankDetails.ifscCode || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Branch Name</Label>
                        <p className="text-sm mt-1">{selectedUser.profile.bankDetails.branchName || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Account Type</Label>
                        <p className="text-sm mt-1">{selectedUser.profile.bankDetails.accountType || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Educational Details Section */}
                {selectedUser.profile.educationalDetails && selectedUser.profile.educationalDetails.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium text-sm mb-3">Educational Qualifications</h5>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {selectedUser.profile.educationalDetails.map((edu, idx) => (
                        <div key={idx} className="bg-muted/20 p-3 rounded-md">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="text-xs">{edu.qualification}</Badge>
                            <span className="text-xs text-muted-foreground">Passing Year: {edu.passingYear}</span>
                          </div>
                          <p className="text-sm font-medium">{edu.instituteName}</p>
                          <p className="text-xs text-muted-foreground mt-1">{edu.boardOrUniversity}</p>
                          <p className="text-sm mt-2">
                            <span className="text-xs text-muted-foreground">Percentage/CGPA: </span>
                            <span className="font-medium">{edu.percentageOrCGPA}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents Section */}
                {selectedUser.profile.documents && (
                  (selectedUser.profile.documents.aadhaarFront || 
                   selectedUser.profile.documents.aadhaarBack || 
                   selectedUser.profile.documents.panCard ||
                   (selectedUser.profile.documents.educationalCertificates?.length > 0)) && (
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium text-sm mb-3">Documents</h5>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {selectedUser.profile.documents.aadhaarFront && (
                            <Button variant="outline" size="sm" onClick={() => window.open(selectedUser.profile?.documents?.aadhaarFront, '_blank')}>
                              Aadhaar (Front)
                            </Button>
                          )}
                          {selectedUser.profile.documents.aadhaarBack && (
                            <Button variant="outline" size="sm" onClick={() => window.open(selectedUser.profile?.documents?.aadhaarBack, '_blank')}>
                              Aadhaar (Back)
                            </Button>
                          )}
                          {selectedUser.profile.documents.panCard && (
                            <Button variant="outline" size="sm" onClick={() => window.open(selectedUser.profile?.documents?.panCard, '_blank')}>
                              PAN Card
                            </Button>
                          )}
                        </div>
                        {selectedUser.profile.documents.educationalCertificates?.length > 0 && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Educational Certificates</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {selectedUser.profile.documents.educationalCertificates.map((cert, idx) => (
                                <Button key={idx} variant="outline" size="sm" onClick={() => window.open(cert, '_blank')}>
                                  Certificate {idx + 1}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}

                {/* Extra Access Controls */}
                {selectedUser.profile.extraAccessControls && selectedUser.profile.extraAccessControls.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-sm">Extra Access Controls</h5>
                      <Badge variant="secondary" className="text-xs">
                        {selectedUser.profile.extraAccessControls.length} modules
                      </Badge>
                    </div>
                    <div className="space-y-3 max-h-40 overflow-y-auto">
                      {selectedUser.profile.extraAccessControls.map((control, idx) => (
                        <div key={idx} className="bg-blue-50/50 p-3 rounded-md border border-blue-100">
                          <span className="text-xs font-medium text-blue-700">{control.module}</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {control.actions.map((action, actionIdx) => (
                              <Badge key={actionIdx} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <User className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <h4 className="text-base font-medium mb-1">No Profile Found</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  This user doesn't have a profile yet. Create one to add department, salary, address, bank details, and other information.
                </p>
                <Button onClick={onCreateProfileClick} className="w-full sm:w-auto">
                  <User className="w-4 h-4 mr-2" />
                  Create Profile
                </Button>
              </div>
            )}

            {/* Role Permissions Summary */}
            {selectedUser.role.permissions && selectedUser.role.permissions.length > 0 && (
              <div className="border rounded-lg p-4 bg-muted/10">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Role Permissions</h4>
                  <Badge variant="outline" className="text-xs">{selectedUser.role.name}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  This user has {selectedUser.role.permissions.reduce((acc, p) => acc + p.actions.length, 0)} permissions across {selectedUser.role.permissions.length} modules
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedUser.role.permissions.slice(0, 3).map((perm, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs bg-background">
                      {perm.module} ({perm.actions.length})
                    </Badge>
                  ))}
                  {selectedUser.role.permissions.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{selectedUser.role.permissions.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="px-6 py-4 border-t shrink-0 gap-2">
          {onEditClick && selectedUser.profile && (
            <Button onClick={onEditClick}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}