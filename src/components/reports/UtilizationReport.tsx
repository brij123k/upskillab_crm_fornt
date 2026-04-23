import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight, Phone, Timer, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface UtilizationReportProps {
  data: any;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const formatTime = (seconds: number) => {
  if (!seconds) return '0m';
  const mins = Math.floor(seconds / 60);
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  }
  return `${mins}m`;
};

export function UtilizationReport({ data, searchTerm = '', onSearchChange }: UtilizationReportProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const employeesPerPage = 10;
  
  if (!data?.employees || data.employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Phone className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No utilization data available</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
      </div>
    );
  }
  
  // Filter employees by search term
  let filteredEmployees = data.employees;
  if (searchTerm) {
    filteredEmployees = data.employees.filter((e: any) => 
      e.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  if (filteredEmployees.length === 0 && searchTerm) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No matching employees found</p>
        <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
      </div>
    );
  }
  
  // Calculate totals
  const totals = filteredEmployees.reduce((acc: any, e: any) => ({
    dials: acc.dials + (e.totalDial || 0),
    talkTime: acc.talkTime + (e.answeredTalkTime || 0),
    admissions: acc.admissions + (e.admissionDone || 0),
    pcatScheduled: acc.pcatScheduled + (e.pcatScheduled || 0),
    pcatDone: acc.pcatDone + (e.pcatDone || 0)
  }), { dials: 0, talkTime: 0, admissions: 0, pcatScheduled: 0, pcatDone: 0 });
  
  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    currentPage * employeesPerPage,
    (currentPage + 1) * employeesPerPage
  );
  
  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-primary/5 rounded-lg p-2 text-center">
          <Phone className="h-4 w-4 mx-auto text-muted-foreground" />
          <p className="text-lg font-bold">{totals.dials}</p>
          <p className="text-[10px] text-muted-foreground">Total Dials</p>
        </div>
        <div className="bg-primary/5 rounded-lg p-2 text-center">
          <Timer className="h-4 w-4 mx-auto text-muted-foreground" />
          <p className="text-lg font-bold">{formatTime(totals.talkTime)}</p>
          <p className="text-[10px] text-muted-foreground">Talk Time</p>
        </div>
        <div className="bg-primary/5 rounded-lg p-2 text-center">
          <CheckCircle className="h-4 w-4 mx-auto text-muted-foreground" />
          <p className="text-lg font-bold">{totals.pcatScheduled}</p>
          <p className="text-[10px] text-muted-foreground">PCAT Scheduled</p>
        </div>
        <div className="bg-primary/5 rounded-lg p-2 text-center">
          <CheckCircle className="h-4 w-4 mx-auto text-muted-foreground" />
          <p className="text-lg font-bold">{totals.pcatDone}</p>
          <p className="text-[10px] text-muted-foreground">PCAT Done</p>
        </div>
        <div className="bg-primary/5 rounded-lg p-2 text-center">
          <CheckCircle className="h-4 w-4 mx-auto text-muted-foreground" />
          <p className="text-lg font-bold">{totals.admissions}</p>
          <p className="text-[10px] text-muted-foreground">Admissions</p>
        </div>
      </div>
      
      {/* Search and Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          {filteredEmployees.length} employees • {data.startDate && data.endDate && (
            <span>
              {new Date(data.startDate).toLocaleDateString()} - {new Date(data.endDate).toLocaleDateString()}
            </span>
          )}
        </div>
        {onSearchChange && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input 
              placeholder="Search employee..." 
              value={searchTerm}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setCurrentPage(0);
              }}
              className="pl-7 h-8 text-xs"
            />
          </div>
        )}
      </div>
      
      {/* Employee Table */}
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold sticky left-0 bg-muted/50 min-w-[100px]">
                Employee
              </TableHead>
              <TableHead className="text-xs text-center">Designation</TableHead>
              <TableHead className="text-xs text-center">Vintage</TableHead>
              <TableHead className="text-xs text-center">Leads</TableHead>
              <TableHead className="text-xs text-center">Dials</TableHead>
              <TableHead className="text-xs text-center">Talk Time</TableHead>
              <TableHead className="text-xs text-center">PCAT S.</TableHead>
              <TableHead className="text-xs text-center">PCAT D.</TableHead>
              <TableHead className="text-xs text-center">Reg D.</TableHead>
              <TableHead className="text-xs text-center">Ad D.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEmployees.map((emp: any, idx: number) => (
              <TableRow key={idx} className="hover:bg-muted/30">
                <TableCell className="text-xs sticky left-0 bg-white border-r">
                  <div className="font-medium">{emp.employeeName}</div>
                </TableCell>
                <TableCell className="text-xs text-center">
                  {emp.designation || '-'}
                </TableCell>
                <TableCell className="text-xs text-center">
                  {emp.vintage || '-'}
                </TableCell>
                <TableCell className="text-xs text-center font-medium">
                  {emp.leadAssigned || 0}
                </TableCell>
                <TableCell className="text-xs text-center">
                  {emp.totalDial || 0}
                </TableCell>
                <TableCell className="text-xs text-center">
                  {formatTime(emp.answeredTalkTime)}
                </TableCell>
                <TableCell className="text-xs text-center">
                  {emp.pcatScheduled || 0}
                </TableCell>
                <TableCell className="text-xs text-center">                    
                 {emp.pcatDone || 0}    
                </TableCell>
                <TableCell className="text-xs text-center font-medium">
                  {emp.registrationDone || 0}    
                </TableCell>
                <TableCell className="text-xs text-center font-medium">
                  {emp.admissionDone || 0}    
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