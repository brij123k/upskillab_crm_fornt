import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, TrendingUp, ListTodo, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { StageType } from '@/types/lead';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea'; // Make sure this is imported

interface ChangeStageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLead: any;
  stages: StageType[];
  loadingStages: boolean;
  changingStage: boolean;
  onSubmit: (leadId: string, stageId: string, reason: string) => Promise<void>; // Added reason parameter
}

export function ChangeStageModal({
  open,
  onOpenChange,
  selectedLead,
  stages,
  loadingStages,
  changingStage,
  onSubmit
}: ChangeStageModalProps) {
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');

  useEffect(() => {
    if (selectedLead && open) {
      setSelectedStage(selectedLead.stageId._id);
      setReason(''); // Reset reason when modal opens
    }
  }, [selectedLead, open]);

  useEffect(() => {
    const checkDropdownPosition = () => {
      if (open) {
        const selectTrigger = document.querySelector('[role="combobox"]');
        if (selectTrigger) {
          const rect = selectTrigger.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;
          const estimatedDropdownHeight = Math.min(stages.length * 48, 300);
          setDropdownPosition(spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow ? 'top' : 'bottom');
        }
      }
    };
    checkDropdownPosition();
    window.addEventListener('resize', checkDropdownPosition);
    return () => window.removeEventListener('resize', checkDropdownPosition);
  }, [open, stages.length]);

  const handleSubmit = async () => {
    if (!selectedLead || !selectedStage) return;
    if (!reason.trim()) {
      // Show error or toast - you can add a toast here
      return;
    }
    try {
      await onSubmit(selectedLead._id, selectedStage, reason.trim());
      onOpenChange(false);
    } catch (error) {
      // Error handled by parent
    }
  };

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const currentStageIndex = sortedStages.findIndex(stage => stage._id === selectedLead?.stageId._id);
  const selectedStageIndex = sortedStages.findIndex(stage => stage._id === selectedStage);
  const isMovingForward = selectedStageIndex > currentStageIndex;
  const isMovingBackward = selectedStageIndex < currentStageIndex;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800">Change Lead Stage</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Update the pipeline stage for {selectedLead?.name}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-5">
            {/* Current Stage Card */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Current Stage</Label>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
                      <ListTodo className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{selectedLead?.stageId.name}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-slate-200 text-slate-500 bg-white">
                    Current
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stage Selector */}
            <div className="space-y-1.5">
              <Label htmlFor="stage" className="text-sm font-medium text-slate-700">Select New Stage *</Label>
              <Select
                value={selectedStage}
                onValueChange={setSelectedStage}
                disabled={changingStage || loadingStages}
              >
                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white focus:ring-orange-500">
                  <SelectValue placeholder="Select a stage" />
                </SelectTrigger>
                <SelectContent
                  className="max-h-[280px] rounded-xl border-slate-200"
                  position={dropdownPosition}
                  sideOffset={5}
                  align="center"
                  avoidCollisions={true}
                  collisionBoundary="viewport"
                  sticky="always"
                >
                  {loadingStages ? (
                    <div className="py-6 text-center">
                      <Loader2 className="w-5 h-5 mx-auto animate-spin text-orange-500" />
                    </div>
                  ) : (
                    <div className="py-1">
                      {sortedStages.map((stage) => (
                        <SelectItem
                          key={stage._id}
                          value={stage._id}
                          className="text-sm py-2.5 px-3 cursor-pointer hover:bg-orange-50 focus:bg-orange-50 data-[highlighted]:bg-orange-50"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                stage._id === selectedLead?.stageId._id ? "bg-orange-500" : "bg-slate-300"
                              )} />
                              <span>{stage.name}</span>
                            </div>
                            {stage._id === selectedLead?.stageId._id && (
                              <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500 ml-2">
                                Current
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  )}
                </SelectContent>
              </Select>
              {sortedStages.length > 5 && (
                <p className="text-xs text-slate-400 mt-1">Scroll to see all {sortedStages.length} stages</p>
              )}
            </div>

            {/* NEW: Reason Field */}
            {selectedStage && selectedStage !== selectedLead?.stageId._id && (
              <div className="space-y-1.5">
                <Label htmlFor="reason" className="text-sm font-medium text-slate-700">
                  Reason for Stage Change *
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for changing the stage..."
                  className="min-h-[80px] rounded-xl border-slate-200 focus:ring-orange-500 focus:border-orange-500 resize-y"
                  disabled={changingStage}
                  rows={3}
                />
                <p className="text-xs text-slate-500">
                  This reason will be recorded in the lead history.
                </p>
              </div>
            )}

            {/* Validation Message */}
            {selectedStage && selectedStage !== selectedLead?.stageId._id && !reason.trim() && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    Please provide a reason for changing the stage
                  </p>
                </div>
              </div>
            )}

            {/* Stage Movement Visualization */}
            {selectedStage && selectedStage !== selectedLead?.stageId._id && (
              <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-sm text-slate-800">Stage Movement</span>
                  </div>
                  <Badge className={cn(
                    "text-xs",
                    isMovingForward ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"
                  )}>
                    {isMovingForward ? "Moving Forward" : "Moving Backward"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-center flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-slate-800">{selectedLead?.stageId.name}</div>
                    <div className="text-xs text-slate-500">From</div>
                  </div>
                  <ArrowRight className={cn(
                    "w-5 h-5 flex-shrink-0",
                    isMovingForward ? "text-emerald-600" : "text-amber-600"
                  )} />
                  <div className="text-center flex-1 min-w-0">
                    <div className="font-medium text-sm truncate text-slate-800">
                      {sortedStages.find(s => s._id === selectedStage)?.name}
                    </div>
                    <div className="text-xs text-slate-500">To</div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600">
                  {isMovingForward ? (
                    <p className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Moving lead forward in the pipeline</p>
                  ) : (
                    <p className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Moving lead backward in the pipeline</p>
                  )}
                </div>
              </div>
            )}

            {/* Stage Preview */}
            {selectedStage && selectedStage !== selectedLead?.stageId._id && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="text-sm font-medium text-slate-700 mb-2">New Stage Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Stage Name:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[60%]">
                      {sortedStages.find(s => s._id === selectedStage)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Movement:</span>
                    <span className={cn(
                      "font-medium",
                      isMovingForward ? "text-emerald-600" : "text-amber-600"
                    )}>
                      {Math.abs(selectedStageIndex - currentStageIndex)} step(s) {isMovingForward ? "forward" : "backward"}
                    </span>
                  </div>
                  {reason && (
                    <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                      <span className="text-slate-500">Reason:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[60%]">{reason}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={changingStage}
              className="flex-1 sm:flex-none rounded-xl border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                changingStage || 
                !selectedStage || 
                selectedStage === selectedLead?.stageId._id ||
                !reason.trim()
              }
              className={cn(
                "flex-1 sm:flex-none rounded-xl text-white",
                isMovingForward ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"
              )}
            >
              {changingStage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>{isMovingForward ? "Move Forward" : "Move Backward"}</>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Global style for thin scrollbar */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </Dialog>
  );
}