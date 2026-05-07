import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  X,
  Calendar,
  Clock,
  LogIn,
  LogOut,
  ShoppingCart,
  CheckCircle,
  Phone,
  MessageSquare,
  Users,
  FileText,
  CreditCard,
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  RefreshCw,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getDataHandlerWithToken } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from 'sonner';

interface UserActivity {
  _id: string;
  userId: string;
  action: string;
  referenceType: string;
  referenceId: string | null;
  meta: any;
  createdAt: string;
  updatedAt: string;
}

interface UserInfo {
  _id: string;
  name: string;
  email: string;
  employeeId: number;
  role?: {
    name: string;
  };
}

export function UserActivityPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Fetch user info
  const fetchUserInfo = async () => {
    if (!userId) return;
    
    try {
      const response = await getDataHandlerWithToken(ApiConfig.getAllProfile, null, null, true);
      if (response && Array.isArray(response)) {
        const user = response.find((u: UserInfo) => u._id === userId);
        if (user) {
          setUserInfo(user);
        } else {
          toast.error('User not found');
        }
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      toast.error('Failed to load user information');
    }
  };

  // Fetch user activities
  const fetchActivities = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const endpoint = ApiConfig.getUserActivity(userId);
      const response = await getDataHandlerWithToken(endpoint, null, null, true);
      
      if (response && Array.isArray(response)) {
        // Sort by createdAt descending (newest first)
        const sorted = response.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setActivities(sorted);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Failed to fetch user activities:', error);
      toast.error('Failed to load user activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserInfo();
      fetchActivities();
    }
  }, [userId]);

  // Get unique action types for filter
  const actionTypes = useMemo(() => {
    const types = new Set<string>();
    activities.forEach(activity => {
      types.add(activity.action);
    });
    return Array.from(types).sort();
  }, [activities]);

  // Filter activities based on search term and action filter
  const filteredActivities = useMemo(() => {
    let filtered = activities;
    
    // Apply action filter
    if (filterAction !== 'all') {
      filtered = filtered.filter(activity => activity.action === filterAction);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(activity => {
        // Search in action
        if (activity.action.toLowerCase().includes(term)) return true;
        
        // Search in referenceType
        if (activity.referenceType?.toLowerCase().includes(term)) return true;
        
        // Search in meta data
        const metaString = JSON.stringify(activity.meta).toLowerCase();
        if (metaString.includes(term)) return true;
        
        // Search in referenceId
        if (activity.referenceId?.toLowerCase().includes(term)) return true;
        
        return false;
      });
    }
    
    return filtered;
  }, [activities, searchTerm, filterAction]);

  // Get icon for action type
  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('login')) return <LogIn className="w-4 h-4" />;
    if (actionLower.includes('logout')) return <LogOut className="w-4 h-4" />;
    if (actionLower.includes('order') && actionLower.includes('create')) return <ShoppingCart className="w-4 h-4" />;
    if (actionLower.includes('order') && actionLower.includes('approve')) return <CheckCircle className="w-4 h-4" />;
    if (actionLower.includes('call')) return <Phone className="w-4 h-4" />;
    if (actionLower.includes('lead') && actionLower.includes('create')) return <Users className="w-4 h-4" />;
    if (actionLower.includes('lead') && actionLower.includes('stage')) return <FileText className="w-4 h-4" />;
    if (actionLower.includes('interaction')) return <MessageSquare className="w-4 h-4" />;
    if (actionLower.includes('payment')) return <CreditCard className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  // Get color for action type
  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('login')) return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400';
    if (actionLower.includes('logout')) return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400';
    if (actionLower.includes('order') && actionLower.includes('create')) return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400';
    if (actionLower.includes('order') && actionLower.includes('approve')) return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400';
    if (actionLower.includes('call')) return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400';
    if (actionLower.includes('lead') && actionLower.includes('create')) return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400';
    if (actionLower.includes('lead') && actionLower.includes('stage')) return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400';
    if (actionLower.includes('interaction')) return 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400';
    return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
  };

  // Format date
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: format(date, 'MMM dd, yyyy'),
      time: format(date, 'hh:mm:ss a'),
      full: format(date, 'MMM dd, yyyy hh:mm:ss a')
    };
  };

  // Toggle expanded view for an item
  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Highlight search term in text
  const highlightText = (text: string, search: string) => {
    if (!search.trim() || !text) return text;
    
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-black rounded px-0.5 dark:bg-yellow-800 dark:text-white">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Render meta data nicely
  const renderMetaData = (meta: any, action: string, search: string) => {
    if (!meta) return null;
    
    // Handle specific action types
    if (action === 'USER_LOGIN' && meta.LoginAt) {
      const loginTime = formatDateTime(meta.LoginAt);
      return (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="font-medium">Login Time:</span>{' '}
            {highlightText(loginTime.full, search)}
          </div>
        </div>
      );
    }
    
    if (action === 'USER_Logout' && meta.logoutAt) {
      const logoutTime = formatDateTime(meta.logoutAt);
      return (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="font-medium">Logout Time:</span>{' '}
            {highlightText(logoutTime.full, search)}
          </div>
        </div>
      );
    }
    
    if (action === 'Order Created' || action === 'Order Approved') {
      if (meta.order) {
        const order = meta.order;
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Order Details:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pl-4">
              {order.studentName && (
                <div><span className="text-muted-foreground">Student:</span> {highlightText(order.studentName, search)}</div>
              )}
              {order.courseName && (
                <div><span className="text-muted-foreground">Course:</span> {highlightText(order.courseName, search)}</div>
              )}
              {order.finalFee && (
                <div><span className="text-muted-foreground">Amount:</span> ₹{order.finalFee.toLocaleString()}</div>
              )}
              {order.paymentMode && (
                <div><span className="text-muted-foreground">Payment Mode:</span> {highlightText(order.paymentMode, search)}</div>
              )}
              {order.status && (
                <div><span className="text-muted-foreground">Status:</span> {highlightText(order.status, search)}</div>
              )}
            </div>
            {meta.message && (
              <div className="text-sm pl-4">
                <span className="font-medium">Message:</span> {highlightText(meta.message, search)}
              </div>
            )}
          </div>
        );
      }
    }
    
    if (action === 'CALL_LOGGED') {
      if (meta.call) {
        const call = meta.call;
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Call Details:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pl-4">
              {call.duration && (
                <div><span className="text-muted-foreground">Duration:</span> {call.duration} seconds</div>
              )}
              {call.outcome && (
                <div><span className="text-muted-foreground">Outcome:</span> {highlightText(call.outcome, search)}</div>
              )}
              {call.startedAt && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Started:</span> {highlightText(formatDateTime(call.startedAt).full, search)}
                </div>
              )}
            </div>
          </div>
        );
      }
      if (meta.message) {
        return (
          <div className="text-sm">
            <span className="font-medium">Message:</span> {highlightText(meta.message, search)}
          </div>
        );
      }
    }
    
    if (action === 'Lead_Created' && meta.lead) {
      const lead = meta.lead;
      return (
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">Lead Details:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pl-4">
            {lead.name && (
              <div><span className="text-muted-foreground">Name:</span> {highlightText(lead.name, search)}</div>
            )}
            {lead.phone && (
              <div><span className="text-muted-foreground">Phone:</span> {highlightText(lead.phone, search)}</div>
            )}
            {lead.email && (
              <div className="col-span-2"><span className="text-muted-foreground">Email:</span> {highlightText(lead.email, search)}</div>
            )}
          </div>
        </div>
      );
    }
    
    if (action === 'Lead_Stage' && meta.message) {
      return (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="font-medium">Stage Change:</span> {highlightText(meta.message, search)}
          </div>
          {meta.from && meta.to && (
            <div className="text-sm pl-4">
              <span className="text-muted-foreground">From:</span> {highlightText(meta.from, search)}
              {' → '}
              <span className="text-muted-foreground">To:</span> {highlightText(meta.to, search)}
            </div>
          )}
        </div>
      );
    }
    
    if (meta.message) {
      return (
        <div className="text-sm">
          <span className="font-medium">Message:</span> {highlightText(meta.message, search)}
        </div>
      );
    }
    
    // Default: show pretty JSON
    return (
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View details</summary>
        <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded overflow-x-auto text-xs">
          {highlightText(JSON.stringify(meta, null, 2), search)}
        </pre>
      </details>
    );
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
           
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchActivities}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* User Info Card */}
        {userInfo && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {getInitials(userInfo.name)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-semibold">{userInfo.name}</h2>
                    <Badge variant="secondary">
                      ID: {userInfo.employeeId}
                    </Badge>
                    {userInfo.role && (
                      <Badge variant="outline">
                        {userInfo.role.name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {userInfo.email}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{filteredActivities.length}</div>
                  <div className="text-xs text-muted-foreground">Total Activities</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filter Bar */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities by action, reference, message, or any detail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filter by action:</span>
                <Button
                  variant={filterAction === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterAction('all')}
                  className="h-7 text-xs"
                >
                  All ({activities.length})
                </Button>
                {actionTypes.map((action) => (
                  <Button
                    key={action}
                    variant={filterAction === action ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterAction(action)}
                    className="h-7 text-xs"
                  >
                    {action} ({activities.filter(a => a.action === action).length})
                  </Button>
                ))}
              </div>
            </div>

            {/* Activities List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading activities...</p>
                </div>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <ActivityIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {searchTerm || filterAction !== 'all' 
                    ? 'No matching activities found'
                    : 'No activities recorded for this user'}
                </p>
                {(searchTerm || filterAction !== 'all') && (
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterAction('all');
                    }}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredActivities.map((activity) => {
                  const dateTime = formatDateTime(activity.createdAt);
                  const isExpanded = expandedItems.has(activity._id);
                  const hasMeta = activity.meta && Object.keys(activity.meta).length > 0;
                  
                  return (
                    <div
                      key={activity._id}
                      className={cn(
                        "border rounded-lg transition-all",
                        "hover:shadow-md",
                        isExpanded ? "bg-gray-50 dark:bg-gray-800/50" : "bg-white dark:bg-gray-900"
                      )}
                    >
                      {/* Activity Header */}
                      <div 
                        className="p-4 cursor-pointer"
                        onClick={() => hasMeta && toggleExpanded(activity._id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Icon */}
                            <div className={cn(
                              "p-2 rounded-lg border shrink-0",
                              getActionColor(activity.action)
                            )}>
                              {getActionIcon(activity.action)}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={cn(
                                  "font-mono text-xs",
                                  getActionColor(activity.action)
                                )}>
                                  {activity.action}
                                </Badge>
                                {activity.referenceType && (
                                  <Badge variant="outline" className="text-xs">
                                    {activity.referenceType}
                                  </Badge>
                                )}
                                {activity.referenceId && (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    ID: {activity.referenceId}
                                  </span>
                                )}
                              </div>
                              
                              {/* Meta preview (if collapsed and has meta) */}
                              {hasMeta && !isExpanded && activity.meta.message && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {highlightText(activity.meta.message, searchTerm)}
                                </p>
                              )}
                              
                              {/* Timestamp */}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {dateTime.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {dateTime.time}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Expand/Collapse Button */}
                          {hasMeta && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(activity._id);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Expanded Meta Details */}
                      {isExpanded && hasMeta && (
                        <div className="px-4 pb-4 pt-0 border-t mt-2">
                          <div className="pt-3 space-y-2">
                            {renderMetaData(activity.meta, activity.action, searchTerm)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper component for Activity icon
const ActivityIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
  </svg>
);