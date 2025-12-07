// src/components/vendor/VendorDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api, ApiResponse } from "@/lib/api";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  Download,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { HubConnectionBuilder, LogLevel, HttpTransportType } from "@microsoft/signalr";

import QueueTab from "./tabs/QueueTab";
import SettingsMenu from "./SettingsMenu";
import AnalyticsTab from "./tabs/AnalyticsTab";
import ReviewsTab from "./tabs/ReviewsTab";
import SettingsTab from "./tabs/SettingsTab";
import VendorWalletTab from "./tabs/VendorWalletTab"; 

type VendorFromApi = {
  id: string;
  name?: string;
  status?: number | string;
  queueCount?: number;
  totalCompletedToday?: number;
  revenueToday?: number;
  avgWaitMinutes?: number;
  cancelRatePercent?: number;
  act?: number;
  parallelFactor?: number;
};

const STATUS_NUM_TO_TEXT: Record<number, string> = {
  0: "draft",
  1: "pendingreview",
  2: "approved",
  3: "rejected",
  4: "menupending",
  5: "indebt",
  6: "closurerequested",
  7: "suspended",
};

function normalizeStatus(s?: number | string) {
  if (typeof s === "number") return STATUS_NUM_TO_TEXT[s] ?? "";
  if (typeof s === "string") return s.toLowerCase();
  return "";
}

function statusToLabel(s?: number | string) {
  const n = normalizeStatus(s);
  switch (n) {
    case "pendingreview":
      return { text: "Trạng thái: Chờ duyệt", dot: "bg-amber-500" };
    case "menupending":
      return { text: "Trạng thái: Chờ cấp phép", dot: "bg-sky-500" };
    case "approved":
      return { text: "Trạng thái: Đang hoạt động", dot: "bg-green-500" };
    case "rejected":
      return { text: "Trạng thái: Bị từ chối", dot: "bg-rose-500" };
    case "indebt":
      return { text: "Trạng thái: Quá hạn thanh toán công nợ", dot: "bg-orange-500" };
    case "suspended":
      return { text: "Trạng thái: Tạm khóa", dot: "bg-zinc-500" };
    case "closurerequested":
      return { text: "Trạng thái: Yêu cầu đóng", dot: "bg-orange-400" };
    case "draft":
      return { text: "Trạng thái: Nháp", dot: "bg-muted-foreground" };
    default:
      return { text: "Trạng thái: —", dot: "bg-muted-foreground" };
  }
}

function formatCurrencyVND(v?: number) {
  if (typeof v !== "number" || Number.isNaN(v)) return "0";
  return v.toLocaleString("vi-VN");
}

