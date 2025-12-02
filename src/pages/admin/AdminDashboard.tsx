import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
Users, ShoppingBag, Clock, DollarSign,
TrendingUp, AlertTriangle, CheckCircle,
Eye, MoreHorizontal, Timer, AlertCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const AdminDashboard = () => {

interface VendorFilterResponse {
data: {
totalCount: number;
increaseCount: number;
decreaseCount: number;
};
additionalData: any;
message: string;
statusCode: number;
code: string;
}

interface QueueEntryCountResponse {
data: {
totalCount: number;
totalCountLastWeek: number;
};
additionalData: any;
message: string;
statusCode: number;
code: string;
}

interface OrderCancleCountResponse {
data: {
totalCount: number;
totalCountYesterday: number;
};
additionalData: any;
message: string;
statusCode: number;
code: string;
}

const [activeVendorCount, setActiveVendorCount] = useState(0);
const [todayVendorCount, setTodayVendorCount] = useState(0);
const [changeSign, setChangeSign] = useState("+");
const [changeType, setChangeType] = useState<"increase" | "decrease">("increase");
const [queueSign, setQueueSign] = useState("+");
const [queueToday, setQueueToday] = useState(0);
const [queuePercent, setQueuePercent] = useState(0);
const [queueChangeType, setQueueChangeType] =
  useState<"increase" | "decrease">("increase");
const [orderCancleSign, setOrderCancleSign] = useState("+");
const [orderCancleToday, setOrderCancleToday] = useState(0);
const [orderCanclePercent, setOrderCanclePercent] = useState(0);
const [orderCancleChangeType, setOrderCancleChangeType] =
  useState<"increase" | "decrease">("increase");
  
const fetchActiveVendors = async () => {
  try {
    const res = await api.get<VendorFilterResponse>(
      "/api/vendor/by-status-active?Status=Active"
    );

    const total = res.data?.totalCount ?? 0;
    const increaseCount = res.data?.increaseCount ?? 0;
    const decreaseCount = res.data?.decreaseCount ?? 0;

    let todayCount: number;
    let type: "increase" | "decrease";
    let sign: string;

    if (increaseCount > decreaseCount) {
      todayCount = increaseCount - decreaseCount;
      type = "increase";
      sign = "+";
    } else {
      todayCount = decreaseCount - increaseCount;
      type = "decrease";
      sign = "-";
    }

    setActiveVendorCount(total);
    setTodayVendorCount(todayCount);
    setChangeType(type);
    setChangeSign(sign);

  } catch (error) {
    console.error("Error fetching active vendors:", error);
  }
};

const fetchQueueEntryCount = async () => {
  try {
    const res = await api.get<QueueEntryCountResponse>(
      "/api/QueueEntry/queue-entry-count"
    );

    const totalQueueToday = res.data?.totalCount ?? 0;
    const totalQueueCountLastWeek = res.data?.totalCountLastWeek ?? 0;

    let changeType: "increase" | "decrease";
    let sign: string;

    let percentChange = 0;

    if (totalQueueCountLastWeek === 0) {
      percentChange = totalQueueToday > 0 ? 100 : 0;
    } else {
      percentChange = ((totalQueueToday - totalQueueCountLastWeek) / totalQueueCountLastWeek) * 100;
    }

    if (percentChange >= 0) {
      changeType = "increase";
      sign = "+";
    } else {
      changeType = "decrease";
      sign = "-";
    }

    percentChange = Math.abs(Math.round(percentChange));

    setQueueToday(totalQueueToday);
    setQueuePercent(percentChange);
    setQueueChangeType(changeType);
    setQueueSign(sign);
  } catch (error) {
    console.error("Error fetching total queue entry:", error);
  }
};

const fetchOrderCancleCount = async () => {
  try {
    const res = await api.get<OrderCancleCountResponse>(
      "/api/Order/order-cancle-count"
    );

    const totalOrderCancleToday = res.data?.totalCount ?? 0;
    const totalOrderCancleCountYesterday = res.data?.totalCountYesterday ?? 0;

    let changeType: "increase" | "decrease";
    let sign: string;

    let percentChange = 0;

    if (totalOrderCancleCountYesterday === 0) {
      percentChange = totalOrderCancleToday > 0 ? 100 : 0;
    } else {
      percentChange = ((totalOrderCancleToday - totalOrderCancleCountYesterday) / totalOrderCancleCountYesterday) * 100;
    }

    if (percentChange >= 0) {
      changeType = "increase";
      sign = "+";
    } else {
      changeType = "decrease";
      sign = "-";
    }

    percentChange = Math.abs(Math.round(percentChange));

    setOrderCancleToday(totalOrderCancleToday);
    setOrderCanclePercent(percentChange);
    setOrderCancleChangeType(changeType);
    setOrderCancleSign(sign);
  } catch (error) {
    console.error("Error fetching total queue entry:", error);
  }
};

useEffect(() => {
  fetchActiveVendors();
  fetchQueueEntryCount();
  fetchOrderCancleCount();
}, []);


const stats = [
{
title: "Nhà cung cấp đang hoạt động",
value: activeVendorCount,
change: changeSign  + todayVendorCount + " so với hôm qua",
changeType,
icon: ShoppingBag,
badge: "Trực tuyến"
},
{
  title: "Tổng số hàng chờ",
  value: queueToday,
  change: `${queueSign}${queuePercent}% so với tuần trước`,
  changeType: queueChangeType,
  icon: Clock,
  description: "Đang hoạt động"
},
{
title: "Hủy đơn",
value: orderCancleToday,
change: `${orderCancleSign}${orderCanclePercent}% so với hôm qua`,
changeType: orderCancleChangeType,
icon: AlertTriangle,
badge: "Thấp",
badgeVariant: "secondary" as const
}
];

const recentVendors = [
{ id: 1, name: "Phở Hà Nội", status: "đang chờ duyệt", type: "Nhà hàng", revenue: "$1,200" },
{ id: 2, name: "Coffee House", status: "đã duyệt", type: "Quán cà phê", revenue: "$850" },
{ id: 3, name: "Bánh Mì Sài Gòn", status: "bị tạm ngưng", type: "Đồ ăn nhanh", revenue: "$0" },
{ id: 4, name: "Bún Bò Huế", status: "đã duyệt", type: "Nhà hàng", revenue: "$950" }
];

const alerts = [
{ id: 1, type: "warning", message: "Lượng hàng chờ cao tại khu vực Quận 1", time: "5 phút trước" },
{ id: 2, type: "error", message: "Cổng thanh toán gặp sự cố kết nối", time: "12 phút trước" },
{ id: 3, type: "info", message: "Lượng đăng ký nhà cung cấp mới tăng đột biến", time: "25 phút trước" }
];

const vendorDelayRates = [
{
id: 1,
name: "Phở Hà Nội",
type: "Nhà hàng",
dailyDelays: 8,
monthlyDelays: 45,
delayRate: 28,
isHighDelay: true,
delayedOrders: [
{ orderId: "#ORD-2847", customerName: "Nguyễn An", expectedTime: "19:30", currentDelay: "15 phút" },
{ orderId: "#ORD-2851", customerName: "Trần Bình", expectedTime: "19:45", currentDelay: "8 phút" }
]
},
{
id: 2,
name: "Coffee House",
type: "Quán cà phê",
dailyDelays: 12,
monthlyDelays: 78,
delayRate: 35,
isHighDelay: true,
delayedOrders: [
{ orderId: "#ORD-2849", customerName: "Lê Cường", expectedTime: "19:25", currentDelay: "22 phút" },
{ orderId: "#ORD-2852", customerName: "Phạm Dung", expectedTime: "19:50", currentDelay: "5 phút" },
{ orderId: "#ORD-2853", customerName: "Hoàng Ế", expectedTime: "19:55", currentDelay: "12 phút" }
]
},
{
id: 3,
name: "Bánh Mì Sài Gòn",
type: "Đồ ăn nhanh",
dailyDelays: 2,
monthlyDelays: 15,
delayRate: 8,
isHighDelay: false,
delayedOrders: []
},
{
id: 4,
name: "Bún Bò Huế",
type: "Nhà hàng",
dailyDelays: 5,
monthlyDelays: 32,
delayRate: 18,
isHighDelay: false,
delayedOrders: [
{ orderId: "#ORD-2850", customerName: "Vũ Giang", expectedTime: "19:40", currentDelay: "10 phút" }
]
},
{
id: 5,
name: "Trà Sữa Ngon",
type: "Đồ uống",
dailyDelays: 15,
monthlyDelays: 92,
delayRate: 42,
isHighDelay: true,
delayedOrders: [
{ orderId: "#ORD-2848", customerName: "Đỗ Hạnh", expectedTime: "19:20", currentDelay: "28 phút" },
{ orderId: "#ORD-2854", customerName: "Bùi Khánh", expectedTime: "20:00", currentDelay: "3 phút" }
]
}
];

return ( <AdminLayout title="Tổng quan hệ thống"> <div className="space-y-6"> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
{stats.map((stat, index) => (
<StatCard key={index} {...stat} />
))} </div>

```
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Đơn đăng ký nhà cung cấp gần đây</CardTitle>
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Xem tất cả
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentVendors.map((vendor) => (
              <div key={vendor.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{vendor.name}</p>
                    <p className="text-sm text-muted-foreground">{vendor.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-medium">{vendor.revenue}</p>
                    <Badge 
                      variant={
                        vendor.status === "đã duyệt" ? "default" : 
                        vendor.status === "đang chờ duyệt" ? "secondary" : "destructive"
                      }
                      className="text-xs"
                    >
                      {vendor.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Cảnh báo hệ thống
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-3 border rounded-lg">
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    alert.type === "error" ? "bg-destructive" :
                    alert.type === "warning" ? "bg-warning" : "bg-info"
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full">
              Xem tất cả cảnh báo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="w-5 h-5" />
          Giám sát tỉ lệ trễ món
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vendorDelayRates.map((vendor) => (
            <div 
              key={vendor.id} 
              className={`p-4 border rounded-lg ${
                vendor.isHighDelay ? 'border-destructive bg-destructive/5' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    vendor.isHighDelay ? 'bg-destructive/10' : 'bg-primary/10'
                  }`}>
                    <ShoppingBag className={`w-5 h-5 ${
                      vendor.isHighDelay ? 'text-destructive' : 'text-primary'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{vendor.name}</p>
                      {vendor.isHighDelay && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Tỉ lệ cao
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{vendor.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-semibold ${
                    vendor.isHighDelay ? 'text-destructive' : 'text-foreground'
                  }`}>
                    {vendor.delayRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">Tỉ lệ trễ</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-sm font-medium">{vendor.dailyDelays}</p>
                  <p className="text-xs text-muted-foreground">Trễ hôm nay</p>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <p className="text-sm font-medium">{vendor.monthlyDelays}</p>
                  <p className="text-xs text-muted-foreground">Trễ tháng này</p>
                </div>
              </div>

              {vendor.delayedOrders.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-2 text-destructive">
                    Đơn hàng đang trễ ({vendor.delayedOrders.length}):
                  </p>
                  <div className="space-y-2">
                    {vendor.delayedOrders.map((order) => (
                      <div key={order.orderId} className="flex justify-between items-center p-2 bg-destructive/5 rounded text-sm">
                        <div>
                          <span className="font-medium">{order.orderId}</span>
                          <span className="text-muted-foreground ml-2">- {order.customerName}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-destructive font-medium">+{order.currentDelay}</p>
                          <p className="text-xs text-muted-foreground">Dự kiến: {order.expectedTime}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Hành động nhanh</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button className="h-auto py-4 flex-col gap-2" variant="outline">
            <CheckCircle className="w-6 h-6" />
            Duyệt nhà cung cấp
          </Button>
          <Button className="h-auto py-4 flex-col gap-2" variant="outline">
            <TrendingUp className="w-6 h-6" />
            Xem phân tích
          </Button>
          <Button className="h-auto py-4 flex-col gap-2" variant="outline">
            <Users className="w-6 h-6" />
            Quản lý người dùng
          </Button>
          <Button className="h-auto py-4 flex-col gap-2" variant="outline">
            <DollarSign className="w-6 h-6" />
            Báo cáo doanh thu
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</AdminLayout>

);
};

export default AdminDashboard;
