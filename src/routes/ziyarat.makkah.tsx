import { createFileRoute } from "@tanstack/react-router";
import { ZiyaratBooking } from "@/components/ZiyaratBooking";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/ziyarat/makkah")({
  head: () => ({
    meta: [
      { title: "Makkah Ziyarat Rides — Jabal al-Nour, Mina, Arafat" },
      {
        name: "description",
        content:
          "Book a Makkah Ziyarat tour with sedan, SUV or HiAce. Transparent fares from 150 SAR with verified drivers.",
      },
      { property: "og:title", content: "Makkah Ziyarat Rides" },
      {
        property: "og:description",
        content: "Ziyarat tours across Makkah landmarks with instant fare calculation.",
      },
    ],
  }),
  component: MakkahPage,
});

function MakkahPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-primary">{t("makkah_title")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t("makkah_sub")}</p>
      <ZiyaratBooking zone="makkah" />
    </div>
  );
}
