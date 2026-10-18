import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, TicketPercent } from "lucide-react";
import { toast } from "sonner";
import offersImg from "@/assets/offers.jpg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { promotions } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "Special Ziyarat Offers — Combo Packages & Discounts" },
      {
        name: "description",
        content:
          "Active promo codes and discounted Ziyarat packages for Makkah, Madinah and combo tours.",
      },
      { property: "og:title", content: "Special Ziyarat Offers" },
      {
        property: "og:description",
        content: "Save up to 20% on Makkah and Madinah Ziyarat rides.",
      },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  const { t, lang } = useI18n();
  const active = promotions.filter(
    (p) => p.active && Date.parse(`${p.expiresAt}T23:59:59+03:00`) >= Date.now(),
  );
  const comboNote =
    lang === "ar"
      ? "العرض المشترك يحتاج عرض سعر منفصل للمدينتين؛ لا يُطبّق تلقائيًا على طلب مدينة واحدة."
      : lang === "ur"
        ? "مشترکہ سفر کے لیے دو شہروں کا الگ کوٹیشن درکار ہے؛ یہ کوڈ ایک شہر کی درخواست پر خودکار لاگو نہیں ہوتا۔"
        : "The combo requires a separate two-city quote; this code is not automatically applied to a single-city request.";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="relative overflow-hidden rounded-2xl shadow-card">
        <img
          src={offersImg}
          alt="Islamic geometric promotional banner"
          loading="lazy"
          width={1024}
          height={768}
          className="h-40 w-full object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-center bg-primary/70 p-6 text-primary-foreground">
          <h1 className="text-2xl font-bold">{t("offers_title")}</h1>
          <p className="text-sm text-primary-foreground/80">{t("offers_sub")}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {active.map((p) => (
          <Card key={p.id} className="geo-border shadow-card">
            <CardContent className="space-y-3 pt-6">
              <Badge className="gradient-gold border-0 text-accent-foreground">
                Save {p.discountPercentage}%
              </Badge>
              <p className="font-semibold">{p.bannerText}</p>
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="size-3" /> Valid until {p.expiresAt}
              </p>
              <div className="flex items-center justify-between rounded-lg border border-dashed border-accent/50 bg-accent/5 px-3 py-2">
                <span className="flex items-center gap-2 font-mono text-sm font-semibold text-primary">
                  <TicketPercent className="size-4" />
                  {p.code}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard?.writeText(p.code);
                    toast.success(`${p.code} copied`);
                  }}
                >
                  Copy
                </Button>
              </div>
              {p.targetCard === "combo" && (
                <p className="text-xs text-muted-foreground">{comboNote}</p>
              )}
              <Button asChild className="w-full">
                <Link to={p.targetCard === "madinah" ? "/ziyarat/madinah" : "/ziyarat/makkah"}>
                  {lang === "ar"
                    ? "عرض خيارات الحجز"
                    : lang === "ur"
                      ? "بکنگ کے اختیارات دیکھیں"
                      : "View booking options"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
