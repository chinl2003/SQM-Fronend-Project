import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  Users,
  BarChart3,
  PieChart,
  Activity,
  Download,
} from "lucide-react";

/* ================= TYPES ================= */
interface TopVendor {
  vendorId: string;
  vendorName: string;
  totalOrders: number;
  totalRevenue: number;
  growthPercent: number;
}

interface ApiEnvelope<T> {
  data: T;
  message?: string;
  statusCode: number;
  code: string;
}

/* ================= COMPONENT ================= */
const Analytics = () => {
  const [topVendors, setTopVendors] = useState<TopVendor[]>([]);
  const [loadingTopVendors, setLoadingTopVendors] = useState(false);

  /* ---------- FETCH TOP VENDORS ---------- */
  const fetchTopVendors = async () => {
    try {
      setLoadingTopVendors(true);

      const res = await api.get<ApiEnvelope<TopVendor[]>>(
        "/api/vendor/top-vendors?limit=3"
      );

      setTopVendors(res.data ?? []);
    } catch (error) {
      console.error("Failed to fetch top vendors", error);
      setTopVendors([]);
    } finally {
      setLoadingTopVendors(false);
    }
  };

  useEffect(() => {
    fetchTopVendors();
  }, []);

  /* ---------- MOCK (CHƯA LÀM API) ---------- */
  const peakHours = [
    { hour: "12:00 PM", orders: 89, load: "cao" },
    { hour: "1:00 PM", orders: 95, load: "cao" },
    { hour: "7:00 PM", orders: 67, load: "trung bình" },
    { hour: "8:00 PM", orders: 72, load: "trung bình" },
  ];

  const anomalies = [
    {
      id: 1,
      description: "Đột biến đơn hàng bất thường tại chi nhánh Quận 1",
      time: "2 giờ trước",
      severity: "trung bình",
    },
    {
      id: 2,
      description: "Giảm số lượng đơn ở nhóm cửa hàng cà phê",
      time: "4 giờ trước",
      severity: "thấp",
    },
    {
      id: 3,
      description: "Tỷ lệ hủy đơn cao bất thường",
      time: "6 giờ trước",
      severity: "cao",
    },
  ];

  return (
    <AdminLayout title="Phân tích & Thống kê">
      <div className="space-y-6">

        {/* ================= TOP VENDORS ================= */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Nhà hàng bán chạy nhất</CardTitle>
              <Button variant="outline" size="sm">
                <PieChart className="w-4 h-4 mr-2" />
                Xem biểu đồ
              </Button>
            </CardHeader>

            <CardContent>
              {loadingTopVendors && (
                <p className="text-sm text-muted-foreground">
                  Đang tải dữ liệu...
                </p>
              )}

              {!loadingTopVendors && topVendors.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Không có dữ liệu.
                </p>
              )}

              <div className="space-y-4">
                {topVendors.map((vendor, index) => (
                  <div
                    key={vendor.vendorId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{vendor.vendorName}</p>
                        <p className="text-sm text-muted-foreground">
                          {vendor.totalOrders} đơn hàng
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">
                        {vendor.totalRevenue.toLocaleString()} đ
                      </p>
                      <Badge
                        variant={
                          vendor.growthPercent >= 0
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {vendor.growthPercent >= 0 ? "+" : ""}
                        {vendor.growthPercent}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ================= PEAK HOURS (MOCK) ================= */}
          <Card>
            <CardHeader>
              <CardTitle>Phân tích giờ cao điểm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {peakHours.map((hour, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">{hour.hour}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">
                        {hour.orders} đơn
                      </span>
                      <Badge
                        variant={
                          hour.load === "cao"
                            ? "destructive"
                            : "secondary"
                        }
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

        {/* ================= ANOMALIES (MOCK) ================= */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Phát hiện bất thường
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {anomalies.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{a.description}</p>
                    <p className="text-sm text-muted-foreground">{a.time}</p>
                  </div>
                  <Badge
                    variant={
                      a.severity === "cao"
                        ? "destructive"
                        : a.severity === "trung bình"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {a.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Analytics;
