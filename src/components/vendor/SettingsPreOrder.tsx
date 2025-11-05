import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SettingsPreOrder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cấu hình Pre-order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* TODO: bind config thực tế */}
        <div className="flex items-center justify-between">
          <Label className="font-semibold">Cho phép đặt trước</Label>
          <Switch defaultChecked />
        </div>
        <div className="text-sm text-muted-foreground">
          Thiết lập thời gian nhận đơn đặt trước, hạn chót hủy, v.v.
        </div>
      </CardContent>
    </Card>
  );
}
