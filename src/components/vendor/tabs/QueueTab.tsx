// src/components/vendor/tabs/QueueTab.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Users, CreditCard, Banknote } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as Popover from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Hourglass,
  CalendarDays,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";
import { unwrapOrders } from "../utils";
import { OrderWithDetailsDto } from "../utils";
import { toast } from "sonner";

type Props = {
  vendor?: { id?: string } | null;
};

export default function QueueTab({ vendor }: Props) {
  const [liveCount, setLiveCount] = useState<number>(0);
  const [preCount, setPreCount] = useState<number>(0);

  useEffect(() => {
    setLiveCount(0);
    setPreCount(0);
  }, [vendor?.id]);

  const badgeCls =
    "inline-flex items-center justify-center ml-2 min-w-[1.6rem] px-2 py-0.5 rounded-full text-xs font-semibold";

  return (
    <div className="space-y-4">
      <Tabs defaultValue="live" className="space-y-4">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="live" className="flex items-center">
            <span>Hàng đợi trực tiếp</span>
            <span className={`${badgeCls} bg-primary text-primary-foreground`}>
              {liveCount}
            </span>
          </TabsTrigger>

          <TabsTrigger value="preorder" className="flex items-center">
            <span>Hàng đợi đặt trước</span>
            <span className={`${badgeCls} bg-slate-200 text-slate-800`}>
              {preCount}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <QueueList
            vendorId={vendor?.id}
            queueType={1}
            onCountChange={(n) => setLiveCount(n)}
          />
        </TabsContent>

        <TabsContent value="preorder">
          <QueueList
            vendorId={vendor?.id}
            queueType={2}
            onCountChange={(n) => setPreCount(n)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QueueList({
  vendorId,
  queueType,
  onCountChange,
}: {
  vendorId?: string;
  queueType: 1 | 2;
  onCountChange?: (n: number) => void;
}) {
  const [items, setItems] = useState<OrderWithDetailsDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [hasPreviousPage, setHasPreviousPage] = useState<boolean>(false);

  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmOrderId, setConfirmOrderId] = useState<string | null>(null);
  const [isOnTime, setIsOnTime] = useState(true);
  const [delayMinutes, setDelayMinutes] = useState<number>(0);
  const [delayReason, setDelayReason] = useState("");
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [confirmItemIds, setConfirmItemIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [delayUiOrderId, setDelayUiOrderId] = useState<string | null>(null);
  const [delayUiItemIds, setDelayUiItemIds] = useState<string[]>([]);
  const [delayUiMinutes, setDelayUiMinutes] = useState<number>(5);
  const [delayUiSubmitting, setDelayUiSubmitting] = useState(false);
  const [delayDialogOpen, setDelayDialogOpen] = useState(false);
  const [delayUiReason, setDelayUiReason] = useState("");
  const [delayUiType, setDelayUiType] = useState<number>(1);
  const [delayMenuItems, setDelayMenuItems] = useState<
    Array<{
      id: string;
      menuItemId: string;
      menuItemName: string;
      quantity: number;
      unitPrice: number;
    }>
  >([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<OrderWithDetailsDto | null>(
    null
  );

  const parseResponse = (res: any): OrderWithDetailsDto[] => {
    try {
      const arr = unwrapOrders<OrderWithDetailsDto>(res);
      if (Array.isArray(arr) && arr.length > 0) return arr;
    } catch {}

    const outer = (res as any)?.data ?? res;
    const pag = outer?.data ?? outer ?? null;
    if (pag) {
      if (Array.isArray(pag?.data)) return pag.data as OrderWithDetailsDto[];
      if (Array.isArray(pag)) return pag as OrderWithDetailsDto[];
    }

    if (Array.isArray(res)) return res as OrderWithDetailsDto[];

    return [];
  };

  const load = async (p = 1) => {
    if (!vendorId) {
      setItems([]);
      setTotalRecords(0);
      setHasNextPage(false);
      setHasPreviousPage(false);
      onCountChange?.(0);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const statusParam =
        statusFilter !== "all" ? `&status=${encodeURIComponent(statusFilter)}` : "";
      const url = `/api/order/by-customer?vendorId=${encodeURIComponent(
        vendorId
      )}&queueType=${queueType}&pageNumber=${p}&pageSize=${pageSize}${statusParam}`;

      const res = await api.get(url, headers);

      const arr = parseResponse(res);
      const orders =
        arr.length > 0 ? arr : unwrapOrders<OrderWithDetailsDto>(res) ?? [];
      const outer = (res as any)?.data ?? res;

      const pag = outer ?? null;

      const total =
        Number(pag?.totalRecords ?? pag?.total ?? 0) || orders.length;
      const pageFromResp = Number(pag?.page ?? p) || p;
      const pageSzFromResp = Number(pag?.pageSize ?? pageSize) || pageSize;
      const computedHasNext = total > pageFromResp * pageSzFromResp;
      const computedHasPrev = pageFromResp > 1;
      const hasNext =
        typeof pag?.hasNextPage === "boolean"
          ? pag.hasNextPage
          : computedHasNext;
      const hasPrev =
        typeof pag?.hasPreviousPage === "boolean"
          ? pag.hasPreviousPage
          : computedHasPrev;

      setItems(orders);
      setTotalRecords(total);
      setHasNextPage(hasNext);
      setHasPreviousPage(hasPrev);
      setPage(p);
      onCountChange?.(total);
    } catch (err) {
      console.error("[QueueTab] load error", err);
      toast.error("Không tải được hàng đợi.");
      onCountChange?.(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [vendorId, queueType, statusFilter]);

  useEffect(() => {
    void load(page);
  }, [vendorId, queueType, page, statusFilter]);

  useEffect(() => {
    containerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [page]);

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(
      d.getDate()
    )}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  };

  const formatWaitMinutes = (span?: string | null) => {
    if (!span) return "—";
    const parts = span.split(":");
    if (parts.length < 2) return span;
    const h = parseInt(parts[0] || "0", 10);
    const m = parseInt(parts[1] || "0", 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return span;
    const totalMin = h * 60 + m;
    if (totalMin <= 0) return "—";
    return `${totalMin} phút`;
  };

  const formatPreorderWait = (iso?: string | null) => {
    if (!iso) return "—";
    const est = new Date(iso);
    if (Number.isNaN(est.getTime())) return "—";
    const diffMs = est.getTime() - Date.now();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin <= 0) return "0 phút";
    return `${diffMin} phút`;
  };

  const mapPaymentStatus = (
  ps: number | string | null | undefined
) => {
  const n =
    ps == null
      ? null
      : typeof ps === "number"
      ? ps
      : Number.parseInt(String(ps), 10);

  switch (n) {
    case 0:
      return { text: "Chưa thanh toán", color: "bg-rose-500 text-white" };
    case 1:
      return { text: "Đang xử lý", color: "bg-amber-500 text-white" };
    case 2:
      return { text: "Đã thanh toán", color: "bg-blue-600 text-white" };
    case 3:
      return { text: "Thanh toán thất bại", color: "bg-slate-600 text-white" };
    case 4:
      return { text: "Đã hoàn tiền", color: "bg-indigo-500 text-white" };
    default:
      return { text: "Không rõ", color: "bg-gray-400 text-white" };
  }
};


  const mapOrderStatus = (s?: number | null) => {
    switch (s) {
      case 0:
        return "Chờ xác nhận";
      case 4:
        return "Đã xác nhận";
      case 1:
        return "Đang xử lý";
      case 5:
        return "Đang chế biến";
      case 6:
        return "Sẵn sàng";
      case 2:
        return "Hoàn tất";
      case 3:
        return "Đã hủy";
      default:
        return "—";
    }
  };

  const getOrderStatusColor = (s?: number | string | null) => {
  const n = s == null ? null : Number(s);
  switch (n) {
    case 0:
      return "bg-gray-500";
    case 4:
      return "bg-blue-500";
    case 1:
    case 5:
      return "bg-amber-500";
    case 6:
      return "bg-emerald-500";
    case 2:
      return "bg-green-600";
    case 3:
      return "bg-rose-500";
    default:
      return "bg-slate-400";
  }
};


  const fmtCurrency = (n?: number | null) =>
    n == null ? "0 đ" : `${n.toLocaleString("vi-VN")} đ`;

  const filtered = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((i) => String(i.status) === statusFilter);
  }, [items, statusFilter]);

  const onPrev = () => {
    if (page > 1) setPage((p) => Math.max(1, p - 1));
  };

  const onNext = () => {
    if (hasNextPage) setPage((p) => p + 1);
  };

  const updateOrderStatusWithContext = async (
    order: OrderWithDetailsDto,
    newStatus: number
  ) => {
    try {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.add(order.id);
        return next;
      });
      const token = localStorage.getItem("accessToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const qePre = (order as any).queueEntryPreOrder as
        | { estimatedServeTime?: string | null }
        | undefined;
      const estServeIso =
        qePre?.estimatedServeTime ?? order.queueEntry?.estimatedServeTime ?? null;

      const onTime = (() => {
        if (!estServeIso) return false;
        const now = Date.now();
        const est = new Date(estServeIso).getTime();
        if (Number.isNaN(est)) return false;
        return now <= est;
      })();

      await api.post(
        `/api/order/${order.id}/status`,
        {
          id: order.id,
          status: newStatus,
          notifyVendor: true,
          onTime,
          isPreOrder: queueType === 2,
        },
        headers
      );

      toast.success("Cập nhật trạng thái đơn hàng thành công.");
      await load(page);
    } catch (err) {
      console.error("[QueueTab] updateOrderStatus error", err);
      toast.error("Cập nhật trạng thái đơn hàng thất bại.");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
  };

  const startRecord = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord =
    totalRecords === 0 ? 0 : Math.min(page * pageSize, totalRecords);

  const submitVendorConfirm = async () => {
    if (!confirmOrderId) return;
    try {
      setConfirmSubmitting(true);
      const token = localStorage.getItem("accessToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const current = filtered.find((o) => o.id === confirmOrderId);
      const delayType = Number(current?.status) === 5 ? 2 : 1;
      const payload: {
        isOnTime: boolean;
        delayMinutes?: number;
        reason?: string;
        orderDetailIds?: string[];
        delayType?: number;
      } = {
        isOnTime,
      };
      if (!isOnTime) {
        const d = Math.max(
          0,
          Math.min(30, Number.isFinite(delayMinutes) ? delayMinutes : 0)
        );
        payload.delayMinutes = d;
        if (delayReason && delayReason.trim())
          payload.reason = delayReason.trim();
        payload.delayType = delayType;
        if (
          delayType === 2 &&
          Array.isArray(confirmItemIds) &&
          confirmItemIds.length > 0
        ) {
          payload.orderDetailIds = confirmItemIds;
        }
      }
      await api.post(
        `/api/Order/${confirmOrderId}/cooking-confirm`,
        payload,
        headers
      );
      toast.success(isOnTime ? "Đã xác nhận kịp ETA" : "Đã báo trễ ETA");
      setConfirmOpen(false);
      setConfirmOrderId(null);
      setDelayMinutes(0);
      setDelayReason("");
      setConfirmItemIds([]);
      await load(page);
    } catch (err) {
      console.error("[QueueTab] confirm-cooking error", err);
      toast.error("Xác nhận tiến độ thất bại.");
    } finally {
      setConfirmSubmitting(false);
    }
  };

  const submitDelayForOrder = async (order: OrderWithDetailsDto) => {
    try {
      setDelayUiSubmitting(true);
      const token = localStorage.getItem("accessToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const payload: {
        isOnTime: boolean;
        delayMinutes: number;
        orderDetailIds?: string[];
        reason?: string;
        delayType?: number;
      } = {
        isOnTime: false,
        delayMinutes: Math.max(1, Math.min(30, delayUiMinutes)),
      };
      payload.delayType = delayUiType;
      if (
        delayUiType === 2 &&
        Array.isArray(delayUiItemIds) &&
        delayUiItemIds.length > 0
      ) {
        payload.orderDetailIds = delayUiItemIds;
      }
      if (delayUiReason && delayUiReason.trim())
        payload.reason = delayUiReason.trim();
      await api.post(
        `/api/order/${order.id}/cooking-confirm`,
        payload,
        headers
      );
      toast.success("Đã báo trễ đơn hàng");
      setDelayUiOrderId(null);
      setDelayUiItemIds([]);
      setDelayUiMinutes(5);
      setDelayUiReason("");
      setDelayUiType(1);
      setDelayDialogOpen(false);
      await load(page);
    } catch (err) {
      console.error("[QueueTab] submitDelayForOrder error", err);
      toast.error("Báo trễ thất bại.");
    } finally {
      setDelayUiSubmitting(false);
    }
  };

  return (
    <div ref={containerRef}>
      <div className="flex items-center gap-2 justify-end mb-3">
        <Select
          value={String(statusFilter || "all")}
          onValueChange={(v) => setStatusFilter(v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="0">Chờ xác nhận</SelectItem>
            <SelectItem value="4">Xác nhận</SelectItem>
            <SelectItem value="5">Chế biến</SelectItem>
            <SelectItem value="6">Sẵn sàng</SelectItem>
            <SelectItem value="2">Hoàn tất</SelectItem>
            <SelectItem value="3">Đã hủy</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setPage(1)}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Đang tải...
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có đơn nào.</p>
        ) : (
          filtered.map((it) => {
            const rawPaymentStatus =
              (it as any).paymentStatus as number | string | null | undefined;
            const payment = mapPaymentStatus(
              rawPaymentStatus == null
                ? null
                : typeof rawPaymentStatus === "number"
                ? rawPaymentStatus
                : Number.parseInt(String(rawPaymentStatus), 10)
            );

            const statusRaw =
              (it as any).status as number | string | null | undefined;
            const statusNum =
              statusRaw == null
                ? null
                : typeof statusRaw === "number"
                ? statusRaw
                : Number.parseInt(String(statusRaw), 10);
            const statusText = mapOrderStatus(statusNum);

            const queueEntryPreOrder = (it as any)
              .queueEntryPreOrder as
              | {
                  position?: number;
                  joinedAt?: string;
                  servedAt?: string;
                  status?: string | number;
                  estimatedServeTime?: string;
                  estimatedWaitTime?: string;
                }
              | undefined;

            const queueInfo =
              queueType === 2 ? queueEntryPreOrder : it.queueEntry;

            const estServe = queueInfo?.estimatedServeTime
              ? formatDate(queueInfo.estimatedServeTime)
              : "";
            const waitText =
              queueType === 2
                ? formatPreorderWait(queueInfo?.estimatedServeTime)
                : queueInfo?.estimatedWaitTime
                ? formatWaitMinutes(queueInfo.estimatedWaitTime)
                : "—";
            const rawStatus = Number((it as any).status ?? -1);

            const qeAny = it.queueEntry as any;

            const firstNotified = Boolean(
              (it as any)?.FirstNotified ??
                (it as any)?.firstNotified ??
                qeAny?.FirstNotified ??
                qeAny?.firstNotified ??
                false
            );
            const lastNotified = Boolean(
              (it as any)?.LastNotified ??
                (it as any)?.lastNotified ??
                qeAny?.LastNotified ??
                qeAny?.lastNotified ??
                false
            );
            const delayDetach = Boolean(
              (it as any)?.delayDetach ?? qeAny?.delayDetach ?? false
            );

            const delayMinutesRaw =
              ((it as any)?.delayMinutes ??
                (it as any)?.DelayMinutes ??
                qeAny?.delayMinutes ??
                qeAny?.DelayMinutes ??
                0) as number | string;
            const hasDelay =
              Number.parseInt(String(delayMinutesRaw), 10) > 0;

            let buttonLabel = statusText;
            let nextStatus: number | null = null;

            if (rawStatus === 4) {
              buttonLabel = "Chế biến";
              nextStatus = 5;
            } else if (rawStatus === 5) {
              buttonLabel = "Sẵn sàng";
              nextStatus = 6;
            } else if (rawStatus === 6) {
              buttonLabel = "Hoàn tất";
              nextStatus = 2;
            } else if (rawStatus === 0) {
              buttonLabel = "Xác nhận";
              nextStatus = 4;
            } else if (rawStatus === 2 || rawStatus === 3) {
              nextStatus = null;
            }

            const isUpdating = updatingIds.has(it.id);
            const canClick = !!nextStatus && !isUpdating && !loading;

            const customerName = (it as any).customerName as
              | string
              | undefined;
            const customerPhone = (it as any).customerPhone as
              | string
              | undefined;

            return (
              <div
                key={it.id}
                className="border border-border rounded-lg p-4 relative hover:bg-muted/30 transition"
              >
                <div
                  className={`absolute top-0 right-0 px-3 py-1 rounded-bl-md text-xs font-semibold ${payment.color}`}
                >
                  {payment.text}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                      #{queueInfo?.position ?? ""}
                    </div>

                    <div>
                      <p className="font-semibold text-lg">
                        {customerName} - {customerPhone}
                      </p>

                      <div className="mt-2 space-y-1 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-emerald-600" />
                          <span className="font-semibold text-foreground">
                            Đặt vào:
                          </span>
                          <span>{formatDate(it.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Hourglass className="h-4 w-4 text-amber-600" />
                          <span className="font-semibold text-foreground">
                            Thời gian đợi:
                          </span>
                          <span>{waitText}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-sky-600" />
                          <span className="font-semibold text-foreground">
                            Thời gian nhận hàng dự kiến:
                          </span>
                          <span>{estServe}</span>
                        </div>
                      </div>

                      {rawStatus === 4 && firstNotified && (
                        <div className="mt-3 border border-amber-300 bg-amber-50 text-amber-700 rounded p-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Đơn có nguy cơ trễ.</span>
                        </div>
                      )}

                      {rawStatus === 5 && lastNotified && delayDetach && (
                        <div className="mt-3 border border-rose-300 bg-rose-50 text-rose-700 rounded p-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Đơn đang trễ</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1 mt-3">
                        {it.details.map((d) => (
                          <span
                            key={d.id}
                            className="text-xs bg-muted px-2 py-1 rounded border border-border shadow-sm"
                          >
                            {d.quantity} x {d.menuItemName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setDetailOrder(it);
                        setDetailOpen(true);
                      }}
                    >
                      Chi tiết
                    </Button>

                    <Button
                      className="px-6 w-full"
                      disabled={!canClick}
                      onClick={() => {
                        if (!nextStatus || !canClick) return;
                        updateOrderStatusWithContext(it, nextStatus);
                      }}
                    >
                      {isUpdating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Đang cập nhật...
                        </>
                      ) : (
                        buttonLabel
                      )}
                    </Button>

                    {rawStatus === 4 && firstNotified && !hasDelay && (
                      <Button
                        variant="default"
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => {
                          setDelayUiOrderId(it.id);
                          setDelayUiItemIds([]);
                          setDelayUiMinutes(5);
                          setDelayUiReason("");
                          setDelayMenuItems(it.details as any);
                          setDelayUiType(1);
                          setDelayDialogOpen(true);
                        }}
                      >
                        Báo trễ
                      </Button>
                    )}
                    {rawStatus === 5 && lastNotified && !hasDelay && (
                      <Button
                        variant="default"
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => {
                          setDelayUiOrderId(it.id);
                          setDelayUiItemIds([]);
                          setDelayUiMinutes(5);
                          setDelayUiReason("");
                          setDelayMenuItems(it.details as any);
                          setDelayUiType(2);
                          setDelayDialogOpen(true);
                        }}
                      >
                        Báo trễ
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Hiển thị <span className="font-semibold">{startRecord}</span> -{" "}
          <span className="font-semibold">{endRecord}</span> của{" "}
          <span className="font-semibold">{totalRecords}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={!hasPreviousPage || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="px-3 py-1 rounded border border-border text-sm">
            {page}
            {Math.max(1, Math.ceil(totalRecords / pageSize)) > 1 && (
              <span className="text-xs text-muted-foreground ml-2">
                / {Math.max(1, Math.ceil(totalRecords / pageSize))}
              </span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={!hasNextPage || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="text-center">
              Xác nhận tiến độ món ăn
            </DialogTitle>
            <DialogDescription className="text-center">
              Vui lòng xác nhận tiến độ hoàn thành đơn hàng.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Button
                className={`px-6 transition-all ${
                  isOnTime
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-white text-green-700 border border-green-600"
                }`}
                disabled={confirmSubmitting}
                onClick={() => {
                  setIsOnTime(true);
                  submitVendorConfirm();
                }}
              >
                Hoàn thành đúng hẹn
              </Button>

              <Button
                className={`px-6 transition-all ${
                  !isOnTime
                    ? "bg-red-600 text-white shadow-md"
                    : "bg-white text-red-700 border border-red-600"
                }`}
                disabled={confirmSubmitting}
                onClick={() => setIsOnTime(false)}
              >
                Trễ đơn
              </Button>
            </div>

            {!isOnTime && (
              <div className="grid gap-3 pt-2">
                {(() => {
                  const current = filtered.find((o) => o.id === confirmOrderId);
                  if (!current) return null;
                  return (
                    <div>
                      <label className="text-sm">Món bị trễ (tuỳ chọn)</label>
                      <Popover.Root>
                        <Popover.Trigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between"
                          >
                            {confirmItemIds.length
                              ? `${confirmItemIds.length} món đã chọn`
                              : "Chọn món"}
                          </Button>
                        </Popover.Trigger>
                        <Popover.Content
                          side="bottom"
                          align="start"
                          className="z-50 w-64 rounded-md border bg-popover text-popover-foreground shadow-md"
                        >
                          <div className="max-h-60 overflow-y-auto p-1">
                            {current.details.map((d) => {
                              const id = String(d.id || "");
                              const name =
                                d.menuItemName ||
                                d.menuItemId ||
                                d.id ||
                                "Món";
                              const checked = confirmItemIds.includes(id);
                              return (
                                <label
                                  key={id}
                                  className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const v = e.target.checked;
                                      setConfirmItemIds((prev) => {
                                        const next = new Set(prev);
                                        if (v) next.add(id);
                                        else next.delete(id);
                                        return Array.from(next);
                                      });
                                    }}
                                    className="h-4 w-4"
                                  />
                                  <span className="flex-1">{name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </Popover.Content>
                      </Popover.Root>
                    </div>
                  );
                })()}
                <div>
                  <label className="text-sm font-medium flex items-center gap-1">
                    Số phút trễ (tối đa 30 phút)
                    <span className="text-red-600 font-bold">*</span>
                  </label>

                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={delayMinutes}
                    onChange={(e) =>
                      setDelayMinutes(parseInt(e.target.value || "0", 10))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Lý do trễ đơn</label>
                  <Input
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    placeholder="Ví dụ: khách đổi món, nguyên liệu thiếu..."
                  />
                </div>

                <Button
                  className="bg-red-600 text-white hover:bg-red-700"
                  disabled={confirmSubmitting}
                  onClick={submitVendorConfirm}
                >
                  {confirmSubmitting ? "Đang gửi..." : "Xác nhận trễ đơn"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={delayDialogOpen} onOpenChange={setDelayDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Báo trễ đơn hàng</DialogTitle>
            <DialogDescription>
              Chọn món bị trễ, số phút trễ và lý do.
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const current = filtered.find((o) => o.id === delayUiOrderId);
            if (!current) return null;
            return (
              <div className="space-y-3">
                <div>
                  <label className="text-sm">Món bị trễ (tuỳ chọn)</label>
                  {delayUiType === 2 ? (
                    <Popover.Root>
                      <Popover.Trigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        >
                          {delayUiItemIds.length
                            ? `${delayUiItemIds.length} món đã chọn`
                            : "Chọn món"}
                        </Button>
                      </Popover.Trigger>
                      <Popover.Content
                        side="bottom"
                        align="start"
                        className="z-50 w-64 rounded-md border bg-popover text-popover-foreground shadow-md"
                      >
                        <div className="max-h-60 overflow-y-auto p-1">
                          {(delayMenuItems.length > 0
                            ? delayMenuItems
                            : current.details
                          ).map((d) => {
                            const id = String(d.id || "");
                            const name =
                              d.menuItemName ||
                              d.menuItemId ||
                              d.id ||
                              "Món";
                            const checked = delayUiItemIds.includes(id);
                            return (
                              <label
                                key={id}
                                className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const v = e.target.checked;
                                    setDelayUiItemIds((prev) => {
                                      const next = new Set(prev);
                                      if (v) next.add(id);
                                      else next.delete(id);
                                      return Array.from(next);
                                    });
                                  }}
                                  className="h-4 w-4"
                                />
                                <span className="flex-1">{name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </Popover.Content>
                    </Popover.Root>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Không cần chọn món cho trễ trước chế biến.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm">Phút trễ (toàn đơn)</label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={delayUiMinutes}
                    onChange={(e) =>
                      setDelayUiMinutes(
                        Math.max(
                          1,
                          Math.min(
                            30,
                            parseInt(e.target.value || "1", 10)
                          )
                        )
                      )
                    }
                  />
                </div>
                <div>
                  <label className="text-sm">Lý do trễ</label>
                  <Input
                    value={delayUiReason}
                    onChange={(e) => setDelayUiReason(e.target.value)}
                    placeholder="Ví dụ: thiếu nguyên liệu, thiết bị trục trặc"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDelayDialogOpen(false)}
                  >
                    Đóng
                  </Button>
                  <Button
                    onClick={() => submitDelayForOrder(current)}
                    disabled={delayUiSubmitting}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {delayUiSubmitting ? "Đang gửi..." : "Báo trễ"}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {detailOrder && (
        <Dialog
          open={detailOpen}
          onOpenChange={(open) => {
            setDetailOpen(open);
            if (!open) setDetailOrder(null);
          }}
        >
          {detailOrder && (
        <Dialog
          open={detailOpen}
          onOpenChange={(open) => {
            setDetailOpen(open);
            if (!open) setDetailOrder(null);
          }}
        >
          <DialogContent className="max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <span>Chi tiết đơn hàng</span>
              </DialogTitle>
              <DialogDescription>
                Xem thông tin khách, món và thời gian dự kiến.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  {(() => {
                    const customerName = (detailOrder as any)
                      .customerName as string | undefined;
                    const customerPhone = (detailOrder as any)
                      .customerPhone as string | undefined;

                    const statusRaw =
                      (detailOrder as any)
                        .status as number | string | null | undefined;
                    const statusNum =
                      statusRaw == null
                        ? null
                        : typeof statusRaw === "number"
                        ? statusRaw
                        : Number.parseInt(String(statusRaw), 10);

                    const statusText = mapOrderStatus(statusNum);
                    const statusColor = getOrderStatusColor(statusNum);

                    const queueInfo =
                      queueType === 2
                        ? (detailOrder as any).queueEntryPreOrder ??
                          detailOrder.queueEntry
                        : detailOrder.queueEntry;

                    const estServe = queueInfo?.estimatedServeTime
                      ? formatDate(queueInfo.estimatedServeTime)
                      : "—";

                    const waitText =
                      queueType === 2
                        ? formatPreorderWait(queueInfo?.estimatedServeTime)
                        : queueInfo?.estimatedWaitTime
                        ? formatWaitMinutes(queueInfo.estimatedWaitTime)
                        : "—";

                    return (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">
                            Khách hàng: {customerName} - {customerPhone}
                          </h3>
                          <Badge
                            className={`${statusColor} text-white flex items-center`}
                          >
                            {statusText}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Mã đơn hàng
                            </p>
                            <p className="text-base font-semibold">
                              #{(detailOrder.code || "").toUpperCase()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Loại hàng đợi
                            </p>
                            <p className="text-base font-semibold">
                              {queueType === 2 ? "Đặt trước" : "Xếp hàng ngay"}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>Quán: {detailOrder.code || "—"}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Đặt lúc: {formatDate(detailOrder.createdAt)}</span>
                          </div>

                          {queueType === 2 ? (
                            <>
                              <div className="flex items-center space-x-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Thời gian đợi đến lượt: {waitText}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>
                                  Thời gian nhận hàng dự kiến: {estServe}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center space-x-2 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>
                                  Vị trí trong hàng:{" "}
                                  {queueInfo?.position ?? ""}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Thời gian đợi đến lượt: {waitText}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>
                                  Thời gian nhận hàng dự kiến: {estServe}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Chi tiết đơn hàng</h4>

                  <div className="space-y-2 text-sm">
                    {detailOrder.details.map((d) => (
                      <div
                        key={d.id}
                        className="flex justify-between items-center"
                      >
                        <span>
                          {d.quantity ?? 0}x{" "}
                          {d.menuItemName || d.menuItemId || "Món"}
                        </span>
                        <span className="font-medium">
                          {fmtCurrency(
                            (d.unitPrice ?? 0) * (d.quantity ?? 0)
                          )}
                        </span>
                      </div>
                    ))}

                    <Separator className="my-2" />

                    <div className="flex justify-between font-medium">
                      <span>Tổng cộng</span>
                      <span className="text-primary">
                        {fmtCurrency(detailOrder.totalPrice)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Thông tin thanh toán</h4>

                  {(() => {
                    const payment = mapPaymentStatus(
                      (detailOrder as any)
                        .paymentStatus as number | null | undefined
                    );

                    const rawMethod = (detailOrder as any)
                      .paymentMethod as number | null | undefined;

                    const isWallet = rawMethod === 1;

                    const paymentMethodIcon = isWallet ? (
                      <CreditCard className="h-4 w-4 text-primary" />
                    ) : (
                      <Banknote className="h-4 w-4 text-green-600" />
                    );

                    const paymentMethodText = isWallet
                      ? "Thanh toán qua ví"
                      : "Tiền mặt";

                    return (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {paymentMethodIcon}
                          <span className="text-sm">{paymentMethodText}</span>
                        </div>

                        <Badge className={`${payment.color} text-white text-xs`}>
                          {payment.text}
                        </Badge>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>


              <Button
                onClick={() => {
                  setDetailOpen(false);
                  setDetailOrder(null);
                }}
                className="w-full"
              >
                Đóng
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

        </Dialog>
      )}
    </div>
  );
}
