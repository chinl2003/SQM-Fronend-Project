import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Ban, RotateCcw, Eye, Search, 
  User, MapPin, Calendar, Clock
} from "lucide-react";
import { useState } from "react";

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const users = [
    {
      id: 1,
      name: "Nguyễn Văn A",
      email: "nguyen.vana@email.com",
      status: "active",
      location: "TP.HCM",
      joinDate: "2023-10-15",
      lastActive: "2 giờ trước",
      totalOrders: 45,
      avatar: "NA"
    },
    {
      id: 2,
      name: "Trần Thị B",
      email: "tran.thib@email.com",
      status: "banned",
      location: "Hà Nội",
      joinDate: "2023-09-20",
      lastActive: "1 tuần trước",
      totalOrders: 12,
      avatar: "TB"
    },
    {
      id: 3,
      name: "Lê Minh C",
      email: "le.minhc@email.com",
      status: "active",
      location: "Đà Nẵng",
      joinDate: "2024-01-10",
      lastActive: "5 phút trước",
      totalOrders: 28,
      avatar: "LC"
    }
  ];

  const handleBanUser = (userId: number) => {
    console.log("Khóa tài khoản:", userId);
  };

  const handleUnbanUser = (userId: number) => {
    console.log("Mở khóa tài khoản:", userId);
  };

  const handleResetLogin = (userId: number) => {
    console.log("Đặt lại đăng nhập cho tài khoản:", userId);
  };

  return (
    <AdminLayout title="Quản lý người dùng">
      <div className="space-y-6">
        {/* Tìm kiếm và hành động */}
        <Card>
          <CardHeader>
            <CardTitle>Tìm kiếm người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">Tất cả trạng thái</Button>
              <Button variant="outline">Xuất danh sách</Button>
            </div>
          </CardContent>
        </Card>

        {/* Danh sách người dùng */}
        <Card>
          <CardHeader>
            <CardTitle>Tài khoản người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="grid lg:grid-cols-4 gap-4 items-center">
                    {/* Thông tin người dùng */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{user.name}</h3>
                          <p className="text-muted-foreground">{user.email}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {user.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Tham gia {user.joinDate}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Hoạt động gần đây: {user.lastActive}
                            </span>
                            <span>{user.totalOrders} đơn hàng</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Trạng thái */}
                    <div className="text-center">
                      <Badge 
                        variant={user.status === "active" ? "default" : "destructive"}
                        className="mb-2"
                      >
                        {user.status === "active" ? "Hoạt động" : "Bị khóa"}
                      </Badge>
                      <p className="font-semibold">{user.totalOrders}</p>
                      <p className="text-xs text-muted-foreground">Tổng đơn hàng</p>
                    </div>

                    {/* Hành động */}
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => console.log("Xem lịch sử người dùng:", user.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResetLogin(user.id)}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      
                      {user.status === "active" ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleBanUser(user.id)}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleUnbanUser(user.id)}
                        >
                          <User className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;
