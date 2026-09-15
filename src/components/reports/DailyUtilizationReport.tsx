import { useState, useEffect, useCallback } from 'react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  RefreshCw,
  Download,
  Filter,
  Search,
  Calendar,
  Phone,
  ChevronUp,
  ChevronDown,
  Layers,
  Users,
  UserCog,
  Plus,
  Minus,
  UserPlus,
  PhoneCall,
  Clock,
  User,
  Mail,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*                               Types                                        */
/* -------------------------------------------------------------------------- */

interface CallDetail {
  callId: string;
  userId: string;
  employeeName: string;
  customerNumber: string;
  duration: number;
  answered: boolean;
  callStatus: string;
  createdAt: string;
  [key: string]: any;
}

interface CallDetailsResponse {
  date: string;
  employeeId: string;
  team: boolean;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  calls: CallDetail[];
}

interface DailyMetric {
  date: string;
  dial: number;
  answered: number;
}

interface EmployeeDailyData {
  employeeId: string;
  employeeName: string;
  employeeEmail?: string;
  dailyMetrics: DailyMetric[];
  teamSize?: number;
  team?: boolean;
  children?: EmployeeDailyData[];
  level?: number;
  parentId?: string | null;
  isTeamMember?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                               Date & Helpers                               */
/* -------------------------------------------------------------------------- */
const dateFilterOptions = [
  { value: 'today', label: 'Today' },
  { value: 'custom', label: 'Custom Range' },
];

const formatDateShort = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const formatDateFull = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
};

