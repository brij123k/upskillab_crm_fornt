import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Calendar, Phone, User, RefreshCw, Clock, MessageSquare, Users, TrendingUp, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryActionBy {
  _id: string;
  name: string;
  email: string;
}

interface HistoryUser {
  _id: string;
  name: string;
  email: string;
}

interface LeadHistoryType {
  _id: string;
  leadId: string;
  actionType: string;
  actionBy: HistoryActionBy;
  fromUser?: HistoryUser;
  toUser?: HistoryUser;
  changes: any;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface LeadHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadHistory: LeadHistoryType[];
  loadingHistory: boolean;
  selectedLeadName?: string;
  onRefresh: () => void;
}

export function LeadHistoryModal({
  open,
  onOpenChange,
  leadHistory,
  loadingHistory,
  selectedLeadName,
  onRefresh,
}: LeadHistoryModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return <FileText className="w-4 h-4" />;
      case 'updated':
        return <RefreshCw className="w-4 h-4" />;
      case 'call_log':
        return <Phone className="w-4 h-4" />;
      case 'stage changed by calls':
        return <TrendingUp className="w-4 h-4" />;
      case 'assigned':
        return <Users className="w-4 h-4" />;
      case 'lead_schedule':
        return <Calendar className="w-4 h-4" />;
      case 'status_changed':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return <Badge className="bg-green-100 text-green-800">Created</Badge>;
      case 'updated':
        return <Badge className="bg-blue-100 text-blue-800">Updated</Badge>;
      case 'call_log':
        return <Badge className="bg-purple-100 text-purple-800">Call Log</Badge>;
      case 'stage changed by calls':
        return <Badge className="bg-indigo-100 text-indigo-800">Stage Changed</Badge>;
      case 'assigned':
        return <Badge className="bg-yellow-100 text-yellow-800">Assigned</Badge>;
      case 'lead_schedule':
        return <Badge className="bg-pink-100 text-pink-800">Scheduled</Badge>;
      case 'status_changed':
        return <Badge className="bg-orange-100 text-orange-800">Status Changed</Badge>;
      default:
        return <Badge variant="outline">{actionType}</Badge>;
    }
  };

  const renderChanges = (history: LeadHistoryType) => {
    const { actionType, changes, reason } = history;

    switch (actionType) {
      case 'created':
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Lead created with details:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {changes.name && (
                <div>
                  <span className="text-muted-foreground">Name:</span>{' '}
                  <span className="font-medium">{changes.name}</span>
                </div>
              )}
              {changes.phone && (
                <div>
                  <span className="text-muted-foreground">Phone:</span>{' '}
                  <span className="font-medium">{changes.phone}</span>
                </div>
              )}
              {changes.email && (
                <div>
                  <span className="text-muted-foreground">Email:</span>{' '}
                  <span className="font-medium">{changes.email}</span>
                </div>
              )}
              {changes.source && (
                <div>
                  <span className="text-muted-foreground">Source:</span>{' '}
                  <span className="font-medium">{changes.source}</span>
                </div>
              )}
              {/* {changes.stageId && (
                <div>
                  <span className="text-muted-foreground">Initial Stage:</span>{' '}
                  <span className="font-medium">{changes.stageId}</span>
                </div>
              )} */}
            </div>
            {reason && (
              <div className="text-sm">
                <span className="font-medium">Reason:</span>{' '}
                <span className="text-muted-foreground">{reason}</span>
              </div>
            )}
          </div>
        );

      case 'call_log':
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {changes.duration !== undefined && (
                <div>
                  <span className="text-muted-foreground">Duration:</span>{' '}
                  <span className="font-medium">{changes.duration} seconds</span>
                </div>
              )}
              {changes.outcome && (
                <div>
                  <span className="text-muted-foreground">Outcome:</span>{' '}
                  <span className="font-medium">{changes.outcome}</span>
                </div>
              )}
              {changes.startedAt && (
                <div>
                  <span className="text-muted-foreground">Started:</span>{' '}
                  <span className="font-medium">
                    {new Date(changes.startedAt).toLocaleString()}
                  </span>
                </div>
              )}
              {changes.stageId && (
                <div>
                  <span className="text-muted-foreground">Stage:</span>{' '}
                  <span className="font-medium">{changes.stageId}</span>
                </div>
              )}
            </div>
            {reason && (
              <div className="text-sm">
                <span className="font-medium">Notes:</span>{' '}
                <span className="text-muted-foreground">{reason}</span>
              </div>
            )}
          </div>
        );

      case 'stage changed by calls':
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Stage changed from </span>
              <Badge variant="outline" className="mx-1">
                {changes.status?.from || 'Unknown'}
              </Badge>
              <span className="font-medium"> to </span>
              <Badge variant="outline" className="mx-1">
                {changes.status?.to || 'Unknown'}
              </Badge>
            </div>
          </div>
        );

      case 'assigned':
        return (
          <div className="space-y-2">
            <div className="text-sm">
              {history.fromUser ? (
                <>
                  <span className="font-medium">Reassigned from </span>
                  <span className="text-primary">{history.fromUser.name}</span>
                  <span className="font-medium"> to </span>
                  <span className="text-primary">{history.toUser?.name}</span>
                </>
              ) : (
                <>
                  <span className="font-medium">Assigned to </span>
                  <span className="text-primary">{history.toUser?.name}</span>
                </>
              )}
            </div>
            {reason && (
              <div className="text-sm">
                <span className="font-medium">Reason:</span>{' '}
                <span className="text-muted-foreground">{reason}</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Modified by: {history.changes.modifiedBy || 'System'}
            </div>
          </div>
        );

      case 'lead_schedule':
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">{changes.message || 'Lead Scheduled'}</span>
            </div>
            {changes.scheduler && (
              <div className="text-sm">
                <span className="text-muted-foreground">Scheduled for:</span>{' '}
                <span className="font-medium">
                  {new Date(changes.scheduler).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        );

      case 'updated':
        return (
          <div className="space-y-2">
            {changes.scheduler ? (
              <>
                <div className="text-sm">
                  <span className="font-medium">{changes.message || 'Lead Scheduled'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Scheduled for:</span>{' '}
                  <span className="font-medium">
                    {new Date(changes.scheduler).toLocaleString()}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-sm">
                <span className="font-medium">Lead information updated</span>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Action: </span>
              <span className="text-muted-foreground">{actionType}</span>
            </div>
            {reason && (
              <div className="text-sm">
                <span className="font-medium">Reason:</span>{' '}
                <span className="text-muted-foreground">{reason}</span>
              </div>
            )}
            {changes && Object.keys(changes).length > 0 && (
              <div className="text-xs text-muted-foreground">
                Changes: {JSON.stringify(changes)}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Fixed Header */}
        <DialogHeader className="px-1 pt-1 pb-2 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                <FileText className="w-3 h-3" />
                Lead History
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {selectedLeadName ? `Complete history for ${selectedLeadName}` : 'Lead activity history'}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loadingHistory}
              className="h-9"
            >
              {loadingHistory ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Loading lead history...</p>
              </div>
            </div>
          ) : leadHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No history found</h3>
              <p className="text-muted-foreground text-center">
                No activity history recorded for this lead yet.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Timeline */}
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-muted" />

                {leadHistory.map((history, index) => (
                  <div key={history._id} className="relative pl-14 pb-6">
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        'absolute left-5 top-2 w-3 h-3 rounded-full border-4 border-background z-10',
                        {
                          'bg-green-500': history.actionType === 'created',
                          'bg-blue-500': history.actionType === 'updated',
                          'bg-purple-500': history.actionType === 'call_log',
                          'bg-indigo-500': history.actionType === 'stage changed by calls',
                          'bg-yellow-500': history.actionType === 'assigned',
                          'bg-pink-500': history.actionType === 'lead_schedule',
                          'bg-orange-500': history.actionType === 'status_changed',
                          'bg-gray-500': true, // default
                        }
                      )}
                    />

                    {/* Content card */}
                    <div className="border rounded-lg p-4 bg-card shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-muted">
                            {getActionIcon(history.actionType)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              {getActionBadge(history.actionType)}
                              <span className="text-sm font-medium">
                                by {history.actionBy.name}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(history.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Changes content */}
                      <div className="mt-3 pt-3 border-t">
                        {renderChanges(history)}
                      </div>

                      {/* Additional info */}
                      <div className="mt-3 pt-3 border-t">
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>User: {history.actionBy.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{history.actionBy.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="px-2 py-1 border-t shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}