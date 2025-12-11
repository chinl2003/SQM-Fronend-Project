// src/components/vendor/RecommendationsCard.tsx
import React, { useMemo, useState } from "react";
import { Lightbulb, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, ApiResponse } from "@/lib/api";
import { toast } from "sonner";

type DelayedMenuItem = {
  menuItemId: string;
  menuItemName?: string | null;
  delayedCount: number;
  totalOrderedCount: number;
  delayRatePercent: number;
};

export type PreOrderSuggestionDto = {
  from: string; // "00:00"
  to: string; // "00:59"
  totalDelayedOrders: number;
  delayedMenuItems: DelayedMenuItem[];
};

interface Props {
  vendorId: string; // <-- IMPORTANT: caller must pass vendorId
  suggestions?: PreOrderSuggestionDto[]; // pass dto?.preOrderSuggestions
  loading?: boolean;
}

const fallback = [
  {
    id: "f1",
    title: "Đặt trước cho  slot 11:30–12:00",
    description:
      "Giờ cao điểm có 62 đơn với thời gian chờ 25 phút. Pre-order có thể giảm 40% thời gian chờ.",
    impact: "high",
    action: "Bật đặt trước",
  },
  {
    id: "f2",
    title: "Tối ưu món Phở bò tái",
    description:
      "Tỷ lệ trễ 45%. Đề xuất: chuẩn bị sẵn nguyên liệu, tăng số lượng nồi nước dùng.",
    impact: "high",
    action: "Bật đặt trước",
  },
];

