// components/modal/LeadPaymentModal.tsx

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CreditCard, Wallet, Banknote, CheckCircle2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { postDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import axios from 'axios';

interface LeadType {
  _id: string;
  leadId: number;
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  source: string;
  source_campaign: string;
  stageId: {
    _id: string;
    name: string;
    order: number;
  };
  poolId?: {
    _id: string;
    name: string;
  } | string;
  status: 'active' | 'lost' | 'converted';
  healthScore: number;
  modifiedBy: string;
  modifiedAt: string;
  isActive: boolean;
  createdAt: string;
  lastCallDate: string;
  updatedAt: string;
  __v: number;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    employeeId: number;
  };
  reason: string;
}

interface CourseType {
  _id: string;
  courseName: string;
  courseDuration: number;
  totalFee: number;
  vertical?: {
    _id: string;
    name: string;
  };
}

interface LeadPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadType | null;
  onSuccess?: () => void;
}

export function LeadPaymentModal({
  open,
  onOpenChange,
  lead,
  onSuccess,
}: LeadPaymentModalProps) {
  const [activeTab, setActiveTab] = useState<'registration' | 'full'>('registration');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkGenerated, setLinkGenerated] = useState(false);
  
  // Course selection states
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [showCourseSuggestions, setShowCourseSuggestions] = useState(false);
  const [filteredCourses, setFilteredCourses] = useState<CourseType[]>([]);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<CourseType | null>(null);

  // Fetch courses
  useEffect(() => {
    if (open) {
      fetchCourses();
    }
  }, [open]);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await axios.get("https://api.upskillab.com/course/display");
      if (response.data.data) {
        setCourses(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch courses", error);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Handle course search
  const handleCourseSearch = (value: string) => {
    setCourseSearchTerm(value);
    if (value.length > 0) {
      const filtered = courses.filter(course =>
        course.courseName.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCourses(filtered.slice(0, 5));
      setShowCourseSuggestions(true);
    } else {
      setShowCourseSuggestions(false);
      setFilteredCourses([]);
    }
  };

  // Handle course selection
  const handleCourseSelect = (course: CourseType) => {
    setSelectedCourse(course);
    setCourseSearchTerm(course.courseName);
    setShowCourseSuggestions(false);
    setFilteredCourses([]);
  };

  // Clear selected course
  const clearSelectedCourse = () => {
    setSelectedCourse(null);
    setCourseSearchTerm('');
  };

  // Generate payment link using the leadPaymentLink API
  const generatePaymentLink = async () => {
    if (!lead) return;

    if (!paymentAmount || paymentAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    if (activeTab === 'registration') {
      try {
        setLoading(true);
        setLinkGenerated(false);

        const payload: any = {
          amount: paymentAmount,
          leadId: lead.leadId.toString(),
          course: selectedCourse.courseName
        };

        const response = await postDataHandlerWithToken(
          ApiConfig.leadPaymentLink,
          payload,
          true
        );

        if (response?.paymentLink) {
          setGeneratedLink(response.paymentLink);
          setLinkGenerated(true);
          
          toast({
            title: "Payment Link Generated",
            description: `Payment link for ${lead.name} has been created successfully.`,
          });

          if (onSuccess) {
            onSuccess();
          }
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error?.message || "Failed to generate payment link",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast({
        title: "Copied!",
        description: "Payment link copied to clipboard",
      });
    }
  };

  const handleOpenLink = () => {
    if (generatedLink) {
      window.open(generatedLink, '_blank');
    }
  };

  const resetModal = () => {
    setActiveTab('registration');
    setPaymentAmount(0);
    setGeneratedLink('');
    setLinkGenerated(false);
    setSelectedCourse(null);
    setCourseSearchTerm('');
    setShowCourseSuggestions(false);
    setFilteredCourses([]);
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] rounded-2xl border-slate-200 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800">
            Generate Payment Link
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Create a payment link for {lead?.name}
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-5">
            {/* Lead Info Card */}
            {lead && (
              <Card className="bg-slate-50 border-slate-100">
                <CardContent className="p-4 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Student Name</span>
                    <span className="font-medium text-slate-800">{lead.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Lead ID</span>
                    <span className="font-mono text-sm text-slate-600">#{lead.leadId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Phone</span>
                    <span className="text-slate-700">{lead.phone}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Email</span>
                    <span className="text-slate-700 truncate max-w-[200px]">{lead.email}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tab Selection */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => {
                  setActiveTab('registration');
                  setPaymentAmount(0);
                  setLinkGenerated(false);
                  setGeneratedLink('');
                }}
                className={cn(
                  "px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === 'registration'
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
                disabled={loading || linkGenerated}
              >
                <div className="flex items-center justify-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Registration
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab('full');
                  setPaymentAmount(0);
                  setLinkGenerated(false);
                  setGeneratedLink('');
                }}
                className={cn(
                  "px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === 'full'
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
                disabled={loading || linkGenerated}
              >
                <div className="flex items-center justify-center gap-2">
                  <Banknote className="w-4 h-4" />
                  Full Payment
                </div>
              </button>
            </div>

            {/* Registration Payment Tab - Now with Course Selection */}
            {activeTab === 'registration' && (
              <div className="space-y-4">
                {/* Course Selection - Optional */}
                {!linkGenerated && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Select Course
                    </Label>
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          value={courseSearchTerm}
                          onChange={(e) => handleCourseSearch(e.target.value)}
                          onFocus={() => {
                            if (courseSearchTerm.length > 0) {
                              const filtered = courses.filter(course =>
                                course.courseName.toLowerCase().includes(courseSearchTerm.toLowerCase())
                              );
                              setFilteredCourses(filtered.slice(0, 5));
                              setShowCourseSuggestions(true);
                            }
                          }}
                          placeholder="Search for a course ..."
                          className="pl-10 pr-10 h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                          disabled={loading}
                        />
                        {selectedCourse && (
                          <button
                            onClick={clearSelectedCourse}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {showCourseSuggestions && filteredCourses.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {filteredCourses.map((course) => (
                            <div
                              key={course._id}
                              className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                              onClick={() => handleCourseSelect(course)}
                            >
                              <div className="font-medium text-sm text-slate-800">{course.courseName}</div>
                              <div className="text-xs text-slate-400">
                                Duration: {course.courseDuration} days | Fee: {formatCurrency(course.totalFee)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {loadingCourses && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-center">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto text-orange-500" />
                          <p className="text-xs text-slate-400 mt-1">Loading courses...</p>
                        </div>
                      )}
                    </div>
                    {selectedCourse && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                        <CheckCircle2 className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-slate-700">Selected: <strong>{selectedCourse.courseName}</strong></span>
                      </div>
                    )}
                    
                  </div>
                )}

                {/* Amount Input */}
                {!linkGenerated && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Payment Amount *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                        placeholder="Enter amount"
                        className="pl-8 h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                        disabled={loading}
                        min={1}
                      />
                    </div>
                    {paymentAmount <= 0 && (
                      <p className="text-xs text-amber-600">Please enter a valid amount</p>
                    )}
                  </div>
                )}

                {/* Generated Link Display */}
                {linkGenerated && generatedLink && (
                  <div className="space-y-3 p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Payment Link Generated</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-lg border border-green-200 p-2">
                      <Input
                        value={generatedLink}
                        readOnly
                        className="flex-1 border-0 shadow-none font-mono text-xs focus-visible:ring-0"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyLink}
                        className="shrink-0 rounded-lg border-green-200 hover:bg-green-50"
                      >
                        Copy
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleOpenLink}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                      >
                        Open Link
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Full Payment Tab - Currently Blank/Clickable */}
            {activeTab === 'full' && (
              <div className="space-y-4">
                {/* Course Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Select Course *</Label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={courseSearchTerm}
                        onChange={(e) => handleCourseSearch(e.target.value)}
                        onFocus={() => {
                          if (courseSearchTerm.length > 0) {
                            const filtered = courses.filter(course =>
                              course.courseName.toLowerCase().includes(courseSearchTerm.toLowerCase())
                            );
                            setFilteredCourses(filtered.slice(0, 5));
                            setShowCourseSuggestions(true);
                          }
                        }}
                        placeholder="Search for a course..."
                        className="pl-10 pr-10 h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                        disabled={loading}
                      />
                      {selectedCourse && (
                        <button
                          onClick={clearSelectedCourse}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {showCourseSuggestions && filteredCourses.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {filteredCourses.map((course) => (
                          <div
                            key={course._id}
                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                            onClick={() => handleCourseSelect(course)}
                          >
                            <div className="font-medium text-sm text-slate-800">{course.courseName}</div>
                            <div className="text-xs text-slate-400">
                              Duration: {course.courseDuration} days | Fee: {formatCurrency(course.totalFee)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {loadingCourses && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-center">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto text-orange-500" />
                        <p className="text-xs text-slate-400 mt-1">Loading courses...</p>
                      </div>
                    )}
                  </div>
                  {selectedCourse && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                      <CheckCircle2 className="w-4 h-4 text-orange-600" />
                      <span className="text-sm text-slate-700">Selected: <strong>{selectedCourse.courseName}</strong></span>
                    </div>
                  )}
                </div>

                {/* Amount Input */}
                {!linkGenerated && selectedCourse && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Payment Amount *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                        placeholder="Enter amount"
                        className="pl-8 h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                        disabled={loading}
                        min={1}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">Course fee: {formatCurrency(selectedCourse.totalFee)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        onClick={() => setPaymentAmount(selectedCourse.totalFee)}
                        disabled={loading}
                      >
                        Use Full Amount
                      </Button>
                    </div>
                  </div>
                )}

                {/* Placeholder for Full Payment - shows message */}
                {!selectedCourse && (
                  <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <Banknote className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">Select a course to proceed with full payment</p>
                  </div>
                )}

                {/* Generated Link Display */}
                {linkGenerated && generatedLink && (
                  <div className="space-y-3 p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Payment Link Generated</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-lg border border-green-200 p-2">
                      <Input
                        value={generatedLink}
                        readOnly
                        className="flex-1 border-0 shadow-none font-mono text-xs focus-visible:ring-0"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyLink}
                        className="shrink-0 rounded-lg border-green-200 hover:bg-green-50"
                      >
                        Copy
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleOpenLink}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                      >
                        Open Link
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 sm:flex-none rounded-xl border-slate-200 hover:bg-slate-50"
            >
              {linkGenerated ? 'Close' : 'Cancel'}
            </Button>
            {!linkGenerated && (
              <Button
                onClick={generatePaymentLink}
                disabled={
                  loading || 
                  paymentAmount <= 0
                }
                className="flex-1 sm:flex-none rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Generate Link
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </Dialog>
  );
}