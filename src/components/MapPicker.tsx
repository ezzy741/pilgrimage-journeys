import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { DEFAULT_ORIGIN_POINTS, type MapEndpoint, type MapPoint } from "@/lib/map-locations";
import type { Zone } from "@/lib/mock-data";

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

interface MapPickerProps {
  zone: Zone;
  departure: MapPoint | null;
  destination: MapPoint | null;
  activeField: MapEndpoint;
  onActiveFieldChange: (field: MapEndpoint) => void;
  onPick: (field: MapEndpoint, point: MapPoint) => void;
  onReset: (field: MapEndpoint) => void;
}

export function MapPicker({
  zone,
  departure,
  destination,
  activeField,
  onActiveFieldChange,
  onPick,
  onReset,
}: MapPickerProps) {
  const { t, dir } = useI18n();
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const libraryRef = useRef<typeof import("maplibre-gl") | null>(null);
  const departureMarkerRef = useRef<MapLibreMarker | null>(null);
  const destinationMarkerRef = useRef<MapLibreMarker | null>(null);
  const activeFieldRef = useRef(activeField);
  const onPickRef = useRef(onPick);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<"unavailable" | "unsupported" | null>(null);

  activeFieldRef.current = activeField;
  onPickRef.current = onPick;

  useEffect(() => {
    const container = mapHostRef.current;
    if (!container) return;

    let disposed = false;
    let styleLoaded = false;
    let instance: MapLibreMap | null = null;
    setMapReady(false);
    setMapError(null);

    void import("maplibre-gl")
      .then((maplibre) => {
        if (disposed || !mapHostRef.current) return;

        maplibre.setWorkerUrl(workerUrl);
        libraryRef.current = maplibre;
        const center = DEFAULT_ORIGIN_POINTS[zone];
        instance = new maplibre.Map({
          container: mapHostRef.current,
          style: OPENFREEMAP_STYLE,
          maxBounds: [
            [34, 16],
            [56, 33],
          ],
          center: [center.lng, center.lat],
          zoom: zone === "makkah" ? 13 : 12.5,
          attributionControl: { compact: false },
        });
        mapRef.current = instance;
        instance.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");

        instance.on("click", (event) => {
          onPickRef.current(activeFieldRef.current, {
            lat: Number(event.lngLat.lat.toFixed(6)),
            lng: Number(event.lngLat.lng.toFixed(6)),
          });
        });
        instance.on("error", () => {
          if (!styleLoaded && !disposed) setMapError("unavailable");
        });
        instance.once("load", () => {
          styleLoaded = true;
          if (!disposed) {
            setMapReady(true);
            setMapError(null);
          }
        });
      })
      .catch((error: unknown) => {
        if (!disposed)
          setMapError(
            error instanceof Error && /WebGL/i.test(error.message) ? "unsupported" : "unavailable",
          );
      });

    return () => {
      disposed = true;
      departureMarkerRef.current?.remove();
      destinationMarkerRef.current?.remove();
      departureMarkerRef.current = null;
      destinationMarkerRef.current = null;
      instance?.remove();
      mapRef.current = null;
      libraryRef.current = null;
    };
  }, [zone]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibre = libraryRef.current;
    if (!mapReady || !map || !maplibre) return;

    departureMarkerRef.current?.remove();
    destinationMarkerRef.current?.remove();

    if (departure) {
      departureMarkerRef.current = new maplibre.Marker({ color: "var(--primary)" })
        .setLngLat([departure.lng, departure.lat])
        .addTo(map);
      departureMarkerRef.current.getElement().setAttribute("aria-label", "Departure pin");
    }

    if (destination) {
      destinationMarkerRef.current = new maplibre.Marker({ color: "var(--destructive)" })
        .setLngLat([destination.lng, destination.lat])
        .addTo(map);
      destinationMarkerRef.current.getElement().setAttribute("aria-label", "Destination pin");
    }
  }, [mapReady, departure, destination]);

  const pointSummary = (label: string, field: MapEndpoint, point: MapPoint | null) => (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-background/70 p-2">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {point ? (
          <p className="truncate font-mono text-xs" dir="ltr">
            {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{t("map_not_selected")}</p>
        )}
      </div>
      {point && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onReset(field)}>
          {t("map_reset_pin")}
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-3" dir={dir}>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("map_choose_point_type")}>
        <Button
          type="button"
          size="sm"
          variant={activeField === "departure" ? "default" : "outline"}
          aria-pressed={activeField === "departure"}
          onClick={() => onActiveFieldChange("departure")}
        >
          {t("map_pick_departure")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={activeField === "destination" ? "default" : "outline"}
          aria-pressed={activeField === "destination"}
          onClick={() => onActiveFieldChange("destination")}
        >
          {t("map_pick_destination")}
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{t("map_click_instruction")}</p>

      <div className="grid gap-2 sm:grid-cols-2">
        {pointSummary(t("map_departure_label"), "departure", departure)}
        {pointSummary(t("map_destination_label"), "destination", destination)}
      </div>

      <div className="relative h-[320px] w-full overflow-hidden rounded-lg border border-border bg-muted">
        <div ref={mapHostRef} className="absolute inset-0" aria-label={t("map_picker_title")} />
        {!mapReady && !mapError && (
          <div className="pointer-events-none absolute inset-x-3 top-3 z-10 rounded-md bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow">
            {t("map_loading")}
          </div>
        )}
        {mapError && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 p-6 text-center text-sm text-muted-foreground"
            role="alert"
          >
            {t(mapError === "unsupported" ? "map_webgl_error" : "map_load_error")}
          </div>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        <a
          href="https://openfreemap.org/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          OpenFreeMap
        </a>{" "}
        · ©{" "}
        <a
          href="https://openmaptiles.org/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          OpenMapTiles
        </a>{" "}
        · Data ©{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          OpenStreetMap contributors
        </a>
      </p>
    </div>
  );
}
