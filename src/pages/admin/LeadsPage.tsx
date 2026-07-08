import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Calendar,
  Upload,
  X,
  Clock,
  User,
  ClipboardList,
  Video,
  CheckCircle,
  XCircle,
  TrendingUp,
  Phone,
  Mail,
  CheckSquare,
  AlarmClock,
  PhoneCall,
  Filter,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ListTodo,
  AlertTriangle,
  Database
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
import { ChangeStageModal } from '@/components/ChangeStageModal';
import { LeadActionsModal } from '@/components/LeadActionsModal';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { DuplicateLeadsModal } from '@/components/modal/DuplicateLeadsModal';
import { CopyCheck } from 'lucide-react';
import { PoolType } from '@/types/user';
import { useNavigate } from 'react-router-dom';
interface LeadType {
  _id: string;
  leadId: number;
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  source: string;
  source_campaign?: string;
  stageId: {
    _id: string;
    name: string;
    order: number;
  };
  poolId?: {
    _id: string;
    name: string;
  } | string;
  status: 'active' | 'lost' | 'converted';
  healthScore: number;
  modifiedBy: string;
  modifiedAt: string;
  isActive: boolean;
  createdAt: string;
  lastCallDate: string;
  updatedAt: string;
  __v: number;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    employeeId: number
  };
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
  status: string;
  profile?: {
    departmentId?: {
      _id: string;
      name: string;
    };
  };
}

interface LeadForm {
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  source: string;
  stageId: string;
  source_campaign?: string;
  assignedTo?: string;
  poolId?: string;
}

interface BulkLead {
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  source: string;
  stageId: string;
  source_campaign?: string;
  assignedTo?: string;
  poolId?: string;
}

interface Filters {
  search: string;
  status: string;
  source: string;
  source_compain: string;
  stageId: string;
  poolId: string;
  location: string;
  assignedTo: string;
  modifiedBy: string;
  isActive: string;
  sort: string;
  dateFilter: string;
  fromDate: string;
  toDate: string;
  assignedDateFilter: string;
  assignedDateFrom: string;
  assignedDateTo: string;
}

interface ProgressItem {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
}

