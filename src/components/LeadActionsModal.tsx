import { useEffect, useState } from 'react';
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
  FileText,
  CalendarDays
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeadType } from '@/types/lead';
import { Badge } from '@/components/ui/badge';
import ApiConfig from '@/config/apiConfig';
import { toast } from 'sonner';
import { postDataHandlerWithToken } from '@/config/services';

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
  const [ongoingExam, setOngoingExam] = useState<{ _id: string; title?: string; description?: string } | null>(null);
  const [loadingExam, setLoadingExam] = useState(false);
  const [registeringPcat, setRegisteringPcat] = useState(false);

  useEffect(() => {
    if (!open || !selectedLead) {
      setOngoingExam(null);
      return;
    }

    const fetchOngoingExam = async () => {
      try {
        setLoadingExam(true);
        const response = await fetch(ApiConfig.getOngoingPcatExam);
        if (!response.ok) {
          throw new Error(`Failed to load ongoing exam (${response.status})`);
        }

        const data = await response.json();
        setOngoingExam(data?._id ? data : null);
      } catch (error) {
        console.error('Failed to load ongoing PCAT exam:', error);
        setOngoingExam(null);
      } finally {
        setLoadingExam(false);
      }
    };

    fetchOngoingExam();
  }, [open, selectedLead?._id]);

  if (!selectedLead) return null;

  const handleAction = (action: keyof typeof actions) => {
    if (actions[action]) {
      actions[action](selectedLead);
      onOpenChange(false);
    }
  };

  const handlePcatRegister = async () => {
    if (!ongoingExam?._id) {
      toast.error('There is no running PCAT exam right now.');
      return;
    }

    if (!selectedLead.name || !selectedLead.email || !selectedLead.phone) {
      toast.error('Lead name, email, and phone are required for PCAT registration.');
      return;
    }

    try {
      setRegisteringPcat(true);
      const response = await postDataHandlerWithToken(ApiConfig.registerPcatBackend(selectedLead.leadId),{},true)
      toast.success(`${selectedLead.name} ${response.message}`);
      handleAction('onChangeStage')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to register lead for PCAT');
    } finally {
      setRegisteringPcat(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-w-[calc(100vw-2rem)] max-h-[90vh] h-auto overflow-hidden flex flex-col">
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-lg sm:text-xl">Lead Actions</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Available actions for <strong>{selectedLead.name}</strong>
          </DialogDescription>
        </DialogHeader>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          
          <div className="space-y-4 sm:space-y-5">
            {/* Lead Info Summary */}
            <div className="p-4 bg-muted/50 rounded-lg border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                <div className="font-medium text-sm sm:text-base truncate">{selectedLead.name}</div>
                <Badge variant="outline" className="text-xs sm:text-sm w-fit">
                  ID: {selectedLead.leadId}
                </Badge>
              </div>
              <div className="text-xs sm:text-sm space-y-3">
                <div className="grid grid-cols-2 gap-3">
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
                <div className="grid grid-cols-2 gap-3">
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

            <div className="rounded-2xl border bg-gradient-to-br from-indigo-50 via-background to-background p-4 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-indigo-600" />
                    <h4 className="font-semibold text-sm sm:text-base">PCAT Registration</h4>
                  </div>
                  
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    {loadingExam
                      ? 'Checking for an ongoing exam...'
                      : ongoingExam
                        ? `${ongoingExam.title || 'Ongoing exam'}`
                        : 'No ongoing exam found right now.'}
                  </p>
                </div>
                <Button
                  onClick={handlePcatRegister}
                  disabled={loading || loadingExam || registeringPcat || !ongoingExam?._id}
                  className="gap-2 shrink-0"
                >
                  {registeringPcat ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  PCAT register here
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {/* View Details */}
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 min-h-[80px] sm:min-h-[90px] hover:bg-accent"
                onClick={() => handleAction('onView')}
                disabled={loading}
              >
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                <div className="text-xs sm:text-sm text-center">View Details</div>
              </Button>

              {/* Edit Lead */}
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 min-h-[80px] sm:min-h-[90px] hover:bg-accent"
                onClick={() => handleAction('onEdit')}
                disabled={loading}
              >
                <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                <div className="text-xs sm:text-sm text-center">Edit Lead</div>
              </Button>

              {/* Change Status */}
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 min-h-[80px] sm:min-h-[90px] hover:bg-accent"
                onClick={() => handleAction('onChangeStatus')}
                disabled={loading}
              >
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <div className="text-xs sm:text-sm text-center">Change Status</div>
              </Button>

              {/* Change Stage */}
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 min-h-[80px] sm:min-h-[90px] hover:bg-accent"
                onClick={() => handleAction('onChangeStage')}
                disabled={loading}
              >
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <div className="text-xs sm:text-sm text-center">Change Stage</div>
              </Button>

              {/* Assign Lead */}
              <Button
                variant="outline"
                className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 min-h-[80px] sm:min-h-[90px] hover:bg-accent"
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
                  className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 min-h-[80px] sm:min-h-[90px] bg-green-50 border-green-200 hover:bg-green-100 text-green-700"
                  onClick={() => handleAction('onConvert')}
                  disabled={loading}
                >
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <div className="text-xs sm:text-sm text-center">Convert Lead</div>
                </Button>
              )}

              {/* Mark as Lost (only for active leads) */}
              {selectedLead.status === 'active' && !actions.onConvert && (
                <Button
                  variant="outline"
                  className="h-auto py-3 sm:py-4 flex flex-col items-center gap-1 sm:gap-2 min-h-[80px] sm:min-h-[90px] hover:bg-accent"
                  onClick={() => handleAction('onChangeStatus')}
                  disabled={loading}
                >
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  <div className="text-xs sm:text-sm text-center">Mark as Lost</div>
                </Button>
              )}

              {/* Empty space filler if needed */}
              {selectedLead.status !== 'active' && !actions.onConvert && (
                <div className="min-h-[80px] sm:min-h-[90px]"></div>
              )}
            </div>

            {/* Additional Info */}
            <div className="pt-4 border-t">
              <h4 className="text-xs sm:text-sm font-medium mb-2">Additional Information</h4>
              <div className="text-xs sm:text-sm space-y-1 text-muted-foreground">
                <p>• Source: <span className="font-medium text-foreground">{selectedLead.source}</span></p>
                <p>• Created: <span className="font-medium text-foreground">
                  {new Date(selectedLead.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span></p>
                {selectedLead.source_campaign && (
                  <p>• Campaign: <span className="font-medium text-foreground">{selectedLead.source_campaign}</span></p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Fixed Footer */}
        <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-col relative justify-around sm:flex-row gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base px-4 sm:px-6 order-2 sm:order-1"
            >
              Close
            </Button>
            <Button 
              variant="default" 
              onClick={() => handleAction('onView')}
              className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-base px-4 sm:px-6 order-1 sm:order-2"
            >
              View Full Details
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
