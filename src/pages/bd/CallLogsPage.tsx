import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Download,
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
  Phone,
  AlertCircle
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ApiConfig from '@/config/apiConfig';

interface CallLogType {
  _id: string;
  leadId: number;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  duration: number;
  stageId?: {
    _id: string;
    name: string;
  };
  outcome?: string;
  startedAt:string;
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

interface CallLogForm {
  leadId: string;
  duration: string;
  stageId?: string;
  outcome?: string;
}

interface Filters {
  search: string;
  leadId: string;
  stageId: string;
  userId: string;
  outcome: string;
  durationMin: string;
  durationMax: string;
  dateFilter: string;
  fromDate: string;
  toDate: string;
  sort: string;
}



export function CallLogsPage() {
  // State declarations
  const [callLogs, setCallLogs] = useState<CallLogType[]>([]);
  const [leads, setLeads] = useState<LeadType[]>([]);
  const [stages, setStages] = useState<StageType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingStages, setLoadingStages] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
    const [CallModalOpen, setCallModalOpen] = useState(false);
  const [selectedCallLog, setSelectedCallLog] = useState<CallLogType>();
  const [currentreview,setCurrentreview] = useState<any>({})
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState<Filters>({
    search: '',
    leadId: 'all',
    stageId: 'all',
    userId: 'all',
    outcome: '',
    durationMin: '',
    durationMax: '',
    dateFilter: 'all',
    fromDate: '',
    toDate: '',
    sort: 'new'
  });
  
  // Modal states
  const [newCallLogOpen, setNewCallLogOpen] = useState(false);
  
  // Form states
  const [callLogForm, setCallLogForm] = useState<CallLogForm>({
    leadId: '',
    duration: '',
    stageId: '',
    outcome: ''
  });
  
  // Loading states
  const [addingCallLog, setAddingCallLog] = useState(false);
  
  // Filter visibility
  const [showFilters, setShowFilters] = useState(false);

