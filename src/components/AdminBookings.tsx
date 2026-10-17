import { useEffect, useMemo, useRef, useState } from "react";
import { KeyRound, LockKeyhole, RefreshCw, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPicker } from "@/components/MapPicker";
import type { MapEndpoint, MapPoint } from "@/lib/map-locations";
import type { StoredBooking } from "@/lib/booking-types";
import { stops } from "@/lib/mock-data";

const BOOKINGS_URL = "/api/admin/bookings";

type BookingDraft = Pick<StoredBooking, "departure" | "destination" | "pickupText">;

function makeDraft(booking: StoredBooking): BookingDraft {
  return {
    departure: booking.departure ? { ...booking.departure } : null,
    destination: booking.destination ? { ...booking.destination } : null,
    pickupText: booking.pickupText,
  };
}

function samePoint(a: MapPoint | null, b: MapPoint | null) {
  return a?.lat === b?.lat && a?.lng === b?.lng;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function friendlyError(status?: number) {
  if (status === 401 || status === 403)
    return "Access key was not accepted. Please reconnect with a valid admin key.";
  if (status === 503)
    return "Booking management is temporarily unavailable. Please try again later.";
  return "We couldn't complete that request. Please try again.";
}

export function AdminBookings() {
  const [keyInput, setKeyInput] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [bookings, setBookings] = useState<StoredBooking[]>([]);
  const [invalidatedBookingIds, setInvalidatedBookingIds] = useState<Set<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [activeField, setActiveField] = useState<MapEndpoint>("departure");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const generation = useRef(0);
  const requestController = useRef<AbortController | null>(null);

  const selected = bookings.find((booking) => booking.id === selectedId) ?? null;
  const dirty = Boolean(
    selected &&
    draft &&
    (draft.pickupText !== selected.pickupText ||
      !samePoint(draft.departure, selected.departure) ||
      !samePoint(draft.destination, selected.destination)),
  );
  const estimateInvalidated = dirty || (selected ? invalidatedBookingIds.has(selected.id) : false);
  const stopNames = useMemo(() => {
    if (!selected) return [];
    const available = stops[selected.zone];
    return selected.stopIds.map((id) => available.find((stop) => stop.id === id)?.name ?? id);
  }, [selected]);

  useEffect(() => {
    return () => {
      generation.current += 1;
      requestController.current?.abort();
    };
  }, []);

  const clearPrivateData = () => {
    generation.current += 1;
    requestController.current?.abort();
    requestController.current = null;
    setBusy(false);
    setAdminKey("");
    setKeyInput("");
    setBookings([]);
    setInvalidatedBookingIds(new Set());
    setSelectedId("");
    setDraft(null);
  };

  const lock = () => {
    clearPrivateData();
    setError("");
    setNotice("Admin bookings locked. The key and booking details were cleared from this page.");
  };

  const connect = async () => {
    const candidateKey = keyInput.trim();
    if (!candidateKey || busy) return;
    generation.current += 1;
    const thisRequest = generation.current;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setBookings([]);
    setInvalidatedBookingIds(new Set());
    setSelectedId("");
    setDraft(null);
    setAdminKey("");
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(BOOKINGS_URL, {
        method: "GET",
        headers: { Authorization: `Bearer ${candidateKey}` },
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal,
      });
      if (generation.current !== thisRequest) return;
      if (!response.ok) {
        clearPrivateData();
        setError(friendlyError(response.status));
        return;
      }
      const payload: unknown = await response.json();
      if (generation.current !== thisRequest) return;
      if (
        !payload ||
        typeof payload !== "object" ||
        !Array.isArray((payload as { bookings?: unknown }).bookings)
      ) {
        clearPrivateData();
        setError("The booking service returned an unexpected response. Please try again.");
        return;
      }
      const rows = (payload as { bookings: StoredBooking[] }).bookings
        .filter((booking) => booking && typeof booking.id === "string")
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 100);
      setAdminKey(candidateKey);
      setKeyInput("");
      setBookings(rows);
      setNotice(
        `Connected. Showing ${rows.length} most recent booking${rows.length === 1 ? "" : "s"}.`,
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
        setBusy(false);
        requestController.current = null;
      }
    }
  };

  const selectBooking = (booking: StoredBooking) => {
    setSelectedId(booking.id);
    setDraft(makeDraft(booking));
    setActiveField("departure");
    setError("");
    setNotice("");
  };

  const saveChanges = async () => {
    if (!selected || !draft || !adminKey || !dirty || busy) return;
    generation.current += 1;
    const thisRequest = generation.current;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${BOOKINGS_URL}/${encodeURIComponent(selected.id)}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal,
      });
      if (generation.current !== thisRequest) return;
      if (!response.ok) {
        if (response.status === 401 || response.status === 403 || response.status === 503) {
          clearPrivateData();
        }
        setError(friendlyError(response.status));
        return;
      }
      const payload: unknown = await response.json();
      if (generation.current !== thisRequest) return;
      const updated = (payload as { booking?: StoredBooking } | null)?.booking;
      if (!updated || updated.id !== selected.id) {
        setError(
          "The booking service returned an unexpected response. Please reconnect and try again.",
        );
        clearPrivateData();
        return;
      }
      setBookings((current) =>
        current.map((booking) => (booking.id === updated.id ? updated : booking)),
      );
      setInvalidatedBookingIds((current) => new Set(current).add(updated.id));
      setDraft(makeDraft(updated));
      setNotice("Saved. The route details were updated; a manual fare quote is now required.");
    } catch (cause) {
      if (
        generation.current !== thisRequest ||
        (cause instanceof DOMException && cause.name === "AbortError")
      )
        return;
      setError(friendlyError());
    } finally {
      if (generation.current === thisRequest) {
        setBusy(false);
        requestController.current = null;
      }
    }
  };

  const changePoint = (field: MapEndpoint, point: MapPoint) => {
    setDraft((current) => (current ? { ...current, [field]: point } : current));
  };

  const resetPoint = (field: MapEndpoint) => {
    setDraft((current) => (current ? { ...current, [field]: null } : current));
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4" /> Secure booking access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enter the admin access key to load real booking records. The key is held only in this
            page's memory and is not saved in browser storage or the URL.
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
                <Label htmlFor="admin-booking-key">Admin access key</Label>
                <Input
                  id="admin-booking-key"
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
              <Badge variant="secondary">Connected · {bookings.length} bookings loaded</Badge>
              <Button type="button" variant="outline" onClick={lock}>
                <LockKeyhole className="me-2 size-4" /> Lock and clear
              </Button>
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
              <CardTitle className="text-base">Recent bookings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bookings were returned.</p>
              ) : (
                bookings.map((booking) => (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => selectBooking(booking)}
                    disabled={busy}
                    className={`w-full rounded-lg border p-3 text-start transition-colors ${selectedId === booking.id ? "border-primary bg-secondary" : "border-border hover:bg-secondary/60"}`}
                    aria-pressed={selectedId === booking.id}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-semibold">{booking.reference}</span>
                      <Badge variant="secondary" className="max-w-[50%] truncate">
                        {booking.status.replaceAll("_", " ")}
                      </Badge>
                    </span>
                    <span className="mt-1 block truncate text-sm">{booking.customerName}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {formatDate(booking.createdAt)} · {booking.zone}
                    </span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {selected && draft ? (
            <div className="space-y-4">
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                    <span>Booking {selected.reference}</span>
                    <Badge variant="secondary">{selected.status.replaceAll("_", " ")}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-x-5 gap-y-3 text-sm sm:grid-cols-2">
                  <Info label="Customer" value={selected.customerName} />
                  <Info label="Phone" value={selected.phone} />
                  <Info label="Created" value={formatDate(selected.createdAt)} />
                  <Info label="Last updated" value={formatDate(selected.updatedAt)} />
                  <Info label="Pickup time" value={formatDate(selected.pickupAt)} />
                  <Info label="Zone / vehicle" value={`${selected.zone} · ${selected.vehicle}`} />
                  <Info
                    label="Requested stops"
                    value={stopNames.length ? stopNames.join(", ") : "None selected"}
                  />
                  <Info label="Promo code" value={selected.promoCode || "None"} />
                  <div className="sm:col-span-2">
                    <Info label="Customer notes" value={selected.notes || "No notes"} />
                  </div>
                  <div className="sm:col-span-2">
                    <Info
                      label="Pickup description"
                      value={selected.pickupText || "Not provided"}
                    />
                  </div>
                  <div className="sm:col-span-2 border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground">Fare status</p>
                    {estimateInvalidated ? (
                      <p className="mt-1 font-medium text-amber-700">
                        Estimate invalidated by route changes. A manual quote is required; no fare
                        is recalculated here.
                      </p>
                    ) : selected.estimatedFare == null ? (
                      <p className="mt-1 font-medium">
                        No estimate recorded. A manual quote is required.
                      </p>
                    ) : (
                      <p className="mt-1 font-medium">
                        Recorded estimate: {selected.estimatedFare} SAR · not a confirmed fare
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Route details · {selected.zone}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="booking-pickup-text">Pickup description</Label>
                    <Textarea
                      id="booking-pickup-text"
                      value={draft.pickupText}
                      onChange={(event) =>
                        setDraft((current) =>
                          current ? { ...current, pickupText: event.target.value } : current,
                        )
                      }
                      rows={2}
                      disabled={busy}
                    />
                  </div>
                  <div className={busy ? "pointer-events-none opacity-60" : undefined}>
                    <MapPicker
                      zone={selected.zone}
                      departure={draft.departure}
                      destination={draft.destination}
                      activeField={activeField}
                      onActiveFieldChange={setActiveField}
                      onPick={changePoint}
                      onReset={resetPoint}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Changing route details never recalculates the fare. Saving changes invalidates
                    the current estimate and requires a manual quote.
                  </p>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => void saveChanges()}
                      disabled={!dirty || busy}
                    >
                      <Save className="me-2 size-4" /> {busy ? "Saving…" : "Save route changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="flex min-h-40 items-center justify-center shadow-card">
              <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                Select a booking to review its details and route.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words font-medium">{value}</p>
    </div>
  );
}
