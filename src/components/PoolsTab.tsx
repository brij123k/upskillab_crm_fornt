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
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
    revenue_percentage: string; 
    payment_internal: boolean; 
    pool_owner: string;
  }) => Promise<any>;
  onUpdatePool: (id: string, data: { 
    name: string; 
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
  const [selectedPool, setSelectedPool] = useState<PoolType | null>(null);
  const [poolName, setPoolName] = useState('');
  const [revenuePercentage, setRevenuePercentage] = useState('');
  const [paymentInternal, setPaymentInternal] = useState(false);
  const [poolOwner, setPoolOwner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setPoolName('');
    setRevenuePercentage('');
    setPaymentInternal(false);
    setPoolOwner('');
    setSelectedPool(null);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!poolName.trim()) {
      toast({
        title: "Error",
        description: "Pool name is required",
        variant: "destructive",
      });
      return;
    }

    if (!revenuePercentage.trim()) {
      toast({
        title: "Error",
        description: "Revenue percentage is required",
        variant: "destructive",
      });
      return;
    }

    const percentageNum = parseFloat(revenuePercentage);
    if (isNaN(percentageNum) || percentageNum < 0 || percentageNum > 100) {
      toast({
        title: "Error",
        description: "Revenue percentage must be a number between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    if (!poolOwner) {
      toast({
        title: "Error",
        description: "Pool owner is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await onAddPool({ 
        name: poolName, 
        revenue_percentage: revenuePercentage,
        payment_internal: paymentInternal,
        pool_owner: poolOwner
      });
      resetForm();
      setIsAddModalOpen(false);
      toast({
        title: "Success",
        description: "Pool created successfully",
      });
    } catch (error) {
      // Error is handled in the parent
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!poolName.trim() || !selectedPool) {
      toast({
        title: "Error",
        description: "Pool name is required",
        variant: "destructive",
      });
      return;
    }

    if (!revenuePercentage.trim()) {
      toast({
        title: "Error",
        description: "Revenue percentage is required",
        variant: "destructive",
      });
      return;
    }

    const percentageNum = parseFloat(revenuePercentage);
    if (isNaN(percentageNum) || percentageNum < 0 || percentageNum > 100) {
      toast({
        title: "Error",
        description: "Revenue percentage must be a number between 0 and 100",
        variant: "destructive",
      });
      return;
    }

    if (!poolOwner) {
      toast({
        title: "Error",
        description: "Pool owner is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await onUpdatePool(selectedPool._id, { 
        name: poolName,
        revenue_percentage: revenuePercentage,
        payment_internal: paymentInternal,
        pool_owner: poolOwner
      });
      resetForm();
      setIsEditModalOpen(false);
      toast({
        title: "Success",
        description: "Pool updated successfully",
      });
    } catch (error) {
      // Error is handled in the parent
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (pool: PoolType) => {
    try {
      await onToggleActive(pool._id);
      toast({
        title: "Success",
        description: `Pool ${pool.isActive ? 'deactivated' : 'activated'} successfully`,
      });
    } catch (error) {
      // Error is handled in the parent
    }
  };

  const openEditModal = (pool: PoolType) => {
    setSelectedPool(pool);
    setPoolName(pool.name);
    setRevenuePercentage(pool.revenue_percentage);
    setPaymentInternal(pool.payment_internal);
    // Handle if pool_owner is an object or string
    setPoolOwner(typeof pool.pool_owner === 'object' ? pool.pool_owner._id : pool.pool_owner);
    setIsEditModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const getPoolOwnerName = (pool: PoolType): string => {
    if (typeof pool.pool_owner === 'object' && pool.pool_owner?.name) {
      return pool.pool_owner.name;
    }
    // If it's just an ID, try to find the user in the users list
    const user = users.find(u => u._id === pool.pool_owner);
    return user?.name || 'Unknown Owner';
  };

  // Prepare options for searchable dropdown
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
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pools</CardTitle>
          <div className="flex items-center gap-2">
            {fetchingData && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Refreshing...
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={fetchingData}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", fetchingData && "animate-spin")} />
              Refresh
            </Button>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Pool
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Pool</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Pool Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={poolName}
                      onChange={(e) => setPoolName(e.target.value)}
                      placeholder="Enter pool name"
                      disabled={submitting}
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="revenuePercentage">
                      Revenue Percentage (%) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="revenuePercentage"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={revenuePercentage}
                        onChange={(e) => setRevenuePercentage(e.target.value)}
                        placeholder="Enter revenue percentage"
                        disabled={submitting}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="poolOwner">
                      Pool Owner <span className="text-red-500">*</span>
                    </Label>
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
                      triggerClassName="h-10 sm:h-11 text-sm sm:text-base"
                      contentClassName="w-full sm:max-w-[var(--radix-popover-trigger-width)]"
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="paymentInternal" className="text-base">
                        Payment Internal
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Enable for internal payment processing
                      </p>
                    </div>
                    <Switch
                      id="paymentInternal"
                      checked={paymentInternal}
                      onCheckedChange={setPaymentInternal}
                      disabled={submitting}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setIsAddModalOpen(false);
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Create
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {pools.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-6xl mb-4">🏊</div>
              <h3 className="text-lg font-semibold mb-2">No pools found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first pool to get started.
              </p>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Pool
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pools.map((pool) => {
                const created = formatDate(pool.createdAt);
                const ownerName = getPoolOwnerName(pool);
                
                return (
                  <Card 
                    key={pool._id} 
                    className={cn(
                      "relative overflow-hidden transition-all duration-200 hover:shadow-lg",
                      !pool.isActive && "opacity-75 bg-muted/30"
                    )}
                  >
                    {/* Status Indicator */}
                    <div 
                      className={cn(
                        "absolute top-0 right-0 w-2 h-full",
                        pool.isActive ? "bg-green-500" : "bg-gray-400"
                      )} 
                    />
                    
                    <CardContent className="p-5">
                      {/* Header with Name and Actions */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg truncate pr-2">
                            {pool.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge 
                              variant={pool.isActive ? "default" : "secondary"}
                            >
                              {pool.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50">
                              <Percent className="w-3 h-3 mr-1" />
                              {pool.revenue_percentage}%
                            </Badge>
                            <Badge variant="outline" className={pool.payment_internal ? "bg-green-50" : "bg-gray-50"}>
                              <CreditCard className="w-3 h-3 mr-1" />
                              {pool.payment_internal ? "Internal" : "External"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditModal(pool)}
                            title="Edit pool"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-8 w-8",
                              pool.isActive ? "text-green-600 hover:text-green-700" : "text-gray-400 hover:text-gray-500"
                            )}
                            onClick={() => handleToggleActive(pool)}
                            title={pool.isActive ? "Deactivate" : "Activate"}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Pool Owner */}
                      <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Owner:</span>
                          <span className="text-muted-foreground truncate">{ownerName}</span>
                        </div>
                      </div>

                      {/* Creation Date and Time */}
                      <div className="space-y-1.5 mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{created.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{created.time}</span>
                        </div>
                      </div>

                      {/* ID for reference */}
                      <div className="mt-3 text-xs text-muted-foreground/50 truncate">
                        ID: {pool._id.slice(-8)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Pool</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Pool Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={poolName}
                onChange={(e) => setPoolName(e.target.value)}
                placeholder="Enter pool name"
                disabled={submitting}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-revenuePercentage">
                Revenue Percentage (%) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="edit-revenuePercentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={revenuePercentage}
                  onChange={(e) => setRevenuePercentage(e.target.value)}
                  placeholder="Enter revenue percentage"
                  disabled={submitting}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-poolOwner">
                Pool Owner <span className="text-red-500">*</span>
              </Label>
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
                triggerClassName="h-10 sm:h-11 text-sm sm:text-base"
                contentClassName="w-full sm:max-w-[var(--radix-popover-trigger-width)]"
              />
            </div>

            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="edit-paymentInternal" className="text-base">
                  Payment Internal
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable for internal payment processing
                </p>
              </div>
              <Switch
                id="edit-paymentInternal"
                checked={paymentInternal}
                onCheckedChange={setPaymentInternal}
                disabled={submitting}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsEditModalOpen(false);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}