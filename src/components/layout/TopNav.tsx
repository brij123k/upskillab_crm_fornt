import { useAuth } from '@/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Search, Calendar, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getUser } from '@/auth';
import { NotificationDropdown } from '@/components/NotificationDropdown';

interface TopNavProps {
  panel: 'admin' | 'bd';
}

export function TopNav({ panel }: TopNavProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white px-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className="flex items-center gap-4 flex-1">{/* search area if needed */}</div>
      <div className="flex items-center gap-3">
        <NotificationDropdown />
        <span className="hidden md:block h-6 w-px bg-slate-200" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2.5 h-11 pl-1.5 pr-3 rounded-full hover:bg-slate-50">
              <div className="w-9 h-9 rounded-full bg-gradient-to-b from-orange-500 to-orange-600 flex items-center justify-center shadow-[0_4px_10px_-4px_rgba(249,115,22,0.8)]">
                <span className="text-xs font-semibold text-white">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}