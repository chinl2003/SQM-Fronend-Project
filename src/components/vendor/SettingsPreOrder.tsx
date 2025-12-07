// src/components/vendor/SettingsPreOrder.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Clock, UtensilsCrossed } from "lucide-react";
import { api, ApiResponse } from "@/lib/api";
import { toast } from "sonner";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import vi from "date-fns/locale/vi";

registerLocale("vi", vi);

type SettingsPreOrderProps = {
  vendorId: string;
};

type MenuItemFromApi = {
  id: string;
  name: string;
};

type PreOrderConfig = {
  id: string;
  menuItemIds: string[];
  startTime: string;
  endTime: string;
  maxQuantity: string;
  enabled: boolean;
  isNew?: boolean;
};

type PreOrderConfigFromApi = {
  id: string;
  startTime: string | null;
  endTime: string | null;
  maxQuantity: number;
  enabled: boolean;
  details?: { menuItemId?: string | null }[] | null;
};

type PreOrderConfigsResponseFromApi = {
  enabled: boolean;
  configs: PreOrderConfigFromApi[];
};

const uid = () => crypto.randomUUID();

function parseTimeToDate(time: string): Date | null {
  if (!time) return null;
  const parts = time.split(":");
  if (parts.length < 2) return null;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function formatDateToTime(date: Date | null, fallback = "08:00"): string {
  if (!date) return fallback;
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export default function SettingsPreOrder({ vendorId }: SettingsPreOrderProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItemFromApi[]>([]);
  const [configs, setConfigs] = useState<PreOrderConfig[]>([]);
  const [openConfigId, setOpenConfigId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!vendorId) return;

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
        menuItemIds: Array.isArray(c.details)
          ? c.details
              .map((d) => d?.menuItemId)
              .filter((x): x is string => !!x)
          : [],
        startTime: c.startTime ?? "08:00",
        endTime: c.endTime ?? "11:00",
        maxQuantity: String(c.maxQuantity || 10),
        enabled: c.enabled,
        isNew: false,
      })) || [];

      setConfigs(mappedConfigs);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được khung giờ đặt trước.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!vendorId) return;
    fetchData();
  }, [vendorId]);

  const addConfig = () => {
    if (menuItems.length === 0) {
      toast.warning("Chưa có món nào để chọn.");
      return;
    }
    setConfigs((prev) => [
      ...prev,
      {
        id: uid(),
        menuItemIds: [menuItems[0]?.id ?? ""].filter((x) => !!x),
        startTime: "08:00",
        endTime: "11:00",
        maxQuantity: "10",
        enabled: true,
        isNew: true,
      },
    ]);
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

  const addMenuItemToConfig = (configId: string, menuItemId: string) => {
    if (!menuItemId) return;
    setConfigs((prev) =>
      prev.map((cfg) => {
        if (cfg.id !== configId) return cfg;
        const currentIds = cfg.menuItemIds ?? [];
        if (currentIds.includes(menuItemId)) return cfg;
        return { ...cfg, menuItemIds: [...currentIds, menuItemId] };
      })
    );
  };

  const removeMenuItemFromConfig = (configId: string, menuItemId: string) => {
    setConfigs((prev) =>
      prev.map((cfg) =>
        cfg.id === configId
          ? {
              ...cfg,
              menuItemIds: (cfg.menuItemIds ?? []).filter((id) => id !== menuItemId),
            }
          : cfg
      )
    );
  };

  const toggleMenuItemInConfig = (configId: string, menuItemId: string) => {
    const cfg = configs.find((c) => c.id === configId);
    if (!cfg) return;
    const has = (cfg.menuItemIds ?? []).includes(menuItemId);
    if (has) {
      removeMenuItemFromConfig(configId, menuItemId);
    } else {
      addMenuItemToConfig(configId, menuItemId);
    }
  };

  const isGlobalDisabled = !enabled;

  const handleDeleteConfig = async (id: string) => {
    const cfg = configs.find((c) => c.id === id);
    if (!cfg) return;

    if (cfg.isNew) {
      setConfigs((prev) => prev.filter((c) => c.id !== id));
      return;
    }

    try {
      const token = localStorage.getItem("accessToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      await api.post<ApiResponse<any>>(
        `/api/vendor-preorder/configs/${id}/delete`,
        {},
        headers
      );

      toast.success("Đã xóa khung giờ.");
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Xóa khung giờ thất bại.");
    }
  };

  const handleToggleEnabled = async (value: boolean) => {
    const previous = enabled;
    setEnabled(value);

    try {
      const token = localStorage.getItem("accessToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      await api.post<ApiResponse<any>>(
        `/api/vendor/${vendorId}/is-allow-pre-order`,
        { isAllowPreOrder: value },
        headers
      );

      if (value) {
        toast.success("Bật tính năng đặt trước thành công!");
      } else {
        toast.success("Tắt tính năng đặt trước thành công!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Cập nhật trạng thái quán thất bại.");
      setEnabled(previous);
    }
  };

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

        toast.success("Đã lưu khung giờ đặt trước.");
        return;
      }

      for (const chunk of chunks) {
        const payload = {
          enabled,
          configs: chunk.map((c) => ({
            startTime: c.startTime,
            endTime: c.endTime,
            maxQuantity: Number(c.maxQuantity),
            enabled: c.enabled,
            details: (c.menuItemIds ?? [])
              .filter((x) => !!x)
              .map((id) => ({
                menuItemId: id,
              })),
          })),
        };

        await api.post<ApiResponse<any>>(
          `/api/vendor-preorder/${vendorId}/configs`,
          payload,
          headers
        );
      }

      toast.success("Đã lưu khung giờ đặt trước.");
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Lưu khung giờ đặt trước thất bại.");
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
            <Switch checked={enabled} onCheckedChange={handleToggleEnabled} />
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-emerald-600" />
              Khung giờ
            </CardTitle>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={addConfig}
            disabled={isGlobalDisabled || loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm khung giờ
          </Button>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4">
          {configs.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {configs.map((cfg, index) => {
                const disabledByToggle = isGlobalDisabled || !cfg.enabled;
                const cfgIds = cfg.menuItemIds ?? [];
                const selectedMenuItems = menuItems.filter((mi) =>
                  cfgIds.includes(mi.id)
                );

                return (
                  <div
                    key={cfg.id}
                    className="rounded-lg border bg-card/60 p-3 space-y-3 h-full flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          Khung giờ {index + 1}
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
                          onClick={() => handleDeleteConfig(cfg.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Món ăn</Label>
                        <div className="relative">
                          <button
                            type="button"
                            disabled={disabledByToggle}
                            onClick={() =>
                              setOpenConfigId((prev) =>
                                prev === cfg.id ? null : cfg.id
                              )
                            }
                            className="w-full min-h-[2.25rem] rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm flex flex-wrap items-center gap-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            {selectedMenuItems.length > 0 ? (
                              selectedMenuItems.map((mi) => (
                                <span
                                  key={mi.id}
                                  className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] bg-muted"
                                >
                                  <span>{mi.name}</span>
                                  <button
                                    type="button"
                                    className="text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeMenuItemFromConfig(cfg.id, mi.id);
                                    }}
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Chọn món
                              </span>
                            )}
                          </button>

                          {openConfigId === cfg.id && !disabledByToggle && (
                            <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-y-auto text-sm">
                              {menuItems.length === 0 ? (
                                <div className="px-2 py-2 text-xs text-muted-foreground">
                                  Chưa có món.
                                </div>
                              ) : (
                                menuItems.map((mi) => {
                                  const checked = cfgIds.includes(mi.id);
                                  return (
                                    <button
                                      key={mi.id}
                                      type="button"
                                      onClick={() => {
                                        toggleMenuItemInConfig(cfg.id, mi.id);
                                        setOpenConfigId(null);
                                      }}
                                      className="flex w-full items-center justify-between px-2 py-1.5 hover:bg-accent"
                                    >
                                      <span>{mi.name}</span>
                                      {checked && (
                                        <span className="text-xs">✓</span>
                                      )}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs font-semibold">
                            Thời gian bắt đầu
                          </Label>
                          <DatePicker
                            selected={parseTimeToDate(cfg.startTime)}
                            onChange={(date) =>
                              updateConfig(
                                cfg.id,
                                "startTime",
                                formatDateToTime(date as Date | null, "08:00")
                              )
                            }
                            showTimeSelect
                            showTimeSelectOnly
                            timeIntervals={5}
                            timeFormat="HH:mm"
                            dateFormat="HH:mm"
                            locale="vi"
                            disabled={disabledByToggle}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          />
                        </div>

                        <div className="flex-1 spacey-1">
                          <Label className="text-xs font-semibold">
                            Thời gian kết thúc
                          </Label>
                          <DatePicker
                            selected={parseTimeToDate(cfg.endTime)}
                            onChange={(date) =>
                              updateConfig(
                                cfg.id,
                                "endTime",
                                formatDateToTime(date as Date | null, "11:00")
                              )
                            }
                            showTimeSelect
                            showTimeSelectOnly
                            timeIntervals={5}
                            timeFormat="HH:mm"
                            dateFormat="HH:mm"
                            locale="vi"
                            disabled={disabledByToggle}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          />
                        </div>
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
              {saving ? "Đang lưu..." : "Lưu khung giờ"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}