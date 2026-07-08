import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DuplicateLeadsModal } from '@/components/modal/DuplicateLeadsModal';
import { CopyCheck, Database, MousePointer, PhoneCall, AlarmClock, CalendarDays } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { Calendar,Clock,User, Video, ClipboardList } from 'lucide-react';
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
import { LeadHistoryModal } from '@/components/modal/LeadHistory';
import { hasModulePermission } from '@/utils/modulePermissions';
import { PoolType } from '@/types/user';

interface LeadType {
  _id: string;
  leadId: number;
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  source: string;
  source_campaign: string;
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
  lastCallDate:string;
  updatedAt: string;
  __v: number;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    employeeId: number;
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
  status: string;
  profile?: {
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
  poolId?: string;
  source_campaign?: string;
  assignedTo?: string;
  reason?: string;
}

interface BulkLead {
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  source: string;
  stageId: string;
  poolId?: string;
  source_campaign?: string;
  assignedTo?: string;
  reason?: string;
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
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [pools, setPools] = useState<PoolType[]>([]);
  const [loadingPools, setLoadingPools] = useState(false);
  const [changePoolModalOpen, setChangePoolModalOpen] = useState(false);
const [selectedPoolId, setSelectedPoolId] = useState<string>('');
const [changingPool, setChangingPool] = useState(false);
const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
const [followUpLead, setFollowUpLead] = useState<LeadType | null>(null);
const [followUpDateTime, setFollowUpDateTime] = useState('');
const [addingFollowUp, setAddingFollowUp] = useState(false);
  // Filters
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
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadType | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'lost' | 'converted'>('active');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [ongoingExam, setOngoingExam] = useState<{ _id: string; title?: string; description?: string } | null>(null);
  const [loadingExam, setLoadingExam] = useState(false);
  const [registeringPcat, setRegisteringPcat] = useState(false);

  // Selection states
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isAssignmentMode, setIsAssignmentMode] = useState(false);

  const permissions = JSON.parse(
    localStorage.getItem("permissions") || "[]"
  );
  const user = JSON.parse(localStorage.getItem("user"));
  // Form states
  const [leadForm, setLeadForm] = useState<LeadForm>({
    name: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    source: 'manual',
    stageId: '696cadcadcbcf508621922e6',
    source_campaign: '',
    assignedTo: user.id,
    reason: 'New Lead Assigned'
  });

  const [bulkLeads, setBulkLeads] = useState<BulkLead[]>([
    { name: '', phone: '', email: '', city: '', state: '', source: 'manual', stageId: '696cadcadcbcf508621922e6', assignedTo: '', poolId: '', reason: '' }
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
  const navigate = useNavigate();
  // Filter visibility
  const [showFilters, setShowFilters] = useState(false);

  const [assignUserId, setAssignUserId] = useState<string>('');

  useEffect(() => {
    if (!actionsModalOpen || !selectedLead) {
      setOngoingExam(null);
      return;
    }

    const fetchOngoingExam = async () => {
      try {
        setLoadingExam(true);
        const response = await fetch(ApiConfig.getOngoingPcatExam);
        if (!response.ok) {
          throw new Error(`Failed to load ongoing exam (${response.status})`);
        }

        const data = await response.json();
        setOngoingExam(data?._id ? data : null);
      } catch (error) {
        console.error('Failed to load ongoing PCAT exam:', error);
        setOngoingExam(null);
      } finally {
        setLoadingExam(false);
      }
    };

    fetchOngoingExam();
  }, [actionsModalOpen, selectedLead?._id]);

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
    });
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

