import en from "@/data/en.json";
import ru from "@/data/ru.json";
import type { Lang, Locale } from "@/lib/types";

export const locales: Record<Lang, Locale> = {
  ru: ru as Locale,
  en: en as Locale,
};

export const defaultLang: Lang = "ru";

export const langStorageKey = "preferred-lang";

export function getLocale(lang: Lang): Locale {
  return locales[lang];
}

export function isLang(value: string): value is Lang {
  return value === "ru" || value === "en";
}

export function pathForLang(lang: Lang): string {
  return lang === "en" ? "/en/" : "/";
}

export function detectBrowserLang(languages: readonly string[] = []): Lang {
  for (const raw of languages) {
    const code = raw.toLowerCase().split("-")[0];
    if (isLang(code)) {
      return code;
    }
  }
  return defaultLang;
}

export function getStoredLang(): Lang | null {
  try {
    const value = localStorage.getItem(langStorageKey);
    return value && isLang(value) ? value : null;
  } catch {
    return null;
  }
}

export function setStoredLang(lang: Lang): void {
  try {
    localStorage.setItem(langStorageKey, lang);
  } catch {
    // ignore quota / private mode
  }
}
