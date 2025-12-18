import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Clock, MapPin, Users, Utensils, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { VendorMiniMap } from "./VendorMiniMap";
import { useState } from "react";
import { VendorMapDialog } from "@/components/VendorMapDialog";

interface VendorCardProps {
  id: string;
  name: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  eta?: string;         // cho phép optional
  queueSize: number;
  distance?: string;     // cho phép optional
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
  eta = "0",          // mặc định "0"
  queueSize,
  distance = "0", 
  act,   
  isPreOrderAvailable = false,
  cuisineType,
  priceRange = "€€",
  isPopular = false,
  lat,
  lng,
  onClick,
  className
}: VendorCardProps) {
  const etaDisplay = (eta ?? "").toString().trim() || "0";
  const distanceDisplay = (distance ?? "").toString().trim() || "";

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

        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
          <div
            className={cn(
              "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
              queueSize === 0
                ? "bg-success/90 text-success-foreground"
                : queueSize < 5
                ? "bg-warning/90 text-warning-foreground"
                : "bg-destructive/90 text-destructive-foreground"
            )}
          >
            <Users className="h-3 w-3" />
            <span>{queueSize}</span>
          </div>
          
          {distanceDisplay && distanceDisplay !== "0" && (
            <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/90 text-white">
              <MapPin className="h-3 w-3" />
              <span>{distanceDisplay}</span>
            </div>
          )}
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
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-rating-gold text-rating-gold" />
            <span className="text-sm font-medium">{Number.isFinite(rating) ? rating.toFixed(1) : "0.0"}</span>
          </div>
          <span className="text-sm text-muted-foreground">({reviewCount} đánh giá)</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
          <div className="flex items-center space-x-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{etaDisplay} phút</span>
          </div>
          <div className="flex items-center space-x-1 text-primary font-medium">
            <MapPin className="h-3 w-3" />
            <span>{distanceDisplay || "—"}</span>
          </div>
        </div>

        <div className="mb-4 rounded-lg overflow-hidden">
          <VendorMiniMap
            lat={lat}
            lng={lng}
            queueSize={queueSize}
            vendorName={name}
            height="100px"
          />
        </div>

        <div className="mt-auto flex flex-wrap space-x-2 pt-2 border-t border-border/60">
          <Button
            className="flex-1 min-w-0 truncate"
            size="sm"
            disabled={queueSize >= 20}
          >
            <Utensils className="h-4 w-4 mr-1" />
            {queueSize >= 20 ? "Hết chỗ" : "Xếp hàng"}
          </Button>

          {isPreOrderAvailable && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-0 truncate"
            >
              Đặt trước
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}