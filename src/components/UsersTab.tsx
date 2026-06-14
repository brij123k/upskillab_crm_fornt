import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Activity, CalendarDays, Phone } from 'lucide-react';
import { AssignIVRModal } from './AssignIVRModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search, MoreHorizontal, Edit, Eye, Ban, CheckCircle, LogOut,
  Clock, Key, Filter, ChevronUp, ChevronDown, RefreshCw, Loader2,
  User, Users, Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserType, RoleType, DepartmentType, PoolType } from '@/types/user';
import { CreateProfileModal } from './CreateProfileModal';
import { ViewUserProfileModal } from './ViewUserProfileModal';
import { EditUserModal } from './EditUserModal';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface UsersTabProps {
  users: UserType[];
  roles: RoleType[];
  departments: DepartmentType[];
  pools?: PoolType[];
  loading: boolean;
  loadingPools?: boolean;
  fetchingData: boolean;
  onRefresh: (query?: { status?: string }) => Promise<void>;
  onUpdateUser: (userId: string, data: any) => Promise<void>;
  onUpdateStatus: (userId: string, status: string) => Promise<void>;
  onToggleBlock: (userId: string) => Promise<void>;
  onCreateProfile: (userId: string, data: any) => Promise<void>;
}

export function UsersTab({
  users,
  roles,
  departments,
  pools = [],
  loading,
  loadingPools = false,
  fetchingData,
  onRefresh,
  onUpdateUser,
  onUpdateStatus,
  onToggleBlock,
  onCreateProfile
}: UsersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'active',
    pool: 'all',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [profileCreateModalOpen, setProfileCreateModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('active');

  // Loading states
  const [updatingUser, setUpdatingUser] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [togglingBlock, setTogglingBlock] = useState<string | null>(null);
  const [creatingProfile, setCreatingProfile] = useState(false);

  const [ivrModalOpen, setIvrModalOpen] = useState(false);
  const [selectedIVRUser, setSelectedIVRUser] = useState<UserType | null>(null);
  const hasMountedRef = useRef(false);
  const navigate = useNavigate();

  // Filter users
  const filteredUsers = users.filter(user => {
    const searchMatch =
      user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.number.includes(filters.search);

    const roleMatch = filters.role === 'all' || user.role._id === filters.role;
    const statusMatch = filters.status === 'all' || user.status === filters.status;

    let poolMatch = true;
    if (filters.pool !== 'all') {
      if (filters.pool === 'none') {
        poolMatch = !user.profile?.poolIds || user.profile.poolIds.length === 0;
      } else {
        const userPoolIds = user.profile?.poolIds?.map(poolId =>
          typeof poolId === 'object' ? poolId._id : poolId
        ) || [];
        poolMatch = userPoolIds.includes(filters.pool);
      }
    }

    return searchMatch && roleMatch && statusMatch && poolMatch;
  });

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    onRefresh({ status: filters.status });
  }, [filters.status, onRefresh]);

  const getPoolName = (poolId: any): string => {
    if (!poolId) return 'Not Assigned';
    if (typeof poolId === 'object' && poolId.name) return poolId.name;
    const foundPool = pools.find(p => p._id === poolId);
    return foundPool?.name || 'Unknown Pool';
  };

  const isPoolActive = (poolId: any): boolean => {
    if (!poolId) return false;
    if (typeof poolId === 'object' && poolId.isActive !== undefined) return poolId.isActive;
    const foundPool = pools.find(p => p._id === poolId);
    return foundPool?.isActive || false;
  };

  const getPoolIdsToDisplay = (poolData: any): string[] => {
    if (!poolData) return [];
    if (Array.isArray(poolData)) {
      return poolData.map(pool => typeof pool === 'object' ? pool._id : pool);
    }
    const singlePoolId = typeof poolData === 'object' ? poolData._id : poolData;
    return singlePoolId ? [singlePoolId] : [];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const resetFilters = () => {
    setFilters({
      role: 'all',
      status: 'all',
      pool: 'all',
      search: ''
    });
    setSearchQuery('');
  };

  const handleAssignIVR = (user: UserType) => {
    setSelectedIVRUser(user);
    setIvrModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedUser) return;
    setUpdatingStatus(true);
    try {
      await onUpdateStatus(selectedUser._id, selectedStatus);
      setStatusModalOpen(false);
      setSelectedUser(null);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleToggleBlock = async (userId: string) => {
    setTogglingBlock(userId);
    try {
      await onToggleBlock(userId);
    } finally {
      setTogglingBlock(null);
    }
  };

  const handleCreateProfile = async (data: any) => {
    console.log('Data to send2:', data); 
    if (!selectedUser) return;
    setCreatingProfile(true);
    try {
      await onCreateProfile(selectedUser._id, data);
      setProfileCreateModalOpen(false);
      setSelectedUser(null);
    } finally {
      setCreatingProfile(false);
    }
  };

  const handleEditClick = (user: UserType) => {
    setSelectedUser(user);
    setEditUserOpen(true);
  };

  const handleViewProfileClick = (user: UserType) => {
    setSelectedUser(user);
    setProfileModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? (
            <>
              Hide Filters
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Show Filters
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </Button>

        {showFilters && (
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Filters
          </Button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={filters.role} onValueChange={(value) => setFilters({ ...filters, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="probation">Probation</SelectItem>
                    <SelectItem value="resigned">Resigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pool</Label>
                <Select value={filters.pool} onValueChange={(value) => setFilters({ ...filters, pool: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All pools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pools</SelectItem>
                    <SelectItem value="none">Not Assigned</SelectItem>
                    {pools.filter(pool => pool.isActive).map((pool) => (
                      <SelectItem key={pool._id} value={pool._id}>
                        {pool.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              All Users ({filteredUsers.length})
              {loading && (
                <span className="ml-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                  Loading...
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Quick search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Loading users...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Pool</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const created = formatDateTime(user.createdAt);
                  return (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-8 rounded-2xl bg-primary/10 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors"
                            onClick={() => {
                              navigator.clipboard.writeText(user.employeeId.toString());
                              toast.success("Employee ID copied");
                            }}
                            title="Click to copy Employee ID"
                          >
                            <span className="text-xs font-medium text-primary">
                              {user.employeeId}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <span>Joined {created.date}</span>
                              <span className="text-[10px]">at {created.time}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{user.email}</div>
                          <div className="text-xs text-muted-foreground">{user.number}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn(
                          user.role.isSuperAdmin && "bg-purple-100 text-purple-800 hover:bg-purple-100"
                        )}>
                          {user.role.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.profile?.poolIds && user.profile.poolIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {getPoolIdsToDisplay(user.profile.poolIds).map((poolId, index) => {
                              const poolName = getPoolName(poolId);
                              const poolActive = isPoolActive(poolId);
                              return (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className={cn(
                                    "flex items-center gap-1 text-xs",
                                    poolActive
                                      ? "border-blue-200 bg-blue-50 text-blue-700"
                                      : "border-gray-200 bg-gray-50 text-gray-500"
                                  )}
                                >
                                  <Database className="w-3 h-3" />
                                  {poolName}
                                </Badge>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              user.status === 'active'
                                ? 'border-green-500 text-green-700 bg-green-50'
                                : user.status === 'inactive'
                                  ? 'border-gray-500 text-gray-700 bg-gray-50'
                                  : user.status === 'probation'
                                    ? 'border-yellow-500 text-yellow-700 bg-yellow-50'
                                    : 'border-red-500 text-red-700 bg-red-50'
                            )}
                          >
                            {user.status}
                          </Badge>
                          {user.isBlocked && (
                            <Badge variant="destructive" className="text-xs ml-1">
                              Blocked
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={togglingBlock === user._id}>
                              {togglingBlock === user._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleViewProfileClick(user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditClick(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/user-activity/${user._id}`)}>
                              <Activity className="mr-2 h-4 w-4" />
                              View Activity Log
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/attendance/${user._id}`)}>
                              <CalendarDays className="mr-2 h-4 w-4" />
                              View Attendance
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setSelectedStatus(user.status);
                                setStatusModalOpen(true);
                              }}
                            >
                              {user.status === 'active' ? (
                                <CheckCircle className="mr-2 h-4 w-4" />
                              ) : user.status === 'probation' ? (
                                <Clock className="mr-2 h-4 w-4" />
                              ) : user.status === 'resigned' ? (
                                <LogOut className="mr-2 h-4 w-4" />
                              ) : (
                                <Clock className="mr-2 h-4 w-4" />
                              )}
                              Change Status
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAssignIVR(user)}
                              disabled={user.IVREnabled === true}
                              className={cn(user.IVREnabled === true && "opacity-50 cursor-not-allowed")}
                            >
                              <Phone className="mr-2 h-4 w-4" />
                              {user.IVREnabled ? "IVR Enabled" : "Assign IVR Access"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleBlock(user._id)}>
                              {user.isBlocked ? (
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              ) : (
                                <Ban className="mr-2 h-4 w-4 text-destructive" />
                              )}
                              <span className={user.isBlocked ? "text-green-600" : "text-destructive"}>
                                {user.isBlocked ? 'Unblock User' : 'Block User'}
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info("Password reset feature coming soon")}>
                              <Key className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Profile Modal */}
      <ViewUserProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        selectedUser={selectedUser}
        pools={pools}
        onEditClick={() => {
          setProfileModalOpen(false);
          if (selectedUser) {
            handleEditClick(selectedUser);
          }
        }}
        onCreateProfileClick={() => {
          setProfileModalOpen(false);
          setProfileCreateModalOpen(true);
        }}
      />

      {/* Edit User Modal */}
      <EditUserModal
        open={editUserOpen}
        onOpenChange={setEditUserOpen}
        selectedUser={selectedUser}
        roles={roles}
        departments={departments}
        pools={pools}
        loadingPools={loadingPools}
        updatingUser={updatingUser}
        onUpdateUser={onUpdateUser}
      />

      {/* Status Update Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>Update Status</DialogTitle>
                <DialogDescription>Update status for {selectedUser.name}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Select Status</Label>
                  <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)} disabled={updatingStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="probation">Probation</SelectItem>
                      <SelectItem value="resigned">Resigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStatusModalOpen(false)} disabled={updatingStatus}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateStatus} disabled={updatingStatus}>
                  {updatingStatus ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Profile Modal */}
      <CreateProfileModal
        open={profileCreateModalOpen}
        onOpenChange={setProfileCreateModalOpen}
        selectedUser={selectedUser}
        departments={departments}
        pools={pools}
        loadingDepartments={loading}
        loadingPools={loadingPools}
        creatingProfile={creatingProfile}
        onSubmit={handleCreateProfile}
      />

      {/* Assign IVR Modal */}
      <AssignIVRModal
        open={ivrModalOpen}
        onOpenChange={setIvrModalOpen}
        user={selectedIVRUser}
        onSuccess={() => onRefresh()}
      />
    </div>
  );
}