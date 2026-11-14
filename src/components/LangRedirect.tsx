"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { detectBrowserLang, getStoredLang, pathForLang } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

function langFromPath(pathname: string): Lang {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ru";
}

export function LangRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    const current = langFromPath(pathname);
    const stored = getStoredLang();
    const preferred =
      stored ?? detectBrowserLang(navigator.languages ?? [navigator.language]);

    if (preferred === current) {
      return;
    }

    // Honor explicit /en/ links when the user has no saved choice
    if (!stored && current === "en") {
      return;
    }

    window.location.replace(pathForLang(preferred));
  }, [pathname]);

  return null;
}
