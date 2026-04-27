import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Search,
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
        cashfreeSubscriptionId: string;
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
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
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
        params.page = filters.page;
        params.limit = filters.limit;

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

    // Handle filter changes
    const handleFilterChange = (key: keyof Filters, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: 1
        }));
    };



    return (
        <div className="space-y-4 md:space-y-6 p-2 md:p-0">
            {/* Header */}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">Order Management</h1>
                    <p className="text-sm md:text-base text-muted-foreground">Manage and track all orders</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={() => {
                        resetForm();
                        setCreateModalOpen(true);
                    }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Order
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/bd/payments')}
                    >
                        <History className="w-4 h-4 mr-2" />
                        Payment History
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/bd/loan-management')}
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Loan Management
                    </Button>
                </div>
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

                {showFilters && (
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reset Filters
                    </Button>
                )}
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
                                    <Label>Payment Mode</Label>
                                    <Select
                                        value={filters.paymentMode}
                                        onValueChange={(value) => handleFilterChange('paymentMode', value)}
                                    >
                                        <SelectTrigger>
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
                                            <SelectItem value="Fully Paid">Fully Paid</SelectItem>
                                            <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                                            <SelectItem value="Pending">Pending</SelectItem>
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
                                                    empId: counsellor.employeeId
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
                                {filters.paymentMode !== 'all' && (
                                    <Badge variant="secondary" className="text-xs">
                                        Payment: {filters.paymentMode}
                                    </Badge>
                                )}
                                {filters.status !== 'all' && (
                                    <Badge variant="secondary" className="text-xs">
                                        Status: {filters.status}
                                    </Badge>
                                )}
                                {filters.dateFilter !== 'all' && filters.dateFilter !== 'custom' && (
                                    <Badge variant="secondary" className="text-xs">
                                        Date: {filters.dateFilter}
                                    </Badge>
                                )}

                                {filters.groupFilter && (
                                    <Badge variant="secondary" className="text-xs">
                                        Group View: {filters.counsellorId !== 'all' ?
                                            `Counsellor: ${counsellors.find(c => c._id === filters.counsellorId)?.name || filters.counsellorId}` :
                                            'All Counsellors'}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Orders Table */}
            <Card>
                <CardHeader className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            Orders
                            <Badge variant="outline" className="ml-2">
                                {totalOrders} total
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
                            <p className="mt-2 text-muted-foreground">Loading orders...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12">
                            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No orders found</h3>
                            <p className="text-muted-foreground">Try adjusting your filters or create a new order</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="whitespace-nowrap">Order ID</TableHead>
                                        <TableHead className="whitespace-nowrap">Student</TableHead>
                                        <TableHead className="whitespace-nowrap">Course</TableHead>
                                        <TableHead className="whitespace-nowrap">Amount</TableHead>
                                        <TableHead className="whitespace-nowrap">Payment Mode</TableHead>
                                        <TableHead className="whitespace-nowrap">Status</TableHead>
                                        <TableHead className="whitespace-nowrap">Approval</TableHead>
                                        <TableHead className="whitespace-nowrap">Order Date</TableHead>
                                        <TableHead className="whitespace-nowrap">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => {
                                        console.log("ORDER:", order);
                                        console.log("cashfreeSubscriptionId:", order.subscriptionDetails?.cashfreeSubscriptionId);
                                        console.log("BOOLEAN:", !!order.subscriptionDetails?.cashfreeSubscriptionId);
                                        const hasSubscriptionId = !!order.subscriptionDetails?.cashfreeSubscriptionId;

                                        return (
                                            <TableRow key={order._id} className="hover:bg-muted/50">
                                                <TableCell className="whitespace-nowrap">
                                                    <span className="font-mono text-xs">{order._id.slice(-8)}</span>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <div className="font-medium">{order.studentName}</div>
                                                    <div className="text-xs text-muted-foreground">{order.mobile}</div>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <div className="text-sm">{order.courseName}</div>
                                                    <div className="text-xs text-muted-foreground">{order.courseDuration} days</div>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <div className="font-medium">{formatCurrency(order.finalFee)}</div>
                                                    <div className="text-xs text-muted-foreground line-through">
                                                        {order.discount > 0 && formatCurrency(order.totalFee)}
                                                    </div>
                                                    {order.GSTEnabled && order.GSTAmount && (
                                                        <div className="text-xs text-muted-foreground">
                                                            +GST: {formatCurrency(order.GSTAmount)}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <Badge variant="outline">{order.paymentMode}</Badge>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {getStatusBadge(order.status, order.Approved)}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    {order.Approved ? (
                                                        <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Approved
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
                                                            <XCircle className="w-3 h-3" />
                                                            Pending
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <div className="text-sm">{formatDate(order.orderDate)}</div>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewOrder(order)}
                                                            className="h-8 w-8 p-0"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        {!order.Approved && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEditOrder(order)}
                                                                className="h-8 w-8 p-0"
                                                                title="Edit Order"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        {!order.Approved && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleApproveOrder(order._id, order.Approved)}
                                                                className="h-8 w-8 p-0"
                                                                title={order.Approved ? "Unapprove Order" : "Approve Order"}
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
                                                                className="h-8 w-8 p-0"
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

                                                        {order.paymentMode === 'Lumpsum' && order.Approved && order.status !== 'Fully Paid' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handlePaymentModal(order)}
                                                                className="h-8 w-8 p-0"
                                                                title="Generate Payment Link"
                                                            >
                                                                <CreditCard className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        {order.paymentMode === 'Lumpsum' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handlePaymentHistory(order)}
                                                                className="h-8 w-8 p-0"
                                                                title="View Payment History"
                                                            >
                                                                <Receipt className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Order Modal */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Create New Order</DialogTitle>
                        <DialogDescription>Fill in the details to create a new order</DialogDescription>
                    </DialogHeader>

                    <div className="overflow-y-auto flex-1 py-4">
                        <div className="space-y-6">
                            {/* Student Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Student Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Student Name *</Label>
                                            <div className="relative">
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
                                                />

                                                {showLeadSuggestions && filteredLeads.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                        {filteredLeads.map((lead) => (
                                                            <div
                                                                key={lead._id}
                                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                                onClick={() => {
                                                                    handleLeadSelectFromSearch(lead);
                                                                    setShowLeadSuggestions(false);
                                                                    setFilteredLeads([]);
                                                                }}
                                                            >
                                                                <div className="font-medium">{lead.name}</div>
                                                                <div className="text-sm text-gray-500">
                                                                    {lead.phone} | ID: {lead.leadId}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Father's Name</Label>
                                            <Input
                                                value={orderForm.fatherName}
                                                onChange={(e) => setOrderForm({ ...orderForm, fatherName: e.target.value })}
                                                placeholder="Enter father's name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Mobile Number *</Label>
                                            <Input
                                                value={orderForm.mobile}
                                                onChange={(e) => setOrderForm({ ...orderForm, mobile: e.target.value })}
                                                placeholder="Enter mobile number"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email *</Label>
                                            <Input
                                                type="email"
                                                value={orderForm.email}
                                                onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                                                placeholder="Enter email address"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Date of Birth</Label>
                                            <Input
                                                type="date"
                                                value={orderForm.dob}
                                                onChange={(e) => setOrderForm({ ...orderForm, dob: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Education</Label>
                                            <Input
                                                value={orderForm.education}
                                                onChange={(e) => setOrderForm({ ...orderForm, education: e.target.value })}
                                                placeholder="Enter education qualification"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Address</Label>
                                            <Input
                                                value={orderForm.address}
                                                onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                                                placeholder="Enter address"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>City</Label>
                                            <Input
                                                value={orderForm.city}
                                                onChange={(e) => setOrderForm({ ...orderForm, city: e.target.value })}
                                                placeholder="Enter city"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>State</Label>
                                            <Input
                                                value={orderForm.state}
                                                onChange={(e) => setOrderForm({ ...orderForm, state: e.target.value })}
                                                placeholder="Enter state"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Course Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Course Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Pool (Course Vertical)</Label>
                                        <Select
                                            value={orderForm.courseVertical}
                                            onValueChange={(value) => setOrderForm({ ...orderForm, courseVertical: value })}
                                        >
                                            <SelectTrigger>
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
                                    <div className="space-y-2">
                                        <Label>Select Course *</Label>
                                        <div className="relative">
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
                                            />

                                            {showCourseSuggestions && filteredCourses.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                    {filteredCourses.map((course) => (
                                                        <div
                                                            key={course._id}
                                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                            onClick={() => {
                                                                handleCourseSelectFromSearch(course);
                                                                setShowCourseSuggestions(false);
                                                                setFilteredCourses([]);
                                                            }}
                                                        >
                                                            <div className="font-medium">{course.courseName}</div>
                                                            <div className="text-sm text-gray-500">
                                                                Duration: {course.courseDuration} days | Fee: {formatCurrency(course.totalFee)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Course Name</Label>
                                            <Input
                                                value={orderForm.courseName}
                                                onChange={(e) => setOrderForm({ ...orderForm, courseName: e.target.value })}
                                                placeholder="Course name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Course Duration (days)</Label>
                                            <Input
                                                value={orderForm.courseDuration}
                                                onChange={(e) => setOrderForm({ ...orderForm, courseDuration: e.target.value })}
                                                placeholder="Duration in days"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Total Fee *</Label>
                                            <Input
                                                type="number"
                                                value={orderForm.totalFee}
                                                onChange={(e) => setOrderForm({ ...orderForm, totalFee: parseInt(e.target.value) || 0 })}
                                                placeholder="Total fee amount"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Discount</Label>
                                            <Input
                                                type="number"
                                                value={orderForm.discount}
                                                onChange={(e) => setOrderForm({ ...orderForm, discount: parseInt(e.target.value) || 0 })}
                                                placeholder="Discount amount"
                                            />
                                        </div>
                                    </div>

                                    {/* GST Section */}
                                    <div className="space-y-4 border-t pt-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="gst-enabled"
                                                checked={orderForm.GSTEnabled}
                                                onCheckedChange={(checked) => setOrderForm({ ...orderForm, GSTEnabled: checked as boolean })}
                                            />
                                            <Label htmlFor="gst-enabled" className="text-sm font-medium cursor-pointer">
                                                Enable GST
                                            </Label>
                                        </div>

                                        {orderForm.GSTEnabled && (
                                            <div className="space-y-2">
                                                <Label>GST Amount</Label>
                                                <Input
                                                    type="number"
                                                    value={orderForm.GSTAmount}
                                                    onChange={(e) => setOrderForm({ ...orderForm, GSTAmount: parseInt(e.target.value) || 0 })}
                                                    placeholder="Enter GST amount"
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    This amount will be added to the final fee
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-muted/30 p-3 rounded-lg">
                                        <Label className="text-sm font-medium">Final Fee</Label>
                                        <div className="text-2xl font-bold text-primary mt-1">
                                            {formatCurrency(calculateFinalFee())}
                                        </div>
                                        {orderForm.GSTEnabled && orderForm.GSTAmount && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Including GST: {formatCurrency(orderForm.GSTAmount)}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Payment Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Payment Mode *</Label>
                                        <Select
                                            value={orderForm.paymentMode}
                                            onValueChange={(value) => setOrderForm({ ...orderForm, paymentMode: value })}
                                        >
                                            <SelectTrigger>
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
                                        <div className="space-y-4 border-t pt-4">
                                            <h3 className="font-medium">Lumpsum Details</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Registration Date</Label>
                                                    <Input
                                                        type="datetime-local"
                                                        value={orderForm.lumpsumDetails.registrationDate}
                                                        onChange={(e) => setOrderForm({
                                                            ...orderForm,
                                                            lumpsumDetails: { ...orderForm.lumpsumDetails!, registrationDate: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Registration Amount</Label>
                                                    <Input
                                                        type="number"
                                                        value={orderForm.lumpsumDetails.registrationAmount}
                                                        onChange={(e) => setOrderForm({
                                                            ...orderForm,
                                                            lumpsumDetails: { ...orderForm.lumpsumDetails!, registrationAmount: parseInt(e.target.value) || 0 }
                                                        })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Total Received</Label>
                                                    <Input
                                                        type="number"
                                                        value={orderForm.lumpsumDetails.totalReceived}
                                                        onChange={(e) => setOrderForm({
                                                            ...orderForm,
                                                            lumpsumDetails: { ...orderForm.lumpsumDetails!, totalReceived: parseInt(e.target.value) || 0 }
                                                        })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Payment Type</Label>
                                                    <Select
                                                        value={orderForm.lumpsumDetails.paymentType}
                                                        onValueChange={(value) => setOrderForm({
                                                            ...orderForm,
                                                            lumpsumDetails: { ...orderForm.lumpsumDetails!, paymentType: value }
                                                        })}
                                                    >
                                                        <SelectTrigger>
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
                                        <div className="space-y-4 border-t pt-4">
                                            <h3 className="font-medium">Loan Details</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Loan Partner *</Label>
                                                    <Select
                                                        value={orderForm.loanDetails.loanPartner}
                                                        onValueChange={(value) => setOrderForm({
                                                            ...orderForm,
                                                            loanDetails: { ...orderForm.loanDetails!, loanPartner: value }
                                                        })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select loan partner" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {loadingLoanPartners ? (
                                                                <div className="flex items-center justify-center py-2">
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                </div>
                                                            ) : loanPartners.length === 0 ? (
                                                                <div className="px-2 py-2 text-sm text-muted-foreground">
                                                                    No loan partners available
                                                                </div>
                                                            ) : (
                                                                loanPartners.map((partner) => (
                                                                    <SelectItem key={partner._id} value={partner._id}>
                                                                        <div className="flex flex-col">
                                                                            <span>{partner.name}</span>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                Type: {partner.type} | Charge: {partner.submissionCharge}%
                                                                            </span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Loan Amount</Label>
                                                    <Input
                                                        type="number"
                                                        value={orderForm.loanDetails.loanAmount}
                                                        onChange={(e) => setOrderForm({
                                                            ...orderForm,
                                                            loanDetails: { ...orderForm.loanDetails!, loanAmount: parseInt(e.target.value) || 0 }
                                                        })}
                                                        placeholder="Enter loan amount"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Disbursement Amount</Label>
                                                    <Input
                                                        type="number"
                                                        value={orderForm.loanDetails.disbursementAmount}
                                                        onChange={(e) => setOrderForm({
                                                            ...orderForm,
                                                            loanDetails: { ...orderForm.loanDetails!, disbursementAmount: parseInt(e.target.value) || 0 }
                                                        })}
                                                        placeholder="Enter disbursement amount"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>First EMI Date</Label>
                                                    <Input
                                                        type="datetime-local"
                                                        value={orderForm.loanDetails.firstEmiDate}
                                                        onChange={(e) => setOrderForm({
                                                            ...orderForm,
                                                            loanDetails: { ...orderForm.loanDetails!, firstEmiDate: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {orderForm.paymentMode === 'Subscription' && orderForm.subscriptionDetails && (
                                        <div className="space-y-4 border-t pt-4">
                                            <h3 className="font-medium">Subscription Details</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Gateway</Label>
                                                    <Select
                                                        value={orderForm.subscriptionDetails.gateway}
                                                        onValueChange={(value) => setOrderForm({
                                                            ...orderForm,
                                                            subscriptionDetails: { ...orderForm.subscriptionDetails!, gateway: value }
                                                        })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Cashfree">Cashfree</SelectItem>
                                                            <SelectItem value="Razorpay">Razorpay</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Installment Amount</Label>
                                                    <Input
                                                        type="number"
                                                        value={orderForm.subscriptionDetails.installmentAmount}
                                                        onChange={(e) => setOrderForm({
                                                            ...orderForm,
                                                            subscriptionDetails: { ...orderForm.subscriptionDetails!, installmentAmount: parseInt(e.target.value) || 0 }
                                                        })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Number of Installments</Label>
                                                    <Input
                                                        type="number"
                                                        value={orderForm.subscriptionDetails.numberOfInstallments}
                                                        onChange={(e) => setOrderForm({
                                                            ...orderForm,
                                                            subscriptionDetails: { ...orderForm.subscriptionDetails!, numberOfInstallments: parseInt(e.target.value) || 1 }
                                                        })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>First Installment Date</Label>
                                                    <Input
                                                        type="datetime-local"
                                                        value={orderForm.subscriptionDetails.firstInstallmentDate}
                                                        onChange={(e) => setOrderForm({
                                                            ...orderForm,
                                                            subscriptionDetails: { ...orderForm.subscriptionDetails!, firstInstallmentDate: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Last Installment Date</Label>
                                                    <Input
                                                        type="datetime-local"
                                                        value={orderForm.subscriptionDetails.lastInstallmentDate}
                                                        onChange={(e) => setOrderForm({
                                                            ...orderForm,
                                                            subscriptionDetails: { ...orderForm.subscriptionDetails!, lastInstallmentDate: e.target.value }
                                                        })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Order Date</Label>
                                            <Input
                                                type="datetime-local"
                                                value={orderForm.orderDate}
                                                onChange={(e) => setOrderForm({ ...orderForm, orderDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Fee Deposit Date</Label>
                                            <Input
                                                type="datetime-local"
                                                value={orderForm.feeDepositDate}
                                                onChange={(e) => setOrderForm({ ...orderForm, feeDepositDate: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Remarks</Label>
                                        <Textarea
                                            value={orderForm.remarks}
                                            onChange={(e) => setOrderForm({ ...orderForm, remarks: e.target.value })}
                                            placeholder="Add any remarks or notes..."
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t">
                        <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={addingOrder}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateOrder} disabled={addingOrder}>
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
                <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto p-0">
                    <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-2xl font-bold">Order Details</DialogTitle>
                                <DialogDescription className="text-sm">
                                    Complete information about the order
                                </DialogDescription>
                            </div>
                            <Badge variant={selectedOrder?.Approved ? "default" : "secondary"}
                                className={selectedOrder?.Approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                                {selectedOrder?.Approved ? "Approved" : "Pending Approval"}
                            </Badge>
                        </div>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="px-6 py-4 space-y-6">
                            {/* Order Summary Header */}
                            <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Order ID</p>
                                        <p className="font-mono text-sm font-semibold">{selectedOrder._id}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Order Date</p>
                                        <p className="text-sm font-medium">{formatDate(selectedOrder.orderDate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Payment Status</p>
                                        <Badge variant="outline" className="mt-1">
                                            {selectedOrder.status}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Payment Mode</p>
                                        <Badge variant="outline" className="mt-1">
                                            {selectedOrder.paymentMode}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Student Information */}
                                <Card className="overflow-hidden border-2 hover:shadow-md transition-shadow">
                                    <CardHeader className="bg-muted/30 border-b">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Users className="w-4 h-4 text-primary" />
                                            </div>
                                            Student Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                                                    <p className="text-sm font-medium">{selectedOrder.studentName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Father's Name</p>
                                                    <p className="text-sm">{selectedOrder.fatherName || '-'}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Mobile Number</p>
                                                    <p className="text-sm font-mono">{selectedOrder.mobile}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Email Address</p>
                                                    <p className="text-sm truncate">{selectedOrder.email}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Date of Birth</p>
                                                    <p className="text-sm">{formatDate(selectedOrder.dob) || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Education</p>
                                                    <p className="text-sm">{selectedOrder.education || '-'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Address</p>
                                                <p className="text-sm">{selectedOrder.address}, {selectedOrder.city}, {selectedOrder.state}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Course Information */}
                                <Card className="overflow-hidden border-2 hover:shadow-md transition-shadow">
                                    <CardHeader className="bg-muted/30 border-b">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <BookOpen className="w-4 h-4 text-primary" />
                                            </div>
                                            Course Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Course Name</p>
                                                <p className="text-sm font-medium">{selectedOrder.courseName}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Duration</p>
                                                    <p className="text-sm">{selectedOrder.courseDuration} days</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Course Vertical</p>
                                                    <p className="text-sm">{selectedOrder.courseVertical?.name || '-'}</p>
                                                </div>
                                            </div>
                                            <div className="bg-muted/20 rounded-lg p-3 space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-muted-foreground">Total Fee</span>
                                                    <span className="text-sm font-medium">{formatCurrency(selectedOrder.totalFee)}</span>
                                                </div>
                                                {selectedOrder.discount > 0 && (
                                                    <div className="flex justify-between items-center text-green-600">
                                                        <span className="text-sm">Discount</span>
                                                        <span className="text-sm font-medium">-{formatCurrency(selectedOrder.discount)}</span>
                                                    </div>
                                                )}
                                                {selectedOrder.GSTEnabled && selectedOrder.GSTAmount && (
                                                    <div className="flex justify-between items-center text-blue-600">
                                                        <span className="text-sm">GST</span>
                                                        <span className="text-sm font-medium">+{formatCurrency(selectedOrder.GSTAmount)}</span>
                                                    </div>
                                                )}
                                                <div className="border-t pt-2 mt-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-base font-semibold">Final Fee</span>
                                                        <span className="text-lg font-bold text-primary">{formatCurrency(selectedOrder.finalFee)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Payment Details */}
                                <Card className="overflow-hidden border-2 hover:shadow-md transition-shadow">
                                    <CardHeader className="bg-muted/30 border-b">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <CreditCard className="w-4 h-4 text-primary" />
                                            </div>
                                            Payment Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Order Date</p>
                                                    <p className="text-sm">{formatDate(selectedOrder.orderDate)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Fee Deposit Date</p>
                                                    <p className="text-sm">{formatDate(selectedOrder.feeDepositDate)}</p>
                                                </div>
                                            </div>

                                            {selectedOrder.lumpsumDetails && (
                                                <div className="bg-muted/20 rounded-lg p-3 space-y-2">
                                                    <p className="text-xs font-semibold text-primary mb-2">Lumpsum Details</p>
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground">Registration Date:</span>
                                                            <span className="ml-2 font-medium">{formatDate(selectedOrder.lumpsumDetails.registrationDate)}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Registration Amount:</span>
                                                            <span className="ml-2 font-medium">{formatCurrency(selectedOrder.lumpsumDetails.registrationAmount)}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Total Received:</span>
                                                            <span className="ml-2 font-medium">{formatCurrency(selectedOrder.lumpsumDetails.totalReceived)}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Pending Amount:</span>
                                                            <span className="ml-2 font-medium text-orange-600">{formatCurrency(selectedOrder.lumpsumDetails.pendingAmount)}</span>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <span className="text-muted-foreground">Payment Type:</span>
                                                            <Badge variant="outline" className="ml-2">{selectedOrder.lumpsumDetails.paymentType}</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedOrder.loanDetails && (
                                                <div className="bg-muted/20 rounded-lg p-3 space-y-2">
                                                    <p className="text-xs font-semibold text-primary mb-2">Loan Details</p>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Loan Partner:</span>
                                                            <span className="font-medium">{selectedOrder.loanDetails.loanPartner?.name}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Loan Amount:</span>
                                                            <span className="font-medium">{formatCurrency(selectedOrder.loanDetails.loanAmount)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Disbursement Amount:</span>
                                                            <span className="font-medium">{formatCurrency(selectedOrder.loanDetails.disbursementAmount)}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">First EMI Date:</span>
                                                            <span className="font-medium">{formatDate(selectedOrder.loanDetails.firstEmiDate)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedOrder.subscriptionDetails && (
                                                <div className="bg-muted/20 rounded-lg p-3 space-y-2">
                                                    <p className="text-xs font-semibold text-primary mb-2">Subscription Details</p>
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground">Gateway:</span>
                                                            <span className="ml-2 font-medium">{selectedOrder.subscriptionDetails.gateway}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Installment Amount:</span>
                                                            <span className="ml-2 font-medium">{formatCurrency(selectedOrder.subscriptionDetails.installmentAmount)}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">No. of Installments:</span>
                                                            <span className="ml-2 font-medium">{selectedOrder.subscriptionDetails.numberOfInstallments}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">First Installment:</span>
                                                            <span className="ml-2 font-medium">{formatDate(selectedOrder.subscriptionDetails.firstInstallmentDate)}</span>
                                                        </div>
                                                        <div className="col-span-2">
                                                            <span className="text-muted-foreground">Last Installment:</span>
                                                            <span className="ml-2 font-medium">{formatDate(selectedOrder.subscriptionDetails.lastInstallmentDate)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Additional Information */}
                                <Card className="overflow-hidden border-2 hover:shadow-md transition-shadow">
                                    <CardHeader className="bg-muted/30 border-b">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Info className="w-4 h-4 text-primary" />
                                            </div>
                                            Additional Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Counsellor</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Users className="w-3 h-3 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{selectedOrder.counsellorName}</p>
                                                        <p className="text-xs text-muted-foreground">{selectedOrder.counsellorId?.email}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Created At</p>
                                                    <p className="text-sm">{formatDate(selectedOrder.createdAt)}</p>
                                                    <p className="text-xs text-muted-foreground">{format(new Date(selectedOrder.createdAt), 'hh:mm a')}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                                                    <p className="text-sm">{formatDate(selectedOrder.updatedAt)}</p>
                                                    <p className="text-xs text-muted-foreground">{format(new Date(selectedOrder.updatedAt), 'hh:mm a')}</p>
                                                </div>
                                            </div>

                                            {selectedOrder.approvedBy && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Approved By</p>
                                                    <p className="text-sm font-medium">{selectedOrder.approvedBy.name}</p>
                                                    <p className="text-xs text-muted-foreground">{selectedOrder.approvedBy.email}</p>
                                                </div>
                                            )}

                                            {selectedOrder.remarks && (
                                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                    <p className="text-xs font-semibold text-yellow-800 mb-1">Remarks</p>
                                                    <p className="text-sm text-yellow-700">{selectedOrder.remarks}</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="sticky bottom-0 bg-background border-t px-6 py-4">
                        <Button variant="outline" onClick={() => setViewModalOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Order Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Edit Order</DialogTitle>
                        <DialogDescription>Update order information</DialogDescription>
                    </DialogHeader>

                    <div className="overflow-y-auto flex-1 py-4">
                        <div className="space-y-6">
                            {/* Student Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Student Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Student Name *</Label>
                                            <Input
                                                value={orderForm.studentName}
                                                onChange={(e) => setOrderForm({ ...orderForm, studentName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Father's Name</Label>
                                            <Input
                                                value={orderForm.fatherName}
                                                onChange={(e) => setOrderForm({ ...orderForm, fatherName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Mobile Number *</Label>
                                            <Input
                                                value={orderForm.mobile}
                                                onChange={(e) => setOrderForm({ ...orderForm, mobile: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email *</Label>
                                            <Input
                                                type="email"
                                                value={orderForm.email}
                                                onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Date of Birth</Label>
                                            <Input
                                                type="date"
                                                value={orderForm.dob}
                                                onChange={(e) => setOrderForm({ ...orderForm, dob: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Education</Label>
                                            <Input
                                                value={orderForm.education}
                                                onChange={(e) => setOrderForm({ ...orderForm, education: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Address</Label>
                                            <Input
                                                value={orderForm.address}
                                                onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>City</Label>
                                            <Input
                                                value={orderForm.city}
                                                onChange={(e) => setOrderForm({ ...orderForm, city: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>State</Label>
                                            <Input
                                                value={orderForm.state}
                                                onChange={(e) => setOrderForm({ ...orderForm, state: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Course Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Course Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Pool (Course Vertical)</Label>
                                        <Select
                                            value={orderForm.courseVertical}
                                            onValueChange={(value) => setOrderForm({ ...orderForm, courseVertical: value })}
                                        >
                                            <SelectTrigger>
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Course Name</Label>
                                            <Input
                                                value={orderForm.courseName}
                                                onChange={(e) => setOrderForm({ ...orderForm, courseName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Course Duration (days)</Label>
                                            <Input
                                                value={orderForm.courseDuration}
                                                onChange={(e) => setOrderForm({ ...orderForm, courseDuration: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Total Fee *</Label>
                                            <Input
                                                type="number"
                                                value={orderForm.totalFee}
                                                onChange={(e) => setOrderForm({ ...orderForm, totalFee: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Discount</Label>
                                            <Input
                                                type="number"
                                                value={orderForm.discount}
                                                onChange={(e) => setOrderForm({ ...orderForm, discount: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>

                                    {/* GST Section */}
                                    <div className="space-y-4 border-t pt-4">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="edit-gst-enabled"
                                                checked={orderForm.GSTEnabled}
                                                onCheckedChange={(checked) => setOrderForm({ ...orderForm, GSTEnabled: checked as boolean })}
                                            />
                                            <Label htmlFor="edit-gst-enabled" className="text-sm font-medium cursor-pointer">
                                                Enable GST
                                            </Label>
                                        </div>

                                        {orderForm.GSTEnabled && (
                                            <div className="space-y-2">
                                                <Label>GST Amount</Label>
                                                <Input
                                                    type="number"
                                                    value={orderForm.GSTAmount}
                                                    onChange={(e) => setOrderForm({ ...orderForm, GSTAmount: parseInt(e.target.value) || 0 })}
                                                    placeholder="Enter GST amount"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-muted/30 p-3 rounded-lg">
                                        <Label className="text-sm font-medium">Final Fee</Label>
                                        <div className="text-2xl font-bold text-primary mt-1">
                                            {formatCurrency(calculateFinalFee())}
                                        </div>
                                        {orderForm.GSTEnabled && orderForm.GSTAmount && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Including GST: {formatCurrency(orderForm.GSTAmount)}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Payment Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Payment Mode *</Label>
                                        <Select
                                            value={orderForm.paymentMode}
                                            onValueChange={(value) => setOrderForm({ ...orderForm, paymentMode: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Lumpsum">Lumpsum</SelectItem>
                                                <SelectItem value="Loan">Loan</SelectItem>
                                                <SelectItem value="Subscription">Subscription</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Order Date</Label>
                                            <Input
                                                type="datetime-local"
                                                value={orderForm.orderDate}
                                                onChange={(e) => setOrderForm({ ...orderForm, orderDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Fee Deposit Date</Label>
                                            <Input
                                                type="datetime-local"
                                                value={orderForm.feeDepositDate}
                                                onChange={(e) => setOrderForm({ ...orderForm, feeDepositDate: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Remarks</Label>
                                        <Textarea
                                            value={orderForm.remarks}
                                            onChange={(e) => setOrderForm({ ...orderForm, remarks: e.target.value })}
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t">
                        <Button variant="outline" onClick={() => setEditModalOpen(false)} disabled={updatingOrder}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateOrder} disabled={updatingOrder}>
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
            <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Generate Payment Link</DialogTitle>
                        <DialogDescription>
                            Create a payment link for this order
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="bg-muted/30 p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-2">Order Summary</p>
                                <p><strong>Student:</strong> {selectedOrder.studentName}</p>
                                <p><strong>Order ID:</strong> {selectedOrder._id}</p>
                                <p><strong>Payment Mode:</strong> {selectedOrder.paymentMode}</p>
                                <p><strong>Total Amount:</strong> {formatCurrency(selectedOrder.finalFee)}</p>

                                {selectedOrder.paymentMode === 'Lumpsum' && selectedOrder.lumpsumDetails && (
                                    <p><strong>Pending Amount:</strong> {formatCurrency(selectedOrder.lumpsumDetails.pendingAmount)}</p>
                                )}

                                {selectedOrder.paymentMode === 'Subscription' && selectedOrder.subscriptionDetails && (
                                    <>
                                        <p><strong>Installment Amount:</strong> {formatCurrency(selectedOrder.subscriptionDetails.installmentAmount)}</p>
                                        <p><strong>Number of Installments:</strong> {selectedOrder.subscriptionDetails.numberOfInstallments}</p>
                                    </>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="paymentAmount">Payment Amount *</Label>
                                <Input
                                    id="paymentAmount"
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                                    placeholder="Enter amount"
                                    max={getMaxAmount()}
                                    min={1}
                                    step={1}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Max amount: {formatCurrency(getMaxAmount())}
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setPaymentModalOpen(false);
                            setPaymentAmount(0);
                            setPaymentType('UPI');
                        }} disabled={paymentLoading}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreatePaymentLink}
                            disabled={paymentLoading || paymentAmount <= 0 || paymentAmount > getMaxAmount()}
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

            {/* Payment History Modal */}
            <Dialog open={paymentHistoryModalOpen} onOpenChange={setPaymentHistoryModalOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Payment History</DialogTitle>
                        <DialogDescription>
                            {selectedOrder && `Payment transactions for order: ${selectedOrder._id}`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="overflow-y-auto flex-1 py-4">
                        {loadingPayments ? (
                            <div className="text-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                                <p className="mt-2 text-muted-foreground">Loading payment history...</p>
                            </div>
                        ) : paymentHistory.length === 0 ? (
                            <div className="text-center py-8">
                                <CreditCard className="w-12 h-12 mx-auto text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">No payments found</h3>
                                <p className="text-muted-foreground">No payment transactions recorded for this order</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card>
                                        <CardContent className="pt-4">
                                            <p className="text-sm text-muted-foreground">Total Payments</p>
                                            <p className="text-2xl font-bold">{paymentHistory.length}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-4">
                                            <p className="text-sm text-muted-foreground">Total Amount Paid</p>
                                            <p className="text-2xl font-bold">
                                                {formatCurrency(paymentHistory.reduce((sum, p) => sum + p.link_amount_paid, 0))}
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-4">
                                            <p className="text-sm text-muted-foreground">Successful Payments</p>
                                            <p className="text-2xl font-bold text-green-600">
                                                {paymentHistory.filter(p => p.transaction_status === 'SUCCESS').length}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Payments Table */}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Transaction ID</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paymentHistory.map((payment) => (
                                            <TableRow key={payment._id}>
                                                <TableCell className="whitespace-nowrap">
                                                    {formatDateTime(payment.event_time || payment.createdAt)}
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(payment.link_amount_paid)}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-mono text-xs">
                                                        {payment.transaction_id}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {payment.transaction_status === 'SUCCESS' ? (
                                                        <Badge className="bg-green-100 text-green-700 border-green-200">
                                                            Success
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                            {payment.transaction_status}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setPaymentHistoryModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Subscription Creation Modal */}
            <Dialog open={subscriptionModalOpen} onOpenChange={setSubscriptionModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Subscription</DialogTitle>
                        <DialogDescription>
                            Create the Cashfree subscription session for the approved order.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                                <p className="text-sm text-muted-foreground mb-2">Order Summary</p>
                                <p><strong>Student:</strong> {selectedOrder.studentName}</p>
                                <p><strong>Order ID:</strong> {selectedOrder._id}</p>
                                <p><strong>Payment Mode:</strong> {selectedOrder.paymentMode}</p>
                                <p><strong>Total Amount:</strong> {formatCurrency(selectedOrder.finalFee)}</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subscriptionPlanId">Plan ID (optional)</Label>
                                <Input
                                    id="subscriptionPlanId"
                                    value={subscriptionPlanId}
                                    onChange={(e) => setSubscriptionPlanId(e.target.value)}
                                    placeholder="Enter Cashfree plan ID"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave blank to create the subscription with only the order ID.
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSubscriptionModalOpen(false)} disabled={subscriptionCreating}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateSubscription} disabled={subscriptionCreating}>
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
                <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] p-0 sm:p-6">
                    <div className="flex flex-col h-full overflow-hidden">
                        <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
                            <DialogTitle className="text-lg sm:text-xl">Subscription Auth Link</DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm">
                                Generate the shareable Cashfree auth link for the created subscription session.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto px-4 py-2 sm:px-6 space-y-4">
                            <div className="bg-muted/30 p-3 sm:p-4 rounded-lg space-y-2">
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Subscription Session</p>
                                <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                                    <div className="flex justify-between sm:justify-start sm:block">
                                        <span className="text-muted-foreground">Student:</span>
                                        <span className="font-medium ml-2 sm:ml-0 sm:block break-words">{selectedOrder?.studentName}</span>
                                    </div>
                                    <div className="col-span-1 flex justify-between sm:justify-start sm:block">
                                        <span className="text-muted-foreground">Student Number:</span>
                                        <span className="font-mono text-xs ml-2 sm:ml-0 sm:block break-all">{selectedOrder?.phone || "N/A"}</span>
                                    </div>
                                    <div className="col-span-1 flex justify-between sm:justify-start sm:block">
                                        <span className="text-muted-foreground">Student Email:</span>
                                        <span className="font-mono text-xs ml-2 sm:ml-0 sm:block break-all">{selectedOrder?.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs sm:text-sm">Auth Link</Label>
                                {subscriptionAuthUrl ? (
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                        <Input
                                            value={subscriptionAuthUrl}
                                            readOnly
                                            className="font-mono text-xs sm:text-sm flex-1 break-all"
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
                                            className="shrink-0 w-full sm:w-auto"
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
                                ) : (
                                    <Button onClick={handleGenerateSubscriptionAuthLink} className="w-full sm:w-auto">
                                        Generate Auth Link
                                    </Button>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Generate the link, then copy or open it to share the Cashfree subscription checkout.
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="px-4 py-3 sm:px-6 sm:py-4 border-t mt-2 flex-col sm:flex-row gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setSubscriptionAuthModalOpen(false)}
                                className="w-full sm:w-auto order-2 sm:order-1"
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
                                className="w-full sm:w-auto order-1 sm:order-2"
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open Auth Link
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Generated Link Modal */}
            <Dialog open={generatedLinkModalOpen} onOpenChange={setGeneratedLinkModalOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] p-0 sm:p-6">
                    <div className="flex flex-col h-full overflow-hidden">
                        <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
                            <DialogTitle className="text-lg sm:text-xl">Payment Link Generated</DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm">
                                Share this payment link with the student to complete the payment
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto px-4 py-2 sm:px-6 space-y-4">
                            {/* Payment Summary */}
                            <div className="bg-muted/30 p-3 sm:p-4 rounded-lg space-y-2">
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Payment Summary</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                                    <div className="flex justify-between sm:justify-start sm:block">
                                        <span className="text-muted-foreground">Student:</span>
                                        <span className="font-medium ml-2 sm:ml-0 sm:block break-words">{selectedOrder?.studentName}</span>
                                    </div>
                                    <div className="flex justify-between sm:justify-start sm:block">
                                        <span className="text-muted-foreground">Amount:</span>
                                        <span className="font-medium ml-2 sm:ml-0 sm:block">{formatCurrency(paymentAmount)}</span>
                                    </div>
                                    <div className="flex justify-between sm:justify-start sm:block">
                                        <span className="text-muted-foreground">Payment Mode:</span>
                                        <span className="font-medium ml-2 sm:ml-0 sm:block">{selectedOrder?.paymentMode}</span>
                                    </div>
                                    <div className="col-span-1 sm:col-span-2 flex justify-between sm:justify-start sm:block">
                                        <span className="text-muted-foreground">Order ID:</span>
                                        <span className="font-mono text-xs ml-2 sm:ml-0 sm:block break-all">{selectedOrder?._id}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Link Display */}
                            <div className="space-y-2">
                                <Label className="text-xs sm:text-sm">Payment Link</Label>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                    <Input
                                        value={generatedLink}
                                        readOnly
                                        className="font-mono text-xs sm:text-sm flex-1 break-all"
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
                                        className="shrink-0 w-full sm:w-auto"
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
                                <p className="text-xs text-muted-foreground">
                                    Share this link with the student to complete the payment
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="px-4 py-3 sm:px-6 sm:py-4 border-t mt-2 flex-col sm:flex-row gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setGeneratedLinkModalOpen(false)}
                                className="w-full sm:w-auto order-2 sm:order-1"
                            >
                                Close
                            </Button>
                            <Button
                                onClick={() => {
                                    window.open(generatedLink, '_blank');
                                }}
                                className="w-full sm:w-auto order-1 sm:order-2"
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
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
