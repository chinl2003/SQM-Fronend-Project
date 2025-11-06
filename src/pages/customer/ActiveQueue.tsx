import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  MapPin,
  Users,
  CreditCard,
  Banknote,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Edit,
  X as CloseIcon,
  MessageCircle,
} from "lucide-react";
import { QueueUpdateDialog } from "@/components/customer/QueueUpdateDialog";
import { ViewQueueDetailDialog } from "@/components/customer/ViewQueueDetailDialog";
import { VendorChatDialog } from "@/components/customer/VendorChatDialog";
import { CancelConfirmDialog } from "@/components/customer/CancelConfirmDialog";
import { toast } from "@/hooks/use-toast";
import { api, ApiResponse } from "@/lib/api";

/** ====== TYPES lấy từ API ====== */
type OrderWithDetailsDto = {
  id: string;
  code: string;
  vendorId: string;
  totalPrice: number | null;
  status: number | string | null; // API có thể trả số hoặc chuỗi
  createdAt?: string;
  lastUpdatedTime?: string;
  queueEntry?: {
    id: string;
    queueId?: string | null;
    position?: number | null;
    joinedAt?: string | null;
    servedAt?: string | null;
    status: number | string; // số/chuỗi đều chấp nhận
    estimatedWaitTime?: string | null;
    estimatedServeTime?: string | null;
  } | null;
  details: Array<{
    id: string;
    menuItemId: string;
    menuItemName?: string | null;
    quantity?: number | null;
    unitPrice?: number | null;
  }>;
};

/** ====== UI TYPES ====== */
interface QueueItem {
  id: string;
  vendorId: string;
  code: string;
  vendorName: string;
  vendorImage: string;
  vendorAddress: string;
  type: "join_queue" | "pre_order";
  slot?: string;
  position?: number;
  estimatedTime: string;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled";
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  paymentMethod: "vnpay" | "cash";
  paymentStatus: "pending" | "paid" | "refunded";
  orderTime: string;
  canCancel: boolean;
  canUpdate: boolean;
}

/** ====== STATUS MAPPER ====== */
type OrderStatusNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const uiStatusFromApi = (
  s?: OrderStatusNumber | string | null
): QueueItem["status"] => {
  if (typeof s === "number") {
    switch (s) {
      case 0:
        return "pending";
      case 4:
        return "confirmed"; // Accepted
      case 1: // fallthrough
      case 5:
        return "preparing"; // Processing / Prepareing (typo)
      case 6:
        return "ready";
      case 2:
        return "completed";
      case 3:
        return "cancelled";
      default:
        return "pending";
    }
  }
  const t = (s || "").toString().toLowerCase();
  if (t === "pending") return "pending";
  if (t === "accepted") return "confirmed";
  if (t === "processing" || t === "prepareing") return "preparing";
  if (t === "ready") return "ready";
  if (t === "completed") return "completed";
  if (t === "cancelled") return "cancelled";
  return "pending";
};

