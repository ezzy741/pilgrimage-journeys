import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, ShieldCheck, Sparkles } from "lucide-react";
import makkahImg from "@/assets/makkah.jpg";
import madinahImg from "@/assets/madinah.jpg";
import offersImg from "@/assets/offers.jpg";
import { useI18n } from "@/lib/i18n";
import { fareConfigs, promotions } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ziyarat Ride — Makkah & Madinah Ziyarat Transport" },
      {
        name: "description",
        content:
          "Book trusted Ziyarat rides in Makkah and Madinah. Transparent fares, verified drivers, sedan to minibus options.",
      },
      { property: "og:title", content: "Ziyarat Ride — Makkah & Madinah Ziyarat Transport" },
      {
        property: "og:description",
        content: "Trusted Ziyarat transport with transparent fares across Makkah and Madinah.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useI18n();
  const makkah = fareConfigs.find((f) => f.zone === "makkah")!;
  const madinah = fareConfigs.find((f) => f.zone === "madinah")!;
  const combo = promotions.find((p) => p.targetCard === "combo" && p.active);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={makkahImg}
            alt="Makkah skyline at golden hour"
            width={1024}
            height={768}
            className="size-full object-cover"
          />
          <div className="absolute inset-0 gradient-holy opacity-85" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-primary-foreground sm:py-24">
          <Badge className="gradient-gold border-0 text-accent-foreground">
            <Sparkles className="me-1 size-3" /> Makkah · Madinah
          </Badge>
          <h1 className="mt-4 max-w-xl text-4xl font-bold leading-tight sm:text-5xl">
            {t("hero_title")}
          </h1>
          <p className="mt-3 max-w-lg text-primary-foreground/80">{t("hero_sub")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="gradient-gold border-0 text-accent-foreground">
              <Link to="/ziyarat/makkah">
                {t("hero_cta")} <ArrowRight className="ms-1 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/offers">{t("nav_offers")}</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-5 text-sm text-primary-foreground/80">
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4" /> Verified drivers
            </span>
            <span className="flex items-center gap-2">
              <Clock className="size-4" /> 24/7 availability
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-5 md:grid-cols-3">
          <ServiceCard
            to="/ziyarat/makkah"
            image={makkahImg}
            title={t("makkah_title")}
            subtitle={t("makkah_sub")}
            price={`${t("from")} ${makkah.baseFare} ${t("currency")}`}
          />
          <ServiceCard
            to="/ziyarat/madinah"
            image={madinahImg}
            title={t("madinah_title")}
            subtitle={t("madinah_sub")}
            price={`${t("from")} ${madinah.baseFare} ${t("currency")}`}
          />
          <ServiceCard
            to="/offers"
            image={offersImg}
            title={t("offers_title")}
            subtitle={t("offers_sub")}
            price={combo?.bannerText ?? "Seasonal deals"}
            badge={combo ? `Save ${combo.discountPercentage}%` : undefined}
          />
        </div>
      </section>
    </div>
  );
}

function ServiceCard(props: {
  to: string;
  image: string;
  title: string;
  subtitle: string;
  price: string;
  badge?: string;
}) {
  return (
    <Link
      to={props.to}
      className="group relative block overflow-hidden rounded-2xl shadow-card transition-transform hover:-translate-y-1"
    >
      <img
        src={props.image}
        alt={props.title}
        loading="lazy"
        width={1024}
        height={768}
        className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent" />
      {props.badge && (
        <span className="gradient-gold absolute end-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-accent-foreground">
          {props.badge}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-4 text-primary-foreground">
        <h2 className="text-lg font-semibold">{props.title}</h2>
        <p className="text-xs text-primary-foreground/75">{props.subtitle}</p>
        <p className="mt-2 text-sm font-bold text-accent">{props.price}</p>
      </div>
    </Link>
  );
}
