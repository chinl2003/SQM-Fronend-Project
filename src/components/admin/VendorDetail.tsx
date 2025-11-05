import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingBag,
  MapPin,
  Clock,
  Phone,
  Mail,
  FileText,
  CreditCard,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  Menu as MenuIcon,
  ImageIcon,
  UtensilsCrossed,
  Timer,
  Package,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, ApiResponse } from "@/lib/api";

// ==== Types (theo API mới) ====
type VendorDetailModel = {
  id: string;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  openingHours?: string;
  businessTypeId?: string;
  status?: number | string;
  createdTime?: string;
  logoUrl?: string;
  businessLicenseUrl?: string;
  foodSafetyCertUrl?: string;
  personalIdentityNumber?: string;
  personalIdentityFront?: string;
  personalIdentityBack?: string;
  bankBin?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  invoiceInfo?: string | null;
  paymentMethod?: number;
  averageRating?: number;
};

type MenuItemResponse = {
  id: string;
  name?: string;
  description?: string;
  price?: number | null;
  quantity?: number | null;
  active?: boolean | null;
  code?: string | null;
  prepTime?: number | null; // minutes
  vendorId?: string;
  typeOfFood?: string | null;
  imageUrl?: string | null;
};

type VendorWithMenuResponse = {
  vendor: VendorDetailModel;
  menuItems: MenuItemResponse[];
};

interface VendorDetailProps {
  vendor: { id: string; name?: string } | null;
  onClose: () => void;
  onApprove: (vendorId: string) => Promise<void>;
  onReject: (vendorId: string) => void;
}

// ---- Helpers ----
const STATUS_NUM_TO_TEXT: Record<
  number,
  | "rejected"
  | "indebt"
  | "draft"
  | "approved"
  | "pendingreview"
  | "menupending"
  | "suspended"
  | "closurerequested"
> = {
  0: "draft",
  1: "pendingreview",
  2: "approved",
  3: "rejected",
  4: "menupending",
  5: "indebt",
  6: "closurerequested",
  7: "suspended",
};

function normalizeStatus(s?: number | string) {
  if (typeof s === "number") return STATUS_NUM_TO_TEXT[s] ?? "";
  if (typeof s === "string") return s.toLowerCase();
  return "";
}

const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    const m = iso.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return iso;
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

function buildMediaUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  return `${base}/${(path || "").replace(/^\/+/, "")}`;
}

function priceVN(n?: number | null) {
  if (n == null) return "—";
  return `${n.toLocaleString("vi-VN")} đ`;
}

function minutes(n?: number | null) {
  if (n == null) return "—";
  return `${Math.round(n)} phút`;
}

function qty(n?: number | null) {
  if (n == null) return "—";
  return n.toLocaleString("vi-VN");
}

function StatusBadge({ status }: { status?: string }) {
  const s = status;
  if (s === "approved")
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
        Đã duyệt
      </Badge>
    );
  if (s === "pendingreview")
    return (
      <Badge className="bg-amber-500 hover:bg-amber-500 text-white">
        Chờ duyệt
      </Badge>
    );
  if (s === "rejected")
    return (
      <Badge className="bg-rose-600 hover:bg-rose-600 text-white">
        Đã từ chối
      </Badge>
    );
  if (s === "menupending")
    return (
      <Badge className="bg-sky-600 hover:bg-sky-600 text-white">
        Chờ cấp phép
      </Badge>
    );
  if (s === "indebt")
    return (
      <Badge className="bg-orange-600 hover:bg-orange-600 text-white">
        Đang nợ
      </Badge>
    );
  if (s === "closurerequested")
    return (
      <Badge className="bg-orange-500 hover:bg-orange-500 text-white">
        Yêu cầu đóng
      </Badge>
    );
  if (s === "suspended")
    return (
      <Badge className="bg-zinc-600 hover:bg-zinc-600 text-white">
        Tạm khóa
      </Badge>
    );
  return <Badge variant="secondary">—</Badge>;
}

const cardBase =
  "border border-primary/25 bg-primary/5 " +
  "transition-shadow duration-200 transform-gpu [will-change:transform] " +
  "hover:shadow-lg hover:ring-1 hover:ring-primary/20";

