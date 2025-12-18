// src/components/vendor/SettingsAccount.tsx
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  vendorId: string;
};

export default function SettingsAccount({ vendorId }: SettingsAccountProps) {
  const [isOpen, setIsOpen] = useState(true); // trạng thái quán
  const [bufferMinutes, setBufferMinutes] = useState<number | string>(10); // thời gian chênh lệch (phút)
  const [shortThresholdMinutes, setShortThresholdMinutes] = useState<number | string>(3); // ngưỡng thời gian ngắn (phút)
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!vendorId) return;

    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("accessToken") || "";
        const headers = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        const res = await api.get<ApiResponse<any>>(
          `/api/vendor/${vendorId}/eta-setting`,
          headers
        );

        const payload = (res as any)?.data ?? res;
        console.log(payload);
        const data = payload;
        console.log(data);
        if (data) {
          if (typeof data.bufferMinutes === "number") {
            setBufferMinutes(data.bufferMinutes);
          }
          if (typeof data.shortThresholdMinutes === "number") {
            setShortThresholdMinutes(data.shortThresholdMinutes);
          }
        }

        if (typeof data?.shortThresholdMinutes === "number") {
          setShortThresholdMinutes(data.shortThresholdMinutes);
        }

        if (typeof data?.maxPrepMinutes === "number") {
          setMaxPrepMinutes(data.maxPrepMinutes);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchSettings();
  }, [vendorId]);

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

      const bufferMins = Number(bufferMinutes);
      const shortThresholdMins = Number(shortThresholdMinutes);

      if (Number.isNaN(bufferMins)) {
        toast.error("Vui lòng nhập số phút hợp lệ cho thời gian chênh lệch.");
        return;
      }

      if (Number.isNaN(shortThresholdMins)) {
        toast.error("Vui lòng nhập số phút hợp lệ cho ngưỡng thời gian ngắn.");
        return;
      }

      const token = localStorage.getItem("accessToken") || "";
      const headers = token
        ? { Authorization: `Bearer ${token}` }
        : undefined;

      await api.put<ApiResponse<any>>(
        `/api/vendor/${vendorId}/eta-setting`,
        {
          bufferMinutes: bufferMins,
          shortThresholdMinutes: shortThresholdMins
        },
        headers
      );

      toast.success("Đã lưu cấu hình ETA của quán.");
    } catch (err) {
      console.error(err);
      toast.error("Lưu cấu hình thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
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
        <CardContent className="space-y-6 pt-2">
          <section className="rounded-xl border border-emerald-100 bg-white/80 p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-semibold">
                  <Activity className="h-4 w-4 text-emerald-700" />
                  Trạng thái hoạt động
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Switch
                  checked={isOpen}
                  disabled={toggling}
                  onCheckedChange={handleToggleActive}
                  className="data-[state=checked]:bg-emerald-500"
                />
                <Badge
                  variant={isOpen ? "default" : "secondary"}
                  className={
                    "text-xs " +
                    (isOpen
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-slate-200 text-slate-700")
                  }
                >
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

          {/* Section: Ngưỡng thời gian ngắn */}
          <section className="rounded-xl border border-emerald-100 bg-white/80 p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <Label className="flex items-center gap-2 font-semibold">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                    <Clock className="h-3 w-3 text-emerald-700" />
                  </span>
                  Ngưỡng thời gian ngắn (phút)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Thời gian tối thiểu để đánh dấu đơn hàng có thời gian chờ ngắn.
                  Hệ thống sẽ sử dụng giá trị này để phân loại đơn hàng.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  className="w-24 text-right"
                  value={shortThresholdMinutes}
                  onChange={(e) => setShortThresholdMinutes(e.target.value)}
                />
                <span className="text-sm text-muted-foreground">phút</span>
              </div>
            </div>

            {/* Hint box */}
            <div className="flex items-start gap-2 rounded-lg border border-dashed border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
              <Info className="mt-0.5 h-4 w-4 text-emerald-600" />
              <p className="text-xs leading-snug text-emerald-800">
                Ví dụ: nhập{" "}
                <span className="font-semibold">3</span> phút nghĩa là các đơn hàng có thời gian chờ dưới 3 phút được xem là &quot;ngắn&quot;.
              </p>
            </div>
          </section>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              Thay đổi sẽ áp dụng ngay cho các đơn mới.
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