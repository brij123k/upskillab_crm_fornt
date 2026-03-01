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
import { Loader2, ArrowRight, TrendingUp, ListTodo, CheckCircle, AlertCircle } from 'lucide-react';
import { StageType } from '@/types/lead';
import { cn } from '@/lib/utils';

interface ChangeStageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLead: any;
  stages: StageType[];
  loadingStages: boolean;
  changingStage: boolean;
  onSubmit: (leadId: string, stageId: string) => Promise<void>;
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
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');

  // Initialize selected stage when modal opens
  useEffect(() => {
    if (selectedLead && open) {
      setSelectedStage(selectedLead.stageId._id);
      console.log(selectedLead)
    }
  }, [selectedLead, open]);

  // Handle dropdown position based on available space
  useEffect(() => {
    const checkDropdownPosition = () => {
      if (open) {
        const selectTrigger = document.querySelector('[role="combobox"]');
        if (selectTrigger) {
          const rect = selectTrigger.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;
          const estimatedDropdownHeight = Math.min(stages.length * 48, 300); // Approximate height
          
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
    
    try {
        console.log(selectedLead._id, selectedStage)
      await onSubmit(selectedLead._id, selectedStage);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by parent component
    }
  };

  // Sort stages by order
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  
  // Get current stage index
  const currentStageIndex = sortedStages.findIndex(stage => stage._id === selectedLead?.stageId._id);
  const selectedStageIndex = sortedStages.findIndex(stage => stage._id === selectedStage);
  
  // Check if moving forward or backward
  const isMovingForward = selectedStageIndex > currentStageIndex;
  const isMovingBackward = selectedStageIndex < currentStageIndex;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-w-[calc(100vw-2rem)] mx-4 sm:mx-0 max-h-[90vh] overflow-hidden">
        <DialogHeader className="px-1">
          <DialogTitle className="text-lg sm:text-xl">Change Lead Stage</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Update the pipeline stage for {selectedLead?.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto px-1 py-2 max-h-[calc(90vh-180px)]">
          <div className="space-y-4 sm:space-y-6 py-2">
            {/* Current Stage */}
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">Current Stage</Label>
              <div className="p-3 sm:p-4 bg-muted rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ListTodo className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm sm:text-base">{selectedLead?.stageId.name}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-xs sm:text-sm w-fit">
                    Current
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stage Selector - Responsive Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="stage" className="text-sm sm:text-base">Select New Stage *</Label>
              <Select
                value={selectedStage}
                onValueChange={setSelectedStage}
                disabled={changingStage || loadingStages}
              >
                <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base w-full">
                  <SelectValue placeholder="Select a stage" />
                </SelectTrigger>
                <SelectContent 
                  className="max-h-[40vh] sm:max-h-[300px] overflow-y-auto"
                  position={dropdownPosition}
                  sideOffset={5}
                  align="center"
                  avoidCollisions={true}
                  collisionBoundary="viewport"
                  sticky="always"
                  hideWhenDetached={false}
                >
                  {loadingStages ? (
                    <div className="py-2 sm:py-3 text-center">
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mx-auto animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* Optional: Add a search/filter input for many stages */}
                      {sortedStages.length > 10 && (
                        <div className="sticky top-0 bg-background z-10 p-2 border-b">
                          <input
                            type="text"
                            placeholder="Search stages..."
                            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                      <div className="py-1">
                        {sortedStages.map((stage) => (
                          <SelectItem 
                            key={stage._id} 
                            value={stage._id} 
                            className="text-sm sm:text-base py-2 sm:py-2.5 px-3 sm:px-4 cursor-pointer hover:bg-accent focus:bg-accent"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "w-2 h-2 rounded-full flex-shrink-0",
                                  stage._id === selectedLead?.stageId._id ? "bg-primary" : "bg-gray-300"
                                )} />
                                <span className="truncate max-w-[200px] sm:max-w-none">{stage.name}</span>
                              </div>
                              {stage._id === selectedLead?.stageId._id && (
                                <Badge variant="outline" className="text-[10px] sm:text-xs ml-6 sm:ml-0 w-fit">
                                  Current
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    </>
                  )}
                </SelectContent>
              </Select>
              {/* Hint for scrolling on mobile */}
              {sortedStages.length > 5 && (
                <p className="text-xs text-muted-foreground mt-1 sm:hidden">
                  Scroll to see all {sortedStages.length} stages
                </p>
              )}
            </div>

            {/* Stage Flow Visualization */}
            {selectedStage && selectedStage !== selectedLead?.stageId._id && (
              <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50/50 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2 sm:gap-0">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    <span className="font-medium text-sm sm:text-base text-blue-900">Stage Movement</span>
                  </div>
                  {isMovingForward && (
                    <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm">
                      Moving Forward
                    </Badge>
                  )}
                  {isMovingBackward && (
                    <Badge className="bg-amber-100 text-amber-800 text-xs sm:text-sm">
                      Moving Backward
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  <div className="text-center flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base truncate">{selectedLead?.stageId.name}</div>
                    <div className="text-xs text-muted-foreground">From</div>
                  </div>
                  
                  <ArrowRight className={cn(
                    "w-5 h-5 sm:w-6 sm:h-6 mx-2 sm:mx-4 flex-shrink-0",
                    isMovingForward ? "text-green-600" : "text-amber-600"
                  )} />
                  
                  <div className="text-center flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base truncate">
                      {sortedStages.find(s => s._id === selectedStage)?.name}
                    </div>
                    <div className="text-xs text-muted-foreground">To</div>
                  </div>
                </div>
                
                <div className="mt-3 text-xs sm:text-sm text-blue-800">
                  {isMovingForward ? (
                    <p className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Moving lead forward in the pipeline</span>
                    </p>
                  ) : (
                    <p className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Moving lead backward in the pipeline</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Stage Preview */}
            {selectedStage && selectedStage !== selectedLead?.stageId._id && (
              <div className="p-3 sm:p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-medium mb-2">New Stage Details</h4>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1 sm:gap-0">
                    <span className="text-muted-foreground text-xs sm:text-sm">Stage Name:</span>
                    <span className="font-medium text-sm sm:text-base truncate">
                      {sortedStages.find(s => s._id === selectedStage)?.name}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1 sm:gap-0">
                    <span className="text-muted-foreground text-xs sm:text-sm">Movement:</span>
                    <span className={cn(
                      "font-medium text-sm sm:text-base",
                      isMovingForward ? "text-green-600" : "text-amber-600"
                    )}>
                      {Math.abs(selectedStageIndex - currentStageIndex)} step(s) {
                        isMovingForward ? "forward" : "backward"
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={changingStage}
            className="w-full sm:w-auto order-2 sm:order-1 text-sm sm:text-base"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={changingStage || !selectedStage || selectedStage === selectedLead?.stageId._id}
            className={cn(
              "w-full sm:w-auto order-1 sm:order-2 text-sm sm:text-base",
              isMovingForward && "bg-green-600 hover:bg-green-700",
              isMovingBackward && "bg-amber-600 hover:bg-amber-700"
            )}
          >
            {changingStage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                {isMovingForward ? "Move Forward" : "Move Backward"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}