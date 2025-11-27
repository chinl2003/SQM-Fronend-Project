// src/pages/VendorDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Phone,
  Clock,
  Star,
  Users,
  UtensilsCrossed,
  ImageIcon,
  Minus,
  Plus,
  CheckCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, ApiResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type MenuItemResponse = {
  id: string;
  name?: string | null;
  description?: string | null;
  price?: number | null;
  quantity?: number | null;
  active?: boolean | null;
  code?: string | null;
  prepTime?: number | null;
  vendorId?: string | null;
  typeOfFood?: string | null;
  imageUrl?: string | null;
};

type OrderCheckoutResponse = {
  order: {
    id: string;
    code: string;
    vendorId: string;
    queueEntryId?: string | null;
    totalPrice: number;
    status: number;
    createdAt: string;
    lastUpdatedTime?: string;
  };
  queueEntryId: string;
  position: number;
  estimatedServeTime?: string | null;
};

type OrderQueueInfo = {
  orderId: string;
  orderCode?: string | null;
  estimatedPickupTime?: string | null;
  estimatedWaitMinutes?: number | null;
  positionInQueue?: number | null;
  vendorId?: string | null;
  vendorName?: string | null;
  vendorAddress?: string | null;
};

type VendorModel = {
  id: string;
  name?: string | null;
  address?: string | null;
  ownerPhone?: string | null;
  openingHours?: string | null;
  averageRating?: number | null;
  queueCount?: number | null;
  logoUrl?: string | null;
};

type VendorQueueSlim = {
  id: string;
  type: number;
  status: number;
  positionMax?: number | null;
};

type VendorWithMenuResponse = {
  vendor: VendorModel;
  menuItems: MenuItemResponse[];
  vendorQueues?: VendorQueueSlim[];
};

type OrderItemCreate = {
  menuItemId: string;
  quantity: number;
  unitPrice?: number | null;
};

type OrderCreateRequest = {
  vendorId: string;
  customerId: string;
  items: OrderItemCreate[];
  queueId: string;
  totalPrice?: number | null;
  paymentMethod?: number | null;
};

function fmtTime(t?: string | null) {
  if (!t) return "—";
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return "—";

  const pad = (n: number) => n.toString().padStart(2, "0");

  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const date = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;

  return `${time} ${date}`;
}

function buildMediaUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = (import.meta.env.VITE_S3_URL || "").replace(/\/+$/, "");
  return `${base}/${String(path).replace(/^\/+/, "")}`;
}

function fmtVND(n?: number | null) {
  if (typeof n !== "number" || Number.isNaN(n)) return "0đ";
  return n.toLocaleString("vi-VN") + "đ";
}

