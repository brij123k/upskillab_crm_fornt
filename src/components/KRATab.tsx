import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  maxLeavePerMonth: number;
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
  maxLeavePerMonth: string;
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
  maxLeavePerMonth: '0',
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
      maxLeavePerMonth: String(kra.maxLeavePerMonth ?? 0),
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
        maxLeavePerMonth: Number(form.maxLeavePerMonth || 0),
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">KRA Management</h2>
          <p className="text-sm text-muted-foreground">Create, update, view, and delete role KRA thresholds.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onRefresh} disabled={fetchingData} className="gap-2">
            <RefreshCw className={cn('h-4 w-4', fetchingData && 'animate-spin')} />
            Refresh
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add KRA
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            KRA List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : kras.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
              <Target className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No KRA configured</h3>
              <p className="mt-2 text-sm text-muted-foreground">Add a KRA threshold for a role to start tracking performance.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Full Day</TableHead>
                  <TableHead>Half Day</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kras.map((kra) => (
                  <TableRow key={kra._id}>
                    <TableCell>
                      <Badge variant="secondary">{kra.roleId?.name || 'Unknown Role'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        AC {kra.fullDayAnsweredCalls} | TT {kra.fullDayTalkTime} | DC {kra.fullDayDialCalls} | B {kra.fullDayBookings} | D {kra.fullDayDemoConducts}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        AC {kra.halfDayAnsweredCalls} | TT {kra.halfDayTalkTime} | DC {kra.halfDayDialCalls} | B {kra.halfDayBookings} | D {kra.halfDayDemoConducts}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {kra.updatedAt ? new Date(kra.updatedAt).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(kra)} className="gap-2">
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => remove(kra._id)}
                          disabled={deletingId === kra._id}
                          className="gap-2"
                        >
                          {deletingId === kra._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingKra ? 'Update KRA' : 'Create KRA'}</DialogTitle>
            <DialogDescription>
              Select a role and set the thresholds for full day and half day performance.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Role</Label>
              <Select value={form.roleId} onValueChange={(value) => setForm((prev) => ({ ...prev, roleId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {([
              ['fullDayAnsweredCalls', 'Full Day Answered Calls'],
              ['fullDayTalkTime', 'Full Day Talk Time'],
              ['fullDayDialCalls', 'Full Day Dial Calls'],
              ['fullDayBookings', 'Full Day Bookings'],
              ['fullDayDemoConducts', 'Full Day Demo Conducts'],
              ['halfDayAnsweredCalls', 'Half Day Answered Calls'],
            ['halfDayTalkTime', 'Half Day Talk Time'],
            ['halfDayDialCalls', 'Half Day Dial Calls'],
            ['halfDayBookings', 'Half Day Bookings'],
            ['halfDayDemoConducts', 'Half Day Demo Conducts'],
            ['maxLeavePerMonth', 'Max Leave / Month'],
          ] as const).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input
                  type="number"
                  value={form[key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
