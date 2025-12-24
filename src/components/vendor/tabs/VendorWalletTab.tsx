import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VendorSettlementDetailModal
  from "@/components/vendor/tabs/VendorSettlementDetailModal";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Wallet as WalletIcon,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    CreditCard,
} from "lucide-react";
import { api, ApiResponse } from "@/lib/api";
import { toast } from "sonner";
import {
  Eye
} from "lucide-react";
import { WithdrawDialog } from "@/pages/customer/components/WithdrawDialog";
import { BankLinkDialog } from "@/pages/customer/components/BankLinkDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type WalletTransactionStatus = 0 | 1 | 2 | 3 | 4;
type WalletTransactionType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

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

export interface VendorSettlementDetailDto {
  id: string;
  vendorId: string;
  walletId: string | null;
  period: string;
  commissionRate: number;
  totalRevenue: number;
  totalPayment: number;
  dueDate: string;
  note?: string | null;
}

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
    rawType?: WalletTransactionType | null;
    amount: number;
    description: string;
    date: string;
    status: "completed" | "pending" | "failed";
    paymentMethod: string;
}

type WalletInfoDto = {
    id: string;
    balance: number;
    heldBalance: number;
    availableBalance: number;
    owner: number;
    userId?: string | null;
    vendorId?: string | null;
    totalTransaction?: number;
};

type WalletInfoApiResponse = ApiResponse<WalletInfoDto>;

type VendorFromApi = {
    id: string;
    name?: string;
};

interface VendorWalletTabProps {
    vendor: VendorFromApi | null;
}

interface TransactionListProps {
  transactions: Transaction[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  onPrev: () => void;
  onNext: () => void;
  mode?: "normal" | "debt";
  onLoadDebtDetail?: (walletTransactionId: string) => void;
}

function isIncome(type?: WalletTransactionType | null) {
  return type === 0 || type === 2 || type === 4;
}

function isOutcome(
  type?: WalletTransactionType | null,
  status?: WalletTransactionStatus | null
) {
  return (
    type === 1 || 
    (type === 13 && status === 2) || 
    (type === 10 && status === 2) ||
    (type === 6 && status === 2)
  );
}

function isDebt(
  type?: WalletTransactionType | null,
  status?: WalletTransactionStatus | null
) {
  return type === 13 && status === 0; 
}


function getDescription(
  type?: WalletTransactionType | null,
  status?: WalletTransactionStatus | null,
  message?: string | null
) {
  if (message) return message;

  switch (type) {
    case 0:
      return "Nạp tiền vào ví";
    case 1:
      return "Thanh toán đơn hàng";
    case 2:
      return "Hoàn tiền";
    case 4:
      return "Nhận tiền từ đơn hàng";
    case 13:
      return status === 2
        ? "Phí hoa hồng hàng tháng"
        : "Phí hoa hồng (đang xử lý)";
    case 10:
      return status === 2
        ? "Phí đăng ký quán"
        : "Tạm giữ phí đăng ký";
    default:
      return "Giao dịch ví";
  }
}


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

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
}

