// src/components/vendor/VendorReportModal.tsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { toast } from "sonner";
import { api, ApiResponse } from "@/lib/api";

/**
 * VendorReportModal
 * - Shows hourly overview (bar / pie) with peak-hour highlighting
 * - Shows per-item ETA analysis (vendor ETA vs actual average vs suggested)
 * - Buttons to apply suggestions (per item and whole shop)
 * - Clean, colorful, large UI suitable for street food owners
 */

/* ----------------------- Types ----------------------- */
type TopItem = {
  id: string;
  name: string;
  vendorPrepTime: number; // vendor-entered ETA
  ordersForItem: number;
  avgActualPrep: number; // from data
  suggestedPrepTime: number; // suggestion per hour / aggregated
  lateCount: number;
  lateRate: number;
};

type HourBucket = {
  hour: number;
  ordersCount: number;
  lateCount: number;
  avgPrepMinutes: number; // avg actual prep (for all items)
  avgWaitMinutes: number;
  topItems: TopItem[];
  preorderSuggested?: boolean;
  suggestionText?: string;
};

/* -------------------- Helpers / Mock ------------------ */
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMockHour(hour: number): HourBucket {
  let orders = randomInt(5, 35);
  if (hour >= 11 && hour <= 13) orders = randomInt(120, 260);
  if (hour >= 18 && hour <= 20) orders = randomInt(60, 160);
  const avgPrep = Math.max(5, Math.round((orders / 30) * 6) + randomInt(6, 16));
  const avgWait = Math.max(5, Math.round((orders / 20) * 8) + randomInt(3, 22));
  const lateCount = Math.round((orders * (randomInt(5, 35) / 100)));
  const topItems: TopItem[] = [
    {
      id: `itm-pho-${hour}`,
      name: "Phở Bò",
      vendorPrepTime: 10,
      ordersForItem: Math.round(orders * 0.45),
      avgActualPrep: Math.max(6, Math.round(avgPrep * 0.95)),
      suggestedPrepTime: Math.max(8, Math.round(avgPrep)),
      lateCount: Math.round(lateCount * 0.6),
      lateRate: Math.round((Math.round(lateCount * 0.6) / Math.max(1, Math.round(orders * 0.45))) * 100),
    },
    {
      id: `itm-bun-${hour}`,
      name: "Bún Riêu",
      vendorPrepTime: 9,
      ordersForItem: Math.round(orders * 0.2),
      avgActualPrep: Math.max(6, Math.round(avgPrep * 0.9)),
      suggestedPrepTime: Math.max(7, Math.round(avgPrep - 1)),
      lateCount: Math.round(lateCount * 0.25),
      lateRate: Math.round((Math.round(lateCount * 0.25) / Math.max(1, Math.round(orders * 0.2))) * 100),
    },
    {
      id: `itm-goi-${hour}`,
      name: "Gỏi Cuốn",
      vendorPrepTime: 6,
      ordersForItem: Math.round(orders * 0.08),
      avgActualPrep: Math.max(3, Math.round(avgPrep * 0.6)),
      suggestedPrepTime: Math.max(4, Math.round(avgPrep * 0.6)),
      lateCount: Math.round(lateCount * 0.15),
      lateRate: Math.round((Math.round(lateCount * 0.15) / Math.max(1, Math.round(orders * 0.08))) * 100),
    },
  ];
  const suggestionText = orders > 70 ? `Gợi ý bật PRE-ORDER ${hour}:00–${hour + 1}:00` : "";
  return {
    hour,
    ordersCount: orders,
    lateCount,
    avgPrepMinutes: avgPrep,
    avgWaitMinutes: avgWait,
    topItems,
    preorderSuggested: orders > 90,
    suggestionText,
  };
}

function generateMockData(): HourBucket[] {
  const arr: HourBucket[] = [];
  for (let h = 0; h < 24; h++) {
    arr.push(generateMockHour(h));
  }
  return arr;
}

