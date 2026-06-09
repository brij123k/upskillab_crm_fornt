import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface UtilizationReportProps {
  data: any;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

interface StageModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  stages: Record<string, number>;
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

// Stage Modal Component
function StageModal({ isOpen, onClose, employeeName, stages }: StageModalProps) {
  if (!stages || Object.keys(stages).length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Stages - {employeeName}</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            <p>No stage data available for this employee</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Sort stages by count in descending order
  const sortedStages = Object.entries(stages).sort(([, a], [, b]) => b - a);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stage Details - {employeeName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {sortedStages.map(([stage, count]) => (
            <div
              key={stage}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
            >
              <span className="text-sm font-medium capitalize">{stage}</span>
              <Badge variant="secondary" className="text-sm">
                {count}
              </Badge>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UtilizationReport({ data, searchTerm = '', onSearchChange }: UtilizationReportProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState<{ name: string; stages: Record<string, number> } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
  
  // Calculate totals for all filtered employees
  const totals = filteredEmployees.reduce((acc: any, e: any) => ({
    leadAssigned: acc.leadAssigned + (e.leadAssigned || 0),
    newLead: acc.newLead + (e.newLead || 0),
    totalDial: acc.totalDial + (e.totalDial || 0),
    uniqDial: acc.uniqDial + (e.uniqDial || 0),
    answeredCall: acc.answeredCall + (e.answeredCall || 0),
    answeredTalkTime: acc.answeredTalkTime + (e.answeredTalkTime || 0),
    pcatScheduled: acc.pcatScheduled + (e.pcatScheduled || 0),
    pcatDone: acc.pcatDone + (e.pcatDone || 0),
    registrationDone: acc.registrationDone + (e.registrationDone || 0),
    admissionDone: acc.admissionDone + (e.admissionDone || 0)
  }), { 
    leadAssigned: 0, 
    newLead: 0, 
    totalDial: 0, 
    uniqDial: 0, 
    answeredCall: 0, 
    answeredTalkTime: 0, 
    pcatScheduled: 0, 
    pcatDone: 0, 
    registrationDone: 0, 
    admissionDone: 0 
  });
  
  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    currentPage * employeesPerPage,
    (currentPage + 1) * employeesPerPage
  );
  
  const handleRowClick = (employee: any) => {
    setSelectedEmployee({
      name: employee.employeeName,
      stages: employee.allStages || {}
    });
    setIsModalOpen(true);
  };
  
  return (
    <div className="space-y-4">
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
              <TableHead className="text-xs text-center">New Leads</TableHead>
              <TableHead className="text-xs text-center">Total Dials</TableHead>
              <TableHead className="text-xs text-center">Uniq Dials</TableHead>
              <TableHead className="text-xs text-center">Answered</TableHead>
              <TableHead className="text-xs text-center">Talk Time</TableHead>
              <TableHead className="text-xs text-center">PCAT S.</TableHead>
              <TableHead className="text-xs text-center">PCAT D.</TableHead>
              <TableHead className="text-xs text-center">Reg.</TableHead>
              <TableHead className="text-xs text-center">Ad.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEmployees.map((emp: any, idx: number) => (
              <TableRow 
                key={idx} 
                className="hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => handleRowClick(emp)}
              >
                <TableCell className="text-xs sticky left-0 bg-white border-r">
                  <div className="font-medium">{emp.employeeName}</div>
                  <div className="text-[10px] text-muted-foreground">{emp.employeeEmail}</div>
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
                  {emp.newLead || 0}
                </TableCell>
                <TableCell className="text-xs text-center">
                  {emp.totalDial || 0}
                </TableCell>
                <TableCell className="text-xs text-center">
                  {emp.uniqDial || 0}
                </TableCell>
                <TableCell className="text-xs text-center">
                  {emp.answeredCall || 0}
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
            
            {/* Total Row */}
            <TableRow className="bg-muted/30 font-semibold border-t-2">
              <TableCell className="text-xs sticky left-0 bg-muted/30 font-semibold">
                Total
              </TableCell>
              <TableCell className="text-xs text-center" colSpan={2}>
                -
              </TableCell>
              <TableCell className="text-xs text-center font-bold">
                {totals.leadAssigned}
              </TableCell>
              <TableCell className="text-xs text-center font-bold">
                {totals.newLead}
              </TableCell>
              <TableCell className="text-xs text-center font-bold">
                {totals.totalDial}
              </TableCell>
              <TableCell className="text-xs text-center font-bold">
                {totals.uniqDial}
              </TableCell>
              <TableCell className="text-xs text-center font-bold">
                {totals.answeredCall}
              </TableCell>
              <TableCell className="text-xs text-center font-bold">
                {formatTime(totals.answeredTalkTime)}
              </TableCell>
              <TableCell className="text-xs text-center font-bold">
                {totals.pcatScheduled}
              </TableCell>
              <TableCell className="text-xs text-center font-bold">
                {totals.pcatDone}
              </TableCell>
              <TableCell className="text-xs text-center font-bold">
                {totals.registrationDone}
              </TableCell>
              <TableCell className="text-xs text-center font-bold">
                {totals.admissionDone}
              </TableCell>
            </TableRow>
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
      
      {/* Stage Modal */}
      <StageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employeeName={selectedEmployee?.name || ''}
        stages={selectedEmployee?.stages || {}}
      />
    </div>
  );
}