export default function VendorWalletTab({ vendor }: VendorWalletTabProps) {
    const [subTab, setSubTab] = useState<"in" | "out" | "debt">("in");

    const [balance, setBalance] = useState(0);
    const [availableBalance, setAvailableBalance] = useState(0);
    const [heldBalance, setHeldBalance] = useState(0);
    const [walletId, setWalletId] = useState<string | null>(null);

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loadingInfo, setLoadingInfo] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [totalInApi, setTotalInApi] = useState(0);
    const [totalOutApi, setTotalOutApi] = useState(0);
    const [totalTransactionApi, setTotalTransaction] = useState(0);

    const [openDebtDetail, setOpenDebtDetail] = useState(false);
    const [debtDetail, setDebtDetail] =
  useState<any | null>(null);

    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isBankLinkOpen, setIsBankLinkOpen] = useState(false);
    const [loadingDebtDetail, setLoadingDebtDetail] = useState(false);
    const [walletTransactionId, setWalletTransactionId] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    useEffect(() => {
        const load = async () => {
            if (!vendor?.id) return;

            try {
                setLoadingInfo(true);
                const token = localStorage.getItem("accessToken") || "";
                const headers: Record<string, string> = {};
                if (token) headers.Authorization = `Bearer ${token}`;

                const res = await api.get<WalletInfoApiResponse>(
                    `/api/wallet/vendor/${encodeURIComponent(vendor.id)}/info`,
                    headers
                );

                const payload: any = (res as any)?.data ?? res;
                const info: any = payload?.data ?? payload;

                if (!info) {
                    setWalletId(null);
                    setBalance(0);
                    setAvailableBalance(0);
                    setHeldBalance(0);
                    return;
                }

                setWalletId(info.id);
                setBalance(Number(info.balance ?? info.Balance ?? 0));
                const held = Number(info.heldBalance ?? info.HeldBalance ?? 0);
                const avail = Number(
                    info.availableBalance ?? info.AvailableBalance ?? info.balance - held
                );
                setTotalInApi(Number(info.totalIn ?? info.TotalIn ?? 0));
                setTotalOutApi(Number(info.totalOut ?? info.TotalOut ?? 0));
                setTotalTransaction(Number(info.totalTransaction ?? info.totalTransaction ?? 0));
                setAvailableBalance(avail);
            } catch (err) {
                console.error(err);
                toast.error("Không lấy được thông tin ví đối tác.");
            } finally {
                setLoadingInfo(false);
            }
        };

        load();
    }, [vendor?.id]);

    // ====== LOAD WALLET HISTORY BY vendorId (server sẽ map sang walletId) ======
    useEffect(() => {
        const load = async () => {
            if (!vendor?.id) return;

            try {
                setLoadingHistory(true);
                const token = localStorage.getItem("accessToken") || "";
                const headers: Record<string, string> = {};
                if (token) headers.Authorization = `Bearer ${token}`;

                const params = new URLSearchParams({
                    pageNumber: `${currentPage}`,
                    pageSize: `${pageSize}`,
                });

                const res = await api.get<WalletHistoryApiResponse>(
                    `/api/wallet/vendor/${encodeURIComponent(vendor.id)}/history?${params.toString()}`,
                    headers
                );

                // GIỐNG Wallet.tsx
                const p = res?.data;

                if (!p) {
                    setTransactions([]);
                    setTotalPages(1);
                    setTotalRecords(0);
                    return;
                }

                setTotalPages(p.totalPages);
                setTotalRecords(p.totalRecords);

                setTransactions(
                    p.data.map((t) => ({
                        id: t.id ?? "",
                        amount: t.amount,
                        date: new Date(t.date).toLocaleString("vi-VN"),
                        rawType: t.type ?? null,
                        status: mapStatus(t.status),
                        paymentMethod: t.paymentMethod || "Hệ thống",
                        description: getDescription(t.type, t.status, t.message),
                        type: mapType(t.type),
                    }))
                    );

            } catch (err) {
                console.error(err);
                toast.error("Không tải được lịch sử ví đối tác.");
            } finally {
                setLoadingHistory(false);
            }
        };

        load();
    }, [vendor?.id, currentPage, pageSize]);


    const incomeTransactions = useMemo(
    () => transactions.filter(t => isIncome(t.rawType)),
    [transactions]
    );

    const loadDebtDetail = async (walletTransactionId: string) => {
  try {
    setLoadingDebtDetail(true);

    setWalletTransactionId(walletTransactionId);
    const token = localStorage.getItem("accessToken") || "";
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await api.get<ApiResponse<VendorSettlementDetailDto>>(
      `/api/vendorSettlement/by-wallet-transaction/${walletTransactionId}`,
      headers
    );

    setDebtDetail(res);
    setOpenDebtDetail(true);
  } catch (err) {
    console.error(err);
    toast.error("Không tải được chi tiết công nợ.");
  } finally {
    setLoadingDebtDetail(false);
  }
};



    const outcomeTransactions = useMemo(
  () => transactions.filter(t => isOutcome(t.rawType, t.status === "completed" ? 2 : 0)),
  [transactions]
);

