import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Eye, Loader2, Plus, RefreshCw, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import { getDataHandlerWithToken, patchTokenDataHandler, postDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from 'sonner';

type Campaign = {
  _id: string;
  name: string;
  source: string;
  isActive: boolean;
  createdBy?: { _id?: string; name?: string; employeeId?: string | number } | string;
  updatedBy?: { _id?: string; name?: string; employeeId?: string | number } | string;
  defaultStageId?: { _id: string; name: string } | string;
  defaultPoolId?: { _id: string; name: string } | string;
  createdAt: string;
  registeredUsers?: RegisteredUser[];
  registeredCount?: number;
};

type Option = { _id: string; name: string };
type RegisteredUser = {
  _id: string;
  leadId?: number | null;
  name: string;
  phone?: string;
  email?: string;
  city?: string | null;
  state?: string | null;
  source?: string | null;
  source_campaign?: string | null;
  status?: string | null;
  submittedAt?: string;
};

const SOURCES = ['facebook', 'google', 'manual', 'positive', 'refurbished', 'api'];

const getId = (value: any) => value?._id || value?.id || value;

export function SourceCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stages, setStages] = useState<Option[]>([]);
  const [pools, setPools] = useState<Option[]>([]);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState({
    name: '',
    source: 'facebook',
    defaultStageId: '',
    defaultPoolId: '',
    isActive: true,
  });

  const fetchData = async (showSpinner = false) => {
    try {
      if (showSpinner) {
        setLoading(true);
      }
      const [campaignRes, stageRes, poolRes, reportRes] = await Promise.all([
        getDataHandlerWithToken(ApiConfig.getSourceCampaigns, null, null, true),
        getDataHandlerWithToken(ApiConfig.getAllStages, null, null, true),
        getDataHandlerWithToken(ApiConfig.getAllPools, null, null, true),
        getDataHandlerWithToken(ApiConfig.getSourceCampaignComparisonReport, null, null, true),
      ]);

      setCampaigns(campaignRes?.data || campaignRes || []);
      setStages(stageRes?.data || stageRes || []);
      setPools(poolRes?.data || poolRes || []);
      setReport(reportRes || null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load source campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({
      name: '',
      source: 'facebook',
      defaultStageId: stages[0]?._id || '',
      defaultPoolId: pools[0]?._id || '',
      isActive: true,
    });
  };

  const openCreate = () => {
    resetForm();
    setEditOpen(true);
  };

  const openEdit = (campaign: Campaign) => {
    setEditing(campaign);
    setForm({
      name: campaign.name || '',
      source: campaign.source || 'facebook',
      defaultStageId: String(getId(campaign.defaultStageId) || ''),
      defaultPoolId: String(getId(campaign.defaultPoolId) || ''),
      isActive: campaign.isActive,
    });
    setEditOpen(true);
  };

  const openDetails = async (campaign: Campaign) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setSelectedCampaign(campaign);
    try {
      const details = await getDataHandlerWithToken(ApiConfig.getSourceCampaignById(campaign._id), null, null, true);
      setSelectedCampaign(details?.data || details || campaign);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to load campaign details');
    } finally {
      setDetailLoading(false);
    }
  };

  const submit = async () => {
    if (!form.name || !form.source || !form.defaultStageId || !form.defaultPoolId) {
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await patchTokenDataHandler(ApiConfig.updateSourceCampaign(editing._id), form, true);
        toast.success('Source campaign updated');
      } else {
        await postDataHandlerWithToken(ApiConfig.createSourceCampaign, form, true);
        toast.success('Source campaign created');
      }
      setEditOpen(false);
      await fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to save source campaign');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (campaign: Campaign) => {
    try {
      await patchTokenDataHandler(ApiConfig.toggleSourceCampaign(campaign._id), null, true);
      toast.success(`Campaign ${campaign.isActive ? 'disabled' : 'enabled'}`);
      await fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update campaign status');
    }
  };

  const buildUrl = (campaign: Campaign) => {
    if (typeof window === 'undefined') return '';
    const source = encodeURIComponent(campaign.source || 'facebook');
    return `${window.location.origin}/lead-entry/${campaign._id}?source=${source}`;
  };

  const copyUrl = async (campaign: Campaign) => {
    try {
      await navigator.clipboard.writeText(buildUrl(campaign));
      toast.success('URL copied');
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const summary = useMemo(() => {
    return {
      active: campaigns.filter((item) => item.isActive).length,
      total: campaigns.length,
    };
  }, [campaigns]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Source Campaigns</h1>
          <p className="text-muted-foreground">Create public lead entry links and compare campaign performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchData(true)} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total</p><div className="mt-2 text-3xl font-semibold">{summary.total}</div></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Active</p><div className="mt-2 text-3xl font-semibold">{summary.active}</div></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Lead Entry</p><div className="mt-2 text-sm text-muted-foreground">Use the generated URL below each campaign</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign List</CardTitle>
          <CardDescription>Each campaign creates a public lead entry link with source in the URL.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>
          ) : campaigns.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center">No source campaigns yet</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lead URL</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign._id}>
                      <TableCell className="font-medium">
                        <button
                          type="button"
                          onClick={() => openDetails(campaign)}
                          className="text-left font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {campaign.name}
                        </button>
                      </TableCell>
                      <TableCell><Badge variant="outline">{campaign.source}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {typeof campaign.createdBy === 'object'
                          ? (
                            <span>
                              {campaign.createdBy?.name || 'Unknown'} ({campaign.createdBy?._id || campaign.createdBy?.employeeId || '-'})
                            </span>
                          )
                          : (campaign.createdBy || '-')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {campaign.registeredCount ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={campaign.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}>
                          {campaign.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[360px] truncate text-sm text-muted-foreground">{buildUrl(campaign)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openDetails(campaign)} className="gap-2">
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => copyUrl(campaign)} className="gap-2">
                            <Copy className="h-4 w-4" />
                            Copy
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEdit(campaign)}>Edit</Button>
                          <Button variant="outline" size="sm" onClick={() => toggleStatus(campaign)} className="gap-2">
                            {campaign.isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                            {campaign.isActive ? 'Disable' : 'Enable'}
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

      <Card>
        <CardHeader>
          <CardTitle>Campaign Comparison</CardTitle>
          <CardDescription>Lead counts captured from public campaign submissions.</CardDescription>
        </CardHeader>
        <CardContent>
          {report?.data?.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {report.data.map((item: any) => (
                <div key={`${item.sourceCampaignId}-${item.source}`} className="rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{item.sourceCampaignName}</p>
                      <p className="text-xs text-muted-foreground">{item.source}</p>
                    </div>
                    <Badge>{item.totalLeads}</Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Last lead: {item.lastLeadAt ? new Date(item.lastLeadAt).toLocaleString() : '-'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No comparison data yet.</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Source Campaign' : 'Create Source Campaign'}</DialogTitle>
            <DialogDescription>Campaigns generate public lead entry URLs and log incoming leads for reporting.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Facebook Summer 2026" />
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(value) => setForm((prev) => ({ ...prev, source: value }))}>
                <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map((source) => <SelectItem key={source} value={source}>{source}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Stage</Label>
              <Select value={form.defaultStageId} onValueChange={(value) => setForm((prev) => ({ ...prev, defaultStageId: value }))}>
                <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => <SelectItem key={stage._id} value={stage._id}>{stage.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Pool</Label>
              <Select value={form.defaultPoolId} onValueChange={(value) => setForm((prev) => ({ ...prev, defaultPoolId: value }))}>
                <SelectTrigger><SelectValue placeholder="Select pool" /></SelectTrigger>
                <SelectContent>
                  {pools.map((pool) => <SelectItem key={pool._id} value={pool._id}>{pool.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Close</Button>
            <Button onClick={submit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedCampaign?.name || 'Source Campaign Details'}</DialogTitle>
            <DialogDescription>
              Campaign info, creator details, and the users registered from this source campaign.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : selectedCampaign ? (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-2xl border bg-muted/20 p-4 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Created By</p>
                  <p className="mt-1 text-sm font-medium">
                    {typeof selectedCampaign.createdBy === 'object'
                      ? `${selectedCampaign.createdBy?.name || 'Unknown'} (${selectedCampaign.createdBy?._id || selectedCampaign.createdBy?.employeeId || '-'})`
                      : (selectedCampaign.createdBy || '-')}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Registered Count</p>
                  <p className="mt-1 text-sm font-medium">{selectedCampaign.registeredCount ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                  <p className="mt-1 text-sm font-medium">{selectedCampaign.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Registered Users</h3>
                  <p className="text-xs text-muted-foreground">{selectedCampaign.registeredUsers?.length || 0} entries</p>
                </div>
                <div className="max-h-[420px] overflow-auto rounded-2xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Submitted At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCampaign.registeredUsers?.length ? (
                        selectedCampaign.registeredUsers.map((user) => (
                          <TableRow key={user._id}>
                            <TableCell className="font-medium">{user.name || '-'}</TableCell>
                            <TableCell>{user.phone || '-'}</TableCell>
                            <TableCell>{user.email || '-'}</TableCell>
                            <TableCell>{user.city || '-'}</TableCell>
                            <TableCell>{user.state || '-'}</TableCell>
                            <TableCell>{user.submittedAt ? new Date(user.submittedAt).toLocaleString() : '-'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                            No users registered from this campaign yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
