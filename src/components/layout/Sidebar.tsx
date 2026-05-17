import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  DollarSign,
  BarChart3,
  Shield,
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
} from 'lucide-react';
import logo from '@/assets/logo.png';
import { getUser } from "@/auth";
import { hasModulePermission } from '@/utils/modulePermissions';
import { hasPermission } from '@/utils/permissions';
import { connectCallSocket, disconnectCallSocket, returnCallSocket, UnknownCallSocket } from '@/config/callSocket';
import { useToast } from '@/components/ui/use-toast';
import { CallFeedbackModal } from '../CallFeedbackModal';
import { ReturnCallModal } from '../ReturnCallModal';

import { postDataHandlerWithToken } from '@/config/services';
import { useEffect, useState } from 'react';
import ApiConfig from '@/config/apiConfig';
interface SidebarProps {
  panel: 'admin' | 'hr' | 'bd';
}

const adminNavItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    path: '/admin', 
    module: 'admin_dashboard' 
  },
  { 
    icon: Users, 
    label: 'Users & Roles', 
    path: '/admin/users', 
    module: 'users' 
  },
  { 
    icon: FileText, 
    label: 'Leads & Data', 
    path: '/admin/leads', 
    module: 'leads' 
  },
  { 
    icon: PhoneCall, 
    label: 'Call Logs', 
    path: '/admin/calls', 
    module: 'call_logs' 
  },
  { 
    icon: Video, 
    label: 'Meeting Logs', 
    path: '/admin/meetings', 
    module: 'meeting_logs' 
  },
  { 
    icon: ListOrdered, 
    label: 'Orders', 
    path: '/admin/orders', 
    module: 'orders' 
  },
  { 
    icon: CreditCard, 
    label: 'Payments', 
    path: '/admin/payments', 
    module: 'payments' 
  },
  { 
    icon: DollarSign, 
    label: 'Subscriptions', 
    path: '/admin/subscriptions', 
    module: 'subscriptions' 
  },
  { 
    icon: FileText, 
    label: 'Task Management', 
    path: '/admin/tasks', 
    module: 'tasks' 
  },
  { 
    icon: BarChart3, 
    label: 'Reports', 
    path: '/admin/reports', 
    module: 'reports' 
  },
];

const hrNavItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    path: '/hr', 
    module: 'hr_dashboard' 
  },
  { 
    icon: UserCircle, 
    label: 'Employees', 
    path: '/hr/employees', 
    module: 'employees' 
  },
  { 
    icon: Clock, 
    label: 'Attendance', 
    path: '/hr/attendance', 
    module: 'attendance' 
  },
  { 
    icon: TrendingUp, 
    label: 'Performance', 
    path: '/hr/performance', 
    module: 'performance' 
  },
  { 
    icon: AlertTriangle, 
    label: 'Warnings & PIP', 
    path: '/hr/warnings', 
    module: 'warnings' 
  },
  { 
    icon: Megaphone, 
    label: 'Announcements', 
    path: '/hr/announcements', 
    module: 'announcements' 
  },
  { 
    icon: BarChart3, 
    label: 'Reports', 
    path: '/hr/reports', 
    module: 'reports' 
  },
  { 
    icon: UserMinus, 
    label: 'Exit Management', 
    path: '/hr/exit', 
    module: 'exit_management' 
  },
];

const bdNavItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    path: '/bd', 
    module: 'bd_dashboard' 
  },
   { 
    icon: User, 
    label: 'Users', 
    path: '/bd/users', 
    module: 'user' 
  },
  { 
    icon: Target, 
    label: 'Leads', 
    path: '/bd/leads', 
    module: 'leads' 
  },
  { 
    icon: CheckSquare, 
    label: 'Tasks', 
    path: '/bd/tasks', 
    module: 'tasks' 
  },
  { 
    icon: PhoneCall, 
    label: 'Call Logs', 
    path: '/bd/calls', 
    module: 'call_logs' 
  },
  { 
    icon: Video, 
    label: 'Meeting Logs', 
    path: '/bd/meetings', 
    module: 'meeting_logs' 
  },
  { 
    icon: FileText, 
    label: 'Task Management', 
    path: '/bd/tasks', 
    module: 'task' 
  },
  { 
    icon: ListOrdered, 
    label: 'Orders', 
    path: '/bd/orders', 
    module: 'orders' 
  },
  { 
    icon: CreditCard, 
    label: 'Payments', 
    path: '/bd/payments', 
    module: 'payments' 
  },
  { 
    icon: CreditCard, 
    label: 'Loan Management', 
    path: '/bd/loan-management', 
    module: 'loans' 
  },
  { 
    icon: CreditCard, 
    label: 'Subscription', 
    path: '/bd/subscriptions', 
    module: 'subscriptions' 
  },
  { 
    icon: BarChart3, 
    label: 'Reports', 
    path: '/bd/reports', 
    module: 'reports' 
  },
  { 
    icon: Settings, 
    label: 'Settings', 
    path: '/bd/settings', 
    module: 'bd_settings' 
  },
];

