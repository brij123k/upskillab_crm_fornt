import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export function ConsultantPerformanceReport({ data, searchTerm = '', onSearchChange }: any) {
  if (!Array.isArray(data)) return null;
  
  const consultants = searchTerm 
    ? data.filter((c: any) => c.consultantName?.toLowerCase().includes(searchTerm.toLowerCase()))
    : data;
  
  const totalRevenue = consultants.reduce((sum, c) => sum + (c.bookedRevenue || 0), 0);
  
  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="bg-primary/5 rounded-lg p-3 text-center">
        <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
        <p className="text-xs text-muted-foreground">Total Revenue</p>
      </div>
      
      {/* Search */}
      {onSearchChange && (
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input 
            placeholder="Search consultant..." 
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
      )}
      
      {/* Consultant List */}
      <div className="space-y-2 max-h-[450px] overflow-auto">
        {consultants.map((cons: any, idx: number) => (
          <div key={idx} className="border rounded-lg p-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm font-medium">{cons.consultantName}</p>
                <p className="text-xs text-muted-foreground">{cons.totalLeadAssigned || 0} leads</p>
              </div>
              <span className="text-sm font-semibold text-green-600">{formatCurrency(cons.bookedRevenue)}</span>
            </div>
            <div className="flex gap-3 text-xs">
              <span>Adm: {cons.admDone || 0}</span>
              <span>Realised: {formatCurrency(cons.realisedRevenue)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}