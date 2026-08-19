import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, CreditCard, Percent, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ADMIN_COMMISSION_RATE,
  fareConfigs,
  paymentGateways,
  promotions,
  rides,
  type FareConfig,
  type Promotion,
} from "@/lib/mock-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Control Panel — Ziyarat Ride" },
      {
        name: "description",
        content:
          "Revenue split reports, fare management, promo manager and payment gateway settings for Ziyarat Ride.",
      },
      { property: "og:title", content: "Admin Control Panel — Ziyarat Ride" },
      {
        property: "og:description",
        content: "Manage fares, promotions, payouts and payment gateways.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [fares, setFares] = useState<FareConfig[]>(fareConfigs);
  const [promos, setPromos] = useState<Promotion[]>(promotions);
  const [gateways, setGateways] = useState(paymentGateways);
  const [report, setReport] = useState<null | {
    gross: number;
    driver: number;
    admin: number;
    trips: number;
  }>(null);

  const runReport = () => {
    const completed = rides.filter((r) => r.status === "completed");
    const gross = completed.reduce((s, r) => s + r.fare, 0);
    const admin = Math.round(gross * ADMIN_COMMISSION_RATE);
    setReport({ gross, driver: gross - admin, admin, trips: completed.length });
    toast.success("Split report generated");
  };

  const updateFare = (zone: string, key: keyof FareConfig, value: number) =>
    setFares((prev) => prev.map((f) => (f.zone === zone ? { ...f, [key]: value } : f)));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-primary">Admin Control Panel</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Financials, fares, promotions and payment gateways.
      </p>

      <Tabs defaultValue="finance">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="finance">
            <BarChart3 className="me-1 size-4" /> Finance
          </TabsTrigger>
          <TabsTrigger value="fares">
            <Settings2 className="me-1 size-4" /> Fares
          </TabsTrigger>
          <TabsTrigger value="promos">
            <Percent className="me-1 size-4" /> Promos
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="me-1 size-4" /> Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="finance" className="mt-4 space-y-4">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">One-click split report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runReport}>Generate report</Button>
              {report && (
                <div className="grid gap-3 sm:grid-cols-4">
                  <Stat label="Completed trips" value={String(report.trips)} />
                  <Stat label="Gross revenue" value={`${report.gross} SAR`} />
                  <Stat label="Driver earnings" value={`${report.driver} SAR`} />
                  <Stat label="Net admin profit" value={`${report.admin} SAR`} highlight />
                </div>
              )}
              <Separator />
              <div className="space-y-2 text-sm">
                {rides.map((r) => (
                  <div key={r.id} className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {r.id} · {r.passenger} · {r.zone}
                    </span>
                    <span className="flex items-center gap-2">
                      {r.fare} SAR
                      <Badge variant={r.status === "completed" ? "default" : "secondary"}>
                        {r.status}
                      </Badge>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fares" className="mt-4 grid gap-4 sm:grid-cols-2">
          {fares.map((f) => (
            <Card key={f.zone} className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base capitalize">{f.zone} rates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Field
                  label="Base fare (SAR)"
                  value={f.baseFare}
                  onChange={(v) => updateFare(f.zone, "baseFare", v)}
                />
                <Field
                  label="Per-KM rate (SAR)"
                  value={f.perKmRate}
                  onChange={(v) => updateFare(f.zone, "perKmRate", v)}
                />
                <Field
                  label="Surge multiplier"
                  value={f.surgeMultiplier}
                  onChange={(v) => updateFare(f.zone, "surgeMultiplier", v)}
                />
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => toast.success(`${f.zone} rates saved`)}
                >
                  Save
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="promos" className="mt-4 space-y-3">
          {promos.map((p) => (
            <Card key={p.id} className="shadow-card">
              <CardContent className="grid gap-3 pt-6 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="space-y-2">
                  <Input
                    value={p.bannerText}
                    onChange={(e) =>
                      setPromos((prev) =>
                        prev.map((x) => (x.id === p.id ? { ...x, bannerText: e.target.value } : x)),
                      )
                    }
                  />
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{p.code}</span>
                    <span>· {p.discountPercentage}% off</span>
                    <span>· {p.targetCard}</span>
                    <span>· expires {p.expiresAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Active</span>
                  <Switch
                    checked={p.active}
                    onCheckedChange={(v) =>
                      setPromos((prev) =>
                        prev.map((x) => (x.id === p.id ? { ...x, active: v } : x)),
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="payments" className="mt-4 grid gap-4 sm:grid-cols-2">
          {gateways.map((g) => (
            <Card key={g.id} className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  {g.name}
                  <Badge variant="secondary">{g.region}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input placeholder="Merchant ID" />
                <Input placeholder="API key" type="password" />
                <Input placeholder="Secret key" type="password" />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">Enabled</span>
                  <Switch
                    checked={g.active}
                    onCheckedChange={(v) =>
                      setGateways((prev) =>
                        prev.map((x) => (x.id === g.id ? { ...x, active: v } : x)),
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? "gradient-holy text-primary-foreground" : "bg-secondary"}`}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
