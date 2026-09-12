import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  RefreshCw,
  Download,
  Filter,
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Layers,
  Users,
  X,
  Mail,
  Phone,
  User as UserIcon,
  Tag,
  List,
  LayoutGrid,
  UserCog,
} from 'lucide-react';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────

interface StageItem {
  stage: string;
  count: number;
}

interface PoolData {
  poolId: string;
  poolName: string;
  totalLead: number;
  stages: StageItem[];
  team?: boolean;
  teamSize?: number;
}

interface ReportData {
  poolWiseData: PoolData[];
  totalLeads: number;
  totalPools: number;
  filters?: {
    level?: string | number | null;
    team?: boolean | null;
    dateFilter?: string | null;
    fromDate?: string | null;
    toDate?: string | null;
  };
}

interface LevelType {
  _id: string;
  name: string;
}

interface LeadDetail {
  leadId: string;
  name: string;
  email?: string;
  phone?: string;
  stage?: {
    name: string;
  };
  [key: string]: any;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalLeads: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface StageDetailResponse {
  stageName: string;
  team?: boolean;
  totalLeads: number;
  pagination: PaginationInfo;
  leads: LeadDetail[];
}

// ───────────────────────────────────────────────────────────────────────────────
// Constants
// ───────────────────────────────────────────────────────────────────────────────

const dateFilterOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

const POOLS_PER_PAGE = 6;
const MODAL_LEADS_PER_PAGE = 10;

// ───────────────────────────────────────────────────────────────────────────────
// Sub-component: Stage Detail Modal
// ───────────────────────────────────────────────────────────────────────────────

interface StageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StageDetailResponse | null;
  loading: boolean;
  poolName: string;
  stageName: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  currentPage: number;
  pageLimit: number;
}