export function Sidebar({ panel }: SidebarProps) {
  const location = useLocation();
  const { toast } = useToast();
    const [isCallFeedbackModalOpen, setIsCallFeedbackModalOpen] = useState(false);
  const [currentCallData, setCurrentCallData] = useState<any>(null);

  const [isCallBackModalOpen, setIsCallBackModalOpen] = useState(false);
const [currentCallBack, setCurrentCallBack] = useState<any>(null);
  const [isUnknownCallModalOpen,setIsunknownCallModalOpen] = useState(false)
  const [currentUnknownCall, setCurrentunknownCallBack] = useState<any>(null);

  const permissions = JSON.parse(
    localStorage.getItem("permissions") || "[]"
  );

  const user = getUser();
  
  const handleCallCompleted = (data: any) => {   
    // Set the call data and open modal
    setCurrentCallBack(null);
    setIsCallBackModalOpen(false)
    setCurrentCallData(data);
    setIsCallFeedbackModalOpen(true);
  };

  const handleReturnCall =(data:any)=>{
    setCurrentCallBack(data);
    setIsCallBackModalOpen(true)
  } 

  const handleUnknownCall =(data:any)=>{
    setCurrentunknownCallBack(data);
    setIsunknownCallModalOpen(true)
  } 
  // Connect to socket when component mounts
useEffect(() => {
  const socket = connectCallSocket({
    onCallCompleted: (data)=>{
      handleCallCompleted(data)
    },
    onCallBackReceived: (data) => {
      handleReturnCall(data)
    },
    onUnknownCall: (data) => {
      handleUnknownCall(data);
    },
  });

  return () => {
    disconnectCallSocket();
  };
}, []); // Empty dependency array

  // Function to handle feedback submission
  const handleFeedbackSubmit = async (feedbackData: {
    stageId: string;
    outcome: string;
    remark: string;
  }) => {
    try {
      // Make API call to submit feedback
      const payload = {
        callId:currentCallData.callId,
        stageId: feedbackData.stageId,
        outcome: feedbackData.outcome,
        remark: feedbackData.remark,
      };
      
      // Adjust this API endpoint as per your backend
      const response = await postDataHandlerWithToken(
        ApiConfig.updateCallLog,
        payload, 
        true
      );
      
      if (response) {
        toast({
          title: "Success",
          description: "Call feedback submitted successfully",
          variant: "default",
        });
      }
      
      return response;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit call feedback",
        variant: "destructive",
      });
      throw error;
    }
  };
  // Get nav items based on panel
  const getNavItems = () => {
    switch(panel) {
      case 'admin':
        return adminNavItems;
      case 'hr':
        return hrNavItems;
      case 'bd':
        return bdNavItems;
      default:
        return [];
    }
  };
  
  const navItems = getNavItems();
  
  const panelConfig = {
    admin: { label: 'Admin Panel' },
    hr: { label: 'HR Panel' },
    bd: { label: 'BD Panel' },
  };

  // Function to check if a nav item should be visible
  const shouldShowNavItem = (module: string): boolean => {
    if (module === 'my_announcements') {
      return panel === 'bd';
    }
    // Always show BD dashboard for BD panel
    if (panel === 'bd' && module === 'bd_dashboard') {
      return true;
    }
    if (panel === 'bd' && module === 'bd_settings') {
      return true;
    }
    if (panel === 'bd' && module === 'payments') {
      if(hasPermission(permissions, 'orders', 'read_payment_history')) {
        return true;
      }
    }
    if (panel === 'bd' && module === 'loans') {
      if(hasPermission(permissions, 'orders', 'read_loans')) {
        return true;
      }
    }
    // if (panel === 'bd' && module === 'subscriptions') {
    //   return true;
    // }
    // Check module permission
    if (module) {
      return hasModulePermission(permissions, module);
    }
    
    return true;
  };

  return (
    <>
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 sidebar-gradient border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <img src={logo} alt="Logo" className="w-9 h-9 rounded-lg" />
          <div>
            <h2 className="font-semibold text-sidebar-foreground text-sm">{panelConfig[panel].label}</h2>
            <p className="text-xs text-sidebar-foreground/60">{user.name}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path !== `/${panel}` && location.pathname.startsWith(item.path));
              
              // Check if item should be visible
              if (!shouldShowNavItem(item.module)) {
                return null;
              }
              
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </NavLink>
                </li>
              );
            }).filter(Boolean)} {/* Remove null items */}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-xs font-medium text-sidebar-foreground">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate capitalize">{panel}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
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
