import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  PieChart,
  Users,
  PhoneCall,
  BarChart3,
  IndianRupee,
  Building2,
  Calendar,
  Award,
  FileText
} from 'lucide-react';
import { hasPermission } from '@/utils/permissions';

// Import all report components
import {
  StageSummaryReport,
  EmployeeStagesReport,
  PoolStagesReport,
  PoolRevenueReport,
  UtilizationReport,
  ConsultantPerformanceReport,
  DailyUtilizationReport,
  SourceCampaignReport,
  SourceCampaignRevenueReport,
  SourceCampaignComparisonReport,
  SalarySheetReport,
  RevenueTargetReport,
  StateWiseReport,
  StateWiseEmployeeReport
} from '@/components/reports';

/* -------------------------------------------------------------------------- */
/*                                Report Config                                */
/* -------------------------------------------------------------------------- */
const REPORTS = [
  { id: 'stage-summary',               name: 'Stages',              icon: PieChart,      component: StageSummaryReport },
  { id: 'employee-stages',             name: 'Employees',           icon: Users,         component: EmployeeStagesReport },
  { id: 'pool-stages',                 name: 'Pools',               icon: Building2,     component: PoolStagesReport },
  { id: 'pool-revenue',                name: 'Revenue',             icon: IndianRupee,   component: PoolRevenueReport },
  { id: 'revenue-target-report',       name: 'Revenue Target',      icon: IndianRupee,   component: RevenueTargetReport },
  { id: 'utilization',                 name: 'Utilization',         icon: PhoneCall,     component: UtilizationReport },
  { id: 'consultant-performance',      name: 'Consultants',         icon: Award,         component: ConsultantPerformanceReport },
  { id: 'daily-utilization',           name: 'Daily Calls',         icon: Calendar,      component: DailyUtilizationReport },
  { id: 'source-campaign',             name: 'Source Campaign',     icon: BarChart3,    component: SourceCampaignReport },
  { id: 'source-campaign-revenue',     name: 'Revenue by Source',   icon: IndianRupee,   component: SourceCampaignRevenueReport },
  { id: 'salary-sheet',                name: 'Salary Sheet',        icon: IndianRupee,   component: SalarySheetReport,       permission: { module: 'reports', action: 'salary_sheet' } },
  { id: 'source-campaign-comparison',  name: 'Campaign Comparison', icon: BarChart3,    component: SourceCampaignComparisonReport },
  { id: 'state-wise',  name: 'state-compaign', icon: BarChart3,    component: StateWiseReport },
  { id: 'state-wise-employee', name: 'State Employees', icon: Users, component: StateWiseEmployeeReport },
];

export function ReportsPage() {
  const permissions = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('permissions') || '[]');
    } catch {
      return [];
    }
  }, []);

  // Filter reports based on user permissions
  const visibleReports = useMemo(() => {
    return REPORTS.filter((report) => {
      if (!report.permission) return true;
      return hasPermission(permissions, report.permission.module, report.permission.action);
    });
  }, [permissions]);

  // Set the first visible report as default
  const [activeReport, setActiveReport] = useState(() => visibleReports[0]?.id || REPORTS[0].id);

  // Ensure active report is still visible when permissions change
  useMemo(() => {
    if (visibleReports.length && !visibleReports.some(r => r.id === activeReport)) {
      setActiveReport(visibleReports[0].id);
    }
  }, [visibleReports, activeReport]);

  const CurrentComponent = visibleReports.find(r => r.id === activeReport)?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Reports</h1>
          <p className="text-slate-500 mt-1">Analytics & performance metrics</p>
        </div>

        {/* Tab bar – same design as Users page */}
        <div className="border-b border-slate-200">
          <div className="flex flex-wrap gap-2 pb-2">
            {visibleReports.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                  activeReport === tab.id
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Report Content */}
        <Card className="border-0 shadow-sm overflow-hidden bg-white">
          <div className="p-5">
            {CurrentComponent ? (
              <CurrentComponent />
            ) : (
              <div className="text-center py-16 text-slate-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Select a report to view its data.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}