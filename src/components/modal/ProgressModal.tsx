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
        return <Clock className="w-4 h-4 text-slate-400" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-orange-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
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
      <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800">{title}</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">{description}</DialogDescription>
        </DialogHeader>

        {/* Body - with custom scrollbar */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            {/* Progress Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-2xl font-bold text-orange-600">{completedCount}/{totalCount}</div>
                <div className="text-xs text-slate-500 mt-0.5">Completed</div>
              </div>
              <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="text-2xl font-bold text-emerald-600">{successCount}</div>
                <div className="text-xs text-emerald-600 mt-0.5">Success</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                <div className="text-xs text-red-600 mt-0.5">Failed</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Overall Progress</span>
                <span className="font-medium text-slate-800">{Math.round((completedCount / totalCount) * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 transition-all duration-500 rounded-full"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>

            {/* Progress Items List */}
            <div className="space-y-2 pt-2">
              {progressItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all",
                    item.status === 'error' && "bg-red-50 border-red-100",
                    item.status === 'success' && "bg-emerald-50 border-emerald-100",
                    item.status === 'processing' && "bg-orange-50 border-orange-100",
                    item.status === 'pending' && "bg-slate-50 border-slate-100"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getStatusIcon(item.status)}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-slate-800 truncate">{item.name}</div>
                      {item.message && (
                        <div className="text-xs text-slate-500 truncate">{item.message}</div>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    "text-xs font-medium ml-3 whitespace-nowrap",
                    item.status === 'error' && "text-red-600",
                    item.status === 'success' && "text-emerald-600",
                    item.status === 'processing' && "text-orange-600",
                    item.status === 'pending' && "text-slate-500"
                  )}>
                    {getStatusText(item.status)}
                  </div>
                </div>
              ))}
            </div>

            {/* Auto-close notice */}
            {completedCount === totalCount && completedCount > 0 && (
              <div className="text-center text-sm text-slate-500 pt-2 border-t border-slate-100">
                This window will close automatically in a few seconds...
              </div>
            )}
          </div>
        </div>

        {/* Footer (optional close button) - keeping it minimal */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white">
          <button
            onClick={() => onOpenChange(false)}
            className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
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