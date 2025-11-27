import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin, Users } from "lucide-react";

interface VendorMapDialogProps {
  open: boolean;
  onClose: () => void;
  vendor: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    distance?: string;
    queueSize: number;
  };
}

export function VendorMapDialog({ open, onClose, vendor }: VendorMapDialogProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!open || !mapContainerRef.current) return;

    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;

    // Initialize map
    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}`,
      center: [vendor.lng, vendor.lat],
      zoom: 15,
      pitch: 0,
      bearing: 0,
    });

    // Add navigation controls
    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");

    // Add vendor marker
    const el = document.createElement("div");
    el.innerHTML = `
      <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="23" fill="#FF6B6B" stroke="white" stroke-width="3"/>
        <text x="25" y="30" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">${vendor.queueSize}</text>
      </svg>
    `;

    new maplibregl.Marker({ element: el })
      .setLngLat([vendor.lng, vendor.lat])
      .setPopup(
        new maplibregl.Popup({ offset: 30 }).setHTML(`
          <div style="padding: 8px;">
            <b style="font-size: 14px;">${vendor.name}</b>
            <p style="margin: 6px 0 0; font-size: 12px; color: #666;">
              Hàng đợi: ${vendor.queueSize} người
            </p>
          </div>
        `)
      )
      .addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [open, vendor]);

  const handleGetDirections = () => {
    // Open Google Maps with directions
    const url = `https://www.google.com/maps/dir/?api=1&destination=${vendor.lat},${vendor.lng}`;
    window.open(url, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold">{vendor.name}</div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {vendor.distance && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{vendor.distance}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{vendor.queueSize} người đang chờ</span>
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 relative">
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            style={{ minHeight: "400px" }}
          />
        </div>

        <div className="p-4 border-t flex gap-2">
          <Button
            variant="default"
            className="flex-1"
            onClick={handleGetDirections}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Chỉ đường
          </Button>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
