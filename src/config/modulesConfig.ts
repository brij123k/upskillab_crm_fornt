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
      { id: 'user_activity', label: 'View User Activity' },
      // { id: 'password_reset', label: 'Reset Password' }
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
  source_campaigns: {
    id: 'source_campaigns',
    label: 'Source Campaigns',
    actions: [
      { id: 'create', label: 'Create Campaign' },
      { id: 'read', label: 'View Campaigns' },
      { id: 'update', label: 'Update Campaign' },
      { id: 'toggle_status', label: 'Toggle Campaign Status' },
    ]
  },
  orders: {
    id: 'orders',
    label: 'Order Management',
    actions: [
      { id: 'create', label: 'Create Order' },
      { id: 'read', label: 'View Order' },
      { id: 'update', label: 'Update Order' },
      { id: 'approve', label: 'Approve Order' },
      { id: 'read_loans', label: 'Read Loans' },
      { id: 'send_reminders', label: 'Send Reminders' },
      { id: 'payment_link_generator', label: 'Generate Payment Link' },
      { id: 'read_payment_history', label: 'Read Payment History' },
    ]
  },
  loan_partner: {
    id: 'loan_partner',
    label: 'Loan Partner Management',
    actions: [
      { id: 'create', label: 'Create Loan Partner' },
      { id: 'read', label: 'View Loan Partners' },
      { id: 'update', label: 'Update Loan Partner' },
      { id: 'approve', label: 'Approve Loan Partner' },
      { id: 'toggle_status', label: 'Toggle Loan Partner Status' },
    ]
  },
  task: {
    id: 'task',
    label: 'Task Management',
    actions: [
      { id: 'create', label: 'Create Task' },
      { id: 'read', label: 'View Tasks' },
      { id: 'change_status', label: 'Change Task Status' },
    ]
  },
  leave: {
    id: 'leave',
    label: 'Leave Management',
    actions: [
      { id: 'approve', label: 'Approve / Reject Leave' },
    ]
  },
  reports: {
    id: 'reports',
    label: 'Reports & Analytics',
    actions: [
      { id: 'read', label: 'View Reports' },
      { id: 'export', label: 'Export Reports' },
      { id: 'generate', label: 'Generate Reports' },
      { id: 'share', label: 'Share Reports' },
      { id: 'salary_sheet', label: 'Employee Salary Sheet' }
    ]
  },
  targets: {
    id: 'targets',
    label: 'Target Management',
    actions: [
      { id: 'create', label: 'Create Target' },
      { id: 'read', label: 'View Target' },
      { id: 'update', label: 'Update Target' },
      { id: 'copy', label: 'Copy Monthly Target' },
    ]
  }

};

export const availableModules = Object.values(modulesConfig);
