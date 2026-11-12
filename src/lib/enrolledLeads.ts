// Enrolled leads: students imported from Upskillab (GET /external/crm/students).
import { hasPermission } from '@/utils/permissions';

export interface EnrolledStage {
  _id: string;
  name: string;
  color: string;
  order: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface EnrolledLead {
  _id: string;
  studentId: string;
  userId?: string;
  email?: string;
  mobileNumber?: string;
  username?: string;
  userType?: string;
  isActive?: boolean;
  status?: string;
  fullName?: string;
  college?: string;
  studentType?: string;
  bio?: string;
  skills?: string[];
  image?: string;
  studentCreatedAt?: string;
  studentUpdatedAt?: string;
  courses: string[];
  courseIds: string[];
  batches: string[];
  batchIds: string[];
  completedBatches: string[];
  ongoingBatches: string[];
  upcomingBatches: string[];
  batchStatuses: string[];
  paymentSummary?: {
    totalOrders?: number;
    totalAmount?: number;
    amountPaid?: number;
    discountAmount?: number;
    balanceDue?: number;
  };
  orders?: any[];
  raw?: Record<string, any>;
  stageId?: string;
  stageName?: string;
  assignedTo?: { _id: string; name: string; employeeId?: string; email?: string } | null;
  assignedDate?: string;
  lastActivityAt?: string;
  lastActivityType?: string;
  firstSyncedAt?: string;
  lastSyncedAt?: string;
}

export interface EnrolledHistory {
  _id: string;
  actionType: string;
  fromStage?: string;
  toStage?: string;
  note?: string;
  actionBy?: { _id: string; name: string; employeeId?: string } | null;
  changes?: Record<string, any>;
  createdAt: string;
}

export interface EnrolledCourse {
  _id: string;
  upskillabId: string;
  courseName?: string;
  category?: string;
  language?: string;
  data?: Record<string, any>;
  crmStudents?: number;
  lastSyncedAt?: string;
}

export interface EnrolledBatch {
  _id: string;
  upskillabId: string;
  batchCode?: string;
  courseId?: string;
  courseName?: string;
  teacherName?: string;
  status?: string;
  active?: boolean;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  duration?: string;
  seats?: number;
  enrolledStudents?: number;
  paidStudents?: number;
  totalOrders?: number;
  crmStudents?: number;
  lastSyncedAt?: string;
}

export interface SyncRun {
  _id: string;
  trigger: 'CRON' | 'MANUAL';
  triggeredBy?: { name: string; employeeId?: string } | null;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  startedAt: string;
  finishedAt?: string;
  studentsFetched: number;
  newStudents: number;
  updatedStudents: number;
  statusChanged: number;
  coursesFetched: number;
  newCourses: number;
  batchesFetched: number;
  newBatches: number;
  error?: string;
}

export interface EnrolledMeta {
  stages: EnrolledStage[];
  courses: { upskillabId: string; courseName?: string }[];
  batches: { upskillabId: string; batchCode?: string; courseId?: string; courseName?: string; status?: string }[];
  statuses: string[];
  batchStatuses: string[];
  lastSync?: SyncRun | null;
}

/** Things a user can log; "stage_changed" = only move the stage. */
export const ACTIVITY_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'note', label: 'Note' },
  { value: 'stage_changed', label: 'Stage change only' },
] as const;

export const ACTION_LABEL: Record<string, string> = {
  created: 'Imported from Upskillab',
  stage_changed: 'Stage changed',
  call: 'Call',
  whatsapp: 'WhatsApp',
  email: 'Email',
  meeting: 'Meeting',
  note: 'Note',
  assigned: 'Assignment',
  status_synced: 'Status updated from Upskillab',
};

export const titleCase = (value?: string | null) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : '';

export const formatINR = (value?: number) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const formatDate = (value?: string | Date | null) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (value?: string | Date | null) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const BATCH_STATUS_TONE: Record<string, string> = {
  ongoing: 'bg-blue-50 text-blue-700 ring-blue-200',
  upcoming: 'bg-amber-50 text-amber-700 ring-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

/** Formats seconds as m:ss. */
export const formatDuration = (seconds?: number) => {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** Fired after call details are saved, so open pages can refresh. */
export const ENROLLED_CALL_SAVED_EVENT = 'enrolled-call-saved';

/**
 * Admin panel sees everything; BD panel follows role permissions.
 * enrolled_leads:full_access allows every action (for the user's own leads).
 */
export function enrolledPermissions(panel: 'admin' | 'bd') {
  const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');
  const full = hasPermission(permissions, 'enrolled_leads', 'full_access');
  const can = (action: string) =>
    panel === 'admin' || full || hasPermission(permissions, 'enrolled_leads', action);
  return {
    canCall: can('call'),
    canUpdate: can('update'),
    canAssign: can('assign'),
    canSync: can('sync'),
    canManageStages: can('manage_stages'),
  };
}

export const unwrapError = (error: any, fallback: string) => {
  const body = error?.response?.data ?? error;
  if (Array.isArray(body?.message)) return body.message.join('; ');
  return (typeof body?.message === 'string' && body.message) || error?.message || fallback;
};
