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
  Megaphone,
  Plus,
  MoreHorizontal,
  Calendar as CalendarIcon,
  Filter,
  X,
  RefreshCw,
  Loader2,
  Users,
  Building2,
  User,
  Mail,
  Clock,
  Eye,
  Send,
  CheckCircle2
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

interface Department {
  _id: string;
  name: string;
  description?: string;
}

interface Announcement {
  _id: string;
  title: string;
  message: string;
  audience: 'all' | 'selected_users' | 'department';
  departmentId: string | null;
  userIds: string[];
  recipientUserIds: string[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

interface AnnouncementFormData {
  title: string;
  message: string;
  audience: 'all' | 'selected_users' | 'department';
  userIds: string[];
  departmentId: string;
}

// Audience configurations
const AUDIENCE_CONFIG = {
  all: { label: 'All Users', color: 'bg-green-100 text-green-700', icon: Users },
  selected_users: { label: 'Selected Users', color: 'bg-blue-100 text-blue-700', icon: User },
  department: { label: 'Department', color: 'bg-purple-100 text-purple-700', icon: Building2 }
};

export function BDAnnouncementPage() {
  // State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    audience: 'all' as string,
    departmentId: 'all' as string,
    createdBy: 'all' as string,
    userId: '',
    search: '',
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
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    message: '',
    audience: 'all',
    userIds: [],
    departmentId: ''
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

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const response = await getDataHandlerWithToken(ApiConfig.getAllDepartments, null, null, true);
      if (response && Array.isArray(response)) {
        setDepartments(response);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      toast.error('Failed to load departments');
    }
  };

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const queryParams: any = {};
      
      if (filters.audience !== 'all') queryParams.audience = filters.audience;
      if (filters.departmentId !== 'all') queryParams.departmentId = filters.departmentId;
      if (filters.createdBy !== 'all') queryParams.createdBy = filters.createdBy;
      if (filters.userId) queryParams.userId = filters.userId;
      if (filters.search) queryParams.search = filters.search;
      if (filters.fromDate) queryParams.fromDate = format(filters.fromDate, 'yyyy-MM-dd');
      if (filters.toDate) queryParams.toDate = format(filters.toDate, 'yyyy-MM-dd');
      
      queryParams.page = filters.page;
      queryParams.limit = filters.limit;
      
      const response = await getDataHandlerWithToken(ApiConfig.getAnnouncements, queryParams, null, true);
      if (response && response.data) {
        setAnnouncements(response.data);
        setPagination(response.meta);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  // Make Announcement
  const handleCreateAnnouncement = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.message.trim()) {
      toast.error('Message is required');
      return;
    }
    
    // Validate based on audience
    if (formData.audience === 'selected_users' && formData.userIds.length === 0) {
      toast.error('Please select at least one user');
      return;
    }
    if (formData.audience === 'department' && !formData.departmentId) {
      toast.error('Please select a department');
      return;
    }
    
    setSubmitting(true);
    try {
      const payload: any = {
        title: formData.title,
        message: formData.message,
        audience: formData.audience
      };
      
      if (formData.audience === 'selected_users') {
        payload.userIds = formData.userIds;
      }
      
      if (formData.audience === 'department') {
        payload.departmentId = formData.departmentId;
      }
      
      await postDataHandlerWithToken(ApiConfig.createAnnouncement, payload, true);
      toast.success('Announcement created successfully');
      setCreateModalOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to Make Announcement:', error);
      toast.error('Failed to Make Announcement');
    } finally {
      setSubmitting(false);
    }
  };

  // View announcement details
  const handleViewAnnouncement = async (announcementId: string) => {
    try {
      const response = await getDataHandlerWithToken(ApiConfig.getAnnouncementById(announcementId), null, null, true);
      if (response) {
        setSelectedAnnouncement(response);
        setViewModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch announcement details:', error);
      toast.error('Failed to load announcement details');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      audience: 'all',
      userIds: [],
      departmentId: ''
    });
  };

  const resetFilters = () => {
    setFilters({
      audience: 'all',
      departmentId: 'all',
      createdBy: 'all',
      userId: '',
      search: '',
      fromDate: undefined,
      toDate: undefined,
      page: 1,
      limit: 10
    });
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [filters]);

