// LeaveManagementTab.tsx – Admin leave policy & request management
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, RefreshCw, Loader2, Calendar, Users, Shield, Building2, CalendarDays, Clock, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronRight, Filter, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

type LeavePolicy = {
  _id: string;
  roleId: {
    _id: string;
    name: string;
  };
  year: number;
  monthlyCL: number;
  monthlyEL: number;
  allowEarnedLeaveCarryForward: boolean;
  allowEarnedLeaveEncashment: boolean;
  maxCarryForwardEL: number;
  isActive: boolean;
  createdAt?: string;
};

type Props = {
  leaves: any[];
  leavePolicies: LeavePolicy[];
  roles: any[];
  employees: any[];
  onRefresh: () => Promise<void>;
  fetching: boolean;
  onAddPolicy: (data: any) => Promise<any>;
  onUpdatePolicy: (policyId: string, data: any) => Promise<any>;
};

type PolicyFormData = {
  roleId: string;
  year: number;
  monthlyCL: number;
  monthlyEL: number;
  allowEarnedLeaveCarryForward: boolean;
  allowEarnedLeaveEncashment: boolean;
  maxCarryForwardEL: number;
  isActive: boolean;
};

export function LeaveManagementTab({
  leaves,
  leavePolicies,
  roles,
  employees,
  onRefresh,
  fetching,
  onAddPolicy,
  onUpdatePolicy,
}: Props) {
  const [leaveTab, setLeaveTab] = useState<'policies' | 'requests'>('policies');
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [expandedPolicies, setExpandedPolicies] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const [policyForm, setPolicyForm] = useState<PolicyFormData>({
    roleId: '',
    year: new Date().getFullYear(),
    monthlyCL: 2,
    monthlyEL: 2,
    allowEarnedLeaveCarryForward: true,
    allowEarnedLeaveEncashment: false,
    maxCarryForwardEL: 30,
    isActive: true,
  });

  // Filter policies by year
  const filteredPolicies = leavePolicies
    .filter(policy => policy.year === selectedYear)
    .filter(policy => {
      if (filterStatus === 'active') return policy.isActive;
      if (filterStatus === 'inactive') return !policy.isActive;
      return true;
    })
    .filter(policy => 
      policy.roleId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy._id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

 const handleAddPolicy = async () => {
  if (!policyForm.roleId) {
    toast({
      title: 'Error',
      description: 'Please select a role',
      variant: 'destructive',
    });
    return;
  }

  if (policyForm.monthlyCL < 0 || policyForm.monthlyEL < 0 || policyForm.maxCarryForwardEL < 0) {
    toast({
      title: 'Error',
      description: 'Leave values cannot be negative',
      variant: 'destructive',
    });
    return;
  }

  setSavingPolicy(true);
  try {
    if (editingPolicy?._id) {
      // For update: only send the fields that can be changed
      const updatePayload = {
        monthlyCL: Number(policyForm.monthlyCL),
        monthlyEL: Number(policyForm.monthlyEL),
        allowEarnedLeaveCarryForward: policyForm.allowEarnedLeaveCarryForward,
        allowEarnedLeaveEncashment: policyForm.allowEarnedLeaveEncashment,
        maxCarryForwardEL: Number(policyForm.maxCarryForwardEL),
        isActive: policyForm.isActive,
      };
      
      await onUpdatePolicy(editingPolicy._id, updatePayload);
      toast({
        title: 'Success',
        description: 'Leave policy updated successfully',
      });
    } else {
      // For create: send all fields including roleId and year
      const createPayload = {
        roleId: policyForm.roleId,
        year: policyForm.year,
        monthlyCL: Number(policyForm.monthlyCL),
        monthlyEL: Number(policyForm.monthlyEL),
        allowEarnedLeaveCarryForward: policyForm.allowEarnedLeaveCarryForward,
        allowEarnedLeaveEncashment: policyForm.allowEarnedLeaveEncashment,
        maxCarryForwardEL: Number(policyForm.maxCarryForwardEL),
        isActive: policyForm.isActive,
      };
      
      await onAddPolicy(createPayload);
      toast({
        title: 'Success',
        description: 'Leave policy created successfully',
      });
    }

    setPolicyDialogOpen(false);
    setPolicyForm({
      roleId: '',
      year: new Date().getFullYear(),
      monthlyCL: 2,
      monthlyEL: 2,
      allowEarnedLeaveCarryForward: true,
      allowEarnedLeaveEncashment: false,
      maxCarryForwardEL: 30,
      isActive: true,
    });
    setEditingPolicy(null);
    await onRefresh();
  } catch (error: any) {
    toast({
      title: 'Error',
      description: error.message || 'Failed to save leave policy',
      variant: 'destructive',
    });
  } finally {
    setSavingPolicy(false);
  }
};

  const openPolicyDialog = (policy?: LeavePolicy) => {
    if (policy) {
      setEditingPolicy(policy);
      setPolicyForm({
        roleId: policy.roleId?._id || policy.roleId as any || '',
        year: policy.year || new Date().getFullYear(),
        monthlyCL: policy.monthlyCL || 0,
        monthlyEL: policy.monthlyEL || 0,
        allowEarnedLeaveCarryForward: policy.allowEarnedLeaveCarryForward !== undefined ? policy.allowEarnedLeaveCarryForward : true,
        allowEarnedLeaveEncashment: policy.allowEarnedLeaveEncashment !== undefined ? policy.allowEarnedLeaveEncashment : false,
        maxCarryForwardEL: policy.maxCarryForwardEL || 30,
        isActive: policy.isActive !== undefined ? policy.isActive : true,
      });
    } else {
      setEditingPolicy(null);
      setPolicyForm({
        roleId: '',
        year: new Date().getFullYear(),
        monthlyCL: 2,
        monthlyEL: 2,
        allowEarnedLeaveCarryForward: true,
        allowEarnedLeaveEncashment: false,
        maxCarryForwardEL: 30,
        isActive: true,
      });
    }
    setPolicyDialogOpen(true);
  };

  const toggleExpand = (policyId: string) => {
    const newExpanded = new Set(expandedPolicies);
    if (newExpanded.has(policyId)) {
      newExpanded.delete(policyId);
    } else {
      newExpanded.add(policyId);
    }
    setExpandedPolicies(newExpanded);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const getLeaveStats = (policy: LeavePolicy) => {
    const totalCL = policy.monthlyCL * 12;
    const totalEL = policy.monthlyEL * 12;
    return { totalCL, totalEL };
  };

  // Get unique years from policies
  const availableYears = [...new Set(leavePolicies.map(p => p.year))].sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100 shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-600 uppercase tracking-wider">Total Policies</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{leavePolicies.length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Active Policies</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {leavePolicies.filter(p => p.isActive).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100 shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-600 uppercase tracking-wider">Roles Covered</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {new Set(leavePolicies.map(p => p.roleId?._id)).size}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={leaveTab} onValueChange={(value) => setLeaveTab(value as any)}>
        <TabsList className="h-11 bg-slate-100/80 rounded-xl p-1 backdrop-blur-sm">
          <TabsTrigger 
            value="policies" 
            className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-800 rounded-lg px-4"
          >
            <Shield className="w-4 h-4 mr-2" />
            Leave Policies
          </TabsTrigger>
          <TabsTrigger 
            value="requests" 
            className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-800 rounded-lg px-4"
          >
            <Users className="w-4 h-4 mr-2" />
            Leave Requests
            {leaves.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-700 text-[10px] px-1.5">
                {leaves.filter(l => l.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {leaveTab === 'policies' && (
        <Card className="bg-white border-0 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
                  Leave Policies by Role
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Configure monthly Casual Leave & Earned Leave entitlements per role
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(val) => setSelectedYear(parseInt(val))}
                  >
                    <SelectTrigger className="w-[130px] h-9 rounded-xl border-slate-200 text-sm bg-white">
                      <CalendarDays className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.length > 0 ? availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()} className="text-sm">
                          {year}
                        </SelectItem>
                      )) : (
                        <SelectItem value={new Date().getFullYear().toString()} className="text-sm">
                          {new Date().getFullYear()}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => openPolicyDialog()}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 h-9 px-4 text-sm font-medium shadow-sm shadow-orange-200"
                >
                  <Plus className="h-4 w-4" />
                  Add Policy
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-3 border-b border-slate-100 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  placeholder="Search by role or policy ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 rounded-xl border-slate-200 text-sm bg-slate-50/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <Select
                  value={filterStatus}
                  onValueChange={(val: any) => setFilterStatus(val)}
                >
                  <SelectTrigger className="w-[130px] h-9 rounded-xl border-slate-200 text-sm bg-slate-50/50">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-sm">All Policies</SelectItem>
                    <SelectItem value="active" className="text-sm">Active</SelectItem>
                    <SelectItem value="inactive" className="text-sm">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={onRefresh}
                  disabled={fetching}
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 rounded-xl hover:bg-slate-100"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5 text-slate-400', fetching && 'animate-spin')} />
                </Button>
              </div>
            </div>
          </div>

          {/* Policy Cards */}
          <div className="p-6">
            {filteredPolicies.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-700">No policies found</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Create policies to define leave allowances for each role'}
                </p>
                {(searchTerm || filterStatus !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                    }}
                    className="mt-3 text-orange-600 hover:text-orange-700"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredPolicies.map((policy) => {
                  const isExpanded = expandedPolicies.has(policy._id);
                  const stats = getLeaveStats(policy);
                  
                  return (
                    <Card
                      key={policy._id}
                      className="border border-slate-200/80 hover:border-slate-300 transition-all duration-200 hover:shadow-md overflow-hidden group"
                    >
                      {/* Card Header */}
                      <div 
                        className="px-5 py-4 bg-gradient-to-r from-slate-50/80 to-white border-b border-slate-100 flex items-center justify-between cursor-pointer"
                        onClick={() => toggleExpand(policy._id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-orange-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-slate-800 truncate">
                              {policy.roleId?.name || 'Unknown Role'}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-500">
                                {policy.year}
                              </span>
                              {getStatusBadge(policy.isActive)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPolicyDialog(policy);
                            }}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit className="h-4 w-4 text-slate-400" />
                          </Button>
                          <div className="text-slate-400">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="px-5 py-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-blue-50/60 rounded-lg px-3 py-2.5 text-center">
                            <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">CL / Month</p>
                            <p className="text-xl font-bold text-slate-800 mt-0.5">{policy.monthlyCL}</p>
                            <p className="text-[10px] text-slate-400">({stats.totalCL} annual)</p>
                          </div>
                          <div className="bg-purple-50/60 rounded-lg px-3 py-2.5 text-center">
                            <p className="text-xs font-medium text-purple-600 uppercase tracking-wider">EL / Month</p>
                            <p className="text-xl font-bold text-slate-800 mt-0.5">{policy.monthlyEL}</p>
                            <p className="text-[10px] text-slate-400">({stats.totalEL} annual)</p>
                          </div>
                          <div className="bg-amber-50/60 rounded-lg px-3 py-2.5 text-center">
                            <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">Carry Cap</p>
                            <p className="text-xl font-bold text-slate-800 mt-0.5">{policy.maxCarryForwardEL}</p>
                            <p className="text-[10px] text-slate-400">max days</p>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 animate-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  policy.allowEarnedLeaveCarryForward ? "bg-emerald-500" : "bg-slate-300"
                                )} />
                                <span className="text-sm text-slate-600">
                                  Carry Forward: {policy.allowEarnedLeaveCarryForward ? 'Allowed' : 'Not Allowed'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  policy.allowEarnedLeaveEncashment ? "bg-emerald-500" : "bg-slate-300"
                                )} />
                                <span className="text-sm text-slate-600">
                                  Encashment: {policy.allowEarnedLeaveEncashment ? 'Allowed' : 'Not Allowed'}
                                </span>
                              </div>
                            </div>
                           
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {leaveTab === 'requests' && (
        <Card className="bg-white border-0 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Leave Requests</h2>
              <p className="text-sm text-slate-500 mt-0.5">Review and manage all submitted leave applications</p>
            </div>
            <Button
              onClick={onRefresh}
              disabled={fetching}
              variant="outline"
              size="sm"
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl h-9 px-4 text-sm"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 mr-2', fetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>

          <div className="p-0">
            {leaves.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-700">No leave requests</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Leave requests will appear here as employees submit them
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80 border-b border-slate-100">
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">Employee</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">Type</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">Duration</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">Dates</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaves.map((leave) => {
                      const emp = employees.find(
                        (e) => e._id === (leave.userId?._id || leave.userId)
                      );
                      const start = new Date(leave.startDate || leave.leaveFrom || leave.leaveDate);
                      const end = new Date(leave.endDate || leave.leaveTo || leave.leaveFrom || leave.leaveDate);
                      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      const startStr = format(start, 'MMM dd');
                      const endStr = format(end, 'MMM dd');

                      const getStatusDisplay = (status: string) => {
                        switch (status?.toLowerCase()) {
                          case 'approved':
                            return (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Approved
                              </Badge>
                            );
                          case 'rejected':
                            return (
                              <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                                <XCircle className="w-3 h-3 mr-1" />
                                Rejected
                              </Badge>
                            );
                          case 'pending':
                            return (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            );
                          case 'cancelled':
                            return (
                              <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
                                <XCircle className="w-3 h-3 mr-1" />
                                Cancelled
                              </Badge>
                            );
                          default:
                            return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
                        }
                      };

                      return (
                        <TableRow 
                          key={leave._id} 
                          className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                        >
                          <TableCell className="py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-xs font-semibold text-orange-700">
                                {emp?.name?.[0]?.toUpperCase() || '?'}
                              </div>
                              <span className="text-sm font-medium text-slate-800">
                                {emp?.name || emp?.userName || leave.userId?.name || 'Unknown'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3.5">
                            <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200">
                              {leave.leaveType || leave.type || 'Leave'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3.5 text-sm text-slate-600 font-medium">{days} day{days > 1 ? 's' : ''}</TableCell>
                          <TableCell className="py-3.5 text-sm text-slate-600">
                            <span className="font-medium">{startStr}</span>
                            <span className="text-slate-300 mx-1">→</span>
                            <span className="font-medium">{endStr}</span>
                          </TableCell>
                          <TableCell className="py-3.5">
                            {getStatusDisplay(leave.status)}
                          </TableCell>
                          <TableCell className="py-3.5 text-xs text-slate-500">
                            {format(new Date(leave.createdAt), 'MMM dd, yyyy')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Policy Dialog (Add/Edit) */}
      <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              {editingPolicy ? 'Update Leave Policy' : 'Create Leave Policy'}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {editingPolicy 
                ? 'Update the leave entitlements for this role' 
                : 'Configure monthly leave entitlements for a role'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Role & Year */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={policyForm.roleId}
                  onValueChange={(value) => setPolicyForm((prev) => ({ ...prev, roleId: value }))}
                  disabled={!!editingPolicy}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl border-slate-200 h-10 text-sm bg-slate-50/50">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role._id || role.id} value={role._id || role.id} className="text-sm">
                        {role.name || role.roleName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingPolicy && (
                  <p className="text-xs text-slate-400 mt-1">Role cannot be changed</p>
                )}
              </div>
<div>
  <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
    Year <span className="text-red-500">*</span>
  </Label>
  <Input
    type="number"
    min="2000"
    max="2100"
    value={policyForm.year}
    onChange={(e) => setPolicyForm((prev) => ({ 
      ...prev, 
      year: parseInt(e.target.value) || new Date().getFullYear()
    }))}
    disabled={!!editingPolicy}
    className="mt-1.5 rounded-xl border-slate-200 h-10 text-sm bg-slate-50/50 focus:bg-white transition-colors"
    placeholder={`e.g., ${new Date().getFullYear()}`}
  />
  {editingPolicy && (
    <p className="text-xs text-slate-400 mt-1">Year cannot be changed</p>
  )}
  {!editingPolicy && (
    <p className="text-xs text-slate-400 mt-1">Enter the policy year (e.g., 2027)</p>
  )}
</div>
                
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Casual Leave */}
              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">CL</Badge>
                  Casual Leave
                </h3>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Per Month</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={policyForm.monthlyCL}
                    onChange={(e) => setPolicyForm((prev) => ({ 
                      ...prev, 
                      monthlyCL: Math.max(0, parseInt(e.target.value) || 0)
                    }))}
                    className="mt-1 rounded-xl border-slate-200 h-10 text-sm bg-white"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">
                    Annual total: {policyForm.monthlyCL * 12} days
                  </p>
                </div>
              </div>

              {/* Earned Leave */}
              <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200">EL</Badge>
                  Earned Leave
                </h3>
                <div>
                  <Label className="text-xs font-medium text-slate-600">Per Month</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={policyForm.monthlyEL}
                    onChange={(e) => setPolicyForm((prev) => ({ 
                      ...prev, 
                      monthlyEL: Math.max(0, parseInt(e.target.value) || 0)
                    }))}
                    className="mt-1 rounded-xl border-slate-200 h-10 text-sm bg-white"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">
                    Annual total: {policyForm.monthlyEL * 12} days
                  </p>
                </div>
              </div>
            </div>

            {/* Carry Forward Settings */}
            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Carry Forward & Encashment</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-600">Max Carry Forward (days)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    value={policyForm.maxCarryForwardEL}
                    onChange={(e) => setPolicyForm((prev) => ({ 
                      ...prev, 
                      maxCarryForwardEL: Math.max(0, parseInt(e.target.value) || 0)
                    }))}
                    className="mt-1 rounded-xl border-slate-200 h-10 text-sm bg-white"
                  />
                </div>
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium text-slate-600">Allow Carry Forward</Label>
                      <p className="text-[10px] text-slate-400">Unused EL to next year</p>
                    </div>
                    <Switch
                      checked={policyForm.allowEarnedLeaveCarryForward}
                      onCheckedChange={(checked) => setPolicyForm((prev) => ({ 
                        ...prev, 
                        allowEarnedLeaveCarryForward: checked 
                      }))}
                      className="data-[state=checked]:bg-orange-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium text-slate-600">Allow Encashment</Label>
                      <p className="text-[10px] text-slate-400">Cash for unused EL</p>
                    </div>
                    <Switch
                      checked={policyForm.allowEarnedLeaveEncashment}
                      onCheckedChange={(checked) => setPolicyForm((prev) => ({ 
                        ...prev, 
                        allowEarnedLeaveEncashment: checked 
                      }))}
                      className="data-[state=checked]:bg-orange-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between bg-slate-50/80 rounded-xl px-4 py-3 border border-slate-200">
              <div>
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Policy Status</Label>
                <p className="text-sm text-slate-500">Make this policy active or inactive</p>
              </div>
              <Switch
                checked={policyForm.isActive}
                onCheckedChange={(checked) => setPolicyForm((prev) => ({ 
                  ...prev, 
                  isActive: checked 
                }))}
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setPolicyDialogOpen(false)}
              className="rounded-xl h-10 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPolicy}
              disabled={savingPolicy}
              className="bg-orange-600 hover:bg-orange-700 rounded-xl h-10 px-6 shadow-sm shadow-orange-200"
            >
              {savingPolicy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                editingPolicy ? 'Update Policy' : 'Create Policy'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}