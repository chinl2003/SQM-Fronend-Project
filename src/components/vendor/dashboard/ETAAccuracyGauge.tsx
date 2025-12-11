// src/components/vendor/ETAAccuracyGauge.tsx
import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Target } from "lucide-react";

type MenuItemEtaAccuracyDto = {
  menuItemId: string;
  menuItemName?: string | null;
  totalOrderedCount: number;
  totalDelayedCount: number;
  accuracyPercent: number;
};

interface Props {
  items?: MenuItemEtaAccuracyDto[]; // lấy từ dto.menuItemEtaAccuracies
  loading?: boolean;
}

const DEFAULT_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#10b981", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#a78bfa", // violet
  "#ec4899", // pink
  "#9ca3af", // gray
];

function percentFmt(n: number) {
  return Math.round(n * 100) / 100;
}

export function ETAAccuracyGauge({ items = [], loading }: Props) {
  // filter only items that have delays
  const delayedItems = useMemo(
    () => (items || []).filter((i) => (i.totalDelayedCount ?? 0) > 0),
    [items]
  );

  const totalDelayed = useMemo(
    () => delayedItems.reduce((s, it) => s + (it.totalDelayedCount ?? 0), 0),
    [delayedItems]
  );

  const pieData = useMemo(() => {
    if (totalDelayed === 0) return [];
    return delayedItems.map((it) => {
      const value = it.totalDelayedCount ?? 0;
      const percent = totalDelayed === 0 ? 0 : (value / totalDelayed) * 100;
      return {
        name: it.menuItemName ?? it.menuItemId,
        id: it.menuItemId,
        value,
        percent: percentFmt(percent),
        raw: it,
      };
    });
  }, [delayedItems, totalDelayed]);

  const centerLabel = totalDelayed === 0 ? "0%" : `${percentFmt((delayedItems.reduce((s, it) => s + (it.totalDelayedCount ?? 0), 0) / Math.max(1, items.reduce((s, it) => s + (it.totalOrderedCount ?? 0), 0))) * 100)}%`;

  return (
    <div className="chart-container animate-fade-in" style={{ animationDelay: "0.3s" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Tỉ lệ trễ của các món</h3>
          <p className="text-sm text-muted-foreground">Phân bố phần trăm lượt món bị trễ trong ngày</p>
        </div>
      </div>

      <div className="relative h-[220px] flex items-center justify-center">
        {loading ? (
          <div className="text-sm text-muted-foreground">Đang tải dữ liệu...</div>
        ) : pieData.length === 0 ? (
          <div className="text-sm text-muted-foreground">Không có món bị trễ trong ngày.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                labelLine={false}
                label={(entry: any) => {
                  // show percent on slice (small)
                  const p = entry.percent;
                  return `${p}%`;
                }}
              >
                {pieData.map((entry, idx) => (
                  <Cell key={entry.id} fill={DEFAULT_COLORS[idx % DEFAULT_COLORS.length]} />
                ))}
              </Pie>

              <Tooltip
                formatter={(value: any, name: any, props: any) => {
                  // value is delayed count
                  const payload = props?.payload;
                  if (!payload) return [value, name];
                  return [`${value} lần trễ`, `${payload.name} — ${payload.percent}%`];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* center label */}
        {pieData.length > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-2xl font-bold">{totalDelayed}</div>
            <div className="text-xs text-muted-foreground">tổng lượt món trễ</div>
          </div>
        )}
      </div>

      {/* legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-border">
        {pieData.length === 0 ? (
          <div className="text-sm text-muted-foreground">Không có mục hiển thị.</div>
        ) : (
          pieData.map((d, idx) => (
            <div key={d.id} className="flex items-center gap-3">
              <div style={{ width: 12, height: 12, background: DEFAULT_COLORS[idx % DEFAULT_COLORS.length], borderRadius: 3 }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{d.name}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}