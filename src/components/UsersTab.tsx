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
import { Activity, CalendarDays, Phone,Copy } from 'lucide-react';
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
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
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
// Format date to DD-MM-YY


// For joined date (only date, no time)
const formatJoinedDate = (dateString: string) => {
  return formatDate(dateString);
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

      <Card className="rounded-xl border-slate-200 shadow-sm overflow-hidden">
  <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 px-6 py-4">
    <CardTitle className="text-base font-semibold text-slate-800">
      All Users ({filteredUsers.length})
      {loading && <Loader2 className="w-3 h-3 inline animate-spin ml-2 text-slate-400" />}
    </CardTitle>
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
      <Input
        placeholder="Quick search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-8 h-9 w-64 text-sm rounded-lg border-slate-200 focus:ring-orange-500"
      />
    </div>
  </CardHeader>
  <CardContent className="p-0">
    {loading ? (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
        <p className="mt-2 text-sm text-slate-500">Loading users...</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Emp Id.</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">User</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Contact</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Role</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Pool</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Status</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Last Login</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                {/* User column */}
                <td className="px-3 py-2">
  <button
    onClick={() => {
      navigator.clipboard.writeText(user.employeeId.toString());
      toast.success("Employee ID copied");
    }}
    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-orange-100 text-slate-700 hover:text-orange-700 transition-all text-xs font-medium"
    title="Click to copy Employee ID"
  >
    <Copy className="w-3 h-3" />
    {user.employeeId}
  </button>
</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-3">  
                    <div>
                      <div className="font-medium text-slate-800">{user.name}</div>
                      <div className="text-xs text-slate-400">
                        Joined {formatJoinedDate(user.createdAt)}
                      </div>
                    </div>
                  </div>
                </td>
                {/* Contact column */}
                <td className="px-3 py-2">
                  <div className="text-sm text-slate-700">{user.email}</div>
                  <div className="text-xs text-slate-400">{user.number}</div>
                </td>
                {/* Role column – plain text with orange for super admin */}
                <td className="px-3 py-2">
                  <span className={cn(
                    "text-sm",
                    user.role.isSuperAdmin && "text-orange-600 font-medium"
                  )}>
                    {user.role.name}
                  </span>
                </td>
                {/* Pool column – show shortName if available */}
                <td className="px-3 py-2">
                  {user.profile?.poolIds && user.profile.poolIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {getPoolIdsToDisplay(user.profile.poolIds).map((poolId, index) => {
                        const pool = pools.find(p => p._id === poolId);
                        const poolName = pool?.shortName || pool?.name || 'Unknown';
                        const poolActive = pool?.isActive || false;
                        return (
                          <Badge
                            key={index}
                            variant="outline"
                            className={cn(
                              "flex items-center gap-1 text-xs rounded-full",
                              poolActive
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            )}
                          >
                            <Database className="w-3 h-3" />
                            {poolName}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                {/* Status column – coloured dot + text, no badge */}
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      user.status === 'active' && "bg-emerald-500",
                      user.status === 'inactive' && "bg-slate-400",
                      user.status === 'probation' && "bg-amber-500",
                      user.status === 'resigned' && "bg-red-500"
                    )} />
                    <span className="text-sm text-slate-700 capitalize">{user.status}</span>
                    {user.isBlocked && (
                      <span className="text-xs text-red-600 ml-1">(Blocked)</span>
                    )}
                  </div>
                </td>
                {/* Last Login column */}
                <td className="px-3 py-2">
                  <span className="text-sm text-slate-700">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                  </span>
                </td>
                {/* Actions dropdown */}
                <td className="px-3 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={togglingBlock === user._id} className="h-7 w-7 rounded-lg">
                        {togglingBlock === user._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-3.5 w-3.5 text-slate-500" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-lg border-slate-200">
                      <DropdownMenuItem onClick={() => handleViewProfileClick(user)} className="text-sm">
                        <Eye className="mr-2 h-3.5 w-3.5" /> View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditClick(user)} className="text-sm">
                        <Edit className="mr-2 h-3.5 w-3.5" /> Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/admin/user-activity/${user._id}`)} className="text-sm">
                        <Activity className="mr-2 h-3.5 w-3.5" /> View Activity
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/admin/attendance/${user._id}`)} className="text-sm">
                        <CalendarDays className="mr-2 h-3.5 w-3.5" /> View Attendance
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSelectedUser(user); setSelectedStatus(user.status); setStatusModalOpen(true); }} className="text-sm">
                        {user.status === 'active' ? <CheckCircle className="mr-2 h-3.5 w-3.5" /> : <Clock className="mr-2 h-3.5 w-3.5" />}
                        Change Status
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleAssignIVR(user)}
                        disabled={user.IVREnabled === true}
                        className={cn(user.IVREnabled === true && "opacity-50 cursor-not-allowed", "text-sm")}
                      >
                        <Phone className="mr-2 h-3.5 w-3.5" />
                        {user.IVREnabled ? "IVR Enabled" : "Assign IVR"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleBlock(user._id)} className="text-sm">
                        {user.isBlocked ? (
                          <CheckCircle className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Ban className="mr-2 h-3.5 w-3.5 text-red-600" />
                        )}
                        <span className={user.isBlocked ? "text-emerald-600" : "text-red-600"}>
                          {user.isBlocked ? 'Unblock User' : 'Block User'}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Password reset feature coming soon")} className="text-sm">
                        <Key className="mr-2 h-3.5 w-3.5" /> Reset Password
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  <DialogContent className="sm:max-w-[400px] rounded-2xl border-slate-200 p-0 overflow-hidden">
    {selectedUser && (
      <>
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800">Update Status</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Update status for {selectedUser.name}
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Select Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value: any) => setSelectedStatus(value)}
                disabled={updatingStatus}
              >
                <SelectTrigger className="h-10 rounded-xl border-slate-200">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="probation">Probation</SelectItem>
                  <SelectItem value="resigned">Resigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setStatusModalOpen(false)}
              disabled={updatingStatus}
              className="rounded-xl border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={updatingStatus}
              className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
            >
              {updatingStatus ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
              ) : (
                'Update Status'
              )}
            </Button>
          </div>
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