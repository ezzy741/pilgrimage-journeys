import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BusFront,
  Compass,
  Landmark,
  Map,
  MapPin,
  Menu,
  Route as RouteIcon,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapPicker } from "@/components/MapPicker";
import { useI18n, type Lang } from "@/lib/i18n";
import { destinations, type Destination } from "@/lib/destinations";
import { DEFAULT_ORIGIN_POINTS, type MapEndpoint, type MapPoint } from "@/lib/map-locations";
import { fareConfigs, stops, type Zone } from "@/lib/mock-data";
import { readMapDraft, writeMapDraft } from "@/lib/map-draft";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visit Hijaz — Discover meaningful journeys across Saudi Arabia" },
      {
        name: "description",
        content:
          "Explore Makkah and Madinah ziyarat, see starting fares, and choose map pins before continuing to a booking request.",
      },
      { property: "og:title", content: "Visit Hijaz — Discover meaningful journeys" },
      {
        property: "og:description",
        content: "Explore Makkah and Madinah ziyarat and plan a journey through the Hijaz.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

type CityName = "Makkah" | "Madinah" | "AlUla" | "Taif";
interface HomeCopy {
  tagline: string;
  eyebrow: string;
  headline: string;
  intro: string;
  explore: string;
  mapCta: string;
  navLabel: string;
  navCities: string;
  navMap: string;
  navOffers: string;
  navDriver: string;
  navAdmin: string;
  menu: string;
  closeMenu: string;
  citiesEyebrow: string;
  citiesTitle: string;
  citiesIntro: string;
  allCities: string;
  cityNames: Record<CityName, string>;
  makkahBadge: string;
  madinahBadge: string;
  mustVisitBadge: string;
  natureBadge: string;
  ziyaratCategory: string;
  historicCategory: string;
  destinationCategory: string;

  timingNote: string;
  inspirationLabel: string;
  placesLabel: string;
  from: string;
  sar: string;
  fareNotice: string;
  comboEyebrow: string;
  comboTitle: string;
  comboBody: string;
  comboExpiry: string;
  comboCta: string;
  bookCity: string;
  exploreOnly: string;
  noCityResults: string;
  mapEyebrow: string;
  mapTitle: string;
  mapIntro: string;
  mapCenter: string;
  mapOriginMakkah: string;
  mapOriginMadinah: string;
  clearPins: string;
  mapPrivacy: string;
  mapFareNotice: string;
  continueBooking: string;
  driverPending: string;
  adminStage: string;
  adminPortal: string;
  footerTagline: string;
}

const copy: Record<Lang, HomeCopy> = {
  en: {
    tagline: "Meaningful journeys across the Hijaz",
    eyebrow: "A thoughtful way to explore",
    headline: "Let the journey bring you closer.",
    intro:
      "Explore the landmarks of Makkah and Madinah, find a starting fare, and choose your route at your own pace.",
    explore: "Explore destinations",
    mapCta: "Choose map points",
    navLabel: "Explore Visit Hijaz",
    navCities: "Destinations",
    navMap: "Plan on the map",
    navOffers: "Offers",
    navDriver: "Driver registration",
    navAdmin: "Admin",
    menu: "Open navigation",
    closeMenu: "Close navigation",
    citiesEyebrow: "PLACES TO REMEMBER",
    citiesTitle: "Choose the city that calls to you",
    citiesIntro:
      "Browse the cities and their highlights. For Makkah and Madinah, continue to the genuine booking page when you are ready.",
    allCities: "All places",
    cityNames: { Makkah: "Makkah", Madinah: "Madinah", AlUla: "AlUla", Taif: "Taif" },
    makkahBadge: "Ziyarat rides",
    madinahBadge: "Ziyarat rides",
    mustVisitBadge: "Must visit",
    natureBadge: "Nature escape",
    ziyaratCategory: "Ziyarat",
    historicCategory: "Historical sites",
    destinationCategory: "Destination information",

    timingNote: "Timing confirmed after review",
    inspirationLabel: "Destination information",
    placesLabel: "Places to explore",
    from: "Starting fare",
    sar: "SAR",
    fareNotice:
      "Starting fares are base fares only. Distance, vehicle choice, applicable adjustments and business confirmation affect the final fare; no final fare or ride availability is promised here.",
    comboEyebrow: "CURRENT COMBO OFFER",
    comboTitle: "Makkah + Madinah",
    comboBody: "Save 20% on the Makkah and Madinah combo offer.",
    comboExpiry: "Offer through 31 December 2026. Terms and booking confirmation apply.",
    comboCta: "See offer details",
    bookCity: "Continue to booking",
    exploreOnly: "Destination details only",
    noCityResults: "No destinations match this city filter.",
    mapEyebrow: "PLAN YOUR ROUTE",
    mapTitle: "Set your pins on the free map",
    mapIntro:
      "Pick a city, choose a departure or destination pin, then click the map. Your pins stay in this browser session only.",
    mapCenter: "Map starts near",
    mapOriginMakkah: "Masjid al-Haram",
    mapOriginMadinah: "Masjid an-Nabawi",
    clearPins: "Clear both pins",
    mapPrivacy:
      "Only the selected city and pin coordinates are kept in session storage; no name, phone or other customer details are stored here. No location permission is requested.",
    mapFareNotice:
      "Map pins do not calculate a route or fare. Custom points need a manual quote; the booking page explains fare estimates and confirmation.",
    continueBooking: "Continue to booking",
    driverPending: "Driver sign-up · portal pending deployment",
    adminStage: "Admin (stage site)",
    adminPortal: "Admin portal",
    footerTagline: "Considered journeys, made simple.",
  },
  ar: {
    tagline: "رحلات هادفة في أرجاء الحجاز",
    eyebrow: "طريقة هادئة للاستكشاف",
    headline: "رحلة تقرّبك من المعنى.",
    intro: "اكتشف معالم مكة والمدينة، واطّلع على أجرة البداية، واختر مسارك على مهل.",
    explore: "اكتشف الوجهات",
    mapCta: "اختر نقاط الخريطة",
    navLabel: "استكشف زيارة الحجاز",
    navCities: "الوجهات",
    navMap: "خطط على الخريطة",
    navOffers: "العروض",
    navDriver: "تسجيل السائقين",
    navAdmin: "الإدارة",
    menu: "فتح قائمة التنقل",
    closeMenu: "إغلاق قائمة التنقل",
    citiesEyebrow: "أماكن لا تُنسى",
    citiesTitle: "اختر المدينة التي تناديك",
    citiesIntro:
      "تصفّح المدن وأبرز معالمها. وعندما تكون مستعدًا، انتقل إلى صفحة الحجز الفعلية لمكة أو المدينة.",
    allCities: "كل الأماكن",
    cityNames: {
      Makkah: "مكة المكرمة",
      Madinah: "المدينة المنورة",
      AlUla: "العلا",
      Taif: "الطائف",
    },
    makkahBadge: "نقل للزيارات",
    madinahBadge: "نقل للزيارات",
    mustVisitBadge: "وجهة بارزة",
    natureBadge: "ملاذ طبيعي",
    ziyaratCategory: "زيارة",
    historicCategory: "مواقع تاريخية",
    destinationCategory: "معلومات سياحية",

    timingNote: "تُحدّد المدة بعد مراجعة الطلب",
    inspirationLabel: "معلومات عن الوجهة",
    placesLabel: "أماكن للاستكشاف",
    from: "أجرة البداية",
    sar: "ريال",
    fareNotice:
      "أجرة البداية هي الأجرة الأساسية فقط. تؤثر المسافة ونوع المركبة والتعديلات المطبقة وتأكيد الشركة في الأجرة النهائية؛ ولا نعد هنا بأجرة نهائية أو بتوفر رحلة.",
    comboEyebrow: "عرض مشترك حالي",
    comboTitle: "مكة المكرمة + المدينة المنورة",
    comboBody: "وفّر 20٪ على عرض مكة والمدينة المشترك.",
    comboExpiry: "العرض سارٍ حتى 31 ديسمبر 2026. تطبق الشروط ويخضع الحجز للتأكيد.",
    comboCta: "اطّلع على تفاصيل العرض",
    bookCity: "المتابعة إلى الحجز",
    exploreOnly: "معلومات الوجهة فقط",
    noCityResults: "لا توجد وجهات تطابق تصفية المدينة.",
    mapEyebrow: "خطط لمسارك",
    mapTitle: "حدد نقاطك على الخريطة المجانية",
    mapIntro:
      "اختر المدينة ونقطة الانطلاق أو الوجهة، ثم انقر على الخريطة. تبقى النقاط في جلسة المتصفح فقط.",
    mapCenter: "تبدأ الخريطة قرب",
    mapOriginMakkah: "المسجد الحرام",
    mapOriginMadinah: "المسجد النبوي",
    clearPins: "مسح النقطتين",
    mapPrivacy:
      "يُحفظ اختيار المدينة وإحداثيات النقاط فقط في تخزين جلسة المتصفح؛ ولا يُحفظ هنا الاسم أو الهاتف أو أي بيانات عميل أخرى. لا نطلب إذن الموقع.",
    mapFareNotice:
      "لا تحسب نقاط الخريطة مسارًا أو أجرة. تتطلب النقاط المخصصة عرض سعر يدويًا؛ وتوضح صفحة الحجز تقدير الأجرة والتأكيد.",
    continueBooking: "المتابعة إلى الحجز",
    driverPending: "تسجيل السائق · البوابة قيد التجهيز",
    adminStage: "الإدارة (الموقع التجريبي)",
    adminPortal: "بوابة الإدارة",
    footerTagline: "رحلات مدروسة، ببساطة.",
  },
  ur: {
    tagline: "حجاز بھر میں بامعنی سفر",
    eyebrow: "دریافت کا پُرسکون انداز",
    headline: "ایسا سفر جو آپ کو قریب لے آئے۔",
    intro:
      "مکہ اور مدینہ کے مقامات دریافت کریں، ابتدائی کرایہ دیکھیں اور اپنی رفتار سے راستہ منتخب کریں۔",
    explore: "منزلیں دریافت کریں",
    mapCta: "نقشے پر مقامات منتخب کریں",
    navLabel: "وزٹ حجاز دریافت کریں",
    navCities: "منزلیں",
    navMap: "نقشے پر منصوبہ بنائیں",
    navOffers: "آفرز",
    navDriver: "ڈرائیور رجسٹریشن",
    navAdmin: "ایڈمن",
    menu: "نیویگیشن کھولیں",
    closeMenu: "نیویگیشن بند کریں",
    citiesEyebrow: "یادگار مقامات",
    citiesTitle: "اپنی پسند کا شہر منتخب کریں",
    citiesIntro:
      "شہروں اور نمایاں مقامات کو دیکھیں۔ تیار ہونے پر مکہ یا مدینہ کے اصل بکنگ صفحے پر جائیں۔",
    allCities: "تمام مقامات",
    cityNames: { Makkah: "مکہ مکرمہ", Madinah: "مدینہ منورہ", AlUla: "العلا", Taif: "طائف" },
    makkahBadge: "زیارت کی سواری",
    madinahBadge: "زیارت کی سواری",
    mustVisitBadge: "ضرور دیکھیں",
    natureBadge: "قدرتی سیرگاہ",
    ziyaratCategory: "زیارت",
    historicCategory: "تاریخی مقامات",
    destinationCategory: "سیاحتی معلومات",

    timingNote: "دورانیہ درخواست کے جائزے کے بعد طے ہوگا",
    inspirationLabel: "منزل کے بارے میں معلومات",
    placesLabel: "دریافت کے مقامات",
    from: "ابتدائی کرایہ",
    sar: "سعودی ریال",
    fareNotice:
      "ابتدائی کرایہ صرف بنیادی کرایہ ہے۔ فاصلہ، گاڑی کا انتخاب، قابلِ اطلاق تبدیلیاں اور کاروبار کی تصدیق حتمی کرایے پر اثر انداز ہوتے ہیں؛ یہاں حتمی کرایے یا سواری کی دستیابی کا وعدہ نہیں۔",
    comboEyebrow: "موجودہ مشترکہ آفر",
    comboTitle: "مکہ + مدینہ",
    comboBody: "مکہ اور مدینہ کے مشترکہ پیکج پر 20٪ بچت۔",
    comboExpiry: "آفر 31 دسمبر 2026 تک۔ شرائط لاگو؛ بکنگ کی تصدیق ضروری ہے۔",
    comboCta: "آفر کی تفصیل دیکھیں",
    bookCity: "بکنگ جاری رکھیں",
    exploreOnly: "صرف منزل کی معلومات",
    noCityResults: "اس شہر کے فلٹر میں کوئی منزل نہیں ملی۔",
    mapEyebrow: "اپنے راستے کی منصوبہ بندی",
    mapTitle: "مفت نقشے پر اپنے مقامات نشان زد کریں",
    mapIntro:
      "شہر اور روانگی یا منزل کا پن منتخب کریں، پھر نقشے پر کلک کریں۔ پن صرف اسی براؤزر سیشن میں رہیں گے۔",
    mapCenter: "نقشہ یہاں کے قریب کھلے گا",
    mapOriginMakkah: "مسجد الحرام",
    mapOriginMadinah: "مسجد نبوی",
    clearPins: "دونوں پن صاف کریں",
    mapPrivacy:
      "صرف منتخب شہر اور پن کے نقاط سیشن اسٹوریج میں رکھے جاتے ہیں؛ یہاں نام، فون یا دیگر صارف کی تفصیل محفوظ نہیں ہوتی۔ مقام کی اجازت نہیں مانگی جاتی۔",
    mapFareNotice:
      "نقشے کے پن راستہ یا کرایہ نہیں نکالتے۔ حسبِ ضرورت مقامات کے لیے دستی کوٹیشن درکار ہے؛ بکنگ صفحہ تخمینے اور تصدیق واضح کرتا ہے۔",
    continueBooking: "بکنگ جاری رکھیں",
    driverPending: "ڈرائیور رجسٹریشن · پورٹل کی تیاری جاری ہے",
    adminStage: "ایڈمن (اسٹیج سائٹ)",
    adminPortal: "ایڈمن پورٹل",
    footerTagline: "سوچے سمجھے سفر، آسان انداز میں۔",
  },
};

const cityOrder: CityName[] = ["Makkah", "Madinah", "AlUla", "Taif"];
const bookingPaths: Record<Zone, "/ziyarat/makkah" | "/ziyarat/madinah"> = {
  makkah: "/ziyarat/makkah",
  madinah: "/ziyarat/madinah",
};
const bookingZones: Partial<Record<CityName, Zone>> = {
  Makkah: "makkah",
  Madinah: "madinah",
};
const featuredStopIds: Record<Zone, string[]> = {
  makkah: ["nour", "hira-district", "taneem", "mina", "arafat"],
  madinah: ["quba", "uhud", "qiblatayn", "seven"],
};
interface MapDraft {
  zone: Zone;
  departure: MapPoint | null;
  destination: MapPoint | null;
}

function Home() {
  const { lang, setLang, dir } = useI18n();
  const text = copy[lang];
  const [cityFilter, setCityFilter] = useState<CityName | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mapZone, setMapZone] = useState<Zone>("makkah");
  const [activeField, setActiveField] = useState<MapEndpoint>("departure");
  const [mapDraft, setMapDraft] = useState<MapDraft>({
    zone: "makkah",
    departure: null,
    destination: null,
  });
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    const saved = readMapDraft("makkah") ?? readMapDraft("madinah");
    if (saved) {
      setMapDraft(saved);
      setMapZone(saved.zone);
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    // The shared helper persists only zone plus departure/destination coordinates.
    writeMapDraft(mapDraft);
  }, [mapDraft, storageReady]);

  const visibleDestinations = destinations.filter(
    (destination) => cityFilter === null || destination.city === cityFilter,
  );
  const fareFor = (zone: Zone) => fareConfigs.find((fare) => fare.zone === zone)?.baseFare ?? 0;
  const mapCenter = DEFAULT_ORIGIN_POINTS[mapZone];
  const bookingPath = bookingPaths[mapZone];
  const mapOriginLabel = mapZone === "makkah" ? text.mapOriginMakkah : text.mapOriginMadinah;

  const chooseMapCity = (zone: Zone) => {
    setMapZone(zone);
    setMapDraft({ zone, departure: null, destination: null });
  };
  const setMapPin = (field: MapEndpoint, point: MapPoint) => {
    setMapDraft((draft) => ({ ...draft, [field]: point }));
  };
  const resetMapPin = (field: MapEndpoint) => {
    setMapDraft((draft) => ({ ...draft, [field]: null }));
  };
  const translatedCity = (city: string) => text.cityNames[city as CityName] ?? city;
  const translatedBadge = (destination: Destination) => {
    if (destination.id === "makkah") return text.makkahBadge;
    if (destination.id === "madinah") return text.madinahBadge;
    if (destination.id === "alula") return text.mustVisitBadge;
    return text.natureBadge;
  };
  const translatedCategory = (destination: Destination) => {
    if (destination.category === "Ziyarat") return text.ziyaratCategory;
    if (destination.category === "Historical Sites") return text.historicCategory;
    return text.destinationCategory;
  };
  const destinationPlaces = (destination: Destination) => {
    const zone = bookingZones[destination.city as CityName];
    if (!zone) return destination.highlights;
    return featuredStopIds[zone]
      .map((id) => stops[zone].find((stop) => stop.id === id))
      .filter((stop): stop is (typeof stops)[Zone][number] => Boolean(stop))
      .map((stop) => (lang === "ar" ? stop.nameAr : lang === "ur" ? stop.nameUr : stop.name));
  };
  const cityNav = (
    <nav aria-label={text.navLabel} className="vh-side-nav">
      <a href="#destinations" onClick={() => setMobileNavOpen(false)}>
        <Landmark aria-hidden="true" />
        {text.navCities}
      </a>
      <a href="#map" onClick={() => setMobileNavOpen(false)}>
        <Map aria-hidden="true" />
        {text.navMap}
      </a>
      <Link to="/offers" onClick={() => setMobileNavOpen(false)}>
        <Sparkles aria-hidden="true" />
        {text.navOffers}
      </Link>
      <a href="/drivers/register" onClick={() => setMobileNavOpen(false)}>
        <BusFront aria-hidden="true" />
        {text.navDriver}
      </a>
    </nav>
  );

  return (
    <main className="vh-home" dir={dir}>
      <div className="vh-page-shell">
        <section className="vh-hero" aria-labelledby="home-title">
          <header className="vh-hero-top">
            <Link to="/" className="vh-brand" aria-label="Visit Hijaz home">
              <span className="vh-brand-icon">
                <Compass aria-hidden="true" />
              </span>
              <span>
                visit hijaz<span className="vh-brand-dot">.</span>
              </span>
            </Link>
            <div className="vh-top-actions">
              <div className="vh-language-switch" aria-label="Language">
                {(["en", "ar", "ur"] as const).map((language) => (
                  <Button
                    key={language}
                    type="button"
                    size="sm"
                    variant={lang === language ? "default" : "ghost"}
                    aria-label={
                      language === "en" ? "English" : language === "ar" ? "العربية" : "اردو"
                    }
                    aria-pressed={lang === language}
                    onClick={() => setLang(language)}
                  >
                    {language.toUpperCase()}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="vh-mobile-menu-button"
                aria-label={mobileNavOpen ? text.closeMenu : text.menu}
                aria-expanded={mobileNavOpen}
                aria-controls="vh-mobile-navigation"
                onClick={() => setMobileNavOpen((open) => !open)}
              >
                {mobileNavOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
              </Button>
            </div>
          </header>
          <div className="vh-hero-grid">
            <div className="vh-hero-copy">
              <p className="vh-kicker">
                <Sparkles aria-hidden="true" />
                {text.eyebrow}
              </p>
              <h1 id="home-title">{text.headline}</h1>
              <p className="vh-hero-intro">{text.intro}</p>
              <div className="vh-hero-ctas">
                <a href="#destinations" className="vh-button vh-button-primary">
                  {text.explore}
                  <ArrowRight aria-hidden="true" />
                </a>
                <a href="#map" className="vh-button vh-button-quiet">
                  {text.mapCta}
                  <MapPin aria-hidden="true" />
                </a>
              </div>
            </div>
            <aside className="vh-hero-rail" aria-label={text.navLabel}>
              <p className="vh-rail-title">{text.tagline}</p>
              {cityNav}
              <div className="vh-rail-note">
                <span className="vh-rail-icon">
                  <RouteIcon aria-hidden="true" />
                </span>
                <span>
                  <strong>{text.mapTitle}</strong>
                  <small>{text.mapIntro}</small>
                </span>
              </div>
            </aside>
          </div>
          {mobileNavOpen && (
            <div id="vh-mobile-navigation" className="vh-mobile-navigation">
              {cityNav}
            </div>
          )}
          <div className="vh-hero-mark" aria-hidden="true">
            <span>VH</span>
          </div>
        </section>

        <section className="vh-fares" aria-label={text.from}>
          {(["makkah", "madinah"] as const).map((zone) => {
            const city = zone === "makkah" ? "Makkah" : "Madinah";
            return (
              <Link key={zone} to={bookingPaths[zone]} className="vh-fare-card">
                <span className="vh-fare-icon">
                  <MapPin aria-hidden="true" />
                </span>
                <span className="vh-fare-city">{translatedCity(city)}</span>
                <span className="vh-fare-value">
                  <small>{text.from}</small>
                  <strong>
                    {fareFor(zone)} <small>{text.sar}</small>
                  </strong>
                </span>
                <ArrowUpRight className="vh-fare-arrow" aria-hidden="true" />
              </Link>
            );
          })}
          <p className="vh-fare-note">{text.fareNotice}</p>
        </section>

        <section className="vh-offer" aria-labelledby="combo-title">
          <div className="vh-offer-mark" aria-hidden="true">
            <Sparkles />
          </div>
          <div className="vh-offer-copy">
            <p>{text.comboEyebrow}</p>
            <h2 id="combo-title">{text.comboTitle}</h2>
            <span>{text.comboBody}</span>
            <small>{text.comboExpiry}</small>
          </div>
          <Link to="/offers" className="vh-button vh-offer-button">
            {text.comboCta}
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </section>

        <section id="destinations" className="vh-destinations" aria-labelledby="destinations-title">
          <div className="vh-section-heading">
            <div>
              <p className="vh-section-eyebrow">{text.citiesEyebrow}</p>
              <h2 id="destinations-title">{text.citiesTitle}</h2>
              <p className="vh-section-intro">{text.citiesIntro}</p>
            </div>
            <span className="vh-heading-icon" aria-hidden="true">
              <Landmark />
            </span>
          </div>
          <div className="vh-city-filters" role="group" aria-label={text.navCities}>
            <button
              type="button"
              className={cityFilter === null ? "is-active" : ""}
              aria-pressed={cityFilter === null}
              onClick={() => setCityFilter(null)}
            >
              {text.allCities}
            </button>
            {cityOrder.map((city) => (
              <button
                type="button"
                key={city}
                className={cityFilter === city ? "is-active" : ""}
                aria-pressed={cityFilter === city}
                onClick={() => setCityFilter(city)}
              >
                {translatedCity(city)}
              </button>
            ))}
          </div>
          {visibleDestinations.length ? (
            <div className="vh-card-grid">
              {visibleDestinations.map((destination) => {
                const zone = bookingZones[destination.city as CityName];
                const highlights = destinationPlaces(destination);
                const duration = zone ? text.timingNote : text.inspirationLabel;
                return (
                  <article
                    key={destination.id}
                    className={`vh-destination-card ${zone ? `vh-card-${zone}` : ""}`}
                  >
                    <div className="vh-card-art" aria-hidden="true">
                      <span className="vh-card-art-ring" />
                      <span className="vh-card-art-icon">
                        {zone ? (
                          <Landmark />
                        ) : destination.id === "alula" ? (
                          <Compass />
                        ) : (
                          <RouteIcon />
                        )}
                      </span>
                      <span className="vh-card-art-code">
                        {destination.city === "Madinah"
                          ? "02"
                          : destination.city === "Makkah"
                            ? "01"
                            : destination.id === "alula"
                              ? "03"
                              : "04"}
                      </span>
                      <span className="vh-card-art-label">{translatedCity(destination.city)}</span>
                      <span className="vh-card-badge">{translatedBadge(destination)}</span>
                    </div>
                    <div className="vh-card-content">
                      <div className="vh-card-meta">
                        <span>{translatedCategory(destination)}</span>
                      </div>
                      <h3>{destination.title[lang]}</h3>
                      <p className="vh-card-description">{destination.description[lang]}</p>
                      <div className="vh-card-highlights">
                        <strong>{text.placesLabel}</strong>
                        <div>
                          {highlights.map((place) => (
                            <span key={place}>{place}</span>
                          ))}
                        </div>
                      </div>
                      <div className="vh-card-bottom">
                        <span className="vh-card-duration">{duration}</span>
                        {zone ? (
                          <Link to={bookingPaths[zone]} className="vh-card-link">
                            {text.bookCity}
                            <ArrowRight aria-hidden="true" />
                          </Link>
                        ) : (
                          <span className="vh-card-static-note">{text.exploreOnly}</span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="vh-empty-results" role="status">
              {text.noCityResults}
            </p>
          )}
        </section>

        <section id="map" className="vh-map-section" aria-labelledby="map-title">
          <div className="vh-map-heading">
            <p className="vh-section-eyebrow">{text.mapEyebrow}</p>
            <h2 id="map-title">{text.mapTitle}</h2>
            <p>{text.mapIntro}</p>
          </div>
          <div className="vh-map-panel">
            <div className="vh-map-controls">
              <div>
                <p className="vh-map-control-label">{text.navCities}</p>
                <div className="vh-zone-switch" role="group" aria-label={text.navCities}>
                  {(["makkah", "madinah"] as const).map((zone) => (
                    <button
                      type="button"
                      key={zone}
                      aria-pressed={mapZone === zone}
                      className={mapZone === zone ? "is-active" : ""}
                      onClick={() => chooseMapCity(zone)}
                    >
                      {zone === "makkah" ? text.cityNames.Makkah : text.cityNames.Madinah}
                    </button>
                  ))}
                </div>
                <p className="vh-map-center">
                  <MapPin aria-hidden="true" />
                  {text.mapCenter} {mapOriginLabel} ·{" "}
                  <span dir="ltr">
                    {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
                  </span>
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="vh-clear-pins"
                onClick={() => setMapDraft({ zone: mapZone, departure: null, destination: null })}
              >
                {text.clearPins}
              </Button>
            </div>
            <MapPicker
              zone={mapZone}
              departure={mapDraft.departure}
              destination={mapDraft.destination}
              activeField={activeField}
              onActiveFieldChange={setActiveField}
              onPick={setMapPin}
              onReset={resetMapPin}
            />
            <p className="vh-map-note">{text.mapPrivacy}</p>
            <p className="vh-map-note">{text.mapFareNotice}</p>
            <Link to={bookingPath} className="vh-button vh-map-continue">
              {text.continueBooking}
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>

        <footer className="vh-footer">
          <div className="vh-footer-brand">
            <span className="vh-brand">
              <span className="vh-brand-icon">
                <Compass aria-hidden="true" />
              </span>
              <span>
                visit hijaz<span className="vh-brand-dot">.</span>
              </span>
            </span>
            <small>{text.footerTagline}</small>
          </div>
          <div className="vh-footer-links">
            <Link to="/offers">{text.navOffers}</Link>
            <a href="/drivers/register">{text.driverPending}</a>
            <Link to="/admin">{text.adminStage}</Link>
            <a href="https://admin.visit-hijaz.com/admin" target="_blank" rel="noreferrer">
              {text.adminPortal}
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
