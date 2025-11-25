// src/components/vendor/utils.ts
import { api, ApiResponse } from "@/lib/api";

export type OrderWithDetailsDto = {
  id: string;
  code?: string;
  vendorId?: string;
  totalPrice?: number | null;
  status?: number | string | null;
  createdAt?: string;
  queueEntry?: {
    position?: number | null;
    joinedAt?: string | null;
    servedAt?: string | null;
    status?: number | string;
    estimatedServeTime?: string | null;
  } | null;
  details?: Array<{
    id?: string;
    menuItemId?: string;
    menuItemName?: string | null;
    quantity?: number | null;
    unitPrice?: number | null;
  }>;
};

export function unwrapOrders<T = OrderWithDetailsDto>(raw: any): T[] {
  if (Array.isArray(raw?.data)) return raw.data as T[];
  if (Array.isArray(raw)) return raw as T[];
  if (Array.isArray(raw?.data?.data)) return raw.data.data as T[];
  if (Array.isArray(raw?.data)) return raw.data as T[];
  return [];
}

export function uiStatusFromApi(s?: number | string | null) {
  if (typeof s === "number") {
    switch (s) {
      case 0:
        return "pending";
      case 4:
        return "confirmed";
      case 1:
      case 5:
        return "preparing";
      case 6:
        return "ready";
      case 2:
        return "completed";
      case 3:
        return "cancelled";
      default:
        return "pending";
    }
  }
  const t = (s || "").toString().toLowerCase();
  if (t === "pending") return "pending";
  if (t === "accepted" || t === "confirmed") return "confirmed";
  if (t === "processing" || t === "preparing") return "preparing";
  if (t === "ready") return "ready";
  if (t === "completed") return "completed";
  if (t === "cancelled") return "cancelled";
  return "pending";
}

export function mapOrderToQueueUi(o: OrderWithDetailsDto) {
  const ui = uiStatusFromApi(o.status as any);
  const uiForList = ui === "confirmed" ? "pending" : ui;
  return {
    id: o.id,
    position: o.queueEntry?.position ?? null,
    customer: "Khách hàng",
    items: (o.details || []).map((d) => {
      const qty = d.quantity ?? 0;
      const name = d.menuItemName || d.menuItemId || "";
      return qty > 1 ? `${qty} x ${name}` : name;
    }),
    status: uiForList as any,
    time: o.createdAt
      ? new Date(o.createdAt).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
    type: "walk-in",
    paymentStatus: "unpaid",
    paymentMethod: "cash",
  };
}

export async function updateOrderStatusOnServer(orderId: string | number, nextUiStatus: string) {
  const token = localStorage.getItem("accessToken") || "";
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const apiStatus = (s: string) => {
    switch (s) {
      case "pending":
        return 0;
      case "confirmed":
        return 4;
      case "processing":
        return 1;
      case "preparing":
        return 5;
      case "ready":
        return 6;
      case "completed":
        return 2;
      case "cancelled":
        return 3;
      default:
        return 0;
    }
  };

  const payload = {
    id: String(orderId),
    status: apiStatus(nextUiStatus),
  };

  return api.post<ApiResponse<any>>(
    `/api/order/${encodeURIComponent(String(orderId))}/status`,
    payload,
    headers
  );
}

export function formatCurrencyVND(v?: number) {
  if (typeof v !== "number" || Number.isNaN(v)) return "0";
  return v.toLocaleString("vi-VN");
}

export function buildMediaUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = (import.meta.env.VITE_S3_URL || "").replace(/\/+$/, "");
  return `${base}/${path.replace(/^\/+/, "")}`;
}