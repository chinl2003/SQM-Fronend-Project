import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle, XCircle, Pause, Eye, Search,
  ShoppingBag, MapPin, Star, Users, DollarSign,
  AlertTriangle, Clock, Menu
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import VendorDetail from "@/components/admin/VendorDetail";
import { api, ApiResponse } from "@/lib/api";
import { toast } from "sonner";

type Vendor = {
  id: string;
  name: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  averageRating?: number;
  queueCount?: number | null;
  allowPreorder?: boolean;
  status?: number | string; 
  createdTime?: string;
  type?: string;
  location?: string;
  customers?: number;
  revenue?: string;
  joinDate?: string;
  slotFeePaid?: boolean;
  monthlyFeeStatus?: "paid" | "pending" | "overdue";
  outstandingAmount?: number;
  logoUrl?: string;
};

type PaginatedList<T> = {
  items?: T[];
  data?: T[];
  totalCount?: number;
  totalRecords?: number;
  totalPages?: number;
  pageNumber?: number;
  page?: number;
  pageSize?: number;
  hasPrevious?: boolean;
  hasPreviousPage?: boolean;
  hasNext?: boolean;
  hasNextPage?: boolean;
};

const STATUS_MAP = {
  active: "Approved",
  pending: "PendingReview",
  menu_pending: "MenuPending",
  debt: "InDebt",
  closure: "ClosureRequested",
} as const;

const STATUS_NUM_TO_TEXT: Record<
  number,
  | "rejected"
  | "inDebt"
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
  5: "inDebt",
  6: "closurerequested",
  7: "suspended",
};

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 20;

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

function normalizeStatus(s: Vendor["status"]): string {
  if (typeof s === "number") return STATUS_NUM_TO_TEXT[s] ?? "";
  if (typeof s === "string") return s.toLowerCase();
  return "";
}

function extractVendorsFromResponse(res: any): { list: Vendor[]; page: number | undefined; total: number | undefined } {
 
  const outer = res?.data ?? res; 
  const maybeArray =
    (Array.isArray(outer) && outer) ||
    (Array.isArray(outer?.data) && outer.data) ||
    (Array.isArray(outer?.items) && outer.items) ||
    (Array.isArray(outer?.data?.data) && outer.data.data) ||
    (Array.isArray(outer?.data?.items) && outer.data.items) ||
    [];

  const page =
    outer?.pageNumber ??
    outer?.page ??
    outer?.data?.pageNumber ??
    outer?.data?.page;

  const total =
    outer?.totalCount ??
    outer?.totalRecords ??
    outer?.data?.totalCount ??
    outer?.data?.totalRecords;

  return { list: maybeArray as Vendor[], page, total };
}

const VendorManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [activeTab, setActiveTab] = useState<
    "active" | "pending" | "menu_pending" | "debt" | "closure"
  >("pending");

  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [pageNumber, setPageNumber] = useState(DEFAULT_PAGE);
  const [pageSize] = useState(DEFAULT_SIZE);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);

  async function fetchVendorsByStatus(tab: typeof activeTab, page = DEFAULT_PAGE) {
    try {
      setLoading(true);

      const statusParam = STATUS_MAP[tab] ?? undefined;
      const url = `/api/vendor/by-status?${new URLSearchParams({
        ...(statusParam ? { status: statusParam } : {}),
        pageNumber: String(page),
        pageSize: String(pageSize),
      }).toString()}`;

      const token = localStorage.getItem("accessToken") || "";
      const res = await api.get<ApiResponse<PaginatedList<Vendor>>>(
        url,
        token ? { Authorization: `Bearer ${token}` } : undefined
      );
      const { list, page: pn, total } = extractVendorsFromResponse(res);
      setVendors(list);
      setPageNumber(typeof pn === "number" ? pn : page);
      setTotalCount(typeof total === "number" ? total : undefined);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Không tải được danh sách vendor.");
      setVendors([]);
      setTotalCount(undefined);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVendorsByStatus(activeTab, DEFAULT_PAGE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const filtered = useMemo(() => {
    if (!searchTerm) return vendors;
    const key = searchTerm.toLowerCase();
    return vendors.filter((v) =>
      (v.name ?? "").toLowerCase().includes(key) ||
      (v.type ?? "").toLowerCase().includes(key) ||
      (v.address ?? v.location ?? "").toLowerCase().includes(key)
    );
  }, [vendors, searchTerm]);

  const handleApprove = async (vendorId: string) => {
    try {
      toast.success("Duyệt quán thành công!");
      fetchVendorsByStatus(activeTab, pageNumber);
    } catch (e) {
      toast.error(e?.message || "Duyệt thất bại");
    }
  };

  const handleReject = async (vendorId: string) => {
    try {
      toast.success("Đã từ chối quán!");
      fetchVendorsByStatus(activeTab, pageNumber);
    } catch (e) {
      toast.error(e?.message || "Từ chối thất bại");
    }
  };

  const handleSuspend = async (vendorId: string) => {
    try {
      toast.success("Đã tạm khóa quán!");
      fetchVendorsByStatus(activeTab, pageNumber);
    } catch (e) {
      toast.error(e?.message || "Tạm khóa thất bại");
    }
  };

  const handleViewDetails = (vendor: Vendor) => setSelectedVendor(vendor);

  const getStatusBadge = (vendor: Vendor) => {
    const s = normalizeStatus(vendor.status);
    if (s === "approved") return <Badge variant="default">Đã duyệt</Badge>;
    if (s === "pendingreview" || s === "pending")
      return <Badge variant="secondary">Chờ duyệt</Badge>;
    if (s === "suspended")
      return <Badge variant="destructive">Tạm khóa</Badge>;
    if (s === "menupending" || s === "menu_pending")
      return (
        <Badge variant="outline" className="border-warning text-warning">
          Chờ menu
        </Badge>
      );
    if (s === "closurerequested" || s === "closure_requested")
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-500">
          Yêu cầu đóng
        </Badge>
      );
    return <Badge variant="secondary">{String(vendor.status ?? "")}</Badge>;
  };

  const getPaymentStatusIcon = (vendor: Vendor) => {
    if ((vendor.outstandingAmount ?? 0) > 0) {
      return <AlertTriangle className="w-4 h-4 text-destructive" />;
    } else if (vendor.monthlyFeeStatus === "paid" && vendor.slotFeePaid) {
      return <CheckCircle className="w-4 h-4 text-success" />;
    } else {
      return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  const renderCardRow = (vendor: Vendor, highlight?: "pending" | "primary" | "danger") => {
    const iconWrap =
      highlight === "pending"
        ? "bg-warning/10 text-warning"
        : highlight === "primary"
        ? "bg-primary/10 text-primary"
        : highlight === "danger"
        ? "bg-destructive/10 text-destructive"
        : "bg-primary/10 text-primary";

    return (
      <div key={vendor.id} className="border rounded-lg p-4">
        <div className="grid lg:grid-cols-4 gap-4 items-center">
          <div className="lg:col-span-2">
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 ${iconWrap} rounded-lg flex items-center justify-center`}>
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{vendor.name}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {vendor.type && (
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" /> {vendor.type}
                    </span>
                  )}
                  {(vendor.location || vendor.address) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {vendor.location || vendor.address}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  {typeof vendor.averageRating === "number" && (
                    <span className="flex items-center gap-1 text-sm">
                      <Star className="w-3 h-3 fill-current text-yellow-500" />
                      {vendor.averageRating}
                    </span>
                  )}
                  {typeof vendor.customers === "number" && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {vendor.customers} customers
                    </span>
                  )}
                  {getPaymentStatusIcon(vendor)}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            {getStatusBadge(vendor)}
            {vendor.revenue && (
              <>
                <p className="font-semibold mt-1">{vendor.revenue}</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => handleViewDetails(vendor)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleSuspend(vendor.id)}>
              <Pause className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout title="Quản lý quán">
      {selectedVendor && (
        <VendorDetail
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
          onApprove={(id) => handleApprove(id as unknown as string)}
          onReject={(id) => handleReject(id as unknown as string)}
        />
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-6">
        <TabsList className="grid grid-cols-5 lg:w-fit">
          <TabsTrigger value="active">Đang hoạt động</TabsTrigger>
          <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
          <TabsTrigger value="menu_pending">Chờ cấp phép</TabsTrigger>
          <TabsTrigger value="debt">Công nợ</TabsTrigger>
          <TabsTrigger value="closure">Yêu cầu đóng</TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <CardTitle>Tìm kiếm & Lọc Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm quán theo tên hoặc địa điểm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={() => fetchVendorsByStatus(activeTab, DEFAULT_PAGE)}>
                {loading ? "Đang tải..." : "Làm mới"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách quán đang hoạt động</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filtered.map((v) => renderCardRow(v))}
                {!loading && filtered.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4" />
                    <p>Chưa có quán nào được duyệt hoạt động</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
  <Card>
    <CardHeader>
      <CardTitle>Danh sách quán đang chờ xét duyệt</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {filtered.map((v) => {
          const pendingDate = v.joinDate || v.createdTime; 
          return (
            <div
              key={v.id}
              className="border rounded-lg p-4 bg-secondary/5"
            >
              <div className="grid lg:grid-cols-4 gap-4 items-center">
                <div className="lg:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-50 overflow-hidden">
                        {v.logoUrl ? (
                            <img
                            src={
                                v.logoUrl.startsWith("http")
                                ? v.logoUrl
                                : `${import.meta.env.VITE_API_URL || ""}/${v.logoUrl}`
                            }
                            alt={v.name}
                            className="object-cover w-full h-full rounded-xl"
                            />
                        ) : (
                            <Clock className="w-6 h-6 text-orange-500" />
                        )}
                        </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{v.name}</h3>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {v.type && (
                          <span className="flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3" />
                            {v.type}
                          </span>
                        )}
                        {(v.location || v.address) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {v.location || v.address}
                          </span>
                        )}
                      </div>

                      {pendingDate && (
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3 text-orange-500" />
                          <span>Ngày đăng ký: {fmtDate(pendingDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-600 px-3 py-1 text-sm font-medium">
                    Chờ duyệt
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Chờ xem xét hồ sơ
                  </p>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => handleViewDetails(v)}
                    title="Xem chi tiết"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={() => handleApprove(v.id)}
                    title="Duyệt"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-lg"
                    onClick={() => handleReject(v.id)}
                    title="Từ chối"
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success" />
            <p>Không có quán nào chờ xét duyệt</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
</TabsContent>


        <TabsContent value="menu_pending">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách quán chờ cấp phép hoạt động</CardTitle>
              <p className="text-sm text-muted-foreground">
                Các quán đã duyệt hồ sơ, chờ phê duyệt hoạt động
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filtered.map((v) => (
                  <div key={v.id} className="border rounded-lg p-4 bg-primary/5">
                    <div className="grid lg:grid-cols-4 gap-4 items-center">
                      <div className="lg:col-span-2">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Menu className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{v.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {(v.type || v.address) && (
                                <>
                                  {v.type && (
                                    <span className="flex items-center gap-1">
                                      <ShoppingBag className="w-3 h-3" />
                                      {v.type}
                                    </span>
                                  )}
                                  {(v.location || v.address) && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {v.location || v.address}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {getPaymentStatusIcon(v)}
                              <span className="text-sm text-success font-medium">
                                Menu đã cập nhật
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-center">
                        {getStatusBadge(v)}
                        <p className="text-sm text-muted-foreground mt-1">Sẵn sàng hoạt động</p>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleViewDetails(v)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleApprove(v.id)}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Phê duyệt hoạt động
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {!loading && filtered.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Menu className="w-12 h-12 mx-auto mb-4" />
                    <p>Không có quán nào chờ cấp phép hoạt động</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debt">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý Công nợ</CardTitle>
              <p className="text-sm text-muted-foreground">Danh sách quán có nợ phí sàn hoặc quá hạn</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filtered.map((v) => (
                  <div key={v.id} className="border rounded-lg p-4 bg-destructive/5">
                    <div className="grid lg:grid-cols-4 gap-4 items-center">
                      <div className="lg:col-span-2">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-destructive" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{v.name}</h3>
                            {(v.location || v.address) && (
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {v.location || v.address}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <DollarSign className="w-4 h-4 text-destructive" />
                              <span className="text-destructive font-medium">
                                Nợ: {(v.outstandingAmount ?? 0).toLocaleString("vi-VN")}đ
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-center">
                        <Badge variant="destructive" className="mb-2">
                          {v.monthlyFeeStatus === "overdue" ? "Quá hạn" : "Nợ tiền"}
                        </Badge>
                        {v.joinDate && (
                          <p className="text-sm text-muted-foreground">Từ {v.joinDate}</p>
                        )}
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleViewDetails(v)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-warning text-warning">
                          Nhắc nhở
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleSuspend(v.id)}>
                          <Pause className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {!loading && filtered.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success" />
                    <p>Không có quán nào đang nợ phí</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="closure">
          <Card>
            <CardHeader>
              <CardTitle>Yêu cầu Đóng App</CardTitle>
              <p className="text-sm text-muted-foreground">Danh sách quán yêu cầu đóng app</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filtered.map((v) => (
                  <div key={v.id} className="border rounded-lg p-4">
                    <div className="grid lg:grid-cols-4 gap-4 items-center">
                      <div className="lg:col-span-2">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                            <XCircle className="w-6 h-6 text-orange-500" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{v.name}</h3>
                            {v.joinDate && (
                              <p className="text-sm text-muted-foreground">Ngày yêu cầu: {v.joinDate}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-center">
                        <Badge variant="outline" className="mb-2 border-orange-500 text-orange-500">
                          Chờ xét duyệt
                        </Badge>
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleViewDetails(v)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleApprove(v.id)}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(v.id)}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {!loading && filtered.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <XCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                    <p>Không có yêu cầu đóng</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default VendorManagement;