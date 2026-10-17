import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar" | "ur";

type Dict = Record<string, string>;

const en: Dict = {
  map_webgl_error:
    "Interactive maps need a WebGL2-capable browser. You can still continue to booking with preset stops or a pickup description.",
  brand: "Visit Hijaz",
  nav_home: "Home",
  nav_offers: "Offers",
  nav_driver: "Driver",
  nav_admin: "Admin",
  hero_title: "Sacred journeys, one tap away",
  hero_sub: "Trusted drivers for Ziyarat tours across Makkah and Madinah.",
  hero_cta: "Book a ride",
  hero_line_1: "SACRED",
  hero_line_2: "JOURNEYS",
  hero_line_3: "REDEFINED",
  hero_kicker: "ZIYARAT TRANSPORT · MAKKAH & MADINAH",
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
  discover_title: "A blessed journey, made simple",
  discover_sub: "Choose a Makkah or Madinah route, or explore current offers.",
  verified_drivers: "Verified drivers",
  availability: "24/7 availability",
  route_origin_label: "Starting point for distance estimates",
  makkah_origin: "Masjid al-Haram",
  madinah_origin: "Masjid an-Nabawi",
  pickup_location: "Pickup location (optional)",
  pickup_placeholder: "Enter a pickup area or landmark",
  distance_note:
    "Distances are approximate one-way road estimates from this origin; selected-stop distances are added. Actual routes may vary. Source:",
  custom_pickup_note:
    "Custom pickup or destination routes need a manual quote. Submit your details and pins below; no automatic custom fare is shown.",
  map_picker_title: "Choose a departure and destination on the map (optional)",
  map_choose_point_type: "Choose which location to pin",
  map_pick_departure: "Set departure pin",
  map_pick_destination: "Set destination pin",
  map_click_instruction: "Choose a pin type, then click the map to place it.",
  map_departure_label: "Departure coordinates",
  map_destination_label: "Destination coordinates",
  map_not_selected: "Not selected",
  map_reset_pin: "Reset pin",
  map_loading: "Loading map…",
  map_load_error: "The map could not be loaded. Please try again later.",
  map_estimate_note:
    "Custom pins do not have a verified route estimate; a manual quote is required. No live routing or fare API is used.",
  manual_quote_required: "Manual quote required",
  booking_details: "Your booking request",
  booking_name: "Full name",
  booking_phone: "Phone / WhatsApp number",
  booking_time: "Requested pickup date and time",
  booking_timezone: "Enter Saudi Arabia time (Asia/Riyadh, UTC+03:00).",
  booking_notes: "Notes (optional; no payment or identity-document details)",
  booking_bad_promo:
    "This promo is expired or not valid for this city. Combo offers require a separate multi-city quote.",
  booking_required: "Select a visiting stop or custom destination and consent to booking contact.",
  booking_bad_date: "Choose a future pickup time within the next year (Saudi Arabia time).",
  booking_invalid:
    "Some booking details are invalid. Check your name, phone, pickup time and route.",
  booking_rate_limit: "Too many requests. Please wait before retrying.",
  booking_save_error:
    "We could not confirm saving. Retry with the same details to avoid a duplicate, or contact the business.",
  booking_saved: "Booking request saved",
  booking_reference: "Your reference:",
  booking_pending: "Pending business review",
  booking_estimate: "Estimated fare",
  booking_not_confirmed:
    "This is a saved request, not a confirmed ride. The business must confirm availability and final fare. No driver is assigned and no payment is taken.",
  booking_new: "Start a new request",
  booking_estimate_note:
    "An estimate only, based on the listed stop distances. The server recalculates it; final pricing requires business confirmation.",
  booking_consent:
    "I agree that Visit Hijaz may store my name, phone, trip details and selected coordinates to handle this request and contact me about it.",
  booking_saving: "Saving request…",
  booking_quote_submit: "Save quote request",
  booking_submit: "Send booking request",
};

