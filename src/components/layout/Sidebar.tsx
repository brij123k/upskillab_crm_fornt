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
} from 'lucide-react';
import logo from '@/assets/logo.png';
import { getUser } from "@/auth";
interface SidebarProps {
  panel: 'admin' | 'hr' | 'bd';
}

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'Users & Roles', path: '/admin/users' },
  { icon: Building2, label: 'Departments', path: '/admin/departments' },
  { icon: FileText, label: 'Leads & Data', path: '/admin/leads' },
  { icon: DollarSign, label: 'Finance', path: '/admin/finance' },
  { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
  { icon: Shield, label: 'Security', path: '/admin/security' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

const hrNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/hr' },
  { icon: UserCircle, label: 'Employees', path: '/hr/employees' },
  { icon: Clock, label: 'Attendance', path: '/hr/attendance' },
  { icon: TrendingUp, label: 'Performance', path: '/hr/performance' },
  { icon: AlertTriangle, label: 'Warnings & PIP', path: '/hr/warnings' },
  { icon: Megaphone, label: 'Announcements', path: '/hr/announcements' },
  { icon: BarChart3, label: 'Reports', path: '/hr/reports' },
  { icon: UserMinus, label: 'Exit Management', path: '/hr/exit' },
];

const bdNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/bd' },
  { icon: Target, label: 'Leads', path: '/bd/leads' },
  { icon: CheckSquare, label: 'Tasks', path: '/bd/tasks' },
  { icon: Phone, label: 'Calls', path: '/bd/calls' },
  { icon: Video, label: 'Meetings', path: '/bd/meetings' },
  { icon: CreditCard, label: 'Payments', path: '/bd/payments' },
  { icon: BarChart3, label: 'Reports', path: '/bd/reports' },
  { icon: Settings, label: 'Settings', path: '/bd/settings' },
];

export function Sidebar({ panel }: SidebarProps) {
  const location = useLocation();
  
  const navItems = panel === 'admin' 
    ? adminNavItems 
    : panel === 'hr' 
    ? hrNavItems 
    : bdNavItems;

  const panelConfig = {
    admin: { label: 'Admin Panel' },
    hr: { label: 'HR Panel' },
    bd: { label: 'BD Panel' },
  };

  const user = getUser()
  return (
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
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-xs font-medium text-sidebar-foreground">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">John Doe</p>
              <p className="text-xs text-sidebar-foreground/60 truncate capitalize">{panel}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
