import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, DollarSign } from "lucide-react";

export default function SettingsDebt() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Công nợ & thanh toán</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* TODO: bind dữ liệu công nợ thực tế từ API nếu đã có */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Số dư công nợ</span>
              <p className="text-xl font-semibold flex items-center">
                <DollarSign className="h-4 w-4 mr-1" /> 0
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Kỳ thanh toán kế tiếp</span>
              <p className="text-xl font-semibold">—</p>
            </div>
          </div>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Quá hạn thanh toán có thể dẫn đến khóa hoạt động. Vui lòng thanh toán đúng hạn.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
