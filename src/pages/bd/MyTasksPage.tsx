import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Loader2,
  ListTodo,
  RefreshCw,
  User,
  Calendar as CalendarIcon,
  X,
  ChevronDown,
  Menu,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getDataHandlerWithToken, patchTokenDataHandler } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FormattedText } from '@/components/editor/FormattedText';

type UserRef = {
  _id: string;
  name: string;
  email: string;
  employeeId: number;
};

type Task = {
  _id: string;
  title: string;
  description: string;
  assignTo: UserRef;
  assignedBy: UserRef;
  dueDate: string;
  reletedLeadIds: number[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Circle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
} as const;

const STATUS_ORDER: Task['status'][] = ['pending', 'in_progress', 'completed', 'cancelled'];

export function MyTasksPage() {
  const navigate = useNavigate();
  const { taskId } = useParams<{ taskId?: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const fetchTasks = async (showSpinner = false) => {
    try {
      if (showSpinner) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const query: any = {};
      if (statusFilter !== 'all') query.status = statusFilter;

      const response = await getDataHandlerWithToken(ApiConfig.getMyTasks, query, null, true);
      setTasks(response?.data || []);
    } catch (error) {
      console.error('Failed to load my tasks:', error);
      toast.error('Failed to load your tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  useEffect(() => {
    if (!taskId || !tasks.length) return;
    const matched = tasks.find((task) => task._id === taskId);
    if (matched) {
      setSelectedTask(matched);
      setDetailOpen(true);
      return;
    }

    const loadTask = async () => {
      try {
        const response = await getDataHandlerWithToken(ApiConfig.getMyTaskById(taskId), null, null, true);
        const task = response?.data || response;
        if (task) {
          setSelectedTask(task);
          setDetailOpen(true);
        }
      } catch (error) {
        console.error('Failed to load task details:', error);
        toast.error('Failed to load task details');
      }
    };

    loadTask();
  }, [taskId, tasks]);

  const stats = useMemo(() => {
    const counts = tasks.reduce(
      (acc, task) => {
        acc[task.status] += 1;
        return acc;
      },
      { pending: 0, in_progress: 0, completed: 0, cancelled: 0 } as Record<Task['status'], number>,
    );

    return [
      { label: 'Total tasks', value: tasks.length, tone: 'text-foreground', icon: ListTodo },
      { label: 'Pending', value: counts.pending, tone: 'text-yellow-700', icon: Clock },
      { label: 'In progress', value: counts.in_progress, tone: 'text-blue-700', icon: Circle },
      { label: 'Completed', value: counts.completed, tone: 'text-green-700', icon: CheckCircle2 },
    ];
  }, [tasks]);

  const getStatusBadge = (status: Task['status']) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    return (
      <Badge className={cn('gap-1 px-2 py-1 text-xs font-medium', config.color)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const updateStatus = async (taskId: string, status: Task['status']) => {
    try {
      setUpdatingTaskId(taskId);
      await patchTokenDataHandler(ApiConfig.updateMyTaskStatus(taskId), { status }, true);
      toast.success('Task status updated');
      await fetchTasks();
      if (selectedTask?._id === taskId) {
        const updated = tasks.find((task) => task._id === taskId);
        if (updated) {
          setSelectedTask({ ...updated, status });
        }
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const openTask = (task: Task) => {
    setSelectedTask(task);
    setDetailOpen(true);
    navigate(`/bd/my-tasks/${task._id}`, { replace: true });
  };

  const closeModal = () => {
    setDetailOpen(false);
    navigate('/bd/my-tasks', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6 md:space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              My Tasks
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tasks assigned to you by your senior or manager.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => fetchTasks(true)} 
            disabled={refreshing} 
            className="gap-2 w-full sm:w-auto shadow-sm hover:shadow transition-all"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {stats.map((item) => (
            <Card 
              key={item.label} 
              className="border-border/60 shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">{item.label}</p>
                  <item.icon className={cn('h-4 w-4 sm:h-5 sm:w-5 opacity-60 group-hover:opacity-100 transition-opacity', item.tone)} />
                </div>
                <div className={cn('mt-2 text-2xl sm:text-3xl font-bold tracking-tight', item.tone)}>
                  {item.value.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Task Feed Section */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-3 sm:space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <ListTodo className="h-5 w-5 text-primary" />
                  Task Feed
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Open a task to see the full details and mark it complete.
                </CardDescription>
              </div>
              {/* Desktop Filter */}
              <div className="hidden sm:block w-full max-w-xs">
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="shadow-sm">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <SelectValue placeholder="Filter by status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {STATUS_ORDER.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_CONFIG[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Mobile Filter Button */}
              <Button
                variant="outline"
                className="sm:hidden w-full gap-2"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              >
                <Filter className="h-4 w-4" />
                Filter Tasks
                <ChevronDown className={cn('h-4 w-4 transition-transform', mobileFilterOpen && 'rotate-180')} />
              </Button>
            </div>
            {/* Mobile Filter Dropdown */}
            {mobileFilterOpen && (
              <div className="sm:hidden pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all');
                      setMobileFilterOpen(false);
                    }}
                    className="w-full"
                  >
                    All Statuses
                  </Button>
                  {STATUS_ORDER.map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setStatusFilter(status);
                        setMobileFilterOpen(false);
                      }}
                      className="w-full justify-start gap-2"
                    >
                      {STATUS_CONFIG[status].label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex min-h-[300px] sm:min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">Loading your tasks...</p>
                </div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex min-h-[300px] sm:min-h-[400px] items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 p-8 text-center">
                <div className="max-w-sm">
                  <ListTodo className="mx-auto h-12 w-12 sm:h-14 sm:w-14 text-muted-foreground/40" />
                  <h3 className="mt-4 text-base sm:text-lg font-semibold">No tasks assigned</h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                    When your senior assigns tasks, they will show up here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {tasks.map((task) => (
                  <button
                    key={task._id}
                    type="button"
                    onClick={() => openTask(task)}
                    className="group relative rounded-xl border bg-card p-4 sm:p-5 text-left shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {getStatusBadge(task.status)}
                        {task.dueDate && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <CalendarIcon className="h-3 w-3" />
                            {format(new Date(task.dueDate), 'MMM dd')}
                          </Badge>
                        )}
                      </div>
                      <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {task.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-xs sm:text-sm text-muted-foreground">
                        {task.description?.substring(0, 100) || 'No description provided'}
                        {task.description?.length > 100 && '...'}
                      </p>
                      <div className="mt-3 sm:mt-4 flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">Assigned by {task.assignedBy?.name || 'Unknown'}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scrollable Modal Dialog */}
        <Dialog open={detailOpen} onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] p-0 gap-0 rounded-xl sm:rounded-2xl overflow-hidden">
            {selectedTask && (
              <div className="flex flex-col h-full max-h-[90vh]">
                {/* Modal Header - Sticky */}
                <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 sm:px-6 sm:py-4 flex items-start justify-between">
                  <DialogHeader className="flex-1 pr-4">
                    <DialogTitle className="flex items-start gap-2 text-lg sm:text-xl md:text-2xl">
                      <ListTodo className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="break-words line-clamp-2">{selectedTask.title}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm mt-1">
                      Assigned by {selectedTask.assignedBy?.name || 'Unknown'} on {format(new Date(selectedTask.createdAt), 'MMM dd, yyyy hh:mm a')}
                    </DialogDescription>
                  </DialogHeader>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-full"
                    onClick={closeModal}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Modal Content - Scrollable Area */}
                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6 scrollbar-thin">
                  {/* Description */}
                  <div className="rounded-xl border bg-muted/20 p-3 sm:p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Description
                    </h4>
                    <FormattedText 
                      text={selectedTask.description || 'No description provided'} 
                      className="text-sm break-words leading-relaxed" 
                    />
                  </div>

                  {/* Assigned Info Grid */}
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    <div className="rounded-xl border p-3 sm:p-4 bg-card">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> Assigned To
                      </p>
                      <p className="mt-2 text-sm font-medium break-words">{selectedTask.assignTo?.name || 'You'}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground break-words">{selectedTask.assignTo?.email || ''}</p>
                    </div>
                    <div className="rounded-xl border p-3 sm:p-4 bg-card">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> Assigned By
                      </p>
                      <p className="mt-2 text-sm font-medium break-words">{selectedTask.assignedBy?.name || 'Unknown'}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground break-words">{selectedTask.assignedBy?.email || ''}</p>
                    </div>
                  </div>

                  {/* Status & Due Date */}
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                    <div className="rounded-xl border p-3 sm:p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Status</p>
                      <div className="mt-2">{getStatusBadge(selectedTask.status)}</div>
                    </div>
                    <div className="rounded-xl border p-3 sm:p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" /> Due Date
                      </p>
                      <p className="mt-2 text-sm font-medium break-words">
                        {selectedTask.dueDate ? format(new Date(selectedTask.dueDate), 'MMM dd, yyyy') : 'No due date set'}
                      </p>
                    </div>
                  </div>

                  {/* Change Status Section */}
                  <div className="rounded-xl border p-3 sm:p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Change Status
                    </p>
                    <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                      {STATUS_ORDER.map((status) => (
                        <Button
                          key={status}
                          variant={selectedTask.status === status ? 'default' : 'outline'}
                          disabled={updatingTaskId === selectedTask._id}
                          onClick={() => updateStatus(selectedTask._id, status)}
                          className="justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm h-auto py-2 px-2 sm:px-3"
                        >
                          {status === 'pending' && <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                          {status === 'in_progress' && <Circle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                          {status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                          {status === 'cancelled' && <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                          <span className="hidden xs:inline">{STATUS_CONFIG[status].label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal Footer - Sticky */}
                <DialogFooter className="sticky bottom-0 z-10 bg-background border-t px-4 py-3 sm:px-6 sm:py-4 flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={closeModal} className="w-full sm:w-auto order-2 sm:order-1">
                    Close
                  </Button>
                  {selectedTask.status !== 'completed' && (
                    <Button
                      onClick={() => updateStatus(selectedTask._id, 'completed')}
                      disabled={updatingTaskId === selectedTask._id}
                      className="w-full sm:w-auto gap-2 order-1 sm:order-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark Complete
                    </Button>
                  )}
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}