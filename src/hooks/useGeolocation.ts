import { useState, useEffect, useCallback } from "react";

interface GeolocationState {
  coordinates: { latitude: number; longitude: number } | null;
  error: string | null;
  loading: boolean;
  permissionStatus: "prompt" | "granted" | "denied" | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const GEOLOCATION_ERRORS: Record<number, string> = {
  1: "Bạn đã từ chối quyền truy cập vị trí. Vui lòng bật trong cài đặt trình duyệt.",
  2: "Không thể xác định vị trí của bạn. Vui lòng kiểm tra kết nối GPS.",
  3: "Hết thời gian chờ khi lấy vị trí. Vui lòng thử lại.",
};

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { enableHighAccuracy = true, timeout = 10000, maximumAge = 300000 } = options;

  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    error: null,
    loading: true,
    permissionStatus: null,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Trình duyệt của bạn không hỗ trợ định vị.",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          error: null,
          loading: false,
          permissionStatus: "granted",
        });
      },
      (error) => {
        setState({
          coordinates: null,
          error: GEOLOCATION_ERRORS[error.code] || "Lỗi không xác định khi lấy vị trí.",
          loading: false,
          permissionStatus: error.code === 1 ? "denied" : null,
        });
      },
      { enableHighAccuracy, timeout, maximumAge }
    );
  }, [enableHighAccuracy, timeout, maximumAge]);

  // Check permission and request location on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setState((prev) => ({ ...prev, permissionStatus: result.state as any }));
        if (result.state === "granted" || result.state === "prompt") {
          requestLocation();
        } else {
          setState((prev) => ({ ...prev, loading: false }));
        }
      });
    } else {
      requestLocation();
    }
  }, [requestLocation]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return { ...state, requestLocation, clearError };
}
