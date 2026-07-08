import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search,
  Plus,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  Filter,
  ChevronUp,
  ChevronDown,
  Phone,
  AlertCircle,
  Mic,
  Calendar,
  User,
  Users,
  PhoneCall,
  CheckCircle,
  XCircle,
  BarChart3,
  Activity
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getDataHandlerWithToken, postDataHandlerWithToken } from '@/config/services';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import ApiConfig from '@/config/apiConfig';
import { LeadHistoryModal } from '@/components/modal/LeadHistory';
import { hasModulePermission } from '@/utils/modulePermissions';

interface LogType {
  _id: string;
  leadId: number;
  leadName: string;
  leadNumber?: string;
  userId: {
    _id: string;
    name: string;
    employeeId?: number;
  };
  duration: number | null;
  stageId?: {
    _id: string;
    name: string;
  };
  outcome?: string;
  startedAt?: string;
  interactionAt?: string;
  createdAt: string;
  answered: boolean;
  recording_url?: string;
  callCount30Days?: number;
  logType: 'call' | 'manual';
}

interface StatsType {
  totalDials: number;
  totalAnswered: number;
  totalTalkTime: number;
  totalInteractions: number;
  totalRecords: number;
}

interface Filters {
  search: string;
  leadId: string;
  stageId: string;
  userId: string;
  dateFilter: string;
  fromDate: string;
  toDate: string;
  sort: string;
  answered: string;
  group: string;
  logType: string;
  viewType: string;
}

