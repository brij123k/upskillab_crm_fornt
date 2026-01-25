import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ShieldPlus, 
  Edit, 
  Loader2, 
  Shield,
  ShieldCheck,
  ShieldOff
} from 'lucide-react';
import { PermissionsSelector } from './PermissionsSelector';
import { RoleType } from '@/types/user';
import { modulesConfig } from '@/config/modulesConfig';
import { Switch } from '@/components/ui/switch'; // Make sure you have Switch component
import { cn } from '@/lib/utils';

interface RolesTabProps {
  roles: RoleType[];
  loading: boolean;
  onAddRole: (data: any) => Promise<void>;
  onUpdateRole: (roleId: string, data: any) => Promise<void>;
}

export function RolesTab({
  roles,
  loading,
  onAddRole,
  onUpdateRole
}: RolesTabProps) {
  const [newRoleOpen, setNewRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  
  // Loading states
  const [addingRole, setAddingRole] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    reportingRole: '',
    isSuperAdmin: false,
    permissions: [] as Array<{ module: string; actions: string[] }>
  });

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getModuleLabel = (moduleId: string) => {
    const module = Object.values(modulesConfig).find(m => m.id === moduleId);
    return module ? module.label : moduleId;
  };

  const handleAddRole = async () => {
    setAddingRole(true);
    try {
      await onAddRole(roleForm);
      setRoleForm({ 
        name: '', 
        reportingRole: '', 
        isSuperAdmin: false,
        permissions: [] 
      });
      setNewRoleOpen(false);
    } finally {
      setAddingRole(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    setUpdatingRole(true);
    try {
      await onUpdateRole(selectedRole._id, roleForm);
      setEditingRole(false);
      setSelectedRole(null);
      setRoleForm({ 
        name: '', 
        reportingRole: '', 
        isSuperAdmin: false,
        permissions: [] 
      });
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleEditRoleOpen = (role: RoleType) => {
    setSelectedRole(role);
    setRoleForm({
      name: role.name,
      reportingRole: role.reportingRole || '',
      isSuperAdmin: role.isSuperAdmin || false,
      permissions: role.permissions.map(perm => ({
        module: perm.module,
        actions: perm.actions
      }))
    });
    setEditingRole(true);
  };

  // Handle Super Admin toggle change
  const handleSuperAdminToggle = (checked: boolean) => {
    setRoleForm(prev => ({
      ...prev,
      isSuperAdmin: checked,
      // If setting to Super Admin, clear permissions and reporting role
      permissions: checked ? [] : prev.permissions,
      reportingRole: checked ? '' : prev.reportingRole
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">All Roles ({roles.length})</h3>
          <p className="text-sm text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <Button onClick={() => setNewRoleOpen(true)} variant="outline">
          <ShieldPlus className="w-4 h-4 mr-2" />
          New Role
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading roles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card key={role._id} className={cn(
              "relative transition-all hover:shadow-md",
              role.isSuperAdmin && "border-purple-200 bg-gradient-to-br from-purple-50 to-white"
            )}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {role.name}
                    {role.isSuperAdmin && (
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                    )}
                  </CardTitle>
                  {role.isSuperAdmin ? (
                    <Badge className="bg-gradient-to-r from-purple-600 to-purple-800 text-white border-0">
                      <Shield className="w-3 h-3 mr-1" />
                      Super Admin
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Standard Role
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Created {formatDate(role.createdAt)}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Reporting Role - Only for non-super admin roles */}
                  {!role.isSuperAdmin && role.reportingRole && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Reports To:
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {roles.find(r => r._id === role.reportingRole)?.name || role.reportingRole}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Permissions - Only for non-super admin roles */}
                  {!role.isSuperAdmin && (
                    <div>
                      <div className="text-sm font-medium mb-1">Permissions:</div>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.length > 0 ? (
                          role.permissions.map((perm, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {getModuleLabel(perm.module)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No specific permissions</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Super Admin Note */}
                  {role.isSuperAdmin && (
                    <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <p className="text-xs font-medium text-purple-800">
                          Full system access
                        </p>
                      </div>
                      <p className="text-xs text-purple-600 mt-1">
                        Has access to all modules and actions
                      </p>
                    </div>
                  )}
                  
                  {/* Actions - Don't show edit for Super Admin roles */}
                  {!role.isSuperAdmin && (
                    <div className="pt-2 flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditRoleOpen(role)}
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
            
            {/* Super Admin Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="super-admin" className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  Super Admin Role
                </Label>
                <p className="text-sm text-muted-foreground">
                  Super Admin roles have full access to all system features
                </p>
              </div>
              <Switch
                id="super-admin"
                checked={roleForm.isSuperAdmin}
                onCheckedChange={handleSuperAdminToggle}
                disabled={addingRole}
              />
            </div>
            
            {/* Conditional fields based on Super Admin selection */}
            {!roleForm.isSuperAdmin && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="reporting-role">Reporting Role (Optional)</Label>
                  <Select
                    value={roleForm.reportingRole || ''}
                    onValueChange={(value) => setRoleForm({...roleForm, reportingRole: value})}
                    disabled={addingRole}
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
                
                <PermissionsSelector
                  permissions={roleForm.permissions}
                  onChange={(perms) => setRoleForm({...roleForm, permissions: perms})}
                  disabled={addingRole}
                  title="Permissions *"
                  description="Select modules and actions for this role"
                />
              </>
            )}
            
            {/* Super Admin Warning */}
            {roleForm.isSuperAdmin && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-purple-600" />
                  <div>
                    <h4 className="font-medium text-purple-900">Super Admin Role Selected</h4>
                    <p className="text-sm text-purple-700">
                      This role will have full access to all system modules and actions.
                      No specific permissions need to be configured.
                    </p>
                  </div>
                </div>
              </div>
            )}
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
                
                {/* Super Admin Toggle for Edit */}
                {!selectedRole.isSuperAdmin && ( // Only allow toggling if not already Super Admin
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="edit-super-admin" className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        Super Admin Role
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Enable to give this role full system access
                      </p>
                    </div>
                    <Switch
                      id="edit-super-admin"
                      checked={roleForm.isSuperAdmin}
                      onCheckedChange={handleSuperAdminToggle}
                      disabled={updatingRole || selectedRole.isSuperAdmin}
                    />
                  </div>
                )}
                
                {/* Show warning if role is already Super Admin */}
                {selectedRole.isSuperAdmin && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-6 h-6 text-purple-600" />
                      <div>
                        <h4 className="font-medium text-purple-900">Super Admin Role</h4>
                        <p className="text-sm text-purple-700">
                          This is a Super Admin role with full system access.
                          Cannot be converted to a standard role.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Conditional fields for non-super admin roles */}
                {!roleForm.isSuperAdmin && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-reporting-role">Reporting Role (Optional)</Label>
                      <Select
                        value={roleForm.reportingRole || ''}
                        onValueChange={(value) => setRoleForm({...roleForm, reportingRole: value})}
                        disabled={updatingRole}
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
                    
                    <PermissionsSelector
                      permissions={roleForm.permissions}
                      onChange={(perms) => setRoleForm({...roleForm, permissions: perms})}
                      disabled={updatingRole}
                      title="Permissions *"
                      description="Select modules and actions for this role"
                    />
                  </>
                )}
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