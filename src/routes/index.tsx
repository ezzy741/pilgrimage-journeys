import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Clock, MapPinned, ShieldCheck, Sparkles } from "lucide-react";
import makkahImg from "@/assets/makkah.jpg";
import madinahImg from "@/assets/madinah.jpg";
import offersImg from "@/assets/offers.jpg";
import { useI18n } from "@/lib/i18n";
import { fareConfigs, promotions } from "@/lib/mock-data";
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
  const makkah = fareConfigs.find((fare) => fare.zone === "makkah")!;
  const madinah = fareConfigs.find((fare) => fare.zone === "madinah")!;
  const combo = promotions.find(
    (promotion) => promotion.targetCard === "combo" && promotion.active,
  );

  return (
    <div>
      <section className="ride-hero relative isolate overflow-hidden">
        <div className="ride-hero__media absolute inset-0" aria-hidden="true">
          <img
            src={makkahImg}
            alt=""
            width={1024}
            height={768}
            className="ride-hero__image size-full object-cover"
          />
          <div className="ride-hero__veil absolute inset-0" />
          <div className="ride-hero__pattern absolute inset-0" />
        </div>

        <div className="ride-hero__inner relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-[1fr_0.8fr] md:items-center md:gap-16 md:py-24 lg:px-8">
          <div className="ride-hero__copy max-w-2xl">
            <div className="ride-hero__eyebrow">
              <span className="ride-hero__eyebrow-mark">
                <Sparkles className="size-3.5" aria-hidden="true" />
              </span>
              <span>{t("brand")}</span>
              <span aria-hidden="true">·</span>
              <span>{t("makkah_title")}</span>
              <span aria-hidden="true">·</span>
              <span>{t("madinah_title")}</span>
            </div>

            <h1 className="ride-hero__title mt-6 max-w-[13ch] text-4xl font-bold leading-tight sm:text-6xl">
              {t("hero_title")}
            </h1>
            <p className="ride-hero__subtitle mt-5 max-w-lg text-base leading-7 sm:text-lg">
              {t("hero_sub")}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="ride-button-primary">
                <Link to="/ziyarat/makkah" className="inline-flex items-center gap-2">
                  {t("hero_cta")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="ride-button-secondary">
                <Link to="/offers" className="inline-flex items-center gap-2">
                  {t("nav_offers")}
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <div className="ride-hero__trust mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm">
              <span className="inline-flex items-center gap-2">
                <span className="ride-hero__trust-icon">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                </span>
                {t("verified_drivers")}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="ride-hero__trust-icon">
                  <Clock className="size-4" aria-hidden="true" />
                </span>
                {t("availability")}
              </span>
            </div>
          </div>

          <aside className="ride-hero__booking-card" aria-label={t("select_places")}>
            <div className="ride-hero__booking-head">
              <span className="ride-hero__booking-icon">
                <MapPinned className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="ride-hero__booking-kicker">{t("brand")}</p>
                <h2 className="ride-hero__booking-title">{t("select_places")}</h2>
              </div>
            </div>
            <div className="ride-hero__fare-list">
              <RoutePriceRow
                to="/ziyarat/makkah"
                name={t("makkah_title")}
                fromLabel={t("from")}
                amount={makkah.baseFare}
                currency={t("currency")}
              />
              <RoutePriceRow
                to="/ziyarat/madinah"
                name={t("madinah_title")}
                fromLabel={t("from")}
                amount={madinah.baseFare}
                currency={t("currency")}
              />
            </div>
          </aside>
        </div>
      </section>

      <section className="ride-services mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="ride-services__intro mb-7 sm:mb-9">
          <div>
            <p className="ride-services__eyebrow">{t("brand")}</p>
            <h2 className="ride-services__title">{t("discover_title")}</h2>
          </div>
          <p className="ride-services__note">{t("discover_sub")}</p>
        </div>

        <div className="grid gap-5 md:grid-cols-3 xl:gap-6">
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

function RoutePriceRow(props: {
  to: "/ziyarat/makkah" | "/ziyarat/madinah";
  name: string;
  fromLabel: string;
  amount: number;
  currency: string;
}) {
  return (
    <Link
      to={props.to}
      aria-label={`${props.name}: ${props.fromLabel} ${props.amount} ${props.currency}`}
      className="ride-hero__fare-row"
    >
      <span className="ride-hero__fare-marker" aria-hidden="true" />
      <span className="ride-hero__fare-name">{props.name}</span>
      <span className="ride-hero__fare-price">
        {props.fromLabel}{" "}
        <strong>
          {props.amount} {props.currency}
        </strong>
      </span>
      <span className="ride-hero__fare-arrow" aria-hidden="true">
        <ArrowUpRight className="size-4" />
      </span>
    </Link>
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
    <Link to={props.to} className="ride-service-card group relative block overflow-hidden">
      <img
        src={props.image}
        alt={props.title}
        loading="lazy"
        width={1024}
        height={768}
        className="ride-service-card__image size-full object-cover"
      />
      <span className="ride-service-card__overlay" aria-hidden="true" />
      <span className="ride-service-card__top">
        {props.badge ? (
          <span className="ride-service-card__badge">{props.badge}</span>
        ) : (
          <span className="ride-service-card__spacer" aria-hidden="true" />
        )}
        <span className="ride-service-card__action" aria-hidden="true">
          <ArrowUpRight className="size-4" />
        </span>
      </span>
      <span className="ride-service-card__content">
        <span className="ride-service-card__subtitle">{props.subtitle}</span>
        <span className="ride-service-card__title">{props.title}</span>
        <span className="ride-service-card__bottom">
          <span className="ride-service-card__price">{props.price}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}
