import { useCallback, useEffect, useRef, useState } from "react";
import { CarFront, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n, type Lang } from "@/lib/i18n";
import type { BookingTrackingStatus, TripStatus } from "@/lib/booking-types";

const POLL_INTERVAL_MS = 15_000;
const REQUEST_TIMEOUT_MS = 10_000;

const STATUS_LABELS: Record<Lang, Record<TripStatus, string>> = {
  en: {
    pending_review: "Pending review",
    quote_requested: "Quote requested",
    confirmed: "Confirmed",
    driver_assigned: "Driver assigned",
    en_route: "Driver en route",
    arrived: "Driver arrived",
    in_progress: "Journey in progress",
    completed: "Completed",
    cancelled: "Cancelled",
  },
  ar: {
    pending_review: "بانتظار المراجعة",
    quote_requested: "طُلب عرض سعر",
    confirmed: "تم التأكيد",
    driver_assigned: "تم تعيين السائق",
    en_route: "السائق في الطريق",
    arrived: "وصل السائق",
    in_progress: "الرحلة جارية",
    completed: "اكتملت الرحلة",
    cancelled: "أُلغيت الرحلة",
  },
  ur: {
    pending_review: "جائزے کے انتظار میں",
    quote_requested: "کرایے کی درخواست بھیجی گئی",
    confirmed: "تصدیق ہو گئی",
    driver_assigned: "ڈرائیور مقرر ہو گیا",
    en_route: "ڈرائیور راستے میں ہے",
    arrived: "ڈرائیور پہنچ گیا",
    in_progress: "سفر جاری ہے",
    completed: "سفر مکمل ہو گیا",
    cancelled: "سفر منسوخ ہو گیا",
  },
};

type BookingTrackingCopy = {
  [
    key in
      | "title"
      | "refresh"
      | "booking"
      | "lastUpdated"
      | "driver"
      | "vehicle"
      | "arrivedNotice"
      | "updates"
      | "privacy"
      | "stopped"
      | "loading"
      | "unavailable"
      | "failed"
      | "timeout"
  ]: string;
};

const COPY: Record<Lang, BookingTrackingCopy> = {
  en: {
    title: "Ride tracking",
    refresh: "Refresh",
    booking: "Booking",
    lastUpdated: "Last updated",
    driver: "Driver:",
    vehicle: "Vehicle:",
    arrivedNotice: "Your driver has been marked as arrived by the booking team.",
    updates:
      "Updates are entered by the booking team. Live GPS location and an estimated arrival time are not available.",
    privacy: "Tracking access is held only in this page’s memory and is not saved to your device.",
    stopped: "This ride is no longer receiving status updates.",
    loading: "Loading your latest booking status…",
    unavailable: "Tracking is unavailable. Check your booking receipt and try again.",
    failed: "Tracking could not be refreshed.",
    timeout: "Tracking request timed out. Please try again.",
  },
  ar: {
    title: "متابعة الرحلة",
    refresh: "تحديث",
    booking: "الحجز",
    lastUpdated: "آخر تحديث",
    driver: "السائق:",
    vehicle: "المركبة:",
    arrivedNotice: "أبلغ فريق الحجز بوصول السائق.",
    updates: "يُدخل فريق الحجز التحديثات. لا يتوفر موقع GPS مباشر أو وقت وصول متوقع.",
    privacy: "تظل بيانات الوصول إلى التتبع في ذاكرة هذه الصفحة فقط، ولا تُحفظ على جهازك.",
    stopped: "لم تعد هذه الرحلة تتلقى تحديثات الحالة.",
    loading: "جارٍ تحميل أحدث حالة للحجز…",
    unavailable: "التتبع غير متاح. تحقق من إيصال الحجز وحاول مرة أخرى.",
    failed: "تعذر تحديث حالة التتبع.",
    timeout: "انتهت مهلة طلب التتبع. يُرجى المحاولة مرة أخرى.",
  },
  ur: {
    title: "سفر کی ٹریکنگ",
    refresh: "تازہ کریں",
    booking: "بکنگ",
    lastUpdated: "آخری تازہ کاری",
    driver: "ڈرائیور:",
    vehicle: "گاڑی:",
    arrivedNotice: "بکنگ ٹیم نے بتایا ہے کہ ڈرائیور پہنچ گیا ہے۔",
    updates: "تازہ معلومات بکنگ ٹیم درج کرتی ہے۔ لائیو GPS مقام اور متوقع آمد کا وقت دستیاب نہیں۔",
    privacy: "ٹریکنگ تک رسائی صرف اسی صفحے کی میموری میں رہتی ہے اور آپ کے آلے پر محفوظ نہیں ہوتی۔",
    stopped: "اس سفر کے لیے اب اسٹیٹس اپ ڈیٹس نہیں آ رہیں۔",
    loading: "بکنگ کی تازہ ترین معلومات لوڈ ہو رہی ہیں…",
    unavailable: "ٹریکنگ دستیاب نہیں۔ اپنی بکنگ رسید دیکھ کر دوبارہ کوشش کریں۔",
    failed: "ٹریکنگ تازہ نہیں ہو سکی۔",
    timeout: "ٹریکنگ کی درخواست کا وقت ختم ہو گیا۔ دوبارہ کوشش کریں۔",
  },
};

