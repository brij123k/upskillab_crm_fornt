import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DuplicateLeadsModal } from '@/components/modal/DuplicateLeadsModal';
import { CopyCheck,MousePointer, PhoneCall,  } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChangeStageModal } from '@/components/ChangeStageModal';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Eye,
  Download,
  RefreshCw,
  Loader2,
  Users,
  FileUp,
  FileDown,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  FileText,
  Upload,
  X,
  CheckCircle,
  XCircle,
  TrendingUp,
  Phone,
  Mail,
  CheckSquare,
  Square,
  Filter,
  ChevronUp,
  ChevronDown,
  AlertTriangle
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
import { getDataHandlerWithToken, postDataHandlerWithToken, patchTokenDataHandler } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { ProgressModal } from '@/components/modal/ProgressModal';
import { CSVUploadModal } from '@/components/modal/CSVUploadModal';
import { SearchableSelect } from '@/components/modal/SearchableSelect';
import { hasPermission } from '@/utils/permissions';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';

interface LeadType {
  _id: string;
  leadId: number;
  name: string;
  phone: string;
  email: string;
  source: string;
  stageId: {
    _id: string;
    name: string;
    order: number;
  };
  status: 'active' | 'lost' | 'converted';
  healthScore: number;
  modifiedBy: string;
  modifiedAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    employeeId:number;
  };
  reason: string;
}

interface LeadHistoryType {
  _id: string;
  leadId: string;
  actionType: string;
  actionBy: {
    _id: string;
    name: string;
    email: string;
  };
  fromUser?: {
    _id: string;
    name: string;
    email: string;
  };
  toUser?: {
    _id: string;
    name: string;
    email: string;
  };
  changes: any;
  reason: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
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
  role?: {
    _id: string;
    name: string;
  }
  employeeId: number;
  profile?: {
  };
}

interface LeadForm {
  name: string;
  phone: string;
  email: string;
  source: string;
  stageId: string;
  source_campaign?: string;
  assignedTo?: string;
  reason?: string;
}

interface BulkLead {
  name: string;
  phone: string;
  email: string;
  source: string;
  stageId: string;
  source_campaign?: string;
  assignedTo?: string;
  reason?: string;
}

interface Filters {
  search: string;
  status: string;
  source: string;
  stageId: string;
  assignedTo: string;
  modifiedBy: string;
  isActive: string;
  sort: string;
  dateFilter: string;
  fromDate: string;
  toDate: string;
}

interface ProgressItem {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
}

