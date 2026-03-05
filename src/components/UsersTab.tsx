import { useState } from 'react';
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
import { PermissionsSelector } from './PermissionsSelector';
import { UserType, RoleType, DepartmentType, PoolType } from '@/types/user';
import { CreateProfileModal } from './CreateProfileModal';
import { toast } from 'sonner';
import { SearchableDropdown } from './ui/searchable-dropdown';
import ApiConfig from '@/config/apiConfig';
import { getDataHandlerWithToken } from '@/config/services';

interface UsersTabProps {
  users: UserType[];
  roles: RoleType[];
  departments: DepartmentType[];
  pools?: PoolType[]; // Add pools prop
  loading: boolean;
  loadingPools?: boolean; // Add loading for pools
  fetchingData: boolean;
  onRefresh: () => Promise<void>;
  onUpdateUser: (userId: string, data: any) => Promise<void>;
  onUpdateStatus: (userId: string, status: string) => Promise<void>;
  onToggleBlock: (userId: string) => Promise<void>;
  onCreateProfile: (userId: string, data: any) => Promise<void>;
}

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

export function UsersTab({
  users,
  roles,
  departments,
  pools = [], // Default to empty array
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
    status: 'all',
    pool: 'all', // Add pool filter
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
  const [departmentUsers, setDepartmentUsers] = useState<DepartmentUser[]>([]);
  const [loadingDepartmentUsers, setLoadingDepartmentUsers] = useState(false);

  // Form states
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    number: '',
    role: '',
    departmentId: '',
    education: '',
    salary: '',
    reportingSeniorId: '',
    poolId: '', // Add poolId field
    extraAccessControls: [] as Array<{ module: string; actions: string[] }>
  });

  // Filter users
  const filteredUsers = users.filter(user => {
    const searchMatch =
      user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.number.includes(filters.search);

    const roleMatch = filters.role === 'all' || user.role._id === filters.role;
    const statusMatch = filters.status === 'all' || user.status === filters.status;
    
    // Pool filter
    let poolMatch = true;
    if (filters.pool !== 'all') {
      if (filters.pool === 'none') {
        poolMatch = !user.profile?.poolId;
      } else {
        const userPoolId = typeof user.profile?.poolId === 'object' 
          ? user.profile.poolId._id 
          : user.profile?.poolId;
        poolMatch = userPoolId === filters.pool;
      }
    }

    return searchMatch && roleMatch && statusMatch && poolMatch;
  });

  const fetchDepartmentUsers = async (departmentId: string) => {
    if (!departmentId) {
      setDepartmentUsers([]);
      return;
    }

    try {
      setLoadingDepartmentUsers(true);
      const endpoint = ApiConfig.getUserBydepId(departmentId);
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
      setLoadingDepartmentUsers(false);
    }
  };

  const handleEditUserOpen = (user: UserType) => {
    setSelectedUser(user);
    setEditUserForm({
      name: user.name,
      email: user.email,
      number: user.number,
      role: user.role._id,
      departmentId: user.profile?.departmentId?._id || '',
      education: user.profile?.education || '',
      salary: user.profile?.salary?.toString() || '',
      reportingSeniorId: user.profile?.reportingSeniorId?._id || '',
      poolId: typeof user.profile?.poolId === 'object' 
        ? user.profile.poolId._id 
        : user.profile?.poolId || '',
      extraAccessControls: user.profile?.extraAccessControls || []
    });
    
    // Fetch users for the department if it exists
    if (user.profile?.departmentId?._id) {
      fetchDepartmentUsers(user.profile.departmentId._id);
    }
    
    setEditUserOpen(true);
  };

  // Helper functions
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setUpdatingUser(true);
    try {
      await onUpdateUser(selectedUser._id, editUserForm);
      setEditUserOpen(false);
      setSelectedUser(null);
    } finally {
      setUpdatingUser(false);
    }
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

  const getPoolName = (poolId: any): string => {
    if (!poolId) return 'Not Assigned';
    if (typeof poolId === 'object' && poolId.name) return poolId.name;
    
    // Try to find pool in pools array
    const foundPool = pools.find(p => p._id === poolId);
    return foundPool?.name || 'Unknown Pool';
  };

  const isPoolActive = (poolId: any): boolean => {
    if (!poolId) return false;
    if (typeof poolId === 'object' && poolId.isActive !== undefined) return poolId.isActive;
    
    // Try to find pool in pools array
    const foundPool = pools.find(p => p._id === poolId);
    return foundPool?.isActive || false;
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
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
          >
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
                <Select
                  value={filters.role}
                  onValueChange={(value) => setFilters({ ...filters, role: value })}
                >
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
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
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
                <Select
                  value={filters.pool}
                  onValueChange={(value) => setFilters({ ...filters, pool: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All pools" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pools</SelectItem>
                    <SelectItem value="none">Not Assigned</SelectItem>
                    {pools
                      .filter(pool => pool.isActive)
                      .map((pool) => (
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
                  const poolName = getPoolName(user.profile?.poolId);
                  const poolActive = isPoolActive(user.profile?.poolId);
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
                        {user.profile?.poolId ? (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "flex items-center gap-1",
                              poolActive 
                                ? "border-blue-200 bg-blue-50 text-blue-700" 
                                : "border-gray-200 bg-gray-50 text-gray-500"
                            )}
                          >
                            <Database className="w-3 h-3" />
                            {poolName}
                          </Badge>
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
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setProfileModalOpen(true);
                              }}
                              disabled={togglingBlock === user._id}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditUserOpen(user)}
                              disabled={togglingBlock === user._id}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setSelectedStatus(user.status);
                                setStatusModalOpen(true);
                              }}
                              disabled={togglingBlock === user._id}
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
                              onClick={() => handleToggleBlock(user._id)}
                              disabled={togglingBlock === user._id}
                            >
                              {togglingBlock === user._id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : user.isBlocked ? (
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              ) : (
                                <Ban className="mr-2 h-4 w-4 text-destructive" />
                              )}
                              <span className={cn(
                                togglingBlock !== user._id && (
                                  user.isBlocked ? "text-green-600" : "text-destructive"
                                )
                              )}>
                                {togglingBlock === user._id ? 'Updating...' :
                                  user.isBlocked ? 'Unblock User' : 'Block User'}
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                // Add password reset logic here
                                toast.info("Password reset feature coming soon");
                              }}
                              disabled={togglingBlock === user._id}
                            >
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

      {/* Edit User Modal */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>Edit User: {selectedUser.name}</DialogTitle>
                <DialogDescription>
                  Update user information and permissions.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={editUserForm.name}
                      onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                      placeholder="John Doe"
                      disabled={updatingUser}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={editUserForm.email}
                      onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                      placeholder="john@company.com"
                      disabled={updatingUser}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input
                      value={editUserForm.number}
                      onChange={(e) => setEditUserForm({ ...editUserForm, number: e.target.value })}
                      placeholder="1234567890"
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
                </div>

                {/* Current Role Permissions Display */}
                {selectedUser.role.permissions && selectedUser.role.permissions.length > 0 && (
                  <div className="space-y-3 border rounded-lg p-4">
                    <h4 className="font-medium text-sm">Current Role Permissions</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      These permissions come from the user's role ({selectedUser.role.name}) and cannot be edited here.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.role.permissions.map((perm, idx) => (
                        <div key={idx} className="text-xs">
                          <Badge variant="outline" className="mb-1">
                            {perm.module}
                          </Badge>
                          <div className="flex flex-wrap gap-1 ml-2">
                            {perm.actions.map((action, actionIdx) => (
                              <Badge key={actionIdx} variant="secondary" className="text-xs">
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Profile Details - Only if user has a profile */}
                {selectedUser.profile && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">Profile Details</h4>
                    
                    {/* Department Selection */}
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select
                        value={editUserForm.departmentId}
                        onValueChange={(value) => {
                          setEditUserForm({ 
                            ...editUserForm, 
                            departmentId: value,
                            reportingSeniorId: '' // Reset reporting senior when department changes
                          });
                          // Fetch users for the selected department
                          if (value) {
                            fetchDepartmentUsers(value);
                          }
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

                    {/* Pool Selection - NEW */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Pool
                      </Label>
                      <Select
                        value={editUserForm.poolId}
                        onValueChange={(value) => setEditUserForm({ ...editUserForm, poolId: value })}
                        disabled={updatingUser || loadingPools}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select pool (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=" ">No Pool</SelectItem>
                          {loadingPools ? (
                            <div className="py-2 text-center">
                              <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                            </div>
                          ) : (
                            pools
                              .map((pool) => (
                                <SelectItem key={pool._id} value={pool._id}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{pool.name}</span>
                                  </div>
                                </SelectItem>
                              ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Salary */}
                    <div className="space-y-2">
                      <Label>Salary</Label>
                      <Input
                        type="number"
                        value={editUserForm.salary}
                        onChange={(e) => setEditUserForm({ ...editUserForm, salary: e.target.value })}
                        placeholder="e.g., 50000"
                        disabled={updatingUser}
                      />
                    </div>

                    {/* Reporting Senior */}
                    <div className="space-y-2">
                      <Label>Reporting Senior</Label>
                      {!editUserForm.departmentId ? (
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
                              ...departmentUsers.map(user => ({
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
                            searchPlaceholder="Search by name, email, or role..."
                            emptyMessage={loadingDepartmentUsers ? "Loading users..." : "No users found in this department"}
                            disabled={updatingUser || loadingDepartmentUsers || departmentUsers.length === 0}
                            allowClear
                            onClear={() => setEditUserForm({ ...editUserForm, reportingSeniorId: "" })}
                            triggerClassName="h-10 sm:h-11 text-sm sm:text-base"
                            contentClassName="w-full sm:max-w-[var(--radix-popover-trigger-width)]"
                          />
                          
                          {/* Show loading state */}
                          {loadingDepartmentUsers && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Loading department users...
                            </div>
                          )}
                          
                          {/* Show user count */}
                          {!loadingDepartmentUsers && departmentUsers.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Users className="w-3 h-3" />
                              {departmentUsers.length} user{departmentUsers.length !== 1 ? 's' : ''} available
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Extra Access Controls */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Extra Access Controls</h4>
                      <p className="text-sm text-muted-foreground">
                        Grant additional permissions beyond the user's role
                      </p>
                    </div>
                    {editUserForm.extraAccessControls.length > 0 && (
                      <Badge variant="outline">
                        {editUserForm.extraAccessControls.length} modules
                      </Badge>
                    )}
                  </div>

                  {selectedUser.profile?.extraAccessControls && selectedUser.profile.extraAccessControls.length > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Current extra access controls:</strong> User already has {selectedUser.profile.extraAccessControls.length} extra permission module(s).
                      </p>
                    </div>
                  )}

                  <PermissionsSelector
                    permissions={editUserForm.extraAccessControls}
                    onChange={(perms) => setEditUserForm({ ...editUserForm, extraAccessControls: perms })}
                    disabled={updatingUser}
                    title=""
                    description="Select modules and actions to add extra permissions"
                  />

                  {editUserForm.extraAccessControls.length > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h5 className="text-sm font-medium text-green-800 mb-2">Selected Extra Permissions:</h5>
                      <div className="space-y-2">
                        {editUserForm.extraAccessControls.map((control, idx) => (
                          <div key={idx} className="text-sm">
                            <div className="font-medium text-green-700">
                              {control.module.charAt(0).toUpperCase() + control.module.slice(1)}:
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {control.actions.map((action, actionIdx) => (
                                <Badge key={actionIdx} variant="secondary" className="text-xs bg-green-100 text-green-800">
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
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditUserOpen(false)}
                  disabled={updatingUser}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateUser}
                  disabled={updatingUser}
                  className="min-w-[120px]"
                >
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
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] h-auto overflow-hidden flex flex-col p-0">
          {selectedUser && (
            <>
              {/* Fixed Header */}
              <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                <DialogTitle className="text-lg sm:text-xl">User Profile</DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  Profile details for {selectedUser.name}
                </DialogDescription>
              </DialogHeader>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-6">
                  {/* User Basic Info - Avatar and Name */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto sm:mx-0">
                      <span className="text-3xl sm:text-4xl font-medium text-primary">
                        {getInitials(selectedUser.name)}
                      </span>
                    </div>
                    <div className="text-center sm:text-left">
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
                      </div>
                    </div>
                  </div>

                  {/* User Details Grid */}
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
                      <Label className="text-xs text-muted-foreground">Member Since</Label>
                      <p className="text-sm font-medium mt-1">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Last Login</Label>
                      <p className="text-sm font-medium mt-1">
                        {selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : 'Never'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Account Status</Label>
                      <div className="mt-1">
                        {selectedUser.isBlocked ? (
                          <Badge variant="destructive" className="text-xs">Blocked</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs border-green-500 text-green-700">Active</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Profile Details Section */}
                  {selectedUser.profile ? (
                    <div className="space-y-4 border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-base">Profile Details</h4>
                        <Badge variant="outline" className="text-xs">
                          Profile Created: {formatDate(selectedUser.profile.createdAt)}
                        </Badge>
                      </div>
                      
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
                        
                        {/* Pool Information */}
                        {selectedUser.profile.poolId && (
                          <div className="bg-muted/20 p-3 rounded-md">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                              <Database className="w-3 h-3" />
                              Pool
                            </Label>
                            <div className="mt-1">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "flex items-center gap-1",
                                  isPoolActive(selectedUser.profile.poolId)
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-gray-50 text-gray-500 border-gray-200"
                                )}
                              >
                                <Database className="w-3 h-3" />
                                {getPoolName(selectedUser.profile.poolId)}
                              </Badge>
                            </div>
                          </div>
                        )}
                        
                        <div className="bg-muted/20 p-3 rounded-md">
                          <Label className="text-xs text-muted-foreground">Reporting Senior</Label>
                          <div className="flex items-center gap-2 mt-1">
                            {selectedUser.profile.reportingSeniorId ? (
                              <>
                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
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

                      {/* Extra Access Controls */}
                      {selectedUser.profile.extraAccessControls && selectedUser.profile.extraAccessControls.length > 0 && (
                        <div className="border-t pt-4 mt-2">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-sm">Extra Access Controls</h4>
                            <Badge variant="secondary" className="text-xs">
                              {selectedUser.profile.extraAccessControls.length} modules
                            </Badge>
                          </div>
                          <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                            {selectedUser.profile.extraAccessControls.map((control, idx) => (
                              <div key={idx} className="bg-blue-50/50 p-3 rounded-md border border-blue-100">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-blue-700 uppercase tracking-wider">
                                    {control.module}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
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
                        This user doesn't have a profile yet. Create one to add department, salary, and other details.
                      </p>
                      <Button 
                        onClick={() => {
                          setProfileModalOpen(false);
                          setProfileCreateModalOpen(true);
                        }}
                        className="w-full sm:w-auto"
                      >
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
                        <Badge variant="outline" className="text-xs">
                          {selectedUser.role.name}
                        </Badge>
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
              <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <Button 
                  variant="outline" 
                  onClick={() => setProfileModalOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>Update Status</DialogTitle>
                <DialogDescription>
                  Update status for {selectedUser.name}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Select Status</Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value: any) => setSelectedStatus(value)}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Active
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-600" />
                          Inactive
                        </div>
                      </SelectItem>
                      <SelectItem value="probation">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          Probation
                        </div>
                      </SelectItem>
                      <SelectItem value="resigned">
                        <div className="flex items-center gap-2">
                          <LogOut className="w-4 h-4 text-red-600" />
                          Resigned
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStatusModalOpen(false)} disabled={updatingStatus}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdateStatus()} disabled={updatingStatus}>
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
    </div>
  );
}