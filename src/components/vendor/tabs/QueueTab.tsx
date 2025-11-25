// src/components/vendor/tabs/QueueTab.tsx
import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { unwrapOrders } from "../utils";
import { OrderWithDetailsDto } from "../utils";
import { toast } from "sonner";

type Props = {
  vendor?: { id?: string } | null;
};

export default function QueueTab({ vendor }: Props) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="live" className="space-y-4">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="live">Hàng đợi trực tiếp</TabsTrigger>
          <TabsTrigger value="preorder">Hàng đợi đặt trước</TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <QueueList vendorId={vendor?.id} queueType={1} />
        </TabsContent>

        <TabsContent value="preorder">
          <QueueList vendorId={vendor?.id} queueType={2} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QueueList({
  vendorId,
  queueType,
}: {
  vendorId?: string;
  queueType: 1 | 2;
}) {
  const [items, setItems] = useState<OrderWithDetailsDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20); // mặc định 20
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [hasPreviousPage, setHasPreviousPage] = useState<boolean>(false);

  const parseResponse = (res: any): OrderWithDetailsDto[] => {
    // helper: try unwrapOrders (existing util) first, it handles many shapes
    try {
      const arr = unwrapOrders<OrderWithDetailsDto>(res);
      if (Array.isArray(arr) && arr.length > 0) return arr;
    } catch (e) {
      // ignore
    }

    // try typical paginated shape: res.data.data => { data: [...], totalRecords, page, pageSize, hasNextPage }
    const outer = (res as any)?.data ?? res;
    const pag = outer?.data ?? outer ?? null;
    if (pag) {
      if (Array.isArray(pag?.data)) return pag.data as OrderWithDetailsDto[];
      if (Array.isArray(pag)) return pag as OrderWithDetailsDto[];
    }

    // fallback: if res is array directly
    if (Array.isArray(res)) return res as OrderWithDetailsDto[];

    return [];
  };

  const load = async (p = 1) => {
    if (!vendorId) {
      setItems([]);
      setTotalRecords(0);
      setHasNextPage(false);
      setHasPreviousPage(false);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const url = `/api/order/by-customer?vendorId=${encodeURIComponent(
        vendorId
      )}&queueType=${queueType}&pageNumber=${p}&pageSize=${pageSize}`;

      console.debug("[QueueTab] requesting", { url, headers });
      const res = await api.get(url, headers);

      // parse items robustly
      const arr = parseResponse(res);
      console.debug("[QueueTab] parsed items count", arr.length);

      // If the helper returned empty, try direct unwrapOrders as last resort
      const orders =
        arr.length > 0 ? arr : unwrapOrders<OrderWithDetailsDto>(res) ?? [];

      // Try to extract pagination meta if present
      const outer = (res as any)?.data ?? res;
      const pag = outer?.data ?? outer ?? null;

      const total =
        Number(pag?.totalRecords ?? pag?.total ?? 0) || orders.length;
      const pageFromResp = Number(pag?.page ?? p) || p;
      const pageSzFromResp = Number(pag?.pageSize ?? pageSize) || pageSize;
      const hasNext = Boolean(
        pag?.hasNextPage ?? orders.length === pageSzFromResp
      );
      const hasPrev = Boolean(pag?.hasPreviousPage ?? pageFromResp > 1);

      setItems(orders);
      setTotalRecords(total);
      setHasNextPage(hasNext);
      setHasPreviousPage(hasPrev);
      setPage(pageFromResp);
    } catch (err: any) {
      console.error("[QueueTab] load error", err);
      toast.error("Không tải được hàng đợi. Kiểm tra console.");
    } finally {
      setLoading(false);
    }
  };

  // reset page when vendor/queueType changes
  useEffect(() => {
    setPage(1);
  }, [vendorId, queueType]);

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId, queueType, page]);

  // ---- Format helpers ----
  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(
      d.getSeconds()
    )} ${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  };

  const mapPaymentStatus = (ps: number | null | undefined) => {
    switch (ps) {
      case 0:
        return { text: "Chưa thanh toán", color: "bg-rose-500 text-white" };
      case 1:
        return { text: "Đang xử lý", color: "bg-amber-500 text-white" };
      case 2:
        return { text: "Đã thanh toán", color: "bg-blue-600 text-white" };
      case 3:
        return {
          text: "Thanh toán thất bại",
          color: "bg-slate-600 text-white",
        };
      case 4:
        return { text: "Đã hoàn tiền", color: "bg-indigo-500 text-white" };
      default:
        return { text: "Không rõ", color: "bg-gray-400 text-white" };
    }
  };

  const mapOrderStatus = (s?: number | null) => {
    switch (s) {
      case 0:
      case 1:
        return "Chờ xác nhận";
      case 4:
        return "Chuẩn bị chế biến";
      case 5:
        return "Sẵn sàng";
      case 6:
        return "Hoàn tất";
      case 3:
        return "Đã hủy";
      default:
        return "Không rõ";
    }
  };

  const filtered = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((i) => String(i.status) === statusFilter);
  }, [items, statusFilter]);

  // pagination controls
  const onPrev = () => {
    if (page > 1) setPage((p) => Math.max(1, p - 1));
  };
  const onNext = () => {
    if (hasNextPage) setPage((p) => p + 1);
  };

  const startRecord = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord =
    totalRecords === 0 ? 0 : Math.min(page * pageSize, totalRecords);

  return (
    <div>
      {/* FILTER + RELOAD */}
      <div className="flex items-center gap-2 justify-end mb-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="0">Chờ xác nhận</SelectItem>
            <SelectItem value="4">Chuẩn bị chế biến</SelectItem>
            <SelectItem value="5">Sẵn sàng</SelectItem>
            <SelectItem value="6">Hoàn tất</SelectItem>
            <SelectItem value="3">Đã hủy</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={() => load(1)}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có đơn nào.</p>
        ) : (
          filtered.map((it) => {
            const payment = mapPaymentStatus(it.paymentStatus ?? null);
            const statusText = mapOrderStatus(it.status ?? null);
            const estServe = it.queueEntry?.estimatedServeTime
              ? formatDate(it.queueEntry.estimatedServeTime)
              : "—";

            return (
              <div
                key={it.id}
                className="border border-border rounded-lg p-4 relative hover:bg-muted/30 transition cursor-pointer"
              >
                <div
                  className={`absolute top-0 right-0 px-3 py-1 rounded-bl-md text-xs font-semibold ${payment.color}`}
                >
                  {payment.text}
                </div>

                <div className="flex items-center justify-between">
                  {/* LEFT */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                      #{it.queueEntry?.position ?? "-"}
                    </div>

                    <div>
                      <p className="font-semibold text-lg">
                        {it.customerName} - {it.customerPhone}
                      </p>

                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <span className="font-semibold">Đặt vào:</span>
                        <span>{formatDate(it.createdAt)}</span>

                        <span className="mx-2 text-muted-foreground">•</span>

                        <span className="font-semibold">ETA:</span>
                        <span>{estServe}</span>
                      </p>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {it.details.map((d) => (
                          <span
                            key={d.id}
                            className="text-xs bg-muted px-2 py-1 rounded"
                          >
                            {d.quantity} x {d.menuItemName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div>
                    <Button className="px-6">{statusText}</Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PAGINATION FOOTER */}
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
    </div>
  );
}
