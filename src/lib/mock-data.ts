export type Zone = "makkah" | "madinah";
export type VehicleType = "sedan" | "suv" | "hiace";

export interface FareConfig {
  zone: Zone;
  baseFare: number;
  perKmRate: number;
  surgeMultiplier: number;
}

export interface ZiyaratStop {
  id: string;
  name: string;
  nameAr: string;
  nameUr: string;
  km: number;
}

export interface Vehicle {
  id: VehicleType;
  label: string;
  seats: number;
  multiplier: number;
}

export interface Promotion {
  id: string;
  code: string;
  discountPercentage: number;
  targetCard: "makkah" | "madinah" | "combo";
  bannerText: string;
  expiresAt: string;
  active: boolean;
}

export const fareConfigs: FareConfig[] = [
  { zone: "makkah", baseFare: 150, perKmRate: 3.5, surgeMultiplier: 1.2 },
  { zone: "madinah", baseFare: 120, perKmRate: 3, surgeMultiplier: 1.1 },
];

export const stops: Record<Zone, ZiyaratStop[]> = {
  makkah: [
    { id: "nour", name: "Jabal al-Nour", nameAr: "جبل النور", nameUr: "جبل النور", km: 8 },
    { id: "thawr", name: "Jabal Thawr", nameAr: "جبل ثور", nameUr: "جبل ثور", km: 9 },
    { id: "mina", name: "Mina", nameAr: "منى", nameUr: "منیٰ", km: 7 },
    { id: "arafat", name: "Arafat", nameAr: "عرفات", nameUr: "عرفات", km: 20 },
    { id: "muzdalifah", name: "Muzdalifah", nameAr: "مزدلفة", nameUr: "مزدلفہ", km: 12 },
  ],
  madinah: [
    { id: "quba", name: "Masjid Quba", nameAr: "مسجد قباء", nameUr: "مسجد قبا", km: 5 },
    { id: "uhud", name: "Mount Uhud", nameAr: "جبل أحد", nameUr: "جبل احد", km: 6 },
    {
      id: "qiblatayn",
      name: "Masjid al-Qiblatayn",
      nameAr: "مسجد القبلتين",
      nameUr: "مسجد قبلتین",
      km: 7,
    },
    { id: "seven", name: "Seven Mosques", nameAr: "المساجد السبعة", nameUr: "سات مساجد", km: 6 },
  ],
};

export const vehicles: Vehicle[] = [
  { id: "sedan", label: "Sedan", seats: 4, multiplier: 1 },
  { id: "suv", label: "SUV / GMC", seats: 7, multiplier: 1.45 },
  { id: "hiace", label: "HiAce Minibus", seats: 12, multiplier: 1.8 },
];

export const promotions: Promotion[] = [
  {
    id: "p1",
    code: "ZIYARAT20",
    discountPercentage: 20,
    targetCard: "combo",
    bannerText: "Makkah + Madinah Combo — Save 20%",
    expiresAt: "2026-12-31",
    active: true,
  },
  {
    id: "p2",
    code: "MAKKAH10",
    discountPercentage: 10,
    targetCard: "makkah",
    bannerText: "Makkah Ziyarat — Save 10%",
    expiresAt: "2026-10-01",
    active: true,
  },
  {
    id: "p3",
    code: "MADINAH15",
    discountPercentage: 15,
    targetCard: "madinah",
    bannerText: "Madinah Ziyarat — Save 15%",
    expiresAt: "2026-09-15",
    active: true,
  },
];

export const ADMIN_COMMISSION_RATE = 0.18;

export interface RideRecord {
  id: string;
  passenger: string;
  zone: Zone;
  vehicle: VehicleType;
  pickup: string;
  dropoff: string;
  fare: number;
  status: "completed" | "ongoing" | "cancelled";
  date: string;
}

export const rides: RideRecord[] = [
  {
    id: "R-1041",
    passenger: "Ahmed Y.",
    zone: "makkah",
    vehicle: "suv",
    pickup: "Ajyad Hotel",
    dropoff: "Arafat",
    fare: 342,
    status: "completed",
    date: "2026-08-18",
  },
  {
    id: "R-1042",
    passenger: "Fatima S.",
    zone: "madinah",
    vehicle: "sedan",
    pickup: "Al Haram Gate 21",
    dropoff: "Masjid Quba",
    fare: 168,
    status: "completed",
    date: "2026-08-18",
  },
  {
    id: "R-1043",
    passenger: "Bilal K.",
    zone: "makkah",
    vehicle: "hiace",
    pickup: "Aziziyah",
    dropoff: "Mina",
    fare: 470,
    status: "ongoing",
    date: "2026-08-19",
  },
  {
    id: "R-1044",
    passenger: "Nadia R.",
    zone: "madinah",
    vehicle: "suv",
    pickup: "Anwar Al Madinah",
    dropoff: "Mount Uhud",
    fare: 254,
    status: "completed",
    date: "2026-08-19",
  },
  {
    id: "R-1045",
    passenger: "Omar T.",
    zone: "makkah",
    vehicle: "sedan",
    pickup: "Kudai",
    dropoff: "Jabal al-Nour",
    fare: 186,
    status: "cancelled",
    date: "2026-08-19",
  },
];

export const paymentGateways = [
  { id: "rajhi", name: "Al Rajhi Bank", region: "KSA", active: true },
  { id: "mada", name: "Mada", region: "KSA", active: true },
  { id: "stcpay", name: "STC Pay", region: "KSA", active: false },
  { id: "jazzcash", name: "JazzCash", region: "Pakistan", active: true },
  { id: "easypaisa", name: "EasyPaisa", region: "Pakistan", active: false },
  { id: "1link", name: "1Link", region: "Pakistan", active: false },
  { id: "paypal", name: "PayPal", region: "Global", active: true },
  { id: "stripe", name: "Stripe", region: "Global", active: true },
];

export function calcFare(opts: {
  config: FareConfig;
  km: number;
  vehicleMultiplier: number;
  surgeOn: boolean;
  discountPct: number;
}) {
  const base = opts.config.baseFare * opts.vehicleMultiplier;
  const distance = opts.km * opts.config.perKmRate * opts.vehicleMultiplier;
  const subtotal = base + distance;
  const surge = opts.surgeOn ? subtotal * (opts.config.surgeMultiplier - 1) : 0;
  const beforeDiscount = subtotal + surge;
  const discount = (beforeDiscount * opts.discountPct) / 100;
  return {
    base: Math.round(base),
    distance: Math.round(distance),
    surge: Math.round(surge),
    discount: Math.round(discount),
    total: Math.max(0, Math.round(beforeDiscount - discount)),
  };
}
