import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MapPicker } from "@/components/MapPicker";
import { useI18n } from "@/lib/i18n";
import { DEFAULT_ORIGIN_POINTS, type MapEndpoint, type MapPoint } from "@/lib/map-locations";
import type { BookingReceipt } from "@/lib/booking-types";
import { readMapDraft, clearMapDraft } from "@/lib/map-draft";
import {
  calcFare,
  fareConfigs,
  promotions,
  stops,
  vehicles,
  type VehicleType,
  type Zone,
} from "@/lib/mock-data";

export function ZiyaratBooking({ zone }: { zone: Zone }) {
  const { t, lang } = useI18n();
  const zoneStops = stops[zone];
  const config = fareConfigs.find((item) => item.zone === zone)!;
  const [selected, setSelected] = useState<string[]>([zoneStops[0]!.id]);
  const [vehicle, setVehicle] = useState<VehicleType>("sedan");
  const [pickup, setPickup] = useState("");
  const [departure, setDeparture] = useState<MapPoint>(DEFAULT_ORIGIN_POINTS[zone]);
  const [destination, setDestination] = useState<MapPoint | null>(null);
  const [activeField, setActiveField] = useState<MapEndpoint>("destination");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickupAt, setPickupAt] = useState("");
  const [notes, setNotes] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);
  const attempt = useRef<{ payload: string; key: string } | null>(null);
  const sending = useRef(false);
  const fixed = DEFAULT_ORIGIN_POINTS[zone];
  useEffect(() => {
    const draft = readMapDraft(zone);
    if (draft) {
      setDeparture(draft.departure ?? DEFAULT_ORIGIN_POINTS[zone]);
      setDestination(draft.destination);
    }
  }, [zone]);
  const manual =
    pickup.trim().length > 0 ||
    destination !== null ||
    departure.lat !== fixed.lat ||
    departure.lng !== fixed.lng;
  const km = useMemo(
    () =>
      zoneStops
        .filter((stop) => selected.includes(stop.id))
        .reduce((sum, stop) => sum + stop.km, 0),
    [selected, zoneStops],
  );
  const promo = promotions.find(
    (item) =>
      item.code === appliedPromo &&
      item.active &&
      item.targetCard === zone &&
      Date.parse(`${item.expiresAt}T23:59:59+03:00`) >= Date.now(),
  );
  const estimate = calcFare({
    config,
    km,
    vehicleMultiplier: vehicles.find((item) => item.id === vehicle)!.multiplier,
    surgeOn: false,
    discountPct: promo?.discountPercentage ?? 0,
  });
  const stopName = (stop: (typeof zoneStops)[number]) =>
    lang === "ar" ? stop.nameAr : lang === "ur" ? stop.nameUr : stop.name;
  const applyPromo = () => {
    const match = promotions.find(
      (item) =>
        item.code.toLowerCase() === promoInput.trim().toLowerCase() &&
        item.active &&
        item.targetCard === zone &&
        Date.parse(`${item.expiresAt}T23:59:59+03:00`) >= Date.now(),
    );
    setAppliedPromo(match?.code ?? "");
    if (!match) toast.error(t("booking_bad_promo"));
    else toast.success(`${match.code}: ${match.discountPercentage}%`);
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending.current) return;
    setError("");
    if (!consent || (!selected.length && !destination)) {
      setError(t("booking_required"));
      return;
    }
    const scheduled = `${pickupAt}:00+03:00`;
    const when = Date.parse(scheduled);
    if (!Number.isFinite(when) || when <= Date.now() || when > Date.now() + 365 * 86400000) {
      setError(t("booking_bad_date"));
      return;
    }
    const payload = {
      customerName: customerName.trim(),
      phone: phone.trim(),
      zone,
      vehicle,
      stopIds: selected,
      pickupText: pickup.trim(),
      departure,
      destination,
      pickupAt: scheduled,
      notes: notes.trim(),
      promoCode: appliedPromo,
      consent: true,
    };
    const serialized = JSON.stringify(payload);
    if (attempt.current?.payload !== serialized)
      attempt.current = { payload: serialized, key: crypto.randomUUID() };
    sending.current = true;
    setBusy(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        credentials: "omit",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, idempotencyKey: attempt.current!.key }),
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) {
        setError(
          response.status === 400 || response.status === 422
            ? t("booking_invalid")
            : response.status === 429
              ? t("booking_rate_limit")
              : t("booking_save_error"),
        );
        return;
      }
      const saved = (await response.json()) as BookingReceipt;
      if (!saved.reference || !saved.id) throw new Error("Invalid receipt");
      clearMapDraft();
      setReceipt(saved);
    } catch {
      setError(t("booking_save_error"));
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };
  if (receipt)
    return (
      <Card className="mx-auto max-w-2xl" role="status">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 aria-hidden="true" />
            {t("booking_saved")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            {t("booking_reference")}{" "}
            <strong className="font-mono" dir="ltr">
              {receipt.reference}
            </strong>
          </p>
          <p>
            {receipt.status === "quote_requested"
              ? t("manual_quote_required")
              : t("booking_pending")}
          </p>
          {receipt.estimatedFare !== null && (
            <p>
              {t("booking_estimate")}: {receipt.estimatedFare} {t("currency")}
            </p>
          )}
          <p className="text-sm text-muted-foreground">{t("booking_not_confirmed")}</p>
          <Button
            type="button"
            onClick={() => {
              setReceipt(null);
              attempt.current = null;
              setConsent(false);
            }}
          >
            {t("booking_new")}
          </Button>
        </CardContent>
      </Card>
    );
  return (
    <form onSubmit={submit} className="space-y-6">
      <fieldset disabled={busy} className="grid min-w-0 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("booking_details")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="booking-name">{t("booking_name")}</Label>
                <Input
                  id="booking-name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="booking-phone">{t("booking_phone")}</Label>
                <Input
                  id="booking-phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  minLength={7}
                  maxLength={30}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+966…"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="booking-time">{t("booking_time")}</Label>
                <Input
                  id="booking-time"
                  type="datetime-local"
                  required
                  value={pickupAt}
                  onChange={(event) => setPickupAt(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t("booking_timezone")}</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="booking-notes">{t("booking_notes")}</Label>
                <textarea
                  id="booking-notes"
                  className="min-h-20 w-full rounded-lg border border-input bg-background p-3 text-sm"
                  maxLength={1000}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("route_origin_label")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-semibold">
                {zone === "makkah" ? t("makkah_origin") : t("madinah_origin")}
              </p>
              <Label htmlFor="booking-pickup">{t("pickup_location")}</Label>
              <Input
                id="booking-pickup"
                maxLength={120}
                value={pickup}
                onChange={(event) => setPickup(event.target.value)}
                placeholder={t("pickup_placeholder")}
              />
              <p className="text-xs text-muted-foreground">
                {manual ? t("custom_pickup_note") : t("distance_note")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("map_picker_title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <MapPicker
                zone={zone}
                departure={departure}
                destination={destination}
                activeField={activeField}
                onActiveFieldChange={setActiveField}
                onPick={(field, point) => {
                  if (sending.current) return;
                  if (field === "departure") {
                    setDeparture(point);
                    setActiveField("destination");
                  } else setDestination(point);
                }}
                onReset={(field) => {
                  if (sending.current) return;
                  if (field === "departure") setDeparture(fixed);
                  else setDestination(null);
                }}
              />
              <p className="text-xs text-muted-foreground">{t("map_estimate_note")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("select_places")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {zoneStops.map((stop) => (
                <label
                  key={stop.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3"
                >
                  <Checkbox
                    checked={selected.includes(stop.id)}
                    onCheckedChange={() =>
                      setSelected((current) =>
                        current.includes(stop.id)
                          ? current.filter((id) => id !== stop.id)
                          : [...current, stop.id],
                      )
                    }
                  />
                  <span className="flex-1 text-sm">{stopName(stop)}</span>
                  {!manual && <span className="text-xs text-muted-foreground">{stop.km} km</span>}
                </label>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("vehicle")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-3">
              {vehicles.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={vehicle === item.id}
                  onClick={() => setVehicle(item.id)}
                  className={`rounded-lg border p-3 text-start ${vehicle === item.id ? "border-primary bg-primary/10" : "border-border"}`}
                >
                  <p className="font-semibold">{item.label}</p>
                  <span className="flex items-center gap-1 text-xs">
                    <Users className="size-3" />
                    {item.seats}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle>{manual ? t("manual_quote_required") : t("booking_estimate")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {manual ? (
              <p className="text-sm">{t("custom_pickup_note")}</p>
            ) : (
              <>
                <p className="text-3xl font-bold">
                  {estimate.total} {t("currency")}
                </p>
                <p className="text-xs text-muted-foreground">{t("booking_estimate_note")}</p>
                <div className="flex gap-2">
                  <Input
                    value={promoInput}
                    maxLength={30}
                    onChange={(event) => setPromoInput(event.target.value)}
                    placeholder={t("promo")}
                    aria-label={t("promo")}
                  />
                  <Button type="button" variant="secondary" onClick={applyPromo}>
                    {t("apply")}
                  </Button>
                </div>
                {promo && (
                  <p className="text-sm">
                    {promo.code}: {promo.discountPercentage}%
                  </p>
                )}
              </>
            )}
            <label className="flex items-start gap-3 text-xs leading-relaxed">
              <Checkbox
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
              />
              <span>{t("booking_consent")}</span>
            </label>
            <p className="text-xs text-muted-foreground">{t("booking_not_confirmed")}</p>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={busy || !consent}>
              {busy && <Loader2 className="me-2 size-4 animate-spin" />}
              {busy
                ? t("booking_saving")
                : manual
                  ? t("booking_quote_submit")
                  : t("booking_submit")}
            </Button>
          </CardContent>
        </Card>
      </fieldset>
    </form>
  );
}
