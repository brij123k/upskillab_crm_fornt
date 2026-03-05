import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, Loader2, RefreshCw, Building, Database, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { postDataHandlerWithToken, getDataHandlerWithToken, patchTokenDataHandler } from '@/config/services';
import ApiConfig from '@/config/apiConfig';

// Import components
import { UsersTab } from '@/components/UsersTab';
import { RolesTab } from '@/components/RolesTab';
import { DepartmentsTab } from '@/components/DepartmentsTab';
import { PoolsTab } from '@/components/PoolsTab';
import { StagesTab } from '@/components/StagesTab';
import { NewUserModal } from '@/components/NewUserModal';
import { UserType, RoleType, DepartmentType, PoolType, StageType } from '@/types/user';

// Import modules config
import { modulesConfig } from '@/config/modulesConfig';

export function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [departments, setDepartments] = useState<DepartmentType[]>([]);
  const [pools, setPools] = useState<PoolType[]>([]);
  const [stages, setStages] = useState<StageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingPools, setLoadingPools] = useState(false);
  const [loadingStages, setLoadingStages] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'departments' | 'pools' | 'stages'>('users');
  const [fetchingData, setFetchingData] = useState(false);

  // Department Handlers
  const handleAddDepartment = async (departmentData: any) => {
    try {
      const dataToSend: any = {
        name: departmentData.name
      };

      if (departmentData.parentDepartmentId && departmentData.parentDepartmentId !== "") {
        dataToSend.parentDepartmentId = departmentData.parentDepartmentId;
      }

      const response = await postDataHandlerWithToken("addNewDepartments", dataToSend);

      toast({
        title: "Success",
        description: response?.message || "Department created successfully",
      });

      fetchDepartments();
      return response;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create department",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateDepartment = async (departmentId: string, departmentData: any) => {
    try {
      const dataToSend: any = {
        name: departmentData.name
      };

      if (departmentData.parentDepartmentId && departmentData.parentDepartmentId !== "") {
        dataToSend.parentDepartmentId = departmentData.parentDepartmentId;
      } else {
        dataToSend.parentDepartmentId = null;
      }

      const endpoint = ApiConfig.updateDepartments(departmentId);
      const response = await patchTokenDataHandler(endpoint, dataToSend, true);

      toast({
        title: "Success",
        description: response?.message || "Department updated successfully",
      });

      fetchDepartments();
      return response;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update department",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Pool Handlers
  const handleAddPool = async (poolData: { name: string }) => {
    try {
      const response = await postDataHandlerWithToken("addNewPool", poolData);
      toast({
        title: "Success",
        description: response?.message || "Pool created successfully",
      });
      fetchPools();
      return response;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create pool",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdatePool = async (poolId: string, poolData: { name: string }) => {
    try {
      const endpoint = ApiConfig.updatePool(poolId);
      const response = await patchTokenDataHandler(endpoint, poolData, true);
      toast({
        title: "Success",
        description: response?.message || "Pool updated successfully",
      });
      fetchPools();
      return response;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update pool",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleTogglePoolActive = async (poolId: string) => {
    try {
      const endpoint = ApiConfig.togglePoolActive(poolId);
      const response = await patchTokenDataHandler(endpoint, {}, true);
      toast({
        title: "Success",
        description: response?.message || "Pool status updated successfully",
      });
      fetchPools();
      return response;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update pool status",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Stage Handlers
  const handleAddStage = async (stageData: { name: string; departmentId: string; order: number }) => {
    try {
      const response = await postDataHandlerWithToken("addNewStage", stageData);
      toast({
        title: "Success",
        description: response?.message || "Stage created successfully",
      });
      fetchStages();
      return response;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create stage",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateStage = async (stageId: string, stageData: { name: string; departmentId: string; order: number }) => {
    try {
      const endpoint = ApiConfig.updateStage(stageId);
      const response = await patchTokenDataHandler(endpoint, stageData, true);
      toast({
        title: "Success",
        description: response?.message || "Stage updated successfully",
      });
      fetchStages();
      return response;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update stage",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Fetch data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getDataHandlerWithToken("getAllProfile", null, null);
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

  const fetchPools = async () => {
    try {
      setLoadingPools(true);
      const response = await getDataHandlerWithToken("getAllPools", null, null);
      if (response) {
        setPools(response);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch pools",
        variant: "destructive",
      });
    } finally {
      setLoadingPools(false);
    }
  };

  const fetchStages = async () => {
    try {
      setLoadingStages(true);
      const response = await getDataHandlerWithToken("getAllStages", null, null);
      if (response) {
        setStages(response);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch stages",
        variant: "destructive",
      });
    } finally {
      setLoadingStages(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setFetchingData(true);
      await Promise.all([
        fetchUsers(),
        fetchRoles(),
        fetchDepartments(),
        fetchPools(),
        fetchStages()
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

  // User Handlers
  const handleAddUser = async (userData: any) => {
    try {
      const response = await postDataHandlerWithToken("addNewEmp", userData);
      toast({
        title: "Success",
        description: "User created successfully",
      });
      fetchUsers();
      return response;
    } catch (error: any) {
      console.log(error, error.success, error.message)
      if (!error.success) {
        toast({
          title: error.success,
          description: error.message || "Failed to create user",
          variant: "destructive",
        });
        throw error;
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to create user",
          variant: "destructive",
        });
        throw error;
      }
    }
  };

  const handleUpdateUser = async (userId: string, data: any) => {
    try {
      const endpoint = ApiConfig.updateUser(userId);
      const response = await patchTokenDataHandler(endpoint, {
        name: data.name,
        email: data.email,
        number: data.number,
        role: data.role,
        departmentId: data.departmentId,
        education: data.education,
        salary: parseInt(data.salary) || 0,
        reportingSeniorId: data.reportingSeniorId,
        poolId: data.poolId || null,
        extraAccessControls: data.extraAccessControls.filter((control: any) => control.actions.length > 0)
      }, true);

      toast({
        title: "Success",
        description: response?.message || "User updated successfully",
      });
      fetchUsers();
      return response;
    } catch (error: any) {
      console.log(error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateStatus = async (userId: string, status: string) => {
    try {
      const endpoint = ApiConfig.updateStatus(userId);
      const response = await patchTokenDataHandler(endpoint, { status }, true);
      toast({
        title: "Success",
        description: response?.message || "Status updated successfully",
      });
      fetchUsers();
      return response;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update status",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleToggleBlock = async (userId: string) => {
    try {
      const endpoint = ApiConfig.blockUser(userId);
      const response = await patchTokenDataHandler(endpoint, {}, true);
      toast({
        title: "Success",
        description: response?.message || "User status updated",
      });
      fetchUsers();
      return response;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update user",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleCreateProfile = async (userId: string, data: any) => {
    try {
      const endpoint = ApiConfig.profileGen(userId);
      const response = await patchTokenDataHandler(endpoint, {
        departmentId: data.departmentId,
        education: data.education,
        salary: parseInt(data.salary) || 0,
        reportingSeniorId: data.reportingSeniorId,
        poolId: data.poolId || null,
        extraAccessControls: data.extraAccessControls.filter((control: any) => control.actions.length > 0)
      }, true);

      toast({
        title: "Success",
        description: response?.message || "Profile created successfully",
      });
      fetchUsers();
      return response;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create profile",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Role Handlers
  const handleAddRole = async (roleData: any) => {
    try {
      const dataToSend: any = {
        name: roleData.name,
        isSuperAdmin: roleData.isSuperAdmin || false
      };

      // Only add permissions and reportingRole if not Super Admin
      if (!roleData.isSuperAdmin) {
        dataToSend.permissions = roleData.permissions
          .filter((perm: any) => perm.actions.length > 0)
          .map((perm: any) => ({
            module: perm.module,
            actions: perm.actions
          }));

        if (roleData.reportingRole && roleData.reportingRole !== "") {
          dataToSend.reportingRole = roleData.reportingRole;
        }
      }

      const response = await postDataHandlerWithToken("addNewRole", dataToSend);
      toast({
        title: "Success",
        description: response?.message || "Role created successfully",
      });
      fetchRoles();
      return response;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create role",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateRole = async (roleId: string, roleData: any) => {
    try {
      const dataToSend: any = {
        name: roleData.name,
        isSuperAdmin: roleData.isSuperAdmin || false
      };

      // Only add permissions and reportingRole if not Super Admin
      if (!roleData.isSuperAdmin) {
        dataToSend.permissions = roleData.permissions
          .filter((perm: any) => perm.actions.length > 0)
          .map((perm: any) => ({
            module: perm.module,
            actions: perm.actions
          }));

        if (roleData.reportingRole && roleData.reportingRole !== "") {
          dataToSend.reportingRole = roleData.reportingRole;
        } else {
          dataToSend.reportingRole = null;
        }
      } else {
        // Clear permissions and reporting role for Super Admin
        dataToSend.permissions = [];
        dataToSend.reportingRole = null;
      }

      const endpoint = ApiConfig.updateRole(roleId);
      const response = await patchTokenDataHandler(endpoint, dataToSend, true);
      toast({
        title: "Success",
        description: response?.message || "Role updated successfully",
      });
      fetchRoles();
      return response;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update role",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users Management</h1>
          <p className="text-muted-foreground">Manage users, roles, departments, pools, and stages</p>
        </div>
        <div className="flex items-center gap-2">
          {fetchingData && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Refreshing...
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
            disabled={fetchingData}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", fetchingData && "animate-spin")} />
            Refresh
          </Button>

          {activeTab === 'users' && (
            <NewUserModal
              roles={roles}
              loadingRoles={loadingRoles}
              onSubmit={handleAddUser}
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="pools" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Pools
          </TabsTrigger>
          <TabsTrigger value="stages" className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Stages
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Users Tab */}
      {/* Users Tab */}
      {activeTab === 'users' && (
        <UsersTab
          users={users}
          roles={roles}
          departments={departments}
          pools={pools}
          loading={loading}
          loadingPools={loadingPools}
          fetchingData={fetchingData}
          onRefresh={fetchAllData}
          onUpdateUser={handleUpdateUser}
          onUpdateStatus={handleUpdateStatus}
          onToggleBlock={handleToggleBlock}
          onCreateProfile={handleCreateProfile}
        />
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <RolesTab
          roles={roles}
          loading={loadingRoles}
          onAddRole={handleAddRole}
          onUpdateRole={handleUpdateRole}
        />
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <DepartmentsTab
          departments={departments}
          loading={loadingDepartments}
          onAddDepartment={handleAddDepartment}
          onUpdateDepartment={handleUpdateDepartment}
        />
      )}

      {/* Pools Tab */}
      {activeTab === 'pools' && (
        <PoolsTab
          pools={pools}
          loading={loadingPools}
          onAddPool={handleAddPool}
          onUpdatePool={handleUpdatePool}
          onToggleActive={handleTogglePoolActive}
          onRefresh={fetchPools}
          fetchingData={fetchingData}
        />
      )}

      {/* Stages Tab */}
      {activeTab === 'stages' && (
        <StagesTab
          stages={stages}
          loading={loadingStages}
          onAddStage={handleAddStage}
          onUpdateStage={handleUpdateStage}
          onRefresh={fetchStages}
          fetchingData={fetchingData}
        />
      )}
    </div>
  );
}