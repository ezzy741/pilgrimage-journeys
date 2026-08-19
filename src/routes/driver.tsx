import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Car, MapPin, Navigation, Timer, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ADMIN_COMMISSION_RATE, rides } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/driver")({
  head: () => ({
    meta: [
      { title: "Driver Console — Ziyarat Ride" },
      {
        name: "description",
        content:
          "Go online, accept Ziyarat ride requests, verify OTP and track your earnings and payouts.",
      },
      { property: "og:title", content: "Driver Console — Ziyarat Ride" },
      {
        property: "og:description",
        content: "Manage trips, OTP verification and earnings as a Ziyarat driver.",
      },
    ],
  }),
  component: DriverPage,
});

const REQUEST = {
  passenger: "Bilal K.",
  pickupDistanceKm: 2.4,
  pickup: "Aziziyah, Makkah",
  dropoff: "Mina Ziyarat Loop",
  fare: 470,
};

function DriverPage() {
  const { t } = useI18n();
  const [online, setOnline] = useState(false);
  const [countdown, setCountdown] = useState(20);
  const [stage, setStage] = useState<"idle" | "incoming" | "accepted" | "started">("idle");
  const [otpInput, setOtpInput] = useState("");

  useEffect(() => {
    if (!online || stage !== "idle") return;
    const timer = window.setTimeout(() => {
      setStage("incoming");
      setCountdown(20);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [online, stage]);

  useEffect(() => {
    if (stage !== "incoming") return;
    if (countdown === 0) {
      setStage("idle");
      toast.error("Request expired");
      return;
    }
    const id = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [stage, countdown]);

  const completed = rides.filter((r) => r.status === "completed");
  const gross = completed.reduce((s, r) => s + r.fare, 0);
  const commission = Math.round(gross * ADMIN_COMMISSION_RATE);
  const net = gross - commission;
  const driverEarning = Math.round(REQUEST.fare * (1 - ADMIN_COMMISSION_RATE));

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <Card className="shadow-card">
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="font-semibold">Yusuf A.</p>
            <p className="text-xs text-muted-foreground">Toyota Camry · ABC-4412 · ★ 4.9</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={online ? "default" : "secondary"}>
              {online ? t("online") : t("offline")}
            </Badge>
            <Switch checked={online} onCheckedChange={setOnline} />
          </div>
        </CardContent>
      </Card>

      {stage === "incoming" && (
        <Card className="border-accent shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              New ride request
              <span className="flex items-center gap-1 text-sm text-accent">
                <Timer className="size-4" /> {countdown}s
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Progress value={(countdown / 20) * 100} />
            <p className="flex items-center gap-2">
              <MapPin className="size-4 text-primary" /> {REQUEST.pickup} ·{" "}
              {REQUEST.pickupDistanceKm} km away
            </p>
            <p className="flex items-center gap-2">
              <Navigation className="size-4 text-primary" /> {REQUEST.dropoff}
            </p>
            <p className="text-lg font-bold text-primary">
              You earn {driverEarning} {t("currency")}
            </p>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => setStage("accepted")}>
                Accept
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setStage("idle")}>
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {stage === "accepted" && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Verify passenger OTP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              inputMode="numeric"
              maxLength={4}
              placeholder="4-digit OTP"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
            />
            <Button
              className="w-full"
              disabled={otpInput.length !== 4}
              onClick={() => {
                setStage("started");
                toast.success("Ride started");
              }}
            >
              Start ride
            </Button>
          </CardContent>
        </Card>
      )}

      {stage === "started" && (
        <Card className="shadow-card">
          <CardContent className="space-y-3 pt-6 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <Car className="size-4 text-primary" /> Trip in progress to {REQUEST.dropoff}
            </p>
            <Progress value={62} />
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setStage("idle");
                setOtpInput("");
                toast.success(`Trip completed · ${driverEarning} ${t("currency")} added`);
              }}
            >
              Complete ride
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="size-4" /> {t("earnings")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Total fares collected" value={`${gross} ${t("currency")}`} />
          <Row
            label={`Admin commission (${ADMIN_COMMISSION_RATE * 100}%)`}
            value={`−${commission} ${t("currency")}`}
          />
          <Separator />
          <div className="flex justify-between text-base font-bold text-primary">
            <span>Net payout</span>
            <span>
              {net} {t("currency")}
            </span>
          </div>
          <Separator />
          {completed.map((r) => (
            <div key={r.id} className="flex justify-between text-xs text-muted-foreground">
              <span>
                {r.id} · {r.pickup} → {r.dropoff}
              </span>
              <span>
                {r.fare} {t("currency")}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
