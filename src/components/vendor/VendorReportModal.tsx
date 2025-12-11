// src/components/vendor/VendorReportModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatCard } from "./dashboard/StatCard";
import { WaitTimeChart } from "./dashboard/WaitTimeChart";
import { DelayedDishesChart } from "./dashboard/DelayedDishesChart";
import { ETAAccuracyGauge } from "./dashboard/ETAAccuracyGauge";
import { RecommendationsCard } from "./dashboard/RecommendationsCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Package, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { api, ApiResponse } from "@/lib/api";
import { toast } from "sonner";

// date picker
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";

type HourlyActivityDto = {
  hour: number;
  orderCount: number;
  averageEtaMinutes?: number | null;
  delayedOrderCount: number;
};

type MenuItemEtaAccuracyDto = {
  menuItemId: string;
  menuItemName?: string | null;
  totalOrderedCount: number;
  totalDelayedCount: number;
  accuracyPercent: number;
};

type PreOrderSuggestionDto = {
  from: string;
  to: string;
  totalDelayedOrders: number;
  delayedMenuItems: Array<{
    menuItemId: string;
    menuItemName?: string | null;
    delayedCount: number;
    totalOrderedCount: number;
    delayRatePercent: number;
  }>;
};

type VendorDailyReportDto = {
  vendorId: string;
  vendorName?: string | null;
  totalOrders: number;
  averageACT?: number | null;
  totalDelayedOrders: number;
  openingHoursRaw?: string | null;
  hourlyActivities: HourlyActivityDto[];
  menuItemEtaAccuracies: MenuItemEtaAccuracyDto[];
  preOrderSuggestions: PreOrderSuggestionDto[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId: string;
};

export default function VendorReportModal({ open, onOpenChange, vendorId }: Props) {
  const [loading, setLoading] = useState(false);

  // use Date object for selected date for easier formatting & day picker
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const [dto, setDto] = useState<VendorDailyReportDto | null>(null);

  // close picker on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!showDatePicker) return;
      if (!pickerRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!pickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showDatePicker]);

  // fetch report whenever modal opens or vendorId or selectedDate changes
  useEffect(() => {
    if (!open || !vendorId) return;
    let mounted = true;

    async function fetchReport() {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken") || "";
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const dateForApi = format(selectedDate, "yyyy-MM-dd");

        const res = await api
          .get<ApiResponse<VendorDailyReportDto>>(
            `/api/report?vendorId=${encodeURIComponent(vendorId)}&date=${encodeURIComponent(dateForApi)}`,
            headers
          )
          .catch(() => null);

        const payload = (res as any)?.data ?? (res as any);
        if (!mounted) return;

        const data = payload?.data ?? payload;
        if (!data) {
          setDto(null);
          toast.error("Không lấy được báo cáo cho quán này.");
        } else {
          setDto(data as VendorDailyReportDto);
        }
      } catch (err) {
        console.error(err);
        toast.error("Lỗi khi tải báo cáo. Xem console để biết thêm chi tiết.");
        setDto(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchReport();
    return () => {
      mounted = false;
    };
  }, [open, vendorId, selectedDate]);

  // derived stats
  const totalOrders = dto?.totalOrders ?? 0;
  const totalDelayedOrders = dto?.totalDelayedOrders ?? 0;
  const delayedPercent = totalOrders === 0 ? 0 : Math.round((totalDelayedOrders / totalOrders) * 10000) / 100;

  const overallEtaAccuracy = useMemo(() => {
    const arr = dto?.menuItemEtaAccuracies ?? [];
    const totalCount = arr.reduce((s, x) => s + (x.totalOrderedCount ?? 0), 0);
    if (totalCount === 0) return 100;
    const weighted = arr.reduce((s, x) => s + (x.accuracyPercent ?? 100) * (x.totalOrderedCount ?? 0), 0);
    return Math.round((weighted / totalCount) * 100) / 100;
  }, [dto]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full p-0 overflow-hidden bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <DialogHeader className="px-6 py-4 border-b border-[#F2E4D9] bg-white flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF7A1A] flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <div>
              <DialogTitle className="text-[17px] font-bold text-[#1F130A]">
                {dto?.vendorName ?? "Vendor Dashboard"}
              </DialogTitle>
              <p className="text-xs text-[#957056]">{dto?.openingHoursRaw ?? ""}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Date picker button */}
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setShowDatePicker((v) => !v)}
                className="flex items-center gap-2 border rounded px-3 py-1 text-sm bg-white hover:bg-slate-50"
                aria-label="Chọn ngày báo cáo"
              >
                <svg
                  className="w-4 h-4 text-muted-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3M16 7V3M3 11h18M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
                  />
                </svg>
                <span className="text-sm font-medium">{format(selectedDate, "dd/MM/yyyy")}</span>
                <svg className="w-3 h-3 text-muted-foreground" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M6 8l4 4 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {showDatePicker && (
                <div className="absolute right-0 mt-2 z-50 bg-white border rounded shadow-lg p-2">
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => {
                      if (d) {
                        const dt = new Date(d);
                        dt.setHours(0, 0, 0, 0);
                        setSelectedDate(dt);
                        setShowDatePicker(false);
                      }
                    }}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      className="text-sm px-3 py-1 rounded bg-gray-100"
                      onClick={() => {
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);
                        setSelectedDate(now);
                        setShowDatePicker(false);
                      }}
                    >
                      Hôm nay
                    </button>
                    <button className="text-sm px-3 py-1 rounded bg-primary text-white" onClick={() => setShowDatePicker(false)}>
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full hover:bg-orange-100" aria-label="Đóng">
              <X className="w-5 h-5 text-[#5A402B]" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[78vh] px-6 py-5">
          <h2 className="text-2xl font-bold text-[#1F130A]">Báo cáo hiệu suất</h2>
          <p className="text-sm text-[#9C6A3C] mt-1 mb-6">Tóm tắt tỉ lệ trễ và độ chính xác ETA</p>

          {/* STATS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="rounded-2xl bg-white border border-[#F2E4D9] shadow p-4">
              <StatCard title="Tổng đơn hàng" value={loading ? "Đang tải..." : totalOrders.toLocaleString()} icon={Package} variant="default" />
            </div>

            <div className="rounded-2xl bg-white border border-[#F2E4D9] shadow p-4">
              <StatCard
                title="Thời gian chờ TB"
                value={
                  loading
                    ? "—"
                    : dto?.averageACT != null
                    ? `${dto.averageACT.toFixed(2)} phút`
                    : "—"
                }
                icon={Clock}
                variant="success"
              />
            </div>

            <div className="rounded-2xl bg-white border border-[#F2E4D9] shadow p-4">
              <StatCard title="Độ chính xác ETA" value={loading ? "—" : `${overallEtaAccuracy}%`} icon={TrendingUp} variant="warning" />
            </div>

            <div className="rounded-2xl bg-white border border-[#F2E4D9] shadow p-4">
              <StatCard title="Đơn trễ" value={loading ? "—" : String(totalDelayedOrders)} icon={AlertTriangle} variant="destructive" />
            </div>
          </div>

          {/* GRAPHS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="rounded-2xl bg-white border border-[#F2E4D9] shadow p-5">
              <WaitTimeChart data={dto?.hourlyActivities ?? []} items={dto?.menuItemEtaAccuracies ?? []} loading={loading} />
            </div>

            <div className="rounded-2xl bg-white border border-[#F2E4D9] shadow p-5">
              <DelayedDishesChart items={dto?.menuItemEtaAccuracies ?? []} loading={loading} />
            </div>
          </div>

          {/* ETA & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white border border-[#F2E4D9] shadow p-5">
              <ETAAccuracyGauge items={dto?.menuItemEtaAccuracies ?? []} loading={loading} />
            </div>

            <div className="lg:col-span-2 rounded-2xl border border-[#F2E4D9] shadow p-5">
              <RecommendationsCard vendorId={vendorId} suggestions={dto?.preOrderSuggestions ?? []} loading={loading} />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}