import { MapPin } from "lucide-react";

interface MockGoogleMapProps {
  lat: number;
  lng: number;
  queueSize: number;
  vendorName: string;
  height?: string;
}

export function MockGoogleMap({ lat, lng, queueSize, vendorName, height = "120px" }: MockGoogleMapProps) {
  // Create a simple map-like background with grid
  const mapStyle = {
    backgroundImage: `
      linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px),
      linear-gradient(to bottom, #e8f4f8, #d4ebf2)
    `,
    backgroundSize: '20px 20px, 20px 20px, 100% 100%',
    position: 'relative' as const,
    height,
    width: '100%',
    borderRadius: '8px',
    overflow: 'hidden',
  };

  return (
    <div style={mapStyle} className="relative">
      {/* Map roads/streets overlay */}
      <div className="absolute inset-0">
        <svg width="100%" height="100%" className="opacity-30">
          <path
            d="M0,30 Q50,20 100,40 T200,35"
            stroke="#666"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M20,0 Q30,50 25,100"
            stroke="#666"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M60,0 Q70,30 80,60 Q90,80 100,100"
            stroke="#666"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      </div>

      {/* Vendor location marker */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          {/* Marker pin */}
          <div className="bg-red-500 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white">
            {queueSize}
          </div>
          {/* Marker shadow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-3 h-2 bg-black/20 rounded-full blur-sm"></div>
        </div>
      </div>

      {/* Map controls (zoom) */}
      <div className="absolute top-2 right-2 bg-white rounded shadow-sm p-1">
        <div className="w-6 h-6 flex items-center justify-center text-xs text-gray-600">
          <MapPin className="w-3 h-3" />
        </div>
      </div>

      {/* Queue info overlay */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium shadow-sm">
        <span className="text-red-600 font-bold">{queueSize}</span> người đang xếp hàng
      </div>

      {/* Coordinates info (subtle) */}
      <div className="absolute bottom-1 right-1 text-[8px] text-gray-400 opacity-50">
        {lat.toFixed(3)}, {lng.toFixed(3)}
      </div>
    </div>
  );
}