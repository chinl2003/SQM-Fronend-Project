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
  const [isOpen, setIsOpen] = useState(true);
  const [bufferMinutes, setBufferMinutes] = useState<number>(0);
  const [shortThresholdMinutes, setShortThresholdMinutes] = useState<number>(0);
  const [maxPrepMinutes, setMaxPrepMinutes] = useState<number>(0);
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

        const data = res.data;

        if (typeof data?.bufferMinutes === "number") {
          setBufferMinutes(data.bufferMinutes);
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

      const token = localStorage.getItem("accessToken") || "";
      const headers = token
        ? { Authorization: `Bearer ${token}` }
        : undefined;

      await Promise.all([
        api.post<ApiResponse<any>>(
          `/api/vendor/${vendorId}/eta-setting/buffer`,
          { bufferMinutes },
          headers
        ),
        api.post<ApiResponse<any>>(
          `/api/vendor/${vendorId}/eta-setting/short-threshold`,
          { shortThresholdMinutes },
          headers
        ),
      ]);

      toast.success("Đã lưu cấu hình thời gian của quán.");
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

          <section className="rounded-xl border border-emerald-100 bg-white/80 p-4 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <Label className="flex items-center gap-2 font-semibold">
                <Clock className="h-4 w-4 text-emerald-700" />
                Thời gian chênh lệch của quán (phút)
              </Label>
              <Input
                type="number"
                className="w-24 text-right"
                value={bufferMinutes}
                onChange={(e) => setBufferMinutes(Number(e.target.value))}
              />
            </div>

            <div className="flex items-start justify-between gap-4">
              <Label className="flex items-center gap-2 font-semibold">
                <Clock className="h-4 w-4 text-emerald-700" />
                Ngưỡng đơn ngắn (phút)
              </Label>
              <Input
                type="number"
                className="w-24 text-right"
                value={shortThresholdMinutes}
                onChange={(e) =>
                  setShortThresholdMinutes(Number(e.target.value))
                }
              />
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-dashed border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
              <Info className="mt-0.5 h-4 w-4 text-emerald-600" />
              <p className="text-xs text-emerald-800">
                Các giá trị này được dùng để hệ thống ước tính chính xác thời
                gian hoàn thành đơn hàng.
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