export function CallLogsPage() {
  const [logs, setLogs] = useState<LogType[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogType | null>(null);
  const [leadHistoryOpen, setLeadHistoryOpen] = useState(false);
  const [leadHistory, setLeadHistory] = useState([]);
  const [addingManual, setAddingManual] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadOptions, setLeadOptions] = useState([]);
  const [searchingLeads, setSearchingLeads] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    search: '',
    leadId: 'all',
    stageId: 'all',
    userId: 'all',
    dateFilter: 'today',
    fromDate: '',
    toDate: '',
    sort: 'new',
    answered: 'all',
    group: 'false',
    logType: 'all',
    viewType: 'all',
  });

  const [manualForm, setManualForm] = useState({
    leadId: '',
    stageId: '',
    outcome: '',
    interactionAt: new Date().toISOString().slice(0, 16)
  });

  const buildQueryParams = useCallback(() => {
    const params: any = { page, limit };
    if (filters.search) params.search = filters.search;
    if (filters.leadId !== 'all') params.leadId = filters.leadId;
    if (filters.stageId !== 'all') params.stageId = filters.stageId;
    if (filters.userId !== 'all') params.byUserId = filters.userId;
    if (filters.dateFilter !== 'all') params.dateFilter = filters.dateFilter;
    if (filters.fromDate) params.fromDate = filters.fromDate;
    if (filters.toDate) params.toDate = filters.toDate;
    if (filters.sort) params.sort = filters.sort;
    if (filters.answered !== 'all') params.answered = filters.answered;
    if (filters.group === 'true') params.group = true;
    if (filters.logType !== 'all') params.logType = filters.logType;
    if (filters.viewType !== 'all') params.type = filters.viewType;
    return params;
  }, [filters, page, limit]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getDataHandlerWithToken("CallLog", buildQueryParams(), null);
      if (res?.data) {
        setLogs(res.data);
        setTotalLogs(res.total);
        setTotalPages(res.totalPages);
        if (res.stats) setStats(res.stats);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch logs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddManual = async () => {
    try {
      setAddingManual(true);
      if (!manualForm.leadId || !manualForm.outcome) {
        toast({ title: "Error", description: "Lead and outcome required", variant: "destructive" });
        return;
      }
      await postDataHandlerWithToken("createInteractionLog", {
        leadId: parseInt(manualForm.leadId),
        source: 'manual',
        outcome: manualForm.outcome,
        interactionAt: new Date(manualForm.interactionAt).toISOString(),
        ...(manualForm.stageId ? { stageId: manualForm.stageId } : {}),
      });
      toast({ title: "Success", description: "Manual log created" });
      setManualForm({ leadId: '', stageId: '', outcome: '', interactionAt: new Date().toISOString().slice(0, 16) });
      setLeadSearch('');
      setManualModalOpen(false);
      fetchLogs();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed", variant: "destructive" });
    } finally {
      setAddingManual(false);
    }
  };

  useEffect(() => {
    const searchLeads = async () => {
      if (!leadSearch.trim()) { setLeadOptions([]); return; }
      try {
        setSearchingLeads(true);
        const res = await getDataHandlerWithToken("getAllLeads", { page: 1, limit: 10, search: leadSearch }, null);
        if (res?.data) setLeadOptions(res.data);
      } catch (error) { setLeadOptions([]); } finally { setSearchingLeads(false); }
    };
    const timeout = setTimeout(searchLeads, 300);
    return () => clearTimeout(timeout);
  }, [leadSearch]);

  useEffect(() => {
    fetchLogs();
    fetchStages();
    fetchUsers();
    fetchLeads();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, limit, filters]);

  const fetchLeads = async () => {
    try {
      const res = await getDataHandlerWithToken("getAllLeads", { page: 1, limit: 1000 }, null);
      if (res?.data) setLeads(res.data);
    } catch (error) {}
  };

  const fetchStages = async () => {
    try {
      const res = await getDataHandlerWithToken("getAllStages", null, null);
      if (res) setStages(res);
    } catch (error) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await getDataHandlerWithToken("getAllUser", null, null);
      if (res) setUsers(res);
    } catch (error) {}
  };

  const fetchLeadHistory = async (leadId: number) => {
    try {
      const res = await getDataHandlerWithToken(ApiConfig.leadHistory(leadId.toString()), null, null, true);
      if (res) setLeadHistory(res);
      setLeadHistoryOpen(true);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch history", variant: "destructive" });
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds && seconds !== 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // const formatDate = (date: string) => {
  //   const d = new Date(date);
  //   return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  // };
 const formatDate = (
  dateString?: string | null,
  isLocalTime: boolean = false
) => {
  if (!dateString) return 'No Calls Yet';

  let date: Date;

  if (isLocalTime) {
    // Parse without timezone conversion
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = (timePart || '00:00')
      .split(':')
      .map(Number);

    date = new Date(year, month - 1, day, hour, minute);
  } else {
    // Converts UTC -> Local timezone
    date = new Date(dateString);
  }

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);

  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');

  const formattedHours = String(hours % 12 || 12).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  return `${day}-${month}-${year} ${formattedHours}:${minutes} ${ampm}`;
};

  const resetFilters = () => {
    setFilters({
      search: '', leadId: 'all', stageId: 'all', userId: 'all', dateFilter: 'today',
      fromDate: '', toDate: '', sort: 'new', answered: 'all', group: 'false', logType: 'all', viewType: 'all'
    });
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Call Activity</h1>
            <p className="text-slate-500 mt-1">Track and manage all call interactions</p>
          </div>
          <Button 
            onClick={() => setManualModalOpen(true)} 
            className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-5 py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Manual Log
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Calls</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalDials}</p>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <PhoneCall className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Answered</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.totalAnswered}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Talk Time</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{formatDuration(stats.totalTalkTime)}</p>
                </div>
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Manual Logs</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{stats.totalInteractions}</p>
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Mic className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Records</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalRecords}</p>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Group Toggle */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
            setFilters(prev => ({ ...prev, group: prev.group === 'true' ? 'false' : 'true' }));
            setPage(1);
          }}>
            <div className={`w-4 h-4 rounded border ${filters.group === 'true' ? 'bg-orange-600 border-orange-600' : 'border-slate-300'} flex items-center justify-center transition-all`}>
              {filters.group === 'true' && <div className="w-2 h-2 bg-white rounded-sm" />}
            </div>
            <span className="text-sm font-medium text-slate-700">Group</span>
          </div>
        </div>

        {/* Filters Header */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)} 
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
          </Button>
          <Button variant="ghost" onClick={resetFilters} className="text-slate-500 hover:text-slate-700 rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="p-5 bg-white border-0 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Search</Label>
                <div className="relative mt-1.5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Lead name, outcome..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} className="pl-9 rounded-xl border-slate-200" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Stage</Label>
                <Select value={filters.stageId} onValueChange={v => setFilters({ ...filters, stageId: v })}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="All Stages" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Stages</SelectItem>{stages.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Log Type</Label>
                <Select value={filters.logType} onValueChange={v => setFilters({ ...filters, logType: v })}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="All Logs" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Logs</SelectItem><SelectItem value="call">Call Logs</SelectItem><SelectItem value="manual">Manual Logs</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">View Type</Label>
                <Select value={filters.viewType} onValueChange={v => setFilters({ ...filters, viewType: v })}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="All Calls" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Calls</SelectItem><SelectItem value="uniq">Unique Calls</SelectItem></SelectContent>
                </Select>
              </div>
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Date</Label>
                <Select value={filters.dateFilter} onValueChange={v => setFilters({ ...filters, dateFilter: v })}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="week">This Week</SelectItem><SelectItem value="month">This Month</SelectItem><SelectItem value="custom">Custom Range</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Status</Label>
                <Select value={filters.answered} onValueChange={v => setFilters({ ...filters, answered: v })}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="true">Answered</SelectItem><SelectItem value="false">Not Answered</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Sort</Label>
                <Select value={filters.sort} onValueChange={v => setFilters({ ...filters, sort: v })}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Sort" /></SelectTrigger>
                  <SelectContent><SelectItem value="new">Newest First</SelectItem><SelectItem value="old">Oldest First</SelectItem></SelectContent>
                </Select>
              </div>
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Lead</Label>
                <SearchableDropdown
                  options={[{ value: 'all', label: 'All Leads' }, ...leads.map(l => ({ value: l.leadId.toString(), label: `${l.name} (#${l.leadId})` }))]}
                  value={filters.leadId} onValueChange={v => setFilters({ ...filters, leadId: v })}
                  placeholder="Select lead" className="mt-1.5"
                />
              </div>
              {filters.group === 'true' && (
                <div>
                  <Label className="text-xs font-semibold text-slate-500 uppercase">Employee</Label>
                  <SearchableDropdown
                    options={[{ value: 'all', label: 'All Users' }, ...users.filter(user => user.status == "active").map(u => ({ value: u._id, label: u.name }))]}
                    value={filters.userId} onValueChange={v => setFilters({ ...filters, userId: v })}
                    placeholder="Select user" className="mt-1.5"
                  />
                </div>
              )}
            </div>
            {filters.dateFilter === 'custom' && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Input type="date" placeholder="From" value={filters.fromDate} onChange={e => setFilters({ ...filters, fromDate: e.target.value })} className="rounded-xl" />
                <Input type="date" placeholder="To" value={filters.toDate} onChange={e => setFilters({ ...filters, toDate: e.target.value })} className="rounded-xl" />
              </div>
            )}
          </Card>
        )}

        {/* Table */}
        <Card className="bg-white border-0 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800">Call Records</h2>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} className="h-8 w-8 p-0 rounded-lg"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading} className="h-8 w-8 p-0 rounded-lg"><ChevronRight className="w-4 h-4" /></Button>
              </div>
              <Select value={limit.toString()} onValueChange={v => { setLimit(parseInt(v)); setPage(1); }}>
                <SelectTrigger className="w-20 h-8 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem><SelectItem value="100">100</SelectItem></SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-400" />
              <p className="mt-3 text-slate-500">Loading calls...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center">
              <Phone className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="mt-3 text-base font-medium text-slate-700">No calls found</h3>
              <p className="text-sm text-slate-400">Adjust filters or add a manual log</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-100">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Type</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Lead</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">User</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Duration</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Stage</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Outcome</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Date & Time</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">30d Calls</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow 
                      key={log._id} 
                      className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors"
                      onClick={() => {
                        if (log.logType === 'call') {
                          setSelectedLog(log);
                          setDetailsModalOpen(true);
                        }
                      }}
                    >
                      <TableCell className="py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${log.logType === 'call' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                          {log.logType === 'call' ? <Phone className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                          {log.logType === 'call' ? 'Call' : 'Manual'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-800 text-sm">#{log.leadId}</div>
                        <div className="text-xs text-slate-400">{log.leadName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-700">{log.userId?.name || 'Unknown'}</div>
                        {log.userId?.employeeId && <div className="text-xs text-slate-400">ID: {log.userId.employeeId}</div>}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-slate-600">{formatDuration(log.duration)}</span>
                      </TableCell>
                      <TableCell>
                        {log.logType === 'manual' ? (
                          <span className="text-xs text-purple-600">Manual Entry</span>
                        ) : log.answered ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle className="w-3 h-3" />Answered</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600"><XCircle className="w-3 h-3" />Missed</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">{log.stageId?.name || '—'}</span>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-sm text-slate-600 truncate">{log.outcome || '—'}</p>
                      </TableCell>
                     <TableCell className="whitespace-nowrap text-sm text-slate-600">
  {log.startedAt
    ? formatDate(log.startedAt, true)
    : formatDate(log.interactionAt || log.createdAt)}
</TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-slate-700">{log.callCount30Days || 0}</span>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); fetchLeadHistory(log.leadId); }} 
                          className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
                        >
                          <FileText className="w-4 h-4 text-slate-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
            <span>Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalLogs)} of {totalLogs}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} className="rounded-lg">Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading} className="rounded-lg">Next</Button>
            </div>
          </div>
        </Card>

        {/* Manual Log Modal */}
        <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
          <DialogContent className="rounded-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">Add Manual Call Log</DialogTitle>
              <DialogDescription>Record a manual call entry for a lead</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Lead *</Label>
                <Input 
                  value={leadSearch} 
                  onChange={e => { setLeadSearch(e.target.value); if (manualForm.leadId) setManualForm({ ...manualForm, leadId: '' }); }} 
                  placeholder="Search lead by name or ID..." 
                  className="mt-1.5 rounded-xl"
                />
                {leadSearch && (
                  <div className="mt-2 border rounded-xl max-h-48 overflow-auto">
                    {searchingLeads ? (
                      <div className="p-3 text-center text-sm text-slate-500">Searching...</div>
                    ) : leadOptions.length === 0 ? (
                      <div className="p-3 text-center text-sm text-slate-500">No leads found</div>
                    ) : (
                      leadOptions.map(lead => (
                        <button
                          key={lead._id}
                          className="w-full text-left p-3 hover:bg-slate-50 transition-colors border-b last:border-0"
                          onClick={() => {
                            setManualForm({ ...manualForm, leadId: lead.leadId.toString() });
                            setLeadSearch(`${lead.name} (#${lead.leadId})`);
                            setLeadOptions([]);
                          }}
                        >
                          <div className="font-medium text-sm">{lead.name}</div>
                          <div className="text-xs text-slate-400">#{lead.leadId} • {lead.phone}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Stage (Optional)</Label>
                <Select value={manualForm.stageId} onValueChange={v => setManualForm({ ...manualForm, stageId: v })}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Select stage" /></SelectTrigger>
                  <SelectContent><SelectItem value=" ">None</SelectItem>{stages.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Outcome / Notes *</Label>
                <Textarea rows={4} value={manualForm.outcome} onChange={e => setManualForm({ ...manualForm, outcome: e.target.value })} placeholder="Enter call outcome or notes..." className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label className="text-sm font-medium">Date & Time</Label>
                <Input type="datetime-local" value={manualForm.interactionAt} onChange={e => setManualForm({ ...manualForm, interactionAt: e.target.value })} className="mt-1.5 rounded-xl" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setManualModalOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleAddManual} disabled={addingManual || !manualForm.leadId || !manualForm.outcome} className="bg-orange-600 hover:bg-orange-700 rounded-xl">
                {addingManual ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Save Log
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Details Modal */}
        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent className="rounded-2xl max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Call Details</DialogTitle>
              <DialogDescription>Complete call information</DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-5">
                {selectedLog.recording_url && (
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm font-medium text-slate-700 mb-2">Recording</p>
                    <audio controls className="w-full rounded-lg"><source src={selectedLog.recording_url} /></audio>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-slate-500 uppercase font-semibold">Lead</p><p className="mt-1 font-medium text-slate-800">#{selectedLog.leadId} - {selectedLog.leadName}</p></div>
                  <div><p className="text-xs text-slate-500 uppercase font-semibold">User</p><p className="mt-1 text-slate-800">{selectedLog.userId?.name}</p></div>
                  <div><p className="text-xs text-slate-500 uppercase font-semibold">Duration</p><p className="mt-1 font-mono text-slate-800">{formatDuration(selectedLog.duration)}</p></div>
                  <div><p className="text-xs text-slate-500 uppercase font-semibold">Status</p><p className="mt-1">{selectedLog.answered ? <span className="text-emerald-600">Answered</span> : <span className="text-red-600">Not Answered</span>}</p></div>
                  <div><p className="text-xs text-slate-500 uppercase font-semibold">Stage</p><p className="mt-1 text-slate-800">{selectedLog.stageId?.name || '—'}</p></div>
                  <div><p className="text-xs text-slate-500 uppercase font-semibold">30 Day Calls</p><p className="mt-1 text-slate-800">{selectedLog.callCount30Days || 0}</p></div>
                </div>
                <div><p className="text-xs text-slate-500 uppercase font-semibold">Outcome</p><div className="mt-1 bg-slate-50 p-3 rounded-xl text-sm text-slate-700">{selectedLog.outcome || 'No outcome recorded'}</div></div>
              </div>
            )}
            <DialogFooter><Button onClick={() => setDetailsModalOpen(false)} className="rounded-xl">Close</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lead History Modal */}
        <LeadHistoryModal 
        open={leadHistoryOpen} 
        onOpenChange={setLeadHistoryOpen} 
        leadHistory={leadHistory} 
        loadingHistory={false} 
        onRefresh={() => {}} />
      </div>
    </div>
  );
}