import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

/// <reference types="google.maps" />

interface VendorLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  queueSize: number;
}
interface GoogleMapProps {
  vendors: VendorLocation[];
  onVendorClick?: (vendorId: string) => void;
  height?: string;
}
export function GoogleMap({
  vendors,
  onVendorClick,
  height = "400px"
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const initializeMap = async (apiKey: string) => {
    if (!mapRef.current || !apiKey) return;
    try {
      const loader = new Loader({
        apiKey: apiKey,
        version: "weekly",
        libraries: ["places"]
      });
      await loader.load();
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: {
          lat: 21.0285,
          lng: 105.8542
        },
        // Hanoi center
        zoom: 13,
        styles: [{
          featureType: "poi",
          elementType: "labels",
          stylers: [{
            visibility: "off"
          }]
        }]
      });
      setMap(mapInstance);

      // Add markers for vendors
      vendors.forEach(vendor => {
        const marker = new google.maps.Marker({
          position: {
            lat: vendor.lat,
            lng: vendor.lng
          },
          map: mapInstance,
          title: vendor.name,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#FF6B6B" stroke="white" stroke-width="2"/>
                <text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">${vendor.queueSize}</text>
              </svg>
            `)}`,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
          }
        });
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 150px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${vendor.name}</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">
                Hàng đợi: ${vendor.queueSize} người
              </p>
              <button onclick="window.selectVendor('${vendor.id}')" 
                style="margin-top: 8px; padding: 4px 8px; background: #FF6B6B; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                Xem chi tiết
              </button>
            </div>
          `
        });
        marker.addListener("click", () => {
          infoWindow.open(mapInstance, marker);
        });
      });

      // Global function for info window button
      (window as any).selectVendor = (vendorId: string) => {
        onVendorClick?.(vendorId);
      };
    } catch (error) {
      console.error("Error loading Google Maps:", error);
      alert("Không thể tải Google Maps. Vui lòng kiểm tra API key.");
    }
  };
  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      setShowApiKeyInput(false);
      initializeMap(apiKey);
    }
  };
  if (showApiKeyInput) {
    return;
  }
  return <div className="relative">
      <div ref={mapRef} style={{
      height,
      width: "100%"
    }} className="rounded-lg" />
    </div>;
}