import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, AlertCircle, Truck } from "lucide-react";

interface Notification {
  id: string;
  type: "upcoming" | "preparing" | "ready" | "completed";
  orderId: string;
  vendorName: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDialog({ isOpen, onClose }: NotificationDialogProps) {
  const [notifications] = useState<Notification[]>([
    {
      id: "1",
      type: "upcoming",
      orderId: "QU001",
      vendorName: "Bánh Mì Hương Lan",
      message: "Đơn hàng QU001 của bạn sắp đến lượt. Vui lòng đến cửa hàng để xác nhận món!",
      time: "2 phút trước",
      read: false
    },
    {
      id: "2", 
      type: "preparing",
      orderId: "QU002",
      vendorName: "Phở Hà Nội",
      message: "Đơn hàng QU002 của bạn đã được xác nhận thành công và đang trong quá trình chế biến. Dự kiến nhận hàng trong 10 phút nữa nhé bạn ơi!",
      time: "5 phút trước",
      read: false
    },
    {
      id: "3",
      type: "ready", 
      orderId: "QU003",
      vendorName: "Cơm Tấm Sài Gòn",
      message: "Đơn hàng QU003 tại quán Cơm Tấm Sài Gòn đã sẵn sàng. Hãy đến quán nhận đơn ngay nhé!",
      time: "10 phút trước",
      read: true
    },
    {
      id: "4",
      type: "completed",
      orderId: "QU004", 
      vendorName: "Trà Sữa OneZone",
      message: "Đơn hàng QU004 của bạn tại quán Trà Sữa OneZone đã được giao thành công! Chúc bạn ngon miệng!",
      time: "1 giờ trước",
      read: true
    }
  ]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "upcoming":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "preparing":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "ready":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "completed":
        return <Truck className="h-4 w-4 text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "upcoming":
        return "bg-amber-50 border-amber-200";
      case "preparing":
        return "bg-blue-50 border-blue-200";
      case "ready":
        return "bg-green-50 border-green-200";
      case "completed":
        return "bg-muted/30 border-muted";
      default:
        return "bg-card border-border";
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Thông báo
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            )}
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
                  className={`p-3 rounded-lg border transition-colors ${getNotificationColor(notification.type)} ${
                    !notification.read ? "ring-1 ring-primary/20" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground mb-1">
                        {notification.vendorName}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {notification.time}
                        </span>
                        {!notification.read && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">
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