export default function VendorDetailPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<VendorWithMenuResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"WALLET" | "CASH">("CASH");
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [orderInfo, setOrderInfo] = useState<OrderQueueInfo | null>(null);

  useEffect(() => {
    const cid = localStorage.getItem("userId") || null;
    setCustomerId(cid);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function fetchDetail() {
      if (!vendorId) return;
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken") || "";
        const res = await api.get<ApiResponse<VendorWithMenuResponse>>(
          `/api/vendor/${vendorId}`,
          token ? { Authorization: `Bearer ${token}` } : undefined
        );
        const outer = (res as any)?.data ?? res;
        const payload: VendorWithMenuResponse = outer?.data ?? outer ?? null;
        if (mounted) {
          setData(payload ?? null);
          setQty({});
          setPaymentMethod("CASH");
        }
      } catch (e) {
        console.error(e);
        if (mounted) {
          setData(null);
          setQty({});
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDetail();
    return () => {
      mounted = false;
    };
  }, [vendorId]);

  const vendor = data?.vendor ?? null;

  const queueId = useMemo(
    () => data?.vendorQueues?.find((q) => q.type === 1)?.id ?? null,
    [data]
  );

  const positionMax = useMemo(() => {
    const p = data?.vendorQueues?.find((q) => q.type === 1)?.positionMax;
    return typeof p === "number" ? p : 0;
  }, [data]);

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItemResponse[]>();
    for (const item of data?.menuItems ?? []) {
      const key = (item.typeOfFood ?? "Khác").trim() || "Khác";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [data]);

  const selectedItems = useMemo(() => {
    const byId: Record<string, MenuItemResponse> = {};
    for (const it of data?.menuItems ?? []) byId[it.id] = it;
    return Object.entries(qty)
      .filter(([_, q]) => q > 0)
      .map(([id, q]) => ({ item: byId[id], q }))
      .filter((x) => x.item);
  }, [qty, data]);

  const totalCount = selectedItems.reduce((s, x) => s + x.q, 0);
  const totalPrice = selectedItems.reduce(
    (s, x) => s + (x.item?.price ?? 0) * x.q,
    0
  );

  const inc = (id: string) =>
    setQty((p) => ({ ...p, [id]: Math.min((p[id] ?? 0) + 1, 99) }));
  const dec = (id: string) =>
    setQty((p) => ({ ...p, [id]: Math.max((p[id] ?? 0) - 1, 0) }));
  const handleCardClick = (id: string) =>
    setQty((p) => ({ ...p, [id]: (p[id] ?? 0) > 0 ? p[id] : 1 }));

  const openConfirm = () => {
    if (totalCount === 0) {
      toast.info("Vui lòng chọn ít nhất 1 món.");
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmJoin = async () => {
    if (!vendor?.id || !customerId) {
      toast.error("Thiếu thông tin quán hoặc khách hàng!");
      return;
    }
    if (!queueId) {
      toast.error("Không tìm thấy hàng đợi phù hợp cho quán này.");
      return;
    }

    const items: OrderItemCreate[] = selectedItems.map(({ item, q }) => ({
      menuItemId: item.id,
      quantity: q,
      unitPrice: item.price ?? undefined,
    }));

    const paymentMethodEnumValue = paymentMethod === "WALLET" ? 1 : 2;

    const payload: OrderCreateRequest = {
      vendorId: vendor.id,
      customerId,
      queueId,
      items,
      totalPrice: totalPrice || undefined,
      paymentMethod: paymentMethodEnumValue,
    };

    try {
      setSubmitting(true);
      const token = localStorage.getItem("accessToken") || "";
      const url = `/api/order/checkout${
        queueId ? `?queueId=${encodeURIComponent(queueId)}` : ""
      }`;

      const checkoutRes = await api.post<ApiResponse<OrderCheckoutResponse>>(
        url,
        payload,
        {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        } as any
      );

      const outer = (checkoutRes as any)?.data ?? checkoutRes;
      const checkoutPayload: OrderCheckoutResponse =
        outer?.data ?? outer ?? null;

      const orderId = checkoutPayload?.order?.id;

      if (!orderId) {
        setConfirmOpen(false);
        toast.success("Đặt hàng thành công, nhưng không lấy được thông tin chi tiết đơn.");
        return;
      }

      const detailRes = await api.get<ApiResponse<OrderQueueInfo>>(
        `/api/order/${orderId}/queue-info`,
        token ? { Authorization: `Bearer ${token}` } : undefined
      );

      const detailOuter = (detailRes as any)?.data ?? detailRes;
      const detailPayload: OrderQueueInfo =
        detailOuter?.data ?? detailOuter ?? null;

      setOrderInfo(detailPayload ?? { orderId });
      setConfirmOpen(false);
      setSuccessOpen(true);
      setQty({});
      toast.success("Tham gia hàng đợi thành công!");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Tạo đơn hàng thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/60 via-background to-background">
      <Navigation userType="customer" queueCount={0} />

      <div className="w-full px-4 md:px-8 lg:px-12 py-6 space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-card shadow-lg">
          <div className="absolute inset-0 opacity-40">
            {vendor?.logoUrl ? (
              <img
                src={buildMediaUrl(vendor.logoUrl)}
                alt={vendor?.name ?? ""}
                className="w-full h-full object-cover scale-105 blur-sm"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-800" />
            )}
          </div>
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-5 md:p-6 lg:p-8">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-background/70 shadow-md flex items-center justify-center">
                {vendor?.logoUrl ? (
                  <img
                    src={buildMediaUrl(vendor.logoUrl)}
                    alt={vendor?.name ?? ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2 text-white">
                <h1 className="text-2xl md:text-3xl font-semibold drop-shadow-sm">
                  {vendor?.name ?? "—"}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 bg-white/90 text-foreground border-0"
                  >
                    <Star className="w-3 h-3 text-amber-400" />
                    {typeof vendor?.averageRating === "number"
                      ? vendor.averageRating.toFixed(1)
                      : "0.0"}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 bg-white/90 text-foreground border-0"
                  >
                    <Users className="w-3 h-3 text-emerald-500" />
                    {vendor?.queueCount ?? 0} đang chờ
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-xs md:text-sm text-white/90">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[18rem] md:max-w-sm">
                      {vendor?.address || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{vendor?.openingHours || "—"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{vendor?.ownerPhone || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <Button
                variant="outline"
                className="bg-white/90 text-foreground border-none hover:bg-white"
                onClick={() => navigate(-1)}
              >
                Quay lại
              </Button>
              <Button
                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md"
                onClick={openConfirm}
                disabled={!data || loading}
              >
                Tham gia xếp hàng
              </Button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)] gap-6 items-start">
          <section className="space-y-6">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border rounded-2xl p-4 animate-pulse bg-card/60">
                    <div className="h-4 bg-muted rounded w-32 mb-4" />
                    <div className="grid md:grid-cols-3 gap-3">
                      <div className="h-28 bg-muted rounded" />
                      <div className="h-28 bg-muted rounded" />
                      <div className="h-28 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : grouped.length > 0 ? (
              <div className="space-y-6">
                {grouped.map(([group, items]) => (
                  <div key={group} className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-semibold text-base md:text-lg">
                        {group}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {items.map((it) => {
                        const q = qty[it.id] ?? 0;
                        return (
                          <div
                            key={it.id}
                            className={cn(
                              "rounded-2xl border bg-card/80 backdrop-blur-sm p-3 flex flex-col h-full",
                              "hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer",
                              q > 0 ? "border-emerald-400/70 shadow-emerald-100" : ""
                            )}
                            onClick={() => handleCardClick(it.id)}
                          >
                            <div className="w-full h-32 rounded-xl overflow-hidden bg-muted mb-2">
                              {it.imageUrl ? (
                                <img
                                  src={buildMediaUrl(it.imageUrl)}
                                  alt={it.name ?? ""}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  <ImageIcon className="w-5 h-5" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 space-y-1">
                              <div className="font-medium truncate">
                                {it.name ?? ""}
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {it.description || ""}
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                                <div className="text-muted-foreground">
                                  Giá bán
                                </div>
                                <div className="text-right font-semibold">
                                  {fmtVND(it.price ?? 0)}
                                </div>
                                <div className="text-muted-foreground">
                                  Thời gian chế biến
                                </div>
                                <div className="text-right">
                                  {(it.prepTime ?? 0).toString()} phút
                                </div>
                              </div>
                            </div>

                            <div
                              className="mt-3 flex items-center justify-between"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {q > 0 ? (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => dec(it.id)}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <div className="min-w-[2rem] text-center font-semibold">
                                    {q}
                                  </div>
                                  <Button
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => inc(it.id)}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="rounded-full px-4"
                                  onClick={() => inc(it.id)}
                                >
                                  Thêm
                                </Button>
                              )}

                              {q > 0 && (
                                <Badge variant="secondary" className="rounded-full">
                                  {fmtVND((it.price ?? 0) * q)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground px-1">
                Quán chưa cập nhật thực đơn.
              </div>
            )}
          </section>

          <aside className="sticky top-20 space-y-3">
            <div className="rounded-2xl border bg-card/80 backdrop-blur-sm p-4 shadow-sm">
              <h2 className="text-base font-semibold mb-3">
                Đơn của bạn
              </h2>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {selectedItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Chưa có món nào được chọn.
                  </p>
                ) : (
                  selectedItems.map(({ item, q }) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate max-w-[9rem]">
                        {q}x {item.name}
                      </span>
                      <span className="font-medium">
                        {fmtVND((item.price ?? 0) * q)}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Tổng số món</span>
                <span className="font-semibold">{totalCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="font-semibold text-emerald-600">
                  {fmtVND(totalPrice)}
                </span>
              </div>
              <Button
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={openConfirm}
                disabled={totalCount === 0}
              >
                Tham gia xếp hàng
              </Button>
            </div>
          </aside>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xếp hàng</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border bg-white shadow-sm p-4 space-y-3">
              <div className="text-lg font-semibold">
                {vendor?.name ?? "—"}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                Vị trí hiện tại:{" "}
                <span className="font-medium text-foreground">
                  {positionMax + 1}
                </span>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-muted-foreground text-xs">
                    Địa điểm nhận đơn
                  </div>
                  <div className="font-medium">{vendor?.address || "—"}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-4 bg-emerald-50 shadow-[0_0_10px_rgba(0,0,0,0.04)]">
              <div className="font-semibold mb-2">Chi tiết đơn hàng</div>

              {selectedItems.length === 0 ? (
                <div className="text-sm text-emerald-700 opacity-70">
                  Chưa chọn món.
                </div>
              ) : (
                <div className="space-y-1">
                  {selectedItems.map(({ item, q }) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {q}x {item.name}
                      </span>
                      <span className="font-semibold">
                        {fmtVND((item.price ?? 0) * q)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-emerald-200 pt-3 mt-3 flex items-center justify-between">
                <span className="font-semibold">Tổng cộng</span>
                <span className="font-semibold text-emerald-600">
                  {fmtVND(totalPrice)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border p-4 space-y-2">
              <div className="font-medium mb-1">Phương thức thanh toán</div>

              <button
                type="button"
                onClick={() => setPaymentMethod("WALLET")}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-left",
                  paymentMethod === "WALLET"
                    ? "border-primary ring-2 ring-primary/20"
                    : "hover:bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "w-4 h-4 rounded-full border",
                    paymentMethod === "WALLET" && "bg-primary border-primary"
                  )}
                />
                Ví của bạn
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-left",
                  paymentMethod === "CASH"
                    ? "border-primary ring-2 ring-primary/20"
                    : "hover:bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "w-4 h-4 rounded-full border",
                    paymentMethod === "CASH" && "bg-primary border-primary"
                  )}
                />
                Thanh toán tiền mặt
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                onClick={handleConfirmJoin}
                disabled={submitting}
                className="flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                {submitting ? "Đang xử lý..." : "Xác nhận"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex flex-col items-center space-y-3">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>

              <h2 className="text-xl font-bold">Đặt hàng thành công</h2>

              <p className="text-sm text-muted-foreground">
                Đơn hàng{" "}
                <span className="font-semibold">
                  {orderInfo?.orderCode || orderInfo?.orderId || "—"}
                </span>{" "}
                của bạn đã đặt thành công.
              </p>
            </div>

            <div className="w-full rounded-xl border bg-card p-4 space-y-3 text-sm text-left">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  Thời gian dự kiến nhận hàng
                </span>
                <span>{fmtTime(orderInfo?.estimatedPickupTime)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold">Thời gian đợi đến lượt</span>
                <span>
                  {orderInfo?.estimatedWaitMinutes != null
                    ? `${orderInfo.estimatedWaitMinutes} phút`
                    : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold">Vị trí xếp hàng</span>
                <span>
                  {orderInfo?.positionInQueue ??
                    (positionMax ? positionMax + 1 : "—")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold">Quán:</span>
                <span>{orderInfo?.vendorName || "—"}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold">Địa chỉ nhận đơn:</span>
                <span>{orderInfo?.vendorAddress || "—"}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 w-full pt-1">
              <Button
                variant="outline"
                onClick={() => setSuccessOpen(false)}
              >
                Đóng
              </Button>
              <Button
                onClick={() => {
                  navigate("/customer/active-queue");
                }}
              >
                Theo dõi đơn hàng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}