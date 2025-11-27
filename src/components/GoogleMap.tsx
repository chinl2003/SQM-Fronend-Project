import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "@/components/ui/button";
import { MapIcon, Navigation2, Layers } from "lucide-react";

interface VendorLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  queueSize: number;
}

interface UserLocation {
  lat: number;
  lng: number;
}

interface MapProps {
  vendors: VendorLocation[];
  userLocation?: UserLocation | null;
  onVendorClick?: (vendorId: string) => void;
  height?: string;
}

export function GoogleMap({
  vendors,
  userLocation,
  onVendorClick,
  height = "400px",
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [mapStyle, setMapStyle] = useState<"street" | "satellite">("street");
  const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
  // Map style URLs
  const mapStyles = {
    street: `https://api.maptiler.com/maps/hybrid/style.json?key=${maptilerKey}`,
    satellite: `https://api.maptiler.com/maps/hybrid/style.json?key=${maptilerKey}`,
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const center: [number, number] = userLocation
      ? [userLocation.lng, userLocation.lat]
      : [105.8542, 21.0285]; // Hanoi default [lng, lat]

    console.log("Initializing map with street style:", mapStyles.street);
    
    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyles.street,
      center,
      zoom: userLocation ? 15 : 13, // Zoom closer if user location available
      pitch: 0, // Flat view (no tilt)
      bearing: 0,
    });

    // Add error handler
    mapRef.current.on("error", (e) => {
      console.error("Map error:", e);
    });

    // Log when style is loaded
    mapRef.current.on("load", () => {
      console.log("Map loaded successfully");
    });

    // Add navigation controls
    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");

    // Add geolocate control
    const geolocateControl = new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
    });
    mapRef.current.addControl(geolocateControl, "top-right");

    // Add scale control
    mapRef.current.addControl(
      new maplibregl.ScaleControl({ maxWidth: 100, unit: "metric" }),
      "bottom-left"
    );

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      // Create user marker element (blue pulsing dot)
      const el = document.createElement("div");
      el.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="#4285F4" fill-opacity="0.2">
            <animate attributeName="r" from="14" to="16" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="opacity" from="0.2" to="0" dur="1.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="16" cy="16" r="8" fill="#4285F4" stroke="white" stroke-width="3"/>
        </svg>
      `;
      el.style.cursor = "pointer";

      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML("<b>Vị trí của bạn</b>")
        )
        .addTo(mapRef.current);

      // Fly to user location with smooth animation
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 15,
        pitch: 0,
        bearing: 0,
        duration: 2000,
        essential: true,
      });
    }
  }, [userLocation]);

  // Update vendor markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add vendor markers
    vendors.forEach((vendor) => {
      if (!vendor.lat || !vendor.lng) return;

      const el = document.createElement("div");
      el.innerHTML = `
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="22" cy="22" r="20" fill="#FF6B6B" stroke="white" stroke-width="3"/>
          <text x="22" y="27" text-anchor="middle" fill="white" font-family="Arial" font-size="13" font-weight="bold">${vendor.queueSize}</text>
        </svg>
      `;
      el.style.cursor = "pointer";
      el.style.transition = "transform 0.2s";
      el.onmouseenter = () => (el.style.transform = "scale(1.1)");
      el.onmouseleave = () => (el.style.transform = "scale(1)");
      el.onclick = () => onVendorClick?.(vendor.id);

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 150px;">
          <b style="font-size: 14px;">${vendor.name}</b>
          <p style="margin: 6px 0 0; font-size: 12px; color: #666;">
            Hàng đợi: ${vendor.queueSize} người
          </p>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([vendor.lng, vendor.lat])
        .setPopup(popup)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers when vendors change
    if (vendors.length > 0 && mapRef.current && userLocation) {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([userLocation.lng, userLocation.lat]);
      vendors.forEach((v) => {
        if (v.lat && v.lng) bounds.extend([v.lng, v.lat]);
      });
      mapRef.current.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        maxZoom: 16,
        duration: 1500,
      });
    }
  }, [vendors, userLocation, onVendorClick]);

  // Toggle map style
  const toggleMapStyle = () => {
    if (!mapRef.current) return;
    const newStyle = mapStyle === "street" ? "satellite" : "street";
    console.log(`Switching to ${newStyle} style:`, mapStyles[newStyle]);
    setMapStyle(newStyle);
    mapRef.current.setStyle(mapStyles[newStyle]);
  };

  // Recenter to user location
  const recenterToUser = () => {
    if (!mapRef.current || !userLocation) return;
    mapRef.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 16,
      pitch: 0,
      duration: 1500,
    });
  };

  return (
    <div className="relative rounded-lg overflow-hidden" style={{ height, width: "100%" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />

      {/* Map Controls Overlay */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
        <Button
          size="sm"
          variant="secondary"
          className="shadow-lg"
          onClick={toggleMapStyle}
          title={mapStyle === "street" ? "Chuyển sang vệ tinh" : "Chuyển sang đường phố"}
        >
          {mapStyle === "street" ? <Layers className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
        </Button>

        {userLocation && (
          <Button
            size="sm"
            variant="secondary"
            className="shadow-lg"
            onClick={recenterToUser}
            title="Về vị trí của tôi"
          >
            <Navigation2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 text-xs z-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
          <span>Vị trí của bạn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white"></div>
          <span>Nhà hàng</span>
        </div>
      </div>
    </div>
  );
}
