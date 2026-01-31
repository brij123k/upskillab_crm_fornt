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
  Loader2,
  Phone,
  Mail,
  FileText
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
      <DialogContent className="sm:max-w-[450px] max-w-[calc(100vw-2rem)] mx-4 sm:mx-0 max-h-[90vh] overflow-hidden">
        <DialogHeader className="px-1">
          <DialogTitle className="text-lg sm:text-xl">Lead Actions</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Available actions for <strong>{selectedLead.name}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto px-1 py-2 max-h-[calc(90vh-140px)]">
          <div className="space-y-3 sm:space-y-4 py-2">
            {/* Lead Info Summary */}
            <div className="p-3 sm:p-4 bg-muted rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2 sm:gap-0">
                <div className="font-medium text-sm sm:text-base truncate">{selectedLead.name}</div>
                <Badge variant="outline" className="text-xs sm:text-sm w-fit">
                  ID: {selectedLead.leadId}
                </Badge>
              </div>
              <div className="text-xs sm:text-sm space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>Phone:</span>
                    </div>
                    <div className="font-medium truncate">{selectedLead.phone}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>Email:</span>
                    </div>
                    <div className="font-medium truncate">{selectedLead.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Status:</div>
                    <div className="font-medium capitalize">
                      <Badge className={cn(
                        "text-xs sm:text-sm",
                        selectedLead.status === 'active' && "bg-green-100 text-green-800",
                        selectedLead.status === 'lost' && "bg-red-100 text-red-800",
                        selectedLead.status === 'converted' && "bg-blue-100 text-blue-800"
                      )}>
                        {selectedLead.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Stage:</div>
                    <div className="font-medium">
                      <Badge variant="outline" className="text-xs sm:text-sm">
                        {selectedLead.stageId.name}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Assigned To:</div>
                  <div className="font-medium truncate">
                    {selectedLead.assignedTo?.name || 'Not assigned'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {/* View Details */}
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 min-h-[80px] sm:min-h-[90px]"
                onClick={() => handleAction('onView')}
                disabled={loading}
              >
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                <div className="text-xs sm:text-sm text-center">View Details</div>
              </Button>

              {/* Edit Lead */}
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 min-h-[80px] sm:min-h-[90px]"
                onClick={() => handleAction('onEdit')}
                disabled={loading}
              >
                <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                <div className="text-xs sm:text-sm text-center">Edit Lead</div>
              </Button>

              {/* Change Status */}
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 min-h-[80px] sm:min-h-[90px]"
                onClick={() => handleAction('onChangeStatus')}
                disabled={loading}
              >
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <div className="text-xs sm:text-sm text-center">Change Status</div>
              </Button>

              {/* Change Stage */}
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 min-h-[80px] sm:min-h-[90px]"
                onClick={() => handleAction('onChangeStage')}
                disabled={loading}
              >
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <div className="text-xs sm:text-sm text-center">Change Stage</div>
              </Button>

              {/* Assign Lead */}
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 min-h-[80px] sm:min-h-[90px]"
                onClick={() => handleAction('onAssign')}
                disabled={loading}
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                <div className="text-xs sm:text-sm text-center">Assign Lead</div>
              </Button>

              {/* Convert Lead (only for active leads) */}
              {selectedLead.status === 'active' && actions.onConvert && (
                <Button
                  variant="outline"
                  className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 min-h-[80px] sm:min-h-[90px] bg-green-50 border-green-200 hover:bg-green-100"
                  onClick={() => handleAction('onConvert')}
                  disabled={loading}
                >
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <div className="text-xs sm:text-sm text-center text-green-700">Convert Lead</div>
                </Button>
              )}

              {/* Mark as Lost (only for active leads) - This will show in place of convert if not active */}
              {selectedLead.status === 'active' && !actions.onConvert && (
                <Button
                  variant="outline"
                  className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 min-h-[80px] sm:min-h-[90px]"
                  onClick={() => handleAction('onChangeStatus')}
                  disabled={loading}
                >
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  <div className="text-xs sm:text-sm text-center">Mark as Lost</div>
                </Button>
              )}

              {/* If no special button for this position, show empty or general action */}
              {/* {(selectedLead.status !== 'active' || (selectedLead.status === 'active' && actions.onConvert)) && (
                <Button
                  variant="outline"
                  className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 min-h-[80px] sm:min-h-[90px]"
                  onClick={() => handleAction('onView')}
                  disabled={loading}
                >
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  <div className="text-xs sm:text-sm text-center">All Actions</div>
                </Button>
              )} */}
            </div>

            {/* Quick Actions */}
            {/* <div className="pt-3 sm:pt-4 border-t">
              <h4 className="text-xs sm:text-sm font-medium mb-2">Quick Status Updates</h4>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {selectedLead.status !== 'active' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs h-7 px-2"
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
                    className="text-xs h-7 px-2 bg-red-50 text-red-700 hover:bg-red-100"
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
                    className="text-xs h-7 px-2 bg-green-50 text-green-700 hover:bg-green-100"
                    onClick={() => handleAction('onChangeStatus')}
                    disabled={loading}
                  >
                    Mark as Converted
                  </Button>
                )}
              </div>
            </div> */}

            {/* Additional Info */}
            <div className="pt-3 sm:pt-4 border-t">
              <h4 className="text-xs sm:text-sm font-medium mb-2">Additional Information</h4>
              <div className="text-xs sm:text-sm space-y-1 text-muted-foreground">
                <p>• Source: <span className="font-medium text-foreground">{selectedLead.source}</span></p>
                {/* <p>• Health Score: <span className="font-medium text-foreground">{selectedLead.healthScore}</span></p> */}
                <p>• Created: <span className="font-medium text-foreground">
                  {new Date(selectedLead.createdAt).toLocaleDateString()}
                </span></p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 pt-3 sm:pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto order-2 sm:order-1 text-sm sm:text-base"
          >
            Close
          </Button>
          <Button 
            variant="default" 
            onClick={() => handleAction('onView')}
            className="w-full sm:w-auto order-1 sm:order-2 text-sm sm:text-base"
          >
            View Full Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}