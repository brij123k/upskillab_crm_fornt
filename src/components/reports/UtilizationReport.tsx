import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight, Phone, Loader2 } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { useToast } from '@/hooks/use-toast';

interface UtilizationReportProps {
  data: any;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

interface StageModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  stages: any;
  employeeId: string;
  startDate: string;
  endDate: string;
  onStageClick: (stageId: string, stageName: string) => void;
}

interface LeadDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: any[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalLeads: number;
  onPageChange: (newPage: number) => void;
  stageName: string;
  employeeName: string;
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

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Lead Details Modal Component - Full Screen
function LeadDetailsModal({ 
  isOpen, 
  onClose, 
  leads, 
  loading, 
  page, 
  totalPages, 
  totalLeads,
  onPageChange,
  stageName,
  employeeName
}: LeadDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-4 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl">
            {stageName} Leads - {employeeName}
          </DialogTitle>
          {!loading && totalLeads > 0 && (
            <div className="text-sm text-muted-foreground mt-1">
              Total leads: {totalLeads}
            </div>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !leads || leads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground h-full flex items-center justify-center">
              No leads found for this stage
            </div>
          ) : (
            <>
              <div className="overflow-x-auto flex-1 min-h-0 border rounded-lg">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-sm font-semibold">Lead Name</TableHead>
                      <TableHead className="text-sm font-semibold">Phone</TableHead>
                      <TableHead className="text-sm font-semibold">Email</TableHead>
                      <TableHead className="text-sm font-semibold">Source</TableHead>
                      <TableHead className="text-sm font-semibold">Stage</TableHead>
                      <TableHead className="text-sm font-semibold">Assigned Date</TableHead>
                      <TableHead className="text-sm font-semibold">Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead: any, idx: number) => (
                      <TableRow key={lead.leadId || lead._id || idx} className="hover:bg-muted/30">
                        <TableCell className="text-sm font-medium">{lead.name || '-'}</TableCell>
                        <TableCell className="text-sm">{lead.phone || '-'}</TableCell>
                        <TableCell className="text-sm">{lead.email || '-'}</TableCell>
                        <TableCell className="text-sm capitalize">{lead.source || '-'}</TableCell>
                        <TableCell className="text-sm capitalize">{lead.stageName || lead.stage || '-'}</TableCell>
                        <TableCell className="text-sm">{formatDate(lead.assignedDate)}</TableCell>
                        <TableCell className="text-sm">{lead.employeeName || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-2 border-t flex-shrink-0">
                  <div className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onPageChange(page - 1)}
                      disabled={page === 0}
                      className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => onPageChange(page + 1)}
                      disabled={page === totalPages - 1}
                      className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Stage Modal Component (unchanged, but kept for completeness)
function StageModal({ isOpen, onClose, employeeName, stages, onStageClick }: StageModalProps) {
  let stagesList: { id: string; name: string; count: number }[] = [];
  
  if (Array.isArray(stages)) {
    stagesList = stages.map((item: any) => ({
      id: item.stageId || item.id || '',
      name: item.stageName || item.name || 'Unknown',
      count: item.count || 0
    }));
  } else if (typeof stages === 'object' && stages !== null) {
    stagesList = Object.entries(stages).map(([name, count]) => ({
      id: name,
      name,
      count: count as number
    }));
  }
  
  stagesList.sort((a, b) => b.count - a.count);
  
  const handleBadgeClick = (stageId: string, stageName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onStageClick(stageId, stageName);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stage Details - {employeeName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {stagesList.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>No stage data available for this employee</p>
            </div>
          ) : (
            stagesList.map((stage) => (
              <div
                key={stage.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <span className="text-sm font-medium capitalize">{stage.name}</span>
                <Badge 
                  variant="secondary" 
                  className="text-sm cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={(e) => handleBadgeClick(stage.id, stage.name, e)}
                >
                  {stage.count}
                </Badge>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UtilizationReport({ data, searchTerm = '', onSearchChange }: UtilizationReportProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for second modal (lead details)
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leadsData, setLeadsData] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsPage, setLeadsPage] = useState(0);
  const [leadsTotalPages, setLeadsTotalPages] = useState(1);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
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
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };
  
  const fetchLeadsForStage = async (stageId: string, stageName: string, pageNum: number = 0) => {
    if (!selectedEmployee) return;
    setSelectedStageId(stageId);
    setLeadsLoading(true);
    try {
      const params = {
        employeeId: selectedEmployee.employeeId,
        stageId: stageId,
        startDate: data.startDate,
        endDate: data.endDate,
        page: pageNum + 1,
        limit: 10
      };
      
      const response = await getDataHandlerWithToken(ApiConfig.employeeStageleads, params, null, true);
      const result = response?.data || response;
      
      // Extract leads array safely from response
      let leadsArray = result?.data || [];
      if (Array.isArray(result)) {
        leadsArray = result;
      } else if (result?.leads && Array.isArray(result.leads)) {
        leadsArray = result.leads;
      }
      
      setLeadsData(leadsArray);
      setLeadsTotalPages(response?.totalPages || 1);
      setLeadsTotal(response?.total || leadsArray.length);
      setLeadsPage(pageNum);
      setSelectedStage(stageName);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load leads',
        variant: 'destructive'
      });
      setLeadsData([]);
      setLeadsTotalPages(1);
      setLeadsTotal(0);
    } finally {
      setLeadsLoading(false);
    }
  };
  
  const handleStageClick = (stageId: string, stageName: string) => {
    setIsLeadModalOpen(true);
    fetchLeadsForStage(stageId, stageName, 0);
  };
  
  const handleLeadPageChange = (newPage: number) => {
    if (selectedStageId) {
      fetchLeadsForStage(selectedStageId, selectedStage, newPage);
    }
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
      {selectedEmployee && (
        <StageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          employeeName={selectedEmployee.employeeName}
          stages={selectedEmployee.allStages || {}}
          employeeId={selectedEmployee.employeeId}
          startDate={data.startDate}
          endDate={data.endDate}
          onStageClick={handleStageClick}
        />
      )}
      
      {/* Lead Details Modal - Full Screen with Total and Pagination */}
      <LeadDetailsModal
        key={selectedStageId}
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        leads={leadsData}
        loading={leadsLoading}
        page={leadsPage}
        totalPages={leadsTotalPages}
        totalLeads={leadsTotal}
        onPageChange={handleLeadPageChange}
        stageName={selectedStage}
        employeeName={selectedEmployee?.employeeName || ''}
      />
    </div>
  );
}