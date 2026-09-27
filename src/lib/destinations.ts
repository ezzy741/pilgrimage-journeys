import makkah from "@/assets/makkah.jpg";
import madinah from "@/assets/madinah.jpg";
import taif from "@/assets/taif.jpg";
import alula from "@/assets/alula.jpg";
import type { Lang } from "@/lib/i18n";

export type Destination = {
  id: string;
  city: string;
  category: string;
  image: string;
  badge: string;
  rating: string;
  duration: string;
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  tips: Record<Lang, string>;
  highlights: string[];
  bookingPath?: "/ziyarat/makkah" | "/ziyarat/madinah";
};

export const destinations: Destination[] = [
  { id: "makkah", city: "Makkah", category: "Ziyarat", image: makkah, badge: "Popular", rating: "4.9", duration: "Half day", title: { en: "Makkah Ziyarat", ar: "زيارة مكة", ur: "مکہ زیارت" }, description: { en: "Trace the stories of faith, from Jabal al-Nour to the plains of Arafat.", ar: "تتبع قصص الإيمان من جبل النور إلى سهول عرفات.", ur: "جبل النور سے عرفات کے میدانوں تک ایمان کی داستانیں دریافت کریں۔" }, tips: { en: "Start early for cooler weather and bring comfortable walking shoes.", ar: "ابدأ مبكرًا لتجنب الحر واحضر حذاءً مريحًا.", ur: "ٹھنڈے موسم کے لیے جلد شروع کریں اور آرام دہ جوتے ساتھ رکھیں۔" }, highlights: ["Jabal al-Nour", "Mina", "Arafat", "Muzdalifah"], bookingPath: "/ziyarat/makkah" },
  { id: "madinah", city: "Madinah", category: "Ziyarat", image: madinah, badge: "Guided", rating: "4.9", duration: "Half day", title: { en: "Madinah Ziyarat", ar: "زيارة المدينة", ur: "مدینہ زیارت" }, description: { en: "A peaceful journey through Quba, Mount Uhud and the city's sacred landmarks.", ar: "رحلة هادئة إلى قباء وجبل أحد ومعالم المدينة المقدسة.", ur: "قبا، جبل احد اور مدینہ کے مقدس مقامات کا پرسکون سفر۔" }, tips: { en: "Allow time for prayer at Quba Mosque; dress respectfully.", ar: "خصص وقتًا للصلاة في مسجد قباء وارتدِ لباسًا محتشمًا.", ur: "مسجد قبا میں نماز کے لیے وقت رکھیں اور باوقار لباس پہنیں۔" }, highlights: ["Masjid Quba", "Mount Uhud", "Masjid al-Qiblatayn", "Seven Mosques"], bookingPath: "/ziyarat/madinah" },
  { id: "alula", city: "AlUla", category: "Historical Sites", image: alula, badge: "Must visit", rating: "4.8", duration: "Full day", title: { en: "The wonders of AlUla", ar: "عجائب العلا", ur: "العلا کے عجائبات" }, description: { en: "Walk among sculpted sandstone landscapes and the ancient tombs of Hegra.", ar: "تجول بين تضاريس الحجر الرملي ومقابر الحِجر القديمة.", ur: "بلوا پتھر کے مناظر اور حجر کے قدیم مقبروں کی سیر کریں۔" }, tips: { en: "Reserve heritage site admission separately and carry sun protection.", ar: "احجز دخول الموقع الأثري منفصلًا واحمل واقيًا من الشمس.", ur: "تاریخی مقام کا داخلہ الگ سے بک کریں اور دھوپ سے بچاؤ رکھیں۔" }, highlights: ["Hegra", "Elephant Rock", "Old Town", "Dadan"] },
  { id: "taif", city: "Taif", category: "Guided Tours", image: taif, badge: "Nature escape", rating: "4.7", duration: "Full day", title: { en: "Rose gardens of Taif", ar: "حدائق ورد الطائف", ur: "طائف کے گلاب کے باغات" }, description: { en: "Mountain air, rose gardens and a softer side of the Hijaz.", ar: "هواء الجبال وحدائق الورد ووجه لطيف من الحجاز.", ur: "پہاڑی ہوا، گلاب کے باغات اور حجاز کا خوبصورت پہلو۔" }, tips: { en: "Rose season is typically in spring; check local access before traveling.", ar: "موسم الورد عادة في الربيع؛ تحقق من مواعيد الزيارة.", ur: "گلاب کا موسم عموماً بہار میں ہوتا ہے؛ سفر سے پہلے رسائی چیک کریں۔" }, highlights: ["Rose farms", "Al Hada", "Shubra Palace", "Mountain viewpoints"] },
];