const formatTime = (seconds: number) => {
  if (!seconds) return '0s';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

const getCallStatusColor = (status: string) => {
  if (!status) return 'text-slate-600 bg-slate-50';
  const s = status.toLowerCase();
  if (s === 'answered') return 'text-emerald-600 bg-emerald-50';
  if (s === 'missed' || s === 'no answer') return 'text-red-600 bg-red-50';
  if (s === 'busy') return 'text-amber-600 bg-amber-50';
  if (s === 'failed') return 'text-red-600 bg-red-50';
  return 'text-slate-600 bg-slate-50';
};

/* -------------------------------------------------------------------------- */
/*                          Sub-component: Team Member Table                   */
/* -------------------------------------------------------------------------- */

interface TeamMemberTableProps {
  teamMembers: EmployeeDailyData[];
  dates: string[];
  level: number;
  expandedEmployees: Set<string>;
  loadingHierarchy: Set<string>;
  toggleExpand: (employeeId: string, hasTeam: boolean) => void;
  onCallClick: (employeeId: string, employeeName: string, date: string) => void;
}

function TeamMemberTable({
  teamMembers,
  dates,
  level,
  expandedEmployees,
  loadingHierarchy,
  toggleExpand,
  onCallClick,
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
              <TableHead className="text-[10px] font-semibold text-slate-500 uppercase sticky left-0 bg-orange-50/50 z-10 min-w-[140px] py-2">
                Employee
              </TableHead>
              {dates.map((date: string) => (
                <TableHead key={date} className="text-[10px] font-semibold text-slate-500 uppercase text-center min-w-[80px] py-2">
                  <div className="font-semibold text-slate-700">{formatDateShort(date)}</div>
                </TableHead>
              ))}
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
                    className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                  >
                    <TableCell className="sticky left-0 bg-white border-r z-10 py-2">
                      <div className="flex flex-col min-w-[120px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium text-slate-800 truncate max-w-[100px]">
                            {member.employeeName}
                          </span>
                          {hasTeam ?(
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
                          ):(<></>)}
                          {member.teamSize && member.teamSize > 1? (
                            <span className="text-[7px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded-full whitespace-nowrap">
                              Team: {member.teamSize}
                            </span>
                          ):(<></>)}
                        </div>
                        {member.employeeEmail && (
                          <span className="text-[8px] text-slate-400 truncate max-w-[110px]">
                            {member.employeeEmail}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    {dates.map((date: string) => {
                      const metric = member.dailyMetrics?.find((m: any) => m.date === date);
                      const hasData = metric?.dial > 0;
                      return (
                        <TableCell key={date} className="text-center py-2">
                          {hasData ? (
                            <button
                              onClick={() => onCallClick(member.employeeId, member.employeeName, date)}
                              className="inline-flex flex-col items-center px-2 py-1 rounded-lg bg-orange-50/70 hover:bg-orange-100 transition-all hover:scale-105 cursor-pointer"
                            >
                              <span className="text-xs font-medium text-slate-800">{metric.dial}</span>
                              {metric.answered > 0 && (
                                <span className="text-[8px] text-orange-600 mt-0.5">
                                  {metric.answered} ans
                                </span>
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-300">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  {/* Nested team members */}
                  {isExpanded && member.children && member.children.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={dates.length + 1} className="p-0">
                        <div className="ml-6 pl-4 border-l-2 border-orange-200">
                          <TeamMemberTable
                            teamMembers={member.children}
                            dates={dates}
                            level={level + 1}
                            expandedEmployees={expandedEmployees}
                            loadingHierarchy={loadingHierarchy}
                            toggleExpand={toggleExpand}
                            onCallClick={onCallClick}
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
/*                          Call Details Modal                                 */
/* -------------------------------------------------------------------------- */

function CallDetailsModal({
  isOpen,
  onClose,
  data,
  loading,
  employeeName,
  date,
  onPageChange,
  onLimitChange,
  currentPage,
  pageLimit,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: CallDetailsResponse | null;
  loading: boolean;
  employeeName: string;
  date: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  currentPage: number;
  pageLimit: number;
}) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const calls = data?.calls || [];
  const filteredCalls = calls.filter(call => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return call.customerNumber.includes(searchLower) ||
           call.employeeName?.toLowerCase().includes(searchLower) ||
           call.callId?.toLowerCase().includes(searchLower);
  });

  const totalPages = data?.totalPages || 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-4 flex flex-col rounded-2xl">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-orange-500" />
                Call Details
              </DialogTitle>
              <div className="text-sm text-slate-500 mt-1">
                {employeeName} • {formatDateFull(date)}
                {data && (
                  <span className="ml-3">
                    Total: <span className="font-semibold text-orange-600">{data.total}</span> calls
                  </span>
                )}
                {data?.team && (
                  <span className="ml-3 text-orange-600">
                    <UserCog className="w-3.5 h-3.5 inline mr-1" />
                    Team View
                  </span>
                )}
              </div>
            </div>
           
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            </div>
          ) : !calls || calls.length === 0 ? (
            <div className="text-center py-12 text-slate-400 h-full flex items-center justify-center">
              No calls found for this date
            </div>
          ) : (
            <>

              {/* Table */}
              <div className="overflow-x-auto flex-1 min-h-0 border border-slate-200 rounded-xl">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-50">
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">#</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Call ID</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Employee</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Customer</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">Duration</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCalls.map((call, index) => {
                      const globalIndex = ((currentPage - 1) * pageLimit) + index + 1;
                      return (
                        <TableRow key={call.callId || index} className="hover:bg-slate-50/60">
                          <TableCell className="text-sm text-slate-500">{globalIndex}</TableCell>
                          <TableCell className="text-xs font-mono text-slate-600">
                            {call.callId || '-'}
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-800">
                            {call.employeeName || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {call.customerNumber || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-center text-slate-600">
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {formatTime(call.duration || 0)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn(
                              "text-xs font-medium px-2.5 py-1 rounded-full",
                              getCallStatusColor(call.callStatus)
                            )}>
                              {call.callStatus || 'Unknown'}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {call.createdAt ? formatDateFull(call.createdAt) : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-2 border-t border-slate-100 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500">
                      Showing {calls.length} of {data?.total || 0} calls
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Show:</span>
                      <Select
                        value={pageLimit.toString()}
                        onValueChange={(value) => onLimitChange(parseInt(value))}
                      >
                        <SelectTrigger className="h-7 w-[70px] text-xs rounded-lg">
                          <SelectValue placeholder="20" />
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
                      disabled={currentPage === 1 || loading}
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-slate-500 min-w-[60px] text-center">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end p-4 border-t border-slate-200 bg-slate-50/50 flex-shrink-0">
          <Button
            onClick={onClose}
            className="rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*                             Main Component                                 */
/* -------------------------------------------------------------------------- */

export function DailyUtilizationReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Level filter
  const [levels, setLevels] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState('1');

  // Team filter (checkbox)
  const [showTeamOnly, setShowTeamOnly] = useState<boolean>(false);

  // Date filter
  const [dateFilter, setDateFilter] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pool filter
  const [pools, setPools] = useState<any[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState('all');

  // Employee search (client‑side)
  const [searchTerm, setSearchTerm] = useState('');

  // ─── Hierarchical State ──────────────────────────────────────────────────
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [hierarchicalData, setHierarchicalData] = useState<EmployeeDailyData[]>([]);
  const [loadingHierarchy, setLoadingHierarchy] = useState<Set<string>>(new Set());

  // ─── Call Details Modal State ────────────────────────────────────────────
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callModalData, setCallModalData] = useState<CallDetailsResponse | null>(null);
  const [callModalLoading, setCallModalLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [callPage, setCallPage] = useState(1);
  const [callLimit, setCallLimit] = useState(20);

  // ─── Fetch levels & pools ───
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
    const fetchPools = async () => {
      try {
        const res = await getDataHandlerWithToken('getAllPools', null, null);
        setPools(res?.data || res || []);
      } catch (error) {
        /* ignore */
      }
    };
    fetchLevels();
    fetchPools();
  }, []);

  const extractLevelNumber = (name: string): number => {
    const match = name.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  };

  // ─── Build Hierarchy ──────────────────────────────────────────────────────
  const buildHierarchy = useCallback((employees: EmployeeDailyData[]): EmployeeDailyData[] => {
    return employees.map(emp => ({
      ...emp,
      children: [],
      level: 0,
    }));
  }, []);

  // ─── Fetch daily utilization data ───
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        level: parseInt(selectedLevel) || 1,
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
        if (diffDays > 5) {
          toast({ title: 'Date range too large', description: 'Max 5 days allowed for daily view.', variant: 'destructive' });
          setLoading(false);
          return;
        }
        params.fromDate = fromDate;
        params.toDate = toDate;
      } else {
        params.dateFilter = dateFilter;
      }

      if (selectedPoolId && selectedPoolId !== 'all') {
        params.poolId = selectedPoolId;
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.employeePoolDailyUtilizationReport,
        params,
        null,
        true
      );

      const report = response?.data || response;
      setData(report || null);
      
      const employees = report?.employees || [];
      const hierarchy = buildHierarchy(employees);
      setHierarchicalData(hierarchy);
      setExpandedEmployees(new Set());
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load daily utilization', variant: 'destructive' });
      setData(null);
      setHierarchicalData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedLevel, showTeamOnly, dateFilter, fromDate, toDate, selectedPoolId, buildHierarchy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Fetch Team Hierarchy ──────────────────────────────────────────────
  const fetchTeamHierarchy = useCallback(async (employeeId: string) => {
    if (loadingHierarchy.has(employeeId)) return;

    setLoadingHierarchy(prev => new Set(prev).add(employeeId));
    
    try {
      const params: any = {
        employeeId: employeeId,
        level: parseInt(selectedLevel) || 1,
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

      if (selectedPoolId && selectedPoolId !== 'all') {
        params.poolId = selectedPoolId;
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.employeePoolDailyUtilizationReportTeam,
        params,
        null,
        true
      );

      const result = response?.data || response;
      const teamData = result?.employees || [];

      if (teamData.length > 0) {
        const updateHierarchy = (nodes: EmployeeDailyData[]): EmployeeDailyData[] => {
          return nodes.map((node: EmployeeDailyData) => {
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
        const updateHierarchy = (nodes: EmployeeDailyData[]): EmployeeDailyData[] => {
          return nodes.map((node: EmployeeDailyData) => {
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
  }, [selectedLevel, showTeamOnly, dateFilter, fromDate, toDate, selectedPoolId, loadingHierarchy]);

  // ─── Toggle Expand ──────────────────────────────────────────────────────
  const toggleExpand = useCallback(async (employeeId: string, hasTeam: boolean) => {
    if (expandedEmployees.has(employeeId)) {
      setExpandedEmployees(prev => {
        const newSet = new Set(prev);
        newSet.delete(employeeId);
        return newSet;
      });
      
      const removeChildren = (nodes: EmployeeDailyData[]): EmployeeDailyData[] => {
        return nodes.map((node: EmployeeDailyData) => {
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

  // ─── Fetch Call Details ──────────────────────────────────────────────────
  const fetchCallDetails = useCallback(async (employeeId: string, employeeName: string, date: string, page: number = 1, limit: number = 20) => {
    setCallModalLoading(true);
    setCallModalOpen(true);
    setSelectedEmployee({ id: employeeId, name: employeeName });
    setSelectedDate(date);
    setCallPage(page);
    setCallLimit(limit);

    try {
      const params: any = {
        employeeId: employeeId,
        date: date,
        page: page,
        limit: limit,
      };

      if (showTeamOnly) {
        params.team = true;
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.employeePoolDailyUtilizationReportCalls,
        params,
        null,
        true
      );

      const result = response?.data || response;
      setCallModalData({
        date: result.date || date,
        employeeId: result.employeeId || employeeId,
        team: result.team || false,
        page: result.page || page,
        limit: result.limit || limit,
        total: result.total || 0,
        totalPages: result.totalPages || 1,
        hasNextPage: result.hasNextPage || false,
        hasPreviousPage: result.hasPreviousPage || false,
        calls: result.calls || [],
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load call details',
        variant: 'destructive',
      });
      setCallModalData(null);
    } finally {
      setCallModalLoading(false);
    }
  }, [showTeamOnly]);

  // ─── Handle Call Click ──────────────────────────────────────────────────
  const handleCallClick = useCallback((employeeId: string, employeeName: string, date: string) => {
    fetchCallDetails(employeeId, employeeName, date, 1, callLimit);
  }, [fetchCallDetails, callLimit]);

  // ─── Handle Call Modal Page Change ──────────────────────────────────────
  const handleCallPageChange = useCallback((newPage: number) => {
    if (selectedEmployee && selectedDate) {
      fetchCallDetails(selectedEmployee.id, selectedEmployee.name, selectedDate, newPage, callLimit);
    }
  }, [selectedEmployee, selectedDate, callLimit, fetchCallDetails]);

  // ─── Handle Call Modal Limit Change ──────────────────────────────────────
  const handleCallLimitChange = useCallback((newLimit: number) => {
    setCallLimit(newLimit);
    if (selectedEmployee && selectedDate) {
      fetchCallDetails(selectedEmployee.id, selectedEmployee.name, selectedDate, 1, newLimit);
    }
  }, [selectedEmployee, selectedDate, fetchCallDetails]);

  // ─── Close Call Modal ────────────────────────────────────────────────────
  const closeCallModal = useCallback(() => {
    setCallModalOpen(false);
    setCallModalData(null);
    setSelectedEmployee(null);
    setSelectedDate('');
    setCallModalLoading(false);
  }, []);

  // ─── Export CSV ───
  const handleExport = () => {
    if (!data?.employees || !data?.dateStrings) {
      toast({ title: 'No data to export' });
      return;
    }
    const dates = data.dateStrings;
    const headers = ['Employee', ...dates.flatMap(d => [`${formatDateShort(d)} Dials`, `${formatDateShort(d)} Answered`]), 'Team Size'];
    const rows = data.employees.map((emp: any) => {
      const row: any[] = [emp.employeeName];
      dates.forEach(date => {
        const metric = emp.dailyMetrics?.find((m: any) => m.date === date);
        row.push(metric?.dial || 0, metric?.answered || 0);
      });
      row.push(emp.teamSize || '');
      return row;
    });
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily_utilization_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  };

  // ─── Flatten hierarchy for filtering ───
  const flattenHierarchy = useCallback((nodes: EmployeeDailyData[]): EmployeeDailyData[] => {
    let result: EmployeeDailyData[] = [];
    nodes.forEach((node: EmployeeDailyData) => {
      result.push({ ...node, level: node.level || 0 });
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenHierarchy(node.children));
      }
    });
    return result;
  }, []);

  // ─── Filtered employees (client‑side search) ───
  const flattenedData = flattenHierarchy(hierarchicalData);
  
  const filteredEmployees = flattenedData.filter((emp: EmployeeDailyData) =>
    searchTerm ? emp.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) : true
  );

  // For display, use top-level only
  const topLevelEmployees = hierarchicalData;
  const filteredTopLevel = topLevelEmployees.filter((emp: EmployeeDailyData) =>
    searchTerm ? emp.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) : true
  );

  const dates = data?.dateStrings || [];

  // Check if team mode is active
  const isTeamMode = data?.filters?.team === true || showTeamOnly;

  const hasActiveFilters =
    selectedLevel !== '1' ||
    showTeamOnly ||
    dateFilter !== 'today' ||
    (dateFilter === 'custom' && (fromDate || toDate)) ||
    (selectedPoolId && selectedPoolId !== 'all') ||
    searchTerm !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Employee inputs</h3>
          <p className="text-sm text-slate-500">Day‑wise call & answer metrics per employee</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="rounded-xl border-slate-200">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
            Refresh
          </Button>
          <Button size="sm" onClick={handleExport} disabled={!data || loading} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
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
                  id="team-filter-daily"
                  checked={showTeamOnly}
                  onCheckedChange={(checked) => {
                    setShowTeamOnly(checked === true);
                  }}
                  className="h-4 w-4 rounded border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <Label
                  htmlFor="team-filter-daily"
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
                <span className="text-[10px] text-slate-400">Max 5 days</span>
              </>
            )}

            {/* Employee Search */}
            <div className="relative w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-8 text-xs rounded-xl border-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter Summary */}
      {!loading && data && data.employees?.length > 0 && (
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
              {dateFilter === 'today' ? 'Today' : 'Custom Range'}
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
          {selectedPoolId !== 'all' && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>
                Pool:{' '}
                <span className="font-medium text-slate-700">
                  {pools.find(p => p._id === selectedPoolId)?.name || selectedPoolId}
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
          <p className="ml-2 text-sm text-slate-500">Loading daily data...</p>
        </div>
      ) : !data || !data.employees?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No daily utilization data found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting filters or level</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary row */}
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{filteredTopLevel.length} employees</span>
            {dates.length > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>
                  Showing {dates.length} day{dates.length > 1 ? 's' : ''}
                </span>
              </>
            )}
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

          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase sticky left-0 bg-slate-50 z-10 min-w-[140px]">
                    Employee
                  </TableHead>
                  {dates.map((date: string) => (
                    <TableHead key={date} className="text-xs text-center min-w-[100px] py-3">
                      <div className="font-semibold text-slate-800">{formatDateShort(date)}</div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTopLevel.map((emp: EmployeeDailyData, idx: number) => {
                  const hasTeam = emp.teamSize && emp.teamSize > 1;
                  const isExpanded = expandedEmployees.has(emp.employeeId);
                  const isLoading = loadingHierarchy.has(emp.employeeId);

                  return (
                    <>
                      <TableRow key={emp.employeeId || idx} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                        <TableCell className="text-xs font-medium text-slate-800 sticky left-0 bg-white border-r z-10 py-3">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{emp.employeeName}</span>
                              {hasTeam && showTeamOnly ? (
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
                              ):(<></>)}
                              {emp.teamSize && emp.teamSize > 1 && showTeamOnly? (
                                <span className="text-[8px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                  Team: {emp.teamSize}
                                </span>
                              ):(<></>)}
                            </div>
                            {emp.employeeEmail && (
                              <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                {emp.employeeEmail}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        {dates.map((date: string) => {
                          const metric = emp.dailyMetrics?.find((m: any) => m.date === date);
                          const hasData = metric?.dial > 0;
                          return (
                            <TableCell key={date} className="text-center py-3">
                              {hasData ? (
                                <button
                                  onClick={() => handleCallClick(emp.employeeId, emp.employeeName, date)}
                                  className="inline-flex flex-col items-center px-2 py-1 rounded-lg bg-orange-50/70 hover:bg-orange-100 transition-all hover:scale-105 cursor-pointer"
                                >
                                  <span className="text-sm font-medium text-slate-800">{metric.dial}</span>
                                  {metric.answered > 0 && (
                                    <span className="text-[10px] text-orange-600 mt-0.5">
                                      {metric.answered} ans
                                    </span>
                                  )}
                                </button>
                              ) : (
                                <span className="text-sm text-slate-300">-</span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>

                      {/* Nested Team Members */}
                      {isExpanded && emp.children && emp.children.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={dates.length + 1} className="p-0 bg-slate-50/30">
                            <div className="px-4 py-2">
                              <TeamMemberTable
                                teamMembers={emp.children}
                                dates={dates}
                                level={1}
                                expandedEmployees={expandedEmployees}
                                loadingHierarchy={loadingHierarchy}
                                toggleExpand={toggleExpand}
                                onCallClick={handleCallClick}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Show message if expanded but no team members */}
                      {isExpanded && (!emp.children || emp.children.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={dates.length + 1} className="p-0">
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
            {filteredTopLevel.length === 0 && searchTerm && (
              <div className="text-center py-8 text-sm text-slate-400">
                No employees match "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Call Details Modal */}
      <CallDetailsModal
        isOpen={callModalOpen}
        onClose={closeCallModal}
        data={callModalData}
        loading={callModalLoading}
        employeeName={selectedEmployee?.name || ''}
        date={selectedDate}
        onPageChange={handleCallPageChange}
        onLimitChange={handleCallLimitChange}
        currentPage={callPage}
        pageLimit={callLimit}
      />
    </div>
  );
}