import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Clock, DollarSign, TrendingUp, BarChart3, MessageCircle, Settings, Plus, Filter, Download, Search, MoreHorizontal, Package, Calendar, Star, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderDetailModal } from "./OrderDetailModal";
import VendorSettings from "./VendorSettings";
const VendorDashboard = () => {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [queueItems, setQueueItems] = useState([{
    id: 1,
    position: 1,
    customer: "Nguyễn Văn A****",
    items: ["Pizza Margherita", "Coca Cola"],
    status: "pending",
    time: "14:30",
    type: "walk-in",
    paymentStatus: "unpaid",
    paymentMethod: "cash"
  }, {
    id: 2,
    position: 2,
    customer: "Trần Thị B****",
    items: ["Pasta Carbonara"],
    status: "pending",
    time: "14:35",
    type: "pre-order",
    paymentStatus: "paid",
    paymentMethod: "vnpay"
  }, {
    id: 3,
    position: 3,
    customer: "Lê Minh C****",
    items: ["Pizza Pepperoni", "Sprite"],
    status: "preparing",
    time: "14:40",
    type: "walk-in",
    paymentStatus: "paid",
    paymentMethod: "cash"
  }, {
    id: 4,
    position: 4,
    customer: "Phạm Thu D****",
    items: ["Salad Caesar"],
    status: "ready",
    time: "14:25",
    type: "walk-in",
    paymentStatus: "paid",
    paymentMethod: "vnpay"
  }]);
  const dashboardStats = {
    activeQueue: 12,
    totalToday: 45,
    revenue: "8,750,000",
    avgWaitTime: "18",
    cancelRate: "5.2"
  };
  const menuItems = [{
    id: 1,
    name: "Pizza Margherita",
    category: "Pizza",
    price: "159,000",
    stock: 25,
    status: "active"
  }, {
    id: 2,
    name: "Pizza Pepperoni",
    category: "Pizza",
    price: "179,000",
    stock: 0,
    status: "out-of-stock"
  }, {
    id: 3,
    name: "Pasta Carbonara",
    category: "Pasta",
    price: "139,000",
    stock: 15,
    status: "active"
  }, {
    id: 4,
    name: "Caesar Salad",
    category: "Salad",
    price: "89,000",
    stock: 8,
    status: "active"
  }];
  const handleUpdateOrder = (orderId: number, newStatus: string) => {
    setQueueItems(prev => prev.map(item => item.id === orderId ? {
      ...item,
      status: newStatus
    } : item));
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-queue-waiting text-queue-waiting-foreground';
      case 'preparing':
        return 'bg-queue-preparing text-queue-preparing-foreground';
      case 'ready':
        return 'bg-queue-ready text-queue-ready-foreground';
      case 'completed':
        return 'bg-queue-completed text-queue-completed-foreground';
      case 'cancelled':
        return 'bg-queue-cancelled text-queue-cancelled-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'preparing':
        return 'Chế biến';
      case 'ready':
        return 'Sẵn sàng';
      case 'completed':
        return 'Hoàn tất';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };
  const getPaymentStatusColor = (status: string) => {
    return status === 'paid' ? 'bg-chart-secondary text-chart-secondary-foreground' : 'bg-queue-cancelled text-queue-cancelled-foreground';
  };

  const getActionButtonConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Xác nhận', variant: 'default', nextStatus: 'preparing' };
      case 'preparing':
        return { text: 'Chế biến', variant: 'outline', nextStatus: 'processing' };
      case 'processing':
        return { text: 'Đang chế biến', variant: 'secondary', nextStatus: null, disabled: true };
      case 'ready':
        return { text: 'Sẵn sàng', variant: 'default', nextStatus: 'completed' };
      case 'completed':
        return { text: 'Hoàn tất', variant: 'outline', nextStatus: null, disabled: true };
      default:
        return { text: 'Cập nhật', variant: 'outline', nextStatus: null };
    }
  };

  const getActionButtonColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-queue-waiting text-queue-waiting-foreground hover:bg-queue-waiting/90';
      case 'preparing':
        return 'bg-queue-preparing text-queue-preparing-foreground hover:bg-queue-preparing/90';
      case 'ready':
        return 'bg-queue-ready text-queue-ready-foreground hover:bg-queue-ready/90';
      case 'completed':
        return 'bg-queue-completed text-queue-completed-foreground';
      default:
        return '';
    }
  };
  const filteredQueueItems = queueItems.filter(item => {
    if (statusFilter === "all") return true;
    return item.status === statusFilter;
  });

  const sortedQueueItems = [...filteredQueueItems].sort((a, b) => {
    const statusOrder = {
      'pending': 0,
      'preparing': 1,
      'processing': 2,
      'ready': 3,
      'completed': 4,
      'cancelled': 5
    };
    return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
  });
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Smart Queue - Vendor Dashboard</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Đang hoạt động trên hệ thống
              </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Xuất báo cáo
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm món mới
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Dashboard Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{dashboardStats.activeQueue}</p>
                  <p className="text-sm text-muted-foreground">Đang chờ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-chart-secondary/10 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-chart-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{dashboardStats.totalToday}</p>
                  <p className="text-sm text-muted-foreground">Hoàn thành hôm nay</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-revenue-positive/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-revenue-positive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{dashboardStats.revenue}đ</p>
                  <p className="text-sm text-muted-foreground">Doanh thu hôm nay</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-queue-preparing/10 rounded-lg">
                  <Clock className="h-6 w-6 text-queue-preparing" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{dashboardStats.avgWaitTime}</p>
                  <p className="text-sm text-muted-foreground">Phút TB chờ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-queue-cancelled/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-queue-cancelled" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{dashboardStats.cancelRate}%</p>
                  <p className="text-sm text-muted-foreground">Tỷ lệ hủy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="queue" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="queue">Hàng đợi</TabsTrigger>
            <TabsTrigger value="menu">Thực đơn</TabsTrigger>
            <TabsTrigger value="analytics">Thống kê</TabsTrigger>
            <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
            <TabsTrigger value="settings">Cài đặt</TabsTrigger>
          </TabsList>

          {/* Queue Management */}
          <TabsContent value="queue" className="space-y-4">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Quản lý hàng đợi</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Lọc theo trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="pending">Chờ xác nhận</SelectItem>
                        <SelectItem value="preparing">Chuẩn bị chế biến</SelectItem>
                        <SelectItem value="ready">Sẵn sàng</SelectItem>
                        <SelectItem value="completed">Hoàn tất</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Lọc theo loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="walk-in">Walk-in</SelectItem>
                        <SelectItem value="pre-order">Pre-order</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                   {sortedQueueItems.map(item => <div key={item.id} className="border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/30 transition-colors relative overflow-hidden" onClick={() => setSelectedOrder(item)}>
                      <div className={`${getPaymentStatusColor(item.paymentStatus)} absolute top-0 right-0 px-2 py-1 text-[10px] font-medium rounded-br-none rounded-tl-none rounded-tr-lg rounded-bl-lg`}>
                        {item.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold">
                            #{item.position}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{item.customer}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.time} • {item.type === 'pre-order' ? 'Pre-order' : 'Walk-in'}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.items.map((food, idx) => <span key={idx} className="text-xs bg-muted px-2 py-1 rounded">{food}</span>)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {(() => {
                              const buttonConfig = getActionButtonConfig(item.status);
                              if (buttonConfig.nextStatus) {
                                return (
                                  <Button 
                                    size="sm" 
                                    className={getActionButtonColor(item.status)}
                                    disabled={buttonConfig.disabled}
                                    onClick={e => {
                                      e.stopPropagation();
                                      if (!buttonConfig.disabled) {
                                        if (item.status === 'preparing') {
                                          handleUpdateOrder(item.id, 'processing');
                                        } else {
                                          handleUpdateOrder(item.id, buttonConfig.nextStatus!);
                                        }
                                      }
                                    }}
                                  >
                                    {buttonConfig.text}
                                  </Button>
                                );
                              } else if (buttonConfig.disabled) {
                                return (
                                  <Button 
                                    size="sm" 
                                    variant="secondary"
                                    disabled
                                  >
                                    {buttonConfig.text}
                                  </Button>
                                );
                              }
                              return null;
                            })()}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedOrder(item)}>Xem chi tiết</DropdownMenuItem>
                                <DropdownMenuItem>Nhắn tin khách hàng</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleUpdateOrder(item.id, 'cancelled')}>
                                  Hủy đơn hàng
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menu Management */}
          <TabsContent value="menu" className="space-y-4">
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
                  {menuItems.map(item => <div key={item.id} className="border border-border rounded-lg p-4">
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
                            <p className={`font-medium ${item.stock === 0 ? 'text-destructive' : 'text-foreground'}`}>
                              {item.stock}
                            </p>
                          </div>
                          
                          <Badge variant={item.status === 'active' ? 'default' : 'destructive'}>
                            {item.status === 'active' ? 'Hoạt động' : 'Hết hàng'}
                          </Badge>
                          
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
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Biểu đồ doanh thu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">Biểu đồ doanh thu theo ngày</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Thống kê hàng đợi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">Biểu đồ thời gian chờ trung bình</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews" className="space-y-4">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Đánh giá từ khách hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map(review => <div key={review} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium">Khách hàng #{review}</p>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map(star => <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            "Món ăn ngon, phục vụ nhanh. Rất hài lòng với dịch vụ."
                          </p>
                          <p className="text-xs text-muted-foreground">2 giờ trước</p>
                        </div>
                        <Button variant="outline" size="sm">Phản hồi</Button>
                      </div>
                    </div>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-4">
            <VendorSettings />
          </TabsContent>
        </Tabs>
      </div>

      <OrderDetailModal 
        isOpen={!!selectedOrder && !selectedOrder?.showDelay}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onUpdateOrder={handleUpdateOrder}
      />
      
      {/* Delay Order Dialog */}
      {selectedOrder?.showDelay && (
        <Dialog open={true} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Thông báo trễ giờ giao
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delayReason">Lý do trễ *</Label>
                <Textarea 
                  id="delayReason"
                  placeholder="Nhập lý do trễ..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delayTime">Thời gian trễ thêm (phút) *</Label>
                <Input 
                  id="delayTime"
                  type="number"
                  placeholder="Ví dụ: 15"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Hủy
                </Button>
                <Button onClick={() => {
                  setSelectedOrder(null);
                  toast({
                    title: "Đã cập nhật thời gian trễ",
                    description: "Khách hàng sẽ được thông báo về việc trễ giao",
                  });
                }}>
                  Xác nhận
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>;
};
export default VendorDashboard;