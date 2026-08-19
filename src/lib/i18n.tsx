import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar" | "ur";

type Dict = Record<string, string>;

const en: Dict = {
  brand: "Ziyarat Ride",
  nav_home: "Home",
  nav_offers: "Offers",
  nav_driver: "Driver",
  nav_admin: "Admin",
  hero_title: "Sacred journeys, one tap away",
  hero_sub: "Trusted drivers for Ziyarat tours across Makkah and Madinah.",
  hero_cta: "Book a ride",
  from: "From",
  makkah_title: "Makkah Ziyarat",
  makkah_sub: "Jabal al-Nour, Mina, Arafat and more",
  madinah_title: "Madinah Ziyarat",
  madinah_sub: "Masjid Quba, Uhud, Qiblatayn and more",
  offers_title: "Special Ziyarat Offers",
  offers_sub: "Combo packages and seasonal discounts",
  select_places: "Select places to visit",
  vehicle: "Vehicle type",
  promo: "Promo code",
  apply: "Apply",
  base_fare: "Base fare",
  distance_cost: "Distance",
  surge: "Peak surge",
  discount: "Discount",
  total: "Total fare",
  confirm: "Confirm booking",
  otp_title: "Share this OTP with your driver",
  searching: "Finding a nearby driver...",
  driver_assigned: "Driver assigned",
  online: "Online",
  offline: "Offline",
  earnings: "Earnings",
  currency: "SAR",
};

const ar: Dict = {
  brand: "رحلة الزيارة",
  nav_home: "الرئيسية",
  nav_offers: "العروض",
  nav_driver: "السائق",
  nav_admin: "الإدارة",
  hero_title: "رحلات مباركة بضغطة واحدة",
  hero_sub: "سائقون موثوقون لجولات الزيارة في مكة والمدينة.",
  hero_cta: "احجز رحلة",
  from: "تبدأ من",
  makkah_title: "زيارة مكة",
  makkah_sub: "جبل النور، منى، عرفات وغيرها",
  madinah_title: "زيارة المدينة",
  madinah_sub: "مسجد قباء، أحد، القبلتين وغيرها",
  offers_title: "عروض الزيارة الخاصة",
  offers_sub: "باقات مشتركة وخصومات موسمية",
  select_places: "اختر الأماكن",
  vehicle: "نوع المركبة",
  promo: "كود الخصم",
  apply: "تطبيق",
  base_fare: "الأجرة الأساسية",
  distance_cost: "المسافة",
  surge: "زيادة الذروة",
  discount: "الخصم",
  total: "الإجمالي",
  confirm: "تأكيد الحجز",
  otp_title: "شارك رمز التحقق مع السائق",
  searching: "جاري البحث عن سائق قريب...",
  driver_assigned: "تم تعيين السائق",
  online: "متصل",
  offline: "غير متصل",
  earnings: "الأرباح",
  currency: "ريال",
};

const ur: Dict = {
  brand: "زیارت رائیڈ",
  nav_home: "ہوم",
  nav_offers: "آفرز",
  nav_driver: "ڈرائیور",
  nav_admin: "ایڈمن",
  hero_title: "مقدس سفر، ایک کلک پر",
  hero_sub: "مکہ اور مدینہ میں زیارت کے لیے قابلِ اعتماد ڈرائیور۔",
  hero_cta: "سواری بک کریں",
  from: "شروع",
  makkah_title: "مکہ زیارت",
  makkah_sub: "جبل النور، منیٰ، عرفات اور مزید",
  madinah_title: "مدینہ زیارت",
  madinah_sub: "مسجد قبا، احد، قبلتین اور مزید",
  offers_title: "خصوصی زیارت آفرز",
  offers_sub: "کومبو پیکجز اور رعایتیں",
  select_places: "مقامات منتخب کریں",
  vehicle: "گاڑی کی قسم",
  promo: "پرومو کوڈ",
  apply: "لاگو کریں",
  base_fare: "بنیادی کرایہ",
  distance_cost: "فاصلہ",
  surge: "پیک سرچارج",
  discount: "رعایت",
  total: "کل کرایہ",
  confirm: "بکنگ کی تصدیق",
  otp_title: "یہ او ٹی پی ڈرائیور کو دیں",
  searching: "قریبی ڈرائیور تلاش ہو رہا ہے...",
  driver_assigned: "ڈرائیور مقرر ہو گیا",
  online: "آن لائن",
  offline: "آف لائن",
  earnings: "کمائی",
  currency: "ریال",
};

const dicts: Record<Lang, Dict> = { en, ar, ur };

const I18nContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string) => string;
  dir: "ltr" | "rtl";
}>({ lang: "en", setLang: () => {}, t: (k) => k, dir: "ltr" });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const dir = lang === "en" ? "ltr" : "rtl";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const t = (k: string) => dicts[lang][k] ?? dicts.en[k] ?? k;

  return <I18nContext.Provider value={{ lang, setLang, t, dir }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
