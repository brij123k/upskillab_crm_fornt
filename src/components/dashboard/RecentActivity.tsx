import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  action: string;
  user: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface RecentActivityProps {
  activities: Activity[];
  title?: string;
}

export function RecentActivity({ activities, title = 'Recent Activity' }: RecentActivityProps) {
  const typeStyles = {
    info: 'bg-info/10 border-info',
    success: 'bg-success/10 border-success',
    warning: 'bg-warning/10 border-warning',
    error: 'bg-destructive/10 border-destructive',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <div className={cn(
                "w-2 h-2 mt-2 rounded-full border-2",
                typeStyles[activity.type]
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{activity.action}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{activity.user}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
