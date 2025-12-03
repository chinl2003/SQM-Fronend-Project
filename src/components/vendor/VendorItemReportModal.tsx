// src/components/vendor/VendorReportModal.tsx
import React, { useMemo, useState } from "react";
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
  Line,
  Legend,
} from "recharts";
import { toast } from "sonner";

type HourRow = {
  hourFrom: number;
  hourTo: number;
  orders: number;
  avgActualMinutes: number;
  avgConfiguredMinutes: number;
  avgDelayMinutes: number;
  lateRatePercent: number;
  suggestedEtaMinutes: number;
  recommendPreorder: boolean;
  preorderSuggestion?: { slotMinutes: number; slotsCount: number; capacityPerSlot: number };
};

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMockReportData(): HourRow[] {
  const rows: HourRow[] = [];
  for (let h = 0; h < 24; h++) {
    let orders = rnd(0, 18);
    if (h >= 11 && h <= 13) orders = rnd(80, 220);
    if (h >= 18 && h <= 20) orders = rnd(40, 160);

    const sampleCount = Math.max(1, Math.floor(Math.min(orders, 100) * 0.6));
    const samples: number[] = [];
    for (let i = 0; i < sampleCount; i++) {
      const base = h >= 11 && h <= 13 ? rnd(10, 20) : rnd(6, 14);
      samples.push(Math.max(2, base + rnd(-2, 4)));
    }

    const avgActual = sampleCount > 0 ? Math.round((samples.reduce((a, b) => a + b, 0) / samples.length) * 10) / 10 : 0;
    const avgConfigured = h >= 11 && h <= 13 ? 10 : 8;
    const avgDelay = Math.round(Math.max(0, avgActual - avgConfigured) * 10) / 10;
    const lateRate = orders === 0 ? 0 : Math.round((samples.filter(s => s > avgConfigured + 2).length / Math.max(1, orders)) * 100);
    const suggestedEta = Math.round(Math.max(avgConfigured, avgActual + 1));
    const recommendPreorder = orders >= 70 || lateRate >= 25;
    const preorderSuggestion = recommendPreorder ? { slotMinutes: 10, capacityPerSlot: orders > 120 ? 6 : orders > 90 ? 5 : 4, slotsCount: Math.max(1, Math.ceil(orders / (orders > 120 ? 6 : orders > 90 ? 5 : 4))) } : undefined;

    rows.push({
      hourFrom: h,
      hourTo: h + 1,
      orders,
      avgActualMinutes: avgActual,
      avgConfiguredMinutes: avgConfigured,
      avgDelayMinutes: avgDelay,
      lateRatePercent: lateRate,
      suggestedEtaMinutes: suggestedEta,
      recommendPreorder,
      preorderSuggestion,
    });
  }
  return rows;
}

