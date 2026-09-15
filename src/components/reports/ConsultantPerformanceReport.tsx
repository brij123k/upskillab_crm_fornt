import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  RefreshCw,
  Download,
  Filter,
  Search,
  Award,
  IndianRupee,
  Users,
  ChevronUp,
  ChevronDown,
  X,
  Eye,
  Phone,
  Calendar as CalendarIcon,
  CreditCard,
  Tag,
  TrendingUp,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  CalendarClock,
  UserCog,
  Plus,
  Minus,
  UserPlus,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*                                Types                                       */
/* -------------------------------------------------------------------------- */
interface OrderDetailItem {
  _id?: string;
  studentName?: string;
  email?: string;
  mobile?: string;
  courseName?: string;
  orderDate?: string;
  paymentMode?: string;
  status?: string;
  revenue?: number;
  finalFee?: number;
  discount?: number;
  totalFee?: number;
  courseDuration?: string;
  countedRevenue?: number;
}

interface LeadDetailItem {
  _id?: string;
  name?: string;
  studentName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  city?: string;
  state?: string;
  source?: string;
  source_campaign?: string;
  leadStatus?: string;
  status?: string;
  assignedDate?: string;
  createdAt?: string;
}

interface ConsultantPerformance {
  _id?: string;
  consultantId?: string;
  consultantName: string;
  consultantEmail?: string;
  totalLeadAssigned: number;
  admDone: number;
  bookedRevenue: number;
  realisedRevenue: number;
  teamSize?: number;
  team?: boolean;
  children?: ConsultantPerformance[];
  level?: number;
  parentId?: string | null;
  isTeamMember?: boolean;
  [key: string]: any;
}

/* -------------------------------------------------------------------------- */
/*                                Utility Helpers                              */
/* -------------------------------------------------------------------------- */
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusColor = (status: string) => {
  if (!status) return 'text-slate-600 bg-slate-50';
  const s = status.toLowerCase();
  if (s === 'fully paid' || s === 'paid') return 'text-emerald-600 bg-emerald-50';
  if (s === 'partially paid') return 'text-amber-600 bg-amber-50';
  if (s === 'pending') return 'text-orange-600 bg-orange-50';
  if (s === 'cancelled' || s === 'canceled') return 'text-red-600 bg-red-50';
  if (s === 'completed') return 'text-blue-600 bg-blue-50';
  if (s === 'assigned') return 'text-purple-600 bg-purple-50';
  if (s === 'converted') return 'text-emerald-600 bg-emerald-50';
  if (s === 'lost') return 'text-red-600 bg-red-50';
  if (s === 'active') return 'text-blue-600 bg-blue-50';
  if (s === 'pcat_registered') return 'text-purple-600 bg-purple-50';
  return 'text-slate-600 bg-slate-50';
};

const getLeadStatusColor = (status: string) => {
  if (!status) return 'text-slate-600 bg-slate-50';
  const s = status.toLowerCase();
  if (s === 'active') return 'text-blue-600 bg-blue-50';
  if (s === 'pcat_registered') return 'text-purple-600 bg-purple-50';
  if (s === 'converted') return 'text-emerald-600 bg-emerald-50';
  if (s === 'lost') return 'text-red-600 bg-red-50';
  if (s === 'assigned') return 'text-amber-600 bg-amber-50';
  return 'text-slate-600 bg-slate-50';
};

/* -------------------------------------------------------------------------- */
/*                            Date Filter Options                              */
/* -------------------------------------------------------------------------- */
const dateFilterOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

/* -------------------------------------------------------------------------- */
/*                          Sub-component: Team Member Table                   */
/* -------------------------------------------------------------------------- */

interface TeamMemberTableProps {
  teamMembers: ConsultantPerformance[];
  level: number;
  expandedEmployees: Set<string>;
  loadingHierarchy: Set<string>;
  toggleExpand: (consultantId: string, hasTeam: boolean) => void;
  onMetricClick: (consultant: ConsultantPerformance, type: string) => void;
}

