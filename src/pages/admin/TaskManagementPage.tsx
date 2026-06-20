import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Plus,
  MoreHorizontal,
  Calendar as CalendarIcon,
  Filter,
  X,
  RefreshCw,
  Loader2,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  User,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  Search,
  Activity,
  BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  getDataHandlerWithToken,
  patchTokenDataHandler,
  postDataHandlerWithToken,
} from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from 'sonner';

// Types (unchanged)
interface User {
  _id: string;
  name: string;
  email: string;
  employeeId: number;
}

interface Lead {
  leadId: number;
  name: string;
  phone: string;
  email?: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  assignTo: User;
  assignedBy: User;
  dueDate: string;
  reletedLeadIds: number[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

interface TaskFormData {
  title: string;
  description: string;
  assignTo: string;
  dueDate: Date | undefined;
  reletedLeadIds: number[];
}

// Status config (unchanged)
const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Circle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', icon: X },
};

// Date filter presets (unchanged)
const DUE_DATE_FILTERS = {
  today: { label: 'Today', getRange: () => ({ from: new Date(), to: new Date() }) },
  week: { label: 'This Week', getRange: () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    const end = new Date(now);
    end.setDate(now.getDate() + (6 - now.getDay()));
    return { from: start, to: end };
  }},
  month: { label: 'This Month', getRange: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: start, to: end };
  }},
  year: { label: 'This Year', getRange: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    return { from: start, to: end };
  }}
};

const CREATED_DATE_FILTERS = { ...DUE_DATE_FILTERS }; // same structure

// Stats interface for summary cards (if API provides)
interface StatsType {
  totalTasks: number;
  completed: number;
  inProgress: number;
  pending: number;
}

