// UtilizationReport.tsx - Updated with DD/MM/YY date format
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
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  RefreshCw,
  Download,
  Filter,
  Search,
  Users,
  Phone,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Clock,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*                                Utility Helpers                              */
/* -------------------------------------------------------------------------- */
const formatTime = (seconds: number) => {
  if (!seconds) return '0m';
  const mins = Math.floor(seconds / 60);
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  }
  return `${mins}m`;
};

// Updated date formatter to DD/MM/YY
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

// Updated datetime formatter to DD/MM/YY HH:MM
const formatDateTime = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/* -------------------------------------------------------------------------- */
/*                          Sub‑Components (Modals)                            */
/* -------------------------------------------------------------------------- */

// Lead Details Modal (full screen)
function LeadDetailsModal({
  isOpen,
  onClose,
  leads,
  loading,
  page,
  totalPages,
  totalLeads,
  onPageChange,
  stageName,
  employeeName,
}: {
  isOpen: boolean;
  onClose: () => void;
  leads: any[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalLeads: number;
  onPageChange: (newPage: number) => void;
  stageName: string;
  employeeName: string;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-4 flex flex-col rounded-2xl">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-slate-800">
            {stageName} Leads — {employeeName}
          </DialogTitle>
          {!loading && totalLeads > 0 && (
            <div className="text-sm text-slate-500 mt-1">Total leads: {totalLeads}</div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            </div>
          ) : !leads || leads.length === 0 ? (
            <div className="text-center py-12 text-slate-400 h-full flex items-center justify-center">
              No leads found for this stage
            </div>
          ) : (
            <>
              <div className="overflow-x-auto flex-1 min-h-0 border border-slate-200 rounded-xl">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-50">
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Lead Name</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Phone</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Email</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Source</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Stage</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Assigned Date</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead: any, idx: number) => (
                      <TableRow key={lead.leadId || lead._id || idx} className="hover:bg-slate-50/60">
                        <TableCell className="text-sm font-medium text-slate-800">{lead.name || '-'}</TableCell>
                        <TableCell className="text-sm text-slate-600">{lead.phone || '-'}</TableCell>
                        <TableCell className="text-sm text-slate-600">{lead.email || '-'}</TableCell>
                        <TableCell className="text-sm capitalize text-slate-600">{lead.source || '-'}</TableCell>
                        <TableCell className="text-sm capitalize text-slate-600">{lead.stageName || lead.stage || '-'}</TableCell>
                        <TableCell className="text-sm text-slate-600">{formatDate(lead.assignedDate)}</TableCell>
                        <TableCell className="text-sm text-slate-600">{lead.employeeName || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 flex-shrink-0">
                  <div className="text-sm text-slate-500">
                    Page {page + 1} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 0}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page === totalPages - 1}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Stage Modal (unchanged except styling)
function StageModal({
  isOpen,
  onClose,
  employeeName,
  stages,
  onStageClick,
}: {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  stages: any;
  onStageClick: (stageId: string, stageName: string) => void;
}) {
  let stagesList: { id: string; name: string; count: number }[] = [];

  if (Array.isArray(stages)) {
    stagesList = stages.map((item: any) => ({
      id: item.stageId || item.id || '',
      name: item.stageName || item.name || 'Unknown',
      count: item.count || 0,
    }));
  } else if (typeof stages === 'object' && stages !== null) {
    stagesList = Object.entries(stages).map(([name, count]) => ({
      id: name,
      name,
      count: count as number,
    }));
  }

  stagesList.sort((a, b) => b.count - a.count);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-800">Stage Details — {employeeName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {stagesList.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No stage data available for this employee
            </div>
          ) : (
            stagesList.map(stage => (
              <div
                key={stage.id}
                onClick={(e) => {
                    e.stopPropagation();
                    onStageClick(stage.id, stage.name);
                  }}
                className="flex items-center cursor-pointer justify-between p-3 bg-orange-50 rounded-xl hover:bg-orange-400"
              >
                <span className="text-sm font-medium text-slate-700 capitalize">{stage.name}</span>
                <Badge
                  variant="secondary"
                  className="text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
                >
                  {stage.count}
                </Badge>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Main Report Component                           */
/* -------------------------------------------------------------------------- */
const dateFilterOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const EMPLOYEES_PER_PAGE = 10;

export function UtilizationReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Level filter
  const [levels, setLevels] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState('1');

  // Date filter
  const [dateFilter, setDateFilter] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // User filter
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('all');

  // Search (employee name)
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);

  // Modals
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadsData, setLeadsData] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsPage, setLeadsPage] = useState(0);
  const [leadsTotalPages, setLeadsTotalPages] = useState(1);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');

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

  // ─── Fetch report data ───
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        level: parseInt(selectedLevel) || 1,
      };
      if (dateFilter === 'custom') {
        if (!fromDate || !toDate) {
          setLoading(false);
          return;
        }
        const diffTime = Math.abs(new Date(toDate).getTime() - new Date(fromDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 31) {
          toast({ title: 'Date range too large', description: 'Max 31 days', variant: 'destructive' });
          setLoading(false);
          return;
        }
        params.fromDate = fromDate;
        params.toDate = toDate;
      } else {
        params.dateFilter = dateFilter;
      }

      if (selectedUserId && selectedUserId !== 'all') {
        params.userId = selectedUserId;
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.employeePoolUtilizationReport,
        params,
        null,
        true
      );
      setData(response?.data || response || null);
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load utilization', variant: 'destructive' });
      setData(null);
    } finally {
      setLoading(false);
      setCurrentPage(0);
    }
  }, [selectedLevel, dateFilter, fromDate, toDate, selectedUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Export CSV ───
  const handleExport = () => {
    if (!data?.employees?.length) {
      toast({ title: 'No data to export' });
      return;
    }
    const headers = [
      'Employee', 'Designation', 'Vintage', 'Leads', 'New Leads',
      'Total Dials', 'Uniq Dials', 'Answered', 'Talk Time',
      'PCAT S.', 'PCAT D.', 'Reg.', 'Ad.'
    ];
    const rows = data.employees.map((emp: any) => [
      emp.employeeName,
      emp.designation || '-',
      emp.vintage || '-',
      emp.leadAssigned || 0,
      emp.newLead || 0,
      emp.totalDial || 0,
      emp.uniqDial || 0,
      emp.answeredCall || 0,
      formatTime(emp.answeredTalkTime),
      emp.pcatScheduled || 0,
      emp.pcatDone || 0,
      emp.registrationDone || 0,
      emp.admissionDone || 0,
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `utilization_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  };

  // ─── Stage click handler ───
  const handleStageClick = (stageId: string, stageName: string) => {
    setIsLeadModalOpen(true);
    fetchLeadsForStage(stageId, stageName, 0);
  };

  const fetchLeadsForStage = async (stageId: string, stageName: string, pageNum: number = 0) => {
    if (!selectedEmployee) return;
    setSelectedStageId(stageId);
    setLeadsLoading(true);
    try {
      const params: any = {
        employeeId: selectedEmployee.employeeId,
        stageId,
        page: pageNum + 1,
        limit: 10,
      };
      if (data.startDate) params.startDate = data.startDate;
      if (data.endDate) params.endDate = data.endDate;
      // fallback if not in data
      if (!params.startDate && dateFilter === 'custom') {
        params.startDate = fromDate;
        params.endDate = toDate;
      }
      const response = await getDataHandlerWithToken(ApiConfig.employeeStageleads, params, null, true);
      const result = response?.data || response;
      let leadsArray = result?.data || [];
      if (Array.isArray(result)) leadsArray = result;
      else if (result?.leads) leadsArray = result.leads;

      setLeadsData(leadsArray);
      setLeadsTotalPages(response?.totalPages || 1);
      setLeadsTotal(response?.total || leadsArray.length);
      setLeadsPage(pageNum);
      setSelectedStage(stageName);
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load leads', variant: 'destructive' });
      setLeadsData([]);
      setLeadsTotalPages(1);
      setLeadsTotal(0);
    } finally {
      setLeadsLoading(false);
    }
  };

  const handleLeadPageChange = (newPage: number) => {
    if (selectedStageId) fetchLeadsForStage(selectedStageId, selectedStage, newPage);
  };

  // ─── Derived data & pagination ───
  const filteredEmployees = data?.employees?.filter((emp: any) =>
    searchTerm ? emp.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) : true
  ) || [];

  const totalPages = Math.ceil(filteredEmployees.length / EMPLOYEES_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice(
    currentPage * EMPLOYEES_PER_PAGE,
    (currentPage + 1) * EMPLOYEES_PER_PAGE
  );

  const totals = filteredEmployees.reduce(
    (acc: any, e: any) => ({
      leadAssigned: acc.leadAssigned + (e.leadAssigned || 0),
      newLead: acc.newLead + (e.newLead || 0),
      totalDial: acc.totalDial + (e.totalDial || 0),
      uniqDial: acc.uniqDial + (e.uniqDial || 0),
      answeredCall: acc.answeredCall + (e.answeredCall || 0),
      answeredTalkTime: acc.answeredTalkTime + (e.answeredTalkTime || 0),
      pcatScheduled: acc.pcatScheduled + (e.pcatScheduled || 0),
      pcatDone: acc.pcatDone + (e.pcatDone || 0),
      registrationDone: acc.registrationDone + (e.registrationDone || 0),
      admissionDone: acc.admissionDone + (e.admissionDone || 0),
    }),
    { leadAssigned: 0, newLead: 0, totalDial: 0, uniqDial: 0, answeredCall: 0, answeredTalkTime: 0, pcatScheduled: 0, pcatDone: 0, registrationDone: 0, admissionDone: 0 }
  );

  const hasActiveFilters =
    selectedLevel !== '1' ||
    dateFilter !== 'today' ||
    (dateFilter === 'custom' && (fromDate || toDate)) ||
    selectedUserId !== 'all' ||
    searchTerm !== '';

  // Format date range display
  const formatDateRange = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return '';
    return `${formatDate(startDate)} – ${formatDate(endDate)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Utilization</h3>
          <p className="text-sm text-slate-500">Employee call & activity metrics</p>
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
                <span className="text-[10px] text-slate-400">Max 31 days</span>
              </>
            )}

            {/* Employee Search */}
            <div className="relative w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
                className="pl-7 h-8 text-xs rounded-xl border-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
          <p className="ml-2 text-sm text-slate-500">Loading utilization data...</p>
        </div>
      ) : !data || !data.employees?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Phone className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No utilization data found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting filters or level</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary row - updated with DD/MM/YY format */}
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{filteredEmployees.length} employees</span>
            {data.startDate && data.endDate && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>
                  {formatDateRange(data.startDate, data.endDate)}
                </span>
              </>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase sticky left-0 bg-slate-50 min-w-[120px] z-10">Employee</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">Designation</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">Vintage</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">Leads</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">New Leads</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">Total Dials</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">Uniq Dials</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">Answered</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">Talk Time</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">PCAT S.</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">PCAT D.</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">Reg.</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase text-center">Ad.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmployees.map((emp: any, idx: number) => (
                  <TableRow
                    key={emp.employeeId || idx}
                    className="hover:bg-slate-50/60 cursor-pointer transition-colors border-b border-slate-50"
                    onClick={() => { setSelectedEmployee(emp); setIsModalOpen(true); }}
                  >
                    <TableCell className="text-xs sticky left-0 bg-white border-r z-10 py-3">
                      <div className="font-medium text-slate-800">{emp.employeeName}</div>
                      <div className="text-[10px] text-slate-400">{emp.employeeEmail}</div>
                    </TableCell>
                    <TableCell className="text-xs text-center py-3 text-slate-600">{emp.designation || '-'}</TableCell>
                    <TableCell className="text-xs text-center py-3 text-slate-600">{emp.vintage || '-'}</TableCell>
                    <TableCell className="text-xs text-center font-medium py-3 text-slate-800">{emp.leadAssigned || 0}</TableCell>
                    <TableCell className="text-xs text-center py-3 text-slate-600">{emp.newLead || 0}</TableCell>
                    <TableCell className="text-xs text-center py-3 text-slate-600">{emp.totalDial || 0}</TableCell>
                    <TableCell className="text-xs text-center py-3 text-slate-600">{emp.uniqDial || 0}</TableCell>
                    <TableCell className="text-xs text-center py-3 text-slate-600">{emp.answeredCall || 0}</TableCell>
                    <TableCell className="text-xs text-center py-3 text-slate-600">{formatTime(emp.answeredTalkTime)}</TableCell>
                    <TableCell className="text-xs text-center py-3 text-slate-600">{emp.pcatScheduled || 0}</TableCell>
                    <TableCell className="text-xs text-center py-3 text-slate-600">{emp.pcatDone || 0}</TableCell>
                    <TableCell className="text-xs text-center font-medium py-3 text-slate-800">{emp.registrationDone || 0}</TableCell>
                    <TableCell className="text-xs text-center font-medium py-3 text-slate-800">{emp.admissionDone || 0}</TableCell>
                  </TableRow>
                ))}

                {/* Totals Row */}
                <TableRow className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                  <TableCell className="text-xs sticky left-0 bg-slate-50 font-semibold text-slate-800 py-3">Total</TableCell>
                  <TableCell className="text-xs text-center py-3" colSpan={2}>-</TableCell>
                  <TableCell className="text-xs text-center font-bold text-slate-800 py-3">{totals.leadAssigned}</TableCell>
                  <TableCell className="text-xs text-center font-bold text-slate-800 py-3">{totals.newLead}</TableCell>
                  <TableCell className="text-xs text-center font-bold text-slate-800 py-3">{totals.totalDial}</TableCell>
                  <TableCell className="text-xs text-center font-bold text-slate-800 py-3">{totals.uniqDial}</TableCell>
                  <TableCell className="text-xs text-center font-bold text-slate-800 py-3">{totals.answeredCall}</TableCell>
                  <TableCell className="text-xs text-center font-bold text-slate-800 py-3">{formatTime(totals.answeredTalkTime)}</TableCell>
                  <TableCell className="text-xs text-center font-bold text-slate-800 py-3">{totals.pcatScheduled}</TableCell>
                  <TableCell className="text-xs text-center font-bold text-slate-800 py-3">{totals.pcatDone}</TableCell>
                  <TableCell className="text-xs text-center font-bold text-slate-800 py-3">{totals.registrationDone}</TableCell>
                  <TableCell className="text-xs text-center font-bold text-slate-800 py-3">{totals.admissionDone}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500">Page {currentPage + 1} of {totalPages}</div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="h-8 w-8 p-0 rounded-lg">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1} className="h-8 w-8 p-0 rounded-lg">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals (kept from original) */}
      {selectedEmployee && (
        <StageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          employeeName={selectedEmployee.employeeName}
          stages={selectedEmployee.allStages || {}}
          onStageClick={handleStageClick}
        />
      )}

      <LeadDetailsModal
        key={selectedStageId}
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        leads={leadsData}
        loading={leadsLoading}
        page={leadsPage}
        totalPages={leadsTotalPages}
        totalLeads={leadsTotal}
        onPageChange={handleLeadPageChange}
        stageName={selectedStage}
        employeeName={selectedEmployee?.employeeName || ''}
      />

      {/* Hidden scrollbar style for modals */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}