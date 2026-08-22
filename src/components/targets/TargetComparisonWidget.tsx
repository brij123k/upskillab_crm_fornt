import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { useNavigate } from 'react-router-dom';
import { hasPermission } from '@/utils/permissions';

const METRICS = [
  { value: 'calls', label: 'Calls' },
  { value: 'meets', label: 'Meets' },
  { value: 'pcatDone', label: 'PCAT Done' },
  { value: 'registrationDone', label: 'Registration Done' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'tasks', label: 'Tasks' },
];

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

interface TargetComparisonWidgetProps {
  managePath?: string;
}

export function TargetComparisonWidget({ managePath = '/bd/targets' }: TargetComparisonWidgetProps) {
  const navigate = useNavigate();
  const [month, setMonth] = useState(currentMonth());
  const [metric, setMetric] = useState('calls');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getDataHandlerWithToken(
          ApiConfig.getTargetCompareMy,
          { month, metric },
          null,
          true,
        );
        if (mounted) {
          setData(response?.data || response || null);
        }
      } catch (error) {
        if (mounted) setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [month, metric]);
 const permissions = JSON.parse(
    localStorage.getItem("permissions") || "[]"
  );
  const summaryMetrics = data?.summary?.metrics || [];
  const selectedSummary = summaryMetrics.find((item: any) => item.metric === metric);
  const chartRows = useMemo(() => {
    if (!data?.chart?.labels?.length) return [];
    return data.chart.labels.map((label: string, index: number) => ({
      day: index + 1,
      label,
      target: data.chart.target?.[index] ?? 0,
      achieved: data.chart.achieved?.[index] ?? 0,
    }));
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              My Target
            </CardTitle>
            <p className="text-xs text-muted-foreground">Current month target vs achieved</p>
          </div>
         {hasPermission(permissions, 'targets', 'read') && (
            <Button variant="outline" size="sm" onClick={() => navigate(managePath)}>
            Open Targets
          </Button>
         ) }
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="w-full sm:w-40">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger>
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                {METRICS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading target comparison...
          </div>
        ) : selectedSummary ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Target</p>
                <p className="text-lg font-semibold">{selectedSummary.target}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Achieved</p>
                <p className="text-lg font-semibold">{selectedSummary.achieved}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="text-lg font-semibold">{selectedSummary.remaining}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Days Left</p>
                <p className="text-lg font-semibold">{data?.daysLeft ?? 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Progress value={selectedSummary.percentage || 0} className="h-2" />
              <Badge variant="secondary">{selectedSummary.percentage || 0}%</Badge>
            </div>

            <div className="h-56 rounded-xl border p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartRows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="target" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="achieved" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {summaryMetrics.slice(0, 4).map((item: any) => (
                <div key={item.metric} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium capitalize">{item.metric}</p>
                    <Badge variant="outline">{item.percentage || 0}%</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.achieved} / {item.target}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No target has been configured for this month yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
