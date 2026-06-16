import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Edit, Trash2, RefreshCw, Target, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoleType } from '@/types/user';

export type KraConfig = {
  _id: string;
  roleId: {
    _id: string;
    name: string;
  };
  fullDayAnsweredCalls: number;
  fullDayTalkTime: number;
  fullDayDialCalls: number;
  fullDayBookings: number;
  fullDayDemoConducts: number;
  halfDayAnsweredCalls: number;
  halfDayTalkTime: number;
  halfDayDialCalls: number;
  halfDayBookings: number;
  halfDayDemoConducts: number;
  createdAt?: string;
  updatedAt?: string;
};

type KraFormState = {
  roleId: string;
  fullDayAnsweredCalls: string;
  fullDayTalkTime: string;
  fullDayDialCalls: string;
  fullDayBookings: string;
  fullDayDemoConducts: string;
  halfDayAnsweredCalls: string;
  halfDayTalkTime: string;
  halfDayDialCalls: string;
  halfDayBookings: string;
  halfDayDemoConducts: string;
};

const EMPTY_FORM: KraFormState = {
  roleId: '',
  fullDayAnsweredCalls: '0',
  fullDayTalkTime: '0',
  fullDayDialCalls: '0',
  fullDayBookings: '0',
  fullDayDemoConducts: '0',
  halfDayAnsweredCalls: '0',
  halfDayTalkTime: '0',
  halfDayDialCalls: '0',
  halfDayBookings: '0',
  halfDayDemoConducts: '0',
};

type Props = {
  kras: KraConfig[];
  roles: RoleType[];
  loading: boolean;
  fetchingData: boolean;
  onRefresh: () => Promise<void>;
  onAddKra: (payload: any) => Promise<void>;
  onUpdateKra: (kraId: string, payload: any) => Promise<void>;
  onDeleteKra: (kraId: string) => Promise<void>;
};

