import React, { useState, useEffect } from "react";
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

const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "deposit",
    amount: 500000,
    description: "Nạp tiền qua VNPay",
    date: "2024-01-15 14:30",
    status: "completed",
    paymentMethod: "VNPay",
  },
  {
    id: "2",
    type: "payment",
    amount: -150000,
    description: "Thanh toán đơn hàng #12345",
    date: "2024-01-14 10:15",
    status: "completed",
    paymentMethod: "Ví Smart Queue",
  },
  {
    id: "3",
    type: "deposit",
    amount: 1000000,
    description: "Nạp tiền qua VNPay",
    date: "2024-01-13 09:20",
    status: "completed",
    paymentMethod: "VNPay",
  },
  {
    id: "4",
    type: "payment",
    amount: -200000,
    description: "Thanh toán đơn hàng #12344",
    date: "2024-01-12 16:45",
    status: "completed",
    paymentMethod: "Ví Smart Queue",
  },
  {
    id: "5",
    type: "refund",
    amount: 150000,
    description: "Hoàn tiền đơn hàng #12343",
    date: "2024-01-11 11:30",
    status: "completed",
    paymentMethod: "Ví Smart Queue",
  },
];

export default function Wallet() {
  const [balance] = useState(1150000);
  const [transactions] = useState(mockTransactions);

  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleTopupAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const getStatusBadge = (status: string) => {
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (!params.has("vnp_TxnRef")) return;

    const allParams: Record<string, string> = {};
    params.forEach((value, key) => {
      allParams[key] = value;
    });

    const validatePayment = async () => {
      try {
        const token = localStorage.getItem("accessToken") || "";
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        const storedTransactionId = localStorage.getItem(
          "lastVnPayTransactionId"
        );
        if (storedTransactionId) {
          allParams.TransactionId = storedTransactionId;
        }
        const res = await api.post<PaymentResultApi>(
          "/api/VNPay/validate",
          allParams,
          headers
        );

        const result: PaymentResult = res.data ?? res;

        if (allParams["vnp_ResponseCode"] === "00") {
          toast.success(
            `Nạp tiền thành công: ${(result.amount ?? 0).toLocaleString(
              "vi-VN"
            )} VND`
          );
        } else {
          toast.error("Thanh toán VNPay thất bại hoặc bị hủy.");
        }

        localStorage.removeItem("lastVnPayTransactionId");
        navigate("/customer/wallet", { replace: true });
      } catch (err: any) {
        console.error(err);
        toast.error(err?.message || "Có lỗi khi xác nhận thanh toán VNPay.");
      }
    };

    validatePayment();
  }, [location.search, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation userType="customer" queueCount={0} />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Ví của tôi
          </h1>
          <p className="text-muted-foreground">
            Quản lý số dư và theo dõi lịch sử giao dịch
          </p>
        </div>

        {/* Balance Card */}
        <Card className="mb-8 bg-gradient-to-br from-primary via-primary-light to-primary-dark border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary-foreground/80">
                  <WalletIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Số dư khả dụng</span>
                </div>
                <div>
                  <p className="text-5xl font-bold text-primary-foreground mb-2">
                    {formatCurrency(balance)}
                  </p>
                  <div className="flex items-center gap-2 text-primary-foreground/80">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">
                      +{formatCurrency(500000)} trong tháng này
                    </span>
                  </div>
                </div>

                <Dialog open={isTopupOpen} onOpenChange={setIsTopupOpen}>
                  <Button
                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                    size="lg"
                    onClick={() => setIsTopupOpen(true)}
                  >
                    <Plus className="h-5 w-5 mr-2" />
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
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Vui lòng nhập số tiền cần nạp vào ví"
                          inputMode="numeric"
                          value={topupAmount}
                          onChange={handleTopupAmountChange}
                          className="text-left text-lg"
                        />
                      </div>
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
                      <Button
                        onClick={handleConfirmTopup}
                        disabled={!topupAmount}
                      >
                        Nạp tiền
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="p-4 bg-primary-foreground/10 rounded-2xl backdrop-blur-sm">
                <CreditCard className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tổng nạp</p>
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(1500000)}
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
                    {formatCurrency(350000)}
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

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Lịch sử giao dịch</CardTitle>
            <CardDescription>
              Tất cả các giao dịch qua VNPay và thanh toán
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                        className={`text-xl font-bold ${getTransactionColor(
                          transaction.type
                        )}`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                  {index < transactions.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}