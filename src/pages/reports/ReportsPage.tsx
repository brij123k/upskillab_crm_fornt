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
// Every report has its own permission (module "reports", action = report id).
// Admins (super admin / "*") see all of them. Grant these from Roles → Permissions.
const REPORTS = [
  { id: 'stage-summary',           name: 'Stages',                            icon: PieChart,    component: StageSummaryReport,          permission: { module: 'reports', action: 'stage-summary' } },
  { id: 'employee-stages',         name: 'Employees',                         icon: Users,       component: EmployeeStagesReport,        permission: { module: 'reports', action: 'employee-stages' } },
  { id: 'pool-stages',             name: 'Pools',                             icon: Building2,   component: PoolStagesReport,            permission: { module: 'reports', action: 'pool-stages' } },
  { id: 'pool-revenue',            name: 'Revenue',                           icon: IndianRupee, component: PoolRevenueReport,           permission: { module: 'reports', action: 'pool-revenue' } },
  { id: 'revenue-target-report',   name: 'Employee Tgt vs Ach',               icon: IndianRupee, component: RevenueTargetReport,         permission: { module: 'reports', action: 'revenue-target-report' } },
  { id: 'utilization',             name: 'Employee Efforts',                  icon: PhoneCall,   component: UtilizationReport,           permission: { module: 'reports', action: 'utilization' } },
  { id: 'consultant-performance',  name: 'Employee Performance',              icon: Award,       component: ConsultantPerformanceReport, permission: { module: 'reports', action: 'consultant-performance' } },
  { id: 'daily-utilization',       name: 'Emp Inputs',                        icon: Calendar,    component: DailyUtilizationReport,      permission: { module: 'reports', action: 'daily-utilization' } },
  { id: 'source-campaign',         name: 'Campaign- Lead Stage',              icon: BarChart3,   component: SourceCampaignReport,        permission: { module: 'reports', action: 'source-campaign' } },
  { id: 'source-campaign-revenue', name: 'Campaign- Performance',             icon: IndianRupee, component: SourceCampaignRevenueReport, permission: { module: 'reports', action: 'source-campaign-revenue' } },
  { id: 'salary-sheet',            name: 'Salary Sheet',                      icon: IndianRupee, component: SalarySheetReport,           permission: { module: 'reports', action: 'salary_sheet' } },
  { id: 'state-wise',              name: 'State Campaign Performance Report', icon: BarChart3,   component: StateWiseReport,             permission: { module: 'reports', action: 'state-wise' } },
  { id: 'state-wise-employee',     name: 'Employee Performance – State-wise', icon: Users,       component: StateWiseEmployeeReport,     permission: { module: 'reports', action: 'state-wise-employee' } },
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
  const noAccess = visibleReports.length === 0;
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

        {/* Header – breadcrumb style */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[26px] leading-tight tracking-tight">
              <span className="font-medium text-slate-500">Reports</span>
              {current && (
                <>
                  <span className="mx-2 font-normal text-slate-300">/</span>
                  <span className="font-bold text-slate-900">{current.name}</span>
                </>
              )}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Analytics &amp; performance insights</p>
          </div>
          <div className="inline-flex items-center gap-2 h-10 px-3.5 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-500" />
            {today}
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
                  "inline-flex items-center gap-2 h-10 px-4 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-orange-200 hover:text-orange-600"
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
            {noAccess ? (
              <div className="text-center py-20 text-slate-500">
                <p className="text-sm font-medium">You don't have access to any report yet.</p>
                <p className="text-xs text-slate-400 mt-1">Ask an admin to enable reports for your role.</p>
              </div>
            ) : CurrentComponent ? (
              <CurrentComponent key={activeReport} />
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