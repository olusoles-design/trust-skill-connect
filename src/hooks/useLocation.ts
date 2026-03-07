import { useState, useEffect, useCallback } from "react";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface LocationState {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
  permissionState: PermissionState | "unknown";
}

/** Haversine formula — returns distance in km */
export function distanceKm(a: GeoPosition, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

export function useLocation(autoRequest = false) {
  const [state, setState] = useState<LocationState>({
    position: null,
    error: null,
    loading: false,
    permissionState: "unknown",
  });

  // Check existing permission state on mount
  useEffect(() => {
    if (!navigator.permissions) return;
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      setState((s) => ({ ...s, permissionState: result.state }));
      result.addEventListener("change", () => {
        setState((s) => ({ ...s, permissionState: result.state }));
      });
    });
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({
        ...s,
        error: "Geolocation is not supported by your browser",
        loading: false,
      }));
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          position: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
          error: null,
          loading: false,
          permissionState: "granted",
        });
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "Location access denied. Enable location in your browser settings.",
          2: "Location unavailable. Please try again.",
          3: "Location request timed out.",
        };
        setState((s) => ({
          ...s,
          error: messages[err.code] ?? "Unknown location error",
          loading: false,
          permissionState: "denied",
        }));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Auto-request if enabled and permission already granted
  useEffect(() => {
    if (autoRequest && state.permissionState === "granted") {
      requestLocation();
    }
  }, [autoRequest, state.permissionState, requestLocation]);

  return { ...state, requestLocation };
}
