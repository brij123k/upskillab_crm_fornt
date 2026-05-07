import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Search, IndianRupee, Users, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SourceCampaignRevenueReportProps {
  data: any;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  stageFilter?: string;
  onStageFilterChange?: (stage: string) => void;
  stateFilter?: string;
  onStateFilterChange?: (state: string) => void;
}

export function SourceCampaignRevenueReport({ 
  data, 
  searchTerm = '', 
  onSearchChange,
  stageFilter = '',
  onStageFilterChange,
  stateFilter = '',
  onStateFilterChange
}: SourceCampaignRevenueReportProps) {
  // Normalize data structure
  const normalizedData = useMemo(() => {
    if (!data) return null;
    
    // If data already has the expected structure
    if (data.data && Array.isArray(data.data)) {
      return data;
    }
    
    // If data is directly the array
    if (Array.isArray(data)) {
      return {
        data: data,
        campaigns: [],
        totals: { total: { totalLead: 0, revenue: 0 }, byCampaign: {} }
      };
    }
    
    return data;
  }, [data]);
  
  // Get unique sources/stages from data
  const availableStages = useMemo(() => {
    if (!normalizedData?.data) return [];
    const stages = normalizedData.data.map((item: any) => item.source);
    return ['all', ...new Set(stages)];
  }, [normalizedData?.data]);
  
  // Get unique states (if available from your data - you'll need to add this to your API if not present)
  // For now, we'll create sample states or you can fetch from API
  const availableStates = useMemo(() => {
    // This should come from your API response
    // If not available, you can fetch from a separate endpoint
    const statesFromData = normalizedData?.states || [];
    return ['all', ...statesFromData];
  }, [normalizedData]);
  
  // Get all campaigns (columns)
  const campaigns = useMemo(() => {
    if (normalizedData?.campaigns && normalizedData.campaigns.length > 0) {
      return normalizedData.campaigns;
    }
    
    // Derive from first data item if available
    if (normalizedData?.data && normalizedData.data[0]) {
      const firstItem = normalizedData.data[0];
      return Object.keys(firstItem).filter(key => 
        key !== 'source' && key !== 'totalLead' && key !== 'totalRevenue' && 
        (key.endsWith('_lead') || key.endsWith('_revenue'))
      ).map(key => key.replace('_lead', '').replace('_revenue', ''));
    }
    
    return [];
  }, [normalizedData]);
  
  // Filter data based on search term, stage, and state
  const filteredData = useMemo(() => {
    if (!normalizedData?.data) return [];
    
    let filtered = [...normalizedData.data];
    
    // Filter by search term (source/stage name)
    if (searchTerm) {
      filtered = filtered.filter((item: any) => 
        item.source.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by stage
    if (stageFilter && stageFilter !== 'all') {
      filtered = filtered.filter((item: any) => 
        item.source.toLowerCase() === stageFilter.toLowerCase()
      );
    }
    
    // Filter by state (you'll need to implement based on your data structure)
    if (stateFilter && stateFilter !== 'all') {
      // Assuming each item has a state field
      filtered = filtered.filter((item: any) => 
        item.state?.toLowerCase() === stateFilter.toLowerCase()
      );
    }
    
    return filtered;
  }, [normalizedData?.data, searchTerm, stageFilter, stateFilter]);
  
  // Calculate totals for filtered data
  const filteredTotals = useMemo(() => {
    if (!filteredData.length) {
      return { totalLead: 0, totalRevenue: 0 };
    }
    
    return filteredData.reduce((acc, item) => ({
      totalLead: acc.totalLead + (item.totalLead || 0),
      totalRevenue: acc.totalRevenue + (item.totalRevenue || 0)
    }), { totalLead: 0, totalRevenue: 0 });
  }, [filteredData]);
  
  const hasData = normalizedData?.data && normalizedData.data.length > 0;
  const grandTotal = normalizedData?.totals?.total || filteredTotals;
  
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No source campaign revenue data available</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/20 rounded-lg">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium">Filters:</span>
        
        {/* Search Input */}
        {onSearchChange && (
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search source..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
        )}
        
        {/* Stage Filter */}
        {onStageFilterChange && availableStages.length > 1 && (
          <div className="w-[150px]">
            <Select value={stageFilter} onValueChange={onStageFilterChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                {availableStages.map((stage) => (
                  <SelectItem key={stage} value={stage} className="text-xs">
                    {stage === 'all' ? 'All Stages' : stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* State Filter */}
        {onStateFilterChange && availableStates.length > 1 && (
          <div className="w-[150px]">
            <Select value={stateFilter} onValueChange={onStateFilterChange}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                {availableStates.map((state) => (
                  <SelectItem key={state} value={state} className="text-xs">
                    {state === 'all' ? 'All States' : state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Active Filters Badges */}
        {(searchTerm || (stageFilter && stageFilter !== 'all') || (stateFilter && stateFilter !== 'all')) && (
          <div className="flex gap-1">
            {searchTerm && (
              <Badge variant="secondary" className="text-xs">
                Search: {searchTerm}
                <button
                  onClick={() => onSearchChange?.('')}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {stageFilter && stageFilter !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Stage: {stageFilter}
                <button
                  onClick={() => onStageFilterChange?.('all')}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {stateFilter && stateFilter !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                State: {stateFilter}
                <button
                  onClick={() => onStateFilterChange?.('all')}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total Leads</p>
            </div>
            <p className="text-xl font-bold mt-1">{filteredTotals.totalLead.toLocaleString()}</p>
            {searchTerm || stageFilter !== 'all' || stateFilter !== 'all' ? (
              <p className="text-xs text-muted-foreground">
                of {grandTotal.totalLead?.toLocaleString() || 0} total
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total Revenue</p>
            </div>
            <p className="text-xl font-bold mt-1">₹{filteredTotals.totalRevenue.toLocaleString()}</p>
            {searchTerm || stageFilter !== 'all' || stateFilter !== 'all' ? (
              <p className="text-xs text-muted-foreground">
                of ₹{grandTotal.totalRevenue?.toLocaleString() || 0} total
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Avg. Revenue per Lead</p>
            <p className="text-xl font-bold mt-1">
              ₹{filteredTotals.totalLead > 0 
                ? Math.round(filteredTotals.totalRevenue / filteredTotals.totalLead).toLocaleString() 
                : 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Date Range</p>
            <p className="text-xs font-medium mt-1">
              {normalizedData.startDate ? new Date(normalizedData.startDate).toLocaleDateString() : '-'}
              <br />to<br />
              {normalizedData.endDate ? new Date(normalizedData.endDate).toLocaleDateString() : '-'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Table */}
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold sticky left-0 bg-muted/50 min-w-[120px]">
                Source / Campaign
              </TableHead>
              {campaigns.map((campaign: string) => (
                <TableHead key={campaign} className="text-xs text-center min-w-[100px] bg-muted/50">
                  <div className="text-xs font-medium">{campaign}</div>
                  <div className="text-[10px] text-muted-foreground">Leads | Revenue</div>
                </TableHead>
              ))}
              <TableHead className="text-xs text-center font-semibold bg-muted/50 min-w-[100px]">
                <div>Total</div>
                <div className="text-[10px] text-muted-foreground">Leads | Revenue</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item: any, idx: number) => (
              <TableRow key={idx} className="hover:bg-muted/30">
                <TableCell className="text-xs font-medium sticky left-0 bg-background">
                  {item.source}
                </TableCell>
                {campaigns.map((campaign: string) => (
                  <TableCell key={campaign} className="text-xs text-center p-2">
                    <div className="font-medium">{item[`${campaign}_lead`]?.toLocaleString() || 0}</div>
                    <div className="text-green-600 text-[10px]">
                      ₹{item[`${campaign}_revenue`]?.toLocaleString() || 0}
                    </div>
                  </TableCell>
                ))}
                <TableCell className="text-xs text-center p-2 bg-muted/10">
                  <div className="font-bold">{item.totalLead?.toLocaleString() || 0}</div>
                  <div className="text-green-600 font-medium text-[10px]">
                    ₹{item.totalRevenue?.toLocaleString() || 0}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            
            {/* Totals Row */}
            {filteredData.length > 0 && (
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell className="text-xs font-semibold sticky left-0 bg-muted/30">
                  Total
                </TableCell>
                {campaigns.map((campaign: string) => {
                  const leadTotal = filteredData.reduce((sum, item) => sum + (item[`${campaign}_lead`] || 0), 0);
                  const revenueTotal = filteredData.reduce((sum, item) => sum + (item[`${campaign}_revenue`] || 0), 0);
                  return (
                    <TableCell key={campaign} className="text-xs text-center p-2">
                      <div className="font-medium">{leadTotal.toLocaleString()}</div>
                      <div className="text-green-600 text-[10px]">₹{revenueTotal.toLocaleString()}</div>
                    </TableCell>
                  );
                })}
                <TableCell className="text-xs text-center p-2 bg-muted/30">
                  <div className="font-bold">{filteredTotals.totalLead.toLocaleString()}</div>
                  <div className="text-green-600 font-bold text-[10px]">
                    ₹{filteredTotals.totalRevenue.toLocaleString()}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Campaign-wise Totals Section */}
      {normalizedData.totals?.byCampaign && !searchTerm && stageFilter === 'all' && stateFilter === 'all' && (
        <div>
          <h4 className="text-sm font-medium mb-2">Campaign-wise Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {Object.entries(normalizedData.totals.byCampaign)
              .filter(([_, value]: [string, any]) => value.totalLead > 0 || value.revenue > 0)
              .map(([campaign, value]: [string, any]) => (
                <Card key={campaign} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-2">
                    <p className="text-xs font-medium truncate" title={campaign}>{campaign}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-muted-foreground">Leads:</span>
                      <span className="text-xs font-semibold">{value.totalLead.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Revenue:</span>
                      <span className="text-xs font-semibold text-green-600">
                        ₹{value.revenue.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}