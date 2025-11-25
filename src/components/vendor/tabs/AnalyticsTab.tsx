// src/components/vendor/tabs/AnalyticsTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsTab({ vendor }: any) {
  return (
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
  );
}
