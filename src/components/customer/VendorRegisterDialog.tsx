import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Store,
  Camera,
  Upload,
  Shield,
  FileText,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiResponse, VendorRegisterResponse } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";

type VendorRegisterDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

const Req = () => <span className="text-red-600 ml-0.5">*</span>;

const sectionFx =
  "transition-shadow transition-colors motion-safe:duration-300 motion-safe:ease-out " +
  "hover:shadow-lg hover:border-primary/30 focus-within:shadow-lg focus-within:border-primary/40";

type PaymentResponse = {
  paymentUrl: string;
  transactionId: string;
  amount: number;
};

type PaymentResponseApi = ApiResponse<PaymentResponse>;

type VietQRBank = {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  lookupSupported?: boolean;
};
type VietQRBanksResponse = {
  code: string;
  desc: string;
  data: VietQRBank[];
};

type BusinessTypeItem = {
  id: string;
  name: string;
};

type WalletInfo = {
  id: string;
  balance: number;
  heldBalance: number;
  availableBalance: number;
  owner: number;
  userId?: string | null;
  vendorId?: string | null;
};

type WalletInfoApiResponse = ApiResponse<WalletInfo>;
type BusinessTypeApiResponse = ApiResponse<BusinessTypeItem[]>;
type BusinessTypeCreateResponse = ApiResponse<BusinessTypeItem>;

