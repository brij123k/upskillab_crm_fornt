import { useEffect, useState } from 'react';
import { Loader2, Plus, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import ApiConfig from '@/config/apiConfig';
import { getDataHandlerWithToken, patchTokenDataHandler, postDataHandlerWithToken } from '@/config/services';
import { EnrolledStage, unwrapError } from '@/lib/enrolledLeads';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

/** Add, rename, switch off or set the default stage for enrolled leads. */
export function EnrolledStagesDialog({ open, onOpenChange, onChanged }: Props) {
  const [stages, setStages] = useState<EnrolledStage[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#64748b');

  const load = async () => {
    try {
      setLoading(true);
      const res: EnrolledStage[] = await getDataHandlerWithToken(ApiConfig.enrolledLeadStages, { includeInactive: true }, null, true);
      setStages(res || []);
      setNames(Object.fromEntries((res || []).map((s) => [s._id, s.name])));
    } catch (error) {
      toast({ title: 'Error', description: unwrapError(error, 'Failed to load stages'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const update = async (stage: EnrolledStage, body: Record<string, any>) => {
    try {
      setBusy(stage._id);
      await patchTokenDataHandler(ApiConfig.enrolledLeadStage(stage._id), body, true);
      await load();
      onChanged();
    } catch (error) {
      toast({ title: 'Error', description: unwrapError(error, 'Failed to update stage'), variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const create = async () => {
    if (!newName.trim()) return;
    try {
      setBusy('new');
      await postDataHandlerWithToken(ApiConfig.enrolledLeadStages, { name: newName.trim(), color: newColor }, true);
      setNewName('');
      await load();
      onChanged();
    } catch (error) {
      toast({ title: 'Error', description: unwrapError(error, 'Failed to add stage'), variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] rounded-2xl border-slate-200">
        <DialogHeader>
          <DialogTitle>Enrolled lead stages</DialogTitle>
          <DialogDescription>
            New students get the default stage (★). Switch a stage off to hide it from the stage list; leads already in it keep it.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-orange-500" /></div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {stages.map((stage) => (
              <div key={stage._id} className="flex items-center gap-2 rounded-xl border border-slate-100 p-2">
                <input
                  type="color"
                  value={stage.color || '#64748b'}
                  onChange={(e) => update(stage, { color: e.target.value })}
                  className="h-8 w-8 cursor-pointer rounded border border-slate-200"
                  title="Colour"
                />
                <Input
                  value={names[stage._id] ?? stage.name}
                  onChange={(e) => setNames((prev) => ({ ...prev, [stage._id]: e.target.value }))}
                  onBlur={() => {
                    const name = (names[stage._id] || '').trim();
                    if (name && name !== stage.name) update(stage, { name });
                  }}
                  className="h-8 rounded-lg text-sm"
                />
                <button
                  type="button"
                  title={stage.isDefault ? 'Default stage for new students' : 'Make default'}
                  disabled={stage.isDefault || busy === stage._id}
                  onClick={() => update(stage, { isDefault: true })}
                  className={stage.isDefault ? 'text-orange-500' : 'text-slate-300 hover:text-orange-400'}
                >
                  <Star className="w-4 h-4" fill={stage.isDefault ? 'currentColor' : 'none'} />
                </button>
                <Switch
                  checked={stage.isActive}
                  disabled={stage.isDefault || busy === stage._id}
                  onCheckedChange={(checked) => update(stage, { isActive: checked })}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
          <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="h-9 w-9 cursor-pointer rounded border border-slate-200" />
          <Input
            placeholder="New stage name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            className="h-9 rounded-xl"
          />
          <Button onClick={create} disabled={!newName.trim() || busy === 'new'} className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
            {busy === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
