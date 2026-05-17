import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, Clock, Loader2, Megaphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';

type Announcement = {
  _id: string;
  title: string;
  message: string;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
};

export function BDAnnouncementWidget() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await getDataHandlerWithToken(ApiConfig.getMyAnnouncements, { page: 1, limit: 3 }, null, true);
      setAnnouncements(response?.data || []);
    } catch (error) {
      console.error('Failed to load announcements widget:', error);
      toast({
        title: 'Error',
        description: 'Failed to load announcements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const summaryText = useMemo(() => {
    if (!announcements.length) return 'No active announcements right now.';
    return `${announcements.length} recent announcement${announcements.length === 1 ? '' : 's'} for you`;
  }, [announcements.length]);

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <CardHeader className="space-y-3 border-b bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="h-5 w-5 text-cyan-300" />
              Announcements for You
            </CardTitle>
            <CardDescription className="text-slate-300">
              Messages shared by your seniors.
            </CardDescription>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/bd/my-announcements')}
            className="gap-2 bg-white text-slate-900 hover:bg-white/90"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-slate-300">{summaryText}</div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Megaphone className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No announcements to show</p>
            <p className="mt-1 text-sm text-muted-foreground">
              When your seniors post something for you, it will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {announcements.map((announcement) => (
              <div key={announcement._id} className="p-5 transition hover:bg-muted/30">
                <h3 className="truncate text-base font-semibold text-foreground">
                  {announcement.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {announcement.message}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Megaphone className="h-3.5 w-3.5" />
                    {announcement.createdBy?.name || 'Unknown'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {format(new Date(announcement.createdAt), 'MMM dd, hh:mm a')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator />
        <div className="flex items-center justify-between px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Open the full feed for the latest announcements.
          </p>
          <Button variant="ghost" size="sm" onClick={() => navigate('/bd/my-announcements')} className="gap-2">
            View full page
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
