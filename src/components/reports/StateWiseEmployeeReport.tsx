import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  RefreshCw,
  Download,
  Filter,
  Search,
  MapPin,
  Users,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  IndianRupee,
  Layers,
  UserCheck,
  TrendingUp,
  Building2,
  X,
  Plus,
  Minus,
  UserPlus,
  UserCog,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*                               Type Definitions                              */
/* -------------------------------------------------------------------------- */
interface StageCounts {
  [stageName: string]: number;
}

interface StateDetail {
  state: string;
  totalLeads: number;
  pcatScheduled: number;
  pcatDone: number;
  registrationDone: number;
  admissionDone: number;
  revenue: number;
  stages: StageCounts;
  registrationConversionPercentage: number;
  conversionPercentage: number;
}

interface EmployeeData {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeNumber?: string;
  employeeCode: string;
  totalLeads: number;
  totalRegistrationDone: number;
  totalAdmissionDone: number;
  totalRevenue: number;
  registrationConversionPercentage: number;
  conversionPercentage: number;
  team?: boolean;
  teamSize?: number;
  states: StateDetail[];
  children?: EmployeeData[];
  level?: number;
  parentId?: string | null;
  isTeamMember?: boolean;
}

interface ParentEmployee {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeNumber?: string;
  employeeCode: string;
  totalLeads: number;
  totalRegistrationDone: number;
  totalAdmissionDone: number;
  totalRevenue: number;
  registrationConversionPercentage: number;
  conversionPercentage: number;
  team?: boolean;
  teamSize?: number;
  states: StateDetail[];
}

interface ApiResponse {
  startDate: string;
  endDate: string;
  dateFilter?: string;
  level?: number;
  team?: boolean;
  employeeId?: string;
  parentEmployee?: ParentEmployee;
  totalEmployees: number;
  totalLeads: number;
  totalRegistrationDone: number;
  totalAdmissionDone: number;
  totalRevenue: number;
  registrationPercentage: number;
  conversionPercentage: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  data: EmployeeData[];
}

/* -------------------------------------------------------------------------- */
/*                               Date Options                                  */
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
  teamMembers: EmployeeData[];
  level: number;
  expandedEmployees: Set<string>;
  loadingHierarchy: Set<string>;
  toggleExpand: (employeeId: string, hasTeam: boolean) => void;
  onEmployeeClick: (employee: EmployeeData) => void;
}

