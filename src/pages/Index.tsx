// src/pages/Index.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { VendorCard } from "@/components/VendorCard";
import { FilterBar } from "@/components/FilterBar";
import { GoogleMap } from "@/components/GoogleMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Utensils, MapPin, Loader2, MapPinOff } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { api, ApiResponse } from "@/lib/api";
import { useGeolocation } from "@/hooks/useGeolocation";
import { calculateDistance, formatDistance } from "@/lib/geolocation";

// ---------- Types ----------
type VendorFilter = "Rating" | "Queue" | "NearestMe" | "MostSelling";

type FilterVendorRequest = {
  filter?: VendorFilter;
  nameSearch?: string;
  categoryFoodSearch?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  status?: string;
};

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
  distance?: number | null;

  businessTypeId?: string | null;
};

type BusinessType = {
  id: string;
  name?: string | null;
  icon?: string | null;
  activeVendorCount?: number | null;
};

function buildMediaUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = (import.meta.env.VITE_S3_URL || "").replace(/\/+$/, "");
  return `${base}/${String(path).replace(/^\/+/, "")}`;
}

function extractVendorsFromResponse(res: any): ApiVendor[] {
  const outer = res?.data?.data ?? res?.data ?? res;
  const list =
    (Array.isArray(outer) && outer) ||
    (Array.isArray(outer?.data) && outer.data) ||
    [];

  return (list as any[]).map((v) => ({
    id: v.id,
    name: v.name,
    address: v.address,
    latitude: v.latitude,
    longitude: v.longitude,
    logoUrl: v.logoUrl,
    averageRating: v.averageRating,
    queueCount: v.queueCount,
    allowPreorder: v.allowPreorder,
    distance: v.distance,
    businessTypeId:
      v.businessTypeId ??
      v.BusinessTypeId ??
      v.businessTypeID ??
      null,
  }));
}

function extractBusinessTypesFromResponse(res: any): BusinessType[] {
  const outer = res?.data?.data ?? res?.data ?? res;
  const list =
    (Array.isArray(outer) && outer) ||
    (Array.isArray(outer?.data) && outer.data) ||
    [];

  return (list as any[]).map((b, idx) => ({
    id: b.businessTypeId ?? b.BusinessTypeId ?? b.id ?? `bt-${idx}`,
    name: b.businessTypeName ?? b.BusinessTypeName ?? b.name ?? "Danh mục",
    icon: b.icon ?? null,
    activeVendorCount: b.count ?? b.Count ?? b.activeVendorCount ?? 0,
  }));
}

