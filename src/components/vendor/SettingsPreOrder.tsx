// src/components/vendor/SettingsPreOrder.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Clock, UtensilsCrossed } from "lucide-react";
import { api, ApiResponse } from "@/lib/api";
import { toast } from "sonner";

type SettingsPreOrderProps = {
  vendorId: string;
};

type MenuItemFromApi = {
  id: string;
  name: string;
};

type PreOrderConfig = {
  id: string;
  menuItemId: string;
  startTime: string;
  endTime: string;
  maxQuantity: string;
  enabled: boolean;
};

type PreOrderConfigFromApi = {
  id: string;
  menuItemId: string;
  startTime: string | null;
  endTime: string | null;
  maxQuantity: number;
  enabled: boolean;
};

type PreOrderConfigsResponseFromApi = {
  enabled: boolean;
  configs: PreOrderConfigFromApi[];
};

const uid = () => crypto.randomUUID();

export default function SettingsPreOrder({ vendorId }: SettingsPreOrderProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItemFromApi[]>([]);
  const [configs, setConfigs] = useState<PreOrderConfig[]>([]);

  useEffect(() => {
    if (!vendorId) return;
    (async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken") || "";
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const resMenu = await api.get<ApiResponse<any>>(
          `/api/menuitem/by-vendor/${vendorId}`,
          headers
        );

        const payloadMenu = (resMenu?.data as any) ?? resMenu;
        const dataMenu: any[] = (payloadMenu?.data as any) ?? payloadMenu;

        const items: MenuItemFromApi[] =
          dataMenu?.map((it) => ({
            id: it.id,
            name: it.name || "Món không tên",
          })) || [];

        setMenuItems(items);

        const resPre = await api.get<ApiResponse<any>>(
          `/api/vendor-preorder/${vendorId}/configs`,
          headers
        );

        const payloadPre = (resPre?.data as any) ?? resPre;
        const dataPre: PreOrderConfigsResponseFromApi =
          (payloadPre?.data as any) ?? payloadPre;

        setEnabled(!!dataPre.enabled);

        const mappedConfigs: PreOrderConfig[] =
          dataPre.configs?.map((c) => ({
            id: c.id || uid(),
            menuItemId: c.menuItemId,
            startTime: c.startTime ?? "08:00",
            endTime: c.endTime ?? "11:00",
            maxQuantity: String(c.maxQuantity || 10),
            enabled: c.enabled,
          })) || [];

        setConfigs(mappedConfigs);
      } catch (err) {
        console.error(err);
        toast.error("Không tải được cấu hình Đặt trước.");
      } finally {
        setLoading(false);
      }
    })();
  }, [vendorId]);

  const addConfig = () => {
    if (menuItems.length === 0) {
      toast.warning("Chưa có món nào để cấu hình.");
      return;
    }
    setConfigs((prev) => [
      ...prev,
      {
        id: uid(),
        menuItemId: menuItems[0]?.id ?? "",
        startTime: "08:00",
        endTime: "11:00",
        maxQuantity: "10",
        enabled: true,
      },
    ]);
  };

  const removeConfig = (id: string) => {
    setConfigs((prev) => prev.filter((c) => c.id !== id));
  };

  const updateConfig = <K extends keyof PreOrderConfig>(
    id: string,
    key: K,
    value: PreOrderConfig[K]
  ) => {
    setConfigs((prev) =>
      prev.map((cfg) => (cfg.id === id ? { ...cfg, [key]: value } : cfg))
    );
  };

  const isGlobalDisabled = !enabled;

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("accessToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const chunkSize = 5;
      const chunks: PreOrderConfig[][] = [];
      for (let i = 0; i < configs.length; i += chunkSize) {
        chunks.push(configs.slice(i, i + chunkSize));
      }

      if (chunks.length === 0) {
        const payload = {
          enabled,
          configs: [] as any[],
        };

        await api.post<ApiResponse<any>>(
          `/api/vendor-preorder/${vendorId}/configs`,
          payload,
          headers
        );

        toast.success("Đã lưu cấu hình Đặt trước.");
        return;
      }

      for (const chunk of chunks) {
        const payload = {
          enabled,
          configs: chunk.map((c) => ({
            menuItemId: c.menuItemId,
            startTime: c.startTime, 
            endTime: c.endTime,    
            maxQuantity: Number(c.maxQuantity),
            enabled: c.enabled,
          })),
        };

        console.log("Sending pre-order batch", { vendorId, payload });

        await api.post<ApiResponse<any>>(
          `/api/vendor-preorder/${vendorId}/configs`,
          payload,
          headers
        );
      }

      toast.success("Đã lưu cấu hình Đặt trước.");
    } catch (err) {
      console.error(err);
      toast.error("Lưu cấu hình Đặt trước thất bại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              Cho phép đặt trước
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Bật để cho phép khách đặt món trước trong các khung giờ cấu hình bên dưới.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">
              {enabled ? "Đang bật" : "Đang tắt"}
            </Label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-emerald-600" />
              Cấu hình
            </CardTitle>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={addConfig}
            disabled={isGlobalDisabled || loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm cấu hình
          </Button>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4">
          {configs.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {configs.map((cfg) => {
                const itemName =
                  menuItems.find((mi) => mi.id === cfg.menuItemId)?.name ||
                  "Chưa chọn món";
                const disabledByToggle = isGlobalDisabled || !cfg.enabled;

                return (
                  <div
                    key={cfg.id}
                    className="rounded-lg border bg-card/60 p-3 space-y-3 h-full flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          {itemName}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Label className="text-[11px] text-muted-foreground">
                            {cfg.enabled ? "Bật" : "Tắt"}
                          </Label>
                          <Switch
                            checked={cfg.enabled}
                            disabled={isGlobalDisabled}
                            onCheckedChange={(v) =>
                              updateConfig(cfg.id, "enabled", v)
                            }
                          />
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => removeConfig(cfg.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">
                          Món ăn
                        </Label>
                        <Select
                          value={cfg.menuItemId}
                          onValueChange={(v) =>
                            updateConfig(cfg.id, "menuItemId", v)
                          }
                          disabled={disabledByToggle}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn món" />
                          </SelectTrigger>
                          <SelectContent>
                            {menuItems.map((mi) => (
                              <SelectItem key={mi.id} value={mi.id}>
                                {mi.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Từ giờ</Label>
                        <Input
                          type="time"
                          value={cfg.startTime}
                          disabled={disabledByToggle}
                          onChange={(e) =>
                            updateConfig(cfg.id, "startTime", e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Đến giờ</Label>
                        <Input
                          type="time"
                          value={cfg.endTime}
                          disabled={disabledByToggle}
                          onChange={(e) =>
                            updateConfig(cfg.id, "endTime", e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">
                          Số lượng cho phép
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          inputMode="numeric"
                          placeholder="20"
                          value={cfg.maxQuantity}
                          disabled={disabledByToggle}
                          onChange={(e) =>
                            updateConfig(cfg.id, "maxQuantity", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="min-w-[140px]"
            >
              {saving ? "Đang lưu..." : "Lưu cấu hình"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}