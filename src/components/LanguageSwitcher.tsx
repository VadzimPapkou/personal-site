"use client";

import Link from "next/link";
import { setStoredLang } from "@/lib/i18n";
import type { Lang, Locale } from "@/lib/types";

type Props = {
  lang: Lang;
  t: Locale;
};

export function LanguageSwitcher({ lang, t }: Props) {
  return (
    <nav className="lang-switcher" aria-label="Language">
      <Link
        href="/"
        className={`lang-switcher__link${lang === "ru" ? " is-active" : ""}`}
        hrefLang="ru"
        onClick={() => setStoredLang("ru")}
      >
        {t.languageSwitcher.ru}
      </Link>
      <span className="lang-switcher__sep" aria-hidden="true">
        /
      </span>
      <Link
        href="/en/"
        className={`lang-switcher__link${lang === "en" ? " is-active" : ""}`}
        hrefLang="en"
        onClick={() => setStoredLang("en")}
      >
        {t.languageSwitcher.en}
      </Link>
    </nav>
  );
}
