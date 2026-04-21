import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IndianRupee, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

interface PoolRevenueReportProps {
  data: any;
}

export function PoolRevenueReport({ data }: PoolRevenueReportProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const employeesPerPage = 10;
  
  if (!data?.employees || data.employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <IndianRupee className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No revenue data available</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
      </div>
    );
  }
  
  // Get all unique pools from all employees
  const allPools = data.pools || [];
  
  // Prepare employee revenue data
  const employeeRevenueMap = data.employees.map((emp: any) => {
    const poolRevenueMap = new Map();
    emp.pools?.forEach((pool: any) => {
      const revenue = pool.revenueByMonth?.[0]?.revenue || 0;
      if (revenue > 0) {
        poolRevenueMap.set(pool.poolName, revenue);
      }
    });
    
    // Calculate total revenue for this employee
    const totalRevenue = Array.from(poolRevenueMap.values()).reduce((sum, rev) => sum + rev, 0);
    
    return {
      id: emp.employeeId,
      name: emp.employeeName,
      email: emp.employeeEmail,
      totalRevenue: totalRevenue,
      poolRevenues: poolRevenueMap
    };
  });
  
  // Filter employees with revenue > 0
  const employeesWithRevenue = employeeRevenueMap.filter(emp => emp.totalRevenue > 0);
  
  // Pagination
  const totalPages = Math.ceil(employeesWithRevenue.length / employeesPerPage);
  const paginatedEmployees = employeesWithRevenue.slice(
    currentPage * employeesPerPage,
    (currentPage + 1) * employeesPerPage
  );
  
  // Calculate total revenue
  const totalRevenue = employeesWithRevenue.reduce((sum, emp) => sum + emp.totalRevenue, 0);
  const currentMonth = data.months?.[0] || 'Current Month';
  
  if (employeesWithRevenue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <IndianRupee className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No revenue records found</p>
        <p className="text-xs text-muted-foreground mt-1">Try a different date range</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-primary/5 rounded-lg p-3 text-center">
          <p className="text-lg font-bold">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-muted-foreground">Total Revenue</p>
        </div>
        <div className="bg-primary/5 rounded-lg p-3 text-center">
          <p className="text-lg font-bold">{employeesWithRevenue.length}</p>
          <p className="text-xs text-muted-foreground">Active Employees</p>
        </div>
      </div>
      
      {/* Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          Showing revenue for {currentMonth}
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold sticky left-0 bg-muted/50 min-w-[150px] z-10">
                Employee
              </TableHead>
              {allPools.map((pool: any) => (
                <TableHead key={pool.poolId} className="text-xs text-center min-w-[120px]">
                  <div className="font-semibold">{pool.poolName}</div>
                </TableHead>
              ))}
              <TableHead className="text-xs text-center min-w-[100px] bg-muted/50">
                <div className="font-semibold">Total</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEmployees.map((emp: any) => (
              <TableRow key={emp.id} className="hover:bg-muted/30">
                <TableCell className="text-xs sticky left-0 bg-white border-r z-10">
                  <div className="font-medium">{emp.name}</div>
                  <div className="text-[10px] text-muted-foreground">{emp.email}</div>
                </TableCell>
                {allPools.map((pool: any) => (
                  <TableCell key={pool.poolId} className="text-xs text-center p-2">
                    {emp.poolRevenues.get(pool.poolName) ? (
                      <span className="font-medium text-green-600">
                        {formatCurrency(emp.poolRevenues.get(pool.poolName))}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                ))}
                <TableCell className="text-xs text-center font-semibold bg-muted/20">
                  {formatCurrency(emp.totalRevenue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="p-1 rounded border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage === totalPages - 1}
              className="p-1 rounded border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}