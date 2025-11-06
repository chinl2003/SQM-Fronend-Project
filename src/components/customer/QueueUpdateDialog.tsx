import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { CreditCard, Banknote, Plus, Minus } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface QueueUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedItems: OrderItem[], paymentMethod: string) => void;
  vendorName: string;
  vendorImage: string;
  currentItems: OrderItem[];
  availableMenuItems: MenuItem[];
  currentPaymentMethod: string;
}

export function QueueUpdateDialog({
  isOpen,
  onClose,
  onUpdate,
  vendorName,
  vendorImage,
  currentItems,
  availableMenuItems,
  currentPaymentMethod,
}: QueueUpdateDialogProps) {
  const [updatedItems, setUpdatedItems] = useState<{ [key: string]: number }>(
    () => {
      const items: { [key: string]: number } = {};
      currentItems.forEach((item) => {
        items[item.id] = item.quantity;
      });
      return items;
    }
  );

  const [paymentMethod, setPaymentMethod] =
    useState<string>(currentPaymentMethod);
  const [isLoading, setIsLoading] = useState(false);

  const addItem = (itemId: string) => {
    setUpdatedItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
  };

  const removeItem = (itemId: string) => {
    setUpdatedItems((prev) => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) - 1),
    }));
  };

  const getOrderItems = (): OrderItem[] => {
    return Object.entries(updatedItems)
      .filter(([_, quantity]) => quantity > 0)
      .map(([itemId, quantity]) => {
        const menuItem = availableMenuItems.find((item) => item.id === itemId);
        return {
          id: itemId,
          name: menuItem?.name || "",
          price: menuItem?.price || 0,
          quantity,
        };
      });
  };

  const orderItems = getOrderItems();
  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleUpdate = async () => {
    if (orderItems.length === 0) {
      toast({
        title: "Vui lòng chọn ít nhất một món",
        description: "Bạn cần chọn ít nhất một món để cập nhật đơn hàng.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      onUpdate(orderItems, paymentMethod);

      toast({
        title: "Cập nhật thành công!",
        description: "Đơn hàng của bạn đã được cập nhật.",
      });

      onClose();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật đơn hàng. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <img
              src={vendorImage}
              alt={vendorName}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span>Cập nhật đơn hàng</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Menu Items */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Chọn món</h4>

              <div className="space-y-3">
                {availableMenuItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{item.name}</h5>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                      <p className="text-sm font-medium text-primary">
                        {item.price.toLocaleString("vi-VN")}đ
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {updatedItems[item.id] ? (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeItem(item.id)}
                            disabled={!item.isAvailable}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">
                            {updatedItems[item.id]}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => addItem(item.id)}
                            disabled={!item.isAvailable}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => addItem(item.id)}
                          disabled={!item.isAvailable}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Thêm
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          {orderItems.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">Chi tiết đơn hàng</h4>

                <div className="space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span>
                        {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  ))}

                  <Separator className="my-2" />

                  <div className="flex justify-between font-medium">
                    <span>Tổng cộng</span>
                    <span className="text-primary">
                      {totalAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Phương thức thanh toán</h4>

              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vnpay" id="vnpay" />
                  <Label
                    htmlFor="vnpay"
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span>VNPAY</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label
                    htmlFor="cash"
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Banknote className="h-4 w-4 text-green-600" />
                    <span>Thanh toán tiền mặt</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Hủy
            </Button>
            <Button
              onClick={handleUpdate}
              className="flex-1"
              disabled={isLoading || orderItems.length === 0}
            >
              {isLoading ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
