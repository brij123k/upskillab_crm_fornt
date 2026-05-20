import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Megaphone, Send } from 'lucide-react';
import { getDataHandler, postDataHandler } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from 'sonner';

type Campaign = {
  _id: string;
  name: string;
  source: string;
  isActive: boolean;
};

export function LeadEntryPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [searchParams] = useSearchParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    state: '',
  });

  const source = searchParams.get('source') || campaign?.source || 'manual';

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        setLoading(true);
        const res = await getDataHandler(ApiConfig.getPublicSourceCampaign(campaignId || ''), null, null, true);
        setCampaign(res?.data || res || null);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Campaign not available');
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) loadCampaign();
  }, [campaignId]);

  const generatedUrl = useMemo(() => {
    if (typeof window === 'undefined' || !campaign) return '';
    return `${window.location.origin}/lead-entry/${campaign._id}?source=${encodeURIComponent(source)}`;
  }, [campaign, source]);

  const submit = async () => {
    if (!form.name || !form.phone || !form.city || !form.state) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await postDataHandler(ApiConfig.submitPublicSourceLead(campaignId || ''), {
        ...form,
        source,
      }, true);
      setSubmitted(true);
      toast.success('Thanks! Your lead has been submitted.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to submit lead');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6 text-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <Megaphone className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 text-xl font-bold">Campaign unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">This lead entry link is invalid or inactive.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="bg-slate-950 text-white">
            <Badge className="mb-3 w-fit bg-white/10 text-white hover:bg-white/10">{campaign.source}</Badge>
            <CardTitle className="text-3xl">{campaign.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            {submitted ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
                <h2 className="text-xl font-semibold text-green-800">Submitted successfully</h2>
                <p className="mt-2 text-sm text-green-700">Thanks for sharing your details. Our team will reach out soon.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Input value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>State *</Label>
                    <Input value={form.state} onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={submit} disabled={submitting} className="w-full gap-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit Your Details
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
