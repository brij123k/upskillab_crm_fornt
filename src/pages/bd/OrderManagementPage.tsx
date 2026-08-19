import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Clock,
    Plus,
    RefreshCw,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Eye,
    Edit,
    CreditCard,
    Filter,
    ChevronUp,
    ChevronDown,
    DollarSign,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    ShieldX,
    History,
    Users,
    Receipt,
    Info,
    BookOpen,
    ExternalLink
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { getDataHandlerWithToken, patchDataHandler, patchTokenDataHandler, postDataHandlerWithToken, putDataHandlerWithToken } from '@/config/services';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import ApiConfig from '@/config/apiConfig';
import { format } from 'date-fns';
import axios from 'axios';

interface PaymentType {
    _id: string;
    link_amount: number;
    link_amount_paid: number;
    link_status: string;
    link_purpose: string;
    link_created_at: string;
    transaction_id: number;
    transaction_status: string;
    order_amount: number;
    customer_details: {
        customer_name: string;
        customer_phone: string;
        customer_email: string;
    };
    link_notes: {
        orderId: string;
    };
    createdAt: string;
}

interface OrderType {
    _id: string;
    mobile: string;
    email: string;
    studentName: string;
    fatherName: string;
    dob: string;
    education: string;
    address: string;
    city: string;
    state: string;
    courseVertical: {
        _id: string;
        name: string;
        revenue_percentage: string;
    };
    courseName: string;
    courseDuration: string;
    totalFee: number;
    discount: number;
    finalFee: number;
    paymentMode: 'Lumpsum' | 'Loan' | 'Subscription';
    counsellorId: {
        _id: string;
        name: string;
        email: string;
    };
    counsellorName: string;
    orderDate: string;
    feeDepositDate: string;
    remarks: string;
    status: string;
    Approved: boolean;
    lumpsumDetails?: {
        registrationDate: string;
        registrationAmount: number;
        totalReceived: number;
        pendingAmount: number;
        paymentType: string;
    };
    loanDetails?: {
        loanPartner: {
            _id: string;
            name: string;
            type: string;
            submissionCharge: number;
        };
        loanId: {
            _id: string;
            learnerName: string;
            mobile: string;
            counselorName: string;
            loanAmount: number;
            disbursementAmount: number;
            firstEmiDate: string;
            secondEmiDate: string;
            thirdEmiDate: string;
            status: string;
        };
        loanAmount: number;
        disbursementAmount: number;
        firstEmiDate: string;
    };
    subscriptionDetails?: {
        cashfreeSubscriptionId?: string;
        subscriptionId?: string;
        gateway: string;
        installmentAmount: number;
        firstInstallmentDate: string;
        lastInstallmentDate: string;
        numberOfInstallments: number;
    };
    createdAt: string;
    updatedAt: string;
    approvedBy?: {
        _id: string;
        name: string;
        email: string;
    };
    GSTEnabled?: boolean;
    GSTAmount?: number;
}

interface LeadType {
    _id: string;
    leadId: number;
    name: string;
    phone: string;
    email: string;
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

interface PoolType {
    _id: string;
    name: string;
}

interface LoanPartnerType {
    _id: string;
    name: string;
    type: string;
    submissionCharge: number;
    isActive: boolean;
}

interface OrderForm {
    mobile: string;
    email: string;
    studentName: string;
    fatherName: string;
    dob: string;
    education: string;
    address: string;
    city: string;
    state: string;
    courseVertical: string;
    courseName: string;
    courseDuration: string;
    totalFee: number;
    discount: number;
    GSTEnabled?: boolean;
    GSTAmount?: number;
    paymentMode: string;
    orderDate: string;
    feeDepositDate: string;
    remarks: string;
    lumpsumDetails?: {
        registrationDate: string;
        registrationAmount: number;
        totalReceived: number;
        paymentType: string;
    };
    loanDetails?: {
        loanPartner: string;
        loanAmount: number;
        disbursementAmount: number;
        firstEmiDate: string;
    };
    subscriptionDetails?: {
        gateway: string;
        installmentAmount: number;
        firstInstallmentDate: string;
        lastInstallmentDate: string;
        numberOfInstallments: number;
    };
}

interface Filters {
    search: string;
    paymentMode: string;
    status: string;
    dateFilter: string;
    fromDate: string;
    toDate: string;
    counsellorId: string;
    groupFilter: boolean;
    page: number;
    limit: number;
}
import { useNavigate } from 'react-router-dom';
import { hasModulePermission } from '@/utils/modulePermissions';
import { hasPermission } from '@/utils/permissions';
export function OrderManagementPage() {
    // State declarations
    const [orders, setOrders] = useState<OrderType[]>([]);
    const [leads, setLeads] = useState<LeadType[]>([]);
    const [courses, setCourses] = useState<CourseType[]>([]);
    const [pools, setPools] = useState<PoolType[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingLeads, setLoadingLeads] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingPools, setLoadingPools] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [approvingOrder, setApprovingOrder] = useState(false);
    const [showLeadSuggestions, setShowLeadSuggestions] = useState(false);
    const [filteredLeads, setFilteredLeads] = useState<LeadType[]>([]);
    const [showCourseSuggestions, setShowCourseSuggestions] = useState(false);
    const [filteredCourses, setFilteredCourses] = useState<CourseType[]>([]);
    const [counsellors, setCounsellors] = useState<any[]>([]);
    const [loadingCounsellors, setLoadingCounsellors] = useState(false);
    // Pagination
    // const [page, setPage] = useState(1);
    // const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [paymentAmount, setPaymentAmount] = useState(0);
    // Payment modal states
    const [generatedLink, setGeneratedLink] = useState('');
    const [generatedLinkModalOpen, setGeneratedLinkModalOpen] = useState(false);
    const [paymentType, setPaymentType] = useState('UPI');
    const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
    const [subscriptionAuthModalOpen, setSubscriptionAuthModalOpen] = useState(false);
    const [subscriptionCreating, setSubscriptionCreating] = useState(false);
    const [subscriptionLoading, setSubscriptionLoading] = useState(false);
    const [subscriptionPlanId, setSubscriptionPlanId] = useState('');
    const [subscriptionSessionId, setSubscriptionSessionId] = useState('');
    const [subscriptionAuthUrl, setSubscriptionAuthUrl] = useState('');
    // Payment history modal
    const [paymentHistoryModalOpen, setPaymentHistoryModalOpen] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState<PaymentType[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(false);
    // Filters
    const [filters, setFilters] = useState<Filters>({
        search: '',
        paymentMode: 'all',
        status: 'all',
        dateFilter: 'all',
        fromDate: '',
        toDate: '',
        counsellorId: 'all',
        groupFilter: false,
        page: 1,
        limit: 10
    });

    // Form state
    const [orderForm, setOrderForm] = useState<OrderForm>({
        mobile: '',
        email: '',
        studentName: '',
        fatherName: '',
        dob: '',
        education: '',
        address: '',
        city: '',
        state: '',
        courseVertical: '',
        courseName: '',
        courseDuration: '',
        totalFee: 0,
        discount: 0,
        GSTEnabled: false,
        GSTAmount: 0,
        paymentMode: 'Lumpsum',
        orderDate: new Date().toISOString().slice(0, 16),
        feeDepositDate: new Date().toISOString().slice(0, 16),
        remarks: '',
        lumpsumDetails: {
            registrationDate: new Date().toISOString().slice(0, 16),
            registrationAmount: 0,
            totalReceived: 0,
            paymentType: 'UPI'
        },
        loanDetails: {
            loanPartner: '',
            loanAmount: 0,
            disbursementAmount: 0,
            firstEmiDate: new Date().toISOString().slice(0, 16)
        },
        subscriptionDetails: {
            gateway: 'Cashfree',
            installmentAmount: 0,
            firstInstallmentDate: new Date().toISOString().slice(0, 16),
            lastInstallmentDate: new Date().toISOString().slice(0, 16),
            numberOfInstallments: 1
        }
    });

    const [addingOrder, setAddingOrder] = useState(false);
    const [updatingOrder, setUpdatingOrder] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [leadSearchTerm, setLeadSearchTerm] = useState('');
    const [courseSearchTerm, setCourseSearchTerm] = useState('');
    const [loanPartners, setLoanPartners] = useState<LoanPartnerType[]>([]);
    const [loadingLoanPartners, setLoadingLoanPartners] = useState(false);
    const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");
    const navigate = useNavigate();

    // Calculate final fee with GST
    const calculateFinalFee = useCallback(() => {
        let total = orderForm.totalFee - orderForm.discount;
        if (orderForm.GSTEnabled && orderForm.GSTAmount) {
            total += orderForm.GSTAmount;
        }
        return total;
    }, [orderForm.totalFee, orderForm.discount, orderForm.GSTEnabled, orderForm.GSTAmount]);

    // Build query params
   const buildQueryParams = useCallback(() => {
    const params: Record<string, any> = {};
    params.page = filters.page;  // Use filters.page instead of page
    params.limit = filters.limit; // Use filters.limit instead of limit

    if (filters.search) params.search = filters.search;
    if (filters.paymentMode && filters.paymentMode !== "all") params.paymentMode = filters.paymentMode;
    if (filters.status && filters.status !== "all") params.status = filters.status;
    if (filters.dateFilter && filters.dateFilter !== "all") params.dateFilter = filters.dateFilter;
    if (filters.fromDate) params.fromDate = filters.fromDate;
    if (filters.toDate) params.toDate = filters.toDate;
    if (filters.counsellorId && filters.counsellorId !== "all") params.counsellorId = filters.counsellorId;
    if (filters.groupFilter) params.group = true;

    return params;
}, [filters]);

    // Fetch orders
const fetchOrders = async () => {
    try {
        setLoading(true);
        const queryParams = buildQueryParams();
        console.log('Fetching with params:', queryParams); // Debug log
        const response = await getDataHandlerWithToken("Order", queryParams, null);
        if (response.data) {
            setOrders(response.data);
            setTotalOrders(response.total);
            setTotalPages(response.totalPages);
        }
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to fetch orders",
            variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
};

// Update the handleFilterChange function to properly update page
const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({
        ...prev,
        [key]: value,
        ...(key !== 'page' && key !== 'limit' ? { page: 1 } : {}) // Reset to page 1 when changing filters
    }));
};

