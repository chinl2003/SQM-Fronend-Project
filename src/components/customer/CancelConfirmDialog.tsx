import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Clock } from "lucide-react";

interface QueueItem {
  id: string;
  vendorName: string;
  vendorImage: string;
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "refunded";
  paymentMethod: "vnpay" | "cash";
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled";
}

interface CancelConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  queueItem: QueueItem;
}

export function CancelConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  queueItem,
}: CancelConfirmDialogProps) {
  const canRefund =
    queueItem.paymentStatus === "paid" && queueItem.status !== "preparing";
  const isPreparingOrReady =
    queueItem.status === "preparing" || queueItem.status === "ready";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Xác nhận hủy đơn hàng</span>
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn hủy đơn hàng này không?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <img
                  src={queueItem.vendorImage}
                  alt={queueItem.vendorName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-medium">{queueItem.vendorName}</h4>
                  <p className="text-sm text-muted-foreground">
                    Tổng tiền: {queueItem.totalAmount.toLocaleString("vi-VN")}đ
                  </p>
                </div>
              </div>

              {isPreparingOrReady && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-3">
                  <div className="flex items-center space-x-2 text-destructive">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Không thể hủy</span>
                  </div>
                  <p className="text-xs text-destructive/80 mt-1">
                    Đơn hàng đã được chuẩn bị hoặc sẵn sàng, không thể hủy.
                  </p>
                </div>
              )}

              {canRefund && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Hoàn tiền:</strong> Số tiền đã thanh toán sẽ được
                    hoàn lại trong 1-3 ngày làm việc.
                  </p>
                </div>
              )}

              {queueItem.paymentStatus === "pending" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    Đơn hàng chưa thanh toán sẽ được hủy ngay lập tức.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Không hủy
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              className="flex-1"
              disabled={isPreparingOrReady}
            >
              Xác nhận hủy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
