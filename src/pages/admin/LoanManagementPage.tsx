import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    RefreshCw,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Users,
    Filter,
    ChevronUp,
    ChevronDown,
    DollarSign,
    Calendar,
    Phone,
    User,
    AlertCircle,
    CheckCircle2,
    Clock,
    Send,
    Eye,
    History,
    Mail,
    MessageSquare,
    Building2,
    Edit,
    Star,
    ThumbsUp,
    ThumbsDown,
    MessageCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { getDataHandlerWithToken, patchTokenDataHandler, putDataHandlerWithToken } from '@/config/services';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import ApiConfig from '@/config/apiConfig';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';

interface LoanType {
    _id: string;
    orderId: string;
    learnerName: string;
    mobile: string;
    email: string;
    couselorId: {
        _id: string;
        name: string;
        employeeId: number;
        email: string;
    };
    counselorName: string;
    LoanPartner: {
        _id: string;
        name: string;
        type: string;
        submissionCharge: number;
    };
    loanAmount: number;
    disbursementAmount: number;
    firstEmiDate: string;
    secondEmiDate: string;
    thirdEmiDate: string;
    firstEmi: boolean;
    secondEmi: boolean;
    thirdEmi: boolean;
    firstReminderSent: boolean;
    secondReminderSent: boolean;
    thirdReminderSent: boolean;
    firstFeedback?: {
        comment: string;
        date: string;
    };
    secondFeedback?: {
        comment: string;
        date: string;
    };
    thirdFeedback?: {
        comment: string;
        date: string;
    };
    status: string;
    createdAt: string;
    updatedAt: string;
}

interface LoanPartner {
    _id: string;
    name: string;
    type: string;
    submissionCharge: number;
}

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
}

interface LoanFilters {
    search: string;
    orderId: string;
    status: string;
    loanPartner: string;
    counsellorId: string;
    groupFilter: boolean;
    dateFilter: string;
    fromDate: string;
    toDate: string;
    page: number;
    limit: number;
}

interface FeedbackForm {
    rating: number;
    comment: string;
}

