import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressItem {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
}

interface ProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  progressItems: ProgressItem[];
}

export function ProgressModal({
  open,
  onOpenChange,
  title,
  description,
  progressItems
}: ProgressModalProps) {
  const getStatusIcon = (status: ProgressItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (status: ProgressItem['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'success':
        return 'Success';
      case 'error':
        return 'Failed';
    }
  };

  const completedCount = progressItems.filter(item => 
    item.status === 'success' || item.status === 'error'
  ).length;
  const totalCount = progressItems.length;
  const successCount = progressItems.filter(item => item.status === 'success').length;
  const errorCount = progressItems.filter(item => item.status === 'error').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{completedCount}/{totalCount}</div>
              <div className="text-xs text-blue-700">Completed</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{successCount}</div>
              <div className="text-xs text-green-700">Success</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-xs text-red-700">Failed</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round((completedCount / totalCount) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Progress Items */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {progressItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg",
                  item.status === 'error' && "bg-red-50",
                  item.status === 'success' && "bg-green-50",
                  item.status === 'processing' && "bg-blue-50",
                  item.status === 'pending' && "bg-gray-50"
                )}
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <div>
                    <div className="font-medium text-sm">{item.name}</div>
                    {item.message && (
                      <div className="text-xs text-muted-foreground">{item.message}</div>
                    )}
                  </div>
                </div>
                <div className={cn(
                  "text-xs font-medium",
                  item.status === 'error' && "text-red-600",
                  item.status === 'success' && "text-green-600",
                  item.status === 'processing' && "text-blue-600",
                  item.status === 'pending' && "text-gray-600"
                )}>
                  {getStatusText(item.status)}
                </div>
              </div>
            ))}
          </div>

          {/* Auto-close notice */}
          {completedCount === totalCount && completedCount > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              This window will close automatically in a few seconds...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}