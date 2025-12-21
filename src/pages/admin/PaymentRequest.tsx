import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiResponse } from "@/lib/api";

type VendorOption = {
  id: string;
  name: string;
  fullName: string;
  commissionRate: number;
  totalInMonth: number;
  totalPay: number;
};

type VendorPagedResponse = {
  data: VendorOption[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

type VendorSettlementResponse = {
  id: string;
  period: string;
  commissionRate: number;
  totalRevenue: number;
  totalPayment: number;
  dueDate: string;
  note?: string;
  walletId?: string;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export default function DebtPaymentRequest() {
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [period, setPeriod] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadVendors = async () => {
      setLoadingVendors(true);

      const token = localStorage.getItem("accessToken") || "";
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const params = new URLSearchParams({
        pageNumber: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      const res = await api.get<ApiResponse<VendorPagedResponse>>(
        `/api/vendor/admin?${params.toString()}`,
        headers
      );

      const payload = res?.data;
      if (payload && Array.isArray(payload.data)) {
        setVendors(payload.data);
        setTotalPages(payload.totalPages);
        setTotalRecords(payload.totalRecords);
      } else {
        setVendors([]);
      }

      setLoadingVendors(false);
    };

    loadVendors();
  }, [currentPage]);

  const handleCreateInvoice = async () => {
    if (!period || !dueDate) return;

    setSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken") || "";
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const commissionRateValue = vendors[0]?.commissionRate;

      const res = await api.post<VendorSettlementResponse[]>(
        "/api/vendorSettlement",
        {
          period,
          dueDate,
          note,
          commissionRate: commissionRateValue,
        },
        headers
      );

      const settlements = res;
      if (!Array.isArray(settlements) || settlements.length === 0) {
        return;
      }

      const batches = chunkArray(settlements, 5);

      for (let i = 0; i < batches.length; i++) {
        await api.post(
          "/api/walletTransaction/bulk-create",
          {
            items: batches[i].map((s) => ({
              settlementId: s.id,
              walletId: s.walletId,
              revenue: s.totalRevenue,
              commissionRate: s.commissionRate,
              commissionAmount: s.totalPayment,
              amount: s.totalPayment,
              paymentContent: s.period,
              paymentMethod: "Ví",
              message: s.note,
            })),
          },
          headers
        );
      }

      setPeriod("");
      setDueDate("");
      setNote("");
      setCurrentPage(1);
    } catch (err) {
      console.error("Create invoice failed", err);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <AdminLayout title="Yêu cầu thanh toán công nợ">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tạo yêu cầu thanh toán</CardTitle>
            <CardDescription>
              Áp dụng cho toàn bộ quán có doanh thu trong kỳ
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Kỳ thanh toán (VD: 09/2025)"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />

              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />

              <Input
                readOnly
                value={vendors[0]?.commissionRate ?? ""}
                placeholder="Tỉ lệ hoa hồng (%)"
              />
            </div>

            <Textarea
              placeholder="Ghi chú (tuỳ chọn)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách quán</CardTitle>
            <CardDescription>
              Trang {currentPage}/{totalPages} • Tổng {totalRecords} quán
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {loadingVendors && <p className="text-sm">Đang tải...</p>}

            {vendors.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">{v.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Chủ quán: {v.fullName}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm">
                    Doanh thu:{" "}
                    <span className="font-medium">
                      {formatCurrency(v.totalInMonth)}
                    </span>
                  </p>
                  <p className="text-sm font-semibold text-green-600">
                    Phải trả: {formatCurrency(v.totalPay)}
                  </p>
                </div>
              </div>
            ))}

            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Trang trước
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Trang sau
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button
          className="bg-green-600 hover:bg-green-700"
          onClick={handleCreateInvoice}
          disabled={submitting}
        >
          {submitting
            ? "Đang xử lý..."
            : "Gửi yêu cầu thanh toán (toàn hệ thống)"}
        </Button>
      </div>
    </AdminLayout>
  );
}
