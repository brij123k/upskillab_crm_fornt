import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart } from 'lucide-react';

interface StageSummaryReportProps {
  data: any;
}

export function StageSummaryReport({ data }: StageSummaryReportProps) {
  // Check if data exists and has report array with items
  const hasData = data?.report && Array.isArray(data.report) && data.report.length > 0;
  
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No stage data available</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
      </div>
    );
  }
  
  const stages = data.report;
  const total = data.totalLead || 0;
  const totalLead = data.totalLead || 0
  return (
    <div className="overflow-x-auto">
      <div className="text-md">Total Leads : {totalLead}</div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Lead Stage</TableHead>
            <TableHead className="text-xs text-right">Count</TableHead>
            <TableHead className="text-xs text-right">Percentage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stages.map((item: any, idx: number) => (
            <TableRow key={idx}>
              <TableCell className="text-xs font-medium">{item.leadStage}</TableCell>
              <TableCell className="text-xs text-right">{item.count}</TableCell>
              <TableCell className="text-xs text-right">
                {((item.count / total) * 100).toFixed(1)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}