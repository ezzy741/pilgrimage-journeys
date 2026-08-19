import { Link } from "@tanstack/react-router";
import { Languages, MapPinned } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const langs: { id: Lang; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "ar", label: "AR" },
  { id: "ur", label: "UR" },
];

export function Navbar() {
  const { t, lang, setLang } = useI18n();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold text-primary">
          <span className="gradient-holy flex size-8 items-center justify-center rounded-lg text-primary-foreground">
            <MapPinned className="size-4" />
          </span>
          <span className="hidden sm:inline">{t("brand")}</span>
        </Link>

        <div className="ms-auto flex items-center gap-1 text-sm">
          <Link to="/offers" className="rounded-md px-2 py-1.5 hover:bg-secondary">
            {t("nav_offers")}
          </Link>
          <Link to="/driver" className="rounded-md px-2 py-1.5 hover:bg-secondary">
            {t("nav_driver")}
          </Link>
          <Link to="/admin" className="rounded-md px-2 py-1.5 hover:bg-secondary">
            {t("nav_admin")}
          </Link>
        </div>

        <div className="flex items-center rounded-full border border-border bg-card p-0.5">
          <Languages className="mx-1.5 size-3.5 text-muted-foreground" />
          {langs.map((l) => (
            <Button
              key={l.id}
              size="sm"
              variant={lang === l.id ? "default" : "ghost"}
              className="h-7 rounded-full px-2.5 text-xs"
              onClick={() => setLang(l.id)}
            >
              {l.label}
            </Button>
          ))}
        </div>
      </nav>
    </header>
  );
}
