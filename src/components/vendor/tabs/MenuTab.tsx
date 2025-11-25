// src/components/vendor/tabs/MenuTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, Package, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function MenuTab({ vendor }: any) {
  const items = [
    { id: 1, name: "Pizza Margherita", category: "Pizza", price: "159,000", stock: 25, status: "active" },
    { id: 2, name: "Pizza Pepperoni", category: "Pizza", price: "179,000", stock: 0, status: "out-of-stock" },
    { id: 3, name: "Pasta Carbonara", category: "Pasta", price: "139,000", stock: 15, status: "active" },
  ];

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Quản lý thực đơn</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Tìm kiếm món ăn..." className="pl-9 w-64" />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm món
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                    <p className="text-lg font-semibold text-primary">{item.price}đ</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Tồn kho</p>
                    <p className={`font-medium ${item.stock === 0 ? "text-destructive" : "text-foreground"}`}>{item.stock}</p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Chỉnh sửa</DropdownMenuItem>
                      <DropdownMenuItem>Cập nhật tồn kho</DropdownMenuItem>
                      <DropdownMenuItem>Tạm dừng bán</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Xóa</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
