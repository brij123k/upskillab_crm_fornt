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
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  Check,
  Square
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
    extraAccessControls: Array<{
      module: string;
      actions: string[];
      _id: string;
    }>;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

interface RoleType {
  _id: string;
  name: string;
  isSuperAdmin: boolean;
  reportingRole?: string;
  permissions: Array<{
    module: string;
    actions: string[];
    _id: string;
  }>;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface PermissionType {
  module: string;
  actions: string[];
}

interface RoleForm {
  name: string;
  reportingRole?: string;
  permissions: PermissionType[];
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

interface EditUserForm {
  name: string;
  email: string;
  number: string;
  role: string;
  departmentId: string;
  education: string;
  salary: string;
  extraAccessControls: Array<{
    module: string;
    actions: string[];
  }>;
}

interface Filters {
  role: string;
  status: string;
  search: string;
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
  const [editUserOpen, setEditUserOpen] = useState(false);
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
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [editingRole, setEditingRole] = useState(false);
  const [addingRole, setAddingRole] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(false);
  
  // Form states
  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    name: '',
    email: '',
    number: '',
    password: '',
    role: ''
  });
  
  const [editUserForm, setEditUserForm] = useState<EditUserForm>({
    name: '',
    email: '',
    number: '',
    role: '',
    departmentId: '',
    education: '',
    salary: '',
    extraAccessControls: []
  });
  
  const [profileForm, setProfileForm] = useState({
    departmentId: '',
    education: '',
    salary: '',
    extraAccessControls: [] as Array<{ module: string; actions: string[] }>
  });
  
  const [roleForm, setRoleForm] = useState<RoleForm>({
    name: '',
    reportingRole: '',
    permissions: []
  });
  
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'inactive' | 'probation' | 'resigned'>('active');
  
