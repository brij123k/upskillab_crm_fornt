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
import { Pencil, Plus, Loader2, RefreshCw, Hash } from 'lucide-react';
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
    const [editOrder, setEditOrder] = useState<number>(1);
    const [formData, setFormData] = useState({ name: '', order: 1 });
    const [submitting, setSubmitting] = useState(false);

    const resetForm = () => {
        setFormData({ name: '', order: 1 });
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast({ title: "Error", description: "Stage name is required", variant: "destructive" });
            return;
        }
        try {
            setSubmitting(true);
            await onAddStage(formData);
            resetForm();
            setIsAddModalOpen(false);
            toast({ title: "Success", description: "Stage created successfully" });
        } catch (error) {
            // Error handled in parent
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (stage: StageType) => {
        setSelectedStage(stage);
        setEditOrder(stage.order);
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStage) return;
        try {
            setSubmitting(true);
            await onUpdateStage(selectedStage._id, { name: selectedStage.name, order: editOrder });
            setIsEditModalOpen(false);
            setSelectedStage(null);
            toast({ title: "Success", description: "Stage order updated successfully" });
        } catch (error) {
            // Error handled in parent
        } finally {
            setSubmitting(false);
        }
    };

    const sortedStages = [...stages].sort((a, b) => a.order - b.order);

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
            <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 px-6 py-4">
                    <CardTitle className="text-base font-semibold text-slate-800">Lead Stages</CardTitle>
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
                                    Add Stage
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
                                <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
                                    <DialogTitle className="text-xl font-bold text-slate-800">Create New Stage</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAddSubmit} className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-slate-700">Stage Name *</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., New Lead"
                                            disabled={submitting}
                                            className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-slate-700">Order *</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={formData.order}
                                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                                            placeholder="Enter order number"
                                            disabled={submitting}
                                            className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); resetForm(); }} disabled={submitting} className="rounded-xl border-slate-200">
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
                <CardContent className="pt-5">
                    {sortedStages.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-3">🎯</div>
                            <h3 className="text-base font-semibold text-slate-800 mb-1">No stages found</h3>
                            <p className="text-sm text-slate-500 mb-4">Create your first stage to get started.</p>
                            <Button onClick={() => setIsAddModalOpen(true)} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Stage
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            {sortedStages.map((stage) => (
                                <div
                                    key={stage._id}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-700">{stage.order}</span>
                                    <span className="text-slate-800 font-medium">{stage.name}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 rounded-full text-slate-400 hover:text-orange-600 hover:bg-orange-50 ml-1"
                                        onClick={() => openEditModal(stage)}
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Modal – only order is editable */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
                        <DialogTitle className="text-xl font-bold text-slate-800">Change Stage Order</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700">Stage Name</Label>
                            <Input
                                value={selectedStage?.name || ''}
                                disabled
                                className="h-10 rounded-xl border-slate-200 bg-slate-50 text-slate-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-slate-700">New Order *</Label>
                            <Input
                                type="number"
                                min="1"
                                value={editOrder}
                                onChange={(e) => setEditOrder(parseInt(e.target.value) || 1)}
                                placeholder="Enter new order number"
                                disabled={submitting}
                                className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={submitting} className="rounded-xl border-slate-200">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
                                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Update Order
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

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