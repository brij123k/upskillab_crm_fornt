import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  ArrowRight,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadType } from '@/types/lead';
import { Badge } from '@/components/ui/badge';

interface LeadActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLead: LeadType | null;
  loading: boolean;
  actions: {
    onView: (lead: LeadType) => void;
    onEdit: (lead: LeadType) => void;
    onChangeStatus: (lead: LeadType) => void;
    onChangeStage: (lead: LeadType) => void;
    onAssign: (lead: LeadType) => void;
    onConvert?: (lead: LeadType) => void;
  };
}

export function LeadActionsModal({
  open,
  onOpenChange,
  selectedLead,
  loading,
  actions
}: LeadActionsModalProps) {
  if (!selectedLead) return null;

  const handleAction = (action: keyof typeof actions) => {
    if (actions[action]) {
      actions[action](selectedLead);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Lead Actions</DialogTitle>
          <DialogDescription>
            Available actions for <strong>{selectedLead.name}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          {/* Lead Info Summary */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">{selectedLead.name}</div>
              <Badge variant="outline">{selectedLead.leadId}</Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{selectedLead.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stage:</span>
                <span className="font-medium">{selectedLead.stageId.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assigned:</span>
                <span className="font-medium">
                  {selectedLead.assignedTo?.name || 'Not assigned'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* View Details */}
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => handleAction('onView')}
              disabled={loading}
            >
              <Eye className="w-5 h-5" />
              <div className="text-sm">View Details</div>
            </Button>

            {/* Edit Lead */}
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => handleAction('onEdit')}
              disabled={loading}
            >
              <Edit className="w-5 h-5" />
              <div className="text-sm">Edit Lead</div>
            </Button>

            {/* Change Status */}
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => handleAction('onChangeStatus')}
              disabled={loading}
            >
              <CheckCircle className="w-5 h-5" />
              <div className="text-sm">Change Status</div>
            </Button>

            {/* Change Stage */}
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => handleAction('onChangeStage')}
              disabled={loading}
            >
              <ArrowRight className="w-5 h-5" />
              <div className="text-sm">Change Stage</div>
            </Button>

            {/* Assign Lead */}
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => handleAction('onAssign')}
              disabled={loading}
            >
              <Users className="w-5 h-5" />
              <div className="text-sm">Assign Lead</div>
            </Button>

            {/* Convert Lead (only for active leads) */}
            {selectedLead.status === 'active' && actions.onConvert && (
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 bg-green-50 border-green-200 hover:bg-green-100"
                onClick={() => handleAction('onConvert')}
                disabled={loading}
              >
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div className="text-sm text-green-700">Convert Lead</div>
              </Button>
            )}

            {/* Mark as Lost (only for active leads) */}
            {selectedLead.status === 'active' && (
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 bg-red-50 border-red-200 hover:bg-red-100"
                onClick={() => handleAction('onChangeStatus')}
                disabled={loading}
              >
                <XCircle className="w-5 h-5 text-red-600" />
                <div className="text-sm text-red-700">Mark as Lost</div>
              </Button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Quick Status Updates</h4>
            <div className="flex flex-wrap gap-2">
              {selectedLead.status !== 'active' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAction('onChangeStatus')}
                  disabled={loading}
                >
                  Mark as Active
                </Button>
              )}
              {selectedLead.status !== 'lost' && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-red-50 text-red-700 hover:bg-red-100"
                  onClick={() => handleAction('onChangeStatus')}
                  disabled={loading}
                >
                  Mark as Lost
                </Button>
              )}
              {selectedLead.status !== 'converted' && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-green-50 text-green-700 hover:bg-green-100"
                  onClick={() => handleAction('onChangeStatus')}
                  disabled={loading}
                >
                  Mark as Converted
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}