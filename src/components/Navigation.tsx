import { useState, useEffect } from "react";
import {
  HubConnectionBuilder,
  LogLevel,
  HubConnection,
  HttpTransportType,
} from "@microsoft/signalr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  MapPin,
  Bell,
  User,
  Menu,
  X,
  Clock,
  ShoppingBag,
  Heart,
  Store,
  LogOut,
  Home,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDialog } from "./NotificationDialog";
import { ProfileDialog } from "./ProfileDialog";
import { NoStoreDialog } from "./customer/NoStoreDialog";
import { VendorRegisterDialog } from "./customer/VendorRegisterDialog";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
interface NavigationProps {
  userType?: "customer" | "guest" | "vendor" | "admin";
  queueCount?: number;
}

type NotificationKind = "info" | "warning";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationKind;
  time: string;
  read: boolean;
}

type NotificationApiItem = {
  id: number;
  title: string;
  body?: string;
  message?: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
};

export function Navigation({
  userType = "guest",
  queueCount = 0,
}: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [fullName, setFullName] = useState<string | null>(
    localStorage.getItem("fullName")
  );
  const [userId, setUserId] = useState<string | null>(
    localStorage.getItem("userId")
  );
  const [roles, setRoles] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("roles");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [isNoStoreModalOpen, setIsNoStoreModalOpen] = useState(false);
  const [isVendorRegisterOpen, setIsVendorRegisterOpen] = useState(false);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [vendorConfirm, setVendorConfirm] = useState<{ open: boolean; orderId?: string }>({ open: false });

  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = () => {
      setFullName(localStorage.getItem("fullName"));
      setUserId(localStorage.getItem("userId"));
      try {
        const raw = localStorage.getItem("roles");
        setRoles(raw ? (JSON.parse(raw) as string[]) : []);
      } catch {
        setRoles([]);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const apiBaseUrl = import.meta.env.VITE_API_URL;
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      "";

    const newConnection = new HubConnectionBuilder()
      .withUrl(`${apiBaseUrl}/hubs/notifications`, {
        accessTokenFactory: () => token,
        transport: HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build();

    newConnection.on("ReceiveNotification", (msg) => {
      const now = new Date();
      console.log(msg)
      const n: AppNotification = {
        id: crypto.randomUUID(),
        title: msg.title ?? "Thông báo",
        message: msg.body ?? "",
        type: msg.type === "warning" ? "warning" : "info",
        time: now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        read: false,
      };

      setNotifications((prev) => [n, ...prev]);
      const kind = n.type === "warning" ? "warning" : "info";
      if (kind === "warning") {
        toast.warning(n.title, { description: n.message });
      } else {
        toast.info(n.title, { description: n.message });
      }

      const notifType = (msg?.type ?? "").toString();
      if (notifType === "vendor_confirm") {
        const rawData = (msg as Record<string, unknown>).data as unknown;
        let orderId: string | undefined;
        if (rawData && typeof rawData === "object") {
          orderId = (rawData as { orderId?: string }).orderId;
        }
        if (orderId) setVendorConfirm({ open: true, orderId });
      }
    });

    newConnection.start().catch(() => {});

    setConnection(newConnection);

    return () => {
      newConnection.stop();
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const token =
          localStorage.getItem("accessToken") ||
          localStorage.getItem("token") ||
          "";

        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await api.get<NotificationApiItem[]>(
          "/api/Notification",
          headers
        );
        if (cancelled || !res) return;

        const mapped: AppNotification[] = res.data.map((n) => ({
          id: String(n.id),
          title: n.title,
          message: n.body ?? n.message ?? "",
          type: n.type === "warning" ? "warning" : "info",
          time: new Date(n.createdAt).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          read: n.isRead,
        }));

        setNotifications(mapped);
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    navigate({
      pathname: "/",
      search: `?q=${encodeURIComponent(query)}`,
    });

    setSearchQuery("");
  };


  const handleOpenStore = (e: React.MouseEvent) => {
    e.preventDefault();
    if (roles.length === 1 && roles[0] === "Customer") {
      setIsNoStoreModalOpen(true);
      return;
    }
    navigate("/vendor");
  };

  const handleLogout = () => {
    localStorage.clear();
    setFullName(null);
    navigate("/auth");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpenNotification = () => {
    setIsNotificationOpen(true);
  };

  const markAllNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        "";

      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      await api.put<void>("/api/Notification/mark-all-read", {}, headers);
    } catch {}
  };

  return (
    <nav className="bg-card shadow-md sticky top-0 z-50 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Smart Queue
            </span>
          </Link>

          {/* Search */}
          {(userType === "customer" || userType === "guest") && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm nhà hàng, món ăn..."
                  className="pl-10 bg-muted/50 border-0 focus:bg-card"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8"
                >
                  Tìm
                </Button>
              </form>
            </div>
          )}

          {/* Location */}
          <div className="hidden md:flex items-center space-x-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">Vị trí hiện tại</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {(userType === "customer" || userType === "guest") && (
              <>
                {/* <Link to="/order-history">
                  <Button variant="ghost" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                </Link> */}
                {/* <Link to="/customer/active-queue">
                  <Button variant="ghost" size="sm" className="relative">
                    <ShoppingBag className="h-4 w-4" />
                    {queueCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {queueCount}
                      </Badge>
                    )}
                  </Button>
                </Link> */}
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              className={`relative ${
                unreadCount > 0 ? "text-amber-500 animate-pulse" : ""
              }`}
              onClick={handleOpenNotification}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <User className="h-4 w-4" />
                  {fullName ? (
                    <span className="text-sm font-medium">
                      Xin chào, {fullName}
                    </span>
                  ) : (
                    <span className="text-sm font-medium">
                      Bạn chưa đăng nhập
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>

              {fullName ? (
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!userId) {
                          toast.error("Người dùng chưa đăng nhập!");
                          return;
                        }
                        setIsProfileOpen(true);
                      }}
                      className="flex items-center w-full"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Hồ sơ của bạn
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/customer/wallet" className="flex items-center w-full">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Ví của bạn
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link
                      to="/customer/active-queue"
                      className="flex items-center w-full"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Hàng đợi của bạn
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <button
                      type="button"
                      onClick={handleOpenStore}
                      className="flex items-center w-full"
                    >
                      <Store className="h-4 w-4 mr-2" />
                      Cửa hàng của bạn
                    </button>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive flex items-center"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              ) : (
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/auth")}>
                    Đăng nhập
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/auth")}>
                    Đăng ký
                  </DropdownMenuItem>
                </DropdownMenuContent>
              )}
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t space-y-4">
            {(userType === "customer" || userType === "guest") && (
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm nhà hàng, món ăn..."
                  className="pl-10 bg-muted/50 border-0"
                />
              </form>
            )}
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">Cập nhật vị trí</span>
            </div>

            {(userType === "customer" || userType === "guest") && (
              <div className="flex flex-col space-y-2">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Home className="h-4 w-4 mr-2" />
                    Trang chủ
                  </Button>
                </Link>
                <Link
                  to="/active-queue"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start">
                    <Clock className="h-4 w-4 mr-2" />
                    Xếp hàng hiện tại
                  </Button>
                </Link>
                <Link
                  to="/order-history"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="ghost" className="w-full justify-start">
                    <Heart className="h-4 w-4 mr-2" />
                    Lịch sử đơn hàng
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <NotificationDialog
        isOpen={isNotificationOpen}
        onClose={() => {
          setIsNotificationOpen(false);
        }}
        notifications={notifications}
        onMarkAllRead={markAllNotificationsRead}
      />

      <ProfileDialog
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userId={userId!}
      />

      <NoStoreDialog
        isOpen={isNoStoreModalOpen}
        onClose={() => setIsNoStoreModalOpen(false)}
        onRegisterClick={() => {
          setIsNoStoreModalOpen(false);
          setIsVendorRegisterOpen(true);
        }}
      />

      <VendorRegisterDialog
        isOpen={isVendorRegisterOpen}
        onClose={() => setIsVendorRegisterOpen(false)}
      />

      <Dialog open={vendorConfirm.open} onOpenChange={(v) => setVendorConfirm((p) => ({ ...p, open: v }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận tiến độ món ăn</DialogTitle>
            <DialogDescription>
              Bạn có kịp đúng ETA cho đơn hàng này không?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const token = localStorage.getItem("accessToken") || "";
                  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
                  if (vendorConfirm.orderId) {
                    await api.post<void>(`/api/order/${vendorConfirm.orderId}/vendor-confirm`, { onTime: false }, headers);
                  }
                  toast.info("Đã xác nhận: Trễ ETA");
                } catch {}
                setVendorConfirm({ open: false, orderId: undefined });
              }}
            >
              Không kịp
            </Button>
            <Button
              onClick={async () => {
                try {
                  const token = localStorage.getItem("accessToken") || "";
                  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
                  if (vendorConfirm.orderId) {
                    await api.post<void>(`/api/order/${vendorConfirm.orderId}/vendor-confirm`, { onTime: true }, headers);
                  }
                  toast.success("Đã xác nhận: Đúng ETA");
                } catch {}
                setVendorConfirm({ open: false, orderId: undefined });
              }}
            >
              Kịp ETA
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
