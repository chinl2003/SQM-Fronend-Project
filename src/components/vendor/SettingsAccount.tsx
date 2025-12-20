// src/components/vendor/SettingsAccount.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Activity,
  Clock,
  Info,
  Save,
  Loader2,
} from "lucide-react";
import { api, ApiResponse } from "@/lib/api";
import { toast } from "sonner";

type SettingsAccountProps = {
  vendorId: string; // cần truyền vào từ SettingsTab
};

export default function SettingsAccount({ vendorId }: SettingsAccountProps) {
  useEffect(() => {
    const fetchEtaSetting = async () => {
      if (!vendorId) return;

      try {
        const token = localStorage.getItem("accessToken") || "";
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const res = await api.get<ApiResponse<any>>(
          `/api/vendor/${vendorId}/eta-setting`,
          headers
        );

        const payload = (res as any)?.data ?? res;
        const data = payload?.data;

        if (data && typeof data.bufferMinutes === "number") {
          setBufferMinutes(data.bufferMinutes);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchEtaSetting();
  }, [vendorId]);

  const [isOpen, setIsOpen] = useState(true); // trạng thái quán
  const [bufferMinutes, setBufferMinutes] = useState<number | string>(10); // thời gian chênh lệch (phút)
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggleActive = async (value: boolean) => {
    if (!vendorId) return;

    const previous = isOpen;
    setIsOpen(value);
    setToggling(true);

    try {
      const token = localStorage.getItem("accessToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      await api.post<ApiResponse<any>>(
        `/api/vendor/${vendorId}/is-active`,
        { isActive: value },
        headers
      );

      toast.success(
        value
          ? "Quán của bạn hiện đang hoạt động trên hệ thống!"
          : "Quán của bạn đã ngừng hoạt động trên hệ thống!"
      );
    } catch (err) {
      console.error(err);
      setIsOpen(previous);
      toast.error("Cập nhật trạng thái quán thất bại. Vui lòng thử lại.");
    } finally {
      setToggling(false);
    }
  };

  const handleSave = async () => {
    if (!vendorId) return;

    try {
      setSaving(true);

      const minutes = Number(bufferMinutes);
      if (Number.isNaN(minutes)) {
        toast.error("Vui lòng nhập số phút hợp lệ.");
        return;
      }

      const token = localStorage.getItem("accessToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      await api.post<ApiResponse<any>>(
        `/api/vendor/${vendorId}/eta-setting/buffer`,
        { bufferMinutes: minutes },
        headers
      );

      toast.success("Đã lưu thời gian chênh lệch của quán.");
    } catch (err) {
      console.error(err);
      toast.error("Lưu cấu hình thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header nhỏ phía trên card cho có cảm giác page config */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
            <Store className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold">Cấu hình quán</p>
            <p className="text-xs text-muted-foreground">
              Quản lý trạng thái bán hàng và thời gian phục vụ dự kiến.
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="flex items-center gap-1 border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          <Activity className="h-3 w-3" />
          <span className="text-xs">
            {isOpen ? "Đang hoạt động" : "Đang tạm đóng"}
          </span>
        </Badge>
      </div>

      <Card className="border border-emerald-50 shadow-sm bg-gradient-to-br from-emerald-50/40 via-background to-background">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
              <Store className="h-3.5 w-3.5 text-emerald-700" />
            </span>
            Cấu hình quán của bạn
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {/* Section: Trạng thái hoạt động */}
          <section className="rounded-xl border border-emerald-100 bg-white/80 p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-semibold">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                    <Activity className="h-3 w-3 text-emerald-700" />
                  </span>
                  Trạng thái hoạt động
                </p>
                <p className="text-xs text-muted-foreground">
                  Khi tắt, khách hàng sẽ không thể tạo đơn mới tại quán trên hệ thống SQM.
                  Trạng thái này không ảnh hưởng đến các đơn đang xử lý.
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Switch
                  checked={isOpen}
                  disabled={toggling}
                  onCheckedChange={handleToggleActive}
                  aria-label="Bật/tắt trạng thái quán"
                  className="data-[state=checked]:bg-emerald-500"
                />
                <Badge
                  variant={isOpen ? "default" : "secondary"}
                  className={
                    "flex items-center gap-1 text-xs " +
                    (isOpen
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300")
                  }
                >
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
                  {isOpen ? "Đang mở bán" : "Tạm đóng"}
                </Badge>
              </div>
            </div>
          </section>

          {/* Section: Thời gian chênh lệch */}
          <section className="rounded-xl border border-emerald-100 bg-white/80 p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <Label className="flex items-center gap-2 font-semibold">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                    <Clock className="h-3 w-3 text-emerald-700" />
                  </span>
                  Thời gian chênh lệch của quán (phút)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Dùng để bù trễ thực tế so với thời gian phục vụ dự kiến.
                  Dữ liệu này giúp hệ thống dự đoán chính xác hơn thời gian nhận món của khách.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="w-24 text-right"
                  value={bufferMinutes}
                  onChange={(e) => setBufferMinutes(e.target.value)}
                />
                <span className="text-sm text-muted-foreground">phút</span>
              </div>
            </div>

            {/* Hint box */}
            <div className="flex items-start gap-2 rounded-lg border border-dashed border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
              <Info className="mt-0.5 h-4 w-4 text-emerald-600" />
              <p className="text-xs leading-snug text-emerald-800">
                Ví dụ: quán thường hoàn thành món{" "}
                <span className="font-semibold">sớm hơn 5 phút</span> so với
                dự kiến, bạn có thể nhập{" "}
                <span className="font-semibold">5</span> thì thời gian dự kiến khách hàng nhận đơn sẽ được cộng thêm 5 phút.
              </p>
            </div>
          </section>

          {/* Footer: nút lưu */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              Hãy kiểm tra kỹ trước khi lưu cấu hình, thay đổi sẽ áp dụng ngay cho các đơn mới.
            </p>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Lưu cấu hình
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}