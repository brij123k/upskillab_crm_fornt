import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Download,
  RefreshCw,
  Loader2,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  FileText,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Filter,
  ChevronUp,
  ChevronDown,
  User,
  Calendar,
  AlertCircle,
  PhoneCall,
  PhoneMissed,
  PhoneOff,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import ApiConfig from '@/config/apiConfig';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';

// Call status enum
enum CallStatus {
  CONNECTED = 'connected',
  NOT_CONNECTED = 'not_connected',
  BUSY = 'busy',
  FOLLOW_UP = 'follow_up',
  CONVERTED = 'converted',
}

interface CallLogType {
  _id: string;
  leadId: number;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  duration: number;
  status: CallStatus;
  stageId?: {
    _id: string;
    name: string;
  };
  outcome?: string; // This is the notes/outcome text
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

interface CallLogForm {
  leadId: string;
  duration: string;
  status: CallStatus;
  stageId?: string;
  outcome?: string; // This is the notes/outcome text
}

interface Filters {
  search: string;
  status: string;
  leadId: string;
  dateFilter: string;
  fromDate: string;
  toDate: string;
  sort: string;
}

export function CallLogsPage() {
  const [callLogs, setCallLogs] = useState<CallLogType[]>([]);
  const [leads, setLeads] = useState<LeadType[]>([]);
  const [stages, setStages] = useState<StageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingStages, setLoadingStages] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    leadId: 'all',
    dateFilter: 'all',
    fromDate: '',
    toDate: '',
    sort: 'new'
  });
  
  // Modal states
  const [newCallLogOpen, setNewCallLogOpen] = useState(false);
  const [selectedCallLog, setSelectedCallLog] = useState<CallLogType | null>(null);
  
  // Form states
  const [callLogForm, setCallLogForm] = useState<CallLogForm>({
    leadId: '',
    duration: '',
    status: CallStatus.CONNECTED,
    stageId: '',
    outcome: ''
  });
  
  // Loading states
  const [addingCallLog, setAddingCallLog] = useState(false);
  
  // Filter visibility
  const [showFilters, setShowFilters] = useState(false);
  
  // Build query params
  const buildQueryParams = () => {
    const params: Record<string, any> = {};

    // Pagination
    params.page = page;
    params.limit = limit;

    // Filters
    if (filters.search && filters.search !== "all") params.search = filters.search;
    if (filters.status && filters.status !== "all") params.status = filters.status;
    if (filters.leadId && filters.leadId !== "all") params.leadId = filters.leadId;
    if (filters.sort && filters.sort !== "all") params.sort = filters.sort;
    
    if (filters.dateFilter && filters.dateFilter !== "all") {
      params.dateFilter = filters.dateFilter;
    }
    
    if (filters.fromDate && filters.fromDate !== "all") params.fromDate = filters.fromDate;
    if (filters.toDate && filters.toDate !== "all") params.toDate = filters.toDate;

    return params;
  };

  // Fetch call logs
  const fetchCallLogs = async () => {
    try {
      setLoading(true);
      const queryParams = buildQueryParams();
      const response = await getDataHandlerWithToken("CallLog", queryParams, null);
      
      if (response?.data) {
        setCallLogs(response.data);
        setTotalLogs(response.meta.total);
        setTotalPages(response.meta.totalPages);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch call logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch leads for dropdown
  const fetchLeads = async () => {
    try {
      setLoadingLeads(true);
      const response = await getDataHandlerWithToken("getAllLeads", { page: 1, limit: 100 }, null);
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

  // Initialize data
  useEffect(() => {
    fetchCallLogs();
    fetchLeads();
    fetchStages();
  }, [page, limit, filters]);

  // Add new call log
  const handleAddCallLog = async () => {
    try {
      setAddingCallLog(true);
      
      // Validate form
      if (!callLogForm.leadId || !callLogForm.duration || !callLogForm.status) {
        toast({
          title: "Error",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }

      // Prepare data according to API schema
      const dataToSend = {
        leadId: parseInt(callLogForm.leadId),
        duration: parseInt(callLogForm.duration),
        status: callLogForm.status,
        ...(callLogForm.stageId && { stageId: callLogForm.stageId }),
        ...(callLogForm.outcome && { outcome: callLogForm.outcome })
      };
      
      const response = await postDataHandlerWithToken("createCallLog", dataToSend);
      
      toast({
        title: "Success",
        description: response?.message || "Call log created successfully",
      });
      
      // Reset form
      setCallLogForm({
        leadId: '',
        duration: '',
        status: CallStatus.CONNECTED,
        stageId: '',
        outcome: ''
      });
      setNewCallLogOpen(false);
      fetchCallLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create call log",
        variant: "destructive",
      });
    } finally {
      setAddingCallLog(false);
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  // Get status badge
  const getStatusBadge = (status: CallStatus) => {
    switch (status) {
      case CallStatus.CONNECTED:
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case CallStatus.NOT_CONNECTED:
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Not Connected
          </Badge>
        );
      case CallStatus.BUSY:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <PhoneMissed className="w-3 h-3 mr-1" />
            Busy
          </Badge>
        );
      case CallStatus.FOLLOW_UP:
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <PhoneCall className="w-3 h-3 mr-1" />
            Follow Up
          </Badge>
        );
      case CallStatus.CONVERTED:
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            <TrendingUp className="w-3 h-3 mr-1" />
            Converted
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get status icon
  const getStatusIcon = (status: CallStatus) => {
    switch (status) {
      case CallStatus.CONNECTED:
        return <Phone className="w-4 h-4 text-green-600" />;
      case CallStatus.NOT_CONNECTED:
        return <PhoneOff className="w-4 h-4 text-red-600" />;
      case CallStatus.BUSY:
        return <PhoneMissed className="w-4 h-4 text-yellow-600" />;
      case CallStatus.FOLLOW_UP:
        return <PhoneCall className="w-4 h-4 text-blue-600" />;
      case CallStatus.CONVERTED:
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      default:
        return <Phone className="w-4 h-4" />;
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      leadId: 'all',
      dateFilter: 'all',
      fromDate: '',
      toDate: '',
      sort: 'new'
    });
    setPage(1);
  };

  // Export to CSV
  const exportToCSV = async () => {
    try {
      // Build query params for all data
      const queryParams: Record<string, any> = {};

      // Apply all active filters
      if (filters.search && filters.search !== "all") queryParams.search = filters.search;
      if (filters.status && filters.status !== "all") queryParams.status = filters.status;
      if (filters.leadId && filters.leadId !== "all") queryParams.leadId = filters.leadId;
      if (filters.sort && filters.sort !== "all") queryParams.sort = filters.sort;
      
      if (filters.dateFilter && filters.dateFilter !== "all") {
        queryParams.dateFilter = filters.dateFilter;
      }
      
      if (filters.fromDate && filters.fromDate !== "all") queryParams.fromDate = filters.fromDate;
      if (filters.toDate && filters.toDate !== "all") queryParams.toDate = filters.toDate;

      // Fetch all data without pagination
      queryParams.page = 1;
      queryParams.limit = 10000;

      // Show loading toast
      toast({
        title: "Preparing Download",
        description: "Fetching all call log data...",
      });

      const response = await getDataHandlerWithToken("CallLog", queryParams, null);
      
      if (!response?.data) {
        throw new Error("No data to export");
      }

      const logsData = response.data;
      
      // Define CSV headers
      const headers = [
        "ID",
        "Lead ID",
        "Lead Name",
        "Agent",
        "Duration",
        "Status",
        "Stage",
        "Outcome/Notes",
        "Created At",
        "Updated At"
      ];

      // Prepare CSV rows
      const rows = logsData.map((log: CallLogType) => [
        log._id,
        log.leadId,
        leads.find(l => l.leadId === log.leadId)?.name || 'N/A',
        log.userId.name,
        formatDuration(log.duration),
        log.status,
        log.stageId?.name || '',
        log.outcome || '',
        new Date(log.createdAt).toLocaleString(),
        new Date(log.updatedAt).toLocaleString()
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const filename = `call_logs_export_${timestamp}.csv`;
      
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `Exported ${logsData.length} call logs to CSV`,
      });

    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export call logs",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Call Logs</h1>
          <p className="text-muted-foreground">Track and manage all call activities</p>
        </div>
        <div className="flex items-center gap-2">
  <Dialog open={newCallLogOpen} onOpenChange={setNewCallLogOpen}>
    <DialogTrigger asChild>
      <Button>
        <Plus className="w-4 h-4 mr-2" />
        Add Call Log
      </Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[500px] w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col mx-4 sm:mx-0">
      <DialogHeader className="px-1 flex-shrink-0">
        <DialogTitle className="text-lg sm:text-xl">Add New Call Log</DialogTitle>
        <DialogDescription className="text-sm sm:text-base">
          Record a new call activity
        </DialogDescription>
      </DialogHeader>
      
      <div className="overflow-y-auto flex-1 px-1 py-2 min-h-0">
        <div className="grid gap-4 py-2">
          {/* Lead Selection */}
          <div className="space-y-2">
            <Label htmlFor="leadId" className="text-sm sm:text-base">
              Lead *
            </Label>
            <SearchableDropdown
              options={leads.map(lead => ({
                value: lead.leadId.toString(),
                label: `${lead.name} (ID: ${lead.leadId})`,
                name: lead.name,
                email: lead.email,
                phone: lead.phone
              }))}
              value={callLogForm.leadId}
              onValueChange={(value) => setCallLogForm({...callLogForm, leadId: value})}
              placeholder="Select lead"
              searchPlaceholder="Search by name or ID..."
              emptyMessage="No leads found"
              disabled={addingCallLog || loadingLeads}
              allowClear
              triggerClassName="h-10 sm:h-11 text-sm sm:text-base"
              contentClassName="w-full sm:max-w-[var(--radix-popover-trigger-width)] max-h-[60vh]"
            />
          </div>

          {/* Duration and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm sm:text-base">
                Duration (seconds) *
              </Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={callLogForm.duration}
                onChange={(e) => setCallLogForm({...callLogForm, duration: e.target.value})}
                placeholder="120"
                disabled={addingCallLog}
                className="h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm sm:text-base">
                Status *
              </Label>
              <Select
                value={callLogForm.status}
                onValueChange={(value: CallStatus) => setCallLogForm({...callLogForm, status: value})}
                disabled={addingCallLog}
              >
                <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="max-h-[60vh] sm:max-h-none">
                  <SelectItem value={CallStatus.CONNECTED} className="text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Connected
                    </div>
                  </SelectItem>
                  <SelectItem value={CallStatus.NOT_CONNECTED} className="text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Not Connected
                    </div>
                  </SelectItem>
                  <SelectItem value={CallStatus.BUSY} className="text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      Busy
                    </div>
                  </SelectItem>
                  <SelectItem value={CallStatus.FOLLOW_UP} className="text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-blue-600" />
                      Follow Up
                    </div>
                  </SelectItem>
                  <SelectItem value={CallStatus.CONVERTED} className="text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      Converted
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stage Selection */}
          <div className="space-y-2">
            <Label htmlFor="stageId" className="text-sm sm:text-base">
              Stage (Optional)
            </Label>
            <SearchableDropdown
              options={stages.map(stage => ({
                value: stage._id,
                label: stage.name
              }))}
              value={callLogForm.stageId || ''}
              onValueChange={(value) => setCallLogForm({...callLogForm, stageId: value})}
              placeholder="Select stage"
              searchPlaceholder="Search stage..."
              emptyMessage="No stages found"
              disabled={addingCallLog || loadingStages}
              allowClear
              triggerClassName="h-10 sm:h-11 text-sm sm:text-base"
              contentClassName="w-full sm:max-w-[var(--radix-popover-trigger-width)] max-h-[60vh]"
            />
          </div>

          {/* Outcome/Notes */}
          <div className="space-y-2">
            <Label htmlFor="outcome" className="text-sm sm:text-base">
              Outcome/Notes (Optional)
            </Label>
            <Textarea
              id="outcome"
              value={callLogForm.outcome}
              onChange={(e) => setCallLogForm({...callLogForm, outcome: e.target.value})}
              placeholder="Add outcome details or notes about the call..."
              disabled={addingCallLog}
              className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base resize-y"
              rows={4}
            />
            <p className="text-xs sm:text-sm text-muted-foreground">
              Enter any additional information about the call outcome
            </p>
          </div>
        </div>
      </div>
      
      <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 pt-4 border-t flex-shrink-0 bg-background">
        <Button 
          variant="outline" 
          onClick={() => setNewCallLogOpen(false)} 
          disabled={addingCallLog}
          className="w-full sm:w-auto order-2 sm:order-1 text-sm sm:text-base h-10 sm:h-11"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleAddCallLog} 
          disabled={addingCallLog || !callLogForm.leadId || !callLogForm.duration || !callLogForm.status}
          className="w-full sm:w-auto order-1 sm:order-2 text-sm sm:text-base h-10 sm:h-11"
        >
          {addingCallLog ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Call Log'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</div>
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
          {showFilters ? (
            <>
              Hide Filters
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Show Filters
              <ChevronDown className="w-4 h-4" />
            </>
          )}
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

      {/* Filters - Collapsible */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by lead ID or outcome..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({...filters, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value={CallStatus.CONNECTED}>Connected</SelectItem>
                    <SelectItem value={CallStatus.NOT_CONNECTED}>Not Connected</SelectItem>
                    <SelectItem value={CallStatus.BUSY}>Busy</SelectItem>
                    <SelectItem value={CallStatus.FOLLOW_UP}>Follow Up</SelectItem>
                    <SelectItem value={CallStatus.CONVERTED}>Converted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
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
                  <SelectContent>
                    <SelectItem value="all">All Leads</SelectItem>
                    {leads.slice(0, 20).map((lead) => (
                      <SelectItem key={lead._id} value={lead.leadId.toString()}>
                        {lead.name} (ID: {lead.leadId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Date Filter</Label>
                <Select
                  value={filters.dateFilter}
                  onValueChange={(value) => setFilters({...filters, dateFilter: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={filters.sort}
                  onValueChange={(value) => setFilters({...filters, sort: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Newest First</SelectItem>
                    <SelectItem value="old">Oldest First</SelectItem>
                    <SelectItem value="duration_asc">Shortest Duration</SelectItem>
                    <SelectItem value="duration_desc">Longest Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
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

      {/* Call Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              All Call Logs ({totalLogs})
              {loading && (
                <span className="ml-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                  Loading...
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={exportToCSV}
                disabled={loading || totalLogs === 0}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Loading call logs...</p>
            </div>
          ) : callLogs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No call logs found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or add a new call log.</p>
              <Button className="mt-4" onClick={() => setNewCallLogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Call Log
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Outcome/Notes</TableHead>
                    <TableHead>Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callLogs.map((log) => (
                    <TableRow key={log._id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium">Lead ID: {log.leadId}</div>
                        <div className="text-xs text-muted-foreground">
                          {leads.find(l => l.leadId === log.leadId)?.name || 'Unknown Lead'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-3 h-3" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{log.userId.name}</div>
                            <div className="text-xs text-muted-foreground">{log.userId.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{formatDuration(log.duration)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          {getStatusBadge(log.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.stageId ? (
                          <Badge variant="secondary">{log.stageId.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {log.outcome ? (
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-3 h-3 mt-1 flex-shrink-0 text-muted-foreground" />
                            <span className="text-xs sm:text-sm text-foreground line-clamp-2">
                              {log.outcome}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(log.createdAt)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {callLogs.length > 0 && (
            <div className="flex items-center justify-between mt-4">
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
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => {
                    setLimit(parseInt(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}