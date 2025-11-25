// src/pages/Wallet.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  TrendingUp,
  CreditCard,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, ApiResponse } from "@/lib/api";
import { toast } from "sonner";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type WalletTransactionStatus = 0 | 1 | 2 | 3 | 4;
type WalletTransactionType =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8;

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

type PaymentResponse = {
  paymentUrl: string;
  transactionId: string;
  amount: number;
};
type PaymentResponseApi = ApiResponse<PaymentResponse>;

type PaymentResult = { code: string; amount?: number };
type PaymentResultApi = ApiResponse<PaymentResult>;

function mapType(t?: WalletTransactionType | null): Transaction["type"] {
  switch (t) {
    case 0:
      return "deposit";
    case 2:
      return "refund";
    case 1:
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
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
    case 0:
    case 1:
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
  const [balance, setBalance] = useState<number>(0);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [heldBalance, setHeldBalance] = useState<number>(0);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");

  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  const [walletId, setWalletId] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleTopupAmountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    const numeric = value.replace(/,/g, "").replace(/\D/g, "");

    if (!numeric) {
      setTopupAmount("");
      return;
    }

    const formatted = numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    setTopupAmount(formatted);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case "payment":
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case "refund":
        return <ArrowDownLeft className="h-4 w-4 text-primary" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "text-success";
      case "payment":
        return "text-destructive";
      case "refund":
        return "text-primary";
      default:
        return "text-foreground";
    }
  };

  const getStatusBadge = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-success text-success-foreground">
            Thành công
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning text-warning-foreground">
            Đang xử lý
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive">Thất bại</Badge>;
      default:
        return <Badge variant="secondary">Không xác định</Badge>;
    }
  };

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

      const res = await api.post<PaymentResponseApi>(
        "/api/VNPay/create-payment",
        { amount: numeric },
        headers
      );

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

  // ------------------------
  // NEW: fetch wallet id (from /api/wallet/balance) then call /api/wallet/{id}
  // ------------------------
  useEffect(() => {
    const fetchWalletAndDetails = async () => {
      try {
        const token = localStorage.getItem("accessToken") || "";
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        // 1) call existing endpoint to get wallet info (by current user)
        const res = await api.get<ApiResponse<any>>("/api/wallet/balance", headers);

        // Res expected to be BaseResponseModel with data = WalletInfoDto
        const walletInfo = (res?.data as any)?.data ?? res?.data ?? res;
        const id = walletInfo?.id ?? walletInfo?.Id ?? null;
        if (!id) {
          // No wallet yet — set zeros
          setWalletId(null);
          setBalance(0);
          setAvailableBalance(0);
          setHeldBalance(0);
          return;
        }

        setWalletId(id);

        // 2) call new GET /api/wallet/{id} to get authoritative balances
        const res2 = await api.get<ApiResponse<any>>(`/api/wallet/${encodeURIComponent(id)}`, headers);
        const payload2 = (res2?.data as any)?.data ?? res2?.data ?? res2;
        const walletDetail = payload2 ?? null;

        if (walletDetail) {
          // adapt possible property names
          const bal = Number(walletDetail.balance ?? walletDetail.Balance ?? 0);
          const avail = Number(walletDetail.availableBalance ?? walletDetail.AvailableBalance ?? (bal - Number(walletDetail.heldBalance ?? walletDetail.HeldBalance ?? 0)));
          const held = Number(walletDetail.heldBalance ?? walletDetail.HeldBalance ?? 0);

          setBalance(bal);
          setAvailableBalance(avail);
          setHeldBalance(held);
        } else {
          setBalance(0);
          setAvailableBalance(0);
          setHeldBalance(0);
        }
      } catch (err: any) {
        console.error(err);
        // don't spam user on mount — just log and show small toast
        toast.error("Không lấy được thông tin ví. Vui lòng thử lại.");
      }
    };

    fetchWalletAndDetails();
  }, []); // run once on mount

  // ------------------------
  // history fetch (unchanged) - still used for transactions list
  // ------------------------
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoadingHistory(true);

        const token = localStorage.getItem("accessToken") || "";
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const params = new URLSearchParams({
          pageNumber: currentPage.toString(),
          pageSize: pageSize.toString(),
        });
        if (statusFilter !== "all") {
          params.append("status", statusFilter);
        }

        const res = await api.get<WalletHistoryApiResponse>(
          `/api/wallet/history?${params.toString()}`,
          headers
        );

        const page = res.data;
        const items: TransactionResponseDto[] = page?.data ?? [];

        setTotalRecords(page?.totalRecords ?? 0);
        setTotalPages(page?.totalPages ?? 1);

        // keep walletBalance from transaction item only as fallback: we prefer wallet info endpoint
        if (items.length > 0 && !walletId) {
          setBalance(items[0].walletBalance);
        }

        const mapped: Transaction[] = items.map((tr) => ({
          id: tr.id ?? "",
          amount: tr.amount,
          date: new Date(tr.date).toLocaleString("vi-VN"),
          type: mapType(tr.type ?? undefined),
          status: mapStatus(tr.status ?? undefined),
          paymentMethod: tr.paymentMethod || "VNPay",
          description:
            tr.message ||
            (tr.type === 0 ? "Nạp tiền vào ví" : "Giao dịch ví"),
        }));

        setTransactions(mapped);
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message || "Không tải được lịch sử ví.");
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [statusFilter, currentPage, pageSize, walletId]);

  const totalDeposit = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "deposit" && t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalSpending = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "payment" && t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation userType="customer" queueCount={0} />

      <div className="w-full px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Ví của tôi
            </h1>
            <p className="text-muted-foreground">
              Quản lý số dư và theo dõi lịch sử giao dịch
            </p>
          </div>

          <div className="w-full md:w-64">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {STATUS_FILTER_LABEL["all"]}
                </SelectItem>
                <SelectItem value="0">{STATUS_FILTER_LABEL["0"]}</SelectItem>
                <SelectItem value="1">{STATUS_FILTER_LABEL["1"]}</SelectItem>
                <SelectItem value="2">{STATUS_FILTER_LABEL["2"]}</SelectItem>
                <SelectItem value="3">{STATUS_FILTER_LABEL["3"]}</SelectItem>
                <SelectItem value="4">{STATUS_FILTER_LABEL["4"]}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="mb-8 bg-gradient-to-br from-primary via-primary-light to-primary-dark border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              {/* LEFT: thông tin 3 ô */}
              <div className="space-y-4 w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-3">
                  {/* Số dư ví */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                      <WalletIcon className="h-5 w-5 text-primary-foreground/80" />
                      <span className="text-sm text-primary-foreground/80 font-medium">
                        Số dư ví
                      </span>
                    </div>
                    <div className="mt-1 text-3xl font-bold text-primary-foreground">
                      {formatCurrency(balance)}
                    </div>
                  </div>

                  {/* Số dư khả dụng */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                      <WalletIcon className="h-5 w-5 text-primary-foreground/80" />
                      <span className="text-sm text-primary-foreground/80 font-medium">
                        Số dư khả dụng
                      </span>
                    </div>
                    <div className="mt-1 text-3xl font-bold text-primary-foreground">
                      {formatCurrency(availableBalance)}
                    </div>
                  </div>

                  {/* Số tiền tạm giữ */}
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                      <WalletIcon className="h-5 w-5 text-primary-foreground/80" />
                      <span className="text-sm text-primary-foreground/80 font-medium">
                        Số tiền tạm giữ
                      </span>
                    </div>
                    <div className="mt-1 text-3xl font-bold text-primary-foreground">
                      {formatCurrency(heldBalance)}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: credit card icon + nút Nạp tiền (nằm ngoài space-y-4) */}
              <div className="flex flex-col items-end ml-6">
                <div className="p-4 bg-primary-foreground/10 rounded-2xl backdrop-blur-sm">
                  <CreditCard className="h-12 w-12 text-primary-foreground" />
                </div>

                <div className="mt-4">
                  <Dialog open={isTopupOpen} onOpenChange={setIsTopupOpen}>
                    <Button
                      className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
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
                        <label className="text-sm font-medium text-foreground">
                          Số tiền
                        </label>
                        <Input
                          placeholder="Vui lòng nhập số tiền"
                          inputMode="numeric"
                          value={topupAmount}
                          onChange={handleTopupAmountChange}
                          className="text-left text-lg"
                        />

                        {topupAmount && (
                          <p className="text-xs text-muted-foreground">
                            Bạn đang nạp:{" "}
                            <span className="font-semibold">
                              {topupAmount} VND
                            </span>
                          </p>
                        )}
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsTopupOpen(false)}
                        >
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
                  <p className="text-sm text-muted-foreground mb-1">
                    Tổng nạp
                  </p>
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(totalDeposit)}
                  </p>
                </div>
                <div className="p-3 bg-success/10 rounded-lg">
                  <ArrowDownLeft className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Tổng chi tiêu
                  </p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(Math.abs(totalSpending))}
                  </p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <ArrowUpRight className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Giao dịch
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {transactions.length}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Lịch sử giao dịch</CardTitle>
            <CardDescription>
              Tất cả các giao dịch qua VNPay và thanh toán
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <p className="text-sm text-muted-foreground">
                Đang tải lịch sử giao dịch...
              </p>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có giao dịch nào.
              </p>
            ) : (
              <>
                <div className="space-y-4">
                  {transactions.map((transaction, index) => (
                    <div key={transaction.id}>
                      <div className="flex items-center justify-between py-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-3 bg-muted rounded-lg">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground mb-1">
                              {transaction.description}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {transaction.date}
                              </span>
                              <span>•</span>
                              <span>{transaction.paymentMethod}</span>
                              <span>•</span>
                              {getStatusBadge(transaction.status)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p
                            className={`text-xl font-bold ${getTransactionColor(transaction.type)}`}
                          >
                            {transaction.type === "payment" ? "-" : "+"}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </p>
                        </div>
                      </div>
                      {index < transactions.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Trang {currentPage} / {totalPages} • Tổng{" "}
                    {totalRecords.toLocaleString("vi-VN")} giao dịch
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                    >
                      Trang trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, totalPages)
                        )
                      }
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