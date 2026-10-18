import type { Zone } from "@/lib/mock-data";

export interface MapPoint {
  lat: number;
  lng: number;
}

export type MapEndpoint = "departure" | "destination";

// These match the fixed origins used by the current approximate distance estimates.
export const DEFAULT_ORIGIN_POINTS: Record<Zone, MapPoint> = {
  makkah: { lat: 21.422882, lng: 39.825734 },
  madinah: { lat: 24.4686804, lng: 39.611162 },
};
