import { createFileRoute } from "@tanstack/react-router";
import { ZiyaratBooking } from "@/components/ZiyaratBooking";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/ziyarat/madinah")({
  head: () => ({
    meta: [
      { title: "Madinah Ziyarat Rides — Quba, Uhud, Qiblatayn" },
      {
        name: "description",
        content:
          "Book a Madinah Ziyarat tour with sedan, SUV or HiAce. Transparent fares from 120 SAR with verified drivers.",
      },
      { property: "og:title", content: "Madinah Ziyarat Rides" },
      {
        property: "og:description",
        content: "Ziyarat tours across Madinah landmarks with instant fare calculation.",
      },
    ],
  }),
  component: MadinahPage,
});

function MadinahPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-primary">{t("madinah_title")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t("madinah_sub")}</p>
      <ZiyaratBooking zone="madinah" />
    </div>
  );
}