    // Fetch leads for suggestion
    const fetchLeads = async () => {
        try {
            setLoadingLeads(true);
            const response = await getDataHandlerWithToken("getAllLeads", { page: 1, limit: 1000 }, null);
            if (response?.data) {
                setLeads(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch leads", error);
        } finally {
            setLoadingLeads(false);
        }
    };

    // Fetch courses
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

    // Fetch pools
    const fetchPools = async () => {
        try {
            setLoadingPools(true);
            const response = await getDataHandlerWithToken("getAllPools", null, null);
            if (response) {
                setPools(response);
            }
        } catch (error) {
            console.error("Failed to fetch pools", error);
        } finally {
            setLoadingPools(false);
        }
    };

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

    // Fetch loan partners
    const fetchLoanPartners = async () => {
        try {
            setLoadingLoanPartners(true);
            const response = await getDataHandlerWithToken("getLoanPartners", null, null);
            if (response) {
                setLoanPartners(response);
            }
        } catch (error) {
            console.error("Failed to fetch loan partners", error);
        } finally {
            setLoadingLoanPartners(false);
        }
    };

    // Fetch payment history for an order
    const fetchPaymentHistory = async (orderId: string) => {
        try {
            setLoadingPayments(true);
            const response = await getDataHandlerWithToken(ApiConfig.getPaymentbyOrderId(orderId), null, null, true);
            if (response) {
                setPaymentHistory(response);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch payment history",
                variant: "destructive",
            });
        } finally {
            setLoadingPayments(false);
        }
    };

    // Initialize data
    useEffect(() => {
        if (hasModulePermission(permissions, "orders")) {
            fetchOrders();
        }
        fetchLeads();
        fetchCourses();
        fetchPools();
        fetchLoanPartners();
        fetchCounsellors();
    }, []);

    // Refresh when filters or pagination changes
    useEffect(() => {
        fetchOrders();
    }, [filters]);

    // Handle lead selection from search input
    const handleLeadSelectFromSearch = (selectedLead: LeadType) => {
        setOrderForm({
            ...orderForm,
            mobile: selectedLead.phone,
            email: selectedLead.email,
            studentName: selectedLead.name,
        });
    };

    // Handle course selection from search input
    const handleCourseSelectFromSearch = (selectedCourse: CourseType) => {
        setOrderForm({
            ...orderForm,
            courseName: selectedCourse.courseName,
            courseDuration: selectedCourse.courseDuration.toString(),
            totalFee: selectedCourse.totalFee,
        });
    };

    // Create order
    const handleCreateOrder = async () => {
        try {
            setAddingOrder(true);

            // Validate required fields
            if (!orderForm.studentName || !orderForm.mobile || !orderForm.email || !orderForm.courseName) {
                toast({
                    title: "Error",
                    description: "Please fill all required fields",
                    variant: "destructive",
                });
                return;
            }

            const finalFee = calculateFinalFee();
            const dataToSend: any = {
                mobile: orderForm.mobile,
                email: orderForm.email,
                studentName: orderForm.studentName,
                fatherName: orderForm.fatherName,
                dob: orderForm.dob ? new Date(orderForm.dob).toISOString() : new Date().toISOString(),
                education: orderForm.education,
                address: orderForm.address,
                city: orderForm.city,
                state: orderForm.state,
                courseVertical: orderForm.courseVertical,
                courseName: orderForm.courseName,
                courseDuration: orderForm.courseDuration,
                totalFee: orderForm.totalFee,
                finalFee: finalFee,
                discount: orderForm.discount,
                paymentMode: orderForm.paymentMode,
                orderDate: new Date(orderForm.orderDate).toISOString(),
                feeDepositDate: new Date(orderForm.feeDepositDate).toISOString(),
                remarks: orderForm.remarks,
                GSTEnabled: orderForm.GSTEnabled,
                GSTAmount: orderForm.GSTAmount,
            };

            // Add payment mode specific details
            if (orderForm.paymentMode === 'Lumpsum' && orderForm.lumpsumDetails) {
                dataToSend.lumpsumDetails = {
                    registrationDate: new Date(orderForm.lumpsumDetails.registrationDate).toISOString(),
                    registrationAmount: orderForm.lumpsumDetails.registrationAmount,
                    totalReceived: orderForm.lumpsumDetails.totalReceived,
                    paymentType: orderForm.lumpsumDetails.paymentType,
                };
            } else if (orderForm.paymentMode === 'Loan' && orderForm.loanDetails) {
                dataToSend.loanDetails = {
                    loanPartner: orderForm.loanDetails.loanPartner,
                    loanAmount: orderForm.loanDetails.loanAmount,
                    disbursementAmount: orderForm.loanDetails.disbursementAmount,
                    firstEmiDate: new Date(orderForm.loanDetails.firstEmiDate).toISOString(),
                };
            } else if (orderForm.paymentMode === 'Subscription' && orderForm.subscriptionDetails) {
                dataToSend.subscriptionDetails = {
                    gateway: orderForm.subscriptionDetails.gateway,
                    installmentAmount: orderForm.subscriptionDetails.installmentAmount,
                    firstInstallmentDate: new Date(orderForm.subscriptionDetails.firstInstallmentDate).toISOString(),
                    lastInstallmentDate: new Date(orderForm.subscriptionDetails.lastInstallmentDate).toISOString(),
                    numberOfInstallments: orderForm.subscriptionDetails.numberOfInstallments,
                };
            }

            await postDataHandlerWithToken("Order", dataToSend);

            toast({
                title: "Success",
                description: "Order created successfully",
            });

            resetForm();
            setCreateModalOpen(false);
            fetchOrders();
        } catch (error: any) {
            console.log(error);
            toast({
                title: "Error",
                description: error?.message || "Failed to create order",
                variant: "destructive",
            });
        } finally {
            setAddingOrder(false);
        }
    };

    // Update order
    const handleUpdateOrder = async () => {
        if (!selectedOrder) return;

        try {
            setUpdatingOrder(true);

            const finalFee = calculateFinalFee();
            const dataToSend: any = {
                mobile: orderForm.mobile,
                email: orderForm.email,
                studentName: orderForm.studentName,
                fatherName: orderForm.fatherName,
                dob: orderForm.dob ? new Date(orderForm.dob).toISOString() : new Date().toISOString(),
                education: orderForm.education,
                address: orderForm.address,
                city: orderForm.city,
                state: orderForm.state,
                courseVertical: orderForm.courseVertical,
                courseName: orderForm.courseName,
                courseDuration: orderForm.courseDuration,
                totalFee: orderForm.totalFee,
                discount: orderForm.discount,
                finalFee: finalFee,
                paymentMode: orderForm.paymentMode,
                orderDate: new Date(orderForm.orderDate).toISOString(),
                feeDepositDate: new Date(orderForm.feeDepositDate).toISOString(),
                remarks: orderForm.remarks,
                GSTEnabled: orderForm.GSTEnabled,
                GSTAmount: orderForm.GSTAmount,
            };
            const endpoint = ApiConfig.updateOrder(selectedOrder._id);
            await patchTokenDataHandler(endpoint, dataToSend, true);

            toast({
                title: "Success",
                description: "Order updated successfully",
            });

            setEditModalOpen(false);
            fetchOrders();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update order",
                variant: "destructive",
            });
        } finally {
            setUpdatingOrder(false);
        }
    };

    // Approve order
    const handleApproveOrder = async (orderId: string, currentApprovalStatus: boolean) => {
        try {
            setApprovingOrder(true);
            const endpoint = ApiConfig.toggleOrder(orderId);
            await patchTokenDataHandler(endpoint, null, true);

            toast({
                title: "Success",
                description: `Order ${!currentApprovalStatus ? 'approved' : 'unapproved'} successfully`,
            });

            fetchOrders();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update order approval status",
                variant: "destructive",
            });
        } finally {
            setApprovingOrder(false);
        }
    };

    // Create payment link
    const handleCreatePaymentLink = async () => {
        if (!selectedOrder) return;

        try {
            setPaymentLoading(true);

            let endpoint = ApiConfig.createPaymentLink;
            let data: any = {
                name: selectedOrder.studentName,
                email: selectedOrder.email,
                phone: selectedOrder.mobile,
                amount: paymentAmount,
                orderId: selectedOrder._id,
            };

            // Add payment type for lumpsum
            if (selectedOrder.paymentMode === 'Lumpsum') {
                data.paymentType = paymentType;
            }

            // If subscription, use subscription endpoint
            if (selectedOrder.paymentMode === 'Subscription' && selectedOrder.subscriptionDetails) {
                endpoint = ApiConfig.createSubscription;
                data = {
                    name: selectedOrder.studentName,
                    email: selectedOrder.email,
                    phone: selectedOrder.mobile,
                    orderId: selectedOrder._id,
                    amount: paymentAmount,
                    installmentAmount: selectedOrder.subscriptionDetails.installmentAmount,
                    numberOfInstallments: selectedOrder.subscriptionDetails.numberOfInstallments,
                };
            }

            const response = await postDataHandlerWithToken(endpoint, data, true);

            if (response?.paymentLink || response?.authLink) {
                const paymentLink = response.paymentLink || response.authLink;
                setGeneratedLink(paymentLink);
                setPaymentModalOpen(false);
                setGeneratedLinkModalOpen(true);
                toast({
                    title: "Success",
                    description: "Payment link generated successfully",
                });
                setPaymentType('UPI');
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.message || "Failed to create payment link",
                variant: "destructive",
            });
        } finally {
            setPaymentLoading(false);
        }
    };

    // Get max amount for payment
    const getMaxAmount = () => {
        if (!selectedOrder) return 0;

        if (selectedOrder.paymentMode === 'Lumpsum' && selectedOrder.lumpsumDetails) {
            return selectedOrder.lumpsumDetails.pendingAmount;
        }

        if (selectedOrder.paymentMode === 'Subscription' && selectedOrder.subscriptionDetails) {
            return selectedOrder.subscriptionDetails.installmentAmount;
        }

        return selectedOrder.finalFee;
    };

    // Reset form
    const resetForm = () => {
        setOrderForm({
            mobile: '',
            email: '',
            studentName: '',
            fatherName: '',
            dob: '',
            education: '',
            address: '',
            city: '',
            state: '',
            courseVertical: '',
            courseName: '',
            courseDuration: '',
            totalFee: 0,
            discount: 0,
            GSTEnabled: false,
            GSTAmount: 0,
            paymentMode: 'Lumpsum',
            orderDate: new Date().toISOString().slice(0, 16),
            feeDepositDate: new Date().toISOString().slice(0, 16),
            remarks: '',
            lumpsumDetails: {
                registrationDate: new Date().toISOString().slice(0, 16),
                registrationAmount: 0,
                totalReceived: 0,
                paymentType: 'UPI'
            },
            loanDetails: {
                loanPartner: '',
                loanAmount: 0,
                disbursementAmount: 0,
                firstEmiDate: new Date().toISOString().slice(0, 16)
            },
            subscriptionDetails: {
                gateway: 'Cashfree',
                installmentAmount: 0,
                firstInstallmentDate: new Date().toISOString().slice(0, 16),
                lastInstallmentDate: new Date().toISOString().slice(0, 16),
                numberOfInstallments: 1
            }
        });
    };

    // Edit order - populate form
    const handleEditOrder = (order: OrderType) => {
        setSelectedOrder(order);
        setOrderForm({
            mobile: order.mobile,
            email: order.email,
            studentName: order.studentName,
            fatherName: order.fatherName,
            dob: order.dob ? new Date(order.dob).toISOString().slice(0, 10) : '',
            education: order.education,
            address: order.address,
            city: order.city,
            state: order.state,
            courseVertical: order.courseVertical?._id || '',
            courseName: order.courseName,
            courseDuration: order.courseDuration,
            totalFee: order.totalFee,
            discount: order.discount,
            GSTEnabled: order.GSTEnabled || false,
            GSTAmount: order.GSTAmount || 0,
            paymentMode: order.paymentMode,
            orderDate: new Date(order.orderDate).toISOString().slice(0, 16),
            feeDepositDate: new Date(order.feeDepositDate).toISOString().slice(0, 16),
            remarks: order.remarks || '',
            lumpsumDetails: order.lumpsumDetails ? {
                registrationDate: new Date(order.lumpsumDetails.registrationDate).toISOString().slice(0, 16),
                registrationAmount: order.lumpsumDetails.registrationAmount,
                totalReceived: order.lumpsumDetails.totalReceived,
                paymentType: order.lumpsumDetails.paymentType,
            } : undefined,
            loanDetails: order.loanDetails ? {
                loanPartner: order.loanDetails.loanPartner?._id || '',
                loanAmount: order.loanDetails.loanAmount,
                disbursementAmount: order.loanDetails.disbursementAmount,
                firstEmiDate: new Date(order.loanDetails.firstEmiDate).toISOString().slice(0, 16),
            } : undefined,
            subscriptionDetails: order.subscriptionDetails ? {
                gateway: order.subscriptionDetails.gateway,
                installmentAmount: order.subscriptionDetails.installmentAmount,
                firstInstallmentDate: new Date(order.subscriptionDetails.firstInstallmentDate).toISOString().slice(0, 16),
                lastInstallmentDate: new Date(order.subscriptionDetails.lastInstallmentDate).toISOString().slice(0, 16),
                numberOfInstallments: order.subscriptionDetails.numberOfInstallments,
            } : undefined,
        });
        setEditModalOpen(true);
    };

    // View order details
    const handleViewOrder = (order: OrderType) => {
        setSelectedOrder(order);
        setViewModalOpen(true);
    };

    // Open payment modal
    const handlePaymentModal = (order: OrderType) => {
        setSelectedOrder(order);
        if (order.paymentMode === 'Lumpsum' && order.lumpsumDetails) {
            setPaymentAmount(order.lumpsumDetails.pendingAmount);
        } else if (order.paymentMode === 'Subscription' && order.subscriptionDetails) {
            setPaymentAmount(order.subscriptionDetails.installmentAmount);
        } else {
            setPaymentAmount(order.finalFee);
        }
        setPaymentType('UPI');
        setPaymentModalOpen(true);
    };

    const resetSubscriptionState = () => {
        setSubscriptionPlanId('');
        setSubscriptionSessionId('');
        setSubscriptionAuthUrl('');
    };

    // Open subscription create modal
    const openSubscriptionCreateModal = (order: OrderType) => {
        setSelectedOrder(order);
        resetSubscriptionState();
        setSubscriptionModalOpen(true);
    };

    const openSubscriptionAuthModal = (order: OrderType, sessionId: string) => {
        setSelectedOrder(order);
        resetSubscriptionState();
        setSubscriptionSessionId(sessionId);
        setSubscriptionAuthModalOpen(true);
    };

    const handleSubscriptionAction = async (order: OrderType) => {
        console.log(!!order.subscriptionDetails?.cashfreeSubscriptionId, "1")
        if (!!order.subscriptionDetails?.cashfreeSubscriptionId) {
            try {
                setSubscriptionLoading(true);
                const response = await getDataHandlerWithToken(ApiConfig.getSubscriptionByOrderId(order._id), null, null, true);
                const subscription = response?.data || response;
                const sessionId = subscription?.cashfreeSubscriptionId;

                if (!sessionId) {
                    throw new Error('Cashfree subscription ID was not found for this order.');
                }

                openSubscriptionAuthModal(order, sessionId);
            } catch (error: any) {
                toast({
                    title: 'Error',
                    description: error?.response?.data?.message || error?.message || 'Failed to load subscription details',
                    variant: 'destructive',
                });
            } finally {
                setSubscriptionLoading(false);
            }
            return;
        }

        openSubscriptionCreateModal(order);
    };

    const getCashfreeMode = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'sandbox';
        }
        return 'production';
    };

    const buildSubscriptionAuthUrl = (sessionId: string) => {
        const params = new URLSearchParams({
            session: sessionId,
            mode: getCashfreeMode(),
        });

        return `${window.location.origin}/cashfree/subscription-auth?${params.toString()}`;
    };

    const handleCreateSubscription = async () => {
        if (!selectedOrder) return;

        try {
            setSubscriptionCreating(true);

            const payload: Record<string, string> = {
                orderId: selectedOrder._id,
            };

            if (subscriptionPlanId.trim()) {
                payload.planId = subscriptionPlanId.trim();
            }

            const response = await postDataHandlerWithToken(ApiConfig.createSubscription, payload, true);
            const sessionId =
                response?.cashfreeSubscriptionId ||
                response?.subscription_session_id ||
                response?.subscriptionSessionId ||
                response?.data?.cashfreeSubscriptionId ||
                response?.data?.subscription_session_id;

            if (!sessionId) {
                throw new Error('Cashfree subscription session ID was not returned.');
            }

            setSubscriptionSessionId(sessionId);
            setSubscriptionAuthUrl('');
            setSubscriptionModalOpen(false);
            setSubscriptionAuthModalOpen(true);

            toast({
                title: 'Success',
                description: 'Subscription created successfully. Generate the auth link to continue.',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.response?.data?.message || error?.message || 'Failed to create subscription',
                variant: 'destructive',
            });
        } finally {
            setSubscriptionCreating(false);
        }
    };

    const handleGenerateSubscriptionAuthLink = async () => {
        if (!subscriptionSessionId) return;

        try {
            setSubscriptionAuthUrl(buildSubscriptionAuthUrl(subscriptionSessionId));
            toast({
                title: 'Success',
                description: 'Subscription auth link generated.',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error?.message || 'Failed to generate auth link',
                variant: 'destructive',
            });
        }
    };

    // Open payment history modal
    const handlePaymentHistory = async (order: OrderType) => {
        setSelectedOrder(order);
        await fetchPaymentHistory(order._id);
        setPaymentHistoryModalOpen(true);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Format datetime
    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    // Get status badge
    const getStatusBadge = (status: string, approved: boolean) => {
        if (!approved) {
            return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Approval</Badge>;
        }

        switch (status) {
            case 'Fully Paid':
                return <Badge className="bg-green-100 text-green-700 border-green-200">Fully Paid</Badge>;
            case 'Partially Paid':
                return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">Partially Paid</Badge>;
            case 'Pending':
                return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">Pending</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            search: '',
            paymentMode: 'all',
            status: 'all',
            dateFilter: 'all',
            fromDate: '',
            toDate: '',
            counsellorId: 'all',
            groupFilter: false,
            page: 1,
            limit: 10
        });
    };

    return (
        <div className="space-y-4 md:space-y-6 p-2 md:p-0">
            {/* Header */}
           {/* Header */}
<div className="flex justify-between items-center">
    <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Order Management
        </h1>
        <p className="text-slate-500 mt-1">
            Manage and track all orders
        </p>
    </div>
    <div className="flex items-center gap-2">
        {/* Additional action buttons – styled as outline */}
        {hasPermission(permissions, 'orders', 'read_payment_history') && (
            <Button
                variant="outline"
                onClick={() => navigate('/bd/payments')}
                className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl"
            >
                <History className="w-4 h-4 mr-2" />
                Payment History
            </Button>
        )}
        {hasPermission(permissions, 'orders', 'read_loans') && (
            <Button
                variant="outline"
                onClick={() => navigate('/bd/loan-management')}
                className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl"
            >
                <Users className="w-4 h-4 mr-2" />
                Loan Management
            </Button>
        )}
        {/* Primary action button */}
        {hasPermission(permissions, 'orders', 'create') && (
            <Button
                onClick={() => {
                    resetForm();
                    setCreateModalOpen(true);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-5 py-2"
            >
                <Plus className="w-4 h-4 mr-2" />
                Create Order
            </Button>
        )}
    </div>
</div>
            {/* Group Toggle */}
<div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
    <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => handleFilterChange('groupFilter', !filters.groupFilter)}
    >
        <div
            className={`w-4 h-4 rounded border ${
                filters.groupFilter ? 'bg-orange-600 border-orange-600' : 'border-slate-300'
            } flex items-center justify-center transition-all`}
        >
            {filters.groupFilter && <div className="w-2 h-2 bg-white rounded-sm" />}
        </div>
        <span className="text-sm font-medium text-slate-700">Groups</span>
    </div>
</div>

            {/* Filters Header */}
<div className="flex justify-between items-center">
  <Button
    variant="outline"
    onClick={() => setShowFilters(!showFilters)}
    className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl"
  >
    <Filter className="w-4 h-4 mr-2" />
    {showFilters ? 'Hide Filters' : 'Show Filters'}
    {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
  </Button>
  <Button variant="ghost" onClick={resetFilters} className="text-slate-500 hover:text-slate-700 rounded-xl">
    <RefreshCw className="w-4 h-4 mr-2" />
    Reset
  </Button>
</div>

{/* Filters Panel */}
{showFilters && (
  <Card className="p-5 bg-white border-0 shadow-sm">
    {/* First row – 4 columns */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Search */}
      <div>
        <Label className="text-xs font-semibold text-slate-500 uppercase">Search</Label>
        <div className="relative mt-1.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, phone..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-9 rounded-xl border-slate-200"
          />
        </div>
      </div>

      {/* Payment Mode */}
      <div>
        <Label className="text-xs font-semibold text-slate-500 uppercase">Payment Mode</Label>
        <Select
          value={filters.paymentMode}
          onValueChange={(value) => handleFilterChange('paymentMode', value)}
        >
          <SelectTrigger className="mt-1.5 rounded-xl">
            <SelectValue placeholder="All Modes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Lumpsum">Lumpsum</SelectItem>
            <SelectItem value="Loan">Loan</SelectItem>
            <SelectItem value="Subscription">Subscription</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div>
        <Label className="text-xs font-semibold text-slate-500 uppercase">Status</Label>
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="mt-1.5 rounded-xl">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Fully Paid">Fully Paid</SelectItem>
            <SelectItem value="Partially Paid">Partially Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Filter */}
      <div>
        <Label className="text-xs font-semibold text-slate-500 uppercase">Date</Label>
        <Select
          value={filters.dateFilter}
          onValueChange={(value) => handleFilterChange('dateFilter', value)}
        >
          <SelectTrigger className="mt-1.5 rounded-xl">
            <SelectValue placeholder="Select" />
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
    </div>

    {/* Custom Date Range (only when "custom" is selected) */}
    {filters.dateFilter === 'custom' && (
      <div className="grid grid-cols-2 gap-4 mt-4">
        <Input
          type="date"
          placeholder="From"
          value={filters.fromDate}
          onChange={(e) => handleFilterChange('fromDate', e.target.value)}
          className="rounded-xl"
        />
        <Input
          type="date"
          placeholder="To"
          value={filters.toDate}
          onChange={(e) => handleFilterChange('toDate', e.target.value)}
          className="rounded-xl"
        />
      </div>
    )}

    {/* Counsellor Filter (only when grouped view is active) */}
    {filters.groupFilter && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <Label className="text-xs font-semibold text-slate-500 uppercase">Counsellor</Label>
          <SearchableDropdown
            options={[
              { value: 'all', label: 'All Counsellors' },
              ...counsellors.filter(user => user.status == "active").map(counsellor => ({
                value: counsellor._id,
                label: counsellor.name,
                empId: counsellor.employeeId
              }))
            ]}
            value={filters.counsellorId}
            onValueChange={(value) => handleFilterChange('counsellorId', value)}
            placeholder="Select counsellor"
            searchPlaceholder="Search by name, email or ID..."
            emptyMessage="No counsellors found"
            disabled={loadingCounsellors}
            className="mt-1.5"
          />
        </div>
      </div>
    )}
  </Card>
)}

          {/* Orders Table */}
<Card className="bg-white border-0 shadow-sm overflow-hidden">
  {/* Table Header with Title & Pagination */}
<div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
    <h2 className="font-semibold text-slate-800">Order Records</h2>
    <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>Page {filters.page} of {totalPages}</span>
        <div className="flex gap-1">
            <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                disabled={filters.page === 1 || loading}
                className="h-8 w-8 p-0 rounded-lg"
            >
                <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('page', Math.min(totalPages, filters.page + 1))}
                disabled={filters.page === totalPages || loading}
                className="h-8 w-8 p-0 rounded-lg"
            >
                <ChevronRight className="w-4 h-4" />
            </Button>
        </div>
        <Select
            value={filters.limit.toString()}
            onValueChange={v => handleFilterChange('limit', parseInt(v))}
        >
            <SelectTrigger className="w-20 h-8 text-sm rounded-lg">
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

  {/* Table Content */}
  {loading ? (
    <div className="py-16 text-center">
      <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-400" />
      <p className="mt-3 text-slate-500">Loading orders...</p>
    </div>
  ) : orders.length === 0 ? (
    <div className="py-16 text-center">
      <DollarSign className="w-12 h-12 mx-auto text-slate-300" />
      <h3 className="mt-3 text-base font-medium text-slate-700">No orders found</h3>
      <p className="text-sm text-slate-400">Adjust filters or create a new order</p>
    </div>
  ) : (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 border-b border-slate-100">
            <TableHead className="text-xs font-semibold text-slate-500 uppercase">Order ID</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 uppercase">Student</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 uppercase">Course</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 uppercase">Amount</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 uppercase">Payment Mode</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 uppercase">Status</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 uppercase">Approval</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 uppercase">Order Date</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 uppercase">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order._id}
              className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors"
            >
              <TableCell className="py-3">
                <span className="font-mono text-sm text-slate-600">{order._id.slice(-8)}</span>
              </TableCell>
              <TableCell>
                <div className="font-medium text-slate-800 text-sm">{order.studentName}</div>
                <div className="text-xs text-slate-400">{order.mobile}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-slate-700">{order.courseName}</div>
                <div className="text-xs text-slate-400">{order.courseDuration} days</div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-slate-800 text-sm">{formatCurrency(order.finalFee)}</div>
                {order.discount > 0 && (
                  <div className="text-xs text-slate-400 line-through">{formatCurrency(order.totalFee)}</div>
                )}
                {order.GSTEnabled && order.GSTAmount && (
                  <div className="text-xs text-slate-400">+GST: {formatCurrency(order.GSTAmount)}</div>
                )}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">
                  {order.paymentMode}
                </span>
              </TableCell>
              <TableCell>
                {getStatusBadge(order.status, order.Approved)}
              </TableCell>
              <TableCell>
                {order.Approved ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                    <XCircle className="w-3 h-3" />
                    Pending
                  </span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-slate-600">
                {formatDate(order.orderDate)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewOrder(order)}
                    className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4 text-slate-400" />
                  </Button>
                  {hasPermission(permissions, 'orders', 'read_loans') && !order.Approved && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditOrder(order)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
                      title="Edit Order"
                    >
                      <Edit className="w-4 h-4 text-slate-400" />
                    </Button>
                  )}
                  {hasPermission(permissions, 'orders', 'approve') && !order.Approved && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApproveOrder(order._id, order.Approved)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
                      title="Approve Order"
                      disabled={approvingOrder}
                    >
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                    </Button>
                  )}
                  {order.Approved && order.paymentMode === 'Subscription' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSubscriptionAction(order)}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
                      title={order.subscriptionDetails?.cashfreeSubscriptionId?.trim() ? "Get Auth Link" : "Create Subscription"}
                      disabled={subscriptionLoading}
                    >
                      {order.subscriptionDetails?.cashfreeSubscriptionId?.trim() ? (
                        <ExternalLink className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Receipt className="w-4 h-4 text-blue-500" />
                      )}
                    </Button>
                  )}
                  {hasPermission(permissions, 'orders', 'payment_link_generator') &&
                    order.paymentMode === 'Lumpsum' && order.Approved && order.status !== 'Fully Paid' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePaymentModal(order)}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
                        title="Generate Payment Link"
                      >
                        <CreditCard className="w-4 h-4 text-slate-400" />
                      </Button>
                  )}
                  {hasPermission(permissions, 'orders', 'read_payment_history') &&
                    order.paymentMode === 'Lumpsum' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePaymentHistory(order)}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
                        title="View Payment History"
                      >
                        <Receipt className="w-4 h-4 text-slate-400" />
                      </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )}

  {/* Footer Pagination */}
