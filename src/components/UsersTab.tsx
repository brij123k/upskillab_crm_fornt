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
import { Search, MoreHorizontal, Edit, Trash2, Eye, Ban, CheckCircle, LogOut, Clock, Key, Filter, ChevronUp, ChevronDown, RefreshCw, Loader2, Download, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PermissionsSelector } from './PermissionsSelector';
import { UserType, RoleType, DepartmentType } from '@/types/user';
import { modulesConfig } from '@/config/modulesConfig';
import { CreateProfileModal } from './CreateProfileModal';

interface UsersTabProps {
    users: UserType[];
    roles: RoleType[];
    departments: DepartmentType[];
    loading: boolean;
    fetchingData: boolean;
    onRefresh: () => Promise<void>;
    onUpdateUser: (userId: string, data: any) => Promise<void>;
    onUpdateStatus: (userId: string, status: string) => Promise<void>;
    onToggleBlock: (userId: string) => Promise<void>;
    onCreateProfile: (userId: string, data: any) => Promise<void>;
}

export function UsersTab({
    users,
    roles,
    departments,
    loading,
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

    // Form states
    const [editUserForm, setEditUserForm] = useState({
        name: '',
        email: '',
        number: '',
        role: '',
        departmentId: '',
        education: '',
        salary: '',
        extraAccessControls: [] as Array<{ module: string; actions: string[] }>
    });

    const [profileForm, setProfileForm] = useState({
        departmentId: '',
        education: '',
        salary: '',
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

        return searchMatch && roleMatch && statusMatch;
    });


    // Helper functions
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const resetFilters = () => {
        setFilters({
            role: 'all',
            status: 'all',
            search: ''
        });
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
            extraAccessControls: user.profile?.extraAccessControls || []
        });
        setEditUserOpen(true);
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            All Users ({users.length})
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
                            <Button variant="outline" size="icon">
                                <Download className="h-4 w-4" />
                            </Button>
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
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Login</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-xs font-medium text-primary">
                                                        {getInitials(user.name)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Joined {formatDate(user.createdAt)}
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
                                                    <Badge variant="destructive" className="text-xs">
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
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit User Modal */}
            <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    {selectedUser && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Edit User: {selectedUser.name}</DialogTitle>
                                <DialogDescription>
                                    Update user information and profile details.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input
                                            value={editUserForm.name}
                                            onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                                            placeholder="John Doe"
                                            disabled={updatingUser}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
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
                                        <Label>Phone Number</Label>
                                        <Input
                                            value={editUserForm.number}
                                            onChange={(e) => setEditUserForm({ ...editUserForm, number: e.target.value })}
                                            placeholder="1234567890"
                                            disabled={updatingUser}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Role</Label>
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

                                <div className="space-y-4 border-t pt-4">
                                    <h4 className="font-medium">Profile Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Department</Label>
                                            <Select
                                                value={editUserForm.departmentId}
                                                onValueChange={(value) => setEditUserForm({ ...editUserForm, departmentId: value })}
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
                                            <Label>Education</Label>
                                            <Input
                                                value={editUserForm.education}
                                                onChange={(e) => setEditUserForm({ ...editUserForm, education: e.target.value })}
                                                placeholder="e.g., Bachelor's Degree"
                                                disabled={updatingUser}
                                            />
                                        </div>
                                    </div>

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
                                </div>

                                {/* Extra Access Controls */}
                                <div className="space-y-4 border-t pt-4">
                                    <PermissionsSelector
                                        permissions={editUserForm.extraAccessControls}
                                        onChange={(perms) => setEditUserForm({ ...editUserForm, extraAccessControls: perms })}
                                        disabled={updatingUser}
                                        title="Extra Access Controls"
                                        description="Grant additional permissions beyond the user's role"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setEditUserOpen(false)} disabled={updatingUser}>
                                    Cancel
                                </Button>
                                <Button onClick={handleUpdateUser} disabled={updatingUser}>
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
                <DialogContent className="sm:max-w-[500px]">
                    {selectedUser && (
                        <>
                            <DialogHeader>
                                <DialogTitle>User Profile</DialogTitle>
                                <DialogDescription>
                                    Profile details for {selectedUser.name}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-2xl font-medium text-primary">
                                            {getInitials(selectedUser.name)}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                                        <p className="text-muted-foreground">{selectedUser.email}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Phone</Label>
                                        <p className="text-sm">{selectedUser.number}</p>
                                    </div>
                                    <div>
                                        <Label>Status</Label>
                                        <Badge variant="outline" className={cn(
                                            selectedUser.status === 'active' && 'border-green-500 text-green-700'
                                        )}>
                                            {selectedUser.status}
                                        </Badge>
                                    </div>
                                    <div>
                                        <Label>Role</Label>
                                        <p className="text-sm">{selectedUser.role.name}</p>
                                    </div>
                                    <div>
                                        <Label>Dashboard Access</Label>
                                        <p className="text-sm">{selectedUser.isDashboardEnabled ? 'Enabled' : 'Disabled'}</p>
                                    </div>
                                </div>

                                {selectedUser.profile ? (
                                    <div className="space-y-4 border-t pt-4">
                                        <h4 className="font-medium">Profile Details</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Department</Label>
                                                <p className="text-sm">{selectedUser.profile.departmentId.name}</p>
                                            </div>
                                            <div>
                                                <Label>Education</Label>
                                                <p className="text-sm">{selectedUser.profile.education}</p>
                                            </div>
                                            <div>
                                                <Label>Salary</Label>
                                                <p className="text-sm">₹{selectedUser.profile.salary.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <Label>Profile Created</Label>
                                                <p className="text-sm">{formatDate(selectedUser.profile.createdAt)}</p>
                                            </div>
                                        </div>

                                        {/* Extra Access Controls */}
                                        {selectedUser.profile.extraAccessControls && selectedUser.profile.extraAccessControls.length > 0 && (
                                            <div className="border-t pt-4">
                                                <h4 className="font-medium mb-2">Extra Access Controls</h4>
                                                <div className="space-y-2">
                                                    {selectedUser.profile.extraAccessControls.map((control, idx) => (
                                                        <div key={idx} className="text-sm">
                                                            <div className="font-medium">{control.module}:</div>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {control.actions.map((action, actionIdx) => (
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
                                    </div>
                                ) : (
                                    <div className="border rounded-lg p-4 text-center">
                                        <User className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground mb-3">No profile found for this user</p>
                                        <Button onClick={() => {
                                            setProfileModalOpen(false);
                                            setProfileCreateModalOpen(true);
                                        }}>
                                            Create Profile
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setProfileModalOpen(false)}>Close</Button>
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
                                <Button onClick={() => handleUpdateStatus(selectedUser._id)} disabled={updatingStatus}>
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
        loadingDepartments={loading}
        creatingProfile={creatingProfile}
        onSubmit={handleCreateProfile}
      />

            {/* New Role Modal */}
            {/* <Dialog open={newRoleOpen} onOpenChange={setNewRoleOpen}>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                  <DialogDescription>
                    Create a new role with specific permissions.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="role-name">Role Name *</Label>
                    <Input
                      id="role-name"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                      placeholder="e.g., Sales Manager"
                      disabled={addingRole}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="reporting-role">Reporting Role (Optional)</Label>
                    <Select
                      value={roleForm.reportingRole || ''}
                      onValueChange={(value) => setRoleForm({...roleForm, reportingRole: value})}
                      disabled={addingRole || loadingRoles}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reporting role (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" ">No reporting role</SelectItem>
                        {roles
                          .filter(role => !role.isSuperAdmin)
                          .map((role) => (
                            <SelectItem key={role._id} value={role._id}>
                              {role.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-4">
                    <Label>Permissions *</Label>
                    <p className="text-sm text-muted-foreground">
                      Select modules and actions for this role
                    </p>
                    
                    <div className="space-y-3">
                      {availableModules.map((module, index) => {
                        const modulePermission = roleForm.permissions.find(p => p.module === module.id);
                        const selectedActions = modulePermission?.actions || [];
                        
                        return (
                          <Card key={module.id}>
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm flex items-center justify-between">
                                {module.label}
                                {selectedActions.length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {selectedActions.length} selected
                                  </Badge>
                                )}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="py-2">
                              <div className="flex flex-wrap gap-2">
                                {availableActions.map((action) => (
                                  <Button
                                    key={action.id}
                                    type="button"
                                    variant={selectedActions.includes(action.id) ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleExtraAccessAction(module.id, action.id, 'role', index)}
                                    disabled={addingRole}
                                  >
                                    {selectedActions.includes(action.id) ? (
                                      <Check className="w-3 h-3 mr-1" />
                                    ) : (
                                      <Square className="w-3 h-3 mr-1" />
                                    )}
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewRoleOpen(false)} disabled={addingRole}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddRole} disabled={addingRole || !roleForm.name}>
                    {addingRole ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Role'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog> */}

            {/* Edit Role Modal */}
            {/* <Dialog open={editingRole} onOpenChange={setEditingRole}>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                {selectedRole && (
                  <>
                    <DialogHeader>
                      <DialogTitle>Edit Role: {selectedRole.name}</DialogTitle>
                      <DialogDescription>
                        Update role permissions and details.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-role-name">Role Name *</Label>
                        <Input
                          id="edit-role-name"
                          value={roleForm.name}
                          onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                          placeholder="e.g., Sales Manager"
                          disabled={updatingRole}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="edit-reporting-role">Reporting Role (Optional)</Label>
                        <Select
                          value={roleForm.reportingRole || ''}
                          onValueChange={(value) => setRoleForm({...roleForm, reportingRole: value})}
                          disabled={updatingRole || loadingRoles}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select reporting role (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=" ">No reporting role</SelectItem>
                            {roles
                              .filter(role => !role.isSuperAdmin && role._id !== selectedRole._id)
                              .map((role) => (
                                <SelectItem key={role._id} value={role._id}>
                                  {role.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-4">
                        <Label>Permissions *</Label>
                        <p className="text-sm text-muted-foreground">
                          Select modules and actions for this role
                        </p>
                        
                        <div className="space-y-3">
                          {availableModules.map((module, index) => {
                            const modulePermission = roleForm.permissions.find(p => p.module === module.id);
                            const selectedActions = modulePermission?.actions || [];
                            
                            return (
                              <Card key={module.id}>
                                <CardHeader className="py-3">
                                  <CardTitle className="text-sm flex items-center justify-between">
                                    {module.label}
                                    {selectedActions.length > 0 && (
                                      <Badge variant="secondary" className="text-xs">
                                        {selectedActions.length} selected
                                      </Badge>
                                    )}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="py-2">
                                  <div className="flex flex-wrap gap-2">
                                    {availableActions.map((action) => (
                                      <Button
                                        key={action.id}
                                        type="button"
                                        variant={selectedActions.includes(action.id) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => toggleExtraAccessAction(module.id, action.id, 'role', index)}
                                        disabled={updatingRole}
                                      >
                                        {selectedActions.includes(action.id) ? (
                                          <Check className="w-3 h-3 mr-1" />
                                        ) : (
                                          <Square className="w-3 h-3 mr-1" />
                                        )}
                                        {action.label}
                                      </Button>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setEditingRole(false);
                        setSelectedRole(null);
                      }} disabled={updatingRole}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateRole} disabled={updatingRole || !roleForm.name}>
                        {updatingRole ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          'Update Role'
                        )}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog> */}
        </div>
    );
}