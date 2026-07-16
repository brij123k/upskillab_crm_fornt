// AttendanceAndPolicyPage.tsx – redesigned to match professional admin style
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, RefreshCw, Loader2, Clock, CheckCircle2, AlertCircle, Building2, Shield, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getDataHandlerWithToken, postDataHandlerWithToken, patchTokenDataHandler } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { cn } from '@/lib/utils';
import { AttendanceCalendarTab } from '@/components/AttendanceCalendarTab';
import { LeaveManagementTab } from '@/components/LeaveManagementTab';
import { Card } from '@/components/ui/card';

export function AttendanceAndPolicyPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves'>('attendance');
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leavePolicies, setLeavePolicies] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAllData = async () => {
    try {
      setFetching(true);
      const [empData, attData, leaveData, policiesData, rolesData] = await Promise.all([
        getDataHandlerWithToken('getAllProfile', null, null),
        getDataHandlerWithToken(ApiConfig.getAttendance, null, null, true),
        getDataHandlerWithToken(ApiConfig.getLeaves, null, null, true),
        getDataHandlerWithToken(ApiConfig.leavePolicies, null, null, true),
        getDataHandlerWithToken('getAllRoles', null, null),
      ]);

      setEmployees(Array.isArray(empData) ? empData : []);
      setAttendance(Array.isArray(attData) ? attData : []);
      setLeaves(Array.isArray(leaveData) ? leaveData : []);
      setLeavePolicies(Array.isArray(policiesData.data) ? policiesData.data : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance and policy data',
        variant: 'destructive',
      });
      setLoading(false);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAddLeavePolicy = async (policyData: any) => {
    try {
      const response = await postDataHandlerWithToken(ApiConfig.leavePolicies, policyData, true);
      if (response?.success) {
        toast({
          title: 'Success',
          description: response.message || 'Leave policy created successfully',
        });
        await fetchAllData();
        return response;
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create leave policy',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleUpdateLeavePolicy = async (policyId: string, policyData: any) => {
    try {
      const endpoint = ApiConfig.leavePolicyById(policyId);
      const response = await patchTokenDataHandler(endpoint, policyData, true);
      if (response?.success) {
        toast({
          title: 'Success',
          description: response.message || 'Leave policy updated successfully',
        });
        await fetchAllData();
        return response;
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update leave policy',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/80 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Attendance & Policy
              </span>
            </h1>
            
          </div>
          <Button
            variant="outline"
            onClick={fetchAllData}
            disabled={fetching}
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl gap-2 h-10 px-4 shadow-sm hover:shadow transition-all duration-200"
          >
            <RefreshCw className={cn('w-4 h-4', fetching && 'animate-spin')} />
            {fetching ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="h-11 bg-slate-100/80 rounded-xl p-1 backdrop-blur-sm w-full sm:w-auto">
            <TabsTrigger 
              value="attendance" 
              className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-800 rounded-lg px-4 gap-2"
            >
              <Calendar className="w-4 h-4" />
              Attendance Calendar
            </TabsTrigger>
            <TabsTrigger 
              value="leaves" 
              className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-800 rounded-lg px-4 gap-2"
            >
              <Users className="w-4 h-4" />
              Leave Management
              {pendingLeaves > 0 && (
                <span className="ml-1 bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  {pendingLeaves}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        {loading ? (
          <Card className="bg-white border-0 shadow-sm">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-orange-400 animate-pulse" />
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">Loading attendance data...</p>
              <p className="text-xs text-slate-400 mt-1">Please wait while we fetch the latest information</p>
            </div>
          </Card>
        ) : (
          <>
            {activeTab === 'attendance' && (
              <AttendanceCalendarTab
                employees={employees}
                attendance={attendance}
                leaves={leaves}
                onRefresh={fetchAllData}
                fetching={fetching}
              />
            )}

            {activeTab === 'leaves' && (
              <LeaveManagementTab
                leaves={leaves}
                leavePolicies={leavePolicies}
                roles={roles}
                employees={employees}
                onRefresh={fetchAllData}
                fetching={fetching}
                onAddPolicy={handleAddLeavePolicy}
                onUpdatePolicy={handleUpdateLeavePolicy}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Local Badge component since it might not be exported
const Badge = ({ className, children, variant, ...props }: any) => {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  const variantStyles = {
    outline: "border border-slate-200 text-slate-600 bg-transparent",
    default: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={cn(baseStyles, variantStyles[variant as keyof typeof variantStyles] || variantStyles.default, className)} {...props}>
      {children}
    </span>
  );
};