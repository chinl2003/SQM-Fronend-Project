// src/components/vendor/RecommendationsCard.tsx
import React, {
  useMemo,
  useState,
  useEffect, // NEW
  useRef, // NEW
} from "react";
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
  from: string;
  to: string;
  totalDelayedOrders: number;
  delayedMenuItems: DelayedMenuItem[];
};

interface Props {
  vendorId: string;
  suggestions?: PreOrderSuggestionDto[];
  loading?: boolean;
}

/* ================= NEW TYPES ================= */

type MenuItemFromApi = {
  id: string;
  name: string;
};

/* ================= COMPONENT ================= */

export function RecommendationsCard({ vendorId, suggestions, loading }: Props) {
  /* ================= ORIGINAL LOGIC (UNCHANGED) ================= */

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
                  .join(", ") +
                (items.length > 3 ? ` +${items.length - 3} khác` : "");

          const impact =
            s.totalDelayedOrders >= 5
              ? "high"
              : s.totalDelayedOrders >= 2
              ? "medium"
              : "low";

          return {
            id: `${s.from}-${s.to}-${idx}`,
            title: `Gợi ý Bật đặt trước cho khung giờ ${s.from}–${s.to}`,
            description: `Phát hiện ${s.totalDelayedOrders} đơn trễ trong khung ${s.from}–${s.to}. Món: ${names}.`,
            impact,
            action: "Bật đặt trước",
            raw: s,
          };
        })
      : [];

  const impactStyles: Record<string, string> = {
    high: "bg-[#FFE5E2] text-[#E0523C]",
    medium: "bg-[#FFF1CC] text-[#C57A00]",
    low: "bg-[#E3F7D9] text-[#2C7A1F]",
  };

  const impactLabel = (imp: string) =>
    imp === "high"
      ? "Ưu tiên cao"
      : imp === "medium"
      ? "Ưu tiên TB"
      : "Ưu tiên thấp";

  /* ================= MODAL STATE ================= */

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] =
    useState<PreOrderSuggestionDto | null>(null);
  const [quantity, setQuantity] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  /* ================= NEW STATE FOR MENU SELECT ================= */

  const [menuItems, setMenuItems] = useState<MenuItemFromApi[]>([]); // NEW
  const [selectedMenuItemIds, setSelectedMenuItemIds] = useState<string[]>([]); // NEW
  const [openMenuDropdown, setOpenMenuDropdown] = useState(false); // NEW
  const menuDropdownRef = useRef<HTMLDivElement | null>(null); // NEW

  /* ================= OPEN MODAL ================= */

  const openConfirm = (s: any) => {
    setActiveSuggestion(s.raw ?? null);
    setQuantity("");
    // NEW: preset selected = suggested items
    setSelectedMenuItemIds(
      (s.raw?.delayedMenuItems || []).map((it: any) => it.menuItemId)
    );
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (saving) return;
    setConfirmOpen(false);
    setActiveSuggestion(null);
    setQuantity("");
    setOpenMenuDropdown(false); // NEW
  };

  /* ================= FETCH MENU ITEMS (NEW, LOGIC ONLY) ================= */

  useEffect(() => {
    if (!vendorId) return;

    const fetchMenuItems = async () => {
      try {
        const token = localStorage.getItem("accessToken") || "";
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        const res = await api.get(
          `/api/menuitem/by-vendor/${vendorId}`,
          headers
        );

        const payload = (res as any)?.data ?? res;
        const data = payload?.data ?? payload;

        setMenuItems(
          data?.map((it: any) => ({
            id: it.id,
            name: it.name || "Món không tên",
          })) || []
        );
      } catch (err) {
        console.error(err);
      }
    };

    fetchMenuItems();
  }, [vendorId]);

  /* ================= CLICK OUTSIDE CLOSE (NEW) ================= */

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        menuDropdownRef.current &&
        !menuDropdownRef.current.contains(e.target as Node)
      ) {
        setOpenMenuDropdown(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ================= CONFIRM ================= */

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
      MenuItemIds: selectedMenuItemIds, // NEW
      MaxQuantity: q,
    };

    try {
      setSaving(true);
      const token = localStorage.getItem("accessToken") || "";
      const headers = token
        ? { Authorization: `Bearer ${token}` }
        : undefined;

      await api.post(
        `/api/vendor-preorder/${encodeURIComponent(
          vendorId
        )}/configs/create`,
        payload,
        headers
      );

      toast.success("Bật đặt trước thành công.");
      closeConfirm();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi lưu cấu hình đặt trước.");
    } finally {
      setSaving(false);
    }
  };

  /* ================= DERIVED (ORIGINAL IDEA, ADAPTED) ================= */

  const activeItemNames = useMemo(() => {
    return selectedMenuItemIds.map((id) => {
      const fromMenu = menuItems.find((m) => m.id === id);
      const fromSuggest = activeSuggestion?.delayedMenuItems.find(
        (x) => x.menuItemId === id
      );
      return fromMenu?.name || fromSuggest?.menuItemName || id;
    });
  }, [selectedMenuItemIds, menuItems, activeSuggestion]);

  /* ================= UI ================= */

  return (
    <>
      {/* ===== ORIGINAL LIST UI (UNCHANGED) ===== */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-[#FFF6EE] flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-[#FF7A1A]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1F130A]">
              Đề xuất cải thiện
            </h3>
            <p className="text-xs text-[#9C6A3C]">
              Dựa trên phân tích dữ liệu
            </p>
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
                    <h4 className="font-medium text-sm text-[#3A2617]">
                      {rec.title}
                    </h4>
                    <span
                      className={`px-2 py-[2px] rounded-full text-[11px] font-medium ${impactStyles[impact]}`}
                    >
                      {impactLabel(impact)}
                    </span>
                  </div>

                  <p className="text-xs text-[#9C6A3C] mb-2">
                    {rec.description}
                  </p>

                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 px-3 text-xs font-medium bg-[#FF7A1A] text-white hover:bg-[#E56412]"
                    onClick={() => openConfirm(rec)}
                    disabled={loading}
                  >
                    Bật đặt trước
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== MODAL ===== */}
      <Dialog open={confirmOpen} onOpenChange={(v) => (v ? null : closeConfirm())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Xác nhận bật đặt trước</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <div className="text-sm text-muted-foreground mb-3">
              Bạn sắp bật tính năng <strong>Đặt trước</strong> cho khung{" "}
              <strong>
                {activeSuggestion
                  ? `${activeSuggestion.from}–${activeSuggestion.to}`
                  : "—"}
              </strong>
              .
            </div>

            {/* ===== ONLY MODIFIED BLOCK ===== */}
            <div className="mb-3" ref={menuDropdownRef}>
              <div className="text-sm font-medium mb-1">
                Các món sẽ được áp dụng
              </div>

              <div
                className="min-h-[36px] px-2 py-1 rounded border bg-slate-50 cursor-pointer flex flex-wrap gap-1 items-center"
                onClick={() => setOpenMenuDropdown((v) => !v)}
              >
                {activeItemNames.length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    Không có món cụ thể
                  </span>
                ) : (
                  activeItemNames.map((n, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2 py-0.5 rounded-full border bg-white text-xs"
                    >
                      {n}
                    </span>
                  ))
                )}
              </div>

              {openMenuDropdown && (
                <div className="mt-1 rounded border bg-white shadow max-h-60 overflow-y-auto text-sm">
                  {menuItems.map((mi) => {
                    const checked = selectedMenuItemIds.includes(mi.id);
                    return (
                      <div
                        key={mi.id}
                        className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-100 cursor-pointer"
                        onClick={() =>
                          setSelectedMenuItemIds((prev) =>
                            checked
                              ? prev.filter((x) => x !== mi.id)
                              : [...prev, mi.id]
                          )
                        }
                      >
                        <span>{mi.name}</span>
                        {checked && <span className="text-xs">✓</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* ===== END MODIFIED BLOCK ===== */}

            <div>
              <div className="text-sm font-medium mb-1">
                Số lượng tối đa cho khung này
              </div>
              <Input
                type="number"
                placeholder="Ví dụ: 10"
                value={quantity === "" ? "" : String(quantity)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") return setQuantity("");
                  const n = Number(v);
                  if (!Number.isNaN(n))
                    setQuantity(Math.max(0, Math.floor(n)));
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeConfirm} disabled={saving}>
              Hủy
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={saving || quantity === ""}
            >
              {saving ? "Đang lưu..." : "Xác nhận bật đặt trước"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}