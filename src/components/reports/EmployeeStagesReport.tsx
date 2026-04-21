import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';

interface EmployeeStagesReportProps {
  data: any;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export function EmployeeStagesReport({ data, searchTerm = '', onSearchChange }: EmployeeStagesReportProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [allStages, setAllStages] = useState<string[]>(['Total Lead']);
  const [loadingStages, setLoadingStages] = useState(true);
  const employeesPerPage = 5;
  
  // Fetch all stages from API
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const response = await getDataHandlerWithToken(ApiConfig.getAllStages, null, null, true);
        const stagesData = response?.data || response || [];
        
        if (Array.isArray(stagesData) && stagesData.length > 0) {
          // Extract stage names and sort them (you can customize the sorting logic)
          const stageNames = stagesData.map((stage: any) => stage.stageName || stage.name || stage.title);
          setAllStages(['Total Lead', ...stageNames]);
        } else {
          // Fallback to empty array if no stages found
          setAllStages(['Total Lead']);
        }
      } catch (error) {
        console.error('Failed to fetch stages:', error);
        setAllStages(['Total Lead']);
      } finally {
        setLoadingStages(false);
      }
    };
    
    fetchStages();
  }, []);
  
  if (!data?.employees) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">No employee data available</p>
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
  
  if (filteredEmployees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No matching employees found</p>
      </div>
    );
  }
  
  // Create a map of stage counts for each employee
  const employeeStageMap = filteredEmployees.map((emp: any) => {
    const stageMap = new Map();
    emp.stages?.forEach((stage: any) => {
      stageMap.set(stage.leadStage, stage.count);
    });
    return {
      id: emp.employeeId,
      name: emp.employeeName,
      email: emp.employeeEmail,
      totalLead: emp.totalLead,
      stages: stageMap
    };
  });
  
  // Pagination
  const totalPages = Math.ceil(employeeStageMap.length / employeesPerPage);
  const paginatedEmployees = employeeStageMap.slice(
    currentPage * employeesPerPage,
    (currentPage + 1) * employeesPerPage
  );
  
  // Get unique stages that appear in the data (for displaying only relevant stages)
  const getRelevantStages = () => {
    if (allStages.length <= 1) return ['Total Lead'];
    
    // Get stages that have data in any employee
    const stagesWithData = new Set<string>();
    employeeStageMap.forEach(emp => {
      emp.stages.forEach((value, key) => {
        if (value > 0) {
          stagesWithData.add(key);
        }
      });
    });
    
    // Return stages that are in allStages and have data, plus Total Lead
    const relevantStages = ['Total Lead', ...Array.from(stagesWithData).filter(stage => 
      allStages.includes(stage)
    )];
    
    return relevantStages;
  };
  
  const stagesToDisplay = getRelevantStages();
  
  if (loadingStages) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground mt-3">Loading stages...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Search and Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          {filteredEmployees.length} employees • {data.totalLeads || 0} total leads
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
      
      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold sticky left-0 bg-muted/50 min-w-[120px] z-10">
                Lead Stage
              </TableHead>
              {paginatedEmployees.map((emp: any) => (
                <TableHead key={emp.id} className="text-xs text-center min-w-[100px]">
                  <div className="font-semibold">{emp.name}</div>
                  <div className="text-[10px] font-normal text-muted-foreground mt-0.5">
                    Total: {emp.totalLead}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {stagesToDisplay.map((stage) => {
              // Check if any employee has this stage (to avoid empty rows)
              const hasData = paginatedEmployees.some(emp => {
                if (stage === 'Total Lead') return true;
                return emp.stages.get(stage) > 0;
              });
              
              if (!hasData) return null;
              
              return (
                <TableRow key={stage} className="hover:bg-muted/30">
                  <TableCell className="text-xs font-medium sticky left-0 bg-white border-r z-10">
                    {stage}
                  </TableCell>
                  {paginatedEmployees.map((emp: any) => (
                    <TableCell key={emp.id} className="text-xs text-center p-2">
                      {stage === 'Total Lead' ? (
                        <span className="font-semibold">{emp.totalLead}</span>
                      ) : (
                        <span className={emp.stages.get(stage) > 0 ? 'font-medium' : 'text-muted-foreground'}>
                          {emp.stages.get(stage) || '-'}
                        </span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
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