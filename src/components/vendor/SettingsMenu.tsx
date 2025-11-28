import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Package,
  Settings as SettingsIcon,
  Trash2,
  Save,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api, ApiResponse } from "@/lib/api";

type SettingsMenuProps = {
  vendorId: string;
};

type MenuItem = {
  id: string;               // id thật từ server (nếu có) hoặc id tạm thời client
  name: string;
  price: string;            // hiển thị dạng "120,000.50"
  prepMinutes: string;      // phút (string cho dễ gõ)
  image?: File | null;      // file mới chọn
  imageUrl?: string | null; // ảnh đang có từ server (preview)
  dailyQuantity: string;    // hiển thị dạng "50" hoặc "1,000"
  description?: string;
  isNew?: boolean;          // true nếu là item mới tạo trên client, sẽ POST create
};

type Category = {
  id: string;
  name: string;     // TypeOfFood
  items: MenuItem[];
};

const uid = () => crypto.randomUUID();

// Build ảnh tuyệt đối (tương tự VendorDetail)
function buildMediaUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = (import.meta.env.VITE_S3_URL || "").replace(/\/+$/, "");
  return `${base}/${path.replace(/^\/+/, "")}`;
}

// ---- helpers số ----
function formatNumberForDisplay(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return "";
  // tối đa 2 số thập phân
  const [i, d] = n.toString().split(".");
  const intPretty = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return d ? `${intPretty}.${d.slice(0, 2)}` : intPretty;
}

function sanitizeNumeric(input: string) {
  let s = input.replace(/[^\d.]/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
  }
  const [intPartRaw, decRaw = ""] = s.split(".");
  const dec = decRaw.slice(0, 2);
  const int = intPartRaw.replace(/^0+(?=\d)/, "");
  const intPretty = (int === "" ? "0" : int).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decRaw.length > 0 ? `${intPretty}.${dec}` : intPretty;
}

function unformatNumber(n: string): number {
  const s = (n || "").replace(/,/g, "").trim();
  return s === "" ? NaN : Number(s);
}
function toInt(n: string): number {
  const f = unformatNumber(n);
  return Number.isFinite(f) ? Math.floor(f) : NaN;
}

// --- build FormData đúng schema [FromForm] MenuItemRequest ---
function buildMenuItemForm(
  body: {
    vendorId: string;
    name: string;
    description: string | null;
    code?: string | undefined;
    price: number;     // decimal
    quantity: number;  // int
    prepTime: number;  // phút
    typeOfFood: string;
    status: boolean;
  },
  image?: File | null
) {
  const fd = new FormData();
  fd.append("VendorId", body.vendorId);
  fd.append("Name", body.name);
  if (body.description != null) fd.append("Description", body.description);
  if (body.code != null) fd.append("Code", body.code);
  fd.append("Price", body.price.toString());
  fd.append("Quantity", body.quantity.toString());
  fd.append("PrepTime", body.prepTime.toString()); // minutes
  fd.append("TypeOfFood", body.typeOfFood);
  fd.append("Status", body.status ? "true" : "false");
  if (image) {
    fd.append("ImageFile", image, image.name);
  }
  return fd;
}

