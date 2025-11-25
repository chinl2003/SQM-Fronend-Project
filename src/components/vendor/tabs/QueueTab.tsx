// src/components/vendor/tabs/QueueTab.tsx
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { unwrapOrders, mapOrderToQueueUi } from "../utils";
import { OrderWithDetailsDto } from "../utils";
import { useMemo } from "react";

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

function QueueList({ vendorId, queueType }: { vendorId?: string; queueType: 1 | 2 }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = async () => {
    if (!vendorId) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const res = await api.get(
        `/api/order/by-customer?vendorId=${encodeURIComponent(vendorId)}&queueType=${queueType}`,
        headers
      );
      const orders = unwrapOrders<OrderWithDetailsDto>(res);
      const mapped = orders.map(mapOrderToQueueUi);
      setItems(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId, queueType]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((it) => it.status === statusFilter);
  }, [items, statusFilter]);

  return (
    <div>
      <div className="flex items-center gap-2 justify-end mb-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="pending">Chờ xác nhận</SelectItem>
            <SelectItem value="preparing">Chuẩn bị chế biến</SelectItem>
            <SelectItem value="ready">Sẵn sàng</SelectItem>
            <SelectItem value="completed">Hoàn tất</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">Chưa có đơn nào.</div>
        ) : (
          filtered.map((it) => (
            <div
              key={it.id}
              className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    #{it.position ?? "-"}
                  </div>
                  <div>
                    <p className="font-medium">{it.customer}</p>
                    <p className="text-sm text-muted-foreground">
                      {it.time} • {it.type === "pre-order" ? "Pre-order" : "Walk-in"}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {it.items.map((f: string, idx: number) => (
                        <span key={idx} className="text-xs bg-muted px-2 py-1 rounded">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">{it.status}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