  // Filter states
  const [filters, setFilters] = useState<Filters>({
    role: 'all',
    status: 'all',
    search: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  
  // Available modules for extra access controls
  const availableModules = [
    { id: 'lead', label: 'Lead Management' },
    { id: 'user', label: 'User Management' },
    { id: 'role', label: 'Role Management' },
    { id: 'department', label: 'Department Management' },
    { id: 'campaign', label: 'Campaign Management' },
    { id: 'report', label: 'Reports & Analytics' }
  ];
  
  const availableActions = [
    { id: 'create', label: 'Create' },
    { id: 'read', label: 'Read' },
    { id: 'update', label: 'Update' },
    { id: 'delete', label: 'Delete' },
    { id: 'assign', label: 'Assign' },
    { id: 'status_change', label: 'Change Status' },
    { id: 'block', label: 'Block/Unblock' },
    { id: 'export', label: 'Export' }
  ];

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

  // Filter users based on filters
  const filteredUsers = users.filter(user => {
    // Search filter
    const searchMatch = 
      user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.number.includes(filters.search);
    
    // Role filter
    const roleMatch = filters.role === 'all' || user.role._id === filters.role;
    
    // Status filter
    const statusMatch = filters.status === 'all' || user.status === filters.status;
    
    return searchMatch && roleMatch && statusMatch;
  });

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

  // Update user
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      setUpdatingUser(true);
      
      // Prepare data for API
      const dataToSend: any = {
        name: editUserForm.name,
        email: editUserForm.email,
        number: editUserForm.number,
        role: editUserForm.role,
        departmentId: editUserForm.departmentId,
        education: editUserForm.education,
        salary: parseInt(editUserForm.salary) || 0,
        extraAccessControls: editUserForm.extraAccessControls.filter(control => control.actions.length > 0)
      };
      
      
      const endpoint = ApiConfig.updateUser(selectedUser._id);
      const response = await patchTokenDataHandler(endpoint, dataToSend, true);
      
      toast({
        title: "Success",
        description: response?.message || "User updated successfully",
      });
      
      setEditUserOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setUpdatingUser(false);
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
      
      const dataToSend = {
        departmentId: profileForm.departmentId,
        education: profileForm.education,
        salary: parseInt(profileForm.salary) || 0,
        extraAccessControls: profileForm.extraAccessControls.filter(control => control.actions.length > 0)
      };
      
      const response = await patchTokenDataHandler(endpoint, dataToSend, true);
      
      toast({
        title: "Success",
        description: response?.message || "Profile created successfully",
      });
      
      setProfileCreateModalOpen(false);
      setProfileForm({
        departmentId: '',
        education: '',
        salary: '',
        extraAccessControls: []
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

  // Add new role
  const handleAddRole = async () => {
    try {
      setAddingRole(true);
      
      // Prepare permissions
      const permissions = roleForm.permissions
        .filter(perm => perm.actions.length > 0)
        .map(perm => ({
          module: perm.module,
          actions: perm.actions
        }));
      
      // Prepare data for API
      const dataToSend: any = {
        name: roleForm.name,
        permissions: permissions
      };
      
      // Add reporting role if selected
      if (roleForm.reportingRole && roleForm.reportingRole !== "") {
        dataToSend.reportingRole = roleForm.reportingRole;
      }
      
      const response = await postDataHandlerWithToken("addNewRole", dataToSend);
      
      toast({
        title: "Success",
        description: response?.message || "Role created successfully",
      });
      
      // Reset form and close modal
      setRoleForm({
        name: '',
        reportingRole: '',
        permissions: []
      });
      setNewRoleOpen(false);
      fetchRoles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create role",
        variant: "destructive",
      });
    } finally {
      setAddingRole(false);
    }
  };

  // Update role
  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    
    try {
      setUpdatingRole(true);
      
      // Prepare permissions
      const permissions = roleForm.permissions
        .filter(perm => perm.actions.length > 0)
        .map(perm => ({
          module: perm.module,
          actions: perm.actions
        }));
      
      // Prepare data for API
      const dataToSend: any = {
        name: roleForm.name,
        permissions: permissions
      };
      
      // Add reporting role if selected
      if (roleForm.reportingRole && roleForm.reportingRole !== "") {
        dataToSend.reportingRole = roleForm.reportingRole;
      }
      
      const endpoint = ApiConfig.updateRole(selectedRole._id);
      const response = await patchTokenDataHandler(endpoint, dataToSend, true);
      
      toast({
        title: "Success",
        description: response?.message || "Role updated successfully",
      });
      
      // Reset and close
      setEditingRole(false);
      setSelectedRole(null);
      setRoleForm({
        name: '',
        reportingRole: '',
        permissions: []
      });
      fetchRoles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update role",
        variant: "destructive",
      });
    } finally {
      setUpdatingRole(false);
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

  // Toggle action in extra access controls
  const toggleExtraAccessAction = (
    moduleId: string,
    actionId: string,
    formType: 'edit' | 'profile' | 'role',
    permissionIndex?: number
  ) => {
    if (formType === 'edit') {
      const updatedControls = [...editUserForm.extraAccessControls];
      let controlIndex = updatedControls.findIndex(c => c.module === moduleId);
      console.log(updatedControls)
      if (controlIndex === -1) {
        updatedControls.push({ module: moduleId, actions: [actionId] });
      } else {
        const currentActions = updatedControls[controlIndex].actions;
        if (currentActions.includes(actionId)) {
          updatedControls[controlIndex].actions = currentActions.filter(a => a !== actionId);
          // Remove module if no actions left
          if (updatedControls[controlIndex].actions.length === 0) {
            updatedControls.splice(controlIndex, 1);
          }
        } else {
          updatedControls[controlIndex].actions = [...currentActions, actionId];
        }
      }
      
      setEditUserForm({ ...editUserForm, extraAccessControls: updatedControls });
    } else if (formType === 'profile') {
      const updatedControls = [...profileForm.extraAccessControls];
      let controlIndex = updatedControls.findIndex(c => c.module === moduleId);
      
      if (controlIndex === -1) {
        updatedControls.push({ module: moduleId, actions: [actionId] });
      } else {
        const currentActions = updatedControls[controlIndex].actions;
        if (currentActions.includes(actionId)) {
          updatedControls[controlIndex].actions = currentActions.filter(a => a !== actionId);
          // Remove module if no actions left
          if (updatedControls[controlIndex].actions.length === 0) {
            updatedControls.splice(controlIndex, 1);
          }
        } else {
          updatedControls[controlIndex].actions = [...currentActions, actionId];
        }
      }
      
      setProfileForm({ ...profileForm, extraAccessControls: updatedControls });
    } else if (formType === 'role') {
      const updatedPermissions = [...roleForm.permissions];
      let permIndex = permissionIndex !== undefined ? permissionIndex : updatedPermissions.findIndex(p => p.module === moduleId);
      
      if (permIndex === -1) {
        updatedPermissions.push({ module: moduleId, actions: [actionId] });
      } else {
        const currentActions = updatedPermissions[permIndex].actions;
        if (currentActions.includes(actionId)) {
          updatedPermissions[permIndex].actions = currentActions.filter(a => a !== actionId);
          // Remove module if no actions left
          if (updatedPermissions[permIndex].actions.length === 0) {
            updatedPermissions.splice(permIndex, 1);
          }
        } else {
          updatedPermissions[permIndex].actions = [...currentActions, actionId];
        }
      }
      
      setRoleForm({ ...roleForm, permissions: updatedPermissions });
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      role: 'all',
      status: 'all',
      search: ''
    });
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
        <>
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

          {/* Filters - Collapsible */}
          {showFilters && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={filters.role}
                      onValueChange={(value) => setFilters({...filters, role: value})}
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
                      onValueChange={(value) => setFilters({...filters, status: value})}
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
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
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
                                onClick={() => {
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
                                }}
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
        </>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">All Roles ({roles.length})</CardTitle>
              <Button onClick={() => setNewRoleOpen(true)} variant="outline">
                <ShieldPlus className="w-4 h-4 mr-2" />
                New Role
              </Button>
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
                      <div className="space-y-3">
                        {/* Reporting Role */}
                        {role.reportingRole && (
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                              Reports To:
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {roles.find(r => r._id === role.reportingRole)?.name || role.reportingRole}
                            </Badge>
                          </div>
                        )}
                        
                        {/* Permissions */}
                        <div>
                          <div className="text-sm font-medium mb-1">Permissions:</div>
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
                        </div>
                        
                        {/* Actions */}
                        {!role.isSuperAdmin && (
                          <div className="pt-2 flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setSelectedRole(role);
                                setRoleForm({
                                  name: role.name,
                                  reportingRole: role.reportingRole || '',
                                  permissions: role.permissions.map(p => ({
                                    module: p.module,
                                    actions: p.actions
                                  }))
                                });
                                setEditingRole(true);
                              }}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        )}
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
                      onChange={(e) => setEditUserForm({...editUserForm, name: e.target.value})}
                      placeholder="John Doe"
                      disabled={updatingUser}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editUserForm.email}
                      onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})}
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
                      onChange={(e) => setEditUserForm({...editUserForm, number: e.target.value})}
                      placeholder="1234567890"
                      disabled={updatingUser}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select 
                      value={editUserForm.role} 
                      onValueChange={(value) => setEditUserForm({...editUserForm, role: value})}
                      disabled={updatingUser || loadingRoles}
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
                        onValueChange={(value) => setEditUserForm({...editUserForm, departmentId: value})}
                        disabled={updatingUser || loadingDepartments}
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
                        onChange={(e) => setEditUserForm({...editUserForm, education: e.target.value})}
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
                      onChange={(e) => setEditUserForm({...editUserForm, salary: e.target.value})}
                      placeholder="e.g., 50000"
                      disabled={updatingUser}
                    />
                  </div>
                </div>
                
                {/* Extra Access Controls */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">Extra Access Controls</h4>
                  <p className="text-sm text-muted-foreground">
                    Grant additional permissions beyond the user's role
                  </p>
                  
                  <div className="space-y-3">
                    {availableModules.map((module) => {
                      const moduleControl = editUserForm.extraAccessControls.find(c => c.module === module.id);
                      const selectedActions = moduleControl?.actions || [];
                      
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
                                  onClick={() => toggleExtraAccessAction(module.id, action.id, 'edit')}
                                  disabled={updatingUser}
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
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>Create Profile</DialogTitle>
                <DialogDescription>
                  Create profile for {selectedUser.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
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
                
                {/* Extra Access Controls for Profile */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">Extra Access Controls</h4>
                  <p className="text-sm text-muted-foreground">
                    Grant additional permissions beyond the user's role
                  </p>
                  
                  <div className="space-y-3">
                    {availableModules.map((module) => {
                      const moduleControl = profileForm.extraAccessControls.find(c => c.module === module.id);
                      const selectedActions = moduleControl?.actions || [];
                      
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
                                  onClick={() => toggleExtraAccessAction(module.id, action.id, 'profile')}
                                  disabled={creatingProfile}
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

      {/* New Role Modal */}
      <Dialog open={newRoleOpen} onOpenChange={setNewRoleOpen}>
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
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={editingRole} onOpenChange={setEditingRole}>
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
      </Dialog>
    </div>
  );
}