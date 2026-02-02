import { Bell, X, Check, CheckCheck, Trash2, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'error':
      return <XCircle className="w-4 h-4 text-destructive" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-success" />;
    default:
      return <Info className="w-4 h-4 text-primary" />;
  }
}

function NotificationItem({ 
  notification, 
  onDismiss, 
  onMarkAsRead,
  onClick 
}: { 
  notification: Notification;
  onDismiss: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onClick: (notification: Notification) => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick(notification);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(notification.id);
  };

  const sourceLabel = notification.source_user?.full_name || notification.source_user?.email;

  return (
    <div
      className={cn(
        "relative p-3 hover:bg-accent/50 cursor-pointer transition-colors",
        !notification.read && "bg-accent/30"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              "text-sm",
              !notification.read ? "font-semibold" : "font-medium"
            )}>
              {notification.title}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 flex-shrink-0 opacity-60 hover:opacity-100"
              onClick={handleDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
            {sourceLabel && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  From: {sourceLabel}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      {!notification.read && (
        <div className="absolute top-3 right-10 w-2 h-2 rounded-full bg-primary" />
      )}
    </div>
  );
}

export function NotificationDropdown() {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll 
  } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate if there's a link
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => markAllAsRead()}
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={() => clearAll()}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                No notifications
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onDismiss={dismissNotification}
                  onMarkAsRead={markAsRead}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
