import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Settings, Users, Shield, Activity,
  Eye, Edit, Trash2, UserPlus,
  AlertTriangle, CheckCircle, Clock
} from "lucide-react";

const SystemSettings = () => {
  const staffRoles = [
    { id: 1, name: "Admin User", email: "admin@smartqueue.com", role: "Siêu Admin", permissions: ["Toàn quyền"], lastActive: "2 giờ trước", status: "active", avatar: "AU" },
    { id: 2, name: "Jane Manager", email: "jane@smartqueue.com", role: "Quản lý", permissions: ["Quản lý người dùng", "Phê duyệt vendor"], lastActive: "1 ngày trước", status: "active", avatar: "JM" },
    { id: 3, name: "John Support", email: "john@smartqueue.com", role: "Hỗ trợ", permissions: ["Chỉ xem", "Hỗ trợ khách hàng"], lastActive: "3 ngày trước", status: "inactive", avatar: "JS" }
  ];

  const auditLogs = [
    { id: 1, action: "Phê duyệt Vendor", user: "Admin User", details: "Đã phê duyệt vendor Phở Hà Nội", timestamp: "2024-01-20 14:30:25", type: "success" },
    { id: 2, action: "Khóa người dùng", user: "Jane Manager", details: "Khóa user ID: 12345 do vi phạm chính sách", timestamp: "2024-01-20 13:15:10", type: "warning" },
    { id: 3, action: "Thay đổi cài đặt hệ thống", user: "Admin User", details: "Cập nhật tỷ lệ hoa hồng từ 8% lên 10%", timestamp: "2024-01-20 12:45:33", type: "info" }
  ];

  const systemErrors = [
    { id: 1, error: "Thanh toán Timeout", severity: "cao", occurrences: 12, lastSeen: "5 phút trước", status: "đang kiểm tra" },
    { id: 2, error: "Đồng bộ Queue thất bại", severity: "trung bình", occurrences: 3, lastSeen: "2 giờ trước", status: "đã giải quyết" }
  ];

  return (
    <AdminLayout title="Cài đặt hệ thống">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Cấu hình hệ thống
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="commission">Tỷ lệ hoa hồng (%)</Label>
                  <Input id="commission" type="number" defaultValue="10" />
                </div>
                <div>
                  <Label htmlFor="queue-limit">Số lượng tối đa trong hàng đợi</Label>
                  <Input id="queue-limit" type="number" defaultValue="50" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-approve">Tự động phê duyệt vendor</Label>
                  <Switch id="auto-approve" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="timeout">Thời gian chờ phiên (phút)</Label>
                  <Input id="timeout" type="number" defaultValue="30" />
                </div>
                <div>
                  <Label htmlFor="maintenance">Chế độ bảo trì</Label>
                  <div className="flex items-center gap-2">
                    <Switch id="maintenance" />
                    <span className="text-sm text-muted-foreground">Hiện tại: TẮT</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notifications">Thông báo đẩy</Label>
                  <Switch id="notifications" defaultChecked />
                </div>
              </div>
            </div>
            
            <Button>Lưu cấu hình</Button>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Nhân viên
              </CardTitle>
              <Button size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Thêm nhân viên
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffRoles.map((staff) => (
                  <div key={staff.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {staff.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{staff.name}</h4>
                          <p className="text-sm text-muted-foreground">{staff.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={staff.status === "active" ? "default" : "secondary"}>
                              {staff.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {staff.lastActive}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
                Giám sát lỗi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemErrors.map((error) => (
                  <div key={error.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{error.error}</h4>
                        <p className="text-sm text-muted-foreground">
                          {error.occurrences} lần xảy ra
                        </p>
                      </div>
                      <Badge 
                        variant={error.severity === "cao" ? "destructive" : 
                                error.severity === "trung bình" ? "secondary" : "outline"}
                      >
                        {error.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Lần cuối: {error.lastSeen}</span>
                      <Badge 
                        variant={error.status === "đã giải quyết" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {error.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full">
                  Xem tất cả lỗi
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Nhật ký hệ thống
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        log.type === "success" ? "bg-success" :
                        log.type === "warning" ? "bg-warning" : "bg-info"
                      }`} />
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-muted-foreground">{log.details}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{log.user}</p>
                      <p className="text-xs">{log.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <Button variant="outline" className="w-full mt-4">
              <Eye className="w-4 h-4 mr-2" />
              Xem toàn bộ nhật ký
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trạng thái hệ thống</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="w-8 h-8 mx-auto text-success mb-2" />
                <p className="font-medium">Cơ sở dữ liệu</p>
                <p className="text-xs text-success">Online</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="w-8 h-8 mx-auto text-success mb-2" />
                <p className="font-medium">API</p>
                <p className="text-xs text-success">Khỏe mạnh</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <AlertTriangle className="w-8 h-8 mx-auto text-warning mb-2" />
                <p className="font-medium">Thanh toán</p>
                <p className="text-xs text-warning">Có vấn đề</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <CheckCircle className="w-8 h-8 mx-auto text-success mb-2" />
                <p className="font-medium">Hàng đợi</p>
                <p className="text-xs text-success">Đang hoạt động</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SystemSettings;
