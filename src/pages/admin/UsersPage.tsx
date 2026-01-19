import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Key,
  Filter,
  Download,
  User,
  Shield,
  Building,
  Eye,
  Ban,
  CheckCircle,
  Clock,
  LogOut,
  UserPlus,
  ShieldPlus,
  Copy,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { postDataHandlerWithToken, getDataHandlerWithToken, patchTokenDataHandler } from '@/config/services';
import ApiConfig from '@/config/apiConfig';

interface UserType {
  _id: string;
  name: string;
  email: string;
  number: string;
  status: 'active' | 'inactive' | 'probation' | 'resigned';
  isBlocked: boolean;
  isDashboardEnabled: boolean;
  role: {
    _id: string;
    name: string;
    isSuperAdmin: boolean;
    permissions: Array<{
      module: string;
      actions: string[];
      _id: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  profile?: {
    _id: string;
    userId: string;
    departmentId: {
      _id: string;
      name: string;
    };
    reportingManagerId: any;
    education: string;
    salary: number;
    extraAccessControls: any[];
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

interface RoleType {
  _id: string;
  name: string;
  isSuperAdmin: boolean;
  permissions: Array<{
    module: string;
    actions: string[];
    _id: string;
  }>;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface DepartmentType {
  _id: string;
  name: string;
  parentDepartmentId: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface NewUserForm {
  name: string;
  email: string;
  number: string;
  password: string;
  role: string;
}

export function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserType[]>([]);
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [departments, setDepartments] = useState<DepartmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  
  // Modal states
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newRoleOpen, setNewRoleOpen] = useState(false);
  const [newDepartmentOpen, setNewDepartmentOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [profileCreateModalOpen, setProfileCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  
  // Loading states for actions
  const [addingUser, setAddingUser] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [togglingBlock, setTogglingBlock] = useState<string | null>(null);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  
  // Form states
  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    name: '',
    email: '',
    number: '',
    password: '',
    role: ''
  });
  
  const [profileForm, setProfileForm] = useState({
    departmentId: '',
    education: '',
    salary: ''
  });
  
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'inactive' | 'probation' | 'resigned'>('active');

  // Fetch data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getDataHandlerWithToken("getAllUser", null, null);
      if (response) {
        setUsers(response);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await getDataHandlerWithToken("getAllRoles", null, null);
      if (response) {
        setRoles(response);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      });
    } finally {
      setLoadingRoles(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await getDataHandlerWithToken("getAllDepartments", null, null);
      if (response) {
        setDepartments(response);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch departments",
        variant: "destructive",
      });
    } finally {
      setLoadingDepartments(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setFetchingData(true);
      await Promise.all([
        fetchUsers(),
        fetchRoles(),
        fetchDepartments()
      ]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Auto-generate password
  useEffect(() => {
    if (newUserForm.name && newUserForm.number) {
      const firstName = newUserForm.name.split(' ')[0] || '';
      const firstFourDigits = newUserForm.number.slice(0, 4);
      const generatedPassword = `${firstName}@${firstFourDigits}`;
      setNewUserForm(prev => ({ ...prev, password: generatedPassword }));
    }
  }, [newUserForm.name, newUserForm.number]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.number.includes(searchQuery)
  );

  // Add new user
  const handleAddUser = async () => {
    try {
      setAddingUser(true);
      const response = await postDataHandlerWithToken("addNewEmp", newUserForm);
      
      toast({
        title: "Success",
        description: "User created successfully",
      });
      
      setNewUserForm({
        name: '',
        email: '',
        number: '',
        password: '',
        role: ''
      });
      setNewUserOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setAddingUser(false);
    }
  };

  // Update user status
  const handleUpdateStatus = async (userId: string) => {
    try {
      setUpdatingStatus(true);
      const endpoint = ApiConfig.updateStatus(userId);
      const response = await patchTokenDataHandler(endpoint, { status: selectedStatus }, true);
      
      toast({
        title: "Success",
        description: response?.message || "Status updated successfully",
      });
      
      setStatusModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Toggle block/unblock
  const handleToggleBlock = async (userId: string) => {
    try {
      setTogglingBlock(userId);
      const endpoint = ApiConfig.blockUser(userId);
      const response = await patchTokenDataHandler(endpoint, {}, true);
      
      toast({
        title: "Success",
        description: response?.message || "User status updated",
      });
      
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setTogglingBlock(null);
    }
  };

  // Create profile
  const handleCreateProfile = async () => {
    if (!selectedUser) return;
    
    try {
      setCreatingProfile(true);
      const endpoint = ApiConfig.profileGen(selectedUser._id);
      const response = await patchTokenDataHandler(endpoint, profileForm, true);
      
      toast({
        title: "Success",
        description: response?.message || "Profile created successfully",
      });
      
      setProfileCreateModalOpen(false);
      setProfileForm({
        departmentId: '',
        education: '',
        salary: ''
      });
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create profile",
        variant: "destructive",
      });
    } finally {
      setCreatingProfile(false);
    }
  };

  // Copy password to clipboard
  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(newUserForm.password);
    toast({
      title: "Copied",
      description: "Password copied to clipboard",
    });
  };

  // Generate initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users Management</h1>
          <p className="text-muted-foreground">Manage users, roles</p>
        </div>
        <div className="flex items-center gap-2">
          {fetchingData && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Refreshing...
            </div>
          )}
          <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
            <DialogTrigger asChild>
              <Button>
                {addingUser ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                New Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new user account.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                    placeholder="John Doe"
                    disabled={addingUser}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                    placeholder="john@company.com"
                    disabled={addingUser}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="number">Phone Number</Label>
                  <Input
                    id="number"
                    value={newUserForm.number}
                    onChange={(e) => setNewUserForm({...newUserForm, number: e.target.value})}
                    placeholder="1234567890"
                    disabled={addingUser}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={newUserForm.role} 
                    onValueChange={(value) => setNewUserForm({...newUserForm, role: value})}
                    disabled={addingUser || loadingRoles}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingRoles ? (
                        <div className="py-2 text-center">
                          <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                        </div>
                      ) : (
                        roles.map((role) => (
                          <SelectItem key={role._id} value={role._id}>
                            {role.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Generated Password</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={copyPasswordToClipboard}
                      disabled={addingUser}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      type="text"
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                      placeholder="Auto-generated password"
                      disabled={addingUser}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const firstName = newUserForm.name.split(' ')[0] || '';
                        const firstFourDigits = newUserForm.number.slice(0, 4);
                        setNewUserForm(prev => ({
                          ...prev,
                          password: `${firstName}@${firstFourDigits}`
                        }));
                      }}
                      disabled={addingUser}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password is auto-generated from name and phone number
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewUserOpen(false)} disabled={addingUser}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser} disabled={addingUser}>
                  {addingUser ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={newRoleOpen} onOpenChange={setNewRoleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ShieldPlus className="w-4 h-4 mr-2" />
                New Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Coming Soon</DialogTitle>
                <DialogDescription>
                  Role creation feature will be available soon.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setNewRoleOpen(false)}>OK</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={newDepartmentOpen} onOpenChange={setNewDepartmentOpen}>
            <DialogTrigger asChild>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Coming Soon</DialogTitle>
                <DialogDescription>
                  Department creation feature will be available soon.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setNewDepartmentOpen(false)}>OK</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-sm",
              activeTab === 'users'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <User className="w-4 h-4 inline mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={cn(
              "py-2 px-1 border-b-2 font-medium text-sm",
              activeTab === 'roles'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Roles
          </button>
        </nav>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">All Users ({users.length})</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
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
                              onClick={() => {
                                toast({
                                  title: "Coming Soon",
                                  description: "Edit feature will be available soon.",
                                });
                              }}
                              disabled={togglingBlock === user._id}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedUser(user);
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
                                toast({
                                  title: "Coming Soon",
                                  description: "Password reset feature will be available soon.",
                                });
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
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">All Roles ({roles.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loadingRoles ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Loading roles...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <Card key={role._id} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{role.name}</CardTitle>
                        {role.isSuperAdmin && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            Super Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDate(role.createdAt)}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Permissions:</div>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.length > 0 ? (
                            role.permissions.map((perm, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {perm.module}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No specific permissions</span>
                          )}
                        </div>
                        <div className="pt-2 flex justify-end">
                          <Button variant="outline" size="sm" disabled>
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}


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
      <Dialog open={profileCreateModalOpen} onOpenChange={setProfileCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>Create Profile</DialogTitle>
                <DialogDescription>
                  Create profile for {selectedUser.name}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="department">Department</Label>
                  <Select 
                    value={profileForm.departmentId} 
                    onValueChange={(value) => setProfileForm({...profileForm, departmentId: value})}
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setProfileCreateModalOpen(false)} disabled={creatingProfile}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProfile} disabled={creatingProfile}>
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}