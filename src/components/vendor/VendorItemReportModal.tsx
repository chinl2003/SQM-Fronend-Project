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
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import { toast } from "sonner";
import { api, ApiResponse } from "@/lib/api";

/**
 * VendorItemReportModal — simplified and clearer per user's latest request
 * - removed timeline line chart (keeps only bar chart)
 * - bar colors: blue for normal hours, orange for peak hours
 * - bar also shows "late" counts as red bars
 * - grouped detail shows: ETA trung bình, Tỉ lệ trễ (màu đỏ) và Số lần trễ (màu đỏ)
 * - per-sample row shows single-line time range like 10:30:46-10:40:46
 * - hover style enhancements for modal, group cards and sample cards
 */

type OrderSample = {
  id: string;
  placedAt: string; // ISO
  completedAt?: string; // ISO
  completionMinutes: number;
};

type HourRow = {
  hourFrom: number;
  hourTo: number;
  orders: number;
  avgCompletionMinutes: number;
  configuredMinutes?: number;
  suggestedEtaMinutes: number;
  lateRatePercent: number;
  recommendPreorder: boolean;
  preorderSuggestion?: { slotMinutes: number; slotsCount: number; capacityPerSlot: number };
  samples?: OrderSample[];
};

type VendorItemHourlyRowApi = {
  hour: number;
  orders: number;
  avgCompletionMinutes: number;
  configuredMinutes?: number;
  lateRatePercent: number;
  recommendPreorder: boolean;
  preorderSuggestion?: { slotMinutes: number; slotsCount: number; capacityPerSlot: number };
  samples?: Array<{ id: string; placedAt: string; completedAt?: string; completionMinutes: number }>;
};

type VendorItemHourlyResponse = ApiResponse<VendorItemHourlyRowApi[]> | VendorItemHourlyRowApi[];
type VendorItemOrdersResponse = ApiResponse<OrderSample[]> | OrderSample[];
type VendorItemPreorderStateResponse = ApiResponse<{ enabled: boolean }> | { enabled: boolean };

type VendorItemReportApi = {
  hourly: VendorItemHourlyRowApi[];
  orders?: OrderSample[];
  preorderEnabled?: boolean;
};

type VendorItemReportResponse = ApiResponse<VendorItemReportApi> | VendorItemReportApi;

