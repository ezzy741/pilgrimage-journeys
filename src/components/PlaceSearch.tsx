import { useEffect, useId, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { MapEndpoint, MapPoint } from "@/lib/map-locations";
import type { Zone } from "@/lib/mock-data";
import { placeAtPoint, searchLocalPlaces, type LocalPlace } from "@/lib/place-search";

const copy = {
  en: {
    departure: "Departure",
    destination: "Destination",
    placeholder: "Search a local landmark…",
    none: "No local match. Pick the precise location on the map below, or describe your pickup on the booking page.",
    hint: "Free local landmark search only—not every hotel or address. Points are approximate landmarks, not verified vehicle entrances. Custom points need a quote.",
    selected: "Selected landmark",
    choose: "Pick on map",
  },
  ar: {
    departure: "الانطلاق",
    destination: "الوجهة",
    placeholder: "ابحث عن معلم محلي…",
    none: "لا توجد نتيجة محلية. حدد الموقع على الخريطة أو صف نقطة الانطلاق في صفحة الحجز.",
    hint: "بحث محلي مجاني عن المعالم فقط، وليس كل الفنادق والعناوين. النقاط تقريبية وليست مداخل مركبات مؤكدة. النقاط المخصصة تحتاج عرض سعر.",
    selected: "المعلم المحدد",
    choose: "حدد على الخريطة",
  },
  ur: {
    departure: "روانگی",
    destination: "منزل",
    placeholder: "مقامی مقام تلاش کریں…",
    none: "مقامی نتیجہ نہیں ملا۔ نیچے نقشے پر مقام چنیں یا بکنگ صفحے پر پک اپ کی تفصیل لکھیں۔",
    hint: "مفت مقامی مقامات کی تلاش، تمام ہوٹل یا پتے نہیں۔ نشان تقریبی ہیں، گاڑی کے مصدقہ داخلی راستے نہیں۔ حسب ضرورت مقامات کے لیے کوٹیشن درکار ہے۔",
    selected: "منتخب مقام",
    choose: "نقشے پر چنیں",
  },
};

export function PlaceSearch({
  zone,
  field,
  point,
  onPick,
  onMap,
}: {
  zone: Zone;
  field: MapEndpoint;
  point: MapPoint | null;
  onPick: (point: MapPoint) => void;
  onMap: () => void;
}) {
  const { lang } = useI18n();
  const text = copy[lang];
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const name = (place: LocalPlace) =>
    lang === "ar" ? place.nameAr : lang === "ur" ? place.nameUr : place.name;
  const selected = placeAtPoint(point, zone);
  useEffect(() => {
    setQuery(
      selected
        ? lang === "ar"
          ? selected.nameAr
          : lang === "ur"
            ? selected.nameUr
            : selected.name
        : "",
    );
    setOpen(false);
    setActive(-1);
  }, [selected, point, zone, lang]);
  const results = searchLocalPlaces(query, zone);
  const choose = (place: LocalPlace) => {
    onPick({ ...place.point });
    setQuery(name(place));
    setOpen(false);
    setActive(-1);
  };
  return (
    <div className="relative min-w-0 space-y-2 rounded-2xl border border-border bg-background/90 p-3 shadow-sm">
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold">
        <MapPin aria-hidden="true" className="size-4 text-primary" />
        {text[field]}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute start-3 top-3 size-4 text-muted-foreground"
        />
        <input
          id={id}
          type="search"
          role="combobox"
          autoComplete="off"
          maxLength={120}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-results`}
          aria-activedescendant={
            open && active >= 0 && results[active] ? `${id}-option-${active}` : undefined
          }
          placeholder={text.placeholder}
          value={query}
          className="h-11 w-full rounded-xl border border-input bg-background ps-9 pe-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActive((value) => Math.min(value + 1, results.length - 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((value) => Math.max(value - 1, 0));
            }
            if (event.key === "Enter") {
              event.preventDefault();
              if (open && active >= 0 && results[active]) choose(results[active]);
            }
          }}
        />
        {open && (
          <div
            id={`${id}-results`}
            role="listbox"
            aria-label={text[field]}
            className="absolute inset-x-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-xl border border-border bg-background p-1 shadow-xl"
          >
            {results.length ? (
              results.map((place, index) => (
                <button
                  id={`${id}-option-${index}`}
                  key={place.id}
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  tabIndex={-1}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(place)}
                  className={`block w-full rounded-lg p-3 text-start text-sm hover:bg-muted ${index === active ? "bg-muted" : ""}`}
                >
                  {name(place)}
                  <small className="block text-muted-foreground">
                    {zone === "makkah" ? "Makkah" : "Madinah"}
                  </small>
                </button>
              ))
            ) : (
              <p className="p-3 text-xs leading-relaxed text-muted-foreground">{text.none}</p>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {selected
            ? `${text.selected}: ${name(selected)}`
            : point
              ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`
              : "—"}
        </span>
        <button
          type="button"
          onClick={onMap}
          className="min-h-9 rounded-lg px-2 text-xs font-semibold text-primary underline underline-offset-4"
        >
          {text.choose}
        </button>
      </div>
    </div>
  );
}

export function PlaceSearchNote() {
  const { lang } = useI18n();
  return <p className="text-xs leading-relaxed text-muted-foreground">{copy[lang].hint}</p>;
}
