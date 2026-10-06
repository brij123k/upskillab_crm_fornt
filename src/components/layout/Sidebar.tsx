import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  UserCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  Megaphone,
  UserMinus,
  Target,
  CheckSquare,
  Phone,
  Video,
  CreditCard,
  PhoneCall,
  User,
  ListOrdered,
  CalendarDays,
  ClipboardList,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import logo from '@/assets/logo.png';
import { getUser } from "@/auth";
import { hasModulePermission } from '@/utils/modulePermissions';
import { hasPermission } from '@/utils/permissions';
import { connectCallSocket, disconnectCallSocket } from '@/config/callSocket';
import { useToast } from '@/components/ui/use-toast';
import { CallFeedbackModal } from '../CallFeedbackModal';
import { ReturnCallModal } from '../ReturnCallModal';
import { postDataHandlerWithToken } from '@/config/services';
import { useEffect, useState } from 'react';
import ApiConfig from '@/config/apiConfig';
import { useSidebar } from './SidebarContext';

interface SidebarProps {
  panel: 'admin' | 'bd';
}

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', module: 'admin_dashboard' },
  { icon: Users, label: 'Users & Roles', path: '/admin/users', module: 'users' },
  { icon: FileText, label: 'Leads & Data', path: '/admin/leads', module: 'leads' },
  { icon: Target, label: 'Source Campaigns', path: '/admin/source-campaigns', module: 'source_campaigns' },
  { icon: PhoneCall, label: 'Call Logs', path: '/admin/calls', module: 'call_logs' },
  { icon: Video, label: 'Meeting Logs', path: '/admin/meetings', module: 'meeting_logs' },
  { icon: ListOrdered, label: 'Orders', path: '/admin/orders', module: 'orders' },
  { icon: CreditCard, label: 'Payments', path: '/admin/payments', module: 'payments' },
  { icon: DollarSign, label: 'Subscriptions', path: '/admin/subscriptions', module: 'subscriptions' },
  { icon: FileText, label: 'Task Management', path: '/admin/tasks', module: 'tasks' },
  { icon: BarChart3, label: 'Reports', path: '/admin/reports', module: 'reports' },
  { icon: Target, label: 'Targets', path: '/admin/targets', module: 'targets' },
  { icon: CalendarDays, label: 'Attendance & Policy', path: '/admin/attendance-policy', module: 'attendance' },
];

const bdNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/bd', module: 'bd_dashboard' },
  { icon: User, label: 'Users', path: '/bd/users', module: 'user' },
  { icon: Target, label: 'Source Campaigns', path: '/bd/source-campaigns', module: 'source_campaigns' },
  { icon: Target, label: 'Leads', path: '/bd/leads', module: 'leads' },
  { icon: CheckSquare, label: 'Tasks', path: '/bd/tasks', module: 'tasks' },
  { icon: PhoneCall, label: 'Call Logs', path: '/bd/calls', module: 'call_logs' },
  { icon: Video, label: 'Meeting Logs', path: '/bd/meetings', module: 'meeting_logs' },
  { icon: FileText, label: 'Task Management', path: '/bd/tasks', module: 'task' },
  { icon: ListOrdered, label: 'Orders', path: '/bd/orders', module: 'orders' },
  { icon: CreditCard, label: 'Payments', path: '/bd/payments', module: 'payments' },
  { icon: CreditCard, label: 'Loan Management', path: '/bd/loan-management', module: 'loans' },
  { icon: CreditCard, label: 'Subscription', path: '/bd/subscriptions', module: 'subscriptions' },
  { icon: CalendarDays, label: 'Attendance & Leave', path: '/bd/attendance-leave', module: 'my_leaves' },
  { icon: ClipboardList, label: 'Leave Requests', path: '/bd/leave-requests', module: 'leave_requests' },
  { icon: BarChart3, label: 'Reports', path: '/bd/reports', module: 'reports' },
  { icon: Target, label: 'Targets', path: '/bd/targets', module: 'targets' },
  { icon: Settings, label: 'Settings', path: '/bd/settings', module: 'bd_settings' },
];

