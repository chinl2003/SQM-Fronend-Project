import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, TrendingUp, CreditCard, RefreshCw,
  Download, Eye, ArrowUpRight, ArrowDownRight
} from "lucide-react";

const PaymentRevenue = () => {
  const revenueStats = [
    {
      title: "Tổng Doanh Thu",
      value: "$45,250",
      change: "+12.5% so với tháng trước",
      changeType: "increase" as const,
      icon: DollarSign,
      badge: "Tháng này"
    },
    {
      title: "Hoa Hồng Thu Được",
      value: "$4,525",
      change: "+8.2% so với tháng trước",
      changeType: "increase" as const,
      icon: TrendingUp,
      description: "Tỷ lệ hoa hồng 10%"
    },
    {
      title: "Chờ Thanh Toán",
      value: "$2,340",
      change: "3 cửa hàng đang chờ",
      changeType: "neutral" as const,
      icon: CreditCard,
      badge: "Đang chờ",
      badgeVariant: "secondary" as const
    },
    {
      title: "Hoàn Tiền",
      value: "$890",
      change: "-2.1% so với tháng trước",
      changeType: "decrease" as const,
      icon: RefreshCw,
      badge: "Thấp",
      badgeVariant: "secondary" as const
    }
  ];

  const transactions = [
    {
      id: 1,
      vendorName: "Phở Hà Nội",
      amount: "$125.50",
      commission: "$12.55",
      type: "sale",
      status: "completed",
      date: "2024-01-20 14:30"
    },
    {
      id: 2,
      vendorName: "Coffee House",
      amount: "$45.00",
      commission: "$4.50",
      type: "sale",
      status: "completed",
      date: "2024-01-20 13:15"
    },
    {
      id: 3,
      vendorName: "Bánh Mì Express",
      amount: "$23.50",
      commission: "$2.35",
      type: "refund",
      status: "processed",
      date: "2024-01-20 12:45"
    }
  ];

  const topVendors = [
    { name: "Phở Hà Nội", revenue: "$3,450", commission: "$345", orders: 45 },
    { name: "Coffee House", revenue: "$2,890", commission: "$289", orders: 67 },
    { name: "Bánh Mì Express", revenue: "$2,340", commission: "$234", orders: 89 }
  ];

  return (
    <AdminLayout title="Thanh Toán & Doanh Thu">
      <div className="space-y-6">
        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {revenueStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Giao Dịch Gần Đây</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Xuất file
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Xem tất cả
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === "sale" ? "bg-success/10" : "bg-warning/10"
                      }`}>
                        {transaction.type === "sale" ? (
                          <ArrowUpRight className={`w-5 h-5 text-success`} />
                        ) : (
                          <ArrowDownRight className={`w-5 h-5 text-warning`} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.vendorName}</p>
                        <p className="text-sm text-muted-foreground">{transaction.date}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{transaction.amount}</span>
                        <Badge 
                          variant={transaction.status === "completed" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {transaction.status === "completed" ? "hoàn tất" : "đã xử lý"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Hoa hồng: {transaction.commission}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Vendors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Cửa Hàng Doanh Thu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topVendors.map((vendor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{vendor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {vendor.orders} đơn hàng
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{vendor.revenue}</p>
                      <p className="text-xs text-muted-foreground">
                        +{vendor.commission}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Các Hành Động Quản Lý Doanh Thu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="h-auto py-4 flex-col gap-2" variant="outline">
                <Download className="w-6 h-6" />
                Xuất báo cáo doanh thu
              </Button>
              <Button className="h-auto py-4 flex-col gap-2" variant="outline">
                <CreditCard className="w-6 h-6" />
                Xử lý thanh toán
              </Button>
              <Button className="h-auto py-4 flex-col gap-2" variant="outline">
                <RefreshCw className="w-6 h-6" />
                Xử lý hoàn tiền
              </Button>
              <Button className="h-auto py-4 flex-col gap-2" variant="outline">
                <TrendingUp className="w-6 h-6" />
                Xem phân tích
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default PaymentRevenue;