export default function SettingsMenu({ vendorId }: SettingsMenuProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // dialog thêm danh mục
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [newCatNames, setNewCatNames] = useState<string[]>([""]);

  // submitting
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => categories.length > 0, [categories]);

  // ====== FETCH EXISTING ITEMS BY VENDOR ======
  useEffect(() => {
    async function fetchMenu() {
      if (!vendorId) return;
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken") || "";
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const res = await api.get<ApiResponse<any>>(
          `/api/menuitem/by-vendor/${vendorId}`,
          headers
        );

        // payload có thể là BaseResponseModel
        const payload = (res?.data as any) ?? res;
        const data: Array<{
          id: string;
          name?: string;
          description?: string;
          price?: number | null;
          quantity?: number | null;
          prepTime?: number | null; // minutes
          typeOfFood?: string | null;
          imageUrl?: string | null;
        }> = (payload?.data as any) ?? payload;

        // group theo typeOfFood
        const map = new Map<string, Category>();
        for (const it of data ?? []) {
          const catName = (it.typeOfFood || "Khác").trim();
          if (!map.has(catName)) {
            map.set(catName, {
              id: uid(),
              name: catName,
              items: [],
            });
          }
          const cat = map.get(catName)!;
          cat.items.push({
            id: it.id,
            name: it.name || "",
            description: it.description || "",
            price: formatNumberForDisplay(it.price ?? 0),
            dailyQuantity: formatNumberForDisplay(it.quantity ?? 0),
            prepMinutes: String(Math.floor(it.prepTime ?? 0)),
            image: null,
            imageUrl: buildMediaUrl(it.imageUrl),
            isNew: false,
          });
        }

        setCategories(Array.from(map.values()));
        // nếu vendor chưa có món, để mảng rỗng (UI sẽ hiện hướng dẫn)
        if (!data || data.length === 0) {
          setCategories([]);
        }
      } catch (e) {
        console.error(e);
        toast.error("Không tải được menu của quán.");
      } finally {
        setLoading(false);
      }
    }

    fetchMenu();
  }, [vendorId]);

  // ====== category handlers ======
  const openAddCategory = () => {
    setNewCatNames([""]);
    setAddCatOpen(true);
  };
  const addMoreCatRow = () => setNewCatNames((p) => [...p, ""]);
  const removeCatRow = (idx: number) =>
    setNewCatNames((p) => p.filter((_, i) => i !== idx));
  const changeCatRow = (idx: number, v: string) =>
    setNewCatNames((p) => p.map((s, i) => (i === idx ? v : s)));

  const confirmAddCategories = () => {
    const trimmed = newCatNames.map((s) => s.trim()).filter(Boolean);
    if (trimmed.length === 0) return setAddCatOpen(false);
    setCategories((prev) => [
      ...prev,
      ...trimmed.map((name) => ({
        id: uid(),
        name,
        items: [],
      })),
    ]);
    setAddCatOpen(false);
  };

  const removeCategory = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
  };

  // ====== item handlers ======
  const addItem = (catId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? {
            ...c,
            items: [
              ...c.items,
              {
                id: `new-${uid()}`,
                name: "",
                price: "",
                prepMinutes: "",
                image: null,
                imageUrl: null,
                dailyQuantity: "",
                description: "",
                isNew: true,
              },
            ],
          }
          : c
      )
    );
  };

  const removeItem = (catId: string, itemId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? { ...c, items: c.items.filter((i) => i.id !== itemId) }
          : c
      )
    );
  };

  const updateItem = <K extends keyof MenuItem>(
    catId: string,
    itemId: string,
    key: K,
    value: MenuItem[K]
  ) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? {
            ...c,
            items: c.items.map((i) =>
              i.id === itemId ? { ...i, [key]: value } : i
            ),
          }
          : c
      )
    );
  };

  // ====== save (create new only) ======
  const handleSave = async () => {
    if (!vendorId) {
      toast.error("Thiếu VendorId. Vui lòng tải lại trang hoặc đăng nhập lại.");
      return;
    }

    const forms: FormData[] = [];
    const errors: string[] = [];

    // chỉ tạo những món mới (isNew === true)
    categories.forEach((cat) => {
      cat.items
        .filter((item) => item.isNew)
        .forEach((item, iIdx) => {
          const path = `Danh mục "${cat.name}" › Món mới #${iIdx + 1}`;

          if (!item.name?.trim()) errors.push(`${path}: thiếu Tên món`);

          const price = unformatNumber(item.price);
          if (!Number.isFinite(price))
            errors.push(`${path}: Giá bán không hợp lệ`);

          const qty = toInt(item.dailyQuantity);
          if (!Number.isFinite(qty))
            errors.push(`${path}: Số lượng mỗi ngày không hợp lệ`);

          const prep = toInt(item.prepMinutes);
          if (!Number.isFinite(prep))
            errors.push(`${path}: Thời gian chế biến (phút) không hợp lệ`);

          if (errors.length === 0) {
            const body = {
              vendorId,
              name: item.name.trim(),
              description: item.description?.trim() || null,
              code: undefined,
              price: Number(price.toFixed(2)),
              quantity: qty,
              prepTime: prep, // phút
              typeOfFood: cat.name,
              status: true,
            };
            const fd = buildMenuItemForm(body, item.image);
            forms.push(fd);
          }
        });
    });

    if (errors.length > 0) {
      toast.error(
        <div className="space-y-1">
          <p>Không thể lưu do lỗi dữ liệu:</p>
          <ul className="list-disc pl-5">
            {errors.slice(0, 4).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          {errors.length > 4 && <p>…và {errors.length - 4} lỗi khác.</p>}
        </div>
      );
      return;
    }

    if (forms.length === 0) {
      toast.info("Không có món mới để lưu.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("accessToken") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      // ĐỪNG set Content-Type ở đây (để XHR tự set kèm boundary)
      const results = await Promise.allSettled(
        forms.map((fd) => api.post<ApiResponse<any>>("/api/menuitem", fd, headers))
      );

      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.length - ok;

      if (ok > 0 && fail === 0) {
        toast.success(`Đã tạo ${ok} món thành công!`);
        // reload danh sách sau khi tạo
        // => cách nhanh: fetch lại
        try {
          const token2 = localStorage.getItem("accessToken") || "";
          const headers2 = token2 ? { Authorization: `Bearer ${token2}` } : undefined;
          const res2 = await api.get<ApiResponse<any>>(
            `/api/menuitem/by-vendor/${vendorId}`,
            headers2
          );
          const payload2 = (res2?.data as any) ?? res2;
          const data2: any[] = (payload2?.data as any) ?? payload2;

          const map2 = new Map<string, Category>();
          for (const it of data2 ?? []) {
            const catName = (it.typeOfFood || "Khác").trim();
            if (!map2.has(catName)) {
              map2.set(catName, { id: uid(), name: catName, items: [] });
            }
            const cat = map2.get(catName)!;
            cat.items.push({
              id: it.id,
              name: it.name || "",
              description: it.description || "",
              price: formatNumberForDisplay(it.price ?? 0),
              dailyQuantity: formatNumberForDisplay(it.quantity ?? 0),
              prepMinutes: String(Math.floor(it.prepTime ?? 0)),
              image: null,
              imageUrl: buildMediaUrl(it.imageUrl),
              isNew: false,
            });
          }
          setCategories(Array.from(map2.values()));
        } catch {
          // không reload được thì thôi
        }
      } else if (ok > 0 && fail > 0) {
        toast.warning(`Một phần thành công: ${ok} món tạo OK, ${fail} món lỗi.`);
      } else {
        toast.error("Tạo menu thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi khi gọi API. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3 bg-muted/30 rounded-t-xl">
          <CardTitle className="text-xl font-semibold text-foreground">
            Quản lý thực đơn
          </CardTitle>

          <Button
            variant="default"
            onClick={openAddCategory}
            className="shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm danh mục
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {loading && (
            <div className="h-24 rounded-lg border flex items-center justify-center text-muted-foreground">
              Đang tải menu...
            </div>
          )}

          {!loading && categories.length === 0 && (
            <div className="h-48 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
              <Package className="mr-2 h-5 w-5" /> Chưa có danh mục / món. Hãy bấm
              “Thêm danh mục” rồi “Thêm món”.
            </div>
          )}

          {/* Danh mục */}
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={cn(
                "rounded-xl border bg-card",
                "shadow-sm hover:shadow-md transition-shadow"
              )}
            >
              {/* Header danh mục */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">{cat.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => addItem(cat.id)}
                    className="transition-all hover:bg-green-500 hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm món
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeCategory(cat.id)}
                    title="Xóa danh mục"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div className="p-4">
                {cat.items.length === 0 && (
                  <div className="rounded-md border border-dashed px-4 py-8 text-sm text-muted-foreground flex items-center justify-center">
                    Danh mục này chưa có món. Bấm “Thêm món”.
                  </div>
                )}

                {cat.items.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cat.items.map((item) => {
                      const inputId = `image-${cat.id}-${item.id}`;

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "relative flex flex-col gap-2 rounded-lg border bg-background p-3",
                            "hover:ring-1 hover:ring-primary/20 hover:shadow-sm transition-all"
                          )}
                        >
                          {/* Nút xóa góc phải */}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-2 top-2 text-destructive"
                            onClick={() => removeItem(cat.id, item.id)}
                            title="Xóa món"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          {/* Khung ảnh upload (đặt ở đầu card) */}
                          <div className="space-y-1">
                            <Label className="font-semibold">Hình ảnh</Label>
                            <label
                              htmlFor={inputId}
                              className={cn(
                                "group relative flex cursor-pointer items-center justify-center",
                                "rounded-md border-2 border-dashed border-muted-foreground/40",
                                "bg-muted/40 px-3 py-3 text-sm text-muted-foreground",
                                "hover:border-primary/60 hover:bg-muted/70 transition-colors",
                                "overflow-hidden min-h-[110px]"
                              )}
                            >
                              {item.image || item.imageUrl ? (
                                <img
                                  src={
                                    item.image
                                      ? URL.createObjectURL(item.image)
                                      : item.imageUrl || ""
                                  }
                                  alt={item.name || "image"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  <ImageIcon className="h-5 w-5" />
                                  <span className="text-xs">Nhấn để tải ảnh lên</span>
                                </div>
                              )}
                            </label>
                            <input
                              id={inputId}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                updateItem(
                                  cat.id,
                                  item.id,
                                  "image",
                                  e.target.files?.[0] ?? null
                                )
                              }
                            />
                          </div>

                          {/* Thông tin món – mỗi thông tin một hàng */}
                          <div className="flex flex-col gap-2">
                            {/* Tên món */}
                            <div className="space-y-1">
                              <Label className="font-semibold">
                                Tên món <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                placeholder="Tên món"
                                value={item.name}
                                onChange={(e) =>
                                  updateItem(cat.id, item.id, "name", e.target.value)
                                }
                              />
                            </div>

                            {/* Giá bán */}
                            <div className="space-y-1">
                              <Label className="font-semibold">
                                Giá bán (VND) <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                inputMode="decimal"
                                placeholder="VD: 120000"
                                value={item.price}
                                onChange={(e) => {
                                  const pretty = sanitizeNumeric(e.target.value);
                                  updateItem(cat.id, item.id, "price", pretty);
                                }}
                                onKeyDown={(e) => {
                                  const allowedKeys = [
                                    "Backspace",
                                    "Delete",
                                    "ArrowLeft",
                                    "ArrowRight",
                                    "ArrowUp",
                                    "ArrowDown",
                                    "Tab",
                                    "Home",
                                    "End",
                                    ".",
                                  ];
                                  if (
                                    !allowedKeys.includes(e.key) &&
                                    !(e.key >= "0" && e.key <= "9")
                                  ) {
                                    e.preventDefault();
                                  }
                                }}
                              />
                            </div>

                            {/* Thời gian chế biến */}
                            <div className="space-y-1">
                              <Label className="font-semibold">
                                Thời gian chế biến (phút){" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                inputMode="numeric"
                                placeholder="VD: 15"
                                value={item.prepMinutes}
                                onChange={(e) =>
                                  updateItem(cat.id, item.id, "prepMinutes", e.target.value)
                                }
                              />
                            </div>

                            {/* Số lượng mỗi ngày */}
                            <div className="space-y-1">
                              <Label className="font-semibold">
                                Số lượng mỗi ngày{" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                inputMode="decimal"
                                placeholder="VD: 50"
                                value={item.dailyQuantity}
                                onChange={(e) => {
                                  const pretty = sanitizeNumeric(e.target.value);
                                  updateItem(cat.id, item.id, "dailyQuantity", pretty);
                                }}
                                onKeyDown={(e) => {
                                  const allowedKeys = [
                                    "Backspace",
                                    "Delete",
                                    "ArrowLeft",
                                    "ArrowRight",
                                    "ArrowUp",
                                    "ArrowDown",
                                    "Tab",
                                    "Home",
                                    "End",
                                    ".",
                                  ];
                                  if (
                                    !allowedKeys.includes(e.key) &&
                                    !(e.key >= "0" && e.key <= "9")
                                  ) {
                                    e.preventDefault();
                                  }
                                }}
                              />
                            </div>

                            {/* Mô tả */}
                            <div className="space-y-1">
                              <Label className="font-semibold">Mô tả</Label>
                              <Textarea
                                placeholder="Mô tả món…"
                                value={item.description || ""}
                                className="min-h-[70px]"
                                onChange={(e) =>
                                  updateItem(cat.id, item.id, "description", e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

            </div>
          ))}

          {/* Footer actions */}
          <div className="flex items-center justify-end">
            <Button
              className="gap-2 shadow-sm"
              size="lg"
              onClick={handleSave}
              disabled={!canSubmit || submitting}
            >
              <Save className="h-4 w-4" />
              {submitting ? "Đang lưu..." : "Cập nhật"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog thêm danh mục */}
      <Dialog open={addCatOpen} onOpenChange={setAddCatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm danh mục</DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-3 py-1">
              {newCatNames.map((name, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder={`Tên danh mục #${idx + 1}`}
                    value={name}
                    onChange={(e) => changeCatRow(idx, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeCatRow(idx)}
                    disabled={newCatNames.length === 1}
                    title="Xóa dòng"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addMoreCatRow}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm dòng
                </Button>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddCatOpen(false)}>
              Hủy
            </Button>
            <Button onClick={confirmAddCategories}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}