const debtTransactions = useMemo(
  () => transactions.filter(t => isDebt(t.rawType, t.status === "pending" ? 0 : 2)),
  [transactions]
);
    const currentList =
  subTab === "in"
    ? incomeTransactions
    : subTab === "out"
    ? outcomeTransactions
    : debtTransactions;


  


    if (!vendor?.id) {
        return (
            <div className="text-sm text-muted-foreground">
                Không tìm thấy thông tin quán để load ví.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header nhỏ cho tab ví */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">
                        Ví của bạn {vendor?.name ? `- ${vendor.name}` : ""}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Xem tổng quan số dư ví và lịch sử giao dịch của quán
                    </p>
                </div>
            </div>

            {/* Tổng quan ví – màu xanh khớp tab active */}
            <Card className="bg-gradient-to-br from-green-500 via-green-500 to-green-600 border-0 shadow-lg text-white">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1 space-y-4">
                            <p className="text-sm uppercase tracking-wide text-white/80">
                                Tổng quan ví
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    ["Số dư ví", balance],
                                    ["Số dư khả dụng", availableBalance],
                                    ["Số tiền tạm giữ", heldBalance],
                                ].map(([label, value]) => (
                                    <div key={label as string} className="flex flex-col items-start">
                                        <div className="flex items-center gap-2">
                                            <WalletIcon className="h-4 w-4 text-white/80" />
                                            <span className="text-xs text-white/80">{label}</span>
                                        </div>
                                        <div className="mt-1 text-2xl font-bold">
                                            {loadingInfo
                                                ? "Đang tải..."
                                                : formatCurrency(Number(value))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 lg:mt-0 flex flex-col items-end gap-3">
                            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <CreditCard className="h-12 w-12 text-white" />
                </div>
                <div className="mt-4 flex gap-3">
                   <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => setIsWithdrawOpen(true)}
                        >
                        Rút tiền
                    </Button>


                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setIsBankLinkOpen(true)}
                  >
                    Liên kết ngân hàng
                  </Button>
                </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Thống kê nhanh */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Tổng tiền nhận</p>
                            <p className="text-xl font-semibold text-emerald-600">
                                {formatCurrency(totalInApi)}
                            </p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                            <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Tổng tiền chi</p>
                            <p className="text-xl font-semibold text-rose-600">
                                {formatCurrency(Math.abs(totalOutApi))}
                            </p>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-lg">
                            <ArrowUpRight className="h-5 w-5 text-rose-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Số giao dịch</p>
                            <p className="text-xl font-semibold text-foreground">
                                {totalTransactionApi?.toLocaleString('en-US')}
                            </p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <Clock className="h-5 w-5 text-primary" />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <WithdrawDialog
                    open={isWithdrawOpen}
                    onOpenChange={setIsWithdrawOpen}
                    availableBalance={availableBalance}
                    walletId={walletId}
                    isVendor={true}
                    onSuccess={() => {  
                    }}
                  />
            
                  <BankLinkDialog
                    open={isBankLinkOpen}
                    isVendor={true}
                    onOpenChange={setIsBankLinkOpen}
                  />

            {/* Sub-tabs + lịch sử giao dịch */}
            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Lịch sử giao dịch ví</CardTitle>
                            <CardDescription>
                                Phân loại theo dòng tiền vào / ra ví
                            </CardDescription>
                        </div>
                    </div>

                    <Tabs
                        value={subTab}
                        onValueChange={(v) => setSubTab(v as "in" | "out")}
                        className="mt-4 w-full"
                    >
                        <TabsList className="inline-flex">
                            <TabsTrigger
                                value="in"
                                className="px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-muted/60 rounded-md"
                            >
                                Tiền nhận
                            </TabsTrigger>
                            <TabsTrigger
                                value="out"
                                className="px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-muted/60 rounded-md"
                            >
                                Tiền chi
                            </TabsTrigger>

                            <TabsTrigger
                                value="debt"
                                className="px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-muted/60 rounded-md"
                            >
                                Công nợ & phí
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="in" className="pt-4">
                            <TransactionList
                                transactions={currentList}
                                loading={loadingHistory}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalRecords={totalRecords}
                                onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                onNext={() =>
                                    setCurrentPage((p) => (p >= totalPages ? p : p + 1))
                                }
                                showSummary={subTab === "in"}
                            />
                        </TabsContent>
                        <TabsContent value="out" className="pt-4">
                            <TransactionList
                                transactions={currentList}
                                loading={loadingHistory}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalRecords={totalRecords}
                                onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                onNext={() =>
                                    setCurrentPage((p) => (p >= totalPages ? p : p + 1))
                                }
                                showSummary={subTab === "out"}
                            />
                        </TabsContent>
                        <TabsContent value="debt" className="pt-4">
                            <TransactionList
                                transactions={currentList}
                                loading={loadingHistory}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalRecords={totalRecords}
                                onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                onNext={() => setCurrentPage((p) => (p >= totalPages ? p : p + 1))}
                                mode="debt"  
                                onLoadDebtDetail={loadDebtDetail}
                            />
                        </TabsContent>


                    </Tabs>
                </CardHeader>
            </Card>
            <VendorSettlementDetailModal
            open={openDebtDetail}
            onClose={() => setOpenDebtDetail(false)}
            loading={loadingDebtDetail}
            data={debtDetail}
            walletTransactionId = {walletTransactionId}
            availableBalance = {availableBalance}
            />

        </div>
    );
}

