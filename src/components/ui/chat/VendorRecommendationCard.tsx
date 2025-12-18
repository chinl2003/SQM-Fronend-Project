import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Users, ExternalLink } from "lucide-react";
import { VendorRecommendation } from "@/types/chat";
import { useNavigate } from "react-router-dom";

interface VendorRecommendationCardProps {
    recommendation: VendorRecommendation;
}

export function VendorRecommendationCard({
    recommendation,
}: VendorRecommendationCardProps) {
    const navigate = useNavigate();

    const handleViewDetails = () => {
        navigate(`/customer/vendors/${recommendation.vendorId}`);
    };

    return (
        <Card className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-primary">
            <div className="flex items-start gap-3">
                {/* Logo */}
                {recommendation.logoUrl ? (
                    <img
                        src={`${import.meta.env.VITE_S3_URL || ""}/${recommendation.logoUrl}`}
                        alt={recommendation.vendorName}
                        className="w-16 h-16 rounded-lg object-cover"
                    />
                ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm truncate">
                            {recommendation.vendorName}
                        </h4>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                            {(recommendation.score * 100).toFixed(0)}% match
                        </Badge>
                    </div>

                    {/* Rating & Stats */}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{recommendation.averageRating?.toFixed(1) || "N/A"}</span>
                        </div>

                        {recommendation.queueCount !== undefined && recommendation.queueCount !== null && (
                            <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{recommendation.queueCount} người</span>
                            </div>
                        )}

                        {recommendation.distance !== undefined && recommendation.distance !== null && (
                            <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{recommendation.distance.toFixed(1)}km</span>
                            </div>
                        )}
                    </div>

                    {/* AI Reason */}
                    <p className="text-sm mt-2 text-foreground/80">
                        {recommendation.recommendationReason}
                    </p>

                    {/* View Details Button */}
                    <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 w-full"
                        onClick={handleViewDetails}
                    >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Xem chi tiết
                    </Button>
                </div>
            </div>
        </Card>
    );
}
