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
    <header className="ride-nav sticky top-0 z-50">
      <nav className="ride-nav__inner mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:gap-4 sm:px-6 lg:px-8">
        <Link to="/" className="ride-nav__brand flex shrink-0 items-center gap-2 font-semibold">
          <span className="ride-nav__mark gradient-holy flex size-10 items-center justify-center rounded-xl text-primary-foreground">
            <MapPinned className="size-4" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">{t("brand")}</span>
        </Link>

        <div className="ride-nav__links ms-auto flex items-center gap-0.5 text-sm sm:gap-1">
          <Link to="/offers" className="ride-nav__link rounded-full px-2 py-2 sm:px-3">
            {t("nav_offers")}
          </Link>
          <Link to="/driver" className="ride-nav__link rounded-full px-2 py-2 sm:px-3">
            {t("nav_driver")}
          </Link>
          <Link to="/admin" className="ride-nav__link rounded-full px-2 py-2 sm:px-3">
            {t("nav_admin")}
          </Link>
        </div>

        <div className="ride-language-switch flex shrink-0 items-center rounded-full border p-0.5">
          <Languages className="mx-1.5 size-3.5 text-muted-foreground" aria-hidden="true" />
          {langs.map((language) => (
            <Button
              key={language.id}
              size="sm"
              variant={lang === language.id ? "default" : "ghost"}
              className="h-7 rounded-full px-2 text-xs sm:px-2.5"
              aria-label={`Switch language to ${language.label}`}
              aria-pressed={lang === language.id}
              onClick={() => setLang(language.id)}
            >
              {language.label}
            </Button>
          ))}
        </div>
      </nav>
    </header>
  );
}
