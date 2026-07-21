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
import { Loader2, FileText, Calendar, Phone, User, RefreshCw, Clock, MessageSquare, Users, TrendingUp, Mail, Video, ClipboardList } from 'lucide-react';
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
  meet_log?: any;
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
        return <FileText className="w-4 h-4 text-orange-600" />;
      case 'updated':
        return <RefreshCw className="w-4 h-4 text-orange-600" />;
      case 'call_log':
        return <Phone className="w-4 h-4 text-orange-600" />;
      case 'stage changed by calls':
        return <TrendingUp className="w-4 h-4 text-orange-600" />;
      case 'assigned':
        return <Users className="w-4 h-4 text-orange-600" />;
      case 'lead_schedule':
        return <Calendar className="w-4 h-4 text-orange-600" />;
      case 'status_changed':
        return <TrendingUp className="w-4 h-4 text-orange-600" />;
      case 'meet_log':
        return <Video className="w-4 h-4 text-orange-600" />;
      case 'meet_log_feedback':
        return <ClipboardList className="w-4 h-4 text-orange-600" />;
      default:
        return <FileText className="w-4 h-4 text-orange-600" />;
    }
  };

  const formatActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return 'Lead Created';
      case 'updated':
        return 'Lead Updated';
      case 'call_log':
        return 'Call Logged';
      case 'stage changed by calls':
        return 'Stage Changed';
      case 'assigned':
        return 'Lead Assigned';
      case 'lead_schedule':
        return 'Meeting Scheduled';
      case 'status_changed':
        return 'Status Changed';
      case 'meet_log':
        return 'Meeting Conducted';
      case 'meet_log_feedback':
        return 'Meeting Feedback';
      default:
        return actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const renderChanges = (history: LeadHistoryType) => {
    const { actionType, changes, reason, meet_log } = history;

    switch (actionType) {
      case 'created':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {changes.name && (
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Name</div>
                  <div className="text-sm font-medium text-slate-800 mt-0.5">{changes.name}</div>
                </div>
              )}
              {changes.phone && (
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Phone</div>
                  <div className="text-sm font-medium text-slate-800 mt-0.5">{changes.phone}</div>
                </div>
              )}
              {changes.email && (
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Email</div>
                  <div className="text-sm font-medium text-slate-800 mt-0.5">{changes.email}</div>
                </div>
              )}
              {changes.source && (
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Source</div>
                  <div className="text-sm font-medium text-slate-800 mt-0.5">{changes.source}</div>
                </div>
              )}
            </div>
            {reason && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-400 uppercase tracking-wide">Reason</div>
                <div className="text-sm text-slate-600 mt-0.5">{reason}</div>
              </div>
            )}
          </div>
        );

      case 'call_log':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {changes.duration !== undefined && (
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Duration</div>
                  <div className="text-sm font-medium text-slate-800 mt-0.5">{formatDuration(changes.duration)}</div>
                </div>
              )}
              {changes.startedAt && (
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Started At</div>
                  <div className="text-sm font-medium text-slate-800 mt-0.5">{formatDate(changes.startedAt)}</div>
                </div>
              )}
            </div>
            {changes.outcome && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-400 uppercase tracking-wide">Outcome</div>
                <div className="text-sm text-slate-600 mt-0.5">{changes.outcome}</div>
              </div>
            )}
            {reason && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-400 uppercase tracking-wide">Notes</div>
                <div className="text-sm text-slate-600 mt-0.5">{reason}</div>
              </div>
            )}
          </div>
        );

      case 'stage changed by calls':
