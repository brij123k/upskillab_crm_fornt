// AttendanceAndPolicyPage.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="space-y-4 text-sm">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Attendance & Policy</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage employee attendance and leave policies</p>
        </div>
        <div className="flex items-center gap-2">
          {fetching && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Refreshing...
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
            disabled={fetching}
            className="h-8 text-xs"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', fetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="h-9">
          <TabsTrigger value="attendance" className="flex items-center gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            Attendance Calendar
          </TabsTrigger>
          <TabsTrigger value="leaves" className="flex items-center gap-1.5 text-xs">
            <Users className="w-3.5 h-3.5" />
            Leave Management
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <Card>
          <CardContent className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
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
  );
}