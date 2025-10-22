import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Clock, MapPin, Users, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { MockGoogleMap } from "./MockGoogleMap";

interface VendorCardProps {
  id: string;
  name: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  eta: string;
  queueSize: number;
  distance: string;
  isPreOrderAvailable?: boolean;
  cuisineType?: string;
  priceRange?: "€" | "€€" | "€€€";
  isPopular?: boolean;
  lat: number;
  lng: number;
  onClick?: () => void;
  className?: string;
}

export function VendorCard({
  id,
  name,
  coverImage,
  rating,
  reviewCount,
  eta,
  queueSize,
  distance,
  isPreOrderAvailable = false,
  cuisineType,
  priceRange = "€€",
  isPopular = false,
  lat,
  lng,
  onClick,
  className
}: VendorCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-card border-border overflow-hidden",
        className
      )}
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={coverImage}
          alt={name}
          className="w-full h-full object-cover"
        />
        
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          {isPopular && (
            <Badge className="bg-warning text-warning-foreground">
              🔥 Phổ biến
            </Badge>
          )}
          {isPreOrderAvailable && (
            <Badge variant="secondary" className="bg-primary/90 text-primary-foreground">
              Đặt trước
            </Badge>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <div className={cn(
            "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
            queueSize === 0 ? "bg-success/90 text-success-foreground" :
            queueSize < 5 ? "bg-warning/90 text-warning-foreground" :
            "bg-destructive/90 text-destructive-foreground"
          )}>
            <Users className="h-3 w-3" />
            <span>{queueSize}</span>
          </div>
        </div>
      </div>

      <CardContent className="p-4">

        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-card-foreground truncate">{name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              {cuisineType && (
                <span className="text-sm text-muted-foreground">{cuisineType}</span>
              )}
              <span className="text-sm text-muted-foreground">{priceRange}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-rating-gold text-rating-gold" />
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
          </div>
          <span className="text-sm text-muted-foreground">({reviewCount} đánh giá)</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
          <div className="flex items-center space-x-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{eta}</span>
          </div>
          <div className="flex items-center space-x-1 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{distance}</span>
          </div>
        </div>

        <div className="mb-4 rounded-lg overflow-hidden">
          <MockGoogleMap
            lat={lat}
            lng={lng}
            queueSize={queueSize}
            vendorName={name}
            height="100px"
          />
        </div>

        <div className="flex space-x-2">
          <Button 
            className="flex-1" 
            size="sm"
            disabled={queueSize >= 20}
          >
            <Utensils className="h-4 w-4 mr-1" />
            {queueSize >= 20 ? 'Hết chỗ' : 'Tham gia xếp hàng'}
          </Button>
          
          {isPreOrderAvailable && (
            <Button variant="outline" size="sm" className="flex-1">
              Đặt trước
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
