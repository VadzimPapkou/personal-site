import type { Metadata } from "next";
import { ResumePage } from "@/components/ResumePage";
import { JsonLd } from "@/components/JsonLd";
import { HtmlLang } from "@/components/HtmlLang";
import { getLocale } from "@/lib/i18n";

const lang = "ru" as const;
const t = getLocale(lang);

export const metadata: Metadata = {
  title: t.seo.pageTitle,
  description: t.seo.description,
  keywords: t.seo.keywords,
  authors: [{ name: t.name }],
  alternates: {
    canonical: "/",
    languages: {
      ru: "/",
      en: "/en/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "profile",
    title: t.seo.pageTitle,
    description: t.seo.description,
    locale: "ru_RU",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: t.seo.pageTitle,
    description: t.seo.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
  return (
    <>
      <HtmlLang lang="ru" />
      <JsonLd t={t} />
      <ResumePage lang={lang} t={t} />
    </>
  );
}
