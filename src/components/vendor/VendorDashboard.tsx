// src/components/vendor/VendorDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Bell, LogOut
} from "lucide-react";

import QueueTab from "./tabs/QueueTab";
import SettingsMenu from "./SettingsMenu";
import AnalyticsTab from "./tabs/AnalyticsTab";
import ReviewsTab from "./tabs/ReviewsTab";
import SettingsTab from "./tabs/SettingsTab";
import VendorWalletTab from "./tabs/VendorWalletTab";
import { Badge } from "@/components/ui/badge";
import { HubConnectionBuilder, LogLevel, HubConnection, HttpTransportType } from "@microsoft/signalr";
import { NotificationDialog } from "../NotificationDialog";
import { useVendorOrderUpdates } from "@/hooks/useVendorOrderUpdates";

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

type VendorInfo = {
  customerCountWaiting: number;
  orderStatusCompleteCountToday?: number;
  totalInToday?: number;
  cancelRating?: number;
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
  const [vendorInfo, setVendorInfo] = useState<VendorInfo | null>(null);

  const [loadingVendor, setLoadingVendor] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "queue" | "menu" | "analytics" | "reviews" | "wallet" | "settings"
  >("queue");

  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [queueReloadKey, setQueueReloadKey] = useState(0);

  // Real-time order updates for vendor
  const { newOrdersCount, resetNewOrdersCount } = useVendorOrderUpdates({
    vendorId: vendor?.id || '',
    enabled: !!vendor?.id,
    playNotificationSound: true,
    onNewOrder: () => {
      // Trigger queue tab refresh
      setQueueReloadKey(prev => prev + 1);
    },
    onOrderStatusChange: () => {
      // Trigger queue tab refresh
      setQueueReloadKey(prev => prev + 1);
    }
  });

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

        const resInfo = await api.get<ApiResponse<VendorInfo>>(
          `/api/vendor/vendor-info/${userId}`,
          token ? { Authorization: `Bearer ${token}` } : undefined
        );

        const vendorInfoData = resInfo.data;
        setVendorInfo(vendorInfoData);
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

  // SignalR notification connection
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const apiBaseUrl = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem("accessToken") || "";

    const newConnection = new HubConnectionBuilder()
      .withUrl(`${apiBaseUrl}/hubs/notifications`, {
        accessTokenFactory: () => token,
        transport: HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build();

    newConnection.on("ReceiveNotification", (msg) => {
      const now = new Date();
      const n: any = {
        id: crypto.randomUUID(),
        title: msg.title ?? "Thông báo",
        message: msg.body ?? "",
        type: msg.type === "warning" ? "warning" : "info",
        time: now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        read: false,
      };

      setNotifications((prev) => [n, ...prev]);
      toast.success(n.title, { description: n.message });
    });

    newConnection.start().catch(() => { });
    setConnection(newConnection);

    return () => {
      newConnection.stop();
    };
  }, []);

  // Load notification history from API
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setNotifications([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const token = localStorage.getItem("accessToken") || "";
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await api.get<{ code: string; message: string; data: any[] }>(
          "/api/Notification",
          headers
        );
        if (cancelled || !res) return;

        const mapped: any[] = res.data.map((n: any) => ({
          id: String(n.id),
          title: n.title,
          message: n.body ?? n.message ?? "",
          type: n.type === "warning" ? "warning" : "info",
          time: new Date(n.createdAt).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          read: n.isRead,
        }));

        setNotifications(mapped);
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const vendorTitle = vendor?.name ? `Quán ${vendor.name}` : "Smart Queue - Vendor Dashboard";
  const statusInfo = statusToLabel(vendor?.status);
  const isEditable = ["draft", "pendingreview"].includes(normalizeStatus(vendor?.status));

  const stats = useMemo(
    () => ({
      activeQueue: vendorInfo?.customerCountWaiting ?? 0,
      totalToday: vendorInfo?.orderStatusCompleteCountToday ?? 0,
      revenue: vendorInfo?.totalInToday ?? 0,
      avgWaitTime: vendor?.act ?? vendor?.avgWaitMinutes ?? 0,
      cancelRate: vendorInfo?.cancelRating ?? 0,
    }),
    [vendor, vendorInfo]
  );

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

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
            {/* Notification Bell */}
            <Button
              variant="ghost"
              size="sm"
              className={`relative ${notifications.filter(n => !n.read).length > 0 ? "text-amber-500 animate-pulse" : ""}`}
              onClick={() => setIsNotificationOpen(true)}
            >
              <Bell className="h-4 w-4" />
              {notifications.filter(n => !n.read).length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {notifications.filter(n => !n.read).length > 9 ? "9+" : notifications.filter(n => !n.read).length}
                </Badge>
              )}
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("userId");
                toast.success("Đăng xuất thành công!");
                setTimeout(() => {
                  window.location.href = "/auth";
                }, 500);
              }}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
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
                  <p className="text-sm text-muted-foreground">Tỷ lệ trễ</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
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

            {/* <TabsTrigger
              value="analytics"
              className="py-2 text-sm font-medium transition-all data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-muted/60 rounded-md"
            >
              Thống kê
            </TabsTrigger> */}

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
            <QueueTab vendor={vendor} reloadKey={queueReloadKey} />
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


          {/* <TabsContent value="analytics">
            <AnalyticsTab vendor={vendor} />
          </TabsContent> */}

          <TabsContent value="reviews">
            <ReviewsTab vendorId={vendor?.id} />
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

      <NotificationDialog
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAllRead={markAllNotificationsRead}
      />
    </div>
  );
}
