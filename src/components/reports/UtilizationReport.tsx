import { Phone, Timer, CheckCircle } from 'lucide-react';

interface UtilizationReportProps {
  data: any;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const formatTime = (seconds: number) => {
  if (!seconds) return '0m';
  const mins = Math.floor(seconds / 60);
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
};

export function UtilizationReport({ data, searchTerm = '', onSearchChange }: UtilizationReportProps) {
  if (!data?.employees) return null;
  
  const employees = searchTerm 
    ? data.employees.filter((e: any) => e.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()))
    : data.employees;
  
  const totals = employees.reduce((acc: any, e: any) => ({
    dials: acc.dials + (e.totalDial || 0),
    talkTime: acc.talkTime + (e.answeredTalkTime || 0),
    admissions: acc.admissions + (e.admissionDone || 0)
  }), { dials: 0, talkTime: 0, admissions: 0 });
  
  return (
    <div className="space-y-4">
      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 bg-muted/30 rounded-lg">
          <Phone className="h-4 w-4 mx-auto text-muted-foreground" />
          <p className="text-lg font-bold">{totals.dials}</p>
          <p className="text-[10px] text-muted-foreground">Dials</p>
        </div>
        <div className="text-center p-2 bg-muted/30 rounded-lg">
          <Timer className="h-4 w-4 mx-auto text-muted-foreground" />
          <p className="text-lg font-bold">{formatTime(totals.talkTime)}</p>
          <p className="text-[10px] text-muted-foreground">Talk Time</p>
        </div>
        <div className="text-center p-2 bg-muted/30 rounded-lg">
          <CheckCircle className="h-4 w-4 mx-auto text-muted-foreground" />
          <p className="text-lg font-bold">{totals.admissions}</p>
          <p className="text-[10px] text-muted-foreground">Admissions</p>
        </div>
      </div>
      
      {/* Employee Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="border-b">
            <tr>
              <th className="text-left py-2 font-medium">Employee</th>
              <th className="text-center font-medium">Dials</th>
              <th className="text-center font-medium">Talk Time</th>
              <th className="text-center font-medium">PCAT</th>
              <th className="text-center font-medium">Adm</th>
            </tr>
          </thead>
          <tbody>
            {employees.slice(0, 10).map((emp: any, idx: number) => (
              <tr key={idx} className="border-b last:border-0">
                <td className="py-2 font-medium">{emp.employeeName}</td>
                <td className="text-center">{emp.totalDial || 0}</td>
                <td className="text-center">{formatTime(emp.answeredTalkTime)}</td>
                <td className="text-center">
                  <span className="text-xs">
                    S:{emp.pcatScheduled || 0} D:{emp.pcatDone || 0}
                  </span>
                </td>
                <td className="text-center">{emp.admissionDone || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {employees.length > 10 && (
          <p className="text-xs text-muted-foreground text-center mt-2">Showing 10 of {employees.length} employees</p>
        )}
      </div>
    </div>
  );
}