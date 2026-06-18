import { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ShieldPlus, 
  Edit, 
  Loader2, 
  Shield,
  ShieldCheck,
  Plus,
  Pencil,
  Layers
} from 'lucide-react';
import { PermissionsSelector } from './PermissionsSelector';
import { RoleType } from '@/types/user';
import { modulesConfig } from '@/config/modulesConfig';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { getDataHandlerWithToken, postDataHandlerWithToken, patchTokenDataHandler } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';

interface LevelType {
  _id: string;
  name: string;
}

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
    levelId: '',
    reportingRole: '',
    isSuperAdmin: false,
    permissions: [] as Array<{ module: string; actions: string[] }>
  });

  // Levels state
  const [levels, setLevels] = useState<LevelType[]>([]);
  const [loadingLevels, setLoadingLevels] = useState(false);

  // Available Levels modal state
  const [levelsModalOpen, setLevelsModalOpen] = useState(false);
  const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
  const [newLevelName, setNewLevelName] = useState('');
  const [savingLevel, setSavingLevel] = useState(false);

  // Fetch levels on mount
  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      setLoadingLevels(true);
      const response = await getDataHandlerWithToken('getAllLevels', null, null);
      if (response) setLevels(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch levels",
        variant: "destructive",
      });
    } finally {
      setLoadingLevels(false);
    }
  };

  // ---------- Helpers to handle both populated objects and plain IDs ----------
  const getLevelId = (level: any): string => {
    if (!level) return '';
    if (typeof level === 'object') return level._id || '';
    return level;
  };

  const getLevelName = (level: any): string => {
    if (!level) return 'Unknown Level';
    if (typeof level === 'object') return level.name || 'Unknown Level';
    const found = levels.find(l => l._id === level);
    return found ? found.name : 'Unknown Level';
  };

  const getLevelOrder = (level: any): number => {
    const id = getLevelId(level);
    const lvl = levels.find(l => l._id === id);
    if (!lvl) return 0;
    const match = lvl.name.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const getReportingRoleName = (reportingRole: any): string => {
    if (!reportingRole) return '';
    if (typeof reportingRole === 'object') return reportingRole.name || '';
    const found = roles.find(r => r._id === reportingRole);
    return found ? found.name : reportingRole;
  };

  // ---------- Role sorting and reporting options ----------
  const getSortedRoles = () => {
    return [...roles].sort((a, b) => {
      const orderA = getLevelOrder(a.levelId);
      const orderB = getLevelOrder(b.levelId);
      if (orderB !== orderA) return orderB - orderA; // higher order first
      return a.name.localeCompare(b.name);
    });
  };

  const getReportingRoleOptions = (currentLevelId: string, currentRoleId?: string) => {
    const currentOrder = getLevelOrder(currentLevelId);
    return getSortedRoles().filter((role) => {
      if (role.isSuperAdmin) return false;
      if (currentRoleId && role._id === currentRoleId) return false;
      return getLevelOrder(role.levelId) > currentOrder;
    });
  };

  // ---------- Handlers ----------
  const handleAddRole = async () => {
    setAddingRole(true);
    try {
      await onAddRole(roleForm);
      setRoleForm({ 
        name: '', 
        levelId: '',
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
        levelId: '',
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
      levelId: getLevelId(role.levelId),            // extract the ID string
      reportingRole: getLevelId(role.reportingRole), // may be object or string
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
      reportingRole: checked ? '' : prev.reportingRole,
      levelId: checked ? '' : prev.levelId, // super admin doesn't need level
    }));
  };

  // Level CRUD handlers
  const handleAddLevel = async () => {
    if (!newLevelName.trim()) return;
    setSavingLevel(true);
    try {
      await postDataHandlerWithToken('addNewLevel', { name: newLevelName.trim() });
      toast({ title: "Success", description: "Level created" });
      setNewLevelName('');
      fetchLevels();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to create level", variant: "destructive" });
    } finally {
      setSavingLevel(false);
    }
  };

  const handleUpdateLevel = async (levelId: string, newName: string) => {
    if (!newName.trim()) return;
    setSavingLevel(true);
    try {
      const endpoint = ApiConfig.levelUpdate(levelId);
      await patchTokenDataHandler(endpoint, { name: newName.trim() }, true);
      toast({ title: "Success", description: "Level updated" });
      setEditingLevelId(null);
      fetchLevels();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to update level", variant: "destructive" });
    } finally {
      setSavingLevel(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getModuleLabel = (moduleId: string) => {
    const module = Object.values(modulesConfig).find(m => m.id === moduleId);
    return module ? module.label : moduleId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">All Roles ({roles.length})</h3>
          <p className="text-sm text-slate-500">Manage user roles and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setLevelsModalOpen(true)}
            className="rounded-xl border-slate-200"
          >
            <Layers className="w-4 h-4 mr-2" />
            Available Levels
          </Button>
          <Button onClick={() => setNewRoleOpen(true)} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
            <ShieldPlus className="w-4 h-4 mr-2" />
            New Role
          </Button>
        </div>
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
                      {getLevelName(role.levelId)}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Created {formatDate(role.createdAt)}
                </p>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-2 space-y-3">
                {!role.isSuperAdmin && role.reportingRole && (
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Reports To:</div>
                    <div className="inline-flex items-center gap-1.5 text-sm text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg">
                      <Shield className="w-3 h-3 text-slate-400" />
                      {getReportingRoleName(role.reportingRole)}
                    </div>
                  </div>
                )}
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
                {role.isSuperAdmin && (
                  <div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-orange-600" />
                      <p className="text-xs font-medium text-orange-800">Full system access</p>
                    </div>
                    <p className="text-xs text-orange-600 mt-1">Has access to all modules and actions</p>
                  </div>
                )}
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

            {/* Level Selection */}
            {!roleForm.isSuperAdmin && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Level *</Label>
                <Select
                  value={roleForm.levelId}
                  onValueChange={(value) => setRoleForm({...roleForm, levelId: value})}
                  disabled={addingRole}
                >
                  <SelectTrigger className="h-10 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select a level" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {levels.map((level) => (
                      <SelectItem key={level._id} value={level._id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
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
                      {getReportingRoleOptions(roleForm.levelId)
                        .map((role) => (
                          <SelectItem key={role._id} value={role._id}>
                            {role.name} ({getLevelName(role.levelId)})
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
              <Button onClick={handleAddRole} disabled={addingRole || !roleForm.name || (!roleForm.isSuperAdmin && !roleForm.levelId)} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
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

                {!roleForm.isSuperAdmin && !selectedRole.isSuperAdmin && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Level *</Label>
                    <Select
                      value={roleForm.levelId}
                      onValueChange={(value) => setRoleForm({...roleForm, levelId: value})}
                      disabled={updatingRole}
                    >
                      <SelectTrigger className="h-10 rounded-xl border-slate-200">
                        <SelectValue placeholder="Select a level" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {levels.map((level) => (
                          <SelectItem key={level._id} value={level._id}>
                            {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
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
                          {getReportingRoleOptions(roleForm.levelId, selectedRole._id)
                            .map((role) => (
                              <SelectItem key={role._id} value={role._id}>
                                {role.name} ({getLevelName(role.levelId)})
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
                  <Button onClick={handleUpdateRole} disabled={updatingRole || !roleForm.name || (!roleForm.isSuperAdmin && !roleForm.levelId)} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
                    {updatingRole ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Update Role
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Available Levels Modal */}
      <Dialog open={levelsModalOpen} onOpenChange={setLevelsModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-xl font-bold text-slate-800">Manage Levels</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Add, edit, and view organisational levels (e.g., L1, L2).
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            {/* Add new level */}
            <div className="flex gap-2">
              <Input
                placeholder="Level name (e.g., L3)"
                value={newLevelName}
                onChange={(e) => setNewLevelName(e.target.value)}
                disabled={savingLevel}
                className="h-10 rounded-xl border-slate-200"
                onKeyDown={(e) => e.key === 'Enter' && handleAddLevel()}
              />
              <Button 
                onClick={handleAddLevel} 
                disabled={savingLevel || !newLevelName.trim()}
                className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Levels list */}
            <div className="max-h-60 overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl">
              {levels.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">No levels defined yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-full">Name</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {levels.map(level => (
                      <TableRow key={level._id}>
                        <TableCell>
                          {editingLevelId === level._id ? (
                            <Input
                              defaultValue={level.name}
                              id={`edit-level-${level._id}`}
                              className="h-8"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const input = e.currentTarget;
                                  handleUpdateLevel(level._id, input.value);
                                }
                              }}
                            />
                          ) : (
                            <span className="font-medium">{level.name}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingLevelId === level._id ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const input = document.getElementById(`edit-level-${level._id}`) as HTMLInputElement;
                                handleUpdateLevel(level._id, input?.value || '');
                              }}
                              disabled={savingLevel}
                            >
                              Save
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingLevelId(level._id)}
                              disabled={savingLevel}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
            <Button variant="outline" onClick={() => setLevelsModalOpen(false)} className="rounded-xl border-slate-200">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}