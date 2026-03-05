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
import { Pencil, Plus, Loader2, RefreshCw, GripVertical, Calendar, Clock, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface StageType {
    _id: string;
    name: string;
    order: number;
    createdAt: string;
    updatedAt: string;
}

interface StagesTabProps {
    stages: StageType[];
    loading: boolean;
    onAddStage: (data: { name: string; order: number }) => Promise<any>;
    onUpdateStage: (id: string, data: { name: string; order: number }) => Promise<any>;
    onRefresh: () => void;
    fetchingData?: boolean;
}

export function StagesTab({
    stages,
    loading,
    onAddStage,
    onUpdateStage,
    onRefresh,
    fetchingData = false
}: StagesTabProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedStage, setSelectedStage] = useState<StageType | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        order: 1
    });
    const [submitting, setSubmitting] = useState(false);

    const handleInputChange = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            order: 1
        });
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast({
                title: "Error",
                description: "Stage name is required",
                variant: "destructive",
            });
            return;
        }
        try {
            setSubmitting(true);
            await onAddStage(formData);
            resetForm();
            setIsAddModalOpen(false);
            toast({
                title: "Success",
                description: "Stage created successfully",
            });
        } catch (error) {
            // Error is handled in the parent
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !selectedStage) {
            toast({
                title: "Error",
                description: "Stage name is required",
                variant: "destructive",
            });
            return;
        }

        try {
            setSubmitting(true);
            await onUpdateStage(selectedStage._id, formData);
            resetForm();
            setSelectedStage(null);
            setIsEditModalOpen(false);
            toast({
                title: "Success",
                description: "Stage updated successfully",
            });
        } catch (error) {
            // Error is handled in the parent
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (stage: StageType) => {
        setSelectedStage(stage);
        setFormData({
            name: stage.name,
            order: stage.order
        });
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

    // Sort stages by order
    const sortedStages = [...stages].sort((a, b) => a.order - b.order);

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
                    <CardTitle>Lead Stages</CardTitle>
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
                                    Add Stage
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Stage</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAddSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Stage Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            placeholder="Enter stage name"
                                            disabled={submitting}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="order">Order</Label>
                                        <Input
                                            id="order"
                                            type="number"
                                            min="1"
                                            value={formData.order}
                                            onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 1)}
                                            placeholder="Enter order number"
                                            disabled={submitting}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setIsAddModalOpen(false);
                                                resetForm();
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
                    {sortedStages.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <div className="text-6xl mb-4">🎯</div>
                            <h3 className="text-lg font-semibold mb-2">No stages found</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Create your first stage to get started.
                            </p>
                            <Button onClick={() => setIsAddModalOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Stage
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sortedStages.map((stage) => {
                                const created = formatDate(stage.createdAt);
                                return (
                                    <Card 
                                        key={stage._id} 
                                        className="relative overflow-hidden transition-all duration-200 hover:shadow-lg"
                                    >
                                        {/* Order indicator strip */}
                                        <div 
                                            className="absolute top-0 left-0 w-1 h-full bg-primary/60"
                                            style={{
                                                background: `linear-gradient(to bottom, hsl(var(--primary)), hsl(var(--primary)/0.6))`
                                            }}
                                        />
                                        
                                        <CardContent className="p-5">
                                            {/* Header with Name and Actions */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant="outline" className="bg-primary/5">
                                                            <Hash className="w-3 h-3 mr-1" />
                                                            Order {stage.order}
                                                        </Badge>
                                                    </div>
                                                    <h3 className="font-semibold text-lg truncate pr-2">
                                                        {stage.name}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => openEditModal(stage)}
                                                        title="Edit stage"
                                                    >
                                                        <Pencil className="w-4 h-4" />
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

                                            {/* ID for reference */}
                                            <div className="mt-3 text-xs text-muted-foreground/50 truncate">
                                                ID: {stage._id.slice(-8)}
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
                        <DialogTitle>Edit Stage</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Stage Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Enter stage name"
                                disabled={submitting}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-order">Order</Label>
                            <Input
                                id="edit-order"
                                type="number"
                                min="1"
                                value={formData.order}
                                onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 1)}
                                placeholder="Enter order number"
                                disabled={submitting}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    resetForm();
                                    setSelectedStage(null);
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