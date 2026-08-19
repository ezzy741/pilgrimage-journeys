import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, MapPin, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n";
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
  const config = fareConfigs.find((f) => f.zone === zone)!;
  const zoneStops = stops[zone];

  const [selected, setSelected] = useState<string[]>([zoneStops[0]!.id]);
  const [vehicle, setVehicle] = useState<VehicleType>("sedan");
  const [surgeOn, setSurgeOn] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [phase, setPhase] = useState<"idle" | "searching" | "assigned">("idle");
  const [otp, setOtp] = useState("");

  const km = useMemo(
    () => zoneStops.filter((s) => selected.includes(s.id)).reduce((sum, s) => sum + s.km, 0),
    [selected, zoneStops],
  );

  const vehicleMultiplier = vehicles.find((v) => v.id === vehicle)!.multiplier;
  const fare = calcFare({ config, km, vehicleMultiplier, surgeOn, discountPct });

  const stopName = (s: (typeof zoneStops)[number]) =>
    lang === "ar" ? s.nameAr : lang === "ur" ? s.nameUr : s.name;

  const toggleStop = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const applyPromo = () => {
    const promo = promotions.find(
      (p) => p.active && p.code.toLowerCase() === promoInput.trim().toLowerCase(),
    );
    if (!promo) {
      setDiscountPct(0);
      toast.error("Invalid or expired promo code");
      return;
    }
    setDiscountPct(promo.discountPercentage);
    toast.success(`${promo.code} applied — ${promo.discountPercentage}% off`);
  };

  const confirmBooking = () => {
    if (selected.length === 0) {
      toast.error("Select at least one place to visit");
      return;
    }
    setPhase("searching");
    window.setTimeout(() => {
      setOtp(String(Math.floor(1000 + Math.random() * 9000)));
      setPhase("assigned");
    }, 1800);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">{t("select_places")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {zoneStops.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary/60"
              >
                <Checkbox
                  checked={selected.includes(s.id)}
                  onCheckedChange={() => toggleStop(s.id)}
                />
                <span className="flex-1 text-sm font-medium">{stopName(s)}</span>
                <span className="text-xs text-muted-foreground">{s.km} km</span>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">{t("vehicle")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            {vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => setVehicle(v.id)}
                className={`rounded-lg border p-3 text-start transition-colors ${
                  vehicle === v.id
                    ? "border-accent bg-accent/10"
                    : "border-border hover:bg-secondary/60"
                }`}
              >
                <p className="text-sm font-semibold">{v.label}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3" /> {v.seats}
                </p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit shadow-card lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle className="text-base">{t("total")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("base_fare")}</span>
            <span>
              {fare.base} {t("currency")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("distance_cost")} ({km} km)
            </span>
            <span>
              {fare.distance} {t("currency")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              {t("surge")} ×{config.surgeMultiplier}
              <Switch checked={surgeOn} onCheckedChange={setSurgeOn} />
            </span>
            <span>
              {fare.surge} {t("currency")}
            </span>
          </div>
          <div className="flex justify-between text-accent">
            <span>
              {t("discount")} {discountPct > 0 ? `(${discountPct}%)` : ""}
            </span>
            <span>
              −{fare.discount} {t("currency")}
            </span>
          </div>

          <div className="flex gap-2">
            <Input
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              placeholder={t("promo")}
              className="h-9"
            />
            <Button variant="secondary" size="sm" className="h-9" onClick={applyPromo}>
              {t("apply")}
            </Button>
          </div>

          <Separator />
          <div className="flex items-baseline justify-between">
            <span className="font-medium">{t("total")}</span>
            <span className="text-2xl font-bold text-primary">
              {fare.total} {t("currency")}
            </span>
          </div>

          {phase === "idle" && (
            <Button className="w-full" size="lg" onClick={confirmBooking}>
              {t("confirm")}
            </Button>
          )}

          {phase === "searching" && (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-secondary p-4 text-sm">
              <Loader2 className="size-4 animate-spin" /> {t("searching")}
            </div>
          )}

          {phase === "assigned" && (
            <div className="space-y-3 rounded-lg border border-accent/40 bg-accent/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="size-4 text-primary" /> {t("driver_assigned")}
              </p>
              <p className="text-xs text-muted-foreground">
                Yusuf A. · Toyota Camry · ABC-4412 · 4 min away
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="size-3" /> Live tracking active
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">{t("otp_title")}</p>
              <div className="flex gap-2">
                {otp.split("").map((d, i) => (
                  <span
                    key={i}
                    className="flex size-10 items-center justify-center rounded-md bg-card text-lg font-bold text-primary shadow-card"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Badge variant="secondary" className="w-full justify-center gap-1 py-1.5 font-normal">
            <ShieldCheck className="size-3" /> Verified Ziyarat drivers
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
