import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';

interface PoolStagesReportProps {
  data: any;
}

export function PoolStagesReport({ data }: PoolStagesReportProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [allStages, setAllStages] = useState<string[]>([]);
  const [loadingStages, setLoadingStages] = useState(true);
  const poolsPerPage = 5;
  
  if (!data?.poolWiseData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No pool data available</p>
      </div>
    );
  }
  
  // Fetch all stages from API
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const response = await getDataHandlerWithToken(ApiConfig.getAllStages, null, null, true);
        const stagesData = response?.data || response || [];
        
        if (Array.isArray(stagesData) && stagesData.length > 0) {
          // Extract stage names
          const stageNames = stagesData.map((stage: any) => stage.stageName || stage.name || stage.title);
          setAllStages(stageNames);
        }
      } catch (error) {
        console.error('Failed to fetch stages:', error);
      } finally {
        setLoadingStages(false);
      }
    };
    
    fetchStages();
  }, []);
  
  const pools = data.poolWiseData;
  
  // Create a map of stage counts for each pool
  const poolStageMap = pools.map((pool: any) => {
    const stageMap = new Map();
    pool.stages?.forEach((stage: any) => {
      stageMap.set(stage.stage, stage.count);
    });
    return {
      id: pool.poolId,
      name: pool.poolName,
      totalLead: pool.totalLead,
      stages: stageMap
    };
  });
  
  // Get unique stages that appear in the data
  const getRelevantStages = () => {
    if (allStages.length === 0) {
      // Fallback: extract stages from data if API fails
      const stagesSet = new Set<string>();
      poolStageMap.forEach(pool => {
        pool.stages.forEach((value, key) => {
          if (value > 0) {
            stagesSet.add(key);
          }
        });
      });
      return Array.from(stagesSet).sort();
    }
    
    // Get stages that have data in any pool
    const stagesWithData = new Set<string>();
    poolStageMap.forEach(pool => {
      pool.stages.forEach((value, key) => {
        if (value > 0) {
          stagesWithData.add(key);
        }
      });
    });
    
    // Return stages that are in allStages and have data
    const relevantStages = Array.from(stagesWithData).filter(stage => 
      allStages.includes(stage)
    ).sort();
    
    return relevantStages;
  };
  
  const stagesToDisplay = getRelevantStages();
  
  // Pagination
  const totalPages = Math.ceil(poolStageMap.length / poolsPerPage);
  const paginatedPools = poolStageMap.slice(
    currentPage * poolsPerPage,
    (currentPage + 1) * poolsPerPage
  );
  
  if (loadingStages) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground mt-3">Loading stages...</p>
      </div>
    );
  }
  
  if (pools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No pool data available</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          {pools.length} pools • {data.poolWiseData.reduce((sum: number, p: any) => sum + p.totalLead, 0)} total leads
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold sticky left-0 bg-muted/50 min-w-[120px] z-10">
                Lead Stage
              </TableHead>
              {paginatedPools.map((pool: any) => (
                <TableHead key={pool.id} className="text-xs text-center min-w-[100px]">
                  <div className="font-semibold">{pool.name}</div>
                  <div className="text-[10px] font-normal text-muted-foreground mt-0.5">
                    Total: {pool.totalLead}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {stagesToDisplay.map((stage) => (
              <TableRow key={stage} className="hover:bg-muted/30">
                <TableCell className="text-xs font-medium sticky left-0 bg-white border-r z-10">
                  {stage}
                </TableCell>
                {paginatedPools.map((pool: any) => (
                  <TableCell key={pool.id} className="text-xs text-center p-2">
                    <span className={pool.stages.get(stage) > 0 ? 'font-medium' : 'text-muted-foreground'}>
                      {pool.stages.get(stage) || '-'}
                    </span>
                  </TableCell>
                ))}
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