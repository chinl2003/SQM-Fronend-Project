import { useState, useEffect } from "react";
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
  MessageCircle,
  LogOut,
  Home
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDialog } from "./NotificationDialog";
import { ProfileDialog } from "./ProfileDialog";

interface NavigationProps {
  userType?: "customer" | "guest" | "vendor" | "admin";
  queueCount?: number;
}

export function Navigation({ userType = "guest", queueCount = 0 }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [fullName, setFullName] = useState<string | null>(localStorage.getItem("fullName"));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem("userId"));
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = () => {
      setFullName(localStorage.getItem("fullName"));
      setUserId(localStorage.getItem("userId"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setFullName(null);
    navigate("/auth"); 
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
            <span className="text-xl font-bold text-foreground">Smart Queue</span>
          </Link>

          {/* Search */}
          {(userType === 'customer' || userType === 'guest') && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm nhà hàng, món ăn..."
                  className="pl-10 bg-muted/50 border-0 focus:bg-card"
                />
                <Button type="submit" size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8">
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
                <Link to="/order-history">
                  <Button variant="ghost" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/active-queue">
                  <Button variant="ghost" size="sm" className="relative">
                    <ShoppingBag className="h-4 w-4" />
                    {queueCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {queueCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </>
            )}

            <Button 
              variant="ghost" 
              size="sm" 
              className="relative"
              onClick={() => setIsNotificationOpen(true)}
            >
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                2
              </Badge>
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  {fullName ? (
                    <span className="text-sm font-medium">Xin chào, {fullName}</span>
                  ) : (
                    <span className="text-sm font-medium">Bạn chưa đăng nhập</span>
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
                    <Link to="/order-history" className="flex items-center w-full">
                      <Clock className="h-4 w-4 mr-2" />
                      Đơn hàng của tôi
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/support" className="flex items-center w-full">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Hỗ trợ
                    </Link>
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
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t space-y-4">
            {(userType === 'customer' || userType === 'guest') && (
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
            
            {(userType === 'customer' || userType === 'guest') && (
              <div className="flex flex-col space-y-2">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Home className="h-4 w-4 mr-2" />
                    Trang chủ
                  </Button>
                </Link>
                <Link to="/active-queue" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Clock className="h-4 w-4 mr-2" />
                    Xếp hàng hiện tại
                  </Button>
                </Link>
                <Link to="/order-history" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Heart className="h-4 w-4 mr-2" />
                    Lịch sử đơn hàng
                  </Button>
                </Link>
                <Link to="/support" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Hỗ trợ
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <NotificationDialog
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      <ProfileDialog
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userId={userId!} 
      />
    </nav>
  );
}