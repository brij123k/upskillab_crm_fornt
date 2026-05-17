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
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { FormattedTextEditor } from '@/components/editor/FormattedTextEditor';
import { FormattedText } from '@/components/editor/FormattedText';
import {
  AlertTriangle,
  Plus,
  MoreHorizontal,
  Calendar as CalendarIcon,
  Filter,
  X,
  RefreshCw,
  Loader2,
  User,
  Clock,
  Eye,
  AlertCircle,
  CheckCircle2,
  Users,
  FileText,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getDataHandlerWithToken, postDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from 'sonner';

// Types
interface User {
  _id: string;
  name: string;
  email: string;
  employeeId: number;
}

interface Warning {
  _id: string;
  userId: User;
  type: string;
  notes: string;
  issuedBy: User;
  createdAt: string;
  updatedAt: string;
}

interface WarningFormData {
  userId: string;
  type: string;
  customType: string;
  notes: string;
}

// Predefined warning types
const PREDEFINED_WARNING_TYPES = [
  'Poor Performance',
  'Attendance Issues',
  'Late Coming',
  'Missing Deadlines',
  'Quality Issues',
  'Behavioral Issues',
  'Policy Violation',
  'Teamwork Issues',
  'Communication Issues',
  'Productivity Concerns'
];

// Date filter options
const DATE_FILTERS = {
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

export function PerformanceWarningPage() {
  // State
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedWarning, setSelectedWarning] = useState<Warning | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    userId: 'all' as string,
    issuedBy: 'all' as string,
    type: 'all' as string,
    dateFilter: 'all' as 'all' | 'today' | 'week' | 'month' | 'year' | 'custom',
    fromDate: undefined as Date | undefined,
    toDate: undefined as Date | undefined,
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
  const [formData, setFormData] = useState<WarningFormData>({
    userId: '',
    type: '',
    customType: '',
    notes: ''
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

  // Fetch warnings
  const fetchWarnings = async () => {
    try {
      setLoading(true);
      const queryParams: any = {};
      
      if (filters.userId !== 'all') queryParams.userId = filters.userId;
      if (filters.issuedBy !== 'all') queryParams.issuedBy = filters.issuedBy;
      if (filters.type !== 'all') queryParams.type = filters.type;
      if (filters.fromDate) queryParams.fromDate = format(filters.fromDate, 'yyyy-MM-dd');
      if (filters.toDate) queryParams.toDate = format(filters.toDate, 'yyyy-MM-dd');
      
      queryParams.page = filters.page;
      queryParams.limit = filters.limit;
      
      const response = await getDataHandlerWithToken(ApiConfig.getWarnings, queryParams, null, true);
      if (response && response.data) {
        setWarnings(response.data);
        setPagination(response.meta);
      }
    } catch (error) {
      console.error('Failed to fetch warnings:', error);
      toast.error('Failed to load warnings');
    } finally {
      setLoading(false);
    }
  };

  // Handle date filter change
  const handleDateFilterChange = (value: typeof filters.dateFilter) => {
    if (value === 'custom') {
      setFilters({ ...filters, dateFilter: value });
      return;
    }
    
    if (value !== 'all') {
      const range = DATE_FILTERS[value].getRange();
      // Set end of day for toDate
      const toDate = new Date(range.to);
      toDate.setHours(23, 59, 59, 999);
      
      setFilters({
        ...filters,
        dateFilter: value,
        fromDate: range.from,
        toDate: toDate
      });
    } else {
      setFilters({
        ...filters,
        dateFilter: value,
        fromDate: undefined,
        toDate: undefined
      });
    }
  };

  // Create warning
  const handleCreateWarning = async () => {
    if (!formData.userId) {
      toast.error('Please select an employee');
      return;
    }
    
    const warningType = formData.type === 'other' ? formData.customType : formData.type;
    if (!warningType) {
      toast.error('Please select or enter a warning type');
      return;
    }
    
    if (!formData.notes.trim()) {
      toast.error('Please provide notes for the warning');
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        userId: formData.userId,
        type: warningType,
        notes: formData.notes
      };
      
      await postDataHandlerWithToken(ApiConfig.createWarning, payload, true);
      toast.success('Performance warning issued successfully');
      setCreateModalOpen(false);
      resetForm();
      fetchWarnings();
    } catch (error) {
      console.error('Failed to create warning:', error);
      toast.error('Failed to issue warning');
    } finally {
      setSubmitting(false);
    }
  };

  // View warning details
  const handleViewWarning = async (warningId: string) => {
    try {
      const response = await getDataHandlerWithToken(ApiConfig.getWarningById(warningId), null, null, true);
      if (response) {
        setSelectedWarning(response);
        setViewModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch warning details:', error);
      toast.error('Failed to load warning details');
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      type: '',
      customType: '',
      notes: ''
    });
  };

  const resetFilters = () => {
    setFilters({
      userId: 'all',
      issuedBy: 'all',
      type: 'all',
      dateFilter: 'all',
      fromDate: undefined,
      toDate: undefined,
      page: 1,
      limit: 10
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchWarnings();
  }, [filters]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
  };

  const formatShortDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  // Get unique warning types for filter
  const warningTypes = useMemo(() => {
    const types = new Set<string>();
    warnings.forEach(warning => {
      types.add(warning.type);
    });
    return Array.from(types).sort();
  }, [warnings]);

  // Get color for warning type
  const getWarningColor = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('performance')) return 'bg-red-100 text-red-700';
    if (typeLower.includes('attendance')) return 'bg-orange-100 text-orange-700';
    if (typeLower.includes('late')) return 'bg-yellow-100 text-yellow-700';
    if (typeLower.includes('deadline')) return 'bg-purple-100 text-purple-700';
    if (typeLower.includes('quality')) return 'bg-pink-100 text-pink-700';
    if (typeLower.includes('behavior')) return 'bg-indigo-100 text-indigo-700';
    if (typeLower.includes('policy')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              Performance Warnings
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Issue and track employee performance warnings
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Issue Warning
          </Button>
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
              {/* Employee Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Employee</Label>
                <Select
                  value={filters.userId}
                  onValueChange={(value) => setFilters({ ...filters, userId: value, page: 1 })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} ({user.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Issued By Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Issued By</Label>
                <Select
                  value={filters.issuedBy}
                  onValueChange={(value) => setFilters({ ...filters, issuedBy: value, page: 1 })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All issuers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Issuers</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name} ({user.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Warning Type Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Warning Type</Label>
                <Select
                  value={filters.type}
                  onValueChange={(value) => setFilters({ ...filters, type: value, page: 1 })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {warningTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Date Range</Label>
                <Select
                  value={filters.dateFilter}
                  onValueChange={(value: any) => handleDateFilterChange(value)}
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

              {/* Custom Date Range */}
              {filters.dateFilter === 'custom' && (
                <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.fromDate ? format(filters.fromDate, 'PPP') : 'Select from date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.fromDate}
                          onSelect={(date) => setFilters({ ...filters, fromDate: date, page: 1 })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.toDate ? format(filters.toDate, 'PPP') : 'Select to date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.toDate}
                          onSelect={(date) => {
                            if (date) {
                              date.setHours(23, 59, 59, 999);
                            }
                            setFilters({ ...filters, toDate: date, page: 1 });
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Warnings Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Warnings ({pagination.total})
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchWarnings()}
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
                <p className="mt-2 text-muted-foreground">Loading warnings...</p>
              </div>
            ) : warnings.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No warnings found</p>
                <Button
                  variant="link"
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-2"
                >
                  Issue first warning
                </Button>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Warning Type</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Issued By</TableHead>
                    <TableHead>Issued Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warnings.map((warning) => (
                    <TableRow key={warning._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewWarning(warning._id)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {warning.userId.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{warning.userId.name}</div>
                            <div className="text-xs text-muted-foreground">
                              ID: {warning.userId.employeeId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", getWarningColor(warning.type))}>
                          <AlertCircle className="w-3 h-3" />
                          {warning.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm line-clamp-2 max-w-md">
                          {warning.notes}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {warning.issuedBy.name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm">{warning.issuedBy.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatShortDate(warning.createdAt)}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(warning.createdAt), 'hh:mm a')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewWarning(warning._id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
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

      {/* Create Warning Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Issue Performance Warning
            </DialogTitle>
            <DialogDescription>
              Issue a formal warning to an employee for performance or conduct issues
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Select Employee */}
            <div className="space-y-2">
              <Label>Employee *</Label>
              <SearchableDropdown
                options={users.map(user => ({
                  value: user._id,
                  label: `${user.name} (${user.email})`,
                  empId: user.employeeId
                }))}
                value={formData.userId}
                onValueChange={(value) => setFormData({ ...formData, userId: value })}
                placeholder="Search and select employee..."
                searchPlaceholder="Search by name, email, or employee ID..."
                emptyMessage="No employees found"
              />
            </div>

            {/* Warning Type */}
            <div className="space-y-2">
              <Label>Warning Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value, customType: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select warning type" />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_WARNING_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Other (Custom)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Type Input */}
            {formData.type === 'other' && (
              <div className="space-y-2">
                <Label>Custom Warning Type *</Label>
                <Input
                  placeholder="Enter custom warning type"
                  value={formData.customType}
                  onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes / Details *</Label>
              <FormattedTextEditor
                value={formData.notes}
                onChange={(value) => setFormData({ ...formData, notes: value })}
                placeholder="Describe the issue, incident, or performance concern in detail..."
                previewLabel="Live preview"
              />
            </div>

            {/* Info Alert */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Important:</p>
                  <p>This warning will be recorded in the employee's performance history and may be considered during reviews.</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateWarning} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Issuing...' : 'Issue Warning'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Warning Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-3xl">
          {selectedWarning && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Warning Details
                </DialogTitle>
                <DialogDescription>
                  Issued on {formatDate(selectedWarning.createdAt)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Employee Info */}
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium">{selectedWarning.userId.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Employee ID: {selectedWarning.userId.employeeId} | Email: {selectedWarning.userId.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning Type */}
                <div className="space-y-2">
                  <Label>Warning Type</Label>
                  <Badge className={cn("text-sm py-1 px-3", getWarningColor(selectedWarning.type))}>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {selectedWarning.type}
                  </Badge>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Notes / Details</Label>
                  <div className="p-4 bg-muted rounded-lg">
                    <FormattedText text={selectedWarning.notes} className="text-sm" />
                  </div>
                </div>

                {/* Issued By */}
                <div className="space-y-2">
                  <Label>Issued By</Label>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium">{selectedWarning.issuedBy.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Employee ID: {selectedWarning.issuedBy.employeeId} | Email: {selectedWarning.issuedBy.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p>{formatDate(selectedWarning.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Updated:</span>
                    <p>{formatDate(selectedWarning.updatedAt)}</p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
