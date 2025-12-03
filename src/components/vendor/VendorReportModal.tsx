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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { X } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vendorId: string;
};

type HourBucket = {
  hour: number;
  ordersCount: number;
  avgWaitMinutes: number;
  avgPrepMinutes: number;
  lateRatePercent: number;
  topItems: Array<{
    id: string;
    name: string;
    ordersForItem: number;
    avgActualPrep: number;
    vendorPrepTime: number;
    suggestedPrepTime: number;
    lateRate: number;
  }>;
  suggestionText?: string;
  preorderSuggested?: boolean;
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMockData(): HourBucket[] {
  const data: HourBucket[] = [];
  for (let h = 0; h < 24; h++) {
    let orders = randomInt(5, 30);
    if (h >= 11 && h <= 13) orders = randomInt(100, 220);
    if (h >= 18 && h <= 20) orders = randomInt(80, 160);
    const avgWait = Math.round((orders / 20) * 10) / 10 + randomInt(5, 20);
    const avgPrep = Math.round((orders / 30) * 5) + randomInt(8, 15);
    const lateRate = Math.min(60, Math.round((orders / 300) * 100));
    const topItems = [
      {
        id: "i-pho",
        name: "Phở Bò",
        ordersForItem: Math.round(orders * 0.45),
        avgActualPrep: Math.max(8, Math.round(avgPrep * 1.05)),
        vendorPrepTime: 10,
        suggestedPrepTime: Math.max(10, Math.round(avgPrep)),
        lateRate: Math.round(lateRate * 1.1),
      },
      {
        id: "i-bun",
        name: "Bún Riêu",
        ordersForItem: Math.round(orders * 0.18),
        avgActualPrep: Math.max(8, Math.round(avgPrep * 0.95)),
        vendorPrepTime: 9,
        suggestedPrepTime: Math.max(9, Math.round(avgPrep - 1)),
        lateRate: Math.round(lateRate * 0.9),
      },
      {
        id: "i-goi",
        name: "Gỏi Cuốn",
        ordersForItem: Math.round(orders * 0.08),
        avgActualPrep: Math.max(4, Math.round(avgPrep * 0.6)),
        vendorPrepTime: 6,
        suggestedPrepTime: Math.max(6, Math.round(avgPrep * 0.6)),
        lateRate: Math.round(lateRate * 0.5),
      },
    ];
    const suggestionText =
      orders > 70
        ? `Gợi ý bật PRE-ORDER ${h}:00–${h + 1}:00 (giảm chờ ~${Math.max(5, Math.round(avgWait / 3))} phút)`
        : "";
    data.push({
      hour: h,
      ordersCount: orders,
      avgWaitMinutes: Math.round(avgWait),
      avgPrepMinutes: Math.round(avgPrep),
      lateRatePercent: lateRate,
      topItems,
      suggestionText,
      preorderSuggested: orders > 80,
    });
  }
  return data;
}

export default function VendorReportModal({ open, onOpenChange, vendorId }: Props) {
  const [selectedHour, setSelectedHour] = useState<number | null>(12);
  const [preorderEnabled, setPreorderEnabled] = useState<boolean>(false);
  const data = useMemo(generateMockData, []);
  const selected = selectedHour != null ? data[selectedHour] : null;

  const heatMax = Math.max(...data.map((d) => d.ordersCount));
  const heatMin = Math.min(...data.map((d) => d.ordersCount));

  function heatColor(val: number) {
    const t = (val - heatMin) / (heatMax - heatMin || 1);
    if (t < 0.4) return "bg-emerald-200";
    if (t < 0.7) return "bg-amber-300";
    return "bg-rose-400";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full">
        <DialogHeader className="flex items-start justify-between gap-4">
          <div>
            <DialogTitle className="text-lg font-semibold">
              Báo cáo hoạt động theo khung giờ — Quán {vendorId}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Bản đồ nhiệt giờ, biểu đồ số đơn & thời gian chờ, món phổ biến, gợi ý bật pre-order.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground"
              aria-label="Đóng"
            >
              <X />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 py-2">
          <Card className="col-span-2">
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Số đơn theo giờ</Label>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                        <YAxis />
                        <Tooltip formatter={(value: any, name: any) => [value, name === "avgWaitMinutes" ? "Trung bình chờ (phút)" : name === "ordersCount" ? "Số đơn" : name]} />
                        <Legend />
                        <Bar dataKey="ordersCount" name="Số đơn" fill="#10b981" />
                        <Line type="monotone" dataKey="avgWaitMinutes" name="Trung bình chờ (phút)" stroke="#fb923c" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Bản đồ nhiệt (24 giờ)</Label>
                  <div className="mt-2 grid grid-cols-6 gap-2">
                    {data.map((d) => (
                      <button
                        key={d.hour}
                        onClick={() => setSelectedHour(d.hour)}
                        className={`relative rounded-md p-2 text-xs text-white flex flex-col items-center justify-center shadow-sm transition-transform transform hover:scale-105 ${heatColor(
                          d.ordersCount
                        )} ${selectedHour === d.hour ? "ring-2 ring-offset-1 ring-primary" : ""}`}
                        title={`${d.hour}:00 — ${d.ordersCount} đơn • Chờ trung bình ${d.avgWaitMinutes} phút`}
                      >
                        <div className="font-semibold">{d.hour}:00</div>
                        <div className="text-[10px] opacity-90">{d.ordersCount} đơn</div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground">
                    <div>Xanh = ít đơn • Vàng = trung bình • Đỏ = đông</div>
                  </div>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg border bg-background">
                  <div className="text-xs text-muted-foreground">Thời gian chờ trung bình (khung chọn)</div>
                  <div className="text-2xl font-bold">{selected?.avgWaitMinutes ?? "-"} phút</div>
                  <div className="text-sm text-muted-foreground mt-1">Thời gian nấu trung bình: {selected?.avgPrepMinutes ?? "-"} phút</div>
                </div>

                <div className="p-3 rounded-lg border bg-background">
                  <div className="text-xs text-muted-foreground">Số đơn (khung chọn)</div>
                  <div className="text-2xl font-bold">{selected?.ordersCount ?? "-"}</div>
                  <div className="text-sm text-muted-foreground mt-1">Tỷ lệ trễ: {selected?.lateRatePercent ?? "-"}%</div>
                </div>

                <div className="p-3 rounded-lg border bg-background">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">Pre-order</div>
                    <div className="text-sm font-medium">{selected?.preorderSuggested ? "Gợi ý" : "Không cần"}</div>
                  </div>
                  <div className="mt-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setPreorderEnabled((s) => !s);
                      }}
                    >
                      {preorderEnabled ? "Tắt Pre-order (mô phỏng)" : "Bật Pre-order (mô phỏng)"}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <Label className="text-sm font-medium">Món phổ biến trong khung giờ</Label>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {selected?.topItems.map((it) => (
                    <div key={it.id} className="rounded-lg border p-3 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-muted-foreground">{it.ordersForItem} đơn</div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Thời gian nấu trung bình: <span className="font-semibold">{it.avgActualPrep} phút</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Vendor nhập: {it.vendorPrepTime} phút • Gợi ý: {it.suggestedPrepTime} phút
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            alert(`(Mô phỏng) Cập nhật thời gian nấu cho ${it.name} → ${it.suggestedPrepTime} phút`);
                          }}
                        >
                          Áp gợi ý
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Khung giờ đang chọn</div>
                    <div className="text-lg font-semibold">{selected ? `${selected.hour}:00` : "-"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Gợi ý</div>
                    <div className="font-medium text-sm text-amber-600">{selected?.suggestionText || "Không có"}</div>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="text-sm">
                  <div className="mb-2"><strong>Thời gian chờ trung bình</strong>: {selected?.avgWaitMinutes ?? "-"} phút</div>
                  <div className="mb-2"><strong>Thời gian nấu trung bình</strong>: {selected?.avgPrepMinutes ?? "-"} phút</div>
                  <div className="mb-2"><strong>Số đơn</strong>: {selected?.ordersCount ?? "-"}</div>
                  <div className="mb-2"><strong>Tỷ lệ trễ</strong>: {selected?.lateRatePercent ?? "-"}%</div>
                </div>

                <Separator className="my-3" />

                <div>
                  <Label className="text-xs">Cấu hình Pre-order (mô phỏng)</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">Trạng thái Pre-order</div>
                      <div className="text-sm font-medium">{preorderEnabled ? "BẬT" : "TẮT"}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">Độ dài slot</div>
                      <div className="text-sm">10 phút</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">Giới hạn / slot</div>
                      <div className="text-sm">4 đơn</div>
                    </div>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="text-xs text-muted-foreground">Mô phỏng</div>
                <div className="mt-2">
                  <div className="text-sm">
                    Khi bật Pre-order, dự kiến giảm trung bình ~ <strong>{Math.max(3, Math.round((selected?.avgWaitMinutes ?? 10) / 4))}</strong> phút cho khung giờ này.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="text-sm font-medium mb-2">Hành động nhanh</div>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => alert("(Mô phỏng) Xuất CSV")}>Xuất CSV</Button>
                  <Button variant="outline" onClick={() => alert("(Mô phỏng) Gửi gợi ý đến app quán")}>Gửi gợi ý đến app quán</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          <Button onClick={() => { alert("(Mô phỏng) Áp dụng cấu hình pre-order cho khung giờ này"); onOpenChange(false); }}>
            Áp dụng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}