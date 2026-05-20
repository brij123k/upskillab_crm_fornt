import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';

type ReportRow = {
  sourceCampaignId: string;
  sourceCampaignName: string;
  source: string;
  totalLeads: number;
  lastLeadAt?: string;
};

interface Props {
  data: { data?: ReportRow[]; totalLeads?: number } | null;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  stageFilter?: string;
  onStageFilterChange?: (value: string) => void;
  stateFilter?: string;
  onStateFilterChange?: (value: string) => void;
}

export function SourceCampaignComparisonReport({ data }: Props) {
  const rows = data?.data || [];

  const totals = useMemo(() => {
    return {
      campaigns: rows.length,
      leads: rows.reduce((sum, row) => sum + (row.totalLeads || 0), 0),
    };
  }, [rows]);

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No source campaign comparison data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Campaigns</p>
            <p className="text-2xl font-bold">{totals.campaigns}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total Leads</p>
            <p className="text-2xl font-bold">{totals.leads.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Top Campaign</p>
            <p className="text-sm font-semibold truncate">{rows[0]?.sourceCampaignName || '-'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead>Last Lead</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.sourceCampaignId}-${row.source}`}>
                <TableCell className="font-medium">{row.sourceCampaignName}</TableCell>
                <TableCell>
                  <Badge variant="outline">{row.source}</Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">{row.totalLeads.toLocaleString()}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.lastLeadAt ? new Date(row.lastLeadAt).toLocaleString() : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