function TeamMemberTable({
  teamMembers,
  level,
  expandedEmployees,
  loadingHierarchy,
  toggleExpand,
  onMetricClick,
}: TeamMemberTableProps) {
  return (
    <div className="mt-2 mb-1">
      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-orange-600">
        <UserPlus className="w-3.5 h-3.5" />
        <span>Team Members ({teamMembers.length})</span>
      </div>
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-orange-50/50 hover:bg-orange-50/50 border-b border-slate-200">
              <TableHead className="text-[10px] font-semibold text-slate-500 uppercase sticky left-0 bg-orange-50/50 z-10 min-w-[180px] py-2">
                Employee
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center min-w-[100px] py-2">
                Leads Assigned
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center min-w-[100px] py-2">
                Admissions
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center min-w-[120px] py-2 bg-orange-50/50">
                Realised Revenue
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.map((member) => {
              const hasTeam = member.teamSize && member.teamSize > 1;
              const isExpanded = expandedEmployees.has(member._id || member.consultantId || '');
              const isLoading = loadingHierarchy.has(member._id || member.consultantId || '');
              const consultantId = member._id || member.consultantId || '';

              return (
                <>
                  <TableRow
                    key={consultantId}
                    className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                  >
                    <TableCell className="sticky left-0 bg-white border-r z-10 py-2">
                      <div className="flex flex-col min-w-[150px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium text-slate-800 truncate max-w-[120px]">
                            {member.consultantName}
                          </span>
                          {hasTeam? (
                            <button
                              onClick={() => toggleExpand(consultantId, true)}
                              disabled={isLoading}
                              className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center transition-all flex-shrink-0",
                                "hover:bg-orange-100 text-orange-500 border border-orange-200",
                                isExpanded && "bg-orange-100 border-orange-300",
                                isLoading && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {isLoading ? (
                                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              ) : isExpanded ? (
                                <Minus className="w-2.5 h-2.5" />
                              ) : (
                                <Plus className="w-2.5 h-2.5" />
                              )}
                            </button>
                          ):(<></>)}
                          {member.teamSize && member.teamSize > 1? (
                            <span className="text-[7px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded-full whitespace-nowrap">
                              Team: {member.teamSize}
                            </span>
                          ):(<></>)}
                        </div>
                        {member.consultantEmail && (
                          <span className="text-[8px] text-slate-400 truncate max-w-[130px]">
                            {member.consultantEmail}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <button
                        onClick={() => onMetricClick(member, 'assigned-leads')}
                        disabled={!member.totalLeadAssigned}
                        className={cn(
                          "text-xs font-medium transition-all hover:scale-105 px-2 py-1 rounded-lg",
                          member.totalLeadAssigned > 0
                            ? "text-blue-600 hover:bg-blue-50 cursor-pointer"
                            : "text-slate-400 cursor-not-allowed"
                        )}
                      >
                        {member.totalLeadAssigned || 0}
                      </button>
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <button
                        onClick={() => onMetricClick(member, 'admission-leads')}
                        disabled={!member.admDone}
                        className={cn(
                          "text-xs font-medium transition-all hover:scale-105 px-2 py-1 rounded-lg",
                          member.admDone > 0
                            ? "text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                            : "text-slate-400 cursor-not-allowed"
                        )}
                      >
                        {member.admDone || 0}
                      </button>
                    </TableCell>
                    <TableCell className="text-center py-2 bg-orange-50/30">
                      <button
                        onClick={() => onMetricClick(member, 'orders')}
                        disabled={!member.realisedRevenue}
                        className={cn(
                          "text-xs font-medium transition-all hover:scale-105 px-2 py-1 rounded-lg",
                          member.realisedRevenue > 0
                            ? "text-orange-600 hover:bg-orange-50 cursor-pointer"
                            : "text-slate-400 cursor-not-allowed"
                        )}
                      >
                        {formatCurrency(member.realisedRevenue || 0)}
                      </button>
                    </TableCell>
                  </TableRow>
                  {/* Nested team members */}
                  {isExpanded && member.children && member.children.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="p-0">
                        <div className="ml-6 pl-4 border-l-2 border-orange-200">
                          <TeamMemberTable
                            teamMembers={member.children}
                            level={level + 1}
                            expandedEmployees={expandedEmployees}
                            loadingHierarchy={loadingHierarchy}
                            toggleExpand={toggleExpand}
                            onMetricClick={onMetricClick}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Main Report Component                          */
/* -------------------------------------------------------------------------- */
export function ConsultantPerformanceReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ConsultantPerformance[] | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Level filter
  const [levels, setLevels] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState('1');

  // Team filter (checkbox)
  const [showTeamOnly, setShowTeamOnly] = useState<boolean>(false);

  // Date filters - all default to 'none'
  const [leadCreatedDateFilter, setLeadCreatedDateFilter] = useState<string>('none');
  const [leadCreatedFromDate, setLeadCreatedFromDate] = useState('');
  const [leadCreatedToDate, setLeadCreatedToDate] = useState('');

  const [leadAssignedDateFilter, setLeadAssignedDateFilter] = useState<string>('none');
  const [leadAssignedFromDate, setLeadAssignedFromDate] = useState('');
  const [leadAssignedToDate, setLeadAssignedToDate] = useState('');

  const [orderCreatedDateFilter, setOrderCreatedDateFilter] = useState<string>('none');
  const [orderCreatedFromDate, setOrderCreatedFromDate] = useState('');
  const [orderCreatedToDate, setOrderCreatedToDate] = useState('');

  // User filter
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('all');

  // Search (consultant name)
  const [searchTerm, setSearchTerm] = useState('');

  // ─── Hierarchical State ──────────────────────────────────────────────────
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [hierarchicalData, setHierarchicalData] = useState<ConsultantPerformance[]>([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState<Set<string>>(new Set());

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState<{
    title: string;
    type: string;
    consultantName: string;
    total: number;
    items: any[];
  } | null>(null);

  // Pagination for modal
  const [modalPage, setModalPage] = useState(0);
  const [modalSearch, setModalSearch] = useState('');
  const ITEMS_PER_PAGE = 10;

  // ─── Fetch levels & users ───
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const res = await getDataHandlerWithToken('getAllLevels', null, null);
        if (res) {
          setLevels(res);
          if (res.length) setSelectedLevel(extractLevelNumber(res[0].name).toString());
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load levels', variant: 'destructive' });
      }
    };
    const fetchUsers = async () => {
      try {
        const res = await getDataHandlerWithToken('getAllUser', null, null);
        setUsers(res?.data || res || []);
      } catch (error) {
        /* ignore */
      }
    };
    fetchLevels();
    fetchUsers();
  }, []);

  const extractLevelNumber = (name: string): number => {
    const match = name.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  };

  // ─── Validate date range (max 31 days) ───
  const validateDateRange = (from: string, to: string): boolean => {
    if (!from || !to) return false;
    const diffTime = Math.abs(new Date(to).getTime() - new Date(from).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 31) {
      toast({ title: 'Date range too large', description: 'Max 31 days allowed', variant: 'destructive' });
      return false;
    }
    return true;
  };

  // ─── Helper to check if date filter is active ───
  const isDateFilterActive = (filterValue: string) => {
    return filterValue && filterValue !== 'none' && filterValue !== '';
  };

  // ─── Build Hierarchy ──────────────────────────────────────────────────────
  const buildHierarchy = useCallback((consultants: ConsultantPerformance[]): ConsultantPerformance[] => {
    return consultants.map(c => ({
      ...c,
      children: [],
      level: 0,
    }));
  }, []);

  // ─── Fetch consultant data ───
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        level: parseInt(selectedLevel) || 1,
      };

      // Team filter
      if (showTeamOnly) {
        params.team = true;
      }

      // Lead Created Date Filter - only if not 'none'
      if (isDateFilterActive(leadCreatedDateFilter)) {
        if (leadCreatedDateFilter === 'custom') {
          if (!leadCreatedFromDate || !leadCreatedToDate) {
            setLoading(false);
            return;
          }
          if (!validateDateRange(leadCreatedFromDate, leadCreatedToDate)) {
            setLoading(false);
            return;
          }
          params.leadCreatedDateFrom = leadCreatedFromDate;
          params.leadCreatedDateTo = leadCreatedToDate;
        } else {
          params.leadCreatedDateFilter = leadCreatedDateFilter;
        }
      }

      // Lead Assigned Date Filter - only if not 'none'
      if (isDateFilterActive(leadAssignedDateFilter)) {
        if (leadAssignedDateFilter === 'custom') {
          if (!leadAssignedFromDate || !leadAssignedToDate) {
            setLoading(false);
            return;
          }
          if (!validateDateRange(leadAssignedFromDate, leadAssignedToDate)) {
            setLoading(false);
            return;
          }
          params.leadAssignedDateFrom = leadAssignedFromDate;
          params.leadAssignedDateTo = leadAssignedToDate;
        } else {
          params.leadAssignedDateFilter = leadAssignedDateFilter;
        }
      }

      // Order Created Date Filter - only if not 'none'
      if (isDateFilterActive(orderCreatedDateFilter)) {
        if (orderCreatedDateFilter === 'custom') {
          if (!orderCreatedFromDate || !orderCreatedToDate) {
            setLoading(false);
            return;
          }
          if (!validateDateRange(orderCreatedFromDate, orderCreatedToDate)) {
            setLoading(false);
            return;
          }
          params.orderCreatedDateFrom = orderCreatedFromDate;
          params.orderCreatedDateTo = orderCreatedToDate;
        } else {
          params.orderCreatedDateFilter = orderCreatedDateFilter;
        }
      }

      if (selectedUserId && selectedUserId !== 'all') {
        params.counsellorId = selectedUserId;
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.consultantPerforment,
        params,
        null,
        true
      );
      const consultants = response?.employees || response || [];
      setTotalRevenue(response?.totalRevenue || 0);
      const consultantArray = Array.isArray(consultants) ? consultants : [];
      setData(consultantArray);
      
      const hierarchy = buildHierarchy(consultantArray);
      setHierarchicalData(hierarchy);
      setExpandedEmployees(new Set());
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load consultant performance', variant: 'destructive' });
      setData(null);
      setHierarchicalData([]);
    } finally {
      setLoading(false);
    }
  }, [
    selectedLevel,
    showTeamOnly,
    leadCreatedDateFilter,
    leadCreatedFromDate,
    leadCreatedToDate,
    leadAssignedDateFilter,
    leadAssignedFromDate,
    leadAssignedToDate,
    orderCreatedDateFilter,
    orderCreatedFromDate,
    orderCreatedToDate,
    selectedUserId,
    buildHierarchy,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Fetch Team Hierarchy ──────────────────────────────────────────────
  const fetchTeamHierarchy = useCallback(async (consultantId: string) => {
    if (loadingHierarchy.has(consultantId)) return;

    setLoadingHierarchy(prev => new Set(prev).add(consultantId));
    
    try {
      const params: any = {
        employeeId: consultantId,
        level: parseInt(selectedLevel) || 1,
      };

      if (showTeamOnly) {
        params.team = true;
      }

      // Lead Created Date Filter
      if (isDateFilterActive(leadCreatedDateFilter)) {
        if (leadCreatedDateFilter === 'custom') {
          if (leadCreatedFromDate) params.leadCreatedDateFrom = leadCreatedFromDate;
          if (leadCreatedToDate) params.leadCreatedDateTo = leadCreatedToDate;
        } else {
          params.leadCreatedDateFilter = leadCreatedDateFilter;
        }
      }

      // Lead Assigned Date Filter
      if (isDateFilterActive(leadAssignedDateFilter)) {
        if (leadAssignedDateFilter === 'custom') {
          if (leadAssignedFromDate) params.leadAssignedDateFrom = leadAssignedFromDate;
          if (leadAssignedToDate) params.leadAssignedDateTo = leadAssignedToDate;
        } else {
          params.leadAssignedDateFilter = leadAssignedDateFilter;
        }
      }

      // Order Created Date Filter
      if (isDateFilterActive(orderCreatedDateFilter)) {
        if (orderCreatedDateFilter === 'custom') {
          if (orderCreatedFromDate) params.orderCreatedDateFrom = orderCreatedFromDate;
          if (orderCreatedToDate) params.orderCreatedDateTo = orderCreatedToDate;
        } else {
          params.orderCreatedDateFilter = orderCreatedDateFilter;
        }
      }

      if (selectedUserId && selectedUserId !== 'all') {
        params.counsellorId = selectedUserId;
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.consultantPerformentTeam,
        params,
        null,
        true
      );

      const result = response?.data || response;
      const teamData = result?.employees || [];

      if (teamData.length > 0) {
        const updateHierarchy = (nodes: ConsultantPerformance[]): ConsultantPerformance[] => {
          return nodes.map((node: ConsultantPerformance) => {
            const nodeId = node._id || node.consultantId || '';
            if (nodeId === consultantId) {
              const teamMembers = teamData.map((member: any) => ({
                ...member,
                level: (node.level || 0) + 1,
                parentId: consultantId,
                isTeamMember: true,
                children: [],
              }));
              return {
                ...node,
                children: teamMembers,
              };
            }
            if (node.children && node.children.length > 0) {
              return {
                ...node,
                children: updateHierarchy(node.children),
              };
            }
            return node;
          });
        };

        setHierarchicalData(prev => updateHierarchy(prev));
        setExpandedEmployees(prev => new Set(prev).add(consultantId));
      } else {
        const updateHierarchy = (nodes: ConsultantPerformance[]): ConsultantPerformance[] => {
          return nodes.map((node: ConsultantPerformance) => {
            const nodeId = node._id || node.consultantId || '';
            if (nodeId === consultantId) {
              return { ...node, children: [] };
            }
            if (node.children && node.children.length > 0) {
              return { ...node, children: updateHierarchy(node.children) };
            }
            return node;
          });
        };
        setHierarchicalData(prev => updateHierarchy(prev));
        setExpandedEmployees(prev => new Set(prev).add(consultantId));
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load team hierarchy',
        variant: 'destructive',
      });
    } finally {
      setLoadingHierarchy(prev => {
        const newSet = new Set(prev);
        newSet.delete(consultantId);
        return newSet;
      });
    }
  }, [selectedLevel, showTeamOnly, leadCreatedDateFilter, leadCreatedFromDate, leadCreatedToDate, leadAssignedDateFilter, leadAssignedFromDate, leadAssignedToDate, orderCreatedDateFilter, orderCreatedFromDate, orderCreatedToDate, selectedUserId, loadingHierarchy]);

  // ─── Toggle Expand ──────────────────────────────────────────────────────
  const toggleExpand = useCallback(async (consultantId: string, hasTeam: boolean) => {
    if (expandedEmployees.has(consultantId)) {
      setExpandedEmployees(prev => {
        const newSet = new Set(prev);
        newSet.delete(consultantId);
        return newSet;
      });
      
      const removeChildren = (nodes: ConsultantPerformance[]): ConsultantPerformance[] => {
        return nodes.map((node: ConsultantPerformance) => {
          const nodeId = node._id || node.consultantId || '';
          if (nodeId === consultantId) {
            return { ...node, children: [] };
          }
          if (node.children && node.children.length > 0) {
            return { ...node, children: removeChildren(node.children) };
          }
          return node;
        });
      };
      setHierarchicalData(prev => removeChildren(prev));
    } else if (hasTeam) {
      await fetchTeamHierarchy(consultantId);
    }
  }, [expandedEmployees, fetchTeamHierarchy]);

  // ─── Fetch detail data for modal ───
  const fetchDetailData = async (consultantId: string, consultantName: string, type: string, title: string) => {
    setModalLoading(true);
    setModalPage(0);
    setModalSearch('');
    try {
      const params: any = {
        counsellorId: consultantId,
        type: type,
      };

      // Team filter
      if (showTeamOnly) {
        params.team = true;
      }

      // Lead Created Date Filter - only if not 'none'
      if (isDateFilterActive(leadCreatedDateFilter)) {
        if (leadCreatedDateFilter === 'custom') {
          if (leadCreatedFromDate) params.leadCreatedDateFrom = leadCreatedFromDate;
          if (leadCreatedToDate) params.leadCreatedDateTo = leadCreatedToDate;
        } else {
          params.leadCreatedDateFilter = leadCreatedDateFilter;
        }
      }

      // Lead Assigned Date Filter - only if not 'none'
      if (isDateFilterActive(leadAssignedDateFilter)) {
        if (leadAssignedDateFilter === 'custom') {
          if (leadAssignedFromDate) params.leadAssignedDateFrom = leadAssignedFromDate;
          if (leadAssignedToDate) params.leadAssignedDateTo = leadAssignedToDate;
        } else {
          params.leadAssignedDateFilter = leadAssignedDateFilter;
        }
      }

      // Order Created Date Filter - only if not 'none'
      if (isDateFilterActive(orderCreatedDateFilter)) {
        if (orderCreatedDateFilter === 'custom') {
          if (orderCreatedFromDate) params.orderCreatedDateFrom = orderCreatedFromDate;
          if (orderCreatedToDate) params.orderCreatedDateTo = orderCreatedToDate;
        } else {
          params.orderCreatedDateFilter = orderCreatedDateFilter;
        }
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.consultantPerformentDetail,
        params,
        null,
        true
      );
      setModalData({
        title: title,
        type: type,
        consultantName: consultantName,
        total: response.total || 0,
        items: response.data || [],
      });
      setIsModalOpen(true);
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load details', variant: 'destructive' });
    } finally {
      setModalLoading(false);
    }
  };

  // ─── Handle click on metrics ───
  const handleMetricClick = (consultant: ConsultantPerformance, type: string) => {
    const consultantId = consultant._id || consultant.consultantId;
    if (!consultantId) {
      toast({ title: 'Error', description: 'Employee ID not found' });
      return;
    }

    let title = '';
    let count = 0;

    switch (type) {
      case 'assigned-leads':
        title = 'Assigned Leads';
        count = consultant.totalLeadAssigned || 0;
        break;
      case 'admission-leads':
        title = 'Admission Leads';
        count = consultant.admDone || 0;
        break;
      case 'orders':
        title = 'Orders';
        count = consultant.realisedRevenue > 0 ? 1 : 0;
        break;
      default:
        return;
    }

    if (count === 0) {
      toast({ title: 'No data', description: `No ${title.toLowerCase()} found for this consultant` });
      return;
    }

    fetchDetailData(consultantId, consultant.consultantName, type, title);
  };

  // ─── Export CSV ───
  const handleExport = () => {
    if (!data || data.length === 0) {
      toast({ title: 'No data to export' });
      return;
    }
    const headers = ['Employee', 'Leads Assigned', 'Admissions', 'Realised Revenue'];
    const rows = data.map(c => [
      c.consultantName || '',
      c.totalLeadAssigned || 0,
      c.admDone || 0,
      c.bookedRevenue || 0,
      c.realisedRevenue || 0,
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consultant_performance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  };

  // ─── Flatten hierarchy for filtering ───
  const flattenHierarchy = useCallback((nodes: ConsultantPerformance[]): ConsultantPerformance[] => {
    let result: ConsultantPerformance[] = [];
    nodes.forEach((node: ConsultantPerformance) => {
      result.push({ ...node, level: node.level || 0 });
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenHierarchy(node.children));
      }
    });
    return result;
  }, []);

  // ─── Client‑side search ───
  const flattenedData = flattenHierarchy(hierarchicalData);
  
  const filteredConsultants = flattenedData.filter(c =>
    searchTerm ? c.consultantName?.toLowerCase().includes(searchTerm.toLowerCase()) : true
  );

  // For pagination, use top-level only
  const topLevelConsultants = hierarchicalData;
  const filteredTopLevel = topLevelConsultants.filter(c =>
    searchTerm ? c.consultantName?.toLowerCase().includes(searchTerm.toLowerCase()) : true
  );
  const totalLeads = filteredConsultants.reduce((sum, c) => sum + (c.totalLeadAssigned || 0), 0);
  const totalAdmissions = filteredConsultants.reduce((sum, c) => sum + (c.admDone || 0), 0);

  const hasActiveFilters =
    selectedLevel !== '1' ||
    showTeamOnly ||
    isDateFilterActive(leadCreatedDateFilter) ||
    (leadCreatedDateFilter === 'custom' && (leadCreatedFromDate || leadCreatedToDate)) ||
    isDateFilterActive(leadAssignedDateFilter) ||
    (leadAssignedDateFilter === 'custom' && (leadAssignedFromDate || leadAssignedToDate)) ||
    isDateFilterActive(orderCreatedDateFilter) ||
    (orderCreatedDateFilter === 'custom' && (orderCreatedFromDate || orderCreatedToDate)) ||
    selectedUserId !== 'all' ||
    searchTerm !== '';

  // ─── Modal filtering and pagination ───
  const filteredModalItems = modalData?.items?.filter(item => {
    if (!modalSearch) return true;
    const searchLower = modalSearch.toLowerCase();
    const name = item.studentName || item.name || '';
    const email = item.email || '';
    const phone = item.mobile || item.phone || '';
    return name.toLowerCase().includes(searchLower) ||
           email.toLowerCase().includes(searchLower) ||
           phone.includes(searchLower);
  }) || [];

  const paginatedModalItems = filteredModalItems.slice(
    modalPage * ITEMS_PER_PAGE,
    (modalPage + 1) * ITEMS_PER_PAGE
  );

  const modalTotalPages = Math.ceil(filteredModalItems.length / ITEMS_PER_PAGE);

  // Check if team mode is active
  const isTeamMode = showTeamOnly;

  // Get display label for date filter
  const getDateFilterLabel = (filterValue: string) => {
    if (filterValue === 'none' || !filterValue) return 'None';
    const option = dateFilterOptions.find(o => o.value === filterValue);
    return option?.label || filterValue;
  };

  // ─── Render Lead Item ───
  const renderLeadItem = (item: LeadDetailItem) => {
    return (
      <TableRow className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
        <TableCell className="text-sm py-3">
          <div className="flex flex-col">
            <span className="font-medium text-slate-800">{item.name || item.studentName || 'N/A'}</span>
            <span className="text-xs text-slate-400">{item.email || 'No email'}</span>
          </div>
        </TableCell>
        <TableCell className="text-sm py-3">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm">{item.phone || item.mobile || 'N/A'}</span>
          </div>
        </TableCell>
        <TableCell className="text-sm py-3">
          <div className="flex flex-col">
            <span className="text-sm">{item.city || 'N/A'}</span>
            <span className="text-xs text-slate-400">{item.state || ''}</span>
          </div>
        </TableCell>
        <TableCell className="text-sm py-3">
          <span className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full",
            getLeadStatusColor(item.leadStatus || item.status || 'active')
          )}>
            {item.leadStatus || item.status || 'Active'}
          </span>
        </TableCell>
        <TableCell className="text-sm py-3">
          <div className="flex flex-col">
            <span className="text-xs">{item.source || 'N/A'}</span>
            {item.source_campaign && (
              <span className="text-[10px] text-slate-400">{item.source_campaign}</span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-sm py-3 text-slate-500">
          {formatDate(item.assignedDate || item.createdAt || '')}
        </TableCell>
      </TableRow>
    );
  };

  // ─── Render Order Item ───
  const renderOrderItem = (item: OrderDetailItem) => {
    const revenue = item.revenue || item.countedRevenue || 0;
    const finalFee = item.finalFee || item.totalFee || 0;
    const discount = item.discount || 0;
    const hasDiscount = discount > 0;

    return (
      <TableRow className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
        <TableCell className="text-sm py-3">
          <div className="flex flex-col">
            <span className="font-medium text-slate-800">{item.studentName || 'N/A'}</span>
            <span className="text-xs text-slate-400">{item.email || 'No email'}</span>
          </div>
        </TableCell>
        <TableCell className="text-sm py-3">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm">{item.mobile || 'N/A'}</span>
          </div>
        </TableCell>
        <TableCell className="text-sm py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">{item.courseName || 'N/A'}</span>
            {item.courseDuration && (
              <span className="text-xs text-slate-400">{item.courseDuration} days</span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-sm py-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-emerald-600">
              {formatCurrency(revenue)}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-sm py-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-slate-700">
              {formatCurrency(finalFee)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-emerald-600">
                Discount: -{formatCurrency(discount)}
              </span>
            )}
            {item.totalFee && item.totalFee !== finalFee && (
              <span className="text-xs text-slate-400 line-through">
                {formatCurrency(item.totalFee)}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-sm py-3 text-slate-500">
          {formatDate(item.orderDate || '')}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Employee Performance</h3>
          <p className="text-sm text-slate-500">Revenue & admissions by consultant</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="rounded-xl border-slate-200"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={!data || loading}
            className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-1 h-8 text-xs rounded-xl"
        >
          <Filter className="w-3 h-3" />
          Filters
          {hasActiveFilters && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-orange-500" />}
          {showFilters ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
        </Button>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 w-full">
            {/* Level Radio Buttons */}
            {levels.length > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase">Level</Label>
                <div className="flex flex-wrap gap-1">
                  {levels.map(lvl => (
                    <button
                      key={lvl._id}
                      onClick={() => setSelectedLevel(extractLevelNumber(lvl.name).toString())}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-lg border transition-all",
                        selectedLevel === extractLevelNumber(lvl.name).toString()
                          ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {lvl.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Team Checkbox */}
            <div className="flex items-center gap-2 ml-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="team-filter-consultant"
                  checked={showTeamOnly}
                  onCheckedChange={(checked) => {
                    setShowTeamOnly(checked === true);
                  }}
                  className="h-4 w-4 rounded border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <Label
                  htmlFor="team-filter-consultant"
                  className="text-xs font-medium text-slate-600 cursor-pointer"
                >
                  Team
                </Label>
              </div>
            </div>

            {/* Lead Created Date Filter */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
                <Label className="text-[10px] font-medium text-slate-500 uppercase whitespace-nowrap">Lead Created</Label>
              </div>
              <div className="w-[110px]">
                <Select value={leadCreatedDateFilter} onValueChange={setLeadCreatedDateFilter}>
                  <SelectTrigger className="h-8 text-xs rounded-xl">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">None</SelectItem>
                    {dateFilterOptions.map(opt => (
                      <SelectItem key={`created-${opt.value}`} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {leadCreatedDateFilter === 'custom' && (
              <>
                <div className="relative w-[120px]">
                  <input
                    type="date"
                    value={leadCreatedFromDate}
                    onChange={(e) => setLeadCreatedFromDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="relative w-[120px]">
                  <input
                    type="date"
                    value={leadCreatedToDate}
                    onChange={(e) => setLeadCreatedToDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </>
            )}

            {/* Lead Assigned Date Filter */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                <Label className="text-[10px] font-medium text-slate-500 uppercase whitespace-nowrap">Lead Assigned</Label>
              </div>
              <div className="w-[110px]">
                <Select value={leadAssignedDateFilter} onValueChange={setLeadAssignedDateFilter}>
                  <SelectTrigger className="h-8 text-xs rounded-xl">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">None</SelectItem>
                    {dateFilterOptions.map(opt => (
                      <SelectItem key={`assigned-${opt.value}`} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {leadAssignedDateFilter === 'custom' && (
              <>
                <div className="relative w-[120px]">
                  <input
                    type="date"
                    value={leadAssignedFromDate}
                    onChange={(e) => setLeadAssignedFromDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="relative w-[120px]">
                  <input
                    type="date"
                    value={leadAssignedToDate}
                    onChange={(e) => setLeadAssignedToDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </>
            )}

            {/* Order Created Date Filter */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <Label className="text-[10px] font-medium text-slate-500 uppercase whitespace-nowrap">Order Created</Label>
              </div>
              <div className="w-[110px]">
                <Select value={orderCreatedDateFilter} onValueChange={setOrderCreatedDateFilter}>
                  <SelectTrigger className="h-8 text-xs rounded-xl">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">None</SelectItem>
                    {dateFilterOptions.map(opt => (
                      <SelectItem key={`order-${opt.value}`} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {orderCreatedDateFilter === 'custom' && (
              <>
                <div className="relative w-[120px]">
                  <input
                    type="date"
                    value={orderCreatedFromDate}
                    onChange={(e) => setOrderCreatedFromDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="relative w-[120px]">
                  <input
                    type="date"
                    value={orderCreatedToDate}
                    onChange={(e) => setOrderCreatedToDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Max 31 days</span>
              </>
            )}

            {/* Consultant Search */}
            <div className="relative w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Search consultant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-8 text-xs rounded-xl border-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter Summary */}
      {!loading && data && data.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
          <span>
            Level:{' '}
            <span className="font-medium text-slate-700">
              {levels.find(l => extractLevelNumber(l.name).toString() === selectedLevel)?.name || `Level ${selectedLevel}`}
            </span>
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>
            Team:{' '}
            <span className="font-medium text-slate-700">
              {isTeamMode ? (
                <span className="flex items-center gap-1 text-orange-600">
                  <UserCog className="w-3 h-3" />
                  Enabled
                </span>
              ) : (
                'All'
              )}
            </span>
          </span>
          {isDateFilterActive(leadCreatedDateFilter) && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>
                Lead Created:{' '}
                <span className="font-medium text-slate-700">
                  {leadCreatedDateFilter === 'custom' 
                    ? `${formatDate(leadCreatedFromDate)} – ${formatDate(leadCreatedToDate)}`
                    : getDateFilterLabel(leadCreatedDateFilter)}
                </span>
              </span>
            </>
          )}
          {isDateFilterActive(leadAssignedDateFilter) && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>
                Lead Assigned:{' '}
                <span className="font-medium text-slate-700">
                  {leadAssignedDateFilter === 'custom' 
                    ? `${formatDate(leadAssignedFromDate)} – ${formatDate(leadAssignedToDate)}`
                    : getDateFilterLabel(leadAssignedDateFilter)}
                </span>
              </span>
            </>
          )}
          {isDateFilterActive(orderCreatedDateFilter) && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>
                Order Created:{' '}
                <span className="font-medium text-slate-700">
                  {orderCreatedDateFilter === 'custom' 
                    ? `${formatDate(orderCreatedFromDate)} – ${formatDate(orderCreatedToDate)}`
                    : getDateFilterLabel(orderCreatedDateFilter)}
                </span>
              </span>
            </>
          )}
          {selectedUserId !== 'all' && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>
                Consultant:{' '}
                <span className="font-medium text-slate-700">
                  {users.find(u => (u._id || u.id) === selectedUserId)?.name || selectedUserId}
                </span>
              </span>
            </>
          )}
          {searchTerm && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>
                Search:{' '}
                <span className="font-medium text-slate-700">"{searchTerm}"</span>
              </span>
            </>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
          <p className="ml-2 text-sm text-slate-500">Loading consultant data...</p>
        </div>
      ) : !data || data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Award className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No consultant data found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting filters or level</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Leads</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{totalLeads}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Admissions</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{totalAdmissions}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </Card>
            {isTeamMode && (
              <Card className="p-5 bg-orange-50 border border-orange-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-orange-600 uppercase tracking-wider">Team Mode</p>
                    <p className="text-sm font-semibold text-orange-700 mt-1">Active</p>
                  </div>
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <UserCog className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Table View */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 border-b border-slate-200">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50/80 z-10 min-w-[200px] py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5" />
                        Employee
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center min-w-[130px] py-3 px-4">
                      Leads Assigned
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center min-w-[130px] py-3 px-4">
                      Admissions
                    </TableHead>
                   
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center min-w-[150px] py-3 px-4 bg-orange-50/50">
                      <div className="flex items-center justify-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-orange-700">Realised Revenue</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTopLevel.map((consultant, idx) => {
                    const consultantId = consultant._id || consultant.consultantId || '';
                    const isExpanded = expandedEmployees.has(consultantId);
                    const hasTeam = consultant.teamSize && consultant.teamSize > 1;
                    const isLoading = loadingHierarchy.has(consultantId);

                    return (
                      <>
                        <TableRow
                          key={consultantId || idx}
                          className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                        >
                          <TableCell className="text-sm sticky left-0 bg-white border-r border-slate-100 z-10 py-3 px-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-slate-800">
                                  {consultant.consultantName}
                                </span>
                                {hasTeam && showTeamOnly ? (
                                  <button
                                    onClick={() => toggleExpand(consultantId, true)}
                                    disabled={isLoading}
                                    className={cn(
                                      "w-5 h-5 rounded-full flex items-center justify-center transition-all flex-shrink-0",
                                      "hover:bg-orange-100 text-orange-500 border border-orange-200",
                                      isExpanded && "bg-orange-100 border-orange-300",
                                      isLoading && "opacity-50 cursor-not-allowed"
                                    )}
                                  >
                                    {isLoading ? (
                                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    ) : isExpanded ? (
                                      <Minus className="w-2.5 h-2.5" />
                                    ) : (
                                      <Plus className="w-2.5 h-2.5" />
                                    )}
                                  </button>
                                ):(<></>)}
                                {consultant.teamSize && consultant.teamSize > 1 && showTeamOnly ? (
                                  <span className="text-[8px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                    Team: {consultant.teamSize}
                                  </span>
                                ):(<></>)}
                              </div>
                              {consultant.consultantEmail && (
                                <span className="text-xs text-slate-400">{consultant.consultantEmail}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center py-3 px-4">
                            <button
                              onClick={() => handleMetricClick(consultant, 'assigned-leads')}
                              disabled={!consultant.totalLeadAssigned}
                              className={cn(
                                "text-sm font-medium transition-all hover:scale-105 px-3 py-1 rounded-lg",
                                consultant.totalLeadAssigned > 0
                                  ? "text-blue-600 hover:bg-blue-50 cursor-pointer"
                                  : "text-slate-400 cursor-not-allowed"
                              )}
                            >
                              {consultant.totalLeadAssigned || 0}
                            </button>
                          </TableCell>
                          <TableCell className="text-center py-3 px-4">
                            <button
                              onClick={() => handleMetricClick(consultant, 'admission-leads')}
                              disabled={!consultant.admDone}
                              className={cn(
                                "text-sm font-medium transition-all hover:scale-105 px-3 py-1 rounded-lg",
                                consultant.admDone > 0
                                  ? "text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                                  : "text-slate-400 cursor-not-allowed"
                              )}
                            >
                              {consultant.admDone || 0}
                            </button>
                          </TableCell>
                         
                          <TableCell className="text-center py-3 px-4 bg-orange-50/30">
                            <button
                              onClick={() => handleMetricClick(consultant, 'orders')}
                              disabled={!consultant.realisedRevenue}
                              className={cn(
                                "text-sm font-medium transition-all hover:scale-105 px-3 py-1 rounded-lg",
                                consultant.realisedRevenue > 0
                                  ? "text-orange-600 hover:bg-orange-50 cursor-pointer"
                                  : "text-slate-400 cursor-not-allowed"
                              )}
                            >
                              {formatCurrency(consultant.realisedRevenue || 0)}
                            </button>
                          </TableCell>
                        </TableRow>

                        {/* Nested Team Members */}
                        {isExpanded && consultant.children && consultant.children.length > 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="p-0 bg-slate-50/30">
                              <div className="px-4 py-2">
                                <TeamMemberTable
                                  teamMembers={consultant.children}
                                  level={1}
                                  expandedEmployees={expandedEmployees}
                                  loadingHierarchy={loadingHierarchy}
                                  toggleExpand={toggleExpand}
                                  onMetricClick={handleMetricClick}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        )}

                        {/* Show message if expanded but no team members */}
                        {isExpanded && (!consultant.children || consultant.children.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={5} className="p-0">
                              <div className="px-4 py-2">
                                <div className="text-xs text-slate-400 py-2 px-4 bg-slate-50 rounded-lg border border-slate-200">
                                  No team members found
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}

                  {filteredTopLevel.length === 0 && searchTerm && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-sm text-slate-400">
                        No consultants match "{searchTerm}"
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{modalData.title}</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  <span className="font-medium text-slate-700">{modalData.consultantName}</span>
                  <span className="mx-2">•</span>
                  <span className="font-medium text-slate-700">{modalData.total}</span> {modalData.type === 'orders' ? 'orders' : 'leads'} found
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                  <span className="ml-2 text-sm text-slate-500">Loading details...</span>
                </div>
              ) : modalData.items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">No {modalData.title.toLowerCase()} found</p>
                </div>
              ) : (
                <>
                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder={`Search ${modalData.type === 'orders' ? 'orders' : 'leads'}...`}
                      value={modalSearch}
                      onChange={(e) => {
                        setModalSearch(e.target.value);
                        setModalPage(0);
                      }}
                      className="pl-10 h-9 text-sm rounded-xl border-slate-200"
                    />
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/80 border-b border-slate-200">
                          {modalData.type === 'orders' ? (
                            <>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[180px] py-3 px-4">
                                Student
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[130px] py-3 px-4">
                                Contact
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[180px] py-3 px-4">
                                Course
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right min-w-[130px] py-3 px-4 bg-orange-50/50">
                                <span className="text-orange-700">Revenue</span>
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right min-w-[140px] py-3 px-4">
                                Final Fee
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[120px] py-3 px-4">
                                Order Date
                              </TableHead>
                            </>
                          ) : (
                            <>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[180px] py-3 px-4">
                                Lead Name
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[130px] py-3 px-4">
                                Contact
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[140px] py-3 px-4">
                                Location
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[100px] py-3 px-4">
                                Status
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[140px] py-3 px-4">
                                Source
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[120px] py-3 px-4">
                                Assigned Date
                              </TableHead>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedModalItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={modalData.type === 'orders' ? 7 : 6} className="text-center py-8 text-slate-500">
                              No results found
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedModalItems.map((item, index) => (
                            <React.Fragment key={item._id || item.orderId || item.leadId || index}>
                              {modalData.type === 'orders' ? renderOrderItem(item) : renderLeadItem(item)}
                            </React.Fragment>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {modalTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <div className="text-sm text-slate-500">
                        Showing {modalPage * ITEMS_PER_PAGE + 1} to{' '}
                        {Math.min((modalPage + 1) * ITEMS_PER_PAGE, filteredModalItems.length)} of{' '}
                        {filteredModalItems.length}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModalPage(p => Math.max(0, p - 1))}
                          disabled={modalPage === 0}
                          className="h-8 w-8 p-0 rounded-lg border-slate-200"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-1.5">
                          {Array.from({ length: Math.min(5, modalTotalPages) }, (_, i) => {
                            let pageNum;
                            if (modalTotalPages <= 5) {
                              pageNum = i;
                            } else if (modalPage < 3) {
                              pageNum = i;
                            } else if (modalPage > modalTotalPages - 3) {
                              pageNum = modalTotalPages - 5 + i;
                            } else {
                              pageNum = modalPage - 2 + i;
                            }
                            const isActive = pageNum === modalPage;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setModalPage(pageNum)}
                                className={cn(
                                  "w-8 h-8 text-sm font-medium rounded-lg transition-colors",
                                  isActive
                                    ? "bg-orange-500 text-white shadow-sm"
                                    : "text-slate-600 hover:bg-slate-100"
                                )}
                              >
                                {pageNum + 1}
                              </button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModalPage(p => Math.min(modalTotalPages - 1, p + 1))}
                          disabled={modalPage === modalTotalPages - 1}
                          className="h-8 w-8 p-0 rounded-lg border-slate-200"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-4 border-t border-slate-200 bg-slate-50/50">
              <div className="text-sm text-slate-500">
                Total: <span className="font-medium text-slate-700">{filteredModalItems.length}</span> items
              </div>
              <Button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}