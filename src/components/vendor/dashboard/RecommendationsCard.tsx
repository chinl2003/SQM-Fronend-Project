// src/components/vendor/RecommendationsCard.tsx
import React from "react";
import { Lightbulb, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type DelayedMenuItem = {
  menuItemId: string;
  menuItemName?: string | null;
  delayedCount: number;
  totalOrderedCount: number;
  delayRatePercent: number;
};

type PreOrderSuggestionDto = {
  from: string; // "00:00"
  to: string; // "00:59"
  totalDelayedOrders: number;
  delayedMenuItems: DelayedMenuItem[];
};

interface Props {
  suggestions?: PreOrderSuggestionDto[]; // pass dto?.preOrderSuggestions
  loading?: boolean;
}

const fallback = [
  {
    id: "f1",
    title: "Thêm Pre-order slot 11:30–12:00",
    description:
      "Giờ cao điểm có 62 đơn với thời gian chờ 25 phút. Pre-order có thể giảm 40% thời gian chờ.",
    impact: "high",
    action: "Kích hoạt ngay",
  },
  {
    id: "f2",
    title: "Tối ưu món Phở bò tái",
    description:
      "Tỷ lệ trễ 45%. Đề xuất: chuẩn bị sẵn nguyên liệu, tăng số lượng nồi nước dùng.",
    impact: "high",
    action: "Xem chi tiết",
  },
];

export function RecommendationsCard({ suggestions, loading }: Props) {
  // If API provided preOrder suggestions, convert them to displayable items.
  const list =
    suggestions && suggestions.length > 0
      ? suggestions.map((s, idx) => {
          // build items summary containing only menu item names (no counts/percent)
          const items = s.delayedMenuItems ?? [];
          const names =
            items.length === 0
              ? "Không có món cụ thể"
              : items
                  .slice(0, 3)
                  .map((it) => `${it.menuItemName ?? it.menuItemId}`)
                  .join(", ") + (items.length > 3 ? ` +${items.length - 3} khác` : "");

          // priority classification based on totalDelayedOrders
          const impact =
            s.totalDelayedOrders >= 5 ? "high" : s.totalDelayedOrders >= 2 ? "medium" : "low";

          return {
            id: `${s.from}-${s.to}-${idx}`,
            title: `Gợi ý Pre-order ${s.from}–${s.to}`,
            // description now contains only item names summary (no numeric details)
            description: `Phát hiện ${s.totalDelayedOrders} đơn trễ trong khung ${s.from}–${s.to}. Món: ${names}.`,
            impact,
            action: "Xem chi tiết",
            raw: s,
          };
        })
      : fallback;

  const impactStyles: Record<string, string> = {
    high: "bg-[#FFE5E2] text-[#E0523C]",
    medium: "bg-[#FFF1CC] text-[#C57A00]",
    low: "bg-[#E3F7D9] text-[#2C7A1F]",
  };

  const impactLabel = (imp: string) =>
    imp === "high" ? "Ưu tiên cao" : imp === "medium" ? "Ưu tiên TB" : "Ưu tiên thấp";

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-[#FFF6EE] flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-[#FF7A1A]" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#1F130A]">Đề xuất cải thiện</h3>
          <p className="text-xs text-[#9C6A3C]">Dựa trên phân tích dữ liệu</p>
        </div>
      </div>

      <div className="space-y-3">
        {list.map((rec) => {
          const impact = (rec as any).impact ?? "medium";

          return (
            <div
              key={rec.id}
              className="flex items-start gap-3 rounded-2xl bg-[#FFF6EE] border border-[#FFE0CC] shadow-sm px-4 py-3 border-l-4 border-l-[#FF7A1A]"
            >
              <div className="mt-1">
                <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#FF7A1A]" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-medium text-sm text-[#3A2617]">{rec.title}</h4>
                  <span
                    className={`px-2 py-[2px] rounded-full text-[11px] font-medium ${impactStyles[impact]}`}
                  >
                    {impactLabel(impact)}
                  </span>
                </div>

                {/* description shows only item names (no numeric details) */}
                <p className="text-xs text-[#9C6A3C] mb-2">{rec.description}</p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-0 text-xs font-medium text-[#FF7A1A] hover:text-[#E56412] hover:bg-[#FFE6D6]"
                    onClick={() => {
                      if ((rec as any).raw) console.log("Open detail for suggestion", (rec as any).raw);
                    }}
                  >
                    {rec.action} <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>

                  {/* quick info badge: totalDelayedOrders (kept as a small badge) */}
                  {/* @ts-ignore */}
                  {(rec as any).raw && (rec as any).raw.totalDelayedOrders > 0 && (
                    <div className="text-xs text-muted-foreground px-2 py-1 rounded bg-white/50 border">
                      {/* @ts-ignore */}
                      {(rec as any).raw.totalDelayedOrders} đơn trễ
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}