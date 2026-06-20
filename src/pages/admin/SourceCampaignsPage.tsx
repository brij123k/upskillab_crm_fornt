import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Copy,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Users,
  BarChart3,
  Globe,
  Link2,
  Power,
  PowerOff,
  UserPlus,
} from 'lucide-react';
import { getDataHandlerWithToken, patchTokenDataHandler, postDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* -------------------------------------------------- */
/*  Types & Helpers                                   */
/* -------------------------------------------------- */
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

  /* ---------- data fetching ---------- */
  const fetchData = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
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
      const details = await getDataHandlerWithToken(
        ApiConfig.getSourceCampaignById(campaign._id),
        null,
        null,
        true
      );
      setSelectedCampaign(details?.data || details || campaign);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to load details');
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
      toast.error(error?.response?.data?.message || error?.message || 'Failed to save');
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
      toast.error(error?.response?.data?.message || 'Failed to update status');
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
      active: campaigns.filter((c) => c.isActive).length,
      total: campaigns.length,
    };
  }, [campaigns]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Source Campaigns</h1>
            <p className="text-slate-500 mt-1">Create public lead entry links and compare campaign performance</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={loading}
              className="rounded-xl border-slate-200"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
              )}
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={openCreate}
              className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Campaigns</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{summary.total}</p>
              </div>
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.active}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Power className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Lead Entry URL</p>
                <p className="text-sm text-slate-500 mt-1">Public link with source parameter</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <Link2 className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Campaigns table */}
        <Card className="bg-white border-0 shadow-sm overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-800">Campaign List</CardTitle>
            <p className="text-xs text-slate-500">Each campaign generates a unique lead entry URL</p>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
                <p className="ml-2 text-sm text-slate-500">Loading campaigns...</p>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="py-16 text-center">
                <Globe className="w-12 h-12 mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-600">No source campaigns yet</p>
                <p className="text-xs text-slate-400">Create one to start collecting leads</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Name</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Source</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Created By</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Leads</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase">Lead URL</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                        <TableCell className="py-3">
                          <button
                            onClick={() => openDetails(campaign)}
                            className="text-sm font-medium text-slate-800 hover:text-orange-600 transition-colors"
                          >
                            {campaign.name}
                          </button>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200 rounded-full text-xs px-2.5 py-0.5">
                            {campaign.source}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 py-3">
                          {typeof campaign.createdBy === 'object'
                            ? `${campaign.createdBy?.name || 'Unknown'} (${campaign.createdBy?._id || campaign.createdBy?.employeeId || '-'})`
                            : (campaign.createdBy || '-')}
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {campaign.registeredCount ?? 0}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full',
                              campaign.isActive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            )}
                          >
                            {campaign.isActive ? (
                              <Power className="w-3 h-3" />
                            ) : (
                              <PowerOff className="w-3 h-3" />
                            )}
                            {campaign.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[360px] truncate text-xs text-slate-500 py-3">
                          {buildUrl(campaign)}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetails(campaign)}
                              className="h-8 px-2 text-xs rounded-lg hover:bg-slate-100"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyUrl(campaign)}
                              className="h-8 px-2 text-xs rounded-lg hover:bg-slate-100"
                            >
                              <Copy className="w-3.5 h-3.5 mr-1" />
                              Copy
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(campaign)}
                              className="h-8 px-2 text-xs rounded-lg hover:bg-slate-100"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStatus(campaign)}
                              className="h-8 px-2 text-xs rounded-lg hover:bg-slate-100"
                            >
                              {campaign.isActive ? (
                                <ToggleLeft className="w-3.5 h-3.5 mr-1" />
                              ) : (
                                <ToggleRight className="w-3.5 h-3.5 mr-1" />
                              )}
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

        {/* Campaign Comparison */}
        <Card className="bg-white border-0 shadow-sm overflow-hidden">
          <CardHeader className="px-5 py-4 border-b border-slate-100">
            <CardTitle className="text-base font-semibold text-slate-800">Campaign Comparison</CardTitle>
            <p className="text-xs text-slate-500">Lead counts captured from public campaign submissions</p>
          </CardHeader>
          <CardContent className="p-5">
            {report?.data?.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {report.data.map((item: any) => (
                  <Card
                    key={`${item.sourceCampaignId}-${item.source}`}
                    className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-800 truncate">{item.sourceCampaignName}</h4>
                        <p className="text-xs text-slate-500">{item.source}</p>
                      </div>
                      <Badge className="bg-orange-100 text-orange-700 text-xs rounded-full px-2.5 py-0.5">
                        {item.totalLeads}
                      </Badge>
                    </div>
                    <p className="mt-3 text-[10px] text-slate-400">
                      Last lead: {item.lastLeadAt ? new Date(item.lastLeadAt).toLocaleString() : '—'}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-slate-500">
                <BarChart3 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                No comparison data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* ---------- Edit/Create Modal ---------- */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl rounded-2xl border-slate-200 p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
              <DialogTitle className="text-xl font-bold text-slate-800">
                {editing ? 'Edit Source Campaign' : 'Create Source Campaign'}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Campaigns generate public lead entry URLs and log incoming leads for reporting.
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 py-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-sm font-medium text-slate-700">Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Facebook Summer 2026"
                  className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Source</Label>
                <Select
                  value={form.source}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, source: value }))}
                >
                  <SelectTrigger className="h-10 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {SOURCES.map((source) => (
                      <SelectItem key={source} value={source} className="text-sm">
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Default Stage</Label>
                <Select
                  value={form.defaultStageId}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, defaultStageId: value }))}
                >
                  <SelectTrigger className="h-10 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {stages.map((stage) => (
                      <SelectItem key={stage._id} value={stage._id} className="text-sm">
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Default Pool</Label>
                <Select
                  value={form.defaultPoolId}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, defaultPoolId: value }))}
                >
                  <SelectTrigger className="h-10 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select pool" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {pools.map((pool) => (
                      <SelectItem key={pool._id} value={pool._id} className="text-sm">
                        {pool.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  className="rounded-xl border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={submit}
                  disabled={saving}
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : editing ? (
                    'Update'
                  ) : (
                    'Create'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ---------- Details Modal ---------- */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-4xl rounded-2xl border-slate-200 p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
              <DialogTitle className="text-xl font-bold text-slate-800">
                {selectedCampaign?.name || 'Campaign Details'}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Campaign info, creator details, and registered users
              </DialogDescription>
            </DialogHeader>

            {detailLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
              </div>
            ) : selectedCampaign ? (
              <div className="px-6 py-4 space-y-5">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Created By</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {typeof selectedCampaign.createdBy === 'object'
                        ? `${selectedCampaign.createdBy?.name || 'Unknown'} (${selectedCampaign.createdBy?._id || selectedCampaign.createdBy?.employeeId || '-'})`
                        : (selectedCampaign.createdBy || '-')}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Registered</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {selectedCampaign.registeredCount ?? 0}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Status</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {selectedCampaign.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-slate-800">Registered Users</h3>
                    <span className="text-xs text-slate-500">
                      {selectedCampaign.registeredUsers?.length || 0} entries
                    </span>
                  </div>
                  <div className="max-h-80 overflow-auto border border-slate-200 rounded-xl">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase">Name</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase">Phone</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase">Email</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase">City</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase">State</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase">Submitted At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCampaign.registeredUsers?.length ? (
                          selectedCampaign.registeredUsers.map((user) => (
                            <TableRow key={user._id} className="border-b border-slate-50 hover:bg-slate-50/60">
                              <TableCell className="text-xs font-medium text-slate-800 py-3">{user.name || '-'}</TableCell>
                              <TableCell className="text-xs text-slate-600 py-3">{user.phone || '-'}</TableCell>
                              <TableCell className="text-xs text-slate-600 py-3">{user.email || '-'}</TableCell>
                              <TableCell className="text-xs text-slate-600 py-3">{user.city || '-'}</TableCell>
                              <TableCell className="text-xs text-slate-600 py-3">{user.state || '-'}</TableCell>
                              <TableCell className="text-xs text-slate-600 py-3">
                                {user.submittedAt ? new Date(user.submittedAt).toLocaleString() : '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                              No users registered from this campaign yet
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
    </div>
  );
}