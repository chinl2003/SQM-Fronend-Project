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

// Mock data
const vendorData = [{
  id: "1",
  name: "Mario's Authentic Pizza",
  coverImage: vendor1,
  rating: 4.8,
  reviewCount: 342,
  eta: "15-20 min",
  queueSize: 3,
  distance: "0.5 km",
  cuisineType: "Italian",
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
  eta: "20-25 min",
  queueSize: 7,
  distance: "0.8 km",
  cuisineType: "Japanese",
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
  eta: "10-15 min",
  queueSize: 12,
  distance: "1.2 km",
  cuisineType: "American",
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
  name: "Italian",
  icon: "🍕",
  count: 23
}, {
  name: "Asian",
  icon: "🍜",
  count: 18
}, {
  name: "Burgers",
  icon: "🍔",
  count: 15
}, {
  name: "Mexican",
  icon: "🌮",
  count: 12
}, {
  name: "Indian",
  icon: "🍛",
  count: 9
}, {
  name: "Desserts",
  icon: "🍰",
  count: 14
}];
export default function Index() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const handleVendorClick = (vendorId: string) => {
    console.log("Navigate to vendor:", vendorId);
    // Navigation logic will be added later
  };
  const handleFilterChange = (filters: any) => {
    console.log("Filters changed:", filters);
    // Filter logic will be added later  
  };
  return <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation userType="customer" queueCount={2} />
      
      {/* Filter Bar */}
      <FilterBar onFilterChange={handleFilterChange} />

      {/* Hero Section */}
      <section className="relative h-64 md:h-80 overflow-hidden">
        <img src={heroImage} alt="Smart Queue Management - Skip the wait, enjoy your food" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Skip the Wait, Enjoy Your Food
            </h1>
            <p className="text-lg md:text-xl mb-6 opacity-90">
              Join queues remotely and get real-time updates
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary-dark text-primary-foreground">
              <MapPin className="mr-2 h-5 w-5" />
              Find Restaurants Near You
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Google Map Section */}
        <section>
          
          <GoogleMap vendors={vendorLocations} onVendorClick={handleVendorClick} height="300px" />
        </section>

        {/* Quick Categories */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Utensils className="mr-2 h-5 w-5" />
            Browse by Category
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map(category => <Card key={category.name} className={`cursor-pointer transition-all hover:shadow-md ${selectedCategory === category.name ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <div className="text-sm font-medium">{category.name}</div>
                  <div className="text-xs text-muted-foreground">{category.count} places</div>
                </CardContent>
              </Card>)}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-all">
            <CardContent className="p-4 text-center">
              <Repeat className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-medium">Re-order</div>
              <div className="text-sm text-muted-foreground">From favorites</div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-all">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-medium">Hot Today</div>
              <div className="text-sm text-muted-foreground">Trending now</div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-all">
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-medium">Pre-order Tonight</div>
              <div className="text-sm text-muted-foreground">Skip dinner rush</div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-md transition-all">
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-medium">Top Rated</div>
              <div className="text-sm text-muted-foreground">Best reviews</div>
            </CardContent>
          </Card>
        </section>

        {/* Recommended for You */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Star className="mr-2 h-5 w-5" />
              Recommended for You
            </h2>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendorData.map(vendor => <VendorCard key={vendor.id} {...vendor} onClick={() => handleVendorClick(vendor.id)} />)}
          </div>
        </section>

        {/* Hot Today */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Hot Today
              <Badge className="ml-2 bg-warning text-warning-foreground">Trending</Badge>
            </h2>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendorData.slice().reverse().map(vendor => <VendorCard key={`hot-${vendor.id}`} {...vendor} onClick={() => handleVendorClick(vendor.id)} />)}
          </div>
        </section>

        {/* Shortest Wait Times */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Shortest Wait Times
            </h2>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendorData.slice().sort((a, b) => a.queueSize - b.queueSize).map(vendor => <VendorCard key={`fast-${vendor.id}`} {...vendor} onClick={() => handleVendorClick(vendor.id)} />)}
          </div>
        </section>

        {/* Pre-order Tonight */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Pre-order for Tonight
            </h2>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendorData.filter(vendor => vendor.isPreOrderAvailable).map(vendor => <VendorCard key={`preorder-${vendor.id}`} {...vendor} onClick={() => handleVendorClick(vendor.id)} />)}
          </div>
        </section>

        {/* New Vendors */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              New Vendors
              <Badge className="ml-2" variant="secondary">Fresh</Badge>
            </h2>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendorData.map(vendor => <VendorCard key={`new-${vendor.id}`} {...vendor} onClick={() => handleVendorClick(vendor.id)} />)}
          </div>
        </section>
      </div>

      {/* Bottom Navigation Placeholder */}
      <div className="h-16 md:h-0"></div>
    </div>;
}