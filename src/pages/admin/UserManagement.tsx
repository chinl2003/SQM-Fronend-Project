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
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface ApiUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  roles: string[];
  location: string | null;
  isActive: boolean;
  createdTime?: string; 
  orderCount?: number; 
}

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const PAGE_SIZE = 20;

const fetchUsers = async (page: number = 1,  key: string = "") => {
  try {
    setLoading(true);

    const res = await api.get<{
      data: {
        totalRecords: number;
        pageNumber: number;
        pageSize: number;
        totalPages: number;
        hasPreviousPage: boolean;
        hasNextPage: boolean;
        data: ApiUser[];
      };
      additionalData: any;
      message: string;
      statusCode: number;
      code: string;
    }>(`/api/User?PageNumber=${page}&PageSize=${PAGE_SIZE}&Key= ${key}`);

    const paginated = res.data;

    setUsers(paginated.data ?? []);
setTotalPages(paginated.totalPages ?? 1);
setTotalRecords(paginated.totalRecords ?? 0);

  } catch (error) {
    console.error("Lỗi khi lấy danh sách user:", error);
    setUsers([]);
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  return (
    <AdminLayout title="Quản lý người dùng">
      <div className="space-y-6">
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
              <Button variant="outline" onClick={() => fetchUsers(1, searchTerm)}>Tìm kiếm</Button>
              <Button variant="outline" onClick={() => fetchUsers(1)}>Tất cả trạng thái</Button>
              <Button variant="outline" onClick={() => fetchUsers(currentPage)}>Refresh</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tài khoản người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Đang tải dữ liệu...</p>
            ) : users.length === 0 ? (
              <p>Không tìm thấy người dùng.</p>
            ) : (
              <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="grid lg:grid-cols-4 gap-4 items-center">
                    <div className="lg:col-span-2">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.fullName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{user.fullName}</h3>
                          <p className="text-muted-foreground">{user.email}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {user.location || "N/A"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {user.createdTime ? new Date(user.createdTime).toLocaleDateString("vi-VN") : "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {user.phoneNumber}
                            </span>
                            <span>{user.orderCount ?? 0} đơn hàng</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <Badge
                        variant={user.isActive ? "default" : "destructive"}
                        className="mb-2"
                      >
                        {user.isActive ? "Hoạt động" : "Bị khóa"}
                      </Badge>
                      <p className="font-semibold">{user.orderCount ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Tổng đơn hàng</p>
                    </div>              
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
                        onClick={() => console.log("Đặt lại đăng nhập cho tài khoản:", user.id)}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>

                      {user.isActive ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => console.log("Khóa tài khoản:", user.id)}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => console.log("Mở khóa tài khoản:", user.id)}
                        >
                          <User className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Trang {currentPage} / {totalPages} • Tổng {totalRecords} người dùng
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  >
                    Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;