const ar: Dict = {
  map_webgl_error:
    "تحتاج الخريطة التفاعلية إلى متصفح يدعم WebGL2. يمكنك متابعة الحجز باختيار المحطات المحددة أو كتابة وصف لموقع الانطلاق.",
  brand: "رحلة الزيارة",
  nav_home: "الرئيسية",
  nav_offers: "العروض",
  nav_driver: "السائق",
  nav_admin: "الإدارة",
  hero_title: "رحلات مباركة بضغطة واحدة",
  hero_sub: "سائقون موثوقون لجولات الزيارة في مكة والمدينة.",
  hero_cta: "احجز رحلة",
  hero_line_1: "رحلات",
  hero_line_2: "روحانية",
  hero_line_3: "بكل سهولة",
  hero_kicker: "رحلات الزيارة · مكة والمدينة",
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
  discover_title: "رحلة مباركة تبدأ بسهولة",
  discover_sub: "اختر مسار مكة أو المدينة، أو اكتشف العروض الحالية.",
  verified_drivers: "سائقون موثوقون",
  availability: "متاحون على مدار الساعة",
  route_origin_label: "نقطة البداية لتقدير المسافة",
  makkah_origin: "المسجد الحرام",
  madinah_origin: "المسجد النبوي",
  pickup_location: "موقع الاستلام (اختياري)",
  pickup_placeholder: "أدخل الحي أو معلم الاستلام",
  distance_note:
    "المسافات تقديرية باتجاه واحد من نقطة البداية هذه؛ تُجمع مسافات المحطات المختارة لتقدير السعر. قد تختلف الطرق الفعلية. المصدر:",
  custom_pickup_note:
    "المواقع المخصصة تحتاج عرض سعر يدوي. أرسل بياناتك ونقاط الخريطة؛ لن يظهر سعر تلقائي.",
  map_picker_title: "اختر نقطة الانطلاق والوجهة على الخريطة (اختياري)",
  map_choose_point_type: "اختر الموقع المراد تحديده",
  map_pick_departure: "تحديد نقطة الانطلاق",
  map_pick_destination: "تحديد الوجهة",
  map_click_instruction: "اختر نوع النقطة، ثم انقر على الخريطة لوضعها.",
  map_departure_label: "إحداثيات الانطلاق",
  map_destination_label: "إحداثيات الوجهة",
  map_not_selected: "لم يتم الاختيار",
  map_reset_pin: "إعادة ضبط الموقع",
  map_loading: "جارٍ تحميل الخريطة…",
  map_load_error: "تعذر تحميل الخريطة. يُرجى المحاولة لاحقًا.",
  map_estimate_note:
    "لا يتوفر تقدير موثّق للمسارات المخصصة المحددة؛ يلزم عرض سعر يدوي. لا نستخدم مسارات أو أسعارًا مباشرة.",
  manual_quote_required: "يلزم عرض سعر يدوي",
  booking_details: "طلب الحجز",
  booking_name: "الاسم الكامل",
  booking_phone: "رقم الهاتف / واتساب",
  booking_time: "تاريخ ووقت الاستلام المطلوب",
  booking_timezone: "أدخل توقيت السعودية (الرياض، UTC+03:00).",
  booking_notes: "ملاحظات (اختياري؛ دون بيانات دفع أو وثائق هوية)",
  booking_bad_promo: "الكود منتهي أو غير صالح لهذه المدينة. العرض المشترك يحتاج عرض سعر منفصل.",
  booking_required: "اختر محطة أو وجهة مخصصة ووافق على التواصل بشأن الطلب.",
  booking_bad_date: "اختر وقت استلام مستقبلي خلال سنة بتوقيت السعودية.",
  booking_invalid: "بعض البيانات غير صالحة. تحقق من الاسم والهاتف والوقت والمسار.",
  booking_rate_limit: "طلبات كثيرة. يرجى الانتظار قبل المحاولة مجددًا.",
  booking_save_error:
    "لم نتمكن من التحقق من الحفظ. أعد المحاولة بنفس البيانات لتجنب التكرار أو تواصل مع الشركة.",
  booking_saved: "تم حفظ طلب الحجز",
  booking_reference: "رقم المرجع:",
  booking_pending: "بانتظار مراجعة الشركة",
  booking_estimate: "السعر التقديري",
  booking_not_confirmed:
    "هذا طلب محفوظ وليس رحلة مؤكدة. يجب أن تؤكد الشركة التوفر والسعر النهائي. لم يُعيّن سائق ولم تُحصّل دفعة.",
  booking_new: "بدء طلب جديد",
  booking_estimate_note:
    "تقدير بناءً على مسافات المحطات. يعيد الخادم حسابه؛ السعر النهائي يحتاج تأكيد الشركة.",
  booking_consent:
    "أوافق على حفظ Visit Hijaz لاسمي ورقمي وتفاصيل الرحلة والإحداثيات لمعالجة هذا الطلب والتواصل معي بشأنه.",
  booking_saving: "جارٍ حفظ الطلب…",
  booking_quote_submit: "حفظ طلب عرض سعر",
  booking_submit: "إرسال طلب الحجز",
};

