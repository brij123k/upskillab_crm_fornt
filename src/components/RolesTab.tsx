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
import { Switch } from '@/components/ui/switch';
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
  
  const [addingRole, setAddingRole] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  const [roleForm, setRoleForm] = useState({
    name: '',
    level: 1,
    reportingRole: '',
    isSuperAdmin: false,
    permissions: [] as Array<{ module: string; actions: string[] }>
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getModuleLabel = (moduleId: string) => {
    const module = Object.values(modulesConfig).find(m => m.id === moduleId);
    return module ? module.label : moduleId;
  };

  const getSortedRoles = () => {
    return [...roles].sort((a, b) => {
      const levelDiff = (b.level ?? 0) - (a.level ?? 0);
      if (levelDiff !== 0) return levelDiff;
      return a.name.localeCompare(b.name);
    });
  };

  const getReportingRoleOptions = (currentLevel: number, currentRoleId?: string) => {
    return getSortedRoles().filter((role) => {
      if (role.isSuperAdmin) return false;
      if (currentRoleId && role._id === currentRoleId) return false;
      return (role.level ?? 0) > currentLevel;
    });
  };

  const handleAddRole = async () => {
    setAddingRole(true);
    try {
      await onAddRole(roleForm);
      setRoleForm({ 
        name: '', 
        level: 1,
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
        level: 1,
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
      level: role.level ?? 1,
      reportingRole: role.reportingRole || '',
      isSuperAdmin: role.isSuperAdmin || false,
      permissions: role.permissions.map(perm => ({
        module: perm.module,
        actions: perm.actions
      }))
    });
    setEditingRole(true);
  };

  const handleSuperAdminToggle = (checked: boolean) => {
    setRoleForm(prev => ({
      ...prev,
      isSuperAdmin: checked,
      permissions: checked ? [] : prev.permissions,
      reportingRole: checked ? '' : prev.reportingRole
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">All Roles ({roles.length})</h3>
          <p className="text-sm text-slate-500">Manage user roles and permissions</p>
        </div>
        <Button onClick={() => setNewRoleOpen(true)} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
          <ShieldPlus className="w-4 h-4 mr-2" />
          New Role
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
          <p className="mt-2 text-sm text-slate-500">Loading roles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card key={role._id} className={cn(
              "rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all",
              role.isSuperAdmin && "border-orange-200 bg-orange-50/30"
            )}>
              <CardHeader className="pb-2 px-5 pt-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    {role.name}
                    {role.isSuperAdmin && (
                      <ShieldCheck className="w-4 h-4 text-orange-600" />
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {role.isSuperAdmin && (
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200 rounded-full text-xs px-2 py-0.5">
                        <Shield className="w-3 h-3 mr-1" />
                        Super Admin
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-slate-200 text-slate-600 rounded-full text-xs px-2 py-0.5">
                      Level {role.level ?? 1}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Created {formatDate(role.createdAt)}
                </p>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-2 space-y-3">
                {/* Reporting Role */}
                {!role.isSuperAdmin && role.reportingRole && (
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Reports To:</div>
                    <div className="inline-flex items-center gap-1.5 text-sm text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg">
                      <Shield className="w-3 h-3 text-slate-400" />
                      {roles.find(r => r._id === role.reportingRole)?.name || role.reportingRole}
                    </div>
                  </div>
                )}

                {/* Permissions - only for non-super admin */}
                {!role.isSuperAdmin && (
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1.5">Permissions:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.length > 0 ? (
                        role.permissions.map((perm, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200 rounded-full text-xs">
                            {getModuleLabel(perm.module)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No specific permissions</span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Super Admin Note */}
                {role.isSuperAdmin && (
                  <div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-orange-600" />
                      <p className="text-xs font-medium text-orange-800">Full system access</p>
                    </div>
                    <p className="text-xs text-orange-600 mt-1">Has access to all modules and actions</p>
                  </div>
                )}
                
                {/* Actions - Edit button for non-super admin roles */}
                {!role.isSuperAdmin && (
                  <div className="pt-3 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditRoleOpen(role)}
                      className="text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Role Modal */}
      <Dialog open={newRoleOpen} onOpenChange={setNewRoleOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl border-slate-200 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-xl font-bold text-slate-800">Create New Role</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Create a new role with specific permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Role Name *</Label>
              <Input
                value={roleForm.name}
                onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                placeholder="e.g., Sales Manager"
                disabled={addingRole}
                className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Role Level *</Label>
              <Input
                type="number"
                min={1}
                value={roleForm.level}
                onChange={(e) => setRoleForm({...roleForm, level: Number(e.target.value) || 1})}
                placeholder="1"
                disabled={addingRole}
                className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
              />
              <p className="text-xs text-slate-500">Higher number = more senior. Multiple roles can share the same level.</p>
            </div>
            
            {/* Super Admin Toggle */}
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  Super Admin Role
                </Label>
                <p className="text-xs text-slate-500">Super Admin roles have full access to all system features</p>
              </div>
              <Switch
                checked={roleForm.isSuperAdmin}
                onCheckedChange={handleSuperAdminToggle}
                disabled={addingRole}
                className="data-[state=checked]:bg-orange-500"
              />
            </div>
            
            {/* Conditional fields */}
            {!roleForm.isSuperAdmin && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Reporting Role (Optional)</Label>
                  <Select
                    value={roleForm.reportingRole || ''}
                    onValueChange={(value) => setRoleForm({...roleForm, reportingRole: value})}
                    disabled={addingRole}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-slate-200">
                      <SelectValue placeholder="Select reporting role (optional)" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value=" ">No reporting role</SelectItem>
                      {getReportingRoleOptions(roleForm.level)
                        .map((role) => (
                          <SelectItem key={role._id} value={role._id}>
                            {role.name} (Level {role.level ?? 1})
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
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-orange-600" />
                  <div>
                    <h4 className="font-medium text-orange-800">Super Admin Role Selected</h4>
                    <p className="text-sm text-orange-600">This role will have full access to all system modules and actions. No specific permissions need to be configured.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
            <div className="flex gap-3 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setNewRoleOpen(false)} disabled={addingRole} className="rounded-xl border-slate-200">
                Cancel
              </Button>
              <Button onClick={handleAddRole} disabled={addingRole || !roleForm.name} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
                {addingRole ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Role
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={editingRole} onOpenChange={setEditingRole}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl border-slate-200 p-0 overflow-hidden">
          {selectedRole && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
                <DialogTitle className="text-xl font-bold text-slate-800">Edit Role: {selectedRole.name}</DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Update role permissions and details.
                </DialogDescription>
              </DialogHeader>
              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Role Name *</Label>
                  <Input
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                    placeholder="Role name"
                    disabled={updatingRole}
                    className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Role Level *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={roleForm.level}
                    onChange={(e) => setRoleForm({...roleForm, level: Number(e.target.value) || 1})}
                    placeholder="1"
                    disabled={updatingRole}
                    className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                  />
                  <p className="text-xs text-slate-500">Higher number = more senior. Multiple roles can share the same level.</p>
                </div>
                
                {/* Super Admin Toggle for Edit */}
                {!selectedRole.isSuperAdmin && (
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-orange-600" />
                        Super Admin Role
                      </Label>
                      <p className="text-xs text-slate-500">Enable to give this role full system access</p>
                    </div>
                    <Switch
                      checked={roleForm.isSuperAdmin}
                      onCheckedChange={handleSuperAdminToggle}
                      disabled={updatingRole}
                      className="data-[state=checked]:bg-orange-500"
                    />
                  </div>
                )}
                
                {/* Existing Super Admin warning */}
                {selectedRole.isSuperAdmin && (
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-orange-600" />
                      <div>
                        <h4 className="font-medium text-orange-800">Super Admin Role</h4>
                        <p className="text-sm text-orange-600">This is a Super Admin role with full system access. Cannot be converted to a standard role.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {!roleForm.isSuperAdmin && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">Reporting Role (Optional)</Label>
                      <Select
                        value={roleForm.reportingRole || ''}
                        onValueChange={(value) => setRoleForm({...roleForm, reportingRole: value})}
                        disabled={updatingRole}
                      >
                        <SelectTrigger className="h-10 rounded-xl border-slate-200">
                          <SelectValue placeholder="Select reporting role (optional)" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value=" ">No reporting role</SelectItem>
                          {getReportingRoleOptions(roleForm.level, selectedRole._id)
                            .map((role) => (
                              <SelectItem key={role._id} value={role._id}>
                                {role.name} (Level {role.level ?? 1})
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
              <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button variant="outline" onClick={() => { setEditingRole(false); setSelectedRole(null); }} disabled={updatingRole} className="rounded-xl border-slate-200">
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateRole} disabled={updatingRole || !roleForm.name} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
                    {updatingRole ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Update Role
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Global style for hidden scrollbar */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}