export function RecommendationsCard({ vendorId, suggestions, loading }: Props) {
  // map suggestions -> displayable list
  const list =
    suggestions && suggestions.length > 0
      ? suggestions.map((s, idx) => {
          const items = s.delayedMenuItems ?? [];
          const names =
            items.length === 0
              ? "Không có món cụ thể"
              : items
                  .slice(0, 3)
                  .map((it) => `${it.menuItemName ?? it.menuItemId}`)
                  .join(", ") + (items.length > 3 ? ` +${items.length - 3} khác` : "");

          const impact =
            s.totalDelayedOrders >= 5 ? "high" : s.totalDelayedOrders >= 2 ? "medium" : "low";

          return {
            id: `${s.from}-${s.to}-${idx}`,
            title: `Gợi ý Bật đặt trước cho khung giờ ${s.from}–${s.to}`,
            description: `Phát hiện ${s.totalDelayedOrders} đơn trễ trong khung ${s.from}–${s.to}. Món: ${names}.`,
            impact,
            action: "Bật đặt trước",
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

  // modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<PreOrderSuggestionDto | null>(null);
  const [quantity, setQuantity] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  const openConfirm = (s: any) => {
    setActiveSuggestion(s.raw ?? null);
    setQuantity("");
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (saving) return;
    setConfirmOpen(false);
    setActiveSuggestion(null);
    setQuantity("");
  };

  const handleConfirm = async () => {
    if (!activeSuggestion) return;
    if (!vendorId) {
      toast.error("Thiếu vendorId. Không thể bật đặt trước.");
      return;
    }
    const q = Number(quantity);
    if (!Number.isFinite(q) || q <= 0) {
      toast.error("Vui lòng nhập Số lượng hợp lệ (>0).");
      return;
    }

    const payload = {
      StartTime: activeSuggestion.from,
      EndTime: activeSuggestion.to,
      MenuItemIds: (activeSuggestion.delayedMenuItems || []).map((it) => it.menuItemId),
      MaxQuantity: q,
    };

    try {
      setSaving(true);
      const token = localStorage.getItem("accessToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      // gọi API
      const res = await api
        .post(`/api/vendor-preorder/${encodeURIComponent(vendorId)}/configs/create`, payload, headers)
        .catch((e) => {
          console.error("API call failed:", e);
          return e?.response ?? null; // axios: e.response chứa response payload
        });

      // Normalize payload & metadata
      // Two common cases:
      // 1) res is axios response -> res.status, res.data (payload)
      // 2) res is already payload -> res (payload)
      const httpStatus = (res && (res as any).status) ?? null;
      const payloadBody = (res && (res as any).data) ?? res;

      // Debug logs (useful when things go wrong)
      console.debug("CreateConfig response:", { httpStatus, payloadBody });

      // Determine success using several heuristics
      const success =
        httpStatus === 200 ||
        (payloadBody && (payloadBody.statusCode === 200 || (typeof payloadBody.code === "string" && payloadBody.code.toLowerCase().includes("success")))) ||
        (!!payloadBody && !!payloadBody.data && (payloadBody.data.id || Object.keys(payloadBody.data).length > 0));

      if (success) {
        toast.success("Bật đặt trước thành công.");
        // optional: you may want to refresh parent report here
        setConfirmOpen(false);
        setActiveSuggestion(null);
        setQuantity("");
        return;
      }

      // Not success — try extract message
      const msg =
        (payloadBody && (payloadBody.message || payloadBody.msg || (payloadBody as any).error)) ||
        "Không thể tạo cấu hình đặt trước.";
      toast.error(msg);
      console.warn("CreateConfig was not successful, response:", payloadBody);
    } catch (err) {
      console.error("Unexpected error when creating pre-order config:", err);
      toast.error("Lỗi khi lưu cấu hình đặt trước.");
    } finally {
      setSaving(false);
    }
  };

  // derived list of menu item names for active suggestion
  const activeItemNames = useMemo(() => {
    if (!activeSuggestion) return [];
    return (activeSuggestion.delayedMenuItems || []).map((it) => it.menuItemName ?? it.menuItemId);
  }, [activeSuggestion]);

  return (
    <>
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
                    <span className={`px-2 py-[2px] rounded-full text-[11px] font-medium ${impactStyles[impact]}`}>
                      {impactLabel(impact)}
                    </span>
                  </div>

                  {/* description shows only item names (no numeric details) */}
                  <p className="text-xs text-[#9C6A3C] mb-2">{rec.description}</p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 px-3 text-xs font-medium bg-[#FF7A1A] text-white hover:bg-[#E56412]"
                      onClick={() => openConfirm(rec)}
                      disabled={loading}
                    >
                      Bật đặt trước
                    </Button>

                    {/* quick info badge: totalDelayedOrders */}
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

      {/* Confirm modal */}
      <Dialog open={confirmOpen} onOpenChange={(v) => (v ? null : closeConfirm())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Xác nhận bật đặt trước</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <div className="text-sm text-muted-foreground mb-3">
              Bạn sắp bật tính năng <strong>Đặt trước</strong> cho khung{" "}
              <strong>{activeSuggestion ? `${activeSuggestion.from}–${activeSuggestion.to}` : "—"}</strong>.
            </div>

            <div className="mb-3">
              <div className="text-sm font-medium mb-1">Các món sẽ được áp dụng</div>
              <div className="space-y-1">
                {activeItemNames.length === 0 ? (
                  <div className="text-xs text-muted-foreground">Không có món cụ thể</div>
                ) : (
                  activeItemNames.map((n, i) => (
                    <div key={i} className="text-sm px-2 py-1 rounded bg-slate-50 border">
                      {n}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Số lượng tối đa cho khung này</div>
              <Input
                type="number"
                placeholder="Ví dụ: 10"
                value={quantity === "" ? "" : String(quantity)}
                onChange={(e) => {
                  const v = e.target.value;
                  // allow empty or positive integer
                  if (v === "") return setQuantity("");
                  const n = Number(v);
                  if (Number.isNaN(n)) return;
                  setQuantity(Math.max(0, Math.floor(n)));
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={closeConfirm} disabled={saving}>
                Hủy
              </Button>
              <Button onClick={handleConfirm} disabled={saving || !activeSuggestion || quantity === ""}>
                {saving ? "Đang lưu..." : "Xác nhận bật đặt trước"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}