function TeamMemberTable({
  teamMembers,
  level,
  expandedEmployees,
  loadingHierarchy,
  toggleExpand,
  onEmployeeClick,
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
              <TableHead className="text-[10px] font-semibold text-slate-500 uppercase sticky left-0 bg-orange-50/50 z-10 min-w-[160px] py-2">
                Employee
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center min-w-[80px] py-2">
                Leads
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center min-w-[80px] py-2">
                Reg.
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center min-w-[80px] py-2">
                Adm.
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center min-w-[100px] py-2">
                Reg. %
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center min-w-[100px] py-2">
                Conv. %
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center min-w-[120px] py-2 bg-orange-50/50">
                Revenue
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.map((member) => {
              const hasTeam = member.teamSize && member.teamSize > 1;
              const isExpanded = expandedEmployees.has(member.employeeId);
              const isLoading = loadingHierarchy.has(member.employeeId);

              return (
                <>
                  <TableRow
                    key={member.employeeId}
                    className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors cursor-pointer"
                    onClick={() => onEmployeeClick(member)}
                  >
                    <TableCell className="sticky left-0 bg-white border-r z-10 py-2">
                      <div className="flex flex-col min-w-[130px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium text-slate-800 truncate max-w-[100px] hover:text-orange-600">
                            {member.employeeName}
                          </span>
                          {hasTeam && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(member.employeeId, true);
                              }}
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
                          {member.teamSize && member.teamSize > 1 && (
                            <span className="text-[7px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded-full whitespace-nowrap">
                              Team: {member.teamSize}
                            </span>
                          )}
                        </div>
                        <span className="text-[8px] text-slate-400 truncate max-w-[120px]">
                          {member.employeeEmail}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-center py-2 font-medium text-slate-700">
                      {member.totalLeads}
                    </TableCell>
                    <TableCell className="text-xs text-center py-2 font-medium text-purple-600">
                      {member.totalRegistrationDone}
                    </TableCell>
                    <TableCell className="text-xs text-center py-2 font-medium text-emerald-600">
                      {member.totalAdmissionDone}
                    </TableCell>
                    <TableCell className="text-xs text-center py-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full font-medium text-[10px]",
                        member.registrationConversionPercentage > 20 ? "bg-purple-100 text-purple-700" :
                        member.registrationConversionPercentage > 10 ? "bg-indigo-100 text-indigo-700" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {member.registrationConversionPercentage || 0}%
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-center py-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full font-medium text-[10px]",
                        member.conversionPercentage > 15 ? "bg-emerald-100 text-emerald-700" :
                        member.conversionPercentage > 8 ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {member.conversionPercentage || 0}%
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-center font-semibold text-orange-600 py-2 bg-orange-50/30">
                      ₹{member.totalRevenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                  {/* Nested team members */}
                  {isExpanded && member.children && member.children.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <div className="ml-6 pl-4 border-l-2 border-orange-200">
                          <TeamMemberTable
                            teamMembers={member.children}
                            level={level + 1}
                            expandedEmployees={expandedEmployees}
                            loadingHierarchy={loadingHierarchy}
                            toggleExpand={toggleExpand}
                            onEmployeeClick={onEmployeeClick}
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
/*                          Employee Details Modal                             */
/* -------------------------------------------------------------------------- */

interface EmployeeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeData | null;
}

function EmployeeDetailsModal({ isOpen, onClose, employee }: EmployeeDetailsModalProps) {
  if (!isOpen || !employee) return null;

  const totalStages = employee.states.reduce((acc, state) => {
    Object.values(state.stages).forEach(count => acc += count);
    return acc;
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[85vh] p-4 flex flex-col rounded-2xl">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-800">
                Employee Details
              </DialogTitle>
              <div className="text-sm text-slate-500 mt-1">
                <span className="font-medium text-slate-700">{employee.employeeName}</span>
                <span className="mx-2">•</span>
                <span className="text-slate-400">Code: {employee.employeeCode}</span>
                {employee.teamSize && employee.teamSize > 1 && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="text-orange-600">Team: {employee.teamSize} members</span>
                  </>
                )}
              </div>
            </div>
            
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Total Leads</p>
              <p className="text-xl font-bold text-slate-800">{employee.totalLeads}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <p className="text-[10px] font-medium text-purple-600 uppercase tracking-wider">Registrations</p>
              <p className="text-xl font-bold text-purple-700">{employee.totalRegistrationDone}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">Admissions</p>
              <p className="text-xl font-bold text-emerald-700">{employee.totalAdmissionDone}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <p className="text-[10px] font-medium text-orange-600 uppercase tracking-wider">Revenue</p>
              <p className="text-xl font-bold text-orange-700">₹{employee.totalRevenue.toLocaleString()}</p>
            </div>
          </div>

          {/* Conversion Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-indigo-50 rounded-lg p-3">
              <p className="text-[10px] font-medium text-indigo-600 uppercase tracking-wider">Registration Conv. %</p>
              <p className="text-lg font-semibold text-indigo-700">{employee.registrationConversionPercentage || 0}%</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3">
              <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">Conversion %</p>
              <p className="text-lg font-semibold text-emerald-700">{employee.conversionPercentage || 0}%</p>
            </div>
          </div>

          {/* States Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                State Breakdown
              </h4>
              <Badge variant="outline" className="text-[10px]">
                {employee.states.length} states
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="text-[10px] font-semibold text-slate-500 uppercase min-w-[120px]">State</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center">Leads</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center">PCAT S.</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center">PCAT D.</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center">Reg.</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center">Adm.</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center">Revenue</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center">Reg. %</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-500 uppercase text-center">Conv. %</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-500 uppercase min-w-[150px]">Stages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employee.states.map((state) => {
                    const stageEntries = Object.entries(state.stages);
                    const totalStateStages = stageEntries.reduce((acc, [, count]) => acc + count, 0);
                    return (
                      <TableRow key={state.state} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <TableCell className="text-xs font-medium text-slate-800">{state.state}</TableCell>
                        <TableCell className="text-xs text-center text-slate-600">{state.totalLeads}</TableCell>
                        <TableCell className="text-xs text-center text-slate-600">{state.pcatScheduled}</TableCell>
                        <TableCell className="text-xs text-center text-slate-600">{state.pcatDone}</TableCell>
                        <TableCell className="text-xs text-center font-medium text-purple-600">{state.registrationDone}</TableCell>
                        <TableCell className="text-xs text-center font-medium text-emerald-600">{state.admissionDone}</TableCell>
                        <TableCell className="text-xs text-center font-medium text-orange-600">₹{state.revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-center">
                          <span className="px-2 py-0.5 rounded-full font-medium text-[10px] bg-purple-100 text-purple-700">
                            {state.registrationConversionPercentage || 0}%
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-center">
                          <span className="px-2 py-0.5 rounded-full font-medium text-[10px] bg-emerald-100 text-emerald-700">
                            {state.conversionPercentage || 0}%
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex flex-wrap gap-1">
                            {stageEntries.map(([stage, count]) => {
                              const pct = totalStateStages > 0 ? Math.round((count / totalStateStages) * 100) : 0;
                              return (
                                <Badge key={stage} variant="outline" className="text-[9px] px-1.5 py-0">
                                  {stage}: {count} ({pct}%)
                                </Badge>
                              );
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-slate-200 bg-slate-50/50 flex-shrink-0">
          <Button onClick={onClose} className="rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                                */
/* -------------------------------------------------------------------------- */

export function StateWiseEmployeeReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Date filter
  const [dateFilter, setDateFilter] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Level filter
  const [levels, setLevels] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState('1');

  // Team filter (checkbox)
  const [showTeamOnly, setShowTeamOnly] = useState<boolean>(false);

  // Client-side search
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // ─── Hierarchical State ──────────────────────────────────────────────────
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [hierarchicalData, setHierarchicalData] = useState<EmployeeData[]>([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState<Set<string>>(new Set());

  // ─── Employee Details Modal ─────────────────────────────────────────────
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null);

  // ─── Fetch levels ───
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
    fetchLevels();
  }, []);

  const extractLevelNumber = (name: string): number => {
    const match = name.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  };

  // ─── Build Hierarchy ──────────────────────────────────────────────────────
  const buildHierarchy = useCallback((employees: EmployeeData[]): EmployeeData[] => {
    return employees.map(emp => ({
      ...emp,
      children: [],
      level: 0,
    }));
  }, []);

  // ─── Fetch data ───
  const fetchData = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const params: any = {
        level: parseInt(selectedLevel) || 1,
        page: page,
        limit: 10,
      };

      if (showTeamOnly) {
        params.team = true;
      }

      if (dateFilter === 'custom') {
        if (!fromDate || !toDate) {
          setLoading(false);
          return;
        }
        const diffTime = Math.abs(new Date(toDate).getTime() - new Date(fromDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 30) {
          toast({
            title: 'Date range too large',
            description: 'Max 30 days allowed.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        params.fromDate = fromDate;
        params.toDate = toDate;
      } else {
        params.dateFilter = dateFilter;
      }

      if (employeeSearch.trim()) params.employee = employeeSearch.trim();
      if (stateSearch.trim()) params.state = stateSearch.trim();

      const response = await getDataHandlerWithToken(
        ApiConfig.stateWiseEmployeeReport,
        params,
        null,
        true
      );

      if (response) {
        const reportData = response as ApiResponse;
        setData(reportData);
        
        const employees = reportData.data || [];
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
        description: error?.message || 'Failed to load employee report',
        variant: 'destructive',
      });
      setData(null);
      setHierarchicalData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedLevel, showTeamOnly, dateFilter, fromDate, toDate, employeeSearch, stateSearch, buildHierarchy]);

  useEffect(() => {
    fetchData(currentPage);
  }, [fetchData, currentPage]);

  // ─── Fetch Team Hierarchy ──────────────────────────────────────────────
  const fetchTeamHierarchy = useCallback(async (employeeId: string) => {
    if (loadingHierarchy.has(employeeId)) return;

    setLoadingHierarchy(prev => new Set(prev).add(employeeId));
    
    try {
      const params: any = {
        employeeId: employeeId,
        level: parseInt(selectedLevel) || 1,
        page: 1,
        limit: 10,
      };

      if (showTeamOnly) {
        params.team = true;
      }

      if (dateFilter === 'custom') {
        if (fromDate && toDate) {
          params.fromDate = fromDate;
          params.toDate = toDate;
        }
      } else {
        params.dateFilter = dateFilter;
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.stateWiseEmployeeReportTeam,
        params,
        null,
        true
      );

      const result = response as ApiResponse;
      const teamData = result?.data || [];

      if (teamData.length > 0) {
        const updateHierarchy = (nodes: EmployeeData[]): EmployeeData[] => {
          return nodes.map((node: EmployeeData) => {
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
          return nodes.map((node: EmployeeData) => {
            if (node.employeeId === employeeId) {
              return { ...node, children: [] };
            }
            if (node.children && node.children.length > 0) {
              return { ...node, children: updateHierarchy(node.children) };
            }
            return node;
          });
        };
        setHierarchicalData(prev => updateHierarchy(prev));
        setExpandedEmployees(prev => new Set(prev).add(employeeId));
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
        return nodes.map((node: EmployeeData) => {
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

  // ─── Handle page change ───
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (data && newPage > data.totalPages)) return;
    setCurrentPage(newPage);
    setExpandedEmployees(new Set());
  };

  // ─── Handle employee click for details ───
  const handleEmployeeClick = (employee: EmployeeData) => {
    setSelectedEmployee(employee);
    setDetailsModalOpen(true);
  };

  // ─── Export CSV ───
  const handleExport = () => {
    if (!data?.data?.length) {
      toast({ title: 'No data to export' });
      return;
    }
    const headers = [
      'Employee Name',
      'Employee Code',
      'Total Leads',
      'Registrations',
      'Admissions',
      'Revenue',
      'Reg. Conv. %',
      'Conv. %',
      'Team Size',
      'States',
    ];
    const rows: any[] = [];
    data.data.forEach(employee => {
      const statesStr = employee.states.map(s => `${s.state}:${s.totalLeads}`).join('; ');
      rows.push([
        employee.employeeName,
        employee.employeeCode,
        employee.totalLeads,
        employee.totalRegistrationDone,
        employee.totalAdmissionDone,
        employee.totalRevenue,
        employee.registrationConversionPercentage || 0,
        employee.conversionPercentage || 0,
        employee.teamSize || '',
        statesStr,
      ]);
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee_state_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported Successfully!' });
  };

  // ─── Flatten hierarchy for search ───
  const flattenHierarchy = useCallback((nodes: EmployeeData[]): EmployeeData[] => {
    let result: EmployeeData[] = [];
    nodes.forEach((node: EmployeeData) => {
      result.push({ ...node, level: node.level || 0 });
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenHierarchy(node.children));
      }
    });
    return result;
  }, []);

  // ─── Filtered employees ───
  const flattenedData = flattenHierarchy(hierarchicalData);
  
  const filteredEmployees = flattenedData.filter((emp: EmployeeData) =>
    employeeSearch ? emp.employeeName?.toLowerCase().includes(employeeSearch.toLowerCase()) : true
  );

  // For display, use top-level only
  const topLevelEmployees = hierarchicalData;

  const hasActiveFilters =
    dateFilter !== 'today' ||
    (dateFilter === 'custom' && (fromDate || toDate)) ||
    selectedLevel !== '1' ||
    showTeamOnly ||
    employeeSearch !== '' ||
    stateSearch !== '';

  // Check if team mode is active
  const isTeamMode = showTeamOnly;

  // Get unique states
  const getUniqueStates = () => {
    const states = new Set<string>();
    flattenedData.forEach(emp => {
      emp.states.forEach(state => states.add(state.state));
    });
    return states.size;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Employee State Report</h3>
          <p className="text-sm text-slate-500">Employee performance across different states</p>
          {data?.startDate && data?.endDate && (
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(data.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} – {new Date(data.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(currentPage)}
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
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-1 h-8 text-xs rounded-xl"
          >
            <Filter className="w-3 h-3" />
            Filters
            {hasActiveFilters && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
            {showFilters ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 w-full mt-2 pt-2 border-t border-slate-100">
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
                    id="team-filter-employee"
                    checked={showTeamOnly}
                    onCheckedChange={(checked) => {
                      setShowTeamOnly(checked === true);
                    }}
                    className="h-4 w-4 rounded border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                  />
                  <Label
                    htmlFor="team-filter-employee"
                    className="text-xs font-medium text-slate-600 cursor-pointer"
                  >
                    Team
                  </Label>
                </div>
              </div>

              {/* Date Filter */}
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
                      className="w-full h-8 px-2 text-xs border rounded-xl bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <div className="relative w-[130px]">
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full h-8 px-2 text-xs border rounded-xl bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">Max 30 days</span>
                </>
              )}

              {/* Employee Search */}
              <div className="relative w-44">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <Input
                  placeholder="Search employee..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="pl-7 h-8 text-xs rounded-xl border-slate-200"
                />
              </div>

              {/* State Search */}
              <div className="relative w-44">
                <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <Input
                  placeholder="Search state..."
                  value={stateSearch}
                  onChange={(e) => setStateSearch(e.target.value)}
                  className="pl-7 h-8 text-xs rounded-xl border-slate-200"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Summary */}
      {!loading && data && data.data?.length > 0 && (
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
              {dateFilter === 'today' ? 'Today' : dateFilter === 'custom' ? 'Custom Range' : dateFilter}
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
          {employeeSearch && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>
                Employee:{' '}
                <span className="font-medium text-slate-700">"{employeeSearch}"</span>
              </span>
            </>
          )}
          {stateSearch && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>
                State:{' '}
                <span className="font-medium text-slate-700">"{stateSearch}"</span>
              </span>
            </>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-orange-400 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading employee data...</p>
          </div>
        </div>
      ) : !data || !data.data?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
          <UserCheck className="w-14 h-14 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No employee data found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting filters or date range</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Card className="p-4 bg-white border-0 shadow-sm">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Employees</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{data.totalEmployees}</p>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">States</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{getUniqueStates()}</p>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Total Leads</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{data.totalLeads.toLocaleString()}</p>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Registrations</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{data.totalRegistrationDone.toLocaleString()}</p>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Admissions</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{data.totalAdmissionDone.toLocaleString()}</p>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Revenue</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">₹{data.totalRevenue.toLocaleString()}</p>
            </Card>
          </div>

          {/* Main Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 border-b border-slate-200">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50/80 z-10 min-w-[180px] py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        Employee
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center min-w-[80px] py-3 px-4">
                      Leads
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center min-w-[80px] py-3 px-4">
                      Reg.
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center min-w-[80px] py-3 px-4">
                      Adm.
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center min-w-[100px] py-3 px-4">
                      Reg. %
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center min-w-[100px] py-3 px-4">
                      Conv. %
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center min-w-[130px] py-3 px-4 bg-orange-50/50">
                      <div className="flex items-center justify-center gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-orange-700">Revenue</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center min-w-[80px] py-3 px-4">
                      States
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topLevelEmployees.map((employee) => {
                    const hasTeam = employee.teamSize && employee.teamSize > 1;
                    const isExpanded = expandedEmployees.has(employee.employeeId);
                    const isLoading = loadingHierarchy.has(employee.employeeId);

                    return (
                      <>
                        <TableRow
                          key={employee.employeeId}
                          className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors cursor-pointer"
                          onClick={() => handleEmployeeClick(employee)}
                        >
                          <TableCell className="text-sm sticky left-0 bg-white border-r border-slate-100 z-10 py-3 px-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-slate-800 hover:text-orange-600">
                                  {employee.employeeName}
                                </span>
                                {hasTeam && showTeamOnly ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpand(employee.employeeId, true);
                                    }}
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
                                {employee.teamSize && employee.teamSize > 1 && showTeamOnly ? (
                                  <span className="text-[8px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                    Team: {employee.teamSize}
                                  </span>
                                ):(<></>)}
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-slate-50">
                                  {employee.employeeCode}
                                </Badge>
                              </div>
                              <span className="text-xs text-slate-400 truncate max-w-[160px]">
                                {employee.employeeEmail}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-center py-3 px-4 font-medium text-slate-700">
                            {employee.totalLeads}
                          </TableCell>
                          <TableCell className="text-sm text-center py-3 px-4 font-medium text-purple-600">
                            {employee.totalRegistrationDone}
                          </TableCell>
                          <TableCell className="text-sm text-center py-3 px-4 font-medium text-emerald-600">
                            {employee.totalAdmissionDone}
                          </TableCell>
                          <TableCell className="text-sm text-center py-3 px-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full font-medium text-[11px]",
                              employee.registrationConversionPercentage > 20 ? "bg-purple-100 text-purple-700" :
                              employee.registrationConversionPercentage > 10 ? "bg-indigo-100 text-indigo-700" :
                              "bg-slate-100 text-slate-600"
                            )}>
                              {employee.registrationConversionPercentage || 0}%
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-center py-3 px-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full font-medium text-[11px]",
                              employee.conversionPercentage > 15 ? "bg-emerald-100 text-emerald-700" :
                              employee.conversionPercentage > 8 ? "bg-amber-100 text-amber-700" :
                              "bg-slate-100 text-slate-600"
                            )}>
                              {employee.conversionPercentage || 0}%
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-center py-3 px-4 bg-orange-50/30 font-semibold text-orange-600">
                            ₹{employee.totalRevenue.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-center py-3 px-4">
                            <span className="text-sm text-slate-500">{employee.states.length}</span>
                          </TableCell>
                        </TableRow>

                        {/* Nested Team Members */}
                        {isExpanded && employee.children && employee.children.length > 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="p-0 bg-slate-50/30">
                              <div className="px-4 py-2">
                                <TeamMemberTable
                                  teamMembers={employee.children}
                                  level={1}
                                  expandedEmployees={expandedEmployees}
                                  loadingHierarchy={loadingHierarchy}
                                  toggleExpand={toggleExpand}
                                  onEmployeeClick={handleEmployeeClick}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        )}

                        {/* Show message if expanded but no team members */}
                        {isExpanded && (!employee.children || employee.children.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={8} className="p-0">
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
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-slate-500">
                Page {data.page || currentPage} of {data.totalPages}
                <span className="ml-3">
                  Total: <span className="font-medium text-slate-700">{data.totalEmployees}</span> employees
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!data.hasPreviousPage || loading}
                  className="h-8 w-8 p-0 rounded-lg border-slate-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    let pageNum;
                    const totalPages = data.totalPages;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage < 3) {
                      pageNum = i + 1;
                    } else if (currentPage > totalPages - 3) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={cn(
                          "w-8 h-8 text-sm font-medium rounded-lg transition-colors",
                          isActive
                            ? "bg-orange-500 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!data.hasNextPage || loading}
                  className="h-8 w-8 p-0 rounded-lg border-slate-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span>Showing {data.data.length} employees</span>
            <span>Last updated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Employee Details Modal */}
      <EmployeeDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        employee={selectedEmployee}
      />
    </div>
  );
}

// ─── Missing imports ───
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';