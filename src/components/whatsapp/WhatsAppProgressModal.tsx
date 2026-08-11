// components/whatsapp/WhatsAppProgressModal.tsx
import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  Send,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CampaignProgress {
  campaignId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  pendingCount: number;
  currentLead?: {
    leadId: string;
    name: string;
    phone: string;
  };
  result?: 'SENT' | 'FAILED';
  messageId?: string;
  error?: string;
  timestamp: string;
  completedAt?: string;
}

interface WhatsAppProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  templateName: string;
  totalRecipients: number;
}

export function WhatsAppProgressModal({
  open,
  onOpenChange,
  campaignId,
  templateName,
  totalRecipients,
}: WhatsAppProgressModalProps) {
  const [progress, setProgress] = useState<CampaignProgress | null>(null);
  const [completed, setCompleted] = useState(false);
  const [isListening, setIsListening] = useState(true);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (open && campaignId) {
      // Get socket from existing connection
      // Import your existing socket service here
      // Example: const socket = getSocket();
      // socketRef.current = socket;
      
      // Listen for campaign progress
      // socketRef.current?.on('campaign-progress', handleProgressUpdate);
      // socketRef.current?.on('campaign-completed', handleCampaignComplete);
      
      // Set initial progress
      setProgress({
        campaignId,
        status: 'PROCESSING',
        totalRecipients,
        sentCount: 0,
        failedCount: 0,
        pendingCount: totalRecipients,
        timestamp: new Date().toISOString(),
      });

      // Simulate progress for demo (remove this in production)
      simulateProgress();
    }

    return () => {
      // Cleanup socket listeners
      // if (socketRef.current) {
      //   socketRef.current.off('campaign-progress', handleProgressUpdate);
      //   socketRef.current.off('campaign-completed', handleCampaignComplete);
      // }
    };
  }, [open, campaignId]);

  // Simulate progress for demo (remove this in production)
  const simulateProgress = () => {
    let sent = 0;
    let failed = 0;
    const total = totalRecipients;
    
    const interval = setInterval(() => {
      if (sent + failed >= total) {
        clearInterval(interval);
        setProgress(prev => ({
          ...prev!,
          status: 'COMPLETED',
          sentCount: sent,
          failedCount: failed,
          pendingCount: 0,
          completedAt: new Date().toISOString(),
        }));
        setCompleted(true);
        return;
      }

      const isSuccess = Math.random() > 0.05;
      if (isSuccess) {
        sent++;
      } else {
        failed++;
      }

      setProgress(prev => ({
        ...prev!,
        sentCount: sent,
        failedCount: failed,
        pendingCount: total - sent - failed,
        currentLead: {
          leadId: `LEAD_${sent + failed}`,
          name: `Lead ${sent + failed}`,
          phone: `+91 9${String(sent + failed).padStart(9, '0')}`,
        },
        result: isSuccess ? 'SENT' : 'FAILED',
        error: isSuccess ? undefined : 'Body variables value mismatch...',
        timestamp: new Date().toISOString(),
      }));
    }, 500);
  };

  const handleProgressUpdate = (data: CampaignProgress) => {
    if (data.campaignId === campaignId) {
      setProgress(data);
    }
  };

  const handleCampaignComplete = (data: CampaignProgress) => {
    if (data.campaignId === campaignId) {
      setProgress(data);
      setCompleted(true);
      setIsListening(false);
    }
  };

  const getStatusText = () => {
    if (!progress) return 'Initializing...';
    switch (progress.status) {
      case 'PROCESSING':
        return 'Sending messages...';
      case 'COMPLETED':
        return 'Completed successfully';
      case 'PARTIAL':
        return 'Partially completed';
      case 'FAILED':
        return 'Failed';
      default:
        return 'Processing...';
    }
  };

  const getStatusColor = () => {
    if (!progress) return 'text-slate-500';
    switch (progress.status) {
      case 'PROCESSING':
        return 'text-blue-500';
      case 'COMPLETED':
        return 'text-green-500';
      case 'PARTIAL':
        return 'text-amber-500';
      case 'FAILED':
        return 'text-red-500';
      default:
        return 'text-slate-500';
    }
  };

  const getProgressPercentage = () => {
    if (!progress || progress.totalRecipients === 0) return 0;
    const completed = progress.sentCount + progress.failedCount;
    return (completed / progress.totalRecipients) * 100;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] rounded-2xl border-slate-200 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Send className="w-5 h-5 text-orange-500" />
            Sending WhatsApp Messages
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Campaign Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="space-y-1">
              <div className="text-slate-500">Campaign</div>
              <div className="font-medium text-slate-800">{templateName}</div>
            </div>
            <Badge className={cn(
              'rounded-lg',
              progress?.status === 'PROCESSING' && 'bg-blue-100 text-blue-700 border-blue-200',
              progress?.status === 'COMPLETED' && 'bg-green-100 text-green-700 border-green-200',
              progress?.status === 'PARTIAL' && 'bg-amber-100 text-amber-700 border-amber-200',
              progress?.status === 'FAILED' && 'bg-red-100 text-red-700 border-red-200',
            )}>
              {progress?.status === 'PROCESSING' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              {progress?.status === 'COMPLETED' && <CheckCircle className="w-3 h-3 mr-1" />}
              {progress?.status === 'PARTIAL' && <AlertCircle className="w-3 h-3 mr-1" />}
              {progress?.status === 'FAILED' && <XCircle className="w-3 h-3 mr-1" />}
              {getStatusText()}
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl text-center">
              <div className="text-2xl font-bold text-slate-700">{progress?.totalRecipients || 0}</div>
              <div className="text-xs text-slate-500">Total</div>
            </div>
            <div className="p-3 bg-green-50 rounded-xl text-center">
              <div className="text-2xl font-bold text-green-600">{progress?.sentCount || 0}</div>
              <div className="text-xs text-green-600">Sent</div>
            </div>
            <div className="p-3 bg-red-50 rounded-xl text-center">
              <div className="text-2xl font-bold text-red-600">{progress?.failedCount || 0}</div>
              <div className="text-xs text-red-600">Failed</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Progress</span>
              <span className="font-medium text-slate-700">
                {getProgressPercentage().toFixed(1)}%
              </span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2 bg-slate-100 [&>div]:bg-orange-500" />
            <div className="text-xs text-slate-400 text-right">
              {progress?.pendingCount || 0} pending
            </div>
          </div>

          {/* Current Lead Status */}
          {progress?.currentLead && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-800">{progress.currentLead.name}</div>
                  <div className="text-sm text-slate-500">{progress.currentLead.phone}</div>
                </div>
                <div className="flex items-center gap-2">
                  {progress.result === 'SENT' && (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Sent
                    </Badge>
                  )}
                  {progress.result === 'FAILED' && (
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      <XCircle className="w-3 h-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                  {!progress.result && (
                    <Badge variant="outline" className="border-slate-200">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Sending...
                    </Badge>
                  )}
                </div>
              </div>
              {progress.error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                  <AlertCircle className="w-3 h-3 inline mr-1" />
                  {progress.error}
                </div>
              )}
            </div>
          )}

          {/* Timestamp */}
          {progress?.timestamp && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              Last updated: {new Date(progress.timestamp).toLocaleTimeString()}
            </div>
          )}

          {/* Completion Summary */}
          {completed && (
            <div className="p-4 rounded-xl border-2 border-green-200 bg-green-50">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-semibold text-green-800">Campaign Completed</div>
                  <div className="text-sm text-green-600">
                    {progress?.sentCount || 0} sent successfully
                    {progress?.failedCount > 0 && `, ${progress.failedCount} failed`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-slate-200 hover:bg-slate-50 w-full sm:w-auto"
          >
            {completed ? 'Close' : 'Minimize'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}