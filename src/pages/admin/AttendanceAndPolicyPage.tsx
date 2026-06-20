// AttendanceAndPolicyPage.tsx – redesigned to match CallLogs style
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getDataHandlerWithToken, postDataHandlerWithToken, patchTokenDataHandler } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { cn } from '@/lib/utils';
import { AttendanceCalendarTab } from '@/components/AttendanceCalendarTab';
import { LeaveManagementTab } from '@/components/LeaveManagementTab';

export function AttendanceAndPolicyPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves'>('attendance');
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
        getDataHandlerWithToken(ApiConfig.getLeavePolicies, null, null, true),
        getDataHandlerWithToken('getAllRoles', null, null),
      ]);

      setEmployees(Array.isArray(empData) ? empData : []);
      setAttendance(Array.isArray(attData) ? attData : []);
      setLeaves(Array.isArray(leaveData) ? leaveData : []);
      setLeavePolicies(Array.isArray(policiesData) ? policiesData : []);
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
      await postDataHandlerWithToken(ApiConfig.getLeavePolicies, policyData, true);
      toast({
        title: 'Success',
        description: 'Leave policy created successfully',
      });
      fetchAllData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create leave policy',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateLeavePolicy = async (policyId: string, policyData: any) => {
    try {
      const endpoint = ApiConfig.getLeavePolicyById(policyId);
      await patchTokenDataHandler(endpoint, policyData, true);
      toast({
        title: 'Success',
        description: 'Leave policy updated successfully',
      });
      fetchAllData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update leave policy',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Attendance & Policy</h1>
            <p className="text-slate-500 mt-1">Manage employee attendance and leave policies</p>
          </div>
          <Button
            variant="outline"
            onClick={fetchAllData}
            disabled={fetching}
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl gap-2"
          >
            <RefreshCw className={cn('w-4 h-4', fetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="h-9 bg-slate-100 rounded-lg">
            <TabsTrigger value="attendance" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Attendance Calendar
            </TabsTrigger>
            <TabsTrigger value="leaves" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Leave Management
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            <p className="ml-3 text-slate-500">Loading data...</p>
          </div>
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