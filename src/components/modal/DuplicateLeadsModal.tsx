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
import { Loader2, Users, Merge, AlertTriangle, Crown, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [selectedLeads, setSelectedLeads] = useState<{ [key: string]: boolean }>({});
  const [masterLeads, setMasterLeads] = useState<{ [key: string]: string }>({});
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});

  const fetchDuplicateLeads = async () => {
    try {
      setLoading(true);
      const response = await getDataHandlerWithToken("leaddoublicateFinder", null, null);
      if (response) {
        setDuplicateGroups(response);
        const initialSelected: { [key: string]: boolean } = {};
        const initialMaster: { [key: string]: string } = {};

        response.forEach((group: DuplicateLeadGroup) => {
          if (group.leads.length > 0) {
            group.leads.forEach(lead => {
              initialSelected[lead.leadId.toString()] = true;
            });
            initialMaster[`${group.phone}-${group.email}`] = group.leads[0].leadId.toString();

            if (group.leads.length > 3) {
              setExpandedGroups(prev => ({ ...prev, [`${group.phone}-${group.email}`]: true }));
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
      setDuplicateGroups([]);
      setSelectedLeads({});
      setMasterLeads({});
      setExpandedGroups({});
    }
  }, [open]);

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => ({ ...prev, [leadId]: !prev[leadId] }));
  };

  const setAsMasterLead = (groupId: string, leadId: string) => {
    setMasterLeads(prev => ({ ...prev, [groupId]: leadId }));
  };

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const selectAllInGroup = (groupId: string, leads: LeadType[]) => {
    const newSelected = { ...selectedLeads };
    leads.forEach(lead => { newSelected[lead.leadId.toString()] = true; });
    setSelectedLeads(newSelected);
  };

  const deselectAllInGroup = (groupId: string, leads: LeadType[]) => {
    const newSelected = { ...selectedLeads };
    leads.forEach(lead => { newSelected[lead.leadId.toString()] = false; });
    const masterId = masterLeads[groupId];
    if (masterId) newSelected[masterId] = true;
    setSelectedLeads(newSelected);
  };

  const handleMerge = async () => {
    try {
      setMerging(true);
      const mergeOperations = duplicateGroups
        .map((group) => {
          const groupId = `${group.phone}-${group.email}`;
          const masterLeadId = masterLeads[groupId];
          if (!masterLeadId) return null;
          const duplicateLeadIds = group.leads
            .filter(lead => selectedLeads[lead.leadId.toString()] && lead.leadId.toString() !== masterLeadId)
            .map(lead => lead.leadId);
          if (duplicateLeadIds.length === 0) return null;
          return { masterLeadId: parseInt(masterLeadId), duplicateLeadIds };
        })
        .filter(Boolean);

      if (mergeOperations.length === 0) {
        toast({ title: "No Changes", description: "No duplicate leads selected for merging" });
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const operation of mergeOperations) {
        if (!operation) continue;
        try {
          await postDataHandlerWithToken("leadmerge", operation);
          successCount++;
        } catch (error: any) {
          errorCount++;
          toast({
            title: `Merge failed for group`,
            description: error.response?.data?.message || "Failed to merge duplicate leads",
            variant: "destructive",
          });
        }
      }

      if (successCount > 0) {
        toast({ title: "Merge Complete", description: `Successfully merged ${successCount} group(s). ${errorCount} failed.` });
      }
      onMergeSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to merge duplicate leads", variant: "destructive" });
    } finally {
      setMerging(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>;
      case 'lost': return <Badge className="bg-red-100 text-red-700 border-red-200">Lost</Badge>;
      case 'converted': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Converted</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getTotalSelectedLeads = () => Object.values(selectedLeads).filter(Boolean).length;
  const getTotalMergeOperations = () => duplicateGroups.filter(group => {
    const groupId = `${group.phone}-${group.email}`;
    const masterLeadId = masterLeads[groupId];
    if (!masterLeadId) return false;
    return group.leads.filter(lead => selectedLeads[lead.leadId.toString()] && lead.leadId.toString() !== masterLeadId).length > 0;
  }).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] rounded-2xl border-slate-200 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            Duplicate Leads Finder
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Find and merge duplicate leads to keep your database clean.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
              <p className="mt-3 text-slate-500">Scanning for duplicate leads...</p>
            </div>
          ) : duplicateGroups.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">No Duplicates Found</h3>
              <p className="text-slate-500 mt-1">Your leads database is clean! No duplicate leads found.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-orange-50 rounded-xl border border-orange-100 p-4">
                  <div className="text-sm font-medium text-orange-700">Duplicate Groups</div>
                  <div className="text-2xl font-bold text-orange-800">{duplicateGroups.length}</div>
                </div>
                <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
                  <div className="text-sm font-medium text-amber-700">Selected for Merge</div>
                  <div className="text-2xl font-bold text-amber-800">{getTotalSelectedLeads()}</div>
                </div>
                <div className="bg-purple-50 rounded-xl border border-purple-100 p-4">
                  <div className="text-sm font-medium text-purple-700">Merge Operations</div>
                  <div className="text-2xl font-bold text-purple-800">{getTotalMergeOperations()}</div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-800">Merge Instructions</p>
                    <ul className="text-xs text-amber-700 space-y-1 list-disc pl-4">
                      <li>Select a <strong>Master Lead</strong> (will keep all data)</li>
                      <li>Select duplicate leads to merge into the master</li>
                      <li>Duplicate leads will be deactivated after merge</li>
                      <li>All activities will be transferred to the master lead</li>
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
                    <div key={groupId} className="border border-slate-200 rounded-xl overflow-hidden">
                      {/* Group Header */}
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
                              Group {groupIndex + 1}
                            </Badge>
                            <div>
                              <div className="font-medium text-slate-800">{group.count} duplicate leads found</div>
                              <div className="text-sm text-slate-500">
                                Phone: {group.phone} • Email: {group.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => selectAllInGroup(groupId, group.leads)} className="rounded-lg">
                              Select All
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => deselectAllInGroup(groupId, group.leads)} className="rounded-lg">
                              Deselect All
                            </Button>
                            {hasMoreLeads && (
                              <Button variant="ghost" size="sm" onClick={() => toggleGroupExpansion(groupId)} className="gap-1 rounded-lg">
                                {isExpanded ? (
                                  <>Show Less <ChevronUp className="w-4 h-4" /></>
                                ) : (
                                  <>+{group.leads.length - 3} more <ChevronDown className="w-4 h-4" /></>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Leads Table */}
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-white hover:bg-white">
                              <TableHead className="w-12 text-xs font-semibold text-slate-500">Select</TableHead>
                              <TableHead className="w-20 text-xs font-semibold text-slate-500">Master</TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500">Lead Details</TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500">Stage</TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500">Status</TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500">Assigned To</TableHead>
                              <TableHead className="text-xs font-semibold text-slate-500">Created</TableHead>
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
                                    isMaster && "bg-orange-50",
                                    "hover:bg-slate-50"
                                  )}
                                >
                                  <TableCell>
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => toggleLeadSelection(leadIdStr)}
                                      disabled={isMaster}
                                      className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant={isMaster ? "default" : "outline"}
                                      size="sm"
                                      className={cn(
                                        "w-full rounded-lg transition-all",
                                        isMaster && "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                                      )}
                                      onClick={() => setAsMasterLead(groupId, leadIdStr)}
                                      disabled={!isSelected}
                                    >
                                      {isMaster ? <Crown className="w-3 h-3" /> : "Set Master"}
                                    </Button>
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium text-slate-800">{lead.name}</div>
                                      <div className="text-xs text-slate-400">ID: {lead.leadId}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="border-slate-200 text-slate-600">
                                      {lead.stageId.name}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{getStatusBadge(lead.status)}</TableCell>
                                  <TableCell>
                                    {lead.assignedTo ? (
                                      <div className="text-sm text-slate-700">{lead.assignedTo.name}</div>
                                    ) : (
                                      <span className="text-sm text-slate-400">Not assigned</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-sm text-slate-600">{formatDate(lead.createdAt)}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Group Footer */}
                      {masterLeadId && (
                        <div className="bg-emerald-50 border-t border-emerald-100 px-4 py-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Crown className="w-4 h-4 text-emerald-600" />
                              <span className="font-medium text-emerald-700">
                                Master Lead: {group.leads.find(l => l.leadId.toString() === masterLeadId)?.name} (ID: {masterLeadId})
                              </span>
                            </div>
                            <div className="text-emerald-600">
                              {group.leads.filter(l => selectedLeads[l.leadId.toString()] && l.leadId.toString() !== masterLeadId).length} duplicates selected for merge
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Merge Summary */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-slate-800">Merge Summary</h4>
                    <p className="text-sm text-slate-500">
                      {getTotalMergeOperations()} groups will be merged, affecting {getTotalSelectedLeads()} leads
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const resetSelected: { [key: string]: boolean } = {};
                        const resetMaster: { [key: string]: string } = {};
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
                      className="rounded-xl border-slate-200"
                    >
                      Reset Selection
                    </Button>
                    <Button
                      onClick={handleMerge}
                      disabled={merging || getTotalMergeOperations() === 0}
                      className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
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
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={merging}
              className="flex-1 sm:flex-none rounded-xl border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={fetchDuplicateLeads}
              disabled={loading || merging}
              className="flex-1 sm:flex-none rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
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