export function Sidebar({ panel }: SidebarProps) {
  const location = useLocation();
  const { toast } = useToast();
  const { isExpanded, toggleSidebar } = useSidebar();
  const [isCallFeedbackModalOpen, setIsCallFeedbackModalOpen] = useState(false);
  const [currentCallData, setCurrentCallData] = useState<any>(null);
  const [isCallBackModalOpen, setIsCallBackModalOpen] = useState(false);
  const [currentCallBack, setCurrentCallBack] = useState<any>(null);
  const [isUnknownCallModalOpen, setIsunknownCallModalOpen] = useState(false);
  const [currentUnknownCall, setCurrentunknownCallBack] = useState<any>(null);

  const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");
  const user = getUser();

  const handleCallCompleted = (data: any) => {
    setCurrentCallBack(null);
    setIsCallBackModalOpen(false);
    setCurrentCallData(data);
    setIsCallFeedbackModalOpen(true);
  };
  const handleReturnCall = (data: any) => {
    setCurrentCallBack(data);
    setIsCallBackModalOpen(true);
  };
  const handleUnknownCall = (data: any) => {
    setCurrentunknownCallBack(data);
    setIsunknownCallModalOpen(true);
  };

  useEffect(() => {
    const socket = connectCallSocket({
      onCallCompleted: handleCallCompleted,
      onCallBackReceived: handleReturnCall,
      onUnknownCall: handleUnknownCall,
    });
    return () => disconnectCallSocket();
  }, []);

  const handleFeedbackSubmit = async (feedbackData: {
    stageId: string;
    outcome: string;
    remark: string;
  }) => {
    try {
      const payload = {
        callId: currentCallData.callId,
        stageId: feedbackData.stageId,
        outcome: feedbackData.outcome,
        remark: feedbackData.remark,
      };
      const response = await postDataHandlerWithToken(ApiConfig.updateCallLog, payload, true);
      if (response) {
        toast({ title: "Success", description: "Call feedback submitted successfully" });
      }
      return response;
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit call feedback", variant: "destructive" });
      throw error;
    }
  };

  const getNavItems = () => {
    switch (panel) {
      case 'admin': return adminNavItems;
      case 'bd': return bdNavItems;
      default: return [];
    }
  };

  const navItems = getNavItems();
  const panelConfig = { admin: 'Admin Panel', bd: 'BD Panel' };

  const shouldShowNavItem = (module: string): boolean => {
    if (panel === 'admin') return true;
    if (panel === 'bd') {
      if (module === 'my_announcements') return true;
      if (module === 'my_leaves') return true;
      if (module === 'leave_requests') return hasPermission(permissions, 'leave', 'approve');
      if (module === 'bd_dashboard') return true;
      if (module === 'bd_settings') return true;
      if (module === 'payments') return hasPermission(permissions, 'orders', 'read_payment_history');
      if (module === 'loans') return hasPermission(permissions, 'orders', 'read_loans');
      if (module) return hasModulePermission(permissions, module);
      return true;
    }
    return true;
  };

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200/70 transition-all duration-300 ease-in-out",
          isExpanded ? "w-64" : "w-16"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo & Toggle Button */}
          <div className={cn("flex items-center h-16 border-b border-slate-100", isExpanded ? "justify-between px-4" : "justify-center px-2")}>
            <div className={cn("flex items-center gap-3 overflow-hidden", isExpanded ? "opacity-100" : "opacity-0 w-0")}>
              <img src={logo} alt="Logo" className="w-10 h-10 rounded-xl flex-shrink-0 shadow-sm ring-1 ring-orange-100" />
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-900 text-[15px] leading-tight">{panelConfig[panel]}</h2>
                <p className="text-xs text-slate-500 truncate">{user.name}</p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl hover:bg-orange-50 text-slate-500 hover:text-orange-600 transition-colors"
              aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isExpanded ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation - hide scrollbar */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 hide-scrollbar">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== `/${panel}` && location.pathname.startsWith(item.path));
                if (!shouldShowNavItem(item.module)) return null;
                return (
                  <li key={item.path} className="relative group">
                    <NavLink
                      to={item.path}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl text-[14.5px] transition-all duration-200",
                        isExpanded ? "px-3 py-2.5" : "justify-center px-0 py-2.5",
                        isActive
                          ? "bg-gradient-to-r from-orange-50 to-orange-50/40 text-orange-600 font-semibold"
                          : "text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-orange-500" />
                      )}
                      <item.icon className={cn("w-[19px] h-[19px] flex-shrink-0", isActive ? "text-orange-500" : "text-slate-500 group-hover:text-slate-700")} />
                      <span
                        className={cn(
                          "whitespace-nowrap transition-opacity duration-200",
                          isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                        )}
                      >
                        {item.label}
                      </span>
                    </NavLink>
                    {!isExpanded && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                        {item.label}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          {isExpanded && (
            <div className="p-3 border-t border-slate-100">
              <div className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-orange-100 ring-2 ring-white flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-orange-600">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email || <span className="capitalize">{panel}</span>}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </div>
            </div>
          )}
          {!isExpanded && (
            <div className="p-3 border-t border-slate-100">
              <div className="flex justify-center">
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-orange-600">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <style>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <CallFeedbackModal
        open={isCallFeedbackModalOpen}
        onOpenChange={() => {
          setIsCallFeedbackModalOpen(false);
          setCurrentCallData(null);
        }}
        callData={currentCallData}
        onSubmit={handleFeedbackSubmit}
      />
      <ReturnCallModal
        open={isCallBackModalOpen}
        onOpenChange={() => {
          setIsCallBackModalOpen(false);
          setCurrentCallBack(null);
        }}
        callData={currentCallBack}
      />
    </>
  );
}