export function VendorRegisterDialog({
  isOpen,
  onClose,
}: VendorRegisterDialogProps) {
  const navigate = useNavigate();
  const [banks, setBanks] = useState<VietQRBank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState<string | null>(null);

  const [selectedBankBin, setSelectedBankBin] = useState<string>("");
  const [bankAccount, setBankAccount] = useState<string>("");
  const [accountHolder, setAccountHolder] = useState<string>("");

  const [businessTypes, setBusinessTypes] = useState<BusinessTypeItem[]>([]);
  const [businessTypesLoading, setBusinessTypesLoading] = useState(false);
  const [businessTypesError, setBusinessTypesError] = useState<string | null>(
    null
  );
  const [businessTypeSearch, setBusinessTypeSearch] = useState<string>("");
  const [businessTypeId, setBusinessTypeId] = useState<string>("");

  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);

  const filteredBusinessTypes = useMemo(() => {
    const keyword = businessTypeSearch.trim().toLowerCase();
    if (!keyword) return businessTypes;
    return businessTypes.filter((bt) =>
      bt.name.toLowerCase().includes(keyword)
    );
  }, [businessTypes, businessTypeSearch]);

  const [paymentMethod, setPaymentMethod] = useState<"vnpay">("vnpay");
  const [submitting, setSubmitting] = useState(false);

  const REGISTER_FEE = 500_000;
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [hasEnoughBalance, setHasEnoughBalance] = useState<boolean | null>(
    null
  );
  const [geoLat, setGeoLat] = useState<number | null>(null);
  const [geoLon, setGeoLon] = useState<number | null>(null);

  const selectedBank = useMemo(
    () => banks.find((b) => b.bin === selectedBankBin),
    [banks, selectedBankBin]
  );

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        setBanksLoading(true);
        setBanksError(null);
        const res = await fetch("/vietqr/v2/banks");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: VietQRBanksResponse = await res.json();
        if (cancelled) return;
        setBanks(json?.data ?? []);
      } catch (err) {
        if (cancelled) return;
        setBanksError("Không tải được danh sách ngân hàng. Vui lòng thử lại.");
        toast.error("Không tải được danh sách ngân hàng.");
      } finally {
        if (!cancelled) setBanksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    (async () => {
      try {
        setBusinessTypesLoading(true);
        setBusinessTypesError(null);

        const token = localStorage.getItem("accessToken") || "";
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await api.get<BusinessTypeApiResponse>(
          "/api/BusinessType",
          headers
        );

        if (cancelled) return;

        if (!res || !res.code?.toLowerCase().includes("success")) {
          throw new Error(
            res?.message || "Không lấy được danh sách loại hình kinh doanh"
          );
        }

        setBusinessTypes(res.data ?? []);
      } catch (err: any) {
        if (cancelled) return;
        console.error(err);
        setBusinessTypesError(
          err?.message || "Không tải được loại hình kinh doanh."
        );
        toast.error("Không tải được loại hình kinh doanh.");
      } finally {
        if (!cancelled) setBusinessTypesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  async function handleTopupViaVnPay() {
    try {
      const amountNeeded = Math.max(REGISTER_FEE - (walletBalance ?? 0), 0);

      if (amountNeeded <= 0) {
        toast.message("Số dư đã đủ hoặc không xác định số tiền cần nạp.");
        return;
      }

      const token = localStorage.getItem("accessToken") || "";
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await api.post<PaymentResponseApi>(
        "/api/VNPay/create-payment",
        { amount: amountNeeded },
        headers
      );

      const payload = (res?.data as any) ?? res;
      const payment: PaymentResponse =
        (payload?.data as PaymentResponse) ?? (payload as PaymentResponse);

      if (!payment?.paymentUrl || !payment?.transactionId) {

        throw new Error("Không lấy được link thanh toán VNPay.");
      }
      localStorage.setItem("lastVnPayTransactionId", payment.transactionId);

      window.location.href = payment.paymentUrl;
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Có lỗi khi tạo giao dịch VNPay.");
    }
  }
  async function lookupAccountName() {
    try {
      if (!selectedBankBin) {
        toast.message("Chọn ngân hàng trước khi tra cứu");
        return;
      }
      if (!bankAccount) {
        toast.message("Nhập số tài khoản trước khi tra cứu");
        return;
      }
      const clientId = import.meta.env.VITE_VIETQR_CLIENT_ID as
        | string
        | undefined;
      const apiKey = import.meta.env.VITE_VIETQR_API_KEY as string | undefined;
      if (!clientId || !apiKey) {
        toast.warning(
          "Thiếu API key VietQR. Vui lòng cấu hình biến môi trường."
        );
        return;
      }

      const res = await fetch("/vietqr/v2/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": clientId,
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          bin: selectedBankBin,
          accountNumber: bankAccount,
        }),
      });
      if (!res.ok) {
        toast.error("Tra cứu thất bại. Vui lòng thử lại.");
        return;
      }
      const data = await res.json();
      const name = data?.data?.accountName as string | undefined;
      if (name) {
        setAccountHolder(name);
        toast.success("Đã điền tên chủ tài khoản.");
      } else {
        toast.message("Không tìm thấy tên chủ tài khoản. Vui lòng nhập tay.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi khi tra cứu tên chủ tài khoản.");
    }
  }

  async function handleBusinessTypeEnter() {
    const value = businessTypeSearch.trim();
    if (!value) return;

    const existing = businessTypes.find(
      (bt) => bt.name.trim().toLowerCase() === value.toLowerCase()
    );

    if (existing) {
      setBusinessTypeId(existing.id);
      toast.message(`Đã chọn loại hình "${existing.name}"`);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken") || "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await api.post<BusinessTypeCreateResponse>(
        "/api/BusinessType",
        { name: value },
        headers
      );

      if (!res || !res.code?.toLowerCase().includes("success") || !res.data) {
        throw new Error(
          res?.message || "Không tạo được loại hình kinh doanh mới."
        );
      }

      const newItem = res.data;
      setBusinessTypes((prev) => [...prev, newItem]);
      setBusinessTypeId(newItem.id);
      // toast.success(`Đã tạo loại hình "${newItem.name}"`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Có lỗi khi tạo loại hình kinh doanh mới.");
    }
  }

  async function handleCheckBalanceAndOpenDialog() {
    try {
      setCheckingBalance(true);

      const geocodeKey = import.meta.env.VITE_GEOCODE_API_KEY as
        | string
        | undefined;
      const geocodeUrl = `https://geocode.maps.co/search?q=${encodeURIComponent(
        address
      )}${geocodeKey ? `&api_key=${geocodeKey}` : ""}`;
      const geoRes = await fetch(geocodeUrl);
      if (!geoRes.ok) {
        throw new Error("Không thể xác thực địa chỉ với dịch vụ Geocoding.");
      }
      const geoData = await geoRes.json();
      const first =
        Array.isArray(geoData) && geoData.length > 0 ? geoData[0] : null;
      if (!first || !first.lat || !first.lon) {
        toast.error(
          "Địa chỉ không hợp lệ hoặc không tìm thấy vị trí. Vui lòng kiểm tra lại."
        ); 
        return;
      }
      setGeoLat(parseFloat(first.lat));
      setGeoLon(parseFloat(first.lon));

      const token = localStorage.getItem("accessToken") || "";
      const userId = localStorage.getItem("userId") || "";

      if (!userId) {
        toast.error(
          "Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại."
        );
        return;
      }

      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await api.get<WalletInfoApiResponse>(
        `/api/wallet/balance?ownerStatus=Customer&ownerId=${encodeURIComponent(
          userId
        )}`,
        headers
      );

      if (!res || !res.data) {
        throw new Error("Không kiểm tra được số dư ví. Vui lòng thử lại.");
      }

      const wallet = res.data;
      setWalletInfo(wallet);
      const available = Number(wallet.availableBalance) || 0;

      setWalletBalance(available);
      setHasEnoughBalance(available >= REGISTER_FEE);
      setShowPaymentDialog(true);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Có lỗi khi kiểm tra số dư ví.");
    } finally {
      setCheckingBalance(false);
    }
  }

  async function handleConfirmPayment() {
    try {
      setSubmitting(true);

      const brandName = (
        document.getElementById("brandName") as HTMLInputElement
      )?.value?.trim();

      if (!brandName) {
        toast.error("Thiếu tên quán.");
        setSubmitting(false);
        return;
      }

      const token = localStorage.getItem("accessToken") || "";
      const userId = localStorage.getItem("userId") || "";

      if (!userId) {
        toast.error(
          "Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại."
        );
        setSubmitting(false);
        return;
      }

      // 👉 dùng walletInfo.id thay vì localStorage
      if (!walletInfo || !walletInfo.id) {
        toast.error(
          "Không tìm thấy ví của bạn (wallet). Vui lòng kiểm tra lại."
        );
        setSubmitting(false);
        return;
      }

      const walletId = walletInfo.id;

      const headersTx: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headersTx.Authorization = `Bearer ${token}`;

      // 9 = CustomerRegisterVendor, 1 = Processing (tuỳ enum backend của bạn)
      const transactionBody = {
        walletId,
        amount: REGISTER_FEE, // hoặc -REGISTER_FEE tùy convention
        type: 10,
        status: 1,
        message: `Thanh toán phí đăng kí quán ${brandName}`,
        paymentMethod: "Ví",
      };

      const txRes = await api.post<ApiResponse<any>>(
        "/api/WalletTransaction",
        transactionBody,
        headersTx
      );

      if (!txRes?.code?.toLowerCase().includes("success")) {
        throw new Error(
          txRes?.message || "Không lưu được giao dịch ví. Vui lòng thử lại."
        );
      }

      // Lưu transaction xong -> gọi API đăng ký vendor
      await handleSubmit();

      setShowPaymentDialog(false);
      onClose?.();
    } catch (e: any) {
      console.error(e);
      toast.error(
        e?.message || "Có lỗi khi thanh toán phí và gửi hồ sơ đăng ký."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    try {
      const brandName = (
        document.getElementById("brandName") as HTMLInputElement
      )?.value?.trim();
      const address = (
        document.getElementById("address") as HTMLInputElement
      )?.value?.trim();
      const openingHours = (
        document.getElementById("openingHours") as HTMLInputElement
      )?.value?.trim();
      const phone = (
        document.getElementById("phone") as HTMLInputElement
      )?.value?.trim();
      const email = (
        document.getElementById("email") as HTMLInputElement
      )?.value?.trim();
      const invoiceInfo =
        (document.getElementById("invoiceInfo") as HTMLTextAreaElement)
          ?.value ?? "";
      const cccdNumber = (
        document.getElementById("idNumber") as HTMLInputElement
      )?.value?.trim();

      const logoFile = (document.getElementById("logo") as HTMLInputElement)
        ?.files?.[0];
      const businessLicenseFile = (
        document.getElementById("businessLicense") as HTMLInputElement
      )?.files?.[0];
      const foodSafetyFile = (
        document.getElementById("foodSafety") as HTMLInputElement
      )?.files?.[0];
      const cccdFrontFile = (
        document.getElementById("idFront") as HTMLInputElement
      )?.files?.[0];
      const cccdBackFile = (
        document.getElementById("idBack") as HTMLInputElement
      )?.files?.[0];

      const acceptTerms = (document.getElementById("terms") as HTMLInputElement)
        ?.checked;
      const commitNoFraud = (
        document.getElementById("commitment1") as HTMLInputElement
      )?.checked;
      const commitAnalytics = (
        document.getElementById("commitment2") as HTMLInputElement
      )?.checked;

      if (!brandName || !businessTypeId || !address || !openingHours) {
        toast.error("Vui lòng điền đầy đủ thông tin cơ bản.");
        return;
      }
      if (
        !logoFile ||
        !businessLicenseFile ||
        !foodSafetyFile ||
        !cccdFrontFile ||
        !cccdBackFile ||
        !cccdNumber
      ) {
        toast.error("Vui lòng cung cấp đầy đủ giấy tờ pháp lý và CCCD.");
        return;
      }

      if (!acceptTerms || !commitNoFraud || !commitAnalytics) {
        toast.error("Bạn cần đồng ý điều khoản và các cam kết.");
        return;
      }

      if (geoLat == null || geoLon == null) {
        toast.error("Vui lòng kiểm tra địa chỉ trước khi gửi hồ sơ.");
        return;
      }

      const paymentMethodEnum = 1;

      const fd = new FormData();
      fd.append("Name", brandName);
      fd.append("BusinessTypeId", businessTypeId);
      fd.append("Address", address);
      fd.append("Latitude", String(geoLat));
      fd.append("Longitude", String(geoLon));
      fd.append("OpeningHours", openingHours);
      fd.append("Phone", phone);
      fd.append("Email", email);

      fd.append("Logo", logoFile);
      fd.append("BusinessLicense", businessLicenseFile);
      fd.append("FoodSafetyCert", foodSafetyFile);

      fd.append("PersonalIdentityNumber", cccdNumber!);
      fd.append("PersonalIdentityFront", cccdFrontFile!);
      fd.append("PersonalIdentityBack", cccdBackFile!);

      if (selectedBankBin) {
        fd.append("BankBin", selectedBankBin);
        fd.append(
          "BankName",
          selectedBank?.shortName || selectedBank?.name || ""
        );
      }

      if (bankAccount) {
        fd.append("BankAccountNumber", bankAccount);
      }

      if (accountHolder) {
        fd.append("BankAccountHolder", accountHolder);
      }
      fd.append("InvoiceInfo", invoiceInfo ?? "");

      fd.append("PaymentMethod", String(paymentMethodEnum));
      fd.append("AcceptTerms", String(acceptTerms));
      fd.append("CommitNoFraud", String(commitNoFraud));
      fd.append("CommitAnalytics", String(commitAnalytics));

      const token = localStorage.getItem("accessToken") || "";
      const userId = localStorage.getItem("userId") || "";

      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      if (userId) headers["X-User-Id"] = userId;

      const res = await api.post<ApiResponse<VendorRegisterResponse>>(
        "/api/vendor/register",
        fd,
        headers
      );

      if (!res?.code?.toLowerCase().includes("success")) {
        throw new Error(
          res?.message || "Đăng kí hồ sơ thất bại! Vui lòng liên hệ hỗ trợ."
        );
      }

      toast.success("Đăng kí hồ sơ thành công! Vui lòng chờ xét duyệt.");
      // không onClose ở đây, vì handleConfirmPayment sẽ gọi sau khi mọi step ok
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Có lỗi khi gửi hồ sơ đăng ký.");
    } finally {
      // ❌ bỏ setSubmitting(false); ở đây
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto p-0">
        <DialogHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-6 py-4">
          <DialogTitle>Đăng ký cửa hàng</DialogTitle>
          <DialogDescription>
            Điền thông tin bên dưới để tạo cửa hàng của bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-6">
          <Tabs defaultValue="registration" className="w-full">
            <TabsContent value="registration" className="space-y-6">
              <Card className={`border-primary/25 bg-primary/5 ${sectionFx}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Store className="h-5 w-5" />
                    Thông tin cơ bản về quán <Req />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brandName">
                        Tên quán / thương hiệu <Req />
                      </Label>
                      <Input
                        id="brandName"
                        placeholder="Nhập tên quán"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessType">
                        Loại hình kinh doanh <Req />
                      </Label>
                      <Select
                        value={businessTypeId}
                        onValueChange={(val) => setBusinessTypeId(val)}
                        disabled={businessTypesLoading}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              businessTypesLoading
                                ? "Đang tải loại hình..."
                                : "Chọn hoặc nhập loại hình"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2">
                            <Input
                              id="businessType"
                              placeholder="Gõ để tìm hoặc thêm mới rồi Enter"
                              value={businessTypeSearch}
                              onChange={(e) =>
                                setBusinessTypeSearch(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleBusinessTypeEnter();
                                }
                              }}
                            />
                          </div>

                          {businessTypesError && (
                            <div className="px-3 py-2 text-xs text-red-600">
                              {businessTypesError}
                            </div>
                          )}

                          {filteredBusinessTypes.length === 0 &&
                            !businessTypesError && (
                              <div className="px-3 py-2 text-xs text-muted-foreground">
                                Không tìm thấy loại hình phù hợp. Nhấn Enter để
                                thêm mới.
                              </div>
                            )}

                          {filteredBusinessTypes.map((bt) => (
                            <SelectItem key={bt.id} value={bt.id}>
                              {bt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">
                      Địa chỉ hoạt động <Req />
                    </Label>
                    <Input
                      id="address"
                      placeholder="Nhập địa chỉ chi tiết"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="openingHours">
                        Giờ hoạt động <Req />
                      </Label>
                      <Input
                        id="openingHours"
                        placeholder="VD: 08:00 - 22:00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logo">
                        Hình ảnh/Logo quán <Req />
                      </Label>
                      <div className="relative">
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          required
                          className="cursor-pointer file:hidden pr-10"
                        />
                        <Camera className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`border-primary/25 bg-primary/5 ${sectionFx}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Shield className="h-5 w-5" />
                    Thông tin pháp lý / xác thực <Req />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessLicense">
                      Giấy phép kinh doanh <Req />
                    </Label>
                    <div className="relative">
                      <Input
                        id="businessLicense"
                        type="file"
                        accept="image/*"
                        required
                        className="cursor-pointer file:hidden pr-10"
                      />
                      <Upload className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="foodSafety">
                      Giấy chứng nhận vệ sinh an toàn thực phẩm <Req />
                    </Label>
                    <div className="relative">
                      <Input
                        id="foodSafety"
                        type="file"
                        accept="image/*"
                        required
                        className="cursor-pointer file:hidden pr-10"
                      />
                      <Upload className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-1">
                      <Label htmlFor="idNumber">
                        Mã số CCCD <Req />
                      </Label>
                      <Input
                        id="idNumber"
                        placeholder="Nhập mã số CCCD"
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-1">
                      <Label htmlFor="idFront">
                        Ảnh CCCD mặt trước <Req />
                      </Label>
                      <div className="relative">
                        <Input
                          id="idFront"
                          type="file"
                          accept="image/*"
                          required
                          className="cursor-pointer file:hidden pr-10"
                        />
                        <Upload className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-1">
                      <Label htmlFor="idBack">
                        Ảnh CCCD mặt sau <Req />
                      </Label>
                      <div className="relative">
                        <Input
                          id="idBack"
                          type="file"
                          accept="image/*"
                          required
                          className="cursor-pointer file:hidden pr-10"
                        />
                        <Upload className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className={`border-primary/25 bg-primary/5 ${sectionFx}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <FileText className="h-5 w-5" />
                    Điều khoản & cam kết <Req />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="terms" required />
                    <Label htmlFor="terms">
                      Tôi chấp nhận Terms of Service & Policy <Req />
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="commitment1" required />
                    <Label htmlFor="commitment1">
                      Cam kết không gian lận hàng chờ, không ghost order <Req />
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="commitment2" required />
                    <Label htmlFor="commitment2">
                      Đồng ý cung cấp dữ liệu vận hành cho mục đích analytics{" "}
                      <Req />
                    </Label>
                  </div>
                </CardContent>
              </Card>

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
                      <Label className="text-sm font-medium">
                        Phí đăng ký lần đầu:
                      </Label>
                      <p className="text-lg font-bold text-green-600">
                        500,000 VND
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Phí hàng tháng:
                      </Label>
                      <p className="text-lg font-bold text-blue-600">
                        200,000 VND/tháng
                      </p>
                    </div>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Quy định thanh toán:</strong>
                      <br />
                      • Thời hạn: Trước ngày 30 mỗi tháng
                      <br />
                      • Chậm thanh toán: Shop bị khóa và không hoàn lại phí thuê
                      slot
                      <br />
                      • Phí phạt mở lại: 50% phí thuê slot + số tiền nợ tháng
                      trước
                      <br />• Yêu cầu đóng shop: Phải tạo yêu cầu trước 1 tháng
                    </AlertDescription>
                  </Alert>

                  <Button
                    className="w-full"
                    onClick={handleCheckBalanceAndOpenDialog}
                    disabled={submitting || checkingBalance}
                  >
                    {submitting || checkingBalance
                      ? "Đang xử lý..."
                      : "Thanh toán và gửi yêu cầu đăng ký"}
                  </Button>
                  {/* <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting
                      ? "Đang gửi..."
                      : "Thanh toán và gửi yêu cầu đăng ký"}
                  </Button> */}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
      <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {hasEnoughBalance ? "Xác nhận thanh toán" : "Số dư không đủ"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {hasEnoughBalance ? (
                <div className="space-y-3 mt-2">
                  <p>Vui lòng kiểm tra lại thông tin trước khi thanh toán:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Phí đăng ký:</span>
                    <span className="font-semibold text-emerald-600 text-right">
                      {REGISTER_FEE.toLocaleString("vi-VN")} VND
                    </span>

                    <span className="text-muted-foreground">
                      Số dư khả dụng:
                    </span>
                    <span className="font-semibold text-blue-600 text-right">
                      {(walletBalance ?? 0).toLocaleString("vi-VN")} VND
                    </span>

                    <span className="text-muted-foreground">
                      Số dư tạm tính:
                    </span>
                    <span className="font-semibold text-right">
                      {((walletBalance ?? 0) - REGISTER_FEE).toLocaleString(
                        "vi-VN"
                      )}{" "}
                      VND
                    </span>
                  </div>
                  <p className="text-xs text-amber-600 mt-2 text-center">
                    Sau khi xác nhận, hệ thống sẽ tạm giữ số tiền trên trong ví của bạn 
                    và gửi hồ sơ đăng ký quán đến hệ thống xét duyệt.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 mt-2">
                  <p>Số dư ví của bạn hiện tại không đủ để thanh toán.</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">
                      Phí đăng ký cần thanh toán:
                    </span>
                    <span className="font-semibold text-emerald-700 text-right">
                      {REGISTER_FEE.toLocaleString("vi-VN")} VND
                    </span>

                    <span className="text-muted-foreground">
                      Số dư hiện tại:
                    </span>
                    <span className="font-extrabold text-red-600 text-right">
                      {(walletBalance ?? 0).toLocaleString("vi-VN")} VND
                    </span>
                  </div>
                  <p className="text-xs text-red-600 mt-2">
                    Vui lòng nạp thêm tiền vào ví trước khi đăng ký quán.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            {hasEnoughBalance ? (
              <>
                <AlertDialogCancel disabled={submitting}>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  disabled={submitting}
                  onClick={async (e) => {
                    e.preventDefault(); // tránh auto-close của Radix
                    await handleConfirmPayment();
                  }}
                >
                  {submitting ? "Đang xử lý..." : "Xác nhận thanh toán"}
                </AlertDialogAction>
              </>
            ) : (
              <>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    setShowPaymentDialog(false);
                    await handleTopupViaVnPay();
                  }}
                >
                  Nạp tiền
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
