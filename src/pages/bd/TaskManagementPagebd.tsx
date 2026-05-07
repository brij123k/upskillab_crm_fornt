import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Calendar } from '@/components/ui/calendar';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getDataHandlerWithToken, patchTokenDataHandler, postDataHandlerWithToken, putDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from 'sonner';
import { hasModulePermission } from '@/utils/modulePermissions';
import { hasPermission } from '@/utils/permissions';
import { useNavigate } from 'react-router-dom';
// Types
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

// Status configurations
const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Circle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', icon: X }
};

// Date filter options for due date
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

// Date filter options for created date
const CREATED_DATE_FILTERS = {
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

export function TaskManagementPagebd() {
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");
      const navigate = useNavigate();
  // Filters
  const [filters, setFilters] = useState({
    assignTo: 'all',
    assignedBy: 'all',
    status: 'all',
    reletedLeadId: '',
    // Due date filters
    dueDateFilter: 'all' as 'all' | 'today' | 'week' | 'month' | 'year' | 'custom',
    dueDateFrom: undefined as Date | undefined,
    dueDateTo: undefined as Date | undefined,
    // Created date filters
    createdDateFilter: 'all' as 'all' | 'today' | 'week' | 'month' | 'year' | 'custom',
    createdDateFrom: undefined as Date | undefined,
    createdDateTo: undefined as Date | undefined,
    page: 1,
    limit: 10
  });
  
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });
  
  // Form state
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    assignTo: '',
    dueDate: undefined,
    reletedLeadIds: []
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await getDataHandlerWithToken(ApiConfig.getAllProfile, null, null, true);
      if (response && Array.isArray(response)) {
        setUsers(response);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    }
  };

  // Fetch leads (for dropdown)
  const fetchLeads = async () => {
    try {
      setLoadingLeads(true);
      const response = await getDataHandlerWithToken(ApiConfig.getLeads, null, null, true);
      if (response && Array.isArray(response)) {
        setLeads(response);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoadingLeads(false);
    }
  };

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const queryParams: any = {};
      
      if (filters.assignTo !== 'all') queryParams.assignTo = filters.assignTo;
      if (filters.assignedBy !== 'all') queryParams.assignedBy = filters.assignedBy;
      if (filters.status !== 'all') queryParams.status = filters.status;
      if (filters.reletedLeadId) queryParams.reletedLeadId = parseInt(filters.reletedLeadId);
      
      // Due date filters
      if (filters.dueDateFrom) queryParams.fromDate = format(filters.dueDateFrom, 'yyyy-MM-dd');
      if (filters.dueDateTo) queryParams.toDate = format(filters.dueDateTo, 'yyyy-MM-dd');
      
      // Created date filters
      if (filters.createdDateFrom) queryParams.createdFromDate = format(filters.createdDateFrom, 'yyyy-MM-dd');
      if (filters.createdDateTo) queryParams.createdToDate = format(filters.createdDateTo, 'yyyy-MM-dd');
      
      queryParams.page = filters.page;
      queryParams.limit = filters.limit;
      
      const response = await getDataHandlerWithToken(ApiConfig.getTasks, queryParams, null, true);
      if (response && response.data) {
        setTasks(response.data);
        setPagination(response.meta);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Handle due date filter change
  const handleDueDateFilterChange = (value: typeof filters.dueDateFilter) => {
    if (value === 'custom') {
      setFilters({ ...filters, dueDateFilter: value });
      return;
    }
    
    if (value !== 'all') {
      const range = DUE_DATE_FILTERS[value].getRange();
      // Set end of day for toDate
      const toDate = new Date(range.to);
      toDate.setHours(23, 59, 59, 999);
      
      setFilters({
        ...filters,
        dueDateFilter: value,
        dueDateFrom: range.from,
        dueDateTo: toDate
      });
    } else {
      setFilters({
        ...filters,
        dueDateFilter: value,
        dueDateFrom: undefined,
        dueDateTo: undefined
      });
    }
  };

  // Handle created date filter change
  const handleCreatedDateFilterChange = (value: typeof filters.createdDateFilter) => {
    if (value === 'custom') {
      setFilters({ ...filters, createdDateFilter: value });
      return;
    }
    
    if (value !== 'all') {
      const range = CREATED_DATE_FILTERS[value].getRange();
      // Set end of day for toDate
      const toDate = new Date(range.to);
      toDate.setHours(23, 59, 59, 999);
      
      setFilters({
        ...filters,
        createdDateFilter: value,
        createdDateFrom: range.from,
        createdDateTo: toDate
      });
    } else {
      setFilters({
        ...filters,
        createdDateFilter: value,
        createdDateFrom: undefined,
        createdDateTo: undefined
      });
    }
  };

  // Create task
  const handleCreateTask = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.assignTo) {
      toast.error('Please assign a user');
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        assignTo: formData.assignTo,
        dueDate: formData.dueDate ? format(formData.dueDate, 'yyyy-MM-dd') : undefined,
        reletedLeadIds: formData.reletedLeadIds
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

  // Update task status
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

  // View task details
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
    setFormData({
      title: '',
      description: '',
      assignTo: '',
      dueDate: undefined,
      reletedLeadIds: []
    });
  };

  const resetFilters = () => {
    setFilters({
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
      limit: 10
    });
  };

  useEffect(() => {
    fetchUsers();
    fetchLeads();
  }, []);

  useEffect(() => {
    if(hasModulePermission(permissions,'task')){
      fetchTasks();
    }
  }, [filters]);

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    const Icon = config?.icon || AlertCircle;
    return (
      <Badge className={cn("gap-1", config?.color)}>
        <Icon className="w-3 h-3" />
        {config?.label || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <ListTodo className="w-6 h-6" />
              Task Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create, assign, and track tasks
            </p>
          </div>
          {hasPermission(permissions, 'task', 'create') && (
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Task
          </Button>
          )}
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
                <RefreshCw className="w-3 h-3" />
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Assign To Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Assign To</Label>
                <Select
                  value={filters.assignTo}
                  onValueChange={(value) => setFilters({ ...filters, assignTo: value, page: 1 })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned By Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Assigned By</Label>
                <Select
                  value={filters.assignedBy}
                  onValueChange={(value) => setFilters({ ...filters, assignedBy: value, page: 1 })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lead Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Related Lead ID</Label>
                <Input
                  type="number"
                  placeholder="Enter lead ID"
                  value={filters.reletedLeadId}
                  onChange={(e) => setFilters({ ...filters, reletedLeadId: e.target.value, page: 1 })}
                />
              </div>

              {/* Due Date Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Due Date</Label>
                <Select
                  value={filters.dueDateFilter}
                  onValueChange={(value: any) => handleDueDateFilterChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All dates" />
                  </SelectTrigger>
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

              {/* Created Date Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Created Date</Label>
                <Select
                  value={filters.createdDateFilter}
                  onValueChange={(value: any) => handleCreatedDateFilterChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All dates" />
                  </SelectTrigger>
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

            {/* Custom Date Range for Due Date */}
            {filters.dueDateFilter === 'custom' && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Due Date From</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dueDateFrom ? format(filters.dueDateFrom, 'PPP') : 'Select from date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dueDateFrom}
                        onSelect={(date) => setFilters({ ...filters, dueDateFrom: date, page: 1 })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Due Date To</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dueDateTo ? format(filters.dueDateTo, 'PPP') : 'Select to date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dueDateTo}
                        onSelect={(date) => {
                          if (date) {
                            date.setHours(23, 59, 59, 999);
                          }
                          setFilters({ ...filters, dueDateTo: date, page: 1 });
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Custom Date Range for Created Date */}
            {filters.createdDateFilter === 'custom' && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Created Date From</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.createdDateFrom ? format(filters.createdDateFrom, 'PPP') : 'Select from date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.createdDateFrom}
                        onSelect={(date) => setFilters({ ...filters, createdDateFrom: date, page: 1 })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Created Date To</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.createdDateTo ? format(filters.createdDateTo, 'PPP') : 'Select to date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.createdDateTo}
                        onSelect={(date) => {
                          if (date) {
                            date.setHours(23, 59, 59, 999);
                          }
                          setFilters({ ...filters, createdDateTo: date, page: 1 });
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Tasks ({pagination.total})
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTasks()}
                  disabled={loading}
                >
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12">
                <ListTodo className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No tasks found</p>
                <Button
                  variant="link"
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-2"
                >
                  Create your first task
                </Button>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Related Leads</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewTask(task._id)}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {task.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {task.assignTo.name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm">{task.assignTo.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                          {formatDate(task.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <div className="cursor-pointer">
                              {getStatusBadge(task.status)}
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateStatus(task._id, 'pending'); }}>
                              <Clock className="mr-2 h-4 w-4" />
                              Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateStatus(task._id, 'in_progress'); }}>
                              <Circle className="mr-2 h-4 w-4" />
                              In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateStatus(task._id, 'completed'); }}>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                              Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateStatus(task._id, 'cancelled'); }}>
                              <X className="mr-2 h-4 w-4 text-red-600" />
                              Cancelled
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>
                        {task.reletedLeadIds && task.reletedLeadIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {task.reletedLeadIds.slice(0, 2).map((leadId) => (
                              <Badge key={leadId} variant="outline" className="text-xs">
                                #{leadId}
                              </Badge>
                            ))}
                            {task.reletedLeadIds.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{task.reletedLeadIds.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewTask(task._id)}>
                              View Details
                            </DropdownMenuItem>
                            {hasPermission(permissions, 'task', 'change_status') && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(task._id, 'completed')}
                              disabled={task.status === 'completed'}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Mark Completes
                            </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Task Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new task
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Enter task description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Assign To *</Label>
              <Select
                value={formData.assignTo}
                onValueChange={(value) => setFormData({ ...formData, assignTo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? format(formData.dueDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => setFormData({ ...formData, dueDate: date })}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Related Leads (Optional)</Label>
              <Select
                value={formData.reletedLeadIds[0]?.toString() || ''}
                onValueChange={(value) => {
                  if (value && !formData.reletedLeadIds.includes(parseInt(value))) {
                    setFormData({
                      ...formData,
                      reletedLeadIds: [...formData.reletedLeadIds, parseInt(value)]
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add lead IDs" />
                </SelectTrigger>
                <SelectContent>
                  {leads.slice(0, 50).map((lead) => (
                    <SelectItem key={lead.leadId} value={lead.leadId.toString()}>
                      #{lead.leadId} - {lead.name} ({lead.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {formData.reletedLeadIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.reletedLeadIds.map((leadId) => (
                    <Badge key={leadId} variant="secondary" className="gap-1">
                      #{leadId}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-destructive"
                        onClick={() => setFormData({
                          ...formData,
                          reletedLeadIds: formData.reletedLeadIds.filter(id => id !== leadId)
                        })}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Task Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-2xl">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedTask.title}
                </DialogTitle>
                <DialogDescription>
                  Created on {formatDate(selectedTask.createdAt)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(selectedTask.status)}
                </div>

                {/* Description */}
                {selectedTask.description && (
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{selectedTask.description}</p>
                    </div>
                  </div>
                )}

                {/* Assignee */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Assigned To</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedTask.assignTo.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedTask.assignTo.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Assigned By</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedTask.assignedBy.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedTask.assignedBy.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Due Date */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Due Date</Label>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(selectedTask.dueDate)}</span>
                  </div>
                </div>

                {/* Created Date */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Created Date</Label>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(selectedTask.createdAt)}</span>
                  </div>
                </div>

                {/* Related Leads */}
                {selectedTask.reletedLeadIds && selectedTask.reletedLeadIds.length > 0 && (
                  <div className="space-y-2">
                    <Label>Related Leads</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.reletedLeadIds.map((leadId) => (
                        <Badge key={leadId} variant="secondary" className="text-sm">
                          Lead #{leadId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewModalOpen(false)}>
                  Close
                </Button>
                {selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled' && (
                  <Button
                    onClick={() => {
                      handleUpdateStatus(selectedTask._id, 'completed');
                      setViewModalOpen(false);
                    }}
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
  );
}