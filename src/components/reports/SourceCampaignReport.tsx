import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { BarChart, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SourceCampaignReportProps {
  data: any;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export function SourceCampaignReport({ data, searchTerm = '', onSearchChange }: SourceCampaignReportProps) {
     console.log('SourceCampaignReport received data:', data);
  console.log('Data structure:', {
    hasData: data?.data,
    isArray: Array.isArray(data?.data),
    length: data?.data?.length,
    sourceCampaigns: data?.sourceCampaigns,
    grandTotal: data?.grandTotal
  });
  // Check if data exists and has data array with items
  const hasData = data?.data && Array.isArray(data.data) && data.data.length > 0;
  
  // Get unique source campaigns (columns)
  const sourceCampaigns = data?.sourceCampaigns || [];
  
  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!hasData) return [];
    if (!searchTerm) return data.data;
    
    return data.data.filter((item: any) => 
      item.sourceCampaignName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data?.data, searchTerm, hasData]);
  
  // Calculate total for each column across filtered rows
  const columnTotals = useMemo(() => {
    if (!filteredData.length) return {};
    
    const totals: Record<string, number> = {};
    sourceCampaigns.forEach((campaign: string) => {
      totals[campaign] = filteredData.reduce((sum, item) => sum + (item[campaign] || 0), 0);
    });
    totals['total'] = filteredData.reduce((sum, item) => sum + (item.total || 0), 0);
    
    return totals;
  }, [filteredData, sourceCampaigns]);
  
  // Calculate grand total from API or from filtered data
  const grandTotal = searchTerm ? columnTotals.total : (data?.grandTotal || 0);
  
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No source campaign data available</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Search Input */}
      {onSearchChange && (
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by source campaign name..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
          {searchTerm && (
            <div className="text-xs text-muted-foreground">
              Showing {filteredData.length} of {data.data.length} campaigns
            </div>
          )}
        </div>
      )}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total Leads</p>
            <p className="text-xl font-bold">{grandTotal.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total Campaigns</p>
            <p className="text-xl font-bold">{sourceCampaigns.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Lead Stages</p>
            <p className="text-xl font-bold">{filteredData.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Date Range</p>
            <p className="text-xs font-medium mt-1">
              {data.startDate ? new Date(data.startDate).toLocaleDateString() : '-'}
              <br />to<br />
              {data.endDate ? new Date(data.endDate).toLocaleDateString() : '-'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Table */}
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold sticky left-0 bg-muted/50">
                Lead Stage / Campaign
              </TableHead>
              {sourceCampaigns.map((campaign: string) => (
                <TableHead key={campaign} className="text-xs text-right min-w-[100px]">
                  {campaign}
                </TableHead>
              ))}
              <TableHead className="text-xs text-right font-semibold bg-muted/50 min-w-[80px]">
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item: any, idx: number) => (
              <TableRow key={idx} className="hover:bg-muted/30">
                <TableCell className="text-xs font-medium sticky left-0 bg-background">
                  {item.sourceCampaignName}
                </TableCell>
                {sourceCampaigns.map((campaign: string) => (
                  <TableCell key={campaign} className="text-xs text-right">
                    {item[campaign]?.toLocaleString() || 0}
                  </TableCell>
                ))}
                <TableCell className="text-xs text-right font-semibold">
                  {item.total?.toLocaleString() || 0}
                </TableCell>
              </TableRow>
            ))}
            
            {/* Totals Row */}
            <TableRow className="bg-muted/30 font-semibold">
              <TableCell className="text-xs font-semibold sticky left-0 bg-muted/30">
                Total
              </TableCell>
              {sourceCampaigns.map((campaign: string) => (
                <TableCell key={campaign} className="text-xs text-right font-semibold">
                  {columnTotals[campaign]?.toLocaleString() || 0}
                </TableCell>
              ))}
              <TableCell className="text-xs text-right font-bold bg-muted/30">
                {columnTotals.total?.toLocaleString() || 0}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      
      {/* Campaign Totals Section */}
      {data.totalsByCampaign && Object.keys(data.totalsByCampaign).length > 0 && !searchTerm && (
        <div>
          <h4 className="text-sm font-medium mb-2">Campaign-wise Totals</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(data.totalsByCampaign).map(([campaign, total]) => (
              <div key={campaign} className="flex justify-between items-center p-2 bg-muted/20 rounded-md">
                <span className="text-xs truncate">{campaign}</span>
                <span className="text-xs font-semibold">{(total as number).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}