import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
  User,
  Calendar,
  MessageSquare,
  Users,
  Video,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays,
  Type
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

interface MeetingLogType {
  _id: string;
  leadId: number;
  userId: {
    _id: string;
    name: string;
    email?: string;
  };
  meetingType: string;
  outcome: string;
  notes: string;
  stageId?: {
    _id: string;
    name: string;
  };
  startedAt: string;
  duration: number;
  feedbacks: Array<{
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

interface LeadType {
  _id: string;
  leadId: number;
  name: string;
  phone: string;
  email: string;
  stageId: {
    _id: string;
    name: string;
  };
}

interface StageType {
  _id: string;
  name: string;
  order: number;
}

interface UserType {
  _id: string;
  name: string;
  email: string;
}

interface MeetingForm {
  leadId: string;
  meetingType: string;
  outcome: string;
  notes: string;
  stageId: string;
  startedAt: string;
  duration: string;
  feedback: string;
}

interface Filters {
  search: string;
  leadId: string;
  userId: string;
  stageId: string;
  meetingType: string;
  outcome: string;
  notes: string;
  dateFilter: string;
  fromDate: string;
  toDate: string;
  sort: string;
}

// Static meeting types
const MEETING_TYPES = [
  "Discovery Call",
  "Demo Meeting",
  "Follow-up",
  "Negotiation",
  "Closure",
  "Account Review",
  "Q&A Session",
  "Technical Discussion",
  "Strategy Meeting",
  "Partnership Discussion",
  "Other"
];

export function MeetingLogsPage() {
  // State declarations
  const [meetingLogs, setMeetingLogs] = useState<MeetingLogType[]>([]);
  const [leads, setLeads] = useState<LeadType[]>([]);
  const [stages, setStages] = useState<StageType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingStages, setLoadingStages] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState<Filters>({
    search: '',
    leadId: 'all',
    userId: 'all',
    stageId: 'all',
    meetingType: 'all',
    outcome: '',
    notes: '',
    dateFilter: 'all',
    fromDate: '',
    toDate: '',
    sort: 'new'
  });
  
  // Modal states
  const [newMeetingOpen, setNewMeetingOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<string>('');
  
  // Form states
  const [meetingForm, setMeetingForm] = useState<MeetingForm>({
    leadId: '',
    meetingType: '',
    outcome: '',
    notes: '',
    stageId: '',
    startedAt: '',
    duration: '',
    feedback: ''
  });
  
  // Loading states
  const [addingMeeting, setAddingMeeting] = useState(false);
  
  // Filter visibility
  const [showFilters, setShowFilters] = useState(false);

  // Build query params with static filters
  const buildQueryParams = useCallback(() => {
    const params: Record<string, any> = {};

    // Pagination
    params.page = page;
    params.limit = limit;

    // Search filter
    if (filters.search) {
      params.search = filters.search;
    }
    
    // Filter by specific fields
    if (filters.leadId && filters.leadId !== "all") params.leadId = filters.leadId;
    if (filters.userId && filters.userId !== "all") params.userId = filters.userId;
    if (filters.stageId && filters.stageId !== "all") params.stageId = filters.stageId;
    if (filters.meetingType && filters.meetingType !== "all") params.meetingType = filters.meetingType;
    if (filters.outcome) params.outcome = filters.outcome;
    if (filters.notes) params.notes = filters.notes;
    
    // Date filters
    if (filters.dateFilter && filters.dateFilter !== "all") {
      params.dateFilter = filters.dateFilter;
    }
    
    if (filters.fromDate) params.fromDate = filters.fromDate;
    if (filters.toDate) params.toDate = filters.toDate;
    
    // Sorting
    if (filters.sort) params.sort = filters.sort;

    return params;
  }, [filters, page, limit]);

  // Fetch meeting logs
  const fetchMeetingLogs = async () => {
    try {
      setLoading(true);
      const queryParams = buildQueryParams();
      const response = await getDataHandlerWithToken("getMeetingLog", queryParams, null);
      if (response?.data) {
        setMeetingLogs(response.data);
        setTotalLogs(response.total || response.data.length);
        setTotalPages(response.totalPages || Math.ceil((response.total || response.data.length) / limit));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch meeting logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch leads
  const fetchLeads = async () => {
    try {
      setLoadingLeads(true);
      const response = await getDataHandlerWithToken("getAllLeads", { page: 1, limit: 1000 }, null);
      if (response?.data) {
        setLeads(response.data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive",
      });
    } finally {
      setLoadingLeads(false);
    }
  };

  // Fetch stages
  const fetchStages = async () => {
    try {
      setLoadingStages(true);
      const response = await getDataHandlerWithToken("getAllStages", null, null);
      if (response) {
        setStages(response);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch stages",
        variant: "destructive",
      });
    } finally {
      setLoadingStages(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await getDataHandlerWithToken("getAllUser", null, null);
      if (response) {
        setUsers(response);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchMeetingLogs();
    fetchLeads();
    fetchStages();
    fetchUsers();
  }, []);

  // Refresh when filters or pagination changes
  useEffect(() => {
    fetchMeetingLogs();
  }, [page, limit, buildQueryParams]);

  // Add new meeting log
  const handleAddMeetingLog = async () => {
    try {
      setAddingMeeting(true);
      
      // Validate required fields
      if (!meetingForm.leadId || !meetingForm.meetingType || !meetingForm.duration) {
        toast({
          title: "Error",
          description: "Lead, Meeting Type, and Duration are required",
          variant: "destructive",
        });
        return;
      }

      // Prepare data according to API schema
      const dataToSend = {
        leadId: parseInt(meetingForm.leadId),
        meetingType: meetingForm.meetingType,
        outcome: meetingForm.outcome || '',
        notes: meetingForm.notes || '',
        ...(meetingForm.stageId && { stageId: meetingForm.stageId }),
        startedAt: meetingForm.startedAt || new Date().toISOString(),
        duration: parseInt(meetingForm.duration),
        feedback: meetingForm.feedback || ''
      };
      
      const response = await postDataHandlerWithToken("MeetingLog", dataToSend);
      
      toast({
        title: "Success",
        description: response?.message || "Meeting log created successfully",
      });
      
      // Reset form
      setMeetingForm({
        leadId: '',
        meetingType: '',
        outcome: '',
        notes: '',
        stageId: '',
        startedAt: '',
        duration: '',
        feedback: ''
      });
      setNewMeetingOpen(false);
      fetchMeetingLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create meeting log",
        variant: "destructive",
      });
    } finally {
      setAddingMeeting(false);
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date for input
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      leadId: 'all',
      userId: 'all',
      stageId: 'all',
      meetingType: 'all',
      outcome: '',
      notes: '',
      dateFilter: 'all',
      fromDate: '',
      toDate: '',
      sort: 'new'
    });
    setPage(1);
  };

  // Handle view feedback
  const handleViewFeedback = (feedbacks: Array<any>) => {
    if (feedbacks && feedbacks.length > 0) {
      setSelectedFeedback(feedbacks[0].feedback);
      setFeedbackModalOpen(true);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Meeting Logs</h1>
          <p className="text-sm md:text-base text-muted-foreground">Track and manage all meeting activities</p>
        </div>
        <Button onClick={() => setNewMeetingOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Meeting Log
        </Button>
      </div>

      {/* Filters Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
        
        {showFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Filters
          </Button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search meetings..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Lead Filter */}
              <div className="space-y-2">
                <Label>Lead</Label>
                <Select
                  value={filters.leadId}
                  onValueChange={(value) => setFilters({...filters, leadId: value})}
                  disabled={loadingLeads}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All leads" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                    <SelectItem value="all">All Leads</SelectItem>
                    {leads.slice(0, 50).map((lead) => (
                      <SelectItem key={lead._id} value={lead.leadId.toString()}>
                        {lead.name} (ID: {lead.leadId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User Filter */}
              <div className="space-y-2">
                <Label>User</Label>
                <Select
                  value={filters.userId}
                  onValueChange={(value) => setFilters({...filters, userId: value})}
                  disabled={loadingUsers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                    <SelectItem value="all">All Users</SelectItem>
                    {users.slice(0, 50).map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stage Filter */}
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select
                  value={filters.stageId}
                  onValueChange={(value) => setFilters({...filters, stageId: value})}
                  disabled={loadingStages}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All stages" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                    <SelectItem value="all">All Stages</SelectItem>
                    {stages.map((stage) => (
                      <SelectItem key={stage._id} value={stage._id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Meeting Type Filter */}
              <div className="space-y-2">
                <Label>Meeting Type</Label>
                <Select
                  value={filters.meetingType}
                  onValueChange={(value) => setFilters({...filters, meetingType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                    <SelectItem value="all">All Types</SelectItem>
                    {MEETING_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <Label>Date Filter</Label>
                <Select
                  value={filters.dateFilter}
                  onValueChange={(value) => setFilters({...filters, dateFilter: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Outcome Filter */}
              <div className="space-y-2">
                <Label>Outcome Contains</Label>
                <Input
                  placeholder="Search in outcome..."
                  value={filters.outcome}
                  onChange={(e) => setFilters({...filters, outcome: e.target.value})}
                />
              </div>

              {/* Notes Filter */}
              <div className="space-y-2">
                <Label>Notes Contains</Label>
                <Input
                  placeholder="Search in notes..."
                  value={filters.notes}
                  onChange={(e) => setFilters({...filters, notes: e.target.value})}
                />
              </div>

              {/* Sort Filter */}
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={filters.sort}
                  onValueChange={(value) => setFilters({...filters, sort: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                    <SelectItem value="new">Newest First</SelectItem>
                    <SelectItem value="old">Oldest First</SelectItem>
                    <SelectItem value="duration_asc">Shortest Duration</SelectItem>
                    <SelectItem value="duration_desc">Longest Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Range */}
              {filters.dateFilter === 'custom' && (
                <>
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Input
                      type="date"
                      value={filters.fromDate}
                      onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Input
                      type="date"
                      value={filters.toDate}
                      onChange={(e) => setFilters({...filters, toDate: e.target.value})}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meeting Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>
              Meeting Logs ({totalLogs})
              {loading && (
                <span className="ml-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                  Loading...
                </span>
              )}
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1 || loading}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages || loading}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Select
                value={limit.toString()}
                onValueChange={(value) => {
                  setLimit(parseInt(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Loading meeting logs...</p>
            </div>
          ) : meetingLogs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No meeting logs found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or add a new meeting log.</p>
              <Button className="mt-4" onClick={() => setNewMeetingOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Meeting Log
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead className="hidden md:table-cell">Agent</TableHead>
                      <TableHead>Meeting Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="hidden lg:table-cell">Outcome</TableHead>
                      <TableHead className="hidden lg:table-cell">Feedback</TableHead>
                      <TableHead>Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meetingLogs.map((log) => (
                      <TableRow key={log._id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="font-medium">Lead ID: {log.leadId}</div>
                          <div className="text-xs text-muted-foreground">
                            {leads.find(l => l.leadId === log.leadId)?.name || 'Unknown Lead'}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-3 h-3" />
                            </div>
                            <div>
                              <div className="text-sm font-medium truncate max-w-[120px]">
                                {log.userId.name}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="truncate max-w-[100px]">
                            {log.meetingType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{formatDuration(log.duration)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="max-w-[150px]">
                            {log.outcome ? (
                              <div className="flex items-start gap-2">
                                <MessageSquare className="w-3 h-3 mt-1 flex-shrink-0 text-muted-foreground" />
                                <span className="text-xs line-clamp-2">
                                  {log.outcome}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {log.feedbacks && log.feedbacks.length > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewFeedback(log.feedbacks)}
                              className="h-6 text-xs"
                            >
                              <MessageCircle className="w-3 h-3 mr-1" />
                              View Feedback
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs">No feedback</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{formatDate(log.startedAt)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalLogs)} of {totalLogs} logs
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => setPage(pageNum)}
                          disabled={loading}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Meeting Dialog */}
      <Dialog open={newMeetingOpen} onOpenChange={setNewMeetingOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New Meeting Log</DialogTitle>
            <DialogDescription>Record a new meeting activity</DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto flex-1 py-2">
            <div className="grid gap-4">
              {/* Lead Selection */}
              <div className="space-y-2">
                <Label>Lead *</Label>
                <SearchableDropdown
                  options={leads.map(lead => ({
                    value: lead.leadId.toString(),
                    label: `${lead.name} (ID: ${lead.leadId})`,
                    name: lead.name,
                    email: lead.email,
                    phone: lead.phone
                  }))}
                  value={meetingForm.leadId}
                  onValueChange={(value) => setMeetingForm({...meetingForm, leadId: value})}
                  placeholder="Select lead"
                  searchPlaceholder="Search by name or ID..."
                  emptyMessage="No leads found"
                  disabled={addingMeeting || loadingLeads}
                  allowClear
                />
              </div>

              {/* Meeting Type */}
              <div className="space-y-2">
                <Label>Meeting Type *</Label>
                <Select
                  value={meetingForm.meetingType}
                  onValueChange={(value) => setMeetingForm({...meetingForm, meetingType: value})}
                  disabled={addingMeeting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select meeting type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEETING_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration & Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (seconds) *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={meetingForm.duration}
                    onChange={(e) => setMeetingForm({...meetingForm, duration: e.target.value})}
                    placeholder="300"
                    disabled={addingMeeting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Stage (Optional)</Label>
                  <Select
                    value={meetingForm.stageId}
                    onValueChange={(value) => setMeetingForm({...meetingForm, stageId: value})}
                    disabled={addingMeeting || loadingStages}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">No Stage</SelectItem>
                      {stages.map((stage) => (
                        <SelectItem key={stage._id} value={stage._id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-2">
                <Label>Meeting Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={formatDateForInput(meetingForm.startedAt)}
                  onChange={(e) => setMeetingForm({...meetingForm, startedAt: e.target.value})}
                  disabled={addingMeeting}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use current time
                </p>
              </div>

              {/* Outcome */}
              <div className="space-y-2">
                <Label>Outcome</Label>
                <Textarea
                  value={meetingForm.outcome}
                  onChange={(e) => setMeetingForm({...meetingForm, outcome: e.target.value})}
                  placeholder="What was the outcome of this meeting?"
                  disabled={addingMeeting}
                  className="min-h-[80px] resize-vertical"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={meetingForm.notes}
                  onChange={(e) => setMeetingForm({...meetingForm, notes: e.target.value})}
                  placeholder="Additional notes about the meeting..."
                  disabled={addingMeeting}
                  className="min-h-[80px] resize-vertical"
                />
              </div>

              {/* Feedback */}
              <div className="space-y-2">
                <Label>Feedback</Label>
                <Textarea
                  value={meetingForm.feedback}
                  onChange={(e) => setMeetingForm({...meetingForm, feedback: e.target.value})}
                  placeholder="Meeting feedback..."
                  disabled={addingMeeting}
                  className="min-h-[80px] resize-vertical"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setNewMeetingOpen(false)} 
              disabled={addingMeeting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddMeetingLog} 
              disabled={addingMeeting || !meetingForm.leadId || !meetingForm.meetingType || !meetingForm.duration}
            >
              {addingMeeting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Meeting Log'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Modal */}
      <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Meeting Feedback</DialogTitle>
            <DialogDescription>Feedback provided for this meeting</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedFeedback ? (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{selectedFeedback}</p>
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No feedback available</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setFeedbackModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}