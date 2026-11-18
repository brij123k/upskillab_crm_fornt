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
  IVREnabled?: boolean;
  profile?: ProfileType;
  onboarding?: OnboardingInfo;
}

export type OnboardingStatus = 'not_shared' | 'pending' | 'submitted' | 'approved';

export interface OnboardingInfo {
  status: OnboardingStatus;
  linkActive: boolean;
  sharedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  submissionCount?: number;
  token?: string;
  link?: string | null;
}

export interface PersonalDetails {
  dateOfBirth?: string;
  gender?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  bloodGroup?: string;
  alternateMobile?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactRelation?: string;
}

export interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface BankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  accountType: 'Savings' | 'Current' | 'Salary';
}

export interface EducationalDetail {
  qualification: string;
  instituteName: string;
  boardOrUniversity: string;
  passingYear: number;
  percentageOrCGPA: string;
  /** Uploaded marksheet / certificate URL. */
  certificate?: string;
}

export interface Documents {
  aadhaarFront?: string;
  aadhaarBack?: string;
  panCard?: string;
  passbook?: string;
  educationalCertificates?: string[];
}

export interface ProfileType {
  _id: string;
  userId: string;
  departmentId: DepartmentType;
  reportingManagerId: any;
  education: string;
   profileImage?: string;
  salary: number;
  reportingSeniorId:{
    _id:string;
    name:string;
  };
poolIds?: string[] | PoolType[]; 
  extraAccessControls: Array<{
    module: string;
    actions: string[];
    _id: string;
  }>;

  personalDetails?: PersonalDetails;
   address?: Address;
  currentAddress?: Address;
  bankDetails?: BankDetails;
  educationalDetails?: EducationalDetail[];
  documents?: Documents;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
export interface PoolType {
  _id: string;
  name: string;
  shortName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StageType {
  _id: string;
  name: string;
  departmentId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}
export interface RoleType {
  _id: string;
  name: string;
  levelId:{
    _id:string;
    name:string;
  };
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
