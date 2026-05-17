import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertTriangle, ArrowRight, Clock, Loader2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from 'sonner';

type Warning = {
  _id: string;
  type: string;
  notes: string;
  issuedBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
};

export function BDWarningWidget() {
  const navigate = useNavigate();
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWarnings = async () => {
    try {
      setLoading(true);
      const response = await getDataHandlerWithToken(ApiConfig.getMyWarnings, { page: 1, limit: 3 }, null, true);
      setWarnings(response?.data || []);
    } catch (error) {
      console.error('Failed to load warnings widget:', error);
      toast.error('Failed to load warnings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarnings();
  }, []);

  const summaryText = useMemo(() => {
    if (!warnings.length) return 'No active warnings right now.';
    return `${warnings.length} recent warning${warnings.length === 1 ? '' : 's'} for you`;
  }, [warnings.length]);

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <CardHeader className="space-y-3 border-b bg-gradient-to-r from-amber-950 via-amber-900 to-stone-900 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="h-5 w-5 text-amber-300" />
              Performance Warnings
            </CardTitle>
            <CardDescription className="text-amber-100/80">
              Notes shared by your seniors.
            </CardDescription>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/bd/my-warnings')}
            className="gap-2 bg-white text-stone-900 hover:bg-white/90"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-amber-100/80">{summaryText}</div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : warnings.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No warnings to show</p>
            <p className="mt-1 text-sm text-muted-foreground">
              When a senior adds one for you, it will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {warnings.map((warning) => (
              <div key={warning._id} className="p-5 transition hover:bg-muted/30">
                <h3 className="truncate text-base font-semibold text-foreground">{warning.type}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{warning.notes}</p>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {warning.issuedBy?.name || 'Unknown'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {format(new Date(warning.createdAt), 'MMM dd, hh:mm a')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator />
        <div className="flex items-center justify-between px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Open the full feed for the latest performance notes.
          </p>
          <Button variant="ghost" size="sm" onClick={() => navigate('/bd/my-warnings')} className="gap-2">
            View full page
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
