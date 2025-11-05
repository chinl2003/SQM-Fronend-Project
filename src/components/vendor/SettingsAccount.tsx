import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsAccount() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tài khoản</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* TODO: bind user info thực tế */}
        <div className="space-y-2">
          <Label className="font-semibold" htmlFor="ownerEmail">Email đăng nhập</Label>
          <Input id="ownerEmail" defaultValue="" placeholder="email@domain.com" />
        </div>
        <div className="space-y-2">
          <Label className="font-semibold" htmlFor="ownerPhone">Số điện thoại</Label>
          <Input id="ownerPhone" defaultValue="" placeholder="0xxx..." />
        </div>
        <Button>Lưu thay đổi</Button>
      </CardContent>
    </Card>
  );
}
