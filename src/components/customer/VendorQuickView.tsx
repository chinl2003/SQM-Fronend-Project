import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { api, ApiResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ===== Types =====
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

type VendorWithMenuResponse = {
  vendor: VendorModel;
  menuItems: MenuItemResponse[];
  vendorQueues?: VendorQueueSlim[];
};

type VendorQueueSlim = {
  id: string;
  type: number;
  status: number;
  positionMax?: number; // <-- thêm positionMax
};

// client-side request types (khớp API)
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
  // gửi enum dưới dạng số: 1 = VNPay, 2 = Cash
  paymentMethod?: number | null;
};

// ===== Helpers =====
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

// ===== Component =====
export function VendorQuickView({
  open,
  vendorId,
  onClose,
  // thêm để gọi API Order:
  customerId,
}: {
  open: boolean;
  vendorId: string | null;
  onClose: () => void;
  customerId: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<VendorWithMenuResponse | null>(null);

  // queueId: lấy queue type === 1 (Normal) như trước
  const queueId = useMemo(() => {
    return data?.vendorQueues?.find((q) => q.type === 1)?.id ?? null;
  }, [data]);

  // positionMax lấy từ vendorQueues (type === 1), mặc định 0
  const positionMax = useMemo(() => {
    const p = data?.vendorQueues?.find((q) => q.type === 1)?.positionMax;
    return typeof p === "number" ? p : 0;
  }, [data]);

  // số lượng chọn theo itemId
  const [qty, setQty] = useState<Record<string, number>>({});
  // modal xác nhận
  const [confirmOpen, setConfirmOpen] = useState(false);
  // CHANGED: payment method values - WALLET instead of VNPAY
  const [paymentMethod, setPaymentMethod] = useState<"WALLET" | "CASH">(
    "CASH"
  );

  // fetch vendor + menu
  useEffect(() => {
    let mounted = true;
    async function fetchDetail() {
      if (!open || !vendorId) return;
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
  }, [open, vendorId]);

  const vendor = data?.vendor ?? null;

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItemResponse[]>();
    for (const item of data?.menuItems ?? []) {
      const key = (item.typeOfFood ?? "Khác").trim() || "Khác";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [data]);

  // Tổng số món & tổng tiền
  const selectedItems = useMemo(() => {
    const byId: Record<string, MenuItemResponse> = {};
    for (const it of data?.menuItems ?? []) byId[it.id] = it;
    return Object.entries(qty)
      .filter(([_, q]) => q > 0)
      .map(([id, q]) => ({ item: byId[id], q }))
      .filter((x) => x.item); // phòng null
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

  // ===== Gọi API tạo Order + ghi danh hàng đợi =====
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

    // map paymentMethod cho API: WALLET -> VNPay (1), CASH -> Cash (2)
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
      // gửi queueId dưới dạng query param (API nhận queueId từ query)
      const url = `/api/order/checkout${queueId ? `?queueId=${encodeURIComponent(queueId)}` : ""}`;

      await api.post<ApiResponse<any>>(url, payload, {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      } as any);

      setConfirmOpen(false);
      toast.success("Tham gia hàng đợi thành công!");
      // reset hoặc đóng view tuỳ ý:
      // setQty({});
      // onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Tạo đơn hàng thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                {vendor?.logoUrl ? (
                  <img
                    src={buildMediaUrl(vendor.logoUrl)}
                    alt={vendor?.name ?? ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <span>{vendor?.name ?? "—"}</span>
            </DialogTitle>
            <DialogDescription>
              Xem nhanh thông tin và thực đơn của quán
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {/* badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="w-3 h-3" />
                {typeof vendor?.averageRating === "number"
                  ? vendor.averageRating.toFixed(1)
                  : "0.0"}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {vendor?.queueCount ?? 0} đang chờ
              </Badge>
              <Badge className="ml-auto bg-primary text-primary-foreground">
                {totalCount} món đã chọn
              </Badge>
            </div>

            {/* info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-muted-foreground">Địa chỉ</div>
                  <div className="font-medium">{vendor?.address || "—"}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-muted-foreground">Giờ mở cửa</div>
                  <div className="font-medium">
                    {vendor?.openingHours || "—"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-muted-foreground">Liên hệ</div>
                  <div className="font-medium">{vendor?.ownerPhone || "—"}</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* menu */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border rounded-lg p-4 animate-pulse">
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
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">{group}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {items.map((it) => {
                        const q = qty[it.id] ?? 0;
                        return (
                          <div
                            key={it.id}
                            className={cn(
                              "rounded-lg border p-3 bg-card relative",
                              "hover:shadow-sm hover:ring-1 hover:ring-primary/20 transition-all",
                              q > 0 ? "ring-1 ring-primary/40" : ""
                            )}
                            onClick={() => handleCardClick(it.id)}
                          >
                            <div className="w-full h-28 rounded-md overflow-hidden bg-muted mb-2">
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

                            <div className="space-y-1">
                              <div className="font-medium truncate">
                                {it.name ?? "—"}
                              </div>
                              <div className="text-sm text-muted-foreground line-clamp-2">
                                {it.description || "—"}
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-sm pt-2">
                                <div className="text-muted-foreground">
                                  Giá bán
                                </div>
                                <div className="text-right font-semibold">
                                  {fmtVND(it.price ?? 0)}
                                </div>

                                <div className="text-muted-foreground">
                                  Chế biến
                                </div>
                                <div className="text-right">
                                  {(it.prepTime ?? 0).toString()} phút
                                </div>

                                <div className="text-muted-foreground">
                                  Còn lại
                                </div>
                                <div className="text-right">
                                  {(it.quantity ?? 0).toString()}
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
                                  onClick={() => inc(it.id)}
                                >
                                  Thêm
                                </Button>
                              )}

                              {q > 0 && (
                                <Badge variant="secondary">
                                  Tạm tính: {fmtVND((it.price ?? 0) * q)}
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
              <div className="text-sm text-muted-foreground">
                Quán chưa cập nhật thực đơn.
              </div>
            )}

            {/* Footer tổng cộng + CTA */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2">
              <div className="text-sm">
                <span className="text-muted-foreground mr-1">Tổng số món:</span>
                <span className="font-semibold">{totalCount}</span>
                <span className="mx-2">•</span>
                <span className="text-muted-foreground mr-1">Tạm tính:</span>
                <span className="font-semibold text-emerald-600">
                  {fmtVND(totalPrice)}
                </span>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Đóng
                </Button>
                <Button onClick={openConfirm}>Tham gia xếp hàng</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Tổng quan (xác nhận) */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xếp hàng</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-xl border p-4 bg-accent/20">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{vendor?.name ?? "—"}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {/* HIỆN VỊ TRÍ: positionMax + 1 */}
                  Vị trí: {positionMax + 1}
                </div>
              </div>

              <div className="text-sm text-muted-foreground mt-2">
                Chi tiết đơn hàng:
              </div>

              <div className="mt-2 space-y-1">
                {selectedItems.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Chưa chọn món.
                  </div>
                ) : (
                  selectedItems.map(({ item, q }) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        {q}x {item.name}
                      </div>
                      <div>{fmtVND((item.price ?? 0) * q)}</div>
                    </div>
                  ))
                )}
              </div>

              <Separator className="my-3" />

              <div className="flex items-center justify-between">
                <div className="font-semibold">Tổng cộng</div>
                <div className="font-semibold text-emerald-600">
                  {fmtVND(totalPrice)}
                </div>
              </div>
            </div>

            {/* Payment method mock (giữ UI) */}
            <div className="rounded-xl border p-4">
              <div className="font-medium mb-3">Phương thức thanh toán</div>
              <div className="space-y-2">
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
                      "inline-block w-4 h-4 rounded-full border",
                      paymentMethod === "WALLET"
                        ? "bg-primary border-primary"
                        : ""
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
                      "inline-block w-4 h-4 rounded-full border",
                      paymentMethod === "CASH" ? "bg-primary border-primary" : ""
                    )}
                  />
                  Thanh toán tiền mặt
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button onClick={handleConfirmJoin} disabled={submitting}>
                <CheckCircle className="w-4 h-4 mr-1" />
                {submitting ? "Đang xử lý..." : "Xác nhận"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}