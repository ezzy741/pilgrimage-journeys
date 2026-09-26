import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, MapPinned } from "lucide-react";
import makkahImg from "@/assets/makkah.jpg";
import madinahImg from "@/assets/madinah.jpg";
import offersImg from "@/assets/offers.jpg";
import { fareConfigs, promotions } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { useI18n, type Lang } from "@/lib/i18n";

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { t, lang, setLang } = useI18n();
  const makkah = fareConfigs.find((f) => f.zone === "makkah");
  const madinah = fareConfigs.find((f) => f.zone === "madinah");
  const combo = promotions.find((p) => p.targetCard === "combo" && p.active);
  const langs: Lang[] = ["en", "ar", "ur"];

  return (
    <main className="px-3 py-3 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto grid max-w-7xl overflow-hidden border border-border bg-card shadow-card md:grid-cols-[96px_minmax(0,1fr)]">
        <aside className="flex min-h-16 items-center justify-between gap-4 bg-primary px-4 text-primary-foreground md:min-h-[720px] md:flex-col md:px-2 md:py-8">
          <Link to="/" aria-label={t("brand")} className="flex items-center gap-2 font-display text-lg font-extrabold uppercase md:my-10 md:[writing-mode:vertical-rl] md:rotate-180">
            <MapPinned className="size-5 shrink-0 md:rotate-180" /> Ziyarat
          </Link>
          <div className="flex items-center gap-1 md:flex-col md:gap-2" aria-label="Language">
            {langs.map((l) => (
              <Button key={l} size="sm" variant="ghost" onClick={() => setLang(l)} aria-label={`Switch to ${l}`} aria-pressed={lang === l}
                className={`h-9 w-9 rounded-none p-0 text-xs font-bold hover:bg-accent hover:text-accent-foreground ${lang === l ? "bg-accent text-accent-foreground" : "text-primary-foreground"}`}
              >{l.toUpperCase()}</Button>
            ))}
          </div>
        </aside>

        <div className="min-w-0">
          <nav aria-label="Main navigation" className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 border-b border-border px-5 py-4 text-xs font-extrabold uppercase sm:px-10 lg:px-14">
            <Link className="transition-colors hover:text-muted-foreground" to="/offers">{t("nav_offers")}</Link>
            <Link className="transition-colors hover:text-muted-foreground" to="/driver">{t("nav_driver")}</Link>
            <Link className="transition-colors hover:text-muted-foreground" to="/admin">{t("nav_admin")}</Link>
          </nav>
          <div className="grid lg:min-h-[650px] lg:grid-cols-12">
            <section className="flex min-w-0 flex-col justify-center px-5 py-12 sm:px-10 lg:col-span-7 lg:px-12 lg:py-14 xl:px-16">
              <span className="w-fit bg-accent px-3 py-1.5 text-[10px] font-extrabold uppercase text-accent-foreground sm:text-xs">{t("hero_kicker")}</span>
              <h1 className="mt-7 max-w-full font-display text-[clamp(2.6rem,5vw,5.5rem)] font-extrabold leading-[1.04] uppercase [overflow-wrap:anywhere]">
                {t("hero_line_1")}<br />
                <span className="outline-word">{t("hero_line_2")}</span><br />
                {t("hero_line_3")}
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">{t("hero_sub")}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 rounded-none px-6 font-bold uppercase transition-transform hover:-translate-y-1">
                  <Link to="/ziyarat/makkah">{t("hero_cta")} <ArrowUpRight className="ms-2 size-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-none border-2 border-primary px-6 font-bold uppercase transition-transform hover:-translate-y-1 hover:bg-primary hover:text-primary-foreground">
                  <Link to="/offers">{t("nav_offers")}</Link>
                </Button>
              </div>
              <div className="mt-14 grid grid-cols-3 gap-2 border-t border-border pt-6 sm:gap-5">
                <QuickLink to="/ziyarat/makkah" label={t("makkah_title")} detail={`${t("from")} ${makkah?.baseFare ?? 150} ${t("currency")}`} />
                <QuickLink to="/ziyarat/madinah" label={t("madinah_title")} detail={`${t("from")} ${madinah?.baseFare ?? 120} ${t("currency")}`} />
                <QuickLink to="/offers" label={t("nav_offers")} detail={combo ? `${combo.discountPercentage}% ${t("discount")}` : t("offers_sub")} />
              </div>
            </section>

            <section aria-label="Makkah and Madinah" className="relative min-h-[430px] overflow-hidden bg-secondary lg:col-span-5 lg:min-h-full">
              <div className="hero-cutout absolute inset-y-0 end-0 h-[78%] w-[88%] overflow-hidden">
                <img src={makkahImg} alt="Masjid al-Haram in Makkah" className="size-full object-cover" width={1024} height={768} />
              </div>
              <div className="absolute bottom-8 start-4 z-10 h-[48%] w-[67%] rotate-3 overflow-hidden border-8 border-card shadow-card sm:start-6 lg:-start-5">
                <img src={madinahImg} alt="The Prophet's Mosque in Madinah" className="size-full object-cover" width={1024} height={768} />
              </div>
              <div className="absolute bottom-5 end-5 z-20 flex size-24 -rotate-12 items-center justify-center rounded-full bg-accent px-3 text-center font-display text-xs font-extrabold uppercase leading-tight text-accent-foreground shadow-card sm:size-28 sm:text-sm">
                Makkah<br />& Madinah
              </div>
            </section>
          </div>
        </div>
      </div>
      <section className="mx-auto max-w-7xl pb-8 pt-12 sm:pt-16" aria-label="Destinations and offers">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div><p className="text-xs font-extrabold uppercase text-muted-foreground">ZIYARAT RIDE / 01</p><h2 className="mt-2 text-2xl font-extrabold uppercase sm:text-3xl">{t("makkah_title")} · {t("madinah_title")}</h2></div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <ServiceCard to="/ziyarat/makkah" image={makkahImg} title={t("makkah_title")} subtitle={t("makkah_sub")} price={`${t("from")} ${makkah?.baseFare ?? 150} ${t("currency")}`} />
          <ServiceCard to="/ziyarat/madinah" image={madinahImg} title={t("madinah_title")} subtitle={t("madinah_sub")} price={`${t("from")} ${madinah?.baseFare ?? 120} ${t("currency")}`} />
          <ServiceCard to="/offers" image={offersImg} title={t("offers_title")} subtitle={t("offers_sub")} price={combo?.bannerText ?? t("offers_sub")} badge={combo ? `${combo.discountPercentage}% ${t("discount")}` : undefined} />
        </div>
      </section>
    </div>
  );
}

