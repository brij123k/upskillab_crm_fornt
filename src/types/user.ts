export interface UserType {
  _id: string;
  employeeId:string;
  name: string;
  email: string;
  number: string;
  status: 'active' | 'inactive' | 'probation' | 'resigned';
  isBlocked: boolean;
  isDashboardEnabled: boolean;
  role: RoleType;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  profile?: ProfileType;
}

export interface ProfileType {
  _id: string;
  userId: string;
  departmentId: DepartmentType;
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
}

export interface RoleType {
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

export interface DepartmentType {
  _id: string;
  name: string;
  parentDepartmentId: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface PermissionType {
  module: string;
  actions: string[];
}