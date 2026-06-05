// LeaveManagementTab.tsx - Compact Version
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    const employeeLeaves = leaves.filter((leave) => leave.userId === employeeId || leave.userId?._id === employeeId);
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
    <div className="space-y-4">
      <Tabs value={leaveTab} onValueChange={(value) => setLeaveTab(value as any)}>
        <TabsList className="h-9">
          <TabsTrigger value="policies" className="text-xs">Leave Policies</TabsTrigger>
          <TabsTrigger value="requests" className="text-xs">Leave Requests</TabsTrigger>
        </TabsList>
      </Tabs>

      {leaveTab === 'policies' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Leave Policies by Role</CardTitle>
            <Button onClick={() => openPolicyDialog()} size="sm" className="gap-1.5 h-8 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add Policy
            </Button>
          </CardHeader>
          <CardContent>
            {leavePolicies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-xs">No leave policies configured. Create one to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="text-xs h-9">Role</TableHead>
                      <TableHead className="text-xs h-9">Leave Type</TableHead>
                      <TableHead className="text-xs h-9">Allowed Days</TableHead>
                      <TableHead className="text-right text-xs h-9">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leavePolicies.map((policy) => (
                      <TableRow key={policy._id} className="text-xs">
                        <TableCell className="py-2">
                          <Badge variant="secondary" className="text-xs">{policy.roleId?.name || 'Unknown'}</Badge>
                        </TableCell>
                        <TableCell className="py-2">{policy.leaveType}</TableCell>
                        <TableCell className="py-2">{policy.allowedDays} days</TableCell>
                        <TableCell className="text-right py-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPolicyDialog(policy)}
                            className="gap-1 h-7 text-xs"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {leaveTab === 'requests' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Employee Leave Requests</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Review and manage leave applications</p>
              </div>
              <Button onClick={onRefresh} disabled={fetching} variant="outline" size="sm" className="h-8 text-xs">
                <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', fetching && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {leaves.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-xs">No leave requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="text-xs h-9">Employee</TableHead>
                      <TableHead className="text-xs h-9">Leave Type</TableHead>
                      <TableHead className="text-xs h-9">Duration</TableHead>
                      <TableHead className="text-xs h-9">Status</TableHead>
                      <TableHead className="text-xs h-9">From - To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaves.map((leave) => {
                      const emp = employees.find((e) => e._id === (leave.userId?._id || leave.userId));
                      const start = new Date(leave.startDate);
                      const end = new Date(leave.endDate);
                      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      const startStr = start.toLocaleDateString();
                      const endStr = end.toLocaleDateString();

                      return (
                        <TableRow key={leave._id} className="text-xs">
                          <TableCell className="py-2 font-medium">{emp?.name || emp?.userName || 'Unknown'}</TableCell>
                          <TableCell className="py-2">{leave.leaveType}</TableCell>
                          <TableCell className="py-2">{days} day(s)</TableCell>
                          <TableCell className="py-2">
                            <Badge
                              variant={
                                leave.status === 'approved'
                                  ? 'secondary'
                                  : leave.status === 'rejected'
                                  ? 'destructive'
                                  : 'outline'
                              }
                              className="text-xs"
                            >
                              {leave.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs py-2">
                            {startStr} - {endStr}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Policy Dialog - Compact */}
      <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{editingPolicy ? 'Update Leave Policy' : 'Create Leave Policy'}</DialogTitle>
            <DialogDescription className="text-xs">
              Define leave policies for different roles and leave types.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={policyForm.roleId} onValueChange={(value) => setPolicyForm((prev) => ({ ...prev, roleId: value }))}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role._id} value={role._id} className="text-xs">
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Leave Type</Label>
              <Input
                placeholder="e.g., Sick Leave, Annual Leave"
                value={policyForm.leaveType}
                onChange={(e) => setPolicyForm((prev) => ({ ...prev, leaveType: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Allowed Days per Year</Label>
              <Input
                type="number"
                min="0"
                value={policyForm.allowedDays}
                onChange={(e) => setPolicyForm((prev) => ({ ...prev, allowedDays: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPolicyDialogOpen(false)} size="sm" className="h-8 text-xs">
              Cancel
            </Button>
            <Button onClick={handleAddPolicy} disabled={savingPolicy} size="sm" className="h-8 text-xs">
              {savingPolicy ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
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