/** ====== Helpers ====== */
const getStatusColor = (status: QueueItem["status"]) => {
  switch (status) {
    case "pending":
      return "bg-yellow-500";
    case "confirmed":
      return "bg-blue-500";
    case "preparing":
      return "bg-orange-500";
    case "ready":
      return "bg-green-500";
    case "completed":
      return "bg-gray-500";
    case "cancelled":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusText = (status: QueueItem["status"]) => {
  switch (status) {
    case "pending":
      return "Chờ xác nhận";
    case "confirmed":
      return "Đã xác nhận";
    case "preparing":
      return "Đang chuẩn bị";
    case "ready":
      return "Sẵn sàng";
    case "completed":
      return "Hoàn thành";
    case "cancelled":
      return "Đã hủy";
    default:
      return status;
  }
};

const getStatusIcon = (status: QueueItem["status"]) => {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4" />;
    case "confirmed":
      return <CheckCircle2 className="h-4 w-4" />;
    case "preparing":
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    case "ready":
      return <CheckCircle2 className="h-4 w-4" />;
    case "completed":
      return <CheckCircle2 className="h-4 w-4" />;
    case "cancelled":
      return <XCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const buildMediaUrl = (path?: string | null) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  return `${base}/${(path || "").replace(/^\/+/, "")}`;
};

const fmtCurrency = (n?: number | null) =>
  n == null ? "0 đ" : `${n.toLocaleString("vi-VN")} đ`;

const humanETA = (estimatedServeTime?: string | null) => {
  if (!estimatedServeTime) return "—";
  const now = new Date();
  const serve = new Date(estimatedServeTime);
  if (isNaN(serve.getTime())) return "—";
  const diffMin = Math.max(
    0,
    Math.round((serve.getTime() - now.getTime()) / 60000)
  );
  if (diffMin <= 1) return "≈ 1 phút";
  return `${diffMin} phút`;
};

/** ====== FETCH HELPERS ====== */
function unwrapArray<T>(raw: any): T[] {
  // Trường hợp axios: res.data = JSON
  if (Array.isArray(raw?.data)) return raw.data;
  // Trường hợp fetch/raw:
  if (Array.isArray(raw)) return raw;
  // Trường hợp BaseResponseModel: { data: { data: [...] } }
  if (Array.isArray(raw?.data?.data)) return raw.data.data;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

async function fetchOrdersByStatus(
  userId: string,
  statusCode: number,
  token?: string
): Promise<OrderWithDetailsDto[]> {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const res = await api.get(
    `/api/order/by-customer?customerId=${encodeURIComponent(
      userId
    )}&status=${statusCode}`,
    headers
  );
  return unwrapArray<OrderWithDetailsDto>(res);
}

type VendorMini = {
  id: string;
  name?: string;
  address?: string;
  logoUrl?: string;
};
async function fetchVendorsMap(
  vendorIds: string[],
  token?: string
): Promise<Record<string, VendorMini>> {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const unique = Array.from(new Set(vendorIds.filter(Boolean)));
  const entries: Array<[string, VendorMini]> = [];

  for (const id of unique) {
    try {
      const res = await api.get<ApiResponse<any>>(`/api/vendor/${id}`, headers);
      const payload: any = res?.data ?? res;
      const data = payload?.data ?? payload;
      const vendor = data?.vendor ?? data;
      entries.push([
        id,
        {
          id,
          name: vendor?.name,
          address: vendor?.address,
          logoUrl: vendor?.logoUrl,
        },
      ]);
    } catch {
      entries.push([id, { id }]);
    }
  }
  return Object.fromEntries(entries);
}

function mapOrderToQueueItem(
  o: OrderWithDetailsDto,
  vendor?: VendorMini
): QueueItem {
  const uiStatus = uiStatusFromApi(o.status as any);
  return {
    id: o.id,
    code: o.code || "",
    vendorId: o.vendorId,
    vendorName: vendor?.name || `#${o.vendorId.slice(0, 6)}`,
    vendorImage: vendor?.logoUrl ? buildMediaUrl(vendor.logoUrl) : "",
    vendorAddress: vendor?.address || "—",
    type: "join_queue",
    position: o.queueEntry?.position ?? undefined,
    estimatedTime: humanETA(o.queueEntry?.estimatedServeTime),
    status: uiStatus,
    items: (o.details || []).map((d) => ({
      id: d.id,
      name: d.menuItemName || d.menuItemId,
      quantity: d.quantity ?? 0,
      price: d.unitPrice ?? 0,
    })),
    totalAmount: o.totalPrice ?? 0,
    paymentMethod: "cash", // chưa có field thanh toán => default
    paymentStatus: "pending", // default
    orderTime: o.createdAt || new Date().toISOString(),
    canCancel: !["completed", "cancelled"].includes(uiStatus),
    canUpdate: ["pending", "confirmed"].includes(uiStatus),
  };
}

/** ====== COMPONENT ====== */
type StatusTab = "pending" | "preparing" | "completed";
const tabToApiStatus: Record<StatusTab, number> = {
  pending: 0, // Chưa xác nhận
  preparing: 5, // Đang chế biến (Prepareing)
  completed: 2, // Hoàn tất (Completed)
};

export default function ActiveQueue() {
  const navigate = useNavigate();
  const [statusTab, setStatusTab] = useState<StatusTab>("pending");
  const [activeQueues, setActiveQueues] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState<QueueItem | null>(
    null
  );
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  /** ====== Fetch dữ liệu theo TAB ====== */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const userId = localStorage.getItem("userId") || "";
        if (!userId) {
          setActiveQueues([]);
          return;
        }
        const token = localStorage.getItem("accessToken") || "";

        // 1) Lấy đơn theo status của tab hiện tại
        const statusCode = tabToApiStatus[statusTab];
        const orders = await fetchOrdersByStatus(userId, statusCode, token);

        // 2) Lấy vendor info
        const vendorIds = orders.map((o) => o.vendorId).filter(Boolean);
        const vendorsMap = await fetchVendorsMap(vendorIds, token);

        // 3) Map sang UI
        const items = orders.map((o) =>
          mapOrderToQueueItem(o, vendorsMap[o.vendorId])
        );

        if (mounted) setActiveQueues(items);
      } catch (e) {
        console.error(e);
        toast({
          title: "Không tải được hàng đợi",
          description: "Vui lòng thử lại sau.",
          variant: "destructive",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [statusTab]);

  const handleCancelOrder = (queueId: string) => {
    // TODO: gọi API hủy đơn nếu có
    setActiveQueues((prev) => prev.filter((item) => item.id !== queueId));
    setShowCancelDialog(false);
    toast({
      title: "Hủy đơn hàng thành công",
      description: `Đơn hàng đã được hủy và chuyển vào lịch sử.`,
    });
  };

  const renderQueueCard = (queueItem: QueueItem) => (
    <Card key={queueItem.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <img
            src={queueItem.vendorImage || "/placeholder.svg"}
            alt={queueItem.vendorName}
            className="w-16 h-16 rounded-full object-cover bg-muted"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{queueItem.vendorName}</h3>
              <Badge
                className={`${getStatusColor(queueItem.status)} text-white`}
              >
                {getStatusIcon(queueItem.status)}
                <span className="ml-1">{getStatusText(queueItem.status)}</span>
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>
                  Loại:{" "}
                  {queueItem.type === "join_queue"
                    ? "Xếp hàng ngay"
                    : "Pre-order"}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>Vị trí: {queueItem.position ?? "—"}</span>
              </div>

              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>ETA: {queueItem.estimatedTime}</span>
              </div>

              <div className="flex items-center space-x-1">
                {queueItem.paymentMethod === "vnpay" ? (
                  <CreditCard className="h-3 w-3" />
                ) : (
                  <Banknote className="h-3 w-3" />
                )}
                <span>
                  {queueItem.paymentMethod === "vnpay" ? "VNPAY" : "Tiền mặt"}
                </span>
              </div>
            </div>

            <div className="text-sm mb-3">
              <span className="font-medium">
                Tổng: {fmtCurrency(queueItem.totalAmount)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedQueueItem(queueItem);
                  setShowDetailDialog(true);
                }}
              >
                <Eye className="h-3 w-3 mr-1" />
                Chi tiết
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedQueueItem(queueItem);
                  setShowChatDialog(true);
                }}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Chat
              </Button>

              {queueItem.canUpdate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedQueueItem(queueItem);
                    setShowUpdateDialog(true);
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Cập nhật
                </Button>
              )}

              {queueItem.canCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedQueueItem(queueItem);
                    setShowCancelDialog(true);
                  }}
                >
                  <CloseIcon className="h-3 w-3 mr-1" />
                  Hủy
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const mockMenuItems = [
    { id: "1", name: "Margherita Pizza", price: 350000, isAvailable: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation userType="customer" />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Hàng đợi hiện tại</h1>
        </div>

        <Tabs
          value={statusTab}
          onValueChange={(v) => setStatusTab(v as StatusTab)}
          className="space-y-4"
        >
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="pending">Chưa xác nhận</TabsTrigger>
            <TabsTrigger value="preparing">Đang chế biến</TabsTrigger>
            <TabsTrigger value="completed">Hoàn tất</TabsTrigger>
          </TabsList>

          <TabsContent value={statusTab}>
            {loading && (
              <div className="text-sm text-muted-foreground mb-4">
                Đang tải...
              </div>
            )}

            <div className="space-y-4">
              {activeQueues.length > 0
                ? activeQueues.map(renderQueueCard)
                : !loading && (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          {statusTab === "pending" &&
                            "Không có đơn hàng nào chờ xác nhận"}
                          {statusTab === "preparing" &&
                            "Không có đơn hàng nào đang chế biến"}
                          {statusTab === "completed" &&
                            "Chưa có đơn hàng nào hoàn tất"}
                        </h3>
                        {statusTab === "pending" && (
                          <>
                            <p className="text-muted-foreground mb-4">
                              Hãy tìm kiếm và đặt món từ các quán yêu thích!
                            </p>
                            <Button onClick={() => navigate("/")}>
                              Khám phá quán ăn
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedQueueItem && (
        <>
          <QueueUpdateDialog
            isOpen={showUpdateDialog}
            onClose={() => setShowUpdateDialog(false)}
            onUpdate={() => {
              toast({ title: "Cập nhật thành công" });
              setShowUpdateDialog(false);
            }}
            vendorName={selectedQueueItem.vendorName}
            vendorImage={selectedQueueItem.vendorImage}
            currentItems={selectedQueueItem.items}
            availableMenuItems={mockMenuItems}
            currentPaymentMethod={selectedQueueItem.paymentMethod}
          />

          <ViewQueueDetailDialog
            isOpen={showDetailDialog}
            onClose={() => setShowDetailDialog(false)}
            queueItem={selectedQueueItem}
          />

          <VendorChatDialog
            isOpen={showChatDialog}
            onClose={() => setShowChatDialog(false)}
            vendorName={selectedQueueItem.vendorName}
            vendorImage={selectedQueueItem.vendorImage}
            orderId={selectedQueueItem.id}
          />

          <CancelConfirmDialog
            isOpen={showCancelDialog}
            onClose={() => setShowCancelDialog(false)}
            onConfirm={() => handleCancelOrder(selectedQueueItem.id)}
            queueItem={selectedQueueItem}
          />
        </>
      )}
    </div>
  );
}