export function LeadsPage() {
  const [leads, setLeads] = useState<LeadType[]>([]);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState<StageType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [leadHistory, setLeadHistory] = useState<LeadHistoryType[]>([]);
  const [assignReason, setAssignReason] = useState('');
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  // Add near other state declarations (around line 180)
  const [bulkSearchOpen, setBulkSearchOpen] = useState(false);
  const [bulkSearchInput, setBulkSearchInput] = useState('');
  const [bulkSearchLoading, setBulkSearchLoading] = useState(false);
  const [changePoolModalOpen, setChangePoolModalOpen] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string>('');
  const [changingPool, setChangingPool] = useState(false);
  // Filters
  const [pools, setPools] = useState<PoolType[]>([]);
  const [loadingPools, setLoadingPools] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
const [followUpLead, setFollowUpLead] = useState<LeadType | null>(null);
const [followUpDateTime, setFollowUpDateTime] = useState('');
const [addingFollowUp, setAddingFollowUp] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    source: 'all',
    source_compain: '',
    stageId: 'all',
    assignedTo: 'all',
    poolId: 'all',
    location: '',
    modifiedBy: 'all',
    isActive: 'all',
    sort: 'new',
    dateFilter: 'all',
    fromDate: '',
    toDate: '',
    assignedDateFilter: 'all',
    assignedDateFrom: '',
    assignedDateTo: ''
  });

  // Modal states
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [bulkLeadOpen, setBulkLeadOpen] = useState(false);
  const [csvUploadOpen, setCsvUploadOpen] = useState(false);
  const [viewLeadOpen, setViewLeadOpen] = useState(false);
  const [editLeadOpen, setEditLeadOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [changeStageModalOpen, setChangeStageModalOpen] = useState(false);
  const [actionsModalOpen, setActionsModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadType | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'lost' | 'converted'>('active');
  const [selectedUser, setSelectedUser] = useState<string>('');

  // Selection states
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isAssignmentMode, setIsAssignmentMode] = useState(false);

  // Form states
  const [leadForm, setLeadForm] = useState<LeadForm>({
    name: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    source: 'manual',
    stageId: '',
    source_campaign: '',
    assignedTo: '',
    poolId: ''
  });
const navigate = useNavigate();
  const [bulkLeads, setBulkLeads] = useState<BulkLead[]>([
    { name: '', phone: '', email: '', city: '', state: '', source: 'manual', stageId: '', assignedTo: '', poolId: '' }
  ]);

  // Progress tracking
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);

  // Loading states
  const [addingLead, setAddingLead] = useState(false);
  const [addingBulkLeads, setAddingBulkLeads] = useState(false);
  const [updatingLead, setUpdatingLead] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [changingStage, setChangingStage] = useState(false);
  const [assigningLeads, setAssigningLeads] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingStages, setLoadingStages] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Filter visibility
  const [showFilters, setShowFilters] = useState(false);

  const [assignUserId, setAssignUserId] = useState<string>('');


  // Handle bulk search
  const handleBulkSearch = async () => {
    if (!bulkSearchInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one Lead ID or Phone Number",
        variant: "destructive",
      });
      return;
    }

    try {
      setBulkSearchLoading(true);

      // Parse the input - split by comma and trim
      const searchValues = bulkSearchInput
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      if (searchValues.length === 0) {
        toast({
          title: "Error",
          description: "No valid search values found",
          variant: "destructive",
        });
        return;
      }

      // Join values with comma for the API
      const bulkSearchParam = searchValues.join(',');

      // Build query params with bulk search
      const queryParams: Record<string, any> = {
        bulkSearch: bulkSearchParam,
        page: 1,
        limit: 100 // Show more results for bulk search
      };

      // Apply other active filters (optional - you can decide to keep or ignore other filters)
      if (filters.status && filters.status !== "all") queryParams.status = filters.status;
      if (filters.source && filters.source !== "all") queryParams.source = filters.source;
      if (filters.stageId && filters.stageId !== "all") queryParams.stageId = filters.stageId;
      if (filters.poolId && filters.poolId !== "all") queryParams.poolId = filters.poolId;

      const response = await getDataHandlerWithToken("getAllLeads", queryParams, null);

      if (response?.data) {
        setLeads(response.data);
        setTotalLeads(response.meta.total);
        setTotalPages(response.meta.totalPages);
        setPage(1); // Reset to first page

        toast({
          title: "Bulk Search Complete",
          description: `Found ${response.data.length} leads matching your search`,
        });
      }

      // Close modal after search
      setBulkSearchOpen(false);
      setBulkSearchInput('');

    } catch (error: any) {
      console.error("Bulk search error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to perform bulk search",
        variant: "destructive",
      });
    } finally {
      setBulkSearchLoading(false);
    }
  };


  // Build query params
  const buildQueryParams = () => {
    const params: Record<string, any> = {};
    params.page = page;
    params.limit = limit;
    if (filters.search && filters.search !== "all") params.search = filters.search;
    if (filters.status && filters.status !== "all") params.status = filters.status;
    if (filters.source && filters.source !== "all") params.source = filters.source;
    if (filters.source_compain && filters.source_compain !== "all") params.source_compain = filters.source_compain;
    if (filters.stageId && filters.stageId !== "all") params.stageId = filters.stageId;
    if (filters.poolId && filters.poolId !== "all") params.poolId = filters.poolId;
    if (filters.location) params.location = filters.location;
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
    if (filters.assignedDateFilter && filters.assignedDateFilter !== "all") params.assignedDateFilter = filters.assignedDateFilter;
    if (filters.assignedDateFrom && filters.assignedDateFrom !== "all") params.assignedDateFrom = filters.assignedDateFrom;
    if (filters.assignedDateTo && filters.assignedDateTo !== "all") params.assignedDateTo = filters.assignedDateTo;

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

  // Fetch pools
  const fetchPools = async () => {
    try {
      setLoadingPools(true);
      const response = await getDataHandlerWithToken("getAllPools", null, null);
      if (response) {
        setPools(response);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch pools",
        variant: "destructive",
      });
    } finally {
      setLoadingPools(false);
    }
  };

  // Fetch stages
  const fetchStages = async () => {
    try {
      setLoadingStages(true);
      const response = await getDataHandlerWithToken("getAllStages", null, null);
      if (response) {
        setStages(response);
        // Set default stage if stages exist and leadForm.stageId is empty
        if (response.length > 0 && !leadForm.stageId) {
          setLeadForm(prev => ({ ...prev, stageId: response[0]._id }));
        }
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
      const response = await getDataHandlerWithToken("getAllProfile", null, null);
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

  const handleAddFollowUp = async () => {
  if (!followUpLead || !followUpDateTime) {
    toast({ title: "Error", description: "Please select date and time", variant: "destructive" });
    return;
  }
  try {
    setAddingFollowUp(true);
    await postDataHandlerWithToken(ApiConfig.getFollowUp, {
      leadId: followUpLead.leadId,
      scheduledAt: new Date(followUpDateTime).toISOString(),
    },true);
    toast({ title: "Success", description: "Follow-up scheduled" });
    setFollowUpModalOpen(false);
    setFollowUpLead(null);
    setFollowUpDateTime('');
  } catch (error: any) {
    toast({ title: "Error", description: error.response?.data?.message || "Failed to schedule follow-up", variant: "destructive" });
  } finally {
    setAddingFollowUp(false);
  }
};

  // Initialize data
  useEffect(() => {
    fetchLeads();
    fetchStages();
    fetchUsers();
    fetchPools();
  }, [page, limit, filters]);

  // Reset selection when leads change
  useEffect(() => {
    if (!isAssignmentMode) {
      setSelectedLeads([]);
      setSelectAll(false);
    }
  }, [leads]);

  const handleSelectAll = () => {
    if (selectAll) {
      // Uncheck: remove current page leads from selection
      const currentPageIds = new Set(leads.map(l => l._id));
      setSelectedLeads(prev => prev.filter(id => !currentPageIds.has(id)));
      setSelectAll(false);
    } else {
      setSelectAll(true);
    }
  };

  // Handle select all
  useEffect(() => {
    if (selectAll) {
      const currentPageIds = leads.map(lead => lead._id);
      // Add current page leads to existing selections
      setSelectedLeads(prev => Array.from(new Set([...prev, ...currentPageIds])));
    }
    // Don't clear on selectAll = false here, let the checkbox handler do it
  }, [selectAll, leads]);

  // Add new lead
  const handleAddLead = async () => {
    try {
      setAddingLead(true);
      const dataToSend = { ...leadForm };
      // Remove assignedTo if empty
      if (!dataToSend.assignedTo) {
        delete dataToSend.assignedTo;
        // delete dataToSend.reason;
      }
      if (!dataToSend.poolId) {
        delete dataToSend.poolId;
      }
      console.log(dataToSend)

      const response = await postDataHandlerWithToken("createNewLead", dataToSend);

      toast({
        title: "Success",
        description: response?.message || "Lead created successfully",
      });

      setLeadForm({
        name: '',
        phone: '',
        email: '',
        city: '',
        state: '',
        source: 'manual',
        stageId: stages[0]?._id || '',
        source_campaign: '',
        assignedTo: '',
        poolId: ''
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

  // Add bulk leads with progress tracking
  const handleAddBulkLeads = async () => {
    try {
      setAddingBulkLeads(true);
      setProgressModalOpen(true);

      const validLeads = bulkLeads.filter(lead =>
        lead.name && lead.phone && lead.email && lead.city && lead.state && lead.stageId
      );

      if (validLeads.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one valid lead",
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
          const dataToSend = { ...lead };
          // Remove assignedTo if empty
          if (!dataToSend.assignedTo) {
            delete dataToSend.assignedTo;
          }
          if (!dataToSend.poolId) {
            delete dataToSend.poolId;
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
        setBulkLeads([{ name: '', phone: '', email: '', city: '', state: '', source: 'manual', stageId: stages[0]?._id || '', assignedTo: '' }]);
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
      const dataToSend = { ...leadForm };

      // Remove empty fields
      if (!dataToSend.assignedTo) {
        delete dataToSend.assignedTo;
      }
      if (!dataToSend.poolId) {
        delete dataToSend.poolId;
      }
      if (!dataToSend.source_campaign) {
        delete dataToSend.source_campaign;
      }
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

  // Update lead stage
  const handleChangeStage = async (leadId: string, stageId: string) => {
    try {
      setChangingStage(true);
      const endpoint = ApiConfig.changeStageLead(leadId);
      const response = await patchTokenDataHandler(endpoint, { stageId }, true);

      toast({
        title: "Success",
        description: response?.message || "Lead stage updated successfully",
      });

      setChangeStageModalOpen(false);
      fetchLeads();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update lead stage",
        variant: "destructive",
      });
      throw error;
    } finally {
      setChangingStage(false);
    }
  };

  // Handle stage change from modal
  const handleStageSubmit = async (leadId: string, stageId: string) => {
    await handleChangeStage(leadId, stageId);
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

    if (!assignUserId) {
      toast({
        title: "Error",
        description: "Please select a user",
        variant: "destructive",
      });
      return;
    }

    if (!assignReason.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reason for assignment",
        variant: "destructive",
      });
      return;
    }

    // Prepare data for API
    const dataToSend: any = {
      leadIds: selectedLeads,
      assignedTo: assignUserId,
      reason: assignReason.trim() // Add reason to the request
    };

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
      setAssignReason('');
      setSelectedLeads([]);
      setIsAssignmentMode(false);

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

  const handleChangePool = async () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one lead",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPoolId) {
      toast({
        title: "Error",
        description: "Please select a pool",
        variant: "destructive",
      });
      return;
    }

    try {
      setChangingPool(true);
      const response = await patchTokenDataHandler("poolChange", {
        leadIds: selectedLeads,
        poolId: selectedPoolId
      });

      toast({
        title: "Success",
        description: response?.message || "Leads moved to pool successfully",
      });

      setChangePoolModalOpen(false);
      setSelectedPoolId('');
      setSelectedLeads([]);
      setIsAssignmentMode(false);
      fetchLeads(); // Refresh leads
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to change pool",
        variant: "destructive",
      });
    } finally {
      setChangingPool(false);
    }
  };
  // View lead details
  const handleViewLead = (lead: LeadType) => {
    setSelectedLead(lead);
    setViewLeadOpen(true);
    fetchLeadHistory(lead.leadId.toString());
  };

  // Edit lead
  const handleEditLead = (lead: LeadType) => {
    setSelectedLead(lead);

    // Safely handle poolId which could be null, string, or object
    let poolIdValue = '';
    if (lead.poolId) {
      if (typeof lead.poolId === 'object') {
        poolIdValue = lead.poolId._id;
      } else {
        poolIdValue = lead.poolId;
      }
    }

    setLeadForm({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      city: lead.city || '',
      state: lead.state || '',
      source: lead.source,
      stageId: lead.stageId._id,
      source_campaign: '',
      assignedTo: lead.assignedTo?._id || '',
      poolId: poolIdValue
    });
    setEditLeadOpen(true);
  };

  // Lead actions
  const leadActions = {
    onView: (lead: LeadType) => {
      handleViewLead(lead);
    },
    onEdit: (lead: LeadType) => {
      handleEditLead(lead);
    },
    onChangeStatus: (lead: LeadType) => {
      setSelectedLead(lead);
      setSelectedStatus(lead.status);
      setStatusModalOpen(true);
    },
    onChangeStage: (lead: LeadType) => {
      setSelectedLead(lead);
      setChangeStageModalOpen(true);
    },
    onAssign: (lead: LeadType) => {
      setSelectedLead(lead);
      setSelectedLeads([lead._id]);
      setIsAssignmentMode(true);
      setAssignModalOpen(true);
    },
    onConvert: (lead: LeadType) => {
      setSelectedLead(lead);
      setSelectedStatus('converted');
      setStatusModalOpen(true);
    }
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
    setBulkLeads([...bulkLeads, { name: '', phone: '', email: '', city: '', state: '', source: 'manual', stageId: stages[0]?._id || '', assignedTo: '' }]);
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
  const formatDate = (dateString?: string | null) => {
    if (!dateString) {
      return 'No Calls Yet';
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);

    return `${day}-${month}-${year}`;
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
      source_compain: '',
      stageId: 'all',
      poolId: 'all',
      location: '',
      assignedTo: 'all',
      modifiedBy: 'all',
      isActive: 'all',
      sort: 'new',
      dateFilter: 'all',
      fromDate: '',
      toDate: '',
      assignedDateFilter: 'all',
      assignedDateFrom: '',
      assignedDateTo: ''
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
    const csvContent = "name,phone,email,city,state,source,source_campaign\nJohn Doe,1234567890,john@example.com,Lucknow,Uttar Pradesh,manual,Summer Campaign";
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
        "City",
        "State",
        "Source",
        "Stage",
        "Pool",
        "Status",
        "Health Score",
        "Assigned To",
        "Assigned Email",
        "Assigned Employee ID",
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
        lead.city || "N/A",
        lead.state || "N/A",
        lead.source,
        lead.stageId?.name || "",
        typeof lead.poolId === 'object' ? lead.poolId.name : (lead.poolId || ""),
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
      if (filters.location) queryParams.location = filters.location;
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
      if (filters.assignedDateFilter && filters.assignedDateFilter !== "all") queryParams.assignedDateFilter = filters.assignedDateFilter;
      if (filters.assignedDateFrom && filters.assignedDateFrom !== "all") queryParams.assignedDateFrom = filters.assignedDateFrom;
      if (filters.assignedDateTo && filters.assignedDateTo !== "all") queryParams.assignedDateTo = filters.assignedDateTo;

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
        "City",
        "State",
        "Source",
        "Stage",
        "Pool",
        "Status",
        "Health Score",
        "Assigned To",
        "Assigned Email",
        "Assigned Employee ID",
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
        lead.city || "N/A",
        lead.state || "N/A",
        lead.source,
        lead.stageId?.name || "",
        typeof lead.poolId === 'object' ? lead.poolId.name : (lead.poolId || ""),
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
    <div className="space-y-4 animate-fade-in bg-transparent">
      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div>
    <h1 className="text-xl font-bold text-slate-800">Lead Management</h1>
  </div>

  <div className="flex flex-wrap items-center gap-2">
    {isAssignmentMode ? (
      <>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 rounded-lg">
          {selectedLeads.length} leads selected
        </Badge>
        <Button
          variant="outline"
          onClick={toggleAssignmentMode}
          disabled={assigningLeads}
          className="rounded-xl border-slate-200 hover:bg-slate-50"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel Selection
        </Button>
        <Button
          onClick={() => setAssignModalOpen(true)}
          disabled={selectedLeads.length === 0 || assigningLeads}
          className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
        >
          {assigningLeads ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
          Assign Selected ({selectedLeads.length})
        </Button>
        <Button
          onClick={() => setChangePoolModalOpen(true)}
          disabled={selectedLeads.length === 0 || changingPool}
          variant="outline"
          className="rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
        >
          <Database className="w-4 h-4 mr-2" />
          Change Pool ({selectedLeads.length})
        </Button>
      </>
    ) : (
      <Button
        onClick={toggleAssignmentMode}
        className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
      >
        <Users className="w-4 h-4 mr-2" />
        Select Lead
      </Button>
    )}

    <Button
      variant="outline"
      onClick={() => setDuplicateModalOpen(true)}
      className="rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
    >
      <CopyCheck className="w-4 h-4 mr-2" />
      Find Duplicates
    </Button>

    <Button
      variant="outline"
      onClick={() => setBulkSearchOpen(true)}
      className="rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
    >
      <Search className="w-4 h-4 mr-2" />
      Bulk Search
    </Button>

    {/* Bulk Lead Modal */}
      <Dialog open={bulkLeadOpen} onOpenChange={setBulkLeadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200">
                <FileUp className="w-4 h-4 mr-2" />
                Bulk Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] rounded-2xl border-slate-200 p-0 overflow-hidden">
              {/* Header */}
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
                <DialogTitle className="text-xl font-bold text-slate-800">Add Bulk Leads</DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Add multiple leads at once. Fill in the details for each lead.
                </DialogDescription>
              </DialogHeader>

              {/* Scrollable Body */}
              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  {bulkLeads.map((lead, index) => (
                    <Card key={index} className="relative rounded-xl border-slate-200 shadow-sm">
                      <CardHeader className="pb-3 pt-4 px-5">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold text-slate-700">Lead #{index + 1}</CardTitle>
                          {bulkLeads.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBulkLeadRow(index)}
                              className="h-6 w-6 p-0 rounded-lg hover:bg-red-50 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 px-5 pb-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700">Name *</Label>
                            <Input
                              value={lead.name}
                              onChange={(e) => updateBulkLeadRow(index, 'name', e.target.value)}
                              placeholder="John Doe"
                              disabled={addingBulkLeads}
                              className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700">Phone *</Label>
                            <Input
                              value={lead.phone}
                              onChange={(e) => updateBulkLeadRow(index, 'phone', e.target.value)}
                              placeholder="1234567890"
                              disabled={addingBulkLeads}
                              className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700">Email *</Label>
                            <Input
                              type="email"
                              value={lead.email}
                              onChange={(e) => updateBulkLeadRow(index, 'email', e.target.value)}
                              placeholder="john@company.com"
                              disabled={addingBulkLeads}
                              className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700">City *</Label>
                            <Input
                              value={lead.city}
                              onChange={(e) => updateBulkLeadRow(index, 'city', e.target.value)}
                              placeholder="Enter city"
                              disabled={addingBulkLeads}
                              className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700">State *</Label>
                            <Input
                              value={lead.state}
                              onChange={(e) => updateBulkLeadRow(index, 'state', e.target.value)}
                              placeholder="Enter state"
                              disabled={addingBulkLeads}
                              className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700">Source *</Label>
                            <Select
                              value={lead.source}
                              onValueChange={(value) => updateBulkLeadRow(index, 'source', value)}
                              disabled={addingBulkLeads}
                            >
                              <SelectTrigger className="h-10 rounded-xl border-slate-200">
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="manual">Manual</SelectItem>
                                <SelectItem value="facebook">Facebook</SelectItem>
                                <SelectItem value="google">Google</SelectItem>
                                <SelectItem value="positive">Positive</SelectItem>
                                <SelectItem value="refurbished">Refurbished</SelectItem>
                                <SelectItem value="api">API</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700">Stage *</Label>
                            <Select
                              value={lead.stageId}
                              onValueChange={(value) => updateBulkLeadRow(index, 'stageId', value)}
                              disabled={addingBulkLeads || loadingStages}
                            >
                              <SelectTrigger className="h-10 rounded-xl border-slate-200">
                                <SelectValue placeholder="Select stage" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl max-h-60">
                                {loadingStages ? (
                                  <div className="py-2 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
                                ) : (
                                  stages.map((stage) => (
                                    <SelectItem key={stage._id} value={stage._id}>{stage.name}</SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                              <Database className="w-4 h-4" /> Pool
                            </Label>
                            <Select
                              value={lead.poolId || ""}
                              onValueChange={(value) => updateBulkLeadRow(index, 'poolId', value)}
                              disabled={addingBulkLeads || loadingPools}
                            >
                              <SelectTrigger className="h-10 rounded-xl border-slate-200">
                                <SelectValue placeholder="Select pool" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl max-h-60">
                                <SelectItem value=" ">No Pool</SelectItem>
                                {loadingPools ? (
                                  <div className="py-2 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
                                ) : (
                                  pools.filter(pool => pool.isActive).map((pool) => (
                                    <SelectItem key={pool._id} value={pool._id}>{pool.name}</SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700">Campaign (Optional)</Label>
                            <Input
                              value={lead.source_campaign || ''}
                              onChange={(e) => updateBulkLeadRow(index, 'source_campaign', e.target.value)}
                              placeholder="Campaign name"
                              disabled={addingBulkLeads}
                              className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addBulkLeadRow}
                    disabled={addingBulkLeads}
                    className="w-full rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Lead
                  </Button>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setCsvUploadOpen(true)}
                        disabled={addingBulkLeads}
                        className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload CSV File
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={downloadCSVTemplate}
                        className="flex-1 rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600"
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        Download Template
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 text-center mt-2">
                      * Required fields
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setBulkLeadOpen(false)}
                    disabled={addingBulkLeads}
                    className="flex-1 sm:flex-none rounded-xl border-slate-200 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddBulkLeads}
                    disabled={addingBulkLeads}
                    className="flex-1 sm:flex-none rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {addingBulkLeads ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                      'Create Leads'
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

    {/* Add New Lead Modal */}
    <Dialog open={newLeadOpen} onOpenChange={setNewLeadOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add New Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
                <DialogTitle className="text-xl font-bold text-slate-800">Add New Lead</DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Fill in the details to create a new lead.
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">Name *</Label>
                      <Input
                        value={leadForm.name}
                        onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                        placeholder="John Doe"
                        disabled={addingLead}
                        className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">Phone *</Label>
                      <Input
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                        placeholder="1234567890"
                        disabled={addingLead}
                        className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Email *</Label>
                    <Input
                      type="email"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      placeholder="john@company.com"
                      disabled={addingLead}
                      className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">City *</Label>
                      <Input
                        value={leadForm.city}
                        onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })}
                        placeholder="Enter city"
                        disabled={addingLead}
                        className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">State *</Label>
                      <Input
                        value={leadForm.state}
                        onChange={(e) => setLeadForm({ ...leadForm, state: e.target.value })}
                        placeholder="Enter state"
                        disabled={addingLead}
                        className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">Source *</Label>
                      <Select
                        value={leadForm.source}
                        onValueChange={(value) => setLeadForm({ ...leadForm, source: value })}
                        disabled={addingLead}
                      >
                        <SelectTrigger className="h-10 rounded-xl border-slate-200">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                          <SelectItem value="positive">Positive</SelectItem>
                          <SelectItem value="refurbished">Refurbished</SelectItem>
                          <SelectItem value="api">API</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-slate-700">Campaign (Optional)</Label>
                      <Input
                        value={leadForm.source_campaign || ''}
                        onChange={(e) => setLeadForm({ ...leadForm, source_campaign: e.target.value })}
                        placeholder="Campaign name"
                        disabled={addingLead}
                        className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Stage *</Label>
                    <Select
                      value={leadForm.stageId}
                      onValueChange={(value) => setLeadForm({ ...leadForm, stageId: value })}
                      disabled={addingLead || loadingStages}
                    >
                      <SelectTrigger className="h-10 rounded-xl border-slate-200">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-60">
                        {loadingStages ? (
                          <div className="py-2 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
                        ) : (
                          stages.map((stage) => (
                            <SelectItem key={stage._id} value={stage._id}>{stage.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Database className="w-4 h-4" /> Pool
                    </Label>
                    <Select
                      value={leadForm.poolId || ""}
                      onValueChange={(value) => setLeadForm({ ...leadForm, poolId: value })}
                      disabled={addingLead || loadingPools}
                    >
                      <SelectTrigger className="h-10 rounded-xl border-slate-200">
                        <SelectValue placeholder="Select pool" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-60">
                        <SelectItem value=" ">No Pool</SelectItem>
                        {loadingPools ? (
                          <div className="py-2 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
                        ) : (
                          pools.map((pool) => (
                            <SelectItem key={pool._id} value={pool._id}>{pool.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Assign To (Optional)</Label>
                    <SearchableDropdown
                      options={[
                        { value: "", label: "Not assigned" },
                        ...users.map((user) => ({
                          value: user._id,
                          label: user.name,
                          role: user.role?.name,
                          empId: user.employeeId,
                          email: user.email,
                          department: user.profile?.departmentId?.name
                        }))
                      ]}
                      value={leadForm.assignedTo || ""}
                      onValueChange={(value) => setLeadForm({ ...leadForm, assignedTo: value })}
                      placeholder="Select user"
                      searchPlaceholder="Search user by name..."
                      emptyMessage="No users found"
                      disabled={addingLead || loadingUsers}
                      allowClear
                      onClear={() => setLeadForm({ ...leadForm, assignedTo: "" })}
                      triggerClassName="h-10 rounded-xl border-slate-200"
                      contentClassName="rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setNewLeadOpen(false)}
                    disabled={addingLead}
                    className="flex-1 sm:flex-none rounded-xl border-slate-200 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddLead}
                    disabled={addingLead || !leadForm.name || !leadForm.phone || !leadForm.email || !leadForm.city || !leadForm.state || !leadForm.stageId}
                    className="flex-1 sm:flex-none rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {addingLead ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                    ) : (
                      'Create Lead'
                    )}
                  </Button>
                </div>
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
    className="flex items-center gap-2 rounded-xl border-slate-200"
  >
    <Filter className="w-4 h-4" />
    {showFilters ? 'Hide Filters' : 'Show Filters'}
    {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
  </Button>

  {showFilters && (
    <Button variant="outline" size="sm" onClick={resetFilters} className="rounded-xl">
      <RefreshCw className="w-4 h-4 mr-2" /> Reset Filters
    </Button>
  )}
</div>

{showFilters && (
  <Card className="rounded-xl border-slate-200 shadow-sm">
    <CardContent className="p-4 space-y-4">
      {/* Row 1: Search, Status, Source */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Name, phone, email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-8 h-9 text-sm rounded-lg border-slate-200 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Source</Label>
          <Select
            value={filters.source}
            onValueChange={(value) => setFilters({ ...filters, source: value })}
          >
            <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200">
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="refurbished">Refurbished</SelectItem>
              <SelectItem value="api">API</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Stage, Location, Campaign, Sort */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Stage</Label>
          <Select
            value={filters.stageId}
            onValueChange={(value) => setFilters({ ...filters, stageId: value })}
            disabled={loadingStages}
          >
            <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200">
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent className="rounded-lg max-h-60">
              <SelectItem value="all">All Stages</SelectItem>
              {stages.map((stage) => (
                <SelectItem key={stage._id} value={stage._id}>{stage.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Location</Label>
          <Input
            placeholder="City / State"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className="h-9 text-sm rounded-lg border-slate-200 focus:ring-orange-500"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Source Campaign</Label>
          <Input
            placeholder="Campaign name"
            value={filters.source_compain}
            onChange={(e) => setFilters({ ...filters, source_compain: e.target.value })}
            className="h-9 text-sm rounded-lg border-slate-200 focus:ring-orange-500"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sort By</Label>
          <Select
            value={filters.sort}
            onValueChange={(value) => setFilters({ ...filters, sort: value })}
          >
            <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="new">Newest First</SelectItem>
              <SelectItem value="old">Oldest First</SelectItem>
              <SelectItem value="name_asc">Name A–Z</SelectItem>
              <SelectItem value="name_desc">Name Z–A</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 3: Assigned To, Pool */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned To</Label>
          <SearchableDropdown
            options={[
              { value: "all", label: "All Users" },
              ...users.filter(user => user.status=="active").map(user => ({
                value: user._id,
                label: user.name,
                role: user.role?.name,
                empId: user.employeeId
              }))
            ]}
            value={filters.assignedTo}
            onValueChange={(value) => setFilters({ ...filters, assignedTo: value })}
            placeholder="All Users"
            searchPlaceholder="Search user..."
            emptyMessage="No users found"
            disabled={loadingUsers}
            triggerClassName="h-9 text-sm rounded-lg border-slate-200"
            contentClassName="rounded-lg"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pool</Label>
          <Select
            value={filters.poolId}
            onValueChange={(value) => setFilters({ ...filters, poolId: value })}
            disabled={loadingPools}
          >
            <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200">
              <SelectValue placeholder="All pools" />
            </SelectTrigger>
            <SelectContent className="rounded-lg max-h-60">
              <SelectItem value="all">All Pools</SelectItem>
              {pools.filter(pool => pool.isActive).map(pool => (
                <SelectItem key={pool._id} value={pool._id}>{pool.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 4: Date Filter & Assigned Date Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date Filter</Label>
          <Select
            value={filters.dateFilter}
            onValueChange={(value) => setFilters({ ...filters, dateFilter: value })}
          >
            <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned Date</Label>
          <Select
            value={filters.assignedDateFilter}
            onValueChange={(value) => setFilters({ ...filters, assignedDateFilter: value })}
          >
            <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
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

      {/* Custom Date Ranges */}
      {filters.dateFilter === 'custom' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">From Date</Label>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              className="h-9 text-sm rounded-lg border-slate-200 focus:ring-orange-500"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">To Date</Label>
            <Input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              className="h-9 text-sm rounded-lg border-slate-200 focus:ring-orange-500"
            />
          </div>
        </div>
      )}

      {filters.assignedDateFilter === 'custom' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned From</Label>
            <Input
              type="date"
              value={filters.assignedDateFrom}
              onChange={(e) => setFilters({ ...filters, assignedDateFrom: e.target.value })}
              className="h-9 text-sm rounded-lg border-slate-200 focus:ring-orange-500"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned To</Label>
            <Input
              type="date"
              value={filters.assignedDateTo}
              onChange={(e) => setFilters({ ...filters, assignedDateTo: e.target.value })}
              className="h-9 text-sm rounded-lg border-slate-200 focus:ring-orange-500"
            />
          </div>
        </div>
      )}

      {/* Active filters summary */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-400">Active filters:</span>
        {filters.status !== 'all' && (
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs rounded-full">Status: {filters.status}</Badge>
        )}
        {filters.source !== 'all' && (
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs rounded-full">Source: {filters.source}</Badge>
        )}
        {filters.stageId !== 'all' && (
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs rounded-full">Stage: {stages.find(s => s._id === filters.stageId)?.name}</Badge>
        )}
        {filters.assignedTo !== 'all' && (
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs rounded-full">Assigned to: {users.find(u => u._id === filters.assignedTo)?.name}</Badge>
        )}
        {filters.poolId !== 'all' && filters.poolId && (
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs rounded-full">Pool: {pools.find(p => p._id === filters.poolId)?.name}</Badge>
        )}
      </div>
    </CardContent>
  </Card>
)}

{/* ========== LEADS TABLE ========== */}
<div className="mt-4">
  <div className="flex items-center justify-between mb-2">
    <h2 className="text-base font-semibold text-slate-800">
      All Leads ({totalLeads})
      {loading && <Loader2 className="w-3 h-3 inline animate-spin ml-2 text-slate-400" />}
    </h2>
    <Button
  variant="outline"
  onClick={() => navigate('/admin/followup')}
  className="rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
>
  <Calendar className="w-4 h-4 mr-2" />
  Follow Ups
</Button>
    {/* export button can be added here if needed */}
  </div>

  <div className="overflow-x-auto rounded-xl border border-slate-200">
    <table className="w-full text-sm">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          {isAssignmentMode && (
            <th className="w-8 px-3 py-2 text-left text-xs font-medium text-slate-500">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={() => setSelectAll(!selectAll)}
                className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
              />
            </th>
          )}
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Lead</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Contact</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Location</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Source</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Campaign</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Stage</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Pool</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Status</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Last Call</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Created At</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Assigned To</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Actions</th>
        </tr>
      </thead>
      <tbody>
        {leads.map((lead) => (
          <tr
            key={lead._id}
            className={cn(
              "border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors",
              isAssignmentMode && selectedLeads.includes(lead._id) && "bg-orange-50"
            )}
            onClick={() => {
              setSelectedLead(lead);
              setActionsModalOpen(true);
            }}
          >
            {isAssignmentMode && (
              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedLeads.includes(lead._id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleLeadSelection(lead._id);
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                />
              </td>
            )}
            {/* Lead column */}
            <td className="px-3 py-2">
              <div className="font-medium text-slate-800">{lead.name}</div>
              <div className="text-xs text-slate-400">ID: {lead.leadId}</div>
            </td>
            {/* Contact column with custom tooltips */}
            <td className="px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <Phone className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                    {lead.phone}
                  </div>
                </div>
                <div className="relative group">
                  <Mail className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                    {lead.email}
                  </div>
                </div>
              </div>
            </td>
            {/* Location – city/state stacked as before */}
            <td className="px-3 py-2">
              <div className="text-slate-700">{lead.city || 'N/A'}</div>
              <div className="text-xs text-slate-400">{lead.state || 'N/A'}</div>
            </td>
            {/* Source – plain text */}
            <td className="px-3 py-2">
              <span className="text-slate-700 capitalize">{lead.source}</span>
            </td>
            {/* Campaign – plain text */}
            <td className="px-3 py-2">
              <span className="text-slate-700">{lead.source_campaign || '—'}</span>
            </td>
            {/* Stage – plain text */}
            <td className="px-3 py-2">
              <span className="text-slate-700">{lead.stageId.name}</span>
            </td>
            {/* Pool – plain text */}
            <td className="px-3 py-2">
              {lead.poolId ? (
                <span className="text-slate-700">
                  {typeof lead.poolId === 'object' ? lead.poolId.name : 'Pool Assigned'}
                </span>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </td>
            {/* Status – coloured text */}
            <td className="px-3 py-2">
              <span className={cn(
                "text-sm font-medium",
                lead.status === 'active' && "text-emerald-600",
                lead.status === 'lost' && "text-red-600",
                lead.status === 'converted' && "text-blue-600"
              )}>
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
              </span>
            </td>
            {/* Last Call Date */}
            <td className="px-3 py-2">
              <span className="text-slate-700">{formatDate(lead.lastCallDate)}</span>
            </td>
            <td className="px-3 py-2">
              <span className="text-slate-700">{formatDate(lead.createdAt)}</span>
            </td>
            {/* Assigned To – name + employee ID, no avatar */}
            <td className="px-3 py-2">
              {lead.assignedTo ? (
                <div>
                  <div className="text-sm font-medium text-slate-700">{lead.assignedTo.name}</div>
                  <div className="text-xs text-slate-400">ID: {lead.assignedTo.employeeId}</div>
                </div>
              ) : (
                <span className="text-slate-400 text-sm">Not assigned</span>
              )}
            </td>
            <td className="px-3 py-2">
  <div className="flex items-center gap-2">
    <a
      href={`https://web.whatsapp.com/send?phone=${lead.phone}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-green-600 hover:text-green-700 transition-colors"
      title="Open WhatsApp Web"
      onClick={(e) => e.stopPropagation()}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.032 2.008c-5.525 0-10 4.472-10 9.994 0 1.766.453 3.498 1.317 5.016L2 21.992l5.06-1.315c1.466.846 3.118 1.292 4.883 1.292 5.525 0 10-4.472 10-9.994 0-5.522-4.475-9.994-10-9.994zM12.032 18.42c-1.452 0-2.86-.395-4.058-1.143l-2.973.775.796-2.907c-.84-1.244-1.283-2.677-1.283-4.176 0-4.195 3.417-7.614 7.618-7.614 4.205 0 7.618 3.419 7.618 7.614 0 4.195-3.413 7.614-7.618 7.614z"/>
        <path d="M16.775 14.217c-.232-.116-1.387-.684-1.6-.763-.214-.078-.37-.117-.525.117-.156.233-.605.764-.742.92-.137.157-.273.176-.505.06-.233-.116-.982-.363-1.87-1.155-.691-.615-1.158-1.376-1.293-1.608-.135-.233-.015-.36.103-.475.105-.105.233-.274.35-.41.117-.137.156-.234.233-.39.078-.156.039-.293-.02-.41-.058-.117-.525-1.266-.717-1.734-.19-.458-.393-.396-.529-.395-.135 0-.293-.02-.45-.02-.155 0-.408.058-.624.293-.215.234-.823.804-.823 1.96 0 1.156.84 2.273.957 2.43.117.156 1.652 2.525 4.008 3.542.56.242.997.388 1.338.498.562.176 1.073.151 1.477.092.45-.067 1.388-.567 1.583-1.115.195-.548.195-1.017.137-1.115-.058-.098-.215-.156-.447-.273z"/>
      </svg>
    </a>
    <button
      onClick={(e) => {
        e.stopPropagation();
        setFollowUpLead(lead);
        setFollowUpModalOpen(true);
      }}
      className="text-orange-500 hover:text-orange-600 transition-colors"
      title="Schedule Follow-Up"
    >
      <Calendar className="w-4 h-4" />
    </button>
  </div>
</td>
            
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* ========== PAGINATION (responsive) ========== */}
  {leads.length > 0 && (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
      <div className="text-xs text-slate-500 order-2 sm:order-1">
        Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalLeads)} of {totalLeads} leads
      </div>
      <div className="flex items-center gap-2 order-1 sm:order-2">
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading} className="h-8 px-3 text-xs rounded-lg">
          <ChevronLeft className="w-3 h-3 mr-1" /> Prev
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) pageNum = i + 1;
            else if (page <= 3) pageNum = i + 1;
            else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
            else pageNum = page - 2 + i;
            return (
              <Button key={pageNum} variant={page === pageNum ? "default" : "outline"} size="sm"
                      className="w-7 h-7 p-0 text-xs rounded-lg"
                      onClick={() => setPage(pageNum)} disabled={loading}>
                {pageNum}
              </Button>
            );
          })}
        </div>
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading} className="h-8 px-3 text-xs rounded-lg">
          Next <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
      <div className="flex items-center gap-2 order-3">
        <span className="text-xs text-slate-500">Show:</span>
        <Select value={limit.toString()} onValueChange={(v) => { setLimit(parseInt(v)); setPage(1); }}>
          <SelectTrigger className="w-20 h-8 text-xs rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="500">500</SelectItem>
            <SelectItem value="1000">1000</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )}
</div>

      {/* CSV Upload Modal */}
      <CSVUploadModal
        open={csvUploadOpen}
        onOpenChange={setCsvUploadOpen}
        users={users}
        pools={pools}
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

      {/* Lead Actions Modal */}
      <LeadActionsModal
        open={actionsModalOpen}
        onOpenChange={setActionsModalOpen}
        selectedLead={selectedLead}
        loading={loading}
        actions={leadActions}
      />

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

      {/* Assign Leads Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
  <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
    {/* Header */}
    <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
      <DialogTitle className="text-xl font-bold text-slate-800">Assign Leads</DialogTitle>
      <DialogDescription className="text-sm text-slate-500">
        Assign {selectedLeads.length} selected leads to a user
      </DialogDescription>
    </DialogHeader>

    {/* Scrollable Body */}
    <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
      <div className="space-y-5">
        {/* User Selection */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Select User *</Label>
          <SearchableDropdown
            options={[
              { value: "", label: "Select user..." },
              ...users.map(user => ({
                value: user._id,
                label: user.name,
                role: user.role?.name || user.role,
                empId: user.employeeId,
                email: user.email,
                department: user.profile?.departmentId?.name
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
            triggerClassName="h-10 rounded-xl border-slate-200"
            contentClassName="rounded-xl"
          />
        </div>

        {/* Reason */}
        <div className="space-y-1.5">
          <Label htmlFor="assignReason" className="text-sm font-medium text-slate-700">
            Reason for Assignment/Reassignment *
          </Label>
          <textarea
            id="assignReason"
            value={assignReason}
            onChange={(e) => setAssignReason(e.target.value)}
            placeholder="Enter reason for assigning/reassigning these leads..."
            className="w-full min-h-[100px] p-3 border border-slate-200 rounded-xl text-sm resize-y focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            disabled={assigningLeads}
            required
            rows={4}
          />
          <p className="text-xs text-slate-500">
            This reason will be recorded in the lead history.
          </p>
        </div>

        {/* Validation Message */}
        {(!assignUserId || !assignReason.trim()) && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Please select a user and enter a reason for assignment
              </p>
            </div>
          </div>
        )}

        {/* Selected Leads Preview */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-700">
              Selected Leads ({selectedLeads.length})
            </p>
            <Badge variant="outline" className="border-slate-200 text-slate-500 bg-white rounded-lg">
              {selectedLeads.length} selected
            </Badge>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
            {leads
              .filter(lead => selectedLeads.includes(lead._id))
              .slice(0, 6)
              .map((lead) => (
                <div
                  key={lead._id}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 truncate">{lead.name || "Unnamed Lead"}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {lead.email || "No email"} • {lead.phone || "No phone"}
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-2 flex-shrink-0 bg-slate-100 text-slate-600 border-slate-200 rounded-lg">
                    {lead.stageId?.name || "No stage"}
                  </Badge>
                </div>
              ))}

            {selectedLeads.length > 6 && (
              <div className="text-center py-2">
                <p className="text-xs text-slate-500">
                  + {selectedLeads.length - 6} more lead{selectedLeads.length - 6 > 1 ? 's' : ''}
                </p>
              </div>
            )}

            {selectedLeads.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">No leads selected</p>
              </div>
            )}
          </div>

          {selectedLeads.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="text-slate-500 font-medium">Stages:</p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(new Set(
                      leads
                        .filter(lead => selectedLeads.includes(lead._id))
                        .map(lead => lead.stageId?.name)
                        .filter(Boolean)
                    )).slice(0, 3).map((stageName, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs border-slate-200 bg-white">
                        {stageName}
                      </Badge>
                    ))}
                    {Array.from(new Set(
                      leads
                        .filter(lead => selectedLeads.includes(lead._id))
                        .map(lead => lead.stageId?.name)
                        .filter(Boolean)
                    )).length > 3 && (
                      <Badge variant="outline" className="text-xs border-slate-200 bg-white">
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
                  <p className="text-slate-500 font-medium">Sources:</p>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(new Set(
                      leads
                        .filter(lead => selectedLeads.includes(lead._id))
                        .map(lead => lead.source)
                        .filter(Boolean)
                    )).slice(0, 3).map((source, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs bg-slate-100 text-slate-600 border-slate-200 rounded-lg">
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

    {/* Footer */}
    <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
      <div className="flex gap-3 w-full sm:w-auto">
        <Button
          variant="outline"
          onClick={() => {
            setAssignModalOpen(false);
            setAssignUserId('');
            setAssignReason('');
          }}
          disabled={assigningLeads}
          className="flex-1 sm:flex-none rounded-xl border-slate-200 hover:bg-slate-50"
        >
          Cancel
        </Button>
        <Button
          onClick={handleAssignLeads}
          disabled={selectedLeads.length === 0 || assigningLeads || !assignUserId || !assignReason.trim()}
          className="flex-1 sm:flex-none rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
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
  <DialogContent className="sm:max-w-[800px] rounded-2xl border-slate-200 p-0 overflow-hidden">
    {selectedLead && (
      <>
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800">Lead Details</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Complete information for {selectedLead.name}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            {/* Lead Information Grid (unchanged, already modern) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Name</Label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-800 font-medium">
                  {selectedLead.name}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</Label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-800">
                  {selectedLead.phone}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</Label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-800 break-all">
                  {selectedLead.email}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Source</Label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className={cn(
                    "text-sm font-medium",
                    selectedLead.source === 'manual' && "text-slate-600",
                    selectedLead.source === 'facebook' && "text-blue-600",
                    selectedLead.source === 'google' && "text-red-600",
                    selectedLead.source === 'api' && "text-purple-600"
                  )}>
                    {selectedLead.source?.charAt(0).toUpperCase() + selectedLead.source?.slice(1)}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Stage</Label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-800 font-medium">
                  {selectedLead.stageId.name}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pool</Label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  {selectedLead.poolId ? (
                    <div className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-slate-700 font-medium">
                        {typeof selectedLead.poolId === 'object' ? selectedLead.poolId.name : 'Pool Assigned'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400">Not assigned to any pool</span>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Status</Label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 text-sm font-medium",
                    selectedLead.status === 'active' && "text-emerald-600",
                    selectedLead.status === 'lost' && "text-red-600",
                    selectedLead.status === 'converted' && "text-blue-600"
                  )}>
                    {selectedLead.status === 'active' && <CheckCircle className="w-3.5 h-3.5" />}
                    {selectedLead.status === 'lost' && <XCircle className="w-3.5 h-3.5" />}
                    {selectedLead.status === 'converted' && <TrendingUp className="w-3.5 h-3.5" />}
                    {selectedLead.status?.charAt(0).toUpperCase() + selectedLead.status?.slice(1)}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Last Call At</Label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-800 font-medium"> {formatDate(selectedLead.lastCallAt)}

</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned To</Label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-800">
                  {selectedLead.assignedTo ? selectedLead.assignedTo.name : 'Not assigned'}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Created At</Label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-800">
                  {formatDate(selectedLead.createdAt)}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Last Modified</Label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-800">
                  {formatDate(selectedLead.modifiedAt)}
                </div>
              </div>
            </div>

            {/* Lead History Section - Timeline Style (matching LeadHistoryModal) */}
            <div className="border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-800">Lead History</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchLeadHistory(selectedLead.leadId.toString())}
                  disabled={loadingHistory}
                  className="rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600"
                >
                  {loadingHistory ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {loadingHistory ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500" />
                  <p className="mt-2 text-sm text-slate-500">Loading history...</p>
                </div>
              ) : leadHistory.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
                  <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">No history found for this lead.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline vertical line */}
                  <div className="absolute left-[21px] top-0 bottom-0 w-px bg-slate-200" />

                  {leadHistory.map((history) => (
                    <div key={history._id} className="relative pl-12 pb-6 last:pb-0">
                      {/* Timeline dot with orange accent */}
                      <div className="absolute left-[13px] top-1.5 w-3 h-3 rounded-full bg-orange-500 ring-4 ring-white z-10" />

                      {/* Card */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        <div className="p-4">
                          {/* Header */}
                          <div className="flex items-start gap-3 mb-3">
                            <div className="p-2 bg-orange-50 rounded-lg">
                              {history.actionType === 'created' && <FileText className="w-4 h-4 text-orange-600" />}
                              {history.actionType === 'updated' && <RefreshCw className="w-4 h-4 text-orange-600" />}
                              {history.actionType === 'call_log' && <Phone className="w-4 h-4 text-orange-600" />}
                              {history.actionType === 'stage_changed' && <TrendingUp className="w-4 h-4 text-orange-600" />}
                              {history.actionType === 'assigned' && <Users className="w-4 h-4 text-orange-600" />}
                              {history.actionType === 'lead_schedule' && <Calendar className="w-4 h-4 text-orange-600" />}
                              {history.actionType === 'status_changed' && <TrendingUp className="w-4 h-4 text-orange-600" />}
                              {history.actionType === 'meet_log' && <Video className="w-4 h-4 text-orange-600" />}
                              {history.actionType === 'meet_log_feedback' && <ClipboardList className="w-4 h-4 text-orange-600" />}
                              {!['created','updated','call_log','stage_changed','assigned','lead_schedule','status_changed','meet_log','meet_log_feedback'].includes(history.actionType) && 
                                <FileText className="w-4 h-4 text-orange-600" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="text-sm font-semibold text-orange-700">
                                  {history.actionType === 'created' && 'Lead Created'}
                                  {history.actionType === 'updated' && 'Lead Updated'}
                                  {history.actionType === 'call_log' && 'Call Logged'}
                                  {history.actionType === 'stage_changed' && 'Stage Changed'}
                                  {history.actionType === 'assigned' && 'Lead Assigned'}
                                  {history.actionType === 'lead_schedule' && 'Meeting Scheduled'}
                                  {history.actionType === 'status_changed' && 'Status Changed'}
                                  {history.actionType === 'meet_log' && 'Meeting Conducted'}
                                  {history.actionType === 'meet_log_feedback' && 'Meeting Feedback'}
                                 {/* {history.actionType || 'Action'} */}
                                </span>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-sm text-slate-600">
                                  by <span className="font-medium text-slate-800">{history.actionBy.name}</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span className="text-xs text-slate-500">{formatDate(history.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Content - Render changes dynamically */}
                          <div className="space-y-2 text-sm">
                            {history.actionType === 'created' && (
                              <div className="grid grid-cols-2 gap-3">
                                {history.changes.name && (
                                  <div><div className="text-xs text-slate-400">Name</div><div className="text-sm font-medium">{history.changes.name}</div></div>
                                )}
                                {history.changes.phone && (
                                  <div><div className="text-xs text-slate-400">Phone</div><div className="text-sm font-medium">{history.changes.phone}</div></div>
                                )}
                                {history.changes.email && (
                                  <div><div className="text-xs text-slate-400">Email</div><div className="text-sm font-medium break-all">{history.changes.email}</div></div>
                                )}
                                {history.changes.source && (
                                  <div><div className="text-xs text-slate-400">Source</div><div className="text-sm font-medium">{history.changes.source}</div></div>
                                )}
                              </div>
                            )}
                            {history.actionType === 'call_log' && (
                              <div className="space-y-1">
                                <div><span className="text-xs text-slate-400">Duration:</span> <span className="font-medium">{history.changes.duration ? `${Math.floor(history.changes.duration/60)}m ${history.changes.duration%60}s` : '—'}</span></div>
                                {history.changes.outcome && <div><span className="text-xs text-slate-400">Outcome:</span> <span className="font-medium">{history.changes.outcome}</span></div>}
                                {history.reason && <div><span className="text-xs text-slate-400">Notes:</span> <span>{history.reason}</span></div>}
                              </div>
                            )}
                            {(history.actionType === 'stage_changed' || history.actionType === 'status_changed') && (
                              <div className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg text-sm">
                                <span className="font-medium">{history.changes.status?.from || history.changes.stage?.from || 'Unknown'}</span>
                                <TrendingUp className="w-4 h-4 text-orange-500" />
                                <span className="font-medium">{history.changes.status?.to || history.changes.stage?.to || 'Unknown'}</span>
                              </div>
                            )}
                            {history.actionType === 'assigned' && (
                              <div>
                                <p>
                                  {history.fromUser ? (
                                    <>Reassigned from <span className="font-medium text-orange-600">{history.fromUser.name}</span> to <span className="font-medium text-orange-600">{history.toUser?.name}</span></>
                                  ) : (
                                    <>Assigned to <span className="font-medium text-orange-600">{history.toUser?.name}</span></>
                                  )}
                                </p>
                                {history.reason && <p className="text-xs text-slate-500 mt-1">Reason: {history.reason}</p>}
                              </div>
                            )}
                            {history.actionType === 'updated' && history.changes.from && history.changes.to && (
                              <div className="space-y-1 text-xs">
                                {Object.keys(history.changes.from).filter(k => !['__v','_id','createdAt','updatedAt'].includes(k) && history.changes.from[k] !== history.changes.to[k]).map(key => (
                                  <div key={key}><span className="font-medium">{key}:</span> <span className="line-through text-slate-400">{String(history.changes.from[key])}</span> → <span className="text-slate-800">{String(history.changes.to[key])}</span></div>
                                ))}
                              </div>
                            )}
                            {history.actionType === 'lead_schedule' && (
                              <div><span className="text-sm">{history.changes.message || 'Meeting scheduled'}</span> {history.changes.scheduler && <div className="text-xs text-slate-500 mt-1">Scheduled on: {formatDate(history.changes.scheduler)}</div>}</div>
                            )}
                            {history.actionType === 'meet_log' && (
                              <div className="space-y-1">
                                {history.changes.meetingType && <div><span className="text-xs text-slate-400">Meeting Type:</span> {history.changes.meetingType}</div>}
                                {history.changes.outcome && <div><span className="text-xs text-slate-400">Outcome:</span> {history.changes.outcome}</div>}
                                {history.changes.notes && <div><span className="text-xs text-slate-400">Notes:</span> {history.changes.notes}</div>}
                              </div>
                            )}
                            {history.actionType === 'meet_log_feedback' && (
                              <div className="bg-orange-50 p-3 rounded-lg">
                                <div className="text-xs text-orange-600 uppercase tracking-wide">Feedback</div>
                                <div className="text-sm">{history.changes.feedback || history.reason}</div>
                              </div>
                            )}
                          </div>

                          {/* Footer user info */}
                          <div className="mt-4 pt-3 border-t border-slate-100">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
                              <div className="flex items-center gap-1.5">
                                <User className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-500">{history.actionBy.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-500 truncate">{history.actionBy.email}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
          <Button
            variant="outline"
            onClick={() => setViewLeadOpen(false)}
            className="rounded-xl border-slate-200 hover:bg-slate-50"
          >
            Close
          </Button>
        </DialogFooter>
      </>
    )}
  </DialogContent>
</Dialog>

      {/* Edit Lead Modal */}
      <Dialog open={editLeadOpen} onOpenChange={setEditLeadOpen}>
  <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
    {/* Header */}
    <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
      <DialogTitle className="text-xl font-bold text-slate-800">Edit Lead</DialogTitle>
      <DialogDescription className="text-sm text-slate-500">
        Update the lead information for {selectedLead?.name}
      </DialogDescription>
    </DialogHeader>

    {/* Scrollable Body */}
    <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
      <div className="grid gap-4">
        {/* Name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-sm font-medium text-slate-700">Name *</Label>
            <Input
              id="edit-name"
              value={leadForm.name}
              onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
              placeholder="John Doe"
              disabled={updatingLead}
              className="h-10 rounded-xl border-slate-200 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-phone" className="text-sm font-medium text-slate-700">Phone *</Label>
            <Input
              id="edit-phone"
              value={leadForm.phone}
              onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
              placeholder="1234567890"
              disabled={updatingLead}
              className="h-10 rounded-xl border-slate-200 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-email" className="text-sm font-medium text-slate-700">Email *</Label>
          <Input
            id="edit-email"
            type="email"
            value={leadForm.email}
            onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
            placeholder="john@company.com"
            disabled={updatingLead}
            className="h-10 rounded-xl border-slate-200 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* City & State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-city" className="text-sm font-medium text-slate-700">City *</Label>
            <Input
              id="edit-city"
              value={leadForm.city}
              onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })}
              placeholder="Enter city"
              disabled={updatingLead}
              className="h-10 rounded-xl border-slate-200 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-state" className="text-sm font-medium text-slate-700">State *</Label>
            <Input
              id="edit-state"
              value={leadForm.state}
              onChange={(e) => setLeadForm({ ...leadForm, state: e.target.value })}
              placeholder="Enter state"
              disabled={updatingLead}
              className="h-10 rounded-xl border-slate-200 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Source & Campaign */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-source" className="text-sm font-medium text-slate-700">Source *</Label>
            <Select
              value={leadForm.source}
              onValueChange={(value) => setLeadForm({ ...leadForm, source: value })}
              disabled={updatingLead}
            >
              <SelectTrigger className="h-10 rounded-xl border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-60">
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="refurbished">Refurbished</SelectItem>
                <SelectItem value="api">API</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-source_campaign" className="text-sm font-medium text-slate-700">
              Campaign <span className="text-slate-400 font-normal">(Optional)</span>
            </Label>
            <Input
              id="edit-source_campaign"
              value={leadForm.source_campaign || ''}
              onChange={(e) => setLeadForm({ ...leadForm, source_campaign: e.target.value })}
              placeholder="Campaign name"
              disabled={updatingLead}
              className="h-10 rounded-xl border-slate-200 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Stage */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-stage" className="text-sm font-medium text-slate-700">Stage *</Label>
          <Select
            value={leadForm.stageId}
            onValueChange={(value) => setLeadForm({ ...leadForm, stageId: value })}
            disabled={updatingLead || loadingStages}
          >
            <SelectTrigger className="h-10 rounded-xl border-slate-200">
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent className="rounded-xl max-h-60">
              {loadingStages ? (
                <div className="py-2 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
              ) : (
                stages.map((stage) => (
                  <SelectItem key={stage._id} value={stage._id}>{stage.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Pool */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-pool" className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Database className="w-4 h-4 text-orange-500" /> Pool
          </Label>
          <Select
            value={leadForm.poolId || ""}
            onValueChange={(value) => setLeadForm({ ...leadForm, poolId: value })}
            disabled={updatingLead || loadingPools}
          >
            <SelectTrigger className="h-10 rounded-xl border-slate-200">
              <SelectValue placeholder="Select pool" />
            </SelectTrigger>
            <SelectContent className="rounded-xl max-h-60">
              <SelectItem value=" ">No Pool</SelectItem>
              {loadingPools ? (
                <div className="py-2 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
              ) : (
                pools.map((pool) => (
                  <SelectItem key={pool._id} value={pool._id}>{pool.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>

    {/* Footer */}
    <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
      <div className="flex flex-col-reverse sm:flex-row gap-3 w-full">
        <Button
          variant="outline"
          onClick={() => setEditLeadOpen(false)}
          disabled={updatingLead}
          className="flex-1 sm:flex-none rounded-xl border-slate-200 hover:bg-slate-50"
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpdateLead}
          disabled={updatingLead || !leadForm.name || !leadForm.phone || !leadForm.email || !leadForm.city || !leadForm.state || !leadForm.stageId}
          className="flex-1 sm:flex-none rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
        >
          {updatingLead ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
          ) : (
            'Update Lead'
          )}
        </Button>
      </div>
    </DialogFooter>
  </DialogContent>
</Dialog>

  {/* Change Status Modal */}
<Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
  <DialogContent className="sm:max-w-[400px] rounded-2xl border-slate-200 p-0 overflow-hidden">
    {selectedLead && (
      <>
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800">
            Change Lead Status
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Update status for {selectedLead.name}
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-4">
          <div className="space-y-4">
            {/* Status Selection */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Select Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value: any) => setSelectedStatus(value)}
                disabled={updatingStatus}
              >
                <SelectTrigger className="h-10 rounded-xl border-slate-200">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>Active</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="lost">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>Lost</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="converted">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span>Converted</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Current Status Display */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-600">
                Current status:{' '}
                <span className={cn(
                  "inline-flex items-center gap-1 font-medium ml-1",
                  selectedLead.status === 'active' && "text-emerald-600",
                  selectedLead.status === 'lost' && "text-red-600",
                  selectedLead.status === 'converted' && "text-blue-600"
                )}>
                  {selectedLead.status === 'active' && <CheckCircle className="w-3.5 h-3.5" />}
                  {selectedLead.status === 'lost' && <XCircle className="w-3.5 h-3.5" />}
                  {selectedLead.status === 'converted' && <TrendingUp className="w-3.5 h-3.5" />}
                  {selectedLead.status?.charAt(0).toUpperCase() + selectedLead.status?.slice(1)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setStatusModalOpen(false)}
              disabled={updatingStatus}
              className="flex-1 sm:flex-none rounded-xl border-slate-200 hover:bg-slate-50 order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={updatingStatus}
              className="flex-1 sm:flex-none rounded-xl bg-orange-500 hover:bg-orange-600 text-white order-1 sm:order-2"
            >
              {updatingStatus ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
              ) : (
                'Update Status'
              )}
            </Button>
          </div>
        </DialogFooter>
      </>
    )}
  </DialogContent>
</Dialog>


      <DuplicateLeadsModal
        open={duplicateModalOpen}
        onOpenChange={setDuplicateModalOpen}
        onMergeSuccess={() => {
          fetchLeads(); // Refresh leads after merge
        }}
      />

      {/* Bulk Search Modal */}
      <Dialog open={bulkSearchOpen} onOpenChange={setBulkSearchOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Bulk Search Leads</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Search multiple leads by entering Lead IDs and/or Phone Numbers separated by commas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">Lead IDs / Phone Numbers *</Label>
              <textarea
                value={bulkSearchInput}
                onChange={(e) => setBulkSearchInput(e.target.value)}
                placeholder="Enter Lead IDs and/or Phone Numbers separated by commas&#10;Example: 1001, 1002, 9876543210, 9999999999"
                className="w-full min-h-[150px] p-3 border rounded-md text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={bulkSearchLoading}
              />
              <p className="text-xs text-muted-foreground">
                You can mix Lead IDs and Phone Numbers. The system will search for leads matching any of these values.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setBulkSearchOpen(false);
                setBulkSearchInput('');
              }}
              disabled={bulkSearchLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkSearch}
              disabled={bulkSearchLoading || !bulkSearchInput.trim()}
            >
              {bulkSearchLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Leads
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Pool Modal */}
      <Dialog open={changePoolModalOpen} onOpenChange={setChangePoolModalOpen}>
  <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
    {/* Header */}
    <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
      <DialogTitle className="text-xl font-bold text-slate-800">Change Pool for Leads</DialogTitle>
      <DialogDescription className="text-sm text-slate-500">
        Move {selectedLeads.length} selected lead(s) to a different pool.
      </DialogDescription>
    </DialogHeader>

    {/* Body */}
    <div className="px-6 py-4">
      <div className="space-y-4">
        {/* Pool Selection */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Select Pool *</Label>
          <Select
            value={selectedPoolId}
            onValueChange={setSelectedPoolId}
            disabled={changingPool || loadingPools}
          >
            <SelectTrigger className="h-10 rounded-xl border-slate-200">
              <SelectValue placeholder="Choose a pool" />
            </SelectTrigger>
            <SelectContent className="rounded-xl max-h-60">
              {loadingPools ? (
                <div className="py-2 text-center">
                  <Loader2 className="w-4 h-4 mx-auto animate-spin text-orange-500" />
                </div>
              ) : (
                pools
                  .filter(pool => pool.isActive)
                  .map((pool) => (
                    <SelectItem key={pool._id} value={pool._id}>
                      {pool.name}
                    </SelectItem>
                  ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Leads Preview */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-sm font-medium text-slate-700 mb-2">Selected Leads:</p>
          <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-1">
            {leads
              .filter(lead => selectedLeads.includes(lead._id))
              .slice(0, 5)
              .map(lead => (
                <div key={lead._id} className="text-sm text-slate-600">
                  {lead.name} <span className="text-slate-400">(# {lead.leadId})</span>
                </div>
              ))}
            {selectedLeads.length > 5 && (
              <div className="text-xs text-slate-500 mt-1">
                + {selectedLeads.length - 5} more
              </div>
            )}
            {selectedLeads.length === 0 && (
              <div className="text-sm text-slate-400">No leads selected</div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Footer */}
    <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
      <div className="flex gap-3 w-full sm:w-auto">
        <Button
          variant="outline"
          onClick={() => setChangePoolModalOpen(false)}
          disabled={changingPool}
          className="flex-1 sm:flex-none rounded-xl border-slate-200 hover:bg-slate-50"
        >
          Cancel
        </Button>
        <Button
          onClick={handleChangePool}
          disabled={!selectedPoolId || changingPool}
          className="flex-1 sm:flex-none rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
        >
          {changingPool ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Moving...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Move to Pool
            </>
          )}
        </Button>
      </div>
    </DialogFooter>
  </DialogContent>
</Dialog>

{/* Add FollowUp Modal */}
<Dialog open={followUpModalOpen} onOpenChange={setFollowUpModalOpen}>
  <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
    <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
      <DialogTitle className="text-xl font-bold text-slate-800">Schedule Follow‑Up</DialogTitle>
      <DialogDescription className="text-sm text-slate-500">
        Set a date and time to follow up with {followUpLead?.name}
      </DialogDescription>
    </DialogHeader>
    <div className="px-6 py-4">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Date & Time *</Label>
          <Input
            type="datetime-local"
            value={followUpDateTime}
            onChange={(e) => setFollowUpDateTime(e.target.value)}
            className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
          />
        </div>
      </div>
    </div>
    <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
      <div className="flex gap-3 w-full sm:w-auto">
        <Button variant="outline" onClick={() => setFollowUpModalOpen(false)} disabled={addingFollowUp} className="rounded-xl border-slate-200">
          Cancel
        </Button>
        <Button onClick={handleAddFollowUp} disabled={addingFollowUp || !followUpDateTime} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
          {addingFollowUp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Schedule
        </Button>
      </div>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Duplicate Leads Modal - existing */}
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