function StageDetailModal({
  isOpen,
  onClose,
  data,
  loading,
  poolName,
  stageName,
  onPageChange,
  onLimitChange,
  currentPage,
  pageLimit,
}: StageDetailModalProps) {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  if (!isOpen) return null;

  const pagination = data?.pagination;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Tag className="w-5 h-5 text-orange-500" />
              {stageName} Leads
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Pool: <span className="font-medium text-slate-700">{poolName}</span>
              {data && (
                <span className="ml-3">
                  Total: <span className="font-semibold text-orange-600">{data.totalLeads}</span> leads
                </span>
              )}
              {data?.team && (
                <span className="ml-3 text-orange-600">
                  <UserCog className="w-3.5 h-3.5 inline mr-1" />
                  Team View
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
          
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full hover:bg-slate-100 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
              <p className="ml-3 text-sm text-slate-500">Loading leads...</p>
            </div>
          ) : !data || data.leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No leads found</p>
              <p className="text-xs text-slate-400 mt-1">
                No leads in {stageName} stage for this pool
              </p>
            </div>
          ) :(
            // Table View
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-600">#</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Lead ID</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Name</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Email</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Phone</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Stage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.leads.map((lead, index) => {
                    const globalIndex = ((currentPage - 1) * pageLimit) + index + 1;
                    return (
                      <TableRow key={lead.leadId || index} className="hover:bg-slate-50/60">
                        <TableCell className="text-xs text-slate-500">{globalIndex}</TableCell>
                        <TableCell className="text-xs font-mono text-slate-600">
                          {lead.leadId || '-'}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-800">
                          {lead.name || 'Unnamed Lead'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {lead.email || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {lead.phone || '-'}
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            {lead.stage?.name || stageName}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500">
              Showing {data?.leads.length || 0} of {data?.totalLeads || 0} leads
            </span>
            
            {/* Limit selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Show:</span>
              <Select
                value={pageLimit.toString()}
                onValueChange={(value) => onLimitChange(parseInt(value))}
              >
                <SelectTrigger className="h-7 w-[70px] text-xs rounded-lg">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map(limit => (
                    <SelectItem key={limit} value={limit.toString()} className="text-xs">
                      {limit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={!pagination?.hasPreviousPage || loading}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-slate-500 min-w-[60px] text-center">
              Page {currentPage} of {pagination?.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!pagination?.hasNextPage || loading}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-lg ml-2"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Main Component
// ───────────────────────────────────────────────────────────────────────────────

export function PoolStagesReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [allStages, setAllStages] = useState<string[]>([]);
  const [loadingStages, setLoadingStages] = useState(true);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);

  // Level filter
  const [levels, setLevels] = useState<LevelType[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('1');
  const [levelInput, setLevelInput] = useState<string>('1');

  // Team filter (checkbox)
  const [showTeamOnly, setShowTeamOnly] = useState<boolean>(false);

  // Date filter
  const [dateFilter, setDateFilter] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pool search (client-side)
  const [poolSearch, setPoolSearch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);

  // ─── Stage Detail Modal State ────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<StageDetailResponse | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedPool, setSelectedPool] = useState<{ id: string; name: string } | null>(null);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [loadingStageDetail, setLoadingStageDetail] = useState<string | null>(null);
  
  // Modal pagination state
  const [modalPage, setModalPage] = useState(1);
  const [modalLimit, setModalLimit] = useState(MODAL_LEADS_PER_PAGE);
  const [modalPoolId, setModalPoolId] = useState<string>('');

  // Fetch levels for radio buttons
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await getDataHandlerWithToken('getAllLevels', null, null);
        if (response) {
          setLevels(response);
          if (response.length > 0) {
            const firstLevelNumeric = extractLevelNumber(response[0].name);
            setSelectedLevel(firstLevelNumeric.toString());
            setLevelInput(firstLevelNumeric.toString());
          }
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to fetch levels', variant: 'destructive' });
      }
    };
    fetchLevels();
  }, []);

  // Helper to extract number from "L12"
  const extractLevelNumber = (levelName: string): number => {
    const match = levelName.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  };

  // Fetch stages for headers
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const response = await getDataHandlerWithToken(ApiConfig.getAllStages, null, null, true);
        const stagesData = response?.data || response || [];
        if (Array.isArray(stagesData) && stagesData.length) {
          const names = stagesData.map((s: any) => s.stageName || s.name);
          setAllStages(names);
        } else {
          setAllStages([]);
        }
      } catch (error) {
        setAllStages([]);
      } finally {
        setLoadingStages(false);
      }
    };
    fetchStages();
  }, []);

  // Fetch report data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      
      // Level parameter – send as integer
      params.level = parseInt(levelInput) || 1;

      // Team filter - send as boolean when checked
      if (showTeamOnly) {
        params.team = true;
      }

      // Date filter
      if (dateFilter === 'custom') {
        if (!fromDate || !toDate) {
          setLoading(false);
          return;
        }
        params.fromDate = fromDate;
        params.toDate = toDate;
      } else {
        params.dateFilter = dateFilter;
      }

      const response = await getDataHandlerWithToken(
        ApiConfig.poolWiseStages,
        params,
        null,
        true
      );
      if (response) {
        setData({
          poolWiseData: response.data?.poolWiseData || response.poolWiseData || [],
          totalLeads: response.data?.totalLeads ?? response.totalLeads ?? 0,
          totalPools: response.data?.totalPools ?? response.totalPools ?? 0,
          filters: response.data?.filters || response.filters || {},
        });
      } else {
        setData(null);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to load pool stages', variant: 'destructive' });
      setData(null);
    } finally {
      setLoading(false);
      setCurrentPage(0);
    }
  }, [levelInput, showTeamOnly, dateFilter, fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [levelInput, showTeamOnly, dateFilter, fromDate, toDate, poolSearch]);

  // ─── Fetch Stage Detail ──────────────────────────────────────────────────
  const fetchStageDetail = useCallback(async (
    poolId: string,
    stageName: string,
    page: number = 1,
    limit: number = MODAL_LEADS_PER_PAGE
  ) => {
    const loadingKey = `${poolId}-${stageName}-${page}-${limit}`;
    if (loadingStageDetail === loadingKey) return;

    setLoadingStageDetail(loadingKey);
    setModalLoading(true);
    setModalOpen(true);
    setSelectedStage(stageName);
    setModalPoolId(poolId);
    setModalPage(page);
    setModalLimit(limit);

    try {
      const params: any = {};

      // Level parameter
      params.level = parseInt(levelInput) || 1;

      // Team filter
      if (showTeamOnly) {
        params.team = true;
      }

      // Date filter
      if (dateFilter === 'custom') {
        if (fromDate && toDate) {
          params.fromDate = fromDate;
          params.toDate = toDate;
        }
      } else {
        params.dateFilter = dateFilter;
      }

      // Stage and pagination params
      params.stageName = stageName;
      params.poolId = poolId;
      params.page = page;
      params.limit = limit;

      const response = await getDataHandlerWithToken(
        ApiConfig.poolWiseStagesleads,
        params,
        null,
        true
      );

      if (response) {
        const stageData = response.data || response;
        setModalData({
          stageName: stageData.stageName || stageName,
          team: stageData.team || false,
          totalLeads: stageData.totalLeads || 0,
          pagination: stageData.pagination || {
            page: page,
            limit: limit,
            totalLeads: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          leads: stageData.leads || [],
        });

        // Find pool name
        const pool = data?.poolWiseData?.find(p => p.poolId === poolId);
        setSelectedPool({ id: poolId, name: pool?.poolName || poolId });
      } else {
        setModalData(null);
        toast({
          title: 'Error',
          description: 'Failed to load stage details',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load stage details',
        variant: 'destructive',
      });
      setModalData(null);
    } finally {
      setModalLoading(false);
      setLoadingStageDetail(null);
    }
  }, [levelInput, showTeamOnly, dateFilter, fromDate, toDate, data, loadingStageDetail]);

  // ─── Handle Stage Click ──────────────────────────────────────────────────
  const handleStageClick = useCallback((poolId: string, stageName: string) => {
    fetchStageDetail(poolId, stageName, 1, modalLimit);
  }, [fetchStageDetail, modalLimit]);

  // ─── Handle Modal Page Change ────────────────────────────────────────────
  const handleModalPageChange = useCallback((newPage: number) => {
    if (modalPoolId && selectedStage) {
      fetchStageDetail(modalPoolId, selectedStage, newPage, modalLimit);
    }
  }, [modalPoolId, selectedStage, modalLimit, fetchStageDetail]);

  // ─── Handle Modal Limit Change ───────────────────────────────────────────
  const handleModalLimitChange = useCallback((newLimit: number) => {
    setModalLimit(newLimit);
    if (modalPoolId && selectedStage) {
      fetchStageDetail(modalPoolId, selectedStage, 1, newLimit);
    }
  }, [modalPoolId, selectedStage, fetchStageDetail]);

  // ─── Close Modal ─────────────────────────────────────────────────────────
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalData(null);
    setSelectedPool(null);
    setSelectedStage('');
    setModalLoading(false);
    setModalPage(1);
  }, []);

  // Export CSV
  const handleExport = () => {
    if (!data || !data.poolWiseData.length) {
      toast({ title: 'No data to export' });
      return;
    }
    const pools = data.poolWiseData;
    const stageSet = new Set<string>();
    pools.forEach(p => p.stages.forEach(s => stageSet.add(s.stage)));
    const stageList = Array.from(stageSet);
    const headers = ['Pool Name', 'Total Lead', ...stageList, 'Team Size'];
    const rows = pools.map(pool => {
      const stageMap = new Map(pool.stages.map(s => [s.stage, s.count]));
      return [
        pool.poolName, 
        pool.totalLead, 
        ...stageList.map(s => stageMap.get(s) || 0),
        pool.teamSize || ''
      ];
    });
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pool_stages_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported!' });
  };

  // Client-side pool filtering
  const filteredPools = data?.poolWiseData
    ? data.poolWiseData.filter(p =>
        p.poolName.toLowerCase().includes(poolSearch.toLowerCase())
      )
    : [];

  // Pagination
  const totalPages = Math.ceil(filteredPools.length / POOLS_PER_PAGE);
  const paginatedPools = filteredPools.slice(
    currentPage * POOLS_PER_PAGE,
    (currentPage + 1) * POOLS_PER_PAGE
  );

  // Build stage maps for display
  const poolStageMap = paginatedPools.map(pool => {
    const map = new Map<string, number>();
    pool.stages.forEach(s => map.set(s.stage, s.count));
    return { ...pool, stageMap: map };
  });

  // Relevant stages (present in current filtered data)
  const relevantStages = (() => {
    const stageSet = new Set<string>();
    poolStageMap.forEach(p => p.stageMap.forEach((_, key) => stageSet.add(key)));
    const ordered = allStages.filter(s => stageSet.has(s));
    const extra = Array.from(stageSet).filter(s => !ordered.includes(s));
    return [...ordered, ...extra];
  })();

  // Check if team mode is active
  const isTeamMode = data?.filters?.team === true || showTeamOnly;

  // Active filters check
  const defaultLevel = levels.length > 0 ? extractLevelNumber(levels[0].name).toString() : '1';
  const hasActiveFilters =
    levelInput !== defaultLevel ||
    showTeamOnly ||
    dateFilter !== 'today' ||
    (dateFilter === 'custom' && (fromDate || toDate)) ||
    poolSearch !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Pool Stages</h3>
          <p className="text-sm text-slate-500">Lead distribution across pools</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="rounded-xl border-slate-200"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
            )}
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={!data || loading}
            className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-1 h-8 text-xs rounded-xl"
        >
          <Filter className="w-3 h-3" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 w-1.5 h-1.5 rounded-full bg-orange-500" />
          )}
          {showFilters ? (
            <ChevronUp className="w-3 h-3 ml-1" />
          ) : (
            <ChevronDown className="w-3 h-3 ml-1" />
          )}
        </Button>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 w-full">
            {/* Level Radio Buttons */}
            {levels.length > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">Level</Label>
                <div className="flex flex-wrap gap-1">
                  {levels.map(lvl => (
                    <button
                      key={lvl._id}
                      onClick={() => {
                        const num = extractLevelNumber(lvl.name);
                        setSelectedLevel(num.toString());
                        setLevelInput(num.toString());
                      }}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-lg border transition-all",
                        selectedLevel === extractLevelNumber(lvl.name).toString()
                          ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {lvl.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Team Checkbox */}
            <div className="flex items-center gap-2 ml-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="team-filter-pool"
                  checked={showTeamOnly}
                  onCheckedChange={(checked) => {
                    setShowTeamOnly(checked === true);
                  }}
                  className="h-4 w-4 rounded border-slate-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <Label
                  htmlFor="team-filter-pool"
                  className="text-xs font-medium text-slate-600 cursor-pointer"
                >
                  Team
                </Label>
              </div>
            </div>

            {/* Date filter */}
            <div className="w-[130px]">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-8 text-xs rounded-xl">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {dateFilterOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {dateFilter === 'custom' && (
              <>
                <div className="relative w-[130px]">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="relative w-[130px]">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs border rounded-md bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </>
            )}

            {/* Pool search */}
            <div className="relative w-48">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <Input
                placeholder="Search pool..."
                value={poolSearch}
                onChange={(e) => {
                  setPoolSearch(e.target.value);
                  setCurrentPage(0);
                }}
                className="pl-7 h-8 text-xs rounded-xl border-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter Summary */}
      {!loading && data && data.poolWiseData.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
          <span>
            Level:{' '}
            <span className="font-medium text-slate-700">
              {levels.find(l => extractLevelNumber(l.name).toString() === selectedLevel)?.name || `Level ${selectedLevel}`}
            </span>
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>
            Team:{' '}
            <span className="font-medium text-slate-700">
              {isTeamMode ? (
                <span className="flex items-center gap-1 text-orange-600">
                  <Users className="w-3 h-3" />
                  Enabled
                </span>
              ) : (
                'All'
              )}
            </span>
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>
            Date:{' '}
            <span className="font-medium text-slate-700">
              {dateFilterOptions.find(o => o.value === dateFilter)?.label || dateFilter}
            </span>
          </span>
          {dateFilter === 'custom' && fromDate && toDate && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>
                Range:{' '}
                <span className="font-medium text-slate-700">
                  {fromDate} to {toDate}
                </span>
              </span>
            </>
          )}
          {poolSearch && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>
                Search:{' '}
                <span className="font-medium text-slate-700">"{poolSearch}"</span>
              </span>
            </>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
          <p className="ml-2 text-sm text-slate-500">Loading pool data...</p>
        </div>
      ) : !data || !data.poolWiseData.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No pool data found</p>
          <p className="text-xs text-slate-400 mt-1">Adjust level or filters</p>
        </div>
      ) : filteredPools.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">No matching pools</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search term</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary row */}
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="font-medium text-slate-700">
              {filteredPools.length} pools
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>
              Total leads:{' '}
              <span className="font-semibold text-slate-800">
                {filteredPools.reduce((sum, p) => sum + p.totalLead, 0)}
              </span>
            </span>
            {isTeamMode && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1 text-orange-600">
                  <Users className="w-3.5 h-3.5" />
                  <span className="font-medium">Team View</span>
                </span>
              </>
            )}
          </div>

          {/* Table */}
          {loadingStages ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
              <p className="ml-2 text-sm text-slate-500">Loading stage headers...</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase sticky left-0 bg-slate-50 z-10 min-w-[140px]">
                      Lead Stage
                    </TableHead>
                    {poolStageMap.map(pool => (
                      <TableHead key={pool.poolId} className="text-xs text-left min-w-[110px] py-3">
                        <div className="font-semibold text-slate-800">{pool.poolName}</div>
                        <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                          Total: {pool.totalLead}
                        </div>
                        {pool.teamSize && pool.teamSize > 1 && (
                          <div className="text-[9px] font-normal text-orange-500 mt-0.5">
                            Team: {pool.teamSize}
                          </div>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relevantStages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={poolStageMap.length + 1} className="text-center py-8 text-sm text-slate-500">
                        No stage data for the selected level / date range.
                      </TableCell>
                    </TableRow>
                  ) : (
                    relevantStages.map(stageName => (
                      <TableRow
                        key={stageName}
                        className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                      >
                        <TableCell className="text-xs font-medium text-slate-700 sticky left-0 bg-white border-r z-10 py-3">
                          {stageName}
                        </TableCell>
                        {poolStageMap.map(pool => {
                          const count = pool.stageMap.get(stageName) || 0;
                          const total = pool.totalLead || 1;
                          const pct = ((count / total) * 100).toFixed(1);
                          const isLoadingDetail = loadingStageDetail === `${pool.poolId}-${stageName}`;
                          
                          return (
                            <TableCell key={pool.poolId} className="text-xs text-center py-3 px-auto">
                              <button
                                onClick={() => count > 0 && handleStageClick(pool.poolId, stageName)}
                                disabled={count === 0 || isLoadingDetail}
                                className={cn(
                                  "flex flex-col items-center transition-all",
                                  count > 0 && "hover:scale-110 cursor-pointer",
                                  count === 0 && "cursor-default opacity-50",
                                  isLoadingDetail && "opacity-50 cursor-wait"
                                )}
                                title={count > 0 ? `Click to view ${stageName} leads` : 'No leads'}
                              >
                                {isLoadingDetail ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-orange-500" />
                                ) : (
                                  <>
                                    <span
                                      className={cn(
                                        'font-medium',
                                        count > 0 ? 'text-slate-800 hover:text-orange-600' : 'text-slate-300'
                                      )}
                                    >
                                      {count || '-'}
                                    </span>
                                    {count > 0 && (
                                      <span className="text-[10px] text-slate-400 mt-0.5">
                                        {pct}%
                                      </span>
                                    )}
                                  </>
                                )}
                              </button>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500">
                Page {currentPage + 1} of {totalPages}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stage Detail Modal */}
      <StageDetailModal
        isOpen={modalOpen}
        onClose={closeModal}
        data={modalData}
        loading={modalLoading}
        poolName={selectedPool?.name || ''}
        stageName={selectedStage}
        onPageChange={handleModalPageChange}
        onLimitChange={handleModalLimitChange}
        currentPage={modalPage}
        pageLimit={modalLimit}
      />
    </div>
  );
}