interface TransactionListProps {
    transactions: Transaction[];
    loading: boolean;
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    onPrev: () => void;
    onNext: () => void;
    showSummary?: boolean;
}

function TransactionList({
    transactions,
    loading,
    currentPage,
    totalPages,
    totalRecords,
    onPrev,
    onNext,
    mode = "normal",
    onLoadDebtDetail,
}: TransactionListProps) {
    if (loading) {
        return (
            <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">Đang tải...</p>
            </CardContent>
        );
    }

    if (!transactions.length) {
        return (
            <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">Chưa có giao dịch nào.</p>
            </CardContent>
        );
    }

    return (
        <CardContent className="pt-0">
            <div className="space-y-4">
                {transactions.map((t, i) => {
                    const isDebtMode = mode === "debt";
                    const isIn = isIncome(t.rawType);

                    return (
                        <div key={t.id}>
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-start gap-4 flex-1">

                            {!isDebtMode && (
                                <div className="p-3 bg-muted rounded-lg">
                                {isIn ? (
                                    <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                                ) : (
                                    <ArrowUpRight className="h-4 w-4 text-rose-600" />
                                )}
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <p className="font-medium mb-1">{t.description}</p>

                                <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {t.date}
                                </span>

                                <span>•</span>
                                <span>{t.paymentMethod}</span>

                                <span>•</span>

                                {isDebtMode ? (
                                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                                    Chưa thanh toán
                                    </Badge>
                                ) : (
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
                                )}
                                </div>
                            </div>
                            </div>

                            <div className="flex items-center gap-4">
                            <p
                                className={`text-lg font-semibold ${
                                isDebtMode
                                    ? "text-amber-600"
                                    : isIn
                                    ? "text-emerald-600"
                                    : "text-rose-600"
                                }`}
                            >
                                {formatCurrency(Math.abs(t.amount))}
                            </p>

                            {isDebtMode && (
                            <button
                                className="p-2 rounded-md hover:bg-muted text-muted-foreground"
                                onClick={() => onLoadDebtDetail?.(t.id)}
                                title="Xem chi tiết công nợ"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            )}

                            </div>
                        </div>

                        {i < transactions.length - 1 && <Separator />}
                        </div>
                    );
                    })}

            </div>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-xs text-muted-foreground">
                    Trang {currentPage}/{totalPages} • Tổng {totalRecords}
                </p>
                <div className="flex gap-2">
                    <button
                        className="px-3 py-1 text-xs rounded border border-input hover:bg-muted disabled:opacity-50"
                        disabled={currentPage <= 1}
                        onClick={onPrev}
                    >
                        Trang trước
                    </button>
                    <button
                        className="px-3 py-1 text-xs rounded border border-input hover:bg-muted disabled:opacity-50"
                        disabled={currentPage >= totalPages}
                        onClick={onNext}
                    >
                        Trang sau
                    </button>
                </div>
            </div>
        </CardContent>
    );
}