export function KRATab({ kras, roles, loading, fetchingData, onRefresh, onAddKra, onUpdateKra, onDeleteKra }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingKra, setEditingKra] = useState<KraConfig | null>(null);
  const [form, setForm] = useState<KraFormState>(EMPTY_FORM);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingKra(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (kra: KraConfig) => {
    setEditingKra(kra);
    setForm({
      roleId: kra.roleId?._id || '',
      fullDayAnsweredCalls: String(kra.fullDayAnsweredCalls ?? 0),
      fullDayTalkTime: String(kra.fullDayTalkTime ?? 0),
      fullDayDialCalls: String(kra.fullDayDialCalls ?? 0),
      fullDayBookings: String(kra.fullDayBookings ?? 0),
      fullDayDemoConducts: String(kra.fullDayDemoConducts ?? 0),
      halfDayAnsweredCalls: String(kra.halfDayAnsweredCalls ?? 0),
      halfDayTalkTime: String(kra.halfDayTalkTime ?? 0),
      halfDayDialCalls: String(kra.halfDayDialCalls ?? 0),
      halfDayBookings: String(kra.halfDayBookings ?? 0),
      halfDayDemoConducts: String(kra.halfDayDemoConducts ?? 0),
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!form.roleId) return;
    setSaving(true);
    try {
      const payload = {
        roleId: form.roleId,
        fullDayAnsweredCalls: Number(form.fullDayAnsweredCalls || 0),
        fullDayTalkTime: Number(form.fullDayTalkTime || 0),
        fullDayDialCalls: Number(form.fullDayDialCalls || 0),
        fullDayBookings: Number(form.fullDayBookings || 0),
        fullDayDemoConducts: Number(form.fullDayDemoConducts || 0),
        halfDayAnsweredCalls: Number(form.halfDayAnsweredCalls || 0),
        halfDayTalkTime: Number(form.halfDayTalkTime || 0),
        halfDayDialCalls: Number(form.halfDayDialCalls || 0),
        halfDayBookings: Number(form.halfDayBookings || 0),
        halfDayDemoConducts: Number(form.halfDayDemoConducts || 0),
      };

      if (editingKra?._id) {
        await onUpdateKra(editingKra._id, payload);
      } else {
        await onAddKra(payload);
      }
      setDialogOpen(false);
      resetForm();
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (kraId: string) => {
    setDeletingId(kraId);
    try {
      await onDeleteKra(kraId);
      await onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  const roleOptions = useMemo(() => roles.filter((role) => !role.isSuperAdmin), [roles]);

  useEffect(() => {
    if (!dialogOpen) {
      resetForm();
    }
  }, [dialogOpen]);

  // Helper to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with title and buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-800">KRA Management</h2>
          <p className="text-sm text-slate-500">Create, update, view, and delete role KRA thresholds.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={fetchingData}
            className="rounded-lg border-slate-200"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 mr-1', fetchingData && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            onClick={openCreate}
            className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add KRA
          </Button>
        </div>
      </div>

      {/* KRA List Card */}
      <Card className="rounded-xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 px-6 py-4">
          <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-500" />
            KRA List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
            </div>
          ) : kras.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-800 mb-1">No KRA configured</h3>
              <p className="text-sm text-slate-500 mb-4">Add a KRA threshold for a role to start tracking performance.</p>
              <Button onClick={openCreate} className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add KRA
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-200">
                    <TableHead className="text-xs font-medium text-slate-500">Role</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">Full Day</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">Half Day</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">Last Updated</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kras.map((kra) => (
                    <TableRow key={kra._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {kra.roleId?.name || 'Unknown Role'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600 space-y-0.5">
                          <div>AC {kra.fullDayAnsweredCalls} | TT {kra.fullDayTalkTime}</div>
                          <div>DC {kra.fullDayDialCalls} | B {kra.fullDayBookings} | D {kra.fullDayDemoConducts}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600 space-y-0.5">
                          <div>AC {kra.halfDayAnsweredCalls} | TT {kra.halfDayTalkTime}</div>
                          <div>DC {kra.halfDayDialCalls} | B {kra.halfDayBookings} | D {kra.halfDayDemoConducts}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">{formatDate(kra.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(kra)}
                            className="h-7 w-7 rounded-lg text-slate-500 hover:text-orange-600"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(kra._id)}
                            disabled={deletingId === kra._id}
                            className="h-7 w-7 rounded-lg text-slate-500 hover:text-red-600"
                          >
                            {deletingId === kra._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit KRA Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl rounded-2xl border-slate-200 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-xl font-bold text-slate-800">
              {editingKra ? 'Update KRA' : 'Create KRA'}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Select a role and set the thresholds for full day and half day performance.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-sm font-medium text-slate-700">Role *</Label>
                <Select value={form.roleId} onValueChange={(value) => setForm((prev) => ({ ...prev, roleId: value }))}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {roleOptions.map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Full Day Section */}
              <div className="space-y-3 border-r border-slate-100 pr-4">
                <h4 className="text-sm font-medium text-slate-700">Full Day Targets</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    ['fullDayAnsweredCalls', 'Answered Calls'],
                    ['fullDayTalkTime', 'Talk Time (seconds)'],
                    ['fullDayDialCalls', 'Dial Calls'],
                    ['fullDayBookings', 'Bookings'],
                    ['fullDayDemoConducts', 'Demo Conducts'],
                  ] as const).map(([key, label]) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs text-slate-500">{label}</Label>
                      <Input
                        type="number"
                        value={form[key]}
                        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="h-9 rounded-lg border-slate-200 focus:ring-orange-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Half Day Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-700">Half Day Targets</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    ['halfDayAnsweredCalls', 'Answered Calls'],
                    ['halfDayTalkTime', 'Talk Time (seconds)'],
                    ['halfDayDialCalls', 'Dial Calls'],
                    ['halfDayBookings', 'Bookings'],
                    ['halfDayDemoConducts', 'Demo Conducts'],
                  ] as const).map(([key, label]) => (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs text-slate-500">{label}</Label>
                      <Input
                        type="number"
                        value={form[key]}
                        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="h-9 rounded-lg border-slate-200 focus:ring-orange-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
            <div className="flex gap-3 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl border-slate-200">
                Cancel
              </Button>
              <Button onClick={submit} disabled={saving} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global style for hidden scrollbar */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}