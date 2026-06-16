import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { UserType, PoolType } from '@/types/user';
import { Database, User, Edit, Shield, MapPin, Landmark, GraduationCap, FileText } from 'lucide-react';

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
      <DialogContent className="sm:max-w-[700px] rounded-2xl border-slate-200 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800">User Profile</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Complete profile details for {selectedUser.name}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            {/* User Basic Info */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pb-3 border-b border-slate-100">
              {selectedUser.profile?.profileImage ? (
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-orange-200 shrink-0 mx-auto sm:mx-0">
                  <img
                    src={selectedUser.profile.profileImage}
                    alt={selectedUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                  <span className="text-3xl font-medium text-orange-600">
                    {getInitials(selectedUser.name)}
                  </span>
                </div>
              )}
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-xl font-semibold text-slate-800">{selectedUser.name}</h3>
                <p className="text-sm text-slate-500">{selectedUser.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  <Badge variant="outline" className="border-slate-200 text-slate-600 rounded-full text-xs">
                    ID: {selectedUser.employeeId}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full text-xs",
                      selectedUser.status === 'active' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                      selectedUser.status === 'inactive' && 'bg-slate-100 text-slate-600 border-slate-200',
                      selectedUser.status === 'probation' && 'bg-amber-50 text-amber-700 border-amber-200',
                      selectedUser.status === 'resigned' && 'bg-red-50 text-red-700 border-red-200'
                    )}
                  >
                    {selectedUser.status}
                  </Badge>
                  {selectedUser.isBlocked && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 rounded-full text-xs">
                      Blocked
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* User Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl border border-slate-100 p-4">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Phone Number</div>
                <p className="text-sm text-slate-800 mt-1">{selectedUser.number || 'N/A'}</p>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Role</div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-medium text-slate-800">{selectedUser.role.name}</p>
                  {selectedUser.role.isSuperAdmin && (
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 rounded-full text-xs">
                      Super Admin
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Dashboard Access</div>
                <p className="text-sm text-slate-800 mt-1">
                  {selectedUser.isDashboardEnabled ? (
                    <span className="text-emerald-600">Enabled</span>
                  ) : (
                    <span className="text-red-600">Disabled</span>
                  )}
                </p>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">IVR Access</div>
                <p className="text-sm text-slate-800 mt-1">
                  {selectedUser.IVREnabled ? (
                    <span className="text-emerald-600">Enabled</span>
                  ) : (
                    <span className="text-slate-500">Disabled</span>
                  )}
                </p>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Member Since</div>
                <p className="text-sm text-slate-800 mt-1">{formatDate(selectedUser.createdAt)}</p>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Last Login</div>
                <p className="text-sm text-slate-800 mt-1">
                  {selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : 'Never'}
                </p>
              </div>
            </div>

            {/* Profile Information (if profile exists) */}
            {selectedUser.profile ? (
              <div className="space-y-5">
                {/* Employment Details */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <User className="w-4 h-4 text-orange-500" />
                      Employment Details
                    </h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-slate-500">Department</div>
                        <p className="text-sm font-medium text-slate-800 mt-0.5">
                          {selectedUser.profile.departmentId?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Education</div>
                        <p className="text-sm font-medium text-slate-800 mt-0.5">
                          {selectedUser.profile.education || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Salary</div>
                        <p className="text-sm font-medium text-slate-800 mt-0.5">
                          {selectedUser.profile.salary ? `₹${selectedUser.profile.salary.toLocaleString()}` : 'N/A'}
                        </p>
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <div className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                          <Database className="w-3 h-3" /> Pools
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedUser.profile.poolIds && selectedUser.profile.poolIds.length > 0 ? (
                            getPoolIdsToDisplay(selectedUser.profile.poolIds).map((poolId, index) => {
                              const poolName = getPoolName(poolId);
                              const poolActive = isPoolActive(poolId);
                              return (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className={cn(
                                    "rounded-full text-xs",
                                    poolActive
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : "bg-slate-100 text-slate-500 border-slate-200"
                                  )}
                                >
                                  <Database className="w-3 h-3 mr-1" />
                                  {poolName}
                                </Badge>
                              );
                            })
                          ) : (
                            <span className="text-sm text-slate-500">No pools assigned</span>
                          )}
                        </div>
                      </div>
                      <div className="col-span-1 sm:col-span-2">
                        <div className="text-xs text-slate-500">Reporting Senior</div>
                        <div className="flex items-center gap-2 mt-1">
                          {selectedUser.profile.reportingSeniorId ? (
                            <>
                              <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-orange-600">
                                  {selectedUser.profile.reportingSeniorId.name?.charAt(0) || 'S'}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-slate-800">
                                {selectedUser.profile.reportingSeniorId.name}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-slate-500">No reporting senior assigned</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                {selectedUser.profile.address && Object.values(selectedUser.profile.address).some(v => v) && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        Address Details
                      </h4>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <div className="text-xs text-slate-500">Address Line 1</div>
                          <p className="text-sm text-slate-800 mt-0.5">{selectedUser.profile.address.addressLine1 || 'N/A'}</p>
                        </div>
                        {selectedUser.profile.address.addressLine2 && (
                          <div className="col-span-2">
                            <div className="text-xs text-slate-500">Address Line 2</div>
                            <p className="text-sm text-slate-800 mt-0.5">{selectedUser.profile.address.addressLine2}</p>
                          </div>
                        )}
                        <div>
                          <div className="text-xs text-slate-500">City</div>
                          <p className="text-sm text-slate-800 mt-0.5">{selectedUser.profile.address.city || 'N/A'}</p>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">State</div>
                          <p className="text-sm text-slate-800 mt-0.5">{selectedUser.profile.address.state || 'N/A'}</p>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Country</div>
                          <p className="text-sm text-slate-800 mt-0.5">{selectedUser.profile.address.country || 'N/A'}</p>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Pincode</div>
                          <p className="text-sm text-slate-800 mt-0.5">{selectedUser.profile.address.pincode || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Details Section */}
                {selectedUser.profile.bankDetails && Object.values(selectedUser.profile.bankDetails).some(v => v) && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-orange-500" />
                        Bank Details
                      </h4>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-slate-500">Account Holder Name</div>
                          <p className="text-sm text-slate-800 mt-0.5">{selectedUser.profile.bankDetails.accountHolderName || 'N/A'}</p>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Bank Name</div>
                          <p className="text-sm text-slate-800 mt-0.5">{selectedUser.profile.bankDetails.bankName || 'N/A'}</p>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Account Number</div>
                          <p className="text-sm text-slate-800 mt-0.5">
                            {selectedUser.profile.bankDetails.accountNumber 
                              ? `****${selectedUser.profile.bankDetails.accountNumber.slice(-4)}` 
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">IFSC Code</div>
                          <p className="text-sm text-slate-800 mt-0.5">{selectedUser.profile.bankDetails.ifscCode || 'N/A'}</p>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Branch Name</div>
                          <p className="text-sm text-slate-800 mt-0.5">{selectedUser.profile.bankDetails.branchName || 'N/A'}</p>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Account Type</div>
                          <p className="text-sm text-slate-800 mt-0.5">{selectedUser.profile.bankDetails.accountType || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Educational Details Section */}
                {selectedUser.profile.educationalDetails && selectedUser.profile.educationalDetails.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-orange-500" />
                        Educational Qualifications
                      </h4>
                    </div>
                    <div className="p-4 max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                      {selectedUser.profile.educationalDetails.map((edu, idx) => (
                        <div key={idx} className="bg-slate-50 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <Badge variant="outline" className="border-slate-200 text-slate-700 rounded-full text-xs">
                              {edu.qualification}
                            </Badge>
                            <span className="text-xs text-slate-500">Year: {edu.passingYear}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-800 mt-1">{edu.instituteName}</p>
                          <p className="text-xs text-slate-500">{edu.boardOrUniversity}</p>
                          <p className="text-xs text-slate-600 mt-1">
                            <span className="text-slate-500">Percentage/CGPA:</span> {edu.percentageOrCGPA}
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
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-orange-500" />
                          Documents
                        </h4>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.profile.documents.aadhaarFront && (
                            <Button variant="outline" size="sm" onClick={() => window.open(selectedUser.profile?.documents?.aadhaarFront, '_blank')} className="rounded-lg border-slate-200">
                              Aadhaar (Front)
                            </Button>
                          )}
                          {selectedUser.profile.documents.aadhaarBack && (
                            <Button variant="outline" size="sm" onClick={() => window.open(selectedUser.profile?.documents?.aadhaarBack, '_blank')} className="rounded-lg border-slate-200">
                              Aadhaar (Back)
                            </Button>
                          )}
                          {selectedUser.profile.documents.panCard && (
                            <Button variant="outline" size="sm" onClick={() => window.open(selectedUser.profile?.documents?.panCard, '_blank')} className="rounded-lg border-slate-200">
                              PAN Card
                            </Button>
                          )}
                        </div>
                        {selectedUser.profile.documents.educationalCertificates?.length > 0 && (
                          <div>
                            <div className="text-xs text-slate-500 mb-1">Educational Certificates</div>
                            <div className="flex flex-wrap gap-2">
                              {selectedUser.profile.documents.educationalCertificates.map((cert, idx) => (
                                <Button key={idx} variant="outline" size="sm" onClick={() => window.open(cert, '_blank')} className="rounded-lg border-slate-200">
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
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                      <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-orange-500" />
                        Extra Access Controls
                      </h4>
                    </div>
                    <div className="p-4 max-h-40 overflow-y-auto custom-scrollbar space-y-2">
                      {selectedUser.profile.extraAccessControls.map((control, idx) => (
                        <div key={idx} className="bg-orange-50/50 rounded-lg p-3 border border-orange-100">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-orange-700">{control.module}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {control.actions.map((action, actionIdx) => (
                              <Badge key={actionIdx} variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200 rounded-full text-xs">
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
              // No Profile State
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                <User className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <h4 className="text-base font-semibold text-slate-800 mb-1">No Profile Found</h4>
                <p className="text-sm text-slate-500 mb-4">
                  This user doesn't have a profile yet. Create one to add department, salary, address, bank details, and other information.
                </p>
                <Button onClick={onCreateProfileClick} className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white">
                  <User className="w-4 h-4 mr-2" />
                  Create Profile
                </Button>
              </div>
            )}

            {/* Role Permissions Summary */}
            {selectedUser.role.permissions && selectedUser.role.permissions.length > 0 && (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-orange-500" />
                    Role Permissions
                  </h4>
                  <Badge variant="outline" className="border-slate-200 text-slate-600 rounded-full text-xs">
                    {selectedUser.role.name}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  {selectedUser.role.permissions.reduce((acc, p) => acc + p.actions.length, 0)} permissions across {selectedUser.role.permissions.length} modules
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedUser.role.permissions.slice(0, 3).map((perm, idx) => (
                    <Badge key={idx} variant="outline" className="border-slate-200 text-slate-600 rounded-full text-xs">
                      {perm.module} ({perm.actions.length})
                    </Badge>
                  ))}
                  {selectedUser.role.permissions.length > 3 && (
                    <Badge variant="outline" className="border-slate-200 text-slate-600 rounded-full text-xs">
                      +{selectedUser.role.permissions.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
          <div className="flex gap-3 w-full sm:w-auto">
            {onEditClick && selectedUser.profile && (
              <Button onClick={onEditClick} className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg border-slate-200">
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Hidden scrollbar style */}
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