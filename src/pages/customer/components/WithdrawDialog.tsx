import { useEffect, useState } from "react";
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

type LinkedBank = {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  isDefault: boolean;
};

type ApiResponse<T> = {
  data: T;
  additionalData: unknown;
  message: string | null;
  statusCode: number;
  code: string;
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

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  availableBalance: number;
  walletId: string;
  isVendor: boolean;
  onSuccess: () => void;
};

type PublicBank = {
  id: number;
  name: string;
  code: string;
  shortName: string;
  logo: string;
};


export function WithdrawDialog({
  open,
  onOpenChange,
  availableBalance,
  walletId,
  isVendor,
  onSuccess,
}: Props) {
  const [amount, setAmount] = useState("");
  const [banks, setBanks] = useState<LinkedBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<LinkedBank | null>(null);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [publicBanks, setPublicBanks] = useState<PublicBank[]>([]);
  const userId = localStorage.getItem("userId");

  const maskAccountNumber = (value: string) => {
    if (value.length <= 6) return value;
    return `${value.slice(0, 3)}*****${value.slice(-3)}`;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = e.target.value.replace(/,/g, "").replace(/\D/g, "");
    setAmount(numeric ? numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "");
  };

    const numericAmount = Number(amount.replace(/,/g, ""));

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


  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
        try {
        setLoadingBanks(true);

        const params = new URLSearchParams({
            userId: userId,
            isVendor: String(isVendor)
        });
        const res = (await api.get(
            `/api/BankAccount?${params.toString()}`
        )) as ApiResponse<PaginatedResponse<LinkedBank>>;

        const linked = res.data.data;
        setBanks(linked);

        const defaultBank = linked.find((b) => b.isDefault);
        if (defaultBank) setSelectedBank(defaultBank);

        const bankRes = await fetch(
            import.meta.env.VITE_PUBLIC_BANK_API ??
            "https://api.vietqr.io/v2/banks"
        );
        const bankJson = await bankRes.json();
        setPublicBanks(bankJson?.data ?? []);
        } catch {
        toast.error("Không tải được dữ liệu ngân hàng");
        } finally {
        setLoadingBanks(false);
        }
    };

    loadData();
    }, [open]);



  const handleWithdraw = async () => {
    if (!numericAmount || numericAmount <= 0) {
      toast.warning("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    if (numericAmount > availableBalance) {
      toast.warning("Số tiền vượt quá số dư khả dụng");
      return;
    }

    if (!selectedBank) {
      toast.warning("Bạn chưa chọn ngân hàng");
      return;
    }

    try {
      setSubmitting(true);

      await withdrawWallet(walletId, numericAmount);

      toast.success("Yêu cầu rút tiền đã được gửi");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Rút tiền thất bại");
    } finally {
      setSubmitting(false);
    }
  };

    const withdrawWallet = async (
        walletId: string,
        amount: number
        ) => {
        return api.post(
            `/api/WalletTransaction/withdraw/${walletId}`,
            { amount, isVendor }
        );
    };


  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setAmount("");
          setSelectedBank(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-1">
          <DialogTitle className="text-xl font-bold">
            Rút tiền về ngân hàng
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Tiền sẽ được chuyển trong vòng 24 giờ
          </p>
        </DialogHeader>

        <div className="mt-6 flex flex-col items-center gap-1">
          <Input
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={handleAmountChange}
            className="
              text-center text-3xl font-bold
              border-0 shadow-none
              focus-visible:ring-0
            "
          />
          <span className="text-sm text-muted-foreground">VND</span>

          <p className="text-xs text-muted-foreground mt-2">
            Số dư khả dụng:{" "}
            <span className="font-semibold">
              {availableBalance.toLocaleString("vi-VN")} VND
            </span>
          </p>

          {numericAmount > availableBalance && (
            <p className="text-xs text-red-600 mt-1">
              Số tiền vượt quá số dư khả dụng
            </p>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-sm font-medium">Ngân hàng nhận tiền</p>

          {loadingBanks && (
            <p className="text-sm text-muted-foreground">
              Đang tải ngân hàng...
            </p>
          )}

          {!loadingBanks && banks.length === 0 && (
            <p className="text-sm text-red-600">
              Bạn chưa liên kết ngân hàng nào
            </p>
          )}

          {!loadingBanks && banks.length > 0 && (
            <div className="space-y-3">
              {banks.map((b) => {
                const isSelected = selectedBank?.id === b.id;

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBank(b)}
                    className={`
                      flex items-center justify-between p-4 rounded-xl border cursor-pointer
                      ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "hover:bg-muted"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                        {getBankLogo(b) && (
                            <img
                            src={getBankLogo(b)}
                            alt={b.bankName}
                            className="h-12 w-12 object-contain rounded-md bg-white p-1"
                            />
                        )}

                        <div>
                            <p className="font-semibold text-sm">{b.bankName}</p>
                            <p className="text-xs text-muted-foreground">
                            {maskAccountNumber(b.accountNumber)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                            {b.accountHolder}
                            </p>
                        </div>
                    </div>


                    <span
                      className={`
                        h-4 w-4 rounded-full border-2 flex items-center justify-center
                        ${isSelected ? "border-primary" : "border-muted"}
                      `}
                    >
                      {isSelected && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button
            className="w-full h-12 text-lg font-semibold"
            onClick={handleWithdraw}
            disabled={
              submitting ||
              !numericAmount ||
              numericAmount > availableBalance ||
              !selectedBank
            }
          >
            {submitting ? "Đang xử lý..." : "Rút tiền"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