export default function VendorDashboard() {
  const params = useParams();
  const [vendor, setVendor] = useState<VendorFromApi | null>(null);
  const [loadingVendor, setLoadingVendor] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "queue" | "menu" | "analytics" | "reviews" | "wallet" | "settings" // <- THÊM "wallet"
  >("queue");
  const [vendorConfirm, setVendorConfirm] = useState<{ open: boolean; orderId?: string; title?: string; message?: string }>({ open: false });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingVendor(true);
        setLoadError(null);

        const routeUserId = (params as any)?.userId as string | undefined;
        const storedUserId = localStorage.getItem("userId") || undefined;
        const userId = routeUserId || storedUserId;
        if (!userId) throw new Error("userId required");

        const token = localStorage.getItem("accessToken") || "";
        const res = await api.get<ApiResponse<any>>(
          `/api/vendor/by-owner/${userId}`,
          token ? { Authorization: `Bearer ${token}` } : undefined
        );

        const payload: any = (res?.data as any) ?? res;
        const vendors: VendorFromApi[] =
          (payload?.data as VendorFromApi[]) ??
          (payload as VendorFromApi[]) ??
          [];

        if (mounted) setVendor(vendors?.[0] ?? null);
      } catch (e: any) {
        console.error(e);
        if (mounted) setLoadError(e?.message || "Không thể tải dữ liệu quán.");
      } finally {
        if (mounted) setLoadingVendor(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [params.userId]);

  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_URL;
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      "";
    const connection = new HubConnectionBuilder()
      .withUrl(`${apiBaseUrl}/hubs/notifications`, {
        accessTokenFactory: () => token,
        transport: HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build();

    connection.on("ReceiveNotification", (msg: Record<string, unknown>) => {
      const notifType = (msg?.type ?? "").toString();
      if (notifType === "vendor_confirm") {
        const rawData = (msg as Record<string, unknown>).data as unknown;
        let orderId: string | undefined;
        if (rawData && typeof rawData === "object") {
          orderId = (rawData as { orderId?: string }).orderId;
        }
        setVendorConfirm({
          open: true,
          orderId,
          title: (msg as { title?: string }).title ?? "Yêu cầu xác nhận đơn hàng",
          message: (msg as { body?: string; message?: string }).body ?? (msg as { body?: string; message?: string }).message ?? "",
        });
      }
    });

    connection.start().catch(() => {});

    return () => {
      connection.stop();
    };
  }, []);

  const vendorTitle = vendor?.name ? `Quán ${vendor.name}` : "Smart Queue - Vendor Dashboard";
  const statusInfo = statusToLabel(vendor?.status);
  const isEditable = ["draft", "pendingreview"].includes(normalizeStatus(vendor?.status));

  const stats = useMemo(
    () => ({
      activeQueue: vendor?.queueCount ?? 0,
      totalToday: vendor?.totalCompletedToday ?? 0,
      revenue: vendor?.revenueToday ?? 0,
      avgWaitTime: vendor?.act ?? vendor?.avgWaitMinutes ?? 0,
      cancelRate: vendor?.cancelRatePercent ?? 0,
    }),
    [vendor]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {loadingVendor ? "Đang tải..." : vendorTitle}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${statusInfo.dot} animate-pulse`}></span>
              {loadingVendor ? "Đang tải trạng thái..." : statusInfo.text}
              {loadError && <span className="text-destructive ml-2">{loadError}</span>}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => toast.info("Xuất báo cáo (placeholder)")}>
              <Download className="h-4 w-4 mr-2" />
              Xuất báo cáo
            </Button>

            <Button onClick={() => toast.info("Thêm món (placeholder)")}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm món mới
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.activeQueue}</p>
                  <p className="text-sm text-muted-foreground">Đang chờ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <CheckCircle2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalToday}</p>
                  <p className="text-sm text-muted-foreground">Hoàn thành hôm nay</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrencyVND(stats.revenue)}đ
                  </p>
                  <p className="text-sm text-muted-foreground">Doanh thu hôm nay</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.avgWaitTime}</p>
                  <p className="text-sm text-muted-foreground">Phút TB chờ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-50">
                  <TrendingUp className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.cancelRate}%</p>
                  <p className="text-sm text-muted-foreground">Tỷ lệ hủy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger
              value="queue"
              className="py-2 text-sm font-medium transition-all data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-muted/60 rounded-md"
            >
              Hàng đợi
            </TabsTrigger>

            <TabsTrigger
              value="menu"
              className="py-2 text-sm font-medium transition-all data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-muted/60 rounded-md"
            >
              Thực đơn
            </TabsTrigger>

            <TabsTrigger
              value="analytics"
              className="py-2 text-sm font-medium transition-all data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-muted/60 rounded-md"
            >
              Thống kê
            </TabsTrigger>

            <TabsTrigger
              value="reviews"
              className="py-2 text-sm font-medium transition-all data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-muted/60 rounded-md"
            >
              Đánh giá
            </TabsTrigger>

            {/* TAB VÍ CỦA BẠN - mới */}
            <TabsTrigger
              value="wallet"
              className="py-2 text-sm font-medium transition-all data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-muted/60 rounded-md"
            >
              Ví của bạn
            </TabsTrigger>

            <TabsTrigger
              value="settings"
              className="py-2 text-sm font-medium transition-all data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-muted/60 rounded-md"
            >
              Cài đặt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue">
            <QueueTab vendor={vendor} />
          </TabsContent>

          <TabsContent value="menu">
            {vendor?.id ? (
              <SettingsMenu vendorId={vendor.id} />
            ) : (
              <div className="rounded-md border px-4 py-8 text-sm text-muted-foreground">
                Không tìm thấy thông tin quán. Vui lòng tải lại trang hoặc đăng nhập lại.
              </div>
            )}
          </TabsContent>


          <TabsContent value="analytics">
            <AnalyticsTab vendor={vendor} />
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewsTab vendorId={vendor?.id}/>
          </TabsContent>

          {/* NỘI DUNG TAB VÍ CỦA BẠN */}
          <TabsContent value="wallet">
            <VendorWalletTab vendor={vendor} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab vendor={vendor} editable={isEditable} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={vendorConfirm.open} onOpenChange={(o) => setVendorConfirm((p) => ({ ...p, open: o }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{vendorConfirm.title || "Thông báo"}</DialogTitle>
            {vendorConfirm.message && (
              <DialogDescription>{vendorConfirm.message}</DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-3">
            {vendorConfirm.orderId && (
              <div className="text-sm">Mã đơn hàng: <span className="font-semibold">{vendorConfirm.orderId}</span></div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setVendorConfirm({ open: false })}>Đóng</Button>
              <Button onClick={() => {
                setVendorConfirm({ open: false });
                setActiveTab("queue");
              }}>Xem hàng đợi</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
