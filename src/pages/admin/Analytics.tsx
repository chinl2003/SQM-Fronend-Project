import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  AlertTriangle,
  PieChart,
  Activity,
} from "lucide-react";

/* ===== CHART ===== */
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ================= TYPES ================= */
interface TopVendor {
  vendorId: string;
  vendorName: string;
  totalOrders: number;
  totalRevenue: number;
  growthPercent: number;
}

interface PeakHour {
  hour: number;
  totalOrders: number;
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
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);

  const [loadingTopVendors, setLoadingTopVendors] = useState(false);
  const [loadingPeakHours, setLoadingPeakHours] = useState(false);

  const [openVendorChart, setOpenVendorChart] = useState(false);
  const [openPeakChart, setOpenPeakChart] = useState(false);

  /* ================= FETCH ================= */
  const fetchTopVendors = async () => {
    try {
      setLoadingTopVendors(true);
      const res = await api.get<ApiEnvelope<TopVendor[]>>(
        "/api/vendor/top-vendors?limit=5"
      );
      setTopVendors(res.data ?? []);
    } catch {
      setTopVendors([]);
    } finally {
      setLoadingTopVendors(false);
    }
  };

  const fetchPeakHours = async () => {
    try {
      setLoadingPeakHours(true);
      const res = await api.get<ApiEnvelope<PeakHour[]>>(
        "/api/order/peak-delay-hours?top=5"
      );
      setPeakHours(res.data ?? []);
    } catch {
      setPeakHours([]);
    } finally {
      setLoadingPeakHours(false);
    }
  };

  useEffect(() => {
    fetchTopVendors();
    fetchPeakHours();
  }, []);

  /* ================= HELPERS ================= */
  const getPeakLevel = (total: number) => {
    if (total > 10)
      return { label: "cao", variant: "destructive" as const };
    if (total >= 5)
      return { label: "trung bình", variant: "secondary" as const };
    return { label: "thấp", variant: "outline" as const };
  };

  /* ================= RENDER ================= */
  return (
    <AdminLayout title="Phân tích & Thống kê">
      <div className="space-y-6">

        {/* ================= TOP VENDORS ================= */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Nhà hàng bán chạy nhất</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOpenVendorChart(true)}
              >
                <PieChart className="w-4 h-4 mr-2" />
                Xem biểu đồ
              </Button>
            </CardHeader>

            <CardContent>
              {loadingTopVendors && <p>Đang tải...</p>}
              {!loadingTopVendors && topVendors.length === 0 && (
                <p>Không có dữ liệu</p>
              )}

              <div className="space-y-3">
                {topVendors.map((v, i) => (
                  <div
                    key={v.vendorId}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        #{i + 1} {v.vendorName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {v.totalOrders} đơn
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {v.totalRevenue.toLocaleString()} đ
                      </p>
                      <Badge
                        variant={
                          v.growthPercent >= 0
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {v.growthPercent >= 0 ? "+" : ""}
                        {v.growthPercent}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ================= PEAK HOURS ================= */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Giờ cao điểm (đơn trễ)</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOpenPeakChart(true)}
              >
                <Activity className="w-4 h-4 mr-2" />
                Xem biểu đồ
              </Button>
            </CardHeader>

            <CardContent>
              {loadingPeakHours && <p>Đang tải...</p>}
              {!loadingPeakHours && peakHours.length === 0 && (
                <p>Không có dữ liệu</p>
              )}

              <div className="space-y-3">
                {peakHours.map((h) => {
                  const level = getPeakLevel(h.totalOrders);
                  return (
                    <div
                      key={h.hour}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {h.hour}:00 – {h.hour}:59
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>{h.totalOrders} đơn</span>
                        <Badge variant={level.variant}>{level.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================= ANOMALY MOCK ================= */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Phát hiện bất thường
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              (Chưa triển khai – để demo UI)
            </p>
          </CardContent>
        </Card> */}
      </div>

      {/* ================= VENDOR CHART ================= */}
      <Dialog open={openVendorChart} onOpenChange={setOpenVendorChart}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Doanh thu Top Nhà hàng</DialogTitle>
          </DialogHeader>

          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topVendors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vendorName" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalRevenue" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= PEAK CHART ================= */}
      <Dialog open={openPeakChart} onOpenChange={setOpenPeakChart}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Đơn trễ theo giờ</DialogTitle>
          </DialogHeader>

          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hour"
                  tickFormatter={(h) => `${h}:00`}
                />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="totalOrders"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Analytics;
