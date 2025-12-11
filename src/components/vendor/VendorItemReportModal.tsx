// src/components/vendor/VendorReportModal.tsx
import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Calendar,
  BarChart3,
  CheckCircle,
  XCircle,
  Activity,
  Timer,
  Target,
  Edit3
} from "lucide-react";
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

type OrderSample = {
  id: string;
  placedAt: string;
  completedAt?: string;
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
  suggestedEtaMinutes: number;
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

function generateMockSamplesForHour(
  menuItemId: string,
  hour: number,
  count: number,
  baseConfigured = 8
) {
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
    arr.push({
      id: `${hour}-${i}`,
      placedAt: placed.toISOString(),
      completedAt: completed.toISOString(),
      completionMinutes: value,
    });
  }
  return arr;
}

function generateMockPerItemDataWithSamples(
  menuItemId: string,
  baseConfigured = 8
): HourRow[] {
  const rows: HourRow[] = [];
  for (let h = 0; h < 24; h++) {
    let orders = Math.floor(((seedFromString(menuItemId + "-d") + h) % 8));
    if (h >= 11 && h <= 13) orders = Math.floor(Math.random() * 80) + 20;
    if (h >= 18 && h <= 20) orders = Math.floor(Math.random() * 60) + 10;
    const samples = generateMockSamplesForHour(
      menuItemId,
      h,
      Math.max(1, Math.min(orders, 40)),
      baseConfigured
    );
    const avg =
      Math.round(
        (samples.reduce((a, b) => a + b.completionMinutes, 0) / samples.length) * 10
      ) / 10;
    const configured = baseConfigured;
    const lateCount = samples.filter((s) => s.completionMinutes > configured + 2).length;
    const lateRate =
      orders === 0 ? 0 : Math.round((lateCount / Math.max(1, orders)) * 100);
    const suggestedEta = Math.max(configured, Math.round(avg + 1));
    const recommendPreorder = orders >= 50 || lateRate >= 25;
    const capacityPerSlot =
      orders > 120 ? 6 : orders > 90 ? 5 : orders > 60 ? 4 : 3;
    const slotsCount = recommendPreorder
      ? Math.max(1, Math.ceil(orders / capacityPerSlot))
      : 0;

    rows.push({
      hourFrom: h,
      hourTo: h + 1,
      orders,
      avgCompletionMinutes: avg,
      configuredMinutes: configured,
      suggestedEtaMinutes: suggestedEta,
      lateRatePercent: lateRate,
      recommendPreorder,
      preorderSuggestion: recommendPreorder
        ? { slotMinutes: 10, slotsCount, capacityPerSlot }
        : undefined,
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
    const ts = `${pad(s.getHours())}:${pad(s.getMinutes())}:${pad(
      s.getSeconds()
    )}`;
    const te = e
      ? `${pad(e.getHours())}:${pad(e.getMinutes())}:${pad(e.getSeconds())}`
      : "—";
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
  suggestedEtaMinutes,
  onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vendorId: string;
  menuItemId: string;
  menuItemName: string;
  currentPrepMinutes: number;
  suggestedEtaMinutes: number;
  onApply: (menuItemId: string, newPrepMinutes: number) => Promise<void> | void;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HourRow[] | null>(null);
  const [allSamples, setAllSamples] = useState<OrderSample[] | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [preorderLoading, setPreorderLoading] = useState(false);
  const [preorderEnabledForCurrent, setPreorderEnabledForCurrent] =
    useState<boolean | null>(null);
  const [editableSuggestedEta, setEditableSuggestedEta] = useState<number>(0);
  const [isEditingEta, setIsEditingEta] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      if (!menuItemId) return;
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken") || "";
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const res = await api
          .get<VendorItemReportResponse>(
            `/api/vendors/${vendorId}/menuitems/${menuItemId}/report?date=${selectedDate}`,
            headers
          )
          .catch(() => null);
        const payload =
          (res as ApiResponse<VendorItemReportApi>)?.data ??
          (res as VendorItemReportApi | null);
        if (payload && payload.hourly && Array.isArray(payload.hourly)) {
          const rows: HourRow[] = payload.hourly.map((r) => ({
            hourFrom: Number(r.hour) || 0,
            hourTo: (Number(r.hour) || 0) + 1,
            orders: Number(r.orders) || 0,
            avgCompletionMinutes: Number(r.avgCompletionMinutes) || 0,
            configuredMinutes:
              Number(r.configuredMinutes) || currentPrepMinutes || undefined,
            suggestedEtaMinutes: Number(r.suggestedEtaMinutes),
            lateRatePercent: Number(r.lateRatePercent) || 0,
            recommendPreorder: !!r.recommendPreorder,
            preorderSuggestion: r.preorderSuggestion,
            samples: Array.isArray(r.samples)
              ? r.samples.map((s) => ({
                  id: s.id,
                  placedAt: s.placedAt,
                  completedAt: s.completedAt,
                  completionMinutes: Number(s.completionMinutes),
                }))
              : undefined,
          }));

          if (mounted) {
            setData(rows);
            const ordersPayload = payload.orders;
            if (ordersPayload && Array.isArray(ordersPayload)) {
              setAllSamples(
                ordersPayload.map((o) => ({
                  id: o.id,
                  placedAt: o.placedAt,
                  completedAt: o.completedAt,
                  completionMinutes: Number(o.completionMinutes),
                }))
              );
            } else {
              setAllSamples(
                rows
                  .flatMap((r) => r.samples ?? [])
                  .sort(
                    (a, b) =>
                      new Date(a.placedAt).getTime() -
                      new Date(b.placedAt).getTime()
                  )
              );
            }
            if (typeof payload.preorderEnabled === "boolean") {
              setPreorderEnabledForCurrent(payload.preorderEnabled);
            }
          }
        } else {
          if (mounted) {
            const mock = generateMockPerItemDataWithSamples(
              menuItemId,
              currentPrepMinutes || 8
            );
            setData(mock);
            setAllSamples(
              mock
                .flatMap((r) => r.samples ?? [])
                .sort(
                  (a, b) =>
                    new Date(a.placedAt).getTime() -
                    new Date(b.placedAt).getTime()
                )
            );
          }
        }
        setEditableSuggestedEta(currentHourEtaDisplay);
      } catch (e) {
        console.error(e);
        if (mounted) {
          const mock = generateMockPerItemDataWithSamples(
            menuItemId,
            currentPrepMinutes || 8
          );
          setData(mock);
          setAllSamples(
            mock
              .flatMap((r) => r.samples ?? [])
              .sort(
                (a, b) =>
                  new Date(a.placedAt).getTime() -
                  new Date(b.placedAt).getTime()
              )
          );
        }
      } finally {
        if (mounted) setLoading(false);


      }
    }
    fetchData();
    return () => {
      mounted = false;
    };
  }, [menuItemId, vendorId, selectedDate, currentPrepMinutes]);

  const chartData = useMemo(() => {
    // Create array for all 24 hours
    const allHours = Array.from({ length: 24 }, (_, i) => {
      const hourData = data?.find(d => d.hourFrom === i);
      return {
        hour: `${i.toString().padStart(2, '0')}:00`,
        orders: hourData?.orders || 0,
        avg: hourData ? Math.max(5, Math.round(hourData.avgCompletionMinutes)) : 5,
        suggest: hourData ? Math.max(5, Math.round(hourData.suggestedEtaMinutes)) : 5,
        peak: hourData ? (hourData.orders >= 50 || hourData.lateRatePercent >= 25) : false,
        late: hourData ? Math.round((hourData.orders || 0) * ((hourData.lateRatePercent || 0) / 100)) : 0,
      };
    });
    return allHours;
  }, [data]);

  const nowHour = new Date().getHours();
  const suggestedNow = data
    ? data.find((d) => d.hourFrom === nowHour)
    : undefined;

  const currentHourEtaDisplay = useMemo(() => {
    if (suggestedNow && suggestedNow.avgCompletionMinutes > 0) {
      return suggestedNow.avgCompletionMinutes;
    }
    if (data && data.length > 0) {
      const withAvg = data.filter((d) => d.avgCompletionMinutes > 0);
      if (withAvg.length > 0) {
        const sum = withAvg.reduce(
          (total, d) => total + d.avgCompletionMinutes,
          0
        );
        return Math.round((sum / withAvg.length) * 10) / 10;
      }
    }
    return currentPrepMinutes;
  }, [suggestedNow, data, currentPrepMinutes]);

  // Update editable ETA when data changes
  React.useEffect(() => {
    if (!isEditingEta) {
      if (suggestedNow) {
        setEditableSuggestedEta(suggestedNow.suggestedEtaMinutes);
      } 
    }
  }, [suggestedNow, isEditingEta, currentPrepMinutes]);
        // Use current prep minutes as default if no suggested d

        
  const peakHour = useMemo(() => {
    if (!data || data.length === 0) return null;
    let best = data[0];
    for (const d of data) {
      if (
        d.orders > best.orders ||
        (d.orders === best.orders &&
          d.lateRatePercent > best.lateRatePercent)
      )
        best = d;
    }
    return best;
  }, [data]);

  const peakReason = useMemo(() => {
    if (!peakHour) return "Không có dữ liệu";
    const reasons: string[] = [];
    if (peakHour.orders >= 50)
      reasons.push(`Nhiều đơn (${peakHour.orders} đơn)`);
    if (peakHour.lateRatePercent >= 25)
      reasons.push(`Tỉ lệ trễ cao (${peakHour.lateRatePercent}%)`);
    if (reasons.length === 0)
      reasons.push(
        `Số đơn: ${peakHour.orders}, TB: ${peakHour.avgCompletionMinutes} phút`
      );
    return reasons.join(" • ");
  }, [peakHour]);

  const applyForCurrentHour = async () => {
    const v = Number(editableSuggestedEta);
    if (!Number.isFinite(v) || v <= 0)
      return toast.error("ETA phải là số dương hợp lệ");
    
    setApplyLoading(true);
    try {
      await onApply(menuItemId, v);
      const token = localStorage.getItem("accessToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      
      // Use current hour if suggestedNow is not available
      const hourToApply = suggestedNow?.hourFrom ?? nowHour;
      
      await api
        .put(
          `/api/MenuItem/${menuItemId}/eta`,
          { prepTime: v },
          headers
        )
        .catch(() => null);
     
      setIsEditingEta(false);
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
      await api
        .post(
          `/api/menuitem/${menuItemId}/preorder`,
          { hourFrom: nowHour, enable },
          headers
        )
        .catch(() => null);
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

    const arr: {
      hour: number;
      samples: OrderSample[];
      isPeak: boolean;
      avgMinutes: number;
      lateCount: number;
      lateRate: number;
    }[] = [];
    (data || []).forEach((d) => {
      const samples = (map.get(d.hourFrom) || []).sort(
        (a, b) =>
          new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
      );
      const lateCount = Math.round(
        (d.orders || 0) * ((d.lateRatePercent || 0) / 100)
      );
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
      <div
        className="fixed inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-full max-w-6xl h-[90vh] overflow-hidden transform transition-all duration-200">
        <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
          <div className="flex-shrink-0 border-b px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    📊 Báo cáo món — {menuItemName || menuItemId}
                    <Badge variant="secondary" className="text-xs">
                      Chi tiết
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600 font-medium">Ngày:</span>
                      <input
                        type="date"
                        className="border-0 bg-transparent text-gray-800 font-semibold focus:outline-none"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                      />
                    </div>
                    {loading && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Activity className="h-4 w-4 animate-pulse" />
                        <span className="text-sm font-medium animate-pulse">
                          Đang tải dữ liệu...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="hover:bg-red-100 hover:text-red-600 transition-colors"
                aria-label="Đóng"
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 px-6 py-5 overflow-auto bg-gray-50">
            <div className="grid grid-cols-1 gap-6">
              <div className="rounded-xl border-0 p-6 bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800">
                        📈 Biểu đồ theo giờ
                      </div>
                      <div className="text-sm text-gray-500">
                        Phân tích số lượt đặt & đơn trễ theo từng giờ
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold">
                    {(data || []).length} khung giờ
                  </Badge>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border" style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                      <XAxis 
                        dataKey="hour" 
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        allowDecimals={false}
                        tickFormatter={(value) => Math.round(Number(value)).toString()}
                        domain={[4, (dataMax: number) => dataMax + 3]}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string) => {
                          return [Math.round(Number(value)), name];
                        }}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="rect"
                      />

                      <Bar dataKey="orders" name="🛒 Số lượt đặt" radius={[2, 2, 0, 0]}>
                        {chartData.map((entry: any, idx: number) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={entry.peak ? "#f59e0b" : "#3b82f6"}
                          />
                        ))}
                      </Bar>

                      <Bar
                        dataKey="late"
                        name="⚠️ Số đơn trễ"
                        fill="#ef4444"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border-0 p-6 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                      <Target className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800">
                        🎯 Hành động & Tóm tắt
                      </div>
                      <div className="text-sm text-gray-500">
                        Thông tin quan trọng và hành động được đề xuất
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                    onClick={applyForCurrentHour}
                    disabled={applyLoading || !editableSuggestedEta || editableSuggestedEta <= 0}
                  >
                    {applyLoading ? (
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 animate-spin" />
                        Đang áp dụng...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Áp dụng ETA ngay
                      </div>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border bg-gradient-to-br from-blue-50 to-cyan-50 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div className="text-sm font-medium text-blue-800">
                        ETA hiện tại
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-blue-900">
                      {currentPrepMinutes} <span className="text-lg text-blue-600">phút</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Timer className="h-5 w-5 text-green-600" />
                        <div className="text-sm font-medium text-green-800">
                          ETA được đề xuất
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingEta(!isEditingEta)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-100"
                      >
                        {isEditingEta ? <CheckCircle className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditingEta ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="120"
                            value={editableSuggestedEta}
                            onChange={(e) => setEditableSuggestedEta(Number(e.target.value))}
                            className="w-20 px-2 py-1 text-2xl font-bold text-green-900 bg-white border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setIsEditingEta(false);
                              }
                            }}
                          />
                          <span className="text-lg text-green-600">phút</span>
                        </div>
                      ) : (
                        <div className="text-3xl font-bold text-green-900">
                          {editableSuggestedEta || currentHourEtaDisplay} <span className="text-lg text-green-600">phút</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border bg-gradient-to-br from-orange-50 to-amber-50 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <div className="text-sm font-medium text-orange-800">
                        Khung giờ cao điểm
                      </div>
                    </div>
                    {peakHour ? (
                      <>
                        <div className="text-2xl font-bold text-orange-900">
                          {peakHour.hourFrom}:00 — {peakHour.hourTo}:00
                        </div>
                        <div className="text-xs text-orange-600 mt-1 font-medium">
                          {peakReason}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-orange-600 font-medium">
                        Không đủ dữ liệu
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border-0 p-6 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
                    <Activity className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-800">
                      📋 Lịch sử chi tiết theo giờ
                    </div>
                    <div className="text-sm text-gray-500">
                      Thông tin đơn hàng và hiệu suất từng khung giờ
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {groupedByHour.map((g) => (
                    <div
                      key={g.hour}
                      className={`${
                        g.isPeak
                          ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-amber-100"
                          : "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200"
                      } rounded-xl border-2 p-5 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${g.isPeak ? 'bg-amber-100' : 'bg-blue-100'}`}>
                            <Clock className={`h-5 w-5 ${g.isPeak ? 'text-amber-600' : 'text-blue-600'}`} />
                          </div>
                          <div>
                            <div className="font-bold text-lg text-gray-800">
                              🕐 {g.hour}:00 — {g.hour + 1}:00
                            </div>
                            {g.isPeak && (
                              <Badge variant="destructive" className="text-xs mt-1">
                                ⚡ Giờ cao điểm
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 font-medium">
                            📦 {g.samples.length} đơn hàng
                          </div>
                          <div className="text-lg font-bold text-gray-800">
                            ⏱️ {g.avgMinutes} phút TB
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <div>
                            <div className="text-xs text-gray-500 font-medium">Tỉ lệ trễ</div>
                            <div className="text-lg font-bold text-red-600">
                              {g.lateRate}%
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <div>
                            <div className="text-xs text-gray-500 font-medium">Số đơn trễ</div>
                            <div className="text-lg font-bold text-red-600">
                              {g.lateCount} đơn
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {g.samples.length === 0 && (
                          <div className="col-span-full text-center py-8 text-gray-500">
                            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <div className="font-medium">Không có đơn hàng trong khung giờ này</div>
                          </div>
                        )}
                        {g.samples.map((s) => (
                          <div
                            key={s.id}
                            className={`p-4 rounded-lg border-2 shadow-sm hover:shadow-lg transform transition-all duration-200 hover:-translate-y-1 ${
                              g.isPeak 
                                ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 hover:border-amber-300" 
                                : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`p-1 rounded ${g.isPeak ? 'bg-amber-100' : 'bg-blue-100'}`}>
                                  <CheckCircle className={`h-3 w-3 ${g.isPeak ? 'text-amber-600' : 'text-blue-600'}`} />
                                </div>
                                <div className="font-bold text-gray-800 text-sm">
                                  #{s.id}
                                </div>
                              </div>
                              <Badge 
                                variant={s.completionMinutes > (currentPrepMinutes + 2) ? "destructive" : "secondary"}
                                className="text-xs font-bold"
                              >
                                {s.completionMinutes}p
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600 font-medium">
                              🕒 {formatTimeRange(s.placedAt, s.completedAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 border-t px-6 py-4 bg-gradient-to-r from-gray-50 to-slate-50 flex items-center justify-between rounded-b-lg">
            <div className="text-sm text-gray-600 font-medium">
            </div>
            {/* <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="hover:bg-gray-100 transition-colors"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Đóng báo cáo
            </Button> */}
          </div>
        </div>
      </div>
    </div>
  );
}