import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
};

type WalletInfoApiResponse = ApiResponse<WalletInfoDto>;

type VendorFromApi = {
    id: string;
    name?: string;
};

interface VendorWalletTabProps {
    vendor: VendorFromApi | null;
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
    const [subTab, setSubTab] = useState<"in" | "out">("in");

    const [balance, setBalance] = useState(0);
    const [availableBalance, setAvailableBalance] = useState(0);
    const [heldBalance, setHeldBalance] = useState(0);
    const [walletId, setWalletId] = useState<string | null>(null);

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loadingInfo, setLoadingInfo] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // ====== LOAD WALLET INFO BY vendorId ======
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
                setHeldBalance(held);
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
                        type: mapType(t.type),                // string: "deposit" | "payment" | "refund"
                        rawType: t.type ?? null,              // <- giữ type số gốc
                        status: mapStatus(t.status),
                        paymentMethod: t.paymentMethod || "Hệ thống",
                        description:
                            t.message ||
                            (t.type === 4
                                ? "Nhận tiền về ví đối tác"
                                : "Giao dịch ví đối tác"),
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

    // ====== TÍNH TOÁN TỔNG QUAN TỪ DATA THẬT ======
    const totalIn = useMemo(
        () =>
            transactions
                .filter((t) => t.amount > 0)
                .reduce((s, t) => s + t.amount, 0),
        [transactions]
    );

    const totalOut = useMemo(
        () =>
            transactions
                .filter((t) => t.amount < 0)
                .reduce((s, t) => s + t.amount, 0),
        [transactions]
    );

    const incomeTransactions = useMemo(
        () => transactions.filter((t) => t.amount > 0),
        [transactions]
    );

    const outcomeTransactions = useMemo(
        () => transactions.filter((t) => t.amount < 0),
        [transactions]
    );

    const currentList = subTab === "in" ? incomeTransactions : outcomeTransactions;

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
                                <CreditCard className="h-8 w-8 text-white" />
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
                                {formatCurrency(totalIn)}
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
                                {formatCurrency(Math.abs(totalOut))}
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
                                {transactions.length}
                            </p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <Clock className="h-5 w-5 text-primary" />
                        </div>
                    </CardContent>
                </Card>
            </div>

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
                    </Tabs>
                </CardHeader>
            </Card>
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
                    // QUY TẮC MỚI:
                    // type = 4  -> nhận tiền (in)
                    // type != 4 -> chi tiền (out)
                    const isIncome = t.rawType === 4;

                    return (
                        <div key={t.id}>
                            <div className="flex items-center justify-between py-3">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="p-3 bg-muted rounded-lg">
                                        {isIncome ? (
                                            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                                        ) : (
                                            <ArrowUpRight className="h-4 w-4 text-rose-600" />
                                        )}
                                    </div>
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
                                    className={`text-lg font-semibold ${isIncome ? "text-emerald-600" : "text-rose-600"
                                        }`}
                                >
                                    {isIncome ? "+" : "-"}
                                    {formatCurrency(Math.abs(t.amount))}
                                </p>
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