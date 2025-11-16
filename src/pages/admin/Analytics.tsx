import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, Clock, AlertTriangle, Users,
  BarChart3, PieChart, Activity, Download
} from "lucide-react";

const Analytics = () => {
  const topVendors = [
    { name: "Phở Hà Nội", orders: 234, revenue: "$3,450", growth: "+15%" },
    { name: "Coffee House", orders: 189, revenue: "$2,890", growth: "+8%" },
    { name: "Bánh Mì Express", orders: 156, revenue: "$2,340", growth: "+12%" }
  ];

  const peakHours = [
    { hour: "12:00 PM", orders: 89, load: "cao" },
    { hour: "1:00 PM", orders: 95, load: "cao" },
    { hour: "7:00 PM", orders: 67, load: "trung bình" },
    { hour: "8:00 PM", orders: 72, load: "trung bình" }
  ];

  const anomalies = [
    { 
      id: 1, 
      type: "spike", 
      description: "Đột biến đơn hàng bất thường tại chi nhánh Quận 1", 
      time: "2 giờ trước",
      severity: "trung bình"
    },
    { 
      id: 2, 
      type: "drop", 
      description: "Giảm số lượng đơn ở nhóm cửa hàng cà phê", 
      time: "4 giờ trước",
      severity: "thấp"
    },
    { 
      id: 3, 
      type: "error", 
      description: "Tỷ lệ hủy đơn cao bất thường", 
      time: "6 giờ trước",
      severity: "cao"
    }
  ];

  return (
    <AdminLayout title="Phân tích & Thống kê">
      <div className="space-y-6">

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-muted-foreground text-sm">Tổng số đơn hàng</p>
                  <p className="text-xs text-success">+12% so với hôm qua</p>
                </div>
                <BarChart3 className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">15.2 phút</div>
                  <p className="text-muted-foreground text-sm">Thời gian chờ trung bình</p>
                  <p className="text-xs text-destructive">+2 phút so với hôm qua</p>
                </div>
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">94.5%</div>
                  <p className="text-muted-foreground text-sm">Tỷ lệ hoàn tất</p>
                  <p className="text-xs text-success">+1.2% so với hôm qua</p>
                </div>
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">8,567</div>
                  <p className="text-muted-foreground text-sm">Người dùng hoạt động</p>
                  <p className="text-xs text-success">+5% so với tuần trước</p>
                </div>
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Vendors */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Nhà hàng bán chạy nhất</CardTitle>
              <Button variant="outline" size="sm">
                <PieChart className="w-4 h-4 mr-2" />
                Xem biểu đồ
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topVendors.map((vendor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-sm text-muted-foreground">{vendor.orders} đơn hàng</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{vendor.revenue}</p>
                      <Badge variant="secondary" className="text-xs">
                        {vendor.growth}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Peak hours */}
          <Card>
            <CardHeader>
              <CardTitle>Phân tích giờ cao điểm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {peakHours.map((hour, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">{hour.hour}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{hour.orders} đơn</span>
                      <Badge 
                        variant={hour.load === "cao" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {hour.load}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Anomalies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Phát hiện bất thường
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anomalies.map((anomaly) => (
                <div key={anomaly.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      anomaly.severity === "cao" ? "bg-destructive" :
                      anomaly.severity === "trung bình" ? "bg-warning" : "bg-info"
                    }`} />
                    <div>
                      <p className="font-medium">{anomaly.description}</p>
                      <p className="text-sm text-muted-foreground">{anomaly.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={
                        anomaly.severity === "cao" ? "destructive" : 
                        anomaly.severity === "trung bình" ? "secondary" : "outline"
                      }
                    >
                      {anomaly.severity}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Activity className="w-4 h-4 mr-2" />
                      Xem chi tiết
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tools */}
        <Card>
          <CardHeader>
            <CardTitle>Công cụ phân tích</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="h-auto py-4 flex-col gap-2" variant="outline">
                <Download className="w-6 h-6" />
                Xuất dữ liệu
              </Button>
              <Button className="h-auto py-4 flex-col gap-2" variant="outline">
                <BarChart3 className="w-6 h-6" />
                Báo cáo tùy chỉnh
              </Button>
              <Button className="h-auto py-4 flex-col gap-2" variant="outline">
                <PieChart className="w-6 h-6" />
                Phân tích doanh thu
              </Button>
              <Button className="h-auto py-4 flex-col gap-2" variant="outline">
                <TrendingUp className="w-6 h-6" />
                Xu hướng tăng trưởng
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Analytics;
