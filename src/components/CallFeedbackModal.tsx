// components/CallFeedbackModal.tsx
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Phone, PhoneCall, Clock, User, Hash, FileText } from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';

interface Stage {
  _id: string;
  name: string;
}

interface CallFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callData: {
    callId: string;
    leadId: string;
    duration: number;
    call: any;
  } | null;
  onSubmit: (data: {
    stageId: string;
    outcome: string;
    remark: string;
  }) => Promise<void>;
}

export function CallFeedbackModal({ 
  open,
  onOpenChange,
  callData, 
  onSubmit 
}: CallFeedbackModalProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loadingStages, setLoadingStages] = useState(false);
  const [selectedStage, setSelectedStage] = useState('');
  const [outcome, setOutcome] = useState('');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchStages = async () => {
    try {
      setLoadingStages(true);
      const response = await getDataHandlerWithToken("getAllStages", null, null);
      if (response) {
        setStages(response);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch stages",
        variant: "destructive",
      });
    } finally {
      setLoadingStages(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchStages();
      // Reset form when modal opens
      setSelectedStage('');
      setOutcome('');
      setRemark('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedStage) {
      toast({
        title: "Validation Error",
        description: "Please select a stage",
        variant: "destructive",
      });
      return;
    }

    if (!outcome.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter outcome",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        stageId: selectedStage,
        outcome: outcome,
        remark: remark,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Format duration from seconds to minutes:seconds
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset form when modal closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedStage('');
      setOutcome('');
      setRemark('');
    }
    onOpenChange(isOpen);
  };

  if (!callData) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Call Feedback</DialogTitle>
          <DialogDescription>
            Please provide feedback for the completed call
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Call Information Display */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <PhoneCall className="w-4 h-4" />
              Call Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {/* Call ID */}
              <div className="flex items-start gap-2">
                <Hash className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground text-xs block">Call ID</span>
                  <p className="font-medium text-sm break-all">{callData.callId}</p>
                </div>
              </div>
              
              {/* Lead ID */}
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground text-xs block">Lead ID</span>
                  <p className="font-medium text-sm break-all">{callData.leadId}</p>
                </div>
              </div>
              
              {/* Duration */}
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground text-xs block">Duration</span>
                  <p className="font-medium text-sm">{formatDuration(callData.duration)}</p>
                </div>
              </div>
              
              {/* Phone Number (if available) */}
              {callData.call?.phoneNumber && (
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-muted-foreground text-xs block">Phone Number</span>
                    <p className="font-medium text-sm">{callData.call.phoneNumber}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stage Selection */}
          <div className="grid gap-2">
            <Label htmlFor="stage" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Stage <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={selectedStage} 
              onValueChange={setSelectedStage}
              disabled={submitting || loadingStages}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a stage" />
              </SelectTrigger>
              <SelectContent>
                {loadingStages ? (
                  <div className="py-2 text-center">
                    <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                  </div>
                ) : (
                  stages.map((stage) => (
                    <SelectItem key={stage._id} value={stage._id}>
                      {stage.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Outcome */}
          <div className="grid gap-2">
            <Label htmlFor="outcome">Outcome <span className="text-destructive">*</span></Label>
            <Input
              id="outcome"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="Enter call outcome"
              disabled={submitting}
            />
          </div>

          {/* Remark */}
          <div className="grid gap-2">
            <Label htmlFor="remark">Remark</Label>
            <Textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Enter any additional remarks..."
              rows={4}
              disabled={submitting}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)} 
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || !selectedStage || !outcome.trim()}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}