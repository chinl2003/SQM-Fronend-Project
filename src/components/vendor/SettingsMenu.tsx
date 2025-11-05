import { useMemo, useState } from "react";
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
  Upload,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MenuItem = {
  id: string;
  name: string;
  price: string; 
  prepMinutes: string; 
  image?: File | null;
  dailyQuantity: string;
  description?: string;
};

type Category = {
  id: string;
  name: string;
  items: MenuItem[];
};

const uid = () => crypto.randomUUID();

export default function SettingsMenu() {
  const [categories, setCategories] = useState<Category[]>([
    {
      id: uid(),
      name: "Đồ ăn chính",
      items: [
        {
          id: uid(),
          name: "Pizza Margherita",
          price: "120000",
          prepMinutes: "15",
          image: null,
          dailyQuantity: "50",
          description: "Pizza truyền thống với cà chua và phô mai",
        },
        {
          id: uid(),
          name: "Pasta Carbonara",
          price: "95000",
          prepMinutes: "12",
          image: null,
          dailyQuantity: "50",
          description: "Mì Ý với sốt kem và thịt xông khói",
        },
      ],
    },
    {
      id: uid(),
      name: "Đồ uống",
      items: [
        {
          id: uid(),
          name: "Coca Cola",
          price: "15000",
          prepMinutes: "2",
          image: null,
          dailyQuantity: "50",
          description: "Nước ngọt có ga",
        },
      ],
    },
  ]);

  const [addCatOpen, setAddCatOpen] = useState(false);
  const [newCatNames, setNewCatNames] = useState<string[]>([""]);

  const canSubmit = useMemo(() => {
    return categories.length > 0;
  }, [categories]);

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

  const addItem = (catId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? {
              ...c,
              items: [
                ...c.items,
                {
                  id: uid(),
                  name: "",
                  price: "",
                  prepMinutes: "",
                  image: null,
                  dailyQuantity: "",
                  description: "",
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

  const handleSave = async () => {
    alert("Đã cập nhật menu (demo). Bạn nối API tại handleSave().");
  };

  function sanitizeNumeric(input: string) {
    let s = input.replace(/[^\d.]/g, "");
    const firstDot = s.indexOf(".");
    if (firstDot !== -1) {
      s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, ""); 
    }
    const [intPartRaw, decRaw = ""] = s.split(".");
    const dec = decRaw.slice(0, 2);
    const int = intPartRaw.replace(/^0+(?=\d)/, "");
    const intPretty = (int === "" ? "0" : int).replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ","
    );
    return decRaw.length > 0 ? `${intPretty}.${dec}` : intPretty;
  }

  return (
    <>
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3 bg-muted/30 rounded-t-xl">
          <CardTitle className="text-xl font-semibold text-foreground">
            Quản lý Menu
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
          {categories.length === 0 && (
            <div className="h-48 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground">
              <Package className="mr-2 h-5 w-5" /> Chưa có danh mục. Hãy bấm
              “Thêm danh mục”.
            </div>
          )}

          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className={cn(
                "rounded-xl border bg-card",
                "shadow-sm hover:shadow-md transition-shadow"
              )}
            >
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

              <div className="space-y-4 p-4">
                {cat.items.length === 0 && (
                  <div className="rounded-md border border-dashed px-4 py-8 text-sm text-muted-foreground flex items-center justify-center">
                    Danh mục này chưa có món. Bấm “Thêm món”.
                  </div>
                )}

                {cat.items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "relative rounded-lg border bg-background p-4",
                      "hover:ring-1 hover:ring-primary/20 hover:shadow-sm transition-all"
                    )}
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-2 top-2 text-destructive"
                      onClick={() => removeItem(cat.id, item.id)}
                      title="Xóa món"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      <div className="md:col-span-3 space-y-1.5">
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

                      <div className="md:col-span-2 space-y-1.5">
                        <Label className="font-semibold">
                          Giá bán (VND){" "}
                          <span className="text-destructive">*</span>
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

                      <div className="md:col-span-2 space-y-1.5">
                        <Label className="font-semibold">
                          Thời gian chế biến (phút){" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          inputMode="numeric"
                          placeholder="VD: 15"
                          value={item.prepMinutes}
                          onChange={(e) =>
                            updateItem(
                              cat.id,
                              item.id,
                              "prepMinutes",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1.5">
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
                            updateItem(
                              cat.id,
                              item.id,
                              "dailyQuantity",
                              pretty
                            );
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

                      <div className="md:col-span-3 space-y-1.5">
                        <Label className="font-semibold">Hình ảnh</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
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
                      </div>

                      <div className="md:col-span-12 space-y-1.5">
                        <Label className="font-semibold">Mô tả</Label>
                        <Textarea
                          placeholder="Mô tả món…"
                          value={item.description || ""}
                          onChange={(e) =>
                            updateItem(
                              cat.id,
                              item.id,
                              "description",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-end">
            <Button
              className="gap-2 shadow-sm"
              size="lg"
              onClick={handleSave}
              disabled={!canSubmit}
            >
              <Save className="h-4 w-4" />
              Cập nhật
            </Button>
          </div>
        </CardContent>
      </Card>

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
