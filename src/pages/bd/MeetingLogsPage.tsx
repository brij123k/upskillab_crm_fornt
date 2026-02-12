import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LeadHistoryModal } from '@/components/modal/LeadHistory';
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
  Type,
  Download,
  CheckSquare,
  Square
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getDataHandlerWithToken, postDataHandlerWithToken } from '@/config/services';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import ApiConfig from '@/config/apiConfig';

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
  employeeId?: number;
  role?: {
    _id: string;
    name: string;
  };
}

interface MeetingForm {
  leadId: string;
  meetingType: string;
  outcome: string;
  stageId: string;
  startedAt: string;
  duration: string;
}

interface Filters {
  search: string;
  leadId: string;
  userId: string;
  stageId: string;
  meetingType: string;
  outcome: string;
  dateFilter: string;
  fromDate: string;
  toDate: string;
  sort: string;
  group: string;
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
  const [leadHistoryModalOpen, setLeadHistoryModalOpen] = useState(false);
  const [leadHistory, setLeadHistory] = useState<any[]>([]);
  const [loadingLeadHistory, setLoadingLeadHistory] = useState(false);
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
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
    dateFilter: 'all',
    fromDate: '',
    toDate: '',
    sort: 'new',
    group: 'false'
  });

  // Modal states
  const [newMeetingOpen, setNewMeetingOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [addFeedbackModalOpen, setAddFeedbackModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingLogType | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<string>('');
  const [feedbackForm, setFeedbackForm] = useState({
    meetingId: '',
    leadId:0,
    feedback: ''
  });

  // Form states
  const [meetingForm, setMeetingForm] = useState<MeetingForm>({
    leadId: '',
    meetingType: '',
    outcome: '',
    stageId: '',
    startedAt: '',
    duration: ''
  });

  // Loading states
  const [addingMeeting, setAddingMeeting] = useState(false);
  const [addingFeedback, setAddingFeedback] = useState(false);

  // Filter visibility
  const [showFilters, setShowFilters] = useState(true);

  // Permissions
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");

  // Check if user has feedback permission
  const hasFeedbackPermission = () => {
    const userPermissions = permissions || [];
    return userPermissions.some((p: any) =>
      p.module === 'meetings' && p.actions.includes('feedback')
    );
  };

  const fetchLeadHistory = async (leadId: number) => {
    try {
      setLoadingLeadHistory(true);
      const endpoint = ApiConfig.leadHistory(leadId.toString());
      const response = await getDataHandlerWithToken(endpoint, null, null, true);
      if (response) {
        setLeadHistory(response);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch lead history",
        variant: "destructive",
      });
    } finally {
      setLoadingLeadHistory(false);
    }
  };

  // Add this handler function
  const handleViewLeadHistory = async (leadId: number) => {
    await fetchLeadHistory(leadId);
    setLeadHistoryModalOpen(true);
  };

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

    // Date filters
    if (filters.dateFilter && filters.dateFilter !== "all") {
      params.dateFilter = filters.dateFilter;
    }

    if (filters.fromDate) params.fromDate = filters.fromDate;
    if (filters.toDate) params.toDate = filters.toDate;

    // Sorting
    if (filters.sort) params.sort = filters.sort;

    // Group filter
    if (filters.group === 'true') {
      params.group = true;
    }

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
        ...(meetingForm.stageId && { stageId: meetingForm.stageId }),
        startedAt: meetingForm.startedAt || new Date().toISOString(),
        duration: parseInt(meetingForm.duration)
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
        stageId: '',
        startedAt: '',
        duration: ''
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

  // Add feedback to meeting
  const handleAddFeedback = async () => {
    try {
      setAddingFeedback(true);

      if (!feedbackForm.meetingId || !feedbackForm.feedback.trim()) {
        toast({
          title: "Error",
          description: "Feedback is required",
          variant: "destructive",
        });
        return;
      }

      const dataToSend = {
        meetingId: feedbackForm.meetingId,
        leadId:feedbackForm.leadId,
        feedback: feedbackForm.feedback.trim()
      };

      const response = await postDataHandlerWithToken("addMettingFeedback", dataToSend);

      toast({
        title: "Success",
        description: response?.message || "Feedback added successfully",
      });

      // Reset form and close modal
      setFeedbackForm({ meetingId: '',leadId:0, feedback: '' });
      setAddFeedbackModalOpen(false);

      // Refresh meeting logs
      fetchMeetingLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add feedback",
        variant: "destructive",
      });
    } finally {
      setAddingFeedback(false);
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
    return date.toISOString().slice(0, 16);
  };

  // Format date and time separately
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
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
      dateFilter: 'all',
      fromDate: '',
      toDate: '',
      sort: 'new',
      group: 'false'
    });
    setPage(1);
  };

  // Toggle group filter
  const toggleGroupFilter = () => {
    setFilters(prev => ({
      ...prev,
      group: prev.group === 'true' ? 'false' : 'true'
    }));
    setPage(1);
  };

  // Handle view feedback
  const handleViewFeedback = (feedbacks: Array<any>) => {
    if (feedbacks && feedbacks.length > 0) {
      setSelectedFeedback(feedbacks[0].feedback);
      setFeedbackModalOpen(true);
    }
  };

  // Handle add feedback
  const handleOpenAddFeedback = (meeting: MeetingLogType) => {
    setSelectedMeeting(meeting);
    setFeedbackForm({
      meetingId: meeting._id,
      leadId: meeting.leadId,
      feedback: ''
    });
    setAddFeedbackModalOpen(true);
  };

  // Check if current user is the meeting owner
  const isMeetingOwner = (meeting: MeetingLogType) => {
    return meeting.userId._id === user.id;
  };

  // Export to CSV
  const exportToCSV = async (exportAll: boolean = false) => {
    try {
      let queryParams = buildQueryParams();

      if (exportAll) {
        delete queryParams.page;
        delete queryParams.limit;
        queryParams.limit = 10000;
      }

      toast({
        title: "Preparing Download",
        description: `Fetching ${exportAll ? 'all' : 'current page'} meeting logs...`,
      });

      const response = await getDataHandlerWithToken("getMeetingLog", queryParams, null);

      if (!response?.data) {
        throw new Error("No data to export");
      }

      const logsData = response.data;

      // CSV Headers
      const headers = [
        "ID",
        "Lead ID",
        "Lead Name",
        "Lead Phone",
        "Lead Email",
        "Agent",
        "Agent Email",
        "Meeting Type",
        "Outcome",
        "Stage",
        "Duration (seconds)",
        "Formatted Duration",
        "Date",
        "Time",
        "Has Feedback",
        "Created At"
      ];

      // Prepare data
      const rows = logsData.map((log: MeetingLogType) => {
        const lead = leads.find(l => l.leadId === log.leadId);
        const dateTime = formatDateTime(log.startedAt);

        return [
          log._id,
          log.leadId,
          `"${lead?.name || 'N/A'}"`,
          lead?.phone || 'N/A',
          lead?.email || 'N/A',
          log.userId.name,
          log.userId.email || '',
          log.meetingType,
          `"${(log.outcome || '').replace(/"/g, '""')}"`,
          log.stageId?.name || '',
          log.duration,
          formatDuration(log.duration),
          dateTime.date,
          dateTime.time,
          log.feedbacks && log.feedbacks.length > 0 ? 'Yes' : 'No',
          new Date(log.createdAt).toISOString()
        ];
      });

      // Create CSV
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const filename = `meeting_logs_${exportAll ? 'all' : 'page_' + page}_${timestamp}.csv`;

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `Exported ${logsData.length} meeting logs to CSV`,
      });

    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export meeting logs",
        variant: "destructive",
      });
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
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setNewMeetingOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Meeting Log
          </Button>

          <div className="flex items-center gap-2">
            <Select onValueChange={(value) => exportToCSV(value === 'all')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Export options" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export Current Page
                  </div>
                </SelectItem>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export All Pages
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Group Filter Checkbox */}
      <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg border">
        <Checkbox
          id="group-filter"
          checked={filters.group === 'true'}
          onCheckedChange={toggleGroupFilter}
        />
        <Label htmlFor="group-filter" className="text-sm font-medium cursor-pointer">
          Group
        </Label>
        {filters.group === 'true' && (
          <Badge variant="secondary" className="ml-2">
            Grouped View
          </Badge>
        )}
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
            <div className="space-y-4">
              {/* First Row */}
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-4`}>
                {/* Search */}
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search meetings..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                

                {/* Stage Filter */}
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <Select
                    value={filters.stageId}
                    onValueChange={(value) => setFilters({ ...filters, stageId: value })}
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
                    onValueChange={(value) => setFilters({ ...filters, meetingType: value })}
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
              </div>

              {/* Second Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                

                {/* Date Filter */}
                <div className="space-y-2">
                  <Label>Date Filter</Label>
                  <Select
                    value={filters.dateFilter}
                    onValueChange={(value) => setFilters({ ...filters, dateFilter: value })}
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

                {/* Sort Filter */}
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select
                    value={filters.sort}
                    onValueChange={(value) => setFilters({ ...filters, sort: value })}
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


              </div>
              <div className={`grid ${filters.group === 'true' ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-4`}>
                        {/* Lead Filter */}
                <div className="space-y-2">
                  <Label>Lead</Label>
                  <SearchableDropdown
                    options={[
                      { value: 'all', label: 'All Leads' },
                      ...leads.slice(0, 50).map(lead => ({
                        value: lead.leadId.toString(),
                        label: `${lead.name} (ID: ${lead.leadId})`
                      }))
                    ]}
                    value={filters.leadId}
                    onValueChange={(value) => setFilters({ ...filters, leadId: value })}
                    placeholder="All leads"
                    searchPlaceholder="Search leads..."
                    emptyMessage="No leads found"
                    disabled={loadingLeads}
                  />
                </div>

                {/* User Filter - Only show when group is false */}
                {filters.group == 'true' && (
                  <div className="space-y-2">
                    <Label>User</Label>
                    <SearchableDropdown
                      options={[
                        { value: 'all', label: 'All Users' },
                        ...users.slice(0, 50).map(user => ({
                          value: user._id,
                          label: user.name,
                          email: user.email,
                          empId: user.employeeId
                        }))
                      ]}
                      value={filters.userId}
                      onValueChange={(value) => setFilters({ ...filters, userId: value })}
                      placeholder="All users"
                      searchPlaceholder="Search users..."
                      emptyMessage="No users found"
                      disabled={loadingUsers}
                    />
                  </div>
                )}
              </div>

              {/* Custom Date Range */}
              {filters.dateFilter === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Input
                      type="date"
                      value={filters.fromDate}
                      onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Input
                      type="date"
                      value={filters.toDate}
                      onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Active Filters Display */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                {filters.leadId !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Lead: {leads.find(l => l.leadId.toString() === filters.leadId)?.name || filters.leadId}
                  </Badge>
                )}
                {filters.userId !== 'all' && filters.group !== 'true' && (
                  <Badge variant="secondary" className="text-xs">
                    User: {users.find(u => u._id === filters.userId)?.name || filters.userId}
                  </Badge>
                )}
                {filters.stageId !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Stage: {stages.find(s => s._id === filters.stageId)?.name || filters.stageId}
                  </Badge>
                )}
                {filters.meetingType !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Type: {filters.meetingType}
                  </Badge>
                )}
                {filters.outcome && (
                  <Badge variant="secondary" className="text-xs">
                    Outcome: {filters.outcome}
                  </Badge>
                )}
                {filters.group === 'true' && (
                  <Badge variant="secondary" className="text-xs">
                    Grouped View
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meeting Logs Table */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              Meeting Logs
              <Badge variant="outline" className="ml-2">
                {totalLogs} total
              </Badge>
              {loading && (
                <Loader2 className="w-3 h-3 animate-spin ml-2" />
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

        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Loading meeting logs...</p>
            </div>
          ) : meetingLogs.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No meeting logs found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or add a new meeting log.</p>
              <Button className="mt-4" onClick={() => setNewMeetingOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Meeting Log
              </Button>
            </div>
          ) : (
            <>
              {/* Responsive Table with Horizontal Scroll */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="whitespace-nowrap">Lead Id</TableHead>
                      <TableHead className="whitespace-nowrap">Lead Name</TableHead>
                      <TableHead className="whitespace-nowrap">Meeting By</TableHead>
                      <TableHead className="whitespace-nowrap">Meeting Type</TableHead>
                      <TableHead className="whitespace-nowrap">Duration</TableHead>
                      <TableHead className="whitespace-nowrap">Stage</TableHead>
                      <TableHead className="whitespace-nowrap">Outcome</TableHead>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead className="whitespace-nowrap">Time</TableHead>
                      <TableHead className="whitespace-nowrap">Feedback</TableHead>
                      <TableHead className="whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meetingLogs.map((log) => {
                      const lead = leads.find(l => l.leadId === log.leadId);
                      const dateTime = formatDateTime(log.startedAt);
                      const hasFeedback = log.feedbacks && log.feedbacks.length > 0;
                      const isOwner = isMeetingOwner(log);
                      // const canAddFeedback = hasFeedbackPermission() && !isOwner;
                      const canAddFeedback = true && !isOwner;

                      return (
                        <TableRow key={log._id} className="hover:bg-muted/50">
                          <TableCell className="whitespace-nowrap">
                            <div className="font-medium text-sm">{log.leadId}</div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="text-sm">
                              {lead?.name || 'Unknown Lead'}
                            </div>
                          </TableCell>

                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">

                              <div>
                                <div className="text-sm font-medium">{log.userId.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {log.userId.email?.split('@')[0] || ''}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="whitespace-nowrap">
                            <Badge variant="outline" className="text-xs">
                              {log.meetingType}
                            </Badge>
                          </TableCell>

                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm font-mono">{formatDuration(log.duration)}</span>
                            </div>
                          </TableCell>

                          <TableCell className="whitespace-nowrap">
                            {log.stageId ? (
                              <Badge variant="secondary" className="text-xs">
                                {log.stageId.name}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          <TableCell className="max-w-[200px]">
                            {log.outcome ? (
                              <div className="flex items-start gap-1">
                                <MessageSquare className="w-3 h-3 mt-1 flex-shrink-0 text-muted-foreground" />
                                <span className="text-xs line-clamp-2 break-words">
                                  {log.outcome}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>

                          <TableCell className="whitespace-nowrap">
                            <div className="text-sm">{dateTime.date}</div>
                          </TableCell>

                          <TableCell className="whitespace-nowrap">
                            <div className="text-sm">{dateTime.time}</div>
                          </TableCell>

                          <TableCell className="whitespace-nowrap">
                            {hasFeedback ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewFeedback(log.feedbacks)}
                                className="h-6 text-xs"
                              >
                                <MessageCircle className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">No feedback</span>
                            )}
                          </TableCell>

                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {/* View Lead History Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewLeadHistory(log.leadId);
                                }}
                                className="h-7 w-7 p-0"
                                title="View Lead History"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </Button>

                              {/* Add Feedback Button */}
                              {canAddFeedback && !hasFeedback && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenAddFeedback(log);
                                  }}
                                  className="h-7 text-xs"
                                >
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  Add Feedback
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Compact Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
                <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalLogs)} of {totalLogs} logs
                </div>

                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1 || loading}
                    className="h-8 px-3 text-xs"
                  >
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Prev
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 3) {
                        pageNum = i + 1;
                      } else if (page === 1) {
                        pageNum = i + 1;
                      } else if (page === totalPages) {
                        pageNum = totalPages - 2 + i;
                      } else {
                        pageNum = page - 1 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          className="w-7 h-7 p-0 text-xs"
                          onClick={() => setPage(pageNum)}
                          disabled={loading}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    {totalPages > 3 && page < totalPages - 1 && (
                      <span className="text-xs px-1">...</span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages || loading}
                    className="h-8 px-3 text-xs"
                  >
                    Next
                    <ChevronRight className="h-3 w-3 ml-1" />
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
                  onValueChange={(value) => setMeetingForm({ ...meetingForm, leadId: value })}
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
                  onValueChange={(value) => setMeetingForm({ ...meetingForm, meetingType: value })}
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
                    onChange={(e) => setMeetingForm({ ...meetingForm, duration: e.target.value })}
                    placeholder="300"
                    disabled={addingMeeting}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Stage (Optional)</Label>
                  <Select
                    value={meetingForm.stageId}
                    onValueChange={(value) => setMeetingForm({ ...meetingForm, stageId: value })}
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
                  onChange={(e) => setMeetingForm({ ...meetingForm, startedAt: e.target.value })}
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
                  onChange={(e) => setMeetingForm({ ...meetingForm, outcome: e.target.value })}
                  placeholder="What was the outcome of this meeting?"
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

      {/* View Feedback Modal */}
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

      {/* Add Feedback Modal */}
      <Dialog open={addFeedbackModalOpen} onOpenChange={setAddFeedbackModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Feedback</DialogTitle>
            <DialogDescription>
              {selectedMeeting && `Add feedback for meeting with Lead ID: ${selectedMeeting.leadId}`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Feedback *</Label>
                <Textarea
                  value={feedbackForm.feedback}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                  placeholder="Enter your feedback about this meeting..."
                  disabled={addingFeedback}
                  className="min-h-[120px] resize-vertical"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddFeedbackModalOpen(false);
                setFeedbackForm({ meetingId: '',leadId:0, feedback: '' });
              }}
              disabled={addingFeedback}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddFeedback}
              disabled={addingFeedback || !feedbackForm.feedback.trim()}
            >
              {addingFeedback ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Lead History Modal */}
<LeadHistoryModal
  open={leadHistoryModalOpen}
  onOpenChange={setLeadHistoryModalOpen}
  leadHistory={leadHistory}
  loadingHistory={loadingLeadHistory}
  selectedLeadName={leads.find(l => l.leadId === meetingLogs.find(m => m.leadId)?.leadId)?.name}
  onRefresh={() => {
    if (selectedMeeting) {
      fetchLeadHistory(selectedMeeting.leadId);
    }
  }}
/>
    </div>
  );
}