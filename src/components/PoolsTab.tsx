import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Plus, Loader2, RefreshCw, Power, Calendar, Clock, User, Percent, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { SearchableDropdown } from './ui/searchable-dropdown';

interface UserType {
  _id: string;
  name: string;
  email: string;
  employeeId?: string;
  role?: {
    name: string;
  };
}

interface PoolType {
  _id: string;
  name: string;
  shortName?: string;
  revenue_percentage: string;
  payment_internal: boolean;
  pool_owner: string | UserType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PoolsTabProps {
  pools: PoolType[];
  users: UserType[];
  loading: boolean;
  loadingUsers?: boolean;
  onAddPool: (data: { 
    name: string; 
    shortName?: string;
    revenue_percentage: string; 
    payment_internal: boolean; 
    pool_owner: string;
  }) => Promise<any>;
  onUpdatePool: (id: string, data: { 
    name: string; 
    shortName?: string;
    revenue_percentage: string; 
    payment_internal: boolean; 
    pool_owner: string;
  }) => Promise<any>;
  onToggleActive: (id: string) => Promise<any>;
  onRefresh: () => void;
  fetchingData?: boolean;
}

export function PoolsTab({
  pools,
  users,
  loading,
  loadingUsers = false,
  onAddPool,
  onUpdatePool,
  onToggleActive,
  onRefresh,
  fetchingData = false
}: PoolsTabProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState<PoolType | null>(null);
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
  const [poolName, setPoolName] = useState('');
  const [shortName, setShortName] = useState('');
  const [revenuePercentage, setRevenuePercentage] = useState('');
  const [paymentInternal, setPaymentInternal] = useState(false);
  const [poolOwner, setPoolOwner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setPoolName('');
    setShortName('');
    setRevenuePercentage('');
    setPaymentInternal(false);
    setPoolOwner('');
    setSelectedPool(null);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!poolName.trim()) {
      toast({ title: "Error", description: "Pool name is required", variant: "destructive" });
      return;
    }
    if (!revenuePercentage.trim()) {
      toast({ title: "Error", description: "Revenue percentage is required", variant: "destructive" });
      return;
    }
    const percentageNum = parseFloat(revenuePercentage);
    if (isNaN(percentageNum) || percentageNum < 0 || percentageNum > 100) {
      toast({ title: "Error", description: "Revenue percentage must be between 0 and 100", variant: "destructive" });
      return;
    }
    if (!poolOwner) {
      toast({ title: "Error", description: "Pool owner is required", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      await onAddPool({ 
        name: poolName, 
        shortName: shortName || undefined,
        revenue_percentage: revenuePercentage,
        payment_internal: paymentInternal,
        pool_owner: poolOwner
      });
      resetForm();
      setIsAddModalOpen(false);
      toast({ title: "Success", description: "Pool created successfully" });
    } catch (error) {
      // Error handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poolName.trim() || !selectedPool) {
      toast({ title: "Error", description: "Pool name is required", variant: "destructive" });
      return;
    }
    if (!revenuePercentage.trim()) {
      toast({ title: "Error", description: "Revenue percentage is required", variant: "destructive" });
      return;
    }
    const percentageNum = parseFloat(revenuePercentage);
    if (isNaN(percentageNum) || percentageNum < 0 || percentageNum > 100) {
      toast({ title: "Error", description: "Revenue percentage must be between 0 and 100", variant: "destructive" });
      return;
    }
    if (!poolOwner) {
      toast({ title: "Error", description: "Pool owner is required", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      await onUpdatePool(selectedPool._id, { 
        name: poolName,
        shortName: shortName || undefined,
        revenue_percentage: revenuePercentage,
        payment_internal: paymentInternal,
        pool_owner: poolOwner
      });
      resetForm();
      setIsEditModalOpen(false);
      toast({ title: "Success", description: "Pool updated successfully" });
    } catch (error) {
      // Error handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleClick = (pool: PoolType) => {
    setSelectedPool(pool);
    setPendingToggleId(pool._id);
    setIsConfirmModalOpen(true);
  };

  const confirmToggle = async () => {
    if (!selectedPool) return;
    try {
      await onToggleActive(selectedPool._id);
      toast({ title: "Success", description: `Pool ${selectedPool.isActive ? 'deactivated' : 'activated'} successfully` });
      setIsConfirmModalOpen(false);
      setSelectedPool(null);
      setPendingToggleId(null);
    } catch (error) {
      // Error handled in parent
    }
  };

  const openEditModal = (pool: PoolType) => {
    setSelectedPool(pool);
    setPoolName(pool.name);
    setShortName(pool.shortName || '');
    setRevenuePercentage(pool.revenue_percentage);
    setPaymentInternal(pool.payment_internal);
    setPoolOwner(typeof pool.pool_owner === 'object' ? pool.pool_owner._id : pool.pool_owner);
    setIsEditModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  const getPoolOwnerName = (pool: PoolType): string => {
    if (typeof pool.pool_owner === 'object' && pool.pool_owner?.name) return pool.pool_owner.name;
    const user = users.find(u => u._id === pool.pool_owner);
    return user?.name || 'Unknown Owner';
  };

  const userOptions = [
    { value: "", label: "Select pool owner..." },
    ...users.map(user => ({
      value: user._id,
      label: user.name,
      empId: user.employeeId,
      email: user.email,
      role: user.role?.name
    }))
  ];

  if (loading) {
    return (
      <Card className="rounded-xl border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 px-6 py-4">
          <CardTitle className="text-base font-semibold text-slate-800">Pools</CardTitle>
          <div className="flex items-center gap-2">
            {fetchingData && (
              <div className="flex items-center text-xs text-slate-400">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Refreshing...
              </div>
            )}
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={fetchingData} className="rounded-lg border-slate-200">
              <RefreshCw className={cn("w-3.5 h-3.5 mr-1", fetchingData && "animate-spin")} />
              Refresh
            </Button>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Pool
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
                  <DialogTitle className="text-xl font-bold text-slate-800">Create New Pool</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddSubmit} className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Pool Name *</Label>
                    <Input
                      value={poolName}
                      onChange={(e) => setPoolName(e.target.value)}
                      placeholder="e.g., Premium Pool"
                      disabled={submitting}
                      className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Short Name</Label>
                    <Input
                      value={shortName}
                      onChange={(e) => setShortName(e.target.value)}
                      placeholder="e.g., PREM"
                      disabled={submitting}
                      className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Revenue Percentage (%) *</Label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={revenuePercentage}
                        onChange={(e) => setRevenuePercentage(e.target.value)}
                        placeholder="0–100"
                        disabled={submitting}
                        className="pl-10 h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Pool Owner *</Label>
                    <SearchableDropdown
                      options={userOptions}
                      value={poolOwner}
                      onValueChange={setPoolOwner}
                      placeholder="Select pool owner"
                      searchPlaceholder="Search by name, email, or role..."
                      emptyMessage={loadingUsers ? "Loading users..." : "No users found"}
                      disabled={submitting || loadingUsers}
                      allowClear
                      onClear={() => setPoolOwner("")}
                      triggerClassName="h-10 rounded-xl border-slate-200"
                      contentClassName="rounded-xl"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium text-slate-700">Payment Internal</Label>
                      <p className="text-xs text-slate-500">Enable for internal payment processing</p>
                    </div>
                    <Switch
                      checked={paymentInternal}
                      onCheckedChange={setPaymentInternal}
                      disabled={submitting}
                      className="data-[state=checked]:bg-orange-500"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => { resetForm(); setIsAddModalOpen(false); }} disabled={submitting} className="rounded-xl border-slate-200">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Create
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pools.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🏊</div>
              <h3 className="text-base font-semibold text-slate-800 mb-1">No pools found</h3>
              <p className="text-sm text-slate-500 mb-4">Create your first pool to get started.</p>
              <Button onClick={() => setIsAddModalOpen(true)} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Pool
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-200">
                    <TableHead className="text-xs font-medium text-slate-500">Name</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">Short Name</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">Revenue %</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">Owner</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">Payment</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">Status</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">Created</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pools.map((pool) => {
                    const created = formatDate(pool.createdAt);
                    const ownerName = getPoolOwnerName(pool);
                    const isActive = pool.isActive;
                    return (
                      <TableRow key={pool._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <TableCell className="font-medium text-slate-800">{pool.name}</TableCell>
                        <TableCell>{pool.shortName || <span className="text-slate-400">—</span>}</TableCell>
                        <TableCell>{pool.revenue_percentage}%</TableCell>
                        <TableCell>{ownerName}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                            {pool.payment_internal ? "Internal" : "External"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-emerald-500" : "bg-slate-400")} />
                            <span className="text-slate-600">{isActive ? "Active" : "Inactive"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500">
                          <div className="flex flex-col gap-0.5">
                            <span>{created.date}</span>
                            <span className="text-xs">{created.time}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg text-slate-500 hover:text-orange-600"
                              onClick={() => openEditModal(pool)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "h-7 w-7 rounded-lg",
                                isActive ? "text-slate-500 hover:text-red-600" : "text-slate-400 hover:text-emerald-600"
                              )}
                              onClick={() => handleToggleClick(pool)}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </Button>
                          </div>
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

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-xl font-bold text-slate-800">Edit Pool</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Pool Name *</Label>
              <Input
                value={poolName}
                onChange={(e) => setPoolName(e.target.value)}
                placeholder="Pool name"
                disabled={submitting}
                className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Short Name</Label>
              <Input
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="Short name (optional)"
                disabled={submitting}
                className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Revenue Percentage (%) *</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={revenuePercentage}
                  onChange={(e) => setRevenuePercentage(e.target.value)}
                  placeholder="0–100"
                  disabled={submitting}
                  className="pl-10 h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Pool Owner *</Label>
              <SearchableDropdown
                options={userOptions}
                value={poolOwner}
                onValueChange={setPoolOwner}
                placeholder="Select pool owner"
                searchPlaceholder="Search by name, email, or role..."
                emptyMessage={loadingUsers ? "Loading users..." : "No users found"}
                disabled={submitting || loadingUsers}
                allowClear
                onClear={() => setPoolOwner("")}
                triggerClassName="h-10 rounded-xl border-slate-200"
                contentClassName="rounded-xl"
              />
            </div>
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-slate-700">Payment Internal</Label>
                <p className="text-xs text-slate-500">Enable for internal payment processing</p>
              </div>
              <Switch
                checked={paymentInternal}
                onCheckedChange={setPaymentInternal}
                disabled={submitting}
                className="data-[state=checked]:bg-orange-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { resetForm(); setIsEditModalOpen(false); }} disabled={submitting} className="rounded-xl border-slate-200">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal for Toggle Active/Inactive */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-slate-200 p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-lg font-semibold text-slate-800">
              Confirm {selectedPool?.isActive ? 'Deactivation' : 'Activation'}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Are you sure you want to {selectedPool?.isActive ? 'deactivate' : 'activate'} the pool <strong>“{selectedPool?.name}”</strong>?
              {selectedPool?.isActive && " Deactivated pools will not be available for new leads."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
            <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)} className="rounded-lg border-slate-200">
              Cancel
            </Button>
            <Button
              onClick={confirmToggle}
              className={cn(
                "rounded-lg",
                selectedPool?.isActive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              {selectedPool?.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global style for hidden scrollbar but scrollable */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}