export function TaskManagementPage() {
  // ---------- State (original logic preserved) ----------
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsType | null>(null); // optional stats

  // Filters
  const [filters, setFilters] = useState({
    search: '', // added search field for UI consistency
    assignTo: 'all',
    assignedBy: 'all',
    status: 'all',
    reletedLeadId: '',
    dueDateFilter: 'all' as 'all' | 'today' | 'week' | 'month' | 'year' | 'custom',
    dueDateFrom: undefined as Date | undefined,
    dueDateTo: undefined as Date | undefined,
    createdDateFilter: 'all' as 'all' | 'today' | 'week' | 'month' | 'year' | 'custom',
    createdDateFrom: undefined as Date | undefined,
    createdDateTo: undefined as Date | undefined,
    page: 1,
    limit: 10,
  });
  const [showFilters, setShowFilters] = useState(true); // toggle visibility

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Form state
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    assignTo: '',
    dueDate: undefined,
    reletedLeadIds: [],
  });
  const [submitting, setSubmitting] = useState(false);

  // ---------- Data Fetching (original) ----------
  const fetchUsers = async () => {
    try {
      const response = await getDataHandlerWithToken(ApiConfig.getAllProfile, null, null, true);
      if (response && Array.isArray(response)) setUsers(response);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    }
  };

  const fetchLeads = async () => {
    try {
      setLoadingLeads(true);
      const response = await getDataHandlerWithToken(ApiConfig.getLeads, null, null, true);
      if (response && Array.isArray(response)) setLeads(response);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoadingLeads(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const queryParams: any = {};

      if (filters.search) queryParams.search = filters.search;
      if (filters.assignTo !== 'all') queryParams.assignTo = filters.assignTo;
      if (filters.assignedBy !== 'all') queryParams.assignedBy = filters.assignedBy;
      if (filters.status !== 'all') queryParams.status = filters.status;
      if (filters.reletedLeadId) queryParams.reletedLeadId = parseInt(filters.reletedLeadId);

      if (filters.dueDateFrom) queryParams.fromDate = format(filters.dueDateFrom, 'yyyy-MM-dd');
      if (filters.dueDateTo) queryParams.toDate = format(filters.dueDateTo, 'yyyy-MM-dd');

      if (filters.createdDateFrom) queryParams.createdFromDate = format(filters.createdDateFrom, 'yyyy-MM-dd');
      if (filters.createdDateTo) queryParams.createdToDate = format(filters.createdDateTo, 'yyyy-MM-dd');

      queryParams.page = filters.page;
      queryParams.limit = filters.limit;

      const response = await getDataHandlerWithToken(ApiConfig.getTasks, queryParams, null, true);
      if (response && response.data) {
        setTasks(response.data);
        setPagination(response.meta);
        if (response.stats) setStats(response.stats);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Due date filter handler (unchanged)
  const handleDueDateFilterChange = (value: typeof filters.dueDateFilter) => {
    if (value === 'custom') {
      setFilters({ ...filters, dueDateFilter: value });
      return;
    }
    if (value !== 'all') {
      const range = DUE_DATE_FILTERS[value].getRange();
      const toDate = new Date(range.to);
      toDate.setHours(23, 59, 59, 999);
      setFilters({ ...filters, dueDateFilter: value, dueDateFrom: range.from, dueDateTo: toDate });
    } else {
      setFilters({ ...filters, dueDateFilter: value, dueDateFrom: undefined, dueDateTo: undefined });
    }
  };

  // Created date filter handler (unchanged)
  const handleCreatedDateFilterChange = (value: typeof filters.createdDateFilter) => {
    if (value === 'custom') {
      setFilters({ ...filters, createdDateFilter: value });
      return;
    }
    if (value !== 'all') {
      const range = CREATED_DATE_FILTERS[value].getRange();
      const toDate = new Date(range.to);
      toDate.setHours(23, 59, 59, 999);
      setFilters({ ...filters, createdDateFilter: value, createdDateFrom: range.from, createdDateTo: toDate });
    } else {
      setFilters({ ...filters, createdDateFilter: value, createdDateFrom: undefined, createdDateTo: undefined });
    }
  };

  // Create task (unchanged)
  const handleCreateTask = async () => {
    if (!formData.title.trim()) { toast.error('Title is required'); return; }
    if (!formData.assignTo) { toast.error('Please assign a user'); return; }
    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        assignTo: formData.assignTo,
        dueDate: formData.dueDate ? format(formData.dueDate, 'yyyy-MM-dd') : undefined,
        reletedLeadIds: formData.reletedLeadIds,
      };
      await postDataHandlerWithToken(ApiConfig.createTask, payload, true);
      toast.success('Task created successfully');
      setCreateModalOpen(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  // Update status (unchanged)
  const handleUpdateStatus = async (taskId: string, status: string) => {
    setUpdatingStatus(taskId);
    try {
      await patchTokenDataHandler(ApiConfig.updateTaskStatus(taskId), { status }, true);
      toast.success('Task status updated');
      fetchTasks();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // View task details (unchanged)
  const handleViewTask = async (taskId: string) => {
    try {
      const response = await getDataHandlerWithToken(ApiConfig.getTaskById(taskId), null, null, true);
      if (response) {
        setSelectedTask(response);
        setViewModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch task details:', error);
      toast.error('Failed to load task details');
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', assignTo: '', dueDate: undefined, reletedLeadIds: [] });
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      assignTo: 'all',
      assignedBy: 'all',
      status: 'all',
      reletedLeadId: '',
      dueDateFilter: 'all',
      dueDateFrom: undefined,
      dueDateTo: undefined,
      createdDateFilter: 'all',
      createdDateFrom: undefined,
      createdDateTo: undefined,
      page: 1,
      limit: 10,
    });
  };

  useEffect(() => {
    fetchUsers();
    fetchLeads();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  // Status badge (unchanged)
  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    const Icon = config?.icon || AlertCircle;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg ${config?.color}`}>
        <Icon className="w-3 h-3" />
        {config?.label || status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Task Management
            </h1>
            <p className="text-slate-500 mt-1">Create, assign, and track tasks</p>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-5 py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        </div>

        {/* Stats Cards (if API provides stats) */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Tasks</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalTasks}</p>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <ListTodo className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Completed</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">In Progress</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{stats.inProgress}</p>
                </div>
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
                </div>
                <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filter Toggle & Reset */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
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
              {/* Search */}
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Search</Label>
                <div className="relative mt-1.5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search tasks..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                    className="pl-9 rounded-xl border-slate-200"
                  />
                </div>
              </div>

              {/* Assign To */}
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Assign To</Label>
                <Select
                  value={filters.assignTo}
                  onValueChange={(value) => setFilters({ ...filters, assignTo: value, page: 1 })}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="All users" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="All statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Due Date</Label>
                <Select
                  value={filters.dueDateFilter}
                  onValueChange={handleDueDateFilterChange}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="All dates" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {/* Assigned By */}
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Assigned By</Label>
                <Select
                  value={filters.assignedBy}
                  onValueChange={(value) => setFilters({ ...filters, assignedBy: value, page: 1 })}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="All users" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Created Date */}
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Created Date</Label>
                <Select
                  value={filters.createdDateFilter}
                  onValueChange={handleCreatedDateFilterChange}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="All dates" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Related Lead ID */}
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Lead ID</Label>
                <Input
                  type="number"
                  placeholder="Enter lead ID"
                  value={filters.reletedLeadId}
                  onChange={(e) => setFilters({ ...filters, reletedLeadId: e.target.value, page: 1 })}
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
            </div>

            {/* Custom date pickers for Due Date */}
            {filters.dueDateFilter === 'custom' && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-500 uppercase">Due From</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="mt-1.5 rounded-xl w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dueDateFrom ? format(filters.dueDateFrom, 'PPP') : 'Select from date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dueDateFrom}
                        onSelect={(date) => setFilters({ ...filters, dueDateFrom: date, page: 1 })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-500 uppercase">Due To</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="mt-1.5 rounded-xl w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dueDateTo ? format(filters.dueDateTo, 'PPP') : 'Select to date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={filters.dueDateTo}
                        onSelect={(date) => {
                          if (date) date.setHours(23, 59, 59, 999);
                          setFilters({ ...filters, dueDateTo: date, page: 1 });
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Custom date pickers for Created Date */}
            {filters.createdDateFilter === 'custom' && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-500 uppercase">Created From</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="mt-1.5 rounded-xl w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.createdDateFrom ? format(filters.createdDateFrom, 'PPP') : 'Select from date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={filters.createdDateFrom}
                        onSelect={(date) => setFilters({ ...filters, createdDateFrom: date, page: 1 })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-500 uppercase">Created To</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="mt-1.5 rounded-xl w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.createdDateTo ? format(filters.createdDateTo, 'PPP') : 'Select to date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={filters.createdDateTo}
                        onSelect={(date) => {
                          if (date) date.setHours(23, 59, 59, 999);
                          setFilters({ ...filters, createdDateTo: date, page: 1 });
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Tasks Table */}
        <Card className="bg-white border-0 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800">Task Records</h2>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ ...filters, page: Math.max(1, pagination.page - 1) })}
                  disabled={pagination.page === 1 || loading}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ ...filters, page: Math.min(pagination.totalPages, pagination.page + 1) })}
                  disabled={pagination.page === pagination.totalPages || loading}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Select
                value={filters.limit.toString()}
                onValueChange={(v) => { setFilters({ ...filters, limit: parseInt(v), page: 1 }); }}
              >
                <SelectTrigger className="w-20 h-8 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-400" />
              <p className="mt-3 text-slate-500">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-16 text-center">
              <ListTodo className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="mt-3 text-base font-medium text-slate-700">No tasks found</h3>
              <p className="text-sm text-slate-400">Adjust filters or create a new task</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 border-b border-slate-100">
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Title</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Assigned To</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Due Date</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Related Leads</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow
                        key={task._id}
                        className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors"
                        onClick={() => handleViewTask(task._id)}
                      >
                        <TableCell>
                          <div className="font-medium text-slate-800 text-sm">{task.title}</div>
                          {task.description && (
                            <div className="text-xs text-slate-400 line-clamp-1">{task.description}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-slate-700">{task.assignTo.name}</div>
                          <div className="text-xs text-slate-400">{task.assignTo.email}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-slate-600">
                          {formatDate(task.dueDate)}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div className="cursor-pointer">{getStatusBadge(task.status)}</div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(task._id, 'pending')}>
                                <Clock className="mr-2 h-4 w-4" /> Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(task._id, 'in_progress')}>
                                <Circle className="mr-2 h-4 w-4" /> In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(task._id, 'completed')}>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(task._id, 'cancelled')}>
                                <X className="mr-2 h-4 w-4 text-red-600" /> Cancelled
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          {task.reletedLeadIds?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {task.reletedLeadIds.slice(0, 2).map((leadId) => (
                                <span key={leadId} className="inline-flex items-center text-xs text-slate-600">
                                  #{leadId}
                                </span>
                              ))}
                              {task.reletedLeadIds.length > 2 && (
                                <span className="text-xs text-slate-400">+{task.reletedLeadIds.length - 2}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100">
                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
                <span>
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setFilters({ ...filters, page: pagination.page - 1 })} disabled={pagination.page === 1} className="rounded-lg">Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setFilters({ ...filters, page: pagination.page + 1 })} disabled={pagination.page === pagination.totalPages} className="rounded-lg">Next</Button>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Create Task Modal */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="rounded-2xl max-w-lg max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <DialogHeader>
              <DialogTitle className="text-xl">Create New Task</DialogTitle>
              <DialogDescription>Fill in the details to create a new task</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Title *</Label>
                <Input
                  placeholder="Enter task title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Description</Label>
                <Textarea
                  placeholder="Enter task description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Assign To *</Label>
                <Select
                  value={formData.assignTo}
                  onValueChange={(value) => setFormData({ ...formData, assignTo: value })}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="mt-1.5 rounded-xl w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dueDate ? format(formData.dueDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={formData.dueDate}
                      onSelect={(date) => setFormData({ ...formData, dueDate: date })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Related Leads (Optional)</Label>
                <Select
                  value={formData.reletedLeadIds[0]?.toString() || ''}
                  onValueChange={(value) => {
                    if (value && !formData.reletedLeadIds.includes(parseInt(value))) {
                      setFormData({
                        ...formData,
                        reletedLeadIds: [...formData.reletedLeadIds, parseInt(value)],
                      });
                    }
                  }}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue placeholder="Add lead IDs" /></SelectTrigger>
                  <SelectContent>
                    {leads.slice(0, 50).map((lead) => (
                      <SelectItem key={lead.leadId} value={lead.leadId.toString()}>
                        #{lead.leadId} - {lead.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.reletedLeadIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.reletedLeadIds.map((leadId) => (
                      <span key={leadId} className="inline-flex items-center gap-1 text-xs bg-slate-100 rounded-full px-2 py-1">
                        #{leadId}
                        <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => {
                          setFormData({ ...formData, reletedLeadIds: formData.reletedLeadIds.filter(id => id !== leadId) });
                        }} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setCreateModalOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleCreateTask} disabled={submitting} className="bg-orange-600 hover:bg-orange-700 rounded-xl">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Task Modal */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="rounded-2xl max-w-2xl max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {selectedTask && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl">{selectedTask.title}</DialogTitle>
                  <DialogDescription>Created on {formatDate(selectedTask.createdAt)}</DialogDescription>
                </DialogHeader>
                <div className="space-y-5 py-2">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedTask.status)}</div>
                  </div>
                  {selectedTask.description && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Description</p>
                      <div className="bg-slate-50 rounded-xl p-3 mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                        {selectedTask.description}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Assigned To</p>
                      <p className="text-sm text-slate-800 mt-1">{selectedTask.assignTo.name}</p>
                      <p className="text-xs text-slate-400">{selectedTask.assignTo.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Assigned By</p>
                      <p className="text-sm text-slate-800 mt-1">{selectedTask.assignedBy.name}</p>
                      <p className="text-xs text-slate-400">{selectedTask.assignedBy.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Due Date</p>
                      <p className="text-sm text-slate-800 mt-1">{formatDate(selectedTask.dueDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Created Date</p>
                      <p className="text-sm text-slate-800 mt-1">{formatDate(selectedTask.createdAt)}</p>
                    </div>
                  </div>
                  {selectedTask.reletedLeadIds?.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Related Leads</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedTask.reletedLeadIds.map((leadId) => (
                          <span key={leadId} className="text-sm text-slate-800">#{leadId}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter className="pt-4 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setViewModalOpen(false)} className="rounded-xl">Close</Button>
                  {selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled' && (
                    <Button
                      onClick={() => {
                        handleUpdateStatus(selectedTask._id, 'completed');
                        setViewModalOpen(false);
                      }}
                      className="bg-orange-600 hover:bg-orange-700 rounded-xl"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark Complete
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}