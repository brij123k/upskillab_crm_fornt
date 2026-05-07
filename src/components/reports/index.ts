
export { StageSummaryReport } from './StageSummaryReport';
export { EmployeeStagesReport } from './EmployeeStagesReport';
export { PoolStagesReport } from './PoolStagesReport';
export { PoolRevenueReport } from './PoolRevenueReport';
export { UtilizationReport } from './UtilizationReport';
export { ConsultantPerformanceReport } from './ConsultantPerformanceReport';
export { DailyUtilizationReport } from './DailyUtilizationReport';
export { SourceCampaignReport } from './SourceCampaignReport';
export { SourceCampaignRevenueReport } from './SourceCampaignRevenueReport';
// Shared utility functions that can be used across reports
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export const formatTime = (seconds: number) => {
  if (!seconds) return '0 min';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
};