const VendorDetail = ({
  vendor,
  onClose,
  onApprove,
  onReject,
}: VendorDetailProps) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<VendorDetailModel | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemResponse[]>([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approving, setApproving] = useState(false);

  // ---- Fetch vendor + menu by id (API mới) ----
  useEffect(() => {
    let mounted = true;
    async function fetchDetail() {
      if (!vendor?.id) return;
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken") || "";
        const res = await api.get<ApiResponse<VendorWithMenuResponse>>(
          `/api/vendor/${vendor.id}`,
          token ? { Authorization: `Bearer ${token}` } : undefined
        );

        const payload = (res?.data as any) ?? res;
        const data: VendorWithMenuResponse =
          (payload?.data as VendorWithMenuResponse) ??
          (payload as VendorWithMenuResponse);

        if (!mounted) return;
        setDetail(data?.vendor ?? null);
        setMenuItems(Array.isArray(data?.menuItems) ? data.menuItems : []);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDetail();
    return () => {
      mounted = false;
    };
  }, [vendor?.id]);

  // ---- UI states ----
  const statusText = normalizeStatus(detail?.status);
  const isPending = statusText === "pendingreview";
  const isApproved = statusText === "approved";
  const isMenuPending = statusText === "menupending";

  // demo fee
  const MONTHLY_FEE = 500000;
  const SLOT_FEE = 500000;

  const paymentStatusBadge = useMemo(() => {
    if (isApproved) {
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          Đã thanh toán
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500 hover:bg-amber-500 text-white">
        <Clock className="w-3 h-3 mr-1" />
        Chờ thanh toán
      </Badge>
    );
  }, [isApproved]);

  // ---- Group menu theo TypeOfFood ----
  const groupedMenu = useMemo(() => {
    const map = new Map<string, MenuItemResponse[]>();
    for (const it of menuItems) {
      const key = (it.typeOfFood || "Khác").trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return Array.from(map.entries()); // [ [type, items], ... ]
  }, [menuItems]);

  // ---- Confirm approve from modal ----
  const handleApprovalConfirm = async () => {
    if (!detail?.id) return;
    try {
      setApproving(true);
      await onApprove(detail.id);
      setShowApprovalModal(false);
      onClose();
    } finally {
      setApproving(false);
    }
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden">
                {detail?.logoUrl ? (
                  <img
                    src={buildMediaUrl(detail.logoUrl)}
                    alt={detail?.name || "logo"}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <ShoppingBag className="w-5 h-5 text-primary" />
                )}
              </div>
              {loading ? "Đang tải..." : `${detail?.name ?? vendor?.name ?? ""}`}
            </DialogTitle>
            <DialogDescription>
              Thông tin đăng ký, trạng thái thanh toán và thực đơn của quán
            </DialogDescription>
          </DialogHeader>

          {/* ==== BODY ==== */}
          <div className="grid gap-6">
            {/* Payment card */}
            <Card
              className="border border-amber-300 bg-amber-50 
                transition-shadow duration-200 transform-gpu [will-change:transform]
                hover:shadow-lg hover:ring-1 hover:ring-amber-300/60"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Trạng thái Thanh toán
                  </span>
                  {paymentStatusBadge}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Phí thuê slot:</span>
                    <span className="font-semibold">
                      {SLOT_FEE.toLocaleString("vi-VN")}đ
                      {isApproved && (
                        <CheckCircle className="w-4 h-4 text-success inline ml-2" />
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí sàn tháng này:</span>
                    <span className="font-semibold">
                      {MONTHLY_FEE.toLocaleString("vi-VN")}đ
                      {isApproved && (
                        <CheckCircle className="w-4 h-4 text-success inline ml-2" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Ngày thanh toán tiếp theo:</span>
                    <span className="font-semibold flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {fmtDate(detail?.createdTime)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2 cột thông tin */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card className={cardBase}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Thông tin Cơ bản
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Tên thương hiệu
                    </label>
                    <p className="font-semibold">{detail?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Địa chỉ hoạt động
                    </label>
                    <p className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {detail?.address || "—"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Loại hình
                      </label>
                      <p>{detail?.businessTypeId || "—"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Giờ hoạt động
                      </label>
                      <p className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {detail?.openingHours || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{detail?.phone || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{detail?.email || "—"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Legal Information */}
              <Card className={cardBase}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Thông tin Pháp lý
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Số giấy tờ chủ quán
                    </label>
                    <p className="font-semibold">
                      {detail?.personalIdentityNumber || "—"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        GPKD
                      </label>
                      <div className="w-full h-28 bg-muted rounded flex items-center justify-center overflow-hidden">
                        {detail?.businessLicenseUrl ? (
                          <img
                            src={buildMediaUrl(detail.businessLicenseUrl)}
                            alt="business-license"
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        VSATTP
                      </label>
                      <div className="w-full h-28 bg-muted rounded flex items-center justify-center overflow-hidden">
                        {detail?.foodSafetyCertUrl ? (
                          <img
                            src={buildMediaUrl(detail.foodSafetyCertUrl)}
                            alt="food-safety"
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        CCCD (mặt trước)
                      </label>
                      <div className="w-full h-28 bg-muted rounded flex items-center justify-center overflow-hidden">
                        {detail?.personalIdentityFront ? (
                          <img
                            src={buildMediaUrl(detail.personalIdentityFront)}
                            alt="id-front"
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        CCCD (mặt sau)
                      </label>
                      <div className="w-full h-28 bg-muted rounded flex items-center justify-center overflow-hidden">
                        {detail?.personalIdentityBack ? (
                          <img
                            src={buildMediaUrl(detail.personalIdentityBack)}
                            alt="id-back"
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status */}
              <Card className={cardBase}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Trạng thái hồ sơ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Trạng thái</span>
                    <StatusBadge status={statusText} />
                  </div>
                  <Separator />
                  <div className="text-sm text-muted-foreground">
                    Ngày tạo: {fmtDate(detail?.createdTime)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ===== Danh sách thực đơn (chỉ hiển thị nếu có) ===== */}
            {groupedMenu.length > 0 && (
              <Card className="border border-primary/20 bg-background">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5" />
                    Danh sách thực đơn
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {groupedMenu.map(([type, items]) => (
                    <div key={type} className="space-y-4">
                      {/* Header nhóm */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-sm">
                            {type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {items.length} món
                          </span>
                        </div>
                      </div>

                      {/* Grid item cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((it) => (
                          <div
                            key={it.id}
                            className="rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                          >
                            {/* Ảnh ở trên */}
                            <div className="w-full h-40 bg-muted flex items-center justify-center overflow-hidden">
                              {it.imageUrl ? (
                                <img
                                  src={buildMediaUrl(it.imageUrl)}
                                  alt={it.name || "menu-item"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex flex-col items-center text-muted-foreground">
                                  <ImageIcon className="w-6 h-6 mb-2" />
                                  <span className="text-xs">Chưa có hình</span>
                                </div>
                              )}
                            </div>

                            {/* Nội dung */}
                            <div className="p-4 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold line-clamp-2">
                                  {it.name || "—"}
                                </h4>
                                {it.active ? (
                                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
                                    Hoạt động
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Tạm tắt</Badge>
                                )}
                              </div>

                              <Separator />

                              <div className="text-sm grid grid-cols-1 gap-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">
                                    Giá bán
                                  </span>
                                  <span className="font-medium">
                                    {priceVN(it.price)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Timer className="w-4 h-4" />
                                    Thời gian chế biến
                                  </span>
                                  <span className="font-medium">
                                    {minutes(it.prepTime)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Package className="w-4 h-4" />
                                    Số lượng mỗi ngày
                                  </span>
                                  <span className="font-medium">
                                    {qty(it.quantity)}
                                  </span>
                                </div>
                              </div>

                              {it.description && (
                                <>
                                  <Separator className="my-2" />
                                  <p className="text-sm text-muted-foreground line-clamp-3">
                                    {it.description}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Footer actions */}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>

            {isPending && detail?.id && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => onReject(detail.id)}
                  disabled={approving}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Từ chối
                </Button>
                <Button
                  onClick={() => setShowApprovalModal(true)}
                  disabled={approving}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Xét duyệt
                </Button>
              </>
            )}

            {isApproved && (
              <Button disabled={approving}>
                <MenuIcon className="w-4 h-4 mr-2" />
                Yêu cầu cập nhật Menu
              </Button>
            )}

            {isMenuPending && (
              <Button disabled={approving}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Phê duyệt hoạt động
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Confirmation Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận Xét duyệt</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xét duyệt quán "{detail?.name}" không?
              <br />
              Sau khi xét duyệt, quán này sẽ được yêu cầu cập nhật menu để hoạt
              động.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalModal(false)}
              disabled={approving}
            >
              Hủy
            </Button>
            <Button onClick={handleApprovalConfirm} disabled={approving}>
              {approving ? "Đang duyệt..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VendorDetail;