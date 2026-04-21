export function DailyUtilizationReport({ data }: any) {
  if (!data?.employees || !data?.dateStrings) return null;
  
  const dates = data.dateStrings.slice(0, 5);
  const employees = data.employees.slice(0, 8);
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 font-medium sticky left-0 bg-white">Employee</th>
            {dates.map((date: string) => (
              <th key={date} className="text-center py-2 min-w-[80px]">
                {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp: any, idx: number) => (
            <tr key={idx} className="border-b">
              <td className="py-2 font-medium sticky left-0 bg-white">{emp.employeeName}</td>
              {dates.map((date: string) => {
                const metric = emp.dailyMetrics.find((m: any) => m.date === date);
                return (
                  <td key={date} className="text-center py-2">
                    {metric?.dial ? (
                      <div className="bg-green-50 rounded p-1">
                        <div>{metric.dial}</div>
                        {metric.answered > 0 && (
                          <div className="text-[10px] text-green-600">
                            {metric.answered} ans
                          </div>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}