// src/components/vendor/dashboard/WaitTimeChart.tsx
import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tooltip as UiTooltip,
} from "@/components/ui/tooltip";

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

export function WaitTimeChart({
  data,
  loading,
  items,
}: {
  data?: HourlyActivityDto[];
  loading?: boolean;
  items?: MenuItemEtaAccuracyDto[]; // optional: list of menu items with delayed counts
}) {
  // map incoming hourly data to the area chart format (fallback to existing mock)
  const chartData = useMemo(() => {
    if (data && data.length > 0) {
      // reduce to a few representative points: map hour to string and use averageEtaMinutes and orderCount
      const arr = data.map((h) => ({
        hour: `${String(h.hour).padStart(2, "0")}:00`,
        waitTime: Math.round(h.averageEtaMinutes ?? 0),
        orders: h.orderCount ?? 0,
      }));
      // ensure sorted by hour
      arr.sort((a, b) => Number(a.hour.slice(0, 2)) - Number(b.hour.slice(0, 2)));
      return arr;
    }
    // fallback mock (kept from your original)
    return [
      { hour: "08:00", waitTime: 8, orders: 12 },
      { hour: "09:00", waitTime: 10, orders: 18 },
      { hour: "10:00", waitTime: 12, orders: 25 },
      { hour: "11:00", waitTime: 18, orders: 45 },
      { hour: "11:30", waitTime: 25, orders: 62 },
      { hour: "12:00", waitTime: 32, orders: 78 },
      { hour: "12:30", waitTime: 28, orders: 68 },
      { hour: "13:00", waitTime: 22, orders: 52 },
      { hour: "14:00", waitTime: 14, orders: 28 },
      { hour: "15:00", waitTime: 10, orders: 20 },
      { hour: "16:00", waitTime: 8, orders: 15 },
      { hour: "17:00", waitTime: 12, orders: 30 },
      { hour: "18:00", waitTime: 20, orders: 55 },
      { hour: "18:30", waitTime: 26, orders: 65 },
      { hour: "19:00", waitTime: 30, orders: 72 },
      { hour: "19:30", waitTime: 24, orders: 58 },
      { hour: "20:00", waitTime: 16, orders: 35 },
      { hour: "21:00", waitTime: 10, orders: 18 },
    ];
  }, [data]);

  // determine most delayed dish name using items (if provided) else fallback
  const mostDelayedDish = useMemo(() => {
    if (items && items.length > 0) {
      // find item with max totalDelayedCount
      const arr = items.slice();
      arr.sort((a, b) => (b.totalDelayedCount ?? 0) - (a.totalDelayedCount ?? 0));
      const top = arr[0];
      if (top && (top.totalDelayedCount ?? 0) > 0) {
        return `${top.menuItemName ?? top.menuItemId}`;
      }
      return "Không có món trễ";
    }

    // fallback when items not provided:
    if (data && data.length > 0) {
      return "Món hay trễ";
    }

    // original static fallback
    return "Phở bò tái";
  }, [items, data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{label}</p>
          <p className="text-sm text-primary">
            Thời gian chờ:{" "}
            <span className="font-medium">{payload[0]?.value ?? "—"} phút</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Số đơn: <span className="font-medium">{payload[1]?.value ?? 0}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container animate-fade-in" style={{ animationDelay: "0.1s" }}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Thời gian chờ theo giờ</h3>
          <p className="text-sm text-muted-foreground">Phân tích thời gian chờ trung bình trong ngày</p>
        </div>

        <div className="flex items-center">
          <TooltipProvider delayDuration={150}>
            <UiTooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 px-3 py-1 rounded-full border border-[#FCA5A5] bg-[#FFF5F5] cursor-pointer">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
                  <span className="text-[11px] sm:text-xs font-semibold text-[#7F1D1D]">{mostDelayedDish}</span>
                </div>
              </TooltipTrigger>

              {/* Use TooltipContent so content is shown only on hover/trigger */}
              <TooltipContent side="bottom" className="bg-[#1F130A] text-white text-xs py-1 px-2 rounded-md shadow-md">
                {items && items.length > 0
                  ? "Món có số lượt trễ cao nhất trong ngày"
                  : "Món ăn thường xuyên chậm"}
              </TooltipContent>
            </UiTooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="waitTimeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 20%, 88%)" vertical={false} />
            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "hsl(25, 15%, 45%)", fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(25, 15%, 45%)", fontSize: 12 }} dx={-10} tickFormatter={(value) => `${value}p`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="waitTime" stroke="hsl(25, 95%, 53%)" strokeWidth={2} fill="url(#waitTimeGradient)" />
            <Area type="monotone" dataKey="orders" stroke="hsl(142, 76%, 36%)" strokeWidth={2} fillOpacity={0} strokeDasharray="5 5" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Thời gian chờ (phút)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-success" style={{ borderStyle: "dashed" }} />
          <span className="text-sm text-muted-foreground">Số đơn hàng</span>
        </div>
      </div>
    </div>
  );
}