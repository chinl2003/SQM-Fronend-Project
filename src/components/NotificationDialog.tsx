import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, Info } from "lucide-react";
import type { AppNotification } from "./Navigation";

interface NotificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead?: () => void;
}

export function NotificationDialog({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}: NotificationDialogProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "info":
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: AppNotification["type"], read: boolean) => {
    if (type === "warning") {
      return read
        ? "bg-amber-50 border-amber-100"
        : "bg-amber-50 border-amber-300";
    }

    // info
    return read
      ? "bg-blue-50 border-blue-100"
      : "bg-blue-50 border-blue-300";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Thông báo</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="h-5 px-2 rounded-full flex items-center justify-center text-xs"
                >
                  {unreadCount} mới
                </Badge>
              )}
              {notifications.length > 0 && onMarkAllRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={onMarkAllRead}
                >
                  Đánh dấu đã đọc
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors ${getNotificationColor(
                    notification.type,
                    notification.read
                  )} ${
                    !notification.read ? "ring-1 ring-primary/20" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground mb-1">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {notification.time}
                        </span>
                        {!notification.read && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-0.5"
                          >
                            Mới
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="flex justify-center pt-2 border-t">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}