export default function VendorReportModal({
  open,
  onOpenChange,
  vendorId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vendorId: string;
}) {
  const nowHour = new Date().getHours();
  const data = useMemo(() => generateMockReportData(), [vendorId]);
  const chartData = data.map(d => ({ hour: `${d.hourFrom}:00`, orders: d.orders, avg: d.avgActualMinutes }));
  const [applyLoading, setApplyLoading] = useState(false);

  const applySuggestionForHour = async (hourFrom: number) => {
    setApplyLoading(true);
    try {
      const row = data.find(r => r.hourFrom === hourFrom);
      if (!row) {
        toast.error("Không tìm thấy khung giờ.");
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(`Đã áp dụng ETA ${row.suggestedEtaMinutes} phút cho khung ${row.hourFrom}:00–${row.hourTo}:00 (mock).`);
    } catch {
      toast.error("Áp dụng thất bại.");
    } finally {
      setApplyLoading(false);
    }
  };

  const applyAllSuggestions = async () => {
    setApplyLoading(true);
    try {
      const highest = Math.max(...data.map(d => d.suggestedEtaMinutes));
      await new Promise(resolve => setTimeout(resolve, 600));
      toast.success(`Đã áp dụng ETA ${highest} phút cho toàn bộ khung (mock).`);
    } catch {
      toast.error("Áp dụng toàn bộ thất bại.");
    } finally {
      setApplyLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* DialogContent cố định chiều cao tối đa bằng viewport và tắt overflow của container chính */}
      <DialogContent className="max-w-6xl w-full max-h-[90vh] p-0">
        <div className="flex flex-col h-full">
          {/* Header cố định */}
          <div className="border-b px-5 py-4 bg-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-lg font-semibold">Báo cáo theo khung giờ — Quán {vendorId}</DialogTitle>
                <div className="text-sm text-muted-foreground mt-1">Biểu đồ tổng quan (số đơn + thời gian thực tế) — phía dưới là bảng ETA gợi ý theo từng khung giờ</div>
              </div>
              <div>
                <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Đóng">
                  <X />
                </Button>
              </div>
            </div>
          </div>

          {/* Body scrollable */}
          <ScrollArea className="px-5 py-4 max-h-[72vh] overflow-auto">
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <Label className="text-sm font-medium">Tổng quan 24 giờ</Label>
                    </div>
                    <div className="text-sm text-muted-foreground">Giờ hiện tại: {nowHour}:00</div>
                  </div>

                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="orders" name="Số đơn" fill="#10b981" />
                        <Line yAxisId="right" type="monotone" dataKey="avg" name="Thời gian TB (phút)" stroke="#fb923c" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">ETA gợi ý theo khung giờ</Label>
                      <div className="text-xs text-muted-foreground">Hệ thống đã phân tích lịch sử để gợi ý ETA cho từng khung</div>
                    </div>
                    <div>
                      <Button size="sm" onClick={() => applyAllSuggestions()} disabled={applyLoading}>Áp dụng tất cả</Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left">
                          <th className="px-3 py-2">Khung giờ</th>
                          <th className="px-3 py-2">Số đơn</th>
                          <th className="px-3 py-2">Thực tế trung bình</th>
                          <th className="px-3 py-2">ETA gợi ý</th>
                          <th className="px-3 py-2">Gợi ý Pre-order</th>
                          <th className="px-3 py-2">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((r) => {
                          const highlight = r.hourFrom === nowHour;
                          return (
                            <tr key={r.hourFrom} className={`${highlight ? "bg-yellow-50" : ""} border-t`}>
                              <td className="px-3 py-2 align-top">
                                <div className="whitespace-nowrap">
                                  {r.hourFrom}:00–{r.hourTo}:00
                                  {r.orders >= 70 ? <span className="ml-2 text-xs text-rose-600 font-medium"> (Cao điểm)</span> : null}
                                </div>
                              </td>
                              <td className="px-3 py-2 align-top">{r.orders}</td>
                              <td className="px-3 py-2 align-top">{r.avgActualMinutes} phút</td>
                              <td className="px-3 py-2 align-top font-semibold">{r.suggestedEtaMinutes} phút</td>
                              <td className="px-3 py-2 align-top text-sm">
                                {r.recommendPreorder ? `Có • ${r.preorderSuggestion?.slotsCount} slot × ${r.preorderSuggestion?.capacityPerSlot}/slot` : "Không cần"}
                              </td>
                              <td className="px-3 py-2 align-top">
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => applySuggestionForHour(r.hourFrom)} disabled={applyLoading}>Áp dụng</Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <div className="text-sm font-medium mb-2">Tóm tắt & giải thích nhanh</div>
                  <div className="text-sm mb-2">Hệ thống dùng thời gian thực tế hoàn thành trong mỗi khung giờ để gợi ý ETA. Nếu khung có nhiều đơn và tỉ lệ trễ cao → gợi ý tăng ETA và bật pre-order.</div>
                  <div className="text-sm">Giờ cao điểm gợi ý: {data.filter(d => d.orders >= 70).map(d => `${d.hourFrom}:00`).join(", ") || "Không có"}</div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          {/* Footer cố định */}
          <div className="border-t px-5 py-3 bg-card flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}