case 'stage_changed':
case 'status_changed':
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
        <span className="text-sm font-medium text-slate-700">{changes.status?.from || changes.stage?.from || 'Unknown'}</span>
        <TrendingUp className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-medium text-slate-700">{changes.status?.to || changes.stage?.to || 'Unknown'}</span>
      </div>
      {reason && (
        <div className="pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-400 uppercase tracking-wide">Reason</div>
          <div className="text-sm text-slate-600 mt-0.5">{reason}</div>
        </div>
      )}
    </div>
  );

      case 'assigned':
        return (
          <div className="space-y-3">
            <div className="flex items-center flex-wrap gap-1 text-sm">
              {history.fromUser ? (
                <>
                  <span className="text-slate-600">Reassigned from</span>
                  <span className="font-medium text-orange-700">{history.fromUser.name}</span>
                  <span className="text-slate-600">to</span>
                  <span className="font-medium text-orange-700">{history.toUser?.name}</span>
                </>
              ) : (
                <>
                  <span className="text-slate-600">Assigned to</span>
                  <span className="font-medium text-orange-700">{history.toUser?.name}</span>
                </>
              )}
            </div>
            {reason && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-400 uppercase tracking-wide">Reason</div>
                <div className="text-sm text-slate-600 mt-0.5">{reason}</div>
              </div>
            )}
            <div className="text-xs text-slate-400">
              Modified by: {history.actionBy.name || 'System'}
            </div>
          </div>
        );

      case 'lead_schedule':
        return (
          <div className="space-y-3">
            <div className="text-sm text-slate-700">{changes.message || 'Meeting Scheduled'}</div>
            {changes.scheduler && (
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Scheduled On</div>
                <div className="text-sm font-medium text-slate-800 mt-0.5">{formatDate(changes.scheduler)}</div>
              </div>
            )}
          </div>
        );

      case 'updated':
        return (
          <div className="space-y-3">
            {changes.scheduler ? (
              <>
                <div className="text-sm text-slate-700">{changes.message || 'Meeting Scheduled'}</div>
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Scheduled on</div>
                  <div className="text-sm font-medium text-slate-800 mt-0.5">{formatDate(changes.scheduler)}</div>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-600">Lead information was updated</div>
            )}
          </div>
        );

      case 'meet_log':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {changes.meetingType && (
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Meeting Type</div>
                  <div className="text-sm font-medium text-slate-800 mt-0.5">{changes.meetingType}</div>
                </div>
              )}
              {changes.duration !== undefined && (
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Duration</div>
                  <div className="text-sm font-medium text-slate-800 mt-0.5">{formatDuration(changes.duration)}</div>
                </div>
              )}
              {changes.startedAt && (
                <div className="col-span-2">
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Started At</div>
                  <div className="text-sm font-medium text-slate-800 mt-0.5">{formatDate(changes.startedAt)}</div>
                </div>
              )}
            </div>
            {changes.outcome && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-400 uppercase tracking-wide">Outcome</div>
                <div className="text-sm text-slate-600 mt-0.5">{changes.outcome}</div>
              </div>
            )}
            {changes.notes && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-400 uppercase tracking-wide">Notes</div>
                <div className="text-sm text-slate-600 mt-0.5">{changes.notes}</div>
              </div>
            )}
          </div>
        );

      case 'meet_log_feedback':
        return (
          <div className="space-y-3">
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-xs text-orange-600 uppercase tracking-wide mb-1">Feedback</div>
              <div className="text-sm text-slate-700">{changes.feedback || reason}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {meet_log?.meetingType && (
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Meeting Type</div>
                  <div className="text-sm font-medium text-slate-800 mt-0.5">{meet_log.meetingType}</div>
                </div>
              )}
              {meet_log?.duration !== undefined && (
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Duration</div>
                  <div className="text-sm font-medium text-slate-800 mt-0.5">{formatDuration(meet_log.duration)}</div>
                </div>
              )}
              {meet_log?.outcome && (
                <div className="col-span-2">
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Outcome</div>
                  <div className="text-sm font-medium text-slate-800 mt-0.5">{meet_log.outcome}</div>
                </div>
              )}
              {meet_log?.startedAt && (
                <div className="col-span-2">
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Started At</div>
                  <div className="text-sm font-medium text-slate-800 mt-0.5">{formatDate(meet_log.startedAt)}</div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-3">
            <div className="text-sm text-slate-600">Action: {actionType}</div>
            {reason && (
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Reason</div>
                <div className="text-sm text-slate-600 mt-0.5">{reason}</div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                Lead History
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 mt-1">
                {selectedLeadName ? `Activity timeline for ${selectedLeadName}` : 'Lead activity timeline'}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loadingHistory}
              className="rounded-xl border-slate-200 hover:bg-slate-50 hover:border-orange-200 transition-colors"
            >
              {loadingHistory ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50/30">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-400" />
                <p className="mt-3 text-sm text-slate-500">Loading history...</p>
              </div>
            </div>
          ) : leadHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-base font-medium text-slate-700 mb-1">No history found</h3>
              <p className="text-sm text-slate-400 text-center">No activity recorded for this lead yet.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline vertical line */}
              <div className="absolute left-[21px] top-0 bottom-0 w-px bg-slate-200" />

              {leadHistory.map((history, idx) => (
                <div key={history._id} className="relative pl-12 pb-6 last:pb-0">
                  {/* Timeline dot with orange accent */}
                  <div className="absolute left-[13px] top-1.5 w-3 h-3 rounded-full bg-orange-500 ring-4 ring-white z-10" />

                  {/* Card */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="p-4">
                      {/* Header with icon and action */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-orange-50 rounded-lg">
                          {getActionIcon(history.actionType)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="text-sm font-semibold text-orange-700">
                              {formatActionLabel(history.actionType)}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-sm text-slate-600">
                              by <span className="font-medium text-slate-800">{history.actionBy.name}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-500">{formatDate(history.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Changes content */}
                      {renderChanges(history)}

                      {/* Footer with user info */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-500">{history.actionBy.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-500 truncate">{history.actionBy.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white rounded-b-2xl">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl border-slate-200 hover:bg-slate-50 hover:border-orange-200 transition-colors"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}