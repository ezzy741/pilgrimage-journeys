import type { MapPoint } from "./map-locations";
import type { Zone } from "./mock-data";

export const MAP_DRAFT_KEY = "visit-hijaz-map-draft-v1";
export interface MapDraft {
  zone: Zone;
  departure: MapPoint | null;
  destination: MapPoint | null;
}
function point(value: unknown): value is MapPoint | null {
  if (value === null) return true;
  if (typeof value !== "object" || !value || !("lat" in value) || !("lng" in value)) return false;
  return (
    typeof value.lat === "number" &&
    Number.isFinite(value.lat) &&
    value.lat >= 16 &&
    value.lat <= 33 &&
    typeof value.lng === "number" &&
    Number.isFinite(value.lng) &&
    value.lng >= 34 &&
    value.lng <= 56
  );
}
export function readMapDraft(zone: Zone): MapDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw: unknown = JSON.parse(window.sessionStorage.getItem(MAP_DRAFT_KEY) ?? "null");
    if (
      typeof raw !== "object" ||
      !raw ||
      !("zone" in raw) ||
      raw.zone !== zone ||
      !("departure" in raw) ||
      !("destination" in raw) ||
      !point(raw.departure) ||
      !point(raw.destination)
    )
      return null;
    return { zone, departure: raw.departure, destination: raw.destination };
  } catch {
    return null;
  }
}
export function writeMapDraft(draft: MapDraft): void {
  if (typeof window === "undefined" || !point(draft.departure) || !point(draft.destination)) return;
  try {
    window.sessionStorage.setItem(MAP_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* Private browsing can disable storage. */
  }
}
export function clearMapDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(MAP_DRAFT_KEY);
  } catch {
    /* Storage is optional. */
  }
}
