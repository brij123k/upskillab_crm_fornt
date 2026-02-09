import { Bell, CheckCheck, X, Clock, AlertCircle, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationProps {
  n: any;
  onRead: (id: string) => void;
  navigate: (url: string) => void;
}

const NotificationItem = ({ n, onRead, navigate }: NotificationProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getNotificationIcon = () => {
    switch (n.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

const handleClick = (e: any) => {
  e.preventDefault();
  e.stopPropagation();

  if (!n.isRead) onRead(n._id);

  if (n.metadata?.redirectUrl) {
    navigate(n.metadata.redirectUrl);
  }
};

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group cursor-pointer p-3 hover:bg-accent/50 transition-colors",
        "border-b last:border-0",
        !n.isRead && "bg-blue-50/50 hover:bg-blue-100/50"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={cn(
                "text-sm font-medium mb-1 truncate",
                !n.isRead && "text-foreground"
              )}>
                {n.title}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {n.message}
              </p>
            </div>
            
            {n.metadata?.redirectUrl && (
              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
            )}
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatTime(n.createdAt)}
              </span>
              {/* {n.type && (
                <Badge 
                  variant="outline" 
                  className="text-xs h-5 px-1.5 capitalize"
                >
                  {n.type}
                </Badge>
              )} */}
            </div>
            
            {!n.isRead && (
              <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export function NotificationDropdown() {
  const { notifications, unreadCount, readOne, readAll } = useNotifications();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const recentNotifications = notifications.slice(0, 10); // Show only recent 10

  const handleNotificationClick = (id: string, redirectUrl?: string) => {
    if (!notifications.find(n => n._id === id)?.isRead) {
      readOne(id);
    }
    if (redirectUrl) {
      navigate(redirectUrl);
      setIsOpen(false);
    }
  };

  const handleReadAll = () => {
    readAll();
  };

  const getNotificationCountBadge = () => {
    if (unreadCount === 0) return null;
    
    return (
      <div className="absolute -top-1 -right-1">
        <div className="relative">
          <div className="absolute inset-0 animate-ping bg-destructive/50 rounded-full" />
          <Badge 
            variant="destructive" 
            className="h-5 min-w-5 px-1.5 text-xs font-medium relative"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "relative h-10 w-10 rounded-full",
              isOpen && "bg-accent"
            )}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {getNotificationCountBadge()}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
        onInteractOutside={(e) => {
    // allow outside click close
  }}
  onCloseAutoFocus={(e) => e.preventDefault()}
          align="end" 
          className={cn(
            "w-[320px] sm:w-[380px] md:w-[420px]",
            "max-h-[80vh] sm:max-h-[70vh]",
            "p-0 overflow-hidden",
            "shadow-lg border-2"
          )}
          sideOffset={8}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <h3 className="font-semibold text-base">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    handleReadAll();
  }}
                    className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-3 w-3" />
                    Mark all read
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-[300px] sm:h-[350px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h4 className="font-medium mb-1">No notifications</h4>
                <p className="text-sm text-muted-foreground">
                  You're all caught up!
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {/* Unread notifications first */}
                {unreadNotifications.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-blue-50/50">
                      <p className="text-xs font-medium text-blue-700">New</p>
                    </div>
                    {unreadNotifications.map((n) => (
                      <NotificationItem
                        key={n._id}
                        n={n}
                        onRead={(id) => handleNotificationClick(id, n.metadata?.redirectUrl)}
                        navigate={navigate}
                      />
                    ))}
                    {recentNotifications.filter(n => n.isRead).length > 0 && (
                      <Separator className="bg-muted" />
                    )}
                  </>
                )}
                
                {/* Read notifications */}
                {recentNotifications
                  .filter(n => n.isRead)
                  .map((n) => (
                    <NotificationItem
                      key={n._id}
                      n={n}
                      onRead={(id) => handleNotificationClick(id, n.metadata?.redirectUrl)}
                      navigate={navigate}
                    />
                  ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur">
              <div className="p-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {notifications.length} total notifications
                </p>
                {/* <button
                  onClick={() => navigate('/notifications')}
                  className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  View all
                </button> */}
              </div>
            </div>
          )}
        </DropdownMenuContent >
      </DropdownMenu>
    </div>
  );
}