  const getAudienceBadge = (audience: string) => {
    const config = AUDIENCE_CONFIG[audience as keyof typeof AUDIENCE_CONFIG];
    const Icon = config?.icon || Users;
    return (
      <Badge className={cn("gap-1", config?.color)}>
        <Icon className="w-3 h-3" />
        {config?.label || audience}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
  };

  const formatShortDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  // Get user names from IDs
  const getUserNames = (userIds: string[]) => {
    return userIds.map(id => {
      const user = users.find(u => u._id === id);
      return user?.name || id;
    }).join(', ');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Megaphone className="w-6 h-6" />
              HR Announcements
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create and manage company announcements
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Make Announcement
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
              {/* Search Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Search</Label>
                <Input
                  placeholder="Search by title or message..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                />
              </div>

              {/* Audience Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Audience</Label>
                <Select
                  value={filters.audience}
                  onValueChange={(value) => setFilters({ ...filters, audience: value, page: 1 })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All audiences" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Audiences</SelectItem>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="selected_users">Selected Users</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Department Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Department</Label>
                <Select
                  value={filters.departmentId}
                  onValueChange={(value) => setFilters({ ...filters, departmentId: value, page: 1 })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Created By Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Created By</Label>
                <Select
                  value={filters.createdBy}
                  onValueChange={(value) => setFilters({ ...filters, createdBy: value, page: 1 })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All creators" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Creators</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User ID Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Specific User (Recipient)</Label>
                <Select
                  value={filters.userId}
                  onValueChange={(value) => setFilters({ ...filters, userId: value, page: 1 })}
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

              {/* Date Range Filters */}
              <div className="space-y-2">
                <Label className="text-xs">Date Range</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.fromDate ? format(filters.fromDate, 'MMM dd, yyyy') : 'From'}
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.toDate ? format(filters.toDate, 'MMM dd, yyyy') : 'To'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.toDate}
                        onSelect={(date) => setFilters({ ...filters, toDate: date, page: 1 })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Announcements Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Announcements ({pagination.total})
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchAnnouncements()}
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
                <p className="mt-2 text-muted-foreground">Loading announcements...</p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No announcements found</p>
                <Button
                  variant="link"
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-2"
                >
                  Create your first announcement
                </Button>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((announcement) => (
                    <TableRow key={announcement._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewAnnouncement(announcement._id)}>
                      <TableCell>
                        <div className="font-medium">{announcement.title}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm line-clamp-2 max-w-md">
                          {announcement.message}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getAudienceBadge(announcement.audience)}
                        {announcement.audience === 'department' && announcement.departmentId && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {departments.find(d => d._id === announcement.departmentId)?.name || 'Unknown Dept'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {announcement.createdBy.name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm">{announcement.createdBy.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatShortDate(announcement.createdAt)}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(announcement.createdAt), 'hh:mm a')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Users className="w-3 h-3" />
                          {announcement.recipientUserIds?.length || 0} recipients
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewAnnouncement(announcement._id)}>
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

      {/* Make Announcement Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Announcement</DialogTitle>
            <DialogDescription>
              Create an announcement to notify users
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="Enter announcement title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Message *</Label>
              <FormattedTextEditor
                value={formData.message}
                onChange={(value) => setFormData({ ...formData, message: value })}
                placeholder="Write your announcement. Use bold, bullets, or quotes."
                previewLabel="Live preview"
              />
            </div>

            <div className="space-y-2">
              <Label>Audience *</Label>
              <Select
                value={formData.audience}
                onValueChange={(value: any) => setFormData({ 
                  ...formData, 
                  audience: value,
                  userIds: [],
                  departmentId: ''
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="selected_users">Selected Users</SelectItem>
                  <SelectItem value="department">Specific Department</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selected Users */}
            {formData.audience === 'selected_users' && (
              <div className="space-y-2">
                <Label>Select Users *</Label>
                <SearchableDropdown
                  options={users.map(user => ({
                    value: user._id,
                    label: `${user.name} (${user.email})`,
                    empId: user.employeeId
                  }))}
                  value={formData.userIds[formData.userIds.length - 1] || ''}
                  onValueChange={(value) => {
                    if (value && !formData.userIds.includes(value)) {
                      setFormData({
                        ...formData,
                        userIds: [...formData.userIds, value]
                      });
                    }
                  }}
                  placeholder="Search and select users..."
                  searchPlaceholder="Search by name or email..."
                  emptyMessage="No users found"
                />
                
                {formData.userIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.userIds.map((userId) => {
                      const user = users.find(u => u._id === userId);
                      return (
                        <Badge key={userId} variant="secondary" className="gap-1">
                          {user?.name || userId}
                          <X
                            className="w-3 h-3 cursor-pointer hover:text-destructive"
                            onClick={() => setFormData({
                              ...formData,
                              userIds: formData.userIds.filter(id => id !== userId)
                            })}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Department Selection */}
            {formData.audience === 'department' && (
              <div className="space-y-2">
                <Label>Select Department *</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAnnouncement} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? 'Creating...' : 'Make Announcement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Announcement Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-3xl">
          {selectedAnnouncement && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedAnnouncement.title}
                </DialogTitle>
                <DialogDescription>
                  Created by {selectedAnnouncement.createdBy.name} on {formatDate(selectedAnnouncement.createdAt)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Message */}
                <div className="space-y-2">
                  <Label>Message</Label>
                  <div className="p-4 bg-muted rounded-lg">
                    <FormattedText text={selectedAnnouncement.message} className="text-sm" />
                  </div>
                </div>

                {/* Audience Details */}
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <div className="flex items-center gap-2">
                    {getAudienceBadge(selectedAnnouncement.audience)}
                    {selectedAnnouncement.audience === 'department' && selectedAnnouncement.departmentId && (
                      <Badge variant="outline" className="gap-1">
                        <Building2 className="w-3 h-3" />
                        {departments.find(d => d._id === selectedAnnouncement.departmentId)?.name || 'Unknown'}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Recipients Summary */}
                <div className="space-y-2">
                  <Label>Recipients Summary</Label>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {selectedAnnouncement.recipientUserIds?.length || 0} Users
                      </span>
                    </div>
                    {selectedAnnouncement.recipientUserIds && selectedAnnouncement.recipientUserIds.length > 0 && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View recipient list
                        </summary>
                        <div className="mt-2 space-y-1 pl-4">
                          {selectedAnnouncement.recipientUserIds.slice(0, 20).map((userId) => {
                            const user = users.find(u => u._id === userId);
                            return user ? (
                              <div key={userId} className="text-sm">
                                • {user.name} ({user.email})
                              </div>
                            ) : null;
                          })}
                          {selectedAnnouncement.recipientUserIds.length > 20 && (
                            <div className="text-sm text-muted-foreground">
                              ...and {selectedAnnouncement.recipientUserIds.length - 20} more
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p>{formatDate(selectedAnnouncement.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Updated:</span>
                    <p>{formatDate(selectedAnnouncement.updatedAt)}</p>
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