  const handleViewLeadHistory = async (lead: LeadType) => {
    setSelectedLead(lead);
    await fetchLeadHistory(lead.leadId.toString());
    setHistoryModalOpen(true);
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
    if (hasModulePermission(permissions, "leads")) {
      fetchLeads();
    }
    if (hasModulePermission(permissions, "user")) {
      fetchUsers();
    }
    fetchStages();
    fetchPools();
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
        city: '',
        state: '',
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
      lead.name && lead.phone && lead.email && lead.city && lead.state && lead.poolId && lead.stageId
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
        lead.name && lead.phone && lead.email && lead.city && lead.state && lead.poolId && lead.stageId
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

          dataToSend.city = dataToSend.city || "N/A";
          dataToSend.state = dataToSend.state || "N/A";

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
        setBulkLeads([{ name: '', phone: '', email: '', source: 'manual', city: '', state: '', stageId: '696cadcadcbcf508621922e6', assignedTo: '', reason: '' }]);
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


  const sendNotify = async (leadId: number) => {
    const endpoint = ApiConfig.instantnotify(leadId)
    try {
      await postDataHandlerWithToken(endpoint, null, true)
      toast({
        title: "Successfull",
        description: "call Request sended to Your APP"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send instant notify",
        variant: "destructive",
      });
      return false
    }
    return true
  }

  const callNow = async (leadId: number) => {
    // const endpoint = ApiConfig.callToLead()
    try {
      await postDataHandlerWithToken(ApiConfig.callToLead, {leadId}, true)
      toast({
        title: "Successfull",
        description: "call Request sended To You Phone"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to Call IVR Failed",
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

  const handlePcatRegister = async () => {
    if (!selectedLead) return;
    if (!ongoingExam?._id) {
      toast({
        title: "No ongoing exam",
        description: "There is no running PCAT exam right now.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedLead.name || !selectedLead.email || !selectedLead.phone) {
      toast({
        title: "Missing lead data",
        description: "Lead name, email, and phone are required for PCAT registration.",
        variant: "destructive",
      });
      return;
    }

    try {
      setRegisteringPcat(true);
      const response = await postDataHandlerWithToken(ApiConfig.registerPcatBackend(selectedLead.leadId),{},true)
      setActionsModalOpen(false);
      setChangeStageModalOpen(true);
      toast({
        title: "PCAT registration submitted",
        description: `${selectedLead.name} ${response.message}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to register lead for PCAT",
        variant: "destructive",
      });
    } finally {
      setRegisteringPcat(false);
    }
  };

  // Edit lead
  const handleEditLead = (lead: LeadType) => {
    setSelectedLead(lead);
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
      poolId: poolIdValue,
      stageId: lead.stageId._id,
      source_campaign: '',
      assignedTo: lead.assignedTo?._id
    });
    setEditLeadOpen(true);
  };

  // Helper function to safely get pool name
  const getPoolName = (poolId: any): string => {
    if (!poolId) return '';
    return typeof poolId === 'object' ? poolId.name : 'Pool Assigned';
  };

  // Helper function to check if pool is active
  const isPoolActive = (poolId: any): boolean => {
    if (!poolId) return false;
    if (typeof poolId === 'object' && poolId.isActive !== undefined) return poolId.isActive;

    // Try to find pool in pools array
    const foundPool = pools.find(p => p._id === (typeof poolId === 'object' ? poolId._id : poolId));
    return foundPool?.isActive || false;
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
    setBulkLeads([...bulkLeads, { name: '', phone: '', email: '', city: '', state: '', source: 'manual', stageId: '696cadcadcbcf508621922e6', assignedTo: '', reason: '' }]);
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


  // Add handler for pool change
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
    const csvContent = "name,phone,email,city,state,source,source_campaign\nJohn Doe,1234567890,john@example.com,Lucknow,Uttar Pradesh,source,Summer Campaign";
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
    <p className="text-sm text-slate-500 mt-0.5">Lead list, filters, and quick actions.</p>
  </div>

  <div className="flex flex-wrap items-center gap-2">
    {hasPermission(permissions, 'leads', 'assign') && (
      isAssignmentMode ? (
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
          Select Leads
        </Button>
      )
    )}

    {hasPermission(permissions, 'leads', 'update') && (
      <Button
        variant="outline"
        onClick={() => setDuplicateModalOpen(true)}
        className="rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
      >
        <CopyCheck className="w-4 h-4 mr-2" />
        Find Duplicates
      </Button>
    )}

    {hasPermission(permissions, 'leads', 'create') && (
      <>
        <Button
          variant="outline"
          onClick={() => navigate('/followup')}
          className="rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Follow Ups
        </Button>

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
                {bulkLeads.map((lead, index) => {
                  const hasAssignedUser = lead.assignedTo && lead.assignedTo.trim() !== "" && lead.assignedTo !== " ";
                  return (
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
                          {/* All existing input fields (Name, Phone, Email, City, State, Source, Stage, Pool, Campaign, Reason) – keep same JSX, only add rounded classes */}
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
                          {hasAssignedUser && (
                            <div className="space-y-1.5 col-span-2">
                              <Label className="text-sm font-medium text-slate-700">
                                Reason for Assignment *
                              </Label>
                              <textarea
                                value={lead.reason || ''}
                                onChange={(e) => updateBulkLeadRow(index, 'reason', e.target.value)}
                                placeholder="Enter reason for assigning this lead..."
                                className="w-full min-h-[80px] p-3 border border-slate-200 rounded-xl text-sm resize-y focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                disabled={addingBulkLeads}
                                rows={3}
                              />
                              <p className="text-xs text-slate-500">
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
                  <p className="text-xs text-slate-500 text-center mt-2">* Required fields</p>
                </div>
              </div>
            </div>

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
                  disabled={addingBulkLeads || !isBulkLeadFormValid()}
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
                  disabled={addingLead || !leadForm.name || !leadForm.phone || !leadForm.email || !leadForm.city || !leadForm.state || !leadForm.poolId || !leadForm.stageId}
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
    className="flex items-center gap-2 rounded-xl border-slate-200"
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
      className="rounded-xl border-slate-200"
    >
      <RefreshCw className="w-4 h-4 mr-2" />
      Reset Filters
    </Button>
  )}
</div>

{/* Filters - Collapsible */}
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

      {/* Row 2: Stage, Location, Campaign, Pool, Date, Assigned Date, Sort */}
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
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pool</Label>
          <Select
            value={filters.poolId || 'all'}
            onValueChange={(value) => setFilters({ ...filters, poolId: value })}
            disabled={loadingPools}
          >
            <SelectTrigger className="h-9 text-sm rounded-lg border-slate-200">
              <SelectValue placeholder="All pools" />
            </SelectTrigger>
            <SelectContent className="rounded-lg max-h-60">
              <SelectItem value="all">All Pools</SelectItem>
              {pools
                .filter(pool => pool.isActive)
                .map((pool) => (
                  <SelectItem key={pool._id} value={pool._id}>{pool.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
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

      {/* Row 3: Assigned To (if permission) */}
      {hasPermission(permissions, 'user', 'read') && (
        <div className="grid grid-cols-1 gap-4">
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
        </div>
      )}

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

    {/* Modern Table Card */}
<div className="mt-4">
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
    <h2 className="text-base font-semibold text-slate-800">
      All Leads ({totalLeads})
      {loading && <Loader2 className="w-3 h-3 inline animate-spin ml-2 text-slate-400" />}
    </h2>
    <div className="flex items-center gap-2">
      {isAssignmentMode && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectAll(!selectAll)}
            className="h-8 text-xs rounded-lg border-slate-200"
          >
            {selectAll ? (
              <CheckSquare className="w-3 h-3 mr-1" />
            ) : (
              <Square className="w-3 h-3 mr-1" />
            )}
            {selectAll ? 'Deselect All' : 'Select All'}
          </Button>
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 rounded-full text-xs">
            {selectedLeads.length} selected
          </Badge>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="text-xs text-slate-500">Page {page} of {totalPages}</div>
        <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} className="h-7 w-7 rounded-lg">
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading} className="h-7 w-7 rounded-lg">
          <ChevronRight className="h-3 w-3" />
        </Button>
        {hasPermission(permissions, 'leads', 'export') && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" disabled={loading || totalLeads === 0} className="h-7 w-7 rounded-lg">
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={exportToCSV} disabled={loading || totalLeads === 0} className="text-sm">
                <Download className="mr-2 h-3 w-3" /> Export All ({totalLeads})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportCurrentPageToCSV} disabled={loading || leads.length === 0} className="text-sm">
                <FileSpreadsheet className="mr-2 h-3 w-3" /> Export Page ({leads.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  </div>

  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
    <table className="w-full text-sm">
      <thead className="bg-slate-50 border-b border-slate-200">
        <tr>
          {isAssignmentMode && (
            <th className="w-8 px-3 py-2 text-left">
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
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Last Call</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Created At</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Actions</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Assigned To</th>
        </tr>
      </thead>
      <tbody>
        {leads.map((lead) => (
          <tr
            key={lead._id}
            className={cn(
              "border-b border-slate-100 hover:bg-slate-50 transition-colors",
              isAssignmentMode && selectedLeads.includes(lead._id) && "bg-orange-50"
            )}
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
            {/* Clickable Lead Name - opens actions modal */}
            <td
              className="px-3 py-2 cursor-pointer"
              onClick={() => {
                setSelectedLead(lead);
                setActionsModalOpen(true);
              }}
            >
              <div className="font-medium text-slate-800">{lead.name}</div>
              <div className="text-xs text-slate-400">ID: {lead.leadId}</div>
            </td>
            {/* Contact with tooltip icons */}
            <td className="px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <Phone className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                    {lead.phone}
                  </div>
                </div>
                <div className="relative group">
                  <Mail className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                    {lead.email}
                  </div>
                </div>
              </div>
            </td>
            {/* Location */}
            <td className="px-3 py-2">
              <div className="text-slate-700">{lead.city || 'N/A'}</div>
              <div className="text-xs text-slate-400">{lead.state || 'N/A'}</div>
            </td>
            {/* Source - plain text */}
            <td className="px-3 py-2">
              <span className="text-slate-700 capitalize">{lead.source}</span>
            </td>
            {/* Campaign - plain text */}
            <td className="px-3 py-2">
              <span className="text-slate-700">{lead.source_campaign || '—'}</span>
            </td>
            {/* Stage - plain text */}
            <td className="px-3 py-2">
              <span className="text-slate-700">{lead.stageId.name}</span>
            </td>
            {/* Pool - plain text */}
            <td className="px-3 py-2">
              {lead.poolId ? (
                <span className="text-slate-700">
                  {typeof lead.poolId === 'object' ? lead.poolId.name : 'Pool Assigned'}
                </span>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </td>
            {/* Last Call Date */}
            <td className="px-3 py-2">
              <span className="text-slate-700">{formatDate(lead.lastCallDate)}</span>
            </td>
            <td className="px-3 py-2">
              <span className="text-slate-700">{formatDate(lead.createdAt)}</span>
            </td>
            {/* Actions: WhatsApp, Call, FollowUp, Notify, CallNow (original icons) */}
            <td className="px-3 py-2">
              <div className="flex items-center gap-2">
                {/* WhatsApp */}
                <a
                  href={`https://web.whatsapp.com/send?phone=${lead.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 transition-colors"
                  title="Open WhatsApp"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.032 2.008c-5.525 0-10 4.472-10 9.994 0 1.766.453 3.498 1.317 5.016L2 21.992l5.06-1.315c1.466.846 3.118 1.292 4.883 1.292 5.525 0 10-4.472 10-9.994 0-5.522-4.475-9.994-10-9.994zM12.032 18.42c-1.452 0-2.86-.395-4.058-1.143l-2.973.775.796-2.907c-.84-1.244-1.283-2.677-1.283-4.176 0-4.195 3.417-7.614 7.618-7.614 4.205 0 7.618 3.419 7.618 7.614 0 4.195-3.413 7.614-7.618 7.614z"/>
                    <path d="M16.775 14.217c-.232-.116-1.387-.684-1.6-.763-.214-.078-.37-.117-.525.117-.156.233-.605.764-.742.92-.137.157-.273.176-.505.06-.233-.116-.982-.363-1.87-1.155-.691-.615-1.158-1.376-1.293-1.608-.135-.233-.015-.36.103-.475.105-.105.233-.274.35-.41.117-.137.156-.234.233-.39.078-.156.039-.293-.02-.41-.058-.117-.525-1.266-.717-1.734-.19-.458-.393-.396-.529-.395-.135 0-.293-.02-.45-.02-.155 0-.408.058-.624.293-.215.234-.823.804-.823 1.96 0 1.156.84 2.273.957 2.43.117.156 1.652 2.525 4.008 3.542.56.242.997.388 1.338.498.562.176 1.073.151 1.477.092.45-.067 1.388-.567 1.583-1.115.195-.548.195-1.017.137-1.115-.058-.098-.215-.156-.447-.273z"/>
                  </svg>
                </a>
                {/* Call Now (original PhoneCall) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    callNow(lead.leadId);
                  }}
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                  title="Call Now"
                >
                  <PhoneCall className="w-4 h-4" />
                </button>
                {/* Schedule Follow-Up */}
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
                {/* Notify Now (original AlarmClock) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sendNotify(lead.leadId);
                  }}
                  className="text-purple-500 hover:text-purple-600 transition-colors"
                  title="Notify Now"
                >
                  <AlarmClock className="w-4 h-4" />
                </button>
              </div>
            </td>
            {/* Assigned To – name + employee ID */}
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
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Pagination (responsive) */}
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
            {/* Lead Information Grid – modern, no badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Health Score</Label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-800 font-medium">
                  {selectedLead.healthScore}
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

            {/* Lead History Section – Timeline Style (matching LeadHistoryModal) */}
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
                                  {history.actionType || 'Action'}
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
                pools
                  .filter(pool => pool.isActive)
                  .map((pool) => (
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

            {/* Current Status Display - no badge, colored text with icon */}
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


      {/* Lead Actions Modal */}
   {/* Lead Actions Modal */}
<Dialog open={actionsModalOpen} onOpenChange={setActionsModalOpen}>
  <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
    {selectedLead && (
      <>
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800">Lead Actions</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Select an action for {selectedLead.name}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
          {/* PCAT Registration Section */}
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-orange-50 via-white to-white p-4 shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-orange-600 shrink-0" />
                    <h4 className="font-semibold text-sm text-slate-800">PCAT Registration</h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    Register this lead for the currently running PCAT exam.
                  </p>
                  <p className="text-[11px] text-slate-400 break-words">
                    {loadingExam
                      ? 'Checking for an ongoing exam...'
                      : ongoingExam
                        ? `${ongoingExam.title || 'Ongoing exam'}`
                        : 'No ongoing exam found right now.'}
                  </p>
                </div>
                <Button
                  onClick={handlePcatRegister}
                  disabled={loadingExam || registeringPcat || !ongoingExam?._id}
                  size="sm"
                  className="gap-2 shrink-0 w-full sm:w-auto rounded-lg bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {registeringPcat && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  PCAT Register
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hasPermission(permissions, 'leads', 'read') && (
              <Button
                variant="outline"
                onClick={() => {
                  setActionsModalOpen(false);
                  handleViewLead(selectedLead);
                }}
                className="h-auto py-3 px-4 justify-start rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="font-medium text-sm text-slate-700">View Details</div>
                    <div className="text-xs text-slate-400 truncate">View complete lead information</div>
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
                className="h-auto py-3 px-4 justify-start rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Edit className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="font-medium text-sm text-slate-700">Edit Lead</div>
                    <div className="text-xs text-slate-400 truncate">Update lead information</div>
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
                className="h-auto py-3 px-4 justify-start rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  {selectedLead.status === 'active' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : selectedLead.status === 'lost' ? (
                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-blue-500 shrink-0" />
                  )}
                  <div className="text-left min-w-0">
                    <div className="font-medium text-sm text-slate-700">Change Status</div>
                    <div className="text-xs text-slate-400 truncate">Update lead status</div>
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
                className="h-auto py-3 px-4 justify-start rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-orange-500 shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="font-medium text-sm text-slate-700">Change Stage</div>
                    <div className="text-xs text-slate-400 truncate">Move to different stage</div>
                  </div>
                </div>
              </Button>
            )}

            {hasPermission(permissions, 'leads', 'read') && (
              <Button
                variant="outline"
                onClick={() => {
                  setActionsModalOpen(false);
                  handleViewLeadHistory(selectedLead);
                }}
                className="h-auto py-3 px-4 justify-start rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="text-left min-w-0">
                    <div className="font-medium text-sm text-slate-700">View History</div>
                    <div className="text-xs text-slate-400 truncate">View complete lead history</div>
                  </div>
                </div>
              </Button>
            )}
          </div>

          {/* Quick Info Section – plain text, no badges */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Quick Info</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-400">Current Stage:</span>
                <span className="text-sm font-medium text-slate-700">{selectedLead.stageId?.name || 'N/A'}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-400">Status:</span>
                <span className={cn(
                  "text-sm font-medium inline-flex items-center gap-1",
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
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-400">Source:</span>
                <span className={cn(
                  "text-sm font-medium capitalize",
                  selectedLead.source === 'manual' && "text-slate-600",
                  selectedLead.source === 'facebook' && "text-blue-600",
                  selectedLead.source === 'google' && "text-red-600",
                  selectedLead.source === 'api' && "text-purple-600"
                )}>
                  {selectedLead.source}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-400">Assigned:</span>
                <span className="text-sm font-medium text-slate-700">
                  {selectedLead.assignedTo?.name || 'Not assigned'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
          <Button
            variant="outline"
            onClick={() => setActionsModalOpen(false)}
            className="rounded-xl border-slate-200 hover:bg-slate-50"
          >
            Close
          </Button>
        </DialogFooter>
      </>
    )}
  </DialogContent>
</Dialog>

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
    <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
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

        {/* Selected Leads Preview – modern card */}
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



      <LeadHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        leadHistory={leadHistory}
        loadingHistory={loadingHistory}
        selectedLeadName={selectedLead?.name}
        onRefresh={() => selectedLead && fetchLeadHistory(selectedLead.leadId.toString())}
      />
    </div>
  );
}
