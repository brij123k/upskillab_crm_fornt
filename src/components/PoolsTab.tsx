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
import { Badge } from '@/components/ui/badge';
import { Pencil, Plus, Loader2, RefreshCw, Power, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface PoolType {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PoolsTabProps {
  pools: PoolType[];
  loading: boolean;
  onAddPool: (data: { name: string }) => Promise<any>;
  onUpdatePool: (id: string, data: { name: string }) => Promise<any>;
  onToggleActive: (id: string) => Promise<any>;
  onRefresh: () => void;
  fetchingData?: boolean;
}

export function PoolsTab({
  pools,
  loading,
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
  const [submitting, setSubmitting] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poolName.trim()) {
      toast({
        title: "Error",
        description: "Pool name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await onAddPool({ name: poolName });
      setPoolName('');
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
    if (!poolName.trim() || !selectedPool) {
      toast({
        title: "Error",
        description: "Pool name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await onUpdatePool(selectedPool._id, { name: poolName });
      setPoolName('');
      setSelectedPool(null);
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Pool</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Pool Name</Label>
                    <Input
                      id="name"
                      value={poolName}
                      onChange={(e) => setPoolName(e.target.value)}
                      placeholder="Enter pool name"
                      disabled={submitting}
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddModalOpen(false)}
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
                          <Badge 
                            variant={pool.isActive ? "default" : "secondary"}
                            className="mt-1"
                          >
                            {pool.isActive ? "Active" : "Inactive"}
                          </Badge>
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

                      {/* ID for reference (optional - can be removed if not needed) */}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pool</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Pool Name</Label>
              <Input
                id="edit-name"
                value={poolName}
                onChange={(e) => setPoolName(e.target.value)}
                placeholder="Enter pool name"
                disabled={submitting}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedPool(null);
                  setPoolName('');
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