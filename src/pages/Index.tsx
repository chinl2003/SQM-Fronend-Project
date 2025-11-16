import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { VendorCard } from "@/components/VendorCard";
import { FilterBar } from "@/components/FilterBar";
import { GoogleMap } from "@/components/GoogleMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Utensils, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { api, ApiResponse } from "@/lib/api";
import { VendorQuickView } from "@/components/customer/VendorQuickView";

// ---------- Types ----------
type ApiVendor = {
  id: string;
  name?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  logoUrl?: string | null;
  averageRating?: number | null;
  queueCount?: number | null;
  allowPreorder?: boolean | null;
};

// ---------- Helpers ----------
function buildMediaUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
  return `${base}/${String(path).replace(/^\/+/, "")}`;
}

function extractVendorsFromResponse(res: any): ApiVendor[] {
  const outer = res?.data ?? res;
  const list =
    (Array.isArray(outer) && outer) ||
    (Array.isArray(outer?.data) && outer.data) ||
    [];
  return list as ApiVendor[];
}

export default function Index() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<ApiVendor[]>([]);
  const [quickViewId, setQuickViewId] = useState<string | null>(null); // <-- NEW
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null);
  useEffect(() => {
    const cid = localStorage.getItem("userId") || null;
    setCurrentCustomerId(cid);
  }, []);
  const categories = [
    { name: "Ý", icon: "🍕", count: 23 },
    { name: "Châu Á", icon: "🍜", count: 18 },
    { name: "Burger", icon: "🍔", count: 15 },
    { name: "Mexico", icon: "🌮", count: 12 },
    { name: "Ấn Độ", icon: "🍛", count: 9 },
    { name: "Tráng Miệng", icon: "🍰", count: 14 },
  ];

  // --- Fetch vendors from API ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken") || "";
        const res = await api.get<ApiResponse<ApiVendor[]>>(
          "/api/vendor",
          token ? { Authorization: `Bearer ${token}` } : undefined
        );
        const list = extractVendorsFromResponse(res);
        if (mounted) setVendors(list);
      } catch (e) {
        console.error(e);
        setVendors([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const vendorLocations = useMemo(
    () =>
      vendors.map((v) => ({
        id: v.id,
        name: v.name ?? "",
        lat: v.latitude ?? 0,
        lng: v.longitude ?? 0,
        queueSize: v.queueCount ?? 0,
      })),
    [vendors]
  );

  const vendorCards = useMemo(
    () =>
      vendors.map((v) => ({
        id: v.id,
        name: v.name ?? "—",
        coverImage: buildMediaUrl(v.logoUrl) || heroImage,
        rating: typeof v.averageRating === "number" ? v.averageRating : 0,
        reviewCount: 0,
        eta: "", // dùng mặc định "0" trong VendorCard
        queueSize: v.queueCount ?? 0,
        distance: "", // dùng mặc định "0" trong VendorCard
        cuisineType: "",
        priceRange: "€€" as const,
        isPreOrderAvailable: !!v.allowPreorder,
        isPopular: false,
        lat: v.latitude ?? 0,
        lng: v.longitude ?? 0,
      })),
    [vendors]
  );

  const handleVendorClick = (vendorId: string) => {
    setQuickViewId(vendorId); // mở modal
  };

  const handleFilterChange = (filters: any) => {
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation userType="customer" queueCount={2} />

      <FilterBar onFilterChange={handleFilterChange} />

      {/* Hero Section */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={heroImage}
          alt="Quản lý xếp hàng thông minh - Bỏ qua chờ đợi, thưởng thức món ngon"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Bỏ qua chờ đợi, thưởng thức món ngon
            </h1>
            <p className="text-lg md:text-xl mb-6 opacity-90">
              Tham gia xếp hàng từ xa và nhận cập nhật thời gian thực
            </p>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary-dark text-primary-foreground"
            >
              <MapPin className="mr-2 h-5 w-5" />
              Tìm nhà hàng gần bạn
            </Button>
          </div>
        </div>
      </section>

      <div className="w-full px-4 md:px-6 py-6 space-y-8">
        {/* Map */}
        <section>
          <GoogleMap
            vendors={vendorLocations}
            onVendorClick={handleVendorClick}
            height="300px"
          />
        </section>

        {/* Categories */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Utensils className="mr-2 h-5 w-5" />
            Duyệt theo danh mục
          </h2>
          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))] gap-4 sm:gap-5">
            {categories.map((category) => (
              <Card
                key={category.name}
                className={`h-full w-full cursor-pointer transition-all hover:shadow-md ${selectedCategory === category.name ? "ring-2 ring-primary" : ""}`}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.name ? null : category.name
                  )
                }
              >
                <CardContent className="p-4 text-center h-full flex flex-col items-center justify-center">
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <div className="text-sm font-medium">{category.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {category.count} địa điểm
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Nhà hàng mới */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Nhà hàng mới
              <Badge className="ml-2" variant="secondary">
                Mới
              </Badge>
            </h2>
            <Button variant="ghost" size="sm">
              Xem tất cả
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={`skeleton-${i}`} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-40 bg-muted rounded-lg mb-3" />
                    <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
              {vendorCards.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  {...vendor}
                  onClick={() => handleVendorClick(vendor.id)}
                />
              ))}
              {!vendorCards.length && (
                <div className="col-span-full text-center text-muted-foreground py-8">
                  Chưa có nhà hàng nào.
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <VendorQuickView
        open={!!quickViewId}
        vendorId={quickViewId}
        onClose={() => setQuickViewId(null)}
        customerId={currentCustomerId}
      />

      <div className="h-16 md:h-0" />
    </div>
  );
}