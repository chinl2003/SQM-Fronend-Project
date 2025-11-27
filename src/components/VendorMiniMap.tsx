import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface VendorMiniMapProps {
  lat: number;
  lng: number;
  queueSize: number;
  vendorName: string;
  height?: string;
}

export function VendorMiniMap({
  lat,
  lng,
  queueSize,
  vendorName,
  height = "100px",
}: VendorMiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !lat || !lng) return;

    const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;

    // Initialize map
    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://api.maptiler.com/maps/hybrid/style.json?key=${maptilerKey}`,
      center: [lng, lat],
      zoom: 14,
      interactive: false, // Disable interactions for mini map
      attributionControl: false,
    });

    // Add vendor marker
    const el = document.createElement("div");
    el.innerHTML = ` 
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="15" r="13" fill="#FF6B6B" stroke="white" stroke-width="2"/>
        <text x="15" y="19" text-anchor="middle" fill="white" font-family="Arial" font-size="10" font-weight="bold">${queueSize}</text>
      </svg>
    `;

    new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, queueSize, vendorName]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: "100%" }}
      className="rounded-lg"
    />
  );
}
