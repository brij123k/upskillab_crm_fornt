import { useState, useEffect, useCallback } from 'react';
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
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  UserCog,
  Plus,
  Minus,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  User,
  UserPlus,
  Users as UsersIcon,
  X,
  Mail,
  Phone,
  User as UserIcon,
  Briefcase,
  Calendar,
  Tag,
  List,
  LayoutGrid,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────

interface StageItem {
  leadStage: string;
  count: number;
}

interface EmployeeData {
  employeeId: string;
  employeeName: string;
  employeeEmail?: string | null;
  employeeNumber?: string | null;
  employeeEmployeeId?: string | number | null;
  employeeLevel?: number | string | null;
  totalLead: number;
  stages: StageItem[];
  team?: boolean;
  teamSize?: number;
  children?: EmployeeData[];
  level?: number;
  parentId?: string | null;
  isTeamMember?: boolean;
}

interface ReportData {
  employees: EmployeeData[];
  totalLeads: number;
  totalEmployees: number;
  filters?: {
    level?: string | number | null;
    team?: boolean | null;
    assignedDate?: string | null;
    assignedDateFilter?: string | null;
    assignedDateFrom?: string | null;
    assignedDateTo?: string | null;
  };
}

interface LevelType {
  _id: string;
  name: string;
}

interface LeadDetail {
  leadId: string;
  name: string;
  email?: string;
  phone?: string;
  stage?: {
    name: string;
  };
  [key: string]: any;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalLeads: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface StageDetailResponse {
  stageName: string;
  team?: boolean;
  totalLeads: number;
  pagination: PaginationInfo;
  leads: LeadDetail[];
}

// ───────────────────────────────────────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────────────────────────────────────

const dateFilterOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const EMPLOYEES_PER_PAGE = 10;
const MODAL_LEADS_PER_PAGE = 10;

// ───────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ───────────────────────────────────────────────────────────────────────────────

const extractLevelNumber = (levelName: string): number => {
  const match = levelName.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
};

// ───────────────────────────────────────────────────────────────────────────────
// Sub-component: Team Member Table
// ───────────────────────────────────────────────────────────────────────────────

interface TeamMemberTableProps {
  teamMembers: EmployeeData[];
  stages: string[];
  level: number;
  expandedEmployees: Set<string>;
  loadingHierarchy: Set<string>;
  toggleExpand: (employeeId: string, hasTeam: boolean) => void;
  onStageClick: (employeeId: string, stageName: string) => void;
  loadingStageDetail: string | null;
}

function TeamMemberTable({
  teamMembers,
  stages,
  level,
  expandedEmployees,
  loadingHierarchy,
  toggleExpand,
  onStageClick,
  loadingStageDetail,
}: TeamMemberTableProps) {
  return (
    <div className="mt-3 mb-2">
      <div className="flex items-center gap-2 mb-2 text-xs font-medium text-orange-600">
        <UsersIcon className="w-3.5 h-3.5" />
        <span>Team Members ({teamMembers.length})</span>
      </div>
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-orange-50/50 hover:bg-orange-50/50 border-b border-slate-200">
              <TableHead className="text-[10px] font-semibold text-slate-500 uppercase sticky left-0 bg-orange-50/50 z-10 min-w-[160px]">
                Member
              </TableHead>
              {stages.map(stage => (
                <TableHead
                  key={stage}
                  className="text-[10px] text-center min-w-[60px] py-1.5 font-semibold text-slate-600 whitespace-nowrap"
                >
                  {stage}
                </TableHead>
              ))}
              <TableHead className="text-[10px] text-center min-w-[50px] py-1.5 font-semibold text-slate-600">
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.map(member => {
              const stageMap = new Map<string, number>();
              member.stages.forEach(s => stageMap.set(s.leadStage, s.count));
              const hasTeam = member.teamSize && member.teamSize > 1;
              const isExpanded = expandedEmployees.has(member.employeeId);
              const isLoading = loadingHierarchy.has(member.employeeId);

              return (
                <>
                  <TableRow
                    key={member.employeeId}
                    className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                  >
                    <TableCell className="sticky left-0 bg-white border-r z-10 py-2">
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-medium text-slate-800 truncate max-w-[100px]">
                              {member.employeeName}
                            </span>
                            {hasTeam ? (
                              <button
                                onClick={() => toggleExpand(member.employeeId, true)}
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
                            ):(<span></span>)}
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-slate-400 flex-wrap">
                            <span>ID: {member.employeeEmployeeId || member.employeeId}</span>
                            {member.teamSize && member.teamSize > 1 ? (
                              <span className="text-orange-500 font-medium">
                                • Team: {member.teamSize}
                              </span>
                            ):(<span></span>)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    {stages.map(stage => {
                      const count = stageMap.get(stage) || 0;
                      const total = member.totalLead || 1;
                      const pct = ((count / total) * 100).toFixed(1);
                      const isLoadingDetail = loadingStageDetail === `${member.employeeId}-${stage}`;
                      
                      return (
                        <TableCell
                          key={stage}
                          className="text-xs text-center py-2"
                        >
                          <button
                            onClick={() => count > 0 && onStageClick(member.employeeId, stage)}
                            disabled={count === 0 || isLoadingDetail}
                            className={cn(
                              "flex flex-col items-center transition-all",
                              count > 0 && "hover:scale-110 cursor-pointer",
                              count === 0 && "cursor-default opacity-50",
                              isLoadingDetail && "opacity-50 cursor-wait"
                            )}
                            title={count > 0 ? `Click to view ${stage} leads` : 'No leads'}
                          >
                            {isLoadingDetail ? (
                              <Loader2 className="w-3 h-3 animate-spin text-orange-500" />
                            ) : (
                              <>
                                <span
                                  className={cn(
                                    'font-medium text-xs',
                                    count > 0 ? 'text-slate-800 hover:text-orange-600' : 'text-slate-300'
                                  )}
                                >
                                  {count || '-'}
                                </span>
                                {count > 0 && (
                                  <span className="text-[8px] text-slate-400 mt-0.5">
                                    {pct}%
                                  </span>
                                )}
                              </>
                            )}
                          </button>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-xs text-center font-bold text-orange-700 py-2">
                      {member.totalLead}
                    </TableCell>
                  </TableRow>
                  {/* Nested team members for this member */}
                  {isExpanded && member.children && member.children.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={stages.length + 2} className="p-0">
                        <div className="ml-6 pl-4 border-l-2 border-orange-200">
                          <TeamMemberTable
                            teamMembers={member.children}
                            stages={stages}
                            level={level + 1}
                            expandedEmployees={expandedEmployees}
                            loadingHierarchy={loadingHierarchy}
                            toggleExpand={toggleExpand}
                            onStageClick={onStageClick}
                            loadingStageDetail={loadingStageDetail}
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

// ───────────────────────────────────────────────────────────────────────────────
// Sub-component: Stage Detail Modal
// ───────────────────────────────────────────────────────────────────────────────

interface StageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StageDetailResponse | null;
  loading: boolean;
  employeeName: string;
  stageName: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  currentPage: number;
  pageLimit: number;
}

function StageDetailModal({
  isOpen,
  onClose,
  data,
  loading,
  employeeName,
  stageName,
  onPageChange,
  onLimitChange,
  currentPage,
  pageLimit,
}: StageDetailModalProps) {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  if (!isOpen) return null;

  const pagination = data?.pagination;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Tag className="w-5 h-5 text-orange-500" />
              {stageName} Leads
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Employee: <span className="font-medium text-slate-700">{employeeName}</span>
              {data && (
                <span className="ml-3">
                  Total: <span className="font-semibold text-orange-600">{data.totalLeads}</span> leads
                </span>
              )}
              {data?.team && (
                <span className="ml-3 text-orange-600">
                  <UserCog className="w-3.5 h-3.5 inline mr-1" />
                  Team View
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
          
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full hover:bg-slate-100 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
              <p className="ml-3 text-sm text-slate-500">Loading leads...</p>
            </div>
          ) : !data || data.leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No leads found</p>
              <p className="text-xs text-slate-400 mt-1">
                No leads in {stageName} stage for this employee
              </p>
            </div>
          ) :  (
            // Table View
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-600">#</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Lead ID</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Name</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Email</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Phone</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Stage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.leads.map((lead, index) => {
                    const globalIndex = ((currentPage - 1) * pageLimit) + index + 1;
                    return (
                      <TableRow key={lead.leadId || index} className="hover:bg-slate-50/60">
                        <TableCell className="text-xs text-slate-500">{globalIndex}</TableCell>
                        <TableCell className="text-xs font-mono text-slate-600">
                          {lead.leadId || '-'}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-800">
                          {lead.name || 'Unnamed Lead'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {lead.email || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {lead.phone || '-'}
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            {lead.stage?.name || stageName}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500">
              Showing {data?.leads.length || 0} of {data?.totalLeads || 0} leads
            </span>
            
            {/* Limit selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Show:</span>
              <Select
                value={pageLimit.toString()}
                onValueChange={(value) => onLimitChange(parseInt(value))}
              >
                <SelectTrigger className="h-7 w-[70px] text-xs rounded-lg">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map(limit => (
                    <SelectItem key={limit} value={limit.toString()} className="text-xs">
                      {limit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!pagination?.hasPreviousPage || loading}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-slate-500 min-w-[60px] text-center">
              Page {currentPage} of {pagination?.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!pagination?.hasNextPage || loading}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-lg ml-2"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Main Component
// ───────────────────────────────────────────────────────────────────────────────

export function EmployeeStagesReport() {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [allStages, setAllStages] = useState<string[]>([]);
  const [loadingStages, setLoadingStages] = useState(true);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);

  // Level filter
  const [levels, setLevels] = useState<LevelType[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('1');

  // Team filter
  const [showTeamOnly, setShowTeamOnly] = useState<boolean>(false);

  // Date filter
  const [dateFilter, setDateFilter] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Search (client-side)
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);

  // ─── Hierarchical State ──────────────────────────────────────────────────
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [hierarchicalData, setHierarchicalData] = useState<EmployeeData[]>([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState<Set<string>>(new Set());

  // ─── Stage Detail Modal State ────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<StageDetailResponse | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [loadingStageDetail, setLoadingStageDetail] = useState<string | null>(null);
  
  // Modal pagination state
  const [modalPage, setModalPage] = useState(1);
  const [modalLimit, setModalLimit] = useState(MODAL_LEADS_PER_PAGE);
  const [modalEmployeeId, setModalEmployeeId] = useState<string>('');

  // ─── Fetch Levels ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await getDataHandlerWithToken('getAllLevels', null, null);
        if (response && Array.isArray(response)) {
          setLevels(response);
          if (response.length > 0) {
            const firstLevelNumeric = extractLevelNumber(response[0].name);
            setSelectedLevel(firstLevelNumeric.toString());
          }
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch levels',
          variant: 'destructive',
        });
      }
    };
    fetchLevels();
  }, []);

  // ─── Fetch Stages ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const response = await getDataHandlerWithToken(
          ApiConfig.getAllStages,
          null,
          null,
          true
        );
        const stagesData = response?.data || response || [];
        if (Array.isArray(stagesData) && stagesData.length) {
          const names = stagesData.map((s: any) => s.stageName || s.name);
          setAllStages(names);
        } else {
          setAllStages([]);
        }
      } catch (error) {
        setAllStages([]);
      } finally {
        setLoadingStages(false);
      }
    };
    fetchStages();
  }, []);

  // ─── Build Hierarchy ──────────────────────────────────────────────────────
  const buildHierarchy = useCallback((employees: EmployeeData[]): EmployeeData[] => {
    return employees.map(emp => ({
      ...emp,
      children: [],
      level: 0,
    }));
  }, []);

  // ─── Fetch Report Data ──────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};

      if (selectedLevel) {
        params.level = parseInt(selectedLevel, 10) || 1;
      }

      if (showTeamOnly) {
        params.team = true;
      }

      if (dateFilter === 'custom') {
        if (!fromDate || !toDate) {
          setLoading(false);
          return;
        }
        params.assignedDateFrom = fromDate;
        params.assignedDateTo = toDate;
      } else {
        params.assignedDateFilter = dateFilter;
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.allEmpStages,
        params,
        null,
        true
      );

      if (response) {
        const employees = response.data?.employees || response.employees || [];
        setData({
          employees: employees,
          totalLeads: response.data?.totalLeads ?? response.totalLeads ?? 0,
          totalEmployees: response.data?.totalEmployees ?? response.totalEmployees ?? 0,
          filters: response.data?.filters || response.filters || {},
        });
        
        const hierarchy = buildHierarchy(employees);
        setHierarchicalData(hierarchy);
        setExpandedEmployees(new Set());
      } else {
        setData(null);
        setHierarchicalData([]);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load employee stages',
        variant: 'destructive',
      });
      setData(null);
      setHierarchicalData([]);
    } finally {
      setLoading(false);
      setCurrentPage(0);
    }
  }, [selectedLevel, showTeamOnly, dateFilter, fromDate, toDate, buildHierarchy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Fetch Team Hierarchy ──────────────────────────────────────────────
  const fetchTeamHierarchy = useCallback(async (employeeId: string) => {
    if (loadingHierarchy.has(employeeId)) return;

    setLoadingHierarchy(prev => new Set(prev).add(employeeId));
    
    try {
      const params: any = {};

      if (selectedLevel) {
        params.level = parseInt(selectedLevel, 10) || 1;
      }

      if (showTeamOnly) {
        params.team = true;
      }

      if (dateFilter === 'custom') {
        if (fromDate && toDate) {
          params.assignedDateFrom = fromDate;
          params.assignedDateTo = toDate;
        }
      } else {
        params.assignedDateFilter = dateFilter;
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.getHarericydetailStages(employeeId),
        params,
        null,
        true
      );

      if (response) {
        const teamData = response.data?.employees || response.employees || [];
        if (teamData.length > 0) {
          const updateHierarchy = (nodes: EmployeeData[]): EmployeeData[] => {
            return nodes.map(node => {
              if (node.employeeId === employeeId) {
                const teamMembers = teamData.map((member: any) => ({
                  ...member,
                  level: (node.level || 0) + 1,
                  parentId: employeeId,
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
          setExpandedEmployees(prev => new Set(prev).add(employeeId));
        } else {
          const updateHierarchy = (nodes: EmployeeData[]): EmployeeData[] => {
            return nodes.map(node => {
              if (node.employeeId === employeeId) {
                return {
                  ...node,
                  children: [],
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
          setExpandedEmployees(prev => new Set(prev).add(employeeId));
        }
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
        newSet.delete(employeeId);
        return newSet;
      });
    }
  }, [selectedLevel, showTeamOnly, dateFilter, fromDate, toDate, loadingHierarchy]);

  // ─── Toggle Expand ──────────────────────────────────────────────────────
  const toggleExpand = useCallback(async (employeeId: string, hasTeam: boolean) => {
    if (expandedEmployees.has(employeeId)) {
      setExpandedEmployees(prev => {
        const newSet = new Set(prev);
        newSet.delete(employeeId);
        return newSet;
      });
      
      const removeChildren = (nodes: EmployeeData[]): EmployeeData[] => {
        return nodes.map(node => {
          if (node.employeeId === employeeId) {
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
      await fetchTeamHierarchy(employeeId);
    }
  }, [expandedEmployees, fetchTeamHierarchy]);

  // ─── Fetch Stage Detail ──────────────────────────────────────────────────
  const fetchStageDetail = useCallback(async (
    employeeId: string, 
    stageName: string, 
    page: number = 1, 
    limit: number = MODAL_LEADS_PER_PAGE
  ) => {
    const loadingKey = `${employeeId}-${stageName}-${page}-${limit}`;
    if (loadingStageDetail === loadingKey) return;

    setLoadingStageDetail(loadingKey);
    setModalLoading(true);
    setModalOpen(true);
    setSelectedStage(stageName);
    setModalEmployeeId(employeeId);
    setModalPage(page);
    setModalLimit(limit);

    try {
      const params: any = {};

      if (selectedLevel) {
        params.level = parseInt(selectedLevel, 10) || 1;
      }

      if (showTeamOnly) {
        params.team = true;
      }

      if (dateFilter === 'custom') {
        if (fromDate && toDate) {
          params.assignedDateFrom = fromDate;
          params.assignedDateTo = toDate;
        }
      } else {
        params.assignedDateFilter = dateFilter;
      }

      params.stageName = stageName;
      params.page = page;
      params.limit = limit;

      const response = await getDataHandlerWithToken(
        ApiConfig.getDetailofEmpStage(employeeId),
        params,
        null,
        true
      );

      if (response) {
        const stageData = response.data || response;
        setModalData({
          stageName: stageData.stageName || stageName,
          team: stageData.team || false,
          totalLeads: stageData.totalLeads || 0,
          pagination: stageData.pagination || {
            page: page,
            limit: limit,
            totalLeads: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          leads: stageData.leads || [],
        });

        // Find employee name
        const findEmployee = (nodes: EmployeeData[]): string => {
          for (const node of nodes) {
            if (node.employeeId === employeeId) {
              return node.employeeName;
            }
            if (node.children) {
              const found = findEmployee(node.children);
              if (found) return found;
            }
          }
          return '';
        };
        const empName = findEmployee(hierarchicalData) || employeeId;
        setSelectedEmployee({ id: employeeId, name: empName });
      } else {
        setModalData(null);
        toast({
          title: 'Error',
          description: 'Failed to load stage details',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load stage details',
        variant: 'destructive',
      });
      setModalData(null);
    } finally {
      setModalLoading(false);
      setLoadingStageDetail(null);
    }
  }, [selectedLevel, showTeamOnly, dateFilter, fromDate, toDate, hierarchicalData, loadingStageDetail]);

  // ─── Handle Stage Click ──────────────────────────────────────────────────
  const handleStageClick = useCallback((employeeId: string, stageName: string) => {
    fetchStageDetail(employeeId, stageName, 1, modalLimit);
  }, [fetchStageDetail, modalLimit]);

  // ─── Handle Modal Page Change ────────────────────────────────────────────
  const handleModalPageChange = useCallback((newPage: number) => {
    if (modalEmployeeId && selectedStage) {
      fetchStageDetail(modalEmployeeId, selectedStage, newPage, modalLimit);
    }
  }, [modalEmployeeId, selectedStage, modalLimit, fetchStageDetail]);

  // ─── Handle Modal Limit Change ───────────────────────────────────────────
  const handleModalLimitChange = useCallback((newLimit: number) => {
    setModalLimit(newLimit);
    if (modalEmployeeId && selectedStage) {
      fetchStageDetail(modalEmployeeId, selectedStage, 1, newLimit);
    }
  }, [modalEmployeeId, selectedStage, fetchStageDetail]);

  // ─── Close Modal ─────────────────────────────────────────────────────────
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalData(null);
    setSelectedEmployee(null);
    setSelectedStage('');
    setModalLoading(false);
    setModalPage(1);
  }, []);

  // ─── Export CSV ──────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!data || !data.employees.length) {
      toast({ title: 'No data to export' });
      return;
    }

    const allEmployeeStages = data.employees;
    const stageSet = new Set<string>();
    allEmployeeStages.forEach(emp =>
      emp.stages.forEach(s => stageSet.add(s.leadStage))
    );
    const stageList = Array.from(stageSet);
    const headers = ['Employee', 'Employee ID', 'Level', 'Total Lead', ...stageList, 'Email', 'Phone', 'Team Size'];
    const rows = allEmployeeStages.map(emp => {
      const stageMap = new Map(emp.stages.map(s => [s.leadStage, s.count]));
      return [
        emp.employeeName,
        emp.employeeEmployeeId || emp.employeeId || '',
        emp.employeeLevel || '',
        emp.totalLead,
        ...stageList.map(s => stageMap.get(s) || 0),
        emp.employeeEmail || '',
        emp.employeeNumber || '',
        emp.teamSize || '',
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee_stages_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  };

  // ─── Flatten hierarchy for display ──────────────────────────────────────
  const flattenHierarchy = useCallback((nodes: EmployeeData[]): EmployeeData[] => {
    let result: EmployeeData[] = [];
    nodes.forEach(node => {
      result.push({ ...node, level: node.level || 0 });
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenHierarchy(node.children));
      }
    });
    return result;
  }, []);

  // ─── Client-side filtering ──────────────────────────────────────────────
  const topLevelEmployees = hierarchicalData;
  const filteredTopLevel = topLevelEmployees.filter(emp =>
    emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.employeeEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (emp.employeeNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const paginatedTopLevel = filteredTopLevel.slice(
    currentPage * EMPLOYEES_PER_PAGE,
    (currentPage + 1) * EMPLOYEES_PER_PAGE
  );

  const totalPages = Math.ceil(filteredTopLevel.length / EMPLOYEES_PER_PAGE);

  const employeeStageMap = paginatedTopLevel.map(emp => {
    const map = new Map<string, number>();
    emp.stages.forEach(s => map.set(s.leadStage, s.count));
    return { ...emp, stageMap: map };
  });

  const relevantStages = (() => {
    const stageSet = new Set<string>();
    employeeStageMap.forEach(emp => {
      emp.stageMap.forEach((_, key) => stageSet.add(key));
    });
    const ordered = allStages.filter(s => stageSet.has(s));
    const extra = Array.from(stageSet).filter(s => !ordered.includes(s));
    return [...ordered, ...extra];
  })();

  const defaultLevel = levels.length > 0 ? extractLevelNumber(levels[0].name).toString() : '1';
  const hasActiveFilters =
    selectedLevel !== defaultLevel ||
    showTeamOnly ||
    dateFilter !== 'today' ||
    (dateFilter === 'custom' && (fromDate || toDate)) ||
    searchTerm !== '';

  const isTeamMode = data?.filters?.team === true || showTeamOnly;

  const hasTeam = (emp: EmployeeData) => {
    return emp.teamSize && emp.teamSize > 1;
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Employee Stages</h3>
          <p className="text-sm text-slate-500">Lead distribution per employee</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="rounded-xl border-slate-200"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
            )}
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
          {hasActiveFilters && (
            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-orange-500" />
          )}
          {showFilters ? (
            <ChevronUp className="w-3 h-3 ml-1" />
          ) : (
            <ChevronDown className="w-3 h-3 ml-1" />
          )}
        </Button>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 w-full">
            {levels.length > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">
                  Level
                </Label>
                <div className="flex flex-wrap gap-1">
                  {levels.map(lvl => {
                    const num = extractLevelNumber(lvl.name);
                    return (
                      <button
                        key={lvl._id}
                        onClick={() => {
                          setSelectedLevel(num.toString());
                        }}
                        className={cn(
                          "px-3 py-1 text-xs font-medium rounded-lg border transition-all",
                          selectedLevel === num.toString()
                            ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {lvl.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 ml-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="team-filter"
                  checked={showTeamOnly}
                  onCheckedChange={(checked) => {
                    setShowTeamOnly(checked === true);
                  }}
                  className="h-4 w-4 rounded border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <Label
                  htmlFor="team-filter"
                  className="text-xs font-medium text-slate-600 cursor-pointer"
                >
                  Team
                </Label>
              </div>
            </div>

            <div className="w-[130px]">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-8 text-xs rounded-xl">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {dateFilterOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {dateFilter === 'custom' && (
              <>
                <div className="relative w-[130px]">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="relative w-[130px]">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </>
            )}

            <div className="relative w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="pl-7 h-8 text-xs rounded-xl border-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter Summary */}
      {!loading && data && data.employees.length > 0 && (
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
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>
            Date:{' '}
            <span className="font-medium text-slate-700">
              {dateFilterOptions.find(o => o.value === dateFilter)?.label || dateFilter}
            </span>
          </span>
          {dateFilter === 'custom' && fromDate && toDate && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>
                Range:{' '}
                <span className="font-medium text-slate-700">
                  {fromDate} to {toDate}
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
          <p className="ml-2 text-sm text-slate-500">Loading employee data...</p>
        </div>
      ) : !data || !data.employees.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No employees found</p>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting filters or search term
          </p>
        </div>
      ) : paginatedTopLevel.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No matching employees</p>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search term
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary badge */}
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="font-medium text-slate-700">
              {filteredTopLevel.length} employees
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>
              Total leads:{' '}
              <span className="font-semibold text-slate-800">
                {filteredTopLevel.reduce((sum, emp) => sum + emp.totalLead, 0)}
              </span>
            </span>
            {isTeamMode && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1 text-orange-600">
                  <UserCog className="w-3.5 h-3.5" />
                  <span className="font-medium">Team View</span>
                </span>
              </>
            )}
          </div>

          {/* Main Table */}
          {loadingStages ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
              <p className="ml-2 text-sm text-slate-500">Loading stage headers...</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                    <TableHead className="text-[10px] font-semibold text-slate-500 uppercase sticky left-0 bg-slate-50 z-10 min-w-[160px]">
                      Employee
                    </TableHead>
                    {relevantStages.map(stage => (
                      <TableHead
                        key={stage}
                        className="text-[10px] text-center min-w-[60px] py-2 font-semibold text-slate-600 whitespace-nowrap"
                      >
                        {stage}
                      </TableHead>
                    ))}
                    <TableHead className="text-[10px] text-center min-w-[50px] py-2 font-semibold text-slate-600">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTopLevel.map(emp => {
                    const isExpanded = expandedEmployees.has(emp.employeeId);
                    const hasTeamMembers = hasTeam(emp);
                    const isLoading = loadingHierarchy.has(emp.employeeId);
                    const stageMap = new Map<string, number>();
                    emp.stages.forEach(s => stageMap.set(s.leadStage, s.count));

                    return (
                      <>
                        <TableRow
                          key={emp.employeeId}
                          className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                        >
                          <TableCell className="sticky left-0 bg-white border-r z-10 py-2.5">
                            <div className="flex items-center gap-2 min-w-[150px]">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-medium text-slate-800 truncate max-w-[120px]">
                                    {emp.employeeName}
                                  </span>
                                  {hasTeamMembers && (
                                    <button
                                      onClick={() => toggleExpand(emp.employeeId, true)}
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
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[9px] text-slate-400 flex-wrap">
                                  <span>ID: {emp.employeeEmployeeId || emp.employeeId}</span>
                                  {emp.employeeLevel && <span>• L{emp.employeeLevel}</span>}
                                  {emp.teamSize && emp.teamSize > 1 && (
                                    <span className="text-orange-500 font-medium">
                                      • Team: {emp.teamSize}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          {relevantStages.map(stage => {
                            const count = stageMap.get(stage) || 0;
                            const total = emp.totalLead || 1;
                            const pct = ((count / total) * 100).toFixed(1);
                            const isLoadingDetail = loadingStageDetail === `${emp.employeeId}-${stage}`;
                            
                            return (
                              <TableCell
                                key={stage}
                                className="text-xs text-center py-2.5"
                              >
                                <button
                                  onClick={() => count > 0 && handleStageClick(emp.employeeId, stage)}
                                  disabled={count === 0 || isLoadingDetail}
                                  className={cn(
                                    "flex flex-col items-center transition-all",
                                    count > 0 && "hover:scale-110 cursor-pointer",
                                    count === 0 && "cursor-default opacity-50",
                                    isLoadingDetail && "opacity-50 cursor-wait"
                                  )}
                                  title={count > 0 ? `Click to view ${stage} leads` : 'No leads'}
                                >
                                  {isLoadingDetail ? (
                                    <Loader2 className="w-3 h-3 animate-spin text-orange-500" />
                                  ) : (
                                    <>
                                      <span
                                        className={cn(
                                          'font-medium text-xs',
                                          count > 0 ? 'text-slate-800 hover:text-orange-600' : 'text-slate-300'
                                        )}
                                      >
                                        {count || '-'}
                                      </span>
                                      {count > 0 && (
                                        <span className="text-[8px] text-slate-400 mt-0.5">
                                          {pct}%
                                        </span>
                                      )}
                                    </>
                                  )}
                                </button>
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-xs text-center font-bold text-orange-700 py-2.5">
                            {emp.totalLead}
                          </TableCell>
                        </TableRow>

                        {/* Nested Team Members Table */}
                        {isExpanded && emp.children && emp.children.length > 0 && (
                          <TableRow>
                            <TableCell colSpan={relevantStages.length + 2} className="p-0 bg-slate-50/30">
                              <div className="px-4 py-2">
                                <TeamMemberTable
                                  teamMembers={emp.children}
                                  stages={relevantStages}
                                  level={1}
                                  expandedEmployees={expandedEmployees}
                                  loadingHierarchy={loadingHierarchy}
                                  toggleExpand={toggleExpand}
                                  onStageClick={handleStageClick}
                                  loadingStageDetail={loadingStageDetail}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        )}

                        {/* Show message if expanded but no team members */}
                        {isExpanded && (!emp.children || emp.children.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={relevantStages.length + 2} className="p-0">
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
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500">
                Page {currentPage + 1} of {totalPages}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stage Detail Modal */}
      <StageDetailModal
        isOpen={modalOpen}
        onClose={closeModal}
        data={modalData}
        loading={modalLoading}
        employeeName={selectedEmployee?.name || ''}
        stageName={selectedStage}
        onPageChange={handleModalPageChange}
        onLimitChange={handleModalLimitChange}
        currentPage={modalPage}
        pageLimit={modalLimit}
      />
    </div>
  );
}