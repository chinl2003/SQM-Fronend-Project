import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { VendorCard } from "@/components/VendorCard";
import { FilterBar } from "@/components/FilterBar";
import { GoogleMap } from "@/components/GoogleMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, Star, Utensils, MapPin, Repeat, Calendar, Map } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import vendor1 from "@/assets/vendor1.jpg";
import vendor2 from "@/assets/vendor2.jpg";
import vendor3 from "@/assets/vendor3.jpg";

const vendorData = [{
  id: "1",
  name: "Pizza Chính Gốc của Mario",
  coverImage: vendor1,
  rating: 4.8,
  reviewCount: 342,
  eta: "15-20 phút",
  queueSize: 3,
  distance: "0.5 km",
  cuisineType: "Ý",
  priceRange: "€€" as const,
  isPreOrderAvailable: true,
  isPopular: true,
  lat: 21.0285,
  lng: 105.8542
}, {
  id: "2",
  name: "Dragon Bowl Sushi",
  coverImage: vendor2,
  rating: 4.6,
  reviewCount: 189,
  eta: "20-25 phút",
  queueSize: 7,
  distance: "0.8 km",
  cuisineType: "Nhật",
  priceRange: "€€€" as const,
  isPreOrderAvailable: true,
  isPopular: false,
  lat: 21.0345,
  lng: 105.8612
}, {
  id: "3",
  name: "The Burger Lab",
  coverImage: vendor3,
  rating: 4.4,
  reviewCount: 256,
  eta: "10-15 phút",
  queueSize: 12,
  distance: "1.2 km",
  cuisineType: "Mỹ",
  priceRange: "€€" as const,
  isPreOrderAvailable: false,
  isPopular: true,
  lat: 21.0195,
  lng: 105.8472
}];

const vendorLocations = vendorData.map(vendor => ({
  id: vendor.id,
  name: vendor.name,
  lat: vendor.lat,
  lng: vendor.lng,
  queueSize: vendor.queueSize
}));

const categories = [{
  name: "Ý",
  icon: "🍕",
  count: 23
}, {
  name: "Châu Á",
  icon: "🍜",
  count: 18
}, {
  name: "Burger",
  icon: "🍔",
  count: 15
}, {
  name: "Mexico",
  icon: "🌮",
  count: 12
}, {
  name: "Ấn Độ",
  icon: "🍛",
  count: 9
}, {
  name: "Tráng Miệng",
  icon: "🍰",
  count: 14
}];

export default function Index() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleVendorClick = (vendorId: string) => {
    console.log("Đi tới vendor:", vendorId);
  };

  const handleFilterChange = (filters: any) => {
    console.log("Bộ lọc thay đổi:", filters);
  };

  return <div className="min-h-screen bg-background">
      <Navigation userType="customer" queueCount={2} />
      
      <FilterBar onFilterChange={handleFilterChange} />

      {/* Hero Section */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <img src={heroImage} alt="Quản lý xếp hàng thông minh - Bỏ qua chờ đợi, thưởng thức món ngon" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Bỏ qua chờ đợi, thưởng thức món ngon
            </h1>
            <p className="text-lg md:text-xl mb-6 opacity-90">
              Tham gia xếp hàng từ xa và nhận cập nhật thời gian thực
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary-dark text-primary-foreground">
              <MapPin className="mr-2 h-5 w-5" />
              Tìm nhà hàng gần bạn
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 space-y-8">
        <section>
          <GoogleMap vendors={vendorLocations} onVendorClick={handleVendorClick} height="300px" />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Utensils className="mr-2 h-5 w-5" />
            Duyệt theo danh mục
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map(category => <Card key={category.name} className={`cursor-pointer transition-all hover:shadow-md ${selectedCategory === category.name ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <div className="text-sm font-medium">{category.name}</div>
                  <div className="text-xs text-muted-foreground">{category.count} địa điểm</div>
                </CardContent>
              </Card>)}
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-all">
            <CardContent className="p-4 text-center">
              <Repeat className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-medium">Đặt lại món</div>
              <div className="text-sm text-muted-foreground">Từ món yêu thích</div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-all">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-medium">Xu hướng hôm nay</div>
              <div className="text-sm text-muted-foreground">Đang hot</div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-all">
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-medium">Đặt trước tối nay</div>
              <div className="text-sm text-muted-foreground">Bỏ qua giờ cao điểm bữa tối</div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-all">
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-medium">Đánh giá cao</div>
              <div className="text-sm text-muted-foreground">Nhận xét tốt nhất</div>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Star className="mr-2 h-5 w-5" />
              Gợi ý cho bạn
            </h2>
            <Button variant="ghost" size="sm">Xem tất cả</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendorData.map(vendor => <VendorCard key={vendor.id} {...vendor} onClick={() => handleVendorClick(vendor.id)} />)}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Xu hướng hôm nay
              <Badge className="ml-2 bg-warning text-warning-foreground">Hot</Badge>
            </h2>
            <Button variant="ghost" size="sm">Xem tất cả</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendorData.slice().reverse().map(vendor => <VendorCard key={`hot-${vendor.id}`} {...vendor} onClick={() => handleVendorClick(vendor.id)} />)}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Thời gian chờ ngắn nhất
            </h2>
            <Button variant="ghost" size="sm">Xem tất cả</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendorData.slice().sort((a, b) => a.queueSize - b.queueSize).map(vendor => <VendorCard key={`fast-${vendor.id}`} {...vendor} onClick={() => handleVendorClick(vendor.id)} />)}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Đặt trước tối nay
            </h2>
            <Button variant="ghost" size="sm">Xem tất cả</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendorData.filter(vendor => vendor.isPreOrderAvailable).map(vendor => <VendorCard key={`preorder-${vendor.id}`} {...vendor} onClick={() => handleVendorClick(vendor.id)} />)}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Nhà hàng mới
              <Badge className="ml-2" variant="secondary">Mới</Badge>
            </h2>
            <Button variant="ghost" size="sm">Xem tất cả</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendorData.map(vendor => <VendorCard key={`new-${vendor.id}`} {...vendor} onClick={() => handleVendorClick(vendor.id)} />)}
          </div>
        </section>
      </div>

      <div className="h-16 md:h-0"></div>
    </div>;
}