  // Build query params with all backend filters
  const buildQueryParams = useCallback(() => {
    const params: Record<string, any> = {};

    // Pagination
    params.page = page;
    params.limit = limit;

    // Text search
    if (filters.search) params.search = filters.search;
    
    // Filter by specific fields
    if (filters.leadId && filters.leadId !== "all") params.leadId = filters.leadId;
    if (filters.stageId && filters.stageId !== "all") params.stageId = filters.stageId;
    if (filters.userId && filters.userId !== "all") params.byUserId = filters.userId;
    if (filters.outcome) params.outcome = filters.outcome;
    
    // Duration range
    if (filters.durationMin) params.durationMin = filters.durationMin;
    if (filters.durationMax) params.durationMax = filters.durationMax;
    
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

  // Fetch call logs
  const fetchCallLogs = async () => {
    try {
      setLoading(true);
      const queryParams = buildQueryParams();
      const response = await getDataHandlerWithToken("CallLog", queryParams, null);
      if (response?.data) {
        setCallLogs(response.data);
        setTotalLogs(response.total);
        setTotalPages(response.totalPages);
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
    fetchUsers();
    fetchCallLogs();
    fetchLeads();
    fetchStages();
  }, []);

  // Refresh when filters or pagination changes
  useEffect(() => {
    fetchCallLogs();
  }, [page, limit, buildQueryParams]);

  // Add new call log
  const handleAddCallLog = async () => {
    try {
      setAddingCallLog(true);
      
      if (!callLogForm.leadId || !callLogForm.duration) {
        toast({
          title: "Error",
          description: "Lead and Duration are required",
          variant: "destructive",
        });
        return;
      }

      const dataToSend = {
        leadId: parseInt(callLogForm.leadId),
        duration: parseInt(callLogForm.duration),
        ...(callLogForm.stageId && { stageId: callLogForm.stageId }),
        ...(callLogForm.outcome && { outcome: callLogForm.outcome })
      };
      
      await postDataHandlerWithToken("CallLog", dataToSend);
      
      toast({
        title: "Success",
        description: "Call log created successfully",
      });
      
      setCallLogForm({
        leadId: '',
        duration: '',
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

  const fatchCallReview = async (id:string)=>{
    try{
      const endpoint = ApiConfig.getcallLogReview(id)
      const response = await getDataHandlerWithToken(endpoint, null, null,true)
      setCurrentreview(response)
      return true
    }catch(error){
      console.error(error || "call review sendig error")
      return false
    }
  }
  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      leadId: 'all',
      stageId: 'all',
      userId: 'all',
      outcome: '',
      durationMin: '',
      durationMax: '',
      dateFilter: 'all',
      fromDate: '',
      toDate: '',
      sort: 'new'
    });
    setPage(1);
  };

  // Export to CSV
  const exportToCSV = async (exportAll: boolean = false) => {
    try {
      let queryParams = buildQueryParams();
      
      if (exportAll) {
        // Remove pagination for full export
        delete queryParams.page;
        delete queryParams.limit;
        queryParams.limit = 10000; // Large limit to get all data
      }

      toast({
        title: "Preparing Download",
        description: `Fetching ${exportAll ? 'all' : 'current page'} call logs...`,
      });

      const response = await getDataHandlerWithToken("CallLog", queryParams, null);
      
      if (!response?.data) {
        throw new Error("No data to export");
      }

      const logsData = response.data;
      
      // CSV Headers
      const headers = [
        "ID",
        "Lead ID",
        "Lead Name",
        // "Agent",
        // "Agent Email",
        "Duration (seconds)",
        "Formatted Duration",
        "Stage",
        "Outcome/Notes",
        "Created At",
        "Updated At"
      ];

      // Prepare data
      const rows = logsData.map((log: CallLogType) => [
        log._id,
        log.leadId,
        leads.find(l => l.leadId === log.leadId)?.name || 'N/A',
        // log.userId.name,
        // log.userId.email,
        log.duration,
        formatDuration(log.duration),
        log.stageId?.name || '',
        `"${(log.outcome || '').replace(/"/g, '""')}"`, // Escape quotes for CSV
        new Date(log.createdAt).toISOString(),
        new Date(log.updatedAt).toISOString()
      ]);

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
      const filename = `call_logs_${exportAll ? 'all' : 'page_' + page}_${timestamp}.csv`;
      
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
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export call logs",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Call Logs</h1>
          <p className="text-sm md:text-base text-muted-foreground">Track and manage all call activities</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={newCallLogOpen} onOpenChange={setNewCallLogOpen}>
            {/* <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Call Log
            </Button> */}
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Add New Call Log</DialogTitle>
                <DialogDescription>Record a new call activity</DialogDescription>
              </DialogHeader>
              
              <div className="overflow-y-auto flex-1 py-2">
                <div className="grid gap-4">
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
                      value={callLogForm.leadId}
                      onValueChange={(value) => setCallLogForm({...callLogForm, leadId: value})}
                      placeholder="Select lead"
                      searchPlaceholder="Search by name or ID..."
                      emptyMessage="No leads found"
                      disabled={addingCallLog || loadingLeads}
                      allowClear
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration (seconds) *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={callLogForm.duration}
                        onChange={(e) => setCallLogForm({...callLogForm, duration: e.target.value})}
                        placeholder="120"
                        disabled={addingCallLog}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Stage (Optional)</Label>
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Outcome/Notes (Optional)</Label>
                    <Textarea
                      value={callLogForm.outcome}
                      onChange={(e) => setCallLogForm({...callLogForm, outcome: e.target.value})}
                      placeholder="Add outcome details or notes about the call..."
                      disabled={addingCallLog}
                      className="min-h-[100px] resize-vertical"
                    />
                  </div>
                </div>
              </div>
              
              <DialogFooter className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setNewCallLogOpen(false)} 
                  disabled={addingCallLog}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddCallLog} 
                  disabled={addingCallLog || !callLogForm.leadId || !callLogForm.duration}
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
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Filters</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Lead</Label>
                    <SearchableDropdown
                      options={[
                        { value: 'all', label: 'All Leads' },
                        ...leads.map(lead => ({
                          value: lead.leadId.toString(),
                          label: `${lead.name} (ID: ${lead.leadId})`
                        }))
                      ]}
                      value={filters.leadId}
                      onValueChange={(value) => setFilters({...filters, leadId: value})}
                      placeholder="Select lead"
                      searchPlaceholder="Search leads..."
                      emptyMessage="No leads found"
                      disabled={loadingLeads}
                    />
                  </div>
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
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  
                  <div className="space-y-2">
                    <Label>Outcome Contains</Label>
                    <Input
                      placeholder="Search in outcome..."
                      value={filters.outcome}
                      onChange={(e) => setFilters({...filters, outcome: e.target.value})}
                    />
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
                      <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                        <SelectItem value="new">Newest First</SelectItem>
                        <SelectItem value="old">Oldest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* <div className="space-y-2">
                    <Label>Min Duration (seconds)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={filters.durationMin}
                      onChange={(e) => setFilters({...filters, durationMin: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Max Duration (seconds)</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="3600"
                      value={filters.durationMax}
                      onChange={(e) => setFilters({...filters, durationMax: e.target.value})}
                    />
                  </div> */}
                </div>
                
                {filters.dateFilter === 'custom' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Call Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>
              Call Logs ({totalLogs})
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
              <p className="mt-2 text-muted-foreground">Loading call logs...</p>
            </div>
          ) : callLogs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No call logs found</h3>
              <p className="text-muted-foreground">Try adjusting your filters</p>
              {/* <Button className="mt-4" onClick={() => setNewCallLogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Call Log
              </Button> */}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden sm:table-cell">Lead</TableHead>
                      {/* <TableHead>outcome</TableHead> */}
                      <TableHead>Duration</TableHead>
                      <TableHead className="hidden md:table-cell">Stage</TableHead>
                      <TableHead>outCome</TableHead>
                      <TableHead className="hidden lg:table-cell">Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {callLogs.map((log) => (
                      <TableRow key={log._id} className="hover:bg-muted/50">
                        <TableCell className="hidden sm:table-cell cursor-pointer"
                        onClick={()=>{
                          fatchCallReview(log._id)
                            setSelectedCallLog(log)
                            setCallModalOpen(true)
                          }}
                          >
                          <div className="font-medium">Lead ID: {log.leadId}</div>
                          <div className="text-xs text-muted-foreground">
                            {leads.find(l => l.leadId === log.leadId)?.name || 'Unknown Lead'}
                          </div>
                        </TableCell>
                        {/* <TableCell>
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
                        </TableCell> */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{formatDuration(log.duration)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {log.stageId ? (
                            <Badge variant="secondary" className="truncate max-w-[100px]">
                              {log.stageId.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[150px]">
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
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
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

      <Dialog open={CallModalOpen} onOpenChange={setCallModalOpen}>
  <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh]">
    <DialogHeader>
      <DialogTitle className="text-xl">Call Remark</DialogTitle>
      <DialogDescription>
        Detailed remark and information about the call
      </DialogDescription>
    </DialogHeader>
    
    <div className="py-2 max-h-[calc(90vh-180px)] overflow-y-auto pr-2">
      {selectedCallLog ? (
        <div className="space-y-6">
          {/* Main Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Call Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Lead ID</p>
                    <p className="text-sm font-medium">{selectedCallLog.leadId || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lead Name</p>
                    <p className="text-sm font-medium">{currentreview.leaddetail?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Stage</p>
                    <p className="text-sm font-medium">{selectedCallLog.stageId?.name || "N/A"}</p>
                  </div>
                 
                </div>
              </div>

              {/* Outcome Section */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Outcome</h3>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedCallLog.outcome === 'Success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : selectedCallLog.outcome === 'Failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>
                  {selectedCallLog.outcome || "Not Specified"}
                </div>
              </div>
            </div>

            {/* Right Column - Timing Info */}
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Timing Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Started At</p>
                    <p className="text-sm font-medium">{formatDate(selectedCallLog.startedAt) || "N/A"}</p>
                  </div>
                   <div>
                    <p className="text-xs text-muted-foreground">Agent</p>
                    <p className="text-sm font-medium">{selectedCallLog.userId?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-medium">{formatDuration(selectedCallLog.duration) || "0:00"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Remarks Section - Full Width */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="font-medium text-sm text-muted-foreground mb-3">Remark</h3>
            <div className="bg-background border border-border rounded-lg p-4 min-h-[100px]">
              <p className="text-sm whitespace-pre-wrap text-foreground">
                {currentreview?.remark || "No remarks provided"}
              </p>
            </div>
          </div>

          {/* Additional Info Section if needed */}
          {/* {selectedCallLog.additionalNotes && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-medium text-sm text-muted-foreground mb-2">Additional Notes</h3>
              <p className="text-sm whitespace-pre-wrap bg-background border border-border rounded-lg p-3">
                {selectedCallLog.additionalNotes}
              </p>
            </div>
          )} */}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium mb-1">No Data Available</h3>
          <p className="text-muted-foreground text-center">
            No call remark data found for this session
          </p>
        </div>
      )}
    </div>
    
    <DialogFooter className=" bottom-0 bg-background pt-4 border-t">
      <Button 
        onClick={() => setCallModalOpen(false)}
        className="w-full sm:w-auto"
      >
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </div>
  );
}