/** Customer-only status view. The tracking capability stays in page memory and is sent only in POST bodies. */
export function BookingTracking({ id, trackingToken }: { id: string; trackingToken: string }) {
  const { lang } = useI18n();
  const copy = COPY[lang];
  const [tracking, setTracking] = useState<BookingTrackingStatus | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!id || !trackingToken || activeRequest.current) return;

    const controller = new AbortController();
    activeRequest.current = controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);
    setLoading(true);

    try {
      const response = await fetch("/api/bookings/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, trackingToken }),
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(copy.unavailable);
      const payload = (await response.json()) as BookingTrackingStatus;
      setTracking(payload);
      setError("");
    } catch (cause) {
      if (timedOut) {
        setError(copy.timeout);
      } else if (!(cause instanceof DOMException && cause.name === "AbortError")) {
        setError(
          cause instanceof Error && cause.message === copy.unavailable
            ? copy.unavailable
            : copy.failed,
        );
      }
    } finally {
      window.clearTimeout(timeout);
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  }, [copy, id, trackingToken]);

  const terminal = tracking?.status === "completed" || tracking?.status === "cancelled";

  useEffect(() => {
    if (terminal) return;
    void refresh();
    const timer = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
      activeRequest.current?.abort();
      activeRequest.current = null;
    };
  }, [refresh, terminal]);

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CarFront className="size-4" /> {copy.title}
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refresh()}
          disabled={loading}
        >
          <RefreshCw className={`me-2 size-4 ${loading ? "animate-spin" : ""}`} /> {copy.refresh}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {tracking ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">
                {copy.booking} <bdi>{tracking.reference}</bdi>
              </span>
              <Badge variant="secondary">{STATUS_LABELS[lang][tracking.status]}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {copy.lastUpdated}{" "}
              {new Date(tracking.updatedAt).toLocaleString(
                lang === "ar" ? "ar-SA" : lang === "ur" ? "ur-PK" : "en",
              )}
            </p>
            {tracking.driverDisplayName || tracking.vehiclePlate || tracking.vehicleModel ? (
              <div className="rounded-lg border p-3 text-sm">
                {tracking.driverDisplayName && (
                  <p>
                    <span className="text-muted-foreground">{copy.driver}</span>{" "}
                    {tracking.driverDisplayName}
                  </p>
                )}
                {(tracking.vehicleModel || tracking.vehiclePlate) && (
                  <p>
                    <span className="text-muted-foreground">{copy.vehicle}</span>{" "}
                    {[tracking.vehicleModel, tracking.vehiclePlate].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            ) : null}
            {tracking.status === "arrived" && (
              <p role="status" className="rounded-lg bg-secondary p-3 text-sm font-medium">
                {copy.arrivedNotice}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{copy.updates}</p>
            <p className="text-xs text-muted-foreground">{copy.privacy}</p>
            {terminal && <p className="text-xs text-muted-foreground">{copy.stopped}</p>}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
