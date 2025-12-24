import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";

/* ================= TYPES ================= */
type LinkedBank = {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  isDefault: boolean;
};

type PublicBank = {
  id: number;
  name: string;
  code: string;
  shortName: string;
  logo: string;
};

type Props = {
  open: boolean;
  isVendor: boolean;
  onOpenChange: (v: boolean) => void;
};

type PaginatedResponse<T> = {
  totalRecords: number;
  page: number;
  pageSize: number;
  totalPages: number;
  data: T[];
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

type ApiResponse<T> = {
  data: T;
  additionalData: unknown;
  message: string | null;
  statusCode: number;
  code: string;
};

type CreateBankAccountPayload = {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  userId: string;
  isVendor: boolean;
  isDefault: boolean;
};

/* ================= PUBLIC BANK API ================= */
const BANK_API =
  import.meta.env.VITE_PUBLIC_BANK_API ??
  "https://api.vietqr.io/v2/banks";

/* ================= COMPONENT ================= */
export function BankLinkDialog({ open, onOpenChange, isVendor }: Props) {
  /* ===== STATE ===== */
  const [linkedBanks, setLinkedBanks] = useState<LinkedBank[]>([]);
  const [publicBanks, setPublicBanks] = useState<PublicBank[]>([]);
  const [step, setStep] = useState<"list" | "add">("list");

  const [selectedBank, setSelectedBank] = useState<PublicBank | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [loadingLinked, setLoadingLinked] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const userId = localStorage.getItem("userId");

  const accountHolder =
    localStorage.getItem("fullName") || "Người dùng";

  const maskAccountNumber = (value: string) => {
    if (value.length <= 6) return value;
    return `${value.slice(0, 3)}*****${value.slice(-3)}`;
  };

  const bankLogoMap = useMemo(() => {
    return publicBanks.reduce<Record<string, string>>((acc, b) => {
      acc[b.code] = b.logo;
      return acc;
    }, {});
  }, [publicBanks]);

  const getBankLogo = (bank: LinkedBank) => {
    const byCode = publicBanks.find(
        (b) => b.code.toLowerCase() === bank.bankCode?.toLowerCase()
    );
    if (byCode) return byCode.logo;

    const byName = publicBanks.find((b) =>
        bank.bankName
        .toLowerCase()
        .includes(b.name.toLowerCase())
    );
    return byName?.logo;
    };

    const handleDeleteBank = async (bank: LinkedBank) => {
    if (bank.isDefault) {
        toast.error("Không thể xoá ngân hàng mặc định");
        return;
    }

    if (!confirm("Bạn có chắc muốn huỷ liên kết ngân hàng này?")) {
        return;
    }

    try {
        await api.delete(`/api/BankAccount/${bank.id}`);
        toast.success("Đã huỷ liên kết ngân hàng");
        await loadLinkedBanks();
    } catch {
        toast.error("Huỷ liên kết thất bại");
    }
    };


  const loadLinkedBanks = async () => {
    try {
      setLoadingLinked(true);

      const params = new URLSearchParams({
      userId: userId,
      isVendor: String(isVendor)
    });
      const res = (await api.get(
        `/api/BankAccount?${params.toString()}`
      )) as ApiResponse<PaginatedResponse<LinkedBank>>;

      setLinkedBanks(res.data.data);
    } catch {
      toast.error("Không tải được ngân hàng đã liên kết");
    } finally {
      setLoadingLinked(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    const loadPublicBanks = async () => {
      try {
        setLoadingBanks(true);
        const res = await fetch(BANK_API);
        const json = await res.json();
        setPublicBanks(json?.data ?? []);
      } catch {
        toast.error("Không tải được danh sách ngân hàng");
      } finally {
        setLoadingBanks(false);
      }
    };

    loadLinkedBanks();
    loadPublicBanks();
  }, [open]);

  const handleAddBank = async () => {
    if (!selectedBank || !accountNumber) {
      toast.error("Vui lòng nhập số tài khoản");
      return;
    }

    const payload: CreateBankAccountPayload = {
      bankName: selectedBank.name,
      bankCode: selectedBank.code,
      accountNumber,
      accountHolder,
      userId: userId,
      isVendor: isVendor,
      isDefault: linkedBanks.length === 0,
    };

    try {
      setSubmitting(true);

      await api.post("/api/BankAccount", payload);

      toast.success("Liên kết ngân hàng thành công");

      setStep("list");
      setSelectedBank(null);
      setAccountNumber("");

      await loadLinkedBanks();
    } catch {
      toast.error("Liên kết ngân hàng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setStep("list");
          setSelectedBank(null);
          setAccountNumber("");
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        {step === "list" && (
          <>
            <DialogHeader>
              <DialogTitle>Ngân hàng đã liên kết</DialogTitle>
            </DialogHeader>

            {loadingLinked ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Đang tải...
              </p>
            ) : linkedBanks.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Bạn chưa liên kết ngân hàng nào
              </p>
            ) : (
              <div className="space-y-3">
                {linkedBanks.map((b) => (
                <div
                    key={b.id}
                    className={`flex justify-between items-center rounded-xl p-4 border
                    ${b.isDefault ? "border-green-500 bg-green-50" : "hover:bg-muted"}
                    `}
                >
                    <div className="flex items-center gap-4">
                    {getBankLogo(b) && (
                        <img
                        src={getBankLogo(b)}
                        alt={b.bankName}
                        className="h-12 w-12 object-contain rounded-md bg-white p-1"
                        />
                    )}

                    <div className="space-y-0.5">
                        <p className="font-semibold text-sm">{b.bankName}</p>
                        <p className="text-xs text-muted-foreground">
                        {maskAccountNumber(b.accountNumber)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                        {b.accountHolder}
                        </p>
                    </div>
                    </div>

                    <div className="flex items-center gap-2">
                    {b.isDefault ? (
                        <span className="text-xs font-semibold text-green-600">
                        Mặc định
                        </span>
                    ) : (
                        <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBank(b)}
                        className="text-destructive hover:bg-destructive/10"
                        >
                        🗑️
                        </Button>
                    )}
                    </div>
                </div>
                ))}

              </div>
            )}

            <DialogFooter className="mt-6">
              <Button className="w-full" onClick={() => setStep("add")}>
                + Liên kết ngân hàng
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "add" && (
          <>
            <DialogHeader>
              <DialogTitle>Liên kết ngân hàng</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 max-h-[220px] overflow-y-auto">
                {loadingBanks && (
                  <p className="col-span-2 text-sm text-muted-foreground">
                    Đang tải ngân hàng...
                  </p>
                )}

                {!loadingBanks &&
                  publicBanks.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBank(b)}
                      className={`p-3 border rounded-xl cursor-pointer transition
                        ${
                          selectedBank?.code === b.code
                            ? "border-primary bg-primary/10"
                            : "hover:bg-muted"
                        }
                      `}
                    >
                      <img
                        src={b.logo}
                        alt={b.name}
                        className="h-8 mx-auto"
                      />
                      <p className="text-xs text-center mt-1">
                        {b.shortName}
                      </p>
                    </div>
                  ))}
              </div>

              {selectedBank && (
                <Input
                  placeholder="Số tài khoản"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              )}
            </div>

            <DialogFooter className="mt-6 flex gap-2">
              <Button variant="outline" onClick={() => setStep("list")}>
                Quay lại
              </Button>
              <Button onClick={handleAddBank} disabled={submitting}>
                {submitting ? "Đang xử lý..." : "Liên kết"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
