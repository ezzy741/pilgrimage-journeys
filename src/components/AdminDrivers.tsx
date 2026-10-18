import { useEffect, useRef, useState } from "react";
import { KeyRound, LockKeyhole, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StoredDriverRegistration } from "@/lib/driver-types";

const DRIVERS_URL = "/api/admin/drivers";

function friendlyError(status?: number) {
  if (status === 401 || status === 403)
    return "Access key was not accepted. Please reconnect with a valid admin key.";
  if (status === 503)
    return "Driver registrations are temporarily unavailable. Please try again later.";
  return "We couldn't load driver registrations. Please try again.";
}

function isDriver(value: unknown): value is StoredDriverRegistration {
  if (!value || typeof value !== "object") return false;
  const driver = value as Record<string, unknown>;
  return (
    typeof driver["id"] === "string" &&
    typeof driver["reference"] === "string" &&
    typeof driver["createdAt"] === "string" &&
    typeof driver["consentAt"] === "string" &&
    typeof driver["fullName"] === "string" &&
    typeof driver["phone"] === "string" &&
    Array.isArray(driver["serviceZones"]) &&
    driver["serviceZones"].every((zone) => zone === "makkah" || zone === "madinah") &&
    (driver["vehicleType"] === "sedan" ||
      driver["vehicleType"] === "suv" ||
      driver["vehicleType"] === "hiace") &&
    typeof driver["vehicleModel"] === "string" &&
    driver["status"] === "pending_review"
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}

export function AdminDrivers() {
  const [keyInput, setKeyInput] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [drivers, setDrivers] = useState<StoredDriverRegistration[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const generation = useRef(0);
  const busyRef = useRef(false);
  const requestController = useRef<AbortController | null>(null);
  const selected = drivers.find((driver) => driver.id === selectedId) ?? null;

  useEffect(
    () => () => {
      generation.current += 1;
      requestController.current?.abort();
    },
    [],
  );

  const clearPrivateData = () => {
    generation.current += 1;
    requestController.current?.abort();
    requestController.current = null;
    busyRef.current = false;
    setBusy(false);
    setAdminKey("");
    setKeyInput("");
    setDrivers([]);
    setSelectedId("");
  };

  const lock = () => {
    clearPrivateData();
    setError("");
    setNotice(
      "Driver records locked. The key and registration details were cleared from this page.",
    );
  };

  const connect = async () => {
    const candidateKey = keyInput.trim();
    if (!candidateKey || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const thisRequest = ++generation.current;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setDrivers([]);
    setSelectedId("");
    setAdminKey("");
    setError("");
    setNotice("");
    try {
      const response = await fetch(DRIVERS_URL, {
        method: "GET",
        headers: { Authorization: `Bearer ${candidateKey}` },
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal,
      });
      if (generation.current !== thisRequest) return;
      if (!response.ok) {
        const message = friendlyError(response.status);
        clearPrivateData();
        setError(message);
        return;
      }
      const payload: unknown = await response.json();
      if (generation.current !== thisRequest) return;
      if (
        !payload ||
        typeof payload !== "object" ||
        !Array.isArray((payload as { drivers?: unknown }).drivers)
      ) {
        clearPrivateData();
        setError(
          "The driver service returned an unexpected response. Please reconnect and try again.",
        );
        return;
      }
      const rows = (payload as { drivers: unknown[] }).drivers
        .filter(isDriver)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 100);
      setAdminKey(candidateKey);
      setKeyInput("");
      setDrivers(rows);
      setNotice(
        `Connected. Showing ${rows.length} most recent driver registration${rows.length === 1 ? "" : "s"}.`,
      );
    } catch (cause) {
      if (
        generation.current !== thisRequest ||
        (cause instanceof DOMException && cause.name === "AbortError")
      )
        return;
      clearPrivateData();
      setError(friendlyError());
    } finally {
      if (generation.current === thisRequest) {
        busyRef.current = false;
        setBusy(false);
        requestController.current = null;
      }
    }
  };

  const refresh = () => {
    if (!adminKey || busyRef.current) return;
    // Reuse the same memory-only key through the shared connection handler.
    void connectWithKey(adminKey);
  };

  const connectWithKey = async (candidateKey: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const thisRequest = ++generation.current;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setDrivers([]);
    setSelectedId("");
    setAdminKey("");
    setError("");
    setNotice("");
    try {
      const response = await fetch(DRIVERS_URL, {
        method: "GET",
        headers: { Authorization: `Bearer ${candidateKey}` },
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal,
      });
      if (generation.current !== thisRequest) return;
      if (!response.ok) {
        const message = friendlyError(response.status);
        clearPrivateData();
        setError(message);
        return;
      }
      const payload: unknown = await response.json();
      if (generation.current !== thisRequest) return;
      if (
        !payload ||
        typeof payload !== "object" ||
        !Array.isArray((payload as { drivers?: unknown }).drivers)
      ) {
        clearPrivateData();
        setError(
          "The driver service returned an unexpected response. Please reconnect and try again.",
        );
        return;
      }
      const rows = (payload as { drivers: unknown[] }).drivers
        .filter(isDriver)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 100);
      setAdminKey(candidateKey);
      setKeyInput("");
      setDrivers(rows);
      setNotice(
        `Connected. Showing ${rows.length} most recent driver registration${rows.length === 1 ? "" : "s"}.`,
      );
    } catch (cause) {
      if (
        generation.current !== thisRequest ||
        (cause instanceof DOMException && cause.name === "AbortError")
      )
        return;
      clearPrivateData();
      setError(friendlyError());
    } finally {
      if (generation.current === thisRequest) {
        busyRef.current = false;
        setBusy(false);
        requestController.current = null;
      }
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4" /> Secure driver access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enter the admin access key to view real driver registration records. The key stays only
            in this page's memory and is not saved in browser storage or the URL.
          </p>
          {!adminKey ? (
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                void connect();
              }}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <Label htmlFor="admin-driver-key">Admin access key</Label>
                <Input
                  id="admin-driver-key"
                  type="password"
                  autoComplete="off"
                  value={keyInput}
                  onChange={(event) => setKeyInput(event.target.value)}
                  placeholder="Enter admin key"
                  disabled={busy}
                />
              </div>
              <Button type="submit" className="sm:mt-6" disabled={busy || !keyInput.trim()}>
                <RefreshCw className={`me-2 size-4 ${busy ? "animate-spin" : ""}`} />
                {busy ? "Connecting…" : "Connect and load"}
              </Button>
              <Button type="button" variant="ghost" className="sm:mt-6" onClick={lock}>
                {busy ? "Cancel and clear" : "Clear key"}
              </Button>
            </form>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="secondary">Connected · {drivers.length} registrations loaded</Badge>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={refresh} disabled={busy}>
                  <RefreshCw className={`me-2 size-4 ${busy ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button type="button" variant="outline" onClick={lock}>
                  <LockKeyhole className="me-2 size-4" />
                  Lock and clear
                </Button>
              </div>
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="text-sm text-muted-foreground">
              {notice}
            </p>
          )}
        </CardContent>
      </Card>

      {adminKey && (
        <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.75fr)_minmax(0,1.6fr)]">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent registrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {drivers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No driver registrations were returned.
                </p>
              ) : (
                drivers.map((driver) => (
                  <button
                    key={driver.id}
                    type="button"
                    onClick={() => setSelectedId(driver.id)}
                    disabled={busy}
                    className={`w-full rounded-lg border p-3 text-start transition-colors ${selectedId === driver.id ? "border-primary bg-secondary" : "border-border hover:bg-secondary/60"}`}
                    aria-pressed={selectedId === driver.id}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold">{driver.reference}</span>
                      <Badge variant="secondary" className="max-w-[50%] truncate">
                        Pending review
                      </Badge>
                    </span>
                    <span className="mt-1 block truncate text-sm">{driver.fullName}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {formatDate(driver.createdAt)} · {driver.serviceZones.join(" / ")}
                    </span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {selected ? (
            <Card className="self-start shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                  <span>Registration {selected.reference}</span>
                  <Badge variant="secondary">Pending review</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-x-5 gap-y-4 text-sm sm:grid-cols-2">
                <Info label="Full name" value={selected.fullName} />
                <Info label="Phone / WhatsApp" value={selected.phone} />
                <Info label="Service areas" value={selected.serviceZones.join(", ")} />
                <Info label="Vehicle type" value={selected.vehicleType.toUpperCase()} />
                <Info label="Vehicle model" value={selected.vehicleModel} />
                <Info label="Received" value={formatDate(selected.createdAt)} />
                <Info label="Consent recorded" value={formatDate(selected.consentAt)} />
                <p className="sm:col-span-2 border-t border-border pt-3 text-xs leading-5 text-muted-foreground">
                  This registration is for review and contact only. It does not approve a driver or
                  assign rides.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="self-start shadow-card">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Select a registration to view its details.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