export function BDLeadsPage() {
  const [leads, setLeads] = useState<LeadType[]>([]);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<StageType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [leadHistory, setLeadHistory] = useState<LeadHistoryType[]>([]);
  const [changeStageModalOpen, setChangeStageModalOpen] = useState(false);
  const [actionsModalOpen, setActionsModalOpen] = useState(false);
  const [changingStage, setChangingStage] = useState(false);
  const [assignReason, setAssignReason] = useState('');
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    source: 'all',
    stageId: 'all',
    assignedTo: 'all',
    modifiedBy: 'all',
    isActive: 'all',
    sort: 'new',
    dateFilter: 'all',
    fromDate: '',
    toDate: ''
  });

  // Modal states
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [bulkLeadOpen, setBulkLeadOpen] = useState(false);
  const [csvUploadOpen, setCsvUploadOpen] = useState(false);
  const [viewLeadOpen, setViewLeadOpen] = useState(false);
  const [editLeadOpen, setEditLeadOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadType | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'lost' | 'converted'>('active');
  const [selectedUser, setSelectedUser] = useState<string>('');

  // Selection states
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isAssignmentMode, setIsAssignmentMode] = useState(false);

  const permissions = JSON.parse(
    localStorage.getItem("permissions") || "[]"
  );
  const user =JSON.parse(localStorage.getItem("user"));
  // Form states
  const [leadForm, setLeadForm] = useState<LeadForm>({
    name: '',
    phone: '',
    email: '',
    source: 'manual',
    stageId: '696cadcadcbcf508621922e6',
    source_campaign: '',
    assignedTo: user.id,
    reason: 'New Lead Assigned'
  });

  const [bulkLeads, setBulkLeads] = useState<BulkLead[]>([
    { name: '', phone: '', email: '', source: 'manual', stageId: '696cadcadcbcf508621922e6', assignedTo: '', reason: '' }
  ]);

  // Progress tracking
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);

  // Loading states
  const [addingLead, setAddingLead] = useState(false);
  const [addingBulkLeads, setAddingBulkLeads] = useState(false);
  const [updatingLead, setUpdatingLead] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [assigningLeads, setAssigningLeads] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingStages, setLoadingStages] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Filter visibility
  const [showFilters, setShowFilters] = useState(false);

  const [assignUserId, setAssignUserId] = useState<string>('');

  // Build query params
  const buildQueryParams = () => {
    const params: Record<string, any> = {};

    // Pagination
    params.page = page;
    params.limit = limit;

    // Filters (only add if value exists and is not "all")
    if (filters.search && filters.search !== "all") params.search = filters.search;
    if (filters.status && filters.status !== "all") params.status = filters.status;
    if (filters.source && filters.source !== "all") params.source = filters.source;
    if (filters.stageId && filters.stageId !== "all") params.stageId = filters.stageId;
    if (filters.assignedTo && filters.assignedTo !== "all") params.assignedTo = filters.assignedTo;
    if (filters.modifiedBy && filters.modifiedBy !== "all") params.modifiedBy = filters.modifiedBy;

    if (filters.isActive && filters.isActive !== "all") {
      params.isActive = filters.isActive === "true" ? true :
        filters.isActive === "false" ? false : filters.isActive;
    }

    if (filters.sort && filters.sort !== "all") params.sort = filters.sort;

    if (filters.dateFilter && filters.dateFilter !== "all") {
      params.dateFilter = filters.dateFilter;
    }

    if (filters.fromDate && filters.fromDate !== "all") params.fromDate = filters.fromDate;
    if (filters.toDate && filters.toDate !== "all") params.toDate = filters.toDate;

    return params;
  };

  // Fetch leads with filters
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const queryParams = buildQueryParams();
      const response = await getDataHandlerWithToken("getAllLeads", queryParams, null);

      if (response?.data) {
        setLeads(response.data);
        setTotalLeads(response.meta.total);
        setTotalPages(response.meta.totalPages);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  // Fetch lead history
  const fetchLeadHistory = async (leadId: string) => {
    try {
      setLoadingHistory(true);
      const endpoint = ApiConfig.leadHistory(leadId);
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
      setLoadingHistory(false);
    }
  };

  const handleStageSubmit = async (leadId: string, stageId: string) => {
    if (!selectedLead) return;

    try {
      setChangingStage(true);
      const endpoint = ApiConfig.changeStageLead(leadId);
      const response = await patchTokenDataHandler(endpoint, { stageId }, true);

      toast({
        title: "Success",
        description: response?.message || "Lead stage updated successfully",
      });

      setChangeStageModalOpen(false);
      setActionsModalOpen(false);
      fetchLeads();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update lead stage",
        variant: "destructive",
      });
    } finally {
      setChangingStage(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchLeads();
    fetchStages();
    fetchUsers();
  }, [page, limit, filters]);

  // Reset selection when leads change
  useEffect(() => {
    setSelectedLeads([]);
    setSelectAll(false);
  }, [leads]);

  // Handle select all
  useEffect(() => {
    if (selectAll) {
      const allLeadIds = leads.map(lead => lead._id);
      setSelectedLeads(allLeadIds);
    } else {
      setSelectedLeads([]);
    }
  }, [selectAll, leads]);

  // Add new lead
  const handleAddLead = async () => {
    try {
      setAddingLead(true);
      const dataToSend = { ...leadForm };
      console.log(dataToSend)
      // Remove assignedTo if empty
      // if (!dataToSend.assignedTo) {
      //   delete dataToSend.assignedTo;
      // }

      const response = await postDataHandlerWithToken("createNewLead", dataToSend);

      toast({
        title: "Success",
        description: response?.message || "Lead created successfully",
      });

      setLeadForm({
        name: '',
        phone: '',
        email: '',
        source: 'manual',
        stageId: '696cadcadcbcf508621922e6',
        source_campaign: '',
        assignedTo: ''
      });
      setNewLeadOpen(false);
      fetchLeads();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create lead",
        variant: "destructive",
      });
    } finally {
      setAddingLead(false);
    }
  };

  const isBulkLeadFormValid = () => {
    // Check if there's at least one valid lead
    const validLeads = bulkLeads.filter(lead =>
      lead.name && lead.phone && lead.email && lead.stageId
    );

    if (validLeads.length === 0) return false;

    // Check if all leads with assigned users have reasons
    for (const lead of validLeads) {
      const hasAssignedUser = lead.assignedTo && lead.assignedTo.trim() !== "" && lead.assignedTo !== " ";
      if (hasAssignedUser && (!lead.reason || !lead.reason.trim())) {
        return false;
      }
    }

    return true;
  };

  // Update the handleAddBulkLeads function
  const handleAddBulkLeads = async () => {
    try {
      setAddingBulkLeads(true);
      setProgressModalOpen(true);

      const validLeads = bulkLeads.filter(lead =>
        lead.name && lead.phone && lead.email && lead.stageId
      );

      if (validLeads.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one valid lead",
          variant: "destructive",
        });
        return;
      }

      // Validate that assigned leads have reasons
      const leadsWithoutReason = validLeads.filter(lead => {
        const hasAssignedUser = lead.assignedTo && lead.assignedTo.trim() !== "" && lead.assignedTo !== " ";
        return hasAssignedUser && (!lead.reason || !lead.reason.trim());
      });

      if (leadsWithoutReason.length > 0) {
        toast({
          title: "Error",
          description: "Please provide a reason for assigned leads",
          variant: "destructive",
        });
        return;
      }

      // Initialize progress items
      const initialProgress: ProgressItem[] = validLeads.map((lead, index) => ({
        id: `lead-${index}`,
        name: lead.name,
        status: 'pending'
      }));
      setProgressItems(initialProgress);

      // Process leads one by one
      for (let i = 0; i < validLeads.length; i++) {
        const lead = validLeads[i];

        // Update progress to processing
        setProgressItems(prev => prev.map((item, idx) =>
          idx === i ? { ...item, status: 'processing' } : item
        ));

        try {
          const dataToSend: any = { ...lead };

          // Remove assignedTo if empty
          if (!dataToSend.assignedTo || dataToSend.assignedTo === "" || dataToSend.assignedTo === " ") {
            delete dataToSend.assignedTo;
            delete dataToSend.reason;
          } else {
            // Include reason when user is assigned
            dataToSend.reason = dataToSend.reason || "Bulk lead creation assignment";
          }

          await postDataHandlerWithToken("createNewLead", dataToSend);

          // Update progress to success
          setProgressItems(prev => prev.map((item, idx) =>
            idx === i ? { ...item, status: 'success' } : item
          ));
        } catch (error: any) {
          // Update progress to error
          setProgressItems(prev => prev.map((item, idx) =>
            idx === i ? {
              ...item,
              status: 'error',
              message: error.response?.data?.message || "Failed to create lead"
            } : item
          ));
        }
      }

      toast({
        title: "Bulk Upload Complete",
        description: `${validLeads.length} leads processed`,
      });

      // Reset form after delay
      setTimeout(() => {
        setBulkLeads([{ name: '', phone: '', email: '', source: 'manual', stageId: '696cadcadcbcf508621922e6', assignedTo: '', reason: '' }]);
        setBulkLeadOpen(false);
        setProgressModalOpen(false);
        fetchLeads();
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to process bulk leads",
        variant: "destructive",
      });
    } finally {
      setAddingBulkLeads(false);
    }
  };

  // Update lead
  const handleUpdateLead = async () => {
    if (!selectedLead) return;

    try {
      setUpdatingLead(true);
      const endpoint = ApiConfig.updateLead(selectedLead._id);
      const response = await patchTokenDataHandler(endpoint, leadForm, true);

      toast({
        title: "Success",
        description: response?.message || "Lead updated successfully",
      });

      setEditLeadOpen(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update lead",
        variant: "destructive",
      });
    } finally {
      setUpdatingLead(false);
    }
  };

  // Update lead status
  const handleUpdateStatus = async () => {
    if (!selectedLead) return;

    try {
      setUpdatingStatus(true);
      const endpoint = ApiConfig.changeStatusLead(selectedLead._id);
      const response = await patchTokenDataHandler(endpoint, { status: selectedStatus }, true);

      toast({
        title: "Success",
        description: response?.message || "Lead status updated successfully",
      });

      setStatusModalOpen(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update lead status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Assign leads to user
  const handleAssignLeads = async () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one lead",
        variant: "destructive",
      });
      return;
    }

    // Prepare data for API
    const dataToSend: any = {
      leadIds: selectedLeads,
      reason: assignReason.trim()
    };

    // Add assignedTo if user is selected
    if (assignUserId && assignUserId !== "") {
      dataToSend.assignedTo = assignUserId;

    }


    // If no user
    if (!assignUserId) {
      toast({
        title: "Error",
        description: "Please select user",
        variant: "destructive",
      });
      return;
    }

    try {
      setAssigningLeads(true);

      const response = await patchTokenDataHandler("assignLead", dataToSend);

      toast({
        title: "Success",
        description: response?.message || "Leads assigned successfully",
      });

      // Reset modal state
      setAssignModalOpen(false);
      setAssignUserId('');

      // Refresh leads
      fetchLeads();
    } catch (error: any) {
      console.error("Assign leads error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to assign leads",
        variant: "destructive",
      });
    } finally {
      setAssigningLeads(false);
    }
  };


  const sendNotify = async (leadId:number) => {
    const endpoint = ApiConfig.instantnotify(leadId)
    try{
      await postDataHandlerWithToken(endpoint,null,true)
      toast({
      title:"Successfull",
      description:"call Request sended to Your APP"
    })
    }catch(error){
        toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send instant notify",
        variant: "destructive",
      });
      return false
    }  
    return true
  }
  // View lead details
  const handleViewLead = (lead: LeadType) => {
    setSelectedLead(lead);
    setViewLeadOpen(true);
    fetchLeadHistory(lead.leadId.toString());
  };

  // Edit lead
  const handleEditLead = (lead: LeadType) => {
    setSelectedLead(lead);
    setLeadForm({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      stageId: lead.stageId._id,
      source_campaign: '',
      assignedTo: lead.assignedTo?._id
    });
    setEditLeadOpen(true);
  };

  // Toggle lead selection
  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  // Add bulk lead row
  const addBulkLeadRow = () => {
    setBulkLeads([...bulkLeads, { name: '', phone: '', email: '', source: 'manual', stageId: '696cadcadcbcf508621922e6', assignedTo: '', reason: '' }]);
  };

  // Remove bulk lead row
  const removeBulkLeadRow = (index: number) => {
    if (bulkLeads.length > 1) {
      const newLeads = [...bulkLeads];
      newLeads.splice(index, 1);
      setBulkLeads(newLeads);
    }
  };

  // Update bulk lead row
  const updateBulkLeadRow = (index: number, field: keyof BulkLead, value: string) => {
    const newLeads = [...bulkLeads];
    newLeads[index] = { ...newLeads[index], [field]: value };
    setBulkLeads(newLeads);
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
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'lost':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="w-3 h-3 mr-1" />
            Lost
          </Badge>
        );
      case 'converted':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <TrendingUp className="w-3 h-3 mr-1" />
            Converted
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{status}</Badge>
        );
    }
  };

  // Get source badge
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'facebook':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700">Facebook</Badge>;
      case 'google':
        return <Badge variant="secondary" className="bg-red-50 text-red-700">Google</Badge>;
      case 'manual':
        return <Badge variant="secondary" className="bg-gray-50 text-gray-700">Manual</Badge>;
      case 'api':
        return <Badge variant="secondary" className="bg-purple-50 text-purple-700">API</Badge>;
      default:
        return <Badge variant="secondary">{source}</Badge>;
    }
  };

  // Get action type badge
  const getActionTypeBadge = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return <Badge className="bg-green-100 text-green-800">Created</Badge>;
      case 'updated':
        return <Badge className="bg-blue-100 text-blue-800">Updated</Badge>;
      case 'status_changed':
        return <Badge className="bg-purple-100 text-purple-800">Status Changed</Badge>;
      case 'assigned':
        return <Badge className="bg-yellow-100 text-yellow-800">Assigned</Badge>;
      default:
        return <Badge variant="outline">{actionType}</Badge>;
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      source: 'all',
      stageId: 'all',
      assignedTo: 'all',
      modifiedBy: 'all',
      isActive: 'all',
      sort: 'new',
      dateFilter: 'all',
      fromDate: '',
      toDate: ''
    });
    setPage(1);
  };

  // Toggle assignment mode
  const toggleAssignmentMode = () => {
    setIsAssignmentMode(!isAssignmentMode);
    if (!isAssignmentMode) {
      setSelectedLeads([]);
      setSelectAll(false);
    }
  };

  // Download CSV template
  const downloadCSVTemplate = () => {
    const csvContent = "name,phone,email,source,source_campaign\nJohn Doe,1234567890,john@example.com,source,Summer Campaign";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Export current page to CSV
  const exportCurrentPageToCSV = () => {
    try {
      if (leads.length === 0) {
        toast({
          title: "No Data",
          description: "No leads to export",
          variant: "destructive",
        });
        return;
      }

      // Define CSV headers
      const headers = [
        "ID",
        "Name",
        "Phone",
        "Email",
        "Source",
        "Stage",
        "Status",
        "Health Score",
        "Assigned To",
        "Assigned Email",
        "Created At",
        "Last Modified",
        "Is Active"
      ];

      // Prepare CSV rows from current page data
      const rows = leads.map((lead: LeadType) => [
        lead._id,
        `"${lead.name.replace(/"/g, '""')}"`,
        lead.phone,
        lead.email,
        lead.source,
        lead.stageId?.name || "",
        lead.status,
        lead.healthScore,
        lead.assignedTo?.name || "",
        lead.assignedTo?.email || "",
        lead.assignedTo?.employeeId || "",
        lead.reason || "",
        new Date(lead.createdAt).toLocaleString(),
        new Date(lead.modifiedAt).toLocaleString(),
        lead.isActive ? "Yes" : "No"
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

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const filename = `leads_page_${page}_${timestamp}.csv`;

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `Exported ${leads.length} leads from page ${page}`,
      });

    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export leads",
        variant: "destructive",
      });
    }
  };

  // Export all filtered data to CSV
  const exportToCSV = async () => {
    try {
      // Build query params for all data (no pagination)
      const queryParams: Record<string, any> = {};

      // Apply all active filters (only if not "all")
      if (filters.search && filters.search !== "all") queryParams.search = filters.search;
      if (filters.status && filters.status !== "all") queryParams.status = filters.status;
      if (filters.source && filters.source !== "all") queryParams.source = filters.source;
      if (filters.stageId && filters.stageId !== "all") queryParams.stageId = filters.stageId;
      if (filters.assignedTo && filters.assignedTo !== "all") queryParams.assignedTo = filters.assignedTo;
      if (filters.modifiedBy && filters.modifiedBy !== "all") queryParams.modifiedBy = filters.modifiedBy;

      if (filters.isActive && filters.isActive !== "all") {
        queryParams.isActive = filters.isActive === "true" ? true :
          filters.isActive === "false" ? false : filters.isActive;
      }

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
        description: "Fetching all lead data...",
      });

      const response = await getDataHandlerWithToken("getAllLeads", queryParams, null);

      if (!response?.data) {
        throw new Error("No data to export");
      }

      const leadsData = response.data;

      // Define CSV headers
      const headers = [
        "ID",
        "Name",
        "Phone",
        "Email",
        "Source",
        "Stage",
        "Status",
        "Health Score",
        "Assigned To",
        "Assigned Email",
        "Created At",
        "Last Modified",
        "Is Active"
      ];

      // Prepare CSV rows
      const rows = leadsData.map((lead: LeadType) => [
        lead._id,
        `"${lead.name.replace(/"/g, '""')}"`,
        lead.phone,
        lead.email,
        lead.source,
        lead.stageId?.name || "",
        lead.status,
        lead.healthScore,
        lead.assignedTo?.name || "",
        lead.assignedTo?.email || "",
        lead.assignedTo?.employeeId || "",
        new Date(lead.createdAt).toLocaleString(),
        new Date(lead.modifiedAt).toLocaleString(),
        lead.isActive ? "Yes" : "No"
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
      const filterInfo = [];
      if (filters.search) filterInfo.push(`search-${filters.search}`);
      if (filters.status !== "all") filterInfo.push(`status-${filters.status}`);
      if (filters.source !== "all") filterInfo.push(`source-${filters.source}`);

      const filename = `leads_export_${timestamp}${filterInfo.length > 0 ? `_${filterInfo.join('_')}` : ''}.csv`;

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `Exported ${leadsData.length} leads to CSV`,
      });

    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export leads",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in bg-transparent">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lead Management</h1>
          <p className="text-muted-foreground">Manage and track all leads in your pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission(permissions, 'leads', 'assign') && (
            isAssignmentMode ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50">
                  {selectedLeads.length} leads selected
                </Badge>
                <Button
                  variant="outline"
                  onClick={toggleAssignmentMode}
                  disabled={assigningLeads}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Selection
                </Button>
                <Button
                  onClick={() => setAssignModalOpen(true)}
                  disabled={selectedLeads.length === 0 || assigningLeads}
                >
                  {assigningLeads ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Users className="w-4 h-4 mr-2" />
                  )}
                  Assign Selected ({selectedLeads.length})
                </Button>
              </div>
            ) : (

              <Button onClick={toggleAssignmentMode}>
                <Users className="w-4 h-4 mr-2" />
                Lead Assignments
              </Button>
            )
          )}

           {hasPermission(permissions, 'leads', 'update') && (
    <Button
      variant="outline"
      onClick={() => setDuplicateModalOpen(true)}
    >
      <CopyCheck className="w-4 h-4 mr-2" />
      Find Duplicates
    </Button>
  )}

          {hasPermission(permissions, 'leads', 'create') && (
            <>
              <Dialog open={bulkLeadOpen} onOpenChange={setBulkLeadOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FileUp className="w-4 h-4 mr-2" />
                    Bulk Lead
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Bulk Leads</DialogTitle>
                    <DialogDescription>
                      Add multiple leads at once. Fill in the details for each lead.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {bulkLeads.map((lead, index) => {
                      const hasAssignedUser = lead.assignedTo && lead.assignedTo.trim() !== "" && lead.assignedTo !== " ";
                      return (
                        <Card key={index} className="relative">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">Lead #{index + 1}</CardTitle>
                              {bulkLeads.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeBulkLeadRow(index)}
                                  className="h-6 w-6 p-0"
                                >
                                  ×
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Name *</Label>
                                <Input
                                  value={lead.name}
                                  onChange={(e) => updateBulkLeadRow(index, 'name', e.target.value)}
                                  placeholder="John Doe"
                                  disabled={addingBulkLeads}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Phone *</Label>
                                <Input
                                  value={lead.phone}
                                  onChange={(e) => updateBulkLeadRow(index, 'phone', e.target.value)}
                                  placeholder="1234567890"
                                  disabled={addingBulkLeads}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Email *</Label>
                                <Input
                                  type="email"
                                  value={lead.email}
                                  onChange={(e) => updateBulkLeadRow(index, 'email', e.target.value)}
                                  placeholder="john@company.com"
                                  disabled={addingBulkLeads}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Source *</Label>
                                <Select
                                  value={lead.source}
                                  onValueChange={(value) => updateBulkLeadRow(index, 'source', value)}
                                  disabled={addingBulkLeads}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select source" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="manual">Manual</SelectItem>
                                    <SelectItem value="facebook">Facebook</SelectItem>
                                    <SelectItem value="google">Google</SelectItem>
                                    <SelectItem value="api">API</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Stage *</Label>
                                <Select
                                  value={lead.stageId}
                                  onValueChange={(value) => updateBulkLeadRow(index, 'stageId', value)}
                                  disabled={addingBulkLeads || loadingStages}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select stage" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {loadingStages ? (
                                      <div className="py-2 text-center">
                                        <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                                      </div>
                                    ) : (
                                      stages.map((stage) => (
                                        <SelectItem key={stage._id} value={stage._id}>
                                          {stage.name}
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Campaign (Optional)</Label>
                                <Input
                                  value={lead.source_campaign || ''}
                                  onChange={(e) => updateBulkLeadRow(index, 'source_campaign', e.target.value)}
                                  placeholder="Campaign name"
                                  disabled={addingBulkLeads}
                                />
                              </div>

                              {/* Reason field - only shown when user is assigned */}
                              {hasAssignedUser && (
                                <div className="space-y-2 col-span-2">
                                  <Label htmlFor={`reason-${index}`}>
                                    Reason for Assignment *
                                    <span className="text-xs text-muted-foreground ml-1">
                                      (Required when assigning a user)
                                    </span>
                                  </Label>
                                  <textarea
                                    id={`reason-${index}`}
                                    value={lead.reason || ''}
                                    onChange={(e) => updateBulkLeadRow(index, 'reason', e.target.value)}
                                    placeholder="Enter reason for assigning this lead..."
                                    className="w-full min-h-[60px] p-2 border rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                    disabled={addingBulkLeads}
                                    rows={2}
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    This reason will be recorded in the lead history.
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addBulkLeadRow}
                      disabled={addingBulkLeads}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Another Lead
                    </Button>

                    <div className="pt-4 border-t">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setCsvUploadOpen(true)}
                          disabled={addingBulkLeads}
                          className="flex-1"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload CSV File
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={downloadCSVTemplate}
                          className="flex-1"
                        >
                          <FileDown className="w-4 h-4 mr-2" />
                          Download Template
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        * Required fields
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setBulkLeadOpen(false)} disabled={addingBulkLeads}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddBulkLeads} disabled={addingBulkLeads || !isBulkLeadFormValid()}>
                      {addingBulkLeads ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Create Leads'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={newLeadOpen} onOpenChange={setNewLeadOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Lead
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Lead</DialogTitle>
                    <DialogDescription>
                      Fill in the details to create a new lead.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={leadForm.name}
                          onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                          placeholder="John Doe"
                          disabled={addingLead}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          value={leadForm.phone}
                          onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                          placeholder="1234567890"
                          disabled={addingLead}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={leadForm.email}
                        onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                        placeholder="john@company.com"
                        disabled={addingLead}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="source">Source *</Label>
                        <Select
                          value={leadForm.source}
                          onValueChange={(value) => setLeadForm({ ...leadForm, source: value })}
                          disabled={addingLead}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="google">Google</SelectItem>
                            <SelectItem value="api">API</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="source_campaign">Campaign (Optional)</Label>
                        <Input
                          id="source_campaign"
                          value={leadForm.source_campaign || ''}
                          onChange={(e) => setLeadForm({ ...leadForm, source_campaign: e.target.value })}
                          placeholder="Campaign name"
                          disabled={addingLead}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNewLeadOpen(false)} disabled={addingLead}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddLead} disabled={addingLead}>
                      {addingLead ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Lead'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
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
                    placeholder="Search leads..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Source</Label>
                <Select
                  value={filters.source}
                  onValueChange={(value) => setFilters({ ...filters, source: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
              {hasPermission(permissions, 'user', 'read') && (
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <SearchableDropdown
                  options={[
                    { value: "all", label: "All Users" },
                    ...users.map(user => ({
                      value: user._id,
                      label: user.name,
                      role: user.role.name,
                      empId: user.employeeId
                    }))
                  ]}
                  value={filters.assignedTo}
                  onValueChange={(value) => setFilters({ ...filters, assignedTo: value })}
                  placeholder="All Users"
                  searchPlaceholder="Search user..."
                  emptyMessage="No users found"
                  disabled={loadingUsers}
                />
                </div>
              )}

              <div className="space-y-2">
                <Label>Date Filter</Label>
                <Select
                  value={filters.dateFilter}
                  onValueChange={(value) => setFilters({ ...filters, dateFilter: value })}
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
                  onValueChange={(value) => setFilters({ ...filters, sort: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Newest First</SelectItem>
                    <SelectItem value="old">Oldest First</SelectItem>
                    <SelectItem value="name_asc">Name A-Z</SelectItem>
                    <SelectItem value="name_desc">Name Z-A</SelectItem>
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
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              All Leads ({totalLeads})
              {loading && (
                <span className="ml-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                  Loading...
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-3">
              {isAssignmentMode && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectAll(!selectAll)}
                  >
                    {selectAll ? (
                      <CheckSquare className="w-4 h-4 mr-2" />
                    ) : (
                      <Square className="w-4 h-4 mr-2" />
                    )}
                    {selectAll ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Badge variant="outline" className="bg-blue-50">
                    {selectedLeads.length} selected
                  </Badge>
                </div>
              )}
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
              {hasPermission(permissions, 'leads', 'export') && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" disabled={loading || totalLeads === 0}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={exportToCSV}
                      disabled={loading || totalLeads === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export All Filtered Data ({totalLeads} leads)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={exportCurrentPageToCSV}
                      disabled={loading || leads.length === 0}
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Export Current Page ({leads.length} leads)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Loading leads...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No leads found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or add a new lead.</p>
              <Button className="mt-4" onClick={() => setNewLeadOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Lead
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {isAssignmentMode && (
                      <TableHead className="w-12">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={() => setSelectAll(!selectAll)}
                            className="h-4 w-4"
                          />
                        </div>
                      </TableHead>
                    )}
                    <TableHead>Lead</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Notify Now</TableHead>
                    <TableHead>Assigned To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow
                      key={lead._id}
                      className={cn(
                        isAssignmentMode && selectedLeads.includes(lead._id) && "bg-blue-50",
                        "cursor-pointer hover:bg-muted/50" // Add hover effect
                      )}
                      
                    >
                      {isAssignmentMode && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead._id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleLeadSelection(lead._id);
                            }}
                            className="h-4 w-4"
                          />
                        </TableCell>
                      )}
                      <TableCell
                      onClick={() => {
                        setSelectedLead(lead);
                        setActionsModalOpen(true);
                      }}
                      className='flex justify-center items-center gap-4 border-2 rounded-2xl shadow-lg hover:bg-[#0000002c]'
                      title="click Here"
                      >
                      <MousePointer className='h-3 w-3'/>
                      <div>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {lead.leadId}

                        </div></div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getSourceBadge(lead.source)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {lead.stageId.name}
                        </Badge>
                      </TableCell>
                      {/* <TableCell>{getStatusBadge(lead.status)}</TableCell> */}
                      <TableCell className='flex justify-center items-center'>
                        <PhoneCall onClick={() =>sendNotify(lead.leadId)}/>
                        </TableCell>
                      <TableCell>
                        {lead.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {lead.assignedTo.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium">{lead.assignedTo.name}</div>
                              <div className="text-xs text-muted-foreground">{lead.assignedTo.employeeId}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {leads.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalLeads)} of {totalLeads} leads
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

      {/* CSV Upload Modal */}
      <CSVUploadModal
        open={csvUploadOpen}
        onOpenChange={setCsvUploadOpen}
        users={users}
        onUploadSuccess={() => {
          setCsvUploadOpen(false);
          fetchLeads();
        }}
      />

      {/* Progress Modal */}
      <ProgressModal
        open={progressModalOpen}
        onOpenChange={setProgressModalOpen}
        title="Creating Leads"
        description="Processing bulk lead creation..."
        progressItems={progressItems}
      />

      {/* Assign Leads Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] h-auto overflow-hidden flex flex-col">
          {/* Fixed Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="text-lg sm:text-xl">Assign Leads</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Assign {selectedLeads.length} selected leads to a user
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid gap-4 sm:gap-5">
              {/* User Selection */}
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Select User *</Label>
                <SearchableDropdown
                  options={[
                    { value: "", label: "Select user..." },
                    ...users.map(user => ({
                      value: user._id,
                      label: user.name,
                      role: user.role?.name || user.role,
                      empId: user.employeeId,
                      email: user.email,
                    }))
                  ]}
                  value={assignUserId}
                  onValueChange={setAssignUserId}
                  placeholder="Select user"
                  searchPlaceholder="Search by name, email, or role..."
                  emptyMessage="No users found"
                  disabled={assigningLeads || loadingUsers}
                  allowClear
                  onClear={() => setAssignUserId("")}
                  triggerClassName="h-10 sm:h-11 text-sm sm:text-base"
                  contentClassName="w-full sm:max-w-[var(--radix-popover-trigger-width)]"
                />
              </div>

              {/* Reason Message */}
              <div className="space-y-2">
                <Label htmlFor="assignReason" className="text-sm sm:text-base">
                  Reason for Assignment/Reassignment *
                </Label>
                <textarea
                  id="assignReason"
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                  placeholder="Enter reason for assigning/reassigning these leads..."
                  className="w-full min-h-[80px] sm:min-h-[100px] p-3 border rounded-md text-sm sm:text-base resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={assigningLeads}
                  required
                  rows={4}
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  This reason will be recorded in the lead history.
                </p>
              </div>

              {/* Validation message */}
              {(!assignUserId || !assignReason.trim()) && (
                <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-yellow-800">
                      Please select a user and enter a reason for assignment
                    </p>
                  </div>
                </div>
              )}

              {/* Selected Leads Preview */}
              <div className="p-3 sm:p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm sm:text-base font-medium">
                    Selected Leads ({selectedLeads.length})
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {selectedLeads.length} selected
                  </Badge>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {leads
                    .filter(lead => selectedLeads.includes(lead._id))
                    .slice(0, 6)
                    .map((lead, index) => (
                      <div
                        key={lead._id}
                        className="flex items-center justify-between p-2 bg-background rounded border text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{lead.name || "Unnamed Lead"}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {lead.email || "No email"} • {lead.phone || "No phone"}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                          {lead.stageId?.name || "No stage"}
                        </Badge>
                      </div>
                    ))}

                  {selectedLeads.length > 6 && (
                    <div className="text-center py-2">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        + {selectedLeads.length - 6} more lead{selectedLeads.length - 6 > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  {selectedLeads.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        No leads selected
                      </p>
                    </div>
                  )}
                </div>

                {selectedLeads.length > 0 && (
                  <div className="mt-4 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Stages:</p>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(new Set(
                            leads
                              .filter(lead => selectedLeads.includes(lead._id))
                              .map(lead => lead.stageId?.name)
                              .filter(Boolean)
                          )).slice(0, 3).map((stageName, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {stageName}
                            </Badge>
                          ))}
                          {Array.from(new Set(
                            leads
                              .filter(lead => selectedLeads.includes(lead._id))
                              .map(lead => lead.stageId?.name)
                              .filter(Boolean)
                          )).length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{Array.from(new Set(
                                  leads
                                    .filter(lead => selectedLeads.includes(lead._id))
                                    .map(lead => lead.stageId?.name)
                                    .filter(Boolean)
                                )).length - 3} more
                              </Badge>
                            )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Sources:</p>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(new Set(
                            leads
                              .filter(lead => selectedLeads.includes(lead._id))
                              .map(lead => lead.source)
                              .filter(Boolean)
                          )).slice(0, 3).map((source, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background">
            <div className="flex flex-col relative justify-around sm:flex-row gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setAssignModalOpen(false);
                  setAssignUserId('');
                  setAssignReason('');
                }}
                disabled={assigningLeads}
                className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base px-4 sm:px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignLeads}
                disabled={selectedLeads.length === 0 || assigningLeads || !assignUserId || !assignReason.trim()}
                className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base px-4 sm:px-6"
              >
                {assigningLeads ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Assign Now
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Lead Modal */}
      <Dialog open={viewLeadOpen} onOpenChange={setViewLeadOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle>Lead Details</DialogTitle>
                <DialogDescription>
                  Complete information for {selectedLead.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Lead Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <div className="p-2 bg-muted rounded-md">{selectedLead.name}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <div className="p-2 bg-muted rounded-md">{selectedLead.phone}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="p-2 bg-muted rounded-md">{selectedLead.email}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <div className="p-2 bg-muted rounded-md">
                      {getSourceBadge(selectedLead.source)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Stage</Label>
                    <div className="p-2 bg-muted rounded-md">{selectedLead.stageId.name}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="p-2 bg-muted rounded-md">
                      {getStatusBadge(selectedLead.status)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Health Score</Label>
                    <div className="p-2 bg-muted rounded-md">{selectedLead.healthScore}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Assigned To</Label>
                    <div className="p-2 bg-muted rounded-md">
                      {selectedLead.assignedTo ? selectedLead.assignedTo.name : 'Not assigned'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Created</Label>
                    <div className="p-2 bg-muted rounded-md">{formatDate(selectedLead.createdAt)}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Last Modified</Label>
                    <div className="p-2 bg-muted rounded-md">{formatDate(selectedLead.modifiedAt)}</div>
                  </div>
                </div>

                {/* Lead History */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Lead History</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchLeadHistory(selectedLead.leadId.toString())}
                      disabled={loadingHistory}
                    >
                      {loadingHistory ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {loadingHistory ? (
                    <div className="text-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      <p className="mt-2 text-sm text-muted-foreground">Loading history...</p>
                    </div>
                  ) : leadHistory.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No history found for this lead.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {leadHistory.map((history) => (
                        <div key={history._id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getActionTypeBadge(history.actionType)}
                              <span className="text-sm text-muted-foreground">
                                by {history.actionBy.name}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(history.createdAt)}
                            </span>
                          </div>

                          {history.actionType === 'assigned' && (
                            <div className="text-sm">
                              {history.fromUser ? (
                                <p>Reassigned from {history.fromUser.name} to {history.toUser?.name}</p>
                              ) : (
                                <p>Assigned to {history.toUser?.name}</p>
                              )}
                              {history.reason ? (
                                <p>Reason : {history.reason}</p>
                              ) : (
                                <p>Reason not given</p>
                              )}
                            </div>
                          )}

                          {history.actionType === 'status_changed' && (
                            <div className="text-sm">
                              Status changed from{' '}
                              <Badge variant="outline" className="mx-1">
                                {history.changes.status?.from}
                              </Badge>
                              to{' '}
                              <Badge variant="outline" className="mx-1">
                                {history.changes.status?.to}
                              </Badge>
                            </div>
                          )}

                          {history.actionType === 'updated' && history.changes.from && history.changes.to && (
                            <div className="text-sm space-y-1">
                              {Object.keys(history.changes.from).map((key) => {
                                if (key === '__v' || key === '_id' || key === 'createdAt' || key === 'updatedAt') {
                                  return null;
                                }
                                if (history.changes.from[key] !== history.changes.to[key]) {
                                  return (
                                    <div key={key} className="flex items-center gap-2">
                                      <span className="font-medium">{key}:</span>
                                      <span className="line-through text-muted-foreground">
                                        {String(history.changes.from[key])}
                                      </span>
                                      <span>→</span>
                                      <span>{String(history.changes.to[key])}</span>
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewLeadOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Lead Modal */}
      <Dialog open={editLeadOpen} onOpenChange={setEditLeadOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update the lead information for {selectedLead?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                  placeholder="John Doe"
                  disabled={updatingLead}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                  placeholder="1234567890"
                  disabled={updatingLead}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={leadForm.email}
                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                placeholder="john@company.com"
                disabled={updatingLead}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-source">Source</Label>
                <Select
                  value={leadForm.source}
                  onValueChange={(value) => setLeadForm({ ...leadForm, source: value })}
                  disabled={updatingLead}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-source_campaign">Campaign (Optional)</Label>
                <Input
                  id="edit-source_campaign"
                  value={leadForm.source_campaign}
                  onChange={(e) => setLeadForm({ ...leadForm, source_campaign: e.target.value })}
                  placeholder="Campaign name"
                  disabled={updatingLead}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLeadOpen(false)} disabled={updatingLead}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLead} disabled={updatingLead}>
              {updatingLead ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Lead'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle>Change Lead Status</DialogTitle>
                <DialogDescription>
                  Update status for {selectedLead.name}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Select Status</Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value: any) => setSelectedStatus(value)}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Active
                        </div>
                      </SelectItem>
                      <SelectItem value="lost">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          Lost
                        </div>
                      </SelectItem>
                      <SelectItem value="converted">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          Converted
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    Current status:{' '}
                    <Badge variant="outline" className="ml-2">
                      {selectedLead.status}
                    </Badge>
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStatusModalOpen(false)} disabled={updatingStatus}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateStatus} disabled={updatingStatus}>
                  {updatingStatus ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>


      {/* Lead Actions Modal */}
      <Dialog open={actionsModalOpen} onOpenChange={setActionsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedLead && (
            <>
              <DialogHeader>
                <DialogTitle>Lead Actions</DialogTitle>
                <DialogDescription>
                  Select an action for {selectedLead.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {hasPermission(permissions, 'leads', 'read') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActionsModalOpen(false);
                        handleViewLead(selectedLead);
                      }}
                      className="h-auto py-4 justify-start"
                    >
                      <div className="flex items-center gap-3">
                        <Eye className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-medium">View Details</div>
                          <div className="text-xs text-muted-foreground">View complete lead information</div>
                        </div>
                      </div>
                    </Button>
                  )}

                  {hasPermission(permissions, 'leads', 'update') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActionsModalOpen(false);
                        handleEditLead(selectedLead);
                      }}
                      className="h-auto py-4 justify-start"
                    >
                      <div className="flex items-center gap-3">
                        <Edit className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-medium">Edit Lead</div>
                          <div className="text-xs text-muted-foreground">Update lead information</div>
                        </div>
                      </div>
                    </Button>
                  )}

                  {hasPermission(permissions, 'leads', 'status_change') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActionsModalOpen(false);
                        setSelectedStatus(selectedLead.status);
                        setStatusModalOpen(true);
                      }}
                      className="h-auto py-4 justify-start"
                    >
                      <div className="flex items-center gap-3">
                        {selectedLead.status === 'active' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : selectedLead.status === 'lost' ? (
                          <XCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                        )}
                        <div className="text-left">
                          <div className="font-medium">Change Status</div>
                          <div className="text-xs text-muted-foreground">Update lead status</div>
                        </div>
                      </div>
                    </Button>
                  )}

                  {hasPermission(permissions, 'leads', 'stage_change') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActionsModalOpen(false);
                        setChangeStageModalOpen(true);
                      }}
                      className="h-auto py-4 justify-start"
                    >
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <div className="text-left">
                          <div className="font-medium">Change Stage</div>
                          <div className="text-xs text-muted-foreground">Move to different stage</div>
                        </div>
                      </div>
                    </Button>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Quick Info</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Current Stage:</span>
                      <Badge variant="outline" className="ml-2">
                        {selectedLead.stageId.name}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-2">
                        {getStatusBadge(selectedLead.status)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Source:</span>
                      <span className="ml-2">
                        {getSourceBadge(selectedLead.source)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Assigned:</span>
                      <span className="ml-2">
                        {selectedLead.assignedTo?.name || 'Not assigned'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setActionsModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Stage Modal */}
      <ChangeStageModal
        open={changeStageModalOpen}
        onOpenChange={setChangeStageModalOpen}
        selectedLead={selectedLead}
        stages={stages}
        loadingStages={loadingStages}
        changingStage={changingStage}
        onSubmit={handleStageSubmit}
      />

      <DuplicateLeadsModal
  open={duplicateModalOpen}
  onOpenChange={setDuplicateModalOpen}
  onMergeSuccess={() => {
    fetchLeads(); // Refresh leads after merge
  }}
/>
    </div>
  );
}