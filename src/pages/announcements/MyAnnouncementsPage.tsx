import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, Loader2, Megaphone, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from 'sonner';
import { FormattedText } from '@/components/editor/FormattedText';

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

export function MyAnnouncementsPage() {
  const { announcementId } = useParams<{ announcementId?: string }>();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchAnnouncements = async (showSpinner = false) => {
    try {
      if (showSpinner) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getDataHandlerWithToken(ApiConfig.getMyAnnouncements, {
        page: 1,
        limit: 100,
      }, null, true);

      setAnnouncements(response?.data || []);
    } catch (error) {
      console.error('Failed to load announcements:', error);
      toast.error('Failed to load your announcements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openAnnouncement = async (id: string) => {
    const cached = announcements.find((item) => item._id === id);
    if (cached) {
      setSelectedAnnouncement(cached);
      setDetailOpen(true);
      return;
    }

    try {
      const response = await getDataHandlerWithToken(ApiConfig.getMyAnnouncementById(id), null, null, true);
      if (response) {
        setSelectedAnnouncement(response);
        setDetailOpen(true);
      }
    } catch (error) {
      console.error('Failed to load announcement details:', error);
      toast.error('Failed to load announcement details');
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (announcementId) {
      openAnnouncement(announcementId);
    }
  }, [announcementId, announcements]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Announcements</h1>
          <p className="text-muted-foreground">
            Announcements shared by your seniors that are meant for you.
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchAnnouncements(true)} disabled={refreshing} className="gap-2">
          <RefreshCw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="h-5 w-5" />
            Announcements
          </CardTitle>
          <CardDescription>Only the announcement and who posted it are shown here.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">Loading announcements...</p>
              </div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
              <div className="max-w-sm">
                <Megaphone className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No announcements found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  There are no announcements visible to you yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <button
                  key={announcement._id}
                  type="button"
                  onClick={() => openAnnouncement(announcement._id)}
                  className="w-full rounded-2xl border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <h3 className="text-base font-semibold text-foreground">
                    {announcement.title}
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {announcement.message}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Megaphone className="h-3.5 w-3.5" />
                      {announcement.createdBy?.name || 'Unknown'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(announcement.createdAt), 'MMM dd, yyyy hh:mm a')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          {selectedAnnouncement && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <Megaphone className="h-5 w-5 text-primary" />
                  {selectedAnnouncement.title}
                </DialogTitle>
                <DialogDescription>
                  Created by {selectedAnnouncement.createdBy?.name || 'Unknown'} on {format(new Date(selectedAnnouncement.createdAt), 'MMM dd, yyyy hh:mm a')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <FormattedText text={selectedAnnouncement.message} className="text-sm" />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
