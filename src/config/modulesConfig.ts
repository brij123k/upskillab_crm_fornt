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
      { id: 'assign', label: 'Assign Lead' },
      { id: 'status_change', label: 'Change Lead Status' },
      { id: 'stage_change', label: 'Change Lead Stage' },
      { id: 'export', label: 'Export Leads' }
    ]
  },
  Calls:{
    id:'call_logs',
    label: 'Call Logs Management',
    actions:[
      {id:'create', label:'create Call Log'},
      {id:'read', label:'read Call Log'}
    ]
  },
  Meeting:{
    id:'meeting_logs',
    label:'Meeting Logs Management',
    actions:[
      {id:'create', label:'create Meeting Log'},
      {id:'read', label:'read Meeting Log'}
    ],
  },
  users: {
    id: 'user',
    label: 'User Management',
    actions: [
      { id: 'create', label: 'Create User' },
      { id: 'read', label: 'View Users' },
      { id: 'update', label: 'Update User' },
      { id: 'status', label: 'Change User Status' },
      { id: 'block', label: 'Block/Unblock User' },
      { id: 'password_reset', label: 'Reset Password' }
    ]
  },
  roles: {
    id: 'role',
    label: 'Role Management',
    actions: [
      { id: 'create', label: 'Create Role' },
      { id: 'read', label: 'View Roles' },
      { id: 'update', label: 'Update Role' },
      { id: 'assign', label: 'Assign Role' }
    ]
  },
  departments: {
    id: 'department',
    label: 'Department Management',
    actions: [
      { id: 'create', label: 'Create Department' },
      { id: 'read', label: 'View Departments' },
      { id: 'update', label: 'Update Department' },
      { id: 'assign', label: 'Assign to Department' }
    ]
  },
  pool: {
    id: 'pool',
    label: 'Pool Management',
    actions: [
      { id: 'create', label: 'Create Pool' },
      { id: 'read', label: 'View Pool' },
      { id: 'update', label: 'Update Pool' },
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