function QuickLink({ to, label, detail }: { to: string; label: string; detail: string }) {
  return <Link to={to} className="group min-w-0 text-start">
    <span className="block break-words font-display text-xs font-bold uppercase transition-colors group-hover:text-muted-foreground sm:text-base">{label}</span>
    <span className="mt-1 block text-[10px] font-semibold uppercase text-muted-foreground sm:text-xs">{detail}</span>
  </Link>;
}

function ServiceCard(props: {
  to: string;
  image: string;
  title: string;
  subtitle: string;
  price: string;
  badge?: string | undefined;
}) {
  return (
    <Link
      to={props.to}
      className="group relative block overflow-hidden bg-primary shadow-card transition-transform hover:-translate-y-1"
    >
      <img
        src={props.image}
        alt={props.title}
        loading="lazy"
        width={1024}
        height={768}
        className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />
      {props.badge && (
        <span className="absolute end-3 top-3 bg-accent px-3 py-1 text-xs font-bold uppercase text-accent-foreground">
          {props.badge}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-4 text-primary-foreground">
        <h3 className="font-display text-lg font-bold uppercase">{props.title}</h3>
        <p className="text-xs text-primary-foreground/75">{props.subtitle}</p>
        <p className="mt-2 text-sm font-bold text-primary-foreground">{props.price} <ArrowUpRight className="ms-1 inline size-4" /></p>
      </div>
    </Link>
  );
}
