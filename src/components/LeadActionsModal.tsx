import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, Edit, TrendingUp, AlertTriangle, Users, Loader2, CheckCircle, XCircle, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLead: any;
  loading: boolean;
  actions: {
    onView: (lead: any) => void;
    onEdit: (lead: any) => void;
    onChangeStatus: (lead: any) => void;
    onChangeStage: (lead: any) => void;
    onAssign: (lead: any) => void;
    onConvert: (lead: any) => void;
  };
}

export function LeadActionsModal({
  open,
  onOpenChange,
  selectedLead,
  loading,
  actions
}: LeadActionsModalProps) {
  if (!selectedLead) return null;

  const handleAction = (action: keyof typeof actions) => {
    actions[action](selectedLead);
    onOpenChange(false);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'lost':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'converted':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-3.5 h-3.5" />;
      case 'lost':
        return <XCircle className="w-3.5 h-3.5" />;
      case 'converted':
        return <TrendingUp className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  // Format date
const formatDate = (dateString?: string | null) => {

  if (!dateString) {

    return 'No Calls Yet';

  }


  const date = new Date(dateString);


  if (isNaN(date.getTime())) {

    return 'Invalid Date';

  }


  const day = String(date.getDate()).padStart(2, '0');

  const month = String(date.getMonth() + 1).padStart(2, '0');

  const year = String(date.getFullYear()).slice(-2);


  return `${day}-${month}-${year}`;

};



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Lead Actions
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Manage lead: {selectedLead.name}
          </DialogDescription>
        </DialogHeader>

        {/* Body - with thin scrollbar if needed */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-5">
            {/* Lead Summary Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-orange-700">
                      {selectedLead.name?.charAt(0)?.toUpperCase() || 'L'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{selectedLead.name}</p>
                    <p className="text-xs text-slate-500">ID: {selectedLead.leadId}</p>
                  </div>
                </div>
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                  getStatusColor(selectedLead.status)
                )}>
                  {getStatusIcon(selectedLead.status)}
                  {selectedLead.status?.charAt(0).toUpperCase() + selectedLead.status?.slice(1)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="font-medium text-slate-700">{selectedLead.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Email</p>
                  <p className="font-medium text-slate-700 truncate">{selectedLead.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Stage</p>
                  <p className="font-medium text-slate-700">{selectedLead.stageId?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Created</p>
                  <p className="font-medium text-slate-700">{formatDate(selectedLead.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Assigned To</p>
                  <p className="font-medium text-slate-700">{selectedLead.assignedTo?.name || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Last Call At</p>
                  <p className="font-medium text-slate-700">{formatDate(selectedLead.lastCallDate)}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons Grid */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleAction('onView')}
                  className="justify-start gap-2 rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAction('onEdit')}
                  className="justify-start gap-2 rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Lead
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAction('onChangeStage')}
                  className="justify-start gap-2 rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  Change Stage
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAction('onChangeStatus')}
                  className="justify-start gap-2 rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Change Status
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAction('onAssign')}
                  className="justify-start gap-2 rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Assign Lead
                </Button>
                {selectedLead.status !== 'converted' && (
                  <Button
                    variant="outline"
                    onClick={() => handleAction('onConvert')}
                    className="justify-start gap-2 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Convert
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl border-slate-200 hover:bg-slate-50"
          >
            Close
          </Button>
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