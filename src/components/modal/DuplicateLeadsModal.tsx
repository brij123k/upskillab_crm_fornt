import { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Users, Merge, AlertTriangle, Crown, Trash2, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getDataHandlerWithToken, postDataHandlerWithToken } from '@/config/services';
import { cn } from '@/lib/utils';

interface DuplicateLeadGroup {
  leads: LeadType[];
  count: number;
  phone: string;
  email: string;
}

interface LeadType {
  _id: string;
  leadId: number;
  name: string;
  phone: string;
  email: string;
  source: string;
  stageId: {
    _id: string;
    name: string;
    order: number;
  };
  status: 'active' | 'lost' | 'converted';
  healthScore: number;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

interface DuplicateLeadsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMergeSuccess: () => void;
}

export function DuplicateLeadsModal({
  open,
  onOpenChange,
  onMergeSuccess
}: DuplicateLeadsModalProps) {
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateLeadGroup[]>([]);
  // Store selections by leadId (number) instead of _id (string)
  const [selectedLeads, setSelectedLeads] = useState<{[key: string]: boolean}>({});
  // Store master leads by leadId (number) instead of _id (string)
  const [masterLeads, setMasterLeads] = useState<{[key: string]: string}>({});
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({});

  // Fetch duplicate leads
  const fetchDuplicateLeads = async () => {
    try {
      setLoading(true);
      const response = await getDataHandlerWithToken("leaddoublicateFinder", null, null);
      
      if (response) {
        setDuplicateGroups(response);
        
        // Initialize selections: first lead as master, others as duplicates
        const initialSelected: {[key: string]: boolean} = {};
        const initialMaster: {[key: string]: string} = {};
        
        response.forEach((group: DuplicateLeadGroup) => {
          if (group.leads.length > 0) {
            // Select all leads by default using leadId as key
            group.leads.forEach(lead => {
              initialSelected[lead.leadId.toString()] = true;
            });
            
            // Set first lead as master using leadId
            initialMaster[`${group.phone}-${group.email}`] = group.leads[0].leadId.toString();
            
            // Expand groups with more than 3 leads
            if (group.leads.length > 3) {
              setExpandedGroups(prev => ({
                ...prev,
                [`${group.phone}-${group.email}`]: true
              }));
            }
          }
        });
        
        setSelectedLeads(initialSelected);
        setMasterLeads(initialMaster);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch duplicate leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDuplicateLeads();
    } else {
      // Reset state when modal closes
      setDuplicateGroups([]);
      setSelectedLeads({});
      setMasterLeads({});
      setExpandedGroups({});
    }
  }, [open]);

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => ({
      ...prev,
      [leadId]: !prev[leadId]
    }));
  };

  const setAsMasterLead = (groupId: string, leadId: string) => {
    setMasterLeads(prev => ({
      ...prev,
      [groupId]: leadId
    }));
  };

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const selectAllInGroup = (groupId: string, leads: LeadType[]) => {
    const newSelected = { ...selectedLeads };
    leads.forEach(lead => {
      newSelected[lead.leadId.toString()] = true;
    });
    setSelectedLeads(newSelected);
  };

  const deselectAllInGroup = (groupId: string, leads: LeadType[]) => {
    const newSelected = { ...selectedLeads };
    leads.forEach(lead => {
      newSelected[lead.leadId.toString()] = false;
    });
    // Ensure at least one lead remains selected as master
    const masterId = masterLeads[groupId];
    if (masterId) {
      newSelected[masterId] = true;
    }
    setSelectedLeads(newSelected);
  };

  const handleMerge = async () => {
    try {
      setMerging(true);
      
      // Prepare merge operations for each group
      const mergeOperations = duplicateGroups
        .map((group) => {
          const groupId = `${group.phone}-${group.email}`;
          const masterLeadId = masterLeads[groupId];
          
          if (!masterLeadId) {
            return null;
          }

          // Get selected duplicate leads (excluding the master)
          const duplicateLeadIds = group.leads
            .filter(lead => selectedLeads[lead.leadId.toString()] && lead.leadId.toString() !== masterLeadId)
            .map(lead => lead.leadId);

          if (duplicateLeadIds.length === 0) {
            return null; // Nothing to merge
          }

          return { 
            masterLeadId: parseInt(masterLeadId), 
            duplicateLeadIds 
          };
        })
        .filter(Boolean);

      if (mergeOperations.length === 0) {
        toast({
          title: "No Changes",
          description: "No duplicate leads selected for merging",
        });
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      
      console.log("Merge operations to send:", mergeOperations);

      // Process each merge operation separately
      for (const operation of mergeOperations) {
        if (!operation) continue;
        
        try {
          console.log("Sending merge data:", operation);
          await postDataHandlerWithToken("leadmerge", operation);
          successCount++;
        } catch (error: any) {
          errorCount++;
          console.error("Merge failed for operation:", operation, error);
          toast({
            title: `Merge failed for group`,
            description: error.response?.data?.message || "Failed to merge duplicate leads",
            variant: "destructive",
          });
        }
      }

      if (successCount > 0) {
        toast({
          title: "Merge Complete",
          description: `Successfully merged ${successCount} group(s). ${errorCount} failed.`,
        });
      }

      onMergeSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to merge duplicate leads",
        variant: "destructive",
      });
    } finally {
      setMerging(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'lost':
        return <Badge className="bg-red-100 text-red-800">Lost</Badge>;
      case 'converted':
        return <Badge className="bg-blue-100 text-blue-800">Converted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalSelectedLeads = () => {
    return Object.values(selectedLeads).filter(Boolean).length;
  };

  const getTotalMergeOperations = () => {
    return duplicateGroups.filter(group => {
      const groupId = `${group.phone}-${group.email}`;
      const masterLeadId = masterLeads[groupId];
      if (!masterLeadId) return false;
      
      const duplicateCount = group.leads
        .filter(lead => selectedLeads[lead.leadId.toString()] && lead.leadId.toString() !== masterLeadId)
        .length;
      
      return duplicateCount > 0;
    }).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Duplicate Leads Finder
          </DialogTitle>
          <DialogDescription>
            Find and merge duplicate leads to keep your database clean.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Scanning for duplicate leads...</p>
          </div>
        ) : duplicateGroups.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">No Duplicates Found</h3>
            <p className="text-muted-foreground mt-1">
              Your leads database is clean! No duplicate leads found.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-700 font-medium">Duplicate Groups</div>
                <div className="text-2xl font-bold text-blue-900">{duplicateGroups.length}</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-sm text-yellow-700 font-medium">Selected for Merge</div>
                <div className="text-2xl font-bold text-yellow-900">{getTotalSelectedLeads()}</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-sm text-purple-700 font-medium">Merge Operations</div>
                <div className="text-2xl font-bold text-purple-900">{getTotalMergeOperations()}</div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-yellow-800">Merge Instructions</p>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    <li>• Select a <strong>Master Lead</strong> (will keep all data)</li>
                    <li>• Select duplicate leads to merge into the master</li>
                    <li>• Duplicate leads will be deactivated after merge</li>
                    <li>• All activities will be transferred to the master lead</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Duplicate Groups */}
            <div className="space-y-4">
              {duplicateGroups.map((group, groupIndex) => {
                const groupId = `${group.phone}-${group.email}`;
                const masterLeadId = masterLeads[groupId];
                const isExpanded = expandedGroups[groupId];
                const displayLeads = isExpanded ? group.leads : group.leads.slice(0, 3);
                const hasMoreLeads = group.leads.length > 3;

                return (
                  <div key={groupId} className="border rounded-lg overflow-hidden">
                    {/* Group Header */}
                    <div className="bg-muted/50 px-4 py-3 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-white">
                            Group {groupIndex + 1}
                          </Badge>
                          <div>
                            <div className="font-medium">
                              {group.count} duplicate leads found
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Phone: {group.phone} • Email: {group.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => selectAllInGroup(groupId, group.leads)}
                          >
                            Select All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deselectAllInGroup(groupId, group.leads)}
                          >
                            Deselect All
                          </Button>
                          {hasMoreLeads && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleGroupExpansion(groupId)}
                            >
                              {isExpanded ? 'Show Less' : `+${group.leads.length - 3} more`}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Leads Table */}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Select</TableHead>
                            <TableHead className="w-16">Master</TableHead>
                            <TableHead>Lead Details</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead>Created</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayLeads.map((lead) => {
                            const leadIdStr = lead.leadId.toString();
                            const isSelected = selectedLeads[leadIdStr];
                            const isMaster = masterLeadId === leadIdStr;

                            return (
                              <TableRow 
                                key={lead._id}
                                className={cn(
                                  !isSelected && "opacity-50",
                                  isMaster && "bg-blue-50"
                                )}
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleLeadSelection(leadIdStr)}
                                    disabled={isMaster} // Master lead cannot be deselected
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant={isMaster ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                      "w-full",
                                      isMaster && "bg-green-600 hover:bg-green-700"
                                    )}
                                    onClick={() => setAsMasterLead(groupId, leadIdStr)}
                                    disabled={!isSelected}
                                  >
                                    {isMaster ? (
                                      <Crown className="w-3 h-3" />
                                    ) : (
                                      "Set Master"
                                    )}
                                  </Button>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{lead.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      ID: {lead.leadId}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {lead.stageId.name}
                                  </Badge>
                                </TableCell>
                                <TableCell>{getStatusBadge(lead.status)}</TableCell>
                                <TableCell>
                                  {lead.assignedTo ? (
                                    <div className="text-sm">
                                      {lead.assignedTo.name}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">Not assigned</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {formatDate(lead.createdAt)}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Group Footer */}
                    {masterLeadId && (
                      <div className="bg-green-50 border-t px-4 py-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-700">
                              Master Lead Selected: {
                                group.leads.find(l => l.leadId.toString() === masterLeadId)?.name
                              } (ID: {masterLeadId})
                            </span>
                          </div>
                          <div className="text-green-600">
                            {
                              group.leads.filter(l => 
                                selectedLeads[l.leadId.toString()] && l.leadId.toString() !== masterLeadId
                              ).length
                            } duplicates selected for merge
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Merge Summary */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Merge Summary</h4>
                  <p className="text-sm text-muted-foreground">
                    {getTotalMergeOperations()} groups will be merged, affecting {getTotalSelectedLeads()} leads
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Reset all selections
                      const resetSelected: {[key: string]: boolean} = {};
                      const resetMaster: {[key: string]: string} = {};
                      
                      duplicateGroups.forEach(group => {
                        const groupId = `${group.phone}-${group.email}`;
                        if (group.leads.length > 0) {
                          resetSelected[group.leads[0].leadId.toString()] = true;
                          resetMaster[groupId] = group.leads[0].leadId.toString();
                        }
                      });
                      
                      setSelectedLeads(resetSelected);
                      setMasterLeads(resetMaster);
                    }}
                  >
                    Reset Selection
                  </Button>
                  <Button
                    onClick={handleMerge}
                    disabled={merging || getTotalMergeOperations() === 0}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {merging ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Merging...
                      </>
                    ) : (
                      <>
                        <Merge className="mr-2 h-4 w-4" />
                        Merge Selected ({getTotalMergeOperations()} groups)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={merging}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={fetchDuplicateLeads}
            disabled={loading || merging}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              'Rescan for Duplicates'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}