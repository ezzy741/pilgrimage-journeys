import { DEFAULT_ORIGIN_POINTS, type MapPoint } from "./map-locations.ts";
import { stops, type Zone } from "./mock-data.ts";

export interface LocalPlace {
  id: string;
  zone: Zone;
  name: string;
  nameAr: string;
  nameUr: string;
  point: MapPoint;
  source: string;
}

// Static landmark reference points, not verified vehicle entrances or road routes.
// No query, customer address or location is sent to any geocoder.
const coordinates: Record<string, [number, number, string]> = {
  nour: [21.45806, 39.86139, "https://en.wikipedia.org/wiki/Jabal_al-Nour"],
  thawr: [21.3775, 39.85083, "https://en.wikipedia.org/wiki/Jabal_Thawr"],
  mina: [21.4152722, 39.8777972, "https://en.wikipedia.org/wiki/Mina,_Saudi_Arabia"],
  muzdalifah: [
    21.388831778,
    39.935996256,
    "https://latitude.to/articles-by-country/sa/saudi-arabia/38144/muzdalifah",
  ],
  arafat: [21.35472, 39.98389, "https://en.wikipedia.org/wiki/Mount_Arafat"],
  "hira-district": [21.4568541, 39.8684542, "https://hiradistrict.com/en/"],
  taneem: [21.4676694, 39.8013397, "https://www.visitsaudi.com/en/makkah"],
  jinn: [21.4334258, 39.8289381, "https://www.visitsaudi.com/en/makkah"],
  quba: [24.43917, 39.61722, "https://en.wikipedia.org/wiki/Quba_Mosque"],
  uhud: [24.51028, 39.61389, "https://en.wikipedia.org/wiki/Mount_Uhud"],
  qiblatayn: [24.4840861, 39.5789083, "https://en.wikipedia.org/wiki/Masjid_al-Qiblatayn"],
  seven: [24.476833, 39.595972, "https://en.wikipedia.org/wiki/The_Seven_Mosques"],
  "al-fash": [
    24.5099944,
    39.6128596,
    "https://www.visitsaudi.com/en/madinah/attractions/masjid-al-fash",
  ],
  "dhu-al-hulayfah": [24.4137659, 39.5428138, "https://www.visitsaudi.com/en/madinah"],
  "omar-mosque": [24.4359338, 39.6513962, "https://www.visitsaudi.com/en/madinah"],
};

export const localPlaces: LocalPlace[] = (["makkah", "madinah"] as const).flatMap((zone) => [
  {
    id: `${zone}-origin`,
    zone,
    name: zone === "makkah" ? "Masjid al-Haram" : "Masjid an-Nabawi",
    nameAr: zone === "makkah" ? "المسجد الحرام" : "المسجد النبوي",
    nameUr: zone === "makkah" ? "مسجد الحرام" : "مسجد نبوی",
    point: DEFAULT_ORIGIN_POINTS[zone],
    source: `https://www.visitsaudi.com/en/${zone}`,
  },
  ...stops[zone].flatMap((stop) => {
    const entry = coordinates[stop.id];
    return entry
      ? [{ ...stop, zone, point: { lat: entry[0], lng: entry[1] }, source: entry[2] }]
      : [];
  }),
]);

function normalize(text: string) {
  return text
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0300-\u036f]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/[\s\-_'’]+/g, " ")
    .trim();
}

export function searchLocalPlaces(query: string, zone: Zone): LocalPlace[] {
  const words = normalize(query).split(" ").filter(Boolean);
  return localPlaces
    .filter(
      (place) =>
        place.zone === zone &&
        words.every((word) =>
          normalize(`${place.name} ${place.nameAr} ${place.nameUr} ${place.id}`).includes(word),
        ),
    )
    .slice(0, 8);
}

export function placeAtPoint(point: MapPoint | null, zone: Zone): LocalPlace | undefined {
  return point
    ? localPlaces.find(
        (place) =>
          place.zone === zone && place.point.lat === point.lat && place.point.lng === point.lng,
      )
    : undefined;
}
