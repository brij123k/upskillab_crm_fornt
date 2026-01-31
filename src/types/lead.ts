export interface LeadType {
  _id: string;
  leadId: number;
  name: string;
  phone: string;
  email: string;
  source: string;
  stageId: {
    _id: string;
    name: string;
    order: number;
  };
  status: 'active' | 'lost' | 'converted';
  healthScore: number;
  modifiedBy: string;
  modifiedAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface StageType {
  _id: string;
  name: string;
  order: number;
}

export interface UserType {
  _id: string;
  name: string;
  email: string;
  profile?: {
    departmentId?: {
      _id: string;
      name: string;
    };
  };
}

export interface LeadHistoryType {
  _id: string;
  leadId: string;
  actionType: string;
  actionBy: {
    _id: string;
    name: string;
    email: string;
  };
  fromUser?: {
    _id: string;
    name: string;
    email: string;
  };
  toUser?: {
    _id: string;
    name: string;
    email: string;
  };
  changes: any;
  reason:string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}