import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Phone } from 'lucide-react';
import { getDataHandlerWithToken, postDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { MultiSelect } from './ui/multi-select';

interface AssignIVRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onSuccess: () => void;
}

interface DIDNumber {
  label: string;
  value: string;
  callerId: string;
  id: string;
}

export function AssignIVRModal({ open, onOpenChange, user, onSuccess }: AssignIVRModalProps) {
  const [didNumbers, setDidNumbers] = useState<DIDNumber[]>([]);
  const [selectedCallerIds, setSelectedCallerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    login_id: '',
    password: ''
  });

  useEffect(() => {
    if (open && user) {
      fetchDIDNumbers();
      setFormData({
        login_id: user.email?.split('@')[0] || user.name?.toLowerCase().replace(/\s/g, '') || '',
        password: ''
      });
    }
  }, [open, user]);

  const fetchDIDNumbers = async () => {
    try {
      setLoading(true);
      const response = await getDataHandlerWithToken(ApiConfig.getMynumbers, null, null, true);
      if (response && Array.isArray(response)) {
        setDidNumbers(response);
      }
    } catch (error) {
      console.error('Error fetching DID numbers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch available phone numbers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedCallerIds.length === didNumbers.length) {
      setSelectedCallerIds([]);
    } else {
      setSelectedCallerIds(didNumbers.map(num => num.id));
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    if (selectedCallerIds.length === 0) {
      toast({ title: "Validation Error", description: "Please select at least one phone number", variant: "destructive" });
      return;
    }
    if (!formData.login_id) {
      toast({ title: "Validation Error", description: "Please enter a login ID", variant: "destructive" });
      return;
    }
    if (!formData.password) {
      toast({ title: "Validation Error", description: "Please enter a password", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        UserId: user._id,
        name: user.name,
        email: user.email,
        phone: user.number,
        login_id: formData.login_id,
        password: formData.password,
        caller_ids: selectedCallerIds.map(id => parseInt(id))
      };
      const response = await postDataHandlerWithToken(ApiConfig.createIVRUser, payload, true);
      toast({ title: "Success", description: response?.message || "IVR access assigned successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error assigning IVR:', error);
      toast({ title: "Error", description: error.response?.data?.message || "Failed to assign IVR access", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl border-slate-200 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800">Assign IVR Access</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Assign IVR phone numbers to {user?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
          {/* Login Credentials */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-slate-800">Login Credentials</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Login ID *</Label>
                <Input
                  value={formData.login_id}
                  onChange={(e) => setFormData({ ...formData, login_id: e.target.value })}
                  placeholder="e.g., john.doe"
                  disabled={submitting}
                  className="h-10 rounded-lg border-slate-200 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Password *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  disabled={submitting}
                  className="h-10 rounded-lg border-slate-200 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* DID Numbers Selection */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-800">Select Phone Numbers</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={loading || submitting}
                className="rounded-lg border-slate-200 text-sm"
              >
                {selectedCallerIds.length === didNumbers.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {didNumbers.map((number) => (
                  <div key={number.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <Checkbox
                      id={`number-${number.id}`}
                      checked={selectedCallerIds.includes(number.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCallerIds([...selectedCallerIds, number.id]);
                        } else {
                          setSelectedCallerIds(selectedCallerIds.filter(id => id !== number.id));
                        }
                      }}
                      disabled={submitting}
                      className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    />
                    <Label
                      htmlFor={`number-${number.id}`}
                      className="flex items-center gap-2 cursor-pointer flex-1 text-sm"
                    >
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-700">{number.label}</span>
                      <span className="text-slate-500">({number.value})</span>
                      <Badge variant="outline" className="ml-auto border-slate-200 text-slate-500 rounded-full text-xs">
                        ID: {number.callerId}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {!loading && didNumbers.length === 0 && (
              <div className="text-center py-8 text-slate-500">No phone numbers available</div>
            )}

            {selectedCallerIds.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Selected {selectedCallerIds.length} number{selectedCallerIds.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
          <div className="flex gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="rounded-lg border-slate-200">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning...</> : 'Assign IVR Access'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <style>{`
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </Dialog>
  );
}