const ur: Dict = {
  map_webgl_error:
    "انٹرایکٹو نقشے کے لیے WebGL2 والا براؤزر درکار ہے۔ آپ مقررہ مقامات یا پک اپ کی تفصیل کے ساتھ بکنگ جاری رکھ سکتے ہیں۔",
  brand: "زیارت رائیڈ",
  nav_home: "ہوم",
  nav_offers: "آفرز",
  nav_driver: "ڈرائیور",
  nav_admin: "ایڈمن",
  hero_title: "مقدس سفر، ایک کلک پر",
  hero_sub: "مکہ اور مدینہ میں زیارت کے لیے قابلِ اعتماد ڈرائیور۔",
  hero_cta: "سواری بک کریں",
  hero_line_1: "مقدس",
  hero_line_2: "سفر",
  hero_line_3: "آسانی سے",
  hero_kicker: "زیارت ٹرانسپورٹ · مکہ و مدینہ",
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
  discover_title: "مبارک سفر، آسان انداز میں",
  discover_sub: "مکہ یا مدینہ کا سفر منتخب کریں یا موجودہ آفرز دیکھیں۔",
  verified_drivers: "تصدیق شدہ ڈرائیور",
  availability: "24/7 دستیاب",
  route_origin_label: "فاصلے کے تخمینے کا نقطۂ آغاز",
  makkah_origin: "مسجد الحرام",
  madinah_origin: "مسجد نبوی",
  pickup_location: "پک اَپ کا مقام (اختیاری)",
  pickup_placeholder: "پک اَپ کا علاقہ یا نمایاں جگہ درج کریں",
  distance_note:
    "فاصلے اس نقطۂ آغاز سے یک طرفہ سڑک کے اندازے ہیں؛ منتخب مقامات کے فاصلے تخمینے میں جمع کیے جاتے ہیں۔ اصل راستہ مختلف ہو سکتا ہے۔ ماخذ:",
  custom_pickup_note:
    "حسبِ ضرورت پک اَپ یا منزل کے لیے دستی کرایہ درکار ہے۔ تفصیلات اور نقشے کے نقاط بھیجیں؛ خودکار کرایہ نہیں دکھایا جائے گا۔",
  map_picker_title: "نقشے پر روانگی اور منزل منتخب کریں (اختیاری)",
  map_choose_point_type: "منتخب کریں کہ کون سا مقام نشان زد کرنا ہے",
  map_pick_departure: "روانگی کا پن منتخب کریں",
  map_pick_destination: "منزل کا پن منتخب کریں",
  map_click_instruction: "نقطے کی قسم منتخب کریں، پھر نقشے پر کلک کر کے نشان لگائیں۔",
  map_departure_label: "روانگی کے نقاط",
  map_destination_label: "منزل کے نقاط",
  map_not_selected: "منتخب نہیں",
  map_reset_pin: "پن دوبارہ مقرر کریں",
  map_loading: "نقشہ لوڈ ہو رہا ہے…",
  map_load_error: "نقشہ لوڈ نہیں ہو سکا۔ براہِ کرم بعد میں دوبارہ کوشش کریں۔",
  map_estimate_note:
    "نقشے پر حسبِ ضرورت مقامات کے لیے تصدیق شدہ راستے کا تخمینہ موجود نہیں؛ دستی کرایہ درکار ہے۔ یہاں براہِ راست روٹنگ یا کرایے کی API استعمال نہیں ہوتی۔",
  manual_quote_required: "دستی کرایہ درکار ہے",
  booking_details: "آپ کی بکنگ کی درخواست",
  booking_name: "پورا نام",
  booking_phone: "فون / واٹس ایپ نمبر",
  booking_time: "مطلوبہ پک اَپ تاریخ اور وقت",
  booking_timezone: "سعودی عرب کا وقت درج کریں (ریاض، UTC+03:00)۔",
  booking_notes: "نوٹس (اختیاری؛ ادائیگی یا شناختی دستاویزات کی تفصیل نہ دیں)",
  booking_bad_promo:
    "یہ کوڈ ختم ہو چکا ہے یا اس شہر کے لیے درست نہیں۔ مشترکہ سفر کے لیے الگ کوٹیشن درکار ہے۔",
  booking_required: "ایک مقام یا حسبِ ضرورت منزل منتخب کریں اور رابطے کی رضامندی دیں۔",
  booking_bad_date: "اگلے ایک سال کے اندر مستقبل کا وقت منتخب کریں (سعودی وقت)۔",
  booking_invalid: "کچھ تفصیلات درست نہیں۔ نام، فون، وقت اور راستہ چیک کریں۔",
  booking_rate_limit: "بہت زیادہ درخواستیں۔ دوبارہ کوشش سے پہلے انتظار کریں۔",
  booking_save_error:
    "محفوظ ہونے کی تصدیق نہیں ہو سکی۔ نقل سے بچنے کے لیے انہی تفصیلات سے دوبارہ کوشش کریں یا کاروبار سے رابطہ کریں۔",
  booking_saved: "بکنگ کی درخواست محفوظ ہو گئی",
  booking_reference: "آپ کا حوالہ نمبر:",
  booking_pending: "کاروبار کے جائزے کا انتظار",
  booking_estimate: "تخمینی کرایہ",
  booking_not_confirmed:
    "یہ محفوظ درخواست ہے، تصدیق شدہ سواری نہیں۔ کاروبار دستیابی اور حتمی کرایہ کی تصدیق کرے گا۔ ڈرائیور مقرر نہیں ہوا اور ادائیگی نہیں لی گئی۔",
  booking_new: "نئی درخواست شروع کریں",
  booking_estimate_note:
    "یہ درج شدہ مقامات کے فاصلے پر تخمینہ ہے۔ سرور دوبارہ حساب کرتا ہے؛ حتمی قیمت کاروبار کی تصدیق سے ہوگی۔",
  booking_consent:
    "میں Visit Hijaz کو اس درخواست کے لیے اپنا نام، فون، سفر کی تفصیلات اور منتخب نقاط محفوظ کرنے اور مجھ سے رابطے کی اجازت دیتا ہوں۔",
  booking_saving: "درخواست محفوظ ہو رہی ہے…",
  booking_quote_submit: "کوٹیشن کی درخواست محفوظ کریں",
  booking_submit: "بکنگ کی درخواست بھیجیں",
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
