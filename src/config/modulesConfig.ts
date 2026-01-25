export interface ModuleAction {
  id: string;
  label: string;
}

export interface ModuleConfig {
  id: string;
  label: string;
  actions: ModuleAction[];
}

export const modulesConfig: Record<string, ModuleConfig> = {
  leads: {
    id: 'leads',
    label: 'Lead Management',
    actions: [
      { id: 'create', label: 'Create Lead' },
      { id: 'read', label: 'View Leads' },
      { id: 'update', label: 'Update Lead' },
      { id: 'delete', label: 'Delete Lead' },
      { id: 'assign', label: 'Assign Lead' },
      { id: 'status_change', label: 'Change Lead Status' },
      { id: 'export', label: 'Export Leads' }
    ]
  },
  users: {
    id: 'users',
    label: 'User Management',
    actions: [
      { id: 'create', label: 'Create User' },
      { id: 'read', label: 'View Users' },
      { id: 'update', label: 'Update User' },
      { id: 'delete', label: 'Delete User' },
      { id: 'status', label: 'Change User Status' },
      { id: 'block', label: 'Block/Unblock User' },
      { id: 'password_reset', label: 'Reset Password' }
    ]
  },
  roles: {
    id: 'roles',
    label: 'Role Management',
    actions: [
      { id: 'create', label: 'Create Role' },
      { id: 'read', label: 'View Roles' },
      { id: 'update', label: 'Update Role' },
      { id: 'delete', label: 'Delete Role' },
      { id: 'assign', label: 'Assign Role' }
    ]
  },
  departments: {
    id: 'departments',
    label: 'Department Management',
    actions: [
      { id: 'create', label: 'Create Department' },
      { id: 'read', label: 'View Departments' },
      { id: 'update', label: 'Update Department' },
      { id: 'delete', label: 'Delete Department' },
      { id: 'assign', label: 'Assign to Department' }
    ]
  },
  campaigns: {
    id: 'campaigns',
    label: 'Campaign Management',
    actions: [
      { id: 'create', label: 'Create Campaign' },
      { id: 'read', label: 'View Campaigns' },
      { id: 'update', label: 'Update Campaign' },
      { id: 'delete', label: 'Delete Campaign' },
      { id: 'assign', label: 'Assign Campaign' },
      { id: 'export', label: 'Export Campaigns' }
    ]
  },
  reports: {
    id: 'reports',
    label: 'Reports & Analytics',
    actions: [
      { id: 'read', label: 'View Reports' },
      { id: 'export', label: 'Export Reports' },
      { id: 'generate', label: 'Generate Reports' },
      { id: 'share', label: 'Share Reports' }
    ]
  }
};

export const availableModules = Object.values(modulesConfig);