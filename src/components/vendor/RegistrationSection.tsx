// src/components/vendor/RegistrationSection.tsx

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  DollarSign,
  Store,
  Shield,
  Upload,
  Camera,
  AlertTriangle,
} from "lucide-react";

import { api, ApiResponse } from "@/lib/api";
import { buildMediaUrl } from "./utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Req = () => <span className="text-red-600 ml-0.5">*</span>;

const sectionFx =
  "transition-shadow transition-colors motion-safe:duration-300 motion-safe:ease-out " +
  "hover:shadow-lg hover:border-primary/30 focus-within:shadow-lg focus-within:border-primary/40";

interface VietQRBank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  lookupSupported?: boolean;
}
interface VietQRBanksResponse {
  code: string;
  desc: string;
  data: VietQRBank[];
}

export default function RegistrationSection({
  vendor,
  editable,
}: {
  vendor: any;
  editable: boolean;
}) {
  const [banks, setBanks] = useState<VietQRBank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState<string | null>(null);

  const [businessTypeId, setBusinessTypeId] = useState<string>(
    vendor?.businessTypeId || ""
  );
  const [selectedBankBin, setSelectedBankBin] = useState<string>(
    vendor?.bankBin || ""
  );
  const [bankAccount, setBankAccount] = useState<string>(
    vendor?.bankAccountNumber || ""
  );
  const [accountHolder, setAccountHolder] = useState<string>(
    vendor?.bankAccountHolder || ""
  );
  const [submitting, setSubmitting] = useState(false);

  const selectedBank = useMemo(
    () => banks.find((b) => b.bin === selectedBankBin),
    [banks, selectedBankBin]
  );

  useEffect(() => {
    setBusinessTypeId(vendor?.businessTypeId || "");
    setSelectedBankBin(vendor?.bankBin || "");
    setBankAccount(vendor?.bankAccountNumber || "");
    setAccountHolder(vendor?.bankAccountHolder || "");
  }, [
    vendor?.businessTypeId,
    vendor?.bankBin,
    vendor?.bankAccountNumber,
    vendor?.bankAccountHolder,
  ]);

  // LOAD BANK LIST FROM VIET QR
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
        if (!cancelled)
          setBanksError("Không tải được danh sách ngân hàng. Vui lòng thử lại.");
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
        body: JSON.stringify({
          bin: selectedBankBin,
          accountNumber: bankAccount,
        }),
      });

      if (!res.ok) return;

      const data = await res.json();
      const name = data?.data?.accountName as string | undefined;

      if (name) setAccountHolder(name);
    } catch {}
  }

  async function handleSubmit() {
    if (!editable) return;

    try {
      setSubmitting(true);

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
        (document.getElementById("invoiceInfo") as HTMLTextAreaElement)?.value ??
        "";

      const cccdNumber = (
        document.getElementById("idNumber") as HTMLInputElement
      )?.value?.trim();

      // files
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

      const acceptTerms =
        (document.getElementById("terms") as HTMLInputElement)?.checked ??
        undefined;
      const commitNoFraud =
        (document.getElementById("commitment1") as HTMLInputElement)?.checked ??
        undefined;
      const commitAnalytics =
        (document.getElementById("commitment2") as HTMLInputElement)?.checked ??
        undefined;

      if (
        !brandName ||
        !businessTypeId ||
        !address ||
        !openingHours ||
        !phone ||
        !email
      ) {
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
      fd.append(
        "BankName",
        selectedBank?.shortName || selectedBank?.name || ""
      );
      fd.append("BankAccountNumber", bankAccount);
      fd.append("BankAccountHolder", accountHolder);
      fd.append("InvoiceInfo", invoiceInfo ?? "");

      if (typeof acceptTerms === "boolean")
        fd.append("AcceptTerms", String(acceptTerms));
      if (typeof commitNoFraud === "boolean")
        fd.append("CommitNoFraud", String(commitNoFraud));
      if (typeof commitAnalytics === "boolean")
        fd.append("CommitAnalytics", String(commitAnalytics));

      const token = localStorage.getItem("accessToken") || "";
      const userId = localStorage.getItem("userId") || "";
      const headers: Record<string, string> = {};

      if (token) headers.Authorization = `Bearer ${token}`;
      if (userId) headers["X-User-Id"] = userId;

      if (vendor?.id) {
        await api.post<ApiResponse<any>>(
          `/api/vendor/${vendor.id}`,
          fd,
          headers
        );
        toast.success("Cập nhật thông tin thành công!");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Cập nhật thông tin thất bại! Vui lòng liên hệ admin.");
    } finally {
      setSubmitting(false);
    }
  }

  const editableInputCls = editable
    ? ""
    : "opacity-60 pointer-events-none select-none";

  return (
    <div className="space-y-6">
      {/* BASIC INFORMATION */}
      <Card className={`border-primary/25 bg-primary/5 ${sectionFx}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Store className="h-5 w-5" />
            Thông tin cơ bản về quán {editable && <Req />}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* NAME + BUSINESS TYPE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NAME */}
            <div className="space-y-2">
              <Label className="font-semibold" htmlFor="brandName">
                Tên quán / thương hiệu {editable && <Req />}
              </Label>
              {editable ? (
                <Input
                  id="brandName"
                  defaultValue={vendor?.name}
                  placeholder="Nhập tên quán"
                  required
                />
              ) : (
                <p className="font-normal">{vendor?.name || "—"}</p>
              )}
            </div>

            {/* BUSINESS TYPE */}
            <div className="space-y-2">
              <Label className="font-semibold" htmlFor="businessType">
                Loại hình kinh doanh {editable && <Req />}
              </Label>

              {editable ? (
                <Select
                  value={businessTypeId}
                  onValueChange={setBusinessTypeId}
                >
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

          {/* ADDRESS */}
          <div className="space-y-2">
            <Label className="font-semibold" htmlFor="address">
              Địa chỉ hoạt động {editable && <Req />}
            </Label>
            {editable ? (
              <Input
                id="address"
                defaultValue={vendor?.address}
                placeholder="Nhập địa chỉ chi tiết"
                required
              />
            ) : (
              <p className="font-normal">{vendor?.address || "—"}</p>
            )}
          </div>

          {/* OPEN + PHONE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* HOURS */}
            <div className="space-y-2">
              <Label className="font-semibold" htmlFor="openingHours">
                Giờ hoạt động {editable && <Req />}
              </Label>
              {editable ? (
                <Input
                  id="openingHours"
                  defaultValue={vendor?.openingHours}
                  placeholder="VD: 08:00 - 22:00"
                  required
                />
              ) : (
                <p className="font-normal">{vendor?.openingHours || "—"}</p>
              )}
            </div>

            {/* PHONE */}
            <div className="space-y-2">
              <Label className="font-semibold" htmlFor="phone">
                Số điện thoại {editable && <Req />}
              </Label>
              {editable ? (
                <Input
                  id="phone"
                  defaultValue={vendor?.phone}
                  placeholder="Nhập số điện thoại"
                  required
                />
              ) : (
                <p className="font-normal">{vendor?.phone || "—"}</p>
              )}
            </div>
          </div>

          {/* EMAIL + LOGO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* EMAIL */}
            <div className="space-y-2">
              <Label className="font-semibold" htmlFor="email">
                Email liên hệ {editable && <Req />}
              </Label>
              {editable ? (
                <Input
                  id="email"
                  type="email"
                  defaultValue={vendor?.email}
                  placeholder="Nhập email"
                  required
                />
              ) : (
                <p className="font-normal">{vendor?.email || "—"}</p>
              )}
            </div>

            {/* LOGO */}
            <div className="space-y-2">
              <Label className="font-semibold" htmlFor="logo">
                Hình ảnh/Logo quán {editable && <Req />}
              </Label>

              {editable ? (
                <div className="flex items-center gap-2">
                  <Input id="logo" type="file" accept="image/*" />
                  <Camera className="h-4 w-4 text-muted-foreground" />
                </div>
              ) : vendor?.logoUrl ? (
                <img
                  src={buildMediaUrl(vendor.logoUrl)}
                  alt="logo"
                  className="h-14 w-14 rounded object-cover"
                />
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========== LEGAL SECTION ========== */}
      <Card className={`border-primary/25 bg-primary/5 ${sectionFx}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            Thông tin pháp lý / xác thực {editable && <Req />}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* BUSINESS LICENSE */}
          <div className="space-y-2">
            <Label className="font-semibold" htmlFor="businessLicense">
              Giấy phép kinh doanh {editable && <Req />}
            </Label>

            {editable ? (
              <div className="flex items-center gap-2">
                <Input id="businessLicense" type="file" accept="image/*" />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
            ) : vendor?.businessLicenseUrl ? (
              <img
                src={buildMediaUrl(vendor.businessLicenseUrl)}
                className="h-28 rounded object-cover"
              />
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>

          {/* FOOD SAFETY CERT */}
          <div className="space-y-2">
            <Label className="font-semibold" htmlFor="foodSafety">
              Giấy chứng nhận VSATTP {editable &&<Req />}
            </Label>

            {editable ? (
              <div className="flex items-center gap-2">
                <Input id="foodSafety" type="file" accept="image/*" />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
            ) : vendor?.foodSafetyCertUrl ? (
              <img
                src={buildMediaUrl(vendor.foodSafetyCertUrl)}
                className="h-28 rounded object-cover"
              />
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>

          {/* CCCD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* NUMBER */}
            <div className="space-y-2 md:col-span-1">
              <Label className="font-semibold" htmlFor="idNumber">
                Mã số CCCD {editable && <Req />}
              </Label>
              {editable ? (
                <Input
                  id="idNumber"
                  defaultValue={vendor?.personalIdentityNumber || ""}
                  placeholder="Nhập mã số CCCD"
                />
              ) : (
                <p className="font-normal">
                  {vendor?.personalIdentityNumber || "—"}
                </p>
              )}
            </div>

            {/* FRONT */}
            <div className="space-y-2 md:col-span-1">
              <Label className="font-semibold" htmlFor="idFront">
                Ảnh CCCD mặt trước {editable && <Req />}
              </Label>

              {editable ? (
                <div className="flex items-center gap-2">
                  <Input id="idFront" type="file" accept="image/*" />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
              ) : vendor?.personalIdentityFront ? (
                <img
                  src={buildMediaUrl(vendor.personalIdentityFront)}
                  className="h-28 rounded object-cover"
                />
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>

            {/* BACK */}
            <div className="space-y-2 md:col-span-1">
              <Label className="font-semibold" htmlFor="idBack">
                Ảnh CCCD mặt sau {editable && <Req />}
              </Label>
              {editable ? (
                <div className="flex items-center gap-2">
                  <Input id="idBack" type="file" accept="image/*" />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
              ) : vendor?.personalIdentityBack ? (
                <img
                  src={buildMediaUrl(vendor.personalIdentityBack)}
                  className="h-28 rounded object-cover"
                />
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========== FINANCE SECTION ========== */}
      <Card className={`border-primary/25 bg-primary/5 ${sectionFx}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <DollarSign className="h-5 w-5" />
            Thông tin tài chính / thanh toán {editable && <Req />}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* BANK SELECT */}
          <div className="space-y-2">
            <Label className="font-semibold" htmlFor="bankName">
              Tên ngân hàng {editable && <Req />}
            </Label>

            {editable ? (
              <Select
                value={selectedBankBin}
                onValueChange={setSelectedBankBin}
                disabled={banksLoading || !!banksError}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      banksLoading
                        ? "Đang tải danh sách ngân hàng..."
                        : banksError
                        ? "Không tải được danh sách. Thử lại."
                        : "Chọn ngân hàng"
                    }
                  />
                </SelectTrigger>

                <SelectContent className="max-h-80">
                  {banks.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {banksError ? banksError : "Không có dữ liệu ngân hàng"}
                    </div>
                  ) : (
                    banks.map((b) => (
                      <SelectItem key={b.bin} value={b.bin}>
                        <span className="flex items-center gap-2">
                          <img
                            src={b.logo}
                            alt={b.shortName}
                            className="h-4 w-4 rounded-sm object-contain"
                          />
                          <span className="truncate">
                            {b.shortName || b.name}
                          </span>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            ) : (
              <p className="font-normal">
                {vendor?.bankName ||
                  (vendor?.bankBin ? `BIN ${vendor.bankBin}` : "—")}
              </p>
            )}

            {selectedBank && editable && (
              <p className="text-xs text-muted-foreground">
                Mã BIN: {selectedBank.bin}
                {selectedBank.lookupSupported ? " • Hỗ trợ tra cứu chủ TK" : ""}
              </p>
            )}
          </div>

          {/* BANK ACCOUNT */}
          <div className="space-y-2">
            <Label className="font-semibold" htmlFor="bankAccount">
              Tài khoản ngân hàng / ví điện tử {editable && <Req />}
            </Label>

            {editable ? (
              <div className="flex gap-2">
                <Input
                  id="bankAccount"
                  placeholder="Nhập số tài khoản"
                  required
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={lookupAccountName}
                  disabled={
                    !selectedBankBin ||
                    !bankAccount ||
                    !selectedBank?.lookupSupported
                  }
                >
                  Tra cứu
                </Button>
              </div>
            ) : (
              <p className="font-normal">{vendor?.bankAccountNumber || "—"}</p>
            )}

            {editable ? (
              <p className="text-xs text-muted-foreground">
                Chọn ngân hàng và nhập số tài khoản, sau đó bấm <em>Tra cứu</em>{" "}
                để điền tên chủ tài khoản (nếu hỗ trợ).
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Chủ TK: {vendor?.bankAccountHolder || "—"}
              </p>
            )}
          </div>

          {/* ACCOUNT HOLDER */}
          <div className="space-y-2">
            <Label className="font-semibold" htmlFor="accountHolder">
              Tên chủ tài khoản {editable && <Req />}
            </Label>

            {editable ? (
              <Input
                id="accountHolder"
                placeholder="Tên chủ tài khoản"
                required
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
              />
            ) : (
              <p className="font-normal">{vendor?.bankAccountHolder || "—"}</p>
            )}
          </div>

          {/* INVOICE INFO */}
          <div className="space-y-2">
            <Label className="font-semibold" htmlFor="invoiceInfo">
              Thông tin xuất hóa đơn
            </Label>
            {editable ? (
              <Textarea
                id="invoiceInfo"
                defaultValue={vendor?.invoiceInfo || ""}
                placeholder="Nhập thông tin xuất hóa đơn (nếu có)"
              />
            ) : (
              <p className="font-normal whitespace-pre-wrap">
                {vendor?.invoiceInfo || "—"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ========== COST SECTION ========== */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <DollarSign className="h-5 w-5" />
            Thông tin chi phí
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* FEES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">
                Phí đăng ký lần đầu:
              </Label>
              <p className="text-lg font-bold text-green-600">500,000 VND</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Phí hàng tháng:</Label>
              <p className="text-lg font-bold text-blue-600">
                200,000 VND/tháng
              </p>
            </div>
          </div>

          {/* RULES */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Quy định thanh toán:</strong>
              <br />• Thời hạn: Trước ngày 30 mỗi tháng
              <br />• Chậm thanh toán: Shop bị khóa và không hoàn lại phí thuê
              slot
              <br />• Phí phạt mở lại: 50% phí thuê slot + số tiền nợ tháng
              trước
              <br />• Yêu cầu đóng shop: Phải tạo yêu cầu trước 1 tháng
            </AlertDescription>
          </Alert>

          {/* SUBMIT */}
          {editable ? (
            <div className="space-y-3">
              {/* TERMS */}
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="terms" />
                <Label htmlFor="terms">
                  Tôi chấp nhận Terms of Service & Policy <Req />
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="commitment1" />
                <Label htmlFor="commitment1">
                  Cam kết không gian lận hàng chờ, không ghost order <Req />
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="commitment2" />
                <Label htmlFor="commitment2">
                  Đồng ý cung cấp dữ liệu vận hành cho mục đích analytics{" "}
                  <Req />
                </Label>
              </div>

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Đang gửi..." : "Cập nhật thông tin"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Hồ sơ đã gửi. Không thể chỉnh sửa khi trạng thái không phải
              Nháp/Chờ duyệt.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}