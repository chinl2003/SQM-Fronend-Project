// src/components/vendor/DelayedDishesChart.tsx
import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle } from "lucide-react";

type MenuItemEtaAccuracyDto = {
  menuItemId: string;
  menuItemName?: string | null;
  totalOrderedCount: number;
  totalDelayedCount: number;
  accuracyPercent: number;
};

const getBarColor = (delayRate: number) => {
  if (delayRate >= 40) return "hsl(0, 84%, 60%)";
  if (delayRate >= 30) return "hsl(38, 92%, 50%)";
  return "hsl(142, 76%, 36%)";
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg min-w-[180px]">
        <p className="font-semibold text-foreground mb-2">{item.name}</p>
        <div className="space-y-1 text-sm">
          <p className="flex justify-between">
            <span className="text-muted-foreground">Tỷ lệ chậm:</span>
            <span className="font-medium text-destructive">{item.delayRate}%</span>
          </p>
          <p className="flex justify-between">
            <span className="text-muted-foreground">TB chậm:</span>
            <span className="font-medium">{item.avgDelay ?? "—"} phút</span>
          </p>
          <p className="flex justify-between">
            <span className="text-muted-foreground">Tổng đơn:</span>
            <span className="font-medium">{item.orders}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function DelayedDishesChart({ items, loading }: { items?: MenuItemEtaAccuracyDto[]; loading?: boolean }) {
  // If items provided: map to bar data
  const data = useMemo(() => {
    if (items && items.length > 0) {
      return items.map((it) => {
        const total = it.totalOrderedCount ?? 0;
        const delayed = it.totalDelayedCount ?? 0;
        const delayRate = total === 0 ? 0 : Math.round((delayed / total) * 100);
        return {
          name: it.menuItemName ?? it.menuItemId,
          delayRate,
          avgDelay: total === 0 ? 0 : Math.round((delayed > 0 ? (delayed / total) * 5 : 0)), // approximate avgDelay if not provided
          orders: total,
        };
      }).slice(0, 20); // cap for display
    }

    // fallback mock (your original)
    return [
      { name: "Phở bò tái", delayRate: 45, avgDelay: 12, orders: 156 },
      { name: "Bún chả", delayRate: 38, avgDelay: 10, orders: 134 },
      { name: "Cơm tấm sườn", delayRate: 32, avgDelay: 8, orders: 189 },
      { name: "Bánh mì thịt", delayRate: 28, avgDelay: 6, orders: 245 },
      { name: "Bún bò Huế", delayRate: 25, avgDelay: 7, orders: 98 },
      { name: "Gỏi cuốn", delayRate: 15, avgDelay: 4, orders: 167 },
    ];
  }, [items]);

  return (
    <div className="chart-container animate-fade-in" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Độ chính xác ETA của từng món ăn</h3>
        </div>
        <div className="flex items-center gap-1 text-warning">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs font-medium">{(items && items.length > 0) ? `${items.length} món` : "3 món cần chú ý"}</span>
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 20%, 88%)" horizontal={true} vertical={false} />
            <XAxis type="number" domain={[0, Math.max(50, ...data.map(d => d.delayRate))]} axisLine={false} tickLine={false} tick={{ fill: "hsl(25, 15%, 45%)", fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
            <YAxis type="category" dataKey="name"  interval={0} axisLine={false} tickLine={false} tick={{ fill: "hsl(25, 15%, 45%)", fontSize: 12 }} width={120} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(40, 20%, 92%)" }} />
            <Bar dataKey="delayRate" radius={[0, 4, 4, 0]} barSize={22}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.delayRate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-destructive" />
          <span className="text-xs text-muted-foreground">≥40% Nguy cấp</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-warning" />
          <span className="text-xs text-muted-foreground">30-39% Cảnh báo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-success" />
          <span className="text-xs text-muted-foreground">&lt;30% Tốt</span>
        </div>
      </div>
    </div>
  );
}