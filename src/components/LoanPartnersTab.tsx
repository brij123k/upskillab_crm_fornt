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
  DialogTrigger,
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
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Loan Partners
          </CardTitle>
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
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Loan Partner
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAddSubmit}>
                  <DialogHeader>
                    <DialogTitle>Add New Loan Partner</DialogTitle>
                    <DialogDescription>
                      Create a new loan partner with their details
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Partner Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter partner name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Partner Type *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select partner type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NBFC">NBFC</SelectItem>
                          <SelectItem value="BANK">BANK</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="submissionCharge">Submission Charge (%) *</Label>
                      <Input
                        id="submissionCharge"
                        type="number"
                        placeholder="Enter submission charge"
                        value={formData.submissionCharge}
                        onChange={(e) => setFormData({ ...formData, submissionCharge: parseInt(e.target.value) || 0 })}
                        min="0"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Create Partner
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : loanPartners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No loan partners found. Click "Add Loan Partner" to create one.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Submission Charge</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loanPartners.map((partner) => (
                    <TableRow key={partner._id}>
                      <TableCell className="font-medium">{partner.name}</TableCell>
                      <TableCell>
                        <Badge variant={partner.type === 'BANK' ? 'default' : 'secondary'}>
                          {partner.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{partner.submissionCharge}%</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={partner.isActive}
                            onCheckedChange={() => handleToggleStatus(partner)}
                          />
                          <Badge variant={partner.isActive ? 'success' : 'destructive'}>
                            {partner.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(partner.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(partner)}
                        >
                          <Pencil className="w-4 h-4" />
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Loan Partner</DialogTitle>
              <DialogDescription>
                Update the loan partner details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Partner Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter partner name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Partner Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select partner type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NBFC">NBFC</SelectItem>
                    <SelectItem value="BANK">BANK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-submissionCharge">Submission Charge (%) *</Label>
                <Input
                  id="edit-submissionCharge"
                  type="number"
                  placeholder="Enter submission charge"
                  value={formData.submissionCharge}
                  onChange={(e) => setFormData({ ...formData, submissionCharge: parseInt(e.target.value) || 0 })}
                  min="0"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedPartner(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Partner
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}