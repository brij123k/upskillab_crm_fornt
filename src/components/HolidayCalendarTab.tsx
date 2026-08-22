// HolidayCalendarTab.tsx - Updated with CallLogsPage design patterns
import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Table2,
  Grid3x3,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  Eye,
  X,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getDataHandlerWithToken, patchTokenDataHandler, deleteTokenDataHandler, postDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';

interface Holiday {
  _id: string;
  name: string;
  date: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HolidayCalendarTabProps {
  onRefresh?: () => void;
  fetching?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Helper function to convert UTC to IST and format date
const convertUTCToIST = (utcDate: string): Date => {
  const date = new Date(utcDate);
  const istTime = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  return istTime;
};

// Helper to get date string in IST
const getDateInIST = (date: Date): string => {
  const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  return istDate.toISOString().split('T')[0];
};

// Helper to check if a date is in the past (in IST)
const isPastDateIST = (dateStr: string): boolean => {
  const utcDate = new Date(dateStr);
  const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
  const today = new Date();
  const todayIST = new Date(today.getTime() + (5.5 * 60 * 60 * 1000));
  todayIST.setHours(0, 0, 0, 0);
  istDate.setHours(0, 0, 0, 0);
  return istDate < todayIST;
};

export function HolidayCalendarTab({ onRefresh, fetching }: HolidayCalendarTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly' | 'table'>('monthly');
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Fetch holidays based on view mode
  const fetchHolidays = async () => {
    try {
      setLoading(true);
      let endpoint = ApiConfig.holiday;
      let query: any = {};

      if (viewMode === 'yearly' || viewMode === 'table') {
        query = { year: currentYear };
      } else if (viewMode === 'monthly') {
        query = { month: currentMonth + 1, year: currentYear };
      }

      const response = await getDataHandlerWithToken(endpoint, query, null, true);
      
      const holidayData = Array.isArray(response) ? response : response?.data || [];
      setHolidays(holidayData);
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
      toast({
        title: 'Error',
        description: 'Failed to load holidays',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [currentYear, currentMonth, viewMode]);

  // Navigation functions
  const navigatePrevious = () => {
    if (viewMode === 'monthly') {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    } else if (viewMode === 'yearly' || viewMode === 'table') {
      setCurrentDate(new Date(currentYear - 1, currentMonth, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'monthly') {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    } else if (viewMode === 'yearly' || viewMode === 'table') {
      setCurrentDate(new Date(currentYear + 1, currentMonth, 1));
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days for monthly view
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  // Get holidays for a specific date (IST)
  const getHolidaysForDate = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.filter(h => {
      const istDate = convertUTCToIST(h.date);
      const hDateStr = `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, '0')}-${String(istDate.getDate()).padStart(2, '0')}`;
      return hDateStr === dateStr;
    });
  };

  // Handle date click in monthly view
  const handleDateClick = (day: number | null) => {
    if (!day) return;
    const holidaysOnDate = getHolidaysForDate(currentYear, currentMonth, day);
    
    if (holidaysOnDate.length > 0) {
      setSelectedHoliday(holidaysOnDate[0]);
      setIsViewModalOpen(true);
    } else {
      const date = new Date(currentYear, currentMonth, day);
      setSelectedDate(date);
      const formattedDate = getDateInIST(date);
      setFormData({ ...formData, date: formattedDate });
      setIsModalOpen(true);
    }
  };

  // Handle date click in yearly view
  const handleYearlyDateClick = (year: number, month: number, day: number) => {
    const holidaysOnDate = getHolidaysForDate(year, month, day);
    
    if (holidaysOnDate.length > 0) {
      setSelectedHoliday(holidaysOnDate[0]);
      setIsViewModalOpen(true);
    } else {
      const date = new Date(year, month, day);
      setSelectedDate(date);
      const formattedDate = getDateInIST(date);
      setFormData({ ...formData, date: formattedDate });
      setIsModalOpen(true);
    }
  };

  // Handle add holiday
  const handleAddHoliday = async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name,
        date: formData.date,
        description: formData.description || formData.name
      };
      const response = await postDataHandlerWithToken(ApiConfig.holiday, payload, true);
      
      if (response) {
        toast({
          title: 'Success',
          description: 'Holiday added successfully',
        });
        setIsModalOpen(false);
        setFormData({ name: '', date: '', description: '' });
        await fetchHolidays();
        if (onRefresh) onRefresh();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to add holiday',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update holiday
  const handleUpdateHoliday = async () => {
    if (!selectedHoliday) return;
    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name,
        date: formData.date,
        description: formData.description || formData.name
      };
      const endpoint = ApiConfig.changeHoliday(selectedHoliday._id);
      const response = await patchTokenDataHandler(endpoint, payload, true);
      
      if (response) {
        toast({
          title: 'Success',
          description: 'Holiday updated successfully',
        });
        setIsEditModalOpen(false);
        setIsViewModalOpen(false);
        setSelectedHoliday(null);
        setFormData({ name: '', date: '', description: '' });
        await fetchHolidays();
        if (onRefresh) onRefresh();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to update holiday',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete holiday
  const handleDeleteHoliday = async () => {
    if (!selectedHoliday) return;
    
    if (isPastDateIST(selectedHoliday.date)) {
      toast({
        title: 'Cannot Delete',
        description: 'Past holidays cannot be deleted',
        variant: 'destructive',
      });
      setIsDeleteModalOpen(false);
      return;
    }

    try {
      setIsSubmitting(true);
      const endpoint = ApiConfig.changeHoliday(selectedHoliday._id);
      await deleteTokenDataHandler(endpoint, true);
      
      toast({
        title: 'Success',
        description: 'Holiday deleted successfully',
      });
      setIsDeleteModalOpen(false);
      setIsViewModalOpen(false);
      setSelectedHoliday(null);
      await fetchHolidays();
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to delete holiday',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open view modal from table
  const openViewModal = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setIsViewModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (holiday: Holiday) => {
    const istDate = convertUTCToIST(holiday.date);
    const formattedDate = getDateInIST(istDate);
    setSelectedHoliday(holiday);
    setFormData({
      name: holiday.name,
      date: formattedDate,
      description: holiday.description || ''
    });
    setIsEditModalOpen(true);
  };

  // Format date for display
  const formatDateDisplay = (dateStr: string) => {
    const istDate = convertUTCToIST(dateStr);
    return istDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render monthly calendar
  const renderMonthlyCalendar = () => {
    const days = generateCalendarDays();
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <Card className="bg-white border-0 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAYS.map(day => (
            <div key={day} className="py-2 text-center text-xs font-medium text-slate-500 bg-slate-50">
              {day}
            </div>
          ))}
        </div>
        <div className="p-3">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => {
                const holidaysOnDate = day ? getHolidaysForDate(currentYear, currentMonth, day) : [];
                const hasHoliday = holidaysOnDate.length > 0;
                const holidayName = hasHoliday ? holidaysOnDate[0].name : '';
                const isToday = day === new Date().getDate() && 
                               currentMonth === new Date().getMonth() && 
                               currentYear === new Date().getFullYear();
                const isPast = day ? isPastDateIST(new Date(currentYear, currentMonth, day).toISOString()) : false;

                return (
                  <div
                    key={dayIndex}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      "relative rounded-lg p-2 cursor-pointer transition-all duration-200 min-h-[60px]",
                      "hover:bg-slate-50 hover:scale-[1.02]",
                      day === null && "hover:bg-transparent cursor-default",
                      hasHoliday && "bg-orange-50 hover:bg-orange-100 border border-orange-200",
                      isToday && "ring-2 ring-orange-500 ring-offset-1",
                      isPast && !hasHoliday && "bg-slate-50 opacity-60",
                      isPast && hasHoliday && "bg-slate-100 border-slate-300"
                    )}
                  >
                    {day !== null && (
                      <>
                        <div className={cn(
                          "text-sm font-medium",
                          hasHoliday ? "text-orange-700" : "text-slate-700",
                          isToday && !hasHoliday && "text-orange-600",
                          isPast && !hasHoliday && "text-slate-400"
                        )}>
                          {day}
                        </div>
                        {hasHoliday && (
                          <div className="mt-1">
                            <div className="text-[10px] font-medium text-orange-700 truncate leading-tight">
                              {holidayName.length > 15 ? holidayName.substring(0, 15) + '...' : holidayName}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>
    );
  };

  // Render yearly calendar - small month cards with all dates
  const renderYearlyCalendar = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MONTHS.map((month, index) => {
          const daysInMonth = new Date(currentYear, index + 1, 0).getDate();
          const firstDayOfMonth = new Date(currentYear, index, 1).getDay();
          
          const monthDays = [];
          for (let i = 0; i < firstDayOfMonth; i++) {
            monthDays.push(null);
          }
          for (let i = 1; i <= daysInMonth; i++) {
            monthDays.push(i);
          }

          const monthHolidays = holidays.filter(h => {
            const istDate = convertUTCToIST(h.date);
            return istDate.getMonth() === index && istDate.getFullYear() === currentYear;
          });

          return (
            <Card key={month} className="p-4 hover:shadow-md transition-shadow duration-200 border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-2 text-center">{month}</h3>
              <div className="grid grid-cols-7 gap-0.5">
                {['S','M','T','W','T','F','S'].map((day, i) => (
                  <div key={i} className="text-[8px] text-slate-400 text-center font-medium">
                    {day}
                  </div>
                ))}
                {monthDays.map((day, dayIndex) => {
                  if (day === null) {
                    return <div key={dayIndex} className="aspect-square" />;
                  }
                  
                  const holidaysOnDate = getHolidaysForDate(currentYear, index, day);
                  const hasHoliday = holidaysOnDate.length > 0;
                  const isToday = day === new Date().getDate() && 
                                 index === new Date().getMonth() && 
                                 currentYear === new Date().getFullYear();

                  return (
                    <div
                      key={dayIndex}
                      onClick={() => handleYearlyDateClick(currentYear, index, day)}
                      className={cn(
                        "aspect-square flex items-center justify-center rounded text-[10px] cursor-pointer transition-all duration-200 relative",
                        "hover:bg-slate-100 hover:scale-110",
                        hasHoliday && "bg-orange-100 hover:bg-orange-200 font-semibold text-orange-700",
                        isToday && "ring-1 ring-orange-500 ring-offset-1",
                        !hasHoliday && "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      {day}
                      {hasHoliday && (
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-orange-500" />
                      )}
                    </div>
                  );
                })}
              </div>
              {monthHolidays.length > 0 && (
                <div className="mt-2 space-y-0.5">
                  {monthHolidays.slice(0, 2).map(holiday => (
                    <div key={holiday._id} className="text-[8px] text-slate-600 truncate px-1.5 py-0.5 bg-orange-50 rounded">
                      {holiday.name}
                    </div>
                  ))}
                  {monthHolidays.length > 2 && (
                    <div className="text-[8px] text-orange-500 font-medium text-center">
                      +{monthHolidays.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  };

  // Render table view
  const renderTableView = () => {
    const sortedHolidays = [...holidays].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedHolidays.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedHolidays.length / itemsPerPage);

    return (
      <div>
        <Card className="bg-white border-0 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800">Holiday Records</h2>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1 || loading} 
                  className="h-8 w-8 p-0 rounded-lg border-slate-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages || loading} 
                  className="h-8 w-8 p-0 rounded-lg border-slate-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-400" />
              <p className="mt-3 text-slate-500">Loading holidays...</p>
            </div>
          ) : sortedHolidays.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarIcon className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="mt-3 text-base font-medium text-slate-700">No holidays found</h3>
              <p className="text-sm text-slate-400">No holidays scheduled for {currentYear}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 border-b border-slate-100">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">#</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Holiday Name</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Date (IST)</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Description</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((holiday, index) => {
                    const isPast = isPastDateIST(holiday.date);
                    const formattedDate = formatDateDisplay(holiday.date);

                    return (
                      <TableRow key={holiday._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="text-sm text-slate-500 py-3">
                          {indexOfFirstItem + index + 1}
                        </TableCell>
                        <TableCell className="font-medium text-slate-800 text-sm">
                          {holiday.name}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {formattedDate}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">
                          {holiday.description || '-'}
                        </TableCell>
                        <TableCell>
                          {isPast ? (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Past
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Upcoming
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openViewModal(holiday)}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(holiday)}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedHoliday(holiday);
                                setIsDeleteModalOpen(true);
                              }}
                              className={cn(
                                "h-8 w-8 p-0 rounded-lg",
                                isPast ? "opacity-50 cursor-not-allowed" : "hover:bg-red-50"
                              )}
                              disabled={isPast}
                            >
                              <Trash2 className={cn(
                                "h-3.5 w-3.5",
                                isPast ? "text-slate-300" : "text-red-400 hover:text-red-600"
                              )} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
            <span>Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedHolidays.length)} of {sortedHolidays.length} holidays</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1 || loading} 
                className="rounded-lg border-slate-200"
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages || loading} 
                className="rounded-lg border-slate-200"
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            <Button
              variant={viewMode === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('monthly')}
              className={cn(
                "h-8 px-3 text-xs rounded-lg",
                viewMode === 'monthly' && "bg-orange-600 hover:bg-orange-700 text-white"
              )}
            >
              <Grid3x3 className="h-3.5 w-3.5 mr-1.5" />
              Monthly
            </Button>
            <Button
              variant={viewMode === 'yearly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('yearly')}
              className={cn(
                "h-8 px-3 text-xs rounded-lg",
                viewMode === 'yearly' && "bg-orange-600 hover:bg-orange-700 text-white"
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
              Yearly
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className={cn(
                "h-8 px-3 text-xs rounded-lg",
                viewMode === 'table' && "bg-orange-600 hover:bg-orange-700 text-white"
              )}
            >
              <Table2 className="h-3.5 w-3.5 mr-1.5" />
              Table
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={navigatePrevious}
              className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-slate-700 min-w-[100px] text-center">
              {viewMode === 'monthly' 
                ? `${MONTHS[currentMonth]} ${currentYear}`
                : `${currentYear}`
              }
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateNext}
              className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={navigateToday}
            className="h-9 px-3 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
          >
            Today
          </Button>
          {viewMode !== 'table' && (
            <Button
              onClick={() => {
                const today = new Date();
                setSelectedDate(today);
                setFormData({ ...formData, date: getDateInIST(today) });
                setIsModalOpen(true);
              }}
              className="h-9 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Holiday
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-400" />
          <p className="mt-3 text-slate-500">Loading holidays...</p>
        </div>
      ) : (
        <>
          {viewMode === 'monthly' && renderMonthlyCalendar()}
          {viewMode === 'yearly' && renderYearlyCalendar()}
          {viewMode === 'table' && renderTableView()}
        </>
      )}

      {/* Add Holiday Modal - Styled like CallLogs modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800">Add Holiday</DialogTitle>
            <DialogDescription>
              Add a new holiday for {selectedDate?.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Holiday Name *</Label>
              <Input
                placeholder="e.g., Republic Day"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1.5 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Date (IST) *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1.5 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Description (Optional)</Label>
              <Textarea
                placeholder="Brief description of the holiday"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1.5 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddHoliday}
              disabled={!formData.name || !formData.date || isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Holiday Modal - Styled like CallLogs modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800 flex items-center gap-2">
              <Eye className="h-5 w-5 text-orange-500" />
              Holiday Details
            </DialogTitle>
          </DialogHeader>
          {selectedHoliday && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Holiday Name</p>
                    <p className="mt-1 font-medium text-slate-800">{selectedHoliday.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Date (IST)</p>
                    <p className="mt-1 text-slate-700">
                      {convertUTCToIST(selectedHoliday.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  {selectedHoliday.description && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Description</p>
                      <p className="mt-1 text-slate-700">{selectedHoliday.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Status</p>
                    <p className="mt-1">
                      {isPastDateIST(selectedHoliday.date) ? (
                        <span className="text-slate-500">Past Holiday</span>
                      ) : (
                        <span className="text-emerald-600">Upcoming Holiday</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsViewModalOpen(false)}
              className="rounded-xl border-slate-200"
            >
              Close
            </Button>
            {selectedHoliday && !isPastDateIST(selectedHoliday.date) && (
              <Button
                variant="destructive"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsDeleteModalOpen(true);
                }}
                className="bg-red-600 hover:bg-red-700 rounded-xl"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button
              onClick={() => {
                if (selectedHoliday) {
                  openEditModal(selectedHoliday);
                }
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Holiday Modal - Styled like CallLogs modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800">Edit Holiday</DialogTitle>
            <DialogDescription>Update holiday details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-700">Holiday Name *</Label>
              <Input
                placeholder="Holiday name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1.5 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Date (IST) *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1.5 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700">Description (Optional)</Label>
              <Textarea
                placeholder="Brief description of the holiday"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1.5 rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-xl border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateHoliday}
              disabled={!formData.name || !formData.date || isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal - Styled like CallLogs modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirm Delete
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this holiday? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedHoliday && (
            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-sm font-medium text-slate-700">{selectedHoliday.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {convertUTCToIST(selectedHoliday.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded-xl border-slate-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteHoliday}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}