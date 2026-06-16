import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Pencil, RefreshCw, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export interface LoanPartnerType {
  _id: string;
  name: string;
  type: 'NBFC' | 'BANK';
  submissionCharge: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LoanPartnersTabProps {
  loanPartners: LoanPartnerType[];
  loading: boolean;
  fetchingData: boolean;
  onAddLoanPartner: (data: { name: string; type: string; submissionCharge: number }) => Promise<any>;
  onUpdateLoanPartner: (id: string, data: { name: string; type: string; submissionCharge: number }) => Promise<any>;
  onToggleActive: (id: string) => Promise<any>;
  onRefresh: () => void;
}

export function LoanPartnersTab({
  loanPartners,
  loading,
  fetchingData,
  onAddLoanPartner,
  onUpdateLoanPartner,
  onToggleActive,
  onRefresh,
}: LoanPartnersTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<LoanPartnerType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'NBFC',
    submissionCharge: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'NBFC',
      submissionCharge: 0,
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type || formData.submissionCharge < 0) {
      toast({
        title: "Error",
        description: "Please fill all fields correctly",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await onAddLoanPartner(formData);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding loan partner:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner) return;

    if (!formData.name || !formData.type || formData.submissionCharge < 0) {
      toast({
        title: "Error",
        description: "Please fill all fields correctly",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await onUpdateLoanPartner(selectedPartner._id, formData);
      setIsEditDialogOpen(false);
      setSelectedPartner(null);
      resetForm();
    } catch (error) {
      console.error('Error updating loan partner:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (partner: LoanPartnerType) => {
    setSelectedPartner(partner);
    setFormData({
      name: partner.name,
      type: partner.type,
      submissionCharge: partner.submissionCharge,
    });
    setIsEditDialogOpen(true);
  };

  const handleToggleStatus = async (partner: LoanPartnerType) => {
    try {
      await onToggleActive(partner._id);
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 px-6 py-4">
          <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-orange-500" />
            Loan Partners
          </CardTitle>
          <div className="flex items-center gap-2">
            {fetchingData && (
              <div className="flex items-center text-xs text-slate-400">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Refreshing...
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={fetchingData}
              className="rounded-lg border-slate-200"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 mr-1", fetchingData && "animate-spin")} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => setIsAddDialogOpen(true)}
              className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Loan Partner
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : loanPartners.length === 0 ? (
            <div className="text-center py-12">
              <Banknote className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-800 mb-1">No loan partners found</h3>
              <p className="text-sm text-slate-500 mb-4">Click "Add Loan Partner" to create one.</p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Loan Partner
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-200">
                    <TableHead className="text-xs font-medium text-slate-500">Name</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">Type</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">Submission Charge</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">Status</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">Created At</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loanPartners.map((partner) => (
                    <TableRow key={partner._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <TableCell className="font-medium text-slate-800">{partner.name}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          partner.type === 'BANK' 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-purple-100 text-purple-700"
                        )}>
                          {partner.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-700">{partner.submissionCharge}%</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={partner.isActive}
                            onCheckedChange={() => handleToggleStatus(partner)}
                            className="data-[state=checked]:bg-orange-500"
                          />
                          <span className={cn(
                            "text-xs font-medium",
                            partner.isActive ? "text-emerald-600" : "text-slate-400"
                          )}>
                            {partner.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500">{formatDate(partner.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(partner)}
                          className="h-7 w-7 rounded-lg text-slate-500 hover:text-orange-600"
                        >
                          <Pencil className="w-3.5 h-3.5" />
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

      {/* Add Partner Modal */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
              <DialogTitle className="text-xl font-bold text-slate-800">Add New Loan Partner</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Create a new loan partner with their details.
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Partner Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter partner name"
                  disabled={submitting}
                  className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Partner Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  disabled={submitting}
                >
                  <SelectTrigger className="h-10 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select partner type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="NBFC">NBFC</SelectItem>
                    <SelectItem value="BANK">BANK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Submission Charge (%) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.submissionCharge}
                  onChange={(e) => setFormData({ ...formData, submissionCharge: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter submission charge"
                  disabled={submitting}
                  className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                  required
                />
              </div>
            </div>
            <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsAddDialogOpen(false); resetForm(); }}
                  disabled={submitting}
                  className="rounded-xl border-slate-200"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Partner
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Partner Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
              <DialogTitle className="text-xl font-bold text-slate-800">Edit Loan Partner</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Update the loan partner details.
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Partner Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter partner name"
                  disabled={submitting}
                  className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Partner Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  disabled={submitting}
                >
                  <SelectTrigger className="h-10 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select partner type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="NBFC">NBFC</SelectItem>
                    <SelectItem value="BANK">BANK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Submission Charge (%) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.submissionCharge}
                  onChange={(e) => setFormData({ ...formData, submissionCharge: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter submission charge"
                  disabled={submitting}
                  className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                  required
                />
              </div>
            </div>
            <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsEditDialogOpen(false); setSelectedPartner(null); resetForm(); }}
                  disabled={submitting}
                  className="rounded-xl border-slate-200"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Partner
                </Button>
              </div>
            </DialogFooter>
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
    </div>
  );
}