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

  const isVerified = useMemo(
    () =>
      Boolean(
        vendor?.businessLicenseUrl &&
        vendor?.foodSafetyCertUrl &&    
        vendor?.personalIdentityNumber &&
        vendor?.personalIdentityFront &&
        vendor?.personalIdentityBack
      ),
    [
      vendor?.businessLicenseUrl,
      vendor?.foodSafetyCertUrl,
      vendor?.personalIdentityNumber,
      vendor?.personalIdentityFront,
      vendor?.personalIdentityBack,
    ]
  );


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

            {/* <div className="space-y-2">
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
                <p className="font-normal">{vendor?.businessTypeName || "—"}</p>
              )}
            </div> */}
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* <div className="space-y-2">
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
            </div> */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* <div className="space-y-2">
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
            </div> */}

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

      <Card
        className={`
          relative overflow-hidden border-0 bg-transparent ${sectionFx}
        `}
      >
        <div className="relative rounded-2xl bg-gradient-to-br from-primary/70 via-primary/30 to-emerald-400/70 p-[1.5px] shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
          <div className="relative rounded-2xl bg-gradient-to-br from-background via-background/90 to-primary/5">
            <div className="pointer-events-none absolute -left-24 top-0 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 bottom-0 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" />

            <CardHeader className="relative z-[1] flex flex-col gap-3 border-b border-primary/10 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-primary/20">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
                    Thông tin pháp lý / xác thực {editable && <Req />}
                  </CardTitle>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    Cung cấp đầy đủ giấy tờ để kích hoạt trạng thái nhà cung cấp đã xác thực.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`
                    inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium
                    ${
                      isVerified
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-500"
                    }
                  `}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isVerified ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                  {isVerified ? "Đã đủ thông tin" : "Chưa đủ thông tin"}
                </div>

                {editable && (
                  <span className="hidden text-[11px] text-muted-foreground sm:inline">
                    Trạng thái được cập nhật tự động khi bạn lưu thông tin.
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="relative z-[1] space-y-5 pt-4">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_1.2fr]">
                <div className="group relative overflow-hidden rounded-xl border border-primary/10 bg-background/60 p-3.5 shadow-sm transition hover:border-primary/40 hover:shadow-md">
                  <div className="absolute right-4 top-3 text-[10px] font-semibold uppercase tracking-wide text-primary/60">
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-semibold" htmlFor="businessLicense">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        1
                      </span>
                      Giấy phép kinh doanh {editable && <Req />}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Tải ảnh rõ nét, bao gồm tên doanh nghiệp, địa chỉ và ngành nghề.
                    </p>
                  </div>

                  <div className="mt-3">
                    {editable ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <label
                          htmlFor="businessLicense"
                          className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 text-xs text-muted-foreground transition hover:border-primary/60 hover:bg-muted/70"
                        >
                          <Upload className="mb-1 h-5 w-5 opacity-70" />
                          <span className="font-medium text-foreground">Chọn hoặc kéo thả file</span>
                          <span className="text-[10px] text-muted-foreground/80">
                            Hỗ trợ PNG, JPG (tối đa ~5MB)
                          </span>
                        </label>
                        <Input
                          id="businessLicense"
                          type="file"
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    ) : vendor?.businessLicenseUrl ? (
                      <div className="relative mt-1 overflow-hidden rounded-lg border border-primary/10 bg-muted/50">
                        <img
                          src={buildMediaUrl(vendor.businessLicenseUrl)}
                          className="h-32 w-full object-contain"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                        <div className="pointer-events-none absolute bottom-1.5 right-2 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 backdrop-blur group-hover:opacity-100">
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Chưa có dữ liệu — vui lòng bổ sung.</span>
                    )}
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl border border-primary/10 bg-background/60 p-3.5 shadow-sm transition hover:border-primary/40 hover:shadow-md">
                  <div className="absolute right-4 top-3 text-[10px] font-semibold uppercase tracking-wide text-primary/60">
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-semibold" htmlFor="foodSafety">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        2
                      </span>
                      Giấy chứng nhận VSATTP {editable && <Req />}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Bắt buộc cho đơn vị kinh doanh thực phẩm, đồ uống, bếp ăn, F&amp;B.
                    </p>
                  </div>

                  <div className="mt-3">
                    {editable ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <label
                          htmlFor="foodSafety"
                          className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 text-xs text-muted-foreground transition hover:border-primary/60 hover:bg-muted/70"
                        >
                          <Upload className="mb-1 h-5 w-5 opacity-70" />
                          <span className="font-medium text-foreground">Chọn hoặc kéo thả file</span>
                          <span className="text-[10px] text-muted-foreground/80">
                            Hỗ trợ PNG, JPG (tối đa ~5MB)
                          </span>
                        </label>
                        <Input id="foodSafety" type="file" accept="image/*" className="hidden" />
                      </div>
                    ) : vendor?.foodSafetyCertUrl ? (
                      <div className="relative mt-1 overflow-hidden rounded-lg border border-primary/10 bg-muted/50">
                        <img
                          src={buildMediaUrl(vendor.foodSafetyCertUrl)}
                          className="h-32 w-full object-contain"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                        <div className="pointer-events-none absolute bottom-1.5 right-2 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 backdrop-blur group-hover:opacity-100">
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Chưa có dữ liệu — có thể bổ sung sau nếu không thuộc ngành thực phẩm.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-primary/10 bg-background/60 p-3.5 shadow-sm">
                <div className="absolute right-4 top-3 text-[10px] font-semibold uppercase tracking-wide text-primary/60">
                </div>

                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      3
                    </span>
                    <p className="text-sm font-semibold">Thông tin CCCD cá nhân {editable && <Req />}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Dùng để xác thực chủ sở hữu gian hàng, không hiển thị với khách.
                  </p>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
                  <div className="w-full md:w-1/2 space-y-2">
                    <Label className="text-sm font-semibold" htmlFor="idNumber">
                      Mã số CCCD
                    </Label>
                    {editable ? (
                      <Input
                        id="idNumber"
                        defaultValue={vendor?.personalIdentityNumber || ""}
                        placeholder="Ví dụ: 0xx xxx xxx xxx"
                        className="h-10 text-base tracking-[0.18em] font-medium"
                      />
                    ) : (
                      <div className="rounded-md border border-muted/70 bg-muted/40 px-3 py-2">
                        <p className="text-base font-semibold tracking-[0.18em]">
                          {vendor?.personalIdentityNumber || "—"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="w-full md:w-1/2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold" htmlFor="idFront">
                          Mặt trước
                        </Label>

                        {editable ? (
                          <div className="flex items-center justify-center">
                            <label
                              htmlFor="idFront"
                              className="flex aspect-[85/54] w-full max-w-[180px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 text-[11px] text-muted-foreground transition hover:border-primary/60 hover:bg-muted/70"
                            >
                              <div className="flex flex-col items-center gap-1">
                                <Upload className="h-4 w-4 opacity-70" />
                                <span className="font-medium text-foreground">
                                  Tải ảnh mặt trước
                                </span>
                              </div>
                            </label>
                            <Input id="idFront" type="file" accept="image/*" className="hidden" />
                          </div>
                        ) : vendor?.personalIdentityFront ? (
                          <div className="flex justify-start">
                            <div className="aspect-[85/54] w-full max-w-[180px] overflow-hidden rounded-lg border border-primary/10 bg-muted/60">
                              <img
                                src={buildMediaUrl(vendor.personalIdentityFront)}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-semibold" htmlFor="idBack">
                          Mặt sau
                        </Label>

                        {editable ? (
                          <div className="flex items-center justify-center">
                            <label
                              htmlFor="idBack"
                              className="flex aspect-[85/54] w-full max-w-[180px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 text-[11px] text-muted-foreground transition hover:border-primary/60 hover:bg-muted/70"
                            >
                              <div className="flex flex-col items-center gap-1">
                                <Upload className="h-4 w-4 opacity-70" />
                                <span className="font-medium text-foreground">
                                  Tải ảnh mặt sau
                                </span>
                              </div>
                            </label>
                            <Input id="idBack" type="file" accept="image/*" className="hidden" />
                          </div>
                        ) : vendor?.personalIdentityBack ? (
                          <div className="flex justify-start">
                            <div className="aspect-[85/54] w-full max-w-[180px] overflow-hidden rounded-lg border border-primary/10 bg-muted/60">
                              <img
                                src={buildMediaUrl(vendor.personalIdentityBack)}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
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
              <p className="text-lg font-bold text-green-600">500,000 VND</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Phí hàng tháng:</Label>
              <p className="text-lg font-bold text-blue-600">
                200,000 VND/tháng
              </p>
            </div>
          </div>

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

          {editable ? (
            <div className="space-y-3">
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