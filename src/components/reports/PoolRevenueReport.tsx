const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

export function PoolRevenueReport({ data }: any) {
  if (!data?.employees) return null;
  
  const totalRevenue = data.employees.reduce((sum: number, emp: any) => 
    sum + emp.pools.reduce((s: number, p: any) => s + (p.revenueByMonth[0]?.revenue || 0), 0), 0);
  
  return (
    <div className="space-y-3">
      <div className="bg-primary/5 rounded-lg p-3 text-center">
        <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
        <p className="text-xs text-muted-foreground">Total Revenue</p>
      </div>
      
      <div className="space-y-2 max-h-[450px] overflow-auto">
        {data.employees.map((emp: any, idx: number) => {
          const empRevenue = emp.pools.reduce((s: number, p: any) => s + (p.revenueByMonth[0]?.revenue || 0), 0);
          if (empRevenue === 0) return null;
          
          return (
            <div key={idx} className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium">{emp.employeeName}</p>
                <span className="text-sm font-semibold text-green-600">{formatCurrency(empRevenue)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {emp.pools.map((pool: any, pIdx: number) => {
                  const rev = pool.revenueByMonth[0]?.revenue || 0;
                  if (rev === 0) return null;
                  return (
                    <span key={pIdx} className="text-xs bg-muted px-2 py-0.5 rounded">
                      {pool.poolName}: {formatCurrency(rev)}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}