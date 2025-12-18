import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, Users, ShoppingBag, MessageSquare, 
  DollarSign, BarChart3, Bell, Settings, LogOut,
  Menu, X
} from "lucide-react";
import { useState } from "react";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Bảng điều khiển", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Quản lý quán", href: "/admin/vendor-management", icon: ShoppingBag },
    { name: "Giám sát hàng chờ", href: "/admin/queue-management", icon: MessageSquare },
    { name: "Quản lý người dùng", href: "/admin/user-management", icon: Users },
    { name: "Đánh giá", href: "/admin/reviews", icon: MessageSquare },
    { name: "Thanh toán", href: "/admin/payments", icon: DollarSign },
    { name: "Phân tích", href: "/admin/analytics", icon: BarChart3 },
    // { name: "Thông báo", href: "/admin/notifications", icon: Bell },
    { name: "Cài đặt", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-admin-bg">
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-primary">Hệ thống</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50">
          <Card className="w-80 h-full p-0 m-0 rounded-none">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Menu quản trị</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <nav className="p-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </Card>
        </div>
      )}

      <div className="lg:flex">
        {/* Sidebar trên desktop */}
        <div className="hidden lg:block w-64 bg-white border-r min-h-screen">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-primary-hover flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-primary">Hệ thống</h2>
                <p className="text-xs text-muted-foreground">Hệ thống xếp hàng thông minh</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 w-64 p-4 border-t bg-white">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Quản trị viên</p>
                <p className="text-xs text-muted-foreground">Người quản trị hệ thống</p>
              </div>
              <Badge variant="secondary" className="text-xs">Admin</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              asChild
            >
              <Link to="/auth">
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex-1 lg:ml-0">
          {/* Header */}
          <div className="bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  {title || "Bảng điều khiển"}
                </h1>
                <p className="text-muted-foreground">
                  Quản lý hệ thống xếp hàng thông minh của bạn
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="hidden sm:flex">
                  Trạng thái hệ thống: Hoạt động
                </Badge>
                <Button variant="outline" size="sm">
                  <Bell className="w-4 h-4" />
                  <Badge variant="destructive" className="ml-1 px-1 min-w-0 w-4 h-4 text-xs">
                    3
                  </Badge>
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;