export function LoanManagementPage() {
    const navigate = useNavigate();
    const [loans, setLoans] = useState<LoanType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [totalLoans, setTotalLoans] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedLoan, setSelectedLoan] = useState<LoanType | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [sendingReminder, setSendingReminder] = useState(false);
    const [reminderModalOpen, setReminderModalOpen] = useState(false);
    const [reminderText, setReminderText] = useState('');
    const [selectedEmi, setSelectedEmi] = useState<string>('');
    const [reminderHistoryModalOpen, setReminderHistoryModalOpen] = useState(false);
    const [selectedReminderHistory, setSelectedReminderHistory] = useState<any[]>([]);
    const [loanPartners, setLoanPartners] = useState<LoanPartner[]>([]);
    const [counsellors, setCounsellors] = useState<User[]>([]);
    const [loadingPartners, setLoadingPartners] = useState(false);
    const [loadingCounsellors, setLoadingCounsellors] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [emiStatusModalOpen, setEmiStatusModalOpen] = useState(false);
    const [updatingEmi, setUpdatingEmi] = useState(false);
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [feedbackForm, setFeedbackForm] = useState<FeedbackForm>({ rating: 0, comment: '' });
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [feedbackEmi, setFeedbackEmi] = useState<string>('');
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    const [filters, setFilters] = useState<LoanFilters>({
        search: '',
        orderId: '',
        status: 'all',
        loanPartner: 'all',
        counsellorId: 'all',
        groupFilter: false,
        dateFilter: 'all',
        fromDate: '',
        toDate: '',
        page: 1,
        limit: 10
    });

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Format date time
    const formatDateTime = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Active':
                return <Badge className="bg-green-100 text-green-700 border-green-200">Active</Badge>;
            case 'Pending':
                return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>;
            case 'Completed':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Completed</Badge>;
            case 'Defaulted':
                return <Badge className="bg-red-100 text-red-700 border-red-200">Defaulted</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Get EMI status
    const getEmiStatus = (emiDate: string, isPaid: boolean, isReminderSent: boolean) => {
        if (isPaid) {
            return {
                status: 'paid',
                badge: <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
            };
        }
        if (!emiDate) return null;
        const today = new Date();
        const emiDateObj = new Date(emiDate);

        if (emiDateObj < today) {
            return {
                status: 'overdue',
                badge: <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Overdue</Badge>
            };
        } else if (isReminderSent) {
            return {
                status: 'reminded',
                badge: <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">Reminder Sent</Badge>
            };
        } else {
            return {
                status: 'upcoming',
                badge: <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Upcoming</Badge>
            };
        }
    };

    // Fetch orders for dropdown
    const fetchOrders = async () => {
        try {
            setLoadingOrders(true);
            const response = await getDataHandlerWithToken("Order", { page: 1, limit: 1000 }, null);
            if (response.data) {
                setOrders(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setLoadingOrders(false);
        }
    };

    // Fetch loan partners
    const fetchLoanPartners = async () => {
        try {
            setLoadingPartners(true);
            const response = await getDataHandlerWithToken("getLoanPartners", null, null);
            if (response) {
                setLoanPartners(response);
            }
        } catch (error: any) {
            console.error("Failed to fetch loan partners", error);
        } finally {
            setLoadingPartners(false);
        }
    };

    // Fetch counsellors
    const fetchCounsellors = async () => {
        try {
            setLoadingCounsellors(true);
            const response = await getDataHandlerWithToken("getAllUser", null, null);
            if (response) {
                setCounsellors(response);
            }
        } catch (error: any) {
            console.error("Failed to fetch counsellors", error);
        } finally {
            setLoadingCounsellors(false);
        }
    };

    // Fetch loan history
    const fetchLoanHistory = async () => {
        try {
            setLoading(true);
            const params: Record<string, any> = {
                page: filters.page,
                limit: filters.limit
            };

            if (filters.search) params.search = filters.search;
            if (filters.orderId) params.orderId = filters.orderId;
            if (filters.status && filters.status !== 'all') params.status = filters.status;
            if (filters.loanPartner && filters.loanPartner !== 'all') params.loanPartner = filters.loanPartner;
            if (filters.groupFilter) {
                params.group = true;
                if (filters.counsellorId && filters.counsellorId !== 'all') {
                    params.counsellorId = filters.counsellorId;
                }
            } else {
                params.counsellorId = currentUser._id;
            }
            if (filters.dateFilter && filters.dateFilter !== 'all') {
                params.dateFilter = filters.dateFilter;
            }
            if (filters.fromDate) params.fromDate = filters.fromDate;
            if (filters.toDate) params.toDate = filters.toDate;

            const response = await getDataHandlerWithToken("getLoanHistory", params, null);
            if (response) {
                setLoans(response.data || []);
                setTotalLoans(response.total || 0);
                setTotalPages(response.totalPages || 1);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "Failed to fetch loan history",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Send reminder
    const handleSendReminder = async () => {
        if (!selectedLoan || !selectedEmi) return;

        try {
            setSendingReminder(true);

            let endpoint = ApiConfig.sendLoanReminder(selectedLoan._id);
            let data: any = {
                loanId: selectedLoan._id,
                reminderText: reminderText || `This is a reminder for your EMI payment of ${formatCurrency(selectedLoan.loanAmount)}`,
                reminderNumber: selectedEmi === 'first' ? 1 : selectedEmi === 'second' ? 2 : 3
            };
            await patchTokenDataHandler(endpoint, data, true);

            toast({
                title: "Success",
                description: `Reminder sent successfully to ${selectedLoan.learnerName}`,
            });

            setReminderModalOpen(false);
            setReminderText('');
            setSelectedEmi('');
            fetchLoanHistory();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "Failed to send reminder",
                variant: "destructive",
            });
        } finally {
            setSendingReminder(false);
        }
    };

    // Update EMI status
    const handleUpdateEmiStatus = async (emiId: string, emiType: string) => {
        try {
            setUpdatingEmi(true);
            const data = emiType === 'first' ? { firstEmi: true } :
                emiType === 'second' ? { secondEmi: true } :
                    { thirdEmi: true };

            const endpoint = ApiConfig.updateLoanStatus(emiId);
            await patchTokenDataHandler(endpoint, data, true);

            toast({
                title: "Success",
                description: `EMI status updated successfully`,
            });

            setEmiStatusModalOpen(false);
            fetchLoanHistory();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "Failed to update EMI status",
                variant: "destructive",
            });
        } finally {
            setUpdatingEmi(false);
        }
    };

    // Submit feedback
    const handleSubmitFeedback = async () => {
        if (!selectedLoan || !feedbackEmi) return;

        try {
            setSubmittingFeedback(true);
            const endpoint = ApiConfig.updateLoanFeedback(selectedLoan._id);
            const data = {
                emiNumber: feedbackEmi === 'first' ? 1 : feedbackEmi === 'second' ? 2 : 3,
                rating: feedbackForm.rating,
                comment: feedbackForm.comment
            };

            await putDataHandlerWithToken(endpoint, data, true);

            toast({
                title: "Success",
                description: "Feedback submitted successfully",
            });

            setFeedbackModalOpen(false);
            setFeedbackForm({ rating: 0, comment: '' });
            setFeedbackEmi('');
            fetchLoanHistory();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "Failed to submit feedback",
                variant: "destructive",
            });
        } finally {
            setSubmittingFeedback(false);
        }
    };

    // Handle filter changes
    const handleFilterChange = (key: keyof LoanFilters, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: 1
        }));

        if (key === 'groupFilter' && !value) {
            setFilters(prev => ({
                ...prev,
                counsellorId: 'all',
                page: 1
            }));
        }
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            search: '',
            orderId: '',
            status: 'all',
            loanPartner: 'all',
            counsellorId: 'all',
            groupFilter: false,
            dateFilter: 'all',
            fromDate: '',
            toDate: '',
            page: 1,
            limit: 10
        });
    };

    // View loan details
    const handleViewLoan = (loan: LoanType) => {
        setSelectedLoan(loan);
        setViewModalOpen(true);
    };

    // View reminder history
    const handleViewReminderHistory = (loan: LoanType, emi: string) => {
        setSelectedLoan(loan);
        let history: any[] = [];

        if (emi === 'first' && (loan as any).firstReminderHistory) {
            history = (loan as any).firstReminderHistory;
        } else if (emi === 'second' && (loan as any).secondReminderHistory) {
            history = (loan as any).secondReminderHistory;
        } else if (emi === 'third' && (loan as any).thirdReminderHistory) {
            history = (loan as any).thirdReminderHistory;
        }

        setSelectedReminderHistory(history);
        setReminderHistoryModalOpen(true);
    };

    // Open reminder modal
    const handleOpenReminderModal = (loan: LoanType, emi: string) => {
        setSelectedLoan(loan);
        setSelectedEmi(emi);
        let defaultMessage = '';

        if (emi === 'first') {
            defaultMessage = `Dear ${loan.learnerName},\n\nThis is a reminder that your first EMI payment is due on ${formatDate(loan.firstEmiDate)}.\n\nPlease make the payment at your earliest convenience.\n\nThank you.`;
        } else if (emi === 'second') {
            defaultMessage = `Dear ${loan.learnerName},\n\nThis is a reminder that your second EMI payment is due on ${formatDate(loan.secondEmiDate)}.\n\nPlease make the payment at your earliest convenience.\n\nThank you.`;
        } else if (emi === 'third') {
            defaultMessage = `Dear ${loan.learnerName},\n\nThis is a reminder that your third EMI payment is due on ${formatDate(loan.thirdEmiDate)}.\n\nPlease make the payment at your earliest convenience.\n\nThank you.`;
        }

        setReminderText(defaultMessage);
        setReminderModalOpen(true);
    };

    // Open EMI status update modal
    const handleOpenEmiStatusModal = (loan: LoanType, emi: string) => {
        setSelectedLoan(loan);
        setSelectedEmi(emi);
        setEmiStatusModalOpen(true);
    };

    // Open feedback modal
    const handleOpenFeedbackModal = (loan: LoanType, emi: string) => {
        setSelectedLoan(loan);
        setFeedbackEmi(emi);
        setFeedbackForm({ rating: 0, comment: '' });
        setFeedbackModalOpen(true);
    };

    // Render rating stars
    const renderRatingStars = (rating: number) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                ))}
            </div>
        );
    };

    // Fetch data when filters change
    useEffect(() => {
        fetchLoanHistory();
    }, [filters]);

    // Fetch loan partners and counsellors on mount
    useEffect(() => {
        fetchLoanPartners();
        fetchCounsellors();
        fetchOrders();
    }, []);

    return (
        <div className="space-y-4 md:space-y-6 p-2 md:p-6">
            {/* Group Filter Checkbox */}
            <div className="flex items-center space-x-2 bg-muted/30 p-3 rounded-lg border">
                <Checkbox
                    id="group-filter"
                    checked={filters.groupFilter}
                    onCheckedChange={(checked) => handleFilterChange('groupFilter', checked)}
                />
                <Label htmlFor="group-filter" className="text-sm font-medium cursor-pointer">
                    Group
                </Label>
                {filters.groupFilter && (
                    <Badge variant="secondary" className="ml-2">
                        Grouped View
                    </Badge>
                )}
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Loan Management</h1>
                    <p className="text-sm md:text-base text-muted-foreground">Manage and track all active loan students</p>
                </div>
                <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Reset Filters
                </Button>
            </div>

            {/* Filters Toggle */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2"
                >
                    <Filter className="w-4 h-4" />
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                    {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>

                <div className="text-sm text-muted-foreground">
                    Total: {totalLoans} loans
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Search</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by name, mobile, email..."
                                            value={filters.search}
                                            onChange={(e) => handleFilterChange('search', e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Order ID</Label>
                                    <SearchableDropdown
                                        options={[
                                            { value: '', label: 'All Orders' },
                                            ...orders.map(order => ({
                                                value: order._id,
                                                label: `${order.studentName} - ${order._id.slice(-8)}`,
                                                subLabel: `${order.mobile} | ${order.email}`
                                            }))
                                        ]}
                                        value={filters.orderId}
                                        onValueChange={(value) => handleFilterChange('orderId', value)}
                                        placeholder="Select order"
                                        searchPlaceholder="Search by student name, order ID, phone..."
                                        emptyMessage="No orders found"
                                        disabled={loadingOrders}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={filters.status}
                                        onValueChange={(value) => handleFilterChange('status', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                            <SelectItem value="Defaulted">Defaulted</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Loan Partner</Label>
                                    <Select
                                        value={filters.loanPartner}
                                        onValueChange={(value) => handleFilterChange('loanPartner', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="All Partners" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Partners</SelectItem>
                                            {loanPartners.map((partner) => (
                                                <SelectItem key={partner._id} value={partner._id}>
                                                    {partner.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Date Filter</Label>
                                    <Select
                                        value={filters.dateFilter}
                                        onValueChange={(value) => handleFilterChange('dateFilter', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Time</SelectItem>
                                            <SelectItem value="today">Today</SelectItem>
                                            <SelectItem value="week">This Week</SelectItem>
                                            <SelectItem value="month">This Month</SelectItem>
                                            <SelectItem value="year">This Year</SelectItem>
                                            <SelectItem value="custom">Custom Range</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {filters.dateFilter === 'custom' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>From Date</Label>
                                            <Input
                                                type="date"
                                                value={filters.fromDate}
                                                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>To Date</Label>
                                            <Input
                                                type="date"
                                                value={filters.toDate}
                                                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}

                                {filters.groupFilter && (
                                    <div className="space-y-2">
                                        <Label>Counsellor</Label>
                                        <SearchableDropdown
                                            options={[
                                                { value: 'all', label: 'All Counsellors' },
                                                ...counsellors.map(counsellor => ({
                                                    value: counsellor._id,
                                                    label: counsellor.name,
                                                    subLabel: `${counsellor.email}${counsellor.employeeId ? ` | ID: ${counsellor.employeeId}` : ''}`
                                                }))
                                            ]}
                                            value={filters.counsellorId}
                                            onValueChange={(value) => handleFilterChange('counsellorId', value)}
                                            placeholder="Select counsellor"
                                            searchPlaceholder="Search by name, email or ID..."
                                            emptyMessage="No counsellors found"
                                            disabled={loadingCounsellors}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Active Filters Display */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                                <span className="text-xs text-muted-foreground">Active filters:</span>
                                {filters.search && (
                                    <Badge variant="secondary" className="text-xs">
                                        Search: {filters.search}
                                    </Badge>
                                )}
                                {filters.orderId && (
                                    <Badge variant="secondary" className="text-xs">
                                        Order: {orders.find(o => o._id === filters.orderId)?.studentName || filters.orderId.slice(-8)}
                                    </Badge>
                                )}
                                {filters.status !== 'all' && (
                                    <Badge variant="secondary" className="text-xs">
                                        Status: {filters.status}
                                    </Badge>
                                )}
                                {filters.loanPartner !== 'all' && (
                                    <Badge variant="secondary" className="text-xs">
                                        Loan Partner: {loanPartners.find(p => p._id === filters.loanPartner)?.name || filters.loanPartner}
                                    </Badge>
                                )}
                                {filters.groupFilter && (
                                    <Badge variant="secondary" className="text-xs">
                                        Group View: {filters.counsellorId !== 'all' ?
                                            `Counsellor: ${counsellors.find(c => c._id === filters.counsellorId)?.name || filters.counsellorId}` :
                                            'All Counsellors'}
                                    </Badge>
                                )}
                                {filters.dateFilter !== 'all' && filters.dateFilter !== 'custom' && (
                                    <Badge variant="secondary" className="text-xs">
                                        Date: {filters.dateFilter}
                                    </Badge>
                                )}
                                {filters.fromDate && filters.toDate && (
                                    <Badge variant="secondary" className="text-xs">
                                        {new Date(filters.fromDate).toLocaleDateString()} - {new Date(filters.toDate).toLocaleDateString()}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Loans Table */}
            <Card>
                <CardHeader className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            Loan Students
                            <Badge variant="outline" className="ml-2">
                                {totalLoans} total
                            </Badge>
                            {loading && <Loader2 className="w-3 h-3 animate-spin ml-2" />}
                        </CardTitle>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm text-muted-foreground">
                                Page {filters.page} of {totalPages}
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                                    disabled={filters.page === 1 || loading}
                                    className="h-8 w-8"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleFilterChange('page', Math.min(totalPages, filters.page + 1))}
                                    disabled={filters.page === totalPages || loading}
                                    className="h-8 w-8"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            <Select
                                value={filters.limit.toString()}
                                onValueChange={(value) => {
                                    handleFilterChange('limit', parseInt(value));
                                    handleFilterChange('page', 1);
                                }}
                            >
                                <SelectTrigger className="w-20 h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                            <p className="mt-2 text-muted-foreground">Loading loan data...</p>
                        </div>
                    ) : loans.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-12 h-12 mx-auto text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No loan records found</h3>
                            <p className="text-muted-foreground">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="whitespace-nowrap">Order ID</TableHead>
                                        <TableHead className="whitespace-nowrap">Student Name</TableHead>
                                        <TableHead className="whitespace-nowrap">Contact</TableHead>
                                        <TableHead className="whitespace-nowrap">Loan Amount</TableHead>
                                        <TableHead className="whitespace-nowrap">Disbursed Amount</TableHead>
                                        <TableHead className="whitespace-nowrap">Loan Partner</TableHead>
                                        <TableHead className="whitespace-nowrap">EMI Details</TableHead>
                                        <TableHead className="whitespace-nowrap">Status</TableHead>
                                        <TableHead className="whitespace-nowrap">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loans.map((loan) => (
                                        <TableRow key={loan._id} className="hover:bg-muted/50">
                                            <TableCell className="whitespace-nowrap">
                                                <span className="font-mono text-xs">{loan.orderId?.slice(-8)}</span>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="font-medium">{loan.learnerName}</div>
                                                <div className="text-xs text-muted-foreground">{loan.counselorName}</div>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3 text-muted-foreground" />
                                                    <span className="text-sm">{loan.mobile}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[150px]">{loan.email}</div>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="font-medium text-blue-600">{formatCurrency(loan.loanAmount)}</div>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="text-green-600">{formatCurrency(loan.disbursementAmount)}</div>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {loan.LoanPartner ? (
                                                    <Badge variant="outline">{loan.LoanPartner.name}</Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">N/A</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="space-y-2">
                                                    {/* First EMI */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-20 text-xs font-medium">1st EMI:</div>
                                                        <div className="text-xs">{formatDate(loan.firstEmiDate)}</div>
                                                        {getEmiStatus(loan.firstEmiDate, loan.firstEmi, loan.firstReminderSent)?.badge}
                                                        {!loan.firstEmi && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOpenReminderModal(loan, 'first')}
                                                                    className="h-6 px-2 text-xs"
                                                                    title="Send Reminder"
                                                                // disabled={loan.firstReminderSent}
                                                                >
                                                                    <Send className="w-3 h-3 mr-1" />
                                                                    Remind
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOpenEmiStatusModal(loan, 'first')}
                                                                    className="h-6 px-2 text-xs"
                                                                    title="Mark as Paid"
                                                                >
                                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                    Mark Paid
                                                                </Button>
                                                                {/* <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOpenFeedbackModal(loan, 'first')}
                                                                    className="h-6 px-2 text-xs"
                                                                    title="Add Feedback"
                                                                >
                                                                    <MessageCircle className="w-3 h-3 mr-1" />
                                                                    Feedback
                                                                </Button> */}
                                                            </>
                                                        )}
                                                        {/* {loan.firstFeedback && (
                                                            <div className="flex items-center gap-1" title={`${loan.firstFeedback.comment}`}>
                                                               
                                                            </div>
                                                        )} */}
                                                    </div>

                                                    {/* Second EMI */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-20 text-xs font-medium">2nd EMI:</div>
                                                        <div className="text-xs">{formatDate(loan.secondEmiDate)}</div>
                                                        {getEmiStatus(loan.secondEmiDate, loan.secondEmi, loan.secondReminderSent)?.badge}
                                                        {!loan.secondEmi && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOpenReminderModal(loan, 'second')}
                                                                    className="h-6 px-2 text-xs"
                                                                    title="Send Reminder"
                                                                // disabled={loan.secondReminderSent}
                                                                >
                                                                    <Send className="w-3 h-3 mr-1" />
                                                                    Remind
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOpenEmiStatusModal(loan, 'second')}
                                                                    className="h-6 px-2 text-xs"
                                                                    title="Mark as Paid"
                                                                >
                                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                    Mark Paid
                                                                </Button>
                                                                {/* <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOpenFeedbackModal(loan, 'second')}
                                                                    className="h-6 px-2 text-xs"
                                                                    title="Add Feedback"
                                                                >
                                                                    <MessageCircle className="w-3 h-3 mr-1" />
                                                                    Feedback
                                                                </Button> */}
                                                            </>
                                                        )}
                                                        {/* {loan.secondFeedback && (
                                                            <div className="flex items-center gap-1" title={`${loan.secondFeedback.comment}`}>
                                                                
                                                            </div>
                                                        )} */}
                                                    </div>

                                                    {/* Third EMI */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-20 text-xs font-medium">3rd EMI:</div>
                                                        <div className="text-xs">{formatDate(loan.thirdEmiDate)}</div>
                                                        {getEmiStatus(loan.thirdEmiDate, loan.thirdEmi, loan.thirdReminderSent)?.badge}
                                                        {!loan.thirdEmi && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOpenReminderModal(loan, 'third')}
                                                                    className="h-6 px-2 text-xs"
                                                                    title="Send Reminder"
                                                                // disabled={loan.thirdReminderSent}
                                                                >
                                                                    <Send className="w-3 h-3 mr-1" />
                                                                    Remind
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOpenEmiStatusModal(loan, 'third')}
                                                                    className="h-6 px-2 text-xs"
                                                                    title="Mark as Paid"
                                                                >
                                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                    Mark Paid
                                                                </Button>
                                                                {/* <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOpenFeedbackModal(loan, 'third')}
                                                                    className="h-6 px-2 text-xs"
                                                                    title="Add Feedback"
                                                                >
                                                                    <MessageCircle className="w-3 h-3 mr-1" />
                                                                    Feedback
                                                                </Button> */}
                                                            </>
                                                        )}
                                                        {/* {loan.thirdFeedback && (
                                                            <div className="flex items-center gap-1" title={`${loan.thirdFeedback.comment}`}>
                                                                
                                                            </div>
                                                        )} */}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {getStatusBadge(loan.status)}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewLoan(loan)}
                                                        className="h-7 px-2 text-xs"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-3 h-3 mr-1" />
                                                        View
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* View Loan Details Modal */}
            <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl max-h-[90vh] p-0 sm:p-6 overflow-hidden flex flex-col">
                    <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
                        <DialogTitle className="text-lg sm:text-xl">Loan Details</DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                            Complete loan information for {selectedLoan?.learnerName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-4 py-2 sm:px-6 space-y-4">
                        {selectedLoan && (
                            <>
                                {/* Student Information Section */}
                                <div className="space-y-3">
                                    <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        Student Information
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs sm:text-sm text-muted-foreground">Order ID</Label>
                                            <p className="text-sm sm:text-base font-mono break-words">{selectedLoan.orderId}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs sm:text-sm text-muted-foreground">Student Name</Label>
                                            <p className="text-sm sm:text-base font-medium break-words">{selectedLoan.learnerName}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs sm:text-sm text-muted-foreground">Mobile Number</Label>
                                            <p className="text-sm sm:text-base font-medium break-words">{selectedLoan.mobile}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs sm:text-sm text-muted-foreground">Email</Label>
                                            <p className="text-sm sm:text-base font-medium break-words">{selectedLoan.email}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs sm:text-sm text-muted-foreground">Counselor</Label>
                                            <p className="text-sm sm:text-base font-medium break-words">{selectedLoan.counselorName}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs sm:text-sm text-muted-foreground">Loan Partner</Label>
                                            <p className="text-sm sm:text-base font-medium break-words">{selectedLoan.LoanPartner?.name || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs sm:text-sm text-muted-foreground">Status</Label>
                                            <div>{getStatusBadge(selectedLoan.status)}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs sm:text-sm text-muted-foreground">Loan Amount</Label>
                                            <p className="text-sm sm:text-base font-medium text-blue-600 break-words">
                                                {formatCurrency(selectedLoan.loanAmount)}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs sm:text-sm text-muted-foreground">Disbursement Amount</Label>
                                            <p className="text-sm sm:text-base font-medium text-green-600 break-words">
                                                {formatCurrency(selectedLoan.disbursementAmount)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* EMI Schedule Section */}
                                <div className="border-t pt-4 space-y-3">
                                    <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        EMI Schedule
                                    </h3>
                                    <div className="space-y-3">
                                        {/* First EMI */}
                                        <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-medium text-sm sm:text-base">First EMI</p>
                                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                                        Due Date: {formatDate(selectedLoan.firstEmiDate)}
                                                    </p>
                                                    <div className="mt-2">
                                                        {getEmiStatus(selectedLoan.firstEmiDate, selectedLoan.firstEmi, selectedLoan.firstReminderSent)?.badge}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {!selectedLoan.firstEmi && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setReminderModalOpen(true);
                                                                setSelectedEmi('first');
                                                                setReminderText(`Dear ${selectedLoan.learnerName},\n\nThis is a reminder that your first EMI payment is due on ${formatDate(selectedLoan.firstEmiDate)}.\n\nPlease make the payment at your earliest convenience.\n\nThank you.`);
                                                            }}
                                                            className="h-8 text-xs"
                                                        >
                                                            <Send className="w-3 h-3 mr-1" />
                                                            Send Reminder
                                                        </Button>
                                                    )}
                                                    {!selectedLoan.firstEmi && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleOpenEmiStatusModal(selectedLoan, 'first')}
                                                                className="h-8 text-xs"
                                                            >
                                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                Mark as Paid
                                                            </Button>
                                                            {/* <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleOpenFeedbackModal(selectedLoan, 'first')}
                                                                className="h-8 text-xs"
                                                            >
                                                                <MessageCircle className="w-3 h-3 mr-1" />
                                                                Add Feedback
                                                            </Button> */}
                                                        </>
                                                    )}
                                                    {/* {selectedLoan.firstFeedback && (
                                                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                                                        
                                                            <span className="text-xs text-muted-foreground">
                                                                {selectedLoan.firstFeedback.comment}
                                                            </span>
                                                        </div>
                                                    )} */}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Second EMI */}
                                        <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-medium text-sm sm:text-base">Second EMI</p>
                                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                                        Due Date: {formatDate(selectedLoan.secondEmiDate)}
                                                    </p>
                                                    <div className="mt-2">
                                                        {getEmiStatus(selectedLoan.secondEmiDate, selectedLoan.secondEmi, selectedLoan.secondReminderSent)?.badge}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {!selectedLoan.secondEmi && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setReminderModalOpen(true);
                                                                setSelectedEmi('second');
                                                                setReminderText(`Dear ${selectedLoan.learnerName},\n\nThis is a reminder that your first EMI payment is due on ${formatDate(selectedLoan.secondEmiDate)}.\n\nPlease make the payment at your earliest convenience.\n\nThank you.`);
                                                            }}
                                                            className="h-8 text-xs"
                                                        >
                                                            <Send className="w-3 h-3 mr-1" />
                                                            Send Reminder
                                                        </Button>
                                                    )}
                                                    {!selectedLoan.secondEmi && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleOpenEmiStatusModal(selectedLoan, 'second')}
                                                                className="h-8 text-xs"
                                                            >
                                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                Mark as Paid
                                                            </Button>
                                                            {/* <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleOpenFeedbackModal(selectedLoan, 'second')}
                                                                className="h-8 text-xs"
                                                            >
                                                                <MessageCircle className="w-3 h-3 mr-1" />
                                                                Add Feedback
                                                            </Button> */}
                                                        </>
                                                    )}
                                                    {/* {selectedLoan.secondFeedback && (
                                                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                                                            
                                                            <span className="text-xs text-muted-foreground">
                                                                {selectedLoan.secondFeedback.comment}
                                                            </span>
                                                        </div>
                                                    )} */}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Third EMI */}
                                        <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-medium text-sm sm:text-base">Third EMI</p>
                                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                                        Due Date: {formatDate(selectedLoan.thirdEmiDate)}
                                                    </p>
                                                    <div className="mt-2">
                                                        {getEmiStatus(selectedLoan.thirdEmiDate, selectedLoan.thirdEmi, selectedLoan.thirdReminderSent)?.badge}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {!selectedLoan.thirdEmi && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setReminderModalOpen(true);
                                                                setSelectedEmi('third');
                                                                setReminderText(`Dear ${selectedLoan.learnerName},\n\nThis is a reminder that your first EMI payment is due on ${formatDate(selectedLoan.thirdEmiDate)}.\n\nPlease make the payment at your earliest convenience.\n\nThank you.`);
                                                            }}
                                                            className="h-8 text-xs"
                                                        >
                                                            <Send className="w-3 h-3 mr-1" />
                                                            Send Reminder
                                                        </Button>
                                                    )}
                                                    {!selectedLoan.thirdEmi && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleOpenEmiStatusModal(selectedLoan, 'third')}
                                                                className="h-8 text-xs"
                                                            >
                                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                Mark as Paid
                                                            </Button>
                                                            {/* <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleOpenFeedbackModal(selectedLoan, 'third')}
                                                                className="h-8 text-xs"
                                                            >
                                                                <MessageCircle className="w-3 h-3 mr-1" />
                                                                Add Feedback
                                                            </Button> */}
                                                        </>
                                                    )}
                                                    {/* {selectedLoan.thirdFeedback && (
                                                        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                                                            <span className="text-xs text-muted-foreground">
                                                                {selectedLoan.thirdFeedback.comment}
                                                            </span>
                                                        </div>
                                                    )} */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline Section */}
                                <div className="border-t pt-4 space-y-3">
                                    <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Timeline
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2">
                                            <span className="text-xs sm:text-sm text-muted-foreground">Created:</span>
                                            <span className="text-sm sm:text-base font-medium break-words">{formatDateTime(selectedLoan.createdAt)}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2">
                                            <span className="text-xs sm:text-sm text-muted-foreground">Last Updated:</span>
                                            <span className="text-sm sm:text-base font-medium break-words">{formatDateTime(selectedLoan.updatedAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter className="px-4 py-3 sm:px-6 sm:py-4 border-t mt-2">
                        <Button variant="outline" onClick={() => setViewModalOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Update EMI Status Modal */}
            <Dialog open={emiStatusModalOpen} onOpenChange={setEmiStatusModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update EMI Status</DialogTitle>
                        <DialogDescription>
                            Mark {selectedEmi === 'first' ? 'first' : selectedEmi === 'second' ? 'second' : 'third'} EMI as paid for {selectedLoan?.learnerName}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">
                                <AlertCircle className="w-4 h-4 inline mr-2" />
                                This action will mark the EMI as paid. This cannot be undone.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEmiStatusModalOpen(false)} disabled={updatingEmi}>
                            Cancel
                        </Button>
                        <Button onClick={() => handleUpdateEmiStatus(selectedLoan!._id, selectedEmi)} disabled={updatingEmi}>
                            {updatingEmi ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Mark as Paid
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Feedback Modal */}
            <Dialog open={feedbackModalOpen} onOpenChange={setFeedbackModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Submit Feedback</DialogTitle>
                        <DialogDescription>
                            Provide feedback for {selectedLoan?.learnerName}'s {feedbackEmi === 'first' ? 'first' : feedbackEmi === 'second' ? 'second' : 'third'} EMI
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Rating</Label>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                                        className="focus:outline-none"
                                    >
                                        <Star
                                            className={`w-8 h-8 ${star <= feedbackForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Comment</Label>
                            <Textarea
                                value={feedbackForm.comment}
                                onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                                placeholder="Enter your feedback..."
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFeedbackModalOpen(false)} disabled={submittingFeedback}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmitFeedback} disabled={submittingFeedback || feedbackForm.rating === 0}>
                            {submittingFeedback ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <ThumbsUp className="w-4 h-4 mr-2" />
                                    Submit Feedback
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Send Reminder Modal */}
            <Dialog open={reminderModalOpen} onOpenChange={setReminderModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Send EMI Reminder</DialogTitle>
                        <DialogDescription>
                            Send a reminder to {selectedLoan?.learnerName} for their {selectedEmi === 'first' ? 'first' : selectedEmi === 'second' ? 'second' : 'third'} EMI payment
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>Reminder Message</Label>
                            <Textarea
                                value={reminderText}
                                onChange={(e) => setReminderText(e.target.value)}
                                rows={8}
                                className="mt-2"
                                placeholder="Enter reminder message..."
                            />
                        </div>
                        <div className="bg-muted/30 p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                <AlertCircle className="w-4 h-4 inline mr-1" />
                                This reminder will be sent via Email to the student
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReminderModalOpen(false)} disabled={sendingReminder}>
                            Cancel
                        </Button>
                        <Button onClick={handleSendReminder} disabled={sendingReminder}>
                            {sendingReminder ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Reminder
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reminder History Modal */}
            <Dialog open={reminderHistoryModalOpen} onOpenChange={setReminderHistoryModalOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Reminder History</DialogTitle>
                        <DialogDescription>
                            Previous reminders sent for {selectedLoan?.learnerName}'s {selectedEmi === 'first' ? 'first' : selectedEmi === 'second' ? 'second' : 'third'} EMI
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto py-4">
                        {selectedReminderHistory.length === 0 ? (
                            <div className="text-center py-8">
                                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground" />
                                <p className="mt-2 text-muted-foreground">No reminders sent yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedReminderHistory.map((reminder, index) => (
                                    <div key={index} className="border rounded-lg p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-blue-600" />
                                                <span className="text-sm font-medium">Reminder #{selectedReminderHistory.length - index}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDateTime(reminder.date)}
                                            </span>
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap">{reminder.message}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReminderHistoryModalOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}