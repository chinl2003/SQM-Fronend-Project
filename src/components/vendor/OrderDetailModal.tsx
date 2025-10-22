import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, User, Phone, MapPin, RefreshCw, CreditCard, Clock, AlertTriangle } from "lucide-react";

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  note?: string;
  image?: string;
}

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: number;
    position: number;
    customer: string;
    items: string[];
    status: string;
    time: string;
    type: string;
    paymentStatus: 'paid' | 'unpaid';
    paymentMethod: 'cash' | 'vnpay';
  } | null;
  onUpdateOrder: (orderId: number, status: string) => void;
}

const menuItems = [
  { id: 1, name: "Margherita Pizza", price: 350000, image: "/api/placeholder/80/80" },
  { id: 2, name: "Garlic Bread", price: 160000, image: "/api/placeholder/80/80" },
  { id: 3, name: "Caesar Salad", price: 120000, image: "/api/placeholder/80/80" },
  { id: 4, name: "Pepperoni Pizza", price: 380000, image: "/api/placeholder/80/80" },
];

export const OrderDetailModal = ({ isOpen, onClose, order, onUpdateOrder }: OrderDetailModalProps) => {
  const { toast } = useToast();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { id: 1, name: "Margherita Pizza", quantity: 1, price: 350000 },
    { id: 2, name: "Garlic Bread", quantity: 2, price: 160000 }
  ]);
  const [showAddItems, setShowAddItems] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>("");
  const [itemNote, setItemNote] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDelayDialog, setShowDelayDialog] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [delayTime, setDelayTime] = useState("");

  const customerInfo = {
    fullName: "Nguyễn Lê Chi",
    phone: "0819790919",
    position: 3,
    repeatPurchases: 2,
    totalItemsOrdered: 3
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const handleDeleteItem = (itemId: number) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
    toast({
      title: "Đã xóa món",
      description: "Món ăn đã được xóa khỏi đơn hàng",
    });
  };

  const handleAddItem = () => {
    if (!selectedMenuItem) return;
    
    const menuItem = menuItems.find(item => item.id.toString() === selectedMenuItem);
    if (!menuItem) return;

    const newItem: OrderItem = {
      id: Date.now(),
      name: menuItem.name,
      quantity: itemQuantity,
      price: menuItem.price,
      note: itemNote || undefined
    };

    setOrderItems(prev => [...prev, newItem]);
    setSelectedMenuItem("");
    setItemNote("");
    setItemQuantity(1);
    setShowAddItems(false);
    
    toast({
      title: "Đã thêm món",
      description: `${menuItem.name} đã được thêm vào đơn hàng`,
    });
  };

  const handleUpdateOrder = () => {
    toast({
      title: "Cập nhật thành công",
      description: "Đơn hàng đã được cập nhật thành công",
    });
  };

  const handleConfirmOrder = () => {
    if (!order) return;
    onUpdateOrder(order.id, 'preparing');
    setShowConfirmDialog(false);
    onClose();
    toast({
      title: "Xác nhận thành công",
      description: "Đơn hàng đã được xác nhận thành công",
    });
  };

  const handleCancelOrder = () => {
    if (!order) return;
    onUpdateOrder(order.id, 'cancelled');
    setShowCancelDialog(false);
    onClose();
    toast({
      title: "Đã hủy đơn hàng",
      description: "Đơn hàng đã được hủy",
    });
  };

  const handleDelayOrder = () => {
    if (!delayReason || !delayTime) return;
    setShowDelayDialog(false);
    setDelayReason("");
    setDelayTime("");
    toast({
      title: "Đã cập nhật thời gian trễ",
      description: `Đơn hàng sẽ trễ ${delayTime} phút. Lý do: ${delayReason}`,
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'preparing': return 'Chế biến';
      case 'ready': return 'Sẵn sàng';
      case 'completed': return 'Hoàn tất';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    return method === 'cash' ? 'Tiền mặt' : 'Thanh toán qua VNPay';
  };

  // Return early if order is null to prevent errors
  if (!order) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Chi tiết đơn hàng #{order.position}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Thông tin khách hàng
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Họ và tên</p>
                    <p className="font-medium">{customerInfo.fullName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Số điện thoại</p>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {customerInfo.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vị trí hiện tại</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      #{customerInfo.position}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Số lần mua lại</p>
                    <p className="font-medium">{customerInfo.repeatPurchases}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tổng món đã đặt</p>
                    <p className="font-medium">{customerInfo.totalItemsOrdered}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Trạng thái</p>
                    <Badge className="text-xs">
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Danh sách món đặt</h3>
                  {order.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAddItems(!showAddItems)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Thêm món
                    </Button>
                  )}
                </div>

                {showAddItems && (
                  <Card className="mb-4 border-dashed">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <Label>Chọn món</Label>
                          <Select value={selectedMenuItem} onValueChange={setSelectedMenuItem}>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn món ăn" />
                            </SelectTrigger>
                            <SelectContent>
                              {menuItems.map((item) => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                  {item.name} - {formatCurrency(item.price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Số lượng</Label>
                          <Select value={itemQuantity.toString()} onValueChange={(value) => setItemQuantity(Number(value))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1,2,3,4,5].map(num => (
                                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Ghi chú</Label>
                          <Textarea 
                            placeholder="Ghi chú..." 
                            value={itemNote}
                            onChange={(e) => setItemNote(e.target.value)}
                            className="h-10"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button onClick={handleAddItem} disabled={!selectedMenuItem}>
                            Thêm
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <img 
                          src={item.image || "/api/placeholder/64/64"} 
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Số lượng: {item.quantity} • {formatCurrency(item.price)}
                        </p>
                        {item.note && (
                          <p className="text-xs text-muted-foreground">Ghi chú: {item.note}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                        {order.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />
                <div className="flex justify-between items-center font-semibold text-lg">
                  <span>Tổng tiền:</span>
                  <span className="text-primary">{formatCurrency(totalAmount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Thông tin thanh toán
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Phương thức thanh toán</p>
                    <p className="font-medium">{getPaymentMethodText(order.paymentMethod)}</p>
                  </div>
                  <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'destructive'}>
                    {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Estimated Completion Time */}
            {(order.status === 'preparing' || order.status === 'ready') && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Thời gian ước tính
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-lg px-4 py-2">
                      {order.status === 'preparing' ? 'Còn lại 8 phút' : 'Đã sẵn sàng'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      (Dự kiến hoàn thành lúc 14:48)
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button 
                variant="destructive" 
                onClick={() => setShowCancelDialog(true)}
                disabled={order.status === 'cancelled' || order.status === 'completed'}
              >
                Hủy đơn hàng
              </Button>
              
              {order.status === 'pending' && (
                <>
                  <Button variant="outline" onClick={handleUpdateOrder}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Cập nhật
                  </Button>
                  <Button onClick={() => setShowConfirmDialog(true)}>
                    Xác nhận
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy đơn hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Không</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Có, hủy đơn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Order Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đơn hàng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có muốn xác nhận đơn hàng này không? Đơn hàng sẽ được chuyển sang trạng thái "Chế biến".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmOrder}>
                Xác nhận
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delay Order Dialog */}
        <Dialog open={showDelayDialog} onOpenChange={setShowDelayDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Thông báo trễ giờ giao
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delayReason">Lý do trễ *</Label>
                <Textarea 
                  id="delayReason"
                  placeholder="Nhập lý do trễ..."
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delayTime">Thời gian trễ thêm (phút) *</Label>
                <Input 
                  id="delayTime"
                  type="number"
                  placeholder="Ví dụ: 15"
                  value={delayTime}
                  onChange={(e) => setDelayTime(e.target.value)}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowDelayDialog(false)}>
                  Hủy
                </Button>
                <Button 
                  onClick={handleDelayOrder}
                  disabled={!delayReason || !delayTime}
                >
                  Xác nhận
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  };

  // Export additional function for delay dialog trigger
  export const DelayOrderButton = ({ onDelayClick }: { onDelayClick: () => void }) => (
    <Button variant="outline" size="sm" onClick={onDelayClick}>
      <AlertTriangle className="h-4 w-4 mr-2" />
      Trễ giờ giao
    </Button>
  );