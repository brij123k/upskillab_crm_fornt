// AttendanceAndPolicyPage.tsx – Updated with new AttendanceCalendarTab
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, RefreshCw, Loader2, CalendarDays } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getDataHandlerWithToken, postDataHandlerWithToken, patchTokenDataHandler } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { cn } from '@/lib/utils';
import { AttendanceCalendarTab } from '@/components/AttendanceCalendarTab';
import { LeaveManagementTab } from '@/components/LeaveManagementTab';
import { HolidayCalendarTab } from '@/components/HolidayCalendarTab';
import { Card } from '@/components/ui/card';

export function AttendanceAndPolicyPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves' | 'holidays'>('attendance');
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leavePolicies, setLeavePolicies] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Attendance & Policy</h1>
            <p className="text-slate-500 mt-1">Manage attendance tracking, leave policies, and holiday schedules</p>
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
          <TabsList className="h-11 bg-slate-100/80 rounded-xl p-1 backdrop-blur-sm w-full sm:w-auto overflow-x-auto">
            <TabsTrigger 
              value="attendance" 
              className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-800 rounded-lg px-4 gap-2 whitespace-nowrap"
            >
              <Calendar className="w-4 h-4" />
              Attendance Calendar
            </TabsTrigger>
            <TabsTrigger 
              value="leaves" 
              className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-800 rounded-lg px-4 gap-2 whitespace-nowrap"
            >
              <Users className="w-4 h-4" />
              Leave Management
              {pendingLeaves > 0 && (
                <span className="ml-1 bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  {pendingLeaves}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="holidays" 
              className="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-800 rounded-lg px-4 gap-2 whitespace-nowrap"
            >
              <CalendarDays className="w-4 h-4" />
              Holiday Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        {loading ? (
          <Card className="bg-white border-0 shadow-sm">
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-400" />
              <p className="mt-3 text-slate-500">Loading attendance data...</p>
            </div>
          </Card>
        ) : (
          <>
            {activeTab === 'attendance' && (
              <AttendanceCalendarTab
                employees={employees}
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

            {activeTab === 'holidays' && (
              <HolidayCalendarTab
                onRefresh={fetchAllData}
                fetching={fetching}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}