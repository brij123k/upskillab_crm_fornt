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
  // { id: 'employee-stages',             name: 'Employees',           icon: Users,         component: EmployeeStagesReport,permission: { module: 'reports', action: 'employee-stages' }  },
  { id: 'employee-stages',             name: 'Employees',           icon: Users,         component: EmployeeStagesReport},
  { id: 'pool-stages',                 name: 'Pools',               icon: Building2,     component: PoolStagesReport },
  { id: 'pool-revenue',                name: 'Revenue',             icon: IndianRupee,   component: PoolRevenueReport },
  { id: 'revenue-target-report',       name: 'Employee Tgt vs Ach',      icon: IndianRupee,   component: RevenueTargetReport,permission: { module: 'reports', action: 'revenue-target-report' } },
  { id: 'utilization',                 name: 'Employee Efforts',         icon: PhoneCall,     component: UtilizationReport,permission: { module: 'reports', action: 'utilization' }},
  { id: 'consultant-performance',      name: 'Employee Performance',         icon: Award,         component: ConsultantPerformanceReport,permission: { module: 'reports', action: 'consultant-performance' }  },
  { id: 'daily-utilization',           name: 'Emp Inputs',         icon: Calendar,      component: DailyUtilizationReport },
  { id: 'source-campaign',             name: 'Campaign- Lead Stage',     icon: BarChart3,    component: SourceCampaignReport },
  { id: 'source-campaign-revenue',     name: 'Campaign- Performance',   icon: IndianRupee,   component: SourceCampaignRevenueReport },
  { id: 'salary-sheet',                name: 'Salary Sheet',        icon: IndianRupee,   component: SalarySheetReport,       permission: { module: 'reports', action: 'salary_sheet' } },
  { id: 'state-wise',  name: 'State Campaign Performance Report', icon: BarChart3,    component: StateWiseReport,permission: { module: 'reports', action: 'state-wise' } },
  { id: 'state-wise-employee', name: 'Employee Performance – State-wise', icon: Users, component: StateWiseEmployeeReport,permission: { module: 'reports', action: 'state-wise-employee' } },
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

  const current = visibleReports.find(r => r.id === activeReport);
  const CurrentComponent = current?.component;

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="reports-shell">
      <div className="max-w-[1600px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-[32px] leading-tight font-bold text-slate-900 tracking-tight">Reports</h1>
            <p className="text-slate-500 mt-1 text-[15px]">Analytics &amp; performance insights</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-white border border-slate-200/80 text-sm text-slate-700 shadow-sm">
              <Calendar className="w-4 h-4 text-slate-500" />
              {today}
            </div>
            {current && (
              <div className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-orange-50 border border-orange-100 text-sm font-medium text-orange-700">
                <current.icon className="w-4 h-4" />
                {current.name}
              </div>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2.5">
          {visibleReports.map((tab) => {
            const isActive = activeReport === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 h-11 px-5 text-sm font-medium rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-b from-orange-500 to-orange-600 text-white shadow-[0_6px_16px_-6px_rgba(249,115,22,0.7)]"
                    : "bg-white text-slate-700 border border-slate-200/80 shadow-sm hover:border-orange-200 hover:text-orange-600 hover:bg-orange-50/40"
                )}
              >
                <tab.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-500")} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Report Content */}
        <Card className="rounded-2xl border border-slate-200/70 shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden bg-white">
          <div className="p-5 lg:p-6">
            {CurrentComponent ? (
              <CurrentComponent />
            ) : (
              <div className="text-center py-20 text-slate-400">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-50 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-orange-400" />
                </div>
                <p className="text-sm">Select a report to view its data.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}