function seedFromString(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function rndFromSeed(seed: number) {
  let x = seed || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
}

function generateMockSamplesForHour(menuItemId: string, hour: number, count: number, baseConfigured = 8) {
  const seed = seedFromString(menuItemId + ":" + hour);
  const r = rndFromSeed(seed);
  const arr: OrderSample[] = [];
  for (let i = 0; i < count; i++) {
    const jitter = Math.round((r() - 0.5) * 6);
    const base = baseConfigured + (hour >= 11 && hour <= 13 ? 2 : 0);
    const value = Math.max(2, base + jitter + Math.round(r() * 4));
    const placed = new Date();
    placed.setHours(hour, Math.floor(r() * 60), Math.floor(r() * 60));
    const completed = new Date(placed.getTime() + value * 60 * 1000);
    arr.push({ id: `${hour}-${i}`, placedAt: placed.toISOString(), completedAt: completed.toISOString(), completionMinutes: value });
  }
  return arr;
}

function generateMockPerItemDataWithSamples(menuItemId: string, baseConfigured = 8): HourRow[] {
  const rows: HourRow[] = [];
  for (let h = 0; h < 24; h++) {
    let orders = Math.floor(((seedFromString(menuItemId + "-d") + h) % 8));
    if (h >= 11 && h <= 13) orders = Math.floor(Math.random() * 80) + 20;
    if (h >= 18 && h <= 20) orders = Math.floor(Math.random() * 60) + 10;
    const samples = generateMockSamplesForHour(menuItemId, h, Math.max(1, Math.min(orders, 40)), baseConfigured);
    const avg = Math.round((samples.reduce((a, b) => a + b.completionMinutes, 0) / samples.length) * 10) / 10;
    const configured = baseConfigured;
    const lateCount = samples.filter((s) => s.completionMinutes > configured + 2).length;
    const lateRate = orders === 0 ? 0 : Math.round((lateCount / Math.max(1, orders)) * 100);
    const suggestedEta = Math.max(configured, Math.round(avg + 1));
    const recommendPreorder = orders >= 50 || lateRate >= 25;
    const capacityPerSlot = orders > 120 ? 6 : orders > 90 ? 5 : orders > 60 ? 4 : 3;
    const slotsCount = recommendPreorder ? Math.max(1, Math.ceil(orders / capacityPerSlot)) : 0;

    rows.push({
      hourFrom: h,
      hourTo: h + 1,
      orders,
      avgCompletionMinutes: avg,
      configuredMinutes: configured,
      suggestedEtaMinutes: suggestedEta,
      lateRatePercent: lateRate,
      recommendPreorder,
      preorderSuggestion: recommendPreorder ? { slotMinutes: 10, slotsCount, capacityPerSlot } : undefined,
      samples,
    });
  }
  return rows;
}

function formatTimeRange(isoStart?: string, isoEnd?: string) {
  if (!isoStart) return "—";
  try {
    const s = new Date(isoStart);
    const e = isoEnd ? new Date(isoEnd) : null;
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${pad(s.getHours())}:${pad(s.getMinutes())}:${pad(s.getSeconds())}`;
    const te = e ? `${pad(e.getHours())}:${pad(e.getMinutes())}:${pad(e.getSeconds())}` : "—";
    return `${ts}-${te}`;
  } catch {
    return "—";
  }
}

export default function VendorItemReportModal({
  open,
  onOpenChange,
  vendorId,
  menuItemId,
  menuItemName,
  currentPrepMinutes,
  onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vendorId: string;
  menuItemId: string;
  menuItemName: string;
  currentPrepMinutes: number;
  onApply: (menuItemId: string, newPrepMinutes: number) => Promise<void> | void;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HourRow[] | null>(null);
  const [allSamples, setAllSamples] = useState<OrderSample[] | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [preorderLoading, setPreorderLoading] = useState(false);
  const [preorderEnabledForCurrent, setPreorderEnabledForCurrent] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      if (!menuItemId) return;
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken") || "";
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const res = await api
          .get<VendorItemReportResponse>(`/api/vendors/${vendorId}/menuitems/${menuItemId}/report`, headers)
          .catch(() => null);
        const payload = (res as ApiResponse<VendorItemReportApi>)?.data ?? (res as VendorItemReportApi | null);

        if (payload && payload.hourly && Array.isArray(payload.hourly)) {
          const rows: HourRow[] = payload.hourly.map((r) => ({
            hourFrom: Number(r.hour) || 0,
            hourTo: (Number(r.hour) || 0) + 1,
            orders: Number(r.orders) || 0,
            avgCompletionMinutes: Number(r.avgCompletionMinutes) || 0,
            configuredMinutes: Number(r.configuredMinutes) || currentPrepMinutes || undefined,
            suggestedEtaMinutes: Math.max(Number(r.configuredMinutes) || currentPrepMinutes || 0, Math.round((Number(r.avgCompletionMinutes) || 0) + 1)),
            lateRatePercent: Number(r.lateRatePercent) || 0,
            recommendPreorder: !!r.recommendPreorder,
            preorderSuggestion: r.preorderSuggestion,
            samples: Array.isArray(r.samples) ? r.samples.map((s) => ({ id: s.id, placedAt: s.placedAt, completedAt: s.completedAt, completionMinutes: Number(s.completionMinutes) })) : undefined,
          }));

          if (mounted) {
            setData(rows);
            const ordersPayload = payload.orders;
            if (ordersPayload && Array.isArray(ordersPayload)) {
              setAllSamples(ordersPayload.map((o) => ({ id: o.id, placedAt: o.placedAt, completedAt: o.completedAt, completionMinutes: Number(o.completionMinutes) })));
            } else {
              setAllSamples(rows.flatMap((r) => r.samples ?? []).sort((a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()));
            }
            if (typeof payload.preorderEnabled === "boolean") {
              setPreorderEnabledForCurrent(payload.preorderEnabled);
            }
          }
        } else {
          if (mounted) {
            const mock = generateMockPerItemDataWithSamples(menuItemId, currentPrepMinutes || 8);
            setData(mock);
            setAllSamples(mock.flatMap((r) => r.samples ?? []).sort((a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()));
          }
        }
      } catch (e) {
        console.error(e);
        if (mounted) {
          const mock = generateMockPerItemDataWithSamples(menuItemId, currentPrepMinutes || 8);
          setData(mock);
          setAllSamples(mock.flatMap((r) => r.samples ?? []).sort((a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => {
      mounted = false;
    };
  }, [menuItemId, vendorId]);

  const chartData = useMemo(() => {
    if (!data) return [] as any[];
    return data.map((d) => ({
      hour: `${d.hourFrom}:00`,
      orders: d.orders,
      avg: d.avgCompletionMinutes,
      suggest: d.suggestedEtaMinutes,
      peak: d.orders >= 50 || d.lateRatePercent >= 25,
      late: Math.round((d.orders || 0) * ((d.lateRatePercent || 0) / 100)),
    }));
  }, [data]);

  const nowHour = new Date().getHours();
  const suggestedNow = data ? data.find((d) => d.hourFrom === nowHour) : undefined;

  // determine overall peak hour (by number of orders, tie-breaker = lateRate)
  const peakHour = useMemo(() => {
    if (!data) return null;
    let best = data[0];
    for (const d of data) {
      if (d.orders > best.orders || (d.orders === best.orders && d.lateRatePercent > best.lateRatePercent)) best = d;
    }
    return best;
  }, [data]);

  const peakReason = useMemo(() => {
    if (!peakHour) return "Không có dữ liệu";
    const reasons: string[] = [];
    if (peakHour.orders >= 50) reasons.push(`Nhiều đơn (${peakHour.orders} đơn)`);
    if (peakHour.lateRatePercent >= 25) reasons.push(`Tỉ lệ trễ cao (${peakHour.lateRatePercent}%)`);
    if (reasons.length === 0) reasons.push(`Số đơn: ${peakHour.orders}, TB: ${peakHour.avgCompletionMinutes} phút`);
    return reasons.join(" • ");
  }, [peakHour]);

  const applyForCurrentHour = async () => {
    if (!suggestedNow) return toast.error("Không có gợi ý cho giờ hiện tại");
    setApplyLoading(true);
    try {
      await onApply(menuItemId, suggestedNow.suggestedEtaMinutes);
      const token = localStorage.getItem("accessToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      await api.put(`/api/menuitem/${menuItemId}/eta`, { hourFrom: suggestedNow.hourFrom, prepTime: suggestedNow.suggestedEtaMinutes }, headers).catch(() => null);
      toast.success(`Đã áp dụng ETA ${suggestedNow.suggestedEtaMinutes} phút cho giờ ${suggestedNow.hourFrom}:00`);
    } catch (e) {
      console.error(e);
      toast.error("Áp dụng thất bại.");
    } finally {
      setApplyLoading(false);
    }
  };

  const togglePreorderForCurrent = async () => {
    if (!menuItemId) return;
    setPreorderLoading(true);
    try {
      const token = localStorage.getItem("accessToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const enable = !(preorderEnabledForCurrent ?? false);
      await api.post(`/api/menuitem/${menuItemId}/preorder`, { hourFrom: nowHour, enable }, headers).catch(() => null);
      setPreorderEnabledForCurrent(enable);
      toast.success(`${enable ? "Bật" : "Tắt"} pre-order cho ${nowHour}:00`);
    } catch (e) {
      console.error(e);
      toast.error("Không thể thay đổi trạng thái pre-order.");
    } finally {
      setPreorderLoading(false);
    }
  };

  const groupedByHour = useMemo(() => {
    const map = new Map<number, OrderSample[]>();
    (allSamples || []).forEach((s) => {
      const h = new Date(s.placedAt).getHours();
      if (!map.has(h)) map.set(h, []);
      map.get(h)!.push(s);
    });

    const arr: { hour: number; samples: OrderSample[]; isPeak: boolean; avgMinutes: number; lateCount: number; lateRate: number }[] = [];
    (data || []).forEach((d) => {
      const samples = (map.get(d.hourFrom) || []).sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
      const lateCount = Math.round((d.orders || 0) * ((d.lateRatePercent || 0) / 100));
      arr.push({
        hour: d.hourFrom,
        samples,
        isPeak: d.orders >= 50 || d.lateRatePercent >= 25,
        avgMinutes: d.avgCompletionMinutes || 0,
        lateCount,
        lateRate: d.lateRatePercent || 0,
      });
    });
    return arr;
  }, [allSamples, data]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden transform transition-all duration-200">
        {/* modal content start */}
        <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
          <div className="border-b px-5 py-4 bg-card rounded-t-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold">Báo cáo món — {menuItemName || menuItemId}</div>
              </div>

              <div>
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Đóng">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </Button>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 max-h-[72vh] overflow-auto">
            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-md border p-3 bg-gradient-to-br from-white to-slate-50 shadow-sm hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-base font-medium">Biểu đồ giờ — Số lượt đặt & số đơn trễ</div>
                  </div>
                  <div className="text-sm text-muted-foreground">Tổng khung: {(data || []).length}</div>
                </div>

                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />

                      <Bar dataKey="orders" name="Số lượt" >
                        {chartData.map((entry: any, idx: number) => (
                          <Cell key={`cell-${idx}`} fill={entry.peak ? '#f97316' : '#2563eb'} />
                        ))}
                      </Bar>

                      <Bar dataKey="late" name="Số đơn trễ" fill="#ef4444" />

                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-md border p-3 bg-gradient-to-br from-white to-slate-50 shadow-sm hover:shadow-lg transition-shadow duration-200">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-base font-medium">Hành động & tóm tắt</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={applyForCurrentHour} disabled={!suggestedNow || applyLoading}>{applyLoading ? 'Đang...' : 'Áp dụng ETA (hiện tại)'}</Button>
                    <Button size="sm" className={`bg-emerald-600 text-white hover:bg-emerald-700 ${preorderEnabledForCurrent ? 'opacity-90' : ''}`} onClick={togglePreorderForCurrent} disabled={preorderLoading}>{preorderLoading ? 'Đang...' : preorderEnabledForCurrent ? 'Tắt Pre-order' : 'Bật Pre-order'}</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-md border bg-gradient-to-br from-emerald-50 to-white shadow-sm">
                    <div className="text-sm text-muted-foreground">ETA hiện tại</div>
                    <div className="text-2xl font-semibold">{currentPrepMinutes} phút</div>
                  </div>

                  <div className="p-3 rounded-md border bg-gradient-to-br from-emerald-50 to-white shadow-sm">
                    <div className="text-sm text-muted-foreground">Gợi ý giờ hiện tại</div>
                    <div className="text-2xl font-semibold">{suggestedNow ? `${suggestedNow.suggestedEtaMinutes} phút` : '—'}</div>
                    {suggestedNow && (
                      <div className="text-xs text-muted-foreground">Trung bình: {suggestedNow.avgCompletionMinutes} phút • Đơn: {suggestedNow.orders}</div>
                    )}
                  </div>

                  <div className="p-3 rounded-md border bg-gradient-to-br from-emerald-50 to-white shadow-sm">
                    <div className="text-sm text-muted-foreground">Khung giờ cao điểm nhất</div>
                    {peakHour ? (
                      <>
                        <div className="text-2xl font-semibold">{peakHour.hourFrom}:00 — {peakHour.hourTo}:00</div>
                        <div className="text-xs text-muted-foreground">Lý do: {peakReason}</div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">Không đủ dữ liệu</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-md border p-3 bg-gradient-to-br from-white to-slate-50 shadow-sm hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5">
                <div className="text-sm font-medium mb-2">Lịch sử món ăn</div>

                <div className="space-y-3">
                  {groupedByHour.map((g) => (
                    <div key={g.hour} className={`${g.isPeak ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-border'} rounded-md border p-3 transition-all duration-150 hover:shadow-lg`}> 
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-base">{g.hour}:00 — {g.hour + 1}:00</div>
                        <div className="text-sm text-muted-foreground">{g.samples.length} đơn • ETA TB: <span className="font-semibold">{g.avgMinutes} phút</span></div>
                      </div>

                      <div className="flex items-center gap-4 mb-3">
                        <div className="text-sm font-medium">Tỉ lệ trễ:</div>
                        <div className="text-sm font-semibold text-rose-600">{g.lateRate}%</div>
                        <div className="text-sm ml-4 font-medium">Số lần trễ:</div>
                        <div className="text-sm font-semibold text-rose-600">{g.lateCount}</div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {g.samples.length === 0 && <div className="text-muted-foreground">Không có đơn trong khung này.</div>}
                        {g.samples.map((s) => (
                          <div key={s.id} className={`p-3 rounded-md ${g.isPeak ? 'bg-yellow-100' : 'bg-slate-50'} border shadow-sm hover:shadow-md transform transition-all duration-150 hover:-translate-y-0.5`}>
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-lg">Mã: {s.id}</div>
                              <div className="text-sm font-semibold">{s.completionMinutes} phút</div>
                            </div>
                            <div className="text-sm text-muted-foreground">{formatTimeRange(s.placedAt, s.completedAt)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <div className="border-t px-5 py-3 bg-card flex items-center justify-end gap-2 rounded-b-lg">
            <button className="btn btn-outline" onClick={() => onOpenChange(false)}>Đóng</button>
          </div>
        </div>
        {/* modal content end */}
      </div>
    </div>
  );
}
