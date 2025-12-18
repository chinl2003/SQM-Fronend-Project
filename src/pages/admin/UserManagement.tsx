import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Eye,
  Ban,
  Search,
  User,
  MapPin,
  Calendar,
} from "lucide-react";

/* ================= TYPES ================= */
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
  imagePath?: string | null;
}

interface PaginatedUserResponse {
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  data: ApiUser[];
}

interface ApiResponse<T> {
  data: T;
  additionalData?: unknown;
  message?: string;
  statusCode: number;
  code: string;
}

/* ================= COMPONENT ================= */
const PAGE_SIZE = 20;

const UserManagement = () => {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [openDetail, setOpenDetail] = useState(false);

  /* ================= FETCH USERS ================= */
  const fetchUsers = async (page = 1, key = "") => {
    try {
      setLoading(true);

      const res = await api.get<ApiResponse<PaginatedUserResponse>>(
        `/api/User?PageNumber=${page}&PageSize=${PAGE_SIZE}&Key=${key}`
      );

      const paging = res.data;

      setUsers(paging.data ?? []);
      setTotalPages(paging.totalPages ?? 1);
      setTotalRecords(paging.totalRecords ?? 0);
    } catch (err) {
      console.error("Fetch users failed", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  /* ================= DELETE USER ================= */
  const deleteUser = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa user này?")) return;

    try {
      await api.delete(`/api/User/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Lỗi khi xóa user:", err);
      alert("Xóa user thất bại");
    }
  };

  /* ================= VIEW DETAIL ================= */
  const openUserDetail = (user: ApiUser) => {
    setSelectedUser(user);
    setOpenDetail(true);
  };

  return (
    <AdminLayout title="Quản lý người dùng">
      <div className="space-y-6">

        {/* ================= SEARCH ================= */}
        <Card>
          <CardHeader>
            <CardTitle>Tìm kiếm người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tên, email, số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => fetchUsers(1, searchTerm)}>
                Tìm kiếm
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ================= USER LIST ================= */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách người dùng</CardTitle>
          </CardHeader>

          <CardContent>
            {loading && <p>Đang tải...</p>}

            {!loading && users.length === 0 && (
              <p>Không có người dùng</p>
            )}

            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="
                    group rounded-2xl border p-5
                    bg-gradient-to-br from-background to-muted/40
                    transition-all hover:shadow-lg hover:-translate-y-0.5
                  "
                >
                  <div className="grid lg:grid-cols-4 gap-4 items-center">

                    {/* ================= INFO ================= */}
                    <div className="lg:col-span-2 flex gap-4">
                      <Avatar className="w-16 h-16 ring-2 ring-primary/20 shadow">
                        {user.imagePath ? (
                          <img
                            src={user.imagePath}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                            {user.fullName.charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div>
                        <h3 className="font-semibold text-lg">
                          {user.fullName}
                        </h3>
                        <p className="text-muted-foreground">{user.email}</p>

                        <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {user.location ?? "N/A"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {user.createdTime
                              ? new Date(user.createdTime).toLocaleDateString("vi-VN")
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ================= STATUS ================= */}
                    <div className="text-center">
                      <Badge
                        className={
                          user.isActive
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                            : "bg-red-100 text-red-700 border border-red-300"
                        }
                      >
                        {user.isActive ? "Hoạt động" : "Bị khóa"}
                      </Badge>

                      <p className="mt-2 font-semibold">
                        {user.orderCount ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Đơn hàng
                      </p>
                    </div>

                    {/* ================= ACTION ================= */}
                    <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => openUserDetail(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => deleteUser(user.id)}
                      >
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ================= PAGINATION ================= */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Trang {currentPage}/{totalPages} • {totalRecords} users
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ================= DETAIL DIALOG ================= */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-lg">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>Chi tiết người dùng</DialogTitle>
              </DialogHeader>

              <div className="flex items-center gap-4 mt-4">
                <Avatar className="w-20 h-20 ring-2 ring-primary/30">
                  {selectedUser.imagePath ? (
                    <img
                      src={selectedUser.imagePath}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                      {selectedUser.fullName.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedUser.fullName}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <User className="inline w-4 h-4 mr-1" />
                  {selectedUser.phoneNumber}
                </p>
                <p>Vai trò: {selectedUser.roles.join(", ")}</p>
                <p>Đơn hàng: {selectedUser.orderCount ?? 0}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default UserManagement;
