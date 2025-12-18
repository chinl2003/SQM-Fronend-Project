import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  MapPin,
  Users,
  Calendar,
  CreditCard,
  Banknote,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface QueueItem {
  id: string;
  vendorId: string;
  code: string;
  vendorName: string;
  vendorImage: string;
  vendorAddress: string;
  type: "join_queue" | "pre_order";
  slot?: string;
  position?: number;
  estimatedTime: string;
  status:
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  paymentMethod: "vnpay" | "cash";
  paymentStatus: "pending" | "paid" | "refunded";
  orderTime: string;
  canCancel: boolean;
  canUpdate: boolean;
  estimatedWaitTimeRaw?: string | null;
  estimatedServeTimeRaw?: string | null;
  delayMinutes?: number | null;
  delayReason?: string | null;
  hasDelay?: boolean;
  note?: string | null;
}

interface ViewQueueDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  queueItem: QueueItem;
}

const fmtServeTimeFull = (t?: string | null) => {
  if (!t) return "—";
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => n.toString().padStart(2, "0");
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const date = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  return `${time} ${date}`;
};

const fmtWaitTimeFromSpan = (span?: string | null) => {
  if (!span) return "—";
  const parts = span.split(":");
  if (parts.length < 2) return span;
  const h = parseInt(parts[0] || "0", 10);
  const m = parseInt(parts[1] || "0", 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return span;
  const totalMin = h * 60 + m;
  if (totalMin <= 0) return "—";
  return `${totalMin} phút`;
};

export function ViewQueueDetailDialog({
  isOpen,
  onClose,
  queueItem,
}: ViewQueueDetailDialogProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "confirmed":
        return "bg-blue-500";
      case "preparing":
        return "bg-orange-500";
      case "ready":
        return "bg-green-500";
      case "completed":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "preparing":
        return "Đang chuẩn bị";
      case "ready":
        return "Sẵn sàng";
      case "completed":
        return "Hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "preparing":
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case "ready":
        return <CheckCircle2 className="h-4 w-4" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "refunded":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Đã thanh toán";
      case "pending":
        return "Chờ thanh toán";
      case "refunded":
        return "Đã hoàn tiền";
      default:
        return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <img
              src={queueItem.vendorImage}
              alt={queueItem.vendorName}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span>Chi tiết đơn hàng</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">{queueItem.vendorName}</h3>
                <Badge
                  className={`${getStatusColor(queueItem.status)} text-white`}
                >
                  {getStatusIcon(queueItem.status)}
                  <span className="ml-1">
                    {getStatusText(queueItem.status)}
                  </span>
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Mã đơn hàng
                  </p>
                  <p className="text-base font-semibold">
                    #{(queueItem.code || "").toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Loại hàng đợi
                  </p>
                  <p className="text-base font-semibold">
                    {queueItem.type === "join_queue"
                      ? "Xếp hàng ngay"
                      : "Đặt trước"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{queueItem.vendorAddress}</span>
                </div>

                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Đặt lúc:{" "}
                    {new Date(queueItem.orderTime).toLocaleString("vi-VN")}
                  </span>
                </div>

                {queueItem.type === "pre_order" ? (
                  <>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Thời gian đợi đến lượt:{" "}
                        {fmtWaitTimeFromSpan(queueItem.estimatedWaitTimeRaw)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Thời gian nhận hàng dự kiến:{" "}
                        {fmtServeTimeFull(queueItem.estimatedServeTimeRaw)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Vị trí: {queueItem.position}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Thời gian đợi đến lượt:{" "}
                        {fmtWaitTimeFromSpan(queueItem.estimatedWaitTimeRaw)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Thời gian nhận hàng dự kiến:{" "}
                        {fmtServeTimeFull(queueItem.estimatedServeTimeRaw)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delay Information Card - only show if order has delay */}
          {queueItem.hasDelay && (
            <Card className="border-amber-500 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-900 mb-2">
                      Thông báo trễ đơn hàng
                    </h4>
                    <div className="space-y-1 text-sm">
                      {queueItem.delayMinutes && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-amber-700" />
                          <span className="text-amber-900">
                            <span className="font-medium">Thời gian trễ:</span>{" "}
                            {queueItem.delayMinutes} phút
                          </span>
                        </div>
                      )}
                      {queueItem.delayReason && (
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
                          <span className="text-amber-900">
                            <span className="font-medium">Lý do:</span>{" "}
                            {queueItem.delayReason}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Chi tiết đơn hàng</h4>

              <div className="space-y-2">
                {queueItem.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>
                      {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                ))}

                <Separator className="my-2" />

                <div className="flex justify-between font-medium">
                  <span>Tổng cộng</span>
                  <span className="text-primary">
                    {queueItem.totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {queueItem.note && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Ghi chú</h4>
                <div className="text-sm text-muted-foreground whitespace-pre-line">
                  {queueItem.note}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Thông tin thanh toán</h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {queueItem.paymentMethod === "vnpay" ? (
                      <CreditCard className="h-4 w-4 text-primary" />
                    ) : (
                      <Banknote className="h-4 w-4 text-green-600" />
                    )}
                    <span className="text-sm">
                      {queueItem.paymentMethod === "vnpay"
                        ? "Thanh toán qua ví"
                        : "Tiền mặt"}
                    </span>
                  </div>

                  <Badge
                    className={`${getPaymentStatusColor(
                      queueItem.paymentStatus
                    )} text-white text-xs`}
                  >
                    {getPaymentStatusText(queueItem.paymentStatus)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={onClose} className="w-full">
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}