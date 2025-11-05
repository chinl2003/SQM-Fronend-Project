import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users,
  Clock,
  DollarSign,
  TrendingUp,
  MessageCircle,
  Plus,
  RefreshCw,
  Download,
  Search,
  MoreHorizontal,
  Package,
  Star,
  AlertCircle,
  CheckCircle2,
  Store,
  Camera,
  Upload,
  Shield,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderDetailModal } from "./OrderDetailModal";
// import VendorSettings from "./VendorSettings"; // replaced by inline Settings panel below
import { api, ApiResponse } from "@/lib/api";
import { useParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ==== Types (shape kept flexible to match backend) ====
interface VendorFromApi {
  id: string;
  name: string;
  status?: number | string;
  // Basic info
  address?: string;
  phone?: string;
  email?: string;
  openingHours?: string;
  businessTypeId?: string;
  // Legal
  logoUrl?: string;
  businessLicenseUrl?: string;
  foodSafetyCertUrl?: string;
  personalIdentityNumber?: string;
  personalIdentityFront?: string;
  personalIdentityBack?: string;
  // Finance
  bankBin?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  invoiceInfo?: string | null;
  paymentMethod?: number | string;
  // Stats expected from API; fallbacks will be applied if missing
  queueCount?: number;
  totalCompletedToday?: number;
  revenueToday?: number; // as number (VND)
  avgWaitMinutes?: number;
  cancelRatePercent?: number; // 0..100
}

// VietQR
type VietQRBank = {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  lookupSupported?: boolean;
};
interface VietQRBanksResponse {
  code: string;
  desc: string;
  data: VietQRBank[];
}

// numeric-to-text map (same approach as in your VendorDetail example)
const STATUS_NUM_TO_TEXT: Record<number, string> = {
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

function statusToLabel(s?: number | string) {
  const n = normalizeStatus(s);
  switch (n) {
    case "pendingreview":
      return { text: "Trạng thái: Chờ duyệt", dot: "bg-amber-500" };
    case "menupending":
      return { text: "Trạng thái: Chờ cấp phép", dot: "bg-sky-500" };
    case "approved":
      return { text: "Trạng thái: Đang hoạt động", dot: "bg-green-500" };
    case "rejected":
      return { text: "Trạng thái: Bị từ chối", dot: "bg-rose-500" };
    case "indebt":
      return { text: "Trạng thái: Quá hạn thanh toán công nợ", dot: "bg-orange-500" };
    case "suspended":
      return { text: "Trạng thái: Tạm khóa", dot: "bg-zinc-500" };
    case "closurerequested":
      return { text: "Trạng thái: Yêu cầu đóng", dot: "bg-orange-400" };
    case "draft":
      return { text: "Trạng thái: Nháp", dot: "bg-muted-foreground" };
    default:
      return { text: "Trạng thái: —", dot: "bg-muted-foreground" };
  }
}

function formatCurrencyVND(v?: number) {
  if (typeof v !== "number" || Number.isNaN(v)) return "0";
  return v.toLocaleString("vi-VN");
}

function buildMediaUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  return `${base}/${path.replace(/^\/+/, "")}`;
}

// ============== Registration Section (editable when status in [draft, pendingreview]) ==============
const Req = () => <span className="text-red-600 ml-0.5">*</span>;
const sectionFx =
  "transition-shadow transition-colors motion-safe:duration-300 motion-safe:ease-out " +
  "hover:shadow-lg hover:border-primary/30 focus-within:shadow-lg focus-within:border-primary/40";

function RegistrationSection({ vendor, editable }: { vendor: VendorFromApi | null; editable: boolean }) {
  // Banks
  const [banks, setBanks] = useState<VietQRBank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState<string | null>(null);

  // Form state
  const [businessTypeId, setBusinessTypeId] = useState<string>(vendor?.businessTypeId || "");
  const [selectedBankBin, setSelectedBankBin] = useState<string>(vendor?.bankBin || "");
  const [bankAccount, setBankAccount] = useState<string>(vendor?.bankAccountNumber || "");
  const [accountHolder, setAccountHolder] = useState<string>(vendor?.bankAccountHolder || "");
  const [submitting, setSubmitting] = useState(false);

  const selectedBank = useMemo(() => banks.find((b) => b.bin === selectedBankBin), [banks, selectedBankBin]);

  useEffect(() => {
    // prefill when vendor changes
    setBusinessTypeId(vendor?.businessTypeId || "");
    setSelectedBankBin(vendor?.bankBin || "");
    setBankAccount(vendor?.bankAccountNumber || "");
    setAccountHolder(vendor?.bankAccountHolder || "");
  }, [vendor?.businessTypeId, vendor?.bankBin, vendor?.bankAccountNumber, vendor?.bankAccountHolder]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setBanksLoading(true);
        setBanksError(null);
        const res = await fetch("/vietqr/v2/banks");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: VietQRBanksResponse = await res.json();
        if (!cancelled) setBanks(json?.data ?? []);
      } catch (err) {
        if (!cancelled) setBanksError("Không tải được danh sách ngân hàng. Vui lòng thử lại.");
      } finally {
        if (!cancelled) setBanksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function lookupAccountName() {
    try {
      if (!selectedBankBin || !bankAccount) return;
      const clientId = import.meta.env.VITE_VIETQR_CLIENT_ID as string | undefined;
      const apiKey = import.meta.env.VITE_VIETQR_API_KEY as string | undefined;
      if (!clientId || !apiKey) return;
      const res = await fetch("/vietqr/v2/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": clientId,
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ bin: selectedBankBin, accountNumber: bankAccount }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const name = data?.data?.accountName as string | undefined;
      if (name) setAccountHolder(name);
    } catch {}
  }

  async function handleSubmit() {
  // Chỉ cho update/create khi đang cho phép chỉnh (Draft | PendingReview)
  if (!editable) return;

  try {
    setSubmitting(true);

    const brandName = (document.getElementById("brandName") as HTMLInputElement)?.value?.trim();
    const address = (document.getElementById("address") as HTMLInputElement)?.value?.trim();
    const openingHours = (document.getElementById("openingHours") as HTMLInputElement)?.value?.trim();
    const phone = (document.getElementById("phone") as HTMLInputElement)?.value?.trim();
    const email = (document.getElementById("email") as HTMLInputElement)?.value?.trim();
    const invoiceInfo = (document.getElementById("invoiceInfo") as HTMLTextAreaElement)?.value ?? "";
    const cccdNumber = (document.getElementById("idNumber") as HTMLInputElement)?.value?.trim();

    const logoFile = (document.getElementById("logo") as HTMLInputElement)?.files?.[0];
    const businessLicenseFile = (document.getElementById("businessLicense") as HTMLInputElement)?.files?.[0];
    const foodSafetyFile = (document.getElementById("foodSafety") as HTMLInputElement)?.files?.[0];
    const cccdFrontFile = (document.getElementById("idFront") as HTMLInputElement)?.files?.[0];
    const cccdBackFile = (document.getElementById("idBack") as HTMLInputElement)?.files?.[0];

    const acceptTerms = (document.getElementById("terms") as HTMLInputElement)?.checked ?? undefined;
    const commitNoFraud = (document.getElementById("commitment1") as HTMLInputElement)?.checked ?? undefined;
    const commitAnalytics = (document.getElementById("commitment2") as HTMLInputElement)?.checked ?? undefined;

    if (!brandName || !businessTypeId || !address || !openingHours || !phone || !email) {
      alert("Vui lòng điền đầy đủ thông tin cơ bản.");
      return;
    }
    if (!selectedBankBin || !bankAccount || !accountHolder) {
      alert("Vui lòng chọn ngân hàng và nhập thông tin tài khoản.");
      return;
    }

    const fd = new FormData();
    fd.append("Name", brandName);
    fd.append("BusinessTypeId", businessTypeId);
    fd.append("Address", address);
    fd.append("OpeningHours", openingHours);
    fd.append("Phone", phone);
    fd.append("Email", email);

    if (logoFile) fd.append("Logo", logoFile);
    if (businessLicenseFile) fd.append("BusinessLicense", businessLicenseFile);
    if (foodSafetyFile) fd.append("FoodSafetyCert", foodSafetyFile);
    if (cccdNumber) fd.append("PersonalIdentityNumber", cccdNumber);
    if (cccdFrontFile) fd.append("PersonalIdentityFront", cccdFrontFile);
    if (cccdBackFile) fd.append("PersonalIdentityBack", cccdBackFile);

    // Finance
    fd.append("BankBin", selectedBankBin);
    fd.append("BankName", selectedBank?.shortName || selectedBank?.name || "");
    fd.append("BankAccountNumber", bankAccount);
    fd.append("BankAccountHolder", accountHolder);
    fd.append("InvoiceInfo", invoiceInfo ?? "");

    if (typeof acceptTerms === "boolean") fd.append("AcceptTerms", String(acceptTerms));
    if (typeof commitNoFraud === "boolean") fd.append("CommitNoFraud", String(commitNoFraud));
    if (typeof commitAnalytics === "boolean") fd.append("CommitAnalytics", String(commitAnalytics));

    // Headers
    const token = localStorage.getItem("accessToken") || "";
    const userId = localStorage.getItem("userId") || "";
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (userId) headers["X-User-Id"] = userId;

    if (vendor?.id) {
      const res = await api.post<ApiResponse<any>>(`/api/vendor/${vendor.id}`, fd, headers);
      toast.success("Cập nhật thông tin thành công!");
    }
  } catch (e: any) {
    console.error(e);
    toast.success("Cập nhật thông tin thất bại! Vui lòng liên hệ admin.");
  } finally {
    setSubmitting(false);
  }
}


  const editableInputCls = editable ? "" : "opacity-60 pointer-events-none select-none";

  return (
    <div className="space-y-6">
      <Card className={`border-primary/25 bg-primary/5 ${sectionFx}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Store className="h-5 w-5" />
            Thông tin cơ bản về quán {editable && <Req />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-semibold" htmlFor="brandName">Tên quán / thương hiệu {editable && <Req />}</Label>
              {editable ? (
                <Input id="brandName" defaultValue={vendor?.name} placeholder="Nhập tên quán" required />
              ) : (
                <p className="font-normal">{vendor?.name || "—"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="font-semibold" htmlFor="businessType">Loại hình kinh doanh {editable && <Req />}</Label>
              {editable ? (
                <Select value={businessTypeId} onValueChange={setBusinessTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại hình" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="street-food">Street Food</SelectItem>
                    <SelectItem value="drinks">Đồ uống</SelectItem>
                    <SelectItem value="bakery">Bánh</SelectItem>
                    <SelectItem value="fast-food">Fast Food</SelectItem>
                    <SelectItem value="others">Khác</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="font-normal">{vendor?.businessTypeId || "—"}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold" htmlFor="address">Địa chỉ hoạt động {editable && <Req />}</Label>
            {editable ? <Input id="address" defaultValue={vendor?.address} placeholder="Nhập địa chỉ chi tiết" required /> : <p className="font-normal">{vendor?.address || "—"}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-semibold" htmlFor="openingHours">Giờ hoạt động {editable && <Req />}</Label>
              {editable ? <Input id="openingHours" defaultValue={vendor?.openingHours} placeholder="VD: 08:00 - 22:00" required /> : <p className="font-normal">{vendor?.openingHours || "—"}</p>}
            </div>
            <div className="space-y-2">
              <Label className="font-semibold" htmlFor="phone">Số điện thoại {editable && <Req />}</Label>
              {editable ? <Input id="phone" defaultValue={vendor?.phone} placeholder="Nhập số điện thoại" required /> : <p className="font-normal">{vendor?.phone || "—"}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-semibold" htmlFor="email">Email liên hệ {editable && <Req />}</Label>
              {editable ? <Input id="email" type="email" defaultValue={vendor?.email} placeholder="Nhập email" required /> : <p className="font-normal">{vendor?.email || "—"}</p>}
            </div>
            <div className="space-y-2">
              <Label className="font-semibold" htmlFor="logo">Hình ảnh/Logo quán {editable && <Req />}</Label>
              {editable ? (
                <div className="flex items-center gap-2">
                  <Input id="logo" type="file" accept="image/*" />
                  <Camera className="h-4 w-4 text-muted-foreground" />
                </div>
              ) : (
                vendor?.logoUrl ? (
                  <img src={buildMediaUrl(vendor.logoUrl)} alt="logo" className="h-14 w-14 rounded object-cover" />
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LEGAL */}
      <Card className={`border-primary/25 bg-primary/5 ${sectionFx}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            Thông tin pháp lý / xác thực {editable && <Req />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="font-semibold" htmlFor="businessLicense">Giấy phép kinh doanh {editable && <Req />}</Label>
            {editable ? (
              <div className="flex items-center gap-2">
                <Input id="businessLicense" type="file" accept="image/*" />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
            ) : vendor?.businessLicenseUrl ? (
              <img src={buildMediaUrl(vendor.businessLicenseUrl)} className="h-28 rounded object-cover" />
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-semibold" htmlFor="foodSafety">Giấy chứng nhận VSATTP {editable && <Req />}</Label>
            {editable ? (
              <div className="flex items-center gap-2">
                <Input id="foodSafety" type="file" accept="image/*" />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
            ) : vendor?.foodSafetyCertUrl ? (
              <img src={buildMediaUrl(vendor.foodSafetyCertUrl)} className="h-28 rounded object-cover" />
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <Label className="font-semibold" htmlFor="idNumber">Mã số CCCD {editable && <Req />}</Label>
              {editable ? <Input id="idNumber" defaultValue={vendor?.personalIdentityNumber || ""} placeholder="Nhập mã số CCCD" /> : <p className="font-normal">{vendor?.personalIdentityNumber || "—"}</p>}
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label className="font-semibold" htmlFor="idFront">Ảnh CCCD mặt trước {editable && <Req />}</Label>
              {editable ? (
                <div className="flex items-center gap-2">
                  <Input id="idFront" type="file" accept="image/*" />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
              ) : vendor?.personalIdentityFront ? (
                <img src={buildMediaUrl(vendor.personalIdentityFront)} className="h-28 rounded object-cover" />
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label className="font-semibold" htmlFor="idBack">Ảnh CCCD mặt sau {editable && <Req />}</Label>
              {editable ? (
                <div className="flex items-center gap-2">
                  <Input id="idBack" type="file" accept="image/*" />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
              ) : vendor?.personalIdentityBack ? (
                <img src={buildMediaUrl(vendor.personalIdentityBack)} className="h-28 rounded object-cover" />
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FINANCE */}
      <Card className={`border-primary/25 bg-primary/5 ${sectionFx}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <DollarSign className="h-5 w-5" />
            Thông tin tài chính / thanh toán {editable && <Req />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="font-semibold" htmlFor="bankName">Tên ngân hàng {editable && <Req />}</Label>
            {editable ? (
              <Select value={selectedBankBin} onValueChange={setSelectedBankBin} disabled={banksLoading || !!banksError}>
                <SelectTrigger>
                  <SelectValue placeholder={banksLoading ? "Đang tải danh sách ngân hàng..." : banksError ? "Không tải được danh sách. Thử lại." : "Chọn ngân hàng"} />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {banks.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">{banksError ? banksError : "Không có dữ liệu ngân hàng"}</div>
                  ) : (
                    banks.map((b) => (
                      <SelectItem key={b.bin} value={b.bin}>
                        <span className="flex items-center gap-2">
                          <img src={b.logo} alt={b.shortName} className="h-4 w-4 rounded-sm object-contain" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} />
                          <span className="truncate">{b.shortName || b.name}</span>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            ) : (
              <p className="font-normal">{vendor?.bankName || (vendor?.bankBin ? `BIN ${vendor.bankBin}` : "—")}</p>
            )}
            {selectedBank && editable && (
              <p className="text-xs text-muted-foreground">Mã BIN: {selectedBank.bin}{selectedBank.lookupSupported ? " • Hỗ trợ tra cứu chủ TK" : ""}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-semibold" htmlFor="bankAccount">Tài khoản ngân hàng / ví điện tử {editable && <Req />}</Label>
            {editable ? (
              <div className="flex gap-2">
                <Input id="bankAccount" placeholder="Nhập số tài khoản" required value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
                <Button type="button" variant="secondary" onClick={lookupAccountName} disabled={!selectedBankBin || !bankAccount || !selectedBank?.lookupSupported} title={!selectedBank?.lookupSupported ? "Ngân hàng này không hỗ trợ tra cứu chủ TK" : "Tra cứu tên chủ tài khoản"}>
                  Tra cứu
                </Button>
              </div>
            ) : (
              <p className="font-normal">{vendor?.bankAccountNumber || "—"}</p>
            )}
            {editable ? (
              <p className="text-xs text-muted-foreground">Chọn ngân hàng và nhập số tài khoản, sau đó bấm <em>Tra cứu</em> để điền tên chủ tài khoản (nếu hỗ trợ).</p>
            ) : (
              <p className="text-xs text-muted-foreground">Chủ TK: {vendor?.bankAccountHolder || "—"}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-semibold" htmlFor="accountHolder">Tên chủ tài khoản {editable && <Req />}</Label>
            {editable ? (
              <Input id="accountHolder" placeholder="Tên chủ tài khoản" required value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
            ) : (
              <p className="font-normal">{vendor?.bankAccountHolder || "—"}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-semibold" htmlFor="invoiceInfo">Thông tin xuất hóa đơn</Label>
            {editable ? (
              <Textarea id="invoiceInfo" defaultValue={vendor?.invoiceInfo || ""} placeholder="Nhập thông tin xuất hóa đơn (nếu có)" />
            ) : (
              <p className="font-normal whitespace-pre-wrap">{vendor?.invoiceInfo || "—"}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* TERMS & COST */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <DollarSign className="h-5 w-5" />
            Thông tin chi phí
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Phí đăng ký lần đầu:</Label>
              <p className="text-lg font-bold text-green-600">500,000 VND</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Phí hàng tháng:</Label>
              <p className="text-lg font-bold text-blue-600">200,000 VND/tháng</p>
            </div>
          </div>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Quy định thanh toán:</strong>
              <br />• Thời hạn: Trước ngày 30 mỗi tháng
              <br />• Chậm thanh toán: Shop bị khóa và không hoàn lại phí thuê slot
              <br />• Phí phạt mở lại: 50% phí thuê slot + số tiền nợ tháng trước
              <br />• Yêu cầu đóng shop: Phải tạo yêu cầu trước 1 tháng
            </AlertDescription>
          </Alert>

          {editable ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="terms" />
                <Label htmlFor="terms">Tôi chấp nhận Terms of Service & Policy <Req /></Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="commitment1" />
                <Label htmlFor="commitment1">Cam kết không gian lận hàng chờ, không ghost order <Req /></Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="commitment2" />
                <Label htmlFor="commitment2">Đồng ý cung cấp dữ liệu vận hành cho mục đích analytics <Req /></Label>
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Đang gửi..." : "Cập nhật thông tin"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Hồ sơ đã gửi. Không thể chỉnh sửa khi trạng thái không phải Nháp/Chờ duyệt.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================ MAIN DASHBOARD ============================
const VendorDashboard = () => {
  const params = useParams();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // ====== state for vendor (fetched from API by owner) ======
  const [vendor, setVendor] = useState<VendorFromApi | null>(null);
  const [loadingVendor, setLoadingVendor] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ====== Fetch vendor(s) by owner on mount ======
  useEffect(() => {
    let mounted = true;
    async function fetchVendorByOwner() {
      try {
        setLoadingVendor(true);
        setLoadError(null);
        // Resolve userId from route param or localStorage, as discussed
        const routeUserId = (params as any)?.userId as string | undefined;
        const storedUserId = localStorage.getItem("userId") || undefined;
        const userId = routeUserId || storedUserId;
        if (!userId) {
          throw new Error("userId is required but was not found (route or localStorage)");
        }
        const token = localStorage.getItem("accessToken") || "";
        const res = await api.get<ApiResponse<VendorFromApi[]>>(
          `/api/vendor/by-owner/${userId}`,
          token ? { Authorization: `Bearer ${token}` } : undefined
        );
        const payload = (res?.data as any) ?? res;
        const vendors: VendorFromApi[] = (payload?.data as VendorFromApi[]) ?? (payload as VendorFromApi[]) ?? [];
        if (mounted) setVendor(vendors?.[0] ?? null); // pick first vendor for this owner
      } catch (e: any) {
        console.error(e);
        if (mounted) setLoadError(e?.message || "Không thể tải dữ liệu quán.");
      } finally {
        if (mounted) setLoadingVendor(false);
      }
    }
    fetchVendorByOwner();
    return () => {
      mounted = false;
    };
  }, [params.userId]);

  // ====== Derived header + stat values from vendor (fallbacks keep UI stable) ======
  const vendorTitle = vendor?.name ? `Quán ${vendor.name}` : "Smart Queue - Vendor Dashboard";
  const statusInfo = statusToLabel(vendor?.status);
  const isEditable = ["draft", "pendingreview"].includes(normalizeStatus(vendor?.status));

  const stats = useMemo(() => {
    return {
      activeQueue: vendor?.queueCount ?? 0,
      totalToday: vendor?.totalCompletedToday ?? 0,
      revenue: vendor?.revenueToday ?? 0,
      avgWaitTime: vendor?.avgWaitMinutes ?? 0,
      cancelRate: vendor?.cancelRatePercent ?? 0,
    };
  }, [vendor]);

  // ====== demo queue items ======
  const [queueItems, setQueueItems] = useState([
    { id: 1, position: 1, customer: "Nguyễn Văn A****", items: ["Pizza Margherita", "Coca Cola"], status: "pending", time: "14:30", type: "walk-in", paymentStatus: "unpaid", paymentMethod: "cash" },
    { id: 2, position: 2, customer: "Trần Thị B****", items: ["Pasta Carbonara"], status: "pending", time: "14:35", type: "pre-order", paymentStatus: "paid", paymentMethod: "vnpay" },
    { id: 3, position: 3, customer: "Lê Minh C****", items: ["Pizza Pepperoni", "Sprite"], status: "preparing", time: "14:40", type: "walk-in", paymentStatus: "paid", paymentMethod: "cash" },
    { id: 4, position: 4, customer: "Phạm Thu D****", items: ["Salad Caesar"], status: "ready", time: "14:25", type: "walk-in", paymentStatus: "paid", paymentMethod: "vnpay" },
  ]);

  const menuItems = [
    { id: 1, name: "Pizza Margherita", category: "Pizza", price: "159,000", stock: 25, status: "active" },
    { id: 2, name: "Pizza Pepperoni", category: "Pizza", price: "179,000", stock: 0, status: "out-of-stock" },
    { id: 3, name: "Pasta Carbonara", category: "Pasta", price: "139,000", stock: 15, status: "active" },
    { id: 4, name: "Caesar Salad", category: "Salad", price: "89,000", stock: 8, status: "active" },
  ];

  const handleUpdateOrder = (orderId: number, newStatus: string) => {
    setQueueItems((prev) => prev.map((item) => (item.id === orderId ? { ...item, status: newStatus } : item)));
  };

  const getPaymentStatusColor = (status: string) => {
    return status === "paid" ? "bg-chart-secondary text-chart-secondary-foreground" : "bg-queue-cancelled text-queue-cancelled-foreground";
  };

  const getActionButtonConfig = (status: string) => {
    switch (status) {
      case "pending":
        return { text: "Xác nhận", variant: "default", nextStatus: "preparing" };
      case "preparing":
        return { text: "Chế biến", variant: "outline", nextStatus: "processing" };
      case "processing":
        return { text: "Đang chế biến", variant: "secondary", nextStatus: null, disabled: true } as const;
      case "ready":
        return { text: "Sẵn sàng", variant: "default", nextStatus: "completed" };
      case "completed":
        return { text: "Hoàn tất", variant: "outline", nextStatus: null, disabled: true } as const;
      default:
        return { text: "Cập nhật", variant: "outline", nextStatus: null };
    }
  };

  const getActionButtonColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-queue-waiting text-queue-waiting-foreground hover:bg-queue-waiting/90";
      case "preparing":
        return "bg-queue-preparing text-queue-preparing-foreground hover:bg-queue-preparing/90";
      case "ready":
        return "bg-queue-ready text-queue-ready-foreground hover:bg-queue-ready/90";
      case "completed":
        return "bg-queue-completed text-queue-completed-foreground";
      default:
        return "";
    }
  };

  const filteredQueueItems = queueItems.filter((item) => {
    if (statusFilter === "all") return true;
    return item.status === statusFilter;
  });

  const sortedQueueItems = [...filteredQueueItems].sort((a, b) => {
    const statusOrder: Record<string, number> = { pending: 0, preparing: 1, processing: 2, ready: 3, completed: 4, cancelled: 5 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{loadingVendor ? "Đang tải..." : vendorTitle}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${statusInfo.dot} animate-pulse`}></span>
              {loadingVendor ? "Đang tải trạng thái..." : statusInfo.text}
              {loadError && <span className="text-destructive ml-2">{loadError}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Xuất báo cáo
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm món mới
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.activeQueue}</p>
                  <p className="text-sm text-muted-foreground">Đang chờ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-secondary/10 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-chart-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalToday}</p>
                  <p className="text-sm text-muted-foreground">Hoàn thành hôm nay</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-revenue-positive/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-revenue-positive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatCurrencyVND(stats.revenue)}đ</p>
                  <p className="text-sm text-muted-foreground">Doanh thu hôm nay</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-queue-preparing/10 rounded-lg">
                  <Clock className="h-6 w-6 text-queue-preparing" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.avgWaitTime}</p>
                  <p className="text-sm text-muted-foreground">Phút TB chờ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-queue-cancelled/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-queue-cancelled" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.cancelRate}%</p>
                  <p className="text-sm text-muted-foreground">Tỷ lệ hủy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="queue" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="queue">Hàng đợi</TabsTrigger>
            <TabsTrigger value="menu">Thực đơn</TabsTrigger>
            <TabsTrigger value="analytics">Thống kê</TabsTrigger>
            <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
            <TabsTrigger value="settings">Cài đặt</TabsTrigger>
          </TabsList>

          {/* Queue Management */}
          <TabsContent value="queue" className="space-y-4">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Quản lý hàng đợi</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Lọc theo trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="pending">Chờ xác nhận</SelectItem>
                        <SelectItem value="preparing">Chuẩn bị chế biến</SelectItem>
                        <SelectItem value="ready">Sẵn sàng</SelectItem>
                        <SelectItem value="completed">Hoàn tất</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Lọc theo loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="walk-in">Walk-in</SelectItem>
                        <SelectItem value="pre-order">Pre-order</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedQueueItems.map((item) => (
                    <div key={item.id} className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/30 transition-colors relative overflow-hidden" onClick={() => setSelectedOrder(item)}>
                      <div className={`${getPaymentStatusColor(item.paymentStatus)} absolute top-0 right-0 px-2 py-1 text-[10px] font-medium rounded-br-none rounded-tl-none rounded-tr-lg rounded-bl-lg`}>
                        {item.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold">#{item.position}</div>
                          <div>
                            <p className="font-medium text-foreground">{item.customer}</p>
                            <p className="text-sm text-muted-foreground">{item.time} • {item.type === "pre-order" ? "Pre-order" : "Walk-in"}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.items.map((food: string, idx: number) => (
                                <span key={idx} className="text-xs bg-muted px-2 py-1 rounded">{food}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {(() => {
                              const buttonConfig = getActionButtonConfig(item.status);
                              if (buttonConfig.nextStatus) {
                                return (
                                  <Button size="sm" className={getActionButtonColor(item.status)} disabled={(buttonConfig as any).disabled} onClick={(e) => {
                                    e.stopPropagation();
                                    if (!(buttonConfig as any).disabled) {
                                      if (item.status === "preparing") {
                                        handleUpdateOrder(item.id, "processing");
                                      } else {
                                        handleUpdateOrder(item.id, buttonConfig.nextStatus!);
                                      }
                                    }
                                  }}>
                                    {buttonConfig.text}
                                  </Button>
                                );
                              } else if ((buttonConfig as any).disabled) {
                                return (
                                  <Button size="sm" variant="secondary" disabled>
                                    {buttonConfig.text}
                                  </Button>
                                );
                              }
                              return null;
                            })()}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedOrder(item)}>Xem chi tiết</DropdownMenuItem>
                                <DropdownMenuItem>
                                  <div className="flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4" />
                                    Nhắn tin khách hàng
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleUpdateOrder(item.id, "cancelled")}>
                                  Hủy đơn hàng
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menu Management */}
          <TabsContent value="menu" className="space-y-4">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Quản lý thực đơn</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder="Tìm kiếm món ăn..." className="pl-9 w-64" />
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm món
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {menuItems.map((item) => (
                    <div key={item.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                            <p className="text-lg font-semibold text-primary">{item.price}đ</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Tồn kho</p>
                            <p className={`font-medium ${item.stock === 0 ? "text-destructive" : "text-foreground"}`}>{item.stock}</p>
                          </div>

                          <Badge variant={item.status === "active" ? "default" : "destructive"}>{item.status === "active" ? "Hoạt động" : "Hết hàng"}</Badge>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Chỉnh sửa</DropdownMenuItem>
                              <DropdownMenuItem>Cập nhật tồn kho</DropdownMenuItem>
                              <DropdownMenuItem>Tạm dừng bán</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Xóa</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics (placeholder) */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Biểu đồ doanh thu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">Biểu đồ doanh thu theo ngày</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Thống kê hàng đợi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">Biểu đồ thời gian chờ trung bình</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reviews (placeholder) */}
          <TabsContent value="reviews" className="space-y-4">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Đánh giá từ khách hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((review) => (
                    <div key={review} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium">Khách hàng #{review}</p>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">"Món ăn ngon, phục vụ nhanh. Rất hài lòng với dịch vụ."</p>
                          <p className="text-xs text-muted-foreground">2 giờ trước</p>
                        </div>
                        <Button variant="outline" size="sm">Phản hồi</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-4">
            {/* Inner tabs for settings sections if needed later; for now, show Đăng kí */}
            <Tabs defaultValue="registration" className="space-y-4">
              <TabsList>
                <TabsTrigger value="registration">Đăng kí</TabsTrigger>
                {/* <TabsTrigger value="other">Khác</TabsTrigger> */}
              </TabsList>
              <TabsContent value="registration">
                <RegistrationSection vendor={vendor} editable={isEditable} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      <OrderDetailModal isOpen={!!selectedOrder && !selectedOrder?.showDelay} onClose={() => setSelectedOrder(null)} order={selectedOrder} onUpdateOrder={handleUpdateOrder} />

      {/* Delay Order Dialog */}
      {selectedOrder?.showDelay && (
        <Dialog open={true} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Thông báo trễ giờ giao
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delayReason">Lý do trễ *</Label>
                <Textarea id="delayReason" placeholder="Nhập lý do trễ..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delayTime">Thời gian trễ thêm (phút) *</Label>
                <Input id="delayTime" type="number" placeholder="Ví dụ: 15" />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Hủy
                </Button>
                <Button onClick={() => { setSelectedOrder(null); alert("Đã cập nhật thời gian trễ. Khách hàng sẽ được thông báo."); }}>
                  Xác nhận
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default VendorDashboard;