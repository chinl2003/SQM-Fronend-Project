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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api, ApiResponse } from "@/lib/api";
import { set } from "date-fns";

type VendorOption = {
  id: string;
  name: string;           
  fullName: string; 
  commissionRate: number;
  totalInMonth: number;
  totalPay: number;
};

type DebtInvoiceStatus = "pending" | "paid" | "overdue";

type DebtInvoice = {
  id: string;
  vendorId?: string;
  vendorName?: string;
  ownerName?: string;
  period: string;
  amount: number;
  dueDate: string;
  note?: string;
  status: DebtInvoiceStatus;
  createdAt: string;
  isAllVendor: boolean;
};

type VendorPagedResponse = {
  data: VendorApiItem[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type VendorApiItem = {
  id: string;
  name: string;
  ownerId: string;
  fullName?: string;
  commissionRate: number;
  totalInMonth: number;
  totalPay: number;
};


/* =========================
   HELPERS
========================= */

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

/* =========================
   PAGE
========================= */

export default function DebtPaymentRequest() {
  /* -------- vendors -------- */
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  /* -------- send mode -------- */
  const [sendMode, setSendMode] = useState<"single" | "all">("single");

  /* -------- form state -------- */
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [selectedVendorName, setSelectedVendorName] = useState("");
  const [selectedOwnerName, setSelectedOwnerName] = useState("");

  const [period, setPeriod] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [rate, setRate] = useState<number | "">("");
  const [totalIn, setTotalIn] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");

  /* -------- list -------- */
  const [invoices, setInvoices] = useState<DebtInvoice[]>([]);

  /* =========================
     LOAD VENDORS
  ========================= */

  useEffect(() => {
  const loadVendors = async () => {
    try {
      setLoadingVendors(true);
      const token = localStorage.getItem("accessToken") || "";
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await api.get<ApiResponse<VendorPagedResponse>>(
        "/api/vendor/admin",
        headers
      );

      const vendorArray = res?.data?.data;

      if (!Array.isArray(vendorArray)) {
        console.error("Vendor API response is not array", res.data);
        setVendors([]);
        return;
      }

      // map về đúng shape UI cần
      const mapped: VendorOption[] = vendorArray.map((v) => ({
        id: v.id,
        name: v.name,
        fullName: v.fullName ?? v.ownerId,
        commissionRate: v.commissionRate,
        totalInMonth: v.totalInMonth,
        totalPay: v.totalPay
      }));

      setVendors(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách quán.");
      setVendors([]);
    } finally {
      setLoadingVendors(false);
    }
  };

  loadVendors();
}, []);



  /* =========================
     HANDLERS
  ========================= */

  const handleSelectVendor = (vendorId: string) => {
    setSelectedVendorId(vendorId);

    const v = vendors.find((x) => x.id === vendorId);
    setSelectedVendorName(v?.name ?? "");
    setSelectedOwnerName(v?.fullName ?? "");
    setAmount(v?.totalPay ?? "");
    setRate(v?.commissionRate ?? "");
    setTotalIn(v?.totalInMonth ?? "");
  };

  const handleCreateInvoice = () => {
    if (!period || !amount || !dueDate) {
      toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }

    if (sendMode === "single" && !selectedVendorId) {
      toast.error("Vui lòng chọn quán.");
      return;
    }

    const newInvoice: DebtInvoice = {
      id: crypto.randomUUID(),
      vendorId: sendMode === "single" ? selectedVendorId : undefined,
      vendorName: sendMode === "single" ? selectedVendorName : undefined,
      ownerName: sendMode === "single" ? selectedOwnerName : undefined,
      period,
      amount: Number(amount),
      dueDate,
      note,
      status: "pending",
      createdAt: new Date().toISOString(),
      isAllVendor: sendMode === "all",
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    // reset form
    setSelectedVendorId("");
    setSelectedVendorName("");
    setSelectedOwnerName("");
    setPeriod("");
    setAmount("");
    setDueDate("");
    setNote("");

    toast.success(
      sendMode === "all"
        ? "Đã gửi yêu cầu thanh toán cho toàn bộ quán."
        : "Đã gửi yêu cầu thanh toán cho quán."
    );
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <AdminLayout title="Yêu cầu thanh toán công nợ">
      <div className="space-y-6">

        {/* ===== CREATE FORM ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Tạo yêu cầu thanh toán</CardTitle>
            <CardDescription>
              Gửi hóa đơn yêu cầu quán thanh toán phí dịch vụ / công nợ hàng tháng
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">

            {/* SEND MODE */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={sendMode === "single"}
                  onChange={() => setSendMode("single")}
                />
                Gửi cho 1 quán
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={sendMode === "all"}
                  onChange={() => setSendMode("all")}
                />
                Gửi cho toàn bộ quán
              </label>
            </div>

            {/* SELECT QUÁN + CHỦ QUÁN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quán */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Quán
                </label>
                <select
                  disabled={sendMode === "all"}
                  value={selectedVendorId}
                  onChange={(e) => handleSelectVendor(e.target.value)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm disabled:bg-muted"
                >
                  <option value="">
                    {loadingVendors
                      ? "Đang tải danh sách quán..."
                      : "Chọn quán"}
                  </option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chủ quán */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Chủ quán
                </label>
                <Input
                  value={selectedOwnerName}
                  placeholder="Tự chủ sở hữu"
                  disabled
                />
              </div>
            </div>

            {/* FORM INPUT */}
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                    placeholder="Kỳ thanh toán (VD: 09/2025)"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    />

                    <Input
                    type="date"
                    placeholder="Hạn thanh toán"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                    type="number"
                    placeholder="Doanh thu (VND)"
                    value={totalIn || ""}
                    readOnly
                    className="text-sm"
                    />

                    <div className="relative">
                        <Input
                            type="number"
                            placeholder="Tỉ lệ hoa hồng"
                            value={rate || ""}
                            readOnly
                            className="text-sm pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            %
                        </span>
                    </div>


                    <Input
                    type="number"
                    placeholder="Số tiền (VND)"
                    value={amount || ""}
                    readOnly
                    className="text-sm font-semibold"
                    />
                </div>
            </div>


            <Textarea
              placeholder="Ghi chú (tuỳ chọn)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleCreateInvoice}
            >
              Gửi yêu cầu thanh toán
            </Button>
          </CardContent>
        </Card>

        {/* ===== LIST ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách yêu cầu đã tạo</CardTitle>
          </CardHeader>

          <CardContent>
            {!invoices.length && (
              <p className="text-sm text-muted-foreground">
                Chưa có yêu cầu thanh toán nào.
              </p>
            )}

            <div className="space-y-4">
              {invoices.map((i, idx) => (
                <div key={i.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {i.isAllVendor
                          ? "Toàn bộ quán"
                          : `${i.vendorName} — ${i.ownerName}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Kỳ {i.period} • Hạn {i.dueDate}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-semibold">
                        {formatCurrency(i.amount)}
                      </span>
                      <Badge variant="secondary">
                        {i.isAllVendor ? "ALL" : "SINGLE"}
                      </Badge>
                    </div>
                  </div>

                  {i.note && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Ghi chú: {i.note}
                    </p>
                  )}

                  {idx < invoices.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
