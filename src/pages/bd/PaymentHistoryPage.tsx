import { useState, useEffect, useCallback } from 'react';
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
    CreditCard,
    Filter,
    ChevronUp,
    ChevronDown,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    Users
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
import { getDataHandlerWithToken } from '@/config/services';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';

interface PaymentHistoryFilters {
    search: string;
    orderId: string;
    leadId: string;
    counsellorId: string;
    dateFilter: string;
    fromDate: string;
    toDate: string;
    groupFilter: boolean;
    page: number;
    limit: number;
}

interface OrderOption {
    _id: string;
    orderId: string;
    studentName: string;
    mobile: string;
    email: string;
}

interface LeadOption {
    _id: string;
    leadId: number;
    name: string;
    phone: string;
    email: string;
}

interface CounsellorOption {
    _id: string;
    name: string;
    email: string;
    employeeId?: string;
}

export function PaymentHistoryPage() {
    const navigate = useNavigate();
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(true);
    const [totalPayments, setTotalPayments] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    
    // Dropdown options
    const [orders, setOrders] = useState<OrderOption[]>([]);
    const [leads, setLeads] = useState<LeadOption[]>([]);
    const [counsellors, setCounsellors] = useState<CounsellorOption[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [loadingCounsellors, setLoadingCounsellors] = useState(false);
    
    const [filters, setFilters] = useState<PaymentHistoryFilters>({
        search: '',
        orderId: '',
        leadId: '',
        counsellorId: '',
        dateFilter: 'all',
        fromDate: '',
        toDate: '',
        groupFilter: false,
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

    // Fetch orders for dropdown
    const fetchOrders = async () => {
        try {
            setLoadingOrders(true);
            const response = await getDataHandlerWithToken("Order", { page: 1, limit: 1000 }, null);
            if (response.data) {
                setOrders(response.data.map((order: any) => ({
                    _id: order._id,
                    orderId: order._id,
                    studentName: order.studentName,
                    mobile: order.mobile,
                    email: order.email
                })));
            }
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setLoadingOrders(false);
        }
    };

    // Fetch leads for dropdown
    const fetchLeads = async () => {
        try {
            setLoadingLeads(true);
            const response = await getDataHandlerWithToken("getAllLeads", { page: 1, limit: 1000 }, null);
            if (response?.data) {
                setLeads(response.data.map((lead: any) => ({
                    _id: lead._id,
                    leadId: lead.leadId,
                    name: lead.name,
                    phone: lead.phone,
                    email: lead.email
                })));
            }
        } catch (error) {
            console.error("Failed to fetch leads", error);
        } finally {
            setLoadingLeads(false);
        }
    };

    // Fetch counsellors for dropdown
    const fetchCounsellors = async () => {
        try {
            setLoadingCounsellors(true);
            const response = await getDataHandlerWithToken("getAllUser", null, null);
            if (response) {
                setCounsellors(response.filter((user:any) => user.status == "active").map((user: any) => ({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    employeeId: user.employeeId
                })));
            }
        } catch (error) {
            console.error("Failed to fetch counsellors", error);
        } finally {
            setLoadingCounsellors(false);
        }
    };

    // Fetch payment history
    const fetchPaymentHistory = async () => {
        try {
            setLoading(true);
            const params: Record<string, any> = {
                page: filters.page,
                limit: filters.limit
            };
            
            if (filters.search) params.search = filters.search;
            if (filters.orderId) params.orderId = filters.orderId;
            if (filters.leadId) params.leadId = filters.leadId;
            if (filters.counsellorId) params.counsellorId = filters.counsellorId;
            if (filters.groupFilter) params.group = true;
            if (filters.dateFilter && filters.dateFilter !== 'all') {
                params.dateFilter = filters.dateFilter;
            }
            if (filters.fromDate) params.fromDate = filters.fromDate;
            if (filters.toDate) params.toDate = filters.toDate;
            
            const response = await getDataHandlerWithToken("getPaymentHistory", params, null);
            if (response) {
                setPayments(response.data || []);
                setTotalPayments(response.total || 0);
                setTotalPages(response.totalPages || 1);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "Failed to fetch payment history",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle filter changes
    const handleFilterChange = (key: keyof PaymentHistoryFilters, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: 1 // Reset to first page when filter changes
        }));
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            search: '',
            orderId: '',
            leadId: '',
            counsellorId: '',
            dateFilter: 'all',
            fromDate: '',
            toDate: '',
            groupFilter: false,
            page: 1,
            limit: 10
        });
    };

    // Fetch data when filters change
    useEffect(() => {
        fetchPaymentHistory();
    }, [filters]);

    // Initialize dropdown data
    useEffect(() => {
        fetchOrders();
        fetchLeads();
        fetchCounsellors();
    }, []);

    return (
        <div className="space-y-4 md:space-y-6 p-2 md:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Payment History</h1>
                        <p className="text-sm md:text-base text-muted-foreground">View and track all payment transactions</p>
                    </div>
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

            {/* Group Filter Toggle */}
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
                    Total: {totalPayments} payments
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
                                            placeholder="Search by name, email, phone..."
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
                                    <Label>Lead ID</Label>
                                    <SearchableDropdown
                                        options={[
                                            { value: '', label: 'All Leads' },
                                            ...leads.map(lead => ({
                                                value: lead._id,
                                                label: `${lead.name} (Lead ID: ${lead.leadId})`,
                                                subLabel: `${lead.phone} | ${lead.email}`
                                            }))
                                        ]}
                                        value={filters.leadId}
                                        onValueChange={(value) => handleFilterChange('leadId', value)}
                                        placeholder="Select lead"
                                        searchPlaceholder="Search by name, lead ID, phone..."
                                        emptyMessage="No leads found"
                                        disabled={loadingLeads}
                                    />
                                </div>

                                {filters.groupFilter && (
                                    <div className="space-y-2">
                                        <Label>Counsellor</Label>
                                        <SearchableDropdown
                                            options={[
                                                { value: '', label: 'All Counsellors' },
                                                ...counsellors.map(counsellor => ({
                                                    value: counsellor._id,
                                                    label: counsellor.name,
                                                    subLabel: `${counsellor.email}${counsellor.employeeId ? ` | ID: ${counsellor.employeeId}` : ''}`
                                                }))
                                            ]}
                                            value={filters.counsellorId}
                                            onValueChange={(value) => handleFilterChange('counsellorId', value)}
                                            placeholder="Select counsellor"
                                            searchPlaceholder="Search by name, email, ID..."
                                            emptyMessage="No counsellors found"
                                            disabled={loadingCounsellors}
                                        />
                                    </div>
                                )}

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
                                {filters.leadId && (
                                    <Badge variant="secondary" className="text-xs">
                                        Lead: {leads.find(l => l._id === filters.leadId)?.name || filters.leadId}
                                    </Badge>
                                )}
                                {filters.counsellorId && filters.groupFilter && (
                                    <Badge variant="secondary" className="text-xs">
                                        Counsellor: {counsellors.find(c => c._id === filters.counsellorId)?.name || filters.counsellorId}
                                    </Badge>
                                )}
                                {filters.groupFilter && (
                                    <Badge variant="secondary" className="text-xs">
                                        <Users className="w-3 h-3 inline mr-1" />
                                        Grouped View
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

            {/* Payments Table */}
            <Card>
                <CardHeader className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            Payment Transactions
                            <Badge variant="outline" className="ml-2">
                                {totalPayments} total
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
                            <p className="mt-2 text-muted-foreground">Loading payment history...</p>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-12">
                            <CreditCard className="w-12 h-12 mx-auto text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No payments found</h3>
                            <p className="text-muted-foreground">No payment transactions found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="whitespace-nowrap">Date & Time</TableHead>
                                        <TableHead className="whitespace-nowrap">Student Name</TableHead>
                                        <TableHead className="whitespace-nowrap">Contact</TableHead>
                                        <TableHead className="whitespace-nowrap">Amount</TableHead>
                                        <TableHead className="whitespace-nowrap">Order ID</TableHead>
                                        <TableHead className="whitespace-nowrap">Transaction ID</TableHead>
                                        <TableHead className="whitespace-nowrap">Payment Mode</TableHead>
                                        <TableHead className="whitespace-nowrap">Status</TableHead>
                                        <TableHead className="whitespace-nowrap">Counsellor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment) => (
                                        <TableRow key={payment._id} className="hover:bg-muted/50">
                                            <TableCell className="whitespace-nowrap">
                                                <div className="text-sm">
                                                    {format(new Date(payment.event_time || payment.link_created_at), 'dd MMM yyyy')}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {format(new Date(payment.event_time || payment.link_created_at), 'hh:mm a')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="font-medium">{payment.customer_details?.customer_name || payment.orderRef?.studentName}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {payment.orderRef?.fatherName && `Father: ${payment.orderRef.fatherName}`}
                                                </div>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="text-sm">{payment.customer_details?.customer_phone || payment.orderRef?.mobile}</div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                    {payment.customer_details?.customer_email || payment.orderRef?.email}
                                                </div>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="font-medium text-green-600">
                                                    {formatCurrency(payment.link_amount_paid || payment.link_amount)}
                                                </div>
                                                {payment.link_amount && payment.link_amount !== payment.link_amount_paid && (
                                                    <div className="text-xs text-muted-foreground line-through">
                                                        {formatCurrency(payment.link_amount)}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <span className="font-mono text-xs cursor-pointer hover:text-primary" 
                                                    onClick={() => {
                                                        const orderId = payment.link_notes?.orderId || payment.orderRef?._id;
                                                        if (orderId) {
                                                            navigator.clipboard.writeText(orderId);
                                                            toast({
                                                                title: "Copied!",
                                                                description: "Order ID copied to clipboard",
                                                            });
                                                        }
                                                    }}
                                                    title="Click to copy"
                                                >
                                                    {(payment.link_notes?.orderId || payment.orderRef?._id)?.slice(-8)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <span className="font-mono text-xs cursor-pointer hover:text-primary"
                                                    onClick={() => {
                                                        if (payment.transaction_id) {
                                                            navigator.clipboard.writeText(payment.transaction_id.toString());
                                                            toast({
                                                                title: "Copied!",
                                                                description: "Transaction ID copied to clipboard",
                                                            });
                                                        }
                                                    }}
                                                    title="Click to copy"
                                                >
                                                    {payment.transaction_id?.toString().slice(-8)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <Badge variant="outline">
                                                    {payment.orderRef?.paymentMode || 'N/A'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {payment.link_status === 'PAID' && payment.transaction_status === 'SUCCESS' ? (
                                                    <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Success
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 flex items-center gap-1">
                                                        <XCircle className="w-3 h-3" />
                                                        Failed
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="text-sm">{payment.counsellorId?.name || '-'}</div>
                                                <div className="text-xs text-muted-foreground">{payment.counsellorId?.email || '-'}</div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}