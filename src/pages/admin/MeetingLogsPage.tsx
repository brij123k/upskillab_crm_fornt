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
  Activity,
  Video,
  MessageCircle,
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

interface MeetingLogType {
  _id: string;
  leadId: number;
  userId: {
    _id: string;
    name: string;
    employeeId?: number;
  };
  meetingType: string;
  outcome: string;
  stageId?: {
    _id: string;
    name: string;
  };
  startedAt: string;
  duration: number;
  feedbacks?: Array<{
    _id: string;
    meetingId: string;
    userId: string;
    feedback: string;
    createdAt: string;
    updatedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface StatsType {
  totalMeetings: number;
  totalDuration: number;
  totalRecords: number;
}

interface Filters {
  search: string;
  leadId: string;
  stageId: string;
  userId: string;
  meetingType: string;
  outcome: string;
  dateFilter: string;
  fromDate: string;
  toDate: string;
  sort: string;
  status: string;
  group: string;
}

const MEETING_TYPES = [
  'Discovery Call',
  'Demo Meeting',
  'Follow-up',
  'Negotiation',
  'Closure',
  'Account Review',
  'Q&A Session',
  'Technical Discussion',
  'Strategy Meeting',
  'Partnership Discussion',
  'Other',
];

export function MeetingLogsPage() {
  const [logs, setLogs] = useState<MeetingLogType[]>([]);
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
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MeetingLogType | null>(null);
  const [leadHistoryOpen, setLeadHistoryOpen] = useState(false);
  const [leadHistory, setLeadHistory] = useState<any[]>([]);
  const [addingMeeting, setAddingMeeting] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadOptions, setLeadOptions] = useState<any[]>([]);
  const [searchingLeads, setSearchingLeads] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    search: '',
    leadId: 'all',
    stageId: 'all',
    userId: 'all',
    meetingType: 'all',
    outcome: '',
    dateFilter: 'all',
    fromDate: '',
    toDate: '',
    sort: 'new',
    status: 'all',
    group: 'false',
  });

  const [meetingForm, setMeetingForm] = useState({
    leadId: '',
    meetingType: '',
    outcome: '',
    stageId: '',
    startedAt: new Date().toISOString().slice(0, 16),
    duration: '',
  });

  const buildQueryParams = useCallback(() => {
    const params: any = { page, limit };
    if (filters.search) params.search = filters.search;
    if (filters.leadId !== 'all') params.leadId = filters.leadId;
    if (filters.stageId !== 'all') params.stageId = filters.stageId;
    if (filters.userId !== 'all') params.byUserId = filters.userId;
    if (filters.meetingType !== 'all') params.meetingType = filters.meetingType;
    if (filters.outcome) params.outcome = filters.outcome;
    if (filters.dateFilter !== 'all') params.dateFilter = filters.dateFilter;
    if (filters.fromDate) params.fromDate = filters.fromDate;
    if (filters.toDate) params.toDate = filters.toDate;
    if (filters.sort) params.sort = filters.sort;
    if (filters.status !== 'all') params.status = filters.status;
    if (filters.group === 'true') params.group = true;
    return params;
  }, [filters, page, limit]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getDataHandlerWithToken('getMeetingLog', buildQueryParams(), null);
      if (res?.data) {
        setLogs(res.data);
        setTotalLogs(res.total);
        setTotalPages(res.totalPages);
        if (res.stats) setStats(res.stats);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch meeting logs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeeting = async () => {
    try {
      setAddingMeeting(true);
      if (!meetingForm.leadId || !meetingForm.meetingType || !meetingForm.duration) {
        toast({ title: 'Error', description: 'Lead, meeting type, and duration are required', variant: 'destructive' });
        return;
      }
      await postDataHandlerWithToken('MeetingLog', {
        leadId: parseInt(meetingForm.leadId),
        meetingType: meetingForm.meetingType,
        outcome: meetingForm.outcome,
        startedAt: new Date(meetingForm.startedAt).toISOString(),
        duration: parseInt(meetingForm.duration),
        ...(meetingForm.stageId ? { stageId: meetingForm.stageId } : {}),
      });
      toast({ title: 'Success', description: 'Meeting log created' });
      setMeetingForm({
        leadId: '',
        meetingType: '',
        outcome: '',
        stageId: '',
        startedAt: new Date().toISOString().slice(0, 16),
        duration: '',
      });
      setLeadSearch('');
      setAddModalOpen(false);
      fetchLogs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed', variant: 'destructive' });
    } finally {
      setAddingMeeting(false);
    }
  };

  useEffect(() => {
    const searchLeads = async () => {
      if (!leadSearch.trim()) { setLeadOptions([]); return; }
      try {
        setSearchingLeads(true);
        const res = await getDataHandlerWithToken('getAllLeads', { page: 1, limit: 10, search: leadSearch }, null);
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
      const res = await getDataHandlerWithToken('getAllLeads', { page: 1, limit: 1000 }, null);
      if (res?.data) setLeads(res.data);
    } catch (error) {}
  };

  const fetchStages = async () => {
    try {
      const res = await getDataHandlerWithToken('getAllStages', null, null);
      if (res) setStages(res);
    } catch (error) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await getDataHandlerWithToken('getAllUser', null, null);
      if (res) setUsers(res);
    } catch (error) {}
  };

  const fetchLeadHistory = async (leadId: number) => {
    try {
      const res = await getDataHandlerWithToken(ApiConfig.leadHistory(leadId.toString()), null, null, true);
      if (res) setLeadHistory(res);
      setLeadHistoryOpen(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch history', variant: 'destructive' });
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds && seconds !== 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const resetFilters = () => {
    setFilters({
      search: '', leadId: 'all', stageId: 'all', userId: 'all', meetingType: 'all',
      outcome: '', dateFilter: 'all', fromDate: '', toDate: '', sort: 'new',
      status: 'all', group: 'false'
    });
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Meeting Activity</h1>
            <p className="text-slate-500 mt-1">Track and manage all meeting interactions</p>
          </div>
          <Button
            onClick={() => setAddModalOpen(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-5 py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Meeting Log
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Meetings</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalMeetings}</p>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Video className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Duration</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{formatDuration(stats.totalDuration)}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Avg Duration</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">
                    {stats.totalMeetings > 0 ? formatDuration(stats.totalDuration / stats.totalMeetings) : '--:--'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Today's Meetings</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">0</p>
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
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
                  <BarChart3 className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Group Toggle */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              setFilters(prev => ({ ...prev, group: prev.group === 'true' ? 'false' : 'true' }));
              setPage(1);
            }}
          >
            <div className={`w-4 h-4 rounded border ${filters.group === 'true' ? 'bg-orange-600 border-orange-600' : 'border-slate-300'} flex items-center justify-center transition-all`}>
              {filters.group === 'true' && <div className="w-2 h-2 bg-white rounded-sm" />}
            </div>
            <span className="text-sm font-medium text-slate-700">Group by User</span>
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
                <Label className="text-xs font-semibold text-slate-500 uppercase">Meeting Type</Label>
                <Select value={filters.meetingType} onValueChange={v => setFilters({ ...filters, meetingType: v })}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="All Types" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Types</SelectItem>{MEETING_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Date</Label>
                <Select value={filters.dateFilter} onValueChange={v => setFilters({ ...filters, dateFilter: v })}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Time</SelectItem><SelectItem value="today">Today</SelectItem><SelectItem value="week">This Week</SelectItem><SelectItem value="month">This Month</SelectItem><SelectItem value="custom">Custom Range</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Status</Label>
                <Select value={filters.status} onValueChange={v => setFilters({ ...filters, status: v })}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="scheduled">Scheduled</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Outcome</Label>
                <Input placeholder="Filter by outcome..." value={filters.outcome} onChange={e => setFilters({ ...filters, outcome: e.target.value })} className="mt-1.5 rounded-xl border-slate-200" />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Sort</Label>
                <Select value={filters.sort} onValueChange={v => setFilters({ ...filters, sort: v })}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Sort" /></SelectTrigger>
                  <SelectContent><SelectItem value="new">Newest First</SelectItem><SelectItem value="old">Oldest First</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Lead</Label>
                <SearchableDropdown
                  options={[{ value: 'all', label: 'All Leads' }, ...leads.map(l => ({ value: l.leadId.toString(), label: `${l.name} (#${l.leadId})` }))]}
                  value={filters.leadId}
                  onValueChange={v => setFilters({ ...filters, leadId: v })}
                  placeholder="Select lead"
                  className="mt-1.5"
                />
              </div>
              {filters.group === 'true' && (
                <div>
                  <Label className="text-xs font-semibold text-slate-500 uppercase">Employee</Label>
                  <SearchableDropdown
                    options={[{ value: 'all', label: 'All Users' }, ...users.map(u => ({ value: u._id, label: u.name }))]}
                    value={filters.userId}
                    onValueChange={v => setFilters({ ...filters, userId: v })}
                    placeholder="Select user"
                    className="mt-1.5"
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
            <h2 className="font-semibold text-slate-800">Meeting Records</h2>
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
              <p className="mt-3 text-slate-500">Loading meetings...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center">
              <Video className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="mt-3 text-base font-medium text-slate-700">No meetings found</h3>
              <p className="text-sm text-slate-400">Adjust filters or add a meeting log</p>
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
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">30d Meetings</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow
                      key={log._id}
                      className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedLog(log);
                        setDetailsModalOpen(true);
                      }}
                    >
                      <TableCell className="py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">
                          <Video className="w-3 h-3" />
                          Meeting
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-800 text-sm">#{log.leadId}</div>
                        <div className="text-xs text-slate-400">{leads.find(l => l.leadId === log.leadId)?.name || 'Unknown Lead'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-700">{log.userId?.name || 'Unknown'}</div>
                        {log.userId?.employeeId && <div className="text-xs text-slate-400">ID: {log.userId.employeeId}</div>}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-slate-600">{formatDuration(log.duration)}</span>
                      </TableCell>
                      <TableCell>
                        {log.outcome ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle className="w-3 h-3" />Completed</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600"><Clock className="w-3 h-3" />Scheduled</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">{log.stageId?.name || '—'}</span>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-sm text-slate-600 truncate">{log.outcome || '—'}</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-slate-600">
                        {formatDate(log.startedAt || log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-slate-700">0</span>
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

        {/* Add Meeting Modal */}
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="rounded-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">Add Meeting Log</DialogTitle>
              <DialogDescription>Record a new meeting activity for a lead</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Lead *</Label>
                <Input
                  value={leadSearch}
                  onChange={e => { setLeadSearch(e.target.value); if (meetingForm.leadId) setMeetingForm({ ...meetingForm, leadId: '' }); }}
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
                            setMeetingForm({ ...meetingForm, leadId: lead.leadId.toString() });
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
                <Label className="text-sm font-medium">Meeting Type *</Label>
                <Select value={meetingForm.meetingType} onValueChange={v => setMeetingForm({ ...meetingForm, meetingType: v })}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Select meeting type" /></SelectTrigger>
                  <SelectContent>{MEETING_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Duration (seconds) *</Label>
                <Input type="number" value={meetingForm.duration} onChange={e => setMeetingForm({ ...meetingForm, duration: e.target.value })} placeholder="300" className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label className="text-sm font-medium">Stage (Optional)</Label>
                <Select value={meetingForm.stageId} onValueChange={v => setMeetingForm({ ...meetingForm, stageId: v })}>
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Select stage" /></SelectTrigger>
                  <SelectContent><SelectItem value=" ">None</SelectItem>{stages.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Outcome / Notes</Label>
                <Textarea rows={4} value={meetingForm.outcome} onChange={e => setMeetingForm({ ...meetingForm, outcome: e.target.value })} placeholder="Enter meeting outcome or notes..." className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label className="text-sm font-medium">Date & Time</Label>
                <Input type="datetime-local" value={meetingForm.startedAt} onChange={e => setMeetingForm({ ...meetingForm, startedAt: e.target.value })} className="mt-1.5 rounded-xl" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddModalOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleAddMeeting} disabled={addingMeeting || !meetingForm.leadId || !meetingForm.meetingType || !meetingForm.duration} className="bg-orange-600 hover:bg-orange-700 rounded-xl">
                {addingMeeting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Save Log
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Details Modal */}
        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent className="rounded-2xl max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Meeting Details</DialogTitle>
              <DialogDescription>Complete meeting information</DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-slate-500 uppercase font-semibold">Lead</p><p className="mt-1 font-medium text-slate-800">#{selectedLog.leadId} - {leads.find(l => l.leadId === selectedLog.leadId)?.name || 'Unknown'}</p></div>
                  <div><p className="text-xs text-slate-500 uppercase font-semibold">User</p><p className="mt-1 text-slate-800">{selectedLog.userId?.name}</p></div>
                  <div><p className="text-xs text-slate-500 uppercase font-semibold">Duration</p><p className="mt-1 font-mono text-slate-800">{formatDuration(selectedLog.duration)}</p></div>
                  <div><p className="text-xs text-slate-500 uppercase font-semibold">Status</p><p className="mt-1">{selectedLog.outcome ? <span className="text-emerald-600">Completed</span> : <span className="text-amber-600">Scheduled</span>}</p></div>
                  <div><p className="text-xs text-slate-500 uppercase font-semibold">Stage</p><p className="mt-1 text-slate-800">{selectedLog.stageId?.name || '—'}</p></div>
                  <div><p className="text-xs text-slate-500 uppercase font-semibold">30 Day Meetings</p><p className="mt-1 text-slate-800">0</p></div>
                </div>
                <div><p className="text-xs text-slate-500 uppercase font-semibold">Outcome</p><div className="mt-1 bg-slate-50 p-3 rounded-xl text-sm text-slate-700">{selectedLog.outcome || 'No outcome recorded'}</div></div>
                {selectedLog.feedbacks && selectedLog.feedbacks.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Latest Feedback</p>
                    <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-700 whitespace-pre-wrap">
                      {selectedLog.feedbacks[0].feedback}
                    </div>
                  </div>
                )}
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
          onRefresh={() => {}}
        />
      </div>
    </div>
  );
}