<div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center text-sm text-slate-500">
    <span>
        Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, totalOrders)} of {totalOrders}
    </span>
    <div className="flex gap-2">
        <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))} 
            disabled={filters.page === 1 || loading} 
            className="rounded-lg"
        >
            Previous
        </Button>
        <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleFilterChange('page', Math.min(totalPages, filters.page + 1))} 
            disabled={filters.page === totalPages || loading} 
            className="rounded-lg"
        >
            Next
        </Button>
    </div>
</div>
</Card>

           {/* Create Order Modal */}
<Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
  <DialogContent className="rounded-2xl max-w-4xl max-h-[90vh] overflow-y-auto 
    [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
    
    <DialogHeader>
      <DialogTitle className="text-xl">Create New Order</DialogTitle>
      <DialogDescription>Fill in the details to create a new order</DialogDescription>
    </DialogHeader>

    <div className="space-y-6 py-2">
      {/* Student Information */}
      <div className="bg-white border-0 shadow-sm rounded-xl p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Student Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Student Name *</Label>
            <div className="relative mt-1.5">
              <Input
                value={orderForm.studentName}
                onChange={(e) => {
                  const value = e.target.value;
                  setOrderForm({ ...orderForm, studentName: value });
                  if (value.length > 0) {
                    const filteredLeads = leads.filter(lead =>
                      lead.name.toLowerCase().includes(value.toLowerCase()) ||
                      lead.phone.includes(value) ||
                      lead.leadId.toString().includes(value)
                    );
                    setFilteredLeads(filteredLeads.slice(0, 5));
                    setShowLeadSuggestions(true);
                  } else {
                    setShowLeadSuggestions(false);
                  }
                }}
                onFocus={() => {
                  if (orderForm.studentName.length > 0) {
                    const filteredLeads = leads.filter(lead =>
                      lead.name.toLowerCase().includes(orderForm.studentName.toLowerCase()) ||
                      lead.phone.includes(orderForm.studentName) ||
                      lead.leadId.toString().includes(orderForm.studentName)
                    );
                    setFilteredLeads(filteredLeads.slice(0, 5));
                    setShowLeadSuggestions(true);
                  }
                }}
                placeholder="Type student name to search leads..."
                className="rounded-xl border-slate-200"
              />
              {showLeadSuggestions && filteredLeads.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead._id}
                      className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                      onClick={() => {
                        handleLeadSelectFromSearch(lead);
                        setShowLeadSuggestions(false);
                        setFilteredLeads([]);
                      }}
                    >
                      <div className="font-medium text-sm">{lead.name}</div>
                      <div className="text-xs text-slate-400">{lead.phone} | ID: {lead.leadId}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Father's Name</Label>
            <Input
              value={orderForm.fatherName}
              onChange={(e) => setOrderForm({ ...orderForm, fatherName: e.target.value })}
              placeholder="Enter father's name"
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Mobile Number *</Label>
            <Input
              value={orderForm.mobile}
              onChange={(e) => setOrderForm({ ...orderForm, mobile: e.target.value })}
              placeholder="Enter mobile number"
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Email *</Label>
            <Input
              type="email"
              value={orderForm.email}
              onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
              placeholder="Enter email address"
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Date of Birth</Label>
            <Input
              type="date"
              value={orderForm.dob}
              onChange={(e) => setOrderForm({ ...orderForm, dob: e.target.value })}
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Education</Label>
            <Input
              value={orderForm.education}
              onChange={(e) => setOrderForm({ ...orderForm, education: e.target.value })}
              placeholder="Enter education qualification"
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Address</Label>
            <Input
              value={orderForm.address}
              onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
              placeholder="Enter address"
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">City</Label>
            <Input
              value={orderForm.city}
              onChange={(e) => setOrderForm({ ...orderForm, city: e.target.value })}
              placeholder="Enter city"
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">State</Label>
            <Input
              value={orderForm.state}
              onChange={(e) => setOrderForm({ ...orderForm, state: e.target.value })}
              placeholder="Enter state"
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Course Information */}
      <div className="bg-white border-0 shadow-sm rounded-xl p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Course Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Pool (Course Vertical)</Label>
            <Select
              value={orderForm.courseVertical}
              onValueChange={(value) => setOrderForm({ ...orderForm, courseVertical: value })}
            >
              <SelectTrigger className="mt-1.5 rounded-xl">
                <SelectValue placeholder="Select pool" />
              </SelectTrigger>
              <SelectContent>
                {pools.map((pool) => (
                  <SelectItem key={pool._id} value={pool._id}>{pool.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Select Course *</Label>
            <div className="relative mt-1.5">
              <Input
                value={orderForm.courseName}
                onChange={(e) => {
                  const value = e.target.value;
                  setOrderForm({ ...orderForm, courseName: value });
                  if (value.length > 0) {
                    const filteredCourses = courses.filter(course =>
                      course.courseName.toLowerCase().includes(value.toLowerCase())
                    );
                    setFilteredCourses(filteredCourses.slice(0, 5));
                    setShowCourseSuggestions(true);
                  } else {
                    setShowCourseSuggestions(false);
                  }
                }}
                onFocus={() => {
                  if (orderForm.courseName.length > 0) {
                    const filteredCourses = courses.filter(course =>
                      course.courseName.toLowerCase().includes(orderForm.courseName.toLowerCase())
                    );
                    setFilteredCourses(filteredCourses.slice(0, 5));
                    setShowCourseSuggestions(true);
                  }
                }}
                placeholder="Type course name to search..."
                className="rounded-xl border-slate-200"
              />
              {showCourseSuggestions && filteredCourses.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredCourses.map((course) => (
                    <div
                      key={course._id}
                      className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                      onClick={() => {
                        handleCourseSelectFromSearch(course);
                        setShowCourseSuggestions(false);
                        setFilteredCourses([]);
                      }}
                    >
                      <div className="font-medium text-sm">{course.courseName}</div>
                      <div className="text-xs text-slate-400">
                        Duration: {course.courseDuration} days | Fee: {formatCurrency(course.totalFee)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Course Name</Label>
            <Input
              value={orderForm.courseName}
              onChange={(e) => setOrderForm({ ...orderForm, courseName: e.target.value })}
              placeholder="Course name"
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Course Duration (days)</Label>
            <Input
              value={orderForm.courseDuration}
              onChange={(e) => setOrderForm({ ...orderForm, courseDuration: e.target.value })}
              placeholder="Duration in days"
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Total Fee *</Label>
            <Input
              type="number"
              value={orderForm.totalFee}
              onChange={(e) => setOrderForm({ ...orderForm, totalFee: parseInt(e.target.value) || 0 })}
              placeholder="Total fee amount"
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Discount</Label>
            <Input
              type="number"
              value={orderForm.discount}
              onChange={(e) => setOrderForm({ ...orderForm, discount: parseInt(e.target.value) || 0 })}
              placeholder="Discount amount"
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
        </div>

        {/* GST Section */}
        <div className="border-t border-slate-100 mt-4 pt-4">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setOrderForm({ ...orderForm, GSTEnabled: !orderForm.GSTEnabled })}
            >
              <div className={`w-4 h-4 rounded border ${orderForm.GSTEnabled ? 'bg-orange-600 border-orange-600' : 'border-slate-300'} flex items-center justify-center transition-all`}>
                {orderForm.GSTEnabled && <div className="w-2 h-2 bg-white rounded-sm" />}
              </div>
              <span className="text-sm font-medium text-slate-700">Enable GST</span>
            </div>
          </div>
          {orderForm.GSTEnabled && (
            <div className="mt-3">
              <Label className="text-xs font-semibold text-slate-500 uppercase">GST Amount</Label>
              <Input
                type="number"
                value={orderForm.GSTAmount}
                onChange={(e) => setOrderForm({ ...orderForm, GSTAmount: parseInt(e.target.value) || 0 })}
                placeholder="Enter GST amount"
                className="mt-1.5 rounded-xl border-slate-200"
              />
              <p className="text-xs text-slate-400 mt-1">
                This amount will be added to the final fee
              </p>
            </div>
          )}
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mt-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Final Fee</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(calculateFinalFee())}</p>
          {orderForm.GSTEnabled && orderForm.GSTAmount && (
            <p className="text-xs text-slate-400 mt-1">Including GST: {formatCurrency(orderForm.GSTAmount)}</p>
          )}
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-white border-0 shadow-sm rounded-xl p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Payment Information</h3>
        <div>
          <Label className="text-xs font-semibold text-slate-500 uppercase">Payment Mode *</Label>
          <Select
            value={orderForm.paymentMode}
            onValueChange={(value) => setOrderForm({ ...orderForm, paymentMode: value })}
          >
            <SelectTrigger className="mt-1.5 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Lumpsum">Lumpsum</SelectItem>
              <SelectItem value="Loan">Loan</SelectItem>
              <SelectItem value="Subscription">Subscription</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {orderForm.paymentMode === 'Lumpsum' && orderForm.lumpsumDetails && (
          <div className="border-t border-slate-100 mt-4 pt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Lumpsum Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Registration Date</Label>
                <Input
                  type="datetime-local"
                  value={orderForm.lumpsumDetails.registrationDate}
                  onChange={(e) => setOrderForm({
                    ...orderForm,
                    lumpsumDetails: { ...orderForm.lumpsumDetails!, registrationDate: e.target.value }
                  })}
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Registration Amount</Label>
                <Input
                  type="number"
                  value={orderForm.lumpsumDetails.registrationAmount}
                  onChange={(e) => {
                    const registrationAmount = parseInt(e.target.value) || 0;
                    setOrderForm({
                      ...orderForm,
                      lumpsumDetails: { 
                        ...orderForm.lumpsumDetails!, 
                        registrationAmount: registrationAmount,
                        // Auto-populate totalReceived with registrationAmount
                        totalReceived: registrationAmount
                      }
                    });
                  }}
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Total Received</Label>
                <Input
                  type="number"
                  value={orderForm.lumpsumDetails.totalReceived}
                  onChange={(e) => setOrderForm({
                    ...orderForm,
                    lumpsumDetails: { ...orderForm.lumpsumDetails!, totalReceived: parseInt(e.target.value) || 0 }
                  })}
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Payment Type</Label>
                <Select
                  value={orderForm.lumpsumDetails.paymentType}
                  onValueChange={(value) => setOrderForm({
                    ...orderForm,
                    lumpsumDetails: { ...orderForm.lumpsumDetails!, paymentType: value }
                  })}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Net Banking">Net Banking</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {orderForm.paymentMode === 'Loan' && orderForm.loanDetails && (
          <div className="border-t border-slate-100 mt-4 pt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Loan Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Loan Partner *</Label>
                <Select
                  value={orderForm.loanDetails.loanPartner}
                  onValueChange={(value) => setOrderForm({
                    ...orderForm,
                    loanDetails: { ...orderForm.loanDetails!, loanPartner: value }
                  })}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <SelectValue placeholder="Select loan partner" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingLoanPartners ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : loanPartners.length === 0 ? (
                      <div className="px-2 py-2 text-sm text-slate-400">No loan partners available</div>
                    ) : (
                      loanPartners.filter(partner => partner.isActive).map((partner) => (
                        <SelectItem key={partner._id} value={partner._id}>
                          {partner.name}
                          <span className="ml-2 text-xs text-slate-400">
                            Type: {partner.type} | Charge: {partner.submissionCharge}%
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Loan Amount</Label>
                <Input
                  type="number"
                  value={orderForm.loanDetails.loanAmount}
                  onChange={(e) => setOrderForm({
                    ...orderForm,
                    loanDetails: { ...orderForm.loanDetails!, loanAmount: parseInt(e.target.value) || 0 }
                  })}
                  placeholder="Enter loan amount"
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Disbursement Amount *</Label>
                <Input
                  type="number"
                  value={orderForm.loanDetails.disbursementAmount}
                  onChange={(e) => setOrderForm({
                    ...orderForm,
                    loanDetails: { ...orderForm.loanDetails!, disbursementAmount: parseInt(e.target.value) || 0 }
                  })}
                  placeholder="Enter disbursement amount (required)"
                  className="mt-1.5 rounded-xl border-slate-200"
                  required
                />
                {(!orderForm.loanDetails.disbursementAmount || orderForm.loanDetails.disbursementAmount === 0) && (
                  <p className="text-xs text-red-500 mt-1">Disbursement amount is required</p>
                )}
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">First EMI Date</Label>
                <Input
                  type="datetime-local"
                  value={orderForm.loanDetails.firstEmiDate}
                  onChange={(e) => setOrderForm({
                    ...orderForm,
                    loanDetails: { ...orderForm.loanDetails!, firstEmiDate: e.target.value }
                  })}
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
            </div>
          </div>
        )}

        {orderForm.paymentMode === 'Subscription' && orderForm.subscriptionDetails && (
          <div className="border-t border-slate-100 mt-4 pt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Subscription Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Gateway</Label>
                <Select
                  value={orderForm.subscriptionDetails.gateway}
                  onValueChange={(value) => setOrderForm({
                    ...orderForm,
                    subscriptionDetails: { ...orderForm.subscriptionDetails!, gateway: value }
                  })}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cashfree">Cashfree</SelectItem>
                    <SelectItem value="Razorpay">Razorpay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Installment Amount</Label>
                <Input
                  type="number"
                  value={orderForm.subscriptionDetails.installmentAmount}
                  onChange={(e) => setOrderForm({
                    ...orderForm,
                    subscriptionDetails: { ...orderForm.subscriptionDetails!, installmentAmount: parseInt(e.target.value) || 0 }
                  })}
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Number of Installments</Label>
                <Input
                  type="number"
                  value={orderForm.subscriptionDetails.numberOfInstallments}
                  onChange={(e) => setOrderForm({
                    ...orderForm,
                    subscriptionDetails: { ...orderForm.subscriptionDetails!, numberOfInstallments: parseInt(e.target.value) || 1 }
                  })}
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">First Installment Date</Label>
                <Input
                  type="datetime-local"
                  value={orderForm.subscriptionDetails.firstInstallmentDate}
                  onChange={(e) => setOrderForm({
                    ...orderForm,
                    subscriptionDetails: { ...orderForm.subscriptionDetails!, firstInstallmentDate: e.target.value }
                  })}
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-500 uppercase">Last Installment Date</Label>
                <Input
                  type="datetime-local"
                  value={orderForm.subscriptionDetails.lastInstallmentDate}
                  onChange={(e) => setOrderForm({
                    ...orderForm,
                    subscriptionDetails: { ...orderForm.subscriptionDetails!, lastInstallmentDate: e.target.value }
                  })}
                  className="mt-1.5 rounded-xl border-slate-200"
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Order Date</Label>
            <Input
              type="datetime-local"
              value={orderForm.orderDate}
              onChange={(e) => setOrderForm({ ...orderForm, orderDate: e.target.value })}
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
        </div>

        <div className="mt-4">
          <Label className="text-xs font-semibold text-slate-500 uppercase">Remarks</Label>
          <Textarea
            value={orderForm.remarks}
            onChange={(e) => setOrderForm({ ...orderForm, remarks: e.target.value })}
            placeholder="Add any remarks or notes..."
            rows={3}
            className="mt-1.5 rounded-xl border-slate-200"
          />
        </div>
      </div>
    </div>

    <DialogFooter className="pt-4 border-t border-slate-100">
      <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={addingOrder} className="rounded-xl">
        Cancel
      </Button>
      <Button 
        onClick={handleCreateOrder} 
        disabled={addingOrder || (orderForm.paymentMode === 'Loan' && (!orderForm.loanDetails?.disbursementAmount || orderForm.loanDetails?.disbursementAmount === 0))} 
        className="bg-orange-600 hover:bg-orange-700 rounded-xl"
      >
        {addingOrder ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          'Create Order'
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

            {/* View Order Modal */}
<Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
  <DialogContent className="rounded-2xl max-w-4xl max-h-[80vh] overflow-y-auto 
    [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
    
    <DialogHeader>
      <DialogTitle className="text-xl">Order Details</DialogTitle>
      <DialogDescription>Complete information about the order</DialogDescription>
    </DialogHeader>

    {selectedOrder && (
      <div className="space-y-5">
        {/* Order Summary Header (simple key-value rows) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Order ID</p>
            <p className="mt-1 font-mono text-sm text-slate-800">{selectedOrder._id}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Order Date</p>
            <p className="mt-1 text-slate-800">{formatDate(selectedOrder.orderDate)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Payment Status</p>
            <p className="mt-1">
              {selectedOrder.status === 'Fully Paid' ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="w-3 h-3" />Fully Paid</span>
              ) : selectedOrder.status === 'Partially Paid' ? (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600"><Clock className="w-3 h-3" />Partially Paid</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-red-600"><XCircle className="w-3 h-3" />Pending</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Payment Mode</p>
            <p className="mt-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">
                {selectedOrder.paymentMode}
              </span>
            </p>
          </div>
        </div>

        {/* Sections: Student, Course, Payment, Additional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Student Information */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h3 className="text-base font-semibold text-slate-800 mb-4">Student Information</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Full Name</p>
                  <p className="text-sm text-slate-800 mt-1">{selectedOrder.studentName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Father's Name</p>
                  <p className="text-sm text-slate-800 mt-1">{selectedOrder.fatherName || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Mobile Number</p>
                  <p className="text-sm font-mono text-slate-800 mt-1">{selectedOrder.mobile}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Email Address</p>
                  <p className="text-sm text-slate-800 truncate mt-1">{selectedOrder.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Date of Birth</p>
                  <p className="text-sm text-slate-800 mt-1">{formatDate(selectedOrder.dob) || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Education</p>
                  <p className="text-sm text-slate-800 mt-1">{selectedOrder.education || '—'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Address</p>
                <p className="text-sm text-slate-800 mt-1">
                  {selectedOrder.address}, {selectedOrder.city}, {selectedOrder.state}
                </p>
              </div>
            </div>
          </div>

          {/* Course Information */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h3 className="text-base font-semibold text-slate-800 mb-4">Course Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Course Name</p>
                <p className="text-sm text-slate-800 mt-1">{selectedOrder.courseName}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Duration</p>
                  <p className="text-sm text-slate-800 mt-1">{selectedOrder.courseDuration} days</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Course Vertical</p>
                  <p className="text-sm text-slate-800 mt-1">{selectedOrder.courseVertical?.name || '—'}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Fee</span>
                  <span className="text-slate-800">{formatCurrency(selectedOrder.totalFee)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 mt-2">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                {selectedOrder.GSTEnabled && selectedOrder.GSTAmount && (
                  <div className="flex justify-between text-sm text-blue-600 mt-2">
                    <span>GST</span>
                    <span>+{formatCurrency(selectedOrder.GSTAmount)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 mt-3 pt-3 flex justify-between font-semibold">
                  <span className="text-slate-700">Final Fee</span>
                  <span className="text-slate-800 text-lg">{formatCurrency(selectedOrder.finalFee)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h3 className="text-base font-semibold text-slate-800 mb-4">Payment Details</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Order Date</p>
                  <p className="text-sm text-slate-800 mt-1">{formatDate(selectedOrder.orderDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Fee Deposit Date</p>
                  <p className="text-sm text-slate-800 mt-1">{formatDate(selectedOrder.feeDepositDate)}</p>
                </div>
              </div>

              {selectedOrder.lumpsumDetails && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Lumpsum Details</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-500">Registration Date:</span>
                      <span className="ml-1 text-slate-800">{formatDate(selectedOrder.lumpsumDetails.registrationDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Registration Amount:</span>
                      <span className="ml-1 text-slate-800">{formatCurrency(selectedOrder.lumpsumDetails.registrationAmount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Total Received:</span>
                      <span className="ml-1 text-slate-800">{formatCurrency(selectedOrder.lumpsumDetails.totalReceived)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Pending Amount:</span>
                      <span className="ml-1 text-orange-600">{formatCurrency(selectedOrder.lumpsumDetails.pendingAmount)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">Payment Type:</span>
                      <span className="ml-1 text-slate-800">{selectedOrder.lumpsumDetails.paymentType}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedOrder.loanDetails && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Loan Details</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Loan Partner:</span>
                      <span className="text-slate-800">{selectedOrder.loanDetails.loanPartner?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Loan Amount:</span>
                      <span className="text-slate-800">{formatCurrency(selectedOrder.loanDetails.loanAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Disbursement Amount:</span>
                      <span className="text-slate-800">{formatCurrency(selectedOrder.loanDetails.disbursementAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">First EMI Date:</span>
                      <span className="text-slate-800">{formatDate(selectedOrder.loanDetails.firstEmiDate)}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedOrder.subscriptionDetails && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Subscription Details</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-500">Gateway:</span>
                      <span className="ml-1 text-slate-800">{selectedOrder.subscriptionDetails.gateway}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Installment Amount:</span>
                      <span className="ml-1 text-slate-800">{formatCurrency(selectedOrder.subscriptionDetails.installmentAmount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">No. of Installments:</span>
                      <span className="ml-1 text-slate-800">{selectedOrder.subscriptionDetails.numberOfInstallments}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">First Installment:</span>
                      <span className="ml-1 text-slate-800">{formatDate(selectedOrder.subscriptionDetails.firstInstallmentDate)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">Last Installment:</span>
                      <span className="ml-1 text-slate-800">{formatDate(selectedOrder.subscriptionDetails.lastInstallmentDate)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h3 className="text-base font-semibold text-slate-800 mb-4">Additional Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Counsellor</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                    <Users className="w-3 h-3 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{selectedOrder.counsellorName}</p>
                    <p className="text-xs text-slate-400">{selectedOrder.counsellorId?.email}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Created At</p>
                  <p className="text-sm text-slate-800 mt-1">{formatDate(selectedOrder.createdAt)}</p>
                  <p className="text-xs text-slate-400">{format(new Date(selectedOrder.createdAt), 'hh:mm a')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Last Updated</p>
                  <p className="text-sm text-slate-800 mt-1">{formatDate(selectedOrder.updatedAt)}</p>
                  <p className="text-xs text-slate-400">{format(new Date(selectedOrder.updatedAt), 'hh:mm a')}</p>
                </div>
              </div>

              {selectedOrder.approvedBy && (
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Approved By</p>
                  <p className="text-sm font-medium text-slate-800 mt-1">{selectedOrder.approvedBy.name}</p>
                  <p className="text-xs text-slate-400">{selectedOrder.approvedBy.email}</p>
                </div>
              )}

              {selectedOrder.remarks && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs text-amber-600 uppercase font-semibold mb-1">Remarks</p>
                  <p className="text-sm text-amber-700">{selectedOrder.remarks}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    <DialogFooter className="pt-4 border-t border-slate-100">
      <Button variant="outline" onClick={() => setViewModalOpen(false)} className="rounded-xl">
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

            {/* Edit Order Modal */}
<Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
  <DialogContent className="rounded-2xl max-w-4xl max-h-[80vh] overflow-y-auto 
    [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
    
    <DialogHeader>
      <DialogTitle className="text-xl">Edit Order</DialogTitle>
      <DialogDescription>Update order information</DialogDescription>
    </DialogHeader>

    <div className="space-y-6 py-2">
      {/* Student Information */}
      <div className="bg-white border-0 shadow-sm rounded-xl p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Student Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Student Name *</Label>
            <Input
              value={orderForm.studentName}
              onChange={(e) => setOrderForm({ ...orderForm, studentName: e.target.value })}
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Father's Name</Label>
            <Input
              value={orderForm.fatherName}
              onChange={(e) => setOrderForm({ ...orderForm, fatherName: e.target.value })}
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Mobile Number *</Label>
            <Input
              value={orderForm.mobile}
              onChange={(e) => setOrderForm({ ...orderForm, mobile: e.target.value })}
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Email *</Label>
            <Input
              type="email"
              value={orderForm.email}
              onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Date of Birth</Label>
            <Input
              type="date"
              value={orderForm.dob}
              onChange={(e) => setOrderForm({ ...orderForm, dob: e.target.value })}
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Education</Label>
            <Input
              value={orderForm.education}
              onChange={(e) => setOrderForm({ ...orderForm, education: e.target.value })}
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Address</Label>
            <Input
              value={orderForm.address}
              onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">City</Label>
            <Input
              value={orderForm.city}
              onChange={(e) => setOrderForm({ ...orderForm, city: e.target.value })}
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">State</Label>
            <Input
              value={orderForm.state}
              onChange={(e) => setOrderForm({ ...orderForm, state: e.target.value })}
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Course Information */}
      <div className="bg-white border-0 shadow-sm rounded-xl p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Course Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Pool (Course Vertical)</Label>
            <Select
              value={orderForm.courseVertical}
              onValueChange={(value) => setOrderForm({ ...orderForm, courseVertical: value })}
            >
              <SelectTrigger className="mt-1.5 rounded-xl">
                <SelectValue placeholder="Select pool" />
              </SelectTrigger>
              <SelectContent>
                {pools.map((pool) => (
                  <SelectItem key={pool._id} value={pool._id}>
                    {pool.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Course Name</Label>
            <Input
              value={orderForm.courseName}
              onChange={(e) => setOrderForm({ ...orderForm, courseName: e.target.value })}
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Course Duration (days)</Label>
            <Input
              value={orderForm.courseDuration}
              onChange={(e) => setOrderForm({ ...orderForm, courseDuration: e.target.value })}
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Total Fee *</Label>
            <Input
              type="number"
              value={orderForm.totalFee}
              onChange={(e) => setOrderForm({ ...orderForm, totalFee: parseInt(e.target.value) || 0 })}
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Discount</Label>
            <Input
              type="number"
              value={orderForm.discount}
              onChange={(e) => setOrderForm({ ...orderForm, discount: parseInt(e.target.value) || 0 })}
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
        </div>

        {/* GST Section */}
        <div className="border-t border-slate-100 mt-4 pt-4">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setOrderForm({ ...orderForm, GSTEnabled: !orderForm.GSTEnabled })}
            >
              <div className={`w-4 h-4 rounded border ${orderForm.GSTEnabled ? 'bg-orange-600 border-orange-600' : 'border-slate-300'} flex items-center justify-center transition-all`}>
                {orderForm.GSTEnabled && <div className="w-2 h-2 bg-white rounded-sm" />}
              </div>
              <span className="text-sm font-medium text-slate-700">Enable GST</span>
            </div>
          </div>
          {orderForm.GSTEnabled && (
            <div className="mt-3">
              <Label className="text-xs font-semibold text-slate-500 uppercase">GST Amount</Label>
              <Input
                type="number"
                value={orderForm.GSTAmount}
                onChange={(e) => setOrderForm({ ...orderForm, GSTAmount: parseInt(e.target.value) || 0 })}
                placeholder="Enter GST amount"
                className="mt-1.5 rounded-xl border-slate-200"
              />
            </div>
          )}
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mt-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Final Fee</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(calculateFinalFee())}</p>
          {orderForm.GSTEnabled && orderForm.GSTAmount && (
            <p className="text-xs text-slate-400 mt-1">Including GST: {formatCurrency(orderForm.GSTAmount)}</p>
          )}
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-white border-0 shadow-sm rounded-xl p-5">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Payment Information</h3>
        <div>
          <Label className="text-xs font-semibold text-slate-500 uppercase">Payment Mode *</Label>
          <Select
            value={orderForm.paymentMode}
            onValueChange={(value) => setOrderForm({ ...orderForm, paymentMode: value })}
          >
            <SelectTrigger className="mt-1.5 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Lumpsum">Lumpsum</SelectItem>
              <SelectItem value="Loan">Loan</SelectItem>
              <SelectItem value="Subscription">Subscription</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Order Date</Label>
            <Input
              type="datetime-local"
              value={orderForm.orderDate}
              onChange={(e) => setOrderForm({ ...orderForm, orderDate: e.target.value })}
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase">Fee Deposit Date</Label>
            <Input
              type="datetime-local"
              value={orderForm.feeDepositDate}
              onChange={(e) => setOrderForm({ ...orderForm, feeDepositDate: e.target.value })}
              className="mt-1.5 rounded-xl border-slate-200"
            />
          </div>
        </div>

        <div className="mt-4">
          <Label className="text-xs font-semibold text-slate-500 uppercase">Remarks</Label>
          <Textarea
            value={orderForm.remarks}
            onChange={(e) => setOrderForm({ ...orderForm, remarks: e.target.value })}
            rows={3}
            className="mt-1.5 rounded-xl border-slate-200"
          />
        </div>
      </div>
    </div>

    <DialogFooter className="pt-4 border-t border-slate-100">
      <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={updatingOrder} className="rounded-xl">
        Cancel
      </Button>
      <Button onClick={handleUpdateOrder} disabled={updatingOrder} className="bg-orange-600 hover:bg-orange-700 rounded-xl">
        {updatingOrder ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating...
          </>
        ) : (
          'Update Order'
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

            {/* Payment Link Modal */}
{/* Payment Link Modal */}
<Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
  <DialogContent className="rounded-2xl max-w-md max-h-[80vh] overflow-y-auto 
    [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
    
    <DialogHeader>
      <DialogTitle className="text-xl">Generate Payment Link</DialogTitle>
      <DialogDescription>Create a payment link for this order</DialogDescription>
    </DialogHeader>

    {selectedOrder && (
      <div className="space-y-5">
        {/* Order Summary */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase">Order Summary</p>
          <div className="text-sm text-slate-700 space-y-1">
            <p><span className="font-medium">Student:</span> {selectedOrder.studentName}</p>
            <p><span className="font-medium">Order ID:</span> <span className="font-mono text-xs">{selectedOrder._id}</span></p>
            <p><span className="font-medium">Payment Mode:</span> {selectedOrder.paymentMode}</p>
            <p><span className="font-medium">Total Amount:</span> {formatCurrency(selectedOrder.finalFee)}</p>
            {selectedOrder.paymentMode === 'Lumpsum' && selectedOrder.lumpsumDetails && (
              <p><span className="font-medium">Pending Amount:</span> {formatCurrency(selectedOrder.lumpsumDetails.pendingAmount)}</p>
            )}
            {selectedOrder.paymentMode === 'Subscription' && selectedOrder.subscriptionDetails && (
              <>
                <p><span className="font-medium">Installment Amount:</span> {formatCurrency(selectedOrder.subscriptionDetails.installmentAmount)}</p>
                <p><span className="font-medium">No. of Installments:</span> {selectedOrder.subscriptionDetails.numberOfInstallments}</p>
              </>
            )}
          </div>
        </div>

        {/* Payment Amount Input */}
        <div>
          <Label htmlFor="paymentAmount" className="text-xs font-semibold text-slate-500 uppercase">
            Payment Amount *
          </Label>
          <Input
            id="paymentAmount"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
            placeholder="Enter amount"
            max={getMaxAmount()}
            min={1}
            step={1}
            className="mt-1.5 rounded-xl border-slate-200"
          />
          <p className="text-xs text-slate-400 mt-1">
            Max amount: {formatCurrency(getMaxAmount())}
          </p>
        </div>
      </div>
    )}

    <DialogFooter className="pt-4 border-t border-slate-100 gap-2">
      <Button
        variant="outline"
        onClick={() => {
          setPaymentModalOpen(false);
          setPaymentAmount(0);
          setPaymentType('UPI');
        }}
        disabled={paymentLoading}
        className="rounded-xl"
      >
        Cancel
      </Button>
      <Button
        onClick={handleCreatePaymentLink}
        disabled={paymentLoading || paymentAmount <= 0 || paymentAmount > getMaxAmount()}
        className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
      >
        {paymentLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Generate Link
          </>
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

            <Dialog open={paymentHistoryModalOpen} onOpenChange={setPaymentHistoryModalOpen}>
  <DialogContent className="rounded-2xl max-w-3xl max-h-[80vh] overflow-y-auto 
    [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
    
    <DialogHeader>
      <DialogTitle className="text-xl">Payment History</DialogTitle>
      <DialogDescription>
        {selectedOrder && `Payment transactions for order: ${selectedOrder._id}`}
      </DialogDescription>
    </DialogHeader>

    {loadingPayments ? (
      <div className="py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-400" />
        <p className="mt-3 text-slate-500">Loading payment history...</p>
      </div>
    ) : paymentHistory.length === 0 ? (
      <div className="py-16 text-center">
        <CreditCard className="w-12 h-12 mx-auto text-slate-300" />
        <h3 className="mt-3 text-base font-medium text-slate-700">No payments found</h3>
        <p className="text-sm text-slate-400">No payment transactions recorded for this order</p>
      </div>
    ) : (
      <div className="space-y-5 py-2">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border-0 shadow-sm rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Payments</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{paymentHistory.length}</p>
          </div>
          <div className="bg-white border-0 shadow-sm rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Amount Paid</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {formatCurrency(paymentHistory.reduce((sum, p) => sum + p.link_amount_paid, 0))}
            </p>
          </div>
          <div className="bg-white border-0 shadow-sm rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase">Successful</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {paymentHistory.filter(p => p.transaction_status === 'SUCCESS').length}
            </p>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white border-0 shadow-sm rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-100">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Date</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Amount</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Transaction ID</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentHistory.map((payment) => (
                <TableRow key={payment._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="whitespace-nowrap text-sm text-slate-600">
                    {formatDateTime(payment.event_time || payment.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm text-slate-800">
                    {formatCurrency(payment.link_amount_paid)}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-slate-600">
                      {payment.transaction_id}
                    </span>
                  </TableCell>
                  <TableCell>
                    {payment.transaction_status === 'SUCCESS' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="w-3 h-3" />
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                        <Clock className="w-3 h-3" />
                        {payment.transaction_status}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )}

    <DialogFooter className="pt-4 border-t border-slate-100">
      <Button onClick={() => setPaymentHistoryModalOpen(false)} className="rounded-xl">
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

            {/* Subscription Creation Modal */}
<Dialog open={subscriptionModalOpen} onOpenChange={setSubscriptionModalOpen}>
  <DialogContent className="rounded-2xl max-w-md max-h-[80vh] overflow-y-auto 
    [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
    
    <DialogHeader>
      <DialogTitle className="text-xl">Create Subscription</DialogTitle>
      <DialogDescription>
        Create the Cashfree subscription session for the approved order.
      </DialogDescription>
    </DialogHeader>

    {selectedOrder && (
      <div className="space-y-5">
        {/* Order Summary */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase">Order Summary</p>
          <div className="text-sm text-slate-700 space-y-1">
            <p><span className="font-medium">Student:</span> {selectedOrder.studentName}</p>
            <p><span className="font-medium">Order ID:</span> <span className="font-mono text-xs">{selectedOrder._id}</span></p>
            <p><span className="font-medium">Payment Mode:</span> {selectedOrder.paymentMode}</p>
            <p><span className="font-medium">Total Amount:</span> {formatCurrency(selectedOrder.finalFee)}</p>
          </div>
        </div>

        {/* Plan ID Input */}
        <div>
          <Label htmlFor="subscriptionPlanId" className="text-xs font-semibold text-slate-500 uppercase">
            Plan ID (optional)
          </Label>
          <Input
            id="subscriptionPlanId"
            value={subscriptionPlanId}
            onChange={(e) => setSubscriptionPlanId(e.target.value)}
            placeholder="Enter Cashfree plan ID"
            className="mt-1.5 rounded-xl border-slate-200"
          />
          <p className="text-xs text-slate-400 mt-1">
            Leave blank to create the subscription with only the order ID.
          </p>
        </div>
      </div>
    )}

    <DialogFooter className="pt-4 border-t border-slate-100 gap-2">
      <Button
        variant="outline"
        onClick={() => setSubscriptionModalOpen(false)}
        disabled={subscriptionCreating}
        className="rounded-xl"
      >
        Cancel
      </Button>
      <Button
        onClick={handleCreateSubscription}
        disabled={subscriptionCreating}
        className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
      >
        {subscriptionCreating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          'Create Subscription'
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

            {/* Subscription Auth Modal */}
<Dialog open={subscriptionAuthModalOpen} onOpenChange={setSubscriptionAuthModalOpen}>
  <DialogContent className="rounded-2xl max-w-xl max-h-[80vh] overflow-y-auto 
    [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
    
    <DialogHeader>
      <DialogTitle className="text-xl">Subscription Auth Link</DialogTitle>
      <DialogDescription>
        Generate the shareable Cashfree auth link for the created subscription session.
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-5 py-2">
      {/* Subscription Session Summary */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase">Subscription Session</p>
        <div className="text-sm text-slate-700 space-y-1">
          <p><span className="font-medium">Student:</span> {selectedOrder?.studentName}</p>
          <p><span className="font-medium">Email:</span> {selectedOrder?.email}</p>
          <p><span className="font-medium">Phone:</span> {selectedOrder?.mobile}</p>
        </div>
      </div>

      {/* Auth Link Section */}
      <div>
        <Label className="text-xs font-semibold text-slate-500 uppercase">Auth Link</Label>
        {subscriptionAuthUrl ? (
          <div className="mt-1.5 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={subscriptionAuthUrl}
                readOnly
                className="font-mono text-sm rounded-xl border-slate-200 flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(subscriptionAuthUrl);
                  toast({
                    title: 'Copied!',
                    description: 'Subscription auth link copied to clipboard.',
                  });
                }}
                className="shrink-0 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              Link generated – copy or open to share the Cashfree subscription checkout.
            </p>
          </div>
        ) : (
          <div className="mt-1.5">
            <Button
              onClick={handleGenerateSubscriptionAuthLink}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
            >
              Generate Auth Link
            </Button>
            <p className="text-xs text-slate-400 mt-1">
              Generate the link, then copy or open it to share the Cashfree subscription checkout.
            </p>
          </div>
        )}
      </div>
    </div>

    <DialogFooter className="pt-4 border-t border-slate-100 gap-2">
      <Button
        variant="outline"
        onClick={() => setSubscriptionAuthModalOpen(false)}
        className="rounded-xl"
      >
        Close
      </Button>
      <Button
        onClick={() => {
          if (subscriptionAuthUrl) {
            window.open(subscriptionAuthUrl, '_blank');
          }
        }}
        disabled={!subscriptionAuthUrl}
        className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        Open Auth Link
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

            {/* Generated Link Modal */}
<Dialog open={generatedLinkModalOpen} onOpenChange={setGeneratedLinkModalOpen}>
  <DialogContent className="rounded-2xl max-w-xl max-h-[80vh] overflow-y-auto 
    [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
    
    <DialogHeader>
      <DialogTitle className="text-xl">Payment Link Generated</DialogTitle>
      <DialogDescription>
        Share this payment link with the student to complete the payment
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-5 py-2">
      {/* Payment Summary */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase">Payment Summary</p>
        <div className="text-sm text-slate-700 space-y-1">
          <p><span className="font-medium">Student:</span> {selectedOrder?.studentName}</p>
          <p><span className="font-medium">Amount:</span> {formatCurrency(paymentAmount)}</p>
          <p><span className="font-medium">Payment Mode:</span> {selectedOrder?.paymentMode}</p>
          <p><span className="font-medium">Order ID:</span> <span className="font-mono text-xs">{selectedOrder?._id}</span></p>
        </div>
      </div>

      {/* Payment Link Display */}
      <div>
        <Label className="text-xs font-semibold text-slate-500 uppercase">Payment Link</Label>
        <div className="mt-1.5 flex items-center gap-2">
          <Input
            value={generatedLink}
            readOnly
            className="font-mono text-sm rounded-xl border-slate-200 flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(generatedLink);
              toast({
                title: "Copied!",
                description: "Payment link copied to clipboard",
              });
            }}
            className="shrink-0 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Share this link with the student to complete the payment
        </p>
      </div>
    </div>

    <DialogFooter className="pt-4 border-t border-slate-100 gap-2">
      <Button
        variant="outline"
        onClick={() => setGeneratedLinkModalOpen(false)}
        className="rounded-xl"
      >
        Close
      </Button>
      <Button
        onClick={() => {
          window.open(generatedLink, '_blank');
        }}
        className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        Open Link
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
        </div>
    );
}