/* ----------------------- Component ----------------------- */
export default function VendorReportModal({ open, onOpenChange, vendorId }: { open: boolean; onOpenChange: (v: boolean) => void; vendorId: string; }) {
  const [data, setData] = useState<HourBucket[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(new Date().getHours());
  const [showPie, setShowPie] = useState(false);
  const [applyAllLoading, setApplyAllLoading] = useState(false);
  const [applyItemLoadingId, setApplyItemLoadingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        // Try to fetch real aggregated hourly data
        const token = localStorage.getItem("accessToken") || "";
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const res = await api.get<ApiResponse<any>>(`/api/reports/vendor/${vendorId}/hourly`, headers).catch(() => null);
        const payload = (res?.data as any) ?? res;

        if (mounted && payload && Array.isArray(payload?.data || payload)) {
          // Map expected shape to HourBucket, but be defensive
          const rows: HourBucket[] = (payload?.data || payload).map((r: any) => ({
            hour: Number(r.hour) ?? 0,
            ordersCount: Number(r.orders) ?? 0,
            lateCount: Number(r.lateCount) ?? 0,
            avgPrepMinutes: Number(r.avgPrep) ?? 0,
            avgWaitMinutes: Number(r.avgWait) ?? 0,
            topItems: Array.isArray(r.topItems) ? r.topItems.map((it: any) => ({
              id: it.id,
              name: it.name,
              vendorPrepTime: Number(it.vendorPrepTime) ?? 0,
              ordersForItem: Number(it.ordersForItem) ?? 0,
              avgActualPrep: Number(it.avgActualPrep) ?? 0,
              suggestedPrepTime: Number(it.suggestedPrepTime) ?? 0,
              lateCount: Number(it.lateCount) ?? 0,
              lateRate: Number(it.lateRate) ?? 0,
            })) : [],
            preorderSuggested: !!r.preorderSuggested,
            suggestionText: r.suggestionText ?? "",
          }));
          setData(rows);
        } else {
          // fallback: mock data
          setData(generateMockData());
        }
      } catch (e) {
        console.error(e);
        setData(generateMockData());
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (open) load();
    return () => { mounted = false; };
  }, [open, vendorId]);

  const totals = useMemo(() => {
    if (!data) return { totalOrders: 0, totalLate: 0 };
    return data.reduce((acc, h) => ({ totalOrders: acc.totalOrders + h.ordersCount, totalLate: acc.totalLate + h.lateCount }), { totalOrders: 0, totalLate: 0 });
  }, [data]);

  // Chart data for bar / pie
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((d) => ({
      hourLabel: `${d.hour}:00`,
      hour: d.hour,
      orders: d.ordersCount,
      late: d.lateCount,
      peak: d.ordersCount >= 70 || d.lateCount >= Math.max(5, Math.round(d.ordersCount * 0.2)),
    }));
  }, [data]);

  const pieData = useMemo(() => {
    if (!data) return [];
    return data.map((d) => ({ name: `${d.hour}:00`, value: d.ordersCount, late: d.lateCount }));
  }, [data]);

  const selected = (selectedHour != null && data) ? data.find((h) => h.hour === selectedHour) ?? null : null;

  // peak hour by orders (with lateCount tie-break)
  const peakHour = useMemo(() => {
    if (!data) return null;
    return data.slice().sort((a, b) => {
      if (a.ordersCount !== b.ordersCount) return b.ordersCount - a.ordersCount;
      return b.lateCount - a.lateCount;
    })[0] ?? null;
  }, [data]);

  const applySuggestedForItem = async (item: TopItem) => {
    setApplyItemLoadingId(item.id);
    try {
      // call API to update item prep time per shop (if available)
      const token = localStorage.getItem("accessToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      // Example endpoint — adjust to your backend contract
      await api.put<ApiResponse<any>>(`/api/menuitem/${item.id}/prep`, { prepTime: item.suggestedPrepTime }, headers).catch(() => null);

      toast.success(`Áp dụng gợi ý ${item.suggestedPrepTime} phút cho ${item.name}`);
    } catch (e) {
      console.error(e);
      toast.error("Áp dụng thất bại");
    } finally {
      setApplyItemLoadingId(null);
    }
  };

  const applySuggestedForShop = async () => {
    if (!data) return;
    setApplyAllLoading(true);
    try {
      const token = localStorage.getItem("accessToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      // compute overall suggested prep time as weighted average of suggestedPrepTime * ordersForItem across all top items
      let sumSuggested = 0;
      let sumOrdersForWeights = 0;
      for (const h of data) {
        for (const it of h.topItems) {
          sumSuggested += (it.suggestedPrepTime || it.vendorPrepTime) * (it.ordersForItem || 0);
          sumOrdersForWeights += it.ordersForItem || 0;
        }
      }
      const shopSuggested = sumOrdersForWeights ? Math.max(1, Math.round(sumSuggested / sumOrdersForWeights)) : 8;

      // Example endpoint - adjust to your backend: update vendor default prepTime or apply to many items
      await api.put<ApiResponse<any>>(`/api/vendor/${vendorId}/suggested-prep`, { suggestedPrepMinutes: shopSuggested }, headers).catch(() => null);

      toast.success(`Đã áp dụng ETA trung bình mới cho quán: ${shopSuggested} phút`);
    } catch (e) {
      console.error(e);
      toast.error("Không thể áp dụng cho quán");
    } finally {
      setApplyAllLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* DialogContent contains a flex column limited in height.
          Header and Footer remain visible; inner content scrolls when tall. */}
      <DialogContent className="max-w-7xl w-full">
        <div className="flex flex-col max-h-[80vh]">
          <div>
            <DialogHeader className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-lg font-semibold">Báo cáo hiệu suất theo khung giờ — Quán {vendorId}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Xem khung giờ cao điểm, số đơn trễ và gợi ý ETA cho từng món / cho quán.</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-muted-foreground" aria-label="Đóng"><X /></Button>
              </div>
            </DialogHeader>
          </div>

          {/* MAIN SCROLLABLE AREA */}
          <div
            className="px-4 py-3 overflow-auto"
            style={{ maxHeight: "calc(80vh - 140px)" }} // reserve space for header + footer (approx)
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left: Charts */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="bg-gradient-to-br from-white to-slate-50 shadow-sm">
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Label className="text-base font-medium">Khung giờ cao điểm (theo số đơn)</Label>
                        <div className="text-xs text-muted-foreground">Xem tổng số đơn & số đơn trễ mỗi giờ. Nhấn vào cột để chọn giờ.</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">Tổng đơn: <strong>{totals.totalOrders}</strong></div>
                        <div className="text-sm text-muted-foreground">• Trễ: <strong className="text-red-600">{totals.totalLate}</strong></div>
                        <div>
                          <Button size="sm" variant="outline" onClick={() => setShowPie((s) => !s)}>{showPie ? "Xem cột" : "Xem pie"}</Button>
                        </div>
                      </div>
                    </div>

                    <div style={{ height: 300 }} className="rounded-md overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        {showPie ? (
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              label={(entry: any) => entry.name}
                              outerRadius={100}
                              innerRadius={45}
                            >
                              {pieData.map((entry: any, idx: number) => {
                                // color scale by value
                                const peak = entry.value >= 80;
                                const color = peak ? "#f97316" : "#2563eb";
                                return <Cell key={`pie-${idx}`} fill={color} />;
                              })}
                            </Pie>
                            <Tooltip formatter={(v: any) => [`${v} đơn`]} />
                          </PieChart>
                        ) : (
                          <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hourLabel" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip formatter={(val: any, name: any) => {
                              if (name === "orders") return [`${val} đơn`, "Số đơn"];
                              if (name === "late") return [`${val} trễ`, "Số đơn trễ"];
                              return [val, name];
                            }} />
                            <Legend />
                            <Bar
                              dataKey="orders"
                              name="Số đơn"
                              onClick={(entry: any) => setSelectedHour(entry.hour)}
                            >
                              {chartData.map((entry: any, idx: number) => (
                                <Cell key={`cell-${idx}`} fill={entry.peak ? "#f97316" : "#2563eb"} className="transition-transform hover:scale-105" />
                              ))}
                            </Bar>
                            <Bar dataKey="late" name="Số đơn trễ" fill="#ef4444" />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Items grid: aggregated suggestion per item (using selectedHour if present else overall) */}
                <Card className="bg-gradient-to-br from-white to-slate-50 shadow-sm">
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Label className="text-base font-medium">Gợi ý ETA theo món</Label>
                        <div className="text-xs text-muted-foreground">Hệ thống sẽ dùng thời gian thực tế (từ dữ liệu) để gợi ý ETA cho từng món theo khung giờ.</div>
                      </div>

                      <div className="text-sm text-muted-foreground">Chọn giờ: <strong>{selectedHour != null ? `${selectedHour}:00` : "-"}</strong></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* For each top item in selected hour (fallback to aggregated top items across hours) */}
                      { (selected?.topItems && selected.topItems.length > 0 ? selected.topItems : (data ? data.flatMap(d => d.topItems).slice(0,6) : []) ).map((it) => (
                        <div key={it.id} className="rounded-lg border p-3 bg-white shadow-sm hover:shadow-md transition-transform hover:-translate-y-0.5">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-lg">{it.name}</div>
                            <div className="text-xs text-muted-foreground">{it.ordersForItem} đơn</div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                            <div className="p-2 rounded-md bg-emerald-50 text-center">
                              <div className="text-xs text-muted-foreground">ETA shop</div>
                              <div className="font-semibold">{it.vendorPrepTime} phút</div>
                            </div>

                            <div className="p-2 rounded-md bg-slate-50 text-center">
                              <div className="text-xs text-muted-foreground">Thực tế TB</div>
                              <div className="font-semibold">{it.avgActualPrep} phút</div>
                            </div>

                            <div className={`p-2 rounded-md text-center ${it.avgActualPrep > it.vendorPrepTime ? "bg-rose-50" : "bg-emerald-50"}`}>
                              <div className="text-xs text-muted-foreground">Gợi ý</div>
                              <div className="font-semibold">{it.suggestedPrepTime} phút</div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">Trễ: <span className="text-red-600 font-semibold">{it.lateCount}</span> • {it.lateRate}%</div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" className="bg-emerald-600 text-white hover:bg-[#00A551]" onClick={() => applySuggestedForItem(it)} disabled={applyItemLoadingId === it.id}>
                                {applyItemLoadingId === it.id ? "Đang..." : "Áp dụng gợi ý"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )) }
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right column: selected hour summary + actions */}
              <div className="space-y-4">
                <Card className="bg-gradient-to-br from-white to-slate-50 shadow-sm">
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground">Khung giờ đang chọn</div>
                        <div className="text-xl font-semibold">{selected ? `${selected.hour}:00 — ${selected.hour + 1}:00` : "—"}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Gợi ý</div>
                        <div className="text-sm text-amber-600 font-semibold">{selected?.suggestionText || "Không có"}</div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm space-y-2">
                      <div><strong>Số đơn:</strong> {selected?.ordersCount ?? "-"}</div>
                      <div><strong>Số đơn trễ:</strong> <span className="text-red-600 font-semibold">{selected?.lateCount ?? "-"}</span></div>
                      <div><strong>Thời gian nấu TB:</strong> {selected?.avgPrepMinutes ?? "-"} phút</div>
                      <div><strong>Thời gian chờ TB:</strong> {selected?.avgWaitMinutes ?? "-"} phút</div>
                    </div>

                    <div className="mt-4">
                      <Button size="lg" className="w-full bg-emerald-600 text-white hover:bg-[#00A551]" onClick={applySuggestedForShop} disabled={applyAllLoading}>
                        {applyAllLoading ? "Đang áp dụng..." : "Áp dụng ETA trung bình cho quán"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-white to-slate-50 shadow-sm">
                  <CardContent>
                    <div className="text-sm font-medium mb-2">Hành động nhanh</div>
                    <div className="flex flex-col gap-2">
                      <Button onClick={() => {
                        // export minimal CSV from current data (client-side)
                        const rows: string[] = ["hour,orders,late,avgPrep,avgWait"];
                        (data || []).forEach(h => rows.push(`${h.hour},${h.ordersCount},${h.lateCount},${h.avgPrepMinutes},${h.avgWaitMinutes}`));
                        const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `vendor-${vendorId}-hourly.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}>Xuất CSV</Button>

                      <Button variant="outline" onClick={() => { toast.success("Đã gửi gợi ý tới app quán (mô phỏng)"); }}>Gửi gợi ý đến app quán</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Footer stays visible under scrollable content */}
          <div className="border-t">
            <DialogFooter className="flex items-center justify-end gap-2 py-3 px-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
              <Button onClick={() => { toast.success("Áp dụng mô phỏng — đã gửi cấu hình"); onOpenChange(false); }} className="bg-emerald-600 text-white hover:bg-[#00A551]">Áp dụng</Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}