export default function Index() {
  const navigate = useNavigate();
  const location = useLocation()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<ApiVendor[]>([]);
  const [radiusKm] = useState<number>(5);

  const [categories, setCategories] = useState<BusinessType[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const {
    coordinates: userLocation,
    loading: locationLoading,
    error: locationError,
    requestLocation,
  } = useGeolocation();

  const searchParams = new URLSearchParams(location.search);
  const searchKeyword = (searchParams.get("q") || "").trim()
  useEffect(() => {
    const cid = localStorage.getItem("userId") || null;
    const currentCustomerId = cid;
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchBusinessTypes = async () => {
      try {
        setCategoriesLoading(true);
        const token = localStorage.getItem("accessToken") || "";
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const res = await api.get<ApiResponse<BusinessType[]>>(
          "/api/BusinessType/address-count",
          headers
        );

        const list = extractBusinessTypesFromResponse(res);
        if (mounted) setCategories(list);
      } catch (e) {
        console.error("Error fetching business types:", e);
        if (mounted) setCategories([]);
      } finally {
        if (mounted) setCategoriesLoading(false);
      }
    };

    fetchBusinessTypes();
    return () => {
      mounted = false;
    };
  }, []);

    useEffect(() => {
    let mounted = true;

    const fetchVendors = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken") || "";
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const params = new URLSearchParams({
          filter: "NearestMe",
          radiusKm: radiusKm.toString(),
          status: "Approved",
        });

        if (userLocation) {
          params.append("latitude", userLocation.latitude.toString());
          params.append("longitude", userLocation.longitude.toString());
        }

        if (searchKeyword) {
          params.append("nameSearch", searchKeyword);
          params.append("categoryFoodSearch", searchKeyword);
        }

        if (selectedCategory) {
          params.append("businessTypeId", selectedCategory);
        }

        const res = await api.get<ApiResponse<ApiVendor[]>>(
          `/api/Vendor?${params.toString()}`,
          headers
        );
        const list = extractVendorsFromResponse(res);
        if (mounted) setVendors(list);
      } catch (e) {
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (!locationLoading) {
      fetchVendors();
    }

  }, [userLocation, locationLoading, radiusKm, selectedCategory, searchKeyword]);

  const filteredVendors = useMemo(
    () =>
      selectedCategory
        ? vendors.filter((v) => v.businessTypeId === selectedCategory)
        : vendors,
    [vendors, selectedCategory]
  );

  const vendorLocations = useMemo(
    () =>
      filteredVendors.map((v) => ({
        id: v.id,
        name: v.name ?? "",
        lat: v.latitude ?? 0,
        lng: v.longitude ?? 0,
        queueSize: v.queueCount ?? 0,
      })),
    [filteredVendors]
  );

  const getVendorDistance = (vendor: ApiVendor): string => {
    if (vendor.distance != null) {
      return formatDistance(vendor.distance);
    }

    if (
      userLocation &&
      vendor.latitude != null &&
      vendor.longitude != null
    ) {
      const distanceKm = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        vendor.latitude,
        vendor.longitude
      );
      return formatDistance(distanceKm);
    }

    return "";
  };

  const vendorCards = useMemo(
    () =>
      filteredVendors.map((v) => ({
        id: v.id,
        name: v.name ?? "—",
        coverImage: buildMediaUrl(v.logoUrl) || heroImage,
        rating: typeof v.averageRating === "number" ? v.averageRating : 0,
        reviewCount: 0,
        eta: "",
        queueSize: v.queueCount ?? 0,
        distance: getVendorDistance(v),
        cuisineType: "",
        priceRange: "€€" as const,
        isPreOrderAvailable: !!v.allowPreorder,
        isPopular: false,
        lat: v.latitude ?? 0,
        lng: v.longitude ?? 0,
      })),
    [filteredVendors, userLocation]
  );

  const handleVendorClick = (vendorId: string) => {
    navigate(`/customer/vendors/${vendorId}`);
  };

  const handleFilterChange = () => {
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation userType="customer" queueCount={2} />

      {/* <FilterBar onFilterChange={handleFilterChange} /> */}

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
        {/* Location Status */}
        {(locationLoading || locationError) && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            {locationLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Đang xác định vị trí của bạn...
                </span>
              </>
            ) : locationError ? (
              <>
                <MapPinOff className="h-4 w-4 text-destructive" />
                <span className="text-sm text-muted-foreground">
                  {locationError}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={requestLocation}
                  className="p-0 h-auto"
                >
                  Thử lại
                </Button>
              </>
            ) : null}
          </div>
        )}

        {/* Map */}
        <section>
          <GoogleMap
            vendors={vendorLocations}
            userLocation={
              userLocation
                ? { lat: userLocation.latitude, lng: userLocation.longitude }
                : null
            }
            onVendorClick={handleVendorClick}
            height="300px"
          />
        </section>

        {/* Danh mục */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Utensils className="mr-2 h-5 w-5" />
            Duyệt theo danh mục
          </h2>

          {categoriesLoading && categories.length === 0 ? (
            <div className="grid [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))] gap-4 sm:gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={`category-skeleton-${i}`} className="animate-pulse">
                  <CardContent className="p-4 h-full flex flex-col items-center justify-center">
                    <div className="h-8 w-8 bg-muted rounded-full mb-3" />
                    <div className="h-4 w-24 bg-muted rounded mb-2" />
                    <div className="h-3 w-16 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid [grid-template-columns:repeat(auto-fill,minmax(180px,1fr))] gap-4 sm:gap-5">
              {categories.map((category) => {
                const name = category.name ?? "Danh mục";
                const icon = category.icon || "🍽️";
                const count = category.activeVendorCount ?? 0;

                return (
                  <Card
                    key={category.id}
                    className={`h-full w-full cursor-pointer transition-all hover:shadow-md ${
                      selectedCategory === category.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === category.id ? null : category.id
                      )
                    }
                  >
                    <CardContent className="p-4 text-center h-full flex flex-col items-center justify-center">
                      <div className="text-2xl mb-2">{icon}</div>
                      <div className="text-sm font-medium">{name}</div>
                      <div className="text-xs text-muted-foreground">
                        {count} địa điểm
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Chưa có danh mục nào.
            </div>
          )}
        </section>

        {/* Vendors */}
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
                  {selectedCategory
                    ? "Không có nhà hàng nào thuộc danh mục này."
                    : "Chưa có nhà hàng nào."}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="h-16 md:h-0" />
    </div>
  );
}
