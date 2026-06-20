// LeaveManagementTab.tsx – redesigned to match CallLogs style
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, RefreshCw, Loader2 } from 'lucide-react';
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
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Props = {
  leaves: any[];
  leavePolicies: any[];
  roles: any[];
  employees: any[];
  onRefresh: () => Promise<void>;
  fetching: boolean;
  onAddPolicy: (data: any) => Promise<void>;
  onUpdatePolicy: (policyId: string, data: any) => Promise<void>;
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
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    roleId: '',
    leaveType: '',
    allowedDays: '0',
  });

  const handleAddPolicy = async () => {
    if (!policyForm.roleId || !policyForm.leaveType) {
      toast({
        title: 'Error',
        description: 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    setSavingPolicy(true);
    try {
      const payload = {
        roleId: policyForm.roleId,
        leaveType: policyForm.leaveType,
        allowedDays: Number(policyForm.allowedDays),
      };

      if (editingPolicy?._id) {
        await onUpdatePolicy(editingPolicy._id, payload);
      } else {
        await onAddPolicy(payload);
      }

      setPolicyDialogOpen(false);
      setPolicyForm({ roleId: '', leaveType: '', allowedDays: '0' });
      setEditingPolicy(null);
    } finally {
      setSavingPolicy(false);
    }
  };

  const openPolicyDialog = (policy?: any) => {
    if (policy) {
      setEditingPolicy(policy);
      setPolicyForm({
        roleId: policy.roleId?._id || '',
        leaveType: policy.leaveType || '',
        allowedDays: String(policy.allowedDays || 0),
      });
    } else {
      setEditingPolicy(null);
      setPolicyForm({ roleId: '', leaveType: '', allowedDays: '0' });
    }
    setPolicyDialogOpen(true);
  };

  const getLeaveStats = (employeeId: string, leaveType?: string) => {
    // unchanged, but not used in the current UI – kept for potential future use
    const employeeLeaves = leaves.filter(
      (leave) => leave.userId === employeeId || leave.userId?._id === employeeId
    );
    let totalTaken = 0;
    employeeLeaves.forEach((leave) => {
      if (!leaveType || leave.leaveType === leaveType) {
        if (leave.status === 'approved') {
          const start = new Date(leave.startDate);
          const end = new Date(leave.endDate);
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          totalTaken += days;
        }
      }
    });
    return totalTaken;
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={leaveTab} onValueChange={(value) => setLeaveTab(value as any)}>
        <TabsList className="h-9 bg-slate-100 rounded-lg">
          <TabsTrigger value="policies" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Leave Policies
          </TabsTrigger>
          <TabsTrigger value="requests" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Leave Requests
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {leaveTab === 'policies' && (
        <Card className="bg-white border-0 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Leave Policies by Role</h2>
            <Button
              onClick={() => openPolicyDialog()}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 h-8 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Policy
            </Button>
          </div>

          <div className="p-0">
            {leavePolicies.length === 0 ? (
              <div className="py-16 text-center">
                <Edit className="w-12 h-12 mx-auto text-slate-300" />
                <h3 className="mt-3 text-sm font-medium text-slate-700">No leave policies</h3>
                <p className="text-xs text-slate-400">Create a policy to define leave allowances.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 border-b border-slate-100">
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Role</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Leave Type</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Allowed Days</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leavePolicies.map((policy) => (
                      <TableRow key={policy._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <TableCell className="py-3">
                          <span className="text-sm text-slate-700">{policy.roleId?.name || 'Unknown'}</span>
                        </TableCell>
                        <TableCell className="py-3 text-sm text-slate-600">{policy.leaveType}</TableCell>
                        <TableCell className="py-3 text-sm text-slate-600">{policy.allowedDays} days</TableCell>
                        <TableCell className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPolicyDialog(policy)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
                          >
                            <Edit className="h-4 w-4 text-slate-400" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>
      )}

      {leaveTab === 'requests' && (
        <Card className="bg-white border-0 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-800">Employee Leave Requests</h2>
              <p className="text-xs text-slate-400 mt-0.5">Review and manage leave applications</p>
            </div>
            <Button
              onClick={onRefresh}
              disabled={fetching}
              variant="outline"
              size="sm"
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl h-8 text-xs"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', fetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>

          <div className="p-0">
            {leaves.length === 0 ? (
              <div className="py-16 text-center">
                <RefreshCw className="w-12 h-12 mx-auto text-slate-300" />
                <h3 className="mt-3 text-sm font-medium text-slate-700">No leave requests</h3>
                <p className="text-xs text-slate-400">Leave requests will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 border-b border-slate-100">
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Employee</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Leave Type</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Duration</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">From - To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaves.map((leave) => {
                      const emp = employees.find(
                        (e) => e._id === (leave.userId?._id || leave.userId)
                      );
                      const start = new Date(leave.startDate);
                      const end = new Date(leave.endDate);
                      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      const startStr = start.toLocaleDateString();
                      const endStr = end.toLocaleDateString();

                      return (
                        <TableRow key={leave._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <TableCell className="py-3 text-sm font-medium text-slate-800">
                            {emp?.name || emp?.userName || 'Unknown'}
                          </TableCell>
                          <TableCell className="py-3 text-sm text-slate-600">{leave.leaveType}</TableCell>
                          <TableCell className="py-3 text-sm text-slate-600">{days} day(s)</TableCell>
                          <TableCell className="py-3">
                            {leave.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-green-100 text-green-700">
                                Approved
                              </span>
                            )}
                            {leave.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-red-100 text-red-700">
                                Rejected
                              </span>
                            )}
                            {leave.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-yellow-100 text-yellow-700">
                                Pending
                              </span>
                            )}
                            {!['approved', 'rejected', 'pending'].includes(leave.status) && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700">
                                {leave.status}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-3 text-sm text-slate-600">
                            {startStr} - {endStr}
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
        <DialogContent className="rounded-2xl max-w-md max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingPolicy ? 'Update Leave Policy' : 'Create Leave Policy'}
            </DialogTitle>
            <DialogDescription>
              Define leave policies for different roles and leave types.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase">Role</Label>
              <Select
                value={policyForm.roleId}
                onValueChange={(value) => setPolicyForm((prev) => ({ ...prev, roleId: value }))}
              >
                <SelectTrigger className="mt-1.5 rounded-xl border-slate-200 h-9 text-sm">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role._id} value={role._id} className="text-sm">
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase">Leave Type</Label>
              <Input
                placeholder="e.g., Sick Leave, Annual Leave"
                value={policyForm.leaveType}
                onChange={(e) => setPolicyForm((prev) => ({ ...prev, leaveType: e.target.value }))}
                className="mt-1.5 rounded-xl border-slate-200 h-9 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase">Allowed Days per Year</Label>
              <Input
                type="number"
                min="0"
                value={policyForm.allowedDays}
                onChange={(e) => setPolicyForm((prev) => ({ ...prev, allowedDays: e.target.value }))}
                className="mt-1.5 rounded-xl border-slate-200 h-9 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setPolicyDialogOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPolicy}
              disabled={savingPolicy}
              className="bg-orange-600 hover:bg-orange-700 rounded-xl"
            >
              {savingPolicy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}