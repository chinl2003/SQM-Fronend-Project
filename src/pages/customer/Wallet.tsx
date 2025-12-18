// src/pages/Wallet.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Clock, CreditCard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, ApiResponse } from "@/lib/api";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type WalletTransactionStatus = 0 | 1 | 2 | 3 | 4;
type WalletTransactionType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type TransactionResponseDto = {
  id?: string | null;
  amount: number;
  date: string;
  type?: WalletTransactionType | null;
  status?: WalletTransactionStatus | null;
  externalTransactionId?: string | null;
  bankCode?: string | null;
  bankReference?: string | null;
  paymentMethod?: string | null;
  paymentContent?: string | null;
  responseCode?: string | null;
  secureHash?: string | null;
  message?: string | null;
  walletBalance: number;
};

type WalletHistoryPageDto = {
  data: TransactionResponseDto[];
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

type WalletHistoryApiResponse = ApiResponse<WalletHistoryPageDto>;

interface Transaction {
  id: string;
  type: "deposit" | "payment" | "refund";
  amount: number;
  description: string;
  date: string;
  status: "completed" | "pending" | "failed";
  paymentMethod: string;
}

type PaymentResponse = { paymentUrl: string; transactionId: string; amount: number };
type PaymentResponseApi = ApiResponse<PaymentResponse>;

type PaymentResult = { code: string; amount?: number };
type PaymentResultApi = ApiResponse<PaymentResult>;

function mapType(t?: WalletTransactionType | null): Transaction["type"] {
  switch (t) {
    case 0:
      return "deposit";
    case 2:
      return "refund";
    default:
      return "payment";
  }
}

function mapStatus(s?: WalletTransactionStatus | null): Transaction["status"] {
  switch (s) {
    case 2:
      return "completed";
    case 3:
    case 4:
      return "failed";
    default:
      return "pending";
  }
}

const STATUS_FILTER_LABEL: Record<string, string> = {
  all: "Tất cả trạng thái",
  "0": "Chờ xử lý",
  "1": "Đang xử lý",
  "2": "Thành công",
  "3": "Thất bại",
  "4": "Đã hủy",
};

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [heldBalance, setHeldBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [totalIn, setTtotalIn] = useState(0);
  const [totalOut, setTotalOut] = useState(0);
  const [totalTransaction, setTotalTransaction] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const handleTopupAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = e.target.value.replace(/,/g, "").replace(/\D/g, "");
    setTopupAmount(numeric ? numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "");
  }

  const handleConfirmTopup = async () => {
    try {
      const numeric = Number(topupAmount.replace(/,/g, ""));
      if (!numeric || numeric <= 0) {
        toast.error("Số tiền nạp không hợp lệ");
        return;
      }

      const token = localStorage.getItem("accessToken") || "";
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await api.post<PaymentResponseApi>("/api/VNPay/create-payment", { amount: numeric }, headers);

      const payload = (res?.data as any) ?? res;
      const payment: PaymentResponse =
        (payload?.data as PaymentResponse) ?? (payload as PaymentResponse);

      if (!payment?.paymentUrl || !payment?.transactionId) {
        throw new Error("Không lấy được link thanh toán VNPay.");
      }

      localStorage.setItem("lastVnPayTransactionId", payment.transactionId);
      window.location.href = payment.paymentUrl;
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Có lỗi khi tạo giao dịch VNPay.");
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("accessToken") || "";
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const w = await api.get<ApiResponse<any>>("/api/wallet/balance", headers);
        const walletInfo = (w?.data as any)?.data ?? w?.data ?? w;
        const id = walletInfo?.id ?? walletInfo?.Id ?? null;
        if (!id) {
          setWalletId(null);
          setBalance(0);
          setAvailableBalance(0);
          setHeldBalance(0);
          return;
        }

        else {
          const bal = Number(walletInfo.balance ?? 0);
          const held = Number(walletInfo.heldBalance  ?? 0);
          const avail = Number(walletInfo.availableBalance ?? 0);
          const totalIn = Number(walletInfo.totalIn ?? 0);
          const totalOut = Number(walletInfo.totalOut ?? 0);
          const totalTransaction = Number(walletInfo.totalTransaction ?? 0);
          setBalance(bal);
          setAvailableBalance(avail);
          setHeldBalance(held);
          setTtotalIn(totalIn);
          setTotalOut(totalOut);
          setTotalTransaction(totalTransaction);
        }

        setWalletId(id);
        
      } catch (err) {
        console.error(err);
        toast.error("Không lấy được thông tin ví. Vui lòng thử lại.");
      }
    };
    load();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has("vnp_TxnRef")) return;

    const run = async () => {
      try {
        const token = localStorage.getItem("accessToken") || "";
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const body: Record<string, string> = {};
        params.forEach((v, k) => (body[k] = v));

        const savedId = localStorage.getItem("lastVnPayTransactionId");
        if (savedId) body.TransactionId = savedId;

        const res = await api.post<PaymentResultApi>("/api/VNPay/validate", body, headers);
        const payload = (res?.data as any) ?? res;
        const result: PaymentResult =
          (payload?.data as PaymentResult) ?? (payload as PaymentResult);

        if (params.get("vnp_ResponseCode") === "00") {
          toast.success(
            `Nạp tiền thành công: ${(result.amount ?? 0).toLocaleString("vi-VN")} VND`
          );
        } else {
          toast.error("Thanh toán VNPay thất bại hoặc bị hủy.");
        }

        localStorage.removeItem("lastVnPayTransactionId");
        navigate("/customer/wallet", { replace: true });
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message || "Lỗi xác thực VNPay");
      }
    };
    run();
  }, [location.search, navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingHistory(true);
        const token = localStorage.getItem("accessToken") || "";
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const params = new URLSearchParams({
          pageNumber: `${currentPage}`,
          pageSize: `${pageSize}`,
        });
        if (statusFilter !== "all") params.append("status", statusFilter);

        const res = await api.get<WalletHistoryApiResponse>(`/api/wallet/history?${params.toString()}`, headers);
        const p = res?.data;
        setTotalPages(p.totalPages);
        setTotalRecords(p.totalRecords);

        setTransactions(
          p.data.map((t) => ({
            id: t.id ?? "",
            amount: t.amount,
            date: new Date(t.date).toLocaleString("vi-VN"),
            type: mapType(t.type),
            status: mapStatus(t.status),
            paymentMethod: t.paymentMethod || "VNPay",
            description:
              t.message ||
              (t.type === 0 ? "Nạp tiền vào ví" : "Giao dịch ví"),
          }))
        );
      } catch (err) {
        console.error(err);
        toast.error("Không tải được lịch sử ví.");
      } finally {
        setLoadingHistory(false);
      }
    };
    load();
  }, [statusFilter, currentPage, pageSize, walletId]);

  const totalDeposit = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "deposit" && t.amount > 0)
        .reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const totalSpending = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "payment" && t.amount < 0)
        .reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation userType="customer" queueCount={0} />

      <div className="w-full px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Ví của tôi</h1>
            <p className="text-muted-foreground">Quản lý số dư và lịch sử giao dịch</p>
          </div>

          <div className="w-full md:w-64">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_FILTER_LABEL).map(([v, lbl]) => (
                  <SelectItem key={v} value={v}>
                    {lbl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="mb-8 bg-gradient-to-br from-primary via-primary-light to-primary-dark border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-4 w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-3">
                  {[["Số dư ví", balance], ["Số dư khả dụng", availableBalance], ["Số tiền tạm giữ", heldBalance]].map(
                    ([label, value], i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="flex items-center gap-2">
                          <WalletIcon className="h-5 w-5 text-white/80" />
                          <span className="text-sm text-white/80">{label}</span>
                        </div>
                        <div className="mt-1 text-3xl font-bold text-white">
                          {formatCurrency(Number(value))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end ml-6">
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <CreditCard className="h-12 w-12 text-white" />
                </div>
                <div className="mt-4">
                  <Dialog open={isTopupOpen} onOpenChange={setIsTopupOpen}>
                    <Button
                      className="bg-white text-primary"
                      size="lg"
                      onClick={() => setIsTopupOpen(true)}
                    >
                      Nạp tiền
                    </Button>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nạp tiền vào ví</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Số tiền</label>
                        <Input
                          inputMode="numeric"
                          value={topupAmount}
                          onChange={handleTopupAmountChange}
                          className="text-lg"
                        />
                        {topupAmount && (
                          <p className="text-xs">
                            Bạn đang nạp: <span className="font-semibold">{topupAmount} VND</span>
                          </p>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTopupOpen(false)}>
                          Hủy
                        </Button>
                        <Button onClick={handleConfirmTopup} disabled={!topupAmount}>
                          Nạp tiền
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1">Tổng nạp</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalIn)}
                  </p>
                </div>
                <div className="p-3 bg-green-200 rounded-lg">
                  <ArrowDownLeft className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1">Tổng chi tiêu</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(totalOut)}
                  </p>
                </div>
                <div className="p-3 bg-red-200 rounded-lg">
                  <ArrowUpRight className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1">Giao dịch</p>
                  <p className="text-2xl font-bold">{totalTransaction}</p>
                </div>
                <div className="p-3 bg-primary/20 rounded-lg">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Lịch sử giao dịch</CardTitle>
            <CardDescription>Tất cả giao dịch VNPay & thanh toán</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <p>Đang tải...</p>
            ) : transactions.length === 0 ? (
              <p>Chưa có giao dịch nào.</p>
            ) : (
              <>
                <div className="space-y-4">
                  {transactions.map((t, i) => (
                    <div key={t.id}>
                      <div className="flex items-center justify-between py-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-3 bg-muted rounded-lg">
                            {t.type === "deposit" ? (
                              <ArrowDownLeft className="h-4 w-4 text-green-600" />
                            ) : t.type === "refund" ? (
                              <ArrowDownLeft className="h-4 w-4 text-blue-600" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium mb-1">{t.description}</p>
                            <div className="flex items-center gap-3 flex-wrap text-sm opacity-75">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {t.date}
                              </span>
                              <span>•</span>
                              <span>{t.paymentMethod}</span>
                              <span>•</span>
                              <Badge
                                variant={
                                  t.status === "completed"
                                    ? "default"
                                    : t.status === "failed"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {t.status === "completed"
                                  ? "Thành công"
                                  : t.status === "failed"
                                  ? "Thất bại"
                                  : "Đang xử lý"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <p
                          className={`text-xl font-bold ${
                            t.type === "payment" ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {t.type === "payment" ? "-" : "+"}
                          {formatCurrency(Math.abs(t.amount))}
                        </p>
                      </div>
                      {i < transactions.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm">
                    Trang {currentPage}/{totalPages} • Tổng {totalRecords}
                  </p>
                  <div className="flex gap-2">
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
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}