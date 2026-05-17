import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertTriangle, Clock, Loader2, RefreshCw, User, ShieldAlert, X, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FormattedText } from '@/components/editor/FormattedText';

type UserRef = {
  _id: string;
  name: string;
  email: string;
  employeeId: number;
};

type Warning = {
  _id: string;
  userId: UserRef;
  type: string;
  notes: string;
  issuedBy: UserRef;
  createdAt: string;
  updatedAt: string;
};

export function MyWarningsPage() {
  const { warningId } = useParams<{ warningId?: string }>();
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [selectedWarning, setSelectedWarning] = useState<Warning | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | string>('all');

  // Get unique warning types for filter
  const warningTypes = useMemo(() => {
    const types = new Set(warnings.map(w => w.type));
    return Array.from(types).sort();
  }, [warnings]);

  const filteredWarnings = useMemo(() => {
    if (typeFilter === 'all') return warnings;
    return warnings.filter(warning => warning.type === typeFilter);
  }, [warnings, typeFilter]);

  const fetchWarnings = async (showSpinner = false) => {
    try {
      if (showSpinner) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getDataHandlerWithToken(ApiConfig.getMyWarnings, { page: 1, limit: 100 }, null, true);
      setWarnings(response?.data || []);
    } catch (error) {
      console.error('Failed to load warnings:', error);
      toast.error('Failed to load your warnings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openWarning = async (id: string) => {
    const cached = warnings.find((item) => item._id === id);
    if (cached) {
      setSelectedWarning(cached);
      setDetailOpen(true);
      return;
    }

    try {
      const response = await getDataHandlerWithToken(ApiConfig.getMyWarningById(id), null, null, true);
      if (response) {
        setSelectedWarning(response);
        setDetailOpen(true);
      }
    } catch (error) {
      console.error('Failed to load warning details:', error);
      toast.error('Failed to load warning details');
    }
  };

  useEffect(() => {
    fetchWarnings();
  }, []);

  useEffect(() => {
    if (warningId) {
      openWarning(warningId);
    }
  }, [warningId, warnings]);

  const closeModal = () => {
    setDetailOpen(false);
    setSelectedWarning(null);
    // Optionally update URL if needed
    window.history.replaceState({}, '', '/bd/my-warnings');
  };

  const summary = useMemo(() => {
    const typeCounts = warnings.reduce((acc, w) => {
      acc[w.type] = (acc[w.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: warnings.length,
      uniqueTypes: Object.keys(typeCounts).length,
      mostCommon: Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None',
    };
  }, [warnings]);

  const getWarningBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Performance': 'bg-red-100 text-red-700 border-red-200',
      'Attendance': 'bg-orange-100 text-orange-700 border-orange-200',
      'Behavior': 'bg-purple-100 text-purple-700 border-purple-200',
      'Policy': 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return colors[type] || 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6 md:space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground mt-1">
              Warnings issued to you by your seniors for performance or conduct issues.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => fetchWarnings(true)} 
            disabled={refreshing} 
            className="gap-2 w-full sm:w-auto shadow-sm hover:shadow transition-all"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* Warning Feed Section */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-3 sm:space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                  Warning Feed
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Open a warning to read the full note from your senior.
                </CardDescription>
              </div>
              {/* Desktop Filter - Only show if there are warning types */}
              {warningTypes.length > 0 && (
                <div className="hidden sm:block w-full max-w-xs">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">All Types</option>
                    {warningTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              )}
              {/* Mobile Filter Button */}
              {warningTypes.length > 0 && (
                <Button
                  variant="outline"
                  className="sm:hidden w-full gap-2"
                  onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Filter by Type
                  <ChevronDown className={cn('h-4 w-4 transition-transform', mobileFilterOpen && 'rotate-180')} />
                </Button>
              )}
            </div>
            {/* Mobile Filter Dropdown */}
            {mobileFilterOpen && warningTypes.length > 0 && (
              <div className="sm:hidden pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={typeFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setTypeFilter('all');
                      setMobileFilterOpen(false);
                    }}
                    className="w-full"
                  >
                    All Types
                  </Button>
                  {warningTypes.map((type) => (
                    <Button
                      key={type}
                      variant={typeFilter === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setTypeFilter(type);
                        setMobileFilterOpen(false);
                      }}
                      className="w-full justify-start gap-2 text-xs"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex min-h-[300px] sm:min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">Loading warnings...</p>
                </div>
              </div>
            ) : filteredWarnings.length === 0 ? (
              <div className="flex min-h-[300px] sm:min-h-[400px] items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 p-8 text-center">
                <div className="max-w-sm">
                  <AlertTriangle className="mx-auto h-12 w-12 sm:h-14 sm:w-14 text-muted-foreground/40" />
                  <h3 className="mt-4 text-base sm:text-lg font-semibold">No warnings found</h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                    {typeFilter !== 'all' 
                      ? `No warnings of type "${typeFilter}" found.` 
                      : 'There are no performance warnings visible to you.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredWarnings.map((warning) => (
                  <button
                    key={warning._id}
                    type="button"
                    onClick={() => openWarning(warning._id)}
                    className="group w-full rounded-xl border bg-card p-4 sm:p-5 text-left shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <Badge className={cn('gap-1.5 px-2 py-1 text-xs font-medium', getWarningBadgeColor(warning.type))}>
                            <AlertTriangle className="h-3 w-3" />
                            {warning.type}
                          </Badge>
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          {warning.notes}
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">Issued by {warning.issuedBy?.name || 'Unknown'}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-left sm:text-right">
                        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(warning.createdAt), 'MMM dd, hh:mm a')}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scrollable Modal Dialog */}
        <Dialog open={detailOpen} onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] p-0 gap-0 rounded-xl sm:rounded-2xl overflow-hidden">
            {selectedWarning && (
              <div className="flex flex-col h-full max-h-[90vh]">
                {/* Modal Header - Sticky */}
                <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 sm:px-6 sm:py-4 flex items-start justify-between">
                  <DialogHeader className="flex-1 pr-4">
                    <DialogTitle className="flex items-start gap-2 text-lg sm:text-xl md:text-2xl">
                      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="break-words">{selectedWarning.type}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm mt-1">
                      Issued by {selectedWarning.issuedBy?.name || 'Unknown'} on {format(new Date(selectedWarning.createdAt), 'MMM dd, yyyy hh:mm a')}
                    </DialogDescription>
                  </DialogHeader>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-full"
                    onClick={closeModal}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Modal Content - Scrollable Area */}
                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6 scrollbar-thin">
                  {/* Warning Notes */}
                  <div className="rounded-xl border bg-red-50/30 dark:bg-red-950/10 p-3 sm:p-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Warning Note
                    </h4>
                    <FormattedText 
                      text={selectedWarning.notes || 'No additional notes provided.'} 
                      className="text-sm break-words leading-relaxed" 
                    />
                  </div>

                  {/* Issued By Info */}
                  <div className="grid gap-3 sm:gap-4">
                    <div className="rounded-xl border p-3 sm:p-4 bg-card">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" /> Issued By
                      </p>
                      <p className="mt-2 text-sm font-medium break-words">{selectedWarning.issuedBy?.name || 'Unknown'}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground break-words">{selectedWarning.issuedBy?.email || ''}</p>
                      {selectedWarning.issuedBy?.employeeId && (
                        <p className="text-xs text-muted-foreground mt-1">ID: {selectedWarning.issuedBy.employeeId}</p>
                      )}
                    </div>
                  
                  </div>
                </div>

                {/* Modal Footer - Sticky */}
                <DialogFooter className="sticky bottom-0 z-10 bg-background border-t px-4 py-3 sm:px-6 sm:py-4">
                  <Button variant="outline" onClick={closeModal} className="w-full sm:w-auto">
                    Close
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}