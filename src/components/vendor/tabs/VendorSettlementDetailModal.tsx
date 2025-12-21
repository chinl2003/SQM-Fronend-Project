import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { useState } from "react";
import Swal from "sweetalert2";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { SweetAlertOptions } from "sweetalert2";


type VendorSettlementDetail = {
  id: string;
  vendorId: string;
  walletId: string | null;
  period: string;
  commissionRate: number;
  totalRevenue: number;
  totalPayment: number;
  dueDate: string;
  note?: string | null;
};

interface Props {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  data: VendorSettlementDetail | null;
  walletTransactionId?: string | null;
  availableBalance?: number;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(v);
}

export default function VendorSettlementDetailModal({
  open,
  onClose,
  loading,
  data,
  walletTransactionId,
  availableBalance,
}: Props) {
  const [paying, setPaying] = useState(false);

  const fireSwal = (options: SweetAlertOptions) =>
  Swal.fire({
    ...options,
    didOpen: (popup) => {
      popup.style.zIndex = "9999";
      const backdrop = document.querySelector(
        ".swal2-backdrop"
      ) as HTMLElement | null;
      if (backdrop) backdrop.style.zIndex = "9998";
    },
  });

  const confirmPayDebt = async () => {
  if (!data || !walletTransactionId) return false;

  if (
    availableBalance === undefined ||
    availableBalance < data.totalPayment
  ) {
    await Swal.fire({
      icon: "error",
      title: "Số dư không đủ",
      html: `
        <p>Số dư khả dụng của bạn <strong>không đủ</strong> để thanh toán công nợ.</p>
        <p style="margin-top:8px">
          Số dư khả dụng: <strong>${formatCurrency(availableBalance ?? 0)}</strong><br/>
          Số tiền cần thanh toán: <strong>${formatCurrency(data.totalPayment)}</strong>
        </p>
      `,
      confirmButtonText: "Đã hiểu",
    });
    return false;
  }

    const result = await Swal.fire({
        title: "Xác nhận thanh toán",
        html: `
        <p>Bạn có chắc chắn muốn <strong>thanh toán công nợ</strong> không?</p>
        <p style="margin-top:8px;color:#555">
            Số tiền: <strong>${formatCurrency(data.totalPayment)}</strong>
        </p>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xác nhận thanh toán",
        cancelButtonText: "Hủy",
        reverseButtons: true,
        focusCancel: true,
    });

    return result.isConfirmed;
    };

  const handlePayDebt = async () => {
    if (!walletTransactionId || !data) return;

    onClose();

    const confirmed = await confirmPayDebt();

    if (!confirmed) {
        setTimeout(() => {
        }, 0);
        return;
    }

    try {
        setPaying(true);

        const token = localStorage.getItem("accessToken") || "";
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        await api.put(
        `/api/walletTransaction/pay/${walletTransactionId}`,
        {},
        headers
        );

        toast.success("Thanh toán công nợ thành công");
    } catch (err) {
        console.error(err);
        toast.error("Thanh toán công nợ thất bại");
    } finally {
        setPaying(false);
    }
    };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-xl p-5">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-semibold text-green-700">
            Smart Queue Management (SQM)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Thông báo công nợ và phí hoa hồng hàng tháng
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-3" />

        {loading && (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Đang tải dữ liệu…
          </div>
        )}

        {!loading && !data && (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Chưa có dữ liệu công nợ cho kỳ này
          </div>
        )}

        {!loading && data && (
          <div className="space-y-4 text-sm">
            {/* Kỳ thanh toán */}
            <div className="rounded-lg bg-muted/60 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    Kỳ thanh toán
                  </p>
                  <p className="font-medium">{data.period}</p>
                </div>
                <Badge className="bg-amber-100 text-amber-700 text-xs">
                  Chờ thanh toán
                </Badge>
              </div>
            </div>

            {/* Số liệu */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border px-3 py-2">
                <p className="text-[11px] text-muted-foreground">
                  Tổng doanh thu
                </p>
                <p className="font-semibold">
                  {formatCurrency(data.totalRevenue)}
                </p>
              </div>

              <div className="rounded-lg border px-3 py-2">
                <p className="text-[11px] text-muted-foreground">
                  Tỷ lệ hoa hồng
                </p>
                <p className="font-semibold">
                  {data.commissionRate}%
                </p>
              </div>

              <div className="col-span-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                <p className="text-[11px] text-rose-600">
                  Tổng phí phải thanh toán
                </p>
                <p className="text-lg font-bold text-rose-600">
                  {formatCurrency(data.totalPayment)}
                </p>
              </div>

              <div className="col-span-2 rounded-lg border px-3 py-2">
                <p className="text-[11px] text-muted-foreground">
                  Hạn thanh toán
                </p>
                <p className="font-medium">
                  {format(new Date(data.dueDate), "dd/MM/yyyy")}
                </p>
              </div>
            </div>

            {data.note && (
              <>
                <Separator />
                <div className="rounded-lg bg-muted/40 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">
                    Ghi chú từ hệ thống SQM
                  </p>
                  <p className="text-xs leading-relaxed">
                    {data.note}
                  </p>
                </div>
              </>
            )}

            <Separator />

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Thông tin được ghi nhận tự động bởi hệ thống
              <strong> Smart Queue Management (SQM)</strong>.
              Vui lòng kiểm tra và hoàn tất nghĩa vụ thanh toán đúng hạn.
            </p>

            {walletTransactionId && (
              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="px-4 py-2 text-xs rounded-md border hover:bg-muted"
                  onClick={onClose}
                  disabled={paying}
                >
                  Đóng
                </button>

                <button
                  className="px-4 py-2 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  disabled={paying}
                  onClick={handlePayDebt}
                >
                  {paying ? "Đang thanh